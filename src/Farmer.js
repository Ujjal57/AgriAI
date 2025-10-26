import React, { useEffect } from "react";
import Navbar from "./Navbar";
import Chatbot from "./Chatbot";
import "./App.css";

function Farmer() {
  return (
    <div className="min-h-screen bg-green-50 text-gray-900">
      <Navbar />
      <div className="farmer-content">
        <h1>Farmer Page</h1>
        <p>This is a blank page for Farmer. Add your content here.</p>
      </div>
      {/* Footer is rendered globally via src/index.js/Footer component */}
      <Chatbot />
    </div>
  );
}

export default Farmer;
