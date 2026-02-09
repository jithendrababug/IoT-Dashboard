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
    readingId,
    timeISO: date.toISOString(),
    time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    temperature: Number((20 + rand() * 10).toFixed(1)),
    humidity: Number((40 + rand() * 20).toFixed(1)),
    pressure: Number((1000 + rand() * 50).toFixed(1)),
  };
}

export const startSensorSimulation = () => {
  if (intervalId || timeoutId) return;

  const store = useSensorStore.getState();

  const alignedNow = floorTo5Minutes(new Date());

  // seed only once per reset
  for (let i = SEED_COUNT - 1; i >= 0; i--) {
    const t = new Date(alignedNow.getTime() - i * INTERVAL_MS);
    store.addSensorData(makeReading(t));
  }

  const tick = () => {
    const now = floorTo5Minutes(new Date());
    store.addSensorData(makeReading(now));
  };

  const next = new Date(alignedNow.getTime() + INTERVAL_MS);
  timeoutId = setTimeout(() => {
    tick();
    intervalId = setInterval(tick, INTERVAL_MS);
  }, next - new Date());
};
