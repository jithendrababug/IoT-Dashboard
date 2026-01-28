import React, { useEffect } from 'react';
import SensorCard from '../components/SensorCard';
import SensorChart from '../components/Chart';
import SensorTable from '../components/SensorTable';
import AlertsToggle from "../components/AlertsToggle";
import AlertHistory from "../components/AlertHistory";
import { useSensorStore } from '../context/sensorStore';
import { startSensorSimulation } from '../api/sensorAPI';

const Dashboard = () => {
  const sensors = useSensorStore(state => state.sensors);
  const latest = useSensorStore(state => state.latest); // ✅ safe default exists

  useEffect(() => {
    const stopSimulation = startSensorSimulation();
    return () => stopSimulation();
  }, []);

  return (
    <div style={{ padding: '30px 50px', fontFamily: 'Inter, sans-serif', background: 'linear-gradient(180deg, #f0f4f8, #e2e8f0)', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '40px', color: '#1f2937', fontWeight: '700', fontSize: '2.2rem' }}>
        IoT Sensor Dashboard
      </h1>

      <AlertsToggle /> {/* ✅ put toggle above cards */}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '20px',
        marginBottom: '50px'
      }}>
        <SensorCard name="Temperature" value={latest.temperature} unit="°C" />
        <SensorCard name="Humidity" value={latest.humidity} unit="%" />
        <SensorCard name="Pressure" value={latest.pressure} unit="hPa" />
      </div>

      <SensorChart sensors={sensors} />
      <SensorTable sensors={sensors} />
      <AlertHistory />
    </div>
  );
};

export default Dashboard;
