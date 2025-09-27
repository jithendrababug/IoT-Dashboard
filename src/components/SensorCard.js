import React from 'react';

const SensorCard = ({ name, value, unit, color }) => {
  return (
    <div style={{
      borderRadius: '12px',
      backgroundColor: '#fff',
      padding: '20px',
      textAlign: 'center',
      boxShadow: '0 12px 25px rgba(0,0,0,0.12)',
      transition: 'transform 0.3s, box-shadow 0.3s',
      cursor: 'default'
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-8px)';
        e.currentTarget.style.boxShadow = '0 20px 35px rgba(0,0,0,0.18)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 12px 25px rgba(0,0,0,0.12)';
      }}
    >
      <h3 style={{ marginBottom: '10px', color: '#374151', fontWeight: '600' }}>{name}</h3>
      <p style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        color: color || '#111827',
        margin: 0
      }}>
        {value} {unit}
      </p>
    </div>
  );
};

export default SensorCard;
