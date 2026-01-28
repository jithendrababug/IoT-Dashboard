import Database from "better-sqlite3";

const db = new Database("alerts.db");

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    severity TEXT NOT NULL,
    temperature REAL NOT NULL,
    humidity REAL NOT NULL,
    pressure REAL NOT NULL,
    message TEXT NOT NULL
  )
`);

export default db;
