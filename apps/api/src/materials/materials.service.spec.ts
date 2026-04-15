import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MaterialsService } from './materials.service';
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
  status: 'in_progress' as const,
  description: null,
  reference: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockMaterial = {
  id: 'material-1',
  serviceOrderId: 'order-1',
  productId: 'product-1',
  qty: 1,
  status: 'needed' as const,
  disposition: 'open' as const,
  returnable: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  product: { id: 'product-1', sku: 'SKU-001', name: 'Test Part', description: null, returnable: false, createdAt: new Date(), updatedAt: new Date() },
  returnProduct: null,
  serviceOrder: mockOrder,
};

const mockPrisma = {
  serviceOrder: { findUnique: jest.fn() },
  material: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  returnProduct: { upsert: jest.fn() },
};

const mockEvents = { emit: jest.fn() };

describe('MaterialsService', () => {
  let service: MaterialsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        MaterialsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventsService, useValue: mockEvents },
      ],
    }).compile();
    service = module.get(MaterialsService);
  });

  // ── listForOrder ───────────────────────────────────────────────────────────

  describe('listForOrder', () => {
    it('throws NotFoundException when order does not exist', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue(null);
      await expect(service.listForOrder('order-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when order belongs to a different engineer', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue({ ...mockOrder, assignedToId: 'other-user' });
      await expect(service.listForOrder('order-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('returns materials for the order', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.material.findMany.mockResolvedValue([mockMaterial]);
      const result = await service.listForOrder('order-1', 'user-1');
      expect(result).toEqual([mockMaterial]);
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('throws NotFoundException when order does not exist', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue(null);
      await expect(
        service.create('order-1', { productId: 'product-1', qty: 1, returnable: false }, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates a material record', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.material.create.mockResolvedValue(mockMaterial);
      await service.create('order-1', { productId: 'product-1', qty: 2, returnable: false }, mockUser);
      expect(mockPrisma.material.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ serviceOrderId: 'order-1', productId: 'product-1', qty: 2 }),
        }),
      );
    });

    it('emits part.ordered event', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.material.create.mockResolvedValue(mockMaterial);
      await service.create('order-1', { productId: 'product-1', qty: 1, returnable: false }, mockUser);
      expect(mockEvents.emit).toHaveBeenCalledWith(
        'part.ordered',
        expect.objectContaining({ orderId: 'order-1', productId: 'product-1' }),
      );
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('throws NotFoundException when material does not exist', async () => {
      mockPrisma.material.findUnique.mockResolvedValue(null);
      await expect(service.update('material-1', { status: 'fulfilled' }, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when material belongs to a different engineer', async () => {
      mockPrisma.material.findUnique.mockResolvedValue({
        ...mockMaterial,
        serviceOrder: { ...mockOrder, assignedToId: 'other-user' },
      });
      await expect(service.update('material-1', { status: 'fulfilled' }, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('emits part.fitted when status updated to fulfilled', async () => {
      mockPrisma.material.findUnique.mockResolvedValue(mockMaterial);
      mockPrisma.material.update.mockResolvedValue({ ...mockMaterial, status: 'fulfilled' });
      await service.update('material-1', { status: 'fulfilled' }, mockUser);
      expect(mockEvents.emit).toHaveBeenCalledWith(
        'part.fitted',
        expect.objectContaining({ materialId: 'material-1' }),
      );
    });

    it('creates return record and emits part.returned when returnReason is provided', async () => {
      mockPrisma.material.findUnique.mockResolvedValue(mockMaterial);
      mockPrisma.material.update.mockResolvedValue(mockMaterial);
      mockPrisma.returnProduct.upsert.mockResolvedValue({});
      await service.update('material-1', { returnReason: 'Faulty', returnWarehouseId: 'wh-1' }, mockUser);
      expect(mockPrisma.returnProduct.upsert).toHaveBeenCalled();
      expect(mockEvents.emit).toHaveBeenCalledWith(
        'part.returned',
        expect.objectContaining({ materialId: 'material-1', returnReason: 'Faulty' }),
      );
    });
  });
});
