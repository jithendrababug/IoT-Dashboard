import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useSensorStore } from "../context/sensorStore";

const SensorChart = () => {
  const sensors = useSensorStore((state) => state.sensors);

  // 🔴 IMPORTANT: if no data, don't render empty chart
  if (!sensors || sensors.length === 0) {
    return (
      <div style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
        No sensor data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={sensors}
        margin={{ top: 20, right: 60, left: 20, bottom: 20 }}
      >
        {/* ✅ FIX 1: correct X-axis key */}
        <XAxis
          dataKey="timeLabel"
          stroke="#6b7280"
          tick={{ fontSize: 12 }}
        />

        {/* Left Y-axis → Temperature */}
        <YAxis
          yAxisId="left"
          domain={[0, 40]}
          stroke="#6b7280"
          label={{
            value: "Temperature (°C)",
            angle: -90,
            position: "insideLeft",
            fill: "#374151",
          }}
        />

        {/* Right Y-axis → Humidity + Pressure */}
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[0, 1100]}
          stroke="#6b7280"
          label={{
            value: "Humidity (%) / Pressure (hPa)",
            angle: 90,
            position: "insideRight",
            fill: "#374151",
          }}
        />

        <CartesianGrid stroke="#e5e7eb" strokeDasharray="5 5" />

        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            borderRadius: "10px",
            border: "none",
            boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
          }}
        />

        <Legend verticalAlign="top" height={36} />

        {/* ✅ Temperature */}
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="temperature"
          stroke="#f97316"
          dot={false}
          strokeWidth={2.5}
        />

        {/* ✅ Humidity */}
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="humidity"
          stroke="#10b981"
          dot={false}
          strokeWidth={2.5}
        />

        {/* ✅ Pressure (FIXED – visible now) */}
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="pressure"
          stroke="#3b82f6"
          dot={false}
          strokeWidth={2.5}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SensorChart;
