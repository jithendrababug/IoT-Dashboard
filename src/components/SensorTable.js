import React, { useState } from "react";
import { useSensorStore } from "../context/sensorStore";
import { resetSensorSimulation } from "../api/sensorAPI";

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
  const reversedSensors = [...sensors].reverse();

  const [currentPage, setCurrentPage] = useState(1);
  const readingsPerPage = 10;

  const totalPages = Math.max(1, Math.ceil(reversedSensors.length / readingsPerPage));

  const indexOfLast = currentPage * readingsPerPage;
  const indexOfFirst = indexOfLast - readingsPerPage;
  const currentReadings = reversedSensors.slice(indexOfFirst, indexOfLast);

  const goToNextPage = () => currentPage < totalPages && setCurrentPage((p) => p + 1);
  const goToPrevPage = () => currentPage > 1 && setCurrentPage((p) => p - 1);

  const onReset = async () => {
    await resetSensorSimulation();
    setCurrentPage(1);
  };

  return (
    <div style={{ width: "100%", overflowX: "auto", marginTop: "30px" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <button onClick={onReset} style={{ ...buttonStyle, backgroundColor: "#111827" }}>
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
            <th style={{ padding: "12px", textAlign: "center" }}>Date & Time</th>
            <th style={{ padding: "12px", textAlign: "center" }}>Temperature (°C)</th>
            <th style={{ padding: "12px", textAlign: "center" }}>Humidity (%)</th>
            <th style={{ padding: "12px", textAlign: "center" }}>Pressure (hPa)</th>
          </tr>
        </thead>

        <tbody>
          {currentReadings.map((s) => (
            <tr key={s.id} style={{ borderBottom: "1px solid #e5e7eb", color: "#111827" }}>
              <td style={{ padding: "10px", textAlign: "center" }}>{s.timeLabel}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>{s.temperature}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>{s.humidity}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>{s.pressure}</td>
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

export default SensorTable;
