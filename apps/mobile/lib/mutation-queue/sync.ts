import { api } from '../api';
import { getPending, markSuccess, markFailed } from './queue';

let isFlushing = false;

export async function flushQueue(): Promise<void> {
  if (isFlushing) return;
  isFlushing = true;
  try {
    const pending = getPending();
    if (pending.length === 0) return;

    const response = await api.sync.flush({
      mutations: pending.map((m) => ({
        id: m.id,
        createdAt: m.createdAt,
        endpoint: m.endpoint,
        method: m.method,
        body: m.body,
      })),
    });

    const succeeded = response.results
      .filter((r) => r.success)
      .map((r) => r.id);
    const failed = response.results.filter((r) => !r.success);

    markSuccess(succeeded);
    failed.forEach((r) => markFailed(r.id, r.error ?? 'Server error'));
  } catch (err) {
    // Network error — leave queue intact for next attempt
  } finally {
    isFlushing = false;
  }
}
