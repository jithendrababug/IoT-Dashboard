import React from "react";

const SensorCard = ({ name, value, unit }) => {
  const isEmpty = value === "-" || value === null || value === undefined;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 18,
        padding: 18,
        textAlign: "left",
        boxShadow: "0 18px 50px rgba(0,0,0,0.30)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 900, color: "#9CA3AF" }}>
          {name}
        </div>

        <span
          style={{
            fontSize: 12,
            fontWeight: 900,
            padding: "6px 10px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "#E5E7EB",
          }}
        >
          Live
        </span>
      </div>

      <div
        style={{
          fontSize: 34,
          fontWeight: 950,
          letterSpacing: -0.6,
          color: "#E5E7EB",
          lineHeight: 1.1,
        }}
      >
        {isEmpty ? "-" : value}
        {!isEmpty ? (
          <span style={{ fontSize: 14, fontWeight: 900, color: "#9CA3AF", marginLeft: 8 }}>
            {unit}
          </span>
        ) : null}
      </div>

      <div style={{ marginTop: 10, fontSize: 12, fontWeight: 800, color: "#9CA3AF" }}>
        Updated automatically every 5 min
      </div>
    </div>
  );
};

export default SensorCard;