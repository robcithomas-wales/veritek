import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import type { User } from '@prisma/client';
import type {
  CreatePrivateActivityDto,
  CompletePrivateActivityDto,
  ListPrivateActivitiesDto,
} from '@veritek/validators';

@Injectable()
export class PrivateActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  async create(dto: CreatePrivateActivityDto, user: User) {
    const activity = await this.prisma.privateActivity.create({
      data: {
        userId: user.id,
        type: dto.type as any,
        startTime: new Date(dto.startTime),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });

    this.events.emit('private-activity.created', {
      userId: user.id,
      activityId: activity.id,
      type: activity.type,
    });

    return activity;
  }

  async list(query: ListPrivateActivitiesDto, user: User) {
    const { from, to, page, pageSize } = query;
    const where = {
      userId: user.id,
      ...(from || to
        ? {
            startTime: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.privateActivity.findMany({
        where,
        orderBy: { startTime: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.privateActivity.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async complete(id: string, dto: CompletePrivateActivityDto, user: User) {
    const activity = await this.prisma.privateActivity.findUnique({ where: { id } });
    if (!activity) throw new NotFoundException('Private activity not found');
    if (activity.userId !== user.id) throw new ForbiddenException();

    const updated = await this.prisma.privateActivity.update({
      where: { id },
      data: {
        endTime: new Date(dto.endTime),
        done: true,
      },
    });

    this.events.emit('private-activity.completed', {
      userId: user.id,
      activityId: id,
      type: activity.type,
    });

    return updated;
  }

  async remove(id: string, user: User) {
    const activity = await this.prisma.privateActivity.findUnique({ where: { id } });
    if (!activity) throw new NotFoundException('Private activity not found');
    if (activity.userId !== user.id) throw new ForbiddenException();

    await this.prisma.privateActivity.delete({ where: { id } });
    return { success: true };
  }
}
