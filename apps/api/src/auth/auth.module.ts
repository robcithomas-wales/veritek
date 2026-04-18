import { Module } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiKeyGuard } from './guards/api-key.guard';
import { ApiKeyThrottlerGuard } from './guards/api-key-throttler.guard';
import { ApiKeyUsageInterceptor } from './interceptors/api-key-usage.interceptor';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [JwtAuthGuard, ApiKeyGuard, ApiKeyThrottlerGuard, ApiKeyUsageInterceptor],
  exports: [JwtAuthGuard, ApiKeyGuard, ApiKeyThrottlerGuard, ApiKeyUsageInterceptor],
})
export class AuthModule {}
