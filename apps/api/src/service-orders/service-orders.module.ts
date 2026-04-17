import { Module } from '@nestjs/common';
import { ServiceOrdersController } from './service-orders.controller';
import { ServiceOrdersService } from './service-orders.service';
import { AdminServiceOrdersController } from './admin-service-orders.controller';
import { AdminServiceOrdersService } from './admin-service-orders.service';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, EventsModule, PrismaModule],
  controllers: [ServiceOrdersController, AdminServiceOrdersController],
  providers: [ServiceOrdersService, AdminServiceOrdersService],
  exports: [ServiceOrdersService, AdminServiceOrdersService],
})
export class ServiceOrdersModule {}
