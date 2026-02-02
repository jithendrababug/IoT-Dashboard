import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import db from "./db.js";

dotenv.config();

const app = express();

// ✅ CORS: allow localhost + GitHub Pages (and your repo page path)
app.use(
  cors({
    origin: [
      "http://localhost:3000",
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

// ✅ Mail transporter (Gmail App Password)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper: severity + message builder
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

// ✅ Health check (useful for Render)
app.get("/", (req, res) => {
  res.json({ ok: true, message: "IoT Alert Backend is running" });
});

// ✅ Send alert + store in DB
app.post("/api/alerts/email", async (req, res) => {
  try {
    const { temperature, humidity, pressure, clientTimeISO } = req.body;

    // Validate
    if (temperature == null || humidity == null || pressure == null) {
      return res.status(400).json({
        ok: false,
        error: "Missing sensor values (temperature, humidity, pressure)",
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

    // ✅ ALWAYS store ISO timestamp (stable across timezones)
    const createdAtISO = clientTimeISO
      ? new Date(clientTimeISO).toISOString()
      : new Date().toISOString();

    // ✅ Store to DB even if cooldown blocks email
    db.prepare(
      `
      INSERT INTO alerts (created_at, severity, temperature, humidity, pressure, message)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    ).run(createdAtISO, severity, temperature, humidity, pressure, message);

    // ✅ Cooldown affects ONLY email sending (not storing)
    const nowMs = Date.now();
    if (nowMs - lastSentAt < COOLDOWN_MS) {
      return res.json({
        ok: true,
        stored: true,
        sent: false,
        reason: "Cooldown active",
        severity,
      });
    }

    // Send email
    const subject = `🚨 [${severity}] IoT Alert (${createdAtISO})`;
    const text =
      `🚨 IoT Dashboard Alert\n\n` +
      `Severity: ${severity}\n` +
      `Timestamp (UTC ISO): ${createdAtISO}\n\n` +
      `Triggered Conditions:\n- ${triggers.join("\n- ")}\n\n` +
      `Current Readings:\n` +
      `Temperature: ${temperature}°C\n` +
      `Humidity: ${humidity}%\n` +
      `Pressure: ${pressure} hPa\n`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ALERT_TO,
      subject,
      text,
    });

    lastSentAt = nowMs;

    return res.json({ ok: true, stored: true, sent: true, severity });
  } catch (err) {
    console.error("❌ Email alert error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ✅ Fetch alert history (latest first)
app.get("/api/alerts/history", (req, res) => {
  try {
    const rows = db
      .prepare("SELECT * FROM alerts ORDER BY id DESC LIMIT 100")
      .all();
    res.json({ ok: true, alerts: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Email alert server running on port ${PORT}`));
