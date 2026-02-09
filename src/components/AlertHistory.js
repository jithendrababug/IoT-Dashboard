import React, { useEffect, useMemo, useState, useCallback } from "react";

const PAGE_SIZE = 10;
const AUTO_REFRESH_MS = 5000; // ✅ 5 sec is enough (because readings come every 5 mins)

// ✅ API base
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
    hour12: true,
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

      const res = await fetch(`${API_BASE}/api/alerts/history`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to fetch alert history");

      let list = Array.isArray(json.alerts) ? json.alerts : [];

      // ✅ descending order by created_at
      list.sort((a, b) => {
        const ta = Date.parse(a.created_at || "") || 0;
        const tb = Date.parse(b.created_at || "") || 0;
        return tb - ta;
      });

      // ✅ ONLY latest 10 alerts => ONE PAGE ONLY
      list = list.slice(0, PAGE_SIZE);

      setAlerts(list);
    } catch (e) {
      setError(e.message || "Error fetching alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ initial load + polling + event refresh
  useEffect(() => {
    fetchAlerts();

    const id = setInterval(fetchAlerts, AUTO_REFRESH_MS);

    const onUpdated = () => fetchAlerts();
    window.addEventListener("alerts-updated", onUpdated);

    return () => {
      clearInterval(id);
      window.removeEventListener("alerts-updated", onUpdated);
    };
  }, [fetchAlerts]);

  const downloadCSV = () => {
    if (!alerts.length) return;

    const headers = ["created_at", "severity", "temperature", "humidity", "pressure", "message"];
    const rows = alerts.map((a) => [
      a.created_at ?? "",
      a.severity ?? "",
      a.temperature ?? "",
      a.humidity ?? "",
      a.pressure ?? "",
      a.message ?? "",
    ]);

    const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers.join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");

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

  const onReset = async () => {
    // ✅ "reset alerts" means: show only latest alerts from NOW onward.
    // Frontend-only reset: clears current table immediately and it will fill as new alerts come.
    setAlerts([]);
    setError("");
  };

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

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onReset} style={btnStyle}>
            Reset
          </button>
          <button onClick={downloadCSV} style={btnStyle} disabled={!alerts.length}>
            Export CSV
          </button>
        </div>
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

      {/* ✅ ONE PAGE ONLY: no pagination UI */}
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
