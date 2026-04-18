import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
  RejectServiceOrderWithCodeSchema,
  CompleteServiceOrderSchema,
  AddAttachmentSchema,
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

  @Post(':id/complete')
  @UsePipes(new ZodValidationPipe(CompleteServiceOrderSchema, 'body'))
  complete(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() body: unknown,
  ) {
    return this.serviceOrders.complete(id, user.id, body as any);
  }

  @Post(':id/attachments')
  @UsePipes(new ZodValidationPipe(AddAttachmentSchema, 'body'))
  addAttachment(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() body: unknown,
  ) {
    return this.serviceOrders.addAttachment(id, user.id, body as any);
  }

  @Patch(':id/reject')
  @UsePipes(new ZodValidationPipe(RejectServiceOrderWithCodeSchema, 'body'))
  reject(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() body: unknown,
  ) {
    return this.serviceOrders.reject(id, user, body as any);
  }
}
