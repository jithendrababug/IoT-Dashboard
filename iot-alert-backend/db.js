import Database from "better-sqlite3";

const db = new Database("alerts.db");

// 1) Ensure schema exists
db.exec(`
  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reading_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    severity TEXT NOT NULL,
    temperature REAL NOT NULL,
    humidity REAL NOT NULL,
    pressure REAL NOT NULL,
    message TEXT NOT NULL
  );
`);

// 2) Make reading_id truly unique (NOT NULL + UNIQUE index)
db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_alerts_reading_id
  ON alerts(reading_id);
`);

// 3) One-time cleanup: remove existing duplicates
// Keep the latest row for each reading_id
db.exec(`
  DELETE FROM alerts
  WHERE id NOT IN (
    SELECT MAX(id)
    FROM alerts
    GROUP BY reading_id
  );
`);

export default db;
