import { Test } from '@nestjs/testing';
import { NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ServiceOrdersService } from './service-orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import type { User } from '@prisma/client';

// Suppress Supabase client instantiation in addAttachment tests
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/file.jpg' } }),
      })),
    },
  })),
}));

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
  priority: 'medium' as const,
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

const mockResolution = {
  problemCode: 'MECH',
  causeCode: 'COMP',
  repairCode: 'REPL',
  resolveCode: 'FULL',
  resolveText: 'Replaced faulty component. Unit restored to full operation.',
  fullyResolved: true,
};

const mockPrisma = {
  serviceOrder: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  rejectionCode: {
    findUnique: jest.fn(),
  },
  attachment: {
    create: jest.fn(),
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
      mockPrisma.rejectionCode.findUnique.mockResolvedValue({ code: 'NOAC', description: 'No access' });
      await expect(service.reject('order-1', mockUser, { rejectionCode: 'NOAC' })).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when rejection code does not exist in reference data', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.rejectionCode.findUnique.mockResolvedValue(null);
      await expect(service.reject('order-1', mockUser, { rejectionCode: 'INVALID' })).rejects.toThrow(BadRequestException);
    });

    it('allows rejection of a received order with a valid code', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.rejectionCode.findUnique.mockResolvedValue({ code: 'NOAC', description: 'No access' });
      mockPrisma.serviceOrder.update.mockResolvedValue(mockOrder);
      await service.reject('order-1', mockUser, { rejectionCode: 'NOAC' });
      expect(mockPrisma.serviceOrder.update).toHaveBeenCalled();
    });

    it('allows rejection of an accepted order', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue({ ...mockOrder, status: 'accepted' });
      mockPrisma.rejectionCode.findUnique.mockResolvedValue({ code: 'WRNG', description: 'Wrong engineer' });
      mockPrisma.serviceOrder.update.mockResolvedValue(mockOrder);
      await service.reject('order-1', mockUser, { rejectionCode: 'WRNG' });
      expect(mockPrisma.serviceOrder.update).toHaveBeenCalled();
    });

    it('emits job.rejected event with rejectionCode', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.rejectionCode.findUnique.mockResolvedValue({ code: 'NOAC', description: 'No access' });
      mockPrisma.serviceOrder.update.mockResolvedValue(mockOrder);
      await service.reject('order-1', mockUser, { rejectionCode: 'NOAC' });
      expect(mockEvents.emit).toHaveBeenCalledWith(
        'job.rejected',
        expect.objectContaining({ orderId: 'order-1', rejectionCode: 'NOAC' }),
      );
    });
  });

  // ── complete ───────────────────────────────────────────────────────────────

  describe('complete', () => {
    const completeDto = {
      signedByName: 'Jane Smith',
      signatureData: '<svg>...</svg>',
      resolution: mockResolution,
    };

    it('throws BadRequestException when order is not in_progress', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue({ ...mockOrder, status: 'accepted', activities: [] });
      await expect(service.complete('order-1', 'user-1', completeDto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when an activity is not complete', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue({
        ...mockOrder,
        status: 'in_progress',
        activities: [{ id: 'act-1', status: 'work' }],
      });
      await expect(service.complete('order-1', 'user-1', completeDto)).rejects.toThrow(BadRequestException);
    });

    it('stores signature, signedByName, and resolution on completion', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue({
        ...mockOrder,
        status: 'in_progress',
        activities: [{ id: 'act-1', status: 'complete' }],
      });
      mockPrisma.serviceOrder.update.mockResolvedValue({ ...mockOrder, status: 'completed' });
      await service.complete('order-1', 'user-1', completeDto);
      expect(mockPrisma.serviceOrder.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: expect.objectContaining({
          status: 'completed',
          signedByName: 'Jane Smith',
          signatureData: '<svg>...</svg>',
          resolution: mockResolution,
        }),
      });
    });

    it('emits job.completed event', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue({
        ...mockOrder,
        status: 'in_progress',
        activities: [{ id: 'act-1', status: 'complete' }],
      });
      mockPrisma.serviceOrder.update.mockResolvedValue({ ...mockOrder, status: 'completed' });
      await service.complete('order-1', 'user-1', completeDto);
      expect(mockEvents.emit).toHaveBeenCalledWith(
        'job.completed',
        expect.objectContaining({ orderId: 'order-1', engineerId: 'user-1' }),
      );
    });
  });

  // ── addAttachment ──────────────────────────────────────────────────────────

  describe('addAttachment', () => {
    it('creates an attachment record after uploading to storage', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue({ ...mockOrder, status: 'in_progress' });
      mockPrisma.attachment.create.mockResolvedValue({
        id: 'att-1',
        serviceOrderId: 'order-1',
        url: 'https://cdn.example.com/file.jpg',
        filename: 'photo.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const result = await service.addAttachment('order-1', 'user-1', {
        filename: 'photo.jpg',
        mimeType: 'image/jpeg',
        data: Buffer.from('fake-image-data').toString('base64'),
      });
      expect(mockPrisma.attachment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ serviceOrderId: 'order-1', filename: 'photo.jpg' }),
        }),
      );
      expect(result.filename).toBe('photo.jpg');
    });

    it('throws NotFoundException when service order does not exist', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue(null);
      await expect(
        service.addAttachment('order-1', 'user-1', { filename: 'x.jpg', mimeType: 'image/jpeg', data: 'abc' }),
      ).rejects.toThrow(NotFoundException);
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
