import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminMaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  async listAll(query: {
    status?: string;
    engineerId?: string;
    serviceOrderId?: string;
    from?: string;
    to?: string;
  }) {
    const where: any = {};

    if (query.status) where.status = query.status;
    if (query.serviceOrderId) where.serviceOrderId = query.serviceOrderId;

    if (query.engineerId || query.from || query.to) {
      where.serviceOrder = {};
      if (query.engineerId) where.serviceOrder.assignedToId = query.engineerId;
      if (query.from || query.to) {
        where.serviceOrder.createdAt = {};
        if (query.from) where.serviceOrder.createdAt.gte = new Date(query.from);
        if (query.to) where.serviceOrder.createdAt.lte = new Date(query.to);
      }
    }

    const materials = await this.prisma.material.findMany({
      where,
      include: {
        product: { select: { id: true, sku: true, name: true } },
        serviceOrder: {
          select: {
            id: true,
            reference: true,
            status: true,
            site: { select: { name: true } },
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        returnProduct: { select: { reason: true } },
      },
      orderBy: [{ serviceOrder: { reference: 'asc' } }, { createdAt: 'asc' }],
    });

    return materials.map((m) => ({
      id: m.id,
      qty: m.qty,
      status: m.status,
      disposition: m.disposition,
      returnable: m.returnable,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      product: m.product,
      returnReason: (m.returnProduct as any)?.reason ?? null,
      serviceOrder: {
        id: (m.serviceOrder as any).id,
        reference: (m.serviceOrder as any).reference,
        status: (m.serviceOrder as any).status,
        siteName: (m.serviceOrder as any).site?.name ?? null,
        engineerName: (m.serviceOrder as any).assignedTo
          ? `${(m.serviceOrder as any).assignedTo.firstName} ${(m.serviceOrder as any).assignedTo.lastName}`
          : null,
      },
    }));
  }
}
