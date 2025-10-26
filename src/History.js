import React from 'react';
import Navbar from './Navbar';

export default function History() {
  return (
    <div className="min-h-screen bg-green-50 text-gray-900">
      <Navbar />
      <div style={{padding: '2rem'}}>
        <h1>History</h1>
        <p>This is your activity history. (Placeholder)</p>
      </div>
    </div>
  );
}
