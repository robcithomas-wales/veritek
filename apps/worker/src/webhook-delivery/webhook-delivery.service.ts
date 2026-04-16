import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

// Retry delays in milliseconds: 30s, 2min, 10min, 1h, 4h
const RETRY_DELAYS = [30_000, 120_000, 600_000, 3_600_000, 14_400_000];
const MAX_ATTEMPTS = 5;

@Injectable()
export class WebhookDeliveryService {
  private readonly logger = new Logger(WebhookDeliveryService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async processPending() {
    const due = await this.prisma.webhookDelivery.findMany({
      where: {
        status: 'pending',
        nextRetryAt: { lte: new Date() },
      },
      include: { subscription: true },
      take: 50,
      orderBy: { createdAt: 'asc' },
    });

    if (!due.length) return;

    this.logger.log(`Processing ${due.length} webhook deliveries`);

    await Promise.allSettled(due.map((delivery) => this.attempt(delivery)));
  }

  private async attempt(delivery: {
    id: string;
    attempts: number;
    payload: unknown;
    eventType: string;
    subscription: { endpointUrl: string; secretHash: string; id: string };
  }) {
    const body = JSON.stringify({
      id: delivery.id,
      event: delivery.eventType,
      payload: delivery.payload,
      timestamp: new Date().toISOString(),
    });

    const signature = crypto
      .createHmac('sha256', delivery.subscription.secretHash)
      .update(body)
      .digest('hex');

    let responseCode: number | null = null;
    let responseBody: string | null = null;
    let succeeded = false;

    try {
      const res = await fetch(delivery.subscription.endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Veritek-Signature': `sha256=${signature}`,
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });

      responseCode = res.status;
      responseBody = await res.text().catch(() => null);
      succeeded = res.ok;
    } catch (err) {
      responseBody = String(err);
    }

    const newAttempts = delivery.attempts + 1;

    if (succeeded) {
      await this.prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: { status: 'delivered', attempts: newAttempts, responseCode, responseBody },
      });
      return;
    }

    if (newAttempts >= MAX_ATTEMPTS) {
      await this.prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: { status: 'dead', attempts: newAttempts, responseCode, responseBody },
      });
      this.logger.warn(`Delivery ${delivery.id} marked dead after ${newAttempts} attempts`);
      return;
    }

    const delay = RETRY_DELAYS[newAttempts - 1] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1];
    const nextRetryAt = new Date(Date.now() + delay);

    await this.prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: 'failed',
        attempts: newAttempts,
        responseCode,
        responseBody,
        nextRetryAt,
      },
    });
  }
}
