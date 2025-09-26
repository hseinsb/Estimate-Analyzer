import React from 'react';

function SimpleTest() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Simple Test</h1>
      <p>If you can see this, React is working!</p>
      <p>Current time: {new Date().toLocaleString()}</p>
    </div>
  );
}

export default SimpleTest;
