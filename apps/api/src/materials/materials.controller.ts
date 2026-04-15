import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MaterialsService } from './materials.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CreateMaterialSchema, UpdateMaterialSchema } from '@veritek/validators';
import type { User } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard)
export class MaterialsController {
  constructor(private readonly materials: MaterialsService) {}

  @Get('service-orders/:id/materials')
  list(@Param('id') serviceOrderId: string, @CurrentUser() user: User) {
    return this.materials.listForOrder(serviceOrderId, user.id);
  }

  @Post('service-orders/:id/materials')
  @UsePipes(new ZodValidationPipe(CreateMaterialSchema, 'body'))
  create(
    @Param('id') serviceOrderId: string,
    @Body() body: unknown,
    @CurrentUser() user: User,
  ) {
    return this.materials.create(serviceOrderId, body as any, user);
  }

  @Patch('materials/:id')
  @UsePipes(new ZodValidationPipe(UpdateMaterialSchema, 'body'))
  update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: User,
  ) {
    return this.materials.update(id, body as any, user);
  }
}
