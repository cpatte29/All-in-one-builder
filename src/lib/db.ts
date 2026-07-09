import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DB_FILE = process.env.DATABASE_FILE || path.join(process.cwd(), "db", "fable5.db");
const SCHEMA_FILE = path.join(process.cwd(), "db", "schema.sql");

declare global {
  // eslint-disable-next-line no-var
  var __fable5db: Database.Database | undefined;
}

/** Adds columns introduced after a table's first release to already-created local DB files. */
function migrateColumns(db: Database.Database, table: string, columns: string[]) {
  const existing = new Set(
    (db.pragma(`table_info(${table})`) as { name: string }[]).map((c) => c.name)
  );
  for (const col of columns) {
    const [name, def] = col.split(/\s+(.+)/);
    if (!existing.has(name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${def}`);
  }
}

function bootstrap(): Database.Database {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  const db = new Database(DB_FILE);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  const schema = fs.readFileSync(SCHEMA_FILE, "utf-8");
  db.exec(schema);
  migrateColumns(db, "loops", ["lead_id TEXT REFERENCES leads(id)", "proposal_id TEXT REFERENCES proposals(id)"]);
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
