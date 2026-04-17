import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import type { User } from '@prisma/client';

@Injectable()
export class AdminServiceOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  async stats() {
    const slaThreshold = new Date(Date.now() - 4 * 60 * 60 * 1000);
    const openStatuses = ['received', 'accepted', 'in_route', 'in_progress'] as any[];

    const [orders, clockedIn, recentlyCompleted] = await Promise.all([
      this.prisma.serviceOrder.findMany({
        where: { status: { in: openStatuses } },
        select: { status: true, priority: true, createdAt: true },
      }),
      this.prisma.clockEvent.findMany({
        where: {
          type: 'clock_in',
          timestamp: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
        distinct: ['userId'],
      }),
      this.prisma.serviceOrder.findMany({
        where: { status: 'completed' },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: { site: { select: { name: true } }, assignedTo: { select: { firstName: true, lastName: true } } },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0, urgent: 0 };
    let slaAtRisk = 0;

    for (const o of orders) {
      byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
      const label = o.priority < 20 ? 'low' : o.priority < 40 ? 'medium' : o.priority < 60 ? 'high' : o.priority < 80 ? 'critical' : 'urgent';
      byPriority[label] = (byPriority[label] ?? 0) + 1;
      if (o.createdAt < slaThreshold) slaAtRisk++;
    }

    return {
      total: orders.length,
      byStatus,
      byPriority,
      slaAtRisk,
      engineersClockedIn: clockedIn.length,
      recentlyCompleted: recentlyCompleted.map((o) => ({
        id: o.id,
        reference: o.reference,
        siteName: (o.site as any).name,
        engineerName: o.assignedTo ? `${(o.assignedTo as any).firstName} ${(o.assignedTo as any).lastName}` : null,
        status: o.status,
        priority: o.priority,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
      })),
    };
  }

  async list(query: {
    status?: string; priority?: string; engineerId?: string;
    siteId?: string; from?: string; to?: string;
    page?: number; pageSize?: number; search?: string;
  }) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.engineerId) where.assignedToId = query.engineerId;
    if (query.siteId) where.siteId = query.siteId;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }
    if (query.search) {
      where.OR = [
        { reference: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { site: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }
    if (query.priority) {
      const ranges: Record<string, [number, number]> = {
        low: [1, 19], medium: [20, 39], high: [40, 59], critical: [60, 79], urgent: [80, 99],
      };
      const range = ranges[query.priority];
      if (range) where.priority = { gte: range[0], lte: range[1] };
    }

    const [data, total] = await Promise.all([
      this.prisma.serviceOrder.findMany({
        where,
        include: {
          site: { select: { name: true } },
          assignedTo: { select: { firstName: true, lastName: true } },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.serviceOrder.count({ where }),
    ]);

    return {
      data: data.map(this.toSummary),
      total,
      page,
      pageSize,
    };
  }

  async getDetail(id: string) {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        site: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        activities: { include: { checklistResponses: true }, orderBy: { createdAt: 'asc' } },
        materials: { include: { product: true, returnProduct: true } },
        items: { include: { product: true } },
        attachments: true,
      },
    });
    if (!order) throw new NotFoundException('Service order not found');
    return order;
  }

  async create(dto: {
    siteId: string; description: string; priority: number; engineerId?: string; eta?: string;
  }, dispatcher: User) {
    const site = await this.prisma.site.findUnique({ where: { id: dto.siteId } });
    if (!site) throw new NotFoundException('Site not found');

    const year = new Date().getFullYear();
    const count = await this.prisma.serviceOrder.count();
    const reference = `SO-${year}-${String(count + 1).padStart(4, '0')}`;

    const order = await this.prisma.serviceOrder.create({
      data: {
        reference,
        siteId: dto.siteId,
        description: dto.description,
        priority: dto.priority,
        status: dto.engineerId ? 'received' : 'received',
        ...(dto.engineerId ? { assignedToId: dto.engineerId } : {}),
        ...(dto.eta ? { eta: new Date(dto.eta) } : {}),
      },
    });

    if (dto.engineerId) {
      this.events.emit('job.assigned', {
        orderId: order.id,
        userId: dto.engineerId,
        serviceOrderId: order.id,
      });
    }

    return order;
  }

  async assign(id: string, dto: { engineerId: string; eta?: string }) {
    const order = await this.prisma.serviceOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Service order not found');

    const engineer = await this.prisma.user.findUnique({ where: { id: dto.engineerId } });
    if (!engineer) throw new NotFoundException('Engineer not found');

    const updated = await this.prisma.serviceOrder.update({
      where: { id },
      data: {
        assignedToId: dto.engineerId,
        status: order.status === 'received' ? 'received' : order.status,
        ...(dto.eta ? { eta: new Date(dto.eta) } : {}),
      },
      include: {
        site: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    this.events.emit('job.assigned', {
      orderId: id,
      userId: dto.engineerId,
      serviceOrderId: id,
    });

    return updated;
  }

  async setEta(id: string, eta: string) {
    const order = await this.prisma.serviceOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Service order not found');
    return this.prisma.serviceOrder.update({
      where: { id },
      data: { eta: new Date(eta) },
    });
  }

  async close(id: string) {
    const order = await this.prisma.serviceOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Service order not found');
    if (order.status !== 'completed') {
      throw new BadRequestException('Only completed orders can be closed');
    }
    return this.prisma.serviceOrder.update({
      where: { id },
      data: { status: 'closed' },
    });
  }

  private toSummary(o: any) {
    return {
      id: o.id,
      reference: o.reference,
      siteName: o.site?.name ?? '',
      engineerName: o.assignedTo ? `${o.assignedTo.firstName} ${o.assignedTo.lastName}` : null,
      status: o.status,
      priority: o.priority,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    };
  }
}
