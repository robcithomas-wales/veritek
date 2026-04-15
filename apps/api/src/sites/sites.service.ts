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
}
