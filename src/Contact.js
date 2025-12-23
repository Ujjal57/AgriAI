import React, { useState, useRef, useEffect } from "react";
import Navbar from "./Navbar";
import "./Navbar.css";
import Chatbot from "./Chatbot";
import "./App.css";
import CImage from "./assets/c.jpg";
import { t } from './i18n';

function Contact() {
  const [form, setForm] = useState({ first: "", last: "", phone: "", email: "", message: "" });
  const [success, setSuccess] = useState("");
  const [clicked, setClicked] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  // site language selection (persisted)
  const [siteLang, setSiteLang] = useState(() => localStorage.getItem('agri_lang') || 'en');

  useEffect(() => {
    const onLang = (e) => { const l = (e && e.detail) ? e.detail.lang : (localStorage.getItem('agri_lang') || 'en'); setSiteLang(l); };
    window.addEventListener('agri:lang:change', onLang);
    return () => window.removeEventListener('agri:lang:change', onLang);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setClicked(true);
    setTimeout(() => setClicked(false), 200);

    const { first, last, phone, email, message } = form;

    // Client-side validations
    const capRegex = /^[A-Z][a-zA-Z]*$/;
    if (!capRegex.test(first)) {
      setSuccess(t('validationFirstCapital', siteLang));
      return;
    }
    if (!capRegex.test(last)) {
      setSuccess(t('validationLastCapital', siteLang));
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      setSuccess(t('validationPhoneDigits', siteLang));
      return;
    }

    if (!message || !message.trim()) {
      setSuccess(t('validationMessageRequired', siteLang));
      return;
    }

    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setSuccess(t('validationEmailInvalid', siteLang));
        return;
      }
    }

    try {
      const response = await fetch("http://localhost:5000/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
  body: JSON.stringify({ first, last, phone, email, message, language: siteLang }),
      });

      const result = await response.json();

      if (response.ok) {
  setSuccess(t('thankYouMessage', siteLang));
  setForm({ first: "", last: "", phone: "", email: "", message: "" });
        setShowThankYou(true);
        setTimeout(() => setShowThankYou(false), 3000);
      } else {
        setSuccess(result.error || t('serverError', siteLang));
      }
    } catch (err) {
      setSuccess(t('serverError', siteLang));
    }
  };

  // Toggle speech recognition for the message field
  const toggleListening = () => {
    // cross-browser
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // browser doesn't support
      setSuccess("Speech recognition not supported in this browser.");
      setTimeout(() => setSuccess(""), 2500);
      return;
    }

    if (listening) {
      // stop
      if (recognitionRef.current) recognitionRef.current.stop();
      setListening(false);
      return;
    }

  // start recognition
  const recog = new SpeechRecognition();
  // map site language to a reasonable speech recognition locale
  const localeMap = {
    en: 'en-IN',
    hi: 'hi-IN',
    ml: 'ml-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    kn: 'kn-IN',
    or: 'or-IN',
    bn: 'bn-IN',
    mr: 'mr-IN',
    gu: 'gu-IN',
    pa: 'pa-IN'
  };
  const recogLang = localeMap[siteLang] || 'en-IN';
  // use selected recognition language based on siteLang
  recog.lang = recogLang;
    recog.interimResults = false;
    recog.maxAlternatives = 1;

    recog.onresult = (event) => {
      const transcript = Array.from(event.results).map(r => r[0].transcript).join('');
      setForm(prev => ({ ...prev, message: (prev.message ? prev.message + ' ' : '') + transcript }));
    };

    recog.onerror = (err) => {
      console.error('Speech recognition error', err);
      setSuccess('Voice input error.');
      setTimeout(() => setSuccess(''), 2000);
      setListening(false);
    };

    recog.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recog;
    recog.start();
    setListening(true);
  };

  return (
    <div className="contact-page">
      <Navbar />
      <div className="contact-container">
        {showThankYou && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
            }}
          >
            <div
              style={{
                background: "#fff",
                color: "#236902",
                padding: "2rem 3rem",
                boxShadow: "0 4px 32px #e6e6e6",
                fontSize: "2rem",
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              Thank You for Contacting Us!
            </div>
          </div>
        )}

        <div className="contact-card">
          {/* Left: Image */}
          <div className="contact-image">
            <img src={CImage} alt="Nature" />
          </div>

          {/* Right: Form */}
          <div className="contact-form" style={{ fontFamily: "Times New Roman, Times, serif" }}>
            <h1 className="form-title">{t('contactTitle', siteLang)}</h1>
            <form onSubmit={handleSubmit}>
              <div className="name-fields">
                <input
                  name="first"
                  value={form.first}
                  onChange={handleChange}
                  placeholder={t('placeholderFirst', siteLang)}
                />
                <input
                  name="last"
                  value={form.last}
                  onChange={handleChange}
                  placeholder={t('placeholderLast', siteLang)}
                />
              </div>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder={t('placeholderPhone', siteLang)}
              />
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder={t('placeholderEmail', siteLang)}
                type="email"
              />
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder={t('placeholderMessage', siteLang)}
              />
              {success && (
                <div
                  style={{
                    color: success.includes("Error") ? "#d32f2f" : "#fc2525ff",
                    marginTop: "1rem",
                    fontWeight: 500,
                  }}
                >
                  {success}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-start', alignItems: 'center', width: '100%' }}>
                <select value={siteLang} onChange={e => { const v=e.target.value; setSiteLang(v); localStorage.setItem('agri_lang', v); try{ window.dispatchEvent(new CustomEvent('agri:lang:change',{detail:{lang:v}})); }catch(e){} }} style={{ padding: '0.4rem', borderRadius: '0.5rem' }} title="Site language">
                  <option value="en">English</option>
                  <option value="hi">हिन्दी</option>
                  <option value="kn">ಕನ್ನಡ</option>
                  
                </select>
                {/* keep a smaller recognition language selector for advanced users if needed */}
                <select value={siteLang} onChange={e => { const v=e.target.value; setSiteLang(v); localStorage.setItem('agri_lang', v); try{ window.dispatchEvent(new CustomEvent('agri:lang:change',{detail:{lang:v}})); }catch(e){} }} style={{ padding: '0.4rem', borderRadius: '0.5rem', display: 'none' }} title="Recognition language">
                  <option value="en-IN">English (India)</option>
                </select>
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`mic-btn${listening ? ' mic-listening' : ''}`}
                  aria-label="Voice input"
                >
                  {listening ? '🎙️' : '🎤'}
                </button>
                <button
                  type="submit"
                  className={`send-btn${clicked ? " send-btn-clicked" : ""}`}
                >
                  {t('sendMessage', siteLang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Footer is rendered globally via src/index.js/Footer component */}

      <Chatbot />

      {/* Internal CSS */}
      <style>
        {`
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  width: 100%;
  overflow-x: hidden;
}

.contact-page {
  width: 100vw;
  min-height: 100vh;
  background: #53b635;
  display: flex;
  flex-direction: column;
  color: #236902;
}

.contact-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 4.5rem;
  padding: 1rem;
}

.contact-card {
  width: 80%;
  max-width: 1000px;
  display: flex;
  min-height: 350px;
  background: #fff;
  box-shadow: 0 4px 32px #e6e6e6;
}

.contact-image {
  flex: 1.5;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e6f4ea;
  transition: transform 0.3s ease;
}

.contact-image:hover {
  transform: scale(1.03);
}

.contact-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.contact-form {
  flex: 1;
  padding: 1rem 1rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.form-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.contact-form form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.name-fields {
  display: flex;
  gap: 1rem;
}

.contact-form input,
.contact-form textarea {
  width: 100%;
  padding: 0.4rem 0.8rem;
  border: 1px solid #e6e6e6;
  font-size: 1.1rem;
  font-family: 'Times New Roman', Times, serif;
  color: #236902;
  background: #f6f8fa;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.contact-form input::placeholder,
.contact-form textarea::placeholder {
  color: #236902;
}

.contact-form input:focus,
.contact-form textarea:focus {
  border-color: #236902;
  box-shadow: 0 0 5px rgba(35,105,2,0.5);
  outline: none;
}

.send-btn {
  padding: 0.5rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  background: #236902;
  color: #fff;
  transition: transform 0.15s;
  font-family: 'Times New Roman', Times, serif;
}

.send-btn-clicked {
  transform: scale(0.92);
}

.mic-btn {
  padding: 0.4rem 0.6rem;
  font-size: 1.2rem;
  border-radius: 0.6rem;
  border: none;
  cursor: pointer;
  background: #fff;
  color: #236902;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.mic-listening {
  background: #ff6b6b;
  color: #fff;
  box-shadow: 0 4px 12px rgba(255,107,107,0.2);
}

.footer-icon img {
  width: 1.5rem !important;
  height: 1.5rem !important;
}

.agriai-footer {
  width: 100vw;
  background: #ffffff;
  color: #236902;
  text-align: center;
  font-family: 'Times New Roman', Times, serif;
  padding: 0.1rem 0;
  margin: 0 auto;
}

.footer-content {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.footer-content h2 {
  margin: 1rem 0 -1rem 0;
}

.footer-title {
  font-size: 1.4rem;
  font-weight: bold;
  margin-bottom: -1rem;
}

.footer-title1 {
  font-size: 1rem;
  margin-bottom: 1rem;
}

.footer-icons {
  display: flex;
  gap: 2rem;
  margin: 2rem 0 0.5rem 0;
}

.footer-icon {
  font-size: 0.5rem;
  color: #236902;
  text-decoration: none;
  transition: color 0.2s;
}

.footer-icon:hover {
  color: #ffd600;
}

.footer-copy {
  font-size: 1rem;
  margin-top: 0.3rem;
}
        `}
      </style>
    </div>
  );
}

export default Contact;
