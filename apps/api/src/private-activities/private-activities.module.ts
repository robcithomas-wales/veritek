import { Module } from '@nestjs/common';
import { PrivateActivitiesController } from './private-activities.controller';
import { PrivateActivitiesService } from './private-activities.service';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [AuthModule, EventsModule],
  controllers: [PrivateActivitiesController],
  providers: [PrivateActivitiesService],
  exports: [PrivateActivitiesService],
})
export class PrivateActivitiesModule {}
