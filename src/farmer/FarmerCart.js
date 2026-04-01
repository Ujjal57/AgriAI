import React from 'react';
import Navbar from '../Navbar';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import logo192 from '../assets/logo192.png';
import { t } from '../i18n';

const FarmerCart = () => {
  const [items, setItems] = React.useState([]);
  const [editingId, setEditingId] = React.useState(null);
  const [editVal, setEditVal] = React.useState('');
  const [editPrice, setEditPrice] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('');
  const [paymentError, setPaymentError] = React.useState('');
  const [contractNature, setContractNature] = React.useState('post-harvest');
  const [contractDuration, setContractDuration] = React.useState('one-time');
  const [contractHtml, setContractHtml] = React.useState('');
  const [showContractPreview, setShowContractPreview] = React.useState(false);
  const [contractMetadata, setContractMetadata] = React.useState(null);
  
  // Digital Signature & OTP State
  const [showOtpModal, setShowOtpModal] = React.useState(false);
  const [otpEmail, setOtpEmail] = React.useState('');
  const [otpCode, setOtpCode] = React.useState('');
  const [otpSent, setOtpSent] = React.useState(false);
  const [otpLoading, setOtpLoading] = React.useState(false);
  const [otpError, setOtpError] = React.useState('');
  const [otpVerified, setOtpVerified] = React.useState(false);
  const [digitalSignature, setDigitalSignature] = React.useState('');
  const [pendingContractAction, setPendingContractAction] = React.useState(null);

  const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');

  const [siteLang, setSiteLang] = React.useState(() => localStorage.getItem('agri_lang') || 'en');
  React.useEffect(() => {
    const onLang = (e) => { 
      const l = (e && e.detail && e.detail.lang) ? e.detail.lang : (localStorage.getItem('agri_lang') || 'en'); 
      setSiteLang(l); 
      // Refresh the page when language changes
      setTimeout(() => window.location.reload(), 100);
    };
    try { window.addEventListener('agri:lang:change', onLang); } catch (e) {}
    return () => { try { window.removeEventListener('agri:lang:change', onLang); } catch (e) {} };
  }, []);

  React.useEffect(() => {
    // Try to load server-backed farmer cart when signed in; otherwise fall back to localStorage
    const load = async () => {
      try {
        const userRole = localStorage.getItem('agriai_role') || '';
        const userId = localStorage.getItem('agriai_id') || '';
        const userPhone = localStorage.getItem('agriai_phone') || '';
        const cartKey = 'agriai_cart_farmer';

        if (userRole && (userId || userPhone)) {
          try {
            const qp = userId ? `user_type=${encodeURIComponent(userRole)}&user_id=${encodeURIComponent(userId)}` : `user_type=${encodeURIComponent(userRole)}&user_phone=${encodeURIComponent(userPhone)}`;
            const res = await fetch(`${apiBase}/cart/list?${qp}`);
            if (res && res.ok) {
              const j = await res.json().catch(() => null);
              if (j && j.ok && Array.isArray(j.cart)) {
                const mapped = j.cart.map(r => ({
                  id: r.crop_id || r.id,
                  cart_id: r.id,
                  crop_name: r.crop_name || '',
                  // Mirror buyer cart mapping: `quantity_kg` shown as available comes from `total_quantity`
                  quantity_kg: Number(r.total_quantity != null ? r.total_quantity : (r.quantity_kg || 0)),
                  // keep original stored row quantity as order_quantity
                  order_quantity: Number(r.quantity_kg || 0),
                  price_per_kg: r.price_per_kg != null ? Number(r.price_per_kg) : 0,
                  total_quantity: Number(r.total_quantity != null ? r.total_quantity : (r.quantity_kg || 0)),
                  total_price: r.total_price != null ? Number(r.total_price) : Number((r.quantity_kg || 0) * (r.price_per_kg || 0)),
                  image_url: r.image_path || r.image_url || '',
                  variety: r.variety || '',
                  category: r.category || r.cat || '',
                  user_type: r.user_type || userRole,
                  user_id: r.user_id || null,
                  buyer_id: r.buyer_id || null,
                  user_phone: r.user_phone || null,
                }));
                setItems(mapped);
                try { localStorage.setItem(cartKey, JSON.stringify(mapped)); } catch (e) {}

                // If any mapped rows lack a category, try to fetch crop metadata
                (async () => {
                  try {
                    const need = mapped.filter(m => (!m.category || String(m.category).trim() === '') && (m.id || m.crop_id));
                    if (!need.length) return;
                    await Promise.all(need.map(async (m) => {
                      try {
                        const cid = m.id;
                        const resC = await fetch(`${apiBase}/crops/${encodeURIComponent(cid)}`);
                        if (!resC || !resC.ok) return;
                        const jc = await resC.json().catch(() => null);
                        if (jc && jc.ok && jc.crop) {
                          const catVal = jc.crop.category || jc.crop.cat || jc.crop._category || '';
                          if (catVal && String(catVal).trim()) {
                            m.category = catVal;
                          }
                        }
                      } catch (e) {}
                    }));
                    try { localStorage.setItem(cartKey, JSON.stringify(mapped)); } catch (e) {}
                    setItems(mapped);
                  } catch (e) {}
                })();
                return;
              }
            }
          } catch (e) { console.warn('Failed to load server farmer cart, falling back to localStorage', e); }
        }

        // Fallback to localStorage
        try {
          const raw = localStorage.getItem('agriai_cart_farmer');
          const arr = raw ? JSON.parse(raw) : [];
          const normalized = (Array.isArray(arr) ? arr : []).map(it => {
            try {
              const avail = Number(it.quantity_kg || 0) || 0;
              const order = (it.order_quantity !== undefined && it.order_quantity !== null) ? Number(it.order_quantity) : 0;
              return { ...it, quantity_kg: avail, order_quantity: order };
            } catch (e) { return it; }
          });
          setItems(normalized);
        } catch (e) { setItems([]); }
      } catch (e) { setItems([]); }
    };

    load();

    // Auto-refresh when other parts of the app dispatch this event
    const onUpdate = () => { try { load(); } catch (e) { console.warn('cart auto-refresh failed', e); } };
    try { window.addEventListener('agriai:cart:update', onUpdate); } catch (e) {}

    // Also listen for localStorage changes from other tabs/windows and refresh immediately
    const storageHandler = (e) => {
      try {
        if (!e) return;
        if (e.key === 'agriai_cart_farmer' || e.key === 'agriai_cart_buyer') {
          try { load(); } catch (err) { console.warn('storage-handler load failed', err); }
        }
      } catch (err) {}
    };
    try { window.addEventListener && window.addEventListener('storage', storageHandler); } catch (e) {}

    // Poll as a fallback so the farmer sees updates without manual reload. Use a short interval for fast refresh.
    const pollInterval = setInterval(() => { try { load(); } catch (e) {} }, 2000);

    return () => {
      try { window.removeEventListener('agriai:cart:update', onUpdate); } catch (e) {}
      try { window.removeEventListener && window.removeEventListener('storage', storageHandler); } catch (e) {}
      try { clearInterval(pollInterval); } catch (e) {}
    };
  }, []);

  const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  // ============ Digital Signature & OTP Functions ============
  const sendOtpToEmail = async (email) => {
    setOtpLoading(true);
    setOtpError('');
    try {
      const response = await fetch(`${apiBase}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          purpose: 'contract-signature'
        })
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ok) {
        setOtpSent(true);
        setOtpLoading(false);
        return true;
      } else {
        setOtpError(data.error || 'Failed to send OTP. Please try again.');
        setOtpLoading(false);
        return false;
      }
    } catch (e) {
      console.error('OTP send error:', e);
      setOtpError('Network error. Please try again.');
      setOtpLoading(false);
      return false;
    }
  };

  const verifyOtp = async (email, otp) => {
    setOtpLoading(true);
    setOtpError('');
    try {
      const response = await fetch(`${apiBase}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          otp: otp,
          purpose: 'contract-signature'
        })
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ok) {
        // Generate digital signature
        const signature = generateDigitalSignature(email, otp);
        setDigitalSignature(signature);
        setOtpVerified(true);
        // Regenerate contract with verified signatures to show names and dates
        setTimeout(() => {
          try {
            generateContract(true);  // Pass true to show verified names
          } catch (e) {
            console.warn('Contract regeneration after OTP failed:', e);
          }
        }, 100);
        // update contract metadata with signature details so backend receives it
        try {
          setContractMetadata(prev => ({ ...(prev || {}), digital_signature: signature.signature_hash, signature_method: signature.signature_method, signature_email: signature.signer_email, signature_timestamp: signature.signature_timestamp }));
        } catch (e) {}
        setOtpLoading(false);
        return signature;
      } else {
        setOtpError(data.error || 'Invalid OTP. Please try again.');
        setOtpLoading(false);
        return false;
      }
    } catch (e) {
      console.error('OTP verification error:', e);
      setOtpError('Network error. Please try again.');
      setOtpLoading(false);
      return false;
    }
  };

  const injectSignatureIntoHtml = (signatureObj) => {
    try {
      if (!signatureObj) return;
      const name = (contractMetadata && contractMetadata.farmer_name) || localStorage.getItem('agriai_name') || '';
      const ts = signatureObj.signature_timestamp || new Date().toISOString();
      const formatted = new Date(ts).toLocaleString('en-GB');
      let updated = contractHtml || '';

      // English block
      updated = updated.replace(/<p>Farmer \/ Producer<\/p>\s*<p>Signature:[\s\S]*?<\/p>\s*<p>Date:[\s\S]*?<\/p>/m, `<p>Farmer / Producer</p>\n  <p>Signature: <strong>${name}</strong></p>\n  <p>Date: <strong>${formatted}</strong></p>`);

      // Hindi block
      updated = updated.replace(/<p>किसान \/ उत्पादक<\/p>\s*<p>हस्ताक्षर:[\s\S]*?<\/p>\s*<p>तिथि:[\s\S]*?<\/p>/m, `<p>किसान / उत्पादक</p>\n  <p>हस्ताक्षर: <strong>${name}</strong></p>\n  <p>तिथि: <strong>${formatted}</strong></p>`);

      // Kannada block (if present) - using correct Kannada labels
      updated = updated.replace(/<p>ರೈತ \/ ಉತ್ಪಾದಕ<\/p>\s*<p>ಸಹಿ:[\s\S]*?<\/p>\s*<p>ದಿನಾಂಕ:[\s\S]*?<\/p>/m, `<p>ರೈತ / ಉತ್ಪಾದಕ</p>\n  <p>ಸಹಿ: <strong>${name}</strong></p>\n  <p>ದಿನಾಂಕ: <strong>${formatted}</strong></p>`);

      // Fallback: if no replacement occurred but template contains generic 'Signature: ______' lines
      if (updated === contractHtml) {
        updated = updated.replace(/Signature:\s*_{2,}/, `Signature: <strong>${name}</strong>`);
        updated = updated.replace(/Date:\s*_{2,}/, `Date: <strong>${formatted}</strong>`);
        updated = updated.replace(/हस्ताक्षर:\s*_{2,}/, `हस्ताक्षर: <strong>${name}</strong>`);
        updated = updated.replace(/तिथि:\s*_{2,}/, `तिथि: <strong>${formatted}</strong>`);
      }

      setContractHtml(updated);
    } catch (e) {
      console.warn('injectSignatureIntoHtml failed', e);
    }
  };

  const generateDigitalSignature = (email, otp) => {
    // Create a digital signature using email, timestamp, and OTP verification
    const timestamp = new Date().toISOString();
    const signatureData = `${email}|${timestamp}|${otp.slice(0, 2)}***`;
    
    // Create a hash-like signature (in production, use proper cryptographic signing)
    const hashString = btoa(signatureData);
    
    return {
      signer_email: email,
      signature_timestamp: timestamp,
      signature_hash: hashString,
      signature_method: 'OTP_VERIFIED'
    };
  };

  const initOtpVerification = (actionCallback) => {
    const farmerEmail = localStorage.getItem('agriai_email') || '';
    if (!farmerEmail) {
      alert('Email not found. Please update your profile.');
      return;
    }
    setOtpEmail(farmerEmail);
    setPendingContractAction(() => actionCallback);
    setShowOtpModal(true);
    setOtpSent(false);
    setOtpCode('');
    setOtpVerified(false);
    setOtpError('');
  };

  const handleOtpSend = async () => {
    if (!otpEmail) {
      setOtpError('Email is required');
      return;
    }
    const success = await sendOtpToEmail(otpEmail);
    if (success) {
      // Optional: Show success message
    }
  };

  const handleOtpVerifyAndSign = async () => {
    if (!otpCode || otpCode.length < 4) {
      setOtpError('Please enter a valid OTP');
      return;
    }
    const result = await verifyOtp(otpEmail, otpCode);
    if (result && typeof result === 'object') {
      // result is signature object
      injectSignatureIntoHtml(result);
      // close modal and show updated preview
      setShowOtpModal(false);
      setShowContractPreview(true);
      // leave pendingContractAction intact so user may proceed to send
    }
  };

  const resetOtpModal = () => {
    setShowOtpModal(false);
    setOtpCode('');
    setOtpSent(false);
    setOtpVerified(false);
    setOtpError('');
    setDigitalSignature('');
    setPendingContractAction(null);
  };

  const clearCart = () => {
    (async () => {
      try {
        const userRole = localStorage.getItem('agriai_role') || '';
        const userId = localStorage.getItem('agriai_id') || '';
        const userPhone = localStorage.getItem('agriai_phone') || '';
        const cartKey = 'agriai_cart_farmer';

        if (userRole && (userId || userPhone)) {
          try {
            await fetch(`${apiBase}/cart/clear`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_type: userRole, user_id: userId || undefined, user_phone: userPhone || undefined }) });
          } catch (e) { console.warn('cart/clear failed', e); }
        }

        // Always clear local storage/UI
        try { localStorage.setItem(cartKey, JSON.stringify([])); } catch (e) {}
        setItems([]);
        try { window.dispatchEvent(new Event('agriai:cart:update')); } catch (e) {}
      } catch (e) { console.warn(e); }
    })();
  };

  const updateQuantity = (id, delta) => {
    try {
      const updated = items.map(it => {
        if (it.id !== id) return it;
        const avail = Number(it.total_quantity != null ? it.total_quantity : it.quantity_kg || 0) || 0;
        const current = Number(it.order_quantity || 0) || 0;
        const next = Math.max(0, Math.min(avail, current + delta));
        return { ...it, order_quantity: next };
      });
      setItems(updated);
      try { localStorage.setItem('agriai_cart_farmer', JSON.stringify(updated)); } catch (e) {}
      try { window.dispatchEvent(new Event('agriai:cart:update')); } catch (e) {}

      // persist change to server if we have cart row id (match buyer behaviour)
      try {
        const userRole = localStorage.getItem('agriai_role') || '';
        const userId = localStorage.getItem('agriai_id') || '';
        const userPhone = localStorage.getItem('agriai_phone') || '';
        const it = updated.find(x => x.id === id);
        if (it && it.cart_id && userRole && (userId || userPhone)) {
          (async () => {
            try {
              const payload = { id: it.cart_id, quantity_kg: it.order_quantity, user_type: userRole, user_id: userId || undefined, user_phone: userPhone || undefined };
              const res = await fetch(`${apiBase}/cart/update`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
              if (!res.ok) console.warn('cart/update failed');
            } catch (e) { console.warn('cart/update error', e); }
          })();
        }
      } catch (e) {}
    } catch (e) {}
  };

  const removeItem = (id) => {
    (async () => {
      try {
        const userRole = localStorage.getItem('agriai_role') || '';
        const userId = localStorage.getItem('agriai_id') || '';
        const userPhone = localStorage.getItem('agriai_phone') || '';
        const cartKey = 'agriai_cart_farmer';
        const it = items.find(x => x.id === id);

        // If server-backed (has cart_id), request deletion on server
        if (it && it.cart_id && userRole && (userId || userPhone)) {
          try {
            const payload = { ids: [it.cart_id], user_type: userRole, user_id: userId || undefined, user_phone: userPhone || undefined };
            const res = await fetch(`${apiBase}/cart/remove`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok) console.warn('cart/remove failed');
          } catch (e) { console.warn('cart/remove error', e); }
        }

        // Always remove locally (fallback/offline)
        let arr = items.filter(itm => itm && itm.id !== id);
        try { localStorage.setItem(cartKey, JSON.stringify(arr)); } catch (e) {}
        setItems(arr);
        try { window.dispatchEvent(new Event('agriai:cart:update')); } catch (e) {}
      } catch (e) { console.warn(e); }
    })();
  };

  const startEdit = (it) => {
    setEditingId(it.id);
    setEditVal(String(Number(it.order_quantity || 0)));
    setEditPrice(String(Number(it.price_per_kg || it.price || 0)));
  };

  const cancelEdit = () => { setEditingId(null); setEditVal(''); setEditPrice(''); };

  const saveEdit = (id) => {
    try {
      const newQty = parseFloat(editVal);
      const newPrice = parseFloat(editPrice);
      if (Number.isNaN(newQty) || newQty <= 0) {
        alert(t('orderQtyInvalid', siteLang));
        return;
      }
      if (Number.isNaN(newPrice) || newPrice < 0) {
        alert(t('pricePerKgInvalid', siteLang));
        return;
      }
      const updated = items.map(it => {
        if (it.id === id) {
          const avail = Number(it.quantity_kg || 0) || 0;
          const finalQty = Math.min(newQty, avail);
          return { ...it, order_quantity: finalQty, price_per_kg: Number(newPrice) };
        }
        return it;
      });
      localStorage.setItem('agriai_cart_farmer', JSON.stringify(updated));
      setItems(updated);
      setEditingId(null);
      setEditVal('');
      setEditPrice('');
      try { window.dispatchEvent(new Event('agriai:cart:update')); } catch (e) {}

      // If this item exists on server (has cart_id) and user is signed in, persist quantity change
      (async () => {
        try {
          const userRole = localStorage.getItem('agriai_role') || '';
          const userId = localStorage.getItem('agriai_id') || '';
          const userPhone = localStorage.getItem('agriai_phone') || '';
          if (userRole && (userId || userPhone)) {
            const changed = updated.find(x => x.id === id);
            if (changed && changed.cart_id) {
              try {
                await fetch(`${apiBase}/cart/update`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: changed.cart_id, quantity_kg: Number(changed.order_quantity || 0), price_per_kg: Number(changed.price_per_kg || 0), user_type: userRole, user_id: userId || undefined, user_phone: userPhone || undefined }) });
              } catch (e) { console.warn('cart/update failed', e); }
            }
          }
        } catch (e) { console.warn(e); }
      })();
    } catch (e) { console.warn(e); }
  };

  const calculateGstAndCommission = (item) => {
    const round2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;
    const qty = Number(item.order_quantity || 0) || 0;
    const price = Number(item.price_per_kg || 0) || 0;
    const total = round2(qty * price);
    // Determine group using category/name fields (robust matching)
    const getGroupFromItem = (it) => {
      const fields = [it && it.category, it && it.cat, it && it._category, it && it.category_name, it && it.categoryName, it && it.tags, it && it.tag].filter(Boolean).join(' ');
      const catRaw = (fields || (it && it.crop_name) || '').toString().trim().toLowerCase();
      const name = (it && it.crop_name || '').toString().toLowerCase();
      // Prefer exact category values chosen in `MyCrops` select
      // Map common exact values to internal groups
      const exact = (it && (it.category || it.cat) || '').toString().trim().toLowerCase();
      if (exact === 'food crops' || exact === 'food crop' || exact === 'food' || exact === 'crops') return 'crop';
      if (exact === 'fruits and vegetables' || exact === 'fruits & vegetables' || exact === 'fruits' || exact === 'fruits and veg') return 'fruitveg';
      if (exact === 'masalas' || exact === 'masala' || exact === 'spices' || exact === 'spice') return 'masala';
      // Fallback keyword matching (includes plurals and some local words)
      const masalaKeywords = ['masala', 'masalas', 'spice', 'spices', 'मसाला', 'ಮಸಾಲೆ'];
      const fruitKeywords = ['fruit', 'fruits', 'फल', 'ಹಣ್ಣು'];
      const vegKeywords = ['vegetable', 'vegetables', 'veg', 'veggie', 'veget', 'सब्जी', 'ತರಕಾರಿ'];
      const hasAny = (str, arr) => arr.some(k => str.includes(k));
      if (hasAny(catRaw, masalaKeywords) || hasAny(name, masalaKeywords)) return 'masala';
      if (hasAny(catRaw, fruitKeywords) || hasAny(name, fruitKeywords) || hasAny(catRaw, vegKeywords) || hasAny(name, vegKeywords)) return 'fruitveg';
      if (hasAny(catRaw, ['crop', 'crops', 'food'])) return 'crop';
      return 'crop';
    };

    // Aggregate category subtotal across items so tiering uses category totals
    const categoryTotals = items.reduce((acc, it) => {
      try {
        const q = Number(it.order_quantity || 0) || 0;
        const p = Number(it.price_per_kg || 0) || 0;
        const line = round2(q * p);
        const g = getGroupFromItem(it);
        acc[g] = (acc[g] || 0) + line;
      } catch (e) {}
      return acc;
    }, { crop: 0, fruitveg: 0, masala: 0 });

    const group = getGroupFromItem(item);
    const categoryTotal = round2(categoryTotals[group] || 0);

    // Tiered commission rates (percent) by group and category subtotal
    let commissionRate = 0;
    if (group === 'crop') {
      if (categoryTotal < 200001) commissionRate = 1.0;
      else if (categoryTotal < 600001) commissionRate = 1.8;
      else if (categoryTotal < 1000001) commissionRate = 2.5;
      else commissionRate = 3.0;
    } else if (group === 'fruitveg') {
      if (categoryTotal < 200001) commissionRate = 1.8;
      else if (categoryTotal < 600001) commissionRate = 2.4;
      else if (categoryTotal < 1000001) commissionRate = 3.0;
      else commissionRate = 3.4;
    } else if (group === 'masala') {
      if (categoryTotal < 200001) commissionRate = 2.4;
      else if (categoryTotal < 600001) commissionRate = 3.0;
      else if (categoryTotal < 1000001) commissionRate = 3.5;
      else commissionRate = 4.0;
    }
    // Platform fee (amount) = total * commissionRate%; cap at 100000
      let commissionAmt = round2((total * (commissionRate / 100)) || 0);
    if (!Number.isFinite(commissionAmt) || commissionAmt < 0) commissionAmt = 0;
    if (commissionAmt > 100000) commissionAmt = 100000;

    // GST is 18% on the platform fee
    const gstRate = 18;
      const gstAmt = round2((commissionAmt * gstRate) / 100);
      return { gstRate, commissionRate, gstAmt, commissionAmt, lineTotal: total, group, categoryTotal };
  };

  const totals = items.reduce(
    (acc, it) => {
      const { gstAmt, commissionAmt, lineTotal } = calculateGstAndCommission(it);
      acc.subtotal += lineTotal;
      acc.gst += gstAmt;
      acc.commission += commissionAmt;
      return acc;
    },
    { subtotal: 0, gst: 0, commission: 0 }
  );
  
  // Calculate buyer platform fees with different rates
  const buyerTotals = (() => {
    const round2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;
    const getGroupFromItem = (it) => {
      const fields = [it && it.category, it && it.cat, it && it._category, it && it.category_name, it && it.categoryName, it && it.tags, it && it.tag].filter(Boolean).join(' ');
      const catRaw = (fields || (it && it.crop_name) || '').toString().trim().toLowerCase();
      const name = (it && it.crop_name || '').toString().toLowerCase();
      const exact = (it && (it.category || it.cat) || '').toString().trim().toLowerCase();
      if (exact === 'food crops' || exact === 'food crop' || exact === 'food' || exact === 'crops') return 'crop';
      if (exact === 'fruits and vegetables' || exact === 'fruits & vegetables' || exact === 'fruits' || exact === 'fruits and veg') return 'fruitveg';
      if (exact === 'masalas' || exact === 'masala' || exact === 'spices' || exact === 'spice') return 'masala';
      const masalaKeywords = ['masala', 'masalas', 'spice', 'spices', 'मसाला', 'ಮಸಾಲೆ'];
      const fruitKeywords = ['fruit', 'fruits', 'फल', 'ಹಣ್ಣು'];
      const vegKeywords = ['vegetable', 'vegetables', 'veg', 'veggie', 'veget', 'सब्जी', 'ತರಕಾರಿ'];
      const hasAny = (str, arr) => arr.some(k => str.includes(k));
      if (hasAny(catRaw, masalaKeywords) || hasAny(name, masalaKeywords)) return 'masala';
      if (hasAny(catRaw, fruitKeywords) || hasAny(name, fruitKeywords) || hasAny(catRaw, vegKeywords) || hasAny(name, vegKeywords)) return 'fruitveg';
      if (hasAny(catRaw, ['crop', 'crops', 'food'])) return 'crop';
      return 'crop';
    };
    
    let buyerCommission = 0;
    let buyerGst = 0;
    
    items.forEach(it => {
      const qty = Number(it.order_quantity || 0) || 0;
      const price = Number(it.price_per_kg || 0) || 0;
      const lineTotal = round2(qty * price);
      
      const categoryTotals = items.reduce((acc, itm) => {
        try {
          const q = Number(itm.order_quantity || 0) || 0;
          const p = Number(itm.price_per_kg || 0) || 0;
          const line = round2(q * p);
          const g = getGroupFromItem(itm);
          acc[g] = (acc[g] || 0) + line;
        } catch (e) {}
        return acc;
      }, { crop: 0, fruitveg: 0, masala: 0 });
      
      const group = getGroupFromItem(it);
      const categoryTotal = round2(categoryTotals[group] || 0);
      
      let buyerCommissionRate = 0;
      if (group === 'crop') {
        if (categoryTotal < 200001) buyerCommissionRate = 1.0;
        else if (categoryTotal < 600001) buyerCommissionRate = 1.8;
        else if (categoryTotal < 1000001) buyerCommissionRate = 2.5;
        else buyerCommissionRate = 3.0;
      } else if (group === 'fruitveg') {
        if (categoryTotal < 200001) buyerCommissionRate = 1.8;
        else if (categoryTotal < 600001) buyerCommissionRate = 2.4;
        else if (categoryTotal < 1000001) buyerCommissionRate = 3.0;
        else buyerCommissionRate = 3.8;
      } else if (group === 'masala') {
        if (categoryTotal < 200001) buyerCommissionRate = 2.4;
        else if (categoryTotal < 600001) buyerCommissionRate = 3.2;
        else if (categoryTotal < 1000001) buyerCommissionRate = 3.8;
        else buyerCommissionRate = 4.4;
      }
      
      let buyerCommissionAmt = round2((lineTotal * (buyerCommissionRate / 100)) || 0);
      if (!Number.isFinite(buyerCommissionAmt) || buyerCommissionAmt < 0) buyerCommissionAmt = 0;
      if (buyerCommissionAmt > 100000) buyerCommissionAmt = 100000;
      
      buyerCommission += buyerCommissionAmt;
      buyerGst += round2((buyerCommissionAmt * 18) / 100);
    });
    
    return { commission: round2(buyerCommission), gst: round2(buyerGst) };
  })();
  
  const grandTotal = Math.round((totals.subtotal - totals.commission - totals.gst + Number.EPSILON) * 100) / 100;
  const totalAvailableQty = items.reduce((s, it) => s + (Number(it.quantity_kg || 0) || 0), 0);
  const totalOrderedQty = items.reduce((s, it) => s + (Number(it.order_quantity || 0) || 0), 0);

  const buyer = {
    name: localStorage.getItem('agriai_name') || '',
    phone: localStorage.getItem('agriai_phone') || '',
    email: localStorage.getItem('agriai_email') || ''
  };

  const handleBuyNow = async (overridePaymentMethod = null) => {
    setPaymentError('');
    const methodToUse = overridePaymentMethod || paymentMethod;
    if (!methodToUse) {
      setPaymentError(t('selectPaymentMethod', siteLang));
      return;
    }
    const invalid = items.some(it => !it.order_quantity || Number(it.order_quantity) <= 0);
    if (invalid) {
      alert(t('editEnterOrderQty', siteLang));
      return;
    }
    try {
      const orderItems = items.map(it => {
        const qty = Number(it.order_quantity || 0);
        const price = Number(it.price_per_kg || 0);
        const lineTotal = Math.round((qty * price + Number.EPSILON) * 100) / 100;
        const { gstAmt, commissionAmt } = calculateGstAndCommission(it);
        const net = Math.round((lineTotal - commissionAmt - gstAmt + Number.EPSILON) * 100) / 100;
        return {
          id: it.id,
          crop_name: it.crop_name,
          category: it.category || it.cat || '',
          price_per_kg: price,
          order_quantity: qty,
          image_url: it.image_url || '',
          subtotal: lineTotal,
          gst: gstAmt,
          platform_fee: commissionAmt,
          total: net
        };
      });

      const summary = orderItems.reduce((acc, it) => {
        acc.subtotal += it.subtotal;
        acc.gst += it.gst;
        acc.platform_fee += it.platform_fee;
        return acc;
      }, { subtotal: 0, gst: 0, platform_fee: 0 });
      const grand_total = Math.round((summary.subtotal - summary.platform_fee - summary.gst + Number.EPSILON) * 100) / 100;

      const createdAt = new Date().toISOString();

      // DON'T create ORD... invoice_id yet - wait for contract to be saved to database
      // so we can use the actual contract_number from the contracts table
      
      let savedContractNumber = null; // Will store the contract_number returned from database

      // best-effort notify counterparties (reuse same endpoint)
      try {
        fetch(`${apiBase}/notifications/purchase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ buyer, items: orderItems.map(({ id, crop_name, order_quantity }) => ({ id, crop_name, order_quantity })) })
        }).catch(() => {});
      } catch (e) {}
      // If signed in and server rows exist, remove them on server
      try {
        const userRole = localStorage.getItem('agriai_role') || '';
        const userId = localStorage.getItem('agriai_id') || '';
        const userPhone = localStorage.getItem('agriai_phone') || '';
        const ids = items.map(it => it && it.cart_id).filter(x => !!x);
        if (userRole && (userId || userPhone) && ids.length) {
          try {
            await fetch(`${apiBase}/cart/remove`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, user_type: userRole, user_id: userId || undefined, user_phone: userPhone || undefined }) });
          } catch (e) { console.warn('cart/remove during checkout failed', e); }
        }
      } catch (e) { console.warn(e); }

      // Save contract(s) to database and reduce buyer crop quantities
      try {
        console.log('🔍 Starting contract save process...');
        console.log('📋 contractMetadata:', contractMetadata);
        console.log('📦 contractMetadata.crops:', contractMetadata?.crops);
        const failedSaves = [];
        
        // Use contractMetadata.crops if available, otherwise build from items
        const cropsToSave = (contractMetadata && contractMetadata.crops && Array.isArray(contractMetadata.crops)) 
          ? contractMetadata.crops
          : items.map(it => ({
              id: it.id,
              buyer_id: it.buyer_id,
              crop_name: it.crop_name,
              variety: it.variety || '',
              quantity: Number(it.order_quantity || 0),
              price_per_kg: Number(it.price_per_kg || 0),
              amount: Number(it.order_quantity || 0) * Number(it.price_per_kg || 0)
            }));
        
        if (cropsToSave && cropsToSave.length > 0) {
          console.log(`✅ Found ${cropsToSave.length} crops to save as contracts`);
          for (const crop of cropsToSave) {
            try {
              // Save contract to database
              const contractPayload = {
                contract_number: contractMetadata.contract_number,
                farmer_id: contractMetadata.farmer_id,
                farmer_name: contractMetadata.farmer_name,
                farmer_address: contractMetadata.farmer_address,
                farmer_state: contractMetadata.farmer_state,
                buyer_id: contractMetadata.buyer_id || crop.buyer_id,
                buyer_name: contractMetadata.buyer_name,
                buyer_address: contractMetadata.buyer_address,
                buyer_state: contractMetadata.buyer_state,
                crop_name: crop.crop_name,
                variety: crop.variety,
                quantity: crop.quantity,
                price_per_kg: crop.price_per_kg,
                amount: crop.amount,
                contract_nature: contractMetadata.contract_nature,
                contract_duration: contractMetadata.contract_duration,
                start_date: contractMetadata.start_date,
                end_date: contractMetadata.end_date,
                duration: contractMetadata.duration,
                farmer_platform_fee: contractMetadata.farmer_platform_fee,
                farmer_gst: contractMetadata.farmer_gst,
                buyer_platform_fee: contractMetadata.buyer_platform_fee,
                buyer_gst: contractMetadata.buyer_gst,
                // compute per-crop buyer_total and farmer_total
                buyer_total: (function() {
                  try {
                    const cropAmount = Number(crop.amount || 0);
                    const subtotal = (summary && summary.subtotal) ? Number(summary.subtotal || 0) : 0;
                    const buyerPlatformTotal = (contractMetadata.buyer_platform_fee != null) ? Number(contractMetadata.buyer_platform_fee) : (buyerTotals && buyerTotals.commission ? Number(buyerTotals.commission) : 0);
                    const buyerGstTotal = (contractMetadata.buyer_gst != null) ? Number(contractMetadata.buyer_gst) : (buyerTotals && buyerTotals.gst ? Number(buyerTotals.gst) : 0);
                    const share = (subtotal > 0) ? (cropAmount / subtotal) : 0;
                    const bf = Math.round((buyerPlatformTotal * share + Number.EPSILON) * 100) / 100;
                    const bg = Math.round((buyerGstTotal * share + Number.EPSILON) * 100) / 100;
                    return Math.round((cropAmount + bf + bg + Number.EPSILON) * 100) / 100;
                  } catch (e) { return null; }
                })(),
                farmer_total: (function() {
                  try {
                    const cropAmount = Number(crop.amount || 0);
                    // try to find matching orderItem (has platform_fee and gst)
                    const match = (orderItems || []).find(it => (it.crop_name === crop.crop_name && Number(it.order_quantity || 0) === Number(crop.quantity || 0)));
                    const fpf = match ? Number(match.platform_fee || 0) : Number(contractMetadata.farmer_platform_fee || 0);
                    const fg = match ? Number(match.gst || 0) : Number(contractMetadata.farmer_gst || 0);
                    return Math.round((cropAmount - fpf - fg + Number.EPSILON) * 100) / 100;
                  } catch (e) { return null; }
                })(),
                delivery_cost: contractMetadata.delivery_cost,
                // Status and Signature Method/Timestamp (set after OTP verification)
                ...(digitalSignature ? {
                  status: 'pending',
                  signature_method: digitalSignature.signature_method,
                  signature_timestamp: digitalSignature.signature_timestamp
                } : {
                  status: 'pending'
                })
              };              
              let saveRes = null;
              try {
                console.log('📤 Sending contract payload for:', crop.crop_name);
                saveRes = await fetch(`${apiBase}/contracts/save`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(contractPayload)
                });
                console.log('📨 Response status:', saveRes.status, saveRes.statusText);
                const text = await (saveRes.text ? saveRes.text() : Promise.resolve(null)).catch(() => null);
                let bodyJson = null;
                try { bodyJson = text ? JSON.parse(text) : null; } catch (e) { 
                  console.warn('   Could not parse response as JSON:', text?.substring(0, 200));
                }
                if (saveRes && saveRes.ok) {
                  console.log('✅ Contract saved successfully', bodyJson || text || saveRes.status);
                  // IMPORTANT: Capture contract_number from database response
                  if (bodyJson && bodyJson.contract_number && !savedContractNumber) {
                    savedContractNumber = bodyJson.contract_number;
                    console.log('📌 Using contract_number from database:', savedContractNumber);
                  }
                } else {
                  console.warn('❌ Failed to save contract for crop:', crop.crop_name);
                  console.warn('   Status:', saveRes ? saveRes.status : 'no-response');
                  console.warn('   Error response:', bodyJson || text);
                  console.warn('   Payload sent:', JSON.stringify(contractPayload, null, 2));
                  failedSaves.push({ payload: contractPayload, status: saveRes ? saveRes.status : 'no-response', body: bodyJson || text });
                }
              } catch (e) {
                console.warn('❌ Error saving contract (fetch failed):', e);
                failedSaves.push({ payload: contractPayload, status: 'fetch-error', body: String(e) });
              }
            } catch (e) {
              console.warn('Error saving contract:', e);
            }

            // Reduce buyer crop quantity
            try {
              if (crop.buyer_id) {
                const reduceRes = await fetch(`${apiBase}/deals/reduce-quantity`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    deal_id: crop.id,
                    quantity_to_reduce: crop.quantity
                  })
                });
                
                if (reduceRes && reduceRes.ok) {
                  console.log('Buyer crop quantity reduced successfully');
                } else {
                  console.warn('Failed to reduce buyer crop quantity:', reduceRes?.status);
                }
              }
            } catch (e) {
              console.warn('Error reducing buyer crop quantity:', e);
            }
          }
        } else {
          console.warn('⚠️ No crops found to save as contracts. contractMetadata:', contractMetadata, 'items:', items);
        }
        if (failedSaves.length) {
          console.warn('Some contract rows failed to save:', failedSaves);
          // Build detailed error message for user
          let errorMsg = `${failedSaves.length} contract row(s) failed to save:\n\n`;
          failedSaves.forEach((fail, idx) => {
            const crop = fail.payload?.crop_name || 'Unknown';
            const status = fail.status || 'unknown';
            const errorDetail = (fail.body && typeof fail.body === 'string' && fail.body.includes('error')) 
              ? fail.body.substring(0, 100) 
              : (fail.body?.error || fail.body?.message || '');
            errorMsg += `${idx + 1}. ${crop}\n   Status: ${status}\n   Error: ${errorDetail || 'Server returned no error message'}\n\n`;
          });
          console.error('📋 Failed saves full details:\n', failedSaves);
          try { alert(errorMsg + 'Please check console for full details.'); } catch (e) {}
        }
      } catch (e) {
        console.warn('Error processing contracts/quantities:', e);
      }

      // NOW save order to localStorage AFTER contracts are successfully saved to database
      // Use the contract_number from the database (CNT...) instead of local ORD... number
      try {
        const contractNumberToUse = savedContractNumber || contractMetadata.contract_number || ('CNT' + Date.now());
        console.log('📝 Saving order to history with contract_number:', contractNumberToUse);
        
        // derive buyer fee and payable total so they can be stored in the history record
        const buyerFeeTotal = (contractMetadata && (contractMetadata.buyer_platform_fee || contractMetadata.buyer_platform_fee === 0)) ? (contractMetadata.buyer_platform_fee || 0) + (contractMetadata.buyer_gst || 0) : ((summary && summary.platform_fee) ? summary.platform_fee : 0);
        const buyerPayable = (summary && summary.subtotal != null ? summary.subtotal : 0) + (typeof buyerFeeTotal === 'number' ? buyerFeeTotal : 0);

        // record to save in both farmer and buyer history
        const orderRecord = {
          contract_number: contractNumberToUse,
          invoice_id: contractNumberToUse,
          created_at: createdAt,
          payment_method: 'contract',
          buyer,
          items: orderItems,
          // totals reflect buyer payable amount (subtotal + buyer fees)
          totals: {
            subtotal: summary.subtotal,
            platform_fee: buyerFeeTotal,
            gst: 0,
            grand_total: buyerPayable
          }
        };
        
        const rawHistFarmer = localStorage.getItem('agriai_history_farmer');
        const histFarmer = rawHistFarmer ? JSON.parse(rawHistFarmer) : [];
        const nextHistFarmer = [orderRecord, ...(Array.isArray(histFarmer) ? histFarmer : [])];
        localStorage.setItem('agriai_history_farmer', JSON.stringify(nextHistFarmer));
        console.log('✓ Order saved to farmer history with database contract_number');

        // ALSO add this record to buyer history so that the buyer sees it when logged in
        try {
          const rawHistBuyer = localStorage.getItem('agriai_history');
          const histBuyer = rawHistBuyer ? JSON.parse(rawHistBuyer) : [];
          const nextHistBuyer = [orderRecord, ...(Array.isArray(histBuyer) ? histBuyer : [])];
          localStorage.setItem('agriai_history', JSON.stringify(nextHistBuyer));
          console.log('✓ Order saved to buyer history (local storage)');
        } catch (e) {
          console.warn('Failed to add order to buyer history', e);
        }

        // send a server-side notification for the buyer so it appears in navbar
        try {
          // derive buyer fee and payable total for display/notification
          const buyerFeeTotal = (contractMetadata.buyer_platform_fee || 0) + (contractMetadata.buyer_gst || 0);
          const buyerPayable = (summary && summary.subtotal != null ? summary.subtotal : 0) + buyerFeeTotal;
          const notifPayload = {
            notif_type: 'contract',
            buyer_id: orderRecord.buyer && orderRecord.buyer.id,
            buyer_email: orderRecord.buyer && orderRecord.buyer.email,
            buyer_name: orderRecord.buyer && orderRecord.buyer.name,
            farmer_id: contractMetadata.farmer_id,
            farmer_name: contractMetadata.farmer_name,
            contract_number: contractNumberToUse,
            contract_meta: contractMetadata,
            items: orderItems,
            buyer_fee_total: buyerFeeTotal,
            total_amount_payable: buyerPayable
          };
          fetch(`${apiBase}/notifications/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notifPayload)
          }).catch(() => {});
          console.log('✓ Buyer notification posted to server');

          // Also persist locally so buyer sees it immediately in navbar notifications
          try {
            const localKey = 'agriai_notifications';
            const rawLocal = localStorage.getItem(localKey);
            const localArr = rawLocal ? JSON.parse(rawLocal) : [];
            const entry = { ...notifPayload, is_read: 0, id: (`local-${Date.now()}`) };
            localArr.unshift(entry);
            localStorage.setItem(localKey, JSON.stringify(localArr));
            // notify navbar to refresh
            try { window.dispatchEvent(new Event('agriai:notifications:local:update')); } catch (e) {}
          } catch (e) {}
        } catch (e) {
          console.warn('Failed to post buyer notification', e);
        }
      } catch (e) {
        console.warn('Warning: Failed to save order to localStorage:', e);
      }

      // clear cart locally
      localStorage.setItem('agriai_cart_farmer', JSON.stringify([]));
      setItems([]);
      try { window.dispatchEvent(new Event('agriai:cart:update')); } catch (e) {}
      // navigate optionally
      setTimeout(() => { window.location.href = '/farmer/history'; }, 100);
    } catch (e) {
      console.error('FarmerCart checkout failed', e);
      alert(t('purchaseFailed', siteLang));
    }
  };
   const generateContract = async (isOtpVerified = false) => {
    try {
      // Use the isOtpVerified parameter (for regeneration after OTP) or the state value
      const otpVerificationStatus = isOtpVerified || otpVerified;
      
      // pick up the current language from localStorage (ignore state latency)
      const lang = localStorage.getItem('agri_lang') || 'en';
      const langName = lang === 'en' ? 'English' : (lang === 'hi' ? 'हिंदी' : (lang === 'kn' ? 'ಕನ್ನಡ' : 'English'));
      console.log('generateContract language', lang);

      // Get current signed-in user's info
      const userRole = localStorage.getItem('agriai_role') || ''; // 'farmer' or 'buyer'
      const signedInUserName = localStorage.getItem('agriai_name') || '';
      console.log('Current user role:', userRole, 'Name:', signedInUserName);

      // Attempt to obtain buyer and farmer details from localStorage / items
      let farmerName = localStorage.getItem('agriai_name') || '';
      let farmerEmail = localStorage.getItem('agriai_email') || '';
      let farmerAddress = localStorage.getItem('agriai_address') || '';
      let farmerId = localStorage.getItem('agriai_id') || '';
      let farmerState = '';
      let farmerRegion = '';

      // Helper: try multiple possible localStorage keys for buyer/farmer fields
      const fetchFirst = (keys, fallback) => {
        for (let k of keys) {
          try {
            const v = localStorage.getItem(k);
            if (v && v.toString().trim()) return v.toString().trim();
          } catch (e) { continue; }
        }
        return fallback;
      };

      // Buye
      // r info: check a list of commonly-used keys, then fall back to placeholders
      let buyerName = fetchFirst(['contract_buyer_name', 'agriai_buyer_name', 'buyer_name', 'selected_buyer_name'], '[Buyer Name]');
      let buyerEmail = fetchFirst(['contract_buyer_email', 'agriai_buyer_email', 'buyer_email', 'selected_buyer_email'], '[Buyer Email]');
      let buyerAddress = fetchFirst(['contract_buyer_address', 'agriai_buyer_address', 'buyer_address', 'selected_buyer_address'], '[Buyer Address]');
      const buyerIdFromStorage = fetchFirst(['contract_buyer_id', 'agriai_buyer_id', 'buyer_id', 'selected_buyer_id'], '');
      let buyerId = buyerIdFromStorage || '';
      let buyerState = fetchFirst(['contract_buyer_state', 'agriai_buyer_state', 'buyer_state', 'selected_buyer_state'], '');
      let buyerRegion = fetchFirst(['contract_buyer_region', 'agriai_buyer_region', 'buyer_region', 'selected_buyer_region'], '');

      // Try to fetch authoritative farmer profile (state/region/address) from backend
      try {
        const farmPhone = localStorage.getItem('agriai_phone') || '';
        const farmEmail = localStorage.getItem('agriai_email') || '';
        if (farmPhone || farmEmail) {
          const res = await fetch(`${apiBase}/profile/get`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: farmPhone || undefined, email: farmEmail || undefined }) });
          if (res && res.ok) {
            const j = await res.json().catch(() => null);
            if (j && j.user) {
              farmerName = j.user.name || farmerName;
              farmerEmail = j.user.email || farmerEmail;
              farmerAddress = j.user.address || farmerAddress;
              farmerId = (j.user.id != null && j.user.id !== '') ? String(j.user.id) : farmerId;
              farmerState = j.user.state || '';
              farmerRegion = j.user.region || '';
            }
          }
        }
      } catch (e) {
        console.warn('profile/get failed', e);
      }

      // Prefer buyer id from cart items; fall back to storage keys. If we have a buyer id,
      // fetch authoritative buyer details from backend `/buyer/get?id=...`.
      try {
        const buyerIdFromItems = (items && Array.isArray(items) && items.find(it => it && it.buyer_id)) ? String(items.find(it => it && it.buyer_id).buyer_id) : '';
        const resolvedBuyerId = buyerIdFromItems || buyerIdFromStorage || '';
        if (resolvedBuyerId) {
          try {
            const resB = await fetch(`${apiBase}/buyer/get?id=${encodeURIComponent(resolvedBuyerId)}`);
            if (resB && resB.ok) {
              const jb = await resB.json().catch(() => null);
              if (jb && jb.ok && jb.buyer) {
                buyerId = jb.buyer.id ? String(jb.buyer.id) : (buyerId || '');
                if (jb.buyer.name) buyerName = jb.buyer.name;
                if (jb.buyer.email) buyerEmail = jb.buyer.email;
                if (jb.buyer.address) buyerAddress = jb.buyer.address;
                buyerState = jb.buyer.state || buyerState || '';
                buyerRegion = jb.buyer.region || buyerRegion || '';
              }
            }
          } catch (e) {
            console.warn('buyer/get failed', e);
          }
        }
      } catch (e) {
        console.warn('buyer lookup failed', e);
      }

      const startDate = new Date().toLocaleDateString('en-GB');
      let endDate = null;
      let days = contractDuration === 'one-time' ? 30 : (contractDuration === 'seasonal' ? 90 : 365);
      if (contractNature === 'pre-harvest') days = 120;
      if (contractNature === 'post-harvest' && contractDuration === 'one-time') days = 45;
      
      // Try to fetch delivery date from crop metadata first
      try {
        const firstCropId = (items && items.length && items[0] && items[0].id) ? items[0].id : null;
        if (firstCropId) {
          // Fetch from crop details endpoint
          const cropRes = await fetch(`${apiBase}/crops/${encodeURIComponent(firstCropId)}`);
          if (cropRes && cropRes.ok) {
            const cropData = await cropRes.json().catch(() => null);
            if (cropData && cropData.ok && cropData.crop) {
              const cropDeliveryDate = cropData.crop.delivery_date || cropData.crop.deliveryDate || null;
              if (cropDeliveryDate) {
                const deliveryDateObj = new Date(cropDeliveryDate);
                if (!isNaN(deliveryDateObj.getTime())) {
                  endDate = deliveryDateObj.toLocaleDateString('en-GB');
                  // Calculate days between start and end date
                  const startDateObj = new Date();
                  startDateObj.setHours(0, 0, 0, 0);
                  const endDateObj = new Date(deliveryDateObj);
                  endDateObj.setHours(0, 0, 0, 0);
                  const diffMs = endDateObj.getTime() - startDateObj.getTime();
                  const calculatedDays = Math.ceil(diffMs / (24 * 3600 * 1000));
                  if (Number.isFinite(calculatedDays) && calculatedDays > 0) {
                    days = calculatedDays;
                  }
                  console.log('Delivery date fetched from crop metadata:', endDate, 'Days:', days);
                  return; // Exit early if we found the date
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn('Failed to fetch delivery date from crop metadata, trying deals table', e);
      }
      
      // Fallback: Fetch delivery date from deals table if not found in crop metadata
      try {
        const firstCropId = (items && items.length && items[0] && items[0].id) ? items[0].id : null;
        if (firstCropId && !endDate) {
          const dealsRes = await fetch(`${apiBase}/deals/list?crop_id=${encodeURIComponent(firstCropId)}`);
          if (dealsRes && dealsRes.ok) {
            const dealsData = await dealsRes.json().catch(() => null);
            if (dealsData && dealsData.ok && Array.isArray(dealsData.deals) && dealsData.deals.length) {
              const mostRecentDeal = dealsData.deals[0]; // Assumes API returns deals ordered by date
              if (mostRecentDeal && mostRecentDeal.delivery_date) {
                const deliveryDateObj = new Date(mostRecentDeal.delivery_date);
                if (!isNaN(deliveryDateObj.getTime())) {
                  endDate = deliveryDateObj.toLocaleDateString('en-GB');
                  // Calculate days between start and end date
                  const startDateObj = new Date();
                  startDateObj.setHours(0, 0, 0, 0);
                  const endDateObj = new Date(deliveryDateObj);
                  endDateObj.setHours(0, 0, 0, 0);
                  const diffMs = endDateObj.getTime() - startDateObj.getTime();
                  const calculatedDays = Math.ceil(diffMs / (24 * 3600 * 1000));
                  if (Number.isFinite(calculatedDays) && calculatedDays > 0) {
                    days = calculatedDays;
                  }
                  console.log('Delivery date fetched from deals table:', endDate, 'Days:', days);
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn('Failed to fetch delivery date from deals table', e);
      }
      
      // Fallback: use default calculated end date if not fetched from either source
      if (!endDate) {
        endDate = new Date(Date.now() + days * 24 * 3600 * 1000).toLocaleDateString('en-GB');
        console.log('Using default calculated end date:', endDate, 'Days:', days);
      }
      
      // Calculate pricing information for section 5.1
      const totalContractQty = items.reduce((sum, it) => sum + (Number(it.order_quantity || 0) || 0), 0);
      const totalCropTradeValue = items.reduce((sum, it) => {
        const qty = Number(it.order_quantity || 0) || 0;
        const price = Number(it.price_per_kg || 0) || 0;
        return sum + (qty * price);
      }, 0);
      const avgPricePerKg = totalContractQty > 0 ? (totalCropTradeValue / totalContractQty) : 0;
      
      // Calculate platform fee and GST for the contract
      const round2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;
      let totalPlatformFee = 0;
      let totalGst = 0;
      items.forEach(it => {
        const { gstAmt, commissionAmt } = calculateGstAndCommission(it);
        totalPlatformFee += commissionAmt;
        totalGst += gstAmt;
      });
      totalPlatformFee = round2(totalPlatformFee);
      totalGst = round2(totalGst);
      const totalAmountInvoice = round2(totalCropTradeValue - totalPlatformFee - totalGst);
      
      // Calculate buyer platform fee and GST with buyer-specific commission rates
      const getGroupFromItem = (it) => {
        const fields = [it && it.category, it && it.cat, it && it._category, it && it.category_name, it && it.categoryName, it && it.tags, it && it.tag].filter(Boolean).join(' ');
        const catRaw = (fields || (it && it.crop_name) || '').toString().trim().toLowerCase();
        const name = (it && it.crop_name || '').toString().toLowerCase();
        const exact = (it && (it.category || it.cat) || '').toString().trim().toLowerCase();
        if (exact === 'food crops' || exact === 'food crop' || exact === 'food' || exact === 'crops') return 'crop';
        if (exact === 'fruits and vegetables' || exact === 'fruits & vegetables' || exact === 'fruits' || exact === 'fruits and veg') return 'fruitveg';
        if (exact === 'masalas' || exact === 'masala' || exact === 'spices' || exact === 'spice') return 'masala';
        const masalaKeywords = ['masala', 'masalas', 'spice', 'spices', 'मसाला', 'ಮಸಾಲೆ'];
        const fruitKeywords = ['fruit', 'fruits', 'फल', 'ಹಣ್ಣು'];
        const vegKeywords = ['vegetable', 'vegetables', 'veg', 'veggie', 'veget', 'सब्जी', 'ತರಕಾರಿ'];
        const hasAny = (str, arr) => arr.some(k => str.includes(k));
        if (hasAny(catRaw, masalaKeywords) || hasAny(name, masalaKeywords)) return 'masala';
        if (hasAny(catRaw, fruitKeywords) || hasAny(name, fruitKeywords) || hasAny(catRaw, vegKeywords) || hasAny(name, vegKeywords)) return 'fruitveg';
        if (hasAny(catRaw, ['crop', 'crops', 'food'])) return 'crop';
        return 'crop';
      };
      
      let buyerPlatformFee = 0;
      let buyerGst = 0;
      items.forEach(it => {
        const qty = Number(it.order_quantity || 0) || 0;
        const price = Number(it.price_per_kg || 0) || 0;
        const lineTotal = round2(qty * price);
        
        // Calculate category totals for buyer rates
        const categoryTotals = items.reduce((acc, itm) => {
          try {
            const q = Number(itm.order_quantity || 0) || 0;
            const p = Number(itm.price_per_kg || 0) || 0;
            const line = round2(q * p);
            const g = getGroupFromItem(itm);
            acc[g] = (acc[g] || 0) + line;
          } catch (e) {}
          return acc;
        }, { crop: 0, fruitveg: 0, masala: 0 });
        
        const group = getGroupFromItem(it);
        const categoryTotal = round2(categoryTotals[group] || 0);
        
        // Buyer-specific tiered commission rates
        let buyerCommissionRate = 0;
        if (group === 'crop') {
          if (categoryTotal < 200001) buyerCommissionRate = 2.0;
          else if (categoryTotal < 600001) buyerCommissionRate = 2.5;
          else if (categoryTotal < 1000001) buyerCommissionRate = 3.0;
          else buyerCommissionRate = 3.4;
        } else if (group === 'fruitveg') {
          if (categoryTotal < 200001) buyerCommissionRate = 2.5;
          else if (categoryTotal < 600001) buyerCommissionRate = 3.0;
          else if (categoryTotal < 1000001) buyerCommissionRate = 3.4;
          else buyerCommissionRate = 4.0;
        } else if (group === 'masala') {
          if (categoryTotal < 200001) buyerCommissionRate = 3.0;
          else if (categoryTotal < 600001) buyerCommissionRate = 3.4;
          else if (categoryTotal < 1000001) buyerCommissionRate = 4.0;
          else buyerCommissionRate = 4.4;
        }
        
        let buyerCommissionAmt = round2((lineTotal * (buyerCommissionRate / 100)) || 0);
        if (!Number.isFinite(buyerCommissionAmt) || buyerCommissionAmt < 0) buyerCommissionAmt = 0;
        if (buyerCommissionAmt > 100000) buyerCommissionAmt = 100000;
        
        const buyerGstAmt = round2((buyerCommissionAmt * 18) / 100);
        buyerPlatformFee += buyerCommissionAmt;
        buyerGst += buyerGstAmt;
      });
      buyerPlatformFee = round2(buyerPlatformFee);
      buyerGst = round2(buyerGst);
      const buyerTotalAmount = round2(totalCropTradeValue + buyerPlatformFee + buyerGst);
      
      // Calculate delivery rate display
      const qtyKg = Math.round(totalContractQty || 0);
      const qtyRateMap = [
        { min: 0, max: 40, rates: [12, 18, 22] },
        { min: 41, max: 400, rates: [18, 22, 28] },
        { min: 401, max: 1500, rates: [22, 28, 35] },
        { min: 1501, max: 5000, rates: [28, 35, 45] },
        { min: 5001, max: 10000, rates: [35, 45, 60] }
      ];
      let matching = qtyRateMap.find(r => qtyKg >= r.min && qtyKg <= r.max);
      if (!matching) matching = qtyRateMap[qtyRateMap.length - 1];
      const formatRates = (arr) => {
        const parts = (arr || []).map(v => `₹${v} / km`);
        if (parts.length === 0) return '₹-- / km';
        if (parts.length === 1) return parts[0];
        if (parts.length === 2) return `${parts[0]} or ${parts[1]}`;
        return `${parts.slice(0, -1).join(', ')} or ${parts[parts.length - 1]}`;
      };
      const deliveryRateDisplay = `${formatRates(matching.rates)}`;
      
      // Build commodity rows from items (separate from the big template to avoid nested template parsing issues)
      const rowsHtml = (items || []).map((it, idx) => {
        const qty = Number(it.order_quantity || 0) || 0;
        const price = Number(it.price_per_kg || 0) || 0;
        const amount = qty * price;
        const variety = it.variety || it.crop_variety || it.var || '';
        return `<tr>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${idx + 1}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${it.crop_name || ''}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${variety}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${qty.toLocaleString('en-IN')} kg</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">₹${price.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">₹${amount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        </tr>`;
        }).join('');
      const rowsPlaceholder = rowsHtml && rowsHtml.trim() ? rowsHtml : `<tr><td colspan="6" style="padding:8px;border:1px solid #ddd;text-align:center">${t('noItems', siteLang)}</td></tr>`;
      
      // Hindi contract HTML
      const htmlHi = `<!doctype html>
      <html>
<head>
  <meta charset="utf-8" />
  <title>AgriAI Contract</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      color: #1a1a1a;
      line-height: 1.8;
      background: #fff;
    }
    .header {
      text-align: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 3px solid #236902;
    }
    .header img {
      width: 80px;
      height: auto;
      margin: 0 auto 16px auto;
      display: block;
    }
    h1 {
      text-align: center;
      color: #236902;
      margin: 8px 0;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    h2 {
      color: #1a5c10;
      margin: 12px 0 8px 0;
      font-size: 18px;
      font-weight: 700;
      padding-bottom: 8px;
      border-bottom: 2px solid #e0e0e0;
    }
    h3 {
      color: #236902;
      margin: 10px 0 6px 0;
      font-size: 15px;
      font-weight: 700;
    }
    p {
      margin: 6px 0;
      text-align: justify;
      font-size: 14px;
    }
    .section {
      margin: 12px 0;
      padding: 8px 0;
    }
    ul {
      margin: 6px 0 6px 24px;
      font-size: 14px;
      list-style-type: disc;
    }
    li {
      margin: 3px 0;
      list-style-type: disc;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      background: #fff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    th {
      background: #236902;
      color: #fff;
      padding: 12px 8px;
      text-align: center;
      font-weight: 700;
      font-size: 13px;
      border: 1px solid #ddd;
    }
    td {
      padding: 10px 8px;
      border: 1px solid #ddd;
      text-align: center;
      font-size: 13px;
    }
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    tr:hover {
      background: #f0f7ff;
    }
    strong {
      font-weight: 700;
      color: #1a5c10;
    }
    .party-section {
      background: #f5f9f5;
      padding: 12px;
      border-left: 4px solid #236902;
      margin: 8px 0;
      border-radius: 4px;
    }
    .signature-section {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 2px solid #ddd;
      display: flex;
      justify-content: space-around;
      gap: 32px;
    }
    .signature-line {
      text-align: center;
      width: 200px;
    }
    .signature-line p {
      margin: 4px 0;
      font-size: 15px;
    }
    .signature-line .line {
      border-top: 1px solid #000;
      margin: 24px 0 4px 0;
      min-height: 20px;
    }
    @media print {
      body {
        padding: 0;
      }
      .section {
        page-break-inside: avoid;
      }
      h2 {
        page-break-after: avoid;
      }
    }
  </style>
</head>
<body>
<div class="header">
  <img src="${logo192}" alt="AgriAI" />
  <h1>एग्रीएआई कृषि समझौता</h1></div>

  <section class="section">
  <h2>अनुबंध के पक्षकार</h2>
  <div class="party-section">
    <p><strong>पक्ष A – खरीदार / कंपनी</strong></p>
    <p><b>नाम:</b> ${buyerName}</p>
    <p><b>खरीदार आईडी:</b> ${buyerId || '[Buyer ID]'}</p>
    <p><b>पता:</b> ${buyerAddress || '[Buyer Address]'}, ${buyerState || '[Buyer State]'}</p>
  </div>

  <div class="party-section">
    <p><strong>पक्ष B – किसान / उत्पादक</strong></p>
    <p><b>नाम:</b> ${farmerName}</p>
    <p><b>किसान आईडी:</b> ${farmerId}</p>
    <p><b>पता:</b> ${farmerAddress ? farmerAddress : ''}${farmerState ? (farmerAddress ? ', ' + farmerState : farmerState) : ''}</p>
  </div>

  <p>
     पक्ष A और पक्ष B को सामूहिक रूप से “पक्षकार” कहा जाएगा।
     AgriAI केवल एक डिजिटल सुविधा मंच के रूप में कार्य करता है और किसी भी पक्ष का खरीदार, विक्रेता, परिवहनकर्ता, बीमाकर्ता या प्रतिनिधि नहीं है।
  </p>
</section>

  <section class="section">
    <h2>1. समझौते का उद्देश्य</h2>
    <p>
      यह समझौता उन नियमों और शर्तों को परिभाषित करता है जिनके अंतर्गत किसान
      कृषि उत्पाद का उत्पादन और आपूर्ति करने के लिए सहमत होता है,
      तथा खरीदार पूर्व-निर्धारित मूल्य पर ऐसे उत्पाद को खरीदने के लिए सहमत होता है,
      जिससे सुनिश्चित होता है:
    </p>
    <ul>
      <li>किसान के लिए सुनिश्चित बाजार उपलब्धता</li>
      <li>निष्पक्ष और पारदर्शी मूल्य निर्धारण</li>
      <li>समय पर और सुरक्षित भुगतान</li>
      <li>बिचौलियों पर निर्भरता में कमी</li>
    </ul>
</section>

  <section class="section">
    <h2>2. अनुबंध का प्रकार एवं अवधि</h2>
    <p><b>अनुबंध का स्वरूप:</b> ${contractNature === 'pre-harvest' ? 'पूर्व-फसल उत्पादन अनुबंध' : 'फसल कटाई के बाद क्रय अनुबंध'}</p>
    <p><b>अनुबंध अवधि:</b> ${contractDuration === 'one-time' ? 'एक बार' : (contractDuration === 'seasonal' ? 'मौसमी' : 'वार्षिक')}</p>
    <p><b>प्रारंभ तिथि:</b> ${startDate}</p>
    <p><b>समाप्ति तिथि:</b> ${endDate}</p>
    <p><b>अवधि:</b> ${days} दिन</p>
    <p>
      इस फसल कटाई के बाद क्रय अनुबंध के अंतर्गत, उत्पाद पहले ही इस समझौते के निष्पादन से पूर्व उगाया या काटा जा चुका है। इस अनुबंध के तहत कोई भी खेती संबंधी दायित्व उत्पन्न नहीं होता।
    </p>

    <h3>2.1 अनुबंध स्वीकृति एवं वार्ता अवधि</h3>
    <p>
      यह क्रय अनुबंध किसान द्वारा AgriAI प्लेटफ़ॉर्म के माध्यम से खरीदार को डिजिटल रूप से भेजे जाने के समय से अड़तालीस (48) घंटों की अवधि तक स्वीकृति हेतु वैध रहेगा।
    </p>
    <p>
      इस 48 घंटे की अवधि के भीतर, खरीदार को प्लेटफ़ॉर्म के माध्यम से निम्न में से एक कार्रवाई करनी होगी:
    </p>
    <ul>
      <li>अनुबंध को वर्तमान रूप में स्वीकार करें; या</li>
      <li>अनुबंध को अस्वीकार करें; या</li>
      <li>वार्ता (नेगोशिएशन) का अनुरोध करें।</li>
    </ul>
    <p>
      यदि खरीदार 48 घंटे की वैधता अवधि के भीतर कोई कार्रवाई नहीं करता है, तो अनुबंध स्वतः समाप्त हो जाएगा और किसी भी पक्ष पर इसका कोई कानूनी या बाध्यकारी प्रभाव नहीं होगा।
    </p>
    <p>
      मूल्य वार्ता का कोई भी अनुरोध समय-सीमित होगा और वार्ता शुरू होने के समय से अड़तालीस (48) घंटों के भीतर पूरा किया जाना चाहिए। यदि इस अवधि के भीतर कोई सहमति नहीं बनती है, तो वार्ता स्वतः समाप्त हो जाएगी और अनुबंध रद्द माना जाएगा।
    </p>
</section>

  <section class="section">
    <h2>3. डेटा गोपनीयता एवं प्लेटफ़ॉर्म अनुपालन</h2>
    <p>
      AgriAI प्लेटफ़ॉर्म के माध्यम से एकत्रित सभी व्यक्तिगत, कृषि एवं लेन-देन संबंधी डेटा:
    </p>
    <ul>
      <li>सुरक्षित रूप से संग्रहीत किया जाएगा</li>
      <li>अनुबंध के निष्पादन एवं नवीनीकरण हेतु उपयोग किया जाएगा</li>
      <li>भुगतान निपटान के लिए उपयोग किया जाएगा</li>
      <li>बीमा सुविधा प्रदान करने के लिए उपयोग किया जाएगा</li>
      <li>कानूनी एवं नियामक अनुपालन सुनिश्चित करने के लिए उपयोग किया जाएगा</li>
    </ul>
    <p>
      यह समझौता डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 के पूर्णतः अनुरूप है।
    </p>
</section>

  <section class="section">
    <h2>4. वस्तु विवरण</h2>
    <table>
      <thead>
        <tr>
          <th>क्रम संख्या</th>
          <th>फसल का नाम</th>
          <th>प्रकार</th>
          <th>मात्रा (किग्रा)</th>
          <th>मूल्य (₹/किग्रा)</th>
          <th>कुल राशि (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
</section>

  <section class="section">
    <h2>5. मूल्य एवं भुगतान की शर्तें</h2>
    
    <h3>5.1 किसान की भुगतान संरचना</h3>
    <p><b>कुल मात्रा:</b> ${totalContractQty.toLocaleString('en-IN')} किग्रा</p>
    <p><b>प्रति इकाई मूल्य:</b> ${formatCurrency(avgPricePerKg)} प्रति किग्रा</p>
    <p><b>उप-योग:</b> ${formatCurrency(totalCropTradeValue)}</p>
    <p><b>प्लेटफ़ॉर्म शुल्क:</b> ${formatCurrency(totalPlatformFee)}</p>
    <p><b>जीएसटी (18%):</b> ${formatCurrency(totalGst)}</p>
    <p><b style="font-size: 16px; color: #236902;">कुल राशि (कटौती के बाद):</b> <b style="font-size: 16px; color: #236902;">${formatCurrency(totalAmountInvoice)}</b></p>

    <h3 style="margin-top: 20px;">5.2 खरीदार की भुगतान संरचना</h3>
    <p><b>कुल मात्रा:</b> ${totalContractQty.toLocaleString('en-IN')} किग्रा</p>
    <p><b>प्रति इकाई मूल्य:</b> ${formatCurrency(avgPricePerKg)} प्रति किग्रा</p>
    <p><b>उप-योग:</b> ${formatCurrency(totalCropTradeValue)}</p>
    <p><b>प्लेटफ़ॉर्म शुल्क:</b> ${formatCurrency(buyerPlatformFee)}</p>
    <p><b>जीएसटी (18%):</b> ${formatCurrency(buyerGst)}</p>
    <p><b style="font-size: 16px; color: #236902;">देय कुल राशि:</b> <b style="font-size: 16px; color: #236902;">${formatCurrency(buyerTotalAmount)}</b></p>

    <h3 style="margin-top: 20px;">5.3 भुगतान अनुसूची</h3>
    <ul>
      <li><b>अग्रिम (25%):</b> ${formatCurrency(totalCropTradeValue * 0.25)} – अनुबंध की पुष्टि पर देय</li>
      <li><b>डिलीवरी के समय (50%):</b> ${formatCurrency(totalCropTradeValue * 0.50)} – सफल डिलीवरी पर देय</li>
      <li><b>अंतिम (25%):</b> ${formatCurrency(totalCropTradeValue * 0.25)} – गुणवत्ता स्वीकृति के 7 कार्य दिवसों के भीतर देय</li>
    </ul>

    <h3 style="margin-top: 20px;">5.4 भुगतान का तरीका</h3>
    <p>बैंक ट्रांसफर / यूपीआई / चेक</p>
    <p>इस समझौते के तहत किए गए सभी भुगतानों के लिए खरीदार डिजिटल या भौतिक रसीद जारी करेगा।</p>
</section>

  <section class="section">
    <h2>6. डिलीवरी, लॉजिस्टिक्स एवं परिवहन</h2>

    <h3>6.1 AgriAI की भूमिका</h3>
    <p>
    AgriAI केवल एक डिजिटल तकनीकी प्लेटफ़ॉर्म के रूप में कार्य करता है, जो खरीदारों और किसानों के बीच लेन-देन को सुगम बनाता है।
    AgriAI को किसी भी स्थिति में खरीदार, विक्रेता, व्यापारी, कमीशन एजेंट, परिवहनकर्ता या वस्तुओं के संरक्षक के रूप में नहीं माना जाएगा।
    बिक्री और खरीद से संबंधित सभी दायित्व पूरी तरह से पक्षकारों के बीच ही रहेंगे।
    </p>
    
    <h3>6.2 परिवहन</h3>
    <p>
    परिवहन AgriAI प्लेटफ़ॉर्म पर उपलब्ध या स्वीकृत तृतीय-पक्ष लॉजिस्टिक्स सेवा प्रदाताओं के माध्यम से किया जाएगा।
    लॉजिस्टिक्स प्रदाता और वाहन के प्रकार का चयन फसल के प्रकार, मात्रा, दूरी और हैंडलिंग आवश्यकताओं के आधार पर किया जाएगा।
    </p>

    <h3>6.3 डिलीवरी शुल्क</h3>
    <p>
    डिलीवरी शुल्क तृतीय-पक्ष लॉजिस्टिक्स प्रदाता द्वारा वास्तविक दूरी, वाहन के प्रकार, लोडिंग आवश्यकताओं और स्थान के आधार पर निर्धारित किया जाएगा।
    ये शुल्क सीधे खरीदार द्वारा लॉजिस्टिक्स प्रदाता को भुगतान किए जाएंगे।
    AgriAI डिलीवरी मूल्य निर्धारण तय करने या उस पर बातचीत करने के लिए जिम्मेदार नहीं होगा।
    </p>

    <h3>6.4 जोखिम का हस्तांतरण</h3>
    <p>
    परिवहन के दौरान उत्पाद से संबंधित जोखिम और जिम्मेदारी लॉजिस्टिक्स प्रदाता के पास रहेगी।
    सफल डिलीवरी और हस्ताक्षरित डिलीवरी प्रमाण (POD) प्राप्त होने के बाद ही जोखिम खरीदार को स्थानांतरित होगा।
    </p>

    <h3>6.5 देरी, क्षति एवं हानि</h3>
    <p>
    परिवहन के दौरान होने वाली किसी भी देरी, क्षति, कमी या हानि का निर्धारण लॉजिस्टिक्स प्रदाता के नियमों और शर्तों के अनुसार किया जाएगा।
    AgriAI ऐसी किसी भी दावे के लिए उत्तरदायी नहीं होगा।
    </p>

    <h3>6.6 डिलीवरी का प्रमाण</h3>
    <p>
    डिलीवरी की पुष्टि भौतिक रसीद, डिजिटल पुष्टि और/या AgriAI प्लेटफ़ॉर्म पर दर्ज इलेक्ट्रॉनिक POD के माध्यम से की जाएगी।
    AgriAI द्वारा बनाए गए डिजिटल रिकॉर्ड डिलीवरी के वैध प्रमाण माने जाएंगे।
    </p>
</section>
  <section class="section">
    <h2>7. गुणवत्ता मानक, निरीक्षण एवं स्वीकृति</h2>

    <p>
      आपूर्ति किया गया उत्पाद इस समझौते में उल्लिखित पारस्परिक रूप से सहमत विनिर्देशों के अनुरूप होना चाहिए।
    </p>

    <p>
      खरीदार डिलीवरी की तिथि से 3 (तीन) कार्य दिवसों के भीतर गुणवत्ता निरीक्षण पूरा करेगा।
    </p>

    <p>
      किसी भी अस्वीकृति को निरीक्षण अवधि के भीतर AgriAI प्लेटफ़ॉर्म के माध्यम से लिखित रूप में उठाना होगा,
      जिसमें स्पष्ट, वैध और सत्यापन योग्य कारण बताए जाने चाहिए।
    </p>

    <p>
      यदि 3 कार्य दिवसों के भीतर कोई विवाद नहीं उठाया जाता है, तो उत्पाद को स्वीकृत माना जाएगा।
    </p>

    <p>
      उचित अस्वीकृति की स्थिति में, वापसी परिवहन लागत खरीदार द्वारा वहन की जाएगी, जब तक कि यह सिद्ध न हो जाए कि दोष प्रेषण से पूर्व उत्पन्न हुआ था।
    </p>
</section>

<section class="section">
    <h2>8. जोखिम, दायित्व एवं बीमा</h2>

    <p>
      किसान मानक कृषि एवं फसल कटाई के बाद की प्रक्रियाओं का पालन करेगा।
    </p>

    <p>
      प्रेषण से पहले प्राकृतिक आपदाओं या फोर्स मेज्योर के कारण फसल हानि की स्थिति में, दायित्वों की पारस्परिक रूप से समीक्षा की जा सकती है।
      यदि प्रधानमंत्री फसल बीमा योजना (PMFBY) या अन्य अनुमोदित बीमाकर्ताओं के अंतर्गत बीमा लागू होता है, तो वह किसान के नाम पर ही रहेगा।
    </p>

    <p>
      प्राप्त होने वाला कोई भी बीमा मुआवजा केवल किसान का होगा।
    </p>

    <p>
      डिलीवरी और स्वीकृति मानी जाने के बाद, सभी जोखिम, स्वामित्व एवं दायित्व पूर्णतः खरीदार को स्थानांतरित हो जाएंगे।
    </p>
</section>

  <section class="section">
    <h2>9. फोर्स मेज्योर</h2>

    <p>
      किसी भी पक्ष को ऐसी परिस्थितियों के कारण हुई विफलता या देरी के लिए उत्तरदायी नहीं ठहराया जाएगा,
      जो उनके उचित नियंत्रण से बाहर हों, जैसे प्राकृतिक आपदाएं, सरकारी प्रतिबंध, युद्ध, हड़ताल,
      परिवहन में व्यवधान या अन्य अप्रत्याशित आपदाएं।
    </p>

    <p>
      ऐसी परिस्थितियों के समाप्त होने के बाद दायित्व पुनः लागू हो जाएंगे।
    </p>
</section>

  <section class="section">
    <h2>10. विवाद समाधान एवं क्षेत्राधिकार</h2>

    <p>
      इस समझौते से उत्पन्न किसी भी विवाद को पहले AgriAI प्लेटफ़ॉर्म के माध्यम से आपसी चर्चा द्वारा सौहार्दपूर्वक सुलझाया जाएगा।
    </p>

    <p>
      यदि 15 दिनों के भीतर समाधान नहीं होता है, तो विवादों को मध्यस्थता एवं सुलह अधिनियम, 1996 के अंतर्गत मध्यस्थता के लिए भेजा जाएगा।
      मध्यस्थता का स्थान AgriAI द्वारा निर्धारित किया जाएगा।
    </p>

    <p>
      मध्यस्थता के अधीन रहते हुए, <strong>बेंगलुरु, कर्नाटक</strong> की अदालतों को इस समझौते के तहत उत्पन्न प्रवर्तन और कानूनी कार्यवाहियों के लिए विशेष क्षेत्राधिकार प्राप्त होगा।
    </p>
</section>

  <section class="section">
    <h2>11. समाप्ति</h2>

    <p>
      किसी भी पक्ष द्वारा इस समझौते का समाप्ति किया जा सकता है यदि कोई महत्वपूर्ण उल्लंघन होता है,
      जैसे कि भुगतान न करना, डिलीवरी न करना, गलत प्रस्तुतीकरण, या सहमत शर्तों का उल्लंघन।
    </p>

    <p>
      निर्धारित समयसीमा से अधिक भुगतान में चूक की स्थिति में, दोषी पक्ष को खाता निलंबन,
      दंडात्मक शुल्क तथा कानून के अंतर्गत अनुमत वसूली कार्यवाही का सामना करना पड़ सकता है।
    </p>
</section>

  <section class="section">
    <h2>12. समझौते की भाषा</h2>

  <p>
    इस समझौते को किसान को <strong>${siteLang === 'en' ? 'अंग्रेज़ी' : (siteLang === 'hi' ? 'हिंदी' : (siteLang === 'kn' ? 'कन्नड़' : 'अंग्रेज़ी'))} (भाषा) </strong>में समझाया और अनुवादित किया गया है।
    किसी भी असंगति की स्थिति में, अंग्रेज़ी संस्करण मान्य होगा।
  </p>
</section>

<section class="section">
    <h2>13. निष्पादन एवं डिजिटल स्वीकृति</h2>

  <p>
    इस समझौते को AgriAI प्लेटफ़ॉर्म के माध्यम से इलेक्ट्रॉनिक रूप से निष्पादित किया जा सकता है।
    पंजीकृत क्रेडेंशियल्स का उपयोग करते हुए डिजिटल स्वीकृति कानूनी रूप से बाध्यकारी सहमति मानी जाएगी।
  </p>

  <section class="signature-section">
    <div class="signature-line">
      <p><b>खरीदार / कंपनी</b></p>
      <p>नाम: ${otpVerificationStatus && userRole === 'buyer' ? signedInUserName : '________________'}</p>
      <p>तिथि: ${otpVerificationStatus && userRole === 'buyer' ? startDate : '________________'}</p>
    </div>
    <div class="signature-line">
      <p><b>किसान / उत्पादक</b></p>
      <p>नाम: ${otpVerificationStatus && userRole === 'farmer' ? signedInUserName : '________________'}</p>
      <p>तिथि: ${otpVerificationStatus && userRole === 'farmer' ? startDate : '________________'}</p>
    </div>
  </section>

  <p style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; font-size: 12px; color: #000; font-weight: bold;">
    <b>गवाह:</b> AgriAI प्लेटफ़ॉर्म | डिजिटल रिकॉर्ड: ${new Date().toISOString()}
  </p>
</section>

</body>
</html>`;

      // Kannada contract HTML
      const htmlKn = `<!doctype html>
      <html>
<head>
  <meta charset="utf-8" />
  <title>AgriAI Contract</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      color: #1a1a1a;
      line-height: 1.8;
      background: #fff;
    }
    .header {
      text-align: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 3px solid #236902;
    }
    .header img {
      width: 80px;
      height: auto;
      margin: 0 auto 16px auto;
      display: block;
    }
    h1 {
      text-align: center;
      color: #236902;
      margin: 8px 0;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    h2 {
      color: #1a5c10;
      margin: 12px 0 8px 0;
      font-size: 18px;
      font-weight: 700;
      padding-bottom: 8px;
      border-bottom: 2px solid #e0e0e0;
    }
    h3 {
      color: #236902;
      margin: 10px 0 6px 0;
      font-size: 15px;
      font-weight: 700;
    }
    p {
      margin: 6px 0;
      text-align: justify;
      font-size: 14px;
    }
    .section {
      margin: 12px 0;
      padding: 8px 0;
    }
    ul {
      margin: 6px 0 6px 24px;
      font-size: 14px;
      list-style-type: disc;
    }
    li {
      margin: 3px 0;
      list-style-type: disc;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      background: #fff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    th {
      background: #236902;
      color: #fff;
      padding: 12px 8px;
      text-align: center;
      font-weight: 700;
      font-size: 13px;
      border: 1px solid #ddd;
    }
    td {
      padding: 10px 8px;
      border: 1px solid #ddd;
      text-align: center;
      font-size: 13px;
    }
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    tr:hover {
      background: #f0f7ff;
    }
    strong {
      font-weight: 700;
      color: #1a5c10;
    }
    .party-section {
      background: #f5f9f5;
      padding: 12px;
      border-left: 4px solid #236902;
      margin: 8px 0;
      border-radius: 4px;
    }
    .signature-section {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 2px solid #ddd;
      display: flex;
      justify-content: space-around;
      gap: 32px;
    }
    .signature-line {
      text-align: center;
      width: 200px;
    }
    .signature-line p {
      margin: 4px 0;
      font-size: 15px;
    }
    .signature-line .line {
      border-top: 1px solid #000;
      margin: 24px 0 4px 0;
      min-height: 20px;
    }
    @media print {
      body {
        padding: 0;
      }
      .section {
        page-break-inside: avoid;
      }
      h2 {
        page-break-after: avoid;
      }
    }
  </style>
</head>
<body>
<div class="header">
  <img src="${logo192}" alt="AgriAI" />
<h1>ಅಗ್ರಿಎಐ ಕೃಷಿ ಒಪ್ಪಂದ</h1></div>

<section class="section">
  <h2>ಒಪ್ಪಂದದ ಪಕ್ಷಗಳು</h2>
  <div class="party-section">
    <p><strong>ಪಕ್ಷ A – ಖರೀದಿದಾರ / ಕಂಪನಿ</strong></p>
    <p><b>ಹೆಸರು:</b> ${buyerName}</p>
    <p><b>ಖರೀದಿದಾರ ಐಡಿ:</b> ${buyerId || '[Buyer ID]'}</p>
    <p><b>ವಿಳಾಸ:</b> ${buyerAddress || '[Buyer Address]'}, ${buyerState || '[Buyer State]'}</p>
  </div>

  <div class="party-section">
    <p><strong>ಪಕ್ಷ B – ರೈತ / ಉತ್ಪಾದಕ</strong></p>
    <p><b>ಹೆಸರು:</b> ${farmerName}</p>
    <p><b>ರೈತ ಐಡಿ:</b> ${farmerId}</p>
    <p><b>ವಿಳಾಸ:</b> ${farmerAddress ? farmerAddress : ''}${farmerState ? (farmerAddress ? ', ' + farmerState : farmerState) : ''}</p>
  </div>

  <p>
     ಪಕ್ಷ A ಮತ್ತು ಪಕ್ಷ B ಅವರನ್ನು ಒಟ್ಟಾಗಿ “ಪಕ್ಷಗಳು” ಎಂದು ಕರೆಯಲಾಗುತ್ತದೆ।
     AgriAI ಕೇವಲ ಡಿಜಿಟಲ್ ಸೌಲಭ್ಯ ವೇದಿಕೆಯಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ ಮತ್ತು ಯಾವುದೇ ಪಕ್ಷದ ಖರೀದಿದಾರ, ಮಾರಾಟಗಾರ, ಸಾರಿಗೆದಾರ, ವಿಮೆದಾರ ಅಥವಾ ಪ್ರತಿನಿಧಿಯಲ್ಲ.
  </p>
</section>

  <section class="section">
    <h2>1. ಒಪ್ಪಂದದ ಉದ್ದೇಶ</h2>
    <p>
      ಈ ಒಪ್ಪಂದವು ಯಾವ ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳ ಅಡಿಯಲ್ಲಿ ರೈತನು ಕೃಷಿ ಉತ್ಪನ್ನವನ್ನು ಉತ್ಪಾದಿಸಿ
      ಖರೀದಿದಾರನಿಗೆ ಪೂರೈಕೆ ಮಾಡಲು ಒಪ್ಪಿಕೊಳ್ಳುತ್ತಾನೆ ಮತ್ತು ಖರೀದಿದಾರನು ಪೂರ್ವನಿರ್ಧರಿತ ಬೆಲೆಗೆ
      ಆ ಉತ್ಪನ್ನವನ್ನು ಖರೀದಿಸಲು ಒಪ್ಪಿಕೊಳ್ಳುತ್ತಾನೆ ಎಂಬುದನ್ನು ವಿವರಿಸುತ್ತದೆ, ಇದರಿಂದ:
    </p>
    <ul>
      <li>ರೈತನಿಗೆ ಖಚಿತ ಮಾರುಕಟ್ಟೆ ಪ್ರವೇಶ</li>
      <li>ನ್ಯಾಯಸಮ್ಮತ ಮತ್ತು ಪಾರದರ್ಶಕ ಬೆಲೆ ನಿಗದಿ</li>
      <li>ಸಮಯೋಚಿತ ಮತ್ತು ಸುರಕ್ಷಿತ ಪಾವತಿ</li>
      <li>ಮಧ್ಯವರ್ತಿಗಳ ಮೇಲೆ ಅವಲಂಬನೆ ಕಡಿತ</li>
    </ul>
</section>

<section class="section">
    <h2>2. ಒಪ್ಪಂದದ ಪ್ರಕಾರ ಮತ್ತು ಅವಧಿ</h2>
    <p><b>ಒಪ್ಪಂದದ ಸ್ವರೂಪ:</b> ${contractNature === 'pre-harvest' ? 'ಕೊಯ್ಲಿಗೆ ಮುನ್ನ ಉತ್ಪಾದನಾ ಒಪ್ಪಂದ' : 'ಕೊಯ್ಲಿನ ನಂತರ ಖರೀದಿ ಒಪ್ಪಂದ'}</p>
    <p><b>ಒಪ್ಪಂದದ ಅವಧಿ:</b> ${contractDuration === 'one-time' ? 'ಒಮ್ಮೆ ಮಾತ್ರ' : (contractDuration === 'seasonal' ? 'ಮೌಸಮಿ' : 'ವಾರ್ಷಿಕ')}</p>
    <p><b>ಪ್ರಾರಂಭ ದಿನಾಂಕ:</b> ${startDate}</p>
    <p><b>ಅಂತ್ಯ ದಿನಾಂಕ:</b> ${endDate}</p>
    <p><b>ಅವಧಿ:</b> ${days} ದಿನಗಳು</p>
    <p>
      ಈ ಕೊಯ್ಲಿನ ನಂತರದ ಖರೀದಿ ಒಪ್ಪಂದದ ಅಡಿಯಲ್ಲಿ, ಉತ್ಪನ್ನವು ಈಗಾಗಲೇ ಈ ಒಪ್ಪಂದ ಜಾರಿಗೆ ಬರುವ ಮೊದಲು ಬೆಳೆಸಲ್ಪಟ್ಟಿದೆ ಅಥವಾ ಕೊಯ್ಯಲ್ಪಟ್ಟಿದೆ.
      ಈ ಒಪ್ಪಂದದ ಅಡಿಯಲ್ಲಿ ಯಾವುದೇ ಬೆಳೆ ಉತ್ಪಾದನಾ ಬಾಧ್ಯತೆ ಇರುವುದಿಲ್ಲ.
    </p>

    <h3>2.1 ಒಪ್ಪಂದದ ಅಂಗೀಕಾರ ಮತ್ತು ಮಾತುಕತೆ ಅವಧಿ</h3>
    <p>
      ಈ ಖರೀದಿ ಒಪ್ಪಂದವು AgriAI ವೇದಿಕೆಯ ಮೂಲಕ ರೈತರಿಂದ ಖರೀದಿದಾರರಿಗೆ ಡಿಜಿಟಲ್ ರೀತಿಯಲ್ಲಿ ಕಳುಹಿಸಲಾದ ಸಮಯದಿಂದ
      ನಲವತ್ತೆಂಟು (48) ಗಂಟೆಗಳವರೆಗೆ ಅಂಗೀಕಾರಕ್ಕೆ ಮಾನ್ಯವಾಗಿರುತ್ತದೆ.
    </p>
    <p>
      ಈ 48 ಗಂಟೆಗಳ ಅವಧಿಯಲ್ಲಿ, ಖರೀದಿದಾರನು ಕೆಳಗಿನ ಕ್ರಮಗಳಲ್ಲಿ ಒಂದನ್ನು ಕೈಗೊಳ್ಳಬೇಕು:
    </p>
    <ul>
      <li>ಒಪ್ಪಂದವನ್ನು ಪ್ರಸ್ತುತ ರೂಪದಲ್ಲೇ ಅಂಗೀಕರಿಸುವುದು; ಅಥವಾ</li>
      <li>ಒಪ್ಪಂದವನ್ನು ತಿರಸ್ಕರಿಸುವುದು; ಅಥವಾ</li>
      <li>ಮಾತುಕತೆ (ನೆಗೋಶಿಯೇಷನ್) ಕೋರಿಕೆ ಸಲ್ಲಿಸುವುದು.</li>
    </ul>
    <p>
      ಖರೀದಿದಾರನು 48 ಗಂಟೆಗಳ ಮಾನ್ಯತಾ ಅವಧಿಯೊಳಗೆ ಯಾವುದೇ ಕ್ರಮ ಕೈಗೊಳ್ಳದಿದ್ದರೆ, ಒಪ್ಪಂದವು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಅವಧಿ ಮುಗಿಯುತ್ತದೆ
      ಮತ್ತು ಯಾವುದೇ ಪಕ್ಷಕ್ಕೂ ಕಾನೂನುಬದ್ಧ ಅಥವಾ ಬಾಧ್ಯತೆಯ ಪರಿಣಾಮ ಇರುವುದಿಲ್ಲ.
    </p>
    <p>
      ಬೆಲೆ ಮಾತುಕತೆಗಾಗಿ ಸಲ್ಲಿಸಲಾದ ಯಾವುದೇ ವಿನಂತಿ ಸಮಯಬದ್ಧವಾಗಿದ್ದು, ಮಾತುಕತೆ ಪ್ರಾರಂಭವಾದ ಸಮಯದಿಂದ ನಲವತ್ತೆಂಟು (48) ಗಂಟೆಗಳೊಳಗೆ ಪೂರ್ಣಗೊಳ್ಳಬೇಕು.
      ಈ ಅವಧಿಯಲ್ಲಿ ಯಾವುದೇ ಒಪ್ಪಂದಕ್ಕೆ ಬರದಿದ್ದರೆ, ಮಾತುಕತೆ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ರದ್ದು ಆಗುತ್ತದೆ ಮತ್ತು ಒಪ್ಪಂದವೂ ರದ್ದು ಎಂದು ಪರಿಗಣಿಸಲಾಗುತ್ತದೆ.
    </p>
</section>

  <section class="section">
    <h2>3. ಡೇಟಾ ಗೌಪ್ಯತೆ ಮತ್ತು ವೇದಿಕೆ ಅನುಸರಣೆ</h2>
    <p>
      AgriAI ವೇದಿಕೆಯ ಮೂಲಕ ಸಂಗ್ರಹಿಸಲಾದ ಎಲ್ಲಾ ವೈಯಕ್ತಿಕ, ಕೃಷಿ ಹಾಗೂ ವ್ಯವಹಾರ ಸಂಬಂಧಿತ ಡೇಟಾ:
    </p>
    <ul>
      <li>ಸುರಕ್ಷಿತವಾಗಿ ಸಂಗ್ರಹಿಸಲಾಗುತ್ತದೆ</li>
      <li>ಒಪ್ಪಂದ ಜಾರಿಗೆ ಹಾಗೂ ನವೀಕರಣಕ್ಕಾಗಿ ಬಳಸಲಾಗುತ್ತದೆ</li>
      <li>ಪಾವತಿ ನಿವಾರಣೆಗಾಗಿ ಬಳಸಲಾಗುತ್ತದೆ</li>
      <li>ವಿಮೆ ಸೌಲಭ್ಯಕ್ಕಾಗಿ ಬಳಸಲಾಗುತ್ತದೆ</li>
      <li>ಕಾನೂನು ಮತ್ತು ನಿಯಾಮಕ ಅನುಸರಣೆಗಾಗಿ ಬಳಸಲಾಗುತ್ತದೆ</li>
    </ul>
    <p>
      ಈ ಒಪ್ಪಂದವು ಡಿಜಿಟಲ್ ವೈಯಕ್ತಿಕ ಡೇಟಾ ಸಂರಕ್ಷಣಾ ಕಾಯ್ದೆ, 2023ಕ್ಕೆ ಸಂಪೂರ್ಣವಾಗಿ ಅನುಗುಣವಾಗಿದೆ.
    </p>
</section>

<section class="section">
    <h2>4. ವಸ್ತು ವಿವರಗಳು</h2>
    <table>
      <thead>
        <tr>
          <th>ಕ್ರಮ ಸಂಖ್ಯೆ</th>
          <th>ಬೆಳೆ ಹೆಸರು</th>
          <th>ವೈವಿಧ್ಯ</th>
          <th>ಪ್ರಮಾಣ (ಕೆಜಿ)</th>
          <th>ಬೆಲೆ (₹/ಕೆಜಿ)</th>
          <th>ಮೊತ್ತ (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
</section>

  <section class="section">
    <h2>5. ಬೆಲೆ ಮತ್ತು ಪಾವತಿ ನಿಯಮಗಳು</h2>
    
    <h3>5.1 ರೈತನ ಪಾವತಿ ರಚನೆ</h3>
    <p><b>ಒಟ್ಟು ಪ್ರಮಾಣ:</b> ${totalContractQty.toLocaleString('en-IN')} ಕೆಜಿ</p>
    <p><b>ಪ್ರತಿ ಘಟಕದ ಬೆಲೆ:</b> ${formatCurrency(avgPricePerKg)} ಪ್ರತಿ ಕೆಜಿ</p>
    <p><b>ಉಪಮೊತ್ತ:</b> ${formatCurrency(totalCropTradeValue)}</p>
    <p><b>ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಶುಲ್ಕ:</b> ${formatCurrency(totalPlatformFee)}</p>
    <p><b>ಜಿಎಸ್‌ಟಿ (18%):</b> ${formatCurrency(totalGst)}</p>
    <p><b style="font-size: 16px; color: #236902;">ಒಟ್ಟು ಮೊತ್ತ (ಕಡಿತದ ನಂತರ):</b> <b style="font-size: 16px; color: #236902;">${formatCurrency(totalAmountInvoice)}</b></p>

    <h3 style="margin-top: 20px;">5.2 ಖರೀದಿದಾರರ ಪಾವತಿ ರಚನೆ</h3>
    <p><b>ಒಟ್ಟು ಪ್ರಮಾಣ:</b> ${totalContractQty.toLocaleString('en-IN')} ಕೆಜಿ</p>
    <p><b>ಪ್ರತಿ ಘಟಕದ ಬೆಲೆ:</b> ${formatCurrency(avgPricePerKg)} ಪ್ರತಿ ಕೆಜಿ</p>
    <p><b>ಉಪಮೊತ್ತ:</b> ${formatCurrency(totalCropTradeValue)}</p>
    <p><b>ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಶುಲ್ಕ:</b> ${formatCurrency(buyerPlatformFee)}</p>
    <p><b>ಜಿಎಸ್‌ಟಿ (18%):</b> ${formatCurrency(buyerGst)}</p>
    <p><b style="font-size: 16px; color: #236902;">ಪಾವತಿಸಬೇಕಾದ ಒಟ್ಟು ಮೊತ್ತ:</b> <b style="font-size: 16px; color: #236902;">${formatCurrency(buyerTotalAmount)}</b></p>

    <h3 style="margin-top: 20px;">5.3 ಪಾವತಿ ವೇಳಾಪಟ್ಟಿ</h3>
    <ul>
      <li><b>ಮುಂಗಡ (25%):</b> ${formatCurrency(totalCropTradeValue * 0.25)} – ಒಪ್ಪಂದ ದೃಢೀಕರಣದ ವೇಳೆ ಪಾವತಿಸಬೇಕು</li>
      <li><b>ಡಿಲಿವರಿ ಸಮಯದಲ್ಲಿ (50%):</b> ${formatCurrency(totalCropTradeValue * 0.50)} – ಯಶಸ್ವಿ ಡಿಲಿವರಿಯ ನಂತರ ಪಾವತಿಸಬೇಕು</li>
      <li><b>ಅಂತಿಮ (25%):</b> ${formatCurrency(totalCropTradeValue * 0.25)} – ಗುಣಮಟ್ಟ ಸ್ವೀಕೃತಿಯಾದ ನಂತರ 7 ಕಾರ್ಯದಿನಗಳೊಳಗೆ ಪಾವತಿಸಬೇಕು</li>
    </ul>

    <h3 style="margin-top: 20px;">5.4 ಪಾವತಿ ವಿಧಾನ</h3>
    <p>ಬ್ಯಾಂಕ್ ವರ್ಗಾವಣೆ / ಯುಪಿಐ / ಚೆಕ್</p>
    <p>ಈ ಒಪ್ಪಂದದ ಅಡಿಯಲ್ಲಿ ಮಾಡಿದ ಎಲ್ಲಾ ಪಾವತಿಗಳಿಗೆ ಖರೀದಿದಾರರು ಡಿಜಿಟಲ್ ಅಥವಾ ಭೌತಿಕ ರಸೀದಿಗಳನ್ನು ನೀಡಬೇಕು.</p>
</section>
  <section class="section">
    <h2>6. ವಿತರಣೆ, ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಮತ್ತು ಸಾರಿಗೆ</h2>

    <h3>6.1 AgriAI ಯ ಪಾತ್ರ</h3>
    <p>
    AgriAI ಕೇವಲ ಖರೀದಿದಾರರು ಮತ್ತು ರೈತರ ನಡುವೆ ವ್ಯವಹಾರಗಳನ್ನು ಸುಗಮಗೊಳಿಸುವ ಡಿಜಿಟಲ್ ತಂತ್ರಜ್ಞಾನ ವೇದಿಕೆಯಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ।
    AgriAI ಅನ್ನು ಯಾವುದೇ ರೀತಿಯಲ್ಲಿ ಖರೀದಿದಾರ, ಮಾರಾಟಗಾರ, ವ್ಯಾಪಾರಿ, ಕಮಿಷನ್ ಏಜೆಂಟ್, ಸಾರಿಗೆದಾರ ಅಥವಾ ಸರಕುಗಳ ಸಂರಕ್ಷಕ ಎಂದು ಪರಿಗಣಿಸಲಾಗುವುದಿಲ್ಲ।
    ಮಾರಾಟ ಮತ್ತು ಖರೀದಿಗೆ ಸಂಬಂಧಿಸಿದ ಎಲ್ಲಾ ಬಾಧ್ಯತೆಗಳು ಸಂಪೂರ್ಣವಾಗಿ ಪಕ್ಷಗಳ ನಡುವೆ ಮಾತ್ರ ಇರುತ್ತವೆ।
    </p>
    
    <h3>6.2 ಸಾರಿಗೆ</h3>
    <p>
    ಸಾರಿಗೆ AgriAI ವೇದಿಕೆಯಲ್ಲಿ ಲಭ್ಯವಿರುವ ಅಥವಾ ಅನುಮೋದಿತ ತೃತೀಯ-ಪಕ್ಷ ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಸೇವಾ ಪೂರೈಕೆದಾರರ ಮೂಲಕ ವ್ಯವಸ್ಥೆ ಮಾಡಲಾಗುತ್ತದೆ।
    ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಪೂರೈಕೆದಾರ ಮತ್ತು ವಾಹನದ ಆಯ್ಕೆ ಬೆಳೆ ಸ್ವರೂಪ, ಪ್ರಮಾಣ, ದೂರ ಮತ್ತು ಹ್ಯಾಂಡ್ಲಿಂಗ್ ಅಗತ್ಯಗಳ ಆಧಾರದ ಮೇಲೆ ನಿರ್ಧರಿಸಲಾಗುತ್ತದೆ।
    </p>

    <h3>6.3 ವಿತರಣೆ ಶುಲ್ಕ</h3>
    <p>
    ವಿತರಣೆ ಶುಲ್ಕವನ್ನು ತೃತೀಯ-ಪಕ್ಷ ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಪೂರೈಕೆದಾರರು ನಿಜವಾದ ದೂರ, ವಾಹನದ ಪ್ರಕಾರ, ಲೋಡಿಂಗ್ ಅಗತ್ಯಗಳು ಮತ್ತು ಸ್ಥಳದ ಆಧಾರದ ಮೇಲೆ ನಿರ್ಧರಿಸುತ್ತಾರೆ।
    ಈ ಶುಲ್ಕವನ್ನು ಖರೀದಿದಾರರು ನೇರವಾಗಿ ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಪೂರೈಕೆದಾರರಿಗೆ ಪಾವತಿಸಬೇಕು।
    AgriAI ವಿತರಣೆ ಬೆಲೆ ನಿರ್ಧಾರ ಅಥವಾ ಮಾತುಕತೆಗೆ ಜವಾಬ್ದಾರಿಯಲ್ಲ।
    </p>

    <h3>6.4 ಅಪಾಯದ ವರ್ಗಾವಣೆ</h3>
    <p>
    ಸಾಗಣೆ ಸಮಯದಲ್ಲಿ ಉತ್ಪನ್ನಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ಅಪಾಯ ಮತ್ತು ಜವಾಬ್ದಾರಿ ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಪೂರೈಕೆದಾರರಲ್ಲೇ ಇರುತ್ತದೆ।
    ಯಶಸ್ವಿ ವಿತರಣೆ ಮತ್ತು ಸಹಿ ಮಾಡಲಾದ ಡೆಲಿವರಿ ಪ್ರಮಾಣಪತ್ರ (POD) ನಂತರ ಮಾತ್ರ ಅಪಾಯ ಖರೀದಿದಾರರಿಗೆ ವರ್ಗಾಯಿಸಲಾಗುತ್ತದೆ।
    </p>

    <h3>6.5 ವಿಳಂಬ, ಹಾನಿ ಮತ್ತು ನಷ್ಟ</h3>
    <p>
    ಸಾಗಣೆ ಸಮಯದಲ್ಲಿ ಸಂಭವಿಸುವ ಯಾವುದೇ ವಿಳಂಬ, ಹಾನಿ, ಕೊರತೆ ಅಥವಾ ನಷ್ಟವು ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಪೂರೈಕೆದಾರರ ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳ ಪ್ರಕಾರ ನಿರ್ವಹಿಸಲಾಗುತ್ತದೆ।
    ಇಂತಹ ಯಾವುದೇ ದಾವೆಗಳಿಗೆ AgriAI ಜವಾಬ್ದಾರಿಯಲ್ಲ।
    </p>

    <h3>6.6 ವಿತರಣೆಯ ಪ್ರಮಾಣ</h3>
    <p>
    ವಿತರಣೆಯನ್ನು ಭೌತಿಕ ರಸೀದಿ, ಡಿಜಿಟಲ್ ದೃಢೀಕರಣ ಮತ್ತು/ಅಥವಾ AgriAI ವೇದಿಕೆಯಲ್ಲಿ ದಾಖಲಾಗಿರುವ ಎಲೆಕ್ಟ್ರಾನಿಕ್ POD ಮೂಲಕ ದೃಢೀಕರಿಸಲಾಗುತ್ತದೆ।
    AgriAI ನಿರ್ವಹಿಸುವ ಡಿಜಿಟಲ್ ದಾಖಲೆಗಳು ಮಾನ್ಯ ವಿತರಣಾ ಸಾಕ್ಷ್ಯವಾಗಿರುತ್ತವೆ।
    </p>
</section>
  <section class="section">
    <h2>7. ಗುಣಮಟ್ಟದ ಮಾನದಂಡಗಳು, ಪರಿಶೀಲನೆ ಮತ್ತು ಸ್ವೀಕೃತಿ</h2>

    <p>
      ಪೂರೈಸಲಾದ ಉತ್ಪನ್ನವು ಈ ಒಪ್ಪಂದದಲ್ಲಿ ಪರಸ್ಪರ ಒಪ್ಪಿಕೊಂಡಿರುವ ನಿರ್ದಿಷ್ಟತೆಗಳನ್ನು ಪೂರೈಸಬೇಕು।
    </p>

    <p>
      ಖರೀದಿದಾರರು ವಿತರಣೆಯ ದಿನಾಂಕದಿಂದ 3 (ಮೂರು) ಕಾರ್ಯದಿನಗಳೊಳಗೆ ಗುಣಮಟ್ಟ ಪರಿಶೀಲನೆಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಬೇಕು।
    </p>

    <p>
      ಯಾವುದೇ ತಿರಸ್ಕಾರವನ್ನು ಪರಿಶೀಲನಾ ಅವಧಿಯೊಳಗೆ AgriAI ವೇದಿಕೆಯ ಮೂಲಕ ಲಿಖಿತವಾಗಿ ಸಲ್ಲಿಸಬೇಕು,
      ಮತ್ತು ಅದರಲ್ಲಿಯೇ ಸ್ಪಷ್ಟ, ಮಾನ್ಯ ಹಾಗೂ ಪರಿಶೀಲಿಸಬಹುದಾದ ಕಾರಣಗಳನ್ನು ನೀಡಬೇಕು।
    </p>

    <p>
      3 ಕಾರ್ಯದಿನಗಳೊಳಗೆ ಯಾವುದೇ ವಿವಾದವನ್ನು ಉಂಟುಮಾಡದಿದ್ದರೆ, ಉತ್ಪನ್ನವನ್ನು ಸ್ವೀಕರಿಸಲಾಗಿದೆ ಎಂದು ಪರಿಗಣಿಸಲಾಗುತ್ತದೆ।
    </p>

    <p>
      ಸಮಂಜಸವಾದ ತಿರಸ್ಕಾರದ ಸಂದರ್ಭದಲ್ಲಿ, ಮರಳಿ ಸಾಗಣೆ ವೆಚ್ಚವನ್ನು ಖರೀದಿದಾರರು ಭರಿಸಬೇಕು,
      ದೋಷವು ರವಾನೆಗೆ ಮೊದಲು ಉಂಟಾಗಿದೆ ಎಂದು ಸಾಬೀತಾಗದ ಹೊರತು।
    </p>
</section>

<section class="section">
    <h2>8. ಅಪಾಯ, ಜವಾಬ್ದಾರಿ ಮತ್ತು ವಿಮೆ</h2>

    <p>
      ರೈತನು ಮಾನದಂಡ ಕೃಷಿ ಮತ್ತು ಕೊಯ್ಲಿನ ನಂತರದ ವಿಧಾನಗಳನ್ನು ಅನುಸರಿಸಬೇಕು।
    </p>

    <p>
      ರವಾನೆಗೆ ಮೊದಲು ಪ್ರಕೃತಿ ವಿಪತ್ತುಗಳು ಅಥವಾ ಫೋರ್ಸ್ ಮಜ್ಯೂರ್ ಕಾರಣದಿಂದ ಬೆಳೆ ನಷ್ಟವಾದಲ್ಲಿ,
      ಬಾಧ್ಯತೆಗಳನ್ನು ಪರಸ್ಪರವಾಗಿ ಪರಿಶೀಲಿಸಬಹುದು।
      PMFBY ಅಥವಾ ಇತರ ಮಾನ್ಯ ವಿಮಾ ಯೋಜನೆಗಳ ಅಡಿಯಲ್ಲಿ ವಿಮೆ ಇದ್ದರೆ, ಅದು ರೈತನ ಹೆಸರಿನಲ್ಲೇ ಉಳಿಯುತ್ತದೆ।
    </p>

    <p>
      ಯಾವುದೇ ವಿಮಾ ಪರಿಹಾರವು ಸಂಪೂರ್ಣವಾಗಿ ರೈತನಿಗೆ ಸೇರಿರುತ್ತದೆ।
    </p>

    <p>
      ವಿತರಣೆ ಮತ್ತು ಸ್ವೀಕೃತಿಯ ನಂತರ, ಎಲ್ಲಾ ಅಪಾಯಗಳು, ಮಾಲೀಕತ್ವ ಮತ್ತು ಜವಾಬ್ದಾರಿಗಳು ಸಂಪೂರ್ಣವಾಗಿ ಖರೀದಿದಾರರಿಗೆ ವರ್ಗಾಯಿಸಲಾಗುತ್ತವೆ।
    </p>
</section>

  <section class="section">
    <h2>9. ಫೋರ್ಸ್ ಮಜ್ಯೂರ್</h2>

    <p>
      ಯಾವುದೇ ಪಕ್ಷವು ತಮ್ಮ ನಿಯಂತ್ರಣದ ಹೊರಗಿನ ಪರಿಸ್ಥಿತಿಗಳಿಂದ ಉಂಟಾಗುವ ವಿಫಲತೆ ಅಥವಾ ವಿಳಂಬಕ್ಕಾಗಿ ಜವಾಬ್ದಾರರಾಗುವುದಿಲ್ಲ,
      ಉದಾಹರಣೆಗೆ ಪ್ರಕೃತಿ ವಿಪತ್ತುಗಳು, ಸರ್ಕಾರಿ ನಿರ್ಬಂಧಗಳು, ಯುದ್ಧ, ಮುಷ್ಕರಗಳು,
      ಸಾರಿಗೆ ವ್ಯತ್ಯಯಗಳು ಅಥವಾ ಅನಿರೀಕ್ಷಿತ ಅನಾಹುತಗಳು।
    </p>

    <p>
      ಇಂತಹ ಪರಿಸ್ಥಿತಿಗಳು ಅಂತ್ಯಗೊಂಡ ನಂತರ ಬಾಧ್ಯತೆಗಳು ಮರುಪ್ರಾರಂಭವಾಗುತ್ತವೆ।
    </p>
</section>

<section class="section">
    <h2>10. ವಿವಾದ ಪರಿಹಾರ ಮತ್ತು ನ್ಯಾಯಾಧಿಕಾರ</h2>

    <p>
      ಈ ಒಪ್ಪಂದದಿಂದ ಉಂಟಾಗುವ ಯಾವುದೇ ವಿವಾದವನ್ನು ಮೊದಲು AgriAI ವೇದಿಕೆಯ ಮೂಲಕ ಪರಸ್ಪರ ಚರ್ಚೆಯಿಂದ ಸ್ನೇಹಪೂರ್ಣವಾಗಿ ಪರಿಹರಿಸಲಾಗುತ್ತದೆ।
    </p>

    <p>
      15 ದಿನಗಳೊಳಗೆ ಪರಿಹಾರವಾಗದಿದ್ದರೆ, ವಿವಾದಗಳನ್ನು ಮಧ್ಯಸ್ಥಿಕೆ ಮತ್ತು ಸಮ್ಮತಿ ಕಾಯ್ದೆ, 1996ರ ಅಡಿಯಲ್ಲಿ ಮಧ್ಯಸ್ಥಿಕೆಗೆ ಒಪ್ಪಿಸಲಾಗುತ್ತದೆ।
      ಮಧ್ಯಸ್ಥಿಕೆಯ ಸ್ಥಳವನ್ನು AgriAI ನಿರ್ಧರಿಸುತ್ತದೆ।
    </p>

    <p>
      ಮಧ್ಯಸ್ಥಿಕೆಯ ಅಧೀನದಲ್ಲಿದ್ದು, <strong>ಬೆಂಗಳೂರು, ಕರ್ನಾಟಕ</strong> ನ್ಯಾಯಾಲಯಗಳಿಗೆ ಈ ಒಪ್ಪಂದದ ಅಡಿಯಲ್ಲಿ ಉಂಟಾಗುವ ಜಾರಿಮಾಡುವಿಕೆ ಮತ್ತು ಕಾನೂನು ಕ್ರಮಗಳಿಗೆ ವಿಶೇಷ ನ್ಯಾಯಾಧಿಕಾರ ಇರುತ್ತದೆ।
    </p>
</section>

  <section class="section">
    <h2>11. ಒಪ್ಪಂದದ ರದ್ದುಪಡಿಸುವಿಕೆ</h2>

    <p>
      ಯಾವುದೇ ಪಕ್ಷವು ಈ ಒಪ್ಪಂದವನ್ನು ಮಹತ್ವದ ಉಲ್ಲಂಘನೆಯ ಕಾರಣದಿಂದ ರದ್ದುಪಡಿಸಬಹುದು,
      ಉದಾಹರಣೆಗೆ ಪಾವತಿ ಮಾಡದಿರುವುದು, ವಿತರಣೆ ಮಾಡದಿರುವುದು, ತಪ್ಪು ಮಾಹಿತಿಯನ್ನು ನೀಡುವುದು ಅಥವಾ ಒಪ್ಪಂದದ ನಿಯಮಗಳನ್ನು ಉಲ್ಲಂಘಿಸುವುದು।
    </p>

    <p>
      ಒಪ್ಪಿಕೊಂಡ ಸಮಯಾವಧಿಯನ್ನು ಮೀರಿದ ಪಾವತಿ ವಿಫಲವಾದಲ್ಲಿ, ತಪ್ಪಿತಸ್ಥ ಪಕ್ಷವು ಖಾತೆ ಸ್ಥಗಿತ,
      ದಂಡ ಶುಲ್ಕಗಳು ಮತ್ತು ಕಾನೂನು ಅನುಮತಿಸಿದ ವಸೂಲಿ ಕ್ರಮಗಳನ್ನು ಎದುರಿಸಬಹುದು।
    </p>
</section>

<section class="section">
    <h2>12. ಒಪ್ಪಂದದ ಭಾಷೆ</h2>

    <p>
      ಈ ಒಪ್ಪಂದವನ್ನು ರೈತನಿಗೆ <strong>${siteLang === 'en' ? 'English' : (siteLang === 'hi' ? 'ಹಿಂದಿ' : (siteLang === 'kn' ? 'ಕನ್ನಡ' : 'English'))} (ಭಾಷೆ)</strong> ನಲ್ಲಿ ವಿವರಿಸಿ ಅನುವಾದಿಸಲಾಗಿದೆ।
      ಯಾವುದೇ ವ್ಯತ್ಯಾಸ ಕಂಡುಬಂದಲ್ಲಿ, ಇಂಗ್ಲಿಷ್ ಆವೃತ್ತಿಯೇ ಮಾನ್ಯವಾಗುತ್ತದೆ।
    </p>
</section>

<section class="section">
    <h2>13. ಜಾರಿಗೊಳಿಸುವಿಕೆ ಮತ್ತು ಡಿಜಿಟಲ್ ಅಂಗೀಕಾರ</h2>

    <p>
      ಈ ಒಪ್ಪಂದವನ್ನು AgriAI ವೇದಿಕೆಯ ಮೂಲಕ ಎಲೆಕ್ಟ್ರಾನಿಕ್ ರೀತಿಯಲ್ಲಿ ಜಾರಿಗೊಳಿಸಬಹುದು।
      ನೋಂದಾಯಿತ ವಿವರಗಳನ್ನು ಬಳಸಿ ನೀಡುವ ಡಿಜಿಟಲ್ ಅಂಗೀಕಾರವು ಕಾನೂನುಬದ್ಧವಾಗಿ ಬಾಧ್ಯತೆಯ ಒಪ್ಪಿಗೆಯಾಗಿ ಪರಿಗಣಿಸಲಾಗುತ್ತದೆ।
    </p>

    <section class="signature-section">
      <div class="signature-line">
        <p><b>ಖರೀದಿದಾರ / ಕಂಪನಿ</b></p>
        <p>ಹೆಸರು: ${otpVerificationStatus && userRole === 'buyer' ? signedInUserName : '________________'}</p>
        <p>ದಿನಾಂಕ: ${otpVerificationStatus && userRole === 'buyer' ? startDate : '________________'}</p>
      </div>
      <div class="signature-line">
        <p><b>ರೈತ / ಉತ್ಪಾದಕ</b></p>
        <p>ಹೆಸರು: ${otpVerificationStatus && userRole === 'farmer' ? signedInUserName : '________________'}</p>
        <p>ದಿನಾಂಕ: ${otpVerificationStatus && userRole === 'farmer' ? startDate : '________________'}</p>
      </div>
    </section>

    <p style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; font-size: 12px; color: #000; font-weight: bold;">
      <b>ಸಾಕ್ಷಿ:</b> AgriAI ವೇದಿಕೆ | ಡಿಜಿಟಲ್ ದಾಖಲೆ: ${new Date().toISOString()}
    </p>
</section>

</body>
</html>`;
      // Select template based on language (use lang fetched above)
      const html = lang === 'hi' ? htmlHi : (lang === 'kn' ? htmlKn : `<!doctype html>
      <html>
<head>
  <meta charset="utf-8" />
  <title>AgriAI Contract</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      color: #1a1a1a;
      line-height: 1.8;
      background: #fff;
    }
    .header {
      text-align: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 3px solid #236902;
    }
    .header img {
      width: 80px;
      height: auto;
      margin: 0 auto 16px auto;
      display: block;
    }
    h1 {
      text-align: center;
      color: #236902;
      margin: 8px 0;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    h2 {
      color: #1a5c10;
      margin: 12px 0 8px 0;
      font-size: 18px;
      font-weight: 700;
      padding-bottom: 8px;
      border-bottom: 2px solid #e0e0e0;
    }
    h3 {
      color: #236902;
      margin: 10px 0 6px 0;
      font-size: 15px;
      font-weight: 700;
    }
    p {
      margin: 6px 0;
      text-align: justify;
      font-size: 14px;
    }
    .section {
      margin: 12px 0;
      padding: 8px 0;
    }
    ul {
      margin: 6px 0 6px 24px;
      font-size: 14px;
      list-style-type: disc;
    }
    li {
      margin: 3px 0;
      list-style-type: disc;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      background: #fff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    th {
      background: #236902;
      color: #fff;
      padding: 12px 8px;
      text-align: center;
      font-weight: 700;
      font-size: 13px;
      border: 1px solid #ddd;
    }
    td {
      padding: 10px 8px;
      border: 1px solid #ddd;
      text-align: center;
      font-size: 13px;
    }
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    tr:hover {
      background: #f0f7ff;
    }
    strong {
      font-weight: 700;
      color: #1a5c10;
    }
    .party-section {
      background: #f5f9f5;
      padding: 12px;
      border-left: 4px solid #236902;
      margin: 8px 0;
      border-radius: 4px;
    }
    .signature-section {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 2px solid #ddd;
      display: flex;
      justify-content: space-around;
      gap: 32px;
    }
    .signature-line {
      text-align: center;
      width: 200px;
    }
    .signature-line p {
      margin: 4px 0;
      font-size: 15px;
    }
    .signature-line .line {
      border-top: 1px solid #000;
      margin: 24px 0 4px 0;
      min-height: 20px;
    }
    @media print {
      body {
        padding: 0;
      }
      .section {
        page-break-inside: avoid;
      }
      h2 {
        page-break-after: avoid;
      }
    }
  </style>
</head>
<body>
<div class="header">
  <img src="${logo192}" alt="AgriAI" />
  <h1>AGRIAI FARMING AGREEMENT</h1></div>

  <section class="section">
  <h2>PARTIES TO THE CONTRACT</h2>
  <div class="party-section">
    <p><strong>Party A – Buyer / Company</strong></p>
    <p><b>Name:</b> ${buyerName}</p>
    <p><b>Buyer ID:</b> ${buyerId || '[Buyer ID]'}</p>
    <p><b>Address:</b> ${buyerAddress || '[Buyer Address]'}, ${buyerState || '[Buyer State]'}</p>
  </div>

  <div class="party-section">
    <p><strong>Party B – Farmer / Producer</strong></p>
    <p><b>Name:</b> ${farmerName}</p>
    <p><b>Farmer ID:</b> ${farmerId}</p>
    <p><b>Address:</b> ${farmerAddress ? farmerAddress : ''}${farmerState ? (farmerAddress ? ', ' + farmerState : farmerState) : ''}</p>
  </div>

  <p>
     Party A and Party B are collectively referred to as “the Parties.”
      AgriAI acts solely as a digital facilitation platform and is not a buyer, seller, transporter, insurer, or agent of either Party.
  </p>
</section>

  <section class="section">
    <h2>1. PURPOSE OF AGREEMENT</h2>
    <p>
      This Agreement defines the terms and conditions under which the Farmer agrees to produce
      and supply agricultural produce to the Buyer, and the Buyer agrees to procure such produce
      at a pre-determined price, ensuring:
    </p>
    <ul>
      <li>Assured market access to the Farmer</li>
      <li>Fair and transparent pricing</li>
      <li>Timely and secure payment</li>
      <li>Reduced dependency on intermediaries</li>
    </ul>
  </section>

  <section class="section">
    <h2>2. CONTRACT TYPE & DURATION</h2>
    <p><b>Contract Nature:</b> ${contractNature === 'pre-harvest' ? 'Pre-Harvest Production Contract' : 'Post-Harvest Procurement Contract'}</p>
    <p><b>Contract Duration:</b> ${contractDuration === 'one-time' ? 'One-Time' : (contractDuration === 'seasonal' ? 'Seasonal' : 'Yearly')}</p>
    <p><b>Start Date:</b> ${startDate}</p>
    <p><b>End Date:</b> ${endDate}</p>
    <p><b>Duration:</b> ${days} Days</p>
    <p>
      Under this Post-Harvest Procurement Contract, the produce has already been cultivated or harvested prior to execution of this Agreement. No cultivation obligation arises under this contract. Under this Post-Harvest Procurement Contract, the produce has already been cultivated or harvested prior to execution of this Agreement. No cultivation obligation arises under this contract.
    </p>
    <h3>2.1 Contract Acceptance & Negotiation Window</h3>
    <p>
      This procurement contract shall remain valid for acceptance for a period of forty-eight (48) hours from the time it is digitally sent by the Farmer to the Buyer through the AgriAI platform.
    </p>
    <p>
      Within this 48-hour period, the Buyer must take one of the following actions through the platform:
    </p>
    <ul>
      <li>Accept the contract in its current form; or</li>
      <li>Reject the contract; or</li>
      <li>Request a negotiation.</li>
    </ul>
    <p><p>
      If the Buyer does not take any action within the 48-hour validity period, the contract shall automatically expire and shall have no legal or binding effect on either Party.
    </p>
    <p>
      If the Buyer does not take any action within the 48-hour validity period, the contract shall automatically expire and shall have no legal or binding effect on either Party.
    </p>
    <p>
      Any request for price negotiation shall be time-bound and must be concluded within forty-eight (48) hours from the time the negotiation is initiated. If no agreement is reached within this period, the negotiation shall automatically lapse, and the contract shall stand cancelled.
    </p>
  </section>

  <section class="section">
    <h2>3. DATA PRIVACY & PLATFORM COMPLIANCE</h2>
    <p>
      All personal, agricultural, and transactional data collected through the AgriAI platform shall be:
    </p>
    <ul>
      <li>Stored securely</li>
      <li>Contract execution and renewal</li>
      <li>Payment settlement</li>
      <li>Insurance facilitation</li>
      <li>Legal and regulatory compliance</li>
    </ul>
    <p>
      This Agreement is fully compliant with the Digital Personal Data Protection Act, 2023.
    </p>
  </section>

  <section class="section">
    <h2>4. COMMODITY DETAILS</h2>
    <table>
      <thead>
        <tr>
          <th>Sl. No</th>
          <th>Crop Name</th>
          <th>Variety</th>
          <th>Quantity (kg)</th>
          <th>Price (₹/kg)</th>
          <th>Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </section>

  <section class="section">
    <h2>5. PRICE & PAYMENT TERMS</h2>
    
    <h3>5.1 Farmer's Payment Structure</h3>
    <p><b>Total Quantity:</b> ${totalContractQty.toLocaleString('en-IN')} kg</p>
    <p><b>Price per Unit:</b> ${formatCurrency(avgPricePerKg)} per kg</p>
    <p><b>Subtotal:</b> ${formatCurrency(totalCropTradeValue)}</p>
    <p><b>Platform Fee:</b> ${formatCurrency(totalPlatformFee)}</p>
    <p><b>GST (18%):</b> ${formatCurrency(totalGst)}</p>
    <p><b style="font-size: 16px; color: #236902;">Total Amount (After Deduction):</b> <b style="font-size: 16px; color: #236902;">${formatCurrency(totalAmountInvoice)}</b></p>

    <h3 style="margin-top: 20px;">5.2 Buyer's Payment Structure</h3>
    <p><b>Total Quantity:</b> ${totalContractQty.toLocaleString('en-IN')} kg</p>
    <p><b>Price per Unit:</b> ${formatCurrency(avgPricePerKg)} per kg</p>
    <p><b>Subtotal:</b> ${formatCurrency(totalCropTradeValue)}</p>
    <p><b>Platform Fee:</b> ${formatCurrency(buyerPlatformFee)}</p>
    <p><b>GST (18%):</b> ${formatCurrency(buyerGst)}</p>
    <p><b style="font-size: 16px; color: #236902;">Total Amount Payable:</b> <b style="font-size: 16px; color: #236902;">${formatCurrency(buyerTotalAmount)}</b></p>

    <h3 style="margin-top: 20px;">5.3 Payment Schedule</h3>
    <ul>
      <li><b>Advance (25%):</b> ${formatCurrency(totalCropTradeValue * 0.25)} – Due at contract confirmation</li>
      <li><b>On Delivery (50%):</b> ${formatCurrency(totalCropTradeValue * 0.50)} – Due upon successful delivery</li>
      <li><b>Final (25%):</b> ${formatCurrency(totalCropTradeValue * 0.25)} – Due within 7 working days after quality acceptance</li>
    </ul>

    <h3 style="margin-top: 20px;">5.4 Mode of Payment</h3>
     <p>Bank Transfer / UPI / Cheque</p>
    <p>The Buyer shall issue digital or physical receipts for all payments made under this Agreement.</p></section>

  <section class="section">
    <h2>6. DELIVERY, LOGISTICS & TRANSPORTATION</h2>
    <h3>6.1 Role of AgriAI</h3>
    <p>
    AgriAI operates solely as a digital technology platform facilitating transactions between Buyers and Farmers.
    AgriAI shall not be deemed a buyer, seller, trader, commission agent, transporter, or custodian of goods.
    All obligations relating to sale and purchase remain strictly between the Parties.
  </p>
    
    <h3>6.2 Transportation</h3>
    <p>
    Transportation shall be facilitated through third-party logistics service providers available on or approved by the AgriAI platform.
    The selection of logistics provider and vehicle type shall be based on crop nature, quantity, distance, and handling requirements.
  </p>

    <h3>6.3 Delivery Charges</h3>
    <p>
    Delivery charges shall be determined by the third-party logistics provider based on actual distance, vehicle type, loading requirements, and location.
    Such charges shall be paid directly by the Buyer to the logistics provider.
    AgriAI shall not be responsible for determining or negotiating delivery pricing.
  </p>
    <h3>6.4 Transfer of Risk</h3>
    <p>
    Risk and responsibility for the produce shall remain with the logistics provider during transit.
    Risk shall transfer to the Buyer only upon successful delivery and signed Proof of Delivery (POD).
  </p>
    <h3>6.5 Delay, Damage & Loss</h3>
    <p>
    Any delay, damage, shortage, or loss occurring during transit shall be governed by the logistics provider's terms and conditions.
    AgriAI shall not be liable for any such claims.
  </p>
    <h3>6.6 Proof of Delivery</h3>
    <p>
    Delivery shall be confirmed through physical receipt, digital confirmation, and/or electronic POD recorded on the AgriAI platform.
    Digital records maintained by AgriAI shall constitute valid evidence of delivery.
  </p>
  </section>
  <section class="section">
    <h2>7. QUALITY STANDARDS, INSPECTION & ACCEPTANCE</h2>

  <p>
    The produce supplied shall meet the mutually agreed specifications mentioned in this Agreement.
  </p>

  <p>
    The Buyer shall complete quality inspection within 3 (three) working days from the date of delivery.
  </p>

  <p>
    Any rejection must be raised in writing through the AgriAI platform within the inspection period,
    clearly stating valid and verifiable reasons.
  </p>

  <p>
    If no dispute is raised within 3 working days, the produce shall be deemed accepted.
  </p>

  <p>
    In case of justified rejection, return transportation costs shall be borne by the Buyer unless the defect is proven to have originated prior to dispatch.
  </p>
</section>

<section class="section">
    <h2>8. RISK, LIABILITY & INSURANCE</h2>

  <p>
    The Farmer shall follow standard agricultural and post-harvest practices.
  </p>

  <p>
    In case of crop loss due to natural calamities or force majeure before dispatch, obligations may be reviewed mutually.
    Crop insurance, if applicable under government schemes such as PMFBY or other approved insurers, shall remain in the Farmer's name.
  </p>

  <p>
    Any insurance compensation received shall belong solely to the Farmer.
  </p>

  <p>
    After delivery and deemed acceptance, all risks, ownership, and liabilities shall transfer entirely to the Buyer.
  </p>
</section>

  <section class="section">
    <h2>9. FORCE MAJEURE</h2>

  <p>
    Neither Party shall be liable for failure or delay caused by events beyond reasonable control,
    including natural disasters, government restrictions, war, strikes, transportation disruptions, or unforeseen calamities.
  </p>

  <p>
    Obligations shall resume once such conditions cease to exist.
  </p>
</section>

  <section class="section">
    <h2>10. DISPUTE RESOLUTION & JURISDICTION</h2>

  <p>
    Any dispute arising out of this Agreement shall first be resolved amicably through discussion via the AgriAI platform.
  </p>

  <p>
    If unresolved within 15 days, disputes shall be referred to arbitration under the Arbitration and Conciliation Act, 1996.
    The seat of arbitration shall be determined by AgriAI.
  </p>

  <p>
    Subject to arbitration, the courts of <strong>Bengaluru, Karnataka</strong> shall have exclusive jurisdiction
  for enforcement and legal proceedings arising under this Agreement.
  </p>
</section>

  <section class="section">
    <h2>11. TERMINATION</h2>

  <p>
    Either Party may terminate this Agreement for material breach, including non-payment, non-delivery,
    misrepresentation, or violation of agreed terms.
  </p>

  <p>
    In case of payment default beyond agreed timelines, the defaulting Party may face account suspension,
    penalty charges, and recovery proceedings as permitted under law.
  </p>
</section>

  <section class="section">
    <h2>12. LANGUAGE OF AGREEMENT</h2>

  <p>
    This Agreement has been explained and translated to the Farmer in <strong> ${siteLang === 'en' ? 'English' : (siteLang === 'hi' ? 'हिंदी' : (siteLang === 'kn' ? 'ಕನ್ನಡ' : 'English'))} (Language)</strong>.
    In case of any inconsistency, the English version shall prevail.
  </p>
</section>

  <section class="section">
    <h2>13. EXECUTION & DIGITAL ACCEPTANCE</h2>

  <p>
    This Agreement may be executed electronically through the AgriAI platform.
    Digital acceptance using registered credentials shall constitute legally binding consent.
  </p>

  <section class="signature-section">
    <div class="signature-line">
      <p><b>Buyer / Company</b></p>
      <p>Name: ${otpVerificationStatus && userRole === 'buyer' ? signedInUserName : '________________'}</p>
      <p>Date: ${otpVerificationStatus && userRole === 'buyer' ? startDate : '________________'}</p>
    </div>
    <div class="signature-line">
      <p><b>Farmer / Producer</b></p>
      <p>Name: ${otpVerificationStatus && userRole === 'farmer' ? signedInUserName : '________________'}</p>
      <p>Date: ${otpVerificationStatus && userRole === 'farmer' ? startDate : '________________'}</p>
    </div>
  </section>

  <p style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; font-size: 12px; color: #000; font-weight: bold;">
    <b>Witness:</b> AgriAI Platform | Digital Record: ${new Date().toISOString()}
  </p>

</body>
</html>`) ;

  // show an in-app preview modal instead of opening a new tab
      setContractHtml(html);
      
      // Store contract metadata for later use when saving to database
      // Calculate duration in days
      const startDateObj = new Date(startDate.split('/').reverse().join('-'));
      const endDateObj = new Date(endDate.split('/').reverse().join('-'));
      const durationDays = Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24));
      
      const contractMetadata = {
        contract_number: `CNT${Date.now()}`,
        farmer_id: farmerId || '',
        farmer_name: farmerName,
        farmer_address: farmerAddress,
        farmer_state: farmerState,
        buyer_id: buyerId || '',
        buyer_name: buyerName,
        buyer_address: buyerAddress,
        buyer_state: buyerState,
        crops: items.map(it => ({
          id: it.id,
          buyer_id: it.buyer_id,
          crop_name: it.crop_name,
          variety: it.variety || '',
          quantity: Number(it.order_quantity || 0),
          price_per_kg: Number(it.price_per_kg || 0),
          amount: Number(it.order_quantity || 0) * Number(it.price_per_kg || 0)
        })),
        contract_nature: contractNature,
        contract_duration: contractDuration,
        start_date: startDate,
        end_date: endDate,
        duration: durationDays,
        farmer_platform_fee: totalPlatformFee,
        farmer_gst: totalGst,
        buyer_platform_fee: buyerPlatformFee,
        buyer_gst: buyerGst,
        delivery_cost: deliveryRateDisplay || 'Calculated at delivery'
      };
      setContractMetadata(contractMetadata);
      setShowContractPreview(true);
    } catch (e) {
      console.error('Failed to generate contract', e);
      alert(t('contractGenerateFailed', siteLang) || 'Failed to generate contract. See console for details.');
    }
  };

  const handleSendContract = () => {
    // Validate that every item has a positive order quantity and a positive price before generating contract
    const missingQty = items.some(it => !(Number(it.order_quantity) > 0));
    if (missingQty) {
      alert(t('editEnterOrderQty', siteLang));
      return;
    }
    const missingPrice = items.some(it => !(Number(it.price_per_kg) > 0));
    if (missingPrice) {
      alert(t('priceMustBeGreaterThanZero', siteLang));
      return;
    }
    // show preview and let user confirm before actually sending/clearing cart
    generateContract();
  };

  const downloadContract = () => {
    try {
      const blob = new Blob([contractHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'procurement-contract.html';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download failed', e);
      alert(t('downloadFailed', siteLang) || 'Download failed. See console for details.');
    }
  };

  const printContract = () => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);
      
      const doc = iframe.contentWindow.document;
      doc.open();
      
      // Write complete HTML with proper print styles
      const printHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>AgriAI Contract - Print</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    @page {
      size: A4;
      margin: 15mm;
      orphans: 3;
      widows: 3;
    }
    @media print {
      body {
        margin: 0;
        padding: 15mm;
        font-family: 'Times New Roman', Times, serif;
    overflow-y: auto;
      }
      .section {
        page-break-inside: avoid;
        margin-bottom: 10px;
      }
      h2 {
        page-break-after: avoid;
        margin-top: 15px;
        margin-bottom: 10px;
      }
      h3 {
        page-break-after: avoid;
        margin-top: 10px;
        margin-bottom: 8px;
      }
      p, ul, li {
        page-break-inside: avoid;
        margin-bottom: 6px;
      }
      table {
        page-break-inside: avoid;
        margin: 10px 0;
      }
      tr {
        page-break-inside: avoid;
      }
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      color: #1a1a1a;
      line-height: 1.8;
      background: #ffffff;
      padding: 15mm;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 3px solid #236902;
      page-break-after: avoid;
    }
    .header img {
      width: 80px;
      height: auto;
      margin-bottom: 12px;
    }
    h1 {
      text-align: center;
      color: #236902;
      margin: 12px 0;
      font-size: 24px;
      font-weight: 700;
    }
    h2 {
      color: #1a5c10;
      margin: 15px 0 10px 0;
      font-size: 16px;
      font-weight: 700;
      padding-bottom: 6px;
      border-bottom: 2px solid #e0e0e0;
    }
    h3 {
      color: #236902;
      margin: 10px 0 6px 0;
      font-size: 14px;
      font-weight: 700;
    }
    p {
      margin: 6px 0;
      text-align: justify;
      font-size: 13px;
      line-height: 1.6;
    }
    .section {
      margin: 12px 0;
      padding: 8px 0;
    }
    ul {
      margin: 8px 0 8px 28px;
      font-size: 13px;
    }
    li {
      margin: 4px 0;
      list-style-type: disc;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      background: #fff;
      font-size: 12px;
    }
    th {
      background: #236902;
      color: #fff;
      padding: 10px 6px;
      text-align: center;
      font-weight: 700;
      border: 1px solid #ddd;
    }
    td {
      padding: 8px 6px;
      border: 1px solid #ddd;
      text-align: center;
      font-size: 12px;
    }
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    strong {
      font-weight: 700;
      color: #1a5c10;
    }
    .party-section {
      background: #f5f9f5;
      padding: 10px;
      border-left: 3px solid #236902;
      margin: 8px 0;
      border-radius: 3px;
      font-size: 13px;
    }
    .signature-section {
      margin-top: 20px;
      padding-top: 15px;
      border-top: 2px solid #ddd;
      display: flex;
      justify-content: space-around;
      gap: 24px;
      page-break-inside: avoid;
    }
    .signature-line {
      text-align: center;
      width: 180px;
      font-size: 12px;
    }
    .signature-line p {
      margin: 3px 0;
      font-size: 11px;
    }
    .signature-line .line {
      border-top: 1px solid #000;
      margin: 18px 0 3px 0;
      min-height: 15px;
    }
  </style>
</head>
<body>
${contractHtml}
</body>
</html>`;
      
      doc.write(printHtml);
      doc.close();
      
      // Wait for content to render, then print
      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          // Remove iframe after printing
          setTimeout(() => {
            try {
              document.body.removeChild(iframe);
            } catch (e) {}
          }, 1000);
        } catch (err) {
          console.warn('Print failed', err);
          alert('Print failed. Please try again.');
        }
      }, 500);
    } catch (e) {
      console.error('Print failed', e);
      alert(t('printFailed', siteLang) || 'Print failed. See console for details.');
    }
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
            <h1 style={{ backgroundImage: 'linear-gradient(135deg, #1a5c10 0%, #236902 50%, #53b635 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', margin: 0, position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontWeight: 800, fontSize: 32 }}>{t('cartTitle', siteLang)}</h1>
            {items.length > 0 && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto', zIndex: 2 }}>
                <button onClick={() => window.location.href = '/dashboard/buyer'} style={{ background: '#fff', border: '1px solid #dfeadf', color: '#236902', padding: '6px 10px', borderRadius: 6, fontWeight: 800 }}>{t('continueShopping', siteLang)}</button>
                <button onClick={clearCart} style={{ background: '#fff', border: '1px solid #f0dede', color: '#d32f2f', padding: '6px 10px', borderRadius: 6, fontWeight: 800 }}>{t('clearCart', siteLang)}</button>
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <div style={{ fontSize: 52, lineHeight: 1 }}>🧺</div>
              <p style={{ marginTop: 8 }}>{t('cartEmptyMessage', siteLang)}</p>
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
                            <img src={it.image_url} alt={it.crop_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ color: '#999' }}>{t('noImage', siteLang)}</div>
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
                            
                            {/* Debug badge: detected group and category subtotal */}
                            
                            
                          </div>
                          <div style={{ marginTop: 6, fontWeight: 700 }}>{formatCurrency(it.price_per_kg)} / {t('kg', siteLang)}</div>
                          <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ fontSize: 13, color: '#000000ff' }}>{t('subTotalLabel', siteLang)} {formatCurrency(it.total_price || (lineTotal))}</div>
                            <div style={{ fontSize: 13, color: '#000000ff' }}>{t('tablePlatformFee', siteLang)}: {formatCurrency(commissionAmt)}</div>
                            <div style={{ fontSize: 13, color: '#000000ff' }}>{t('gstTotalLabel', siteLang)}: {gstRate}% ({formatCurrency(gstAmt)})</div>

                            <div style={{ fontSize: 13, color: '#000', fontWeight: 700 }}>{t('itemTotalLabel', siteLang)} {formatCurrency(Math.round((lineTotal - (commissionAmt || 0) - (gstAmt || 0) + Number.EPSILON) * 100) / 100)}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: 220 }}>
                          {editingId !== it.id && (
                            <>
                              <div style={{ fontWeight: 700 }}>{t('availableLabel', siteLang)} {Number(it.total_quantity != null ? it.total_quantity : it.quantity_kg || 0).toLocaleString('en-IN')} {t('kg', siteLang)}</div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 6 }}>
                                <button onClick={() => updateQuantity(it.id, -1)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e5e5', background: '#fff' }}>-</button>
                                <div style={{ minWidth: 60, textAlign: 'center', fontWeight: 800 }}>{Number(it.order_quantity || 0).toLocaleString('en-IN')} kg</div>
                                <button onClick={() => updateQuantity(it.id, 1)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e5e5', background: '#fff' }}>+</button>
                              </div>
                            </>
                          )}
                          {editingId === it.id && (
                            <>
                              <div style={{ display: 'flex', flexDirection: 'row', gap: 8, marginTop: 8 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                  <label style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{t('formQuantityLabel', siteLang)}</label>
                                  <input type="number" step="0.001" value={editVal} onChange={e => setEditVal(e.target.value)} style={{ width: 100, padding: 6 }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                  <label style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{t('tablePricePerKg', siteLang)}</label>
                                  <input type="number" step="0.01" value={editPrice} onChange={e => setEditPrice(e.target.value)} style={{ width: 80, padding: 6 }} />
                                </div>
                              </div>
                            </>
                          )}
                          <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: editingId === it.id ? 'center' : 'flex-end' }}>
                            {editingId === it.id ? (
                              <>
                                <button onClick={() => saveEdit(it.id)} style={{ padding: '6px 8px', background: '#236902', color: '#fff', border: 'none', borderRadius: 6 }}>{t('saveButton', siteLang)}</button>
                                <button onClick={cancelEdit} style={{ padding: '6px 8px', background: '#ddd', border: 'none', borderRadius: 6 }}>{t('cancelButton', siteLang)}</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEdit(it)} style={{ padding: '6px 8px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6 }}>{t('editButton', siteLang)}</button>
                                <button onClick={() => removeItem(it.id)} style={{ background: '#fff', border: '1px solid #d32f2f', color: '#d32f2f', padding: '6px 10px', borderRadius: 6 }}>{t('deleteButton', siteLang)}</button>
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
                  <div style={{ fontWeight: 800, color: '#236902', marginBottom: 8 }}>{t('orderSummary', siteLang)}</div>
                  <div style={{ display: 'grid', gap: 6, fontWeight: 700 }}>
                    <div>{t('totalItemsLabel', siteLang)} {items.length}</div>
                    
                    <div>{t('totalOrderedLabel', siteLang)} {Number(totalOrderedQty).toLocaleString('en-IN')} {t('kg', siteLang)}</div>
                    <div>{t('subTotalLabel', siteLang)} {formatCurrency(totals.subtotal)}</div>
                    <div>{t('platformFeeLabel', siteLang)} {formatCurrency(totals.commission)}</div>

                    <div>{t('gstLabel', siteLang)} {formatCurrency(totals.gst)}</div>
                    <div style={{ fontSize: 18, color: '#236902', marginTop: 6 }}>{t('grandTotalLabel', siteLang)}: {formatCurrency(grandTotal)}</div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{t('contractNatureLabel', siteLang)}</div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="radio" name="contractNature" value="pre-harvest" checked={contractNature === 'pre-harvest'} onChange={() => setContractNature('pre-harvest')} /> {t('preHarvestContract', siteLang)}
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="radio" name="contractNature" value="post-harvest" checked={contractNature === 'post-harvest'} onChange={() => setContractNature('post-harvest')} /> {t('postHarvestContract', siteLang)}
                      </label>
                    </div>

                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{t('contractDurationLabel', siteLang)}</div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="radio" name="contractDuration" value="one-time" checked={contractDuration === 'one-time'} onChange={() => setContractDuration('one-time')} /> {t('contractOneTime', siteLang)}
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="radio" name="contractDuration" value="seasonal" checked={contractDuration === 'seasonal'} onChange={() => setContractDuration('seasonal')} /> {t('contractSeasonal', siteLang)}
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="radio" name="contractDuration" value="yearly" checked={contractDuration === 'yearly'} onChange={() => setContractDuration('yearly')} /> {t('contractYearly', siteLang)}
                      </label>
                    </div>
                  </div>

                  <button onClick={handleSendContract} disabled={!items.length} style={{ marginTop: 12, width: '100%', background: '#236902', color: '#fff', padding: '10px 12px', borderRadius: 6, border: 'none' }}>
                    {t('sendContract', siteLang)}
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
            {/* Header */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 24px', borderBottom: '2px solid #e5e5e5', background: '#f9f9f9' }}>
              <h2 style={{ margin: 0, color: '#236902', fontSize: '18px', fontWeight: 700 }}>{t('contractPreview', siteLang) || 'Contract Preview'}</h2>
              <div style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 10, alignItems: 'center' }}>
                <button 
                  onClick={printContract} 
                  onMouseEnter={(e) => { e.target.style.background = '#28a745'; e.target.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.target.style.background = '#fff'; e.target.style.color = '#28a745'; }}
                  style={{ padding: '5px 12px', background: '#fff', color: '#28a745', border: '2px solid #28a745', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s ease' }}>
                  {t('print', siteLang) || 'Print'}
                </button>
                <button 
                  onClick={() => setShowContractPreview(false)} 
                  onMouseEnter={(e) => { e.target.style.background = '#dc3545'; e.target.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.target.style.background = '#fff'; e.target.style.color = '#dc3545'; }}
                  style={{ padding: '5px 12px', background: '#fff', color: '#dc3545', border: '2px solid #dc3545', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s ease' }}>
                   {t('close', siteLang) || 'Close'}
                </button>
              </div>
            </div>
            
            {/* Contract Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '0', background: '#fff' }}>
              <div style={{ padding: '40px 48px', lineHeight: '1.8' }} dangerouslySetInnerHTML={{ __html: contractHtml }} />
            </div>
            
            {/* Footer Actions */}
            <div style={{ borderTop: '2px solid #e5e5e5', padding: '16px 24px', background: '#f9f9f9', display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button 
                onClick={() => {
                  if (otpVerified && digitalSignature) {
                    try { setShowContractPreview(false); } catch (e) {}
                    handleBuyNow('contract');
                  } else {
                    initOtpVerification(() => {
                      resetOtpModal();
                      handleBuyNow('contract');
                    });
                  }
                }}
                onMouseEnter={(e) => { e.target.style.background = '#1a4d08'; e.target.style.transform = 'scale(1.02)'; }}
                onMouseLeave={(e) => { e.target.style.background = '#236902'; e.target.style.transform = 'scale(1)'; }}
                style={{ padding: '8px 20px', background: '#236902', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s ease' }}>
                ✓ {t('confirmAndSend', siteLang) || 'Confirm & Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Signature OTP Verification Modal */}
      {showOtpModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ width: '90%', maxWidth: 500, background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <h2 style={{ margin: '0 0 16px 0', color: '#236902', fontSize: 20, textAlign: 'center' }}>
              {otpVerified ? t('signatureVerified', siteLang) : t('verifyIdentity', siteLang)}
            </h2>

            <p style={{ color: '#666', marginBottom: 16, fontSize: 14 }}>
              {otpVerified 
                ? t('verifyIdentitySigned', siteLang)
                : t('verifyIdentityDesc', siteLang)}
            </p>

            {otpVerified ? (
              <div style={{ background: '#f0f7ff', border: '2px solid #236902', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                  <div style={{ marginBottom: 8 }}>
                    <strong>{t('signatureDetails', siteLang)}</strong>
                  </div>
                  <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#333' }}>
                    <div>📧 {t('signatureEmailLabel', siteLang)}: {otpEmail}</div>
                    <div>🕐 {t('signatureTimeLabel', siteLang)}: {digitalSignature.signature_timestamp}</div>
                    <div>✔ {t('signatureMethodLabel', siteLang)}: {digitalSignature.signature_method}</div>
                    <div style={{ marginTop: 8, wordBreak: 'break-all' }}>{t('signatureHashLabel', siteLang)}: {digitalSignature.signature_hash.substring(0, 40)}...</div>
                  </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>{t('signatureEmailLabel', siteLang)}</label>
                  <input 
                    type="email" 
                    value={otpEmail} 
                    disabled
                    style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6, fontSize: 14, background: '#f5f5f5' }} 
                  />
                </div>

                {!otpSent ? (
                  <div style={{ marginBottom: 16 }}>
                    <button 
                      onClick={handleOtpSend}
                      disabled={otpLoading}
                      style={{ 
                        width: '100%', 
                        padding: 10, 
                        background: '#236902', 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: 6, 
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: otpLoading ? 'not-allowed' : 'pointer',
                        opacity: otpLoading ? 0.6 : 1
                      }}
                    >
                      {otpLoading ? t('sendingOtp', siteLang) || 'Sending...' : t('sendOtpButton', siteLang)}
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Enter OTP</label>
                      <input 
                        type="text" 
                        placeholder={t('otpPlaceholder', siteLang)}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                        style={{ 
                          width: '100%', 
                          padding: 10, 
                          border: '1px solid #ddd', 
                          borderRadius: 6, 
                          fontSize: 14,
                          textAlign: 'center',
                          letterSpacing: '4px',
                          fontWeight: 'bold'
                        }} 
                      />
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{t('checkEmailMsg', siteLang)}</div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        onClick={handleOtpVerifyAndSign}
                        disabled={otpLoading || otpCode.length < 6}
                        style={{ 
                          flex: 1, 
                          padding: 10, 
                          background: '#236902', 
                          color: '#fff', 
                          border: 'none', 
                          borderRadius: 6, 
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: (otpLoading || otpCode.length < 6) ? 'not-allowed' : 'pointer',
                          opacity: (otpLoading || otpCode.length < 6) ? 0.6 : 1
                        }}
                      >
                        {otpLoading ? t('verifying', siteLang) || 'Verifying...' : t('verifyAndSign', siteLang)}
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
              {otpVerified && (
                <button 
                  onClick={() => {
                    // Contract already signed, proceed with sending
                    if (pendingContractAction) {
                      pendingContractAction();
                    }
                  }}
                  style={{ 
                    flex: 1, 
                    padding: 10, 
                    background: '#236902', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: 6, 
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Proceed to Send Contract
                </button>
              )}
              <button 
                onClick={resetOtpModal}
                disabled={otpLoading}
                style={{ 
                  flex: 1, 
                  padding: 10, 
                  background: '#ddd', 
                  border: 'none', 
                  borderRadius: 6, 
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                {otpVerified ? 'Cancel' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <footer className="w-full border-t" style={{background:'oklch(0.12 0.03 160 / 0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderColor:'oklch(0.65 0.22 145 / 0.12)', padding:'1em 0'}}>
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
                    const path = typeof link === 'string' ? "/" : link.path;
                    return (
                      <li key={label}>
                        {path === "/contact" ? (
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

export default FarmerCart;
            
      