import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { User } from '@prisma/client';
import type { CreateShipmentDto, UpdateShipmentStatusDto } from '@veritek/validators';

@Injectable()
export class ShippingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateShipmentDto, user: User) {
    return this.prisma.shipment.create({
      data: {
        userId: user.id,
        siteId: dto.siteId,
        destinationId: dto.destinationId,
        shipLines: {
          create: dto.lines.map((line) => ({
            productId: line.productId,
            qty: line.qty,
            ...(line.serialNumber !== undefined ? { serialNumber: line.serialNumber } : {}),
          })),
        },
      },
      include: { shipLines: { include: { product: true } } },
    });
  }

  async list(user: User) {
    return this.prisma.shipment.findMany({
      where: { userId: user.id },
      include: { shipLines: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string, user: User) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: {
        shipLines: { include: { product: true } },
        site: true,
        destination: true,
      },
    });
    if (!shipment) throw new NotFoundException('Shipment not found');
    if (shipment.userId !== user.id) throw new ForbiddenException();
    return shipment;
  }

  async updateStatus(id: string, dto: UpdateShipmentStatusDto, user: User) {
    const shipment = await this.prisma.shipment.findUnique({ where: { id } });
    if (!shipment) throw new NotFoundException('Shipment not found');
    if (shipment.userId !== user.id) throw new ForbiddenException();
    if (shipment.status === 'collected' || shipment.status === 'cancelled') {
      throw new BadRequestException('Shipment is already finalised');
    }

    return this.prisma.shipment.update({
      where: { id },
      data: { status: dto.status as any },
      include: { shipLines: { include: { product: true } } },
    });
  }

  async removeLine(shipmentId: string, lineId: string, user: User) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { shipLines: true },
    });
    if (!shipment) throw new NotFoundException('Shipment not found');
    if (shipment.userId !== user.id) throw new ForbiddenException();
    if (shipment.status !== 'pending') {
      throw new BadRequestException('Can only remove lines from pending shipments');
    }

    const line = shipment.shipLines.find((l) => l.id === lineId);
    if (!line) throw new NotFoundException('Ship line not found');

    await this.prisma.shipLine.delete({ where: { id: lineId } });
    return { success: true };
  }
}
