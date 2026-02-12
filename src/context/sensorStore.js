import { create } from "zustand";

export const useSensorStore = create((set) => ({
  sensors: [],
  latest: { temperature: "-", humidity: "-", pressure: "-" },

  // ✅ Toggle state
  alertsEnabled: false,
  setAlertsEnabled: (value) => set({ alertsEnabled: value }),

  // ✅ Email alert config (UI only) — Resend version (NO password)
  emailConfig: {
    from: "",
    receivers: [""], // default one receiver input
  },

  setEmailConfig: (partial) =>
    set((state) => ({
      emailConfig: { ...state.emailConfig, ...partial },
    })),

  setReceiverAt: (index, value) =>
    set((state) => {
      const next = [...state.emailConfig.receivers];
      next[index] = value;
      return { emailConfig: { ...state.emailConfig, receivers: next } };
    }),

  addReceiver: () =>
    set((state) => ({
      emailConfig: {
        ...state.emailConfig,
        receivers: [...state.emailConfig.receivers, ""],
      },
    })),

  addSensorData: (data) =>
    set((state) => ({
      sensors: [...state.sensors, data].slice(-20),
      latest: data,
    })),
}));
