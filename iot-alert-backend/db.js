import Database from "better-sqlite3";

const db = new Database("alerts.db");

// Create table if not exists (with reading_id)
db.exec(`
  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reading_id TEXT UNIQUE,
    created_at TEXT NOT NULL,
    severity TEXT NOT NULL,
    temperature REAL NOT NULL,
    humidity REAL NOT NULL,
    pressure REAL NOT NULL,
    message TEXT NOT NULL
  );
`);

// --- Migration: if old table exists without reading_id, add it safely ---
const cols = db.prepare("PRAGMA table_info(alerts)").all().map(c => c.name);

if (!cols.includes("reading_id")) {
  db.exec(`ALTER TABLE alerts ADD COLUMN reading_id TEXT;`);
}

// Ensure unique index (safe if already exists)
db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_alerts_reading_id ON alerts(reading_id);`);

export default db;
