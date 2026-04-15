import { Test } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ServiceOrdersService } from './service-orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import type { User } from '@prisma/client';

const mockUser: User = {
  id: 'user-1',
  supabaseId: 'supabase-1',
  email: 'engineer@example.com',
  firstName: 'Test',
  lastName: 'Engineer',
  role: 'engineer',
  warehouseId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockOrder = {
  id: 'order-1',
  assignedToId: 'user-1',
  siteId: 'site-1',
  priority: 50,
  status: 'received' as const,
  description: null,
  reference: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  assignedTo: mockUser,
  site: { id: 'site-1', name: 'Test Site', address: null, postcode: null, createdAt: new Date(), updatedAt: new Date() },
  activities: [],
  items: [],
  materials: [],
  attachments: [],
};

const mockPrisma = {
  serviceOrder: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
};

const mockEvents = { emit: jest.fn() };

describe('ServiceOrdersService', () => {
  let service: ServiceOrdersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ServiceOrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventsService, useValue: mockEvents },
      ],
    }).compile();
    service = module.get(ServiceOrdersService);
  });

  // ── workList ───────────────────────────────────────────────────────────────

  describe('workList', () => {
    it('returns orders for the current user', async () => {
      mockPrisma.serviceOrder.findMany.mockResolvedValue([mockOrder]);
      const result = await service.workList(mockUser);
      expect(result).toEqual([mockOrder]);
      expect(mockPrisma.serviceOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ assignedToId: 'user-1' }) }),
      );
    });
  });

  // ── findById ───────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('throws NotFoundException when order does not exist', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue(null);
      await expect(service.findById('order-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when order is assigned to a different engineer', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue({ ...mockOrder, assignedToId: 'other-user' });
      await expect(service.findById('order-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('returns the order when found and correctly assigned', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue(mockOrder);
      const result = await service.findById('order-1', 'user-1');
      expect(result).toEqual(mockOrder);
    });
  });

  // ── accept ─────────────────────────────────────────────────────────────────

  describe('accept', () => {
    it('throws BadRequestException when order is not in received status', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue({ ...mockOrder, status: 'accepted' });
      await expect(service.accept('order-1', mockUser)).rejects.toThrow(BadRequestException);
    });

    it('updates status to accepted', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.serviceOrder.update.mockResolvedValue({ ...mockOrder, status: 'accepted' });
      await service.accept('order-1', mockUser);
      expect(mockPrisma.serviceOrder.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'accepted' },
      });
    });

    it('emits job.accepted event', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.serviceOrder.update.mockResolvedValue({ ...mockOrder, status: 'accepted' });
      await service.accept('order-1', mockUser);
      expect(mockEvents.emit).toHaveBeenCalledWith(
        'job.accepted',
        expect.objectContaining({ orderId: 'order-1', engineerId: 'user-1' }),
      );
    });
  });

  // ── reject ─────────────────────────────────────────────────────────────────

  describe('reject', () => {
    it('throws BadRequestException when order is in a non-rejectable status', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue({ ...mockOrder, status: 'completed' });
      await expect(service.reject('order-1', mockUser, { reason: 'Unavailable' })).rejects.toThrow(BadRequestException);
    });

    it('allows rejection of a received order', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.serviceOrder.update.mockResolvedValue(mockOrder);
      await service.reject('order-1', mockUser, { reason: 'Unavailable' });
      expect(mockPrisma.serviceOrder.update).toHaveBeenCalled();
    });

    it('allows rejection of an accepted order', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue({ ...mockOrder, status: 'accepted' });
      mockPrisma.serviceOrder.update.mockResolvedValue(mockOrder);
      await service.reject('order-1', mockUser, { reason: 'Unavailable' });
      expect(mockPrisma.serviceOrder.update).toHaveBeenCalled();
    });

    it('emits job.rejected event with reason', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.serviceOrder.update.mockResolvedValue(mockOrder);
      await service.reject('order-1', mockUser, { reason: 'Not available today' });
      expect(mockEvents.emit).toHaveBeenCalledWith(
        'job.rejected',
        expect.objectContaining({ orderId: 'order-1', reason: 'Not available today' }),
      );
    });
  });

  // ── history ────────────────────────────────────────────────────────────────

  describe('history', () => {
    it('returns paginated results', async () => {
      mockPrisma.serviceOrder.findMany.mockResolvedValue([mockOrder]);
      mockPrisma.serviceOrder.count.mockResolvedValue(1);
      const result = await service.history('user-1', { page: 1, pageSize: 20 });
      expect(result).toEqual({ data: [mockOrder], total: 1, page: 1, pageSize: 20 });
    });

    it('applies search query filter', async () => {
      mockPrisma.serviceOrder.findMany.mockResolvedValue([]);
      mockPrisma.serviceOrder.count.mockResolvedValue(0);
      await service.history('user-1', { query: 'boiler', page: 1, pageSize: 20 });
      expect(mockPrisma.serviceOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ OR: expect.any(Array) }) }),
      );
    });
  });
});
