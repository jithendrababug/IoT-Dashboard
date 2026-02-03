import React, { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 10;

// ✅ Auto-switch backend URL based on environment
const API_BASE =
  process.env.REACT_APP_API_BASE ||
  (process.env.NODE_ENV === "production"
    ? "https://iot-dashboard-y27r.onrender.com"
    : "http://localhost:5000");

export default function AlertHistory() {
  const [alerts, setAlerts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/api/alerts/history`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }

      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to fetch alert history");

      setAlerts(Array.isArray(json.alerts) ? json.alerts : []);
      setPage(1);
    } catch (e) {
      setError(e?.message || "Error fetching alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(alerts.length / PAGE_SIZE)),
    [alerts.length]
  );

  const pageData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return alerts.slice(start, start + PAGE_SIZE); // backend returns DESC
  }, [alerts, page]);

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
    return { ...base, background: "#ffedd5", color: "#9a3412" }; // WARNING default
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
          <button onClick={fetchAlerts} style={btnStyle}>
            {loading ? "Refreshing..." : "Refresh"}
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
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 18, color: "#6b7280", textAlign: "center" }}>
                  {loading ? "Loading alerts..." : "No alerts recorded yet."}
                </td>
              </tr>
            ) : (
              pageData.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={tdStyle}>
                    {a.created_at
                      ? new Date(a.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : ""}
                  </td>
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

      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 14 }}>
        <button
          style={btnStyle}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
        >
          Prev
        </button>
        <div style={{ alignSelf: "center", fontWeight: 700, color: "#374151" }}>
          Page {page} / {totalPages}
        </div>
        <button
          style={btnStyle}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

const thStyle = {
  padding: "12px 10px",
  fontSize: 13,
  color: "#111827",
  fontWeight: 800,
};

const tdStyle = {
  padding: "12px 10px",
  fontSize: 13,
  color: "#111827",
  textAlign: "center",
};

const btnStyle = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#111827",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
};
