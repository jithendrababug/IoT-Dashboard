// src/pages/Dashboard.js
import React, { useEffect } from 'react';
import SensorCard from '../components/SensorCard';
import SensorChart from '../components/Chart';
import SensorTable from '../components/SensorTable';
import { useSensorStore } from '../context/sensorStore';
import { startSensorSimulation } from '../api/sensorAPI';

const Dashboard = () => {
  const sensors = useSensorStore(state => state.sensors);

  useEffect(() => {
    startSensorSimulation(); // start simulation
  }, []);

  const latest = sensors[sensors.length - 1];

  return (
    <div style={{ padding: '30px 50px', fontFamily: 'Inter, sans-serif', backgroundColor: 'linear-gradient(180deg, #f0f4f8, #e2e8f0)', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '40px',color: '#1f2937',fontWeight: '700', fontSize: '2.2rem'}}>IoT Sensor Dashboard</h1>
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
      <SensorChart />
      <SensorTable />
    </div>
  );
};

export default Dashboard;
