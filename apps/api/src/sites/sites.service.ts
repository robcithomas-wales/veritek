import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SitesService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const site = await this.prisma.site.findUnique({ where: { id } });
    if (!site) throw new NotFoundException('Site not found');
    return site;
  }

  async list(query: { search?: string }) {
    const where = query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' as const } },
            { postcode: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    return this.prisma.site.findMany({ where, orderBy: { name: 'asc' } });
  }

  async create(dto: { name: string; address?: string; postcode?: string }) {
    return this.prisma.site.create({ data: dto });
  }

  async update(id: string, dto: { name?: string; address?: string; postcode?: string }) {
    const site = await this.prisma.site.findUnique({ where: { id } });
    if (!site) throw new NotFoundException('Site not found');
    return this.prisma.site.update({ where: { id }, data: dto });
  }
}
