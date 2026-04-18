import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReferenceService } from './reference.service';

@Controller('reference')
@UseGuards(JwtAuthGuard)
export class ReferenceController {
  constructor(private readonly reference: ReferenceService) {}

  @Get('stop-codes')
  stopCodes() {
    return this.reference.stopCodes();
  }

  @Get('delivery-types')
  deliveryTypes() {
    return this.reference.deliveryTypes();
  }

  @Get('checklists')
  checklists(@Query('itemType') itemType: string) {
    return this.reference.checklists(itemType);
  }

  @Get('problem-codes')
  problemCodes() {
    return this.reference.problemCodes();
  }

  @Get('cause-codes')
  causeCodes() {
    return this.reference.causeCodes();
  }

  @Get('repair-codes')
  repairCodes() {
    return this.reference.repairCodes();
  }

  @Get('resolve-codes')
  resolveCodes() {
    return this.reference.resolveCodes();
  }

  @Get('rejection-codes')
  rejectionCodes() {
    return this.reference.rejectionCodes();
  }
}
