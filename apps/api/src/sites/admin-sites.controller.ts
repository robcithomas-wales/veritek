import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SitesService } from './sites.service';

@Controller('admin/sites')
@UseGuards(JwtAuthGuard)
@Roles('dispatcher', 'admin')
export class AdminSitesController {
  constructor(private readonly sites: SitesService) {}

  @Get()
  list(@Query() query: { search?: string }) {
    return this.sites.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.sites.findById(id);
  }

  @Post()
  create(@Body() dto: { name: string; address?: string; postcode?: string }) {
    return this.sites.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: { name?: string; address?: string; postcode?: string },
  ) {
    return this.sites.update(id, dto);
  }
}
