import { Module } from '@nestjs/common';
import { SitesController } from './sites.controller';
import { AdminSitesController } from './admin-sites.controller';
import { SitesService } from './sites.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SitesController, AdminSitesController],
  providers: [SitesService],
  exports: [SitesService],
})
export class SitesModule {}
