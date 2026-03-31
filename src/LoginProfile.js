
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import Chatbot from "./Chatbot";
import styled from 'styled-components';
import { t } from './i18n';
import { Leaf } from 'lucide-react';

export const Container = styled.div`
  background-color: oklch(0.12 0.03 160);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: 'Times New Roman', Times, serif !important;
  color: oklch(0.97 0.01 100) !important;
`;

export const CenterWrap = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  margin-top: 8rem;
  margin-bottom: 3rem;
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

export const GetStartedBtn = styled.a`
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
  box-shadow: 0 0 20px oklch(0.65 0.22 145 / 0.4);
  font-family: 'Times New Roman', Times, serif !important;
  
  &:hover {
    opacity: 0.9;
    box-shadow: 0 0 30px oklch(0.65 0.22 145 / 0.6);
  }
`;

// --- Footer Styling ---
export const Footer = styled.footer`
  background: oklch(0.12 0.03 160);
  border-top: 1px solid oklch(0.65 0.22 145 / 0.12);
  padding: 1.5rem 0;
  margin-top: auto;
`;

export const FooterContent = styled.div`
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1.5rem;
`;

export const FooterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

export const FooterSection = styled.div`
  font-family: 'Times New Roman', Times, serif !important;
  h4 {
    font-weight: 600;
    color: oklch(0.97 0.01 100);
    margin-bottom: 1rem;
    font-family: 'Times New Roman', Times, serif !important;
  }
  
  p {
    color: oklch(0.97 0.01 100);
    font-size: 0.875rem;
    line-height: 1.5;
    font-family: 'Times New Roman', Times, serif !important;
  }
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    
    li {
      margin-bottom: 0.5rem;
      
      a {
        color: oklch(0.97 0.01 100);
        font-size: 0.875rem;
        text-decoration: none;
        transition: color 0.3s ease;
        font-family: 'Times New Roman', Times, serif !important;
        
        &:hover {
          color: oklch(0.65 0.22 145);
        }
      }
    }
  }
`;

export const FooterBottom = styled.div`
  border-top: 1px solid oklch(0.65 0.22 145 / 0.12);
  padding-top: 0.5rem;
  text-align: center;
  color: oklch(0.97 0.01 100);
  font-size: 0.875rem;
  font-family: 'Times New Roman', Times, serif !important;
`;

// --- Login/Register Styled Components ---
export const StyledContainer = styled.div`
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  background: oklch(0.16 0.03 160 / 0.8);
  border: 1px solid oklch(0.65 0.22 145 / 0.2);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px oklch(0.25 0.04 160);
  position: relative;
  overflow: hidden;
  width: 678px;
  max-width: 100%;
  min-height: 700px;
`;

export const SignUpContainer = styled.div`
  position: absolute;
  top: 0;
  height: 100%;
  transition: all 0.6s ease-in-out;
  left: 0;
  width: 50%;
  opacity: 0;
  z-index: 1;
  ${props => props.signinIn !== true ? `
    transform: translateX(100%);
    opacity: 1;
    z-index: 5;
  ` 
  : null}
`;

export const SignInContainer = styled.div`
  position: absolute;
  top: 0;
  height: 100%;
  transition: all 0.6s ease-in-out;
  left: 0;
  width: 50%;
  z-index: 2;
`;

export const Form = styled.form`
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 0 50px;
  height: 100%;
  text-align: center;
  font-family: 'Times New Roman', Times, serif !important;
`;

export const Title = styled.h1`
  font-weight: bold;
  margin: 0;
  color: oklch(0.97 0.01 100);
  font-size: 2rem;
  font-family: 'Times New Roman', Times, serif !important;
`;

export const SmallTitle = styled.h1`
  font-weight: bold;
  margin: 2rem 0 0 0;
  color: oklch(0.97 0.01 100);
  font-size: 1.7rem;
  font-family: 'Times New Roman', Times, serif !important;
`;

export const Input = styled.input`
  background-color: oklch(0.16 0.03 160 / 0.5);
  border: 1px solid oklch(0.65 0.22 145 / 0.2);
  padding: 1rem;
  margin: 8px 0;
  width: 100%;
  font-size: 1.1rem;
  font-family: 'Times New Roman', Times, serif !important;
  color: oklch(0.97 0.01 100) !important;
  transition: border-color 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease;
  &::placeholder {
    font-family: 'Times New Roman', Times, serif !important;
    color: oklch(0.6 0.02 160);
  }
  &:focus {
    border-color: oklch(0.65 0.22 145);
    box-shadow: 0 0 12px oklch(0.65 0.22 145 / 0.3), inset 0 0 12px oklch(0.65 0.22 145 / 0.1);
    outline: none;
    background-color: oklch(0.16 0.03 160 / 0.7);
  }
`;

// smaller variant for compact signup fields
export const SmallInput = styled(Input)`
  padding: 0.45rem;
  margin: 6px 0;
  font-size: 0.95rem;
`;

export const Button = styled.button`
  
  padding: 0.5rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  background: oklch(0.65 0.22 145);
  color: oklch(0.08 0.02 160);
  transition: transform 0.15s, opacity 0.3s, box-shadow 0.3s;
  font-family: 'Times New Roman', Times, serif !important;
  box-shadow: 0 0 20px oklch(0.65 0.22 145 / 0.4);
  &:active{
    transform: scale(0.95);
  }
  &:focus {
    outline: none;
  }
  &:hover {
    opacity: 0.9;
    box-shadow: 0 0 30px oklch(0.65 0.22 145 / 0.6);
  }
`;

export const GhostButton = styled(Button)`
  background-color: transparent;
  color: oklch(0.65 0.22 145);
  border: 1px solid oklch(0.65 0.22 145);
  box-shadow: none;
  &:hover {
    background-color: oklch(0.65 0.22 145 / 0.1);
    box-shadow: 0 0 20px oklch(0.65 0.22 145 / 0.3);
  }
`;

export const Anchor = styled.a`
  color: oklch(0.65 0.22 145);
  font-size: 14px;
  text-decoration: none;
  margin: 15px 0;
  cursor: pointer;
  font-family: 'Times New Roman', Times, serif !important;
  transition: color 0.3s ease, text-decoration 0.3s ease;
  &:hover {
    text-decoration: underline;
    color: oklch(0.75 0.14 75);
  }
`;

export const OverlayContainer = styled.div`
  position: absolute;
  top: 0;
  left: 50%;
  width: 50%;
  height: 100%;
  overflow: hidden;
  transition: transform 0.6s ease-in-out;
  z-index: 100;
  ${props =>
    props.signinIn !== true ? `transform: translateX(-100%);` : null}
`;

export const Overlay = styled.div`
  background: #000000ff;
  background: linear-gradient(135deg, oklch(0.65 0.22 145 / 0.1), oklch(0.75 0.14 75 / 0.05));
  background-repeat: no-repeat;
  background-size: cover;
  background-position: 0 0;
  color: oklch(0.97 0.01 100);
  position: relative;
  background-color: oklch(0.12 0.03 160);
  left: -100%;
  height: 100%;
  width: 200%;
  transform: translateX(0);
  transition: transform 0.6s ease-in-out;
  font-family: 'Times New Roman', Times, serif !important;
  ${props => (props.signinIn !== true ? `transform: translateX(50%);` : null)}
`;

export const OverlayPanel = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 0 2px;
  text-align: center;
  top: 0;
  height: 100%;
  width: 50%;
  transform: translateX(0);
  transition: transform 0.6s ease-in-out;
  font-family: 'Times New Roman', Times, serif !important;
  
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Times New Roman', Times, serif !important;
  }
  
  p, span, a {
    font-family: 'Times New Roman', Times, serif !important;
  }
`;

export const LeftOverlayPanel = styled(OverlayPanel)`
  transform: translateX(-20%);
  font-family: 'Times New Roman', Times, serif !important;
  ${props => props.signinIn !== true ? `transform: translateX(0);` : null}
`;

export const RightOverlayPanel = styled(OverlayPanel)`
  right: 0;
  transform: translateX(0);
  font-family: 'Times New Roman', Times, serif !important;
  ${props => props.signinIn !== true ? `transform: translateX(20%);` : null}
`;

export const Paragraph = styled.p`
  font-size: 14px;
  font-weight: 100;
  line-height: 20px;
  letter-spacing: 0.5px;
  margin: 20px 0 30px;
  font-family: 'Times New Roman', Times, serif !important;
`;

// Modal Styled Components
export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

export const ModalContent = styled.div`
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  background: oklch(0.16 0.03 160 / 0.95);
  border: 1px solid oklch(0.65 0.22 145 / 0.2);
  border-radius: 8px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px oklch(0.25 0.04 160);
  animation: slideIn 0.3s ease-out;
  font-family: 'Times New Roman', Times, serif !important;
  
  @keyframes slideIn {
    from {
      transform: translateY(-50px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

export const ModalTitle = styled.h2`
  color: oklch(0.65 0.22 145);
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  text-align: center;
  font-family: 'Times New Roman', Times, serif !important;
`;

export const ModalInput = styled.input`
  background-color: oklch(0.16 0.03 160 / 0.5);
  border: 1px solid oklch(0.65 0.22 145 / 0.2);
  padding: 0.8rem;
  margin: 8px 0;
  width: 100%;
  font-size: 1rem;
  font-family: 'Times New Roman', Times, serif !important;
  color: oklch(0.97 0.01 100) !important;
  box-sizing: border-box;
  border-radius: 4px;
  transition: border-color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease;
  
  &::placeholder {
    font-family: 'Times New Roman', Times, serif !important;
    color: oklch(0.6 0.02 160);
  }
  
  &:focus {
    border-color: oklch(0.65 0.22 145);
    box-shadow: 0 0 8px oklch(0.65 0.22 145 / 0.3), inset 0 0 8px oklch(0.65 0.22 145 / 0.1);
    outline: none;
    background-color: oklch(0.16 0.03 160 / 0.7);
  }
`;

export const ModalButton = styled.button`
  background-color: oklch(0.65 0.22 145);
  color: oklch(0.08 0.02 160);
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
  margin-top: 1rem;
  font-size: 1rem;
  font-family: 'Times New Roman', Times, serif !important;
  transition: opacity 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 20px oklch(0.65 0.22 145 / 0.4);
  
  &:hover {
    opacity: 0.9;
    box-shadow: 0 0 30px oklch(0.65 0.22 145 / 0.6);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

export const ModalError = styled.div`
  color: oklch(0.85 0.18 25);
  background-color: oklch(0.3 0.1 25 / 0.2);
  border: 1px solid oklch(0.85 0.18 25 / 0.3);
  padding: 0.8rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 0.9rem;
  font-family: 'Times New Roman', Times, serif !important;
`;

export const ModalSuccess = styled.div`
  color: oklch(0.65 0.22 145);
  background-color: oklch(0.65 0.22 145 / 0.1);
  border: 1px solid oklch(0.65 0.22 145 / 0.3);
  padding: 0.8rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 0.9rem;
  font-family: 'Times New Roman', Times, serif !important;
`;

export const ModalCloseButton = styled.button`
  background-color: transparent;
  color: oklch(0.65 0.22 145);
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  position: absolute;
  top: 1rem;
  right: 1rem;
  transition: color 0.3s ease;
  font-family: 'Times New Roman', Times, serif !important;
  
  &:hover {
    color: oklch(0.75 0.14 75);
  }
`;

export const ModalStepIndicator = styled.div`
  text-align: center;
  color: oklch(0.97 0.01 100);
  font-weight: 600;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  font-family: 'Times New Roman', Times, serif !important;
`;

function LoginProfile() {
  const [signIn, toggle] = React.useState(true);
  const [siteLang, setSiteLang] = useState(() => localStorage.getItem('agri_lang') || 'en');
  const navigate = useNavigate();
  const [signupData, setSignupData] = React.useState({
    name: '',
    phone: '',
    email: '',
    aadhar: '',
    password: '',
    role: '',
    region: '',
    state: '',
    address: ''
  });
  // Forgot Password State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);

  // Signup OTP State
  const [showSignupOtp, setShowSignupOtp] = useState(false);
  const [signupOtp, setSignupOtp] = useState('');
  const [signupOtpLoading, setSignupOtpLoading] = useState(false);
  const [signupOtpError, setSignupOtpError] = useState('');
  const [signupOtpVerified, setSignupOtpVerified] = useState(false);
  const [pendingSignupData, setPendingSignupData] = useState(null);

  const handleSignupChange = e => {
    setSignupData({ ...signupData, [e.target.name]: e.target.value });
  };
  
  const getLanguageName = (lang) => lang === 'hi' ? 'Hindi' : lang === 'kn' ? 'Kannada' : 'English';
  
  const handleLanguageChange = (e) => {
    const langName = e.target.value;
    const langCode = langName === 'Hindi' ? 'hi' : langName === 'Kannada' ? 'kn' : 'en';
    setSiteLang(langCode);
    localStorage.setItem('agri_lang', langCode);
    window.dispatchEvent(new CustomEvent('agri:lang:change', { detail: { lang: langCode } }));
    setTimeout(() => window.location.reload(), 100);
  };
  
  useEffect(() => {
    const onLang = (e) => { const l = (e && e.detail) ? e.detail.lang : (localStorage.getItem('agri_lang') || 'en'); setSiteLang(l); };
    window.addEventListener('agri:lang:change', onLang);
    return () => window.removeEventListener('agri:lang:change', onLang);
  }, []);
  
  const handleSignupSubmit = async e => {
    e.preventDefault();
    // client-side validation: name, phone, role and aadhar are required; email is optional but if provided must be valid
    if (!signupData.name || signupData.name.trim().length < 2) {
      alert(t('regInvalidName', siteLang) || 'Enter a valid name');
      return;
    }
    if (!signupData.name.trim()[0].match(/[A-Z]/)) {
      alert(t('regInvalidNameCapital', siteLang) || 'Name must start with a capital letter');
      return;
    }
    if (!signupData.phone || !/^\d{10}$/.test(signupData.phone.trim())) {
      alert(t('regInvalidPhone', siteLang) || 'Phone number must be exactly 10 digits');
      return;
    }
    if (!signupData.role) {
      alert(t('regSelectAccount', siteLang));
      return;
    }
    if (!signupData.region) {
      alert(t('regSelectRegion', siteLang));
      return;
    }
    if (!signupData.state || !/^[A-Za-z\s]{2,}$/.test(signupData.state)) {
      alert(t('regInvalidState', siteLang));
      return;
    }
    // Aadhar must be exactly 12 digits
    if (!signupData.aadhar || !/^\d{12}$/.test(signupData.aadhar)) {
      alert(t('regInvalidAadhar', siteLang));
      return;
    }
    if (!signupData.address || signupData.address.trim().length < 5) {
      alert(t('regInvalidAddress', siteLang));
      return;
    }
    if (!signupData.email) {
      alert(t('emailRequired', siteLang));
      return;
    }
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(signupData.email.trim())) {
      alert(t('regInvalidEmail', siteLang));
      return;
    }
    if (!signupData.password || signupData.password.length < 4) {
      alert('Password must be at least 4 characters');
      return;
    }

    // Check email, phone, and aadhar uniqueness before sending OTP
    try {
      // Check if email already exists
      const emailRes = await fetch('http://127.0.0.1:5000/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signupData.email.trim() })
      });
      const emailResult = await emailRes.json();
      if (emailRes.ok && emailResult.exists) {
        alert(t('emailAlreadyExists', siteLang) || emailResult.message || 'Email already registered.');
        return;
      }
    } catch (err) {
      // if check fails, still proceed to avoid blocking; backend will reject on register
    }

    try {
      // Check if phone already exists
      const phoneRes = await fetch('http://127.0.0.1:5000/auth/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: signupData.phone.trim() })
      });
      const phoneResult = await phoneRes.json();
      if (phoneRes.ok && phoneResult.exists) {
        alert(t('phoneAlreadyExists', siteLang) || phoneResult.message || 'Phone number already registered.');
        return;
      }
    } catch (err) {
      // if check fails, still proceed to avoid blocking; backend will reject on register
    }

    try {
      // Check if aadhar already exists
      const aadharRes = await fetch('http://127.0.0.1:5000/auth/check-aadhar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhar: signupData.aadhar.trim() })
      });
      const aadharResult = await aadharRes.json();
      if (aadharRes.ok && aadharResult.exists) {
        alert(t('aadharAlreadyExists', siteLang) || aadharResult.message || 'Aadhar number already registered.');
        return;
      }
    } catch (err) {
      // if check fails, still proceed to avoid blocking; backend will reject on register
    }

    // All validations passed, now send OTP
    await handleSignupSendOtp();
  };

  const handleSignupSendOtp = async () => {
    setSignupOtpError('');
    setSignupOtpLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signupData.email.trim(), purpose: 'signup-verification' })
      });
      const result = await res.json();
      if (res.ok || result.ok) {
        setPendingSignupData(signupData);
        setShowSignupOtp(true);
        setSignupOtp('');
        setSignupOtpVerified(false);
      } else {
        setSignupOtpError(result.message || result.error || 'Failed to send OTP');
      }
    } catch (err) {
      setSignupOtpError('Server error. Please try again.');
    } finally {
      setSignupOtpLoading(false);
    }
  };

  const handleSignupVerifyOtp = async () => {
    setSignupOtpError('');
    if (!signupOtp.trim()) {
      setSignupOtpError(t('otpRequired', siteLang) || 'OTP is required');
      return;
    }
    setSignupOtpLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signupData.email.trim(), otp: signupOtp.trim(), purpose: 'signup-verification' })
      });
      const result = await res.json();
      if (res.ok || result.ok) {
        setSignupOtpVerified(true);
      } else {
        setSignupOtpError(result.error || 'Invalid or expired OTP');
      }
    } catch (err) {
      setSignupOtpError('Server error. Please try again.');
    } finally {
      setSignupOtpLoading(false);
    }
  };

  const handleCompleteSignup = async () => {
    if (!signupOtpVerified || !pendingSignupData) {
      setSignupOtpError('Please verify OTP first');
      return;
    }

    // Ensure data is normalized before sending to backend (reduces 400 failures)
    const normalizedName = pendingSignupData.name ? pendingSignupData.name.trim() : '';
    const normalizedNameFixed = normalizedName ? normalizedName[0].toUpperCase() + normalizedName.slice(1) : '';
    const normalizedEmail = pendingSignupData.email ? pendingSignupData.email.trim() : '';

    if (!pendingSignupData.role) {
      setSignupOtpError('Please select an account type (farmer or buyer).');
      return;
    }

    setSignupOtpLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: normalizedNameFixed,
          phone: pendingSignupData.phone,
          aadhar: pendingSignupData.aadhar,
          email: normalizedEmail,
          password: pendingSignupData.password,
          role: pendingSignupData.role,
          region: pendingSignupData.region,
          state: pendingSignupData.state,
          address: pendingSignupData.address,
          language: siteLang
        })
      });
      const result = await res.json();
      if (res.ok) {
        alert(t('regSuccess', siteLang));
        setSignupData({ name: '', phone: '', email: '', aadhar: '', password: '', role: '', region: '', state: '', address: '' });
        setShowSignupOtp(false);
        setSignupOtp('');
        setSignupOtpVerified(false);
        setPendingSignupData(null);
        setSignupOtpError('');
      } else {
        setSignupOtpError(result.error || result.message || t('regFailed', siteLang));
      }
    } catch (err) {
      setSignupOtpError(t('regServerError', siteLang));
    } finally {
      setSignupOtpLoading(false);
    }
  };

  // Forgot Password Functions
  const handleForgotPasswordClick = (e) => {
    e.preventDefault();
    setShowForgotPassword(true);
    setForgotStep(1);
    setForgotEmail('');
    setForgotOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotError('');
    setOtpVerified(false);
  };

  const handleSendOtp = async () => {
    setForgotError('');
    if (!forgotEmail.trim()) {
      setForgotError(t('emailRequired', siteLang) || 'Email is required');
      return;
    }
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(forgotEmail)) {
      setForgotError(t('invalidEmail', siteLang) || 'Invalid email format');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim(), purpose: 'password-reset' })
      });
      const result = await res.json();
      if (res.ok || result.ok) {
        setForgotStep(2);
      } else {
        setForgotError(result.error || 'Failed to send OTP');
      }
    } catch (err) {
      setForgotError('Server error. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setForgotError('');
    if (!forgotOtp.trim()) {
      setForgotError(t('otpRequired', siteLang) || 'OTP is required');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim(), otp: forgotOtp.trim(), purpose: 'password-reset' })
      });
      const result = await res.json();
      if (res.ok || result.ok) {
        setOtpVerified(true);
        setForgotStep(3);
      } else {
        setForgotError(result.error || 'Invalid or expired OTP');
      }
    } catch (err) {
      setForgotError('Server error. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setForgotError('');
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setForgotError(t('passwordRequired', siteLang) || 'Password is required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError(t('passwordMismatch', siteLang) || 'Passwords do not match');
      return;
    }
    if (newPassword.length < 4) {
      setForgotError('Password must be at least 4 characters');
      return;
    }
    setForgotLoading(true);
    try {
      // First try the dedicated password reset endpoint
      let res = await fetch('http://127.0.0.1:5000/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim(), password: newPassword })
      });
      
      // If that doesn't exist, try profile update as fallback
      if (res.status === 404) {
        res = await fetch('http://127.0.0.1:5000/profile/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ original_email: forgotEmail.trim(), password: newPassword })
        });
      }

      const result = await res.json();
      if (res.ok || result.ok || result.success) {
        alert(t('passwordResetSuccess', siteLang) || 'Password reset successfully!');
        setShowForgotPassword(false);
        setForgotStep(1);
        setForgotEmail('');
        setForgotOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setForgotError('');
        setOtpVerified(false);
      } else {
        setForgotError(result.error || 'Failed to reset password');
      }
    } catch (err) {
      setForgotError('Server error. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotStep(1);
    setForgotEmail('');
    setForgotOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotError('');
    setOtpVerified(false);
  };
  const [signinData, setSigninData] = React.useState({ email: '', password: '' });
  const handleSigninChange = e => setSigninData({ ...signinData, [e.target.name]: e.target.value });
  const handleSigninSubmit = async e => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signinData.email, password: signinData.password })
      });
      const j = await res.json();
      if (res.ok) {
    // j.role contains 'farmer'|'buyer'|'admin'
    const role = j.role;
    // backend returns user info under j.user (or may include j.name); prefer j.user.name
    const name = j.name || (j.user && j.user.name) || '';
    // store session basic info for profile operations
  try { localStorage.setItem('agriai_email', signinData.email); localStorage.setItem('agriai_role', role); localStorage.setItem('agriai_name', name); if (j && j.user && j.user.phone) localStorage.setItem('agriai_phone', j.user.phone); } catch (e) {}
  // If buyer signs in, show the homepage first per UX request; otherwise go to role dashboard
  // Dispatch a custom event so Navbar updates immediately in the same tab
  try { window.dispatchEvent(new CustomEvent('agriai:login', { detail: { email: signinData.email, role, name } })); } catch (e) {}
  if (role === 'buyer') navigate('/dashboard/farmer', { state: { name } });
  else if (role === 'farmer') navigate('/dashboard/buyer', { state: { name } });
  else navigate(`/dashboard/${role}`, { state: { name } });
      } else if (res.status === 404) {
            alert(t('loginNotRegistered', siteLang));
          } else if (res.status === 401) {
            alert(t('loginInvalidCredentials', siteLang));
          } else {
            alert(j.error || t('loginFailed', siteLang));
          }
    } catch (err) {
          alert(t('loginServerError', siteLang));
    }
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
          </NavRight>
        </NavContent>
      </NavBar>

      {/* Main Content */}
      <CenterWrap>
        <style>{`
          .lp-leaf {
            position: fixed;
            top: 0;
            width: 10px;
            height: 10px;
            opacity: 0;
            pointer-events: none;
            z-index: 0;
            animation: lpLeafFall linear infinite;
          }
          .lp-leaf::before {
            content: '🌿';
            font-size: 16px;
          }
          .lp-leaf-1 { left: 5%; animation-duration: 8s; animation-delay: 0s; }
          .lp-leaf-2 { left: 15%; animation-duration: 10s; animation-delay: 1s; }
          .lp-leaf-3 { left: 25%; animation-duration: 7s; animation-delay: 2s; }
          .lp-leaf-4 { left: 35%; animation-duration: 9s; animation-delay: 0.5s; }
          .lp-leaf-5 { left: 45%; animation-duration: 11s; animation-delay: 3s; }
          .lp-leaf-6 { left: 55%; animation-duration: 8s; animation-delay: 1.5s; }
          .lp-leaf-7 { left: 65%; animation-duration: 10s; animation-delay: 2.5s; }
          .lp-leaf-8 { left: 75%; animation-duration: 9s; animation-delay: 0s; }
          .lp-leaf-9 { left: 85%; animation-duration: 7s; animation-delay: 4s; }
          .lp-leaf-10 { left: 12%; animation-duration: 12s; animation-delay: 5s; }
          .lp-leaf-11 { left: 38%; animation-duration: 8s; animation-delay: 3.5s; }
          .lp-leaf-12 { left: 70%; animation-duration: 10s; animation-delay: 1.8s; }
          @keyframes lpLeafFall {
            0% {
              transform: translateY(0) rotate(0deg);
              opacity: 0;
            }
            10% {
              opacity: 0.6;
            }
            90% {
              opacity: 0.3;
            }
            100% {
              transform: translateY(100vh) rotate(720deg);
              opacity: 0;
            }
          }
        `}</style>

        {/* Leaves */}
        <div className="lp-leaf lp-leaf-1" />
        <div className="lp-leaf lp-leaf-2" />
        <div className="lp-leaf lp-leaf-3" />
        <div className="lp-leaf lp-leaf-4" />
        <div className="lp-leaf lp-leaf-5" />
        <div className="lp-leaf lp-leaf-6" />
        <div className="lp-leaf lp-leaf-7" />
        <div className="lp-leaf lp-leaf-8" />
        <div className="lp-leaf lp-leaf-9" />
        <div className="lp-leaf lp-leaf-10" />
        <div className="lp-leaf lp-leaf-11" />
        <div className="lp-leaf lp-leaf-12" />

        <StyledContainer>
          <SignUpContainer signinIn={signIn}>
            <Form onSubmit={handleSignupSubmit}>
              <SmallTitle>{t('signUpTitle', siteLang)}</SmallTitle>
              <SmallInput type='text' name='name' placeholder={t('placeholderFirst', siteLang)} value={signupData.name} onChange={handleSignupChange} />
              <SmallInput type='tel' name='phone' placeholder={t('placeholderPhone', siteLang)} value={signupData.phone} onChange={handleSignupChange} />
              <SmallInput type='text' name='aadhar' placeholder={t('placeholderAadhar', siteLang)} value={signupData.aadhar} onChange={handleSignupChange} />
              <SmallInput type='email' name='email' placeholder={t('placeholderEmail', siteLang)} value={signupData.email} onChange={handleSignupChange} />
              <SmallInput type='password' name='password' placeholder={t('placeholderPassword', siteLang)} value={signupData.password} onChange={handleSignupChange} />
              <div style={{width: '100%', marginTop: 6}}>
                <label style={{display:'block', fontWeight:600, marginBottom:6, textAlign:'center', color:'oklch(0.97 0.01 100)'}}>{t('regionLabel', siteLang)}</label>
                <select name='region' value={signupData.region} onChange={handleSignupChange} style={{width:'100%', padding:'0.9rem', border:'1px solid oklch(0.65 0.22 145 / 0.2)', borderRadius:4, background:'oklch(0.16 0.03 160 / 0.5)', marginBottom:10, color:'oklch(0.97 0.01 100)', fontSize:'1rem'}}>
                  <option value=''>{t('selectRegion', siteLang)}</option>
                  <option value='north'>{t('regionNorth', siteLang)}</option>
                  <option value='south'>{t('regionSouth', siteLang)}</option>
                  <option value='east'>{t('regionEast', siteLang)}</option>
                  <option value='west'>{t('regionWest', siteLang)}</option>
                </select>
                <SmallInput type='text' name='state' placeholder={t('placeholderState', siteLang)} value={signupData.state} onChange={handleSignupChange} style={{width:'100%', marginTop:0, marginBottom:10}} />
                <SmallInput type='text' name='address' placeholder={t('placeholderAddress', siteLang)} value={signupData.address} onChange={handleSignupChange} style={{width:'100%', marginTop:0}} />
              </div>
              <div style={{width: '100%', textAlign: 'center', marginTop: '6px'}}>
                <div style={{fontWeight: '600', marginBottom: '6px', color:'oklch(0.97 0.01 100)'}}>{t('accountTypeLabel', siteLang)}</div>
                <label style={{marginRight: '12px', color:'oklch(0.97 0.01 100)'}}>
                  <input type='radio' name='role' value='farmer' checked={signupData.role==='farmer'} onChange={handleSignupChange} /> {t('roleFarmer', siteLang)}
                </label>
                <label style={{marginRight: '12px', color:'oklch(0.97 0.01 100)'}}>
                  <input type='radio' name='role' value='buyer' checked={signupData.role==='buyer'} onChange={handleSignupChange} /> {t('roleBuyer', siteLang)}
                </label>
                
              </div>
              <div style={{width:'100%', display:'flex', justifyContent:'center', marginTop:12, marginBottom:24}}>
                <Button type='submit'>Sign Up</Button>
              </div>
              
            </Form>
          </SignUpContainer>

          <SignInContainer signinIn={signIn}>
            <Form onSubmit={handleSigninSubmit}>
              <Title>{t('signInTitle', siteLang)}</Title>
              <Input type='email' name='email' placeholder={t('placeholderEmail', siteLang)} value={signinData.email} onChange={handleSigninChange} />
              <Input type='password' name='password' placeholder={t('placeholderPassword', siteLang)} value={signinData.password} onChange={handleSigninChange} />
              <Anchor href='#' onClick={handleForgotPasswordClick}>{t('forgotPassword', siteLang)}</Anchor>
              <Button type='submit'>{t('signInButton', siteLang)}</Button>
            </Form>
            <div style={{margin: '18px 0 8px 0', fontWeight: 'bold', color: 'oklch(0.97 0.01 100)'}}>{t('orText', siteLang)}</div>
            <button type="button" style={{background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '8px'}}>
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" alt="Google" style={{width: '2.2rem', height: '2.2rem'}} />
            </button>
          </SignInContainer>

          <OverlayContainer signinIn={signIn}>
            <Overlay signinIn={signIn}>
              <LeftOverlayPanel signinIn={signIn}>
                <Title>{t('welcomeBack', siteLang)}</Title>
                <Paragraph>
                  {t('enterDetails', siteLang)}
                </Paragraph>
                <GhostButton onClick={() => toggle(true)}>
                  {t('signInButton', siteLang)}
                </GhostButton>
              </LeftOverlayPanel>

              <RightOverlayPanel signinIn={signIn}>
                <Title>{t('welcomeToSite', siteLang)}</Title>
                <Paragraph>
                  {t('enterDetails', siteLang)}
                </Paragraph>
                <GhostButton onClick={() => toggle(false)}>
                  {t('signUpButton', siteLang)}
                </GhostButton>
              </RightOverlayPanel>
            </Overlay>
          </OverlayContainer>
        </StyledContainer>
      </CenterWrap>
      {/* Footer is rendered globally in index.js */}
      <Chatbot />

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <ModalOverlay>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalCloseButton onClick={closeForgotPassword}>&times;</ModalCloseButton>
            
            {forgotStep === 1 && (
              <>
                <ModalTitle>{t('forgotPassword', siteLang) || 'Reset Password'}</ModalTitle>
                <ModalStepIndicator>Step 1 of 3: Enter Email</ModalStepIndicator>
                {forgotError && <ModalError>{forgotError}</ModalError>}
                <ModalInput
                  type='email'
                  placeholder={t('placeholderEmail', siteLang)}
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
                <ModalButton onClick={handleSendOtp} disabled={forgotLoading}>
                  {forgotLoading ? 'Sending...' : t('sendOtp', siteLang) || 'Send OTP'}
                </ModalButton>
              </>
            )}

            {forgotStep === 2 && (
              <>
                <ModalTitle>{t('forgotPassword', siteLang) || 'Reset Password'}</ModalTitle>
                <ModalStepIndicator>Step 2 of 3: Verify OTP</ModalStepIndicator>
                {forgotError && <ModalError>{forgotError}</ModalError>}
                <p style={{textAlign: 'center', color: '#236902', fontSize: '0.9rem', marginBottom: '1rem'}}>
                  {t('otpSentTo', siteLang) || 'OTP sent to'} {forgotEmail}
                </p>
                <ModalInput
                  type='text'
                  placeholder={t('enterOtp', siteLang) || 'Enter 6-digit OTP'}
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength='6'
                />
                <ModalButton onClick={handleVerifyOtp} disabled={forgotLoading || !forgotOtp}>
                  {forgotLoading ? 'Verifying...' : t('verifyOtp', siteLang) || 'Verify OTP'}
                </ModalButton>
              </>
            )}

            {forgotStep === 3 && (
              <>
                <ModalTitle>{t('forgotPassword', siteLang) || 'Reset Password'}</ModalTitle>
                <ModalStepIndicator>Step 3 of 3: New Password</ModalStepIndicator>
                {forgotError && <ModalError>{forgotError}</ModalError>}
                <ModalInput
                  type='password'
                  placeholder={t('placeholderPassword', siteLang) || 'New Password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <ModalInput
                  type='password'
                  placeholder='Confirm Password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <ModalButton onClick={handleResetPassword} disabled={forgotLoading}>
                  {forgotLoading ? 'Resetting...' : 'Reset Password'}
                </ModalButton>
              </>
            )}
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Signup OTP Modal */}
      {showSignupOtp && (
        <ModalOverlay>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalCloseButton onClick={() => setShowSignupOtp(false)}>&times;</ModalCloseButton>
            
            {!signupOtpVerified ? (
              <>
                <ModalTitle>{t('verifyEmail', siteLang) || 'Verify Email'}</ModalTitle>
                <ModalStepIndicator>{t('otpVerificationStep', siteLang) || 'Email Verification'}</ModalStepIndicator>
                {signupOtpError && <ModalError>{signupOtpError}</ModalError>}
                <p style={{textAlign: 'center', color: 'oklch(0.97 0.01 100)', fontSize: '0.9rem', marginBottom: '1rem'}}>
                  {t('otpSentTo', siteLang) || 'OTP sent to'} {signupData.email}
                </p>
                <ModalInput
                  type='text'
                  placeholder={t('enterOtp', siteLang) || 'Enter 6-digit OTP'}
                  value={signupOtp}
                  onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength='6'
                />
                <ModalButton onClick={handleSignupVerifyOtp} disabled={signupOtpLoading || !signupOtp}>
                  {signupOtpLoading ? 'Verifying...' : t('verifyOtp', siteLang) || 'Verify OTP'}
                </ModalButton>
              </>
            ) : (
              <>
                <ModalTitle>{t('emailVerified', siteLang) || 'Email Verified'}</ModalTitle>
                <ModalSuccess>{t('emailVerificationSuccess', siteLang) || 'Your email has been verified successfully!'}</ModalSuccess>
                {signupOtpError && <ModalError>{signupOtpError}</ModalError>}
                <p style={{textAlign: 'center', color: 'oklch(0.97 0.01 100)', marginBottom: '1rem'}}>
                  {t('readyToSignup', siteLang) || 'Click the button below to complete your sign-up'}
                </p>
                <ModalButton onClick={handleCompleteSignup} disabled={signupOtpLoading}>
                  {signupOtpLoading ? 'Creating Account...' : t('completeSignup', siteLang) || 'Complete Sign Up'}
                </ModalButton>
              </>
            )}
          </ModalContent>
        </ModalOverlay>
      )}
      
      {/* Footer */}
      <Footer>
        <FooterContent>
          <FooterGrid>
            <FooterSection>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '0.5rem', background: 'oklch(0.65 0.22 145 / 0.2)', border: '1px solid oklch(0.65 0.22 145 / 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Leaf style={{ width: '0.875rem', height: '0.875rem', color: 'oklch(0.65 0.22 145)' }} />
                </div>
                <span style={{ color: 'oklch(0.65 0.22 145)', fontWeight: 700 }}>AgriAI</span>
              </div>
              <p>{t('footerDescription', siteLang)}</p>
            </FooterSection>

            <FooterSection>
              <h4>{t('footerPlatform', siteLang)}</h4>
              <ul>
                <li><a href="/">{t('footerAbout', siteLang)}</a></li>
                <li><a href="#how-agriai-works">{t('footerHowItWorks', siteLang)}</a></li>
                <li><a href="#platform-features">{t('footerFeatures', siteLang)}</a></li>
                <li><a href="/">{t('footerPricing', siteLang)}</a></li>
              </ul>
            </FooterSection>

            <FooterSection>
              <h4>{t('footerUsers', siteLang)}</h4>
              <ul>
                <li><a href="/dashboard/farmer">{t('footerFarmers', siteLang)}</a></li>
                <li><a href="/dashboard/buyer">{t('footerBuyers', siteLang)}</a></li>
                <li><a href="/">{t('footerAgribusiness', siteLang)}</a></li>
                <li><a href="/">{t('footerPartners', siteLang)}</a></li>
              </ul>
            </FooterSection>

            <FooterSection>
              <h4>{t('footerLegal', siteLang)}</h4>
              <ul>
                <li><a href="/">{t('footerPrivacy', siteLang)}</a></li>
                <li><a href="/">{t('footerTerms', siteLang)}</a></li>
                <li><Link to="/contact">{t('footerContact', siteLang)}</Link></li>
              </ul>
            </FooterSection>
          </FooterGrid>

          <FooterBottom>
            © {new Date().getFullYear()} AgriAI. {t('footerRights', siteLang)}
          </FooterBottom>
        </FooterContent>
      </Footer>
    </Container>
  );
}

export default LoginProfile;
