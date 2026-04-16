import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrivateActivitiesService } from './private-activities.service';
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
  id: 'pa-1',
  userId: 'user-1',
  type: 'training' as const,
  startTime: new Date('2026-04-15T09:00:00.000Z'),
  endTime: null,
  done: false,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  privateActivity: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const mockEvents = { emit: jest.fn() };

describe('PrivateActivitiesService', () => {
  let service: PrivateActivitiesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        PrivateActivitiesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventsService, useValue: mockEvents },
      ],
    }).compile();
    service = module.get(PrivateActivitiesService);
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a private activity and returns it', async () => {
      mockPrisma.privateActivity.create.mockResolvedValue(mockActivity);
      const result = await service.create(
        { type: 'training', startTime: '2026-04-15T09:00:00.000Z' },
        mockUser,
      );
      expect(result).toEqual(mockActivity);
      expect(mockPrisma.privateActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-1', type: 'training' }),
        }),
      );
    });

    it('emits private-activity.created event', async () => {
      mockPrisma.privateActivity.create.mockResolvedValue(mockActivity);
      await service.create({ type: 'training', startTime: '2026-04-15T09:00:00.000Z' }, mockUser);
      expect(mockEvents.emit).toHaveBeenCalledWith(
        'private-activity.created',
        expect.objectContaining({ userId: 'user-1' }),
      );
    });
  });

  // ── list ───────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns paginated results scoped to the current user', async () => {
      mockPrisma.privateActivity.findMany.mockResolvedValue([mockActivity]);
      mockPrisma.privateActivity.count.mockResolvedValue(1);

      const result = await service.list({ page: 1, pageSize: 20 }, mockUser);

      expect(result.data).toEqual([mockActivity]);
      expect(result.total).toBe(1);
      expect(mockPrisma.privateActivity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: 'user-1' }) }),
      );
    });

    it('applies date filters when from/to provided', async () => {
      mockPrisma.privateActivity.findMany.mockResolvedValue([]);
      mockPrisma.privateActivity.count.mockResolvedValue(0);

      await service.list(
        { from: '2026-04-01T00:00:00Z', to: '2026-04-30T23:59:59Z', page: 1, pageSize: 20 },
        mockUser,
      );

      expect(mockPrisma.privateActivity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startTime: expect.objectContaining({ gte: expect.any(Date) }),
          }),
        }),
      );
    });
  });

  // ── complete ───────────────────────────────────────────────────────────────

  describe('complete', () => {
    it('throws NotFoundException when activity does not exist', async () => {
      mockPrisma.privateActivity.findUnique.mockResolvedValue(null);
      await expect(
        service.complete('pa-99', { endTime: '2026-04-15T17:00:00.000Z' }, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when activity belongs to another user', async () => {
      mockPrisma.privateActivity.findUnique.mockResolvedValue({ ...mockActivity, userId: 'user-2' });
      await expect(
        service.complete('pa-1', { endTime: '2026-04-15T17:00:00.000Z' }, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('marks activity as done and emits event', async () => {
      const completed = { ...mockActivity, done: true, endTime: new Date('2026-04-15T17:00:00.000Z') };
      mockPrisma.privateActivity.findUnique.mockResolvedValue(mockActivity);
      mockPrisma.privateActivity.update.mockResolvedValue(completed);

      const result = await service.complete('pa-1', { endTime: '2026-04-15T17:00:00.000Z' }, mockUser);

      expect(result.done).toBe(true);
      expect(mockEvents.emit).toHaveBeenCalledWith(
        'private-activity.completed',
        expect.objectContaining({ userId: 'user-1', activityId: 'pa-1' }),
      );
    });
  });

  // ── remove ─────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('throws NotFoundException when activity does not exist', async () => {
      mockPrisma.privateActivity.findUnique.mockResolvedValue(null);
      await expect(service.remove('pa-99', mockUser)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when activity belongs to another user', async () => {
      mockPrisma.privateActivity.findUnique.mockResolvedValue({ ...mockActivity, userId: 'user-2' });
      await expect(service.remove('pa-1', mockUser)).rejects.toThrow(ForbiddenException);
    });

    it('deletes the activity and returns success', async () => {
      mockPrisma.privateActivity.findUnique.mockResolvedValue(mockActivity);
      mockPrisma.privateActivity.delete.mockResolvedValue(mockActivity);

      const result = await service.remove('pa-1', mockUser);

      expect(mockPrisma.privateActivity.delete).toHaveBeenCalledWith({ where: { id: 'pa-1' } });
      expect(result).toEqual({ success: true });
    });
  });
});
