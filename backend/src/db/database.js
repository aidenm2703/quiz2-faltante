import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { seedUsers } from '../services/auth.js';

export function atomic(db, work) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = work();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function connect(path) {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000');
  atomic(db, () => {
    db.exec(readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
    db.exec('CREATE TABLE IF NOT EXISTS versiones_db (version INTEGER PRIMARY KEY) STRICT');
    if (!db.prepare('SELECT 1 FROM versiones_db WHERE version=2').get()) {
      db.exec(readFileSync(new URL('./alertas.sql',import.meta.url),'utf8'));
      db.exec('INSERT INTO versiones_db VALUES (2)');
    }
    if (!db.prepare('SELECT 1 FROM semillas WHERE version=1').get()) {
      db.exec(readFileSync(new URL('./seed.sql',import.meta.url),'utf8'));
    }
    seedUsers(db);
  });
  return db;
}