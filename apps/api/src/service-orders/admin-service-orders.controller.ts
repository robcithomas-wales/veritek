import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminServiceOrdersService } from './admin-service-orders.service';
import type { User } from '@prisma/client';

@Controller('admin/service-orders')
@UseGuards(JwtAuthGuard)
@Roles('dispatcher', 'admin')
export class AdminServiceOrdersController {
  constructor(private readonly service: AdminServiceOrdersService) {}

  @Get('stats')
  stats() {
    return this.service.stats();
  }

  @Get()
  list(@Query() query: Record<string, string>) {
    const params: Record<string, string | number> = {};
    if (query['status']) params['status'] = query['status'];
    if (query['priority']) params['priority'] = query['priority'];
    if (query['engineerId']) params['engineerId'] = query['engineerId'];
    if (query['siteId']) params['siteId'] = query['siteId'];
    if (query['from']) params['from'] = query['from'];
    if (query['to']) params['to'] = query['to'];
    if (query['search']) params['search'] = query['search'];
    if (query['page']) params['page'] = Number(query['page']);
    if (query['pageSize']) params['pageSize'] = Number(query['pageSize']);
    return this.service.list(params as any);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.getDetail(id);
  }

  @Post()
  create(@Body() body: any, @CurrentUser() user: User) {
    return this.service.create(body, user);
  }

  @Patch(':id/assign')
  assign(@Param('id') id: string, @Body() body: { engineerId: string; eta?: string }) {
    return this.service.assign(id, body);
  }

  @Patch(':id/eta')
  setEta(@Param('id') id: string, @Body() body: { eta: string }) {
    return this.service.setEta(id, body.eta);
  }

  @Patch(':id/close')
  close(@Param('id') id: string) {
    return this.service.close(id);
  }
}
