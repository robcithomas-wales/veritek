import { Module } from '@nestjs/common';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [AuthModule, EventsModule],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
