import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SitesModule } from './sites/sites.module';
import { ServiceOrdersModule } from './service-orders/service-orders.module';
import { ActivitiesModule } from './activities/activities.module';
import { ItemsModule } from './items/items.module';
import { MaterialsModule } from './materials/materials.module';
import { ChecklistsModule } from './checklists/checklists.module';
import { ClockModule } from './clock/clock.module';
import { SyncModule } from './sync/sync.module';
import { ReferenceModule } from './reference/reference.module';
import { EventsModule } from './events/events.module';
import { PrivateActivitiesModule } from './private-activities/private-activities.module';
import { InventoryModule } from './inventory/inventory.module';
import { ShippingModule } from './shipping/shipping.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot({ wildcard: false, delimiter: '.' }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    SitesModule,
    ServiceOrdersModule,
    ActivitiesModule,
    ItemsModule,
    MaterialsModule,
    ChecklistsModule,
    ClockModule,
    SyncModule,
    ReferenceModule,
    EventsModule,
    PrivateActivitiesModule,
    InventoryModule,
    ShippingModule,
    NotificationsModule,
    WebhooksModule,
    ApiKeysModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
