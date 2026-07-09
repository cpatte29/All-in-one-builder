import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DB_FILE = process.env.DATABASE_FILE || path.join(process.cwd(), "db", "fable5.db");
const SCHEMA_FILE = path.join(process.cwd(), "db", "schema.sql");

declare global {
  // eslint-disable-next-line no-var
  var __fable5db: Database.Database | undefined;
}

function bootstrap(): Database.Database {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  const db = new Database(DB_FILE);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  const schema = fs.readFileSync(SCHEMA_FILE, "utf-8");
  db.exec(schema);
  return db;
}

export const db = global.__fable5db ?? bootstrap();
if (process.env.NODE_ENV !== "production") global.__fable5db = db;

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
