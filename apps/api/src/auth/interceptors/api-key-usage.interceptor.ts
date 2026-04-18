import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApiKeyUsageInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = ctx.switchToHttp().getRequest();
    const apiKey = request.apiKey;

    // Only log requests that were authenticated via API key
    if (!apiKey) return next.handle();

    const endpoint = request.path as string;

    const log = (responseCode: number) => {
      this.prisma.apiKeyUsage
        .create({
          data: {
            apiKeyId: apiKey.id,
            endpoint,
            responseCode,
            timestamp: new Date(),
          },
        })
        .catch(() => {
          // Non-critical — never let logging break a request
        });
    };

    return next.handle().pipe(
      tap(() => {
        const response = ctx.switchToHttp().getResponse();
        log(response.statusCode ?? 200);
      }),
      catchError((err: unknown) => {
        const status =
          typeof err === 'object' && err !== null && 'status' in err
            ? (err as { status: number }).status
            : 500;
        log(status);
        return throwError(() => err);
      }),
    );
  }
}
