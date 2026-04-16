import { Controller, Post, Body, UseGuards, UsePipes } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { z } from 'zod';
import type { User } from '@prisma/client';

const RegisterTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['ios', 'android']),
});

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(RegisterTokenSchema, 'body'))
  register(@Body() body: unknown, @CurrentUser() user: User) {
    return this.service.registerToken(body as any, user);
  }
}
