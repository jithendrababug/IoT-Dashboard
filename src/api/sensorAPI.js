import { useSensorStore } from "../context/sensorStore";

let intervalId = null;
let timeoutId = null;

const INTERVAL_MS = 5 * 60 * 1000;
const SEED_COUNT = 20;

function floorTo5Minutes(date) {
  const d = new Date(date);
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() - (d.getMinutes() % 5));
  return d;
}

// deterministic generator
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function makeReading(date) {
  const readingId = String(date.getTime());
  const rand = mulberry32(date.getTime());

  return {
    id: date.getTime(),
    readingId,
    timeISO: date.toISOString(),
    time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    temperature: Number((20 + rand() * 10).toFixed(1)),
    humidity: Number((40 + rand() * 20).toFixed(1)),
    pressure: Number((1000 + rand() * 50).toFixed(1)),
  };
}

const API_BASE =
  process.env.REACT_APP_API_BASE ||
  (process.env.NODE_ENV === "production"
    ? "https://iot-dashboard-y27r.onrender.com"
    : "http://localhost:5000");

// send alert to backend only if breach
async function sendAlertIfBreach(reading) {
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
        readingId: reading.readingId,
        temperature: reading.temperature,
        humidity: reading.humidity,
        pressure: reading.pressure,
        clientTimeISO: reading.timeISO,
        sendEmail: !!alertsEnabled,
      }),
    });

    // ✅ Tell AlertHistory to refresh immediately
    window.dispatchEvent(new Event("alerts-updated"));
  } catch (e) {
    console.error("Alert POST failed:", e);
  }
}

export const startSensorSimulation = () => {
  // safety: if already running, do nothing
  if (intervalId || timeoutId) return;

  const store = useSensorStore.getState();
  const alignedNow = floorTo5Minutes(new Date());

  // seed 20 readings
  for (let i = SEED_COUNT - 1; i >= 0; i--) {
    const t = new Date(alignedNow.getTime() - i * INTERVAL_MS);
    const r = makeReading(t);
    store.addSensorData(r);

    // ✅ seed breaches also go to backend
    sendAlertIfBreach(r);
  }

  const tick = () => {
    const now = floorTo5Minutes(new Date());
    const r = makeReading(now);
    store.addSensorData(r);

    sendAlertIfBreach(r);
  };

  // schedule next exact 5-min boundary
  const next = new Date(alignedNow.getTime() + INTERVAL_MS);
  timeoutId = setTimeout(() => {
    tick();
    intervalId = setInterval(tick, INTERVAL_MS);
    timeoutId = null;
  }, next.getTime() - Date.now());
};

// Optional helper (not reset) - if you ever need to stop timers safely
export const stopSensorSimulation = () => {
  if (timeoutId) clearTimeout(timeoutId);
  if (intervalId) clearInterval(intervalId);
  timeoutId = null;
  intervalId = null;
};
