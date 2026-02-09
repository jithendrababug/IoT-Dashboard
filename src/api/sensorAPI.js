import { useSensorStore } from "../context/sensorStore";

let intervalId = null;
let timeoutId = null;
let seeded = false;

const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const SEED_COUNT = 20;

// ✅ Backend base
const API_BASE =
  process.env.REACT_APP_API_BASE ||
  (process.env.NODE_ENV === "production"
    ? "https://iot-dashboard-y27r.onrender.com"
    : "http://localhost:5000");

// ✅ Snap any time to the previous 5-min boundary (and set seconds=0)
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
  const n = Number(readingId);
  return Number.isFinite(n) ? (n & 0xffffffff) : 123456789;
}

// ✅ Create a reading using exact time + stable values
function makeReading(dateObj) {
  const readingId = String(dateObj.getTime()); // ✅ stable unique id
  const timeISO = dateObj.toISOString();

  const rand = mulberry32(seedFromReadingId(readingId));

  const temperature = Number((20 + rand() * 10).toFixed(1)); // 20–30
  const humidity = Number((40 + rand() * 20).toFixed(1)); // 40–60
  const pressure = Number((1000 + rand() * 50).toFixed(1)); // 1000–1050

  return {
    id: dateObj.getTime(),
    readingId,
    timeISO,
    // ✅ show date+time in sensor table (you requested)
    dateTime: dateObj.toLocaleString([], {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
    temperature,
    humidity,
    pressure,
  };
}

function isBreach(reading) {
  return (
    reading.temperature > 30 ||
    reading.humidity > 70 ||
    reading.pressure > 1020
  );
}

// ✅ log alert to backend (and let AlertHistory auto-refresh)
async function recordAlert(reading, { allowEmail }) {
  // If not breach, do nothing
  if (!isBreach(reading)) return;

  // IMPORTANT:
  // - If you update backend to use `suppressEmail`, keep that.
  // - If your backend uses `sendEmail`, keep that.
  const payload = {
    readingId: reading.readingId,
    temperature: reading.temperature,
    humidity: reading.humidity,
    pressure: reading.pressure,
    clientTimeISO: reading.timeISO,

    // Support BOTH (safe):
    sendEmail: !!allowEmail,          // if backend expects sendEmail
    suppressEmail: !allowEmail,       // if backend expects suppressEmail
  };

  try {
    const res = await fetch(`${API_BASE}/api/alerts/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // even if response isn't used, notify UI to refresh
    if (res.ok) window.dispatchEvent(new Event("alerts-updated"));
  } catch (e) {
    console.error("Alert POST failed:", e);
  }
}

export const startSensorSimulation = () => {
  // ✅ prevents double start
  if (intervalId || timeoutId) return () => {};

  const { addSensorData } = useSensorStore.getState();

  // ✅ 1) Seed exactly 20 readings aligned to 5-min boundary
  if (!seeded) {
    seeded = true;

    const alignedNow = floorTo5Minutes(new Date());

    // oldest -> newest
    for (let i = SEED_COUNT - 1; i >= 0; i--) {
      const dt = new Date(alignedNow.getTime() - i * INTERVAL_MS);
      const r = makeReading(dt);
      addSensorData(r);

      // ✅ Seed should LOG breaches but NOT send email
      recordAlert(r, { allowEmail: false });
    }
  }

  // ✅ 2) Tick function: add reading exactly on boundary
  const tick = async () => {
    const alignedNow = floorTo5Minutes(new Date());
    const r = makeReading(alignedNow);

    addSensorData(r);

    const alertsEnabled = useSensorStore.getState().alertsEnabled;

    // ✅ Live readings: log breaches always; email only if toggle enabled
    await recordAlert(r, { allowEmail: !!alertsEnabled });
  };

  // ✅ 3) Start exactly at the next 5-minute boundary, then every 5 minutes
  const now = new Date();
  const alignedNow = floorTo5Minutes(now);
  const next = new Date(alignedNow.getTime() + INTERVAL_MS);
  const delay = next.getTime() - now.getTime();

  timeoutId = setTimeout(() => {
    tick(); // run once exactly at boundary
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

// ✅ RESET: clear current sensor readings and restart from "now boundary"
export const resetSensorSimulation = () => {
  const { clearSensorData } = useSensorStore.getState();

  // stop timers
  if (timeoutId) clearTimeout(timeoutId);
  if (intervalId) clearInterval(intervalId);
  timeoutId = null;
  intervalId = null;

  // clear store data (you must have clearSensorData action in store)
  if (typeof clearSensorData === "function") clearSensorData();

  // restart seeding from now
  seeded = false;
  startSensorSimulation();
};
