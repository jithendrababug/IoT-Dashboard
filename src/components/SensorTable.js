import React, { useMemo, useState } from "react";
import { useSensorStore } from "../context/sensorStore";
import { resetSensorSimulation } from "../api/sensorAPI";

const buttonStyle = {
  padding: "8px 15px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#3b82f6",
  color: "#fff",
  cursor: "pointer",
  transition: "background 0.2s",
};

const darkButtonStyle = {
  ...buttonStyle,
  backgroundColor: "#111827",
};

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

const SensorTable = () => {
  const sensors = useSensorStore((state) => state.sensors);

  // ✅ newest first
  const reversedSensors = useMemo(() => [...sensors].reverse(), [sensors]);

  const [currentPage, setCurrentPage] = useState(1);
  const readingsPerPage = 10;

  const totalPages = Math.max(1, Math.ceil(reversedSensors.length / readingsPerPage));

  const indexOfLast = currentPage * readingsPerPage;
  const indexOfFirst = indexOfLast - readingsPerPage;
  const currentReadings = reversedSensors.slice(indexOfFirst, indexOfLast);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const onReset = () => {
    // ✅ resets sensors and restarts simulation from "now"
    resetSensorSimulation();
    setCurrentPage(1);
  };

  return (
    <div style={{ width: "100%", overflowX: "auto", marginTop: "30px" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 10 }}>
        <button onClick={onReset} style={darkButtonStyle}>
          Reset
        </button>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          backgroundColor: "#fff",
          borderRadius: "10px",
          boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f3f4f6", color: "#374151", fontWeight: "600" }}>
            <th style={thStyle}>Date & Time</th>
            <th style={thStyle}>Temperature (°C)</th>
            <th style={thStyle}>Humidity (%)</th>
            <th style={thStyle}>Pressure (hPa)</th>
          </tr>
        </thead>

        <tbody>
          {currentReadings.map((s) => (
            <tr
              key={s.readingId || s.id}
              style={rowStyle}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fff")}
            >
              {/* ✅ show full date+time from ISO */}
              <td style={tdStyle}>{formatDateTime(s.timeISO)}</td>

              <td style={tdStyle}>{s.temperature}</td>
              <td style={tdStyle}>{s.humidity}</td>
              <td style={tdStyle}>{s.pressure}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "15px", display: "flex", justifyContent: "center", gap: "15px" }}>
        <button onClick={goToPrevPage} disabled={currentPage === 1} style={buttonStyle}>
          Prev
        </button>
        <span style={{ alignSelf: "center" }}>
          Page {currentPage} of {totalPages}
        </span>
        <button onClick={goToNextPage} disabled={currentPage === totalPages} style={buttonStyle}>
          Next
        </button>
      </div>
    </div>
  );
};

const thStyle = { padding: "12px", borderBottom: "1px solid #e5e7eb", textAlign: "center" };
const tdStyle = { padding: "10px", textAlign: "center", color: "#111827" };
const rowStyle = {
  borderBottom: "1px solid #e5e7eb",
  color: "#111827",
  transition: "background 0.2s",
};

export default SensorTable;
