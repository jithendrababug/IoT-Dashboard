import React, { useEffect, useState, useCallback } from "react";

const API_BASE =
  process.env.REACT_APP_API_BASE ||
  (process.env.NODE_ENV === "production"
    ? "https://iot-dashboard-y27r.onrender.com"
    : "http://localhost:5000");

function formatDateTimeISO(value) {
  if (!value) return "";
  const d = new Date(value);
  return d.toLocaleString();
}

export default function AlertHistory() {
  const [alerts, setAlerts] = useState([]);
  const [resetAt, setResetAt] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/alerts/history?limit=100`);
      const json = await res.json();
      if (json.ok) {
        setAlerts(json.alerts || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    window.addEventListener("alerts-updated", fetchAlerts);
    return () => window.removeEventListener("alerts-updated", fetchAlerts);
  }, [fetchAlerts]);

  const filteredAlerts = resetAt
    ? alerts.filter(
        (a) => new Date(a.created_at) >= new Date(resetAt)
      )
    : alerts;

  const onReset = () => {
    setResetAt(new Date().toISOString()); // ✅ FRONTEND RESET
  };

  return (
    <div style={{ marginTop: 30, background: "#fff", padding: 18, borderRadius: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <h2>Alert History</h2>
        <button onClick={onReset} style={btnStyle}>
          Reset
        </button>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}>
        <thead>
          <tr style={{ background: "#f3f4f6" }}>
            <th>Date & Time</th>
            <th>Severity</th>
            <th>Temp</th>
            <th>Humidity</th>
            <th>Pressure</th>
            <th>Message</th>
          </tr>
        </thead>

        <tbody>
          {filteredAlerts.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ padding: 20, color: "#6b7280" }}>
                {loading ? "Loading alerts..." : "No alerts recorded yet."}
              </td>
            </tr>
          ) : (
            filteredAlerts.slice(0, 10).map((a) => (
              <tr key={a.id}>
                <td>{formatDateTimeISO(a.created_at)}</td>
                <td>{a.severity}</td>
                <td>{a.temperature}</td>
                <td>{a.humidity}</td>
                <td>{a.pressure}</td>
                <td>{a.message}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const btnStyle = {
  padding: "8px 14px",
  borderRadius: 10,
  background: "#111827",
  color: "#fff",
  border: "none",
  cursor: "pointer",
};
