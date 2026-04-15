import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  @Get('me')
  me(@CurrentUser() user: User) {
    return user;
  }
}
