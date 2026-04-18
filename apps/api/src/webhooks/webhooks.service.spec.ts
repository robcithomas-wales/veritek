import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../prisma/prisma.service';

const mockSubscription = {
  id: 'sub-1',
  name: 'Test Webhook',
  endpointUrl: 'https://example.com/hook',
  eventTypes: ['job.assigned', 'job.completed'],
  isActive: true,
  secretHash: 'hash',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockDelivery = {
  id: 'delivery-1',
  subscriptionId: 'sub-1',
  eventType: 'job.assigned',
  status: 'failed',
  attempts: 2,
  nextRetryAt: new Date(),
  payload: {},
  responseCode: 500,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  webhookSubscription: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  webhookDelivery: {
    findUnique: jest.fn(),
    update: jest.fn(),
    createMany: jest.fn(),
  },
};

describe('WebhooksService', () => {
  let service: WebhooksService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(WebhooksService);
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a subscription and returns the plaintext secret', async () => {
      mockPrisma.webhookSubscription.create.mockResolvedValue(mockSubscription);
      const result = await service.create({
        name: 'Test Webhook',
        endpointUrl: 'https://example.com/hook',
        eventTypes: ['job.assigned'],
      });
      expect(result.secret).toBeDefined();
      expect(typeof result.secret).toBe('string');
      expect(result.secret).toHaveLength(64);
    });

    it('stores a hash rather than the raw secret', async () => {
      mockPrisma.webhookSubscription.create.mockResolvedValue(mockSubscription);
      await service.create({ name: 'Test', endpointUrl: 'https://x.com', eventTypes: [] });
      const stored = mockPrisma.webhookSubscription.create.mock.calls[0][0].data;
      expect(stored.secretHash).not.toBe(stored.secret);
      expect(stored.secretHash).toHaveLength(64);
    });
  });

  // ── list ───────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns subscriptions with lastDeliveryStatus', async () => {
      mockPrisma.webhookSubscription.findMany.mockResolvedValue([
        { ...mockSubscription, deliveries: [{ status: 'delivered' }] },
      ]);
      const [first] = await service.list();
      expect(first!.lastDeliveryStatus).toBe('delivered');
    });

    it('returns null lastDeliveryStatus when no deliveries exist', async () => {
      mockPrisma.webhookSubscription.findMany.mockResolvedValue([
        { ...mockSubscription, deliveries: [] },
      ]);
      const [first] = await service.list();
      expect(first!.lastDeliveryStatus).toBeNull();
    });
  });

  // ── getDetail ──────────────────────────────────────────────────────────────

  describe('getDetail', () => {
    it('throws NotFoundException when subscription does not exist', async () => {
      mockPrisma.webhookSubscription.findUnique.mockResolvedValue(null);
      await expect(service.getDetail('sub-1')).rejects.toThrow(NotFoundException);
    });

    it('returns the subscription with deliveries', async () => {
      const detail = { ...mockSubscription, deliveries: [mockDelivery] };
      mockPrisma.webhookSubscription.findUnique.mockResolvedValue(detail);
      const result = await service.getDetail('sub-1');
      expect(result.deliveries).toHaveLength(1);
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('throws NotFoundException when subscription does not exist', async () => {
      mockPrisma.webhookSubscription.findUnique.mockResolvedValue(null);
      await expect(service.update('sub-1', { isActive: false })).rejects.toThrow(NotFoundException);
    });

    it('updates the subscription fields', async () => {
      mockPrisma.webhookSubscription.findUnique.mockResolvedValue(mockSubscription);
      mockPrisma.webhookSubscription.update.mockResolvedValue({ ...mockSubscription, isActive: false });
      await service.update('sub-1', { isActive: false });
      expect(mockPrisma.webhookSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: false } }),
      );
    });
  });

  // ── remove ─────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('throws NotFoundException when subscription does not exist', async () => {
      mockPrisma.webhookSubscription.findUnique.mockResolvedValue(null);
      await expect(service.remove('sub-1')).rejects.toThrow(NotFoundException);
    });

    it('sets isActive to false instead of hard-deleting', async () => {
      mockPrisma.webhookSubscription.findUnique.mockResolvedValue(mockSubscription);
      mockPrisma.webhookSubscription.update.mockResolvedValue({ ...mockSubscription, isActive: false });
      const result = await service.remove('sub-1');
      expect(mockPrisma.webhookSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: false } }),
      );
      expect(result).toEqual({ success: true });
    });
  });

  // ── retryDelivery ──────────────────────────────────────────────────────────

  describe('retryDelivery', () => {
    it('throws NotFoundException when delivery does not exist', async () => {
      mockPrisma.webhookDelivery.findUnique.mockResolvedValue(null);
      await expect(service.retryDelivery('sub-1', 'delivery-1')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when delivery belongs to a different subscription', async () => {
      mockPrisma.webhookDelivery.findUnique.mockResolvedValue({ ...mockDelivery, subscriptionId: 'sub-other' });
      await expect(service.retryDelivery('sub-1', 'delivery-1')).rejects.toThrow(NotFoundException);
    });

    it('resets delivery to pending with zeroed attempt count', async () => {
      mockPrisma.webhookDelivery.findUnique.mockResolvedValue(mockDelivery);
      mockPrisma.webhookDelivery.update.mockResolvedValue({ ...mockDelivery, status: 'pending', attempts: 0 });
      const result = await service.retryDelivery('sub-1', 'delivery-1');
      expect(mockPrisma.webhookDelivery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'pending', attempts: 0 }),
        }),
      );
      expect(result).toEqual({ success: true });
    });
  });

  // ── handleDomainEvent ──────────────────────────────────────────────────────

  describe('handleDomainEvent', () => {
    it('creates delivery records for all matching active subscriptions', async () => {
      mockPrisma.webhookSubscription.findMany.mockResolvedValue([mockSubscription]);
      mockPrisma.webhookDelivery.createMany.mockResolvedValue({ count: 1 });
      await service.handleDomainEvent({ orderId: 'order-1' }, 'job.assigned');
      expect(mockPrisma.webhookDelivery.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ subscriptionId: 'sub-1', eventType: 'job.assigned', status: 'pending' }),
          ]),
        }),
      );
    });

    it('does nothing when no subscriptions match the event', async () => {
      mockPrisma.webhookSubscription.findMany.mockResolvedValue([]);
      await service.handleDomainEvent({ orderId: 'order-1' }, 'job.assigned');
      expect(mockPrisma.webhookDelivery.createMany).not.toHaveBeenCalled();
    });
  });
});
