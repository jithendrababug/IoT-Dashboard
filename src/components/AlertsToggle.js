import React from "react";
import { useSensorStore } from "../context/sensorStore";

const AlertsToggle = () => {
  const alertsEnabled = useSensorStore((state) => state.alertsEnabled);
  const setAlertsEnabled = useSensorStore((state) => state.setAlertsEnabled);

  return (
    <div style={containerStyle}>
      <span style={labelStyle}>Email Alerts</span>

      <label style={switchStyle}>
        <input
          type="checkbox"
          checked={alertsEnabled}
          onChange={(e) => setAlertsEnabled(e.target.checked)}
          style={{ display: "none" }}
        />

        <span
          style={{
            ...sliderStyle,
            backgroundColor: alertsEnabled ? "#22c55e" : "#9ca3af",
          }}
        >
          <span
            style={{
              ...knobStyle,
              transform: alertsEnabled ? "translateX(28px)" : "translateX(0px)",
            }}
          />
        </span>
      </label>

      <span
        style={{
          marginLeft: 10,
          fontWeight: 800,
          color: alertsEnabled ? "#16a34a" : "#374151",
        }}
      >
        {alertsEnabled ? "ON" : "OFF"}
      </span>
    </div>
  );
};

export default AlertsToggle;

/* ---------- styles ---------- */

const containerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 12,
  marginBottom: 25,
};

const labelStyle = {
  fontWeight: 700,
  fontSize: 15,
  color: "#111827",
};

const switchStyle = {
  position: "relative",
  display: "inline-block",
  width: 60,
  height: 30,
};

const sliderStyle = {
  position: "absolute",
  cursor: "pointer",
  inset: 0,
  borderRadius: 999,
  transition: "0.25s",
};

const knobStyle = {
  position: "absolute",
  height: 22,
  width: 22,
  left: 4,
  top: 4,
  backgroundColor: "#ffffff",
  borderRadius: "50%",
  transition: "0.25s",
  boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
};
