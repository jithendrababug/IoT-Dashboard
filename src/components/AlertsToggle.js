import React from "react";
import { useSensorStore } from "../context/sensorStore";

export default function AlertsToggle() {
  const alertsEnabled = useSensorStore((s) => s.alertsEnabled);
  const setAlertsEnabled = useSensorStore((s) => s.setAlertsEnabled);

  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
      <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ fontWeight: 600 }}>Email Alerts</span>
        <input
          type="checkbox"
          checked={alertsEnabled}
          onChange={(e) => setAlertsEnabled(e.target.checked)}
        />
      </label>
    </div>
  );
}
