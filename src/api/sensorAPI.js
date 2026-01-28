import { useSensorStore } from "../context/sensorStore";

let intervalId = null;
let seeded = false;

let lastAlertAt = 0;
const ALERT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const INTERVAL_MS = 300000;              // 5 minutes
const SEED_COUNT = 20;                   // preload 20 readings

const makeReading = (dateObj) => ({
  id: dateObj.getTime(),
  time: dateObj.toLocaleTimeString(),
  temperature: Number((20 + Math.random() * 10).toFixed(1)),
  humidity: Number((40 + Math.random() * 20).toFixed(1)),
  pressure: Number((1000 + Math.random() * 50).toFixed(1)),
});

export const startSensorSimulation = () => {
  if (intervalId) return () => {};

  const { addSensorData } = useSensorStore.getState();

  // ✅ Seed 20 readings only once (past 95 minutes → now, step 5 min)
  if (!seeded) {
    seeded = true;

    const now = new Date();
    for (let i = SEED_COUNT - 1; i >= 0; i--) {
      const dt = new Date(now.getTime() - i * INTERVAL_MS);
      addSensorData(makeReading(dt));
    }
  }

  const tick = () => {
    const now = new Date();
    const data = makeReading(now);
    addSensorData(data);

    const breach =
      data.temperature > 30 || data.humidity > 70 || data.pressure > 1020;

    const alertsEnabled = useSensorStore.getState().alertsEnabled;

    const nowMs = Date.now();
    if (alertsEnabled && breach && nowMs - lastAlertAt >= ALERT_COOLDOWN_MS) {
      lastAlertAt = nowMs;

      fetch("http://localhost:5000/api/alerts/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).catch(() => {});
    }
  };

  // ✅ Real interval: exactly 5 minutes
  intervalId = setInterval(tick, INTERVAL_MS);

  return () => {
    clearInterval(intervalId);
    intervalId = null;
  };
};
