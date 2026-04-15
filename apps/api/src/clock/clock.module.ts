import { Module } from '@nestjs/common';
import { ClockController } from './clock.controller';
import { ClockService } from './clock.service';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [AuthModule, EventsModule],
  controllers: [ClockController],
  providers: [ClockService],
})
export class ClockModule {}
