import { create } from "zustand";

export const useSensorStore = create((set) => ({
  sensors: [],
  latest: { temperature: "-", humidity: "-", pressure: "-" },

  alertsEnabled: true,
  setAlertsEnabled: (value) => set({ alertsEnabled: value }),

  addSensorData: (data) =>
    set((state) => ({
      sensors: [...state.sensors, data].slice(-20),
      latest: data,
    })),

  // ✅ used by Reset
  clearSensors: () =>
    set({
      sensors: [],
      latest: { temperature: "-", humidity: "-", pressure: "-" },
    }),
}));
