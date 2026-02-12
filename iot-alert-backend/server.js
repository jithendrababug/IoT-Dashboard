import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./db.js";

dotenv.config();

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
    appPass: row.app_pass, // kept in DB for compatibility, not used now
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

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
let lastSentAt = 0;

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

/* ------------------------------------------------
   ✅ RESEND EMAIL SENDER (HTTP) — works on Render
------------------------------------------------- */
async function sendEmailViaResend({ replyTo, toList, subject, text }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    const err = new Error("RESEND_API_KEY is missing in backend environment");
    err.code = "NO_RESEND_KEY";
    throw err;
  }

  // ✅ No domain needed for now:
  // Use Resend test sender. Later, replace with your verified domain sender.
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

/* ✅ GET config status */
app.get("/api/alerts/config", (req, res) => {
  try {
    const cfg = loadEmailConfig();
    const hasConfig =
      !!cfg &&
      !!cfg.fromEmail &&
      Array.isArray(cfg.recipients) &&
      cfg.recipients.length > 0;

    return res.json({ ok: true, hasConfig });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/* ✅ Save popup data into DB */
app.post("/api/alerts/config", (req, res) => {
  try {
    const { fromEmail, appPass, recipients } = req.body || {};

    const from = String(fromEmail || "").trim();
    const pass = String(appPass || "").trim(); // not used now, kept for compatibility
    const list = Array.isArray(recipients)
      ? recipients.map((r) => String(r || "").trim()).filter(Boolean)
      : [];

    if (!from || list.length === 0) {
      // pass no longer required for resend — allow empty
      return res.status(400).json({ ok: false, error: "Missing fields" });
    }

    if (!isValidEmail(from)) {
      return res.status(400).json({ ok: false, error: "Invalid sender email" });
    }

    const bad = list.find((r) => !isValidEmail(r));
    if (bad) {
      return res.status(400).json({ ok: false, error: `Invalid receiver email: ${bad}` });
    }

    db.prepare(
      `
      INSERT INTO email_config (id, from_email, app_pass, recipients)
      VALUES (1, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        from_email=excluded.from_email,
        app_pass=excluded.app_pass,
        recipients=excluded.recipients
    `
    ).run(from, pass || "", JSON.stringify(list));

    return res.json({ ok: true });
  } catch (err) {
    console.error("Config save error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/* ✅ Test email API (simple test) */
app.post("/api/alerts/test-email", async (req, res) => {
  try {
    const emailConfig = loadEmailConfig();

    if (
      !emailConfig ||
      !emailConfig.fromEmail ||
      !Array.isArray(emailConfig.recipients) ||
      emailConfig.recipients.length === 0
    ) {
      return res.status(400).json({
        ok: false,
        error: "Email config not set. Please submit Email Alert popup first.",
      });
    }

    const nowIST = normalizeToIST(new Date());

    const result = await sendEmailViaResend({
      replyTo: emailConfig.fromEmail,
      toList: emailConfig.recipients,
      subject: `✅ IoT Dashboard Test Email (${nowIST})`,
      text:
        `This is a test email from your IoT Dashboard.\n\n` +
        `Time (IST): ${nowIST}\n` +
        `If you received this, your email alert setup is working.\n`,
    });

    return res.json({ ok: true, provider: "resend", id: result?.id });
  } catch (err) {
    console.error("❌ Test email error:", err);
    return res.status(500).json({ ok: false, error: err.message, code: err.code });
  }
});

/* ✅ NEW: Test ALERT API (stores in history + sends alert email instantly) */
app.post("/api/alerts/test-alert", async (req, res) => {
  try {
    const emailConfig = loadEmailConfig();

    if (
      !emailConfig ||
      !emailConfig.fromEmail ||
      !Array.isArray(emailConfig.recipients) ||
      emailConfig.recipients.length === 0
    ) {
      return res.status(400).json({
        ok: false,
        error: "Email config not set. Please submit Email Alert popup first.",
      });
    }

    const createdAtFinal = normalizeToIST(new Date());
    const readingId = `test-${Date.now()}`;

    // Fixed “breach” values (guaranteed alert)
    const temperature = 36.5;
    const humidity = 88.2;
    const pressure = 1032.1;

    const triggers = [
      `Temperature: ${temperature}°C (limit: 30°C)`,
      `Humidity: ${humidity}% (limit: 70%)`,
      `Pressure: ${pressure} hPa (limit: 1020 hPa)`,
    ];
    const severity = "CRITICAL";
    const message = triggers.join(" | ");

    // Store alert
    try {
      db.prepare(
        `INSERT INTO alerts (reading_id, created_at, severity, temperature, humidity, pressure, message)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(readingId, createdAtFinal, severity, temperature, humidity, pressure, message);
    } catch (e) {
      if (!String(e.message || "").includes("UNIQUE")) throw e;
    }

    // Send email (bypass cooldown on purpose for testing)
    const result = await sendEmailViaResend({
      replyTo: emailConfig.fromEmail,
      toList: emailConfig.recipients,
      subject: `🚨 [${severity}] IoT Alert TEST (${createdAtFinal})`,
      text:
        `🚨 IoT Dashboard Alert (TEST)\n\n` +
        `Severity: ${severity}\n` +
        `Date & Time (IST): ${createdAtFinal}\n\n` +
        `Triggered Conditions:\n- ${triggers.join("\n- ")}\n\n` +
        `Temperature: ${temperature}°C\n` +
        `Humidity: ${humidity}%\n` +
        `Pressure: ${pressure} hPa\n`,
    });

    // Let frontend refresh history instantly
    return res.json({
      ok: true,
      stored: true,
      sent: true,
      provider: "resend",
      id: result?.id,
      created_at: createdAtFinal,
    });
  } catch (err) {
    console.error("❌ Test alert error:", err);
    return res.status(500).json({ ok: false, error: err.message, code: err.code });
  }
});

/* ✅ Insert alert (always), email optional */
app.post("/api/alerts/email", async (req, res) => {
  try {
    const { readingId, temperature, humidity, pressure, clientTimeISO, sendEmail } = req.body;

    if (!readingId || temperature == null || humidity == null || pressure == null) {
      return res.status(400).json({
        ok: false,
        error: "Missing fields (readingId, temperature, humidity, pressure)",
      });
    }

    const { triggers, severity, message } = getSeverityAndTriggers({
      temperature,
      humidity,
      pressure,
    });

    if (triggers.length === 0) {
      return res.json({ ok: true, stored: false, sent: false, reason: "No threshold breached" });
    }

    const createdAtFinal =
      normalizeToIST(clientTimeISO) ||
      new Date().toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" }).replace(" ", "T") + "+05:30";

    // store alert (dedupe)
    try {
      db.prepare(
        `INSERT INTO alerts (reading_id, created_at, severity, temperature, humidity, pressure, message)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(readingId, createdAtFinal, severity, temperature, humidity, pressure, message);
    } catch (e) {
      if (!String(e.message || "").includes("UNIQUE")) throw e;
    }

    if (!sendEmail) {
      return res.json({ ok: true, stored: true, sent: false, reason: "Email disabled", created_at: createdAtFinal });
    }

    const nowMs = Date.now();
    if (nowMs - lastSentAt < COOLDOWN_MS) {
      return res.json({ ok: true, stored: true, sent: false, reason: "Cooldown active", created_at: createdAtFinal });
    }

    const emailConfig = loadEmailConfig();
    if (
      !emailConfig ||
      !emailConfig.fromEmail ||
      !Array.isArray(emailConfig.recipients) ||
      emailConfig.recipients.length === 0
    ) {
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

app.get("/api/alerts/history", (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 10), 100);
    const rows = db.prepare("SELECT * FROM alerts ORDER BY created_at DESC LIMIT ?").all(limit);
    res.json({ ok: true, alerts: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Email alert server running on port ${PORT}`));
