import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { jwtVerify } from 'jose';
import { createSecretKey } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { UserRole } from '@prisma/client';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const request = ctx.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed token');
    }
    const token = authHeader.slice(7);
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret) throw new UnauthorizedException('JWT secret not configured');

    let payload: { sub?: string; email?: string };
    try {
      const key = createSecretKey(Buffer.from(secret, 'utf-8'));
      const { payload: p } = await jwtVerify(token, key);
      payload = p as typeof payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (!payload.sub) throw new UnauthorizedException('Token missing sub claim');

    const user = await this.prisma.user.findUnique({
      where: { supabaseId: payload.sub },
    });
    if (!user) throw new UnauthorizedException('User not found');

    request.user = user;

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (requiredRoles?.length && !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
