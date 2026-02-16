import pg from "pg";
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Render Postgres requires SSL in many cases.
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS alerts (
      id BIGSERIAL PRIMARY KEY,
      reading_id TEXT UNIQUE,
      created_at TIMESTAMPTZ NOT NULL,
      severity TEXT NOT NULL,
      temperature DOUBLE PRECISION NOT NULL,
      humidity DOUBLE PRECISION NOT NULL,
      pressure DOUBLE PRECISION NOT NULL,
      message TEXT NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      from_email TEXT NOT NULL,
      recipients JSONB NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS alert_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}