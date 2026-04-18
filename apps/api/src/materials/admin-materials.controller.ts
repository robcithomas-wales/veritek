import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminMaterialsService } from './admin-materials.service';

@Controller('admin/materials')
@UseGuards(JwtAuthGuard)
@Roles('dispatcher', 'admin')
export class AdminMaterialsController {
  constructor(private readonly service: AdminMaterialsService) {}

  @Get()
  list(@Query() query: Record<string, string>) {
    const params: Record<string, string | number> = {};
    if (query['status']) params['status'] = query['status'];
    if (query['engineerId']) params['engineerId'] = query['engineerId'];
    if (query['serviceOrderId']) params['serviceOrderId'] = query['serviceOrderId'];
    if (query['from']) params['from'] = query['from'];
    if (query['to']) params['to'] = query['to'];
    return this.service.listAll(params as any);
  }
}
