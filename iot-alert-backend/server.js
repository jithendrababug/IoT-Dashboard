import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./db.js";

dotenv.config();

/* ---------------------------
   ✅ AUTO DB MIGRATION (LONG-TERM FIX)
   Ensure email_config has ONLY: id, from_email, recipients
---------------------------- */
function ensureEmailConfigSchema() {
  try {
    const cols = db
      .prepare(`PRAGMA table_info(email_config)`)
      .all()
      .map((c) => c.name);

    if (!cols.length) return;

    const hasAppPass = cols.includes("app_pass");

    if (hasAppPass) {
      console.log("🔧 Migrating DB: removing legacy column app_pass...");

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

      console.log("✅ Migration done: app_pass removed.");
    }
  } catch (e) {
    console.error("❌ DB migration failed:", e.message);
  }
}
ensureEmailConfigSchema();

function loadEmailConfig() {
  const row = db.prepare("SELECT * FROM email_config WHERE id = 1").get();
  if (!row) return null;

  let recipients = [];
  try {
    recipients = JSON.parse(row.recipients || "[]");
  } catch {
    recipients = [];
  }

  return {
    fromEmail: row.from_email,
    recipients,
  };
}

const app = express();

/* ✅ CORS */
const corsOptions = {
  origin: ["http://localhost:3000", "https://jithendrababug.github.io"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

/* ---------------------------
   ✅ Helpers
---------------------------- */
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
let lastSentAt = 0;

const isValidEmail = (v) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());

function toISTISOString(dateLike) {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;

  const s = d.toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" }); // "YYYY-MM-DD HH:mm:ss"
  return s.replace(" ", "T") + "+05:30";
}

function normalizeToIST(input) {
  if (typeof input === "string" && input.includes("+05:30")) return input;
  if (typeof input === "string" && !Number.isNaN(Date.parse(input))) return toISTISOString(input);
  return toISTISOString(new Date());
}

function getSeverityAndTriggers({ temperature, humidity, pressure }) {
  const triggers = [];

  if (temperature > 30) triggers.push(`Temperature: ${temperature}°C (limit: 30°C)`);
  if (humidity > 70) triggers.push(`Humidity: ${humidity}% (limit: 70%)`);
  if (pressure > 1020) triggers.push(`Pressure: ${pressure} hPa (limit: 1020 hPa)`);

  const critical = temperature >= 35 || humidity >= 85 || pressure >= 1030;
  const severity = critical ? "CRITICAL" : "WARNING";
  const message = triggers.join(" | ");

  return { triggers, severity, message };
}

/* ------------------------------------------------
   ✅ RESEND EMAIL SENDER (works on Render)
------------------------------------------------- */
async function sendEmailViaResend({ replyTo, toList, subject, text }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    const err = new Error("RESEND_API_KEY is missing in backend environment");
    err.code = "NO_RESEND_KEY";
    throw err;
  }

  // ✅ Works even without your own domain (for now).
  // Later, when you buy/verify a domain in Resend, change this.
  const fromAddress = "IoT Dashboard <onboarding@resend.dev>";

  const payload = {
    from: fromAddress,
    to: toList,
    subject,
    text,
    reply_to: replyTo || undefined,
  };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = json?.message || json?.error || `Resend failed (HTTP ${res.status})`;
    const err = new Error(msg);
    err.code = json?.name || `HTTP_${res.status}`;
    throw err;
  }

  return json; // includes id
}

/* ---------------------------
   ✅ CONFIG APIs
---------------------------- */

// Status (optional)
app.get("/api/alerts/config", (req, res) => {
  try {
    const cfg = loadEmailConfig();
    const hasConfig =
      !!cfg && !!cfg.fromEmail && Array.isArray(cfg.recipients) && cfg.recipients.length > 0;
    return res.json({ ok: true, hasConfig });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Save popup config (NO password now)
app.post("/api/alerts/config", (req, res) => {
  try {
    const { fromEmail, recipients } = req.body || {};

    const from = String(fromEmail || "").trim();
    const list = Array.isArray(recipients)
      ? recipients.map((r) => String(r || "").trim()).filter(Boolean)
      : [];

    if (!from || list.length === 0) {
      return res.status(400).json({ ok: false, error: "Missing fields" });
    }
    if (!isValidEmail(from)) {
      return res.status(400).json({ ok: false, error: "Invalid sender email" });
    }

    const bad = list.find((r) => !isValidEmail(r));
    if (bad) {
      return res.status(400).json({ ok: false, error: `Invalid receiver email: ${bad}` });
    }

    db.prepare(`
      INSERT INTO email_config (id, from_email, recipients)
      VALUES (1, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        from_email=excluded.from_email,
        recipients=excluded.recipients
    `).run(from, JSON.stringify(list));

    return res.json({ ok: true });
  } catch (err) {
    console.error("Config save error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/* ---------------------------
   ✅ TEST EMAIL (kept)
---------------------------- */

/* ---------------------------
   ✅ MAIN PRODUCTION ALERT ENDPOINT
   sensorAPI.js should call this (it already does)
---------------------------- */
app.post("/api/alerts/email", async (req, res) => {
  try {
    const { readingId, temperature, humidity, pressure, clientTimeISO, sendEmail } = req.body || {};

    if (!readingId || temperature == null || humidity == null || pressure == null) {
      return res.status(400).json({
        ok: false,
        error: "Missing fields (readingId, temperature, humidity, pressure)",
      });
    }

    const { triggers, severity, message } = getSeverityAndTriggers({
      temperature: Number(temperature),
      humidity: Number(humidity),
      pressure: Number(pressure),
    });

    // No threshold breach => do nothing
    if (triggers.length === 0) {
      return res.json({ ok: true, stored: false, sent: false, reason: "No threshold breached" });
    }

    const createdAtFinal =
      normalizeToIST(clientTimeISO) ||
      new Date().toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" }).replace(" ", "T") + "+05:30";

    // Store alert (dedupe on reading_id)
    try {
      db.prepare(
        `INSERT INTO alerts (reading_id, created_at, severity, temperature, humidity, pressure, message)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(readingId, createdAtFinal, severity, temperature, humidity, pressure, message);
    } catch (e) {
      // If duplicate, ignore (reading_id UNIQUE)
      if (!String(e.message || "").includes("UNIQUE")) throw e;
    }

    // If UI toggle is OFF => don't email
    if (!sendEmail) {
      return res.json({
        ok: true,
        stored: true,
        sent: false,
        reason: "Email disabled",
        created_at: createdAtFinal,
      });
    }

    // Cooldown
    const nowMs = Date.now();
    if (nowMs - lastSentAt < COOLDOWN_MS) {
      return res.json({
        ok: true,
        stored: true,
        sent: false,
        reason: "Cooldown active",
        created_at: createdAtFinal,
      });
    }

    // Load email config
    const emailConfig = loadEmailConfig();
    if (!emailConfig?.fromEmail || !emailConfig?.recipients?.length) {
      return res.json({
        ok: true,
        stored: true,
        sent: false,
        reason: "Email config not set. Submit Email Alert popup first.",
        created_at: createdAtFinal,
      });
    }

    const result = await sendEmailViaResend({
      replyTo: emailConfig.fromEmail,
      toList: emailConfig.recipients,
      subject: `🚨 [${severity}] IoT Alert (${createdAtFinal})`,
      text:
        `🚨 IoT Dashboard Alert\n\n` +
        `Severity: ${severity}\n` +
        `Date & Time (IST): ${createdAtFinal}\n\n` +
        `Triggered Conditions:\n- ${triggers.join("\n- ")}\n\n` +
        `Current Readings:\n` +
        `Temperature: ${temperature}°C\n` +
        `Humidity: ${humidity}%\n` +
        `Pressure: ${pressure} hPa\n`,
    });

    lastSentAt = nowMs;

    return res.json({
      ok: true,
      stored: true,
      sent: true,
      severity,
      created_at: createdAtFinal,
      to: emailConfig.recipients,
      provider: "resend",
      id: result?.id,
    });
  } catch (err) {
    console.error("❌ Email alert error:", err);
    return res.status(500).json({ ok: false, error: err.message, code: err.code });
  }
});

/* ---------------------------
   ✅ ALERT HISTORY
---------------------------- */
app.get("/api/alerts/history", (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 10), 100);
    const rows = db.prepare("SELECT * FROM alerts ORDER BY created_at DESC LIMIT ?").all(limit);
    return res.json({ ok: true, alerts: rows });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));