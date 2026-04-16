import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import type { User } from '@prisma/client';

const mockUser: User = {
  id: 'user-1',
  supabaseId: 'supabase-1',
  email: 'engineer@example.com',
  firstName: 'Test',
  lastName: 'Engineer',
  role: 'engineer',
  warehouseId: 'wh-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockProduct = { id: 'prod-1', name: 'Filter Unit', sku: 'FU-001' };

const mockStockItem = {
  id: 'stock-1',
  userId: 'user-1',
  productId: 'prod-1',
  warehouseId: 'wh-1',
  qty: 5,
  product: mockProduct,
};

const mockAdjustment = {
  id: 'adj-1',
  userId: 'user-1',
  productId: 'prod-1',
  delta: -1,
  reason: 'Used on job',
  createdAt: new Date(),
};

const mockPrisma = {
  stockItem: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  stockAdjustment: {
    create: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  warehouse: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('InventoryService', () => {
  let service: InventoryService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(InventoryService);
  });

  // ── vanStock ───────────────────────────────────────────────────────────────

  describe('vanStock', () => {
    it('returns stock items for the current user', async () => {
      mockPrisma.stockItem.findMany.mockResolvedValue([mockStockItem]);
      const result = await service.vanStock(mockUser);
      expect(result).toEqual([mockStockItem]);
      expect(mockPrisma.stockItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
    });
  });

  // ── search ─────────────────────────────────────────────────────────────────

  describe('search', () => {
    it('returns all van stock when no query or warehouseId provided', async () => {
      mockPrisma.stockItem.findMany.mockResolvedValue([mockStockItem]);
      await service.search({ query: undefined, warehouseId: undefined }, mockUser);
      expect(mockPrisma.stockItem.findMany).toHaveBeenCalled();
    });

    it('includes warehouseId filter when provided', async () => {
      mockPrisma.stockItem.findMany.mockResolvedValue([]);
      await service.search({ query: undefined, warehouseId: 'wh-2' }, mockUser);
      expect(mockPrisma.stockItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ warehouseId: 'wh-2' }),
        }),
      );
    });
  });

  // ── adjust ─────────────────────────────────────────────────────────────────

  describe('adjust', () => {
    it('throws NotFoundException when stock item does not exist', async () => {
      mockPrisma.stockItem.findFirst.mockResolvedValue(null);
      await expect(
        service.adjust({ productId: 'prod-1', delta: -1, reason: 'test' }, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when adjustment results in negative stock', async () => {
      mockPrisma.stockItem.findFirst.mockResolvedValue({ ...mockStockItem, qty: 0 });
      await expect(
        service.adjust({ productId: 'prod-1', delta: -1, reason: 'test' }, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('updates stock qty and creates adjustment record', async () => {
      mockPrisma.stockItem.findFirst.mockResolvedValue(mockStockItem);
      mockPrisma.stockItem.update.mockResolvedValue({ ...mockStockItem, qty: 4 });
      mockPrisma.stockAdjustment.create.mockResolvedValue(mockAdjustment);

      await service.adjust({ productId: 'prod-1', delta: -1, reason: 'Used on job' }, mockUser);

      expect(mockPrisma.stockItem.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { qty: 4 } }),
      );
      expect(mockPrisma.stockAdjustment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-1', delta: -1 }),
        }),
      );
    });
  });

  // ── transfer ───────────────────────────────────────────────────────────────

  describe('transfer', () => {
    it('throws NotFoundException when source stock item does not exist', async () => {
      mockPrisma.stockItem.findFirst.mockResolvedValue(null);
      await expect(
        service.transfer({ productId: 'prod-1', qty: 2, toEngineerId: 'user-2' }, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when insufficient stock', async () => {
      mockPrisma.stockItem.findFirst.mockResolvedValue({ ...mockStockItem, qty: 1 });
      await expect(
        service.transfer({ productId: 'prod-1', qty: 5, toEngineerId: 'user-2' }, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when target engineer does not exist', async () => {
      mockPrisma.stockItem.findFirst.mockResolvedValue(mockStockItem);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.transfer({ productId: 'prod-1', qty: 2, toEngineerId: 'user-99' }, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('executes a transaction when transfer is valid', async () => {
      mockPrisma.stockItem.findFirst.mockResolvedValue(mockStockItem);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-2' });
      mockPrisma.$transaction.mockResolvedValue(undefined);

      const result = await service.transfer(
        { productId: 'prod-1', qty: 2, toEngineerId: 'user-2' },
        mockUser,
      );

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  // ── warehouses ─────────────────────────────────────────────────────────────

  describe('warehouses', () => {
    it('returns warehouses ordered by name', async () => {
      const warehouses = [{ id: 'wh-1', name: 'Birmingham' }];
      mockPrisma.warehouse.findMany.mockResolvedValue(warehouses);
      const result = await service.warehouses();
      expect(result).toEqual(warehouses);
    });
  });
});
