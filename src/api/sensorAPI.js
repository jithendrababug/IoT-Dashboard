import { useSensorStore } from "../context/sensorStore";

let intervalId = null;
let seeded = false;

const INTERVAL_MS = 300000; // 5 minutes
const SEED_COUNT = 20;

// ✅ Always use Render backend in production
const API_BASE =
  process.env.NODE_ENV === "production"
    ? "https://iot-dashboard-y27r.onrender.com"
    : "http://localhost:5000";

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

  // Seed 20 readings once
  if (!seeded) {
    seeded = true;
    const now = new Date();
    for (let i = SEED_COUNT - 1; i >= 0; i--) {
      const dt = new Date(now.getTime() - i * INTERVAL_MS);
      addSensorData(makeReading(dt));
    }
  }

  const tick = async () => {
    const now = new Date();
    const data = makeReading(now);
    addSensorData(data);

    const breach =
      data.temperature > 30 || data.humidity > 70 || data.pressure > 1020;

    const alertsEnabled = useSensorStore.getState().alertsEnabled;

    // ✅ Always POST on breach (backend decides email cooldown + logs history)
    if (alertsEnabled && breach) {
      try {
        const res = await fetch(`${API_BASE}/api/alerts/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            clientTimeISO: now.toISOString(), // ✅ store real reading time
          }),
        });

        // optional debug
        // const json = await res.json();
        // console.log("Alert API:", json);
      } catch (e) {
        console.error("Alert POST failed:", e);
      }
    }
  };

  intervalId = setInterval(tick, INTERVAL_MS);

  return () => {
    clearInterval(intervalId);
    intervalId = null;
  };
};
