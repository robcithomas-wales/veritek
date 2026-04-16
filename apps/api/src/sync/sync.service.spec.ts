import { Test } from '@nestjs/testing';
import { SyncService } from './sync.service';
import { ActivitiesService } from '../activities/activities.service';
import { MaterialsService } from '../materials/materials.service';
import { ClockService } from '../clock/clock.service';
import { ServiceOrdersService } from '../service-orders/service-orders.service';
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

const mockActivities = {
  create: jest.fn(),
  startTravel: jest.fn(),
  startWork: jest.fn(),
  stopWork: jest.fn(),
  submitChecklist: jest.fn(),
  complete: jest.fn(),
};

const mockMaterials = {
  create: jest.fn(),
  update: jest.fn(),
};

const mockClock = {
  record: jest.fn(),
};

const mockServiceOrders = {
  accept: jest.fn(),
  reject: jest.fn(),
};

describe('SyncService', () => {
  let service: SyncService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        SyncService,
        { provide: ActivitiesService, useValue: mockActivities },
        { provide: MaterialsService, useValue: mockMaterials },
        { provide: ClockService, useValue: mockClock },
        { provide: ServiceOrdersService, useValue: mockServiceOrders },
      ],
    }).compile();
    service = module.get(SyncService);
  });

  const mutation = (endpoint: string, method: 'POST' | 'PATCH' | 'DELETE', body: unknown) => ({
    id: 1,
    createdAt: new Date().toISOString(),
    endpoint,
    method,
    body,
  });

  // ── routing ────────────────────────────────────────────────────────────────

  describe('flush routing', () => {
    it('routes POST /service-orders/:id/activities to activities.create', async () => {
      mockActivities.create.mockResolvedValue({});
      await service.flush({ mutations: [mutation('/service-orders/order-1/activities', 'POST', { type: 'break_fix' })] }, mockUser);
      expect(mockActivities.create).toHaveBeenCalledWith('order-1', { type: 'break_fix' }, mockUser);
    });

    it('routes PATCH /activities/:id/start-travel to activities.startTravel', async () => {
      mockActivities.startTravel.mockResolvedValue({});
      await service.flush({ mutations: [mutation('/activities/activity-1/start-travel', 'PATCH', {})] }, mockUser);
      expect(mockActivities.startTravel).toHaveBeenCalledWith('activity-1', mockUser);
    });

    it('routes PATCH /activities/:id/start-work to activities.startWork', async () => {
      mockActivities.startWork.mockResolvedValue({});
      await service.flush({ mutations: [mutation('/activities/activity-1/start-work', 'PATCH', { travelDistance: 12 })] }, mockUser);
      expect(mockActivities.startWork).toHaveBeenCalledWith('activity-1', { travelDistance: 12 }, mockUser);
    });

    it('routes PATCH /activities/:id/stop-work to activities.stopWork', async () => {
      mockActivities.stopWork.mockResolvedValue({});
      await service.flush({ mutations: [mutation('/activities/activity-1/stop-work', 'PATCH', { stopCode: 'FC' })] }, mockUser);
      expect(mockActivities.stopWork).toHaveBeenCalledWith('activity-1', { stopCode: 'FC' }, mockUser);
    });

    it('routes POST /service-orders/:id/complete to activities.complete', async () => {
      mockActivities.complete.mockResolvedValue({});
      await service.flush({ mutations: [mutation('/service-orders/order-1/complete', 'POST', { signedBy: 'J. Smith' })] }, mockUser);
      expect(mockActivities.complete).toHaveBeenCalledWith('order-1', mockUser, 'J. Smith');
    });

    it('routes PATCH /service-orders/:id/accept to serviceOrders.accept', async () => {
      mockServiceOrders.accept.mockResolvedValue({});
      await service.flush({ mutations: [mutation('/service-orders/order-1/accept', 'PATCH', {})] }, mockUser);
      expect(mockServiceOrders.accept).toHaveBeenCalledWith('order-1', mockUser);
    });

    it('routes POST /service-orders/:id/materials to materials.create', async () => {
      mockMaterials.create.mockResolvedValue({});
      await service.flush({
        mutations: [mutation('/service-orders/order-1/materials', 'POST', { productId: 'clh0m8xkz0000qzrmh7x3q9bf', qty: 1, returnable: false })],
      }, mockUser);
      expect(mockMaterials.create).toHaveBeenCalledWith('order-1', expect.objectContaining({ productId: 'clh0m8xkz0000qzrmh7x3q9bf' }), mockUser);
    });

    it('routes PATCH /materials/:id to materials.update', async () => {
      mockMaterials.update.mockResolvedValue({});
      await service.flush({ mutations: [mutation('/materials/material-1', 'PATCH', { status: 'fulfilled' })] }, mockUser);
      expect(mockMaterials.update).toHaveBeenCalledWith('material-1', expect.objectContaining({ status: 'fulfilled' }), mockUser);
    });

    it('routes POST /clock to clock.record', async () => {
      mockClock.record.mockResolvedValue({});
      const ts = '2026-04-15T08:00:00.000Z';
      await service.flush({ mutations: [mutation('/clock', 'POST', { type: 'clock_in', timestamp: ts })] }, mockUser);
      expect(mockClock.record).toHaveBeenCalledWith({ type: 'clock_in', timestamp: ts }, mockUser);
    });
  });

  // ── error handling ─────────────────────────────────────────────────────────

  describe('flush error handling', () => {
    it('returns a failure result for a failed mutation without aborting the batch', async () => {
      mockActivities.startTravel.mockRejectedValue(new Error('Activity not found'));
      mockActivities.stopWork.mockResolvedValue({});
      const result = await service.flush({
        mutations: [
          mutation('/activities/bad-id/start-travel', 'PATCH', {}),
          mutation('/activities/activity-1/stop-work', 'PATCH', { stopCode: 'FC' }),
        ],
      }, mockUser);
      expect(result.results[0]).toEqual({ id: 1, success: false, error: 'Activity not found' });
      expect(result.results[1]).toEqual({ id: 1, success: true });
    });

    it('returns a failure for an unrecognised endpoint', async () => {
      const result = await service.flush({
        mutations: [mutation('/unknown/endpoint', 'POST', {})],
      }, mockUser);
      expect(result.results[0]?.success).toBe(false);
    });

    it('processes mutations in createdAt order', async () => {
      const calls: string[] = [];
      mockActivities.startTravel.mockImplementation(() => { calls.push('travel'); return Promise.resolve({}); });
      mockActivities.startWork.mockImplementation(() => { calls.push('work'); return Promise.resolve({}); });
      await service.flush({
        mutations: [
          { id: 2, createdAt: '2026-04-15T08:01:00.000Z', endpoint: '/activities/a-1/start-work', method: 'PATCH', body: { travelDistance: 5 } },
          { id: 1, createdAt: '2026-04-15T08:00:00.000Z', endpoint: '/activities/a-1/start-travel', method: 'PATCH', body: {} },
        ],
      }, mockUser);
      expect(calls).toEqual(['travel', 'work']);
    });
  });
});
