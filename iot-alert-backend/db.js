import Database from "better-sqlite3";

const db = new Database("alerts.db");

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reading_id INTEGER UNIQUE,
    created_at TEXT NOT NULL,
    severity TEXT NOT NULL,
    temperature REAL NOT NULL,
    humidity REAL NOT NULL,
    pressure REAL NOT NULL,
    message TEXT NOT NULL
  );
`);

// If an old table exists without reading_id, add it safely
try {
  db.exec(`ALTER TABLE alerts ADD COLUMN reading_id INTEGER;`);
} catch (e) {
  // ignore if column already exists
}

// Ensure unique index exists (safe if already exists)
try {
  db.exec(`CREATE UNIQUE INDEX idx_alerts_reading_id ON alerts(reading_id);`);
} catch (e) {
  // ignore if already exists
}

export default db;
