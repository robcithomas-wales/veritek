import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import type { User } from '@prisma/client';
import type { ClockEventDto } from '@veritek/validators';

@Injectable()
export class ClockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  async record(dto: ClockEventDto, user: User) {
    // Enforce clock-in / clock-out alternation
    const last = await this.prisma.clockEvent.findFirst({
      where: { userId: user.id },
      orderBy: { timestamp: 'desc' },
    });

    if (dto.type === 'clock-in' && last?.type === 'clock_in') {
      throw new BadRequestException('Already clocked in');
    }
    if (dto.type === 'clock-out' && (!last || last.type === 'clock_out')) {
      throw new BadRequestException('Not currently clocked in');
    }

    const event = await this.prisma.clockEvent.create({
      data: {
        userId: user.id,
        type: dto.type as any,
        timestamp: new Date(dto.timestamp),
      },
    });

    this.events.emit(dto.type === 'clock-in' ? 'clock.in' : 'clock.out', {
      userId: user.id,
      timestamp: dto.timestamp,
    });

    return event;
  }

  async today(user: User) {
    return this.prisma.clockEvent.findFirst({
      where: { userId: user.id },
      orderBy: { timestamp: 'desc' },
    });
  }
}
