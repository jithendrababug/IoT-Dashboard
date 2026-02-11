import Database from "better-sqlite3";

const db = new Database("alerts.db");

// ------------------- ALERTS TABLE -------------------
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

// ------------------- EMAIL CONFIG TABLE -------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS email_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    from_email TEXT NOT NULL,
    app_pass TEXT NOT NULL,
    recipients TEXT NOT NULL -- stored as JSON string
  );
`);

export default db;
