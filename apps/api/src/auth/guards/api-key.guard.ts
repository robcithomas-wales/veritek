import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const request = ctx.switchToHttp().getRequest();
    const raw: string | undefined = request.headers['x-api-key'];
    if (!raw) throw new UnauthorizedException('Missing X-API-Key header');

    const keyHash = crypto
      .createHmac('sha256', process.env.API_KEY_HASH_SECRET ?? '')
      .update(raw)
      .digest('hex');

    const apiKey = await this.prisma.apiKey.findFirst({
      where: { keyHash, isActive: true, deletedAt: null },
    });

    if (!apiKey) throw new UnauthorizedException('Invalid or revoked API key');

    // Attach resolved key to request so the usage interceptor can log it
    request.apiKey = apiKey;

    return true;
  }
}
