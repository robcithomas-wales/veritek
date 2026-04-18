import { Module } from '@nestjs/common';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';
import { AdminMaterialsController } from './admin-materials.controller';
import { AdminMaterialsService } from './admin-materials.service';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, EventsModule, PrismaModule],
  controllers: [MaterialsController, AdminMaterialsController],
  providers: [MaterialsService, AdminMaterialsService],
  exports: [MaterialsService, AdminMaterialsService],
})
export class MaterialsModule {}
