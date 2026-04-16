import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { UserRole } from '@prisma/client';

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`),
);

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

    let payload: { sub?: string; email?: string };
    try {
      const { payload: p } = await jwtVerify(token, JWKS);
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
