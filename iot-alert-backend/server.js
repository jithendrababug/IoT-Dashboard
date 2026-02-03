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
    methods: ["GET", "POST"],
  })
);

app.use(express.json());

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
let lastSentAt = 0;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// Helper: severity + message builder
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

// ✅ Send alert + store in DB
app.post("/api/alerts/email", async (req, res) => {
  try {
    const { temperature, humidity, pressure, clientTimeISO, readingId } = req.body;

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

    // Only store/send if threshold breached
    if (triggers.length === 0) {
      return res.json({ ok: true, sent: false, reason: "No threshold breached" });
    }

    // ✅ Always store ISO time (exact reading time)
    const createdAtISO =
      typeof clientTimeISO === "string" && !Number.isNaN(Date.parse(clientTimeISO))
        ? new Date(clientTimeISO).toISOString()
        : new Date().toISOString();

    // ✅ Prevent duplicates (same alert inserted twice)
    const safeReadingId =
      readingId != null ? String(readingId) : `${createdAtISO}|${temperature}|${humidity}|${pressure}|${message}`;

    const existing = db
      .prepare(`SELECT id FROM alerts WHERE reading_id = ? LIMIT 1`)
      .get(safeReadingId);

    if (!existing) {
      db.prepare(
        `INSERT INTO alerts (created_at, reading_id, severity, temperature, humidity, pressure, message)
        VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(createdAtISO, safeReadingId, severity, temperature, humidity, pressure, message);
    }


    // ✅ Cooldown affects only EMAIL (not history logging)
    const nowMs = Date.now();
    if (nowMs - lastSentAt < COOLDOWN_MS) {
      return res.json({ ok: true, sent: false, reason: "Cooldown active", severity });
    }

    // Email display time can be human-friendly
    const displayTime = new Date(createdAtISO).toLocaleString();

    const subject = `🚨 [${severity}] IoT Alert (${displayTime})`;
    const text =
      `🚨 IoT Dashboard Alert\n\n` +
      `Severity: ${severity}\n` +
      `Date & Time: ${displayTime}\n\n` +
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

    return res.json({ ok: true, sent: true, severity, created_at: createdAtISO });
  } catch (err) {
    console.error("❌ Email alert error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ✅ Fetch alert history (latest first)
// ISO strings sort correctly, but we still order by id DESC
app.get("/api/alerts/history", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM alerts ORDER BY id DESC LIMIT 100").all();
    res.json({ ok: true, alerts: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Email alert server running on port ${PORT}`));
