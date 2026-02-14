import React, { useEffect } from "react";
import SensorCard from "../components/SensorCard";
import SensorChart from "../components/Chart";
import SensorTable from "../components/SensorTable";
import AlertsToggle from "../components/AlertsToggle";
import AlertHistory from "../components/AlertHistory";
import { useSensorStore } from "../context/sensorStore";
import { startSensorSimulation } from "../api/sensorAPI";
import {motion} from "framer-motion";

const Dashboard = () => {
  const sensors = useSensorStore((state) => state.sensors);
  const latest = useSensorStore((state) => state.latest);

  useEffect(() => {
    const stopSimulation = startSensorSimulation();
    return () => stopSimulation();
  }, []);

  return (
    <div className="page homePage">
      {/* Background accents */}
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />

      <div className="container">
        {/* Top bar */}
        <div className="topbar">
          <div>
            <h1 className="title">IoT Sensor Dashboard</h1>
            <p className="subtitle">Live readings • Alerts • History</p>
          </div>

          <div className="topbarRight">
            <AlertsToggle />
          </div>
        </div>

        {/* Stat Cards */}
        <div className="section">
          <div className="sectionHead">
            <h2 className="sectionTitle">Live Sensor Data</h2>
            <span className="pill">Auto refresh: 5 min</span>
          </div>

          <div className="cardsGrid">
            <SensorCard name="Temperature" value={latest.temperature} unit="°C" />
            <SensorCard name="Humidity" value={latest.humidity} unit="%" />
            <SensorCard name="Pressure" value={latest.pressure} unit="hPa" />
          </div>
        </div>

        {/* Chart */}
        <div className="glassCard">
          <div className="cardHead">
            <h3 className="cardTitle">Trends</h3>
            <span className="muted">Latest 20 readings</span>
          </div>
          <div className="cardBody">
            <SensorChart sensors={sensors} />
          </div>
        </div>

        {/* Table */}
        <div className="glassCard" style={{ marginTop: 18 }}>
          <div className="cardHead">
            <h3 className="cardTitle">Sensor Table</h3>
            <span className="muted">History snapshot</span>
          </div>
          <div className="cardBody">
            <SensorTable sensors={sensors} />
          </div>
        </div>

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
};

export default Dashboard;