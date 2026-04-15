import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SitesService } from './sites.service';

@Controller('sites')
@UseGuards(JwtAuthGuard)
export class SitesController {
  constructor(private readonly sites: SitesService) {}

  @Get(':id')
  get(@Param('id') id: string) {
    return this.sites.findById(id);
  }
}
