import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForOrder(serviceOrderId: string, userId: string) {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id: serviceOrderId },
    });
    if (!order || order.assignedToId !== userId) {
      throw new NotFoundException('Service order not found');
    }
    return this.prisma.item.findMany({
      where: { serviceOrderId },
      include: { product: true },
    });
  }
}
