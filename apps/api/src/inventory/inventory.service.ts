import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { User } from '@prisma/client';
import type { AdjustStockDto, SearchInventoryDto, TransferStockDto } from '@veritek/validators';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async vanStock(user: User) {
    return this.prisma.stockItem.findMany({
      where: { userId: user.id },
      include: { product: true },
      orderBy: { product: { name: 'asc' } },
    });
  }

  async search(dto: SearchInventoryDto, user: User) {
    const where = {
      userId: user.id,
      ...(dto.warehouseId ? { warehouseId: dto.warehouseId } : {}),
      ...(dto.query
        ? {
            product: {
              OR: [
                { name: { contains: dto.query, mode: 'insensitive' as const } },
                { sku: { contains: dto.query, mode: 'insensitive' as const } },
              ],
            },
          }
        : {}),
    };

    return this.prisma.stockItem.findMany({
      where,
      include: { product: true },
      orderBy: { product: { name: 'asc' } },
    });
  }

  async adjust(dto: AdjustStockDto, user: User) {
    const item = await this.prisma.stockItem.findFirst({
      where: { userId: user.id, productId: dto.productId },
    });

    if (!item) throw new NotFoundException('Stock item not found');

    const newQty = item.qty + dto.delta;
    if (newQty < 0) throw new BadRequestException('Adjustment would result in negative stock');

    await this.prisma.stockItem.update({
      where: { id: item.id },
      data: { qty: newQty },
    });

    return this.prisma.stockAdjustment.create({
      data: {
        userId: user.id,
        productId: dto.productId,
        delta: dto.delta,
        reason: dto.reason,
      },
    });
  }

  async transfer(dto: TransferStockDto, user: User) {
    const fromItem = await this.prisma.stockItem.findFirst({
      where: { userId: user.id, productId: dto.productId },
    });

    if (!fromItem) throw new NotFoundException('Stock item not found');
    if (fromItem.qty < dto.qty) throw new BadRequestException('Insufficient stock to transfer');

    const toEngineer = await this.prisma.user.findUnique({ where: { id: dto.toEngineerId } });
    if (!toEngineer) throw new NotFoundException('Target engineer not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.stockItem.update({
        where: { id: fromItem.id },
        data: { qty: fromItem.qty - dto.qty },
      });

      const existing = await tx.stockItem.findFirst({
        where: { userId: dto.toEngineerId, productId: dto.productId },
      });

      if (existing) {
        await tx.stockItem.update({
          where: { id: existing.id },
          data: { qty: existing.qty + dto.qty },
        });
      } else {
        await tx.stockItem.create({
          data: {
            userId: dto.toEngineerId,
            warehouseId: fromItem.warehouseId,
            productId: dto.productId,
            qty: dto.qty,
          },
        });
      }
    });

    return { success: true };
  }

  async warehouses() {
    return this.prisma.warehouse.findMany({ orderBy: { name: 'asc' } });
  }
}
