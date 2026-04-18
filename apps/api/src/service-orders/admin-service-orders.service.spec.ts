import { Test } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminServiceOrdersService } from './admin-service-orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import type { User } from '@prisma/client';

const mockDispatcher: User = {
  id: 'dispatcher-1',
  supabaseId: 'supabase-1',
  email: 'dispatch@example.com',
  firstName: 'Dispatch',
  lastName: 'User',
  role: 'dispatcher',
  warehouseId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockSite = { id: 'site-1', name: 'Manchester Depot', address: '1 Depot Rd', postcode: 'M1 1AA' };

const mockOrder = {
  id: 'order-1',
  reference: 'SO-2025-0001',
  siteId: 'site-1',
  assignedToId: 'user-1',
  status: 'received',
  priority: 'high',
  description: 'Fault description',
  eta: null,
  createdAt: new Date('2025-01-01T08:00:00Z'),
  updatedAt: new Date('2025-01-01T09:00:00Z'),
  site: mockSite,
  assignedTo: { id: 'user-1', firstName: 'John', lastName: 'Smith' },
};

const mockPrisma = {
  serviceOrder: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  site: {
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  material: {
    findMany: jest.fn(),
  },
  $queryRaw: jest.fn(),
};

const mockEvents = { emit: jest.fn() };

describe('AdminServiceOrdersService', () => {
  let service: AdminServiceOrdersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AdminServiceOrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventsService, useValue: mockEvents },
      ],
    }).compile();
    service = module.get(AdminServiceOrdersService);
  });

  // ── stats ──────────────────────────────────────────────────────────────────

  describe('stats', () => {
    it('returns total open order count', async () => {
      mockPrisma.serviceOrder.findMany
        .mockResolvedValueOnce([mockOrder, mockOrder]) // open orders
        .mockResolvedValueOnce([]);                   // recently completed
      mockPrisma.$queryRaw.mockResolvedValue([{ count: BigInt(3) }]);
      const result = await service.stats();
      expect(result.total).toBe(2);
    });

    it('counts orders at SLA risk (older than 4 hours)', async () => {
      const old = { ...mockOrder, createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) };
      const recent = { ...mockOrder, id: 'order-2', createdAt: new Date() };
      mockPrisma.serviceOrder.findMany
        .mockResolvedValueOnce([old, recent])
        .mockResolvedValueOnce([]);
      mockPrisma.$queryRaw.mockResolvedValue([{ count: BigInt(0) }]);
      const result = await service.stats();
      expect(result.slaAtRisk).toBe(1);
    });

    it('returns engineers clocked in from raw query', async () => {
      mockPrisma.serviceOrder.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrisma.$queryRaw.mockResolvedValue([{ count: BigInt(4) }]);
      const result = await service.stats();
      expect(result.engineersClockedIn).toBe(4);
    });
  });

  // ── list ───────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns paginated orders with total count', async () => {
      mockPrisma.serviceOrder.findMany.mockResolvedValue([mockOrder]);
      mockPrisma.serviceOrder.count.mockResolvedValue(1);
      const result = await service.list({});
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('applies status filter', async () => {
      mockPrisma.serviceOrder.findMany.mockResolvedValue([]);
      mockPrisma.serviceOrder.count.mockResolvedValue(0);
      await service.list({ status: 'in_progress' });
      const where = mockPrisma.serviceOrder.findMany.mock.calls[0][0].where;
      expect(where.status).toBe('in_progress');
    });

    it('applies engineer filter', async () => {
      mockPrisma.serviceOrder.findMany.mockResolvedValue([]);
      mockPrisma.serviceOrder.count.mockResolvedValue(0);
      await service.list({ engineerId: 'user-1' });
      const where = mockPrisma.serviceOrder.findMany.mock.calls[0][0].where;
      expect(where.assignedToId).toBe('user-1');
    });

    it('applies text search across reference, description, and site name', async () => {
      mockPrisma.serviceOrder.findMany.mockResolvedValue([]);
      mockPrisma.serviceOrder.count.mockResolvedValue(0);
      await service.list({ search: 'Manchester' });
      const where = mockPrisma.serviceOrder.findMany.mock.calls[0][0].where;
      expect(where.OR).toHaveLength(3);
    });
  });

  // ── getDetail ──────────────────────────────────────────────────────────────

  describe('getDetail', () => {
    it('throws NotFoundException when order does not exist', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue(null);
      await expect(service.getDetail('order-1')).rejects.toThrow(NotFoundException);
    });

    it('returns the full order when found', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue({
        ...mockOrder,
        activities: [],
        materials: [],
        items: [],
        attachments: [],
      });
      const result = await service.getDetail('order-1');
      expect(result.reference).toBe('SO-2025-0001');
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('throws NotFoundException when site does not exist', async () => {
      mockPrisma.site.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ siteId: 'site-1', description: 'Test', priority: 'high' }, mockDispatcher),
      ).rejects.toThrow(NotFoundException);
    });

    it('generates a reference number and creates the order', async () => {
      mockPrisma.site.findUnique.mockResolvedValue(mockSite);
      mockPrisma.serviceOrder.count.mockResolvedValue(0);
      mockPrisma.serviceOrder.create.mockResolvedValue(mockOrder);
      await service.create({ siteId: 'site-1', description: 'Test fault', priority: 'high' }, mockDispatcher);
      const createData = mockPrisma.serviceOrder.create.mock.calls[0][0].data;
      expect(createData.reference).toMatch(/^SO-\d{4}-\d{4}$/);
    });

    it('emits job.assigned when an engineer is specified', async () => {
      mockPrisma.site.findUnique.mockResolvedValue(mockSite);
      mockPrisma.serviceOrder.count.mockResolvedValue(0);
      mockPrisma.serviceOrder.create.mockResolvedValue(mockOrder);
      await service.create({ siteId: 'site-1', description: 'Test', priority: 'high', engineerId: 'user-1' }, mockDispatcher);
      expect(mockEvents.emit).toHaveBeenCalledWith(
        'job.assigned',
        expect.objectContaining({ userId: 'user-1' }),
      );
    });

    it('does not emit job.assigned when no engineer is specified', async () => {
      mockPrisma.site.findUnique.mockResolvedValue(mockSite);
      mockPrisma.serviceOrder.count.mockResolvedValue(0);
      mockPrisma.serviceOrder.create.mockResolvedValue(mockOrder);
      await service.create({ siteId: 'site-1', description: 'Test', priority: 'high' }, mockDispatcher);
      expect(mockEvents.emit).not.toHaveBeenCalled();
    });
  });

  // ── assign ─────────────────────────────────────────────────────────────────

  describe('assign', () => {
    it('throws NotFoundException when order does not exist', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue(null);
      await expect(service.assign('order-1', { engineerId: 'user-1' })).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when engineer does not exist', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.assign('order-1', { engineerId: 'user-1' })).rejects.toThrow(NotFoundException);
    });

    it('emits job.assigned event on successful assignment', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrisma.serviceOrder.update.mockResolvedValue(mockOrder);
      await service.assign('order-1', { engineerId: 'user-1' });
      expect(mockEvents.emit).toHaveBeenCalledWith(
        'job.assigned',
        expect.objectContaining({ orderId: 'order-1', userId: 'user-1' }),
      );
    });
  });

  // ── setEta ─────────────────────────────────────────────────────────────────

  describe('setEta', () => {
    it('throws NotFoundException when order does not exist', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue(null);
      await expect(service.setEta('order-1', '2025-06-01T10:00:00Z')).rejects.toThrow(NotFoundException);
    });

    it('updates the ETA field', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.serviceOrder.update.mockResolvedValue(mockOrder);
      await service.setEta('order-1', '2025-06-01T10:00:00Z');
      expect(mockPrisma.serviceOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ eta: new Date('2025-06-01T10:00:00Z') }) }),
      );
    });
  });

  // ── close ──────────────────────────────────────────────────────────────────

  describe('close', () => {
    it('throws NotFoundException when order does not exist', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue(null);
      await expect(service.close('order-1')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when order is not in completed status', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue({ ...mockOrder, status: 'in_progress' });
      await expect(service.close('order-1')).rejects.toThrow(BadRequestException);
    });

    it('sets status to closed when order is completed', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue({ ...mockOrder, status: 'completed' });
      mockPrisma.serviceOrder.update.mockResolvedValue({ ...mockOrder, status: 'closed' });
      await service.close('order-1');
      expect(mockPrisma.serviceOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'closed' } }),
      );
    });
  });

  // ── reports ────────────────────────────────────────────────────────────────

  describe('reports', () => {
    const baseOrder = {
      ...mockOrder,
      status: 'completed',
      site: mockSite,
      assignedTo: { firstName: 'John', lastName: 'Smith' },
      createdAt: new Date('2025-01-01T08:00:00Z'),
      updatedAt: new Date('2025-01-01T10:00:00Z'), // 2h — within SLA
    };

    it('calculates SLA met percentage correctly', async () => {
      const breached = { ...baseOrder, id: 'order-2', updatedAt: new Date(baseOrder.createdAt.getTime() + 5 * 3600_000) };
      mockPrisma.serviceOrder.findMany.mockResolvedValue([baseOrder, breached]);
      mockPrisma.material.findMany.mockResolvedValue([]);
      const result = await service.reports({ period: '30d' });
      expect(result.completed.withinSla).toBe(1);
      expect(result.completed.slaPct).toBe(50);
    });

    it('returns zero SLA percentage when no orders were completed', async () => {
      mockPrisma.serviceOrder.findMany.mockResolvedValue([]);
      mockPrisma.material.findMany.mockResolvedValue([]);
      const result = await service.reports({ period: '7d' });
      expect(result.completed.slaPct).toBe(0);
    });

    it('aggregates parts usage by product', async () => {
      const product = { id: 'prod-1', sku: 'CAP-40', name: 'Capacitor 40µF' };
      mockPrisma.serviceOrder.findMany.mockResolvedValue([]);
      mockPrisma.material.findMany.mockResolvedValue([
        { product, qty: 3 },
        { product, qty: 2 },
      ]);
      const result = await service.reports({ period: '30d' });
      expect(result.partsUsage[0]!.qty).toBe(5);
    });

    it('uses custom from/to dates when provided', async () => {
      mockPrisma.serviceOrder.findMany.mockResolvedValue([]);
      mockPrisma.material.findMany.mockResolvedValue([]);
      await service.reports({ from: '2025-01-01', to: '2025-03-31' });
      const orderWhere = mockPrisma.serviceOrder.findMany.mock.calls[0][0].where;
      expect(orderWhere.updatedAt.gte).toEqual(new Date('2025-01-01'));
    });
  });
});
