import { api } from '../api';
import { getPending, markSuccess, markFailed } from './queue';

let isFlushing = false;
export let lastSyncError: string | null = null;

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
    failed.forEach((r) => {
      console.warn(`[sync] mutation ${r.id} failed: ${r.error}`);
      markFailed(r.id, r.error ?? 'Server error');
    });

    lastSyncError = failed.length > 0
      ? failed.map((r) => r.error).join('; ')
      : null;
  } catch (err) {
    lastSyncError = err instanceof Error ? err.message : 'Network error';
    console.warn('[sync] flush failed:', lastSyncError);
    // Leave queue intact for next attempt
  } finally {
    isFlushing = false;
  }
}
