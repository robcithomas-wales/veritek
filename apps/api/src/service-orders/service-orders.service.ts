import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import type { User } from '@prisma/client';
import type { RejectServiceOrderDto } from '@veritek/validators';

@Injectable()
export class ServiceOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  async workList(user: User) {
    return this.prisma.serviceOrder.findMany({
      where: {
        assignedToId: user.id,
        status: { in: ['received', 'accepted', 'in_route', 'in_progress'] },
      },
      include: { site: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findById(id: string, userId: string) {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        assignedTo: true,
        site: true,
        activities: { include: { checklistResponses: true } },
        items: { include: { product: true } },
        materials: { include: { product: true, returnProduct: true } },
        attachments: true,
      },
    });
    if (!order) throw new NotFoundException('Service order not found');
    if (order.assignedToId !== userId) {
      throw new NotFoundException('Service order not found');
    }
    return order;
  }

  async accept(id: string, user: User) {
    const order = await this.findById(id, user.id);
    if (order.status !== 'received') {
      throw new BadRequestException('Order is not in received status');
    }
    const updated = await this.prisma.serviceOrder.update({
      where: { id },
      data: { status: 'accepted' },
    });
    this.events.emit('job.accepted', {
      orderId: id,
      engineerId: user.id,
      acceptedAt: new Date().toISOString(),
    });
    return updated;
  }

  async reject(id: string, user: User, dto: RejectServiceOrderDto) {
    const order = await this.findById(id, user.id);
    if (!['received', 'accepted'].includes(order.status)) {
      throw new BadRequestException('Order cannot be rejected in its current status');
    }
    const updated = await this.prisma.serviceOrder.update({
      where: { id },
      data: { status: 'received', assignedToId: user.id },
    });
    this.events.emit('job.rejected', {
      orderId: id,
      engineerId: user.id,
      reason: dto.reason,
    });
    return updated;
  }

  async history(userId: string, query: {
    query?: string;
    status?: string;
    from?: string;
    to?: string;
    page: number;
    pageSize: number;
  }) {
    const where: Record<string, unknown> = {
      assignedToId: userId,
      status: { in: ['completed', 'closed'] },
    };
    if (query.status) where['status'] = query.status;
    if (query.from || query.to) {
      where['createdAt'] = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }
    if (query.query) {
      where['OR'] = [
        { reference: { contains: query.query, mode: 'insensitive' } },
        { description: { contains: query.query, mode: 'insensitive' } },
        { site: { name: { contains: query.query, mode: 'insensitive' } } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.serviceOrder.findMany({
        where,
        include: { site: true },
        orderBy: { updatedAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.serviceOrder.count({ where }),
    ]);
    return { data, total, page: query.page, pageSize: query.pageSize };
  }
}
