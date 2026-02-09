import React, { useState } from "react";
import { useSensorStore } from "../context/sensorStore";

const buttonStyle = {
  padding: "8px 15px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#3b82f6",
  color: "#fff",
  cursor: "pointer",
};

const SensorTable = () => {
  const sensors = useSensorStore((state) => state.sensors);
  const resetSensors = useSensorStore((state) => state.resetSensors);

  const reversedSensors = [...sensors].reverse();

  const [currentPage, setCurrentPage] = useState(1);
  const readingsPerPage = 10;

  const totalPages = Math.max(
    1,
    Math.ceil(reversedSensors.length / readingsPerPage)
  );

  const indexOfLast = currentPage * readingsPerPage;
  const indexOfFirst = indexOfLast - readingsPerPage;
  const currentReadings = reversedSensors.slice(
    indexOfFirst,
    indexOfLast
  );

  const goToNextPage = () =>
    currentPage < totalPages && setCurrentPage((p) => p + 1);
  const goToPrevPage = () =>
    currentPage > 1 && setCurrentPage((p) => p - 1);

  const onReset = () => {
    resetSensors();      // ✅ REAL RESET
    setCurrentPage(1);
  };

  return (
    <div style={{ width: "100%", overflowX: "auto", marginTop: "30px" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <button
          onClick={onReset}
          style={{ ...buttonStyle, backgroundColor: "#111827" }}
        >
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
          <tr style={{ backgroundColor: "#f3f4f6" }}>
            <th style={{ padding: 12 }}>Date & Time</th>
            <th style={{ padding: 12 }}>Temperature (°C)</th>
            <th style={{ padding: 12 }}>Humidity (%)</th>
            <th style={{ padding: 12 }}>Pressure (hPa)</th>
          </tr>
        </thead>

        <tbody>
          {currentReadings.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ padding: 20, textAlign: "center", color: "#6b7280" }}>
                No sensor readings yet.
              </td>
            </tr>
          ) : (
            currentReadings.map((s) => (
              <tr key={s.readingId}>
                <td style={{ padding: 10, textAlign: "center" }}>{s.time}</td>
                <td style={{ padding: 10, textAlign: "center" }}>{s.temperature}</td>
                <td style={{ padding: 10, textAlign: "center" }}>{s.humidity}</td>
                <td style={{ padding: 10, textAlign: "center" }}>{s.pressure}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div
        style={{
          marginTop: 15,
          display: "flex",
          justifyContent: "center",
          gap: 15,
        }}
      >
        <button onClick={goToPrevPage} disabled={currentPage === 1} style={buttonStyle}>
          Prev
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          style={buttonStyle}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default SensorTable;
