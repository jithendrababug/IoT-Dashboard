import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useSensorStore } from '../context/sensorStore';

const SensorChart = () => {
  const sensors = useSensorStore(state => state.sensors);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={sensors} margin={{ top: 20, right: 60, left: 20, bottom: 20 }}>
        <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 12 }} />
        <YAxis yAxisId="left" stroke="#6b7280" label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft', fill: '#374151' }} />
        <YAxis yAxisId="right" orientation="right" stroke="#6b7280" label={{ value: 'Humidity (%)', angle: 90, position: 'insideRight', fill: '#374151' }} />
        <YAxis yAxisId="pressure" orientation="right" hide />
        <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '10px', border: 'none', boxShadow: '0 6px 20px rgba(0,0,0,0.12)' }} />
        <Legend verticalAlign="top" height={36} />
        <CartesianGrid stroke="#e5e7eb" strokeDasharray="5 5" />
        <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#f97316" dot={false} strokeWidth={2.5} />
        <Line yAxisId="right" type="monotone" dataKey="humidity" stroke="#10b981" dot={false} strokeWidth={2.5} />
        <Line yAxisId="pressure" type="monotone" dataKey="pressure" stroke="#3b82f6" dot={false} strokeWidth={2.5} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SensorChart;
