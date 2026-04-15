import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('veritek-queue.db');

export function initQueue() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS mutation_queue (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at  TEXT NOT NULL,
      endpoint    TEXT NOT NULL,
      method      TEXT NOT NULL,
      body        TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'pending',
      attempts    INTEGER NOT NULL DEFAULT 0,
      last_error  TEXT
    );
  `);
}
