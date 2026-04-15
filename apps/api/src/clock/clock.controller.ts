import { Controller, Post, Get, Body, UseGuards, UsePipes } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ClockService } from './clock.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ClockEventSchema } from '@veritek/validators';
import type { User } from '@prisma/client';

@Controller('clock')
@UseGuards(JwtAuthGuard)
export class ClockController {
  constructor(private readonly clock: ClockService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(ClockEventSchema, 'body'))
  record(@Body() body: unknown, @CurrentUser() user: User) {
    return this.clock.record(body as any, user);
  }

  @Get('today')
  today(@CurrentUser() user: User) {
    return this.clock.today(user);
  }
}
