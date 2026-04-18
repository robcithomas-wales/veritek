import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import type { User } from '@prisma/client';

// Prevent real APNs/FCM initialisation during tests
jest.mock('apn', () => ({
  Provider: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({ failed: [] }),
  })),
  Notification: jest.fn().mockImplementation(() => ({
    expiry: 0, badge: 0, sound: '', alert: {}, topic: '', payload: {},
  })),
}));

jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  credential: { cert: jest.fn() },
  messaging: jest.fn().mockReturnValue({ send: jest.fn().mockResolvedValue('msg-id') }),
}));

const mockUser: User = {
  id: 'user-1',
  supabaseId: 'supabase-1',
  email: 'engineer@example.com',
  firstName: 'John',
  lastName: 'Smith',
  role: 'engineer',
  warehouseId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockPrisma = {
  deviceToken: {
    upsert: jest.fn(),
    findMany: jest.fn(),
  },
};

const mockConfig = {
  get: jest.fn().mockReturnValue(null), // disable APNS/FCM by default
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();
    service = module.get(NotificationsService);
    // Simulate onModuleInit without real credentials
    service['apnProvider'] = null;
    service['fcmReady'] = false;
  });

  // ── registerToken ──────────────────────────────────────────────────────────

  describe('registerToken', () => {
    it('upserts the device token associated with the user', async () => {
      mockPrisma.deviceToken.upsert.mockResolvedValue({});
      const result = await service.registerToken({ token: 'device-token-abc', platform: 'ios' }, mockUser);
      expect(mockPrisma.deviceToken.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { token: 'device-token-abc' },
          create: expect.objectContaining({ userId: 'user-1', platform: 'ios' }),
          update: expect.objectContaining({ userId: 'user-1', platform: 'ios' }),
        }),
      );
      expect(result).toEqual({ success: true });
    });

    it('handles both ios and android platforms', async () => {
      mockPrisma.deviceToken.upsert.mockResolvedValue({});
      await service.registerToken({ token: 'android-token', platform: 'android' }, mockUser);
      expect(mockPrisma.deviceToken.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ platform: 'android' }),
        }),
      );
    });
  });

  // ── sendToUser ─────────────────────────────────────────────────────────────

  describe('sendToUser', () => {
    it('does nothing when the user has no registered device tokens', async () => {
      mockPrisma.deviceToken.findMany.mockResolvedValue([]);
      await service.sendToUser('user-1', 'Title', 'Body');
      // No errors thrown and no attempts to send
      expect(mockPrisma.deviceToken.findMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    });

    it('attempts delivery for each registered token', async () => {
      mockPrisma.deviceToken.findMany.mockResolvedValue([
        { id: 'dt-1', token: 'ios-token', platform: 'ios', userId: 'user-1' },
        { id: 'dt-2', token: 'android-token', platform: 'android', userId: 'user-1' },
      ]);
      // With apnProvider and fcmReady both disabled, send calls are no-ops — no error should be thrown
      await expect(service.sendToUser('user-1', 'Title', 'Body')).resolves.not.toThrow();
    });
  });

  // ── handleJobAssigned ──────────────────────────────────────────────────────

  describe('handleJobAssigned', () => {
    it('triggers a push notification to the assigned user', async () => {
      mockPrisma.deviceToken.findMany.mockResolvedValue([]);
      const sendToUserSpy = jest.spyOn(service, 'sendToUser').mockResolvedValue(undefined);
      service.handleJobAssigned({ userId: 'user-1', serviceOrderId: 'order-1' });
      expect(sendToUserSpy).toHaveBeenCalledWith(
        'user-1',
        'New job assigned',
        expect.any(String),
        expect.objectContaining({ type: 'job.assigned', serviceOrderId: 'order-1' }),
      );
    });
  });
});
