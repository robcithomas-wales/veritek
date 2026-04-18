import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Extends the standard ThrottlerGuard to key rate limiting by API key ID
 * rather than by IP address, giving each integration partner their own quota.
 */
@Injectable()
export class ApiKeyThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const apiKey = req['apiKey'] as { id: string } | undefined;
    if (apiKey?.id) return `api-key:${apiKey.id}`;
    // Fallback to IP for unauthenticated hits (shouldn't reach here in practice)
    return String(req['ip'] ?? 'unknown');
  }
}
