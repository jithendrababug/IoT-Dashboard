import { useSensorStore } from "../context/sensorStore";

let intervalId = null;
let timeoutId = null;

const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const SEED_COUNT = 20;

const API_BASE =
  process.env.NODE_ENV === "production"
    ? "https://iot-dashboard-y27r.onrender.com"
    : "http://localhost:5000";

function floorTo5Minutes(date) {
  const d = new Date(date);
  d.setSeconds(0, 0);
  const mins = d.getMinutes();
  d.setMinutes(mins - (mins % 5));
  return d;
}

// deterministic PRNG (Mulberry32)
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function makeReading(dateObj) {
  const aligned = floorTo5Minutes(dateObj);
  const readingId = String(aligned.getTime()); // stable id
  const rand = mulberry32(Number(aligned.getTime()) & 0xffffffff);

  const temperature = Number((20 + rand() * 10).toFixed(1)); // 20-30
  const humidity = Number((40 + rand() * 20).toFixed(1)); // 40-60
  const pressure = Number((1000 + rand() * 50).toFixed(1)); // 1000-1050

  return {
    id: aligned.getTime(),
    readingId,
    timeISO: aligned.toISOString(),
    // ✅ show Date + Time in table
    timeLabel: aligned.toLocaleString([], {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
    temperature,
    humidity,
    pressure,
  };
}

async function recordAlertIfBreach(reading) {
  const breach =
    reading.temperature > 30 ||
    reading.humidity > 70 ||
    reading.pressure > 1020;

  if (!breach) return;

  const alertsEnabled = useSensorStore.getState().alertsEnabled;

  await fetch(`${API_BASE}/api/alerts/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      readingId: reading.readingId,
      temperature: reading.temperature,
      humidity: reading.humidity,
      pressure: reading.pressure,
      clientTimeISO: reading.timeISO,
      sendEmail: !!alertsEnabled,
    }),
  }).catch(() => {});

  // tell AlertHistory to refresh immediately
  window.dispatchEvent(new Event("alerts-updated"));
}

export function stopSensorSimulation() {
  if (timeoutId) clearTimeout(timeoutId);
  if (intervalId) clearInterval(intervalId);
  timeoutId = null;
  intervalId = null;
}

function seedFromNow() {
  const { addSensorData } = useSensorStore.getState();
  const alignedNow = floorTo5Minutes(new Date());

  for (let i = SEED_COUNT - 1; i >= 0; i--) {
    const dt = new Date(alignedNow.getTime() - i * INTERVAL_MS);
    const r = makeReading(dt);
    addSensorData(r);
    recordAlertIfBreach(r);
  }
}

export function startSensorSimulation() {
  if (intervalId || timeoutId) return () => {};

  seedFromNow();

  const tick = () => {
    const r = makeReading(new Date());
    useSensorStore.getState().addSensorData(r);
    recordAlertIfBreach(r);
  };

  const now = new Date();
  const alignedNow = floorTo5Minutes(now);
  const next = new Date(alignedNow.getTime() + INTERVAL_MS);
  const delay = next.getTime() - now.getTime();

  timeoutId = setTimeout(() => {
    tick();
    intervalId = setInterval(tick, INTERVAL_MS);
    timeoutId = null;
  }, delay);

  return stopSensorSimulation;
}

// ✅ Reset: clears store and restarts from clicked time
export async function resetSensorSimulation() {
  stopSensorSimulation();
  useSensorStore.getState().clearSensors();

  // reset alerts DB too (so history starts fresh)
  await fetch(`${API_BASE}/api/alerts/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }).catch(() => {});

  seedFromNow();
  startSensorSimulation();

  window.dispatchEvent(new Event("alerts-updated"));
}
