import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { pool, initDb } from "./db.js";

await initDb();

const app = express();

/* CORS */
const corsOptions = {
  origin: ["http://localhost:3000", "https://jithendrababug.github.io"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

/* -------------------- Helpers -------------------- */

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes (shared via Postgres)
const COOLDOWN_KEY = "last_email_sent_at_ms";

const isValidEmail = (v) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());

function toISTISOString(dateLike) {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;

  const s = d.toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" });
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

async function loadEmailConfig() {
  const { rows } = await pool.query("SELECT * FROM email_config WHERE id = 1");
  const row = rows[0];
  if (!row) return null;

  return {
    fromEmail: row.from_email,
    recipients: Array.isArray(row.recipients) ? row.recipients : [],
  };
}

/* Cooldown state stored in Postgres (works across restarts + multi instances) */
async function getLastSentAtMs() {
  const { rows } = await pool.query("SELECT value FROM alert_state WHERE key = $1", [COOLDOWN_KEY]);
  const n = Number(rows[0]?.value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

async function setLastSentAtMs(ms) {
  await pool.query(
    `
    INSERT INTO alert_state (key, value)
    VALUES ($1, $2)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `,
    [COOLDOWN_KEY, String(ms)]
  );
}

async function sendEmailViaResend({ replyTo, toList, subject, text }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    const err = new Error("RESEND_API_KEY is missing in backend environment");
    err.code = "NO_RESEND_KEY";
    throw err;
  }

  // NOTE: For production you should use a verified sender/domain in Resend.
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

  return json;
}

/* -------------------- Routes -------------------- */

app.get("/api/alerts/config", async (req, res) => {
  try {
    const cfg = await loadEmailConfig();
    const hasConfig =
      !!cfg && !!cfg.fromEmail && Array.isArray(cfg.recipients) && cfg.recipients.length > 0;

    return res.json({ ok: true, hasConfig });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/api/alerts/config", async (req, res) => {
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

    await pool.query(
      `
      INSERT INTO email_config (id, from_email, recipients)
      VALUES (1, $1, $2::jsonb)
      ON CONFLICT (id)
      DO UPDATE SET from_email = EXCLUDED.from_email,
                    recipients = EXCLUDED.recipients
      `,
      [from, JSON.stringify(list)]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error("Config save error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/api/alerts/email", async (req, res) => {
  try {
    const { readingId, temperature, humidity, pressure, clientTimeISO, sendEmail } = req.body || {};

    if (!readingId || temperature == null || humidity == null || pressure == null) {
      return res.status(400).json({
        ok: false,
        error: "Missing fields (readingId, temperature, humidity, pressure)",
      });
    }

    const tempN = Number(temperature);
    const humN = Number(humidity);
    const presN = Number(pressure);

    const { triggers, severity, message } = getSeverityAndTriggers({
      temperature: tempN,
      humidity: humN,
      pressure: presN,
    });

    if (triggers.length === 0) {
      return res.json({ ok: true, stored: false, sent: false, reason: "No threshold breached" });
    }

    const createdAtFinal =
      normalizeToIST(clientTimeISO) ||
      new Date().toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" }).replace(" ", "T") + "+05:30";

    // Store alert (idempotent by reading_id)
    await pool.query(
      `
      INSERT INTO alerts (reading_id, created_at, severity, temperature, humidity, pressure, message)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (reading_id) DO NOTHING
      `,
      [readingId, createdAtFinal, severity, tempN, humN, presN, message]
    );

    if (!sendEmail) {
      return res.json({
        ok: true,
        stored: true,
        sent: false,
        reason: "Email disabled",
        created_at: createdAtFinal,
      });
    }

    // Cooldown check (Postgres-backed)
    const nowMs = Date.now();
    const lastSentAt = await getLastSentAtMs();

    if (nowMs - lastSentAt < COOLDOWN_MS) {
      return res.json({
        ok: true,
        stored: true,
        sent: false,
        reason: "Cooldown active",
        created_at: createdAtFinal,
        cooldown_remaining_ms: COOLDOWN_MS - (nowMs - lastSentAt),
      });
    }

    const emailConfig = await loadEmailConfig();
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
        `Temperature: ${tempN}°C\n` +
        `Humidity: ${humN}%\n` +
        `Pressure: ${presN} hPa\n`,
    });

    // Persist cooldown timestamp
    await setLastSentAtMs(nowMs);

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
    console.error("Email alert error:", err);
    return res.status(500).json({ ok: false, error: err.message, code: err.code });
  }
});

app.get("/api/alerts/history", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 10), 100);
    const { rows } = await pool.query(
      "SELECT * FROM alerts ORDER BY created_at DESC LIMIT $1",
      [limit]
    );
    return res.json({ ok: true, alerts: rows });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));