import { Controller, Get, Post, Body, Query, UseGuards, UsePipes } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InventoryService } from './inventory.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import {
  AdjustStockSchema,
  SearchInventorySchema,
  TransferStockSchema,
} from '@veritek/validators';
import type { User } from '@prisma/client';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get('van-stock')
  vanStock(@CurrentUser() user: User) {
    return this.service.vanStock(user);
  }

  @Get('search')
  @UsePipes(new ZodValidationPipe(SearchInventorySchema, 'query'))
  search(@Query() query: unknown, @CurrentUser() user: User) {
    return this.service.search(query as any, user);
  }

  @Post('adjust')
  @UsePipes(new ZodValidationPipe(AdjustStockSchema, 'body'))
  adjust(@Body() body: unknown, @CurrentUser() user: User) {
    return this.service.adjust(body as any, user);
  }

  @Post('transfer')
  @UsePipes(new ZodValidationPipe(TransferStockSchema, 'body'))
  transfer(@Body() body: unknown, @CurrentUser() user: User) {
    return this.service.transfer(body as any, user);
  }

  @Get('warehouses')
  warehouses() {
    return this.service.warehouses();
  }
}
