import { Test } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ShippingService } from './shipping.service';
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

const mockShipLine = {
  id: 'line-1',
  shipmentId: 'ship-1',
  productId: 'prod-1',
  qty: 2,
  serialNumber: null,
  product: { id: 'prod-1', name: 'Filter', sku: 'FLT-001' },
};

const mockShipment = {
  id: 'ship-1',
  userId: 'user-1',
  siteId: 'site-1',
  destinationId: 'wh-1',
  status: 'pending',
  type: 'return',
  createdAt: new Date(),
  updatedAt: new Date(),
  shipLines: [mockShipLine],
};

const mockPrisma = {
  shipment: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  shipLine: {
    delete: jest.fn(),
  },
};

describe('ShippingService', () => {
  let service: ShippingService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ShippingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ShippingService);
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a shipment with lines and returns it', async () => {
      mockPrisma.shipment.create.mockResolvedValue(mockShipment);
      const result = await service.create(
        {
          siteId: 'site-1',
          destinationId: 'wh-1',
          lines: [{ productId: 'prod-1', qty: 2 }],
        },
        mockUser,
      );
      expect(result).toEqual(mockShipment);
      expect(mockPrisma.shipment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-1', siteId: 'site-1' }),
        }),
      );
    });
  });

  // ── list ───────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns shipments scoped to the current user', async () => {
      mockPrisma.shipment.findMany.mockResolvedValue([mockShipment]);
      const result = await service.list(mockUser);
      expect(result).toEqual([mockShipment]);
      expect(mockPrisma.shipment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
    });
  });

  // ── get ────────────────────────────────────────────────────────────────────

  describe('get', () => {
    it('throws NotFoundException when shipment does not exist', async () => {
      mockPrisma.shipment.findUnique.mockResolvedValue(null);
      await expect(service.get('ship-99', mockUser)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when shipment belongs to another user', async () => {
      mockPrisma.shipment.findUnique.mockResolvedValue({ ...mockShipment, userId: 'user-2' });
      await expect(service.get('ship-1', mockUser)).rejects.toThrow(ForbiddenException);
    });

    it('returns the shipment when it belongs to the current user', async () => {
      mockPrisma.shipment.findUnique.mockResolvedValue(mockShipment);
      const result = await service.get('ship-1', mockUser);
      expect(result).toEqual(mockShipment);
    });
  });

  // ── updateStatus ───────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('throws NotFoundException when shipment does not exist', async () => {
      mockPrisma.shipment.findUnique.mockResolvedValue(null);
      await expect(service.updateStatus('ship-99', { status: 'collected' }, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when shipment belongs to another user', async () => {
      mockPrisma.shipment.findUnique.mockResolvedValue({ ...mockShipment, userId: 'user-2' });
      await expect(service.updateStatus('ship-1', { status: 'collected' }, mockUser)).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when shipment is already collected', async () => {
      mockPrisma.shipment.findUnique.mockResolvedValue({ ...mockShipment, status: 'collected' });
      await expect(service.updateStatus('ship-1', { status: 'cancelled' }, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when shipment is already cancelled', async () => {
      mockPrisma.shipment.findUnique.mockResolvedValue({ ...mockShipment, status: 'cancelled' });
      await expect(service.updateStatus('ship-1', { status: 'collected' }, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('updates the status when shipment is pending', async () => {
      const updated = { ...mockShipment, status: 'collected' };
      mockPrisma.shipment.findUnique.mockResolvedValue(mockShipment);
      mockPrisma.shipment.update.mockResolvedValue(updated);

      const result = await service.updateStatus('ship-1', { status: 'collected' }, mockUser);
      expect(result.status).toBe('collected');
    });
  });

  // ── removeLine ─────────────────────────────────────────────────────────────

  describe('removeLine', () => {
    it('throws NotFoundException when shipment does not exist', async () => {
      mockPrisma.shipment.findUnique.mockResolvedValue(null);
      await expect(service.removeLine('ship-99', 'line-1', mockUser)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when shipment belongs to another user', async () => {
      mockPrisma.shipment.findUnique.mockResolvedValue({ ...mockShipment, userId: 'user-2' });
      await expect(service.removeLine('ship-1', 'line-1', mockUser)).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when shipment is not pending', async () => {
      mockPrisma.shipment.findUnique.mockResolvedValue({ ...mockShipment, status: 'collected' });
      await expect(service.removeLine('ship-1', 'line-1', mockUser)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when line does not belong to this shipment', async () => {
      mockPrisma.shipment.findUnique.mockResolvedValue({ ...mockShipment, shipLines: [] });
      await expect(service.removeLine('ship-1', 'line-99', mockUser)).rejects.toThrow(NotFoundException);
    });

    it('deletes the line and returns success', async () => {
      mockPrisma.shipment.findUnique.mockResolvedValue(mockShipment);
      mockPrisma.shipLine.delete.mockResolvedValue(mockShipLine);

      const result = await service.removeLine('ship-1', 'line-1', mockUser);
      expect(mockPrisma.shipLine.delete).toHaveBeenCalledWith({ where: { id: 'line-1' } });
      expect(result).toEqual({ success: true });
    });
  });
});
