import React from 'react';
import Navbar from './Navbar';
import ImageSlideshow from './ImageSlideshow';
import Chatbot from './Chatbot';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-green-50 text-gray-900">
      <Navbar />
      <main className="homepage-hero">
        <ImageSlideshow />
        <section className="about-agriai">
          <h2 className="about-title">About AgriAI</h2>
          <p>
            AgriAI is an AI-driven platform that empowers farmers with smart crop recommendations, price forecasts, and real-time chatbot support. It ensures stable market access through assured contract farming and connects farmers directly with buyers. With multilingual support and access to government schemes, AgriAI promotes sustainable, profitable, and tech-enabled farming in India.
          </p>
        </section>
        <section className="why-choose-agriai">
          <h2 className="why-choose-title">Why Choose AgriAI?</h2>
          <div className="why-choose-cards">
            <div className="why-card">
              <span className="why-icon" role="img" aria-label="contract">🤝</span>
              <h3>Assured Contract Farming</h3>
              <p>Connect directly with reliable buyers through secure digital contracts ensuring stable income.</p>
            </div>
            <div className="why-card">
              <span className="why-icon" role="img" aria-label="crop">🌾</span>
              <h3>AI-Based Crop Recommendation</h3>
              <p>Get smart crop suggestions using AI that analyzes soil, weather, and market demand.</p>
            </div>
            <div className="why-card">
              <span className="why-icon" role="img" aria-label="price">💰</span>
              <h3>Price Prediction</h3>
              <p>Predict future market prices using machine learning for informed selling decisions.</p>
            </div>
            <div className="why-card">
              <span className="why-icon" role="img" aria-label="chatbot">🧠</span>
              <h3>AI Chatbot Assistant</h3>
              <p>Interact with our intelligent chatbot for farming queries, crop advice, and scheme details.</p>
            </div>
            <div className="why-card">
              <span className="why-icon" role="img" aria-label="government">🏛️</span>
              <h3>Government Schemes & Loans</h3>
              <p>Search and access real-time information on government subsidies, loans, and farmer welfare programs.</p>
            </div>
            <div className="why-card">
              <span className="why-icon" role="img" aria-label="language">🌐</span>
              <h3>Multilingual Support</h3>
              <p>Use AgriAI in your preferred language for a personalized and accessible experience.</p>
            </div>
          </div>
        </section>
      </main>
      {/* Footer is rendered globally via src/index.js/Footer component */}
      <Chatbot />
    </div>
  );
}
