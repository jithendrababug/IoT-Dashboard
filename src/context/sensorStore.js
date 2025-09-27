// src/context/sensorStore.js
import { create } from 'zustand';

export const useSensorStore = create((set) => ({
  sensors: [
    { time: new Date().toLocaleTimeString(), temperature: 22, humidity: 50,pressure: 1013 }
  ], // initial data point
  addSensorData: (data) =>
    set((state) => ({
      sensors: [...state.sensors, data].slice(-50), // keep last 50 readings
    })),
}));
