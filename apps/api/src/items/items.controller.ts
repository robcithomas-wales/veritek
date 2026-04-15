import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ItemsService } from './items.service';
import type { User } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard)
export class ItemsController {
  constructor(private readonly items: ItemsService) {}

  @Get('service-orders/:id/items')
  list(@Param('id') serviceOrderId: string, @CurrentUser() user: User) {
    return this.items.listForOrder(serviceOrderId, user.id);
  }
}
