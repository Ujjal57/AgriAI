
import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import Navbar from "./Navbar";
import Chatbot from "./Chatbot";
import styled from 'styled-components';
import { t } from './i18n';

export const Container = styled.div`
  background-color: #53b635;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: 'Times New Roman', Times, serif !important;
  color: #236902 !important;
`;

export const CenterWrap = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  margin-top: 6rem;
  margin-bottom: 1rem;
`;


// --- Login/Register Styled Components ---
export const StyledContainer = styled.div`
  background-color: #fff;
  box-shadow: #236902;
  position: relative;
  overflow: hidden;
  width: 678px;
  max-width: 100%;
  min-height: 600px;
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
  ${props => (props.signinIn !== true ? `transform: translateX(100%);` : null)}
`;

export const Form = styled.form`
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 0 50px;
  height: 100%;
  text-align: center;
`;

export const Title = styled.h1`
  font-weight: bold;
  margin: 0;
`;

export const Input = styled.input`
  background-color: #f6f8fa;
  border: 1px solid #e6e6e6;
  padding: 1rem;
  margin: 8px 0;
  width: 100%;
  font-size: 1.1rem;
  font-family: 'Times New Roman', Times, serif !important;
  color: #236902 !important;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  &::placeholder {
    font-family: 'Times New Roman', Times, serif;
    color: #236902;
  }
  &:focus {
    border-color: #236902;
    box-shadow: 0 0 5px rgba(35,105,2,0.5);
    outline: none;
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
  background: #236902;
  color: #fff;
  transition: transform 0.15s;
  font-family: 'Times New Roman', Times, serif !important;
  &:active{
    transform: scale(0.95);
  }
  &:focus {
    outline: none;
  }
`;

export const GhostButton = styled(Button)`
  background-color: #ffffff;
  color: #236902;
  border: 1px solid #236902;
  &:hover {
    background-color: #f6f8fa;
  }
`;

export const Anchor = styled.a`
  color: #236902;
  font-size: 14px;
  text-decoration: none;
  margin: 15px 0;
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
  background: -webkit-linear-gradient(to right, #70a05aff);
  background: linear-gradient(to right, #236902);
  background-repeat: no-repeat;
  background-size: cover;
  background-position: 0 0;
  color: #ffffff;
  position: relative;
  background-color: #236902;
  left: -100%;
  height: 100%;
  width: 200%;
  transform: translateX(0);
  transition: transform 0.6s ease-in-out;
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
`;

export const LeftOverlayPanel = styled(OverlayPanel)`
  transform: translateX(-20%);
  ${props => props.signinIn !== true ? `transform: translateX(0);` : null}
`;

export const RightOverlayPanel = styled(OverlayPanel)`
  right: 0;
  transform: translateX(0);
  ${props => props.signinIn !== true ? `transform: translateX(20%);` : null}
`;

export const Paragraph = styled.p`
  font-size: 14px;
  font-weight: 100;
  line-height: 20px;
  letter-spacing: 0.5px;
  margin: 20px 0 30px;
`;

// Modal Styled Components
export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

export const ModalContent = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease-out;
  
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
  color: #236902;
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  text-align: center;
`;

export const ModalInput = styled.input`
  background-color: #f6f8fa;
  border: 1px solid #e6e6e6;
  padding: 0.8rem;
  margin: 8px 0;
  width: 100%;
  font-size: 1rem;
  font-family: 'Times New Roman', Times, serif !important;
  color: #236902 !important;
  box-sizing: border-box;
  border-radius: 4px;
  
  &::placeholder {
    font-family: 'Times New Roman', Times, serif;
    color: #236902;
  }
  
  &:focus {
    border-color: #236902;
    box-shadow: 0 0 5px rgba(35, 105, 2, 0.5);
    outline: none;
  }
`;

export const ModalButton = styled.button`
  background-color: #236902;
  color: #fff;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
  margin-top: 1rem;
  font-size: 1rem;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: #1a5001;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

export const ModalError = styled.div`
  color: #d32f2f;
  background-color: #ffebee;
  padding: 0.8rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 0.9rem;
`;

export const ModalSuccess = styled.div`
  color: #236902;
  background-color: #e8f5e9;
  padding: 0.8rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 0.9rem;
`;

export const ModalCloseButton = styled.button`
  background-color: transparent;
  color: #236902;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  position: absolute;
  top: 1rem;
  right: 1rem;
  
  &:hover {
    color: #1a5001;
  }
`;

export const ModalStepIndicator = styled.div`
  text-align: center;
  color: #236902;
  font-weight: 600;
  margin-bottom: 1rem;
  font-size: 0.9rem;
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
  useEffect(() => {
    const onLang = (e) => { const l = (e && e.detail) ? e.detail.lang : (localStorage.getItem('agri_lang') || 'en'); setSiteLang(l); };
    window.addEventListener('agri:lang:change', onLang);
    return () => window.removeEventListener('agri:lang:change', onLang);
  }, []);
  const handleSignupSubmit = async e => {
    e.preventDefault();
    // client-side validation: role and aadhar are required; email is optional but if provided must be valid
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
    if (!emailRegex.test(signupData.email)) {
      alert(t('regInvalidEmail', siteLang));
      return;
    }
    if (!signupData.password || signupData.password.length < 4) {
      alert('Password must be at least 4 characters');
      return;
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
        setSignupOtpError(result.error || 'Failed to send OTP');
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

    setSignupOtpLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: pendingSignupData.name,
          phone: pendingSignupData.phone,
          aadhar: pendingSignupData.aadhar,
          email: pendingSignupData.email,
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
        setSignupOtpError(result.error || t('regFailed', siteLang));
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
  if (role === 'buyer') navigate('/');
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
      <Navbar />
      <CenterWrap>
        <StyledContainer>
          <SignUpContainer signinIn={signIn}>
            <Form onSubmit={handleSignupSubmit}>
              <Title>{t('signUpTitle', siteLang)}</Title>
              <SmallInput type='text' name='name' placeholder={t('placeholderFirst', siteLang)} value={signupData.name} onChange={handleSignupChange} />
              <SmallInput type='tel' name='phone' placeholder={t('placeholderPhone', siteLang)} value={signupData.phone} onChange={handleSignupChange} />
              <SmallInput type='text' name='aadhar' placeholder={t('placeholderAadhar', siteLang)} value={signupData.aadhar} onChange={handleSignupChange} />
              <SmallInput type='email' name='email' placeholder={t('placeholderEmail', siteLang)} value={signupData.email} onChange={handleSignupChange} />
              <SmallInput type='password' name='password' placeholder={t('placeholderPassword', siteLang)} value={signupData.password} onChange={handleSignupChange} />
              <div style={{width: '100%', marginTop: 6}}>
                <label style={{display:'block', fontWeight:600, marginBottom:6, textAlign:'center'}}>{t('regionLabel', siteLang)}</label>
                <select name='region' value={signupData.region} onChange={handleSignupChange} style={{width:'100%', padding:'0.9rem', border:'1px solid #e6e6e6', borderRadius:4, background:'#f6f8fa', marginBottom:10}}>
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
                <div style={{fontWeight: '600', marginBottom: '6px'}}>{t('accountTypeLabel', siteLang)}</div>
                <label style={{marginRight: '12px'}}>
                  <input type='radio' name='role' value='farmer' checked={signupData.role==='farmer'} onChange={handleSignupChange} /> {t('roleFarmer', siteLang)}
                </label>
                <label style={{marginRight: '12px'}}>
                  <input type='radio' name='role' value='buyer' checked={signupData.role==='buyer'} onChange={handleSignupChange} /> {t('roleBuyer', siteLang)}
                </label>
                
              </div>
              <div style={{width:'100%', display:'flex', justifyContent:'center', marginTop:12}}>
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
            <div style={{margin: '18px 0 8px 0', fontWeight: 'bold', color: '#236902', fontFamily: 'Times New Roman'}}>{t('orText', siteLang)}</div>
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
        <ModalOverlay onClick={closeForgotPassword}>
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
        <ModalOverlay onClick={() => !signupOtpVerified && setShowSignupOtp(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalCloseButton onClick={() => !signupOtpVerified && setShowSignupOtp(false)}>&times;</ModalCloseButton>
            
            {!signupOtpVerified ? (
              <>
                <ModalTitle>{t('verifyEmail', siteLang) || 'Verify Email'}</ModalTitle>
                <ModalStepIndicator>{t('otpVerificationStep', siteLang) || 'Email Verification'}</ModalStepIndicator>
                {signupOtpError && <ModalError>{signupOtpError}</ModalError>}
                <p style={{textAlign: 'center', color: '#236902', fontSize: '0.9rem', marginBottom: '1rem'}}>
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
                <p style={{textAlign: 'center', color: '#236902', marginBottom: '1rem'}}>
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
    </Container>
  );
}

export default LoginProfile;
