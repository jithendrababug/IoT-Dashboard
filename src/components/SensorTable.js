import React, { useState } from 'react';
import { useSensorStore } from '../context/sensorStore';

// Button style definition
const buttonStyle = {
  padding: '8px 15px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: '#3b82f6',
  color: '#fff',
  cursor: 'pointer',
  transition: 'background 0.2s',
};

const SensorTable = () => {
  const sensors = useSensorStore(state => state.sensors);
  const reversedSensors = [...sensors].reverse(); // latest first

  const [currentPage, setCurrentPage] = useState(1);
  const readingsPerPage = 10;

  const totalPages = Math.ceil(reversedSensors.length / readingsPerPage);

  // Get readings for current page
  const indexOfLast = currentPage * readingsPerPage;
  const indexOfFirst = indexOfLast - readingsPerPage;
  const currentReadings = reversedSensors.slice(indexOfFirst, indexOfLast);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  return (
    <div style={{ width: '100%', overflowX: 'auto', marginTop: '30px' }}>
        <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: '#fff',
            borderRadius: '10px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
        }}>
            <thead>
                <tr style={{ backgroundColor: '#f3f4f6', color: '#374151', fontWeight: '600' }}>
                    <th style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Time</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Temperature (°C)</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Humidity (%)</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Pressure (hPa)</th>
                </tr>
            </thead>
            <tbody>
                {currentReadings.map((s, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #e5e7eb', color: '#111827', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}>
                    <td style={{ padding: '10px', textAlign: 'center' }}>{s.time}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>{s.temperature}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>{s.humidity}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>{s.pressure}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      {/* Pagination Controls */}
      <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
        <button onClick={goToPrevPage} disabled={currentPage === 1} style={buttonStyle}>Prev</button>
        <span style={{ alignSelf: 'center' }}>Page {currentPage} of {totalPages}</span>
        <button onClick={goToNextPage} disabled={currentPage === totalPages} style={buttonStyle}>Next</button>
      </div>
    </div>
  );
};

export default SensorTable;