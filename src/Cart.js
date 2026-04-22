import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import logo from './assets/logo192.png';
import { t } from './i18n';
import { Leaf } from 'lucide-react';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  * { box-sizing: border-box; }

  .fc-root {
    min-height: 100vh;
    font-family: 'Times New Roman', serif;
    background: rgba(83, 255, 3, 0.12);
    background-attachment: fixed;
    position: relative;
    overflow: visible;
    color: #000;
  }

  .fc-root .navbar {
    background: oklch(0.12 0.03 160 / 0.5) !important;
    backdrop-filter: blur(12px) !important;
    -webkit-backdrop-filter: blur(12px) !important;
  }
  .fc-root .navbar select {
    background: oklch(0.12 0.03 160 / 0.6) !important;
    border: 1px solid oklch(0.65 0.22 145 / 0.3) !important;
    color: rgba(255,255,255,0.9) !important;
  }
  .fc-root .navbar select option {
    background: #1a1a1a;
    color: #ffffff;
  }

  .cart-main {
    position: relative;
    z-index: 1;
    padding: 6rem 1rem 2rem;
    max-width: 1100px;
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
    gap: 18px;
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .cart-items-col {
    flex: 1 1 620px;
    min-width: 320px;
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }

  /* Item card */
  .cart-item-card {
    display: flex;
    gap: 12px;
    align-items: center;
    background: #fff;
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.06);
    transition: transform 0.35s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.35s;
  }
  .cart-item-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(0,0,0,0.08);
  }
  .cart-item-img-wrap {
    width: 120px; height: 100px;
    border-radius: 6px;
    overflow: hidden;
    background: #f4f4f4;
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
    background: rgba(255,255,255,0.92);
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 12px;
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
    border: 1px solid #eee;
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
  const [showDeliveryDateModal, setShowDeliveryDateModal] = React.useState(false);
  const [selectedDeliveryDate, setSelectedDeliveryDate] = React.useState('');
  const [agreeToContract, setAgreeToContract] = React.useState(false);

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
      setDigitalSignature(result);
      setOtpVerified(true);
      setShowOtpModal(false);
      await generateContractAndShowPreview(true);
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
        try { await proceedWithContract(); } catch (e) { console.warn('Proceed with contract failed:', e); }
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
                console.log('📦 Raw cart data from backend:', j.cart);
                const mapped = j.cart.map(r => ({ id: r.crop_id || r.id, cart_id: r.id, crop_name: r.crop_name || '', quantity_kg: Number(r.total_quantity != null ? r.total_quantity : r.quantity_kg || 0), price_per_kg: r.price_per_kg != null ? Number(r.price_per_kg) : 0, image_url: r.image_path || r.image_url || '', order_quantity: Number(r.quantity_kg || 0), variety: r.variety || '', user_type: r.user_type || userRole, user_id: r.user_id || null, user_phone: r.user_phone || null }));
                console.log('🖼️ Mapped cart items with images:', mapped.map(m => ({ crop_name: m.crop_name, image_url: m.image_url })));
                setItems(mapped); try { localStorage.setItem(cartKey, JSON.stringify(mapped)); } catch (e) {} return;
              }
            }
          } catch (e) { console.warn('Failed to load server cart, falling back to localStorage', e); }
        }
        try {
          const raw = localStorage.getItem(cartKey); const arr = raw ? JSON.parse(raw) : [];
          const normalized = (Array.isArray(arr) ? arr : []).map(it => { try { const avail = Number(it.quantity_kg || 0) || 0; const order = (it.order_quantity !== undefined && it.order_quantity !== null) ? Number(it.order_quantity) : 0; return { ...it, quantity_kg: avail, order_quantity: order }; } catch (e) { return it; } });
          console.log('💾 Loaded cart from localStorage:', normalized);
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
    // Fixed buyer platform fee: 5% across all categories
    const commissionRate = 5.0;
    const gstRate = 0;
    const itemGstAmt = (total * gstRate) / 100; const commissionAmt = (total * commissionRate) / 100; const gstOnPlatformFee = commissionAmt * 0.18; const gstAmt = itemGstAmt + gstOnPlatformFee;
    return { gstRate, commissionRate, gstAmt, commissionAmt, gstOnPlatformFee, lineTotal: total };
  };

  const getGroupFromItem = (it) => {
    const fields = [it && it.category, it && it.cat, it && it._category, it && it.category_name, it && it.categoryName, it && it.tags, it && it.tag].filter(Boolean).join(' ');
    const catRaw = (fields || (it && it.crop_name) || '').toString().trim().toLowerCase();
    const name = (it && it.crop_name || '').toString().toLowerCase();
    const exact = (it && (it.category || it.cat) || '').toString().trim().toLowerCase();
    if (exact === 'food crops' || exact === 'food crop' || exact === 'food' || exact === 'crops') return 'crop';
    if (exact === 'fruits and vegetables' || exact === 'fruits & vegetables' || exact === 'fruits' || exact === 'fruits and veg') return 'fruitveg';
    if (exact === 'masalas' || exact === 'masala' || exact === 'spices' || exact === 'spice') return 'masala';
    const masalaKeywords = ['masala','masalas','spice','spices','मसाला','ಮಸಾಲೆ'];
    const fruitKeywords = ['fruit','fruits','फल','ಹಣ್ಣು'];
    const vegKeywords = ['vegetable','vegetables','veg','veggie','veget','सब्जी','ತರಕಾರಿ'];
    const hasAny = (str, arr) => arr.some(k => str.includes(k));
    if (hasAny(catRaw, masalaKeywords) || hasAny(name, masalaKeywords)) return 'masala';
    if (hasAny(catRaw, fruitKeywords) || hasAny(name, fruitKeywords) || hasAny(catRaw, vegKeywords) || hasAny(name, vegKeywords)) return 'fruitveg';
    if (hasAny(catRaw, ['crop','crops','food'])) return 'crop';
    return 'crop';
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
      const signed = otpVerified;
      const signatureName = signed ? (currentBuyerName || buyerName) : '________________';
      const signatureDate = signed ? new Date().toLocaleDateString('en-GB') : '________________';
      const round2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;
      let totalPlatformFee = 0; let totalGst = 0;
      items.forEach(it => { const { gstAmt, commissionAmt } = calculateGstAndCommission(it); totalPlatformFee += commissionAmt; totalGst += gstAmt; });
      totalPlatformFee = round2(totalPlatformFee); totalGst = round2(totalGst);
      const totalAmountInvoice = round2(totalCropTradeValue - totalPlatformFee - totalGst);
      const buyerPlatformFee = totals.commission;
      const buyerGst = totals.gst;
      const buyerTotalAmount = grandTotal;
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
        html = `<!doctype html><html><head><meta charset="utf-8"/><title>AgriAI Contract</title><meta name="viewport" content="width=device-width,initial-scale=1"/><style>body{font-family:'Times New Roman',Times,serif;color:#111;padding:24px;line-height:1.6;}h1{text-align:center;color:#236902;margin:0;}h2{margin-top:18px;}.section{margin-top:16px;}table{border-collapse:collapse;width:100%;margin-top:12px;}th,td{border:1px solid #ddd;padding:8px;}th{background:#f7f7f7;text-align:left;}pre{white-space:pre-wrap;font-family:'Times New Roman',Times,serif;}</style></head><body><div style="text-align:center;margin-bottom:20px;"><img src="${logoSrc}" alt="AgriAI" style="width:120px;height:auto;margin-bottom:8px"/><h1>एग्री एआई<br/>संविदा कृषि अनुबंध</h1></div><section class="section"><h2>पक्षकार</h2><p><strong>पक्ष A – खरीदार / कंपनी</strong></p><p><b>नाम:</b> ${buyerName}</p><p><b>खरीदार आईडी: </b> ${buyerId || '[Buyer ID]'}</p><p><b>पता:</b> ${buyerAddress || '[Buyer Address]'}${buyerState ? ', ' + buyerState : ''}</p><p><strong>पक्ष B – किसान / उत्पादक</strong></p><p><b>नाम: </b> ${farmerName}</p><p><b>किसान आईडी:</b> ${farmerId}</p><p><b>पता:</b> ${farmerAddress || ''}${farmerState ? (farmerAddress ? ', ' + farmerState : '' + farmerState) : ''}</p><p>पक्ष A और पक्ष B को सामूहिक रूप से "पक्षकार" कहा जाएगा। एग्री एआई केवल एक डिजिटल सुविधा मंच के रूप में कार्य करता है।</p></section><section class="section"><h2>2. अनुबंध प्रकार और अवधि</h2><p><strong>अनुबंध प्रकृति:</strong> ${contractNature === 'pre-harvest' ? 'फसल उत्पादन अनुबंध' : 'कटाई के बाद की खरीद अनुबंध'}</p><p><strong>अनुबंध अवधि:</strong> ${contractDuration === 'one-time' ? 'एक बार' : (contractDuration === 'seasonal' ? 'मौसमी' : 'वार्षिक')}</p><p><strong>प्रारंभ तिथि:</strong> ${startDate}</p><p><strong>समाप्ति तिथि:</strong> ${endDate}</p><p><strong>अवधि:</strong> ${days} दिन</p></section><section class="section"><h2>4. वस्तु विवरण</h2><table style="border-collapse:collapse;width:100%;margin-top:12px;"><thead><tr><th style="padding:8px;border:1px solid #ddd;text-align:center">क्रम सं.</th><th style="padding:8px;border:1px solid #ddd;text-align:center">फसल का नाम</th><th style="padding:8px;border:1px solid #ddd;text-align:center">किस्म</th><th style="padding:8px;border:1px solid #ddd;text-align:center">मात्रा</th><th style="padding:8px;border:1px solid #ddd;text-align:center">मूल्य (₹/किग्रा)</th><th style="padding:8px;border:1px solid #ddd;text-align:center">कुल राशि</th></tr></thead><tbody>${rowsHtml}</tbody></table></section><section class="section"><h2>5. मूल्य एवं भुगतान शर्तें</h2><p><strong>5.1 किसान</strong></p><p>कुल मात्रा: ${totalContractQty.toLocaleString('en-IN')} किग्रा</p><p>प्लेटफ़ॉर्म शुल्क: ${formatCurrency(totalPlatformFee)}</p><p>जीएसटी: ${formatCurrency(totalGst)}</p><p><strong>कुल देय राशि: ${formatCurrency(totalAmountInvoice)}</strong></p><p><strong>5.2 खरीदार</strong></p><p>प्लेटफ़ॉर्म शुल्क: ${formatCurrency(buyerPlatformFee)}</p><p>जीएसटी: ${formatCurrency(buyerGst)}</p><p><strong>कुल देय राशि: ${formatCurrency(buyerTotalAmount)}</strong></p></section><section class="section"><h2>13. निष्पादन एवं डिजिटल स्वीकृति</h2><p>यह समझौता एग्री एआई प्लेटफॉर्म के माध्यम से इलेक्ट्रॉनिक रूप से निष्पादित किया जा सकता है। पंजीकृत क्रेडेंशियल्स का उपयोग करके डिजिटल स्वीकृति कानूनी रूप से बाध्यकारी सहमति का गठन करेगी।</p><p>खरीदार / कंपनी</p><p>नाम: ${signatureName}</p><p>तिथि: ${signatureDate}</p><p>किसान / उत्पादक</p><p>नाम:________________________________</p><p>तिथि:________________________________</p><p>गवाह : <strong>एग्री एआई</strong></p></section></body></html>`;
      } else if (lang === 'kn') {
        html = `<!doctype html><html><head><meta charset="utf-8"/><title>AgriAI Contract</title><meta name="viewport" content="width=device-width,initial-scale=1"/><style>body{font-family:'Times New Roman',Times,serif;color:#111;padding:24px;line-height:1.6;}h1{text-align:center;color:#236902;margin:0;}h2{margin-top:18px;}.section{margin-top:16px;}table{border-collapse:collapse;width:100%;margin-top:12px;}th,td{border:1px solid #ddd;padding:8px;}th{background:#f7f7f7;text-align:left;}</style></head><body><div style="text-align:center;margin-bottom:20px;"><img src="${logoSrc}" alt="AgriAI" style="width:120px;height:auto;margin-bottom:8px"/><h1>ಅಗ್ರಿ AI<br/>ಒಪ್ಪಂದ ಕೃಷಿ ಒಪ್ಪಂದ</h1></div><section class="section"><h2>ಪಕ್ಷಗಳು</h2><p><strong>ಪಕ್ಷ A – ಖರೀದಿದಾರ / ಕಂಪನಿ</strong></p><p><b>ಹೆಸರು:</b> ${buyerName}</p><p><b>ಖರೀದಿದಾರ ಐಡಿ:</b> ${buyerId || '[Buyer ID]'}</p><p><strong>ಪಕ್ಷ B – ರೈತ / ಉತ್ಪಾದಕ</strong></p><p><b>ಹೆಸರು:</b> ${farmerName}</p><p><b>ರೈತ ಐಡಿ:</b> ${farmerId}</p></section><section class="section"><h2>2. ಒಪ್ಪಂದ ಪ್ರಕಾರ ಮತ್ತು ಅವಧಿ</h2><p><strong>ಒಪ್ಪಂದ ಪ್ರಕೃತಿ:</strong> ${contractNature === 'pre-harvest' ? 'ಫಸಲ್ ಉತ್ಪಾದನೆ ಒಪ್ಪಂದ' : 'ಕತ್ತರಣೆಯ ನಂತರದ ಖರೀದಿ ಒಪ್ಪಂದ'}</p><p><strong>ಒಪ್ಪಂದ ಅವಧಿ:</strong> ${contractDuration === 'one-time' ? 'ಒಮ್ಮೆ' : (contractDuration === 'seasonal' ? 'ಹಂಗಾಮಿ' : 'ವಾರ್ಷಿಕ')}</p><p><strong>ಪ್ರಾರಂಭ ದಿನಾಂಕ:</strong> ${startDate}</p><p><strong>ಅಂತಿಮ ದಿನಾಂಕ:</strong> ${endDate}</p><p><strong>ಅವಧಿ:</strong> ${days} ದಿನ</p></section><section class="section"><h2>4. ವಸ್ತು ವಿವರಗಳು</h2><table style="border-collapse:collapse;width:100%;margin-top:12px;"><thead><tr><th style="padding:8px;border:1px solid #ddd;text-align:center">ಕ್ರಮ ಸಂಖ್ಯೆ</th><th style="padding:8px;border:1px solid #ddd;text-align:center">ಬೆಳೆ ಹೆಸರು</th><th style="padding:8px;border:1px solid #ddd;text-align:center">ವೈವಿಧ್ಯ</th><th style="padding:8px;border:1px solid #ddd;text-align:center">ಪ್ರಮಾಣ</th><th style="padding:8px;border:1px solid #ddd;text-align:center">ಬೆಲೆ (₹/ಕೆಜಿ)</th><th style="padding:8px;border:1px solid #ddd;text-align:center">ಮೊತ್ತ</th></tr></thead><tbody>${rowsHtml}</tbody></table></section><section class="section"><h2>13. ಜಾರಿ ಮತ್ತು ಡಿಜಿಟಲ್ ಒಪ್ಪುವಿಕೆ</h2><p>ಈ ಒಪ್ಪಂದವನ್ನು ಅಗ್ರಿ ಎಐ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಮೂಲಕ ಇಲೆಕ್ಟ್ರಾನಿಕ್ ರೂಪದಲ್ಲಿ ಕಾರ್ಯಗತಗೊಳಿಸಬಹುದು. ನೋಂದಾಯಿತ ರುಜುವಾತುಗಳನ್ನು ಬಳಸಿಕೊಂಡು ಡಿಜಿಟಲ್ ಒಪ್ಪಿಗೆಯು ಕಾನೂನುಬದ್ಧವಾದ ಬದ್ಧತೆಯನ್ನು ರಚಿಸುತ್ತದೆ.</p><p>ಖರೀದಿದಾರ / ಕಂಪನಿ</p><p>ಹೆಸರು: ${signatureName}</p><p>ದಿನಾಂಕ: ${signatureDate}</p><p>ರೈತ / ಉತ್ಪಾದಕ</p><p>ಹೆಸರು: ________________</p><p>ದಿನಾಂಕ: ________________</p><p>ಸಾಕ್ಷಿ : <strong>AgriAI</strong></p></section></body></html>`;
      } else {
        html = `<!doctype html><html><head><meta charset="utf-8"/><title>AgriAI Contract</title><meta name="viewport" content="width=device-width,initial-scale=1"/><style>body{font-family:'Times New Roman',Times,serif;color:#111;padding:24px;line-height:1.6;}h1{text-align:center;color:#236902;margin:0;}h2{margin-top:18px;}.section{margin-top:16px;}table{border-collapse:collapse;width:100%;margin-top:12px;}th,td{border:1px solid #ddd;padding:8px;}th{background:#f7f7f7;text-align:left;}</style></head><body><div style="text-align:center;margin-bottom:20px;"><img src="${logoSrc}" alt="AgriAI" style="width:120px;height:auto;margin-bottom:8px"/><h1>Agri AI<br/>CONTRACT FARMING AGREEMENT</h1></div><section class="section"><h2>PARTIES</h2><p><strong>Party A – Buyer / Company</strong></p><p><b>Name:</b> ${buyerName}</p><p><b>Buyer ID:</b> ${buyerId || '[Buyer ID]'}</p><p><b>Address:</b> ${buyerAddress || buyerState || '[Buyer Address/State]'}${(buyerAddress && buyerState) ? ', ' + buyerState : ''}</p><p><strong>Party B – Farmer / Producer</strong></p><p><b>Name:</b> ${farmerName}</p><p><b>Farmer ID:</b> ${farmerId}</p><p><b>Address:</b> ${farmerAddress || '[Farmer Address]'}${farmerState ? ', ' + farmerState : ''}</p><p>Party A and Party B are collectively referred to as "the Parties." AgriAI acts solely as a digital facilitation platform.</p></section><section class="section"><h2>2. CONTRACT TYPE & DURATION</h2><p>Contract Nature: ${contractNature === 'pre-harvest' ? 'Pre-Harvest Production Contract' : 'Post-Harvest Procurement Contract'}</p><p>Contract Duration: ${contractDuration === 'one-time' ? 'One-Time' : (contractDuration === 'seasonal' ? 'Seasonal' : 'Yearly')}</p><p>Start Date: ${startDate}</p><p>End Date: ${endDate}</p><p>Duration: ${days} Days</p></section><section class="section"><h2>4. COMMODITY DETAILS</h2><table style="border-collapse:collapse;width:100%;margin-top:12px;"><thead><tr><th style="padding:8px;border:1px solid #ddd;text-align:center">Sl. No</th><th style="padding:8px;border:1px solid #ddd;text-align:center">Crop Name</th><th style="padding:8px;border:1px solid #ddd;text-align:center">Variety</th><th style="padding:8px;border:1px solid #ddd;text-align:center">Quantity</th><th style="padding:8px;border:1px solid #ddd;text-align:center">Price (₹/kg)</th><th style="padding:8px;border:1px solid #ddd;text-align:center">Amount</th></tr></thead><tbody>${rowsHtml}</tbody></table></section><section class="section"><h2>5. PRICE & PAYMENT TERMS</h2><p><strong>5.1 Farmer</strong></p><p>Total Quantity: ${totalContractQty.toLocaleString('en-IN')} kg</p><p>Price: ${formatCurrency(avgPricePerKg)} per kg</p><p>Platform Fee: ${formatCurrency(totalPlatformFee)}</p><p>GST on Platform Fee: ${formatCurrency(totalGst)}</p><p><strong>Total Amount (After Deduction): ${formatCurrency(totalAmountInvoice)}</strong></p><p><strong>5.2 Buyer</strong></p><p>Total Quantity: ${totalContractQty.toLocaleString('en-IN')} kg</p><p>Price: ${formatCurrency(avgPricePerKg)} per kg</p><p>Platform Fee: ${formatCurrency(buyerPlatformFee)}</p><p>GST on Platform Fee: ${formatCurrency(buyerGst)}</p><p><strong>Total Amount (After Addition): ${formatCurrency(buyerTotalAmount)}</strong></p><p><strong>5.3 Payment Schedule</strong></p><p>25% advance at contract confirmation. 50% upon successful delivery. Remaining 25% within 7 working days after quality inspection.</p><p><strong>5.4 Mode of Payment:</strong> Bank Transfer / UPI / Cheque</p></section><section class="section"><h2>13. EXECUTION & DIGITAL ACCEPTANCE</h2><p>This Agreement may be executed electronically through the AgriAI platform. Digital acceptance using registered credentials shall constitute legally binding consent.</p><p>Buyer / Company</p><p>Name: ${signatureName}</p><p>Date: ${signatureDate}</p><p>Farmer / Producer</p><p>Name: ________________</p><p>Date: ________________</p><p>Witness: <strong>AgriAI</strong></p></section></body></html>`;
      }

      setContractHtml(html);
      setShowContractPreview(true);
      setAgreeToContract(false);
    } catch (e) { console.error('sendContract failed', e); alert('Failed to prepare contract. See console.'); }
  };

  const downloadContract = () => { try { const blob = new Blob([contractHtml], { type: 'text/html' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'contract.html'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); } catch (e) { console.warn(e); } };
  const printContract = () => { try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);
      iframe.onload = () => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (printErr) {
          console.warn('Print dialog failed:', printErr);
        } finally {
          setTimeout(() => { document.body.removeChild(iframe); }, 500);
        }
      };
      iframe.srcdoc = contractHtml;
    } catch (e) { console.warn(e); } };

  const handleSendContract = () => {
    setPaymentError('');
    const invalid = items.some(it => !it.order_quantity || Number(it.order_quantity) <= 0);
    if (invalid) { alert(t('editEnterOrderQty', lang)); return; }
    // Open delivery date popup
    setSelectedDeliveryDate('');
    setShowDeliveryDateModal(true);
  };

  const handleConfirmDeliveryDate = () => {
    if (!selectedDeliveryDate) {
      alert(t('deliveryDateRequired', lang));
      return;
    }
    setShowDeliveryDateModal(false);
    generateContractAndShowPreview();
  };

  const generateContractAndShowPreview = async (forceOtpVerified = false) => {
    try {
      const lang = localStorage.getItem('agri_lang') || 'en';
      const tLang = (key) => t(key, lang);
      const startDateObj = new Date();
      const startDate = startDateObj.toLocaleDateString('en-GB');
      const endDate = selectedDeliveryDate.split('-').reverse().join('/'); // Convert YYYY-MM-DD to DD/MM/YYYY
      const days = Math.round((new Date(selectedDeliveryDate) - startDateObj) / (24 * 3600 * 1000));
      
      const totalContractQty = totalOrderedQty;
      const totalCropTradeValue = items.reduce((s, it) => s + ((Number(it.order_quantity || 0) || 0) * (Number(it.price_per_kg || 0) || 0)), 0);
      const avgPricePerKg = totalContractQty > 0 ? (totalCropTradeValue / totalContractQty) : 0;

      let farmerName = ''; let farmerId = ''; let farmerState = ''; let farmerRegion = ''; let farmerAddress = ''; let farmerPhone = '';
      if (items && items.length > 0) { const first = items[0]; farmerId = first.user_id || first.farmer_id || first.seller_id || first._farmer_id || ''; farmerPhone = first.user_phone || first.seller_phone || ''; }
      if (farmerId || farmerPhone) { try { let qs = ''; if (farmerId) qs += `id=${encodeURIComponent(farmerId)}`; if (farmerPhone) { if (qs) qs += '&'; qs += `phone=${encodeURIComponent(farmerPhone)}`; } const resF = await fetch(`${apiBase}/farmer/get?${qs}`); if (resF && resF.ok) { const jf = await resF.json().catch(() => null); if (jf && jf.ok && jf.farmer) { farmerId = jf.farmer.id ? String(jf.farmer.id) : farmerId; if (jf.farmer.name) farmerName = jf.farmer.name; farmerState = jf.farmer.state || farmerState; farmerRegion = jf.farmer.region || farmerRegion; } } } catch (e) { console.warn('farmer/get failed', e); } }
      if (!farmerName && farmerId) farmerName = localStorage.getItem('agriai_name') || '';
      if (!farmerAddress && items && items.length > 0) { const first = items[0]; farmerAddress = first.seller_address || first.farmer_address || ''; }
      
      let buyerName = localStorage.getItem('agriai_name') || '[Buyer Name]'; let buyerId = localStorage.getItem('agriai_id') || ''; let buyerPhone = localStorage.getItem('agriai_phone') || ''; let buyerState = localStorage.getItem('agriai_state') || ''; let buyerRegion = localStorage.getItem('agriai_region') || ''; let buyerAddress = '';
      if (buyerId || buyerPhone) { try { let qs = ''; if (buyerId) qs += `id=${encodeURIComponent(buyerId)}`; if (buyerPhone) { if (qs) qs += '&'; qs += `phone=${encodeURIComponent(buyerPhone)}`; } const resB = await fetch(`${apiBase}/buyer/get?${qs}`); if (resB && resB.ok) { const jb = await resB.json().catch(() => null); if (jb && jb.ok && jb.buyer) { buyerId = jb.buyer.id ? String(jb.buyer.id) : buyerId; if (jb.buyer.name) buyerName = jb.buyer.name; buyerState = jb.buyer.state || buyerState; buyerRegion = jb.buyer.region || buyerRegion; buyerAddress = jb.buyer.address || buyerAddress; } } } catch (e) { console.warn('buyer/get failed', e); } }
      
      setCurrentBuyerName(buyerName);
      const signed = forceOtpVerified || otpVerified;
      const signatureName = signed ? (currentBuyerName || buyerName) : '________________';
      const signatureDate = signed ? new Date().toLocaleDateString('en-GB') : '________________';
      const round2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;
      
      // Farmer's platform fee (4%) and GST
      const farmerPlatformFee = round2(totalCropTradeValue * 0.04);
      const farmerGst = round2(farmerPlatformFee * 0.18);
      const totalAmountInvoice = round2(totalCropTradeValue - farmerPlatformFee - farmerGst);
      
      // Buyer's platform fee (5%) and GST - from calculated totals
      const buyerPlatformFee = totals.commission;
      const buyerGst = totals.gst;
      const buyerTotalAmount = grandTotal;
      
      const qtyKg = Math.round(totalContractQty || 0); const qtyRateMap = [{ min:0,max:40,rates:[12,18,22] },{ min:41,max:400,rates:[18,22,28] },{ min:401,max:1500,rates:[22,28,35] },{ min:1501,max:5000,rates:[28,35,45] },{ min:5001,max:10000,rates:[35,45,60] }]; let matching = qtyRateMap.find(r => qtyKg >= r.min && qtyKg <= r.max); if (!matching) matching = qtyRateMap[qtyRateMap.length - 1];
      const formatRates = (arr) => { const parts = (arr || []).map(v => `₹${v} / km`); if (parts.length === 0) return '₹-- / km'; if (parts.length === 1) return parts[0]; if (parts.length === 2) return `${parts[0]} or ${parts[1]}`; return `${parts.slice(0, -1).join(', ')} or ${parts[parts.length - 1]}`; };
      const deliveryRateDisplay = `${formatRates(matching.rates)}`;
      
      const metadata = { contract_number: 'CNT' + Date.now(), farmer_id: farmerId, farmer_name: farmerName, farmer_address: farmerAddress, farmer_state: farmerState, buyer_id: buyerId, buyer_name: buyerName, buyer_address: buyerAddress, buyer_state: buyerState, contract_nature: contractNature, contract_duration: contractDuration, start_date: startDate, end_date: endDate, duration: days, farmer_platform_fee: farmerPlatformFee, farmer_gst: farmerGst, buyer_platform_fee: buyerPlatformFee, buyer_gst: buyerGst, delivery_cost: deliveryRateDisplay, crops: (items || []).map(it => ({ id: it.id, buyer_id: it.buyer_id, crop_name: it.crop_name, variety: it.variety || '', quantity: Number(it.order_quantity || 0), price_per_kg: Number(it.price_per_kg || 0), amount: Number(it.order_quantity || 0) * Number(it.price_per_kg || 0) })) };
      setContractMetadata(metadata);
      
      const rowsHtml = (items || []).map((it, idx) => { const qty = Number(it.order_quantity || 0) || 0; const variety = it.variety || it.Variety || ''; const price = Number(it.price_per_kg || 0) || 0; const amount = Math.round((qty * price + Number.EPSILON) * 100) / 100; return `<tr><td style="padding:8px;border:1px solid #ddd;text-align:center">${idx + 1}</td><td style="padding:8px;border:1px solid #ddd;text-align:center">${it.crop_name || ''}</td><td style="padding:8px;border:1px solid #ddd;text-align:center">${variety}</td><td style="padding:8px;border:1px solid #ddd;text-align:center">${qty.toLocaleString('en-IN')} kg</td><td style="padding:8px;border:1px solid #ddd;text-align:center">${formatCurrency(price)}</td><td style="padding:8px;border:1px solid #ddd;text-align:center">${formatCurrency(amount)}</td></tr>`; }).join('');
      
      const logoSrc = window.location.origin + logo;
      let html = '';
      if (lang === 'en') {
        html = `<!doctype html><html><head><meta charset="utf-8"/><title>AgriAI Contract</title><meta name="viewport" content="width=device-width,initial-scale=1"/><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Times New Roman',Times,serif;color:#1a1a1a;line-height:1.8;background:#fff;}.header{text-align:center;margin-bottom:16px;padding-bottom:12px;border-bottom:3px solid #236902;}.header img{width:80px;height:auto;margin:0 auto 16px auto;display:block;}h1{text-align:center;color:#236902;margin:8px 0;font-size:28px;font-weight:700;letter-spacing:0.5px;}h2{color:#1a5c10;margin:12px 0 8px 0;font-size:18px;font-weight:700;padding-bottom:8px;border-bottom:2px solid #e0e0e0;}h3{color:#236902;margin:10px 0 6px 0;font-size:15px;font-weight:700;}p{margin:6px 0;text-align:justify;font-size:14px;}.section{margin:12px 0;padding:8px 0;}ul{margin:6px 0 6px 24px;font-size:14px;list-style-type:disc;}li{margin:3px 0;list-style-type:disc;}table{width:100%;border-collapse:collapse;margin:12px 0;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.1);}th{background:#236902;color:#fff;padding:12px 8px;text-align:center;font-weight:700;font-size:13px;border:1px solid #ddd;}td{padding:10px 8px;border:1px solid #ddd;text-align:center;font-size:13px;}tr:nth-child(even){background:#f9f9f9;}tr:hover{background:#f0f7ff;}strong{font-weight:700;color:#1a5c10;}.party-section{background:#f5f9f5;padding:12px;border-left:4px solid #236902;margin:8px 0;border-radius:4px;}.signature-section{margin-top:20px;padding-top:16px;border-top:2px solid #ddd;display:flex;justify-content:space-around;gap:32px;}.signature-line{text-align:center;width:200px;}.signature-line p{margin:4px 0;font-size:15px;}.signature-line .line{border-top:1px solid #000;margin:24px 0 4px 0;min-height:20px;}@media print{body{padding:0;}.section{page-break-inside:avoid;}h2{page-break-after:avoid;}}</style></head><body><div class="header"><img src="${logoSrc}" alt="AgriAI" /><h1>AGRIAI FARMING AGREEMENT</h1></div><section class="section"><h2>PARTIES TO THE CONTRACT</h2><div class="party-section"><p><strong>Party A – Buyer / Company</strong></p><p><b>Name:</b> ${buyerName}</p><p><b>Buyer ID:</b> ${buyerId || '[Buyer ID]'}</p><p><b>Address:</b> ${buyerState ? buyerState : ''}${buyerRegion ? (buyerState ? ', ' + buyerRegion : buyerRegion) : ''}</p></div><div class="party-section"><p><strong>Party B – Farmer / Producer</strong></p><p><b>Name:</b> ${farmerName}</p><p><b>Farmer ID:</b> ${farmerId}</p><p><b>Address:</b> ${farmerState ? farmerState : ''}${farmerRegion ? (farmerState ? ', ' + farmerRegion : farmerRegion) : ''}</p></div><p>Party A and Party B are collectively referred to as "the Parties." AgriAI acts solely as a digital facilitation platform and is not a buyer, seller, transporter, insurer, or agent of either Party.</p></section><section class="section"><h2>1. PURPOSE OF AGREEMENT</h2><p>This Agreement defines the terms and conditions under which the Farmer agrees to produce and supply agricultural produce to the Buyer, and the Buyer agrees to procure such produce at a pre-determined price, ensuring:</p><ul><li>Assured market access to the Farmer</li><li>Fair and transparent pricing</li><li>Timely and secure payment</li><li>Reduced dependency on intermediaries</li></ul></section><section class="section"><h2>2. CONTRACT TYPE & DURATION</h2><p><b>Contract Nature:</b> ${contractNature === 'pre-harvest' ? 'Pre-Harvest Production Contract' : 'Post-Harvest Procurement Contract'}</p><p><b>Contract Duration:</b> ${contractDuration === 'one-time' ? 'One-Time' : (contractDuration === 'seasonal' ? 'Seasonal' : 'Yearly')}</p><p><b>Start Date:</b> ${startDate}</p><p><b>End Date:</b> ${endDate}</p><p><b>Duration:</b> ${days} Days</p></section><section class="section"><h2>3. DATA PRIVACY & PLATFORM COMPLIANCE</h2><p>All personal, agricultural, and transactional data collected through the AgriAI platform shall be stored securely and used only for contract execution and renewal, payment settlement, insurance facilitation, and legal and regulatory compliance. This Agreement is fully compliant with the Digital Personal Data Protection Act, 2023.</p></section><section class="section"><h2>4. COMMODITY DETAILS</h2><table><thead><tr><th>Sl. No</th><th>Crop Name</th><th>Variety</th><th>Quantity (kg)</th><th>Price (₹/kg)</th><th>Amount (₹)</th></tr></thead><tbody>${rowsHtml}</tbody></table></section><section class="section"><h2>5. PRICE & PAYMENT TERMS</h2><h3>5.1 Farmer's Payment Structure</h3><p><b>Total Quantity:</b> ${totalContractQty.toLocaleString('en-IN')} kg</p><p><b>Price per Unit:</b> ${formatCurrency(avgPricePerKg)} per kg</p><p><b>Subtotal:</b> ${formatCurrency(totalCropTradeValue)}</p><p><b>Platform Fee:</b> ${formatCurrency(farmerPlatformFee)}</p><p><b>GST (18%):</b> ${formatCurrency(farmerGst)}</p><p><b style="font-size:16px;color:#236902;">Total Amount (After Deduction):</b> <b style="font-size:16px;color:#236902;">${formatCurrency(totalAmountInvoice)}</b></p><h3 style="margin-top:20px;">5.2 Buyer's Payment Structure</h3><p><b>Total Quantity:</b> ${totalContractQty.toLocaleString('en-IN')} kg</p><p><b>Price per Unit:</b> ${formatCurrency(avgPricePerKg)} per kg</p><p><b>Subtotal:</b> ${formatCurrency(totalCropTradeValue)}</p><p><b>Platform Fee:</b> ${formatCurrency(buyerPlatformFee)}</p><p><b>GST (18%):</b> ${formatCurrency(buyerGst)}</p><p><b style="font-size:16px;color:#236902;">Total Amount Payable:</b> <b style="font-size:16px;color:#236902;">${formatCurrency(buyerTotalAmount)}</b></p><h3 style="margin-top:20px;">5.3 Payment Schedule</h3><ul><li><b>Advance (25%):</b> ${formatCurrency(buyerTotalAmount * 0.25)} – Due at contract confirmation</li><li><b>On Delivery (50%):</b> ${formatCurrency(buyerTotalAmount * 0.50)} – Due upon successful delivery</li><li><b>Final (25%):</b> ${formatCurrency(buyerTotalAmount * 0.25)} – Due within 7 working days after quality acceptance</li></ul><h3 style="margin-top:20px;">5.4 Mode of Payment</h3><p>Bank Transfer / UPI / Cheque. The Buyer shall issue digital or physical receipts for all payments made.</p></section><section class="section"><h2>6. DELIVERY, LOGISTICS & TRANSPORTATION</h2><h3>6.1 Role of AgriAI</h3><p>AgriAI operates solely as a digital technology platform. AgriAI shall not be deemed a buyer, seller, trader, commission agent, transporter, or custodian of goods. All obligations remain strictly between the Parties.</p><h3>6.2 Transportation</h3><p>Transportation shall be facilitated through third-party logistics service providers approved by the AgriAI platform based on crop nature, quantity, distance, and handling requirements.</p><h3>6.3 Delivery Charges</h3><p>Delivery charges shall be determined by the third-party logistics provider based on actual distance, vehicle type, loading requirements, and location. Such charges shall be paid directly by the Buyer to the logistics provider.</p><h3>6.4 Transfer of Risk</h3><p>Risk and responsibility for the produce shall remain with the logistics provider during transit. Risk shall transfer to the Buyer only upon successful delivery and signed Proof of Delivery (POD).</p><h3>6.5 Delay, Damage & Loss</h3><p>Any delay, damage, shortage, or loss occurring during transit shall be governed by the logistics provider's terms and conditions. AgriAI shall not be liable for any such claims.</p></section><section class="section"><h2>7. QUALITY STANDARDS, INSPECTION & ACCEPTANCE</h2><p>The produce supplied shall meet the mutually agreed specifications. The Buyer shall complete quality inspection within 3 working days from delivery. Any rejection must be raised in writing through the AgriAI platform within the inspection period. If no dispute is raised within 3 working days, the produce shall be deemed accepted.</p></section><section class="section"><h2>8. RISK, LIABILITY & INSURANCE</h2><p>The Farmer shall follow standard agricultural and post-harvest practices. In case of crop loss due to natural calamities before dispatch, obligations may be reviewed mutually. Crop insurance, if applicable under government schemes, shall remain in the Farmer's name. Any insurance compensation received shall belong solely to the Farmer. After delivery and acceptance, all risks and liabilities shall transfer entirely to the Buyer.</p></section><section class="section"><h2>9. FORCE MAJEURE</h2><p>Neither Party shall be liable for failure caused by events beyond reasonable control, including natural disasters, government restrictions, war, or strikes. Obligations shall resume once such conditions cease.</p></section><section class="section"><h2>10. DISPUTE RESOLUTION & JURISDICTION</h2><p>Any dispute arising out of this Agreement shall first be resolved amicably through discussion via the AgriAI platform. If unresolved within 15 days, disputes shall be referred to arbitration under the Arbitration and Conciliation Act, 1996. Subject to arbitration, the courts of Bengaluru, Karnataka shall have exclusive jurisdiction for enforcement and legal proceedings.</p></section><section class="section"><h2>11. TERMINATION</h2><p>Either Party may terminate this Agreement for material breach, including non-payment, non-delivery, misrepresentation, or violation of agreed terms. In case of payment default beyond agreed timelines, the defaulting Party may face account suspension, penalty charges, and recovery proceedings.</p></section><section class="section"><h2>12. LANGUAGE OF AGREEMENT</h2><p>This Agreement has been explained and translated to the Farmer in English. In case of any inconsistency, the English version shall prevail.</p></section><section class="section"><h2>13.  EXECUTION & DIGITAL ACCEPTANCE</h2><p>This Agreement may be executed electronically through the AgriAI platform. Digital acceptance using registered credentials shall constitute legally binding consent.</p><section class="signature-section"><div class="signature-line"><p><b>Buyer / Company</b></p><p>Name: ${signatureName}</p><p>Date: ${signatureDate}</p></div><div class="signature-line"><p><b>Farmer / Producer</b></p><p>Name: ________________</p><p>Date: ________________</p></div></section></section><p style="text-align:center;margin-top:40px;padding-top:20px;border-top:2px solid #ddd;font-size:12px;color:#000;font-weight:bold;"><b>Witness:</b> AgriAI Platform | Digital Record: ${new Date().toISOString()}</p></body></html>`;
      } else {
        html = `<!doctype html><html><head><meta charset="utf-8"/><title>AgriAI Contract</title><meta name="viewport" content="width=device-width,initial-scale=1"/><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Times New Roman',Times,serif;color:#1a1a1a;line-height:1.8;background:#fff;}.header{text-align:center;margin-bottom:16px;padding-bottom:12px;border-bottom:3px solid #236902;}.header img{width:80px;height:auto;margin:0 auto 16px auto;display:block;}h1{text-align:center;color:#236902;margin:8px 0;font-size:28px;font-weight:700;letter-spacing:0.5px;}h2{color:#1a5c10;margin:12px 0 8px 0;font-size:18px;font-weight:700;padding-bottom:8px;border-bottom:2px solid #e0e0e0;}h3{color:#236902;margin:10px 0 6px 0;font-size:15px;font-weight:700;}p{margin:6px 0;text-align:justify;font-size:14px;}.section{margin:12px 0;padding:8px 0;}ul{margin:6px 0 6px 24px;font-size:14px;list-style-type:disc;}li{margin:3px 0;list-style-type:disc;}table{width:100%;border-collapse:collapse;margin:12px 0;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.1);}th{background:#236902;color:#fff;padding:12px 8px;text-align:center;font-weight:700;font-size:13px;border:1px solid #ddd;}td{padding:10px 8px;border:1px solid #ddd;text-align:center;font-size:13px;}tr:nth-child(even){background:#f9f9f9;}tr:hover{background:#f0f7ff;}strong{font-weight:700;color:#1a5c10;}.party-section{background:#f5f9f5;padding:12px;border-left:4px solid #236902;margin:8px 0;border-radius:4px;}.signature-section{margin-top:20px;padding-top:16px;border-top:2px solid #ddd;display:flex;justify-content:space-around;gap:32px;}.signature-line{text-align:center;width:200px;}.signature-line p{margin:4px 0;font-size:15px;}.signature-line .line{border-top:1px solid #000;margin:24px 0 4px 0;min-height:20px;}@media print{body{padding:0;}.section{page-break-inside:avoid;}h2{page-break-after:avoid;}}</style></head><body><div class="header"><img src="${logoSrc}" alt="AgriAI" /><h1>${lang === 'hi' ? 'एग्रीएआई कृषि समझौता' : 'ಅಗ್ರಿ ಎಐ ಕೃಷಿ ಒಪ್ಪಂದ'}</h1></div><section class="section"><h2>${lang === 'hi' ? 'अनुबंध पक्षकार' : 'ಒಪ್ಪಂದದ ಪಕ್ಷಗಳು'}</h2><div class="party-section"><p><strong>${lang === 'hi' ? 'अनुबंध पक्ष A – खरीदार / कंपनी' : 'ಒಪ್ಪಂದ ಪಕ್ಷ A – ಖರೀದಿದಾರ / ಕಂಪನಿ'}</strong></p><p><b>${lang === 'hi' ? 'नाम:' : 'ಹೆಸರು:'}</b> ${buyerName}</p><p><b>${lang === 'hi' ? 'खरीदार आईडी:' : 'ಖರೀದಿದಾರ ಐಡಿ:'}</b> ${buyerId || '[Buyer ID]'}</p><p><b>${lang === 'hi' ? 'पता:' : 'ವಿಳಾಸ:'}</b> ${buyerState ? buyerState : ''}${buyerRegion ? (buyerState ? ', ' + buyerRegion : buyerRegion) : ''}</p></div><div class="party-section"><p><strong>${lang === 'hi' ? 'अनुबंध पक्ष B – किसान / उत्पादक' : 'ಒಪ್ಪಂದ ಪಕ್ಷ B – ರೈತ / ಉತ್ಪಾದಕ'}</strong></p><p><b>${lang === 'hi' ? 'नाम:' : 'ಹೆಸರು:'}</b> ${farmerName}</p><p><b>${lang === 'hi' ? 'किसान आईडी:' : 'ರೈತ ಐಡಿ:'}</b> ${farmerId}</p><p><b>${lang === 'hi' ? 'पता:' : 'ವಿಳಾಸ:'}</b> ${farmerState ? farmerState : ''}${farmerRegion ? (farmerState ? ', ' + farmerRegion : farmerRegion) : ''}</p></div><p>${lang === 'hi' ? 'अनुबंध पक्ष A और पक्ष B को सामूहिक रूप से "पक्षकार" कहा जाएगा। एग्रीएआई केवल एक डिजिटल सुविधा मंच के रूप में कार्य करता है और किसी भी पक्ष का खरीदार, विक्रेता, परिवहनक, बीमाकर्ता या एजेंट नहीं है।' : 'ಒಪ್ಪಂದ ಪಕ್ಷ A ಮತ್ತು ಪಕ್ಷ B ಯನ್ನು ಸಾಮೂಹಿಕವಾಗಿ "ಪಕ್ಷಗಳು" ಎಂದು ಕರೆಯಲಾಗುತ್ತದೆ. ಅಗ್ರಿ ಎಐ ಕೇವಲ ಡಿಜಿಟಲ್ ಸೌಲಭ್ಯ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಆಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ ಮತ್ತು ಯಾವುದೇ ಪಕ್ಷದ ಖರೀದಿದಾರ, ಮಾರಾಟಗಾರ, ಸಾರಿಗೆದಾರ, ವಿಮಾಕರ್ತ ಅಥವಾ ಏಜೆಂಟ್ ಅಲ್ಲ.'}</p></section><section class="section"><h2>${lang === 'hi' ? '1. समझौते का उद्देश्य' : '1. ಒಪ್ಪಂದದ ಉದ್ದೇಶ'}</h2><p>${lang === 'hi' ? 'यह समझौता उन शर्तों और निबंधनों को परिभाषित करता है जिनके तहत किसान कृषि उत्पाद का उत्पादन और आपूर्ति करने के लिए सहमत है, और खरीदार पूर्व-निर्धारित मूल्य पर ऐसे उत्पाद खरीदने के लिए सहमत है, यह सुनिश्चित करते हुए:' : 'ಈ ಒಪ್ಪಂದವು ರೈತನು ಕೃಷಿ ಉತ್ಪನ್ನವನ್ನು ಉತ್ಪಾದಿಸಲು ಮತ್ತು ಪೂರೈಸಲು ಸಮ್ಮತಿಸುವ ಷರತ್ತುಗಳು ಮತ್ತು ನಿಬಂಧನೆಗಳನ್ನು ವ್ಯಾಖ್ಯಾನಿಸುತ್ತದೆ, ಮತ್ತು ಖರೀದಿದಾರನು ಮುಂಜಾಗ್ರತಾ ನಿರ್ಧಾರಿತ ಬೆಲೆಯಲ್ಲಿ ಅಂತಹ ಉತ್ಪನ್ನವನ್ನು ಖರೀದಿಸಲು ಸಮ್ಮತಿಸುತ್ತಾನೆ, ಇದು ಖಚಿತಪಡಿಸುತ್ತದೆ:'}</p><ul><li>${lang === 'hi' ? 'किसान को बाजार पहुंच की गारंटी' : 'ರೈತನಿಗೆ ಮಾರುಕಟ್ಟೆ ಪ್ರವೇಶದ ಖಾತರಿ'}</li><li>${lang === 'hi' ? 'निष्पक्ष और पारदर्शी मूल्य निर्धारण' : 'ನ್ಯಾಯೋಚಿತ ಮತ್ತು ಪಾರದರ್ಶಕ ಬೆಲೆ ನಿರ್ಧಾರಣ'}</li><li>${lang === 'hi' ? 'समय पर और सुरक्षित भुगतान' : 'ಸಮಯೋಚಿತ ಮತ್ತು ಸುರಕ್ಷಿತ ಪಾವತಿ'}</li><li>${lang === 'hi' ? 'मध्यस्थों पर निर्भरता में कमी' : 'ಮಧ್ಯವರ್ತಿಗಳ ಮೇಲೆ ಅವಲಂಬನೆಯ ಕಡಿತ'}</li></ul></section><section class="section"><h2>${lang === 'hi' ? '2. अनुबंध प्रकार और अवधि' : '2. ಒಪ್ಪಂದ ಪ್ರಕಾರ ಮತ್ತು ಅವಧಿ'}</h2><p><b>${lang === 'hi' ? 'अनुबंध प्रकृति:' : 'ಒಪ್ಪಂದ ಪ್ರಕೃತಿ:'}</b> ${contractNature === 'pre-harvest' ? (lang === 'hi' ? 'फसल उत्पादन अनुबंध' : 'ಫಸಲ್ ಉತ್ಪಾದನ ಒಪ್ಪಂದ') : (lang === 'hi' ? 'कटाई के बाद की खरीद अनुबंध' : 'ಕತ್ತರಣೆಯ ಬಳಿಕ ಖರೀದಿ ಒಪ್ಪಂದ')}</p><p><b>${lang === 'hi' ? 'अनुबंध अवधि:' : 'ಒಪ್ಪಂದ ಅವಧಿ:'}</b> ${contractDuration === 'one-time' ? (lang === 'hi' ? 'एक बार' : 'ಒಮ್ಮೆ') : (contractDuration === 'seasonal' ? (lang === 'hi' ? 'मौसमी' : 'ಹಂಗಾಮಿ') : (lang === 'hi' ? 'वार्षिक' : 'ವಾರ್ಷಿಕ'))}</p><p><b>${lang === 'hi' ? 'प्रारंभ तिथि:' : 'ಪ್ರಾರಂಭ ದಿನಾಂಕ:'}</b> ${startDate}</p><p><b>${lang === 'hi' ? 'समाप्ति तिथि:' : 'ಅಂತಿಮ ದಿನಾಂಕ:'}</b> ${endDate}</p><p><b>${lang === 'hi' ? 'अवधि:' : 'ಅವಧಿ:'}</b> ${days} ${lang === 'hi' ? 'दिन' : 'ದಿನ'}</p></section><section class="section"><h2>${lang === 'hi' ? '3. डेटा गोपनीयता और प्लेटफॉर्म अनुपालन' : '3. ಡೇಟಾ ಗೌಪ್ಯತೆ ಮತ್ತು ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಅನುಸರಣೆ'}</h2><p>${lang === 'hi' ? 'एग्रीएआई प्लेटफॉर्म के माध्यम से एकत्र किए गए सभी व्यक्तिगत, कृषि और लेनदेन संबंधी डेटा को सुरक्षित रूप से संग्रहीत किया जाएगा और इसका उपयोग केवल अनुबंध निष्पादन और नवीनीकरण, भुगतान निपटान, बीमा सुविधा, और कानूनी और नियामक अनुपालन के लिए किया जाएगा। यह समझौता डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 के साथ पूरी तरह से अनुपालित है।' : 'ಅಗ್ರಿ ಎಐ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಮೂಲಕ ಸಂಗ್ರಹಿಸಲಾದ ಎಲ್ಲಾ ವೈಯಕ್ತಿಕ, ಕೃಷಿ ಮತ್ತು ವಹಿವಾಟಿನ ಡೇಟಾವನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಸಂಗ್ರಹಿಸಲಾಗುತ್ತದೆ ಮತ್ತು ಅದನ್ನು ಕೇವಲ ಒಪ್ಪಂದದ ಕಾರ್ಯಗತಗೊಳಿಕೆ ಮತ್ತು ನವೀಕರಣ, ಪಾವತಿ ನಿಷ್ಪತ್ತಿ, ವಿಮಾ ಸೌಲಭ್ಯ, ಮತ್ತು ಕಾನೂನಿಕ ಮತ್ತು ನಿಯಾಮಕ ಅನುಸರಣೆಗಾಗಿ ಮಾತ್ರ ಬಳಸಲಾಗುತ್ತದೆ. ಈ ಒಪ್ಪಂದವು ಡಿಜಿಟಲ್ ವೈಯಕ್ತಿಕ ಡೇಟಾ ಸಂರಕ್ಷಣೆ ಕಾಯ್ದೆ, 2023 ರೊಂದಿಗೆ ಸಂಪೂರ್ಣವಾಗಿ ಅನುಸರಣೆಯಲ್ಲಿದೆ.'}</p></section><section class="section"><h2>${lang === 'hi' ? '4. वस्तु विवरण' : '4.ವಸ್ತು ವಿವರಗಳು'}</h2><table><thead><tr><th>${lang === 'hi' ? 'क्रम सं.' : 'ಕ್ರಮ ಸಂ.'}</th><th>${lang === 'hi' ? 'फसल का नाम' : 'ಬೆಳೆಯ ಹೆಸರು'}</th><th>${lang === 'hi' ? 'किस्म' : 'ವೈವಿಧ್ಯ'}</th><th>${lang === 'hi' ? 'मात्रा (किग्रा)' : 'ಪ್ರಮಾಣ (ಕೆಜಿ)'}</th><th>${lang === 'hi' ? 'मूल्य (₹/किग्रा)' : 'ಬೆಲೆ (₹/ಕೆಜಿ)'}</th><th>${lang === 'hi' ? 'राशि (₹)' : 'ಮೊತ್ತ (₹)'}</th></tr></thead><tbody>${rowsHtml}</tbody></table></section><section class="section"><h2>${lang === 'hi' ? '5. मूल्य और भुगतान शर्तें' : '5. ಬೆಲೆ ಮತ್ತು ಪಾವತಿ ನಿಯಮಗಳು'}</h2><h3>${lang === 'hi' ? '5.1 किसान की भुगतान संरचना' : '5.1 ರೈತನ ಪಾವತಿ ರಚನೆ'}</h3><p><b>${lang === 'hi' ? 'कुल मात्रा:' : 'ಒಟ್ಟು ಪ್ರಮಾಣ:'}</b> ${totalContractQty.toLocaleString('en-IN')} kg</p><p><b>${lang === 'hi' ? 'प्रति इकाई मूल्य:' : 'ಪ್ರತಿ ಯೂನಿಟ್ ಬೆಲೆ:'}</b> ${formatCurrency(avgPricePerKg)} per kg</p><p><b>${lang === 'hi' ? 'सबटोटल:' : 'ಸಬ್‌ಟೋಟಲ್:'}</b> ${formatCurrency(totalCropTradeValue)}</p><p><b>${lang === 'hi' ? 'प्लेटफॉर्म शुल्क:' : 'ವೇದಿಕೆ ಶುಲ್ಕ:'}</b> ${formatCurrency(farmerPlatformFee)}</p><p><b>${lang === 'hi' ? 'जीएसटी (18%):' : 'ಜಿಎಸ್ಟಿ (18%):'}</b> ${formatCurrency(farmerGst)}</p><p><b style="font-size:16px;color:#236902;">${lang === 'hi' ? 'कटौती के बाद कुल राशि:' : 'ಕಡಿತದ ನಂತರ ಒಟ್ಟು ಮೊತ್ತ:'}</b> <b style="font-size:16px;color:#236902;">${formatCurrency(totalAmountInvoice)}</b></p><h3 style="margin-top:20px;">${lang === 'hi' ? '5.2 खरीदार की भुगतान संरचना' : '5.2 ಖರೀದಿದಾರನ ಪಾವತಿ ರಚನೆ'}</h3><p><b>${lang === 'hi' ? 'कुल मात्रा:' : 'ಒಟ್ಟು ಪ್ರಮಾಣ:'}</b> ${totalContractQty.toLocaleString('en-IN')} kg</p><p><b>${lang === 'hi' ? 'प्रति इकाई मूल्य:' : 'ಪ್ರತಿ ಯೂನಿಟ್ ಬೆಲೆ:'}</b> ${formatCurrency(avgPricePerKg)} per kg</p><p><b>${lang === 'hi' ? 'सबटोटल:' : 'ಸಬ್‌ಟೋಟಲ್:'}</b> ${formatCurrency(totalCropTradeValue)}</p><p><b>${lang === 'hi' ? 'प्लेटफॉर्म शुल्क:' : 'ವೇದಿಕೆ ಶುಲ್ಕ:'}</b> ${formatCurrency(buyerPlatformFee)}</p><p><b>${lang === 'hi' ? 'जीएसटी (18%):' : 'ಜಿಎಸ್ಟಿ (18%):'}</b> ${formatCurrency(buyerGst)}</p><p><b style="font-size:16px;color:#236902;">${lang === 'hi' ? 'कुल देय राशि:' : 'ಒಟ್ಟು ನೀಡಬೇಕಾದ ಮೊತ್ತ:'}</b> <b style="font-size:16px;color:#236902;">${formatCurrency(buyerTotalAmount)}</b></p><h3 style="margin-top:20px;">${lang === 'hi' ? '5.3 भुगतान अनुसूची' : '5.3 ಪಾವತಿ ವೇಳಾಪಟ್ಟಿ'}</h3><ul><li><b>${lang === 'hi' ? 'अग्रिम (25%):' : 'ಮುಂಗಡ (25%):'}</b> ${formatCurrency(buyerTotalAmount * 0.25)} – ${lang === 'hi' ? 'अनुबंध पुष्टि पर' : 'ಒಪ್ಪಂದದ ದೃಢೀಕರಣದಲ್ಲಿ'}</li><li><b>${lang === 'hi' ? 'वितरण पर (50%):' : 'ವಿತರಣೆಯ ಮೇಲೆ (50%):'}</b> ${formatCurrency(buyerTotalAmount * 0.50)} – ${lang === 'hi' ? 'सफल वितरण पर' : 'ಯಶಸ್ವಿ ವಿತರಣೆಯ ಮೇಲೆ'}</li><li><b>${lang === 'hi' ? 'अंतिम (25%):' : 'ಅಂತಿಮ (25%):'}</b> ${formatCurrency(buyerTotalAmount * 0.25)} – ${lang === 'hi' ? 'गुणवत्ता स्वीकृति के बाद 7 कार्य दिवसों के भीतर' : 'ಗುಣಮಟ್ಟದ ಸ್ವೀಕೃತಿಯ ನಂತರ 7 ಕೆಲಸದ ದಿನಗಳಲ್ಲಿ'}</li></ul><h3 style="margin-top:20px;">${lang === 'hi' ? '5.4 भुगतान का तरीका' : '5.4 ಪಾವತಿ ಮೋಡ್'}</h3><p>${lang === 'hi' ? 'बैंक ट्रांसफर / यूपीआई / चेक। खरीदार द्वारा सभी भुगतानों के लिए डिजिटल या भौतिक रसीदें जारी की जाएंगी।' : 'ಬ್ಯಾಂಕ್ ಟ್ರಾನ್ಸ್‌ಫರ್ / ಯೂಪಿಐ / ಚೆಕ್. ಖರೀದಿದಾರರಿಂದ ಎಲ್ಲಾ ಪಾವತಿಗಳಿಗೆ ಡಿಜಿಟಲ್ ಅಥವಾ ಭೌತಿಕ ರಸೀದುಗಳನ್ನು ನೀಡಲಾಗುತ್ತದೆ.'}</p></section><section class="section"><h2>${lang === 'hi' ? '6. वितरण, रसद और परिवहन' : '6. ವಿತರಣೆ, ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಮತ್ತು ಸಾರಿಗೆ'}</h2><h3>${lang === 'hi' ? '6.1 एग्रीएआई की भूमिका' : '6.1 ಅಗ್ರಿ ಎಐಯ ಪಾತ್ರ'}</h3><p>${lang === 'hi' ? 'एग्रीएआई केवल एक डिजिटल तकनीक प्लेटफॉर्म के रूप में संचालित करता है। एग्रीएआई को खरीदार, विक्रेता, व्यापारी, कमीशन एजेंट, परिवहनक या वस्तुओं का अभिरक्षक नहीं माना जाएगा। सभी दायित्व पक्षों के बीच सख्ती से बने रहेंगे।' : 'ಅಗ್ರಿ ಎಐ ಕೇವಲ ಡಿಜಿಟಲ್ ತಂತ್ರಜ್ಞಾನ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಆಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ. ಅಗ್ರಿ ಎಐಯನ್ನು ಖರೀದಿದಾರ, ಮಾರಾಟಗಾರ, ವ್ಯಾಪಾರಿ, ಕಮಿಷನ್ ಏಜೆಂಟ್, ಸಾರಿಗೆದಾರ ಅಥವಾ ಸರಕುಗಳ ಕಸ್ಟೋಡಿಯನ್ ಎಂದು ಪರಿಗಣಿಸಲಾಗುವುದಿಲ್ಲ. ಎಲ್ಲಾ ಕರ್ತವ್ಯಗಳು ಪಕ್ಷಗಳ ನಡುವೆ ಸ್ಟ್ರಿಕ್ಟ್ ಆಗಿ ಉಳಿಯುತ್ತವೆ.'}</p><h3>${lang === 'hi' ? '6.2 परिवहन' : '6.2 ಸಾರಿಗೆ'}</h3><p>${lang === 'hi' ? 'परिवहन को फसल की प्रकृति, मात्रा, दूरी और हैंडलिंग आवश्यकताओं के आधार पर एग्रीएआई प्लेटफॉर्म द्वारा अनुमोदित तृतीय-पक्ष लॉजिस्टिक्स सेवा प्रदाताओं के माध्यम से सुविधाजनक बनाया जाएगा।' : 'ಸಾರಿಗೆಯನ್ನು ಬೆಳೆಯ ಸ್ವರೂಪ, ಪ್ರಮಾಣ, ದೂರ ಮತ್ತು ನಿರ್ವಹಣೆ ಅವಶ್ಯಕತೆಗಳ ಆಧಾರದ ಮೇಲೆ ಅಗ್ರಿ ಎಐ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಮೂಲಕ ಅನುಮೋದಿಸಲಾದ ಮೂರನೇ ಪಕ್ಷದ ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಸೇವಾ ಪೂರೈಕೆದಾರರ ಮೂಲಕ ಸೌಲಭ್ಯಗೊಳಿಸಲಾಗುತ್ತದೆ.'}</p><h3>${lang === 'hi' ? '6.3 वितरण शुल्क' : '6.3 ವಿತರಣೆ ಶುಲ್ಕ'}</h3><p>${lang === 'hi' ? 'वितरण शुल्क वास्तविक दूरी, वाहन प्रकार, लोडिंग आवश्यकताओं और स्थान के आधार पर तृतीय-पक्ष लॉजिस्टिक्स प्रदाता द्वारा निर्धारित किए जाएंगे। ऐसे शुल्क खरीदार द्वारा सीधे लॉजिस्टिक्स प्रदाता को भुगतान किए जाएंगे।' : 'ವಿತರಣೆ ಶುಲ್ಕವನ್ನು ನಿಜವಾದ ದೂರ, ವಾಹನ ಪ್ರಕಾರ, ಲೋಡಿಂಗ್ ಅವಶ್ಯಕತೆಗಳು ಮತ್ತು ಸ್ಥಳದ ಆಧಾರದ ಮೇಲೆ ಮೂರನೇ ಪಕ್ಷದ ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಪೂರೈಕೆದಾರರಿಂದ ನಿರ್ಧಾರಿಸಲಾಗುತ್ತದೆ. ಅಂತಹ ಶುಲ್ಕವನ್ನು ಖರೀದಿದಾರರಿಂದ ನೇರವಾಗಿ ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಪೂರೈಕೆದಾರರಿಗೆ ಪಾವತಿಸಲಾಗುತ್ತದೆ.'}</p><h3>${lang === 'hi' ? '6.4 जोखिम का हस्तांतरण' : '6.4 ಅಪಾಯದ ಸ್ಥಳಾಂತರ'}</h3><p>${lang === 'hi' ? 'उत्पाद के लिए जोखिम और जिम्मेदारी परिवहन के दौरान लॉजिस्टिक्स प्रदाता के साथ बनी रहेगी। जोखिम खरीदार को केवल सफल डिलीवरी और हस्ताक्षरित डिलीवरी प्रमाण (POD) पर स्थानांतरित होगी।' : 'ಉತ್ಪನ್ನದ ಅಪಾಯ ಮತ್ತು ಜವಾಬ್ದಾರಿಕೆ ಸಾರಿಗೆಯ ಸಮಯದಲ್ಲಿ ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಪೂರೈಕೆದಾರರೊಂದಿಗೆ ಉಳಿಯುತ್ತದೆ. ಅಪಾಯವು ಯಶಸ್ವಿ ವಿತರಣೆ ಮತ್ತು ಸಹಿ ಮಾಡಿದ ವಿತರಣೆ ಪ್ರೂಫ್ (POD) ಮೇಲೆ ಮಾತ್ರ ಖರೀದಿದಾರರಿಗೆ ಸ್ಥಳಾಂತರಿಸುತ್ತದೆ.'}</p><h3>${lang === 'hi' ? '6.5 देरी, क्षति और हानि' : '6.5 ವಿಳಂಬ, ಹಾನಿ ಮತ್ತು ನಷ್ಟ'}</h3><p>${lang === 'hi' ? 'परिवहन के दौरान होने वाली कोई भी देरी, क्षति, कमी या हानि लॉजिस्टिक्स प्रदाता की शर्तों और निबंधनों द्वारा शासित होगी। एग्रीएआई ऐसे किसी भी दावों के लिए उत्तरदायी नहीं होगा।' : 'ಸಾರಿಗೆಯ ಸಮಯದಲ್ಲಿ ಸಂಭವಿಸುವ ಯಾವುದೇ ವಿಳಂಬ, ಹಾನಿ, ಕೊರತೆ ಅಥವಾ ನಷ್ಟವನ್ನು ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಪೂರೈಕೆದಾರರ ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳಿಂದ ನಿಯಂತ್ರಿಸಲಾಗುತ್ತದೆ. ಅಗ್ರಿ ಎಐ ಅಂತಹ ಯಾವುದೇ ಹಕ್ಕುಗಳಿಗೆ ಜವಾಬ್ದಾರಿಯಿಲ್ಲ.'}</p></section><section class="section"><h2>${lang === 'hi' ? '7. गुणवत्ता मानक, निरीक्षण और स्वीकृति' : '7. ಗುಣಮಟ್ಟದ ಮಾನದಂಡಗಳು, ಪರಿಶೀಲನೆ ಮತ್ತು ಸ್ವೀಕೃತಿ'}</h2><p>${lang === 'hi' ? 'आपूर्ति किए गए उत्पाद परस्पर सहमत विनिर्देशों को पूरा करेंगे। खरीदार को डिलीवरी से 3 कार्य दिवसों के भीतर गुणवत्ता निरीक्षण पूरा करना होगा। निरीक्षण अवधि के भीतर एग्रीएआई प्लेटफॉर्म के माध्यम से लिखित रूप में कोई भी अस्वीकार उठाया जाना चाहिए। यदि 3 कार्य दिवसों के भीतर कोई विवाद नहीं उठाया जाता है, तो उत्पाद स्वीकार किया गया माना जाएगा।' : 'ಪೂರೈಸಲಾದ ಉತ್ಪನ್ನವು ಪರಸ್ಪರ ಸಮ್ಮತಿಸಿದ ವಿಶೇಷಣಗಳನ್ನು ಪೂರೈಸಬೇಕು. ಖರೀದಿದಾರನು ವಿತರಣೆಯಿಂದ 3 ಕೆಲಸದ ದಿನಗಳಲ್ಲಿ ಗುಣಮಟ್ಟದ ಪರಿಶೀಲನೆಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಬೇಕು. ಪರಿಶೀಲನೆಯ ಅವಧಿಯಲ್ಲಿ ಅಗ್ರಿ ಎಐ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಮೂಲಕ ಲಿಖಿತವಾಗಿ ಯಾವುದೇ ತಿರಸ್ಕಾರವನ್ನು ಎತ್ತಬೇಕು. 3 ಕೆಲಸದ ದಿನಗಳಲ್ಲಿ ಯಾವುದೇ ವಿವಾದವನ್ನು ಎತ್ತದಿದ್ದರೆ, ಉತ್ಪನ್ನವನ್ನು ಸ್ವೀಕರಿಸಲಾಗಿದೆ ಎಂದು ಪರಿಗಣಿಸಲಾಗುತ್ತದೆ.'}</p></section><section class="section"><h2>${lang === 'hi' ? '8. जोखिम, दायित्व और बीमा' : '8. ಅಪಾಯ, ಜವಾಬ್ದಾರಿಕೆ ಮತ್ತು ವಿಮೆ'}</h2><p>${lang === 'hi' ? 'किसान को मानक कृषि और फसल कटाई के बाद की प्रथाओं का पालन करना होगा। प्रेषण से पहले प्राकृतिक आपदाओं के कारण फसल हानि की स्थिति में, दायित्वों की परस्पर समीक्षा की जा सकती है। सरकारी योजनाओं के तहत लागू होने पर फसल बीमा किसान के नाम में रहेगा। प्राप्त कोई भी बीमा मुआवजा पूरी तरह से किसान का होगा। डिलीवरी और स्वीकृति के बाद, सभी जोखिम और दायित्व पूरी तरह से खरीदार को स्थानांतरित हो जाएंगे।' : 'ರೈತನು ಪ್ರಮಾಣಿತ ಕೃಷಿ ಮತ್ತು ಕತ್ತರಣೆಯ ನಂತರದ ಅಭ್ಯಾಸಗಳನ್ನು ಅನುಸರಿಸಬೇಕು. ಕಳುಹಿಸುವ ಮೊದಲು ನೈಸರ್ಗಿಕ ಆಪತ್ತುಗಳಿಂದ ಬೆಳೆ ನಷ್ಟವಾದ ಸಂದರ್ಭದಲ್ಲಿ, ಕರ್ತವ್ಯಗಳನ್ನು ಪರಸ್ಪರ ಪರಿಶೀಲಿಸಬಹುದು. ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಅಡಿಯಲ್ಲಿ ಅನ್ವಯಿಸುವ ಸಂದರ್ಭದಲ್ಲಿ ಬೆಳೆ ವಿಮೆ ರೈತನ ಹೆಸರಿನಲ್ಲಿರುತ್ತದೆ. ಸ್ವೀಕರಿಸಿದ ಯಾವುದೇ ವಿಮೆ ಪರಿಹಾರವು ಸಂಪೂರ್ಣವಾಗಿ ರೈತನದ್ದಾಗಿರುತ್ತದೆ. ವಿತರಣೆ ಮತ್ತು ಸ್ವೀಕೃತಿಯ ನಂತರ, ಎಲ್ಲಾ ಅಪಾಯಗಳು ಮತ್ತು ಜವಾಬ್ದಾರಿಕೆಗಳು ಸಂಪೂರ್ಣವಾಗಿ ಖರೀದಿದಾರರಿಗೆ ಸ್ಥಳಾಂತರಿಸುತ್ತವೆ.'}</p></section><section class="section"><h2>${lang === 'hi' ? '9. फोर्स मेजर' : '9. ಫೋರ್ಸ್ ಮೇಜರ್'}</h2><p>${lang === 'hi' ? 'कोई भी पक्ष उचित नियंत्रण से परे घटनाओं के कारण विफलता के लिए उत्तरदायी नहीं होगा, जिसमें प्राकृतिक आपदाएं, सरकारी प्रतिबंध, युद्ध या हड़ताल शामिल हैं। ऐसी स्थितियां समाप्त होने के बाद दायित्व फिर से शुरू होंगे।' : 'ಯಾವುದೇ ಪಕ್ಷವು ಸಮಂಜಸ ನಿಯಂತ್ರಣದಿಂದ ಮೀರಿದ ಘಟನೆಗಳಿಂದ ಉಂಟಾದ ವಿಫಲತೆಗೆ ಜವಾಬ್ದಾರಿಯಿಲ್ಲ, ಇದರಲ್ಲಿ ನೈಸರ್ಗಿಕ ಆಪತ್ತುಗಳು, ಸರ್ಕಾರಿ ನಿರ್ಬಂಧಗಳು, ಯುದ್ಧ ಅಥವಾ ಹೋರಾಟಗಳು ಸೇರಿವೆ. ಅಂತಹ ಸ್ಥಿತಿಗಳು ನಿಲ್ಲಿಸಿದ ನಂತರ ಕರ್ತವ್ಯಗಳು ಮರುಪ್ರಾರಂಭವಾಗುತ್ತವೆ.'}</p></section><section class="section"><h2>${lang === 'hi' ? '10. विवाद समाधान और अधिकार क्षेत्र' : '10. ವಿವಾದ ಪರಿಹಾರ ಮತ್ತು ಅಧಿಕಾರ ವ್ಯಾಪ್ತಿ'}</h2><p>${lang === 'hi' ? 'इस समझौते से उत्पन्न होने वाला कोई भी विवाद पहले एग्रीएआई प्लेटफॉर्म के माध्यम से चर्चा के जरिए मैत्रीपूर्ण रूप से हल किया जाएगा। यदि 15 दिनों के भीतर हल नहीं होता है, तो विवादों को मध्यस्थता और सुलह अधिनियम, 1996 के तहत मध्यस्थता में भेजा जाएगा। मध्यस्थता के अधीन, बेंगलुरु, कर्नाटक की अदालतों को प्रवर्तन और कानूनी कार्यवाही के लिए विशेष अधिकार क्षेत्र होगा।' : 'ಈ ಒಪ್ಪಂದದಿಂದ ಉಂಟಾಗುವ ಯಾವುದೇ ವಿವಾದವನ್ನು ಮೊದಲು ಅಗ್ರಿ ಎಐ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಮೂಲಕ ಚರ್ಚೆಯ ಮೂಲಕ ಸೌಹಾರ್ದದಿಂದ ಪರಿಹರಿಸಲಾಗುತ್ತದೆ. 15 ದಿನಗಳಲ್ಲಿ ಪರಿಹರಿಸದಿದ್ದರೆ, ವಿವಾದಗಳನ್ನು ಮಧ್ಯಸ್ಥತೆ ಮತ್ತು ಸಮಾಧಾನ ಕಾಯ್ದೆ, 1996 ರ ಅಡಿಯಲ್ಲಿ ಮಧ್ಯಸ್ಥತೆಗೆ ಉಲ್ಲೇಖಿಸಲಾಗುತ್ತದೆ. ಮಧ್ಯಸ್ಥತೆಗೆ ಒಳಪಟ್ಟು, ಬೆಂಗಳೂರು, ಕರ್ನಾಟಕದ ನ್ಯಾಯಾಲಯಗಳು ಜಾರಿಗೊಳಿಸುವಿಕೆ ಮತ್ತು ಕಾನೂನಿಕ ಕಾರ್ಯಾಚರಣೆಗಳಿಗೆ ವಿಶೇಷ ಅಧಿಕಾರ ವ್ಯಾಪ್ತಿಯನ್ನು ಹೊಂದಿರುತ್ತವೆ.'}</p></section><section class="section"><h2>${lang === 'hi' ? '11. समाप्ति' : '11. ಅಂತ್ಯ'}</h2><p>${lang === 'hi' ? 'कोई भी पक्ष भौतिक उल्लंघन के लिए इस समझौते को समाप्त कर सकता है, जिसमें गैर-भुगतान, गैर-वितरण, गलत बयानी या सहमत शर्तों का उल्लंघन शामिल है। सहमत समयसीमा से परे भुगतान डिफॉल्ट की स्थिति में, डिफॉल्टिंग पार्टी को खाता निलंबन, दंड शुल्क और वसूली कार्यवाही का सामना करना पड़ सकता है।' : 'ಯಾವುದೇ ಪಕ್ಷವು ದ್ರವ್ಯ ಉಲ್ಲಂಘನೆಗಾಗಿ ಈ ಒಪ್ಪಂದವನ್ನು ಅಂತ್ಯಗೊಳಿಸಬಹುದು, ಇದರಲ್ಲಿ ಅಪಾವತಿ, ಅಪೂರೈಕೆ, ತಪ್ಪಾದ ಪ್ರತಿನಿಧಿಕೆ ಅಥವಾ ಸಮ್ಮತಿಸಿದ ಷರತ್ತುಗಳ ಉಲ್ಲಂಘನೆ ಸೇರಿವೆ. ಸಮ್ಮತಿಸಿದ ಸಮಯಸೀಮೆಗಳಿಗಿಂತ ಮೀರಿದ ಪಾವತಿ ಡೀಫಾಲ್ಟ್‌ನ ಸಂದರ್ಭದಲ್ಲಿ, ಡೀಫಾಲ್ಟಿಂಗ್ ಪಕ್ಷವು ಖಾತೆ ನಿಲುವು, ದಂಡ ಶುಲ್ಕಗಳು ಮತ್ತು ಮರುಪಡೆ ಕಾರ್ಯಾಚರಣೆಗಳನ್ನು ಎದುರಿಸಬಹುದು.'}</p></section><section class="section"><h2>${lang === 'hi' ? '12. समझौते की भाषा' : '12. ಒಪ್ಪಂದದ ಭಾಷೆ'}</h2><p>${lang === 'hi' ? 'इस समझौते को किसान को अंग्रेजी में समझाया और अनुवादित किया गया है। किसी भी असंगति की स्थिति में, अंग्रेजी संस्करण प्रबल होगा।' : 'ಈ ಒಪ್ಪಂದವನ್ನು ರೈತನಿಗೆ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ವಿವರಿಸಲಾಗಿದೆ ಮತ್ತು ಅನುವಾದಿಸಲಾಗಿದೆ. ಯಾವುದೇ ಅಸಂಗತಿಯ ಸಂದರ್ಭದಲ್ಲಿ, ಇಂಗ್ಲಿಷ್ ಆವೃತ್ತಿಯು ಪ್ರಬಲವಾಗಿರುತ್ತದೆ.'}</p></section><section class="section"><h2>${lang === 'hi' ? '13. निष्पादन एवं डिजिटल स्वीकृति' : '13. ಜಾರಿ ಮತ್ತು ಡಿಜಿಟಲ್ ಒಪ್ಪುವಿಕೆ'}</h2><p>${lang === 'hi' ? 'यह समझौता एग्रीएआई प्लेटफॉर्म के माध्यम से इलेक्ट्रॉनिक रूप से निष्पादित किया जा सकता है। पंजीकृत क्रेडेंशियल्स का उपयोग करके डिजिटल स्वीकृति कानूनी रूप से बाध्यकारी सहमति का गठन करेगी।' : 'ಈ ಒಪ್ಪಂದವನ್ನು ಅಗ್ರಿ ಎಐ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಮೂಲಕ ಇಲೆಕ್ಟ್ರಾನಿಕ್ ರೂಪದಲ್ಲಿ ಕಾರ್ಯಗತಗೊಳಿಸಬಹುದು. ನೋಂದಾಯಿತ ರುಜುವಾತುಗಳನ್ನು ಬಳಸಿಕೊಂಡು ಡಿಜಿಟಲ್ ಒಪ್ಪಿಗೆಯು ಕಾನೂನುಬದ್ಧವಾದ ಬದ್ಧತೆಯನ್ನು ರಚಿಸುತ್ತದೆ.'}</p><section class="signature-section"><div class="signature-line"><p><b>${lang === 'hi' ? 'खरीदार / कंपनी' : 'ಖರೀದಿದಾರ / ಕಂಪನಿ'}</b></p><p>${lang === 'hi' ? 'नाम:' : 'ಹೆಸರು:'} ${signatureName}</p><p>${lang === 'hi' ? 'तिथि:' : 'ದಿನಾಂಕ:'} ${signatureDate}</p></div><div class="signature-line"><p><b>${lang === 'hi' ? 'किसान / उत्पादक' : 'ರೈತ / ಉತ್ಪಾದಕ'}</b></p><p>${lang === 'hi' ? 'नाम:' : 'ಹೆಸರು:'} ________________</p><p>${lang === 'hi' ? 'तिथि:' : 'ದಿನಾಂಕ:'} ________________</p></div></section></section><p style="text-align:center;margin-top:40px;padding-top:20px;border-top:2px solid #ddd;font-size:12px;color:#000;font-weight:bold;"><b>${lang === 'hi' ? 'गवाह:' : 'ಸಾಕ್ಷಿ:'}</b> ${lang === 'hi' ? 'एग्रीएआई प्लेटफॉर्म' : 'ಅಗ್ರಿ ಎಐ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್'} | ${lang === 'hi' ? 'डिजिटल रिकॉर्ड:' : 'ಡಿಜಿಟಲ್ ದಾಖಲೆ:'} ${new Date().toISOString()}</p></body></html>`;
      }

      setContractHtml(html);
      setShowContractPreview(true);
    } catch (e) {
      console.error('Failed to generate contract', e);
      alert(t('contractGenerateFailed', lang) || 'Failed to generate contract. See console for details.');
    }
  };

  const proceedWithContract = () => {
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
      try { const buyerId = localStorage.getItem('agriai_id') || null; const ordersPayload = orderItems.map(it => ({ invoice_id: invoiceId, crop_id: it.id, farmer_id: it.farmer_id || it.seller_id || it._farmer_id || null, buyer_id: buyerId, crop_name: it.crop_name, quantity_kg: Number(it.order_quantity || 0), price_per_kg: Number(it.price_per_kg || 0), total: Number(it.total || 0), payment_method: paymentMethod, contract_nature: contractNature, contract_duration: contractDuration })); fetch(`${apiBase}/buyer-orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orders: ordersPayload }) }).catch(() => {}); } catch (e) {}
      setTimeout(() => { window.location.href = '/history'; }, 100);
    } catch (e) { console.error('Failed to complete purchase:', e); alert(t('purchaseFailed', lang)); }
  };

  return (
    <div className="fc-root" style={{ background: 'rgba(83, 255, 3, 0.12)', backgroundAttachment: 'fixed', minHeight: '100vh', color: '#000', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        .fc-root .navbar {
          background: oklch(0.12 0.03 160 / 0.5) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
        }
        .fc-root .navbar select {
          background: oklch(0.12 0.03 160 / 0.6) !important;
          border: 1px solid oklch(0.65 0.22 145 / 0.3) !important;
          color: rgba(255,255,255,0.9) !important;
        }
        .fc-root .navbar select option {
          background: #1a1a1a;
          color: #ffffff;
        }
      `}</style>
      <Navbar />
      <main style={{ padding: '6rem 1rem 2rem', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px) saturate(1.6)', WebkitBackdropFilter: 'blur(20px) saturate(1.6)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 8px 32px rgba(35,105,2,0.12), 0 32px 64px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'nowrap', position: 'relative', padding: '12px 0 18px', minHeight: 64 }}>
            <h1 style={{ backgroundImage: 'linear-gradient(135deg, #1a5c10 0%, #236902 50%, #53b635 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', margin: 0, position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontWeight: 800, fontSize: 32 }}>{t('cartTitle', lang)}</h1>
            {items.length > 0 && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto', zIndex: 2 }}>
                <button onClick={() => window.location.href = '/dashboard/farmer'} style={{ background: '#fff', border: '1px solid #dfeadf', color: '#236902', padding: '6px 10px', borderRadius: 6, fontWeight: 800 }}>{t('continueShopping', lang)}</button>
                <button onClick={clearCart} style={{ background: '#fff', border: '1px solid #f0dede', color: '#d32f2f', padding: '6px 10px', borderRadius: 6, fontWeight: 800 }}>{t('clearCart', lang)}</button>
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <div style={{ fontSize: 52, lineHeight: 1 }}>🧺</div>
              <p style={{ marginTop: 8 }}>{t('cartEmptyMessage', lang)}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 620px', minWidth: 320 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                  {items.map(it => {
                    const { gstRate, commissionRate: _commissionRate, gstAmt, commissionAmt, lineTotal, group: _group, categoryTotal: _categoryTotal } = calculateGstAndCommission(it);
                    return (
                      <div key={it.id} style={{ display: 'flex', gap: 12, alignItems: 'center', border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
                        <div style={{ width: 120, height: 100, borderRadius: 6, overflow: 'hidden', background: '#f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {it.image_url ? (
                            <img 
                              src={it.image_url} 
                              alt={it.crop_name} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onLoad={() => console.log(`✅ Image loaded: ${it.crop_name} from ${it.image_url}`)}
                              onError={() => console.error(`❌ Failed to load image for ${it.crop_name}: ${it.image_url}`)}
                            />
                          ) : (
                            <div style={{ color: '#999' }}>📷 {t('noImage', lang)}</div>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <div style={{ fontWeight: 800, color: '#236902' }}>{it.crop_name}</div>
                            {it.variety && (
                              <div style={{ background: '#f0f7ff', color: '#236902', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{it.variety}</div>
                            )}
                            {(it.category || it.cat) && (
                              <div style={{ background: '#eaf6ea', color: '#236902', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{it.category || it.cat}</div>
                            )}
                          </div>
                          <div style={{ marginTop: 6, fontWeight: 700 }}>{formatCurrency(it.price_per_kg)} / {t('kg', lang)}</div>
                          <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ fontSize: 13, color: '#000000ff' }}>{t('subTotalLabel', lang)} {formatCurrency(lineTotal)}</div>
                            <div style={{ fontSize: 13, color: '#000000ff' }}>{t('tablePlatformFee', lang)}: {formatCurrency(commissionAmt)}</div>
                            <div style={{ fontSize: 13, color: '#000000ff' }}>{t('gstLabel', lang)}: {formatCurrency(gstAmt)}</div>
                            <div style={{ fontSize: 13, color: '#000', fontWeight: 700 }}>{t('itemTotalLabel', lang)} {formatCurrency(lineTotal + gstAmt + commissionAmt)}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: 220 }}>
                          {editingId !== it.id && (
                            <>
                              <div style={{ fontWeight: 700 }}>{t('availableLabel', lang)} {Number(it.quantity_kg || 0).toLocaleString('en-IN')} {t('kg', lang)}</div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 6 }}>
                                <button onClick={() => updateQuantity(it.id, -1)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e5e5', background: '#fff' }}>-</button>
                                <div style={{ minWidth: 60, textAlign: 'center', fontWeight: 800 }}>{Number(it.order_quantity || 0).toLocaleString('en-IN')} kg</div>
                                <button onClick={() => updateQuantity(it.id, 1)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e5e5', background: '#fff' }}>+</button>
                              </div>
                            </>
                          )}
                          {editingId === it.id && (
                            <>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 12 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                  <label style={{ fontSize: 12, fontWeight: 700 }}>{t('formQuantityLabel', lang)}</label>
                                  <input type="number" step="0.001" value={editVal} onChange={e => setEditVal(e.target.value)} style={{ width: 100, padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 14, textAlign: 'center' }} />
                                </div>
                                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                  <button onClick={() => saveEdit(it.id)} style={{ padding: '6px 12px', background: '#236902', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700 }}>{t('saveButton', lang)}</button>
                                  <button onClick={cancelEdit} style={{ padding: '6px 12px', background: '#ddd', border: 'none', borderRadius: 6, fontWeight: 700 }}>{t('cancelButton', lang)}</button>
                                </div>
                              </div>
                            </>
                          )}
                          <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            {editingId !== it.id && (
                              <>
                                <button onClick={() => startEdit(it)} style={{ padding: '6px 12px', background: '#236902', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700 }}>{t('editButton', lang)}</button>
                                <button onClick={() => removeItem(it.id)} style={{ background: '#fff', border: '1px solid #d32f2f', color: '#d32f2f', padding: '6px 10px', borderRadius: 6 }}>{t('deleteButton', lang)}</button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ flex: '0 0 320px', width: 320, position: 'sticky', top: 88, alignSelf: 'flex-start' }}>
                <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontWeight: 800, color: '#236902', marginBottom: 8 }}>{t('orderSummary', lang)}</div>
                  <div style={{ display: 'grid', gap: 6, fontWeight: 700 }}>
                    <div>{t('totalItemsLabel', lang)} {items.length}</div>
                    <div>{t('totalOrderedLabel', lang)} {Number(totalOrderedQty).toLocaleString('en-IN')} {t('kg', lang)}</div>
                    <div>{t('subTotalLabel', lang)} {formatCurrency(totals.subtotal)}</div>
                    <div>{t('platformFeeLabel', lang)} {formatCurrency(totals.commission)}</div>
                    <div>{t('gstLabel', lang)} {formatCurrency(totals.gst)}</div>
                    <div style={{ fontSize: 18, color: '#236902', marginTop: 6 }}>{t('grandTotalLabel', lang)}: {formatCurrency(grandTotal)}</div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{t('contractNatureLabel', lang)}</div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="radio" name="contractNature" value="pre-harvest" checked={contractNature === 'pre-harvest'} onChange={() => setContractNature('pre-harvest')} /> {t('preHarvestContract', lang)}
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="radio" name="contractNature" value="post-harvest" checked={contractNature === 'post-harvest'} onChange={() => setContractNature('post-harvest')} /> {t('postHarvestContract', lang)}
                      </label>
                    </div>

                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{t('contractDurationLabel', lang)}</div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="radio" name="contractDuration" value="one-time" checked={contractDuration === 'one-time'} onChange={() => setContractDuration('one-time')} /> {t('contractOneTime', lang)}
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="radio" name="contractDuration" value="seasonal" checked={contractDuration === 'seasonal'} onChange={() => setContractDuration('seasonal')} /> {t('contractSeasonal', lang)}
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="radio" name="contractDuration" value="yearly" checked={contractDuration === 'yearly'} onChange={() => setContractDuration('yearly')} /> {t('contractYearly', lang)}
                      </label>
                    </div>
                  </div>

                  <button onClick={handleSendContract} disabled={!items.length} style={{ marginTop: 12, width: '100%', background: '#236902', color: '#fff', padding: '10px 12px', borderRadius: 6, border: 'none' }}>
                    {t('sendContract', lang)}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {showContractPreview && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '900px', height: '90vh', background: '#fff', display: 'flex', flexDirection: 'column', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden', margin: '0 auto' }}>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 24px', borderBottom: '2px solid #e5e5e5', background: '#f9f9f9' }}>
              <h2 style={{ margin: 0, color: '#236902', fontSize: '18px', fontWeight: 700 }}>{t('contractPreview', lang) || 'Contract Preview'}</h2>
              <div style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 10, alignItems: 'center' }}>
                <button onClick={printContract} style={{ padding: '5px 12px', background: '#fff', color: '#28a745', border: '2px solid #28a745', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}>{t('print', lang) || 'Print'}</button>
                <button onClick={() => { setShowContractPreview(false); setContractMetadata(null); setAgreeToContract(false); }} style={{ padding: '5px 12px', background: '#fff', color: '#dc3545', border: '2px solid #dc3545', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}>{t('close', lang) || 'Close'}</button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '0', background: '#fff' }}>
              <div style={{ padding: '40px 48px', lineHeight: '1.8' }} dangerouslySetInnerHTML={{ __html: contractHtml }} />
            </div>
            <div style={{ 
  borderTop: '2px solid #e5e5e5', 
  padding: '16px 24px', 
  background: '#f9f9f9', 
  display: 'flex', 
  flexDirection: 'column', 
  gap: 12,
  alignItems: 'center' // center all children
}}>

  <label style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: 10, 
    padding: '10px 12px', 
    background: '#f0f7ff', 
    border: '2px solid #236902', 
    borderRadius: 6, 
    cursor: 'pointer',
    width: 'fit-content' // keeps it compact
  }}>
    <input 
      type="checkbox" 
      checked={agreeToContract} 
      onChange={(e) => setAgreeToContract(e.target.checked)} 
      style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#236902' }} 
    />
    <span style={{ fontSize: 14, color: '#236902', fontWeight: 700 }}>
      {t('agreeContract', lang)}
    </span>
  </label>

  <button 
    onClick={async () => { 
      if (otpVerified) { 
        await sendContract(); 
      } else { 
        setPendingContractAction(() => sendContract); 
        openOtpForContract(); 
      } 
    }} 
    disabled={uploadingContracts || !agreeToContract} 
    style={{ 
      padding: '8px 20px', 
      background: agreeToContract ? '#236902' : '#ccc', 
      color: '#fff', 
      border: 'none', 
      borderRadius: 6, 
      fontWeight: 700, 
      cursor: agreeToContract ? 'pointer' : 'not-allowed', 
      fontSize: '13px',
      width: 'fit-content' // 👈 reduces button width
    }}
  >
    {t('sendContract', lang)}
  </button>

</div>
          </div>
        </div>
      )}

      {showDeliveryDateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ width: '90%', maxWidth: 400, background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <h2 style={{ margin: '0 0 16px 0', color: '#236902', fontSize: 20, textAlign: 'center', fontWeight: 600 }}>
              {t('selectDeliveryDate', lang)}
            </h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: '#333' }}>
                {t('deliveryDateLabel', lang)}
              </label>
              <input 
                type="date" 
                value={selectedDeliveryDate} 
                onChange={(e) => setSelectedDeliveryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
              />
              <small style={{ display: 'block', marginTop: 6, color: '#666', fontSize: 12 }}>
                {t('dateFormatHint', lang)}
              </small>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={handleConfirmDeliveryDate} 
                style={{ flex: 1, padding: 10, background: '#236902', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                {t('confirmButton', lang)}
              </button>
              <button 
                onClick={() => setShowDeliveryDateModal(false)} 
                style={{ flex: 1, padding: 10, background: '#ddd', border: 'none', borderRadius: 6, fontSize: 14, cursor: 'pointer', color: '#333', fontWeight: 500 }}>
                {t('cancelButton', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {showOtpModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ width: '90%', maxWidth: 500, background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <h2 style={{ margin: '0 0 16px 0', color: '#236902', fontSize: 20, textAlign: 'center' }}>
              {otpVerified ? t('signatureVerified', lang) : t('verifyIdentity', lang)}
            </h2>

            <p style={{ color: '#666', marginBottom: 16, fontSize: 14 }}>
              {otpVerified ? t('verifyIdentitySigned', lang) : t('verifyIdentityDesc', lang)}
            </p>

            {otpVerified ? (
              <div style={{ background: '#f0f7ff', border: '2px solid #236902', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <div style={{ marginBottom: 8 }}><strong>{t('signatureDetails', lang)}</strong></div>
                <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#333' }}>
                  <div>📧 {t('signatureEmailLabel', lang)}: {otpEmail}</div>
                  <div>🕐 {t('signatureTimeLabel', lang)}: {digitalSignature.signature_timestamp}</div>
                  <div>✔ {t('signatureMethodLabel', lang)}: {digitalSignature.signature_method}</div>
                  <div style={{ marginTop: 8, wordBreak: 'break-all' }}>{t('signatureHashLabel', lang)}: {digitalSignature.signature_hash ? digitalSignature.signature_hash.substring(0, 40) + '...' : ''}</div>
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>{t('signatureEmailLabel', lang)}</label>
                  <input type="email" value={otpEmail} disabled style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6, fontSize: 14, background: '#f5f5f5' }} />
                </div>

                {!otpSent ? (
                  <div style={{ marginBottom: 16 }}>
                    <button onClick={handleOtpSend} disabled={otpLoading} style={{ width: '100%', padding: 10, background: '#236902', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: otpLoading ? 'not-allowed' : 'pointer', opacity: otpLoading ? 0.6 : 1 }}>
                      {otpLoading ? (t('sendingOtp', lang) || 'Sending...') : t('sendOtpButton', lang)}
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Enter OTP</label>
                      <input type="text" placeholder={t('otpPlaceholder', lang)} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6, fontSize: 14, textAlign: 'center', letterSpacing: '4px', fontWeight: 'bold' }} />
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{t('checkEmailMsg', lang)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={handleOtpVerifyAndSign} disabled={otpLoading || otpCode.length < 6} style={{ flex: 1, padding: 10, background: '#236902', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: (otpLoading || otpCode.length < 6) ? 'not-allowed' : 'pointer', opacity: (otpLoading || otpCode.length < 6) ? 0.6 : 1 }}>
                        {otpLoading ? (t('verifying', lang) || 'Verifying...') : t('verifyAndSign', lang)}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {otpError && (
              <div style={{ background: '#ffebee', border: '1px solid #d32f2f', color: '#d32f2f', padding: 10, borderRadius: 6, marginTop: 12, fontSize: 13 }}>
                ⚠ {otpError}
              </div>
            )}

            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              {otpVerified && pendingContractAction && (
                <button onClick={() => { pendingContractAction(); setPendingContractAction(null); }} style={{ flex: 1, padding: 10, background: '#236902', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  {t('proceedToSend', lang)}
                </button>
              )}
              <button onClick={resetOtpModal} disabled={otpLoading} style={{ flex: 1, padding: 10, background: '#ddd', border: 'none', borderRadius: 6, fontSize: 14, cursor: 'pointer' }}>
                {t('close', lang) || 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="w-full border-t" style={{background:'#001400', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderColor:'oklch(0.65 0.22 145 / 0.12)', padding:'1em 0'}}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2 font-bold text-xl mb-2">
                <div className="w-7 h-7 rounded-lg border border-primary/40 flex items-center justify-center" style={{background:'oklch(0.65 0.22 145 / 0.2)', borderColor:'oklch(0.65 0.22 145)'}}>
                  <Leaf className="w-3.5 h-3.5" style={{color:'oklch(0.65 0.22 145)'}} />
                </div>
                <span style={{color:'oklch(0.65 0.22 145)', fontFamily:"'Times New Roman', Times, serif"}}>AgriAI</span>
              </div>
              <p className="text-white text-sm leading-relaxed" style={{fontFamily:"'Times New Roman', Times, serif"}}>
                {t('footerDescription', localStorage.getItem('agri_lang') || 'en')}
              </p>
            </div>

            {[
              { title: t('footerPlatform', localStorage.getItem('agri_lang') || 'en'), links: ['footerAbout', 'footerHowItWorks', 'footerFeatures', 'footerPricing'] },
              { title: t('footerUsers', localStorage.getItem('agri_lang') || 'en'), links: ['footerFarmers', 'footerBuyers', 'footerAgribusiness', 'footerPartners'] },
              { title: t('footerLegal', localStorage.getItem('agri_lang') || 'en'), links: ['footerPrivacy', 'footerTerms', { label: t('footerContact', localStorage.getItem('agri_lang') || 'en'), path: "/contact" }] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-white mb-2" style={{fontFamily:"'Times New Roman', Times, serif"}}>{col.title}</h4>
                <ul className="space-y-1">
                  {col.links.map((link) => {
                    const label = typeof link === 'string' ? t(link, localStorage.getItem('agri_lang') || 'en') : link.label;
                    const path = typeof link === 'string' ? '/' : link.path;
                    return (
                      <li key={label}>
                        {path === '/contact' ? (
                          <Link to="/contact" className="text-white text-sm transition-colors" style={{fontFamily:"'Times New Roman', Times, serif"}}>
                            {label}
                          </Link>
                        ) : (
                          <a href={path} className="text-white text-sm transition-colors" style={{fontFamily:"'Times New Roman', Times, serif"}}>
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

          <div className="pt-3 flex justify-center items-center text-white text-sm" style={{borderTop:'1px solid oklch(0.65 0.22 145 / 0.12)', fontFamily:"'Times New Roman', Times, serif"}}>
            <span>
              © {new Date().getFullYear()} AgriAI. {t('footerRights', localStorage.getItem('agri_lang') || 'en')}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Cart;