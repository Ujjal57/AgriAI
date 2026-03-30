import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import ImageSlideshow from "./ImageSlideshow";
import useScrollAnimation from "./useScrollAnimation";
import "./App.css";  
import { t } from './i18n';


function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('agri_lang') || 'en');
  useScrollAnimation();

  useEffect(() => {
    const onLang = (e) => { const l = (e && e.detail) ? e.detail.lang : (localStorage.getItem('agri_lang') || 'en'); setLang(l); };
    window.addEventListener('agri:lang:change', onLang);
    return () => window.removeEventListener('agri:lang:change', onLang);
  }, []);

  return (
    <div className="min-h-screen bg-green-50 text-gray-900">
      <Navbar />
      <main className="homepage-hero scroll-animate">
        <ImageSlideshow />
        <section className="about-agriai scroll-animate">
          <h2 className="about-title">{t('aboutTitle', lang)}</h2>
          <p>{t('aboutText', lang)}</p>
        </section>
        <section className="why-choose-agriai scroll-animate">
          <h2 className="why-choose-title">{t('whyTitle', lang)}</h2>
          <div className="why-choose-cards">
            <div className="why-card scroll-animate">
              <span className="why-icon" role="img" aria-label="contract">🤝</span>
              <h3>{t('card1Title', lang)}</h3>
              <p>{t('card1Text', lang)}</p>
            </div>
            <div className="why-card scroll-animate">
              <span className="why-icon" role="img" aria-label="crop">🌾</span>
              <h3>{t('card2Title', lang)}</h3>
              <p>{t('card2Text', lang)}</p>
            </div>
            <div className="why-card scroll-animate">
              <span className="why-icon" role="img" aria-label="price">💰</span>
              <h3>{t('card3Title', lang)}</h3>
              <p>{t('card3Text', lang)}</p>
            </div>
            <div className="why-card scroll-animate">
              <span className="why-icon" role="img" aria-label="chatbot">🧠</span>
              <h3>{t('card4Title', lang)}</h3>
              <p>{t('card4Text', lang)}</p>
            </div>
            <div className="why-card scroll-animate">
              <span className="why-icon" role="img" aria-label="government">🏛️</span>
              <h3>{t('card5Title', lang)}</h3>
              <p>{t('card5Text', lang)}</p>
            </div>
            <div className="why-card scroll-animate">
              <span className="why-icon" role="img" aria-label="language">🌐</span>
              <h3>{t('card6Title', lang)}</h3>
              <p>{t('card6Text', lang)}</p>
            </div>
          </div>
        </section>
      </main>
  {/* Footer is rendered globally in index.js */}
    </div>
  );
}

export default App;
