import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SitesService } from './sites.service';
import { PrismaService } from '../prisma/prisma.service';

const mockSite = {
  id: 'site-1',
  name: 'Manchester Depot',
  address: '1 Depot Road',
  postcode: 'M1 1AA',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  site: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('SitesService', () => {
  let service: SitesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        SitesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(SitesService);
  });

  // ── findById ───────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('throws NotFoundException when site does not exist', async () => {
      mockPrisma.site.findUnique.mockResolvedValue(null);
      await expect(service.findById('site-1')).rejects.toThrow(NotFoundException);
    });

    it('returns the site when found', async () => {
      mockPrisma.site.findUnique.mockResolvedValue(mockSite);
      const result = await service.findById('site-1');
      expect(result.name).toBe('Manchester Depot');
    });
  });

  // ── list ───────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns all sites when no search term is provided', async () => {
      mockPrisma.site.findMany.mockResolvedValue([mockSite]);
      await service.list({});
      expect(mockPrisma.site.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('applies a case-insensitive OR filter when a search term is provided', async () => {
      mockPrisma.site.findMany.mockResolvedValue([mockSite]);
      await service.list({ search: 'Manchester' });
      const callArgs = mockPrisma.site.findMany.mock.calls[0][0];
      expect(callArgs.where.OR).toHaveLength(2);
      expect(callArgs.where.OR[0].name.contains).toBe('Manchester');
    });

    it('orders results by name ascending', async () => {
      mockPrisma.site.findMany.mockResolvedValue([mockSite]);
      await service.list({});
      expect(mockPrisma.site.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { name: 'asc' } }),
      );
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a site with the provided fields', async () => {
      mockPrisma.site.create.mockResolvedValue(mockSite);
      await service.create({ name: 'Manchester Depot', address: '1 Depot Road', postcode: 'M1 1AA' });
      expect(mockPrisma.site.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Manchester Depot' }),
        }),
      );
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('throws NotFoundException when site does not exist', async () => {
      mockPrisma.site.findUnique.mockResolvedValue(null);
      await expect(service.update('site-1', { name: 'New Name' })).rejects.toThrow(NotFoundException);
    });

    it('updates the site with the provided fields', async () => {
      mockPrisma.site.findUnique.mockResolvedValue(mockSite);
      mockPrisma.site.update.mockResolvedValue({ ...mockSite, name: 'Updated Depot' });
      await service.update('site-1', { name: 'Updated Depot' });
      expect(mockPrisma.site.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'site-1' }, data: { name: 'Updated Depot' } }),
      );
    });
  });
});
