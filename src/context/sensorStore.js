import { create } from "zustand";

export const useSensorStore = create((set) => ({
  sensors: [],
  latest: { temperature: "-", humidity: "-", pressure: "-" },

  alertsEnabled: true,
  setAlertsEnabled: (value) => set({ alertsEnabled: value }),

  resetAt: null,

  addSensorData: (data) =>
    set((state) => ({
      sensors: [...state.sensors, data].slice(-20),
      latest: data,
    })),

  resetSensors: () =>
    set({
      sensors: [],
      latest: { temperature: "-", humidity: "-", pressure: "-" },
      resetAt: new Date().toISOString(),
    }),
}));
