import React from 'react';
import Navbar from '../Navbar';

export default function Market(){
  return (
    <div>
      <Navbar />
      <main style={{padding: '2rem'}}>
        <h1>Market</h1>
        <p>This page will show market prices, trends, and buyers.</p>
      </main>
    </div>
  )
}
