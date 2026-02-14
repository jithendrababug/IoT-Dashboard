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

    const id = setInterval(fetchAlerts, 5 * 60 * 1000);
    const onUpdated = () => fetchAlerts();
    window.addEventListener("alerts-updated", onUpdated);

    return () => {
      clearInterval(id);
      window.removeEventListener("alerts-updated", onUpdated);
    };
  }, [fetchAlerts]);

  const badgeClass = (sev) => {
    if (sev === "CRITICAL") return "badge badgeCritical";
    return "badge badgeWarn";
  };

  const downloadCSV = (rows) => {
    if (!rows || !rows.length) return;

    const headers = ["created_at", "severity", "temperature", "humidity", "pressure", "message"];
    const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

    const csv =
      [headers.join(","), ...rows.map((a) =>
        [
          a.created_at,
          a.severity,
          a.temperature,
          a.humidity,
          a.pressure,
          a.message,
        ].map(escape).join(",")
      )].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `alert_history_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <div className="glassCard">
      <div className="cardHead">
        <div>
          <h3 className="cardTitle">Alert History</h3>
          <div className="muted">Latest 10 alerts (latest first)</div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btnGhost" onClick={fetchAlerts} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            className="btn btnPrimary"
            onClick={() => downloadCSV(alerts)}
            disabled={!alerts.length}
          >
            Export CSV
          </button>
        </div>
      </div>

      {error ? (
        <div className="errorBox">{error}</div>
      ) : null}

      <div className="tableWrap">
        <table className="table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Severity</th>
              <th>Temp (°C)</th>
              <th>Humidity (%)</th>
              <th>Pressure (hPa)</th>
              <th>Message</th>
            </tr>
          </thead>

          <tbody>
            {alerts.length === 0 ? (
              <tr>
                <td colSpan={6} className="emptyCell">
                  {loading ? "Loading alerts..." : "No alerts recorded yet."}
                </td>
              </tr>
            ) : (
              alerts.map((a) => (
                <tr key={a.id}>
                  <td>{formatDateTime(a.created_at)}</td>
                  <td>
                    <span className={badgeClass(a.severity)}>{a.severity}</span>
                  </td>
                  <td>{a.temperature}</td>
                  <td>{a.humidity}</td>
                  <td>{a.pressure}</td>
                  <td className="msgCell">{a.message}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}