import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ClockService } from './clock.service';
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

const timestamp = '2026-04-15T08:00:00.000Z';

const mockClockIn = {
  id: 'event-1',
  userId: 'user-1',
  type: 'clock_in' as const,
  timestamp: new Date(timestamp),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockClockOut = {
  ...mockClockIn,
  id: 'event-2',
  type: 'clock_out' as const,
};

const mockPrisma = {
  clockEvent: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

const mockEvents = { emit: jest.fn() };

describe('ClockService', () => {
  let service: ClockService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ClockService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventsService, useValue: mockEvents },
      ],
    }).compile();
    service = module.get(ClockService);
  });

  // ── record ─────────────────────────────────────────────────────────────────

  describe('record', () => {
    it('throws BadRequestException when clocking in while already clocked in', async () => {
      mockPrisma.clockEvent.findFirst.mockResolvedValue(mockClockIn);
      await expect(service.record({ type: 'clock_in', timestamp }, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when clocking out with no previous event', async () => {
      mockPrisma.clockEvent.findFirst.mockResolvedValue(null);
      await expect(service.record({ type: 'clock_out', timestamp }, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when clocking out while already clocked out', async () => {
      mockPrisma.clockEvent.findFirst.mockResolvedValue(mockClockOut);
      await expect(service.record({ type: 'clock_out', timestamp }, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('creates a clock_in event when not currently clocked in', async () => {
      mockPrisma.clockEvent.findFirst.mockResolvedValue(null);
      mockPrisma.clockEvent.create.mockResolvedValue(mockClockIn);
      await service.record({ type: 'clock_in', timestamp }, mockUser);
      expect(mockPrisma.clockEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'user-1' }) }),
      );
    });

    it('creates a clock_out event when currently clocked in', async () => {
      mockPrisma.clockEvent.findFirst.mockResolvedValue(mockClockIn);
      mockPrisma.clockEvent.create.mockResolvedValue(mockClockOut);
      await service.record({ type: 'clock_out', timestamp }, mockUser);
      expect(mockPrisma.clockEvent.create).toHaveBeenCalled();
    });

    it('emits clock.in event on clock_in', async () => {
      mockPrisma.clockEvent.findFirst.mockResolvedValue(null);
      mockPrisma.clockEvent.create.mockResolvedValue(mockClockIn);
      await service.record({ type: 'clock_in', timestamp }, mockUser);
      expect(mockEvents.emit).toHaveBeenCalledWith(
        'clock.in',
        expect.objectContaining({ userId: 'user-1' }),
      );
    });

    it('emits clock.out event on clock_out', async () => {
      mockPrisma.clockEvent.findFirst.mockResolvedValue(mockClockIn);
      mockPrisma.clockEvent.create.mockResolvedValue(mockClockOut);
      await service.record({ type: 'clock_out', timestamp }, mockUser);
      expect(mockEvents.emit).toHaveBeenCalledWith(
        'clock.out',
        expect.objectContaining({ userId: 'user-1' }),
      );
    });
  });

  // ── today ──────────────────────────────────────────────────────────────────

  describe('today', () => {
    it('returns the most recent clock event', async () => {
      mockPrisma.clockEvent.findFirst.mockResolvedValue(mockClockIn);
      const result = await service.today(mockUser);
      expect(result).toEqual(mockClockIn);
    });

    it('returns null when no events exist', async () => {
      mockPrisma.clockEvent.findFirst.mockResolvedValue(null);
      const result = await service.today(mockUser);
      expect(result).toBeNull();
    });
  });
});
