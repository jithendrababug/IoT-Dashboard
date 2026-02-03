// File: iot-dashboard/iot-alert-backend/db.js
import Database from "better-sqlite3";

// Creates/opens alerts.db in this same folder
const db = new Database("alerts.db");

// Better reliability for reads + writes
db.pragma("journal_mode = WAL");

// 1) Ensure table exists with the LATEST schema
db.exec(`
  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,          -- store ISO string
    reading_id TEXT,                   -- used to deduplicate alerts per reading
    severity TEXT NOT NULL,
    temperature REAL NOT NULL,
    humidity REAL NOT NULL,
    pressure REAL NOT NULL,
    message TEXT NOT NULL
  );
`);

// 2) MIGRATION: if an older DB exists, add missing columns safely
const cols = db.prepare("PRAGMA table_info(alerts);").all().map((c) => c.name);

if (!cols.includes("reading_id")) {
  db.exec(`ALTER TABLE alerts ADD COLUMN reading_id TEXT;`);
}

// 3) Indexes (non-unique = won’t crash even if older DB has duplicates)
db.exec(`CREATE INDEX IF NOT EXISTS idx_alerts_reading_id ON alerts(reading_id);`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);`);

export default db;
