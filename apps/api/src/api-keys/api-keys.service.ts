import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { User } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: { name: string; scopes: string[]; expiresAt?: string }, user: User) {
    const plaintext = `vk_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto
      .createHmac('sha256', process.env.API_KEY_HASH_SECRET ?? '')
      .update(plaintext)
      .digest('hex');

    const key = await this.prisma.apiKey.create({
      data: {
        name: dto.name,
        keyHash,
        scopes: dto.scopes,
        createdById: user.id,
      },
    });

    return { ...this.toSummary(key), plaintext };
  }

  async list() {
    const keys = await this.prisma.apiKey.findMany({
      where: { deletedAt: null },
      include: {
        usage: {
          orderBy: { timestamp: 'desc' },
          take: 1,
          select: { timestamp: true },
        },
        _count: { select: { usage: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return keys.map((k) => ({
      ...this.toSummary(k),
      lastUsedAt: k.usage[0]?.timestamp?.toISOString() ?? null,
      requestCount: k._count.usage,
    }));
  }

  async usage(id: string, page = 1, pageSize = 50) {
    const key = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!key) throw new NotFoundException('API key not found');

    const [data, total] = await Promise.all([
      this.prisma.apiKeyUsage.findMany({
        where: { apiKeyId: id },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.apiKeyUsage.count({ where: { apiKeyId: id } }),
    ]);

    return { data, total };
  }

  async suspend(id: string) {
    const key = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!key) throw new NotFoundException('API key not found');
    return this.prisma.apiKey.update({ where: { id }, data: { isActive: false } });
  }

  async activate(id: string) {
    const key = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!key) throw new NotFoundException('API key not found');
    return this.prisma.apiKey.update({ where: { id }, data: { isActive: true } });
  }

  async revoke(id: string) {
    const key = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!key) throw new NotFoundException('API key not found');
    await this.prisma.apiKey.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    return { success: true };
  }

  private toSummary(k: { id: string; name: string; scopes: string[]; isActive: boolean; createdAt: Date }) {
    return {
      id: k.id,
      name: k.name,
      scopes: k.scopes,
      isActive: k.isActive,
      createdAt: k.createdAt.toISOString(),
    };
  }
}
