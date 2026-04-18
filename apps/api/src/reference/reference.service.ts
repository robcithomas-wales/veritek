import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReferenceService {
  constructor(private readonly prisma: PrismaService) {}

  stopCodes() {
    return this.prisma.stopCode.findMany({ orderBy: { code: 'asc' } });
  }

  deliveryTypes() {
    return this.prisma.deliveryType.findMany({ orderBy: { name: 'asc' } });
  }

  checklists(itemType: string) {
    return this.prisma.checklistQuestion.findMany({
      where: { itemType },
      orderBy: { order: 'asc' },
    });
  }

  problemCodes() {
    return this.prisma.problemCode.findMany({ orderBy: { code: 'asc' } });
  }

  causeCodes() {
    return this.prisma.causeCode.findMany({ orderBy: { code: 'asc' } });
  }

  repairCodes() {
    return this.prisma.repairCode.findMany({ orderBy: { code: 'asc' } });
  }

  resolveCodes() {
    return this.prisma.resolveCode.findMany({ orderBy: { code: 'asc' } });
  }

  rejectionCodes() {
    return this.prisma.rejectionCode.findMany({ orderBy: { code: 'asc' } });
  }
}
