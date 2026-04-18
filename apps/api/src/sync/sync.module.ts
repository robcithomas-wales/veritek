import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { AuthModule } from '../auth/auth.module';
import { ActivitiesModule } from '../activities/activities.module';
import { MaterialsModule } from '../materials/materials.module';
import { ClockModule } from '../clock/clock.module';
import { ServiceOrdersModule } from '../service-orders/service-orders.module';
import { PrivateActivitiesModule } from '../private-activities/private-activities.module';

@Module({
  imports: [AuthModule, ActivitiesModule, MaterialsModule, ClockModule, ServiceOrdersModule, PrivateActivitiesModule],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
