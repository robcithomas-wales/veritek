import { Test } from '@nestjs/testing';
import { ChecklistsService } from './checklists.service';
import { PrismaService } from '../prisma/prisma.service';

const mockQuestions = [
  { id: 'q-1', itemType: 'hvac_unit', question: 'Is the unit clean?', order: 1 },
  { id: 'q-2', itemType: 'hvac_unit', question: 'Are filters replaced?', order: 2 },
];

const mockPrisma = {
  checklistQuestion: {
    findMany: jest.fn(),
  },
};

describe('ChecklistsService', () => {
  let service: ChecklistsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ChecklistsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ChecklistsService);
  });

  describe('findByItemType', () => {
    it('queries checklist questions filtered by item type', async () => {
      mockPrisma.checklistQuestion.findMany.mockResolvedValue(mockQuestions);
      await service.findByItemType('hvac_unit');
      expect(mockPrisma.checklistQuestion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { itemType: 'hvac_unit' } }),
      );
    });

    it('orders questions by their order field ascending', async () => {
      mockPrisma.checklistQuestion.findMany.mockResolvedValue(mockQuestions);
      await service.findByItemType('hvac_unit');
      expect(mockPrisma.checklistQuestion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { order: 'asc' } }),
      );
    });

    it('returns an empty array when no questions exist for the item type', async () => {
      mockPrisma.checklistQuestion.findMany.mockResolvedValue([]);
      const result = await service.findByItemType('unknown_type');
      expect(result).toEqual([]);
    });
  });
});
