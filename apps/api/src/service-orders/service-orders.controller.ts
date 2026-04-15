import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ServiceOrdersService } from './service-orders.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import {
  RejectServiceOrderSchema,
  ServiceOrderHistoryQuerySchema,
} from '@veritek/validators';
import type { User } from '@prisma/client';

@Controller('service-orders')
@UseGuards(JwtAuthGuard)
export class ServiceOrdersController {
  constructor(private readonly serviceOrders: ServiceOrdersService) {}

  @Get()
  workList(@CurrentUser() user: User) {
    return this.serviceOrders.workList(user);
  }

  @Get('history')
  @UsePipes(new ZodValidationPipe(ServiceOrderHistoryQuerySchema, 'query'))
  history(@CurrentUser() user: User, @Query() query: unknown) {
    return this.serviceOrders.history(user.id, query as any);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: User) {
    return this.serviceOrders.findById(id, user.id);
  }

  @Patch(':id/accept')
  accept(@Param('id') id: string, @CurrentUser() user: User) {
    return this.serviceOrders.accept(id, user);
  }

  @Patch(':id/reject')
  @UsePipes(new ZodValidationPipe(RejectServiceOrderSchema, 'body'))
  reject(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() body: unknown,
  ) {
    return this.serviceOrders.reject(id, user, body as any);
  }
}
