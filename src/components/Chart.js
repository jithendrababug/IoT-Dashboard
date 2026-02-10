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

  if (!sensors || sensors.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={sensors}
        // ✅ Reduce right margin to remove the gap
        margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
      >
        <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 12 }} />

        {/* Temperature axis (left) */}
        <YAxis
          yAxisId="left"
          stroke="#6b7280"
          label={{
            value: "Temperature (°C)",
            angle: -90,
            position: "insideLeft",
            fill: "#374151",
          }}
        />

        {/* Humidity + Pressure axis (right) */}
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#6b7280"
          label={{
            value: "Humidity (%)",
            angle: 90,
            position: "insideRight",
            offset: -5, // ✅ Pull label slightly inside to avoid extra reserved space
            fill: "#374151",
          }}
        />

        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            borderRadius: "10px",
            border: "none",
            boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
          }}
        />
        <Legend verticalAlign="top" height={36} />
        <CartesianGrid stroke="#e5e7eb" strokeDasharray="5 5" />

        <Line
          yAxisId="left"
          type="monotone"
          dataKey="temperature"
          stroke="#f97316"
          dot={false}
          strokeWidth={2.5}
        />

        <Line
          yAxisId="right"
          type="monotone"
          dataKey="humidity"
          stroke="#10b981"
          dot={false}
          strokeWidth={2.5}
        />

        {/* ✅ Put pressure on the same right axis to prevent right-side gap */}
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
