import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import db from "./db.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3000/IoT-Dashboard",
      "https://jithendrababug.github.io",
      "https://jithendrababug.github.io/IoT-Dashboard",
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

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

function loadEmailConfig() {
  const row = db.prepare("SELECT * FROM email_config WHERE id = 1").get();
  if (!row) return null;

  return {
    fromEmail: row.from_email,
    appPass: row.app_pass,
    recipients: JSON.parse(row.recipients || "[]"),
  };
}

function createTransporter(fromEmail, appPass) {
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: fromEmail, pass: appPass },
  });
}

/* ------------------------------------------------
   ✅ DEBUG: check what backend has stored
------------------------------------------------- */
app.get("/api/alerts/config", (req, res) => {
  try {
    const cfg = loadEmailConfig();
    if (!cfg) return res.json({ ok: true, hasConfig: false });
    return res.json({
      ok: true,
      hasConfig: true,
      fromEmail: cfg.fromEmail,
      recipientsCount: Array.isArray(cfg.recipients) ? cfg.recipients.length : 0,
      recipients: cfg.recipients,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/* ------------------------------------------------
   ✅ Save popup data into DB (AND verify Gmail auth)
------------------------------------------------- */
app.post("/api/alerts/config", async (req, res) => {
  try {
    const { fromEmail, appPass, recipients } = req.body || {};

    const from = String(fromEmail || "").trim();
    const pass = String(appPass || "").trim();
    const list = Array.isArray(recipients)
      ? recipients.map((r) => String(r || "").trim()).filter(Boolean)
      : [];

    if (!from || !pass || list.length === 0) {
      return res.status(400).json({ ok: false, error: "Missing fields" });
    }
    if (!isValidEmail(from)) {
      return res.status(400).json({ ok: false, error: "Invalid sender email" });
    }
    const bad = list.find((r) => !isValidEmail(r));
    if (bad) {
      return res.status(400).json({ ok: false, error: `Invalid receiver email: ${bad}` });
    }

    // ✅ Verify credentials BEFORE saving (so “saved” means it can send)
    try {
      const t = createTransporter(from, pass);
      await t.verify(); // throws if auth fails
    } catch (e) {
      return res.status(400).json({
        ok: false,
        error:
          "Gmail authentication failed. Make sure you enabled 2-Step Verification and used an App Password (16 chars).",
        detail: String(e?.message || e),
      });
    }

    // ✅ Save (replace existing config)
    db.prepare(
      `
        INSERT INTO email_config (id, from_email, app_pass, recipients)
        VALUES (1, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          from_email=excluded.from_email,
          app_pass=excluded.app_pass,
          recipients=excluded.recipients
      `
    ).run(from, pass, JSON.stringify(list));

    return res.json({ ok: true });
  } catch (err) {
    console.error("Config save error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/* ------------------------------------------------
   ✅ NEW: Send test email (your UI button calls this)
------------------------------------------------- */
app.post("/api/alerts/test-email", async (req, res) => {
  try {
    const cfg = loadEmailConfig();
    if (!cfg) {
      return res.status(400).json({
        ok: false,
        error: "Email config not set. Please submit Email Alert popup first.",
      });
    }

    if (!cfg.fromEmail || !cfg.appPass || !cfg.recipients?.length) {
      return res.status(400).json({ ok: false, error: "Saved email config is incomplete." });
    }

    const t = createTransporter(cfg.fromEmail, cfg.appPass);

    const when = normalizeToIST(new Date());
    await t.sendMail({
      from: cfg.fromEmail,
      to: cfg.recipients.join(","),
      subject: `✅ Test Email - IoT Dashboard (${when})`,
      text:
        `This is a TEST email from your IoT Dashboard.\n\n` +
        `If you received this, your Email Alerts setup is working ✅\n` +
        `Time (IST): ${when}\n`,
    });

    return res.json({ ok: true, sent: true, to: cfg.recipients });
  } catch (err) {
    console.error("❌ Test email error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/* ------------------------------------------------
   ✅ Insert alert (always), email optional
------------------------------------------------- */
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

    const createdAtFinal = normalizeToIST(clientTimeISO);

    // ✅ Prevent duplicates permanently (reading_id UNIQUE)
    try {
      db.prepare(
        `INSERT INTO alerts (reading_id, created_at, severity, temperature, humidity, pressure, message)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(readingId, createdAtFinal, severity, temperature, humidity, pressure, message);
    } catch (e) {
      if (!String(e.message || "").includes("UNIQUE")) throw e;
    }

    if (!sendEmail) {
      return res.json({
        ok: true,
        stored: true,
        sent: false,
        reason: "Email disabled",
        created_at: createdAtFinal,
      });
    }

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

    const cfg = loadEmailConfig();
    if (!cfg) {
      return res.json({
        ok: true,
        stored: true,
        sent: false,
        reason: "Email config not set.",
        created_at: createdAtFinal,
      });
    }

    const t = createTransporter(cfg.fromEmail, cfg.appPass);

    await t.sendMail({
      from: cfg.fromEmail,
      to: cfg.recipients.join(","),
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
      to: cfg.recipients,
    });
  } catch (err) {
    console.error("❌ Email alert error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ✅ Latest alerts (default 10)
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
