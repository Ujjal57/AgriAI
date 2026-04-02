import React from 'react';
import Navbar from './Navbar';
import logo from './assets/logo192.png';
import { t } from './i18n';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  * { box-sizing: border-box; }

  .cart-root {
    min-height: 100vh;
    font-family: 'Inter', sans-serif;
    background: linear-gradient(135deg, #0a2e0a 0%, #1a5c10 30%, #2d8a1f 60%, #53b635 100%);
    background-attachment: fixed;
    position: relative;
    overflow-x: hidden;
  }
  .cart-root::before {
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

  .cart-orb {
    position: fixed;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.18;
    pointer-events: none;
    z-index: 0;
    animation: cartFloatOrb 12s ease-in-out infinite;
  }
  .cart-orb-1 { width:400px;height:400px;background:#53b635;top:-100px;left:-100px;animation-delay:0s; }
  .cart-orb-2 { width:300px;height:300px;background:#236902;bottom:10%;right:-80px;animation-delay:4s; }
  .cart-orb-3 { width:250px;height:250px;background:#8fdb5e;top:40%;left:60%;animation-delay:8s; }
  @keyframes cartFloatOrb {
    0%,100%{transform:translate(0,0) scale(1);}
    33%{transform:translate(30px,-20px) scale(1.05);}
    66%{transform:translate(-20px,30px) scale(0.95);}
  }

  .cart-leaf {
    position: fixed;
    width: 10px; height: 10px;
    opacity: 0;
    pointer-events: none;
    z-index: 0;
    animation: cartLeafFall linear infinite;
  }
  .cart-leaf::before { content:'🌿'; font-size:16px; }
  .cart-leaf-1{left:5%;animation-duration:14s;animation-delay:0s;}
  .cart-leaf-2{left:20%;animation-duration:18s;animation-delay:3s;}
  .cart-leaf-3{left:40%;animation-duration:12s;animation-delay:6s;}
  .cart-leaf-4{left:65%;animation-duration:16s;animation-delay:1s;}
  .cart-leaf-5{left:85%;animation-duration:20s;animation-delay:9s;}
  @keyframes cartLeafFall {
    0%{transform:translateY(-40px) rotate(0deg);opacity:0;}
    10%{opacity:0.6;}
    90%{opacity:0.3;}
    100%{transform:translateY(110vh) rotate(720deg);opacity:0;}
  }

  .cart-main {
    position: relative;
    z-index: 1;
    padding: 5rem 1.5rem 3rem;
    max-width: 1280px;
    margin: 0 auto;
    animation: cartFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes cartFadeUp {
    from{opacity:0;transform:translateY(32px);}
    to{opacity:1;transform:translateY(0);}
  }

  .cart-glass {
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(20px) saturate(1.6);
    -webkit-backdrop-filter: blur(20px) saturate(1.6);
    border-radius: 24px;
    border: 1px solid rgba(255,255,255,0.6);
    box-shadow: 0 8px 32px rgba(35,105,2,0.12), 0 32px 64px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8);
    padding: 2.5rem;
  }

  .cart-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 2rem;
    position: relative;
    min-height: 48px;
  }
  .cart-title {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-size: 2.2rem;
    font-weight: 800;
    color: transparent;
    background: linear-gradient(135deg, #1a5c10 0%, #236902 50%, #53b635 100%);
    -webkit-background-clip: text;
    background-clip: text;
    margin: 0;
    letter-spacing: -0.5px;
    white-space: nowrap;
  }
  .cart-header-btns {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-left: auto;
    z-index: 2;
  }
  .cart-btn-secondary {
    padding: 7px 14px;
    background: #fff;
    border: 1.5px solid #d4edcc;
    color: #236902;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
  }
  .cart-btn-secondary:hover { transform:translateY(-2px); border-color:#53b635; box-shadow:0 4px 12px rgba(35,105,2,0.15); }
  .cart-btn-danger {
    padding: 7px 14px;
    background: #fff;
    border: 1.5px solid #f0dede;
    color: #d32f2f;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: transform 0.18s, box-shadow 0.18s;
  }
  .cart-btn-danger:hover { transform:translateY(-2px); box-shadow:0 4px 12px rgba(211,47,47,0.15); }

  /* Empty state */
  .cart-empty {
    text-align: center;
    padding: 4rem 2rem;
    color: #6b9b5a;
  }
  .cart-empty-icon { font-size: 4rem; display: block; margin-bottom: 1rem; opacity: 0.6; }
  .cart-empty-text { font-size: 1rem; font-weight: 600; }

  /* Two column layout */
  .cart-layout {
    display: flex;
    gap: 20px;
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .cart-items-col {
    flex: 1 1 620px;
    min-width: 320px;
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }

  /* Item card */
  .cart-item-card {
    display: flex;
    gap: 14px;
    align-items: center;
    background: #fff;
    border: 1px solid rgba(83,182,53,0.15);
    border-radius: 16px;
    padding: 14px;
    box-shadow: 0 4px 16px rgba(35,105,2,0.07);
    transition: transform 0.35s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.35s;
  }
  .cart-item-card:hover {
    transform: translateY(-4px) scale(1.01);
    box-shadow: 0 12px 32px rgba(35,105,2,0.14);
  }
  .cart-item-img-wrap {
    width: 120px; height: 90px;
    border-radius: 10px;
    overflow: hidden;
    background: linear-gradient(135deg, #e8f5e2, #f0faf0);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .cart-item-img { width:100%;height:100%;object-fit:cover;transition:transform 0.4s ease; }
  .cart-item-card:hover .cart-item-img { transform:scale(1.06); }
  .cart-item-no-img { color:#b2cfa8;font-size:0.8rem;text-align:center; }

  .cart-item-info { flex:1; }
  .cart-item-name-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 4px;
  }
  .cart-item-name { font-weight: 800; color: #1a5c10; font-size: 1rem; }
  .cart-variety-badge {
    background: linear-gradient(135deg, #eaf6ea, #d4f0d4);
    color: #236902;
    padding: 2px 8px;
    border-radius: 20px;
    font-weight: 700;
    font-size: 0.75rem;
    border: 1px solid rgba(83,182,53,0.25);
  }
  .cart-cat-badge {
    background: #eaf6ea;
    color: #236902;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 700;
  }
  .cart-item-price { font-weight: 700; color: #1a3d0a; font-size: 0.9rem; margin-bottom: 4px; }
  .cart-item-fees { display:flex; gap:12px; flex-wrap:wrap; align-items:center; }
  .cart-item-fee-text { font-size: 0.8rem; color: #5a8a4a; }
  .cart-item-total { font-size: 0.85rem; color: #1a3d0a; font-weight: 800; }

  /* Qty controls */
  .cart-item-controls { text-align:right; min-width:200px; flex-shrink:0; }
  .cart-avail-label { font-weight:700; font-size:0.82rem; color:#4a7a3a; margin-bottom:6px; }
  .cart-qty-row { display:flex; align-items:center; justify-content:flex-end; gap:6px; margin-bottom:8px; }
  .cart-qty-btn {
    width:30px; height:30px;
    border-radius:8px;
    border: 1.5px solid #d4edcc;
    background:#fff;
    font-size:1.1rem;
    font-weight:700;
    color:#236902;
    cursor:pointer;
    transition:background 0.15s, border-color 0.15s, transform 0.15s;
    display:flex; align-items:center; justify-content:center;
  }
  .cart-qty-btn:hover { background:#eaf6ea; border-color:#53b635; transform:scale(1.1); }
  .cart-qty-val { min-width:64px; text-align:center; font-weight:800; font-size:0.9rem; color:#1a3d0a; }

  .cart-edit-input {
    width: 110px;
    padding: 6px 10px;
    border: 1.5px solid #53b635;
    border-radius: 8px;
    font-size: 0.85rem;
    font-family: inherit;
    color: #1a3d0a;
    outline: none;
    transition: box-shadow 0.2s;
  }
  .cart-edit-input:focus { box-shadow: 0 0 0 3px rgba(83,182,53,0.2); }

  .cart-action-row { display:flex; gap:6px; justify-content:flex-end; flex-wrap:wrap; }

  .cart-btn-edit {
    padding: 6px 12px;
    background: linear-gradient(135deg,#1565c0,#1976d2);
    color:#fff; border:none; border-radius:8px;
    font-size:0.8rem; font-weight:700; font-family:inherit;
    cursor:pointer;
    box-shadow:0 2px 8px rgba(25,118,210,0.25);
    transition:transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s;
  }
  .cart-btn-edit:hover { transform:translateY(-2px) scale(1.04); box-shadow:0 6px 16px rgba(25,118,210,0.35); }

  .cart-btn-remove {
    padding: 6px 12px;
    background:#fff;
    border: 1.5px solid #d32f2f;
    color:#d32f2f; border-radius:8px;
    font-size:0.8rem; font-weight:700; font-family:inherit;
    cursor:pointer;
    transition:transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s;
  }
  .cart-btn-remove:hover { transform:translateY(-2px) scale(1.04); box-shadow:0 6px 16px rgba(211,47,47,0.2); background:#ffebee; }

  .cart-btn-save {
    padding: 6px 12px;
    background: linear-gradient(135deg,#236902,#53b635);
    color:#fff; border:none; border-radius:8px;
    font-size:0.8rem; font-weight:700; font-family:inherit;
    cursor:pointer;
    box-shadow:0 2px 8px rgba(35,105,2,0.2);
    transition:transform 0.15s, box-shadow 0.15s;
  }
  .cart-btn-save:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(35,105,2,0.3); }

  .cart-btn-cancel {
    padding: 6px 12px;
    background:#e8e8e8; color:#555;
    border:none; border-radius:8px;
    font-size:0.8rem; font-weight:700; font-family:inherit;
    cursor:pointer;
    transition:transform 0.15s;
  }
  .cart-btn-cancel:hover { transform:translateY(-1px); background:#ddd; }

  /* Summary sidebar */
  .cart-summary-col {
    flex: 0 0 320px;
    width: 320px;
    position: sticky;
    top: 88px;
    align-self: flex-start;
  }
  .cart-summary-box {
    background: linear-gradient(135deg, rgba(234,246,234,0.7) 0%, rgba(255,255,255,0.5) 100%);
    border: 1px solid rgba(83,182,53,0.2);
    border-radius: 16px;
    padding: 1.25rem;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.8);
  }
  .cart-summary-title {
    font-size: 1rem;
    font-weight: 800;
    color: #236902;
    margin: 0 0 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .cart-summary-title::before {
    content:'';
    display:inline-block;
    width:4px; height:16px;
    background:linear-gradient(180deg,#53b635,#236902);
    border-radius:2px;
  }
  .cart-summary-rows { display:grid; gap:6px; }
  .cart-summary-row {
    background: #fff;
    border: 1px solid rgba(83,182,53,0.1);
    border-radius: 10px;
    padding: 7px 10px;
    font-size: 0.85rem;
    font-weight: 700;
    color: #1a3d0a;
  }
  .cart-summary-total {
    font-size: 1.05rem;
    color: #236902;
    background: linear-gradient(135deg,#eaf6ea,#d4f0d4);
    border: 1px solid rgba(83,182,53,0.25);
    border-radius: 10px;
    padding: 9px 10px;
    font-weight: 800;
    margin-top: 4px;
  }

  .cart-section-divider {
    height:1px;
    background:linear-gradient(90deg,transparent,rgba(83,182,53,0.3),transparent);
    margin:12px 0;
  }

  .cart-options-title {
    font-size:0.78rem;
    font-weight:700;
    color:#2d5c1a;
    text-transform:uppercase;
    letter-spacing:0.5px;
    margin:0 0 8px;
  }
  .cart-radio-group { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:12px; }
  .cart-radio-label {
    display:flex; align-items:center; gap:5px;
    font-size:0.83rem; font-weight:600; color:#1a3d0a;
    cursor:pointer;
  }
  .cart-radio-label input[type="radio"] { accent-color:#236902; }

  .cart-submit-btn {
    margin-top:12px;
    width:100%;
    padding:0.85rem 1rem;
    background:linear-gradient(135deg,#236902 0%,#53b635 100%);
    color:#fff;
    border:none;
    border-radius:12px;
    font-size:0.95rem;
    font-weight:700;
    font-family:inherit;
    cursor:pointer;
    box-shadow:0 4px 16px rgba(35,105,2,0.3), 0 1px 0 rgba(255,255,255,0.15) inset;
    transition:transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s, filter 0.18s;
    position:relative; overflow:hidden;
  }
  .cart-submit-btn::after {
    content:'';
    position:absolute; inset:0;
    background:linear-gradient(135deg,rgba(255,255,255,0.15),transparent);
    border-radius:inherit;
  }
  .cart-submit-btn:hover:not(:disabled) {
    transform:translateY(-3px) scale(1.03);
    box-shadow:0 8px 28px rgba(35,105,2,0.35);
    filter:brightness(1.05);
  }
  .cart-submit-btn:active:not(:disabled) { transform:translateY(0) scale(0.98); }
  .cart-submit-btn:disabled { opacity:0.7; cursor:not-allowed; }

  /* Contract preview modal */
  .cart-modal-overlay {
    position:fixed; top:0;left:0;right:0;bottom:0;
    background:rgba(0,0,0,0.55);
    display:flex; align-items:center; justify-content:center;
    z-index:9999;
    backdrop-filter:blur(4px);
  }
  .cart-contract-modal {
    width:94%; max-width:960px; max-height:92vh;
    background:#fff;
    border-radius:20px;
    padding:20px;
    overflow:auto;
    box-shadow:0 24px 64px rgba(0,0,0,0.25);
    animation:cartFadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both;
  }
  .cart-contract-header {
    position:relative; margin-bottom:12px; min-height:40px;
    display:flex; align-items:center; justify-content:center;
  }
  .cart-contract-header-title {
    font-weight:800; font-size:1.1rem;
    color:transparent;
    background:linear-gradient(135deg,#1a5c10,#236902,#53b635);
    -webkit-background-clip:text; background-clip:text;
  }
  .cart-contract-header-actions {
    position:absolute; right:0; top:0;
    display:flex; gap:8px; align-items:center;
  }
  .cart-modal-btn {
    padding:6px 12px;
    border:1.5px solid #d4edcc;
    background:#fff; color:#236902;
    border-radius:8px; font-size:0.82rem; font-weight:700;
    font-family:inherit; cursor:pointer;
    transition:transform 0.15s, border-color 0.15s;
  }
  .cart-modal-btn:hover { transform:translateY(-1px); border-color:#53b635; }
  .cart-contract-body {
    border:1px solid rgba(83,182,53,0.2);
    border-radius:10px; padding:16px; background:#fafff8;
  }
  .cart-contract-send-row {
    text-align:right; margin-top:14px;
  }

  /* OTP modal */
  .cart-otp-modal {
    width:90%; max-width:500px;
    background:#fff;
    border-radius:20px;
    padding:28px;
    box-shadow:0 24px 64px rgba(0,0,0,0.2);
    animation:cartFadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both;
  }
  .cart-otp-title {
    margin:0 0 12px; font-size:1.25rem; font-weight:800; text-align:center;
    color:transparent;
    background:linear-gradient(135deg,#1a5c10,#236902,#53b635);
    -webkit-background-clip:text; background-clip:text;
  }
  .cart-otp-desc { color:#5a8a4a; margin-bottom:16px; font-size:0.9rem; font-weight:500; }
  .cart-sig-box {
    background:linear-gradient(135deg,#f0f7ea,#eaf6ea);
    border:2px solid #53b635;
    border-radius:12px; padding:16px; margin-bottom:16px;
  }
  .cart-otp-label {
    display:block; margin-bottom:6px;
    font-size:0.78rem; font-weight:700; color:#2d5c1a;
    text-transform:uppercase; letter-spacing:0.5px;
  }
  .cart-otp-input {
    width:100%; padding:10px 14px;
    border:1.5px solid #d4edcc; border-radius:10px;
    font-size:0.9rem; font-family:inherit;
    background:rgba(255,255,255,0.95); color:#1a3d0a;
    outline:none;
    transition:border-color 0.25s, box-shadow 0.25s;
  }
  .cart-otp-input:focus { border-color:#53b635; box-shadow:0 0 0 3px rgba(83,182,53,0.18); }
  .cart-otp-input:disabled { background:#f5f5f5; }
  .cart-otp-code-input {
    width:100%; padding:12px 14px;
    border:1.5px solid #d4edcc; border-radius:10px;
    font-size:1.2rem; font-family:inherit;
    background:#fff; color:#1a3d0a;
    outline:none; text-align:center;
    letter-spacing:6px; font-weight:800;
    transition:border-color 0.25s, box-shadow 0.25s;
  }
  .cart-otp-code-input:focus { border-color:#53b635; box-shadow:0 0 0 3px rgba(83,182,53,0.18); }
  .cart-otp-hint { font-size:0.78rem; color:#6b9b5a; margin-top:4px; }
  .cart-otp-error {
    background:linear-gradient(135deg,#ffebee,#fce4ec);
    border:1px solid rgba(198,40,40,0.3);
    color:#c62828; padding:10px 14px; border-radius:10px;
    margin-top:12px; font-size:0.85rem; font-weight:600;
  }
  .cart-otp-btn-row { margin-top:16px; display:flex; gap:8px; }

  @media (max-width:768px) {
    .cart-glass { padding:1.5rem; }
    .cart-title { font-size:1.5rem; }
    .cart-summary-col { flex:1 1 100%; width:100%; position:static; }
    .cart-item-controls { min-width:unset; }
  }
`;

const Cart = () => {
  const [items, setItems] = React.useState([]);
  const [editingId, setEditingId] = React.useState(null);
  const [editVal, setEditVal] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('cod');
  const [paymentError, setPaymentError] = React.useState('');
  const [contractNature, setContractNature] = React.useState('pre-harvest');
  const [contractDuration, setContractDuration] = React.useState('one-time');
  const [contractHtml, setContractHtml] = React.useState('');
  const [showContractPreview, setShowContractPreview] = React.useState(false);
  const [contractMetadata, setContractMetadata] = React.useState(null);
  const [uploadingContracts, setUploadingContracts] = React.useState(false);
  const [showOtpModal, setShowOtpModal] = React.useState(false);
  const [otpEmail, setOtpEmail] = React.useState(localStorage.getItem('agriai_email') || '');
  const [otpCode, setOtpCode] = React.useState('');
  const [otpSent, setOtpSent] = React.useState(false);
  const [otpLoading, setOtpLoading] = React.useState(false);
  const [otpError, setOtpError] = React.useState('');
  const [otpVerified, setOtpVerified] = React.useState(false);
  const [digitalSignature, setDigitalSignature] = React.useState('');
  const [currentBuyerName, setCurrentBuyerName] = React.useState('');
  const [pendingContractAction, setPendingContractAction] = React.useState(null);

  const openOtpForContract = () => {
    setOtpEmail(localStorage.getItem('agriai_email') || '');
    setOtpCode('');
    setOtpSent(false);
    setOtpError('');
    setShowOtpModal(true);
  };

  const sendOtpToEmail = async (email) => {
    setOtpLoading(true);
    setOtpError('');
    try {
      const response = await fetch(`${apiBase}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, purpose: 'contract-signature' })
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.ok) { setOtpSent(true); setOtpLoading(false); return true; }
      else { setOtpError(data.error || 'Failed to send OTP. Please try again.'); setOtpLoading(false); return false; }
    } catch (e) { console.error('OTP send error:', e); setOtpError('Network error. Please try again.'); setOtpLoading(false); return false; }
  };

  const verifyOtp = async (email, otp) => {
    setOtpLoading(true);
    setOtpError('');
    try {
      const response = await fetch(`${apiBase}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, otp: otp, purpose: 'contract-signature' })
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.ok) {
        const signature = generateDigitalSignature(email, otp);
        setDigitalSignature(signature);
        setOtpVerified(true);
        try {
          setContractMetadata(prev => ({
            ...(prev || {}),
            digital_signature: signature.signature_hash,
            signature_method: signature.signature_method,
            signature_email: signature.signer_email,
            signature_timestamp: signature.signature_timestamp
          }));
        } catch (e) {}
        setOtpLoading(false);
        return signature;
      } else { setOtpError(data.error || 'Invalid OTP. Please try again.'); setOtpLoading(false); return false; }
    } catch (e) { console.error('OTP verification error:', e); setOtpError('Network error. Please try again.'); setOtpLoading(false); return false; }
  };

  const generateDigitalSignature = (email, otp) => {
    const timestamp = new Date().toISOString();
    const signatureData = `${email}|${timestamp}|${otp.slice(0,2)}***`;
    const hashString = btoa(signatureData);
    return { signer_email: email, signature_timestamp: timestamp, signature_hash: hashString, signature_method: 'OTP_VERIFIED' };
  };

  const handleOtpSend = async () => {
    if (!otpEmail) { setOtpError('Email is required'); return; }
    await sendOtpToEmail(otpEmail);
  };

  const handleOtpVerifyAndSign = async () => {
    if (!otpCode || otpCode.length < 4) { setOtpError('Please enter a valid OTP'); return; }
    const result = await verifyOtp(otpEmail, otpCode);
    if (result && typeof result === 'object') {
      const name = currentBuyerName || localStorage.getItem('agriai_name') || '';
      const ts = result.signature_timestamp || new Date().toISOString();
      const formatted = new Date(ts).toLocaleDateString('en-GB');
      let updated = contractHtml || '';
      updated = updated.replace(/(<p>Buyer \/ Authorized Representative<\/p>[\s\S]*?<p>Signature:)\s*[^<]*/m, `$1 <strong>${name}</strong>`);
      updated = updated.replace(/(<p>Buyer \/ Authorized Representative<\/p>[\s\S]*?<p>Date:)\s*[^<]*/m, `$1 <strong>${formatted}</strong>`);
      updated = updated.replace(/(<p>खरीदार \/ अधिकृत प्रतिनिधि<\/p>[\s\S]*?<p>हस्ताक्षर:)\s*[^<]*/m, `$1 <strong>${name}</strong>`);
      updated = updated.replace(/(<p>खरीदार \/ अधिकृत प्रतिनिधि<\/p>[\s\S]*?<p>तिथि:)\s*[^<]*/m, `$1 <strong>${formatted}</strong>`);
      updated = updated.replace(/(<p>ಖರೀದಿದಾರ \/ ಅಧಿಕೃತ ಪ್ರತಿನಿಧಿ<\/p>[\s\S]*?<p>ಸಹಿ:)\s*[^<]*/m, `$1 <strong>${name}</strong>`);
      updated = updated.replace(/(<p>ಖರೀದಿದಾರ \/ ಅಧಿಕೃತ ಪ್ರತಿನಿಧಿ<\/p>[\s\S]*?<p>ದಿನಾಂಕ:)\s*[^<]*/m, `$1 <strong>${formatted}</strong>`);
      setContractHtml(updated);
      setDigitalSignature(result);
      setOtpVerified(true);
      setShowOtpModal(false);
      setShowContractPreview(true);
    }
  };

  const resetOtpModal = () => {
    setShowOtpModal(false);
    setOtpCode('');
    setOtpSent(false);
    setOtpError('');
  };

  const injectBuyerSignatureIntoHtml = (signatureObj) => {
    try {
      if (!signatureObj) return;
      const name = currentBuyerName || localStorage.getItem('agriai_name') || '';
      const ts = signatureObj.signature_timestamp || new Date().toISOString();
      const formatted = new Date(ts).toLocaleDateString('en-GB');
      let updated = contractHtml || '';
      updated = updated.replace(/<p>Buyer \/ Authorized Representative<\/>\s*<p>Signature:[\s\S]*?<\/>\s*<p>Date:[\s\S]*?<\/>/m, `<p>Buyer / Authorized Representative</p>\n  <p>Signature: <strong>${name}</strong></p>\n  <p>Date: <strong>${formatted}</strong></p>`);
      updated = updated.replace(/<p>खरीदार \/ अधिकृत प्रतिनिधि<\/>\s*<p>हस्ताक्षर:[\s\S]*?<\/>\s*<p>तिथि:[\s\S]*?<\/>/m, `<p>खरीदार / अधिकृत प्रतिनिधि</p>\n  <p>हस्ताक्षर: <strong>${name}</strong></p>\n  <p>तिथि: <strong>${formatted}</strong></p>`);
      updated = updated.replace(/<p>ಖರೀದಿದಾರ \/ ಅಧಿಕೃತ ಪ್ರತಿನಿಧಿ<\/>\s*<p>ಸಹಿ:[\s\S]*?<\/>\s*<p>ದಿನಾಂಕ:[\s\S]*?<\/>/m, `<p>ಖರೀದಿದಾರ / ಅಧಿಕೃತ ಪ್ರತಿನಿಧಿ</p>\n  <p>ಸಹಿ: <strong>${name}</strong></p>\n  <p>ದಿನಾಂಕ: <strong>${formatted}</strong></p>`);
      setContractHtml(updated);
    } catch (e) { console.warn('injectBuyerSignature failed', e); }
  };

  const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');

  const uploadContractsToServer = async () => {
    if (!contractMetadata) return;
    if (uploadingContracts) return;
    setUploadingContracts(true);
    try {
      console.log('🔍 uploading contract records...', contractMetadata);
      const failedSaves = [];
      let savedContractNumber = null;
      const summary = { subtotal: (items.reduce((s, it) => s + ((Number(it.order_quantity || 0) || 0) * (Number(it.price_per_kg || 0) || 0)), 0)), platform_fee: 0, gst: 0 };
      const buyerTotals = { commission: contractMetadata.buyer_platform_fee || 0, gst: contractMetadata.buyer_gst || 0 };
      const cropsToSave = (contractMetadata && contractMetadata.crops && Array.isArray(contractMetadata.crops))
        ? contractMetadata.crops
        : items.map(it => ({ id: it.id, buyer_id: it.buyer_id, crop_name: it.crop_name, variety: it.variety || '', quantity: Number(it.order_quantity || 0), price_per_kg: Number(it.price_per_kg || 0), amount: Number(it.order_quantity || 0) * Number(it.price_per_kg || 0) }));
      for (const crop of cropsToSave) {
        try {
          const contractPayload = {
            contract_number: contractMetadata.contract_number, farmer_id: contractMetadata.farmer_id, farmer_name: contractMetadata.farmer_name, farmer_address: contractMetadata.farmer_address, farmer_state: contractMetadata.farmer_state, buyer_id: contractMetadata.buyer_id || crop.buyer_id, buyer_name: contractMetadata.buyer_name, buyer_address: contractMetadata.buyer_address, buyer_state: contractMetadata.buyer_state, crop_name: crop.crop_name, variety: crop.variety, quantity: crop.quantity, price_per_kg: crop.price_per_kg, amount: crop.amount, contract_nature: contractMetadata.contract_nature, contract_duration: contractMetadata.contract_duration, start_date: contractMetadata.start_date, end_date: contractMetadata.end_date, duration: contractMetadata.duration, farmer_platform_fee: contractMetadata.farmer_platform_fee, farmer_gst: contractMetadata.farmer_gst, buyer_platform_fee: contractMetadata.buyer_platform_fee, buyer_gst: contractMetadata.buyer_gst,
            buyer_total: (function() { try { const cropAmount = Number(crop.amount || 0); const subtotal = summary.subtotal || 0; const buyerPlatformTotal = buyerTotals.commission || 0; const buyerGstTotal = buyerTotals.gst || 0; const share = (subtotal > 0) ? (cropAmount / subtotal) : 0; const bf = Math.round((buyerPlatformTotal * share + Number.EPSILON) * 100) / 100; const bg = Math.round((buyerGstTotal * share + Number.EPSILON) * 100) / 100; return Math.round((cropAmount + bf + bg + Number.EPSILON) * 100) / 100; } catch (e) { return null; } })(),
            farmer_total: (function() { try { const cropAmount = Number(crop.amount || 0); const fpf = contractMetadata.farmer_platform_fee || 0; const fg = contractMetadata.farmer_gst || 0; return Math.round((cropAmount - fpf - fg + Number.EPSILON) * 100) / 100; } catch (e) { return null; } })(),
            delivery_cost: contractMetadata.delivery_cost, status: 'pending',
            sender: 'buyer'  // Buyer is sending the contract
          };
          if (digitalSignature) { contractPayload.signature_method = digitalSignature.signature_method; contractPayload.signature_timestamp = digitalSignature.signature_timestamp; }
          const saveRes = await fetch(`${apiBase}/contracts/save-buyer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contractPayload) });
          if (saveRes && saveRes.ok) { const bodyJson = await saveRes.json().catch(() => null); if (bodyJson && bodyJson.contract_number && !savedContractNumber) { savedContractNumber = bodyJson.contract_number; } }
          else { const text = await (saveRes.text ? saveRes.text() : Promise.resolve('')).catch(() => ''); failedSaves.push({ crop: crop.crop_name, status: saveRes ? saveRes.status : 'no-response', body: text }); }
        } catch (e) { console.warn('❌ Error saving contract (fetch failed):', e); failedSaves.push({ crop: crop.crop_name, status: 'fetch-error', body: String(e) }); }
      }
      if (failedSaves.length) { console.warn('Some contract rows failed to save:', failedSaves); alert(`${failedSaves.length} rows failed to save. See console for details.`); }
      else {
        alert('Contract saved successfully to server.');
        try { window.dispatchEvent(new Event('agriai:contracts:saved')); } catch (e) {}
        try {
          const buyer = { id: contractMetadata.buyer_id || localStorage.getItem('agriai_id') || null, name: contractMetadata.buyer_name || localStorage.getItem('agriai_name') || '', phone: contractMetadata.buyer_phone || localStorage.getItem('agriai_phone') || '', email: localStorage.getItem('agriai_email') || '' };
          const contractNum = savedContractNumber || contractMetadata.contract_number;
          fetch(`${apiBase}/notifications/contract-submitted`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contract_number: contractNum, buyer, items: (contractMetadata.crops || []).map(c => ({ ...c, farmer_id: c.farmer_id || contractMetadata.farmer_id })) }) }).catch(() => {});
          try {
            const localKey = 'agriai_notifications'; const rawLocal = localStorage.getItem(localKey); const localArr = rawLocal ? JSON.parse(rawLocal) : []; const byFarmer = {};
            (contractMetadata.crops || []).forEach(it => { const fid = it.farmer_id || contractMetadata.farmer_id || 'unknown'; if (!byFarmer[fid]) byFarmer[fid] = []; byFarmer[fid].push(it); });
            Object.keys(byFarmer).forEach((fid, idx) => { const group = byFarmer[fid]; const qty = group.reduce((s, x) => s + (Number(x.quantity || x.order_quantity || 0) || 0), 0); const notif = { id: `N${Date.now()}C${idx}`, contract_number: contractNum, created_at: new Date().toISOString(), farmer_id: fid === 'unknown' ? null : fid, buyer_name: buyer.name || '', buyer_id: buyer.id || null, items: group, quantity_kg: qty, crop_name: group[0] ? group[0].crop_name : 'Contract' }; localArr.unshift(notif); });
            try { localStorage.setItem(localKey, JSON.stringify(localArr)); } catch (e) {}
            try { window.dispatchEvent(new Event('agriai:notifications:local:update')); } catch (e) {}
          } catch (e) {}
        } catch (e) { console.warn('Failed to send contract notification', e); }
        clearCart(); setShowContractPreview(false); setContractMetadata(null);
      }
    } catch (e) { console.warn('Error uploading contracts:', e); alert('Contract upload failed. See console.'); }
    finally { try { setPendingContractAction(null); } catch (e) {} setUploadingContracts(false); setOtpVerified(false); setDigitalSignature(''); }
  };

  React.useEffect(() => {
    const loadCart = async () => {
      try {
        const userRole = localStorage.getItem('agriai_role') || '';
        const userId = localStorage.getItem('agriai_id') || '';
        const userPhone = localStorage.getItem('agriai_phone') || '';
        const cartKey = userRole === 'farmer' ? 'agriai_cart_farmer' : 'agriai_cart_buyer';
        if (userRole && (userId || userPhone)) {
          try {
            const qp = userId ? `user_type=${encodeURIComponent(userRole)}&user_id=${encodeURIComponent(userId)}` : `user_type=${encodeURIComponent(userRole)}&user_phone=${encodeURIComponent(userPhone)}`;
            const res = await fetch(`${apiBase}/cart/list?${qp}`);
            if (res && res.ok) {
              const j = await res.json().catch(() => null);
              if (j && j.ok && Array.isArray(j.cart)) {
                const mapped = j.cart.map(r => ({ id: r.crop_id || r.id, cart_id: r.id, crop_name: r.crop_name || '', quantity_kg: Number(r.total_quantity != null ? r.total_quantity : r.quantity_kg || 0), price_per_kg: r.price_per_kg != null ? Number(r.price_per_kg) : 0, image_url: r.image_path || r.image_url || '', order_quantity: Number(r.quantity_kg || 0), variety: r.variety || '', user_type: r.user_type || userRole, user_id: r.user_id || null, user_phone: r.user_phone || null }));
                setItems(mapped); try { localStorage.setItem(cartKey, JSON.stringify(mapped)); } catch (e) {} return;
              }
            }
          } catch (e) { console.warn('Failed to load server cart, falling back to localStorage', e); }
        }
        try {
          const raw = localStorage.getItem(cartKey); const arr = raw ? JSON.parse(raw) : [];
          const normalized = (Array.isArray(arr) ? arr : []).map(it => { try { const avail = Number(it.quantity_kg || 0) || 0; const order = (it.order_quantity !== undefined && it.order_quantity !== null) ? Number(it.order_quantity) : 0; return { ...it, quantity_kg: avail, order_quantity: order }; } catch (e) { return it; } });
          setItems(normalized);
        } catch (e) { setItems([]); }
      } catch (e) { setItems([]); }
    };
    loadCart();
    const handler = () => { try { loadCart(); } catch (e) { console.warn('cart update handler error', e); } };
    window.addEventListener('agriai:cart:update', handler);
    return () => { try { window.removeEventListener('agriai:cart:update', handler); } catch (e) {} };
  }, []);

  React.useEffect(() => {
    const handler = () => { try { window.dispatchEvent(new Event('agriai:cart:update')); } catch (e) {} };
    window.addEventListener('agri:lang:change', handler);
    return () => { try { window.removeEventListener('agri:lang:change', handler); } catch (e) {} };
  }, []);

  const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  const clearCart = () => {
    (async () => {
      const userRole = localStorage.getItem('agriai_role') || ''; const userId = localStorage.getItem('agriai_id') || ''; const userPhone = localStorage.getItem('agriai_phone') || ''; const cartKey = userRole === 'farmer' ? 'agriai_cart_farmer' : 'agriai_cart_buyer';
      if (userRole && (userId || userPhone)) { try { const payload = { user_type: userRole, user_id: userId || undefined, user_phone: userPhone || undefined }; const res = await fetch(`${apiBase}/cart/clear`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!res.ok) console.warn('cart/clear failed'); } catch (e) { console.warn('cart/clear error', e); } }
      try { localStorage.setItem(cartKey, JSON.stringify([])); } catch (e) {}
      setItems([]); try { window.dispatchEvent(new Event('agriai:cart:update')); } catch (e) {}
    })();
  };

  const updateQuantity = (id, delta) => {
    try {
      const updated = items.map(it => { if (it.id !== id) return it; const avail = Number(it.quantity_kg || 0) || 0; const current = Number(it.order_quantity || 0) || 0; const next = Math.max(0, Math.min(avail, current + delta)); return { ...it, order_quantity: next }; });
      setItems(updated);
      const userRole = localStorage.getItem('agriai_role') || ''; const userId = localStorage.getItem('agriai_id') || ''; const userPhone = localStorage.getItem('agriai_phone') || ''; const cartKey = userRole === 'farmer' ? 'agriai_cart_farmer' : 'agriai_cart_buyer';
      try { localStorage.setItem(cartKey, JSON.stringify(updated)); } catch (e) {}
      const it = updated.find(x => x.id === id);
      if (it && it.cart_id && userRole && (userId || userPhone)) { (async () => { try { const payload = { id: it.cart_id, quantity_kg: it.order_quantity, user_type: userRole, user_id: userId || undefined, user_phone: userPhone || undefined }; const res = await fetch(`${apiBase}/cart/update`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!res.ok) console.warn('cart/update failed'); } catch (e) { console.warn('cart/update error', e); } })(); }
    } catch (e) { console.warn(e); }
  };

  const removeItem = (id) => {
    (async () => {
      try {
        const userRole = localStorage.getItem('agriai_role') || ''; const userId = localStorage.getItem('agriai_id') || ''; const userPhone = localStorage.getItem('agriai_phone') || ''; const cartKey = userRole === 'farmer' ? 'agriai_cart_farmer' : 'agriai_cart_buyer';
        const it = items.find(x => x.id === id);
        if (it && it.cart_id && userRole && (userId || userPhone)) { try { const payload = { ids: [it.cart_id], user_type: userRole, user_id: userId || undefined, user_phone: userPhone || undefined }; const res = await fetch(`${apiBase}/cart/remove`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!res.ok) console.warn('cart/remove failed'); } catch (e) { console.warn('cart/remove error', e); } }
        let arr = items.filter(itm => itm && itm.id !== id);
        try { localStorage.setItem(cartKey, JSON.stringify(arr)); } catch (e) {}
        setItems(arr); try { window.dispatchEvent(new Event('agriai:cart:update')); } catch (e) {}
      } catch (e) { console.warn(e); }
    })();
  };

  const startEdit = (it) => { setEditingId(it.id); setEditVal(String(Number(it.order_quantity || 0))); };
  const cancelEdit = () => { setEditingId(null); setEditVal(''); };

  const saveEdit = (id) => {
    try {
      const newVal = parseFloat(editVal);
      if (Number.isNaN(newVal) || newVal <= 0) { alert('Please enter a valid order quantity (greater than 0).'); return; }
      const updated = items.map(it => { if (it.id === id) { const avail = Number(it.quantity_kg || 0) || 0; const final = Math.min(newVal, avail); return { ...it, order_quantity: final }; } return it; });
      setItems(updated);
      const userRole = localStorage.getItem('agriai_role') || ''; const userId = localStorage.getItem('agriai_id') || ''; const userPhone = localStorage.getItem('agriai_phone') || ''; const cartKey = userRole === 'farmer' ? 'agriai_cart_farmer' : 'agriai_cart_buyer';
      try { localStorage.setItem(cartKey, JSON.stringify(updated)); } catch (e) {}
      const it = updated.find(x => x.id === id);
      if (it && it.cart_id && userRole && (userId || userPhone)) { (async () => { try { const payload = { id: it.cart_id, quantity_kg: it.order_quantity, user_type: userRole, user_id: userId || undefined, user_phone: userPhone || undefined }; const res = await fetch(`${apiBase}/cart/update`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!res.ok) console.warn('cart/update failed'); } catch (e) { console.warn('cart/update error', e); } })(); }
      setEditingId(null); setEditVal('');
    } catch (e) { console.warn(e); }
  };

  const calculateGstAndCommission = (item) => {
    const qty = Number(item.order_quantity || 0); const price = Number(item.price_per_kg || 0); const total = qty * price;
    const cat = (item.category || item.cat || '').toString().toLowerCase();
    let gstRate = 0; let commissionRate = 0;
    if (cat.includes('masala') || cat.includes('masalas') || (item.crop_name || '').toString().toLowerCase().includes('masala')) { commissionRate = 12; gstRate = 5; }
    else if (cat.includes('fruit') || cat.includes('vegetable') || (item.crop_name || '').toString().toLowerCase().includes('fruit') || (item.crop_name || '').toString().toLowerCase().includes('vegetable')) { commissionRate = 9; gstRate = 0; }
    else if (cat.includes('food') || cat.includes('food crop') || cat.includes('food crops') || cat.includes('crop') || cat.includes('crops')) { commissionRate = 7; gstRate = 0; }
    else { commissionRate = 7; gstRate = 0; }
    const itemGstAmt = (total * gstRate) / 100; const commissionAmt = (total * commissionRate) / 100; const gstOnPlatformFee = commissionAmt * 0.18; const gstAmt = itemGstAmt + gstOnPlatformFee;
    return { gstRate, commissionRate, gstAmt, commissionAmt, gstOnPlatformFee, lineTotal: total };
  };

  const totals = items.reduce((acc, it) => { const { gstAmt, commissionAmt, lineTotal } = calculateGstAndCommission(it); acc.subtotal += lineTotal; acc.gst += gstAmt; acc.commission += commissionAmt; return acc; }, { subtotal: 0, gst: 0, commission: 0 });
  const grandTotal = totals.subtotal + totals.gst + totals.commission;
  const totalAvailableQty = items.reduce((s, it) => s + (Number(it.quantity_kg || 0) || 0), 0);
  const totalOrderedQty = items.reduce((s, it) => s + (Number(it.order_quantity || 0) || 0), 0);
  const userRole = (typeof window !== 'undefined' && window.localStorage) ? (localStorage.getItem('agriai_role') || '') : '';
  const lang = (typeof window !== 'undefined' && localStorage.getItem('agri_lang')) || 'en';

  const generateBill = () => {
    const invoiceId = 'ORD' + Date.now(); const date = new Date().toLocaleString(); const logoSrc = window.location.origin + logo;
    const totalContractQty = totalOrderedQty; const qtyKg = Math.round(totalContractQty || 0);
    const qtyRateMap = [{ min:0,max:40,rates:[12,18,22] },{ min:41,max:400,rates:[18,22,28] },{ min:401,max:1500,rates:[22,28,35] },{ min:1501,max:5000,rates:[28,35,45] },{ min:5001,max:10000,rates:[35,45,60] }];
    let matching = qtyRateMap.find(r => qtyKg >= r.min && qtyKg <= r.max); if (!matching) matching = qtyRateMap[qtyRateMap.length - 1];
    const formatRates = (arr) => { const parts = (arr || []).map(v => `₹${v} / km`); if (parts.length === 0) return '₹-- / km'; if (parts.length === 1) return parts[0]; if (parts.length === 2) return `${parts[0]} or ${parts[1]}`; return `${parts.slice(0, -1).join(', ')} or ${parts[parts.length - 1]}`; };
    const deliveryRateDisplay = `${formatRates(matching.rates)}`;
    const computeLabourCharge = (q) => { if (!Number.isFinite(q) || q <= 0) return 0; if (q <= 100) return 40; if (q <= 1000) return 750; return Math.round(750 + ((q - 1000) / 1000) * 300); };
    const labourCharge = computeLabourCharge(qtyKg);
    const includeFeesInBill = true;
    let html = `<html><head><title>Invoice ${invoiceId}</title><style>body{font-family:'Times New Roman',serif;padding:20px;color:#333;}h1{color:#236902;text-align:center;}table{width:100%;border-collapse:collapse;margin-top:20px;}th,td{border:1px solid #ccc;padding:8px;text-align:center;}th{background:#f4f4f4;}.total{text-align:right;font-weight:bold;padding-right:10px;}.footer{margin-top:20px;font-size:14px;color:#555;text-align:center;}#printBtn{background-color:#236902;color:white;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;font-size:15px;margin:15px auto;display:block;}#printBtn:hover{background-color:#1a4f02;}.infoBtn{margin-left:8px;border:0;background:#1a4f02;color:#fff;border-radius:50%;width:20px;height:20px;font-size:12px;line-height:18px;cursor:pointer;}.modal{position:fixed;left:0;top:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;z-index:10000;background:rgba(0,0,0,0.5);}.modal-content{width:92%;max-width:760px;background:#fff;border-radius:8px;padding:18px;box-shadow:0 12px 40px rgba(0,0,0,0.25);overflow:auto;}</style></head><body><div style="text-align:center;"><img src="${logoSrc}" alt="AgriAI Logo" style="width:100px;height:100px;display:block;margin:0 auto 10px auto;" /><h1>Agri AI Invoice</h1></div><p><strong>Invoice ID:</strong> ${invoiceId}<br><strong>Date:</strong> ${date}<br><strong>Contract Nature:</strong> ${contractNature === 'pre-harvest' ? 'Pre-Harvest Production Contract' : 'Post-Harvest Procurement Contract'}<br><strong>Contract Duration:</strong> ${contractDuration === 'one-time' ? 'One-Time' : (contractDuration === 'seasonal' ? 'Seasonal' : 'Yearly')}</p><table><thead><tr><th>#</th><th>Crop Name</th><th>Variety</th><th>Quantity (kg)</th><th>Price/kg</th>${includeFeesInBill ? '<th>GST</th><th>Platform Fee</th>' : ''}<th>Total</th></tr></thead><tbody>`;
    items.forEach((it, idx) => { const { gstAmt, commissionAmt, lineTotal } = calculateGstAndCommission(it); const itemTotal = lineTotal + gstAmt + commissionAmt; html += `<tr><td>${idx + 1}</td><td>${it.crop_name}</td><td>${it.variety || ''}</td><td>${it.order_quantity}</td><td>₹${it.price_per_kg}</td>${includeFeesInBill ? `<td>₹${gstAmt.toFixed(2)}</td><td>₹${commissionAmt.toFixed(2)}</td>` : ''}<td>₹${itemTotal.toFixed(2)}</td></tr>`; });
    html += `</tbody></table><h3 style="text-align:right;margin-top:10px;">${includeFeesInBill ? `GST Total: ₹${totals.gst.toFixed(2)}<br>Platform Fee: ₹${totals.commission.toFixed(2)}<br>` : ''}<span style="color:#236902;">Grand Total: ₹${grandTotal.toFixed(2)}</span></h3><div style="margin-top:8px;"><strong>Delivery / Logistics Charges (Payable After Delivery):</strong> ${deliveryRateDisplay} <button class="infoBtn" onclick="showDeliveryInfo()" aria-label="Delivery info">i</button><br/></div><div class="footer"><p><strong>Payment Method:</strong> ${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'}</p><p>Thank you for choosing Agri AI!<br>We connect farmers and buyers with trust.</p></div><button id="printBtn" onclick="window.print()">Print / Save as PDF</button><div id="deliveryModal" class="modal" style="display:none;"><div class="modal-content"><div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;"><div style="flex:1;"><h3 style="margin:0 0 8px 0;color:#236902;">Delivery & Logistics Charges</h3><div style="font-size:14px;color:#111;line-height:1.5;"><div style="overflow:auto;"><table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:14px;text-align:center;"><thead><tr><th style="border:1px solid #ddd;padding:8px;background:#f7f7f7;">Vehicle Type</th><th style="border:1px solid #ddd;padding:8px;background:#f7f7f7;">Typical Distance Range (km)</th><th style="border:1px solid #ddd;padding:8px;background:#f7f7f7;">Vehicle Capacity</th><th style="border:1px solid #ddd;padding:8px;background:#f7f7f7;">FIXED Cost per km (₹)</th></tr></thead><tbody><tr><td style="border:1px solid #ddd;padding:8px;">Bike Courier</td><td style="border:1px solid #ddd;padding:8px;">0 – 20 km</td><td style="border:1px solid #ddd;padding:8px;">Up to 40 kg</td><td style="border:1px solid #ddd;padding:8px;"><strong>₹12 / km</strong></td></tr><tr><td style="border:1px solid #ddd;padding:8px;">3-Wheeler Cargo (Auto / Ape)</td><td style="border:1px solid #ddd;padding:8px;">0 – 80 km</td><td style="border:1px solid #ddd;padding:8px;">0 – 400 kg</td><td style="border:1px solid #ddd;padding:8px;"><strong>₹18 / km</strong></td></tr><tr><td style="border:1px solid #ddd;padding:8px;">Mini Truck (Tata Ace / Pickup)</td><td style="border:1px solid #ddd;padding:8px;">0 – 100 km</td><td style="border:1px solid #ddd;padding:8px;">40 – 1500 kg</td><td style="border:1px solid #ddd;padding:8px;"><strong>₹22 / km</strong></td></tr></tbody></table></div></div></div><div style="flex:0 0 auto;margin-top:12px;"><button onclick="hideDeliveryInfo()" style="background:#236902;color:#fff;border:none;border-radius:6px;padding:8px 10px;cursor:pointer;">Close</button></div></div></div></div><script>function showDeliveryInfo(){document.getElementById('deliveryModal').style.display='flex';}function hideDeliveryInfo(){document.getElementById('deliveryModal').style.display='none';}<\/script></body></html>`;
    const newWindow = window.open('', '_blank'); newWindow.document.write(html); newWindow.document.close();
  };

  const sendContract = async () => {
    try {
      if (otpVerified && contractMetadata) { await uploadContractsToServer(); return; }
      resetOtpModal();
      const lang = localStorage.getItem('agri_lang') || 'en';
      const tLang = (key) => t(key, lang);
      const startDateObj = new Date();
      const startDate = startDateObj.toLocaleDateString('en-GB');
      const pickEndDate = () => new Promise(resolve => { const overlay = document.createElement('div'); overlay.style = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:10001;'; const box = document.createElement('div'); box.style = 'background:#fff;padding:18px;border-radius:6px;text-align:center;'; const label = document.createElement('p'); label.textContent = tLang('enterDeliveryDate'); label.style = 'margin:0 0 8px 0;font-size:16px;font-weight:bold;'; box.appendChild(label); const inp = document.createElement('input'); inp.type = 'date'; inp.style = 'font-size:16px;padding:6px;'; inp.placeholder = tLang('dateFormatHint') || 'dd-mm-yyyy'; box.appendChild(inp); const hint = document.createElement('p'); box.appendChild(hint); const btn = document.createElement('button'); btn.textContent = tLang('ok') || 'OK'; btn.style = 'margin-left:8px;padding:6px 12px;'; btn.onclick = () => { const val = inp.value; document.body.removeChild(overlay); resolve(val); }; const cancel = document.createElement('button'); cancel.textContent = tLang('cancel') || tLang('cancelButton') || 'Cancel'; cancel.style = 'margin-left:4px;padding:6px 12px;'; cancel.onclick = () => { document.body.removeChild(overlay); resolve(null); }; box.appendChild(btn); box.appendChild(cancel); overlay.appendChild(box); document.body.appendChild(overlay); });
      let endDate = ''; let days = 0;
      try { while (true) { const picked = await pickEndDate(); if (picked === null) return; if (picked) { const ed = new Date(picked); if (!isNaN(ed.getTime())) { endDate = ed.toLocaleDateString('en-GB'); days = Math.round((ed - startDateObj) / (24 * 3600 * 1000)); if (days < 0) days = 0; } break; } alert(tLang('deliveryDateRequired') || 'Please enter a delivery date'); } } catch (e) { console.warn('date picker error', e); }
      const totalContractQty = totalOrderedQty;
      const totalCropTradeValue = items.reduce((s, it) => s + ((Number(it.order_quantity || 0) || 0) * (Number(it.price_per_kg || 0) || 0)), 0);
      const avgPricePerKg = totalContractQty > 0 ? (totalCropTradeValue / totalContractQty) : 0;
      const langName = lang === 'en' ? 'English' : (lang === 'hi' ? 'हिंदी' : (lang === 'kn' ? 'ಕನ್ನಡ' : 'English'));
      let farmerName = ''; let farmerId = ''; let farmerState = ''; let farmerRegion = ''; let farmerAddress = ''; let farmerPhone = '';
      if (items && items.length > 0) { const first = items[0]; farmerId = first.user_id || first.farmer_id || first.seller_id || first._farmer_id || ''; farmerPhone = first.user_phone || first.seller_phone || ''; }
      if (farmerId || farmerPhone) { try { let qs = ''; if (farmerId) qs += `id=${encodeURIComponent(farmerId)}`; if (farmerPhone) { if (qs) qs += '&'; qs += `phone=${encodeURIComponent(farmerPhone)}`; } const resF = await fetch(`${apiBase}/farmer/get?${qs}`); if (resF && resF.ok) { const jf = await resF.json().catch(() => null); if (jf && jf.ok && jf.farmer) { farmerId = jf.farmer.id ? String(jf.farmer.id) : farmerId; if (jf.farmer.name) farmerName = jf.farmer.name; farmerState = jf.farmer.state || farmerState; farmerRegion = jf.farmer.region || farmerRegion; } } } catch (e) { console.warn('farmer/get failed', e); } }
      if (!farmerName && farmerId) farmerName = localStorage.getItem('agriai_name') || '';
      if (!farmerAddress && items && items.length > 0) { const first = items[0]; farmerAddress = first.seller_address || first.farmer_address || ''; }
      let buyerName = localStorage.getItem('agriai_name') || '[Buyer Name]'; let buyerId = localStorage.getItem('agriai_id') || ''; let buyerPhone = localStorage.getItem('agriai_phone') || ''; let buyerState = localStorage.getItem('agriai_state') || ''; let buyerRegion = localStorage.getItem('agriai_region') || ''; let buyerAddress = '';
      if (buyerId || buyerPhone) { try { let qs = ''; if (buyerId) qs += `id=${encodeURIComponent(buyerId)}`; if (buyerPhone) { if (qs) qs += '&'; qs += `phone=${encodeURIComponent(buyerPhone)}`; } const resB = await fetch(`${apiBase}/buyer/get?${qs}`); if (resB && resB.ok) { const jb = await resB.json().catch(() => null); if (jb && jb.ok && jb.buyer) { buyerId = jb.buyer.id ? String(jb.buyer.id) : buyerId; if (jb.buyer.name) buyerName = jb.buyer.name; buyerState = jb.buyer.state || buyerState; buyerRegion = jb.buyer.region || buyerRegion; buyerAddress = jb.buyer.address || buyerAddress; } } } catch (e) { console.warn('buyer/get failed', e); } }
      setCurrentBuyerName(buyerName);
      const round2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;
      let totalPlatformFee = 0; let totalGst = 0;
      items.forEach(it => { const { gstAmt, commissionAmt } = calculateGstAndCommission(it); totalPlatformFee += commissionAmt; totalGst += gstAmt; });
      totalPlatformFee = round2(totalPlatformFee); totalGst = round2(totalGst);
      const totalAmountInvoice = round2(totalCropTradeValue - totalPlatformFee - totalGst);
      const getGroupFromItem = (it) => { const fields = [it && it.category, it && it.cat, it && it._category, it && it.category_name, it && it.categoryName, it && it.tags, it && it.tag].filter(Boolean).join(' '); const catRaw = (fields || (it && it.crop_name) || '').toString().trim().toLowerCase(); const name = (it && it.crop_name || '').toString().toLowerCase(); const exact = (it && (it.category || it.cat) || '').toString().trim().toLowerCase(); if (exact === 'food crops' || exact === 'food crop' || exact === 'food' || exact === 'crops') return 'crop'; if (exact === 'fruits and vegetables' || exact === 'fruits & vegetables' || exact === 'fruits' || exact === 'fruits and veg') return 'fruitveg'; if (exact === 'masalas' || exact === 'masala' || exact === 'spices' || exact === 'spice') return 'masala'; const masalaKeywords = ['masala','masalas','spice','spices','मसाला','ಮಸಾಲೆ']; const fruitKeywords = ['fruit','fruits','फल','ಹಣ್ಣು']; const vegKeywords = ['vegetable','vegetables','veg','veggie','veget','सब्जी','ತರಕಾರಿ']; const hasAny = (str, arr) => arr.some(k => str.includes(k)); if (hasAny(catRaw, masalaKeywords) || hasAny(name, masalaKeywords)) return 'masala'; if (hasAny(catRaw, fruitKeywords) || hasAny(name, fruitKeywords) || hasAny(catRaw, vegKeywords) || hasAny(name, vegKeywords)) return 'fruitveg'; if (hasAny(catRaw, ['crop','crops','food'])) return 'crop'; return 'crop'; };
      let buyerPlatformFee = 0; let buyerGst = 0;
      items.forEach(it => { const qty = Number(it.order_quantity || 0) || 0; const price = Number(it.price_per_kg || 0) || 0; const lineTotal = round2(qty * price); const categoryTotals = items.reduce((acc, itm) => { try { const q = Number(itm.order_quantity || 0) || 0; const p = Number(itm.price_per_kg || 0) || 0; const line = round2(q * p); const g = getGroupFromItem(itm); acc[g] = (acc[g] || 0) + line; } catch (e) {} return acc; }, { crop:0, fruitveg:0, masala:0 }); const group = getGroupFromItem(it); const categoryTotal = round2(categoryTotals[group] || 0); let buyerCommissionRate = 0; if (group === 'crop') { if (categoryTotal < 200001) buyerCommissionRate = 2.0; else if (categoryTotal < 600001) buyerCommissionRate = 2.5; else if (categoryTotal < 1000001) buyerCommissionRate = 3.0; else buyerCommissionRate = 3.4; } else if (group === 'fruitveg') { if (categoryTotal < 200001) buyerCommissionRate = 2.5; else if (categoryTotal < 600001) buyerCommissionRate = 3.0; else if (categoryTotal < 1000001) buyerCommissionRate = 3.4; else buyerCommissionRate = 4.0; } else if (group === 'masala') { if (categoryTotal < 200001) buyerCommissionRate = 3.0; else if (categoryTotal < 600001) buyerCommissionRate = 3.4; else if (categoryTotal < 1000001) buyerCommissionRate = 4.0; else buyerCommissionRate = 4.4; } let buyerCommissionAmt = round2((lineTotal * (buyerCommissionRate / 100)) || 0); if (!Number.isFinite(buyerCommissionAmt) || buyerCommissionAmt < 0) buyerCommissionAmt = 0; if (buyerCommissionAmt > 100000) buyerCommissionAmt = 100000; const buyerGstAmt = round2((buyerCommissionAmt * 18) / 100); buyerPlatformFee += buyerCommissionAmt; buyerGst += buyerGstAmt; });
      buyerPlatformFee = round2(buyerPlatformFee); buyerGst = round2(buyerGst);
      const buyerTotalAmount = round2(totalCropTradeValue + buyerPlatformFee + buyerGst);
      const qtyKg = Math.round(totalContractQty || 0); const qtyRateMap = [{ min:0,max:40,rates:[12,18,22] },{ min:41,max:400,rates:[18,22,28] },{ min:401,max:1500,rates:[22,28,35] },{ min:1501,max:5000,rates:[28,35,45] },{ min:5001,max:10000,rates:[35,45,60] }]; let matching = qtyRateMap.find(r => qtyKg >= r.min && qtyKg <= r.max); if (!matching) matching = qtyRateMap[qtyRateMap.length - 1];
      const formatRates = (arr) => { const parts = (arr || []).map(v => `₹${v} / km`); if (parts.length === 0) return '₹-- / km'; if (parts.length === 1) return parts[0]; if (parts.length === 2) return `${parts[0]} or ${parts[1]}`; return `${parts.slice(0, -1).join(', ')} or ${parts[parts.length - 1]}`; };
      const deliveryRateDisplay = `${formatRates(matching.rates)}`;
      const logoSrc = window.location.origin + logo;
      const metadata = { contract_number: 'CNT' + Date.now(), farmer_id: farmerId, farmer_name: farmerName, farmer_address: farmerAddress, farmer_state: farmerState, buyer_id: buyerId, buyer_name: buyerName, buyer_address: buyerAddress, buyer_state: buyerState, contract_nature: contractNature, contract_duration: contractDuration, start_date: startDate, end_date: endDate, duration: days, farmer_platform_fee: totalPlatformFee, farmer_gst: totalGst, buyer_platform_fee: buyerPlatformFee, buyer_gst: buyerGst, delivery_cost: deliveryRateDisplay, crops: (items || []).map(it => ({ id: it.id, buyer_id: it.buyer_id, crop_name: it.crop_name, variety: it.variety || '', quantity: Number(it.order_quantity || 0), price_per_kg: Number(it.price_per_kg || 0), amount: Number(it.order_quantity || 0) * Number(it.price_per_kg || 0) })) };
      setContractMetadata(metadata);
      const rowsHtml = (items || []).map((it, idx) => { const qty = Number(it.order_quantity || 0) || 0; const variety = it.variety || it.Variety || ''; const price = Number(it.price_per_kg || 0) || 0; const amount = Math.round((qty * price + Number.EPSILON) * 100) / 100; return `<tr><td style="padding:8px;border:1px solid #ddd;text-align:center">${idx + 1}</td><td style="padding:8px;border:1px solid #ddd;text-align:center">${it.crop_name || ''}</td><td style="padding:8px;border:1px solid #ddd;text-align:center">${variety}</td><td style="padding:8px;border:1px solid #ddd;text-align:center">${qty.toLocaleString('en-IN')} kg</td><td style="padding:8px;border:1px solid #ddd;text-align:center">${formatCurrency(price)}</td><td style="padding:8px;border:1px solid #ddd;text-align:center">${formatCurrency(amount)}</td></tr>`; }).join('');

      // Contract HTML templates (hindi / kannada / english) — unchanged
      let html = '';
      if (lang === 'hi') {
        html = `<!doctype html><html><head><meta charset="utf-8"/><title>AgriAI Contract</title><meta name="viewport" content="width=device-width,initial-scale=1"/><style>body{font-family:'Times New Roman',Times,serif;color:#111;padding:24px;line-height:1.6;}h1{text-align:center;color:#236902;margin:0;}h2{margin-top:18px;}.section{margin-top:16px;}table{border-collapse:collapse;width:100%;margin-top:12px;}th,td{border:1px solid #ddd;padding:8px;}th{background:#f7f7f7;text-align:left;}pre{white-space:pre-wrap;font-family:'Times New Roman',Times,serif;}</style></head><body><div style="text-align:center;margin-bottom:20px;"><img src="${logoSrc}" alt="AgriAI" style="width:120px;height:auto;margin-bottom:8px"/><h1>एग्री एआई<br/>संविदा कृषि अनुबंध</h1></div><section class="section"><h2>पक्षकार</h2><p><strong>पक्ष A – खरीदार / कंपनी</strong></p><p><b>नाम:</b> ${buyerName}</p><p><b>खरीदार आईडी: </b> ${buyerId || '[Buyer ID]'}</p><p><b>पता:</b> ${buyerAddress || '[Buyer Address]'}${buyerState ? ', ' + buyerState : ''}</p><p><strong>पक्ष B – किसान / उत्पादक</strong></p><p><b>नाम: </b> ${farmerName}</p><p><b>किसान आईडी:</b> ${farmerId}</p><p><b>पता:</b> ${farmerAddress || ''}${farmerState ? (farmerAddress ? ', ' + farmerState : '' + farmerState) : ''}</p><p>पक्ष A और पक्ष B को सामूहिक रूप से "पक्षकार" कहा जाएगा। एग्री एआई केवल एक डिजिटल सुविधा मंच के रूप में कार्य करता है।</p></section><section class="section"><h2>4. वस्तु विवरण</h2><table style="border-collapse:collapse;width:100%;margin-top:12px;"><thead><tr><th style="padding:8px;border:1px solid #ddd;text-align:center">क्रम सं.</th><th style="padding:8px;border:1px solid #ddd;text-align:center">फसल का नाम</th><th style="padding:8px;border:1px solid #ddd;text-align:center">किस्म</th><th style="padding:8px;border:1px solid #ddd;text-align:center">मात्रा</th><th style="padding:8px;border:1px solid #ddd;text-align:center">मूल्य (₹/किग्रा)</th><th style="padding:8px;border:1px solid #ddd;text-align:center">कुल राशि</th></tr></thead><tbody>${rowsHtml}</tbody></table></section><section class="section"><h2>5. मूल्य एवं भुगतान शर्तें</h2><p><strong>5.1 किसान</strong></p><p>कुल मात्रा: ${totalContractQty.toLocaleString('en-IN')} किग्रा</p><p>प्लेटफ़ॉर्म शुल्क: ${formatCurrency(totalPlatformFee)}</p><p>जीएसटी: ${formatCurrency(totalGst)}</p><p><strong>कुल देय राशि: ${formatCurrency(totalAmountInvoice)}</strong></p><p><strong>5.2 खरीदार</strong></p><p>प्लेटफ़ॉर्म शुल्क: ${formatCurrency(buyerPlatformFee)}</p><p>जीएसटी: ${formatCurrency(buyerGst)}</p><p><strong>कुल देय राशि: ${formatCurrency(buyerTotalAmount)}</strong></p></section><section class="section"><h2>13. निष्पादन एवं डिजिटल स्वीकृति</h2><p>खरीदार / अधिकृत प्रतिनिधि</p><p>हस्ताक्षर: ___________________________</p><p>तिथि: ___________________________</p><p>किसान / उत्पादक</p><p>हस्ताक्षर: ___________________________</p><p>तिथि: ___________________________</p><p>गवाह : <strong>एग्री एआई</strong></p></section></body></html>`;
      } else if (lang === 'kn') {
        html = `<!doctype html><html><head><meta charset="utf-8"/><title>AgriAI Contract</title><meta name="viewport" content="width=device-width,initial-scale=1"/><style>body{font-family:'Times New Roman',Times,serif;color:#111;padding:24px;line-height:1.6;}h1{text-align:center;color:#236902;margin:0;}h2{margin-top:18px;}.section{margin-top:16px;}table{border-collapse:collapse;width:100%;margin-top:12px;}th,td{border:1px solid #ddd;padding:8px;}th{background:#f7f7f7;text-align:left;}</style></head><body><div style="text-align:center;margin-bottom:20px;"><img src="${logoSrc}" alt="AgriAI" style="width:120px;height:auto;margin-bottom:8px"/><h1>ಅಗ್ರಿ AI<br/>ಒಪ್ಪಂದ ಕೃಷಿ ಒಪ್ಪಂದ</h1></div><section class="section"><h2>ಪಕ್ಷಗಳು</h2><p><strong>ಪಕ್ಷ A – ಖರೀದಿದಾರ</strong></p><p><b>ಹೆಸರು:</b> ${buyerName}</p><p><b>ಖರೀದಿದಾರ ಐಡಿ:</b> ${buyerId || '[Buyer ID]'}</p><p><strong>ಪಕ್ಷ B – ರೈತ</strong></p><p><b>ಹೆಸರು:</b> ${farmerName}</p><p><b>ರೈತ ಐಡಿ:</b> ${farmerId}</p></section><section class="section"><h2>4. ವಸ್ತು ವಿವರಗಳು</h2><table style="border-collapse:collapse;width:100%;margin-top:12px;"><thead><tr><th style="padding:8px;border:1px solid #ddd;text-align:center">ಕ್ರಮ ಸಂಖ್ಯೆ</th><th style="padding:8px;border:1px solid #ddd;text-align:center">ಬೆಳೆ ಹೆಸರು</th><th style="padding:8px;border:1px solid #ddd;text-align:center">ವೈವಿಧ್ಯ</th><th style="padding:8px;border:1px solid #ddd;text-align:center">ಪ್ರಮಾಣ</th><th style="padding:8px;border:1px solid #ddd;text-align:center">ಬೆಲೆ (₹/ಕೆಜಿ)</th><th style="padding:8px;border:1px solid #ddd;text-align:center">ಮೊತ್ತ</th></tr></thead><tbody>${rowsHtml}</tbody></table></section><section class="section"><h2>13. ಜಾರಿಗೆ ತರುವುದು</h2><p>ಖರೀದಿದಾರ / ಅಧಿಕೃತ ಪ್ರತಿನಿಧಿ</p><p>ಸಹಿ: ___________________________</p><p>ದಿನಾಂಕ: ___________________________</p><p>ರೈತ / ಉತ್ಪಾದಕ</p><p>ಸಹಿ: ___________________________</p><p>ದಿನಾಂಕ: ___________________________</p><p>ಸಾಕ್ಷಿ : <strong>AgriAI</strong></p></section></body></html>`;
      } else {
        html = `<!doctype html><html><head><meta charset="utf-8"/><title>AgriAI Contract</title><meta name="viewport" content="width=device-width,initial-scale=1"/><style>body{font-family:'Times New Roman',Times,serif;color:#111;padding:24px;line-height:1.6;}h1{text-align:center;color:#236902;margin:0;}h2{margin-top:18px;}.section{margin-top:16px;}table{border-collapse:collapse;width:100%;margin-top:12px;}th,td{border:1px solid #ddd;padding:8px;}th{background:#f7f7f7;text-align:left;}</style></head><body><div style="text-align:center;margin-bottom:20px;"><img src="${logoSrc}" alt="AgriAI" style="width:120px;height:auto;margin-bottom:8px"/><h1>Agri AI<br/>CONTRACT FARMING AGREEMENT</h1></div><section class="section"><h2>PARTIES</h2><p><strong>Party A – Buyer / Company</strong></p><p><b>Name:</b> ${buyerName}</p><p><b>Buyer ID:</b> ${buyerId || '[Buyer ID]'}</p><p><b>Address:</b> ${buyerAddress || buyerState || '[Buyer Address/State]'}${(buyerAddress && buyerState) ? ', ' + buyerState : ''}</p><p><strong>Party B – Farmer / Producer</strong></p><p><b>Name:</b> ${farmerName}</p><p><b>Farmer ID:</b> ${farmerId}</p><p><b>Address:</b> ${farmerAddress || '[Farmer Address]'}${farmerState ? ', ' + farmerState : ''}</p><p>Party A and Party B are collectively referred to as "the Parties." AgriAI acts solely as a digital facilitation platform.</p></section><section class="section"><h2>2. CONTRACT TYPE & DURATION</h2><p>Contract Nature: ${contractNature === 'pre-harvest' ? 'Pre-Harvest Production Contract' : 'Post-Harvest Procurement Contract'}</p><p>Contract Duration: ${contractDuration === 'one-time' ? 'One-Time' : (contractDuration === 'seasonal' ? 'Seasonal' : 'Yearly')}</p><p>Start Date: ${startDate}</p><p>End Date: ${endDate}</p><p>Duration: ${days} Days</p></section><section class="section"><h2>4. COMMODITY DETAILS</h2><table style="border-collapse:collapse;width:100%;margin-top:12px;"><thead><tr><th style="padding:8px;border:1px solid #ddd;text-align:center">Sl. No</th><th style="padding:8px;border:1px solid #ddd;text-align:center">Crop Name</th><th style="padding:8px;border:1px solid #ddd;text-align:center">Variety</th><th style="padding:8px;border:1px solid #ddd;text-align:center">Quantity</th><th style="padding:8px;border:1px solid #ddd;text-align:center">Price (₹/kg)</th><th style="padding:8px;border:1px solid #ddd;text-align:center">Amount</th></tr></thead><tbody>${rowsHtml}</tbody></table></section><section class="section"><h2>5. PRICE & PAYMENT TERMS</h2><p><strong>5.1 Farmer</strong></p><p>Total Quantity: ${totalContractQty.toLocaleString('en-IN')} kg</p><p>Price: ${formatCurrency(avgPricePerKg)} per kg</p><p>Platform Fee: ${formatCurrency(totalPlatformFee)}</p><p>GST on Platform Fee: ${formatCurrency(totalGst)}</p><p><strong>Total Amount (After Deduction): ${formatCurrency(totalAmountInvoice)}</strong></p><p><strong>5.2 Buyer</strong></p><p>Total Quantity: ${totalContractQty.toLocaleString('en-IN')} kg</p><p>Price: ${formatCurrency(avgPricePerKg)} per kg</p><p>Platform Fee: ${formatCurrency(buyerPlatformFee)}</p><p>GST on Platform Fee: ${formatCurrency(buyerGst)}</p><p><strong>Total Amount (After Addition): ${formatCurrency(buyerTotalAmount)}</strong></p><p><strong>5.3 Payment Schedule</strong></p><p>25% advance at contract confirmation. 50% upon successful delivery. Remaining 25% within 7 working days after quality inspection.</p><p><strong>5.4 Mode of Payment:</strong> Bank Transfer / UPI / Cheque</p></section><section class="section"><h2>13. EXECUTION & DIGITAL ACCEPTANCE</h2><p>Buyer / Authorized Representative</p><p>Signature: ___________________________</p><p>Date: ___________________________</p><p>Farmer / Producer</p><p>Signature: ___________________________</p><p>Date: ___________________________</p><p>Witness: <strong>AgriAI</strong></p></section></body></html>`;
      }

      setContractHtml(html);
      setShowContractPreview(true);
    } catch (e) { console.error('sendContract failed', e); alert('Failed to prepare contract. See console.'); }
  };

  const downloadContract = () => { try { const blob = new Blob([contractHtml], { type: 'text/html' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'contract.html'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); } catch (e) { console.warn(e); } };
  const printContract = () => { try { const w = window.open('', '_blank'); w.document.write(contractHtml); w.document.close(); w.focus(); w.print(); } catch (e) { console.warn(e); } };

  const handleBuyNow = () => {
    setPaymentError('');
    const invalid = items.some(it => !it.order_quantity || Number(it.order_quantity) <= 0);
    if (invalid) { alert(t('editEnterOrderQty', lang)); return; }
    try {
      const invoiceId = 'ORD' + Date.now(); const createdAt = new Date().toISOString();
      const orderItems = items.map(it => { const { gstAmt, commissionAmt, lineTotal } = calculateGstAndCommission(it); return { id: it.id, crop_name: it.crop_name, variety: it.variety || it.Variety || '', farmer_id: it.user_id || it.seller_id || it._farmer_id || null, category: it.category || it.cat || '', price_per_kg: Number(it.price_per_kg || 0), order_quantity: Number(it.order_quantity || 0), image_url: it.image_url || '', subtotal: lineTotal, gst: gstAmt, platform_fee: commissionAmt, total: lineTotal + gstAmt + commissionAmt }; });
      const summary = orderItems.reduce((acc, it) => { acc.subtotal += it.subtotal; acc.gst += it.gst; acc.platform_fee += it.platform_fee; return acc; }, { subtotal: 0, gst: 0, platform_fee: 0 }); const grand_total = summary.subtotal + summary.gst + summary.platform_fee;
      const buyer = { id: localStorage.getItem('agriai_id') || null, name: localStorage.getItem('agriai_name') || '', phone: localStorage.getItem('agriai_phone') || '', email: localStorage.getItem('agriai_email') || '' };
      const orderRecord = { invoice_id: invoiceId, created_at: createdAt, payment_method: paymentMethod, contract_nature: contractNature, contract_duration: contractDuration, buyer_id: buyer.id || null, buyer, items: orderItems, totals: { ...summary, grand_total } };
      const rawHist = localStorage.getItem('agriai_history'); const hist = rawHist ? JSON.parse(rawHist) : []; const nextHist = [orderRecord, ...(Array.isArray(hist) ? hist : [])]; localStorage.setItem('agriai_history', JSON.stringify(nextHist));
      try { const updates = orderItems.filter(it => it && typeof it.id !== 'undefined').map(async (it) => { const remaining = Math.max(0, Number((items.find(x => x.id === it.id) || {}).quantity_kg || 0) - Number(it.order_quantity || 0)); try { await fetch(`${apiBase}/my-crops/${it.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quantity_kg: remaining }) }); } catch (e) {} }); Promise.allSettled(updates).catch(() => {}); } catch (e) {}
      try { const siteLang = localStorage.getItem('agri_lang') || 'en'; fetch(`${apiBase}/notifications/purchase`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Agri-Lang': siteLang }, body: JSON.stringify({ invoice_id: invoiceId, lang: siteLang, buyer, items: orderItems.map(({ id, crop_name, order_quantity, variety, farmer_id }) => ({ id, crop_name, order_quantity, variety, farmer_id })) }) }).catch(() => {}); try { const localKey = 'agriai_notifications'; const rawLocal = localStorage.getItem(localKey); const localArr = rawLocal ? JSON.parse(rawLocal) : []; const byFarmer = {}; orderItems.forEach(it => { const fid = it.farmer_id || 'unknown'; if (!byFarmer[fid]) byFarmer[fid] = []; byFarmer[fid].push(it); }); Object.keys(byFarmer).forEach((fid, idx) => { const group = byFarmer[fid]; const qty = group.reduce((s, x) => s + (Number(x.order_quantity||0)||0), 0); const subtotal = group.reduce((s, x) => s + (Number(x.subtotal||0)||0), 0); const notif = { id: `N${Date.now()}${idx}`, invoice_id: invoiceId, created_at: createdAt, farmer_id: fid === 'unknown' ? null : fid, buyer_name: buyer.name || '', buyer_id: buyer.id || null, items: group, quantity_kg: qty, _subtotal: subtotal, crop_name: group[0] ? group[0].crop_name : 'Order' }; localArr.unshift(notif); }); try { localStorage.setItem(localKey, JSON.stringify(localArr)); } catch (e) {} try { window.dispatchEvent(new Event('agriai:notifications:local:update')); } catch (e) {} } catch (e) {} } catch (e) {}
      localStorage.setItem('agriai_cart_buyer', JSON.stringify([])); setItems([]); try { clearCart(); } catch (e) {}
      generateBill();
      try { const buyerId = localStorage.getItem('agriai_id') || null; const ordersPayload = orderItems.map(it => ({ invoice_id: invoiceId, crop_id: it.id, farmer_id: it.farmer_id || it.seller_id || it._farmer_id || null, buyer_id: buyerId, crop_name: it.crop_name, quantity_kg: Number(it.order_quantity || 0), price_per_kg: Number(it.price_per_kg || 0), total: Number(it.total || 0), payment_method: paymentMethod, contract_nature: contractNature, contract_duration: contractDuration })); fetch(`${apiBase}/buyer-orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orders: ordersPayload }) }).catch(() => {}); } catch (e) {}
      setTimeout(() => { window.location.href = '/history'; }, 100);
    } catch (e) { console.error('Failed to complete purchase:', e); alert(t('purchaseFailed', lang)); }
  };

  return (
    <>
      <style>{styles}</style>

      <div className="cart-root">
        {/* Orbs */}
        <div className="cart-orb cart-orb-1" />
        <div className="cart-orb cart-orb-2" />
        <div className="cart-orb cart-orb-3" />
        {/* Leaves */}
        <div className="cart-leaf cart-leaf-1" />
        <div className="cart-leaf cart-leaf-2" />
        <div className="cart-leaf cart-leaf-3" />
        <div className="cart-leaf cart-leaf-4" />
        <div className="cart-leaf cart-leaf-5" />

        <Navbar />

        <main className="cart-main">
          <div className="cart-glass">

            {/* Header */}
            <div className="cart-header-row">
              <h1 className="cart-title">{t('cartTitle', lang)}</h1>
              {items.length > 0 && (
                <div className="cart-header-btns">
                  <button className="cart-btn-secondary" onClick={() => window.location.href = '/dashboard/farmer'}>{t('continueShopping', lang)}</button>
                  <button className="cart-btn-danger" onClick={clearCart}>{t('clearCart', lang)}</button>
                </div>
              )}
            </div>

            {items.length === 0 ? (
              <div className="cart-empty">
                <span className="cart-empty-icon">🧺</span>
                <div className="cart-empty-text">{t('cartEmptyMessage', lang)}</div>
              </div>
            ) : (
              <div className="cart-layout">

                {/* Items column */}
                <div className="cart-items-col">
                  {items.map(it => {
                    const { gstRate, commissionRate, gstAmt, commissionAmt, lineTotal } = calculateGstAndCommission(it);
                    return (
                      <div key={it.id} className="cart-item-card">
                        <div className="cart-item-img-wrap">
                          {it.image_url
                            ? <img className="cart-item-img" src={it.image_url} alt={it.crop_name} />
                            : <div className="cart-item-no-img">📷<br />{t('noImage', lang)}</div>
                          }
                        </div>

                        <div className="cart-item-info">
                          <div className="cart-item-name-row">
                            <span className="cart-item-name">{it.crop_name}</span>
                            {it.variety && <span className="cart-variety-badge">{it.variety}</span>}
                            {(it.category || it.cat) && <span className="cart-cat-badge">{it.category || it.cat}</span>}
                          </div>
                          <div className="cart-item-price">{formatCurrency(it.price_per_kg)} / {t('kg', lang)}</div>
                          <div className="cart-item-fees">
                            {userRole !== 'buyer' && (
                              <>
                                <span className="cart-item-fee-text">{t('tableGst', lang)}: {gstRate}% ({formatCurrency(gstAmt)})</span>
                                <span className="cart-item-fee-text">{t('tablePlatformFee', lang)}: {formatCurrency(commissionAmt)}</span>
                              </>
                            )}
                            <span className="cart-item-total">{t('itemTotalLabel', lang)} {formatCurrency(lineTotal + gstAmt + commissionAmt)}</span>
                          </div>
                        </div>

                        <div className="cart-item-controls">
                          <div className="cart-avail-label">{t('availableLabel', lang)} {Number(it.quantity_kg || 0).toLocaleString('en-IN')} {t('kg', lang)}</div>
                          <div className="cart-qty-row">
                            <button className="cart-qty-btn" onClick={() => updateQuantity(it.id, -1)}>−</button>
                            <div className="cart-qty-val">{Number(it.order_quantity || 0).toLocaleString('en-IN')} {t('kg', lang)}</div>
                            <button className="cart-qty-btn" onClick={() => updateQuantity(it.id, 1)}>+</button>
                          </div>
                          <div className="cart-action-row">
                            {editingId === it.id ? (
                              <>
                                <input type="number" step="0.001" value={editVal} onChange={e => setEditVal(e.target.value)} className="cart-edit-input" />
                                <button className="cart-btn-save" onClick={() => saveEdit(it.id)}>{t('saveButton', lang)}</button>
                                <button className="cart-btn-cancel" onClick={cancelEdit}>{t('cancelButton', lang)}</button>
                              </>
                            ) : (
                              <>
                                <button className="cart-btn-edit" onClick={() => startEdit(it)}>{t('editButton', lang)}</button>
                                <button className="cart-btn-remove" onClick={() => removeItem(it.id)}>{t('deleteButton', lang)}</button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary sidebar */}
                <div className="cart-summary-col">
                  <div className="cart-summary-box">
                    <div className="cart-summary-title">{t('orderSummary', lang)}</div>
                    <div className="cart-summary-rows">
                      <div className="cart-summary-row">{t('totalItemsLabel', lang)} {items.length}</div>
                      <div className="cart-summary-row">{t('totalAvailableLabel', lang)} {Number(totalAvailableQty).toLocaleString('en-IN')} {t('kg', lang)}</div>
                      <div className="cart-summary-row">{t('totalOrderedLabel', lang)} {Number(totalOrderedQty).toLocaleString('en-IN')} {t('kg', lang)}</div>
                      <div className="cart-summary-row">{t('platformFeeLabel', lang)} {formatCurrency(totals.commission)}</div>
                      <div className="cart-summary-row">{t('gstTotalLabel', lang)} {formatCurrency(totals.gst)}</div>
                      <div className="cart-summary-total">{t('grandTotalLabel', lang)} {formatCurrency(grandTotal)}</div>
                    </div>

                    <div className="cart-section-divider" />

                    {/* Contract Nature */}
                    <div className="cart-options-title">{t('contractNatureLabel', lang)}</div>
                    <div className="cart-radio-group">
                      <label className="cart-radio-label">
                        <input type="radio" name="contractNature" value="pre-harvest" checked={contractNature === 'pre-harvest'} onChange={() => setContractNature('pre-harvest')} />
                        {t('preHarvestContract', lang)}
                      </label>
                      <label className="cart-radio-label">
                        <input type="radio" name="contractNature" value="post-harvest" checked={contractNature === 'post-harvest'} onChange={() => setContractNature('post-harvest')} />
                        {t('postHarvestContract', lang)}
                      </label>
                    </div>

                    {/* Contract Duration */}
                    <div className="cart-options-title">{t('contractDurationLabel', lang)}</div>
                    <div className="cart-radio-group">
                      <label className="cart-radio-label">
                        <input type="radio" name="contractDuration" value="one-time" checked={contractDuration === 'one-time'} onChange={() => setContractDuration('one-time')} />
                        {t('contractOneTime', lang)}
                      </label>
                      <label className="cart-radio-label">
                        <input type="radio" name="contractDuration" value="seasonal" checked={contractDuration === 'seasonal'} onChange={() => setContractDuration('seasonal')} />
                        {t('contractSeasonal', lang)}
                      </label>
                      <label className="cart-radio-label">
                        <input type="radio" name="contractDuration" value="yearly" checked={contractDuration === 'yearly'} onChange={() => setContractDuration('yearly')} />
                        {t('contractYearly', lang)}
                      </label>
                    </div>

                    {userRole === 'buyer' && totalOrderedQty > 40 ? (
                      <button className="cart-submit-btn" onClick={sendContract} disabled={!items.length}>
                        {t('sendContract', lang)}
                      </button>
                    ) : (
                      <button className="cart-submit-btn" onClick={handleBuyNow} disabled={!items.length}>
                        {t('buyNow', lang)}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        </main>
      </div>

      {/* Contract Preview Modal */}
      {showContractPreview && (
        <div className="cart-modal-overlay">
          <div className="cart-contract-modal">
            <div className="cart-contract-header">
              <span className="cart-contract-header-title">{t('contractPreview', lang)}</span>
              <div className="cart-contract-header-actions">
                <button className="cart-modal-btn" onClick={downloadContract}>{t('download', lang) || 'Download'}</button>
                <button className="cart-modal-btn" onClick={printContract}>{t('print', lang) || 'Print'}</button>
                <button className="cart-modal-btn" onClick={() => { setShowContractPreview(false); setContractMetadata(null); setOtpVerified(false); setDigitalSignature(''); }}>{t('close', lang) || 'Close'}</button>
              </div>
            </div>
            <div className="cart-contract-body" dangerouslySetInnerHTML={{ __html: contractHtml }} />
            <div className="cart-contract-send-row">
              <button
                className="cart-submit-btn"
                style={{ width: 'auto', padding: '10px 24px' }}
                disabled={uploadingContracts}
                onClick={async () => {
                  if (otpVerified) { await sendContract(); }
                  else { setPendingContractAction(() => sendContract); openOtpForContract(); }
                }}
              >
                {t('sendContract', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="cart-modal-overlay">
          <div className="cart-otp-modal">
            <h2 className="cart-otp-title">
              {otpVerified ? t('signatureVerified', lang) : t('verifyIdentity', lang)}
            </h2>
            <p className="cart-otp-desc">
              {otpVerified ? t('verifyIdentitySigned', lang) : t('verifyIdentityDesc', lang)}
            </p>

            {otpVerified ? (
              <div className="cart-sig-box">
                <div style={{ marginBottom: 8 }}><strong>{t('signatureDetails', lang)}</strong></div>
                <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#333' }}>
                  <div>📧 {t('signatureEmailLabel', lang)}: {otpEmail}</div>
                  <div>🕐 {t('signatureTimeLabel', lang)}: {digitalSignature.signature_timestamp}</div>
                  <div>✔ {t('signatureMethodLabel', lang)}: {digitalSignature.signature_method}</div>
                  <div style={{ marginTop: 8, wordBreak: 'break-all' }}>{t('signatureHashLabel', lang)}: {digitalSignature.signature_hash ? digitalSignature.signature_hash.substring(0,40) + '...' : ''}</div>
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 14 }}>
                  <label className="cart-otp-label">{t('signatureEmailLabel', lang)}</label>
                  <input type="email" value={otpEmail} disabled className="cart-otp-input" />
                </div>
                {!otpSent ? (
                  <button className="cart-submit-btn" style={{ marginTop: 0 }} onClick={handleOtpSend} disabled={otpLoading}>
                    {otpLoading ? (t('sendingOtp', lang) || 'Sending...') : t('sendOtpButton', lang)}
                  </button>
                ) : (
                  <>
                    <div style={{ marginBottom: 14 }}>
                      <label className="cart-otp-label">Enter OTP</label>
                      <input type="text" placeholder={t('otpPlaceholder', lang)} value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} className="cart-otp-code-input" />
                      <div className="cart-otp-hint">{t('checkEmailMsg', lang)}</div>
                    </div>
                    <button className="cart-submit-btn" style={{ marginTop: 0 }} onClick={handleOtpVerifyAndSign} disabled={otpLoading || otpCode.length < 6}>
                      {otpLoading ? (t('verifying', lang) || 'Verifying...') : t('verifyAndSign', lang)}
                    </button>
                  </>
                )}
              </>
            )}

            {otpError && <div className="cart-otp-error">⚠ {otpError}</div>}

            <div className="cart-otp-btn-row">
              {otpVerified && pendingContractAction && (
                <button className="cart-submit-btn" style={{ flex: 1, marginTop: 0 }} onClick={() => { pendingContractAction(); setPendingContractAction(null); }}>
                  {t('proceedToSend', lang)}
                </button>
              )}
              <button className="cart-btn-cancel" style={{ flex: 1, padding: '10px 14px', fontSize: '0.9rem' }} onClick={resetOtpModal} disabled={otpLoading}>
                {t('close', lang) || 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Cart;