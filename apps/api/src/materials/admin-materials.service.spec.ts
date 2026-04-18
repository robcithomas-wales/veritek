import { Test } from '@nestjs/testing';
import { AdminMaterialsService } from './admin-materials.service';
import { PrismaService } from '../prisma/prisma.service';

const mockMaterial = {
  id: 'mat-1',
  qty: 2,
  status: 'fulfilled',
  disposition: 'open',
  returnable: false,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  product: { id: 'prod-1', sku: 'CAP-40', name: 'Capacitor 40µF' },
  serviceOrder: {
    id: 'order-1',
    reference: 'SO-2025-0001',
    status: 'completed',
    site: { name: 'Manchester Depot' },
    assignedTo: { id: 'user-1', firstName: 'John', lastName: 'Smith' },
  },
  returnProduct: null,
};

const mockPrisma = {
  material: {
    findMany: jest.fn(),
  },
};

describe('AdminMaterialsService', () => {
  let service: AdminMaterialsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AdminMaterialsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(AdminMaterialsService);
  });

  describe('listAll', () => {
    it('returns all materials when no filters are applied', async () => {
      mockPrisma.material.findMany.mockResolvedValue([mockMaterial]);
      const result = await service.listAll({});
      expect(result).toHaveLength(1);
      expect(result[0]!.qty).toBe(2);
    });

    it('applies status filter', async () => {
      mockPrisma.material.findMany.mockResolvedValue([]);
      await service.listAll({ status: 'back_ordered' });
      const where = mockPrisma.material.findMany.mock.calls[0][0].where;
      expect(where.status).toBe('back_ordered');
    });

    it('applies serviceOrderId filter', async () => {
      mockPrisma.material.findMany.mockResolvedValue([]);
      await service.listAll({ serviceOrderId: 'order-1' });
      const where = mockPrisma.material.findMany.mock.calls[0][0].where;
      expect(where.serviceOrderId).toBe('order-1');
    });

    it('applies engineerId filter via nested serviceOrder', async () => {
      mockPrisma.material.findMany.mockResolvedValue([]);
      await service.listAll({ engineerId: 'user-1' });
      const where = mockPrisma.material.findMany.mock.calls[0][0].where;
      expect(where.serviceOrder.assignedToId).toBe('user-1');
    });

    it('applies date range filter via nested serviceOrder', async () => {
      mockPrisma.material.findMany.mockResolvedValue([]);
      await service.listAll({ from: '2025-01-01', to: '2025-12-31' });
      const where = mockPrisma.material.findMany.mock.calls[0][0].where;
      expect(where.serviceOrder.createdAt.gte).toEqual(new Date('2025-01-01'));
      expect(where.serviceOrder.createdAt.lte).toEqual(new Date('2025-12-31'));
    });

    it('maps engineer name from first and last name', async () => {
      mockPrisma.material.findMany.mockResolvedValue([mockMaterial]);
      const [first] = await service.listAll({});
      expect(first!.serviceOrder.engineerName).toBe('John Smith');
    });

    it('returns null engineerName when no engineer is assigned', async () => {
      const unassigned = {
        ...mockMaterial,
        serviceOrder: { ...mockMaterial.serviceOrder, assignedTo: null },
      };
      mockPrisma.material.findMany.mockResolvedValue([unassigned]);
      const [first] = await service.listAll({});
      expect(first!.serviceOrder.engineerName).toBeNull();
    });

    it('returns null returnReason when no return product exists', async () => {
      mockPrisma.material.findMany.mockResolvedValue([mockMaterial]);
      const [first] = await service.listAll({});
      expect(first!.returnReason).toBeNull();
    });
  });
});
