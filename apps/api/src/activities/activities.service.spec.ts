import { Test } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
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

const mockActivity = {
  id: 'activity-1',
  serviceOrderId: 'order-1',
  type: 'break_fix' as const,
  status: 'open' as const,
  startTravel: null,
  startWork: null,
  endWork: null,
  travelDistance: 0,
  stopCode: null,
  comments: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockOrder = {
  id: 'order-1',
  assignedToId: 'user-1',
  siteId: 'site-1',
  priority: 'medium' as const,
  status: 'accepted' as const,
  description: null,
  reference: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  activities: [mockActivity],
};

const mockPrisma = {
  activity: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  serviceOrder: {
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  item: {
    findMany: jest.fn(),
  },
  checklistQuestion: {
    findMany: jest.fn(),
  },
  checklistResponse: {
    findMany: jest.fn(),
    upsert: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockEvents = { emit: jest.fn() };

describe('ActivitiesService', () => {
  let service: ActivitiesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventsService, useValue: mockEvents },
      ],
    }).compile();
    service = module.get(ActivitiesService);
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('throws NotFoundException when service order does not exist', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue(null);
      await expect(service.create('order-1', { type: 'break_fix' }, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when order belongs to a different engineer', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue({ ...mockOrder, assignedToId: 'other-user' });
      await expect(service.create('order-1', { type: 'break_fix' }, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('creates an activity with open status', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.activity.create.mockResolvedValue(mockActivity);
      await service.create('order-1', { type: 'break_fix' }, mockUser);
      expect(mockPrisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ serviceOrderId: 'order-1', status: 'open' }) }),
      );
    });
  });

  // ── startTravel ────────────────────────────────────────────────────────────

  describe('startTravel', () => {
    it('throws BadRequestException when activity is not in open status', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue({ ...mockActivity, status: 'travel' });
      await expect(service.startTravel('activity-1', mockUser)).rejects.toThrow(BadRequestException);
    });

    it('updates status to travel and sets startTravel timestamp', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue(mockActivity);
      mockPrisma.activity.update.mockResolvedValue({ ...mockActivity, status: 'travel', startTravel: new Date() });
      await service.startTravel('activity-1', mockUser);
      expect(mockPrisma.activity.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'travel' }) }),
      );
    });

    it('emits travel.started event', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue(mockActivity);
      mockPrisma.activity.update.mockResolvedValue({ ...mockActivity, status: 'travel', startTravel: new Date() });
      await service.startTravel('activity-1', mockUser);
      expect(mockEvents.emit).toHaveBeenCalledWith(
        'travel.started',
        expect.objectContaining({ orderId: 'order-1', activityId: 'activity-1' }),
      );
    });
  });

  // ── startWork ──────────────────────────────────────────────────────────────

  describe('startWork', () => {
    it('throws BadRequestException when activity is not in travel status', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue(mockActivity); // status: 'open'
      await expect(service.startWork('activity-1', { travelDistance: 10 }, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('updates status to work and records travel distance', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue({ ...mockActivity, status: 'travel' });
      mockPrisma.activity.update.mockResolvedValue({ ...mockActivity, status: 'work', travelDistance: 15 });
      mockPrisma.serviceOrder.updateMany.mockResolvedValue({ count: 1 });
      await service.startWork('activity-1', { travelDistance: 15 }, mockUser);
      expect(mockPrisma.activity.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'work', travelDistance: 15 }) }),
      );
    });

    it('emits work.started event', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue({ ...mockActivity, status: 'travel' });
      mockPrisma.activity.update.mockResolvedValue({ ...mockActivity, status: 'work', startWork: new Date() });
      mockPrisma.serviceOrder.updateMany.mockResolvedValue({ count: 1 });
      await service.startWork('activity-1', { travelDistance: 10 }, mockUser);
      expect(mockEvents.emit).toHaveBeenCalledWith(
        'work.started',
        expect.objectContaining({ orderId: 'order-1', activityId: 'activity-1', travelDistance: 10 }),
      );
    });
  });

  // ── stopWork ───────────────────────────────────────────────────────────────

  describe('stopWork', () => {
    it('throws BadRequestException when activity is not in work status', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue(mockActivity); // status: 'open'
      await expect(service.stopWork('activity-1', { stopCode: 'COMP', comments: undefined }, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('allows stop-work when there are no items (no checklist required)', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue({ ...mockActivity, status: 'work' });
      mockPrisma.item.findMany.mockResolvedValue([]);
      mockPrisma.activity.update.mockResolvedValue({ ...mockActivity, status: 'complete', stopCode: 'COMP' });
      await service.stopWork('activity-1', { stopCode: 'COMP', comments: undefined }, mockUser);
      expect(mockPrisma.activity.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'complete', stopCode: 'COMP' }) }),
      );
    });

    it('allows stop-work when items exist but no checklist questions are defined', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue({ ...mockActivity, status: 'work' });
      mockPrisma.item.findMany.mockResolvedValue([{ id: 'item-1', product: { sku: 'PUMP-001' } }]);
      mockPrisma.checklistQuestion.findMany.mockResolvedValue([]);
      mockPrisma.activity.update.mockResolvedValue({ ...mockActivity, status: 'complete' });
      await service.stopWork('activity-1', { stopCode: 'COMP', comments: undefined }, mockUser);
      expect(mockPrisma.activity.update).toHaveBeenCalled();
    });

    it('throws BadRequestException when checklist questions are not all answered', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue({ ...mockActivity, status: 'work' });
      mockPrisma.item.findMany.mockResolvedValue([{ id: 'item-1', product: { sku: 'PUMP-001' } }]);
      mockPrisma.checklistQuestion.findMany.mockResolvedValue([
        { id: 'q-1', question: 'Is the filter clean?' },
        { id: 'q-2', question: 'Is pressure within spec?' },
      ]);
      // Only one of two questions answered
      mockPrisma.checklistResponse.findMany.mockResolvedValue([{ questionId: 'q-1' }]);
      await expect(
        service.stopWork('activity-1', { stopCode: 'COMP', comments: undefined }, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows stop-work when all checklist questions are answered', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue({ ...mockActivity, status: 'work' });
      mockPrisma.item.findMany.mockResolvedValue([{ id: 'item-1', product: { sku: 'PUMP-001' } }]);
      mockPrisma.checklistQuestion.findMany.mockResolvedValue([
        { id: 'q-1', question: 'Is the filter clean?' },
        { id: 'q-2', question: 'Is pressure within spec?' },
      ]);
      mockPrisma.checklistResponse.findMany.mockResolvedValue([
        { questionId: 'q-1' },
        { questionId: 'q-2' },
      ]);
      mockPrisma.activity.update.mockResolvedValue({ ...mockActivity, status: 'complete' });
      await service.stopWork('activity-1', { stopCode: 'COMP', comments: undefined }, mockUser);
      expect(mockPrisma.activity.update).toHaveBeenCalled();
    });

    it('sets comments to null when not provided', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue({ ...mockActivity, status: 'work' });
      mockPrisma.item.findMany.mockResolvedValue([]);
      mockPrisma.activity.update.mockResolvedValue({ ...mockActivity, status: 'complete' });
      await service.stopWork('activity-1', { stopCode: 'COMP', comments: undefined }, mockUser);
      expect(mockPrisma.activity.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ comments: null }) }),
      );
    });
  });

  // ── submitChecklist ────────────────────────────────────────────────────────

  describe('submitChecklist', () => {
    it('throws NotFoundException when activity does not exist', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue(null);
      await expect(
        service.submitChecklist('activity-1', { responses: [{ questionId: 'q-1', answer: 'Yes' }] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('upserts checklist responses in a transaction', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue(mockActivity);
      mockPrisma.$transaction.mockResolvedValue([{}]);
      await service.submitChecklist('activity-1', {
        responses: [{ questionId: 'q-1', answer: 'Yes' }],
      });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});
