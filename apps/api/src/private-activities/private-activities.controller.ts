import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrivateActivitiesService } from './private-activities.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import {
  CreatePrivateActivitySchema,
  CompletePrivateActivitySchema,
  ListPrivateActivitiesSchema,
} from '@veritek/validators';
import type { User } from '@prisma/client';

@Controller('private-activities')
@UseGuards(JwtAuthGuard)
export class PrivateActivitiesController {
  constructor(private readonly service: PrivateActivitiesService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(CreatePrivateActivitySchema, 'body'))
  create(@Body() body: unknown, @CurrentUser() user: User) {
    return this.service.create(body as any, user);
  }

  @Get()
  @UsePipes(new ZodValidationPipe(ListPrivateActivitiesSchema, 'query'))
  list(@Query() query: unknown, @CurrentUser() user: User) {
    return this.service.list(query as any, user);
  }

  @Patch(':id/complete')
  @UsePipes(new ZodValidationPipe(CompletePrivateActivitySchema, 'body'))
  complete(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: User,
  ) {
    return this.service.complete(id, body as any, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.remove(id, user);
  }
}
