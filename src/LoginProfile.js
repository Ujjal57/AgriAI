
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
    if (signupData.email) {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(signupData.email)) {
        alert(t('regInvalidEmail', siteLang));
        return;
      }
    }
    try {
      const res = await fetch('http://127.0.0.1:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupData.name,
          phone: signupData.phone,
          aadhar: signupData.aadhar,
          email: signupData.email,
          password: signupData.password,
          role: signupData.role,
          region: signupData.region,
          state: signupData.state,
            address: signupData.address,
            language: siteLang
        })
      });
      const result = await res.json();
      if (res.ok) {
        alert(t('regSuccess', siteLang));
        setSignupData({ name: '', phone: '', email: '', aadhar: '', password: '', role: '', region: '', state: '' });
      } else {
        alert(result.error || t('regFailed', siteLang));
      }
    } catch (err) {
      alert(t('regServerError', siteLang));
    }
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
              <Input type='password' name='password' placeholder={t('signInButton', siteLang)} value={signinData.password} onChange={handleSigninChange} />
              <Anchor href='#'>{t('forgotPassword', siteLang)}</Anchor>
              <Button type='submit'>{t('signInButton', siteLang)}</Button>
            </Form>
            <div style={{margin: '18px 0 8px 0', fontWeight: 'bold', color: '#236902', fontFamily: 'Times New Roman'}}>or</div>
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
    </Container>
  );
}

export default LoginProfile;
