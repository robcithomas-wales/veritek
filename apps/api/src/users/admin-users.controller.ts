import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminUsersService } from './admin-users.service';
import type { User } from '@prisma/client';

@Controller('admin/users')
@UseGuards(JwtAuthGuard)
@Roles('dispatcher', 'admin')
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  @Get('me')
  me(@CurrentUser() user: User) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    };
  }

  @Get('warehouses')
  warehouses() {
    return this.service.warehouses();
  }

  @Get()
  list(@Query() query: { role?: string }) {
    return this.service.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.getDetail(id);
  }

  @Post()
  create(
    @Body() dto: { email: string; firstName: string; lastName: string; role: string; warehouseId?: string },
  ) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: { firstName?: string; lastName?: string; role?: string; warehouseId?: string | null },
  ) {
    return this.service.update(id, dto);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id);
  }
}
