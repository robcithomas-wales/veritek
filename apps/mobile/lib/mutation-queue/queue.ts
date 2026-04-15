import { db } from './db';

export interface QueuedMutation {
  id: number;
  createdAt: string;
  endpoint: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  body: unknown;
  status: 'pending' | 'processing' | 'failed';
  attempts: number;
  lastError: string | null;
}

export function enqueue(
  endpoint: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body: unknown,
): number {
  const stmt = db.prepareSync(
    `INSERT INTO mutation_queue (created_at, endpoint, method, body, status)
     VALUES (?, ?, ?, ?, 'pending')`,
  );
  const result = stmt.executeSync(
    new Date().toISOString(),
    endpoint,
    method,
    JSON.stringify(body),
  );
  stmt.finalizeSync();
  return result.lastInsertRowId as number;
}

export function getPending(): QueuedMutation[] {
  return db
    .getAllSync<{
      id: number;
      created_at: string;
      endpoint: string;
      method: string;
      body: string;
      status: string;
      attempts: number;
      last_error: string | null;
    }>(
      `SELECT * FROM mutation_queue WHERE status IN ('pending','failed') AND attempts < 5
       ORDER BY created_at ASC`,
    )
    .map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      endpoint: row.endpoint,
      method: row.method as QueuedMutation['method'],
      body: JSON.parse(row.body),
      status: row.status as QueuedMutation['status'],
      attempts: row.attempts,
      lastError: row.last_error,
    }));
}

export function markSuccess(ids: number[]) {
  if (ids.length === 0) return;
  db.execSync(
    `DELETE FROM mutation_queue WHERE id IN (${ids.join(',')})`,
  );
}

export function markFailed(id: number, error: string) {
  db.runSync(
    `UPDATE mutation_queue SET status='failed', attempts=attempts+1, last_error=? WHERE id=?`,
    error,
    id,
  );
}
