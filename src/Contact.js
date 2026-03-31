import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import Chatbot from "./Chatbot";
import "./App.css";
import CImage from "./assets/c.jpg";
import { t } from './i18n';
import { Leaf } from 'lucide-react';
import styled from 'styled-components';

// --- Container Styling ---
export const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: 'Times New Roman', Times, serif !important;
  color: oklch(0.97 0.01 100) !important;
`;

// --- Navbar Styling ---
export const NavBar = styled.nav`
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 50;
  backdrop-filter: blur(24px) saturate(200%);
  -webkit-backdrop-filter: blur(24px) saturate(200%);
  background: oklch(0.12 0.03 160 / 0.88);
  border-bottom: 1px solid oklch(0.65 0.22 145 / 0.12);
  height: 4rem;
  display: flex;
  align-items: center;
`;

export const NavContent = styled.div`
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1.5rem;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const Logo = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.5rem;
  color: oklch(0.97 0.01 100);
  text-decoration: none;
  font-family: 'Times New Roman', Times, serif !important;
  
  .logo-icon {
    width: 2rem;
    height: 2rem;
    border-radius: 0.5rem;
    background: oklch(0.65 0.22 145 / 0.2);
    border: 1px solid oklch(0.65 0.22 145);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .neon-text {
    background: linear-gradient(90deg, oklch(0.65 0.22 145), oklch(0.75 0.14 75));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

export const NavRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const LanguageSelect = styled.select`
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: oklch(0.97 0.01 100);
  background: oklch(0.12 0.03 160 / 0.6);
  border: 1px solid oklch(0.65 0.22 145 / 0.3);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  accent-color: oklch(0.65 0.22 145);
  font-family: 'Times New Roman', Times, serif !important;
  
  &:hover {
    border-color: oklch(0.65 0.22 145 / 0.5);
    background: oklch(0.12 0.03 160 / 0.8);
  }
  
  option {
    background: oklch(0.12 0.03 160);
    color: oklch(0.97 0.01 100);
    font-family: 'Times New Roman', Times, serif !important;
  }
`;

export const GetStartedBtn = styled(Link)`
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: oklch(0.12 0.03 160);
  background: oklch(0.65 0.22 145);
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: opacity 0.3s ease, box-shadow 0.3s ease;
  text-decoration: none;
  display: inline-block;
  box-shadow: 0 0 20px oklch(0.65 0.22 145 / 0.4);
  font-family: 'Times New Roman', Times, serif !important;
  
  &:hover {
    opacity: 0.9;
    box-shadow: 0 0 30px oklch(0.65 0.22 145 / 0.6);
  }
`;



// --- Contact Page Specific Styling ---
export const CenterWrap = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  margin-top: 0.8rem;
  margin-bottom: 0.8rem;
  padding: 0 1.5rem;
`;

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  html, body { width: 100%; overflow-x: hidden; }

  .ct-root {
    width: 100vw;
    min-height: 100vh;
    font-family: 'Times New Roman', Times, serif !important;
    position: relative;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
  }
  .ct-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse at 20% 20%, rgba(83,182,53,0.18) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 80%, rgba(35,105,2,0.22) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  .ct-orb {
    position: fixed;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.18;
    pointer-events: none;
    z-index: 0;
    animation: ctFloatOrb 12s ease-in-out infinite;
  }
  .ct-orb-1 { width:400px;height:400px;background:#53b635;top:-100px;left:-100px;animation-delay:0s; }
  .ct-orb-2 { width:300px;height:300px;background:#236902;bottom:10%;right:-80px;animation-delay:4s; }
  .ct-orb-3 { width:250px;height:250px;background:#8fdb5e;top:40%;left:60%;animation-delay:8s; }
  @keyframes ctFloatOrb {
    0%,100%{transform:translate(0,0) scale(1);}
    33%{transform:translate(30px,-20px) scale(1.05);}
    66%{transform:translate(-20px,30px) scale(0.95);}
  }

  .ct-leaf {
    position: fixed;
    width:10px;height:10px;
    opacity:0;pointer-events:none;z-index:0;
    animation:ctLeafFall linear infinite;
  }
  .ct-leaf::before{content:'🌿';font-size:16px;}
  .ct-leaf-1{left:5%;animation-duration:8s;animation-delay:0s;}
  .ct-leaf-2{left:15%;animation-duration:10s;animation-delay:1s;}
  .ct-leaf-3{left:25%;animation-duration:7s;animation-delay:2s;}
  .ct-leaf-4{left:35%;animation-duration:9s;animation-delay:0.5s;}
  .ct-leaf-5{left:45%;animation-duration:11s;animation-delay:3s;}
  .ct-leaf-6{left:55%;animation-duration:8s;animation-delay:1.5s;}
  .ct-leaf-7{left:65%;animation-duration:10s;animation-delay:2.5s;}
  .ct-leaf-8{left:75%;animation-duration:9s;animation-delay:0s;}
  .ct-leaf-9{left:85%;animation-duration:7s;animation-delay:4s;}
  .ct-leaf-10{left:12%;animation-duration:12s;animation-delay:5s;}
  .ct-leaf-11{left:38%;animation-duration:8s;animation-delay:3.5s;}
  .ct-leaf-12{left:70%;animation-duration:10s;animation-delay:1.8s;}
  @keyframes ctLeafFall {
    0%{transform:translateY(-40px) rotate(0deg);opacity:0;}
    10%{opacity:0.6;}
    90%{opacity:0.3;}
    100%{transform:translateY(110vh) rotate(720deg);opacity:0;}
  }

  /* Container */
  .ct-container {
    position: relative;
    z-index: 1;
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 5.5rem 1.5rem 3rem;
    animation: ctFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes ctFadeUp {
    from{opacity:0;transform:translateY(32px);}
    to{opacity:1;transform:translateY(0);}
  }

  /* Glass card — two columns */
  .ct-card {
    width: 90%;
    max-width: 1000px;
    display: flex;
    min-height: 400px;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(20px) saturate(1.6);
    -webkit-backdrop-filter: blur(20px) saturate(1.6);
    border-radius: 24px;
    border: 1px solid rgba(255,255,255,0.6);
    box-shadow:
      0 8px 32px rgba(35,105,2,0.12),
      0 32px 64px rgba(0,0,0,0.08),
      inset 0 1px 0 rgba(255,255,255,0.8);
    overflow: hidden;
  }

  /* Left: image */
  .ct-image {
    flex: 1.5;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #e8f5e2 0%, #f0faf0 100%);
    overflow: hidden;
    position: relative;
  }
  .ct-image::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(83,182,53,0.08), transparent);
    pointer-events: none;
  }
  .ct-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94);
  }
  .ct-image:hover img { transform: scale(1.05); }

  /* Right: form */
  .ct-form-col {
    flex: 1;
    padding: 2rem 1.75rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    font-family: 'Times New Roman', Times, serif !important;
  }

  .ct-form-title {
    font-size: 2rem;
    font-weight: 800;
    color: transparent;
    background: linear-gradient(135deg, #1a5c10 0%, #236902 50%, #53b635 100%);
    -webkit-background-clip: text;
    background-clip: text;
    margin-bottom: 1.25rem;
    text-align: center;
    letter-spacing: -0.5px;
    font-family: 'Times New Roman', Times, serif !important;
  }

  .ct-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    font-family: 'Times New Roman', Times, serif !important;
  }

  .ct-name-row {
    display: flex;
    gap: 10px;
  }

  .ct-input, .ct-textarea {
    width: 100%;
    padding: 10px 14px;
    border: 1.5px solid #d4edcc;
    border-radius: 10px;
    font-size: 0.9rem;
    font-family: 'Times New Roman', Times, serif !important;
    background: rgba(255,255,255,0.95);
    color: #1a3d0a;
    outline: none;
    transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s;
  }
  .ct-input::placeholder, .ct-textarea::placeholder { color: #7aaa6a; }
  .ct-input:focus, .ct-textarea:focus {
    border-color: #53b635;
    box-shadow: 0 0 0 3px rgba(83,182,53,0.18), 0 2px 8px rgba(35,105,2,0.1);
    transform: translateY(-2px);
  }
  .ct-textarea { resize: vertical; min-height: 90px; }

  /* Validation message */
  .ct-msg-error { color: #c62828; margin-top: 1rem; font-size: 0.95rem; font-weight: 600; font-family: 'Times New Roman', Times, serif !important; text-align: center; }
  .ct-msg-success { color: #236902; margin-top: 1rem; font-size: 0.95rem; font-weight: 600; font-family: 'Times New Roman', Times, serif !important; text-align: center; }

  /* Bottom action row */
  .ct-action-row {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
  }

  .ct-lang-select {
    display: none !important;
  }

  .ct-mic-btn {
    padding: 8px 10px;
    font-size: 1.15rem;
    border-radius: 10px;
    border: 1.5px solid #d4edcc;
    cursor: pointer;
    background: #fff;
    color: #236902;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s, border-color 0.18s;
  }
  .ct-mic-btn:hover { transform: translateY(-2px) scale(1.06); border-color:#53b635; }
  .ct-mic-listening {
    background: linear-gradient(135deg,#ff6b6b,#ee5a5a);
    color: #fff;
    border-color: #ff6b6b;
    box-shadow: 0 4px 14px rgba(255,107,107,0.35);
    animation: ctMicPulse 1s ease-in-out infinite;
  }
  @keyframes ctMicPulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.08);} }

  .ct-send-btn {
    padding: 0.65rem 1.75rem;
    background: linear-gradient(135deg, #236902 0%, #53b635 100%);
    color: #fff;
    border: none;
    border-radius: 12px;
    font-size: 0.95rem;
    font-weight: 700;
    font-family: 'Times New Roman', Times, serif !important;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(35,105,2,0.3), 0 1px 0 rgba(255,255,255,0.15) inset;
    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s, filter 0.18s;
    position: relative;
    overflow: hidden;
    letter-spacing: 0.3px;
  }
  .ct-send-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
    border-radius: inherit;
  }
  .ct-send-btn:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 8px 28px rgba(35,105,2,0.35); filter: brightness(1.05); }
  .ct-send-btn-clicked { transform: scale(0.93) !important; box-shadow: 0 2px 8px rgba(35,105,2,0.2) !important; }

  /* Thank you overlay */
  .ct-thankyou-overlay {
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(4px);
    animation: ctFadeUp 0.3s ease both;
  }
  .ct-thankyou-box {
    background: rgba(255,255,255,0.96);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    border: 1px solid rgba(83,182,53,0.3);
    padding: 2.5rem 3.5rem;
    box-shadow: 0 24px 64px rgba(35,105,2,0.2);
    font-size: 1.6rem;
    font-weight: 800;
    text-align: center;
    color: transparent;
    background-clip: text;
    -webkit-background-clip: text;
    background-image: linear-gradient(135deg, #1a5c10, #236902, #53b635);
    font-family: 'Times New Roman', Times, serif !important;
  }

  /* Footer passthrough styles */
  .footer-icon img { width:1.5rem!important;height:1.5rem!important; }
  .agriai-footer { width:100vw;background:#ffffff;color:#236902;text-align:center;font-family:'Times New Roman',Times,serif;padding:0.1rem 0;margin:0 auto; }
  .footer-content { max-width:900px;margin:0 auto;display:flex;flex-direction:column;align-items:center; }
  .footer-content h2 { margin:1rem 0 -1rem 0; }
  .footer-title { font-size:1.4rem;font-weight:bold;margin-bottom:-1rem;font-family: 'Times New Roman', Times, serif !important; }
  .footer-title1 { font-size:1rem;margin-bottom:1rem;font-family: 'Times New Roman', Times, serif !important; }
  .footer-icons { display:flex;gap:2rem;margin:2rem 0 0.5rem 0; }
  .footer-icon { font-size:0.5rem;color:#236902;text-decoration:none;transition:color 0.2s; }
  .footer-icon:hover { color:#ffd600; }
  .footer-copy { font-size:1rem;margin-top:0.3rem;font-family: 'Times New Roman', Times, serif !important; }

  @media (max-width: 768px) {
    .ct-card { flex-direction: column; width: 98%; }
    .ct-image { min-height: 200px; flex: none; }
    .ct-form-col { padding: 1.5rem 1.25rem; }
    .ct-form-title { font-size: 1.5rem; }
    .ct-name-row { flex-direction: column; gap: 12px; }
  }
`;

function Contact() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ first: "", last: "", phone: "", email: "", message: "" });
  const [success, setSuccess] = useState("");
  const [clicked, setClicked] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [listening, setListening] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const recognitionRef = useRef(null);
  const [siteLang, setSiteLang] = useState(() => localStorage.getItem('agri_lang') || 'en');

  // Check if user is logged in and get user details
  useEffect(() => {
    const userEmail = localStorage.getItem('agriai_email');
    const name = localStorage.getItem('agriai_name');
    const role = localStorage.getItem('agriai_role');
    setIsLoggedIn(!!userEmail);
    setUserName(name || "");
    setUserRole(role || "");
  }, []);

  // Listen for language change from navbar and refresh page automatically
  useEffect(() => {
    const handleLanguageChangeFromNavbar = (e) => {
      const newLang = (e && e.detail && e.detail.lang) ? e.detail.lang : (localStorage.getItem('agri_lang') || 'en');
      // Refresh the page to apply the new language
      window.location.reload();
    };
    
    window.addEventListener('agri:lang:change', handleLanguageChangeFromNavbar);
    
    return () => {
      try { window.removeEventListener('agri:lang:change', handleLanguageChangeFromNavbar); } catch (e) {}
    };
  }, []);

  // Derive display language name from code
  const getLanguageName = (lang) => lang === 'hi' ? 'Hindi' : lang === 'kn' ? 'Kannada' : 'English';

  // Handle language change
  const handleLanguageChange = (e) => {
    const langName = e.target.value; // 'English', 'Hindi', or 'Kannada'
    const langCode = langName === 'Hindi' ? 'hi' : langName === 'Kannada' ? 'kn' : 'en';
    setSiteLang(langCode);
    localStorage.setItem('agri_lang', langCode);
    window.dispatchEvent(new CustomEvent('agri:lang:change', { detail: { lang: langCode } }));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setClicked(true);
    setTimeout(() => setClicked(false), 200);

    const { first, last, phone, email, message } = form;

    const capRegex = /^[A-Z][a-zA-Z]*$/;
    if (!capRegex.test(first)) { setSuccess(t('validationFirstCapital', siteLang)); return; }
    if (!capRegex.test(last)) { setSuccess(t('validationLastCapital', siteLang)); return; }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) { setSuccess(t('validationPhoneDigits', siteLang)); return; }
    if (!message || !message.trim()) { setSuccess(t('validationMessageRequired', siteLang)); return; }
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) { setSuccess(t('validationEmailInvalid', siteLang)); return; }
    }

    try {
      const response = await fetch("http://localhost:5000/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSuccess("Speech recognition not supported in this browser.");
      setTimeout(() => setSuccess(""), 2500);
      return;
    }
    if (listening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setListening(false);
      return;
    }
    const recog = new SpeechRecognition();
    const localeMap = { en:'en-IN', hi:'hi-IN', ml:'ml-IN', ta:'ta-IN', te:'te-IN', kn:'kn-IN', or:'or-IN', bn:'bn-IN', mr:'mr-IN', gu:'gu-IN', pa:'pa-IN' };
    recog.lang = localeMap[siteLang] || 'en-IN';
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
    recog.onend = () => { setListening(false); };
    recognitionRef.current = recog;
    recog.start();
    setListening(true);
  };

  const initials = (name) => {
    return name ? name.split(' ').map(part => part[0]?.toUpperCase()).join('').slice(0, 2) : 'U';
  };

  const handleLogout = () => {
    localStorage.removeItem('agriai_email');
    localStorage.removeItem('agriai_name');
    localStorage.removeItem('agriai_role');
    setIsLoggedIn(false);
    setOpen(false);
    navigate('/login');
  };

  return (
    <Container>
      {/* Navbar */}
      <NavBar>
        <NavContent>
          <Logo to="/">
            <div className="logo-icon">
              <Leaf style={{ width: '1rem', height: '1rem', color: 'oklch(0.65 0.22 145)' }} />
            </div>
            <span className="neon-text">AgriAI</span>
          </Logo>
          <NavRight>
            <LanguageSelect 
              value={getLanguageName(siteLang)}
              onChange={handleLanguageChange}
            >
              <option value="English">English</option>
              <option value="Hindi">हिन्दी</option>
              <option value="Kannada">ಕನ್ನಡ</option>
            </LanguageSelect>
            {!isLoggedIn && (
              <GetStartedBtn to="/login">
                {t('homePageJoinUs', siteLang)}
              </GetStartedBtn>
            )}
            {isLoggedIn && (
              <div style={{position:'relative', display:'flex', alignItems:'center'}}>
                <button
                  style={{width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg, #e8f5e2 0%, #f0faf0 100%)', border:'2px solid #53b635', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#236902', fontWeight:700, fontSize:'0.9rem', boxShadow:'0 2px 8px rgba(35,105,2,0.15)'}}
                  onClick={() => {
                    if (userRole === 'farmer') { navigate('/dashboard/buyer'); return; }
                    if (userRole === 'buyer') { navigate('/dashboard/farmer'); return; }
                    setOpen(o => !o);
                  }}
                  aria-label="Profile"
                >
                  {initials(userName)}
                </button>
                {open && (
                  <div style={{position:'absolute', right:0, top:52, background:'rgba(255,255,255,0.92)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.6)', boxShadow:'0 8px 32px rgba(35,105,2,0.12), 0 32px 64px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)', borderRadius:16, minWidth:240, zIndex:200}}>
                    <div style={{display:'flex', gap:12, alignItems:'center', padding:'14px 16px', borderBottom: '1px solid rgba(83,182,53,0.1)'}}>
                      <div style={{width:48, height:48, borderRadius: 24, background:'linear-gradient(135deg, #e8f5e2 0%, #f0faf0 100%)', display:'flex', alignItems:'center', justifyContent:'center', color:'#236902', fontWeight:800, fontSize:'1.1rem', boxShadow:'0 2px 8px rgba(35,105,2,0.1)'}}>{initials(userName)}</div>
                      <div style={{flex:1, textAlign:'left'}}>
                        <div style={{fontWeight:700, color:'#236902', fontSize:'0.95rem'}}>{userName || 'Profile'}</div>
                        <div style={{fontSize:'0.8rem', color:'#53b635', fontWeight:600}}>{userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'User'}</div>
                      </div>
                    </div>
                    <div style={{display:'flex', flexDirection:'column'}}>
                      <Link to="/profile" onClick={() => setOpen(false)} style={{padding:'10px 16px', color:'#236902', textDecoration:'none', fontSize:'0.9rem', fontWeight:600, transition:'all 0.2s', borderBottom:'1px solid rgba(83,182,53,0.08)', display:'block'}} onMouseEnter={(e) => e.target.style.background='rgba(83,182,53,0.08)'} onMouseLeave={(e) => e.target.style.background='transparent'}>{t('navUpdateDetails', siteLang)}</Link>
                      <Link to={userRole === 'farmer' ? "/farmer/history" : "/history"} onClick={() => setOpen(false)} style={{padding:'10px 16px', color:'#236902', textDecoration:'none', fontSize:'0.9rem', fontWeight:600, transition:'all 0.2s', borderBottom:'1px solid rgba(83,182,53,0.08)', display:'block'}} onMouseEnter={(e) => e.target.style.background='rgba(83,182,53,0.08)'} onMouseLeave={(e) => e.target.style.background='transparent'}>{t('navHistory', siteLang)}</Link>
                      <button onClick={handleLogout} style={{padding:'10px 16px', background:'linear-gradient(135deg, #236902 0%, #53b635 100%)', color:'#fff', border:'none', borderRadius:'0 0 16px 16px', fontSize:'0.9rem', fontWeight:700, cursor:'pointer', boxShadow:'0 4px 16px rgba(35,105,2,0.2)', transition:'all 0.2s', width:'100%'}} onMouseEnter={(e) => {e.target.style.transform='translateY(-2px)'; e.target.style.boxShadow='0 8px 24px rgba(35,105,2,0.3)';}} onMouseLeave={(e) => {e.target.style.transform='translateY(0)'; e.target.style.boxShadow='0 4px 16px rgba(35,105,2,0.2)';}}>{t('navLogout', siteLang)}</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </NavRight>
        </NavContent>
      </NavBar>

      {/* Main Content */}
      <CenterWrap>
        <style>{styles}</style>
        <div className="ct-root" style={{ marginTop: 0, padding: '0 1.5rem' }}>
          {/* Orbs */}
          <div className="ct-orb ct-orb-1" />
          <div className="ct-orb ct-orb-2" />
          <div className="ct-orb ct-orb-3" />
          {/* Leaves */}
          <div className="ct-leaf ct-leaf-1" />
          <div className="ct-leaf ct-leaf-2" />
          <div className="ct-leaf ct-leaf-3" />
          <div className="ct-leaf ct-leaf-4" />
          <div className="ct-leaf ct-leaf-5" />
          <div className="ct-leaf ct-leaf-6" />
          <div className="ct-leaf ct-leaf-7" />
          <div className="ct-leaf ct-leaf-8" />
          <div className="ct-leaf ct-leaf-9" />
          <div className="ct-leaf ct-leaf-10" />
          <div className="ct-leaf ct-leaf-11" />
          <div className="ct-leaf ct-leaf-12" />

          {/* Thank You overlay */}
          {showThankYou && (
            <div className="ct-thankyou-overlay">
              <div className="ct-thankyou-box">
                Thank You for Contacting Us!
              </div>
            </div>
          )}

          <div className="ct-container">
            <div className="ct-card">

              {/* Left: Image */}
              <div className="ct-image">
                <img src={CImage} alt="Nature" />
              </div>

              {/* Right: Form */}
              <div className="ct-form-col">
                <h1 className="ct-form-title">{t('contactTitle', siteLang)}</h1>

                <form className="ct-form" onSubmit={handleSubmit}>
                  <div className="ct-name-row">
                    <input
                      className="ct-input"
                      name="first"
                      value={form.first}
                      onChange={handleChange}
                      placeholder={t('placeholderFirst', siteLang)}
                    />
                    <input
                      className="ct-input"
                      name="last"
                      value={form.last}
                      onChange={handleChange}
                      placeholder={t('placeholderLast', siteLang)}
                    />
                  </div>

                  <input
                    className="ct-input"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder={t('placeholderPhone', siteLang)}
                  />

                  <input
                    className="ct-input"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder={t('placeholderEmail', siteLang)}
                    type="email"
                  />

                  <textarea
                    className="ct-textarea"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder={t('placeholderMessage', siteLang)}
                  />

                  {success && (
                    <div className={success.includes("Error") ? "ct-msg-error" : "ct-msg-success"}>
                      {success}
                    </div>
                  )}

                  <div className="ct-action-row">
                    {/* Mic button */}
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`ct-mic-btn${listening ? ' ct-mic-listening' : ''}`}
                      aria-label="Voice input"
                    >
                      {listening ? '🎙️' : '🎤'}
                    </button>

                    {/* Send button */}
                    <button
                      type="submit"
                      className={`ct-send-btn${clicked ? ' ct-send-btn-clicked' : ''}`}
                    >
                      {t('sendMessage', siteLang)}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>

          <Chatbot />
        </div>
      </CenterWrap>

      {/* Footer */}
      <footer className="bg-dark border-t border-border py-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-4">
            <div>
              <div className="flex items-center gap-2 font-display font-bold text-xl mb-4">
                <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
                  <Leaf className="w-3.5 h-3.5 text-neon" />
                </div>
                <span className="text-neon">AgriAI</span>
              </div>
              <p className="text-white text-sm leading-relaxed">
                {t('footerDescription', siteLang)}
              </p>
            </div>

            {[
              { title: t('footerPlatform', siteLang), links: ['footerAbout', 'footerHowItWorks', 'footerFeatures', 'footerPricing'] },
              { title: t('footerUsers', siteLang), links: ['footerFarmers', 'footerBuyers', 'footerAgribusiness', 'footerPartners'] },
              { title: t('footerLegal', siteLang), links: ['footerPrivacy', 'footerTerms', { label: t('footerContact', siteLang), path: "/contact" }] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-foreground mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => {
                    const label = typeof link === 'string' ? t(link, siteLang) : link.label;
                    const path = typeof link === 'string' ? "/" : link.path;
                    return (
                      <li key={label}>
                        {path === "/contact" ? (
                          <Link to="/contact" className="text-white text-sm hover:text-neon transition-colors">
                            {label}
                          </Link>
                        ) : (
                          <a href={path} className="text-white text-sm hover:text-neon transition-colors">
                            {label}
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-6 flex justify-center items-center text-white text-sm">
            <span>
              © {new Date().getFullYear()} AgriAI. {t('footerRights', siteLang)}
            </span>
          </div>
        </div>
      </footer>
    </Container>
  );
}

export default Contact;