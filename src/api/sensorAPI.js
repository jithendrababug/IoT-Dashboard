// src/api/sensorAPI.js
import { useSensorStore } from '../context/sensorStore';

export const startSensorSimulation = () => {
  const addSensorData = useSensorStore.getState().addSensorData;

  setInterval(() => {
    const now = new Date();
    const data = {
      time: now.toLocaleTimeString(),
      temperature: parseFloat((20 + Math.random() * 10).toFixed(1)),
      humidity: parseFloat((40 + Math.random() * 20).toFixed(1)),
      pressure: parseFloat((1000 + Math.random() * 50).toFixed(1)),
    };
    addSensorData(data);
  }, 10000); // new reading every 2 seconds
};
