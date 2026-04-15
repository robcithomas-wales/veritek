import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChecklistsService {
  constructor(private readonly prisma: PrismaService) {}

  findByItemType(itemType: string) {
    return this.prisma.checklistQuestion.findMany({
      where: { itemType },
      orderBy: { order: 'asc' },
    });
  }
}
