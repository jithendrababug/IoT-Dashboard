import { useSensorStore } from "../context/sensorStore";

let intervalId = null;
let timeoutId = null;
let seeded = false;

const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const SEED_COUNT = 20;

function floorTo5Minutes(date) {
  const d = new Date(date);
  d.setSeconds(0, 0);
  const mins = d.getMinutes();
  d.setMinutes(mins - (mins % 5));
  return d;
}

// ✅ deterministic PRNG from a seed (Mulberry32)
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// ✅ make a numeric seed from readingId (timestamp)
function seedFromReadingId(readingId) {
  // readingId is like "1700000000000" → use lower 32 bits
  const n = Number(readingId);
  return Number.isFinite(n) ? (n & 0xffffffff) : 123456789;
}

// ✅ Create a reading using exact time (no random seconds) + stable values
function makeReading(dateObj) {
  const timeISO = dateObj.toISOString();
  const readingId = String(dateObj.getTime());

  const rand = mulberry32(seedFromReadingId(readingId));

  const temperature = Number((20 + rand() * 10).toFixed(1));  // 20–30
  const humidity = Number((40 + rand() * 20).toFixed(1));     // 40–60
  const pressure = Number((1000 + rand() * 50).toFixed(1));   // 1000–1050

  return {
    id: dateObj.getTime(),
    readingId,       // ✅ stable unique id
    timeISO,
    time: dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    temperature,
    humidity,
    pressure,
  };
}


const API_BASE =
  process.env.NODE_ENV === "production"
    ? "https://iot-dashboard-y27r.onrender.com"
    : "http://localhost:5000";

// ✅ single helper to record + optionally email
async function recordAlertIfBreach(reading) {
  const breach =
    reading.temperature > 30 ||
    reading.humidity > 70 ||
    reading.pressure > 1020;

  if (!breach) return;

  const alertsEnabled = useSensorStore.getState().alertsEnabled;

  try {
    await fetch(`${API_BASE}/api/alerts/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        readingId: reading.readingId,      // ✅ prevents duplicates
        temperature: reading.temperature,
        humidity: reading.humidity,
        pressure: reading.pressure,
        clientTimeISO: reading.timeISO,    // ✅ exact time in ISO
        sendEmail: !!alertsEnabled,        // ✅ email controlled by toggle
      }),
    });
  } catch (e) {
    console.error("Alert POST failed:", e);
  }
}

export const startSensorSimulation = () => {
  if (intervalId || timeoutId) return () => {};

  const { addSensorData } = useSensorStore.getState();

  // ✅ Seed 20 readings aligned to 5-min boundary
  if (!seeded) {
    seeded = true;

    const alignedNow = floorTo5Minutes(new Date());

    // oldest -> newest
    for (let i = SEED_COUNT - 1; i >= 0; i--) {
      const dt = new Date(alignedNow.getTime() - i * INTERVAL_MS);
      const r = makeReading(dt);

      addSensorData(r);

      // ✅ IMPORTANT: record seed breaches too (history matches table)
      // uses readingId so reloading won't duplicate the exact same row
      recordAlertIfBreach(r);
    }
  }

  const tick = async () => {
    const alignedNow = floorTo5Minutes(new Date());
    const r = makeReading(alignedNow);

    addSensorData(r);

    // ✅ record breach (history always), email optional
    recordAlertIfBreach(r);
  };

  // next boundary
  const now = new Date();
  const alignedNow = floorTo5Minutes(now);
  const next = new Date(alignedNow.getTime() + INTERVAL_MS);
  const delay = next.getTime() - now.getTime();

  timeoutId = setTimeout(() => {
    tick();
    intervalId = setInterval(tick, INTERVAL_MS);
    timeoutId = null;
  }, delay);

  return () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (intervalId) clearInterval(intervalId);
    timeoutId = null;
    intervalId = null;
  };
};
