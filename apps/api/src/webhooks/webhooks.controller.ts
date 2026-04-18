import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
@UseGuards(JwtAuthGuard)
@Roles('dispatcher', 'admin')
export class WebhooksController {
  constructor(private readonly service: WebhooksService) {}

  @Post()
  create(@Body() body: { name: string; endpointUrl: string; eventTypes: string[] }) {
    return this.service.create(body);
  }

  @Get()
  list() {
    return this.service.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.getDetail(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { endpointUrl?: string; eventTypes?: string[]; isActive?: boolean }) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/retry/:deliveryId')
  retry(@Param('id') id: string, @Param('deliveryId') deliveryId: string) {
    return this.service.retryDelivery(id, deliveryId);
  }
}
