import { Controller, Post, Body, UseGuards, UsePipes } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SyncService } from './sync.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { SyncRequestSchema } from '@veritek/validators';
import type { User } from '@prisma/client';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly sync: SyncService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(SyncRequestSchema, 'body'))
  flush(@Body() body: unknown, @CurrentUser() user: User) {
    return this.sync.flush(body as any, user);
  }
}
