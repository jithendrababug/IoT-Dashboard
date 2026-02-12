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
// ✅ Only store: from_email + recipients
db.exec(`
  CREATE TABLE IF NOT EXISTS email_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    from_email TEXT NOT NULL,
    recipients TEXT NOT NULL
  );
`);

// ✅ Migration: if old table had app_pass, keep app running without crash
try {
  const cols = db.prepare(`PRAGMA table_info(email_config)`).all().map(c => c.name);
  if (cols.includes("app_pass")) {
    // Create new table and copy data
    db.exec(`
      CREATE TABLE IF NOT EXISTS email_config_new (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        from_email TEXT NOT NULL,
        recipients TEXT NOT NULL
      );
    `);

    db.exec(`
      INSERT OR REPLACE INTO email_config_new (id, from_email, recipients)
      SELECT id, from_email, recipients FROM email_config;
    `);

    db.exec(`DROP TABLE email_config;`);
    db.exec(`ALTER TABLE email_config_new RENAME TO email_config;`);
  }
} catch (e) {
  // ignore migration errors (first-time install etc.)
}

export default db;
