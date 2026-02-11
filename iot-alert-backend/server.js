import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import db from "./db.js";

function loadEmailConfig() {
  const row = db.prepare("SELECT * FROM email_config WHERE id = 1").get();
  if (!row) return null;

  return {
    fromEmail: row.from_email,
    appPass: row.app_pass,
    recipients: JSON.parse(row.recipients || "[]"),
  };
}

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
    methods: ["GET", "POST"],
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

  if (typeof input === "string" && !Number.isNaN(Date.parse(input))) {
    return toISTISOString(input);
  }

  return toISTISOString(new Date());
}

function getSeverityAndTriggers({ temperature, humidity, pressure }) {
  const triggers = [];

  if (temperature > 30)
    triggers.push(`Temperature: ${temperature}°C (limit: 30°C)`);
  if (humidity > 70) triggers.push(`Humidity: ${humidity}% (limit: 70%)`);
  if (pressure > 1020)
    triggers.push(`Pressure: ${pressure} hPa (limit: 1020 hPa)`);

  const critical = temperature >= 35 || humidity >= 85 || pressure >= 1030;
  const severity = critical ? "CRITICAL" : "WARNING";
  const message = triggers.join(" | ");

  return { triggers, severity, message };
}

/* ------------------------------------------------
   ✅ Save popup data into DB
------------------------------------------------- */
app.post("/api/alerts/config", (req, res) => {
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
      return res
        .status(400)
        .json({ ok: false, error: `Invalid receiver email: ${bad}` });
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
    ).run(from, pass, JSON.stringify(list));

    return res.json({ ok: true });
  } catch (err) {
    console.error("Config save error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/* ------------------------------------------------
   ✅ NEW: Test Email endpoint (for your popup)
------------------------------------------------- */
app.post("/api/alerts/test-email", async (req, res) => {
  try {
    const emailConfig = loadEmailConfig();

    if (
      !emailConfig ||
      !emailConfig.fromEmail ||
      !emailConfig.appPass ||
      !Array.isArray(emailConfig.recipients) ||
      emailConfig.recipients.length === 0
    ) {
      return res.status(400).json({
        ok: false,
        error: "Email config not set. Please submit Email Alert popup first.",
      });
    }

    const dynamicTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: emailConfig.fromEmail, pass: emailConfig.appPass },
    });

    // ✅ This verifies auth immediately and returns a clear error if wrong
    await dynamicTransporter.verify();

    const displayTime = toISTISOString(new Date());

    await dynamicTransporter.sendMail({
      from: emailConfig.fromEmail,
      to: emailConfig.recipients.join(","),
      subject: `✅ Test Email Alert (${displayTime})`,
      text:
        `This is a TEST email from your IoT Dashboard.\n\n` +
        `Time (IST): ${displayTime}\n` +
        `If you received this, your email configuration is correct.\n`,
    });

    return res.json({ ok: true, sent: true, to: emailConfig.recipients });
  } catch (err) {
    console.error("❌ Test email error:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Failed to send test email",
    });
  }
});

/* ------------------------------------------------
   ✅ Insert alert (always), email optional
------------------------------------------------- */
app.post("/api/alerts/email", async (req, res) => {
  try {
    const {
      readingId,
      temperature,
      humidity,
      pressure,
      clientTimeISO,
      sendEmail,
    } = req.body;

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
      return res.json({
        ok: true,
        stored: false,
        sent: false,
        reason: "No threshold breached",
      });
    }

    const createdAtFinal =
      normalizeToIST(clientTimeISO) ||
      new Date()
        .toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" })
        .replace(" ", "T") + "+05:30";

    try {
      db.prepare(
        `INSERT INTO alerts (reading_id, created_at, severity, temperature, humidity, pressure, message)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(readingId, createdAtFinal, severity, temperature, humidity, pressure, message);
    } catch (e) {
      if (!String(e.message || "").includes("UNIQUE")) throw e;
    }

    const wantsEmail = !!sendEmail;

    if (!wantsEmail) {
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

    const emailConfig = loadEmailConfig();

    if (!emailConfig) {
      return res.json({
        ok: true,
        stored: true,
        sent: false,
        reason: "Email config not set.",
        created_at: createdAtFinal,
      });
    }

    const dynamicTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailConfig.fromEmail,
        pass: emailConfig.appPass,
      },
    });

    // ✅ verify before sending for clearer error in logs
    await dynamicTransporter.verify();

    const displayTime = createdAtFinal;

    await dynamicTransporter.sendMail({
      from: emailConfig.fromEmail,
      to: emailConfig.recipients.join(","),
      subject: `🚨 [${severity}] IoT Alert (${displayTime})`,
      text:
        `🚨 IoT Dashboard Alert\n\n` +
        `Severity: ${severity}\n` +
        `Date & Time (IST): ${displayTime}\n\n` +
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
    });
  } catch (err) {
    console.error("❌ Email alert error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/alerts/history", (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 10), 100);
    const rows = db
      .prepare("SELECT * FROM alerts ORDER BY created_at DESC LIMIT ?")
      .all(limit);

    res.json({ ok: true, alerts: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Email alert server running on port ${PORT}`));
