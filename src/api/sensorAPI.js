import { useSensorStore } from "../context/sensorStore";

let intervalId = null;
let timeoutId = null;
let seeded = false;

const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const SEED_COUNT = 20;

// ✅ Snap any time to the previous 5-min boundary (seconds=0)
function floorTo5Minutes(date) {
  const d = new Date(date);
  d.setSeconds(0, 0);
  const mins = d.getMinutes();
  d.setMinutes(mins - (mins % 5));
  return d;
}

// ✅ Create a reading using an exact time (no random seconds)
function makeReading(dateObj) {
  const timeISO = dateObj.toISOString();

  return {
    id: dateObj.getTime(), // unique per 5-min slot (ms)
    readingId: String(dateObj.getTime()), // ✅ stable unique ID to dedupe alerts
    timeISO,
    time: dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    temperature: Number((20 + Math.random() * 10).toFixed(1)),
    humidity: Number((40 + Math.random() * 20).toFixed(1)),
    pressure: Number((1000 + Math.random() * 50).toFixed(1)),
  };
}

// ✅ Backend base
const API_BASE =
  process.env.NODE_ENV === "production"
    ? "https://iot-dashboard-y27r.onrender.com"
    : "http://localhost:5000";

export const startSensorSimulation = () => {
  if (intervalId || timeoutId) return () => {};

  const { addSensorData } = useSensorStore.getState();

  // ✅ 1) Seed exactly 20 readings aligned to 5-minute boundary
  if (!seeded) {
    seeded = true;

    const alignedNow = floorTo5Minutes(new Date());

    for (let i = SEED_COUNT - 1; i >= 0; i--) {
      const dt = new Date(alignedNow.getTime() - i * INTERVAL_MS);
      addSensorData(makeReading(dt));
    }
  }

  // ✅ 2) Tick function: add reading exactly on boundary
  const tick = async () => {
    const alignedNow = floorTo5Minutes(new Date());
    const data = makeReading(alignedNow);

    addSensorData(data);

    const breach =
      data.temperature > 30 || data.humidity > 70 || data.pressure > 1020;

    const alertsEnabled = useSensorStore.getState().alertsEnabled;

    if (alertsEnabled && breach) {
      try {
        await fetch(`${API_BASE}/api/alerts/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            temperature: data.temperature,
            humidity: data.humidity,
            pressure: data.pressure,
            clientTimeISO: data.timeISO, // ✅ exact ISO for this reading
            readingId: data.readingId,   // ✅ used by backend to avoid duplicates
          }),
        });
        window.dispatchEvent(new Event("alerts-updated"));
      } catch (e) {
        console.error("Alert POST failed:", e);
      }
    }
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
