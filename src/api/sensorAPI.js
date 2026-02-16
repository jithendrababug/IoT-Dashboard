import { useSensorStore } from "../context/sensorStore";

let intervalId = null;
let timeoutId = null;

const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const SEED_COUNT = 20;


const API_BASE =
  process.env.REACT_APP_API_BASE ||
  (process.env.NODE_ENV === "production"
    ? "https://iot-dashboard-y27r.onrender.com"
    : "http://localhost:5000");


const IST_OFFSET_MIN = 330;


function toISTISOString(date) {
  const ist = new Date(date.getTime() + IST_OFFSET_MIN * 60 * 1000);
  return ist.toISOString().replace("Z", "+05:30");
}


function floorTo5Minutes(date) {
  const d = new Date(date);
  d.setSeconds(0, 0);
  const mins = d.getMinutes();
  d.setMinutes(mins - (mins % 5));
  return d;
}


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
  const readingId = String(dateObj.getTime());


  const timeISO = toISTISOString(dateObj);

  const rand = mulberry32(dateObj.getTime());

  return {
    id: dateObj.getTime(),
    readingId,
    timeISO,

 
    time: dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),

    temperature: Number((20 + rand() * 10).toFixed(1)), 
    humidity: Number((40 + rand() * 20).toFixed(1)), 
    pressure: Number((1000 + rand() * 50).toFixed(1)), 
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function postWithRetry(url, body, tries = 3) {
  let lastErr;

  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${txt}`);
      }

      const json = await res.json().catch(() => ({}));
      if (json && json.ok === false) {
        throw new Error(json.error || "Backend returned ok:false");
      }

      return json;
    } catch (e) {
      lastErr = e;
      const delay = attempt === 1 ? 500 : attempt === 2 ? 1500 : 3000;
      await sleep(delay);
    }
  }

  throw lastErr;
}

async function recordAlertIfBreach(reading) {
  const breach =
    reading.temperature > 30 ||
    reading.humidity > 70 ||
    reading.pressure > 1020;

  if (!breach) return;

  const alertsEnabled = useSensorStore.getState().alertsEnabled;

  const payload = {
    readingId: reading.readingId,
    temperature: reading.temperature,
    humidity: reading.humidity,
    pressure: reading.pressure,

    
    clientTimeISO: reading.timeISO,

    sendEmail: !!alertsEnabled,
  };

  await postWithRetry(`${API_BASE}/api/alerts/email`, payload, 3);


  window.dispatchEvent(new Event("alerts-updated"));
}

let inFlight = false;

export const startSensorSimulation = () => {
  if (intervalId || timeoutId) return () => {};

  const store = useSensorStore.getState();


  const alignedNow = floorTo5Minutes(new Date());

  for (let i = SEED_COUNT - 1; i >= 0; i--) {
    const dt = new Date(alignedNow.getTime() - i * INTERVAL_MS);
    const r = makeReading(dt);

    store.addSensorData(r);

    recordAlertIfBreach(r).catch((e) =>
      console.error("Seed alert store failed:", e)
    );
  }

  const tick = async () => {
    if (inFlight) return;
    inFlight = true;

    try {
      const nowAligned = floorTo5Minutes(new Date());
      const r = makeReading(nowAligned);

      store.addSensorData(r);

      await recordAlertIfBreach(r);
    } catch (e) {
      console.error("Tick failed:", e);
    } finally {
      inFlight = false;
    }
  };


  const now = new Date();
  const base = floorTo5Minutes(now);
  const next = new Date(base.getTime() + INTERVAL_MS);
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
    inFlight = false;
  };
};
