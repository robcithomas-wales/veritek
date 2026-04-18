import { Test } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { PrismaService } from '../prisma/prisma.service';

const mockUser = {
  id: 'user-1',
  supabaseId: 'supabase-1',
  email: 'engineer@example.com',
  firstName: 'John',
  lastName: 'Smith',
  role: 'engineer',
  warehouseId: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  warehouse: {
    findMany: jest.fn(),
  },
};

// Mock the Supabase admin client so tests don't require real credentials
const mockSupabaseInvite = jest.fn();
const mockSupabaseDelete = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      admin: {
        inviteUserByEmail: mockSupabaseInvite,
        deleteUser: mockSupabaseDelete,
      },
    },
  }),
}));

describe('AdminUsersService', () => {
  let service: AdminUsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(AdminUsersService);
  });

  // ── list ───────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns all non-deleted users', async () => {
      const rawUser = {
        ...mockUser,
        clockEvents: [],
        serviceOrders: [],
      };
      mockPrisma.user.findMany.mockResolvedValue([rawUser]);
      const result = await service.list({});
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('user-1');
    });

    it('marks clockedIn as true when the last clock event is clock_in', async () => {
      const rawUser = {
        ...mockUser,
        clockEvents: [{ type: 'clock_in', timestamp: new Date() }],
        serviceOrders: [],
      };
      mockPrisma.user.findMany.mockResolvedValue([rawUser]);
      const [first] = await service.list({});
      expect(first!.clockedIn).toBe(true);
    });

    it('marks clockedIn as false when there are no clock events', async () => {
      const rawUser = { ...mockUser, clockEvents: [], serviceOrders: [] };
      mockPrisma.user.findMany.mockResolvedValue([rawUser]);
      const [first] = await service.list({});
      expect(first!.clockedIn).toBe(false);
    });

    it('applies role filter when provided', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      await service.list({ role: 'engineer' });
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ role: 'engineer' }) }),
      );
    });
  });

  // ── getDetail ──────────────────────────────────────────────────────────────

  describe('getDetail', () => {
    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getDetail('user-1')).rejects.toThrow(NotFoundException);
    });

    it('returns user profile with van stock count', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        clockEvents: [],
        stockItems: [{ id: 'stock-1' }, { id: 'stock-2' }],
        serviceOrders: [],
      });
      const result = await service.getDetail('user-1');
      expect(result.vanStockCount).toBe(2);
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('throws BadRequestException when email is already in use', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      await expect(
        service.create({ email: 'engineer@example.com', firstName: 'John', lastName: 'Smith', role: 'engineer' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when Supabase invite fails', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockSupabaseInvite.mockResolvedValue({ data: { user: null }, error: { message: 'Invite failed' } });
      await expect(
        service.create({ email: 'new@example.com', firstName: 'Jane', lastName: 'Doe', role: 'engineer' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates a user record with the Supabase UUID when invite succeeds', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockSupabaseInvite.mockResolvedValue({ data: { user: { id: 'supabase-new' } }, error: null });
      mockPrisma.user.create.mockResolvedValue({ ...mockUser, id: 'user-new', supabaseId: 'supabase-new' });
      await service.create({ email: 'new@example.com', firstName: 'Jane', lastName: 'Doe', role: 'engineer' });
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ supabaseId: 'supabase-new' }) }),
      );
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.update('user-1', { firstName: 'Jane' })).rejects.toThrow(NotFoundException);
    });

    it('updates only the provided fields', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, firstName: 'Jane' });
      await service.update('user-1', { firstName: 'Jane' });
      const updateData = mockPrisma.user.update.mock.calls[0][0].data;
      expect(updateData.firstName).toBe('Jane');
      expect(updateData.email).toBeUndefined();
    });

    it('explicitly sets warehouseId to null when passed as null', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, warehouseId: null });
      await service.update('user-1', { warehouseId: null });
      const updateData = mockPrisma.user.update.mock.calls[0][0].data;
      expect(updateData.warehouseId).toBeNull();
    });
  });

  // ── deactivate ─────────────────────────────────────────────────────────────

  describe('deactivate', () => {
    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.deactivate('user-1')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when user is already deactivated', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, deletedAt: new Date() });
      await expect(service.deactivate('user-1')).rejects.toThrow(BadRequestException);
    });

    it('sets deletedAt on the user record', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockSupabaseDelete.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, deletedAt: new Date() });
      await service.deactivate('user-1');
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ deletedAt: expect.any(Date) }) }),
      );
    });

    it('still deactivates the user if Supabase deletion fails', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockSupabaseDelete.mockRejectedValue(new Error('Supabase error'));
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, deletedAt: new Date() });
      await expect(service.deactivate('user-1')).resolves.not.toThrow();
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });
  });

  // ── warehouses ─────────────────────────────────────────────────────────────

  describe('warehouses', () => {
    it('returns warehouses ordered by name', async () => {
      mockPrisma.warehouse.findMany.mockResolvedValue([{ id: 'wh-1', name: 'Manchester' }]);
      const result = await service.warehouses();
      expect(mockPrisma.warehouse.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } });
      expect(result).toHaveLength(1);
    });
  });
});
