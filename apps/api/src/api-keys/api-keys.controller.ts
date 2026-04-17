import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiKeysService } from './api-keys.service';
import type { User } from '@prisma/client';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
@Roles('admin')
export class ApiKeysController {
  constructor(private readonly service: ApiKeysService) {}

  @Post()
  create(@Body() body: { name: string; scopes: string[]; expiresAt?: string }, @CurrentUser() user: User) {
    return this.service.create(body, user);
  }

  @Get()
  list() {
    return this.service.list();
  }

  @Get(':id/usage')
  usage(@Param('id') id: string, @Query('page') page?: string) {
    return this.service.usage(id, page ? Number(page) : 1);
  }

  @Patch(':id/suspend')
  suspend(@Param('id') id: string) {
    return this.service.suspend(id);
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.service.activate(id);
  }

  @Delete(':id')
  revoke(@Param('id') id: string) {
    return this.service.revoke(id);
  }
}
