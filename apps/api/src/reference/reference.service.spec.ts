import { Test } from '@nestjs/testing';
import { ReferenceService } from './reference.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  stopCode: { findMany: jest.fn() },
  deliveryType: { findMany: jest.fn() },
  checklistQuestion: { findMany: jest.fn() },
  problemCode: { findMany: jest.fn() },
  causeCode: { findMany: jest.fn() },
  repairCode: { findMany: jest.fn() },
  resolveCode: { findMany: jest.fn() },
  rejectionCode: { findMany: jest.fn() },
};

describe('ReferenceService', () => {
  let service: ReferenceService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ReferenceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ReferenceService);
  });

  describe('stopCodes', () => {
    it('returns stop codes ordered by code', async () => {
      mockPrisma.stopCode.findMany.mockResolvedValue([{ code: 'COMP', description: 'Completed' }]);
      const result = await service.stopCodes();
      expect(mockPrisma.stopCode.findMany).toHaveBeenCalledWith({ orderBy: { code: 'asc' } });
      expect(result).toHaveLength(1);
    });
  });

  describe('deliveryTypes', () => {
    it('returns delivery types ordered by name', async () => {
      mockPrisma.deliveryType.findMany.mockResolvedValue([{ id: 'dt-1', name: 'Standard' }]);
      await service.deliveryTypes();
      expect(mockPrisma.deliveryType.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } });
    });
  });

  describe('checklists', () => {
    it('filters questions by item type and orders by position', async () => {
      mockPrisma.checklistQuestion.findMany.mockResolvedValue([]);
      await service.checklists('hvac_unit');
      expect(mockPrisma.checklistQuestion.findMany).toHaveBeenCalledWith({
        where: { itemType: 'hvac_unit' },
        orderBy: { order: 'asc' },
      });
    });
  });

  describe('problemCodes', () => {
    it('returns problem codes ordered by code', async () => {
      mockPrisma.problemCode.findMany.mockResolvedValue([
        { code: 'MECH', description: 'Mechanical failure' },
        { code: 'ELEC', description: 'Electrical fault' },
      ]);
      const result = await service.problemCodes();
      expect(mockPrisma.problemCode.findMany).toHaveBeenCalledWith({ orderBy: { code: 'asc' } });
      expect(result).toHaveLength(2);
    });
  });

  describe('causeCodes', () => {
    it('returns cause codes ordered by code', async () => {
      mockPrisma.causeCode.findMany.mockResolvedValue([{ code: 'COMP', description: 'Component failure' }]);
      const result = await service.causeCodes();
      expect(mockPrisma.causeCode.findMany).toHaveBeenCalledWith({ orderBy: { code: 'asc' } });
      expect(result).toHaveLength(1);
    });
  });

  describe('repairCodes', () => {
    it('returns repair codes ordered by code', async () => {
      mockPrisma.repairCode.findMany.mockResolvedValue([{ code: 'REPL', description: 'Part replaced' }]);
      const result = await service.repairCodes();
      expect(mockPrisma.repairCode.findMany).toHaveBeenCalledWith({ orderBy: { code: 'asc' } });
      expect(result).toHaveLength(1);
    });
  });

  describe('resolveCodes', () => {
    it('returns resolve codes ordered by code', async () => {
      mockPrisma.resolveCode.findMany.mockResolvedValue([{ code: 'FULL', description: 'Fully resolved' }]);
      const result = await service.resolveCodes();
      expect(mockPrisma.resolveCode.findMany).toHaveBeenCalledWith({ orderBy: { code: 'asc' } });
      expect(result).toHaveLength(1);
    });
  });

  describe('rejectionCodes', () => {
    it('returns rejection codes ordered by code', async () => {
      mockPrisma.rejectionCode.findMany.mockResolvedValue([
        { code: 'NOAC', description: 'No access to site' },
        { code: 'DUPL', description: 'Duplicate job' },
      ]);
      const result = await service.rejectionCodes();
      expect(mockPrisma.rejectionCode.findMany).toHaveBeenCalledWith({ orderBy: { code: 'asc' } });
      expect(result).toHaveLength(2);
    });
  });
});
