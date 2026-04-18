import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { PrismaService } from '../prisma/prisma.service';
import type { User } from '@prisma/client';

const mockUser: User = {
  id: 'user-1',
  supabaseId: 'supabase-1',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin',
  warehouseId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockKey = {
  id: 'key-1',
  name: 'Test Key',
  keyHash: 'hash',
  scopes: ['service-orders:read'],
  isActive: true,
  createdById: 'user-1',
  deletedAt: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockPrisma = {
  apiKey: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  apiKeyUsage: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

describe('ApiKeysService', () => {
  let service: ApiKeysService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ApiKeysService);
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a key and returns the plaintext', async () => {
      mockPrisma.apiKey.create.mockResolvedValue(mockKey);
      const result = await service.create({ name: 'Test Key', scopes: ['service-orders:read'] }, mockUser);
      expect(result.plaintext).toMatch(/^vk_[0-9a-f]{64}$/);
      expect(result.name).toBe('Test Key');
    });

    it('stores a hash, not the plaintext key', async () => {
      mockPrisma.apiKey.create.mockResolvedValue(mockKey);
      await service.create({ name: 'Test Key', scopes: [] }, mockUser);
      const created = mockPrisma.apiKey.create.mock.calls[0][0].data;
      expect(created.keyHash).not.toMatch(/^vk_/);
      expect(created.keyHash).toHaveLength(64);
    });

    it('associates the key with the creating user', async () => {
      mockPrisma.apiKey.create.mockResolvedValue(mockKey);
      await service.create({ name: 'Test Key', scopes: [] }, mockUser);
      expect(mockPrisma.apiKey.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ createdById: 'user-1' }) }),
      );
    });
  });

  // ── list ───────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns keys with lastUsedAt from most recent usage', async () => {
      const ts = new Date('2025-06-01');
      mockPrisma.apiKey.findMany.mockResolvedValue([
        { ...mockKey, usage: [{ timestamp: ts }], _count: { usage: 3 } },
      ]);
      const result = await service.list();
      const [first] = result;
      expect(first!.lastUsedAt).toBe(ts.toISOString());
      expect(first!.requestCount).toBe(3);
    });

    it('returns null lastUsedAt when key has never been used', async () => {
      mockPrisma.apiKey.findMany.mockResolvedValue([
        { ...mockKey, usage: [], _count: { usage: 0 } },
      ]);
      const result = await service.list();
      expect(result[0]!.lastUsedAt).toBeNull();
    });
  });

  // ── usage ──────────────────────────────────────────────────────────────────

  describe('usage', () => {
    it('throws NotFoundException when key does not exist', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue(null);
      await expect(service.usage('key-1')).rejects.toThrow(NotFoundException);
    });

    it('returns paginated usage records', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue(mockKey);
      mockPrisma.apiKeyUsage.findMany.mockResolvedValue([{ id: 'u-1', endpoint: '/orders', responseCode: 200 }]);
      mockPrisma.apiKeyUsage.count.mockResolvedValue(1);
      const result = await service.usage('key-1', 1);
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });
  });

  // ── suspend ────────────────────────────────────────────────────────────────

  describe('suspend', () => {
    it('throws NotFoundException when key does not exist', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue(null);
      await expect(service.suspend('key-1')).rejects.toThrow(NotFoundException);
    });

    it('sets isActive to false', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue(mockKey);
      mockPrisma.apiKey.update.mockResolvedValue({ ...mockKey, isActive: false });
      await service.suspend('key-1');
      expect(mockPrisma.apiKey.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: false } }),
      );
    });
  });

  // ── activate ───────────────────────────────────────────────────────────────

  describe('activate', () => {
    it('throws NotFoundException when key does not exist', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue(null);
      await expect(service.activate('key-1')).rejects.toThrow(NotFoundException);
    });

    it('sets isActive to true', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue({ ...mockKey, isActive: false });
      mockPrisma.apiKey.update.mockResolvedValue({ ...mockKey, isActive: true });
      await service.activate('key-1');
      expect(mockPrisma.apiKey.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: true } }),
      );
    });
  });

  // ── revoke ─────────────────────────────────────────────────────────────────

  describe('revoke', () => {
    it('throws NotFoundException when key does not exist', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue(null);
      await expect(service.revoke('key-1')).rejects.toThrow(NotFoundException);
    });

    it('soft-deletes the key and sets isActive to false', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue(mockKey);
      mockPrisma.apiKey.update.mockResolvedValue({ ...mockKey, deletedAt: new Date(), isActive: false });
      const result = await service.revoke('key-1');
      expect(mockPrisma.apiKey.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isActive: false, deletedAt: expect.any(Date) }) }),
      );
      expect(result).toEqual({ success: true });
    });
  });
});
