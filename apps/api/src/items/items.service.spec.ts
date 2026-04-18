import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ItemsService } from './items.service';
import { PrismaService } from '../prisma/prisma.service';

const mockOrder = {
  id: 'order-1',
  assignedToId: 'user-1',
  siteId: 'site-1',
  status: 'in_progress',
  priority: 50,
  reference: 'SO-2025-0001',
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockItem = {
  id: 'item-1',
  serviceOrderId: 'order-1',
  siteId: 'site-1',
  productId: 'product-1',
  serialNumber: 'SN12345',
  tagNumber: null,
  installedAt: new Date(),
  removedAt: null,
  warrantyExpiry: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  product: { id: 'product-1', name: 'HVAC Unit', sku: 'HVAC-001' },
};

const mockPrisma = {
  serviceOrder: {
    findUnique: jest.fn(),
  },
  item: {
    findMany: jest.fn(),
  },
};

describe('ItemsService', () => {
  let service: ItemsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ItemsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ItemsService);
  });

  describe('listForOrder', () => {
    it('throws NotFoundException when the service order does not exist', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue(null);
      await expect(service.listForOrder('order-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the order belongs to a different engineer', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue({ ...mockOrder, assignedToId: 'other-user' });
      await expect(service.listForOrder('order-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('returns items for the order when the user is the assigned engineer', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.item.findMany.mockResolvedValue([mockItem]);
      const result = await service.listForOrder('order-1', 'user-1');
      expect(result).toHaveLength(1);
      expect(result[0]!.serialNumber).toBe('SN12345');
    });

    it('filters items by service order id', async () => {
      mockPrisma.serviceOrder.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.item.findMany.mockResolvedValue([]);
      await service.listForOrder('order-1', 'user-1');
      expect(mockPrisma.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { serviceOrderId: 'order-1' } }),
      );
    });
  });
});
