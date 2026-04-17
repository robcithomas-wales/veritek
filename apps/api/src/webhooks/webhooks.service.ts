import { Injectable, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: { name: string; endpointUrl: string; eventTypes: string[] }) {
    const rawSecret = crypto.randomBytes(32).toString('hex');
    const secretHash = crypto.createHash('sha256').update(rawSecret).digest('hex');

    const subscription = await this.prisma.webhookSubscription.create({
      data: {
        name: dto.name,
        endpointUrl: dto.endpointUrl,
        eventTypes: dto.eventTypes,
        secretHash,
      },
    });

    return { ...subscription, secret: rawSecret };
  }

  async list() {
    const subs = await this.prisma.webhookSubscription.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        deliveries: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { status: true },
        },
      },
    });

    return subs.map((s) => ({
      id: s.id,
      name: s.name,
      endpointUrl: s.endpointUrl,
      eventTypes: s.eventTypes,
      isActive: s.isActive,
      lastDeliveryStatus: s.deliveries[0]?.status ?? null,
      createdAt: s.createdAt.toISOString(),
    }));
  }

  async getDetail(id: string) {
    const sub = await this.prisma.webhookSubscription.findUnique({
      where: { id },
      include: {
        deliveries: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!sub) throw new NotFoundException('Webhook subscription not found');
    return sub;
  }

  async update(id: string, dto: { endpointUrl?: string; eventTypes?: string[]; isActive?: boolean }) {
    const sub = await this.prisma.webhookSubscription.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('Webhook subscription not found');
    return this.prisma.webhookSubscription.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const sub = await this.prisma.webhookSubscription.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('Webhook subscription not found');
    await this.prisma.webhookSubscription.update({ where: { id }, data: { isActive: false } });
    return { success: true };
  }

  async retryDelivery(subscriptionId: string, deliveryId: string) {
    const delivery = await this.prisma.webhookDelivery.findUnique({ where: { id: deliveryId } });
    if (!delivery || delivery.subscriptionId !== subscriptionId) {
      throw new NotFoundException('Delivery not found');
    }
    await this.prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: { status: 'pending', nextRetryAt: new Date(), attempts: 0 },
    });
    return { success: true };
  }

  @OnEvent('*')
  async handleDomainEvent(payload: Record<string, unknown>, eventType: string) {
    const subscriptions = await this.prisma.webhookSubscription.findMany({
      where: { isActive: true, eventTypes: { has: eventType } },
    });

    if (!subscriptions.length) return;

    await this.prisma.webhookDelivery.createMany({
      data: subscriptions.map((s) => ({
        subscriptionId: s.id,
        eventType,
        payload: payload as any,
        status: 'pending',
        nextRetryAt: new Date(),
      })),
    });
  }
}
