import Database from "better-sqlite3";

const db = new Database("alerts.db");

// Create table with reading_id UNIQUE so duplicates cannot happen
db.exec(`
  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reading_id TEXT UNIQUE,
    created_at TEXT NOT NULL,      -- ISO string
    severity TEXT NOT NULL,
    temperature REAL NOT NULL,
    humidity REAL NOT NULL,
    pressure REAL NOT NULL,
    message TEXT NOT NULL
  );
`);

export default db;
