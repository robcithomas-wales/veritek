import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class AdminUsersService {
  private readonly supabaseAdmin = createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  constructor(private readonly prisma: PrismaService) {}

  async list(query: { role?: string }) {
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(query.role ? { role: query.role as any } : {}),
      },
      select: {
        id: true, firstName: true, lastName: true, email: true, role: true, warehouseId: true,
        clockEvents: {
          orderBy: { timestamp: 'desc' },
          take: 1,
          select: { type: true, timestamp: true },
        },
        serviceOrders: {
          where: { status: { in: ['accepted', 'in_route', 'in_progress'] } },
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: { id: true, reference: true, site: { select: { name: true } } },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    return users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
      warehouseId: u.warehouseId,
      clockedIn: u.clockEvents[0]?.type === 'clock_in',
      currentOrderId: u.serviceOrders[0]?.id ?? null,
      currentOrderRef: (u.serviceOrders[0] as any)?.reference ?? null,
      currentSiteName: (u.serviceOrders[0] as any)?.site?.name ?? null,
    }));
  }

  async getDetail(id: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        clockEvents: {
          where: { timestamp: { gte: today } },
          orderBy: { timestamp: 'asc' },
        },
        stockItems: {
          include: { product: { select: { name: true, sku: true } } },
        },
        serviceOrders: {
          where: { status: { in: ['received', 'accepted', 'in_route', 'in_progress'] } },
          include: { site: { select: { name: true } } },
          orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      warehouseId: user.warehouseId,
      clockedIn: user.clockEvents.at(-1)?.type === 'clock_in',
      todayClockEvents: user.clockEvents,
      vanStockCount: user.stockItems.length,
      vanStock: user.stockItems,
      activeOrders: user.serviceOrders,
    };
  }

  async create(dto: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    warehouseId?: string;
  }) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('A user with that email already exists');

    const { data, error } = await this.supabaseAdmin.auth.admin.inviteUserByEmail(
      dto.email,
      { data: { firstName: dto.firstName, lastName: dto.lastName } },
    );
    if (error || !data.user) {
      throw new BadRequestException(error?.message ?? 'Failed to send invite');
    }

    return this.prisma.user.create({
      data: {
        supabaseId: data.user.id,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role as any,
        ...(dto.warehouseId ? { warehouseId: dto.warehouseId } : {}),
      },
    });
  }

  async update(id: string, dto: { firstName?: string; lastName?: string; role?: string; warehouseId?: string | null }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const data: Record<string, unknown> = {};
    if (dto.firstName) data['firstName'] = dto.firstName;
    if (dto.lastName) data['lastName'] = dto.lastName;
    if (dto.role) data['role'] = dto.role;
    if ('warehouseId' in dto) data['warehouseId'] = dto.warehouseId ?? null;

    return this.prisma.user.update({ where: { id }, data });
  }

  async deactivate(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.deletedAt) throw new BadRequestException('User already deactivated');

    await this.supabaseAdmin.auth.admin.deleteUser(user.supabaseId).catch(() => {
      // Best-effort — profile is soft-deleted regardless
    });

    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async warehouses() {
    return this.prisma.warehouse.findMany({ orderBy: { name: 'asc' } });
  }
}
