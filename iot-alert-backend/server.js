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

// ✅ Record always, email optionally
app.post("/api/alerts/email", async (req, res) => {
  try {
    const {
      readingId,          // ✅ unique id from frontend
      temperature,
      humidity,
      pressure,
      clientTimeISO,      // ✅ exact reading time in ISO
      sendEmail = true,   // ✅ frontend decides (toggle)
    } = req.body;

    if (temperature == null || humidity == null || pressure == null) {
      return res.status(400).json({ ok: false, error: "Missing sensor values" });
    }

    const { triggers, severity, message } = getSeverityAndTriggers({
      temperature,
      humidity,
      pressure,
    });

    // Only act if breached
    if (triggers.length === 0) {
      return res.json({ ok: true, recorded: false, sent: false, reason: "No threshold breached" });
    }

    // ✅ Always use ISO time for DB
    const createdAtISO =
      typeof clientTimeISO === "string" && !Number.isNaN(Date.parse(clientTimeISO))
        ? new Date(clientTimeISO).toISOString()
        : new Date().toISOString();

    const reading_id = String(readingId ?? createdAtISO); // fallback, but readingId should be provided

    // ✅ Insert once (UNIQUE reading_id prevents duplicates permanently)
    db.prepare(`
      INSERT OR IGNORE INTO alerts (reading_id, created_at, severity, temperature, humidity, pressure, message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(reading_id, createdAtISO, severity, temperature, humidity, pressure, message);

    // If toggle OFF → no email, but history is still recorded
    if (!sendEmail) {
      return res.json({ ok: true, recorded: true, sent: false, severity, created_at: createdAtISO });
    }

    // Cooldown affects only EMAIL
    const nowMs = Date.now();
    if (nowMs - lastSentAt < COOLDOWN_MS) {
      return res.json({ ok: true, recorded: true, sent: false, reason: "Cooldown active", severity });
    }

    const displayTime = new Date(createdAtISO).toLocaleString();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ALERT_TO,
      subject: `🚨 [${severity}] IoT Alert (${displayTime})`,
      text:
        `🚨 IoT Dashboard Alert\n\n` +
        `Severity: ${severity}\n` +
        `Date & Time: ${displayTime}\n\n` +
        `Triggered Conditions:\n- ${triggers.join("\n- ")}\n\n` +
        `Current Readings:\n` +
        `Temperature: ${temperature}°C\n` +
        `Humidity: ${humidity}%\n` +
        `Pressure: ${pressure} hPa\n`,
    });

    lastSentAt = nowMs;

    return res.json({ ok: true, recorded: true, sent: true, severity, created_at: createdAtISO });
  } catch (err) {
    console.error("❌ Alert error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/alerts/history", (toggleReq, res) => {
  try {
    const rows = db.prepare("SELECT * FROM alerts ORDER BY created_at DESC LIMIT 10").all();
    res.json({ ok: true, alerts: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Email alert server running on port ${PORT}`));
