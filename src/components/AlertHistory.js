import React, { useEffect, useState, useCallback } from "react";

const API_BASE =
  process.env.REACT_APP_API_BASE ||
  (process.env.NODE_ENV === "production"
    ? "https://iot-dashboard-y27r.onrender.com"
    : "http://localhost:5000");

function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString([], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function AlertHistory() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/api/alerts/history?limit=10`);
      const json = await res.json();

      if (!json.ok) throw new Error(json.error || "Failed to fetch alert history");

      const list = Array.isArray(json.alerts) ? json.alerts : [];

      // ✅ latest first using created_at (best), fallback to id
      list.sort((a, b) => {
        const ta = Date.parse(a.created_at || "") || 0;
        const tb = Date.parse(b.created_at || "") || 0;
        if (tb !== ta) return tb - ta;
        return (b.id || 0) - (a.id || 0);
      });

      setAlerts(list);
    } catch (e) {
      setError(e.message || "Error fetching alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();

    // ✅ refresh every 5 minutes to match sensor interval
    const id = setInterval(fetchAlerts, 5 * 60 * 1000);

    // ✅ refresh instantly when sensorAPI posts an alert
    const onUpdated = () => fetchAlerts();
    window.addEventListener("alerts-updated", onUpdated);

    return () => {
      clearInterval(id);
      window.removeEventListener("alerts-updated", onUpdated);
    };
  }, [fetchAlerts]);

  const badgeStyle = (sev) => {
    const base = {
      padding: "6px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 700,
      display: "inline-block",
      textAlign: "center",
      minWidth: 90,
    };

    if (sev === "CRITICAL") return { ...base, background: "#fee2e2", color: "#991b1b" };
    return { ...base, background: "#ffedd5", color: "#9a3412" };
  };

  return (
    <div
      style={{
        maxWidth: 980,
        margin: "30px auto 0",
        background: "#ffffff",
        borderRadius: 16,
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        padding: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, color: "#111827" }}>Alert History</h2>

        <button onClick={fetchAlerts} style={btnStyle}>
          Refresh
        </button>
      </div>

      {error ? (
        <div style={{ color: "#b91c1c", fontWeight: 600, textAlign: "center", padding: 10 }}>
          {error}
        </div>
      ) : null}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}>
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              <th style={thStyle}>Date & Time</th>
              <th style={thStyle}>Severity</th>
              <th style={thStyle}>Temp (°C)</th>
              <th style={thStyle}>Humidity (%)</th>
              <th style={thStyle}>Pressure (hPa)</th>
              <th style={thStyle}>Message</th>
            </tr>
          </thead>

          <tbody>
            {alerts.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 18, color: "#6b7280", textAlign: "center" }}>
                  {loading ? "Loading alerts..." : "No alerts recorded yet."}
                </td>
              </tr>
            ) : (
              alerts.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={tdStyle}>{formatDateTime(a.created_at)}</td>
                  <td style={tdStyle}>
                    <span style={badgeStyle(a.severity)}>{a.severity}</span>
                  </td>
                  <td style={tdStyle}>{a.temperature}</td>
                  <td style={tdStyle}>{a.humidity}</td>
                  <td style={tdStyle}>{a.pressure}</td>
                  <td style={tdStyle}>{a.message}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle = { padding: "12px 10px", fontSize: 13, color: "#111827", fontWeight: 800 };
const tdStyle = { padding: "12px 10px", fontSize: 13, color: "#111827", textAlign: "center" };
const btnStyle = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#111827",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
};
