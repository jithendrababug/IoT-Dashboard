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
    <div style={{ width: "100%", height: 420 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sensors} margin={{ top: 18, right: 18, left: 18, bottom: 18 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="5 5" />

          <XAxis
            dataKey="time"
            stroke="rgba(255,255,255,0.35)"
            tick={{ fontSize: 12, fill: "rgba(255,255,255,0.65)", fontWeight: 800 }}
            axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
            tickLine={{ stroke: "rgba(255,255,255,0.15)" }}
          />

          <YAxis
            yAxisId="left"
            stroke="rgba(255,255,255,0.35)"
            tick={{ fontSize: 12, fill: "rgba(255,255,255,0.65)", fontWeight: 800 }}
            axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
            tickLine={{ stroke: "rgba(255,255,255,0.15)" }}
            label={{
              value: "Temp (°C)",
              angle: -90,
              position: "insideLeft",
              fill: "rgba(255,255,255,0.60)",
            }}
          />

          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="rgba(255,255,255,0.35)"
            tick={{ fontSize: 12, fill: "rgba(255,255,255,0.65)", fontWeight: 800 }}
            axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
            tickLine={{ stroke: "rgba(255,255,255,0.15)" }}
            label={{
              value: "Hum (%) / Pressure",
              angle: 90,
              position: "insideRight",
              fill: "rgba(255,255,255,0.60)",
              offset: -4,
            }}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(17,24,39,0.95)",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
              color: "#E5E7EB",
              fontWeight: 800,
            }}
            labelStyle={{ color: "#9CA3AF", fontWeight: 900 }}
          />

          <Legend
            verticalAlign="top"
            height={34}
            wrapperStyle={{ color: "rgba(255,255,255,0.75)", fontWeight: 900 }}
          />

          <Line
            yAxisId="left"
            type="monotone"
            dataKey="temperature"
            stroke="#f97316"
            dot={false}
            strokeWidth={2.4}
          />

          <Line
            yAxisId="right"
            type="monotone"
            dataKey="humidity"
            stroke="#10b981"
            dot={false}
            strokeWidth={2.4}
          />

          <Line
            yAxisId="right"
            type="monotone"
            dataKey="pressure"
            stroke="#3b82f6"
            dot={false}
            strokeWidth={2.4}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SensorChart;