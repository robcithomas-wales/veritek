import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import type { User } from '@prisma/client';
import type { CreateMaterialDto, UpdateMaterialDto } from '@veritek/validators';

@Injectable()
export class MaterialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  async listForOrder(serviceOrderId: string, userId: string) {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id: serviceOrderId },
    });
    if (!order || order.assignedToId !== userId) {
      throw new NotFoundException('Service order not found');
    }
    return this.prisma.material.findMany({
      where: { serviceOrderId },
      include: { product: true, returnProduct: true },
    });
  }

  async create(serviceOrderId: string, dto: CreateMaterialDto, user: User) {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id: serviceOrderId },
    });
    if (!order || order.assignedToId !== user.id) {
      throw new NotFoundException('Service order not found');
    }
    const material = await this.prisma.material.create({
      data: {
        serviceOrderId,
        productId: dto.productId,
        qty: dto.qty,
        returnable: dto.returnable,
      },
      include: { product: true },
    });
    this.events.emit('part.ordered', {
      orderId: serviceOrderId,
      productId: dto.productId,
      qty: dto.qty,
    });
    return material;
  }

  async update(id: string, dto: UpdateMaterialDto, user: User) {
    const material = await this.prisma.material.findUnique({
      where: { id },
      include: { serviceOrder: true },
    });
    if (!material) throw new NotFoundException('Material not found');
    if (material.serviceOrder.assignedToId !== user.id) {
      throw new NotFoundException('Material not found');
    }

    const data: Record<string, unknown> = {};
    if (dto.status) data['status'] = dto.status as any;
    if (dto.disposition) data['disposition'] = dto.disposition as any;

    const updated = await this.prisma.material.update({
      where: { id },
      data,
      include: { product: true, returnProduct: true },
    });

    // Create return product record if marking for return
    if (dto.returnReason && dto.returnWarehouseId) {
      await this.prisma.returnProduct.upsert({
        where: { materialId: id },
        create: {
          materialId: id,
          reason: dto.returnReason,
          warehouseId: dto.returnWarehouseId,
        },
        update: {
          reason: dto.returnReason,
          warehouseId: dto.returnWarehouseId,
        },
      });
      this.events.emit('part.returned', {
        orderId: material.serviceOrderId,
        materialId: id,
        returnReason: dto.returnReason,
        warehouseId: dto.returnWarehouseId,
      });
    }

    if (dto.status === 'fulfilled') {
      this.events.emit('part.fitted', {
        orderId: material.serviceOrderId,
        materialId: id,
        productId: material.productId,
      });
    }

    return updated;
  }
}
