import React, { useMemo, useState } from "react";
import { useSensorStore } from "../context/sensorStore";

const SensorTable = () => {
  const sensors = useSensorStore((state) => state.sensors);

  // latest first
  const reversedSensors = useMemo(() => [...sensors].reverse(), [sensors]);

  const [currentPage, setCurrentPage] = useState(1);
  const readingsPerPage = 10;

  const totalPages = Math.max(1, Math.ceil(reversedSensors.length / readingsPerPage));
  const indexOfLast = currentPage * readingsPerPage;
  const indexOfFirst = indexOfLast - readingsPerPage;
  const currentReadings = reversedSensors.slice(indexOfFirst, indexOfLast);

  const goToNextPage = () => currentPage < totalPages && setCurrentPage((p) => p + 1);
  const goToPrevPage = () => currentPage > 1 && setCurrentPage((p) => p - 1);

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <div
        style={{
          minWidth: 860,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 18,
          boxShadow: "0 18px 50px rgba(0,0,0,0.30)",
          backdropFilter: "blur(10px)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 950, color: "#E5E7EB" }}>Readings</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#9CA3AF" }}>
              Latest readings (newest first)
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              style={btnGhost(currentPage === 1)}
            >
              Prev
            </button>

            <span style={{ fontWeight: 900, color: "#E5E7EB", fontSize: 13 }}>
              Page <span style={{ color: "#9CA3AF" }}>{currentPage}</span> /{" "}
              <span style={{ color: "#9CA3AF" }}>{totalPages}</span>
            </span>

            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              style={btnGhost(currentPage === totalPages)}
            >
              Next
            </button>
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.04)" }}>
              <th style={th}>Date & Time</th>
              <th style={th}>Temperature (°C)</th>
              <th style={th}>Humidity (%)</th>
              <th style={th}>Pressure (hPa)</th>
            </tr>
          </thead>

          <tbody>
            {currentReadings.length === 0 ? (
              <tr>
                <td colSpan={4} style={emptyCell}>
                  No readings yet.
                </td>
              </tr>
            ) : (
              currentReadings.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <td style={td}>{s.timeLabel || s.time}</td>
                  <td style={td}>{s.temperature}</td>
                  <td style={td}>{s.humidity}</td>
                  <td style={td}>{s.pressure}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile-friendly pagination hint */}
      <div style={{ marginTop: 10, textAlign: "center", color: "#9CA3AF", fontWeight: 800, fontSize: 12 }}>
        Tip: scroll horizontally if table is wide.
      </div>
    </div>
  );
};

export default SensorTable;

const th = {
  padding: "12px 10px",
  fontSize: 12,
  color: "#9CA3AF",
  fontWeight: 950,
};

const td = {
  padding: "12px 10px",
  fontSize: 13,
  color: "#E5E7EB",
  fontWeight: 800,
};

const emptyCell = {
  padding: 18,
  color: "#9CA3AF",
  fontWeight: 900,
};

const btnGhost = (disabled) => ({
  padding: "9px 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "#E5E7EB",
  cursor: disabled ? "not-allowed" : "pointer",
  fontWeight: 900,
  opacity: disabled ? 0.6 : 1,
});