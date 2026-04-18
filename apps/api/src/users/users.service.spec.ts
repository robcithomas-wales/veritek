import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import type { User } from '@prisma/client';

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
  user: {
    findUnique: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  describe('findById', () => {
    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findById('user-1')).rejects.toThrow(NotFoundException);
    });

    it('returns the user when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.findById('user-1');
      expect(result.id).toBe('user-1');
      expect(result.email).toBe('engineer@example.com');
    });

    it('queries by the provided id', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      await service.findById('user-1');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    });
  });
});
