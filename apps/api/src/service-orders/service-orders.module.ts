import { Module } from '@nestjs/common';
import { ServiceOrdersController } from './service-orders.controller';
import { ServiceOrdersService } from './service-orders.service';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [AuthModule, EventsModule],
  controllers: [ServiceOrdersController],
  providers: [ServiceOrdersService],
  exports: [ServiceOrdersService],
})
export class ServiceOrdersModule {}
