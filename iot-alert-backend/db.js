import Database from "better-sqlite3";

const db = new Database("alerts.db");

function migrate() {
  // Create tables (current schema)
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

  db.exec(`
    CREATE TABLE IF NOT EXISTS email_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      from_email TEXT NOT NULL,
      recipients TEXT NOT NULL
    );
  `);

  // Migrate legacy email_config with app_pass column (if it exists)
  try {
    const cols = db.prepare(`PRAGMA table_info(email_config)`).all().map((c) => c.name);
    if (cols.includes("app_pass")) {
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
  } catch {
    // ignore migration errors
  }
}

migrate();

export default db;