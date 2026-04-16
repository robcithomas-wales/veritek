import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { User } from '@prisma/client';
import * as apn from 'apn';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private apnProvider: apn.Provider | null = null;
  private fcmReady = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    this.initApns();
    this.initFcm();
    this.logger.log('Notifications service ready');
  }

  private initApns() {
    const keyId = this.config.get<string>('APNS_KEY_ID');
    const teamId = this.config.get<string>('APNS_TEAM_ID');
    const privateKey = this.config.get<string>('APNS_PRIVATE_KEY');

    if (!keyId || !teamId || !privateKey) {
      this.logger.warn('APNs env vars not set — iOS push notifications disabled');
      return;
    }

    this.apnProvider = new apn.Provider({
      token: {
        key: Buffer.from(privateKey.replace(/\\n/g, '\n')),
        keyId,
        teamId,
      },
      production: this.config.get('NODE_ENV') === 'production',
    });
  }

  private initFcm() {
    const serverKey = this.config.get<string>('FCM_SERVER_KEY');
    if (!serverKey) {
      this.logger.warn('FCM_SERVER_KEY not set — Android push notifications disabled');
      return;
    }

    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(JSON.parse(serverKey)) });
    }
    this.fcmReady = true;
  }

  @OnEvent('job.assigned')
  handleJobAssigned(payload: Record<string, unknown>) {
    const userId = payload['userId'] as string;
    const serviceOrderId = payload['serviceOrderId'] as string;
    this.sendToUser(userId, 'New job assigned', 'You have a new job on your work list.', {
      type: 'job.assigned',
      serviceOrderId,
    }).catch((err) => this.logger.error('Push notification failed', err));
  }

  async registerToken(dto: { token: string; platform: 'ios' | 'android' }, user: User) {
    await this.prisma.deviceToken.upsert({
      where: { token: dto.token },
      update: { userId: user.id, platform: dto.platform },
      create: { userId: user.id, token: dto.token, platform: dto.platform },
    });
    return { success: true };
  }

  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    const tokens = await this.prisma.deviceToken.findMany({ where: { userId } });
    if (!tokens.length) return;

    for (const deviceToken of tokens) {
      try {
        if (deviceToken.platform === 'ios') {
          await this.sendApns(deviceToken.token, title, body, data);
        } else {
          await this.sendFcm(deviceToken.token, title, body, data);
        }
      } catch (err) {
        this.logger.warn(`Failed to send push to token ${deviceToken.id}: ${err}`);
      }
    }
  }

  private async sendApns(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    if (!this.apnProvider) return;

    const note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600;
    note.badge = 1;
    note.sound = 'default';
    note.alert = { title, body };
    note.topic = 'com.veritek.fieldservice';
    if (data) note.payload = data;

    const result = await this.apnProvider.send(note, token);
    const failed = result.failed[0];
    if (failed) {
      this.logger.warn(`APNs delivery failed: ${JSON.stringify(failed.response)}`);
    }
  }

  private async sendFcm(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    if (!this.fcmReady) return;

    await admin.messaging().send({
      token,
      notification: { title, body },
      ...(data ? { data } : {}),
      android: { priority: 'high' },
    });
  }
}
