import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ShippingService } from './shipping.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CreateShipmentSchema, UpdateShipmentStatusSchema } from '@veritek/validators';
import type { User } from '@prisma/client';

@Controller('shipping')
@UseGuards(JwtAuthGuard)
export class ShippingController {
  constructor(private readonly service: ShippingService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(CreateShipmentSchema, 'body'))
  create(@Body() body: unknown, @CurrentUser() user: User) {
    return this.service.create(body as any, user);
  }

  @Get()
  list(@CurrentUser() user: User) {
    return this.service.list(user);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.get(id, user);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(UpdateShipmentStatusSchema, 'body'))
  updateStatus(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: User,
  ) {
    return this.service.updateStatus(id, body as any, user);
  }

  @Delete(':id/lines/:lineId')
  removeLine(
    @Param('id') id: string,
    @Param('lineId') lineId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.removeLine(id, lineId, user);
  }
}
