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
  priority: 50,
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
  checklistResponse: {
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
      await expect(service.create('order-1', { type: 'break-fix' }, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when order belongs to a different engineer', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue({ ...mockOrder, assignedToId: 'other-user' });
      await expect(service.create('order-1', { type: 'break-fix' }, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('creates an activity with open status', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.activity.create.mockResolvedValue(mockActivity);
      await service.create('order-1', { type: 'break-fix' }, mockUser);
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
      await expect(service.stopWork('activity-1', { stopCode: 'FC', comments: undefined }, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('updates status to complete with stopCode', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue({ ...mockActivity, status: 'work' });
      mockPrisma.activity.update.mockResolvedValue({ ...mockActivity, status: 'complete', stopCode: 'FC' });
      await service.stopWork('activity-1', { stopCode: 'FC', comments: undefined }, mockUser);
      expect(mockPrisma.activity.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'complete', stopCode: 'FC' }) }),
      );
    });

    it('sets comments to null when not provided', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue({ ...mockActivity, status: 'work' });
      mockPrisma.activity.update.mockResolvedValue({ ...mockActivity, status: 'complete' });
      await service.stopWork('activity-1', { stopCode: 'FC', comments: undefined }, mockUser);
      expect(mockPrisma.activity.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ comments: null }) }),
      );
    });
  });

  // ── complete ───────────────────────────────────────────────────────────────

  describe('complete', () => {
    it('throws NotFoundException when order does not exist', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue(null);
      await expect(service.complete('order-1', mockUser, 'J. Smith')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when an activity is not complete', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue({
        ...mockOrder,
        activities: [{ ...mockActivity, status: 'work' }],
      });
      await expect(service.complete('order-1', mockUser, 'J. Smith')).rejects.toThrow(BadRequestException);
    });

    it('updates order status to completed when all activities are done', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue({
        ...mockOrder,
        activities: [{ ...mockActivity, status: 'complete' }],
      });
      mockPrisma.serviceOrder.update.mockResolvedValue({ ...mockOrder, status: 'completed' });
      await service.complete('order-1', mockUser, 'J. Smith');
      expect(mockPrisma.serviceOrder.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'completed' },
      });
    });

    it('emits job.completed event with signedBy', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue({
        ...mockOrder,
        activities: [{ ...mockActivity, status: 'complete' }],
      });
      mockPrisma.serviceOrder.update.mockResolvedValue({ ...mockOrder, status: 'completed' });
      await service.complete('order-1', mockUser, 'J. Smith');
      expect(mockEvents.emit).toHaveBeenCalledWith(
        'job.completed',
        expect.objectContaining({ orderId: 'order-1', signedBy: 'J. Smith' }),
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
