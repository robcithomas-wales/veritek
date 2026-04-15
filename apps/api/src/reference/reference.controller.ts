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
}
