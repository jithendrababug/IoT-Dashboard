import React from "react";

const cardStyle = {
  background: "#ffffff",
  borderRadius: "16px",
  padding: "25px",
  textAlign: "center",
  boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
};

const valueStyle = {
  fontSize: "2.2rem",
  fontWeight: "700",
  color: "#111827",
};

const labelStyle = {
  fontSize: "1rem",
  color: "#6b7280",
  marginBottom: "10px",
};

const SensorCard = ({ name, value, unit }) => {
  return (
    <div style={cardStyle}>
      <div style={labelStyle}>{name}</div>
      <div style={valueStyle}>
        {value !== "-" ? `${value} ${unit}` : "-"}
      </div>
    </div>
  );
};

export default SensorCard;
