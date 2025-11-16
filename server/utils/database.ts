import fs from 'fs';
import path from 'path';
import { Database, User } from '../types/database';

const DB_PATH = path.join(process.cwd(), 'db.json');

export function readDb(): Database {
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

export function writeDb(db: Database): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function findUser(db: Database, username: string): User | undefined {
  return db.users.find((u) => u.username === username);
}
