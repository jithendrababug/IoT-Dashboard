import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import SensorCard from "../components/SensorCard";
import SensorChart from "../components/Chart";
import SensorTable from "../components/SensorTable";
import AlertsToggle from "../components/AlertsToggle";
import AlertHistory from "../components/AlertHistory";
import { useSensorStore } from "../context/sensorStore";
import { startSensorSimulation } from "../api/sensorAPI";

function useSpotlight() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return ref;
}

const fade = {
  hidden: { opacity: 0, y: 14, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.55, ease: "easeOut" } },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const spotlightRef = useSpotlight();

  const sensors = useSensorStore((state) => state.sensors);
  const latest = useSensorStore((state) => state.latest);

  useEffect(() => {
    const stopSimulation = startSensorSimulation();
    return () => stopSimulation();
  }, []);

  return (
    <div className="page dashboardPage" ref={spotlightRef}>
      {/* Background accents */}
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="spotlight" aria-hidden="true" />
      <div className="noise" aria-hidden="true" />

      <div className="container">
        {/* Top bar */}
        <div className="topbar">
          <div className="topbarLeft">
            <button className="btn btnGhost backBtn" onClick={() => navigate("/")}>
              ← Back to Home
            </button>

            <div>
              <h1 className="title">IoT Sensor Dashboard</h1>
              <p className="subtitle">Live readings • Alerts • History</p>
            </div>
          </div>

          <div className="topbarRight">
            <AlertsToggle />
          </div>
        </div>

        {/* Stat Cards */}
        <motion.div className="section" variants={fade} initial="hidden" animate="show">
          <div className="sectionHead">
            <h2 className="sectionTitle">Live Sensor Data</h2>
            <span className="pill">Auto refresh: 5 min</span>
          </div>

          <div className="cardsGrid">
            <SensorCard name="Temperature" value={latest.temperature} unit="°C" />
            <SensorCard name="Humidity" value={latest.humidity} unit="%" />
            <SensorCard name="Pressure" value={latest.pressure} unit="hPa" />
          </div>
        </motion.div>

        {/* Chart */}
        <motion.div className="glassCard" style={{ marginTop: 18 }} variants={fade} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
          <div className="cardHead">
            <h3 className="cardTitle">Trends</h3>
            <span className="muted">Latest 20 readings</span>
          </div>
          <div className="cardBody">
            <SensorChart sensors={sensors} />
          </div>
        </motion.div>

        {/* Table */}
        <motion.div className="glassCard" style={{ marginTop: 18 }} variants={fade} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
          <div className="cardHead">
            <h3 className="cardTitle">Sensor Table</h3>
            <span className="muted">History snapshot</span>
          </div>
          <div className="cardBody">
            <SensorTable sensors={sensors} />
          </div>
        </motion.div>

        {/* Alerts History */}
        <div style={{ marginTop: 22 }}>
          <AlertHistory />
        </div>

        <div className="footer">
          <span className="muted">Built for monitoring • alerting • reporting</span>
        </div>
      </div>
    </div>
  );
}