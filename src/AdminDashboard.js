import React from 'react';
import Navbar from './Navbar';
import Chatbot from './Chatbot';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-green-50 text-gray-900">
      <Navbar />
      <main className="homepage-hero">
      </main>
      {/* Footer is rendered globally via src/index.js/Footer component */}
      <Chatbot />
    </div>
  );
}
