import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import type { User } from '@prisma/client';
import type {
  CreateActivityDto,
  StartWorkDto,
  StopWorkDto,
  SubmitChecklistDto,
} from '@veritek/validators';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  private async getActivity(id: string) {
    const activity = await this.prisma.activity.findUnique({ where: { id } });
    if (!activity) throw new NotFoundException('Activity not found');
    return activity;
  }

  async create(serviceOrderId: string, dto: CreateActivityDto, user: User) {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id: serviceOrderId },
    });
    if (!order) throw new NotFoundException('Service order not found');
    if (order.assignedToId !== user.id) {
      throw new NotFoundException('Service order not found');
    }
    return this.prisma.activity.create({
      data: { serviceOrderId, type: dto.type as any, status: 'open' },
    });
  }

  async startTravel(id: string, user: User) {
    const activity = await this.getActivity(id);
    if (activity.status !== 'open') {
      throw new BadRequestException('Activity is not in open status');
    }
    const updated = await this.prisma.activity.update({
      where: { id },
      data: { status: 'travel', startTravel: new Date() },
    });
    this.events.emit('travel.started', {
      orderId: activity.serviceOrderId,
      activityId: id,
      startedAt: updated.startTravel?.toISOString(),
    });
    return updated;
  }

  async startWork(id: string, dto: StartWorkDto, user: User) {
    const activity = await this.getActivity(id);
    if (activity.status !== 'travel') {
      throw new BadRequestException('Activity must be in travel status to start work');
    }
    const updated = await this.prisma.activity.update({
      where: { id },
      data: {
        status: 'work',
        startWork: new Date(),
        travelDistance: dto.travelDistance,
      },
    });
    // Advance service order to in-progress if not already
    await this.prisma.serviceOrder.updateMany({
      where: { id: activity.serviceOrderId, status: 'accepted' },
      data: { status: 'in_progress' },
    });
    this.events.emit('work.started', {
      orderId: activity.serviceOrderId,
      activityId: id,
      startedAt: updated.startWork?.toISOString(),
      travelDistance: dto.travelDistance,
    });
    return updated;
  }

  async stopWork(id: string, dto: StopWorkDto, user: User) {
    const activity = await this.getActivity(id);
    if (activity.status !== 'work') {
      throw new BadRequestException('Activity must be in work status to stop');
    }
    return this.prisma.activity.update({
      where: { id },
      data: {
        status: 'complete',
        endWork: new Date(),
        stopCode: dto.stopCode,
        comments: dto.comments ?? null,
      },
    });
  }

  async complete(serviceOrderId: string, user: User, signedBy: string) {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id: serviceOrderId },
      include: { activities: true },
    });
    if (!order) throw new NotFoundException('Service order not found');
    if (order.assignedToId !== user.id) {
      throw new NotFoundException('Service order not found');
    }
    const hasIncomplete = order.activities.some(
      (a) => a.status !== 'complete',
    );
    if (hasIncomplete) {
      throw new BadRequestException('All activities must be completed before closing the order');
    }
    const updated = await this.prisma.serviceOrder.update({
      where: { id: serviceOrderId },
      data: { status: 'completed' },
    });
    this.events.emit('job.completed', {
      orderId: serviceOrderId,
      engineerId: user.id,
      resolvedAt: new Date().toISOString(),
      signedBy,
    });
    return updated;
  }

  async submitChecklist(activityId: string, dto: SubmitChecklistDto) {
    await this.getActivity(activityId);
    return this.prisma.$transaction(
      dto.responses.map((r) =>
        this.prisma.checklistResponse.upsert({
          where: {
            id: `${activityId}_${r.questionId}`,
          },
          create: {
            activityId,
            questionId: r.questionId,
            answer: r.answer,
          },
          update: { answer: r.answer },
        }),
      ),
    );
  }
}
