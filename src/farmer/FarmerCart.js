import React from 'react';
import Navbar from '../Navbar';
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
    const onLang = (e) => { const l = (e && e.detail && e.detail.lang) ? e.detail.lang : (localStorage.getItem('agri_lang') || 'en'); setSiteLang(l); };
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

      // Kannada block (if present)
      updated = updated.replace(/<p>ಕಿಸಾನ್ \/ ಉತ್ಪಾದಕ<\/p>\s*<p>ಸಹಿ:[\s\S]*?<\/p>\s*<p>ದಿನಾಂಕ:[\s\S]*?<\/p>/m, `<p>Farmer / Producer</p>\n  <p>Signature: <strong>${name}</strong></p>\n  <p>Date: <strong>${formatted}</strong></p>`);

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

  const handleBuyNow = async () => {
    setPaymentError('');
    if (!paymentMethod) {
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
        const failedSaves = [];
        if (contractMetadata && contractMetadata.crops && Array.isArray(contractMetadata.crops)) {
          for (const crop of contractMetadata.crops) {
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
                delivery_cost: contractMetadata.delivery_cost,
                // Digital Signature Fields
                ...(digitalSignature && {
                  digital_signature: digitalSignature.signature_hash,
                  signature_method: digitalSignature.signature_method,
                  signature_email: digitalSignature.signer_email,
                  signature_timestamp: digitalSignature.signature_timestamp
                })
              };
              
              let saveRes = null;
              try {
                saveRes = await fetch(`${apiBase}/contracts/save`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(contractPayload)
                });
                const text = await (saveRes.text ? saveRes.text() : Promise.resolve(null)).catch(() => null);
                let bodyJson = null;
                try { bodyJson = text ? JSON.parse(text) : null; } catch (e) { }
                if (saveRes && saveRes.ok) {
                  console.log('✅ Contract saved successfully', bodyJson || text || saveRes.status);
                  // IMPORTANT: Capture contract_number from database response
                  if (bodyJson && bodyJson.contract_number && !savedContractNumber) {
                    savedContractNumber = bodyJson.contract_number;
                    console.log('📌 Using contract_number from database:', savedContractNumber);
                  }
                } else {
                  console.warn('❌ Failed to save contract:', saveRes ? saveRes.status : 'no-response', bodyJson || text);
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
        }
        if (failedSaves.length) {
          console.warn('Some contract rows failed to save:', failedSaves);
          try { alert(`${failedSaves.length} contract row(s) failed to save to server — check console for details.`); } catch (e) {}
        }
      } catch (e) {
        console.warn('Error processing contracts/quantities:', e);
      }

      // NOW save order to localStorage AFTER contracts are successfully saved to database
      // Use the contract_number from the database (CNT...) instead of local ORD... number
      try {
        const contractNumberToUse = savedContractNumber || contractMetadata.contract_number || ('CNT' + Date.now());
        console.log('📝 Saving order to history with contract_number:', contractNumberToUse);
        
        const orderRecord = {
          contract_number: contractNumberToUse,
          invoice_id: contractNumberToUse,
          created_at: createdAt,
          payment_method: 'contract',
          buyer,
          items: orderItems,
          totals: { ...summary, grand_total }
        };
        
        const rawHist = localStorage.getItem('agriai_history_farmer');
        const hist = rawHist ? JSON.parse(rawHist) : [];
        const nextHist = [orderRecord, ...(Array.isArray(hist) ? hist : [])];
        localStorage.setItem('agriai_history_farmer', JSON.stringify(nextHist));
        console.log('✓ Order saved to history with database contract_number');
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
   const generateContract = async () => {
    try {
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
  <title>Procurement Contract</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      color: #111;
      padding: 24px;
      line-height: 1.6;
    }
       h1 {
      text-align: center;
      color: #236902;
      margin: 0;
    }
       h2 {
      margin-top: 18px;
    }
       .section {
      margin-top: 16px;
    }
      table {
      border-collapse: collapse;
      width: 100%;
      margin-top: 12px;
    }
      th, td {
      border: 1px solid #ddd;
      padding: 8px;
    }
      th {
      background: #f7f7f7;
      text-align: left;
    }
      pre {
      white-space: pre-wrap;
      font-family: 'Times New Roman', Times, serif;
    }
  </style>
</head>
<body>
<div style="text-align:center; margin-bottom:20px;">
    <img src="${logo192}" alt="AgriAI" style="width:120px;height:auto;margin-bottom:8px" />
    <h1>
                 एग्री एआई<br/>
      संविदा कृषि अनुबंध
    </h1>
    
  </div>
  <section class="section">
  <h2>पक्षकार</h2>
  <p><strong>पक्ष A – खरीदार / कंपनी</strong></p>
  <p><b>नाम:</b> ${buyerName}</p>
  <p><b>खरीदार आईडी: </b> ${buyerId || '[Buyer ID]'}</p>
  <p><b>पता:</b> ${buyerState || '[Buyer State]'}, ${buyerRegion || '[Buyer Region]'}</p>
  <p><strong>पक्ष B – किसान / उत्पादक</strong></p>
  <p><b>नाम: </b> ${farmerName}</p>
  <p><b>किसान आईडी:</b> ${farmerId}</p>
  <p><b>पता:</b> ${farmerState ? ('' + farmerState) : ''}${farmerRegion ? (farmerState ? ', ' + farmerRegion : ', ' + farmerRegion) : ''}</p>
   <p>
      पक्ष A और पक्ष B को सामूहिक रूप से “पक्षकार” कहा जाएगा।
      एग्री एआई केवल एक डिजिटल सुविधा मंच के रूप में कार्य करता है और किसी भी पक्ष का खरीदार, विक्रेता, परिवहनकर्ता, बीमाकर्ता या एजेंट नहीं है।
    </p>
  </section>

  <section class="section">
    <h2>1. अनुबंध का उद्देश्य</h2>
    <p>
      यह अनुबंध उन शर्तों और नियमों को परिभाषित करता है जिनके अंतर्गत किसान कृषि उपज का उत्पादन एवं आपूर्ति करेगा तथा खरीदार पूर्व-निर्धारित मूल्य पर उसे खरीदेगा, जिससे:
    </p>
    <ul>
      <li>किसान को सुनिश्चित बाज़ार उपलब्ध हो</li>
      <li>निष्पक्ष एवं पारदर्शी मूल्य निर्धारण हो</li>
      <li>समय पर और सुरक्षित भुगतान हो</li>
      <li>बिचौलियों पर निर्भरता कम हो</li>
    </ul>
  </section>

  <section class="section">
    <h2>2. अनुबंध का प्रकार एवं अवधि</h2>
    <p>अनुबंध का प्रकार: ${contractNature === 'pre-harvest' ? 'Pre-Harvest Production Contract' : 'Post-Harvest Procurement Contract'}</p>
    <p>अनुबंध अवधि: ${contractDuration === 'one-time' ? 'One-Time' : (contractDuration === 'seasonal' ? 'Seasonal' : 'Yearly')}</p>
    <p>प्रारंभ तिथि: ${startDate}</p>
    <p>समाप्ति तिथि: ${endDate}</p>
    <p>कुल अवधि: ${days} Days</p>
    <p>
     कटाई उपरांत क्रय अनुबंध के अंतर्गत उपज पहले से उत्पादित या कटाई की जा चुकी है। इस अनुबंध के अंतर्गत कोई उत्पादन दायित्व उत्पन्न नहीं होगा।
    </p>
    <h3>2.1 अनुबंध स्वीकृति एवं वार्ता अवधि</h3>
    <p>
      यह अनुबंध किसान द्वारा डिजिटल रूप से भेजे जाने के 48 घंटों तक वैध रहेगा।
    </p>
    <p>
      इस अवधि में खरीदार को निम्न में से एक कार्य करना होगा:
    </p>
    <ul>
      <li>अनुबंध स्वीकार करना</li>
      <li>अनुबंध अस्वीकार करना</li>
      <li>मूल्य वार्ता का अनुरोध करना</li>
    </ul>
    <p>
      यदि 48 घंटों के भीतर कोई कार्यवाही नहीं की जाती है, तो अनुबंध स्वतः निरस्त माना जाएगा।
    </p>
    
  </section>

  <section class="section">
    <h2>3. डेटा गोपनीयता एवं प्लेटफ़ॉर्म अनुपालन</h2>
    <p>
      एग्री एआई द्वारा संकलित सभी व्यक्तिगत, कृषि एवं लेनदेन संबंधी डेटा:
    </p>
    <ul>
      <li>सुरक्षित रूप से संग्रहीत किए जाएंगे</li>
      <li>केवल अनुबंध निष्पादन, भुगतान निपटान, बीमा सुविधा एवं कानूनी अनुपालन हेतु उपयोग किए जाएंगे</li>
    </ul>
    <p>
      यह अनुबंध डिजिटल पर्सनल डेटा प्रोटेक्शन अधिनियम, 2023 के अनुरूप है।
    </p>
  </section>

  <section class="section">
  <h2>4. वस्तु विवरण</h2>
  <table style="border-collapse:collapse;width:100%;margin-top:12px;">
    <thead>
      <tr>
        <th style="padding:8px;border:1px solid #ddd;text-align:center">क्रम सं.</th>
        <th style="padding:8px;border:1px solid #ddd;text-align:center">फसल का नाम</th>
        <th style="padding:8px;border:1px solid #ddd;text-align:center">किस्म</th>
        <th style="padding:8px;border:1px solid #ddd;text-align:center">मात्रा</th>
        <th style="padding:8px;border:1px solid #ddd;text-align:center">मूल्य (₹/किग्रा)</th>
        <th style="padding:8px;border:1px solid #ddd;text-align:center">कुल राशि</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
</section>

  <section class="section">
  <h2>5. मूल्य एवं भुगतान शर्तें</h2>

  <p><strong>5.1 किसान</strong></p>
  <p>कुल मात्रा: ${totalContractQty.toLocaleString('en-IN')} किग्रा</p>
  <p>मूल्य: ${formatCurrency(avgPricePerKg)} प्रति किग्रा</p>
  <p>प्लेटफ़ॉर्म शुल्क: ${formatCurrency(totalPlatformFee)}</p>
  <p>प्लेटफ़ॉर्म शुल्क पर जीएसटी: ${formatCurrency(totalGst)}</p>
  <p><strong>कुल देय राशि (कटौती पश्चात): ${formatCurrency(totalAmountInvoice)}</strong></p>

  <p><strong>5.2 खरीदार</strong></p>
  <p>कुल मात्रा: ${totalContractQty.toLocaleString('en-IN')} किग्रा</p>
  <p>मूल्य: ${formatCurrency(avgPricePerKg)} प्रति किग्रा</p>
  <p>प्लेटफ़ॉर्म शुल्क: ${formatCurrency(buyerPlatformFee)}</p>
  <p>प्लेटफ़ॉर्म शुल्क पर जीएसटी: ${formatCurrency(buyerGst)}</p>
  <p><strong>कुल देय राशि (जोड़कर): ${formatCurrency(buyerTotalAmount)}</strong></p>
  <p>डिलीवरी / लॉजिस्टिक्स शुल्क (डिलीवरी के पश्चात देय): ${deliveryRateDisplay}</p>

  <p><strong>5.3 भुगतान अनुसूची</strong></p>
  <p>कुल फसल व्यापार मूल्य का 25% खरीदार द्वारा अनुबंध पुष्टि के समय एग्रीएआई प्लेटफ़ॉर्म के माध्यम से अग्रिम के रूप में भुगतान किया जाएगा।</p>
  <p>कुल फसल व्यापार मूल्य का 50% सफल डिलीवरी के तुरंत बाद भुगतान किया जाएगा।</p>
  <p>शेष 25% गुणवत्ता निरीक्षण एवं औपचारिक स्वीकृति के 7 (सात) कार्य दिवसों के भीतर भुगतान किया जाएगा।</p>

  <p><strong>5.4 भुगतान का तरीका</strong></p>
  <p>बैंक ट्रांसफर / यूपीआई / चेक</p>
  <p>खरीदार इस अनुबंध के अंतर्गत किए गए सभी भुगतानों के लिए डिजिटल या भौतिक रसीद जारी करेगा।</p>

</section>
  <section class="section">
  <h2>6. डिलीवरी, लॉजिस्टिक्स एवं परिवहन</h2>

  <p><strong>6.1 एग्रीएआई की भूमिका</strong></p>
  <p>
    एग्रीएआई केवल एक डिजिटल प्रौद्योगिकी प्लेटफ़ॉर्म के रूप में कार्य करता है, जो खरीदारों और किसानों के बीच लेनदेन को सुगम बनाता है।
    एग्रीएआई को किसी भी स्थिति में खरीदार, विक्रेता, व्यापारी, कमीशन एजेंट, परिवहनकर्ता या माल का संरक्षक नहीं माना जाएगा।
    बिक्री एवं खरीद से संबंधित सभी दायित्व पूर्णतः पक्षकारों के बीच ही रहेंगे।
  </p>

  <p><strong>6.2 डिलीवरी सुविधा</strong></p>
  <p>
    परिवहन एग्रीएआई प्लेटफ़ॉर्म पर उपलब्ध या अनुमोदित तृतीय-पक्ष लॉजिस्टिक्स सेवा प्रदाताओं के माध्यम से कराया जाएगा।
    लॉजिस्टिक्स प्रदाता एवं वाहन का चयन फसल की प्रकृति, मात्रा, दूरी तथा संभाल आवश्यकताओं के आधार पर किया जाएगा।
  </p>

  <p><strong>6.3 डिलीवरी शुल्क</strong></p>
  <p>
    डिलीवरी शुल्क तृतीय-पक्ष लॉजिस्टिक्स प्रदाता द्वारा वास्तविक दूरी, वाहन के प्रकार, लोडिंग आवश्यकताओं एवं स्थान के आधार पर निर्धारित किया जाएगा।
    यह शुल्क सीधे खरीदार द्वारा लॉजिस्टिक्स प्रदाता को भुगतान किया जाएगा।
    एग्रीएआई डिलीवरी शुल्क निर्धारित करने या उसके संबंध में किसी भी प्रकार की वार्ता करने के लिए उत्तरदायी नहीं होगा।
  </p>

  <p><strong>6.4 जोखिम का हस्तांतरण</strong></p>
  <p>
    परिवहन के दौरान उपज का जोखिम एवं उत्तरदायित्व लॉजिस्टिक्स प्रदाता के पास रहेगा।
    सफल डिलीवरी तथा हस्ताक्षरित डिलीवरी प्रमाण (Proof of Delivery - POD) के पश्चात जोखिम खरीदार को हस्तांतरित होगा।
  </p>

  <p><strong>6.5 विलंब, क्षति एवं हानि</strong></p>
  <p>
    परिवहन के दौरान होने वाली किसी भी प्रकार की देरी, क्षति, कमी या हानि लॉजिस्टिक्स प्रदाता के नियमों एवं शर्तों के अनुसार नियंत्रित होगी।
    एग्रीएआई ऐसे किसी भी दावे के लिए उत्तरदायी नहीं होगा।
  </p>

  <p><strong>6.6 डिलीवरी का प्रमाण</strong></p>
  <p>
    डिलीवरी की पुष्टि भौतिक रसीद, डिजिटल पुष्टि और/या एग्रीएआई प्लेटफ़ॉर्म पर दर्ज इलेक्ट्रॉनिक POD के माध्यम से की जाएगी।
    एग्रीएआई द्वारा सुरक्षित रखे गए डिजिटल अभिलेख डिलीवरी के वैध साक्ष्य माने जाएंगे।
  </p>

</section>

  <section class="section">
  <h2>7. गुणवत्ता मानक, निरीक्षण एवं स्वीकृति</h2>

  <p>
    आपूर्ति की गई उपज इस अनुबंध में उल्लिखित पारस्परिक रूप से सहमत विनिर्देशों के अनुरूप होगी।
  </p>

  <p>
    खरीदार डिलीवरी की तिथि से 3 (तीन) कार्य दिवसों के भीतर गुणवत्ता निरीक्षण पूर्ण करेगा।
  </p>

  <p>
    किसी भी अस्वीकृति को निरीक्षण अवधि के भीतर एग्रीएआई प्लेटफ़ॉर्म के माध्यम से लिखित रूप में दर्ज करना अनिवार्य होगा,
    जिसमें स्पष्ट, वैध एवं सत्यापन योग्य कारणों का उल्लेख होना चाहिए।
  </p>

  <p>
    यदि 3 कार्य दिवसों के भीतर कोई विवाद या आपत्ति दर्ज नहीं की जाती है, तो उपज को स्वीकृत माना जाएगा।
  </p>

  <p>
    यदि अस्वीकृति उचित एवं प्रमाणित पाई जाती है, तो वापसी परिवहन व्यय खरीदार द्वारा वहन किया जाएगा,
    जब तक कि यह सिद्ध न हो जाए कि दोष प्रेषण (डिस्पैच) से पूर्व उत्पन्न हुआ था।
  </p>

</section>

  <section class="section">
  <h2>8. जोखिम, दायित्व एवं बीमा</h2>

  <p>
    किसान मानक कृषि एवं कटाई उपरांत (पोस्ट-हार्वेस्ट) प्रथाओं का पालन करेगा।
  </p>

  <p>
    प्रेषण (डिस्पैच) से पूर्व प्राकृतिक आपदा या अप्रत्याशित परिस्थितियों (फोर्स मेज्योर) के कारण फसल हानि की स्थिति में,
    पक्षकार आपसी सहमति से दायित्वों की समीक्षा कर सकते हैं।
    यदि फसल बीमा सरकार की योजनाओं जैसे 
    <strong>प्रधानमंत्री फसल बीमा योजना (PMFBY)</strong> या किसी अनुमोदित बीमाकर्ता के अंतर्गत लागू है,
    तो वह किसान के नाम पर ही रहेगा।
  </p>

  <p>
    किसी भी बीमा दावे के अंतर्गत प्राप्त क्षतिपूर्ति राशि पर पूर्ण अधिकार केवल किसान का होगा।
  </p>

  <p>
    सफल डिलीवरी एवं स्वीकृति के पश्चात उपज से संबंधित सभी जोखिम, स्वामित्व एवं दायित्व पूर्णतः खरीदार को हस्तांतरित हो जाएंगे।
  </p>

</section>


  <section class="section">
  <h2>9. अप्रत्याशित परिस्थितियाँ (Force Majeure)</h2>

  <p>
    किसी भी पक्ष को ऐसी परिस्थितियों के कारण हुई विफलता या विलंब के लिए उत्तरदायी नहीं ठहराया जाएगा,
    जो उसके उचित नियंत्रण से परे हों, जिनमें प्राकृतिक आपदाएँ, सरकारी प्रतिबंध, युद्ध, हड़ताल,
    परिवहन व्यवधान या अन्य अप्रत्याशित आपदाएँ शामिल हैं।
  </p>

  <p>
    ऐसी परिस्थितियों के समाप्त होते ही अनुबंध के दायित्व पुनः प्रभावी हो जाएंगे।
  </p>
</section>

<section class="section">
  <h2>10. विवाद समाधान एवं अधिकार क्षेत्र</h2>

  <p>
    इस अनुबंध से उत्पन्न किसी भी विवाद को सर्वप्रथम एग्रीएआई प्लेटफ़ॉर्म के माध्यम से आपसी चर्चा द्वारा सौहार्दपूर्ण तरीके से सुलझाने का प्रयास किया जाएगा।
  </p>

  <p>
    यदि 15 (पंद्रह) दिनों के भीतर विवाद का समाधान नहीं होता है, तो इसे मध्यस्थता एवं सुलह अधिनियम, 1996 के अंतर्गत मध्यस्थता के लिए संदर्भित किया जाएगा।
    मध्यस्थता का स्थान (Seat of Arbitration) एग्रीएआई द्वारा निर्धारित किया जाएगा।
  </p>

  <p>
    मध्यस्थता के अधीन रहते हुए, इस अनुबंध से संबंधित प्रवर्तन एवं अन्य कानूनी कार्यवाहियों के लिए
    <strong>बेंगलुरु, कर्नाटक</strong> की न्यायालयों को विशेष (Exclusive) अधिकार क्षेत्र प्राप्त होगा।
  </p>
</section>

  <section class="section">
  <h2>11. समाप्ति</h2>

  <p>
    किसी भी पक्ष द्वारा इस अनुबंध की किसी महत्वपूर्ण शर्त के उल्लंघन की स्थिति में,
    जिसमें भुगतान न करना, डिलीवरी न करना, मिथ्या प्रस्तुतीकरण (Misrepresentation) या सहमत शर्तों का उल्लंघन शामिल है,
    यह अनुबंध समाप्त किया जा सकता है।
  </p>

  <p>
    सहमत समयसीमा से परे भुगतान में चूक की स्थिति में, चूक करने वाले पक्ष के विरुद्ध
    खाता निलंबन, दंडात्मक शुल्क तथा विधि द्वारा अनुमत वसूली कार्यवाही की जा सकती है।
  </p>
</section>

<section class="section">
  <h2>12. अनुबंध की भाषा</h2>

  <p>
    यह अनुबंध किसान को ${siteLang === 'en' ? 'English' : (siteLang === 'hi' ? 'हिंदी' : (siteLang === 'kn' ? 'ಕನ್ನಡ' : 'English'))} (भाषा) में समझाया एवं अनुवादित किया गया है।
    किसी भी असंगति की स्थिति में अंग्रेज़ी संस्करण प्रभावी एवं मान्य होगा।
  </p>
</section>

<section class="section">
  <h2>13. निष्पादन एवं डिजिटल स्वीकृति</h2>

  <p>
    यह अनुबंध एग्रीएआई प्लेटफ़ॉर्म के माध्यम से इलेक्ट्रॉनिक रूप से निष्पादित किया जा सकता है।
    पंजीकृत क्रेडेंशियल्स के माध्यम से दी गई डिजिटल स्वीकृति विधिक रूप से बाध्यकारी सहमति मानी जाएगी।
  </p>

  <p>खरीदार / अधिकृत प्रतिनिधि</p>
  <p>हस्ताक्षर: ___________________________</p>
  <p>तिथि: ___________________________</p>

  <p>किसान / उत्पादक</p>
  <p>हस्ताक्षर: ___________________________</p>
  <p>तिथि: ___________________________</p>

  <p>गवाह 1: ___________________________</p>
  <p>गवाह 2: ___________________________</p>
</section>

</body>
</html>`;

      // Select template based on language
      const html = siteLang === 'hi' ? htmlHi : `<!doctype html>
      <html>
<head>
  <meta charset="utf-8" />
  <title>Procurement Contract</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      color: #111;
      padding: 24px;
      line-height: 1.6;
    }
       h1 {
      text-align: center;
      color: #236902;
      margin: 0;
    }
       h2 {
      margin-top: 18px;
    }
       .section {
      margin-top: 16px;
    }
      table {
      border-collapse: collapse;
      width: 100%;
      margin-top: 12px;
    }
      th, td {
      border: 1px solid #ddd;
      padding: 8px;
    }
      th {
      background: #f7f7f7;
      text-align: left;
    }
      pre {
      white-space: pre-wrap;
      font-family: 'Times New Roman', Times, serif;
    }
  </style>
</head>
<body>
<div style="text-align:center; margin-bottom:20px;">
    <img src="${logo192}" alt="AgriAI" style="width:120px;height:auto;margin-bottom:8px" />
    <h1>
      Agri AI<br/>
      CONTRACT FARMING AGREEMENT
    </h1>
    
  </div>
  <section class="section">
  <h2>PARTIES</h2>
  <p><strong>Party A – Buyer / Company</strong></p>
  <p><b>Name:</b> ${buyerName}</p>
  <p><b>Buyer ID:</b> ${buyerId || '[Buyer ID]'}</p>
  <p><b>Address:</b> ${buyerState || '[Buyer State]'}, ${buyerRegion || '[Buyer Region]'}</p>
  <p><strong>Party B – Farmer / Producer</strong></p>
  <p><b>Name:</b> ${farmerName}</p>
  <p><b>Farmer ID:</b> ${farmerId}</p>
  <p><b>Address:</b> ${farmerState ? ('' + farmerState) : ''}${farmerRegion ? (farmerState ? ', ' + farmerRegion : ', ' + farmerRegion) : ''}</p>
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
    <p>Contract Nature: ${contractNature === 'pre-harvest' ? 'Pre-Harvest Production Contract' : 'Post-Harvest Procurement Contract'}</p>
    <p>Contract Duration: ${contractDuration === 'one-time' ? 'One-Time' : (contractDuration === 'seasonal' ? 'Seasonal' : 'Yearly')}</p>
    <p>Start Date: ${startDate}</p>
    <p>End Date: ${endDate}</p>
    <p>Duration: ${days} Days</p>
    <p>
      Under this Post-Harvest Procurement Contract, the produce has already been cultivated or harvested prior to execution of this Agreement. No cultivation obligation arises under this contract. Under this Post-Harvest Procurement Contract, the produce has already been cultivated or harvested prior to execution of this Agreement. No cultivation obligation arises under this contract.
    </p>
  
    <h3><strong>2.1 Contract Acceptance &amp; Negotiation Window</strong></h3>
    <p>
      This procurement contract shall remain valid for acceptance for a period of forty-eight (48) hours from the time it is digitally sent by the Farmer to the Buyer through the AgriAI platform.
    </p>
    <p>
      Within this 48-hour period, the Buyer must take one of the following actions through the platform:
    </p>
    <ul>
      <li>Accept the contract in its current form; or</li>
      <li>Reject the contract; or</li>
      <li>Request a price negotiation.</li>
    </ul>
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
      <li>Used strictly for:</li>
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
    <table style="border-collapse:collapse;width:100%;margin-top:12px;">
      <thead>
        <tr>
          <th style="padding:8px;border:1px solid #ddd;text-align:center">Sl. No</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:center">Crop Name</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:center">Variety</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:center">Quantity</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:center">Price (₹/kg)</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:center">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </section>

  <section class="section">
    <h2>5. PRICE & PAYMENT TERMS</h2>
    <p><strong>5.1 Farmer </strong></p>
    <p>Total Quantity: ${totalContractQty.toLocaleString('en-IN')} kg</p>
    <p>Price: ${formatCurrency(avgPricePerKg)} per kg</p>
    <p>Platform Fee: ${formatCurrency(totalPlatformFee)}</p>
    <p>GST on Platform Fee: ${formatCurrency(totalGst)}</p>
    <p><strong>Total Amount (After Deduction): ${formatCurrency(totalAmountInvoice)}</strong></p>
 
    <p><strong>5.2 Buyer</strong></p>
    <p>Total Quantity: ${totalContractQty.toLocaleString('en-IN')} kg</p>
    <p>Price: ${formatCurrency(avgPricePerKg)} per kg</p>
    <p>Platform Fee: ${formatCurrency(buyerPlatformFee)}</p>
    <p>GST on Platform Fee: ${formatCurrency(buyerGst)}</p>
    <p><strong>Total Amount (After Addition): ${formatCurrency(buyerTotalAmount)}</strong></p>
    <p>Delivery / Logistics Charges (Payable After Delivery): ${deliveryRateDisplay}</p>

    <p><strong>5.3 Payment Schedule</strong></p>
    <p>25% of the Total Crop Trade Value shall be paid by the Buyer as an advance at the time of contract confirmation through the AgriAI platform.</p>
    <p>50% of the Total Crop Trade Value shall be paid immediately upon successful delivery of the produce.</p>
    <p>50% of the Total Crop Trade Value shall be paid immediately upon successful delivery of the produce.</p>
    <p>The remaining 25% shall be paid within 7 (seven) working days after quality inspection and formal acceptance of the produce.</p>
    <p><strong>5.4 Mode of Payment</strong></p>
    <p>Bank Transfer / UPI / Cheque</p>
    <p>The Buyer shall issue digital or physical receipts for all payments made under this Agreement.</p>





  </section>
  <section class="section">
    <h2>6. DELIVERY, LOGISTICS & TRANSPORTATION</h2>

  <p><strong>6.1 Role of AgriAI</strong></p>
  <p>
    AgriAI operates solely as a digital technology platform facilitating transactions between Buyers and Farmers.
    AgriAI shall not be deemed a buyer, seller, trader, commission agent, transporter, or custodian of goods.
    All obligations relating to sale and purchase remain strictly between the Parties.
  </p>

  <p><strong>6.2 Delivery Facilitation</strong></p>
  <p>
    Transportation shall be facilitated through third-party logistics service providers available on or approved by the AgriAI platform.
    The selection of logistics provider and vehicle type shall be based on crop nature, quantity, distance, and handling requirements.
  </p>

  <p><strong>6.3 Delivery Charges</strong></p>
  <p>
    Delivery charges shall be determined by the third-party logistics provider based on actual distance, vehicle type, loading requirements, and location.
    Such charges shall be paid directly by the Buyer to the logistics provider.
    AgriAI shall not be responsible for determining or negotiating delivery pricing.
  </p>

  <p><strong>6.4 Transfer of Risk</strong></p>
  <p>
    Risk and responsibility for the produce shall remain with the logistics provider during transit.
    Risk shall transfer to the Buyer only upon successful delivery and signed Proof of Delivery (POD).
  </p>

  <p><strong>6.5 Delay, Damage & Loss</strong></p>
  <p>
    Any delay, damage, shortage, or loss occurring during transit shall be governed by the logistics provider’s terms and conditions.
    AgriAI shall not be liable for any such claims.
  </p>

  <p><strong>6.6 Proof of Delivery</strong></p>
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
    Crop insurance, if applicable under government schemes such as PMFBY or other approved insurers, shall remain in the Farmer’s name.
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
    This Agreement has been explained and translated to the Farmer in ${siteLang === 'en' ? 'English' : (siteLang === 'hi' ? 'हिंदी' : (siteLang === 'kn' ? 'ಕನ್ನಡ' : 'English'))} (Language).
    In case of any inconsistency, the English version shall prevail.
  </p>
</section>

  <section class="section">
    <h2>13. EXECUTION & DIGITAL ACCEPTANCE</h2>

  <p>
    This Agreement may be executed electronically through the AgriAI platform.
    Digital acceptance using registered credentials shall constitute legally binding consent.
  </p>

  <p>Buyer / Authorized Representative</p>
  <p>Signature: ___________________________</p>
  <p>Date: ___________________________</p>

  <p>Farmer / Producer</p>
  <p>Signature: ___________________________</p>
  <p>Date: ___________________________</p>

  <p>Witness 1: ___________________________</p>
  <p>Witness 2: ___________________________</p>
</section>

</body>
</html>`;

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
        delivery_cost: deliveryRateDisplay ? parseFloat(deliveryRateDisplay.replace(/[^\d.]/g, '')) || 0 : 0
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
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(contractHtml);
      doc.close();
      iframe.contentWindow.focus();
      // give time for render
      setTimeout(() => {
        try { iframe.contentWindow.print(); } catch (err) { console.warn('Print failed', err); }
        // remove iframe after a short delay
        setTimeout(() => { try { document.body.removeChild(iframe); } catch (e) {} }, 500);
      }, 250);
    } catch (e) {
      console.error('Print failed', e);
      alert(t('printFailed', siteLang) || 'Print failed. See console for details.');
    }
  };

  return (
    <div style={{ background: '#53b635', minHeight: '85vh' }}>
      <Navbar />
      <main style={{ padding: '6rem 1rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', background: '#fff', padding: '1.25rem', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'nowrap', position: 'relative', padding: '12px 0 18px', minHeight: 64 }}>
            <h1 style={{ color: '#236902', margin: 0, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>{t('cartTitle', siteLang)}</h1>
            {items.length > 0 && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto', zIndex: 2 }}>
                <button onClick={() => window.location.href = '/dashboard/buyer'} style={{ background: '#fff', border: '1px solid #dfeadf', color: '#236902', padding: '6px 10px', borderRadius: 6 }}>{t('continueShopping', siteLang)}</button>
                <button onClick={clearCart} style={{ background: '#fff', border: '1px solid #f0dede', color: '#d32f2f', padding: '6px 10px', borderRadius: 6 }}>{t('clearCart', siteLang)}</button>
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
                        <div style={{ width: 120, height: 80, borderRadius: 6, overflow: 'hidden', background: '#f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                          <div style={{ fontWeight: 700 }}>{t('availableLabel', siteLang)} {Number(it.total_quantity != null ? it.total_quantity : it.quantity_kg || 0).toLocaleString('en-IN')} {t('kg', siteLang)}</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 6 }}>
                            <button onClick={() => updateQuantity(it.id, -1)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e5e5', background: '#fff' }}>-</button>
                            <div style={{ minWidth: 60, textAlign: 'center', fontWeight: 800 }}>{Number(it.order_quantity || 0).toLocaleString('en-IN')} kg</div>
                            <button onClick={() => updateQuantity(it.id, 1)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e5e5', background: '#fff' }}>+</button>
                          </div>
                          <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            {editingId === it.id ? (
                              <>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <label style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{t('formQuantityLabel', siteLang)}</label>
                                        <input type="number" step="0.001" value={editVal} onChange={e => setEditVal(e.target.value)} style={{ width: 120, padding: 6 }} />
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <label style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{t('tablePricePerKg', siteLang)}</label>
                                        <input type="number" step="0.01" value={editPrice} onChange={e => setEditPrice(e.target.value)} style={{ width: 120, padding: 6 }} />
                                      </div>
                                    </div>
                                    <button onClick={() => saveEdit(it.id)} style={{ padding: '6px 8px', background: '#236902', color: '#fff', border: 'none', borderRadius: 6, marginLeft: 8 }}>{t('saveButton', siteLang)}</button>
                                    <button onClick={cancelEdit} style={{ padding: '6px 8px', background: '#ddd', border: 'none', borderRadius: 6, marginLeft: 6 }}>{t('cancelButton', siteLang)}</button>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ width: '94%', maxWidth: 960, maxHeight: '92%', background: '#fff', padding: 16, overflow: 'auto', borderRadius: 8 }}>
            <div style={{ position: 'relative', marginBottom: 8, minHeight: 40 }}>
              <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontWeight: 800 }}>{t('contractPreview', siteLang)}</div>
              <div style={{ position: 'absolute', right: 0, top: 0, display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={downloadContract} style={{ padding: '6px 10px' }}>{t('download', siteLang) || 'Download'}</button>
                <button onClick={printContract} style={{ padding: '6px 10px' }}>{t('print', siteLang) || 'Print'}</button>
                <button onClick={() => setShowContractPreview(false)} style={{ padding: '6px 10px' }}>{t('close', siteLang) || 'Close'}</button>
              </div>
            </div>
              <div style={{ border: '1px solid #eee', borderRadius: 6, padding: 12, background: '#fff' }} dangerouslySetInnerHTML={{ __html: contractHtml }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button onClick={() => {
                setPaymentMethod('contract');
                if (otpVerified && digitalSignature) {
                  // already verified: proceed to send
                  try { setShowContractPreview(false); } catch (e) {}
                  if (typeof pendingContractAction === 'function') pendingContractAction(); else handleBuyNow();
                } else {
                  // start OTP flow
                  initOtpVerification(() => {
                    resetOtpModal();
                    handleBuyNow();
                  });
                }
              }} style={{ padding: '8px 12px', background: '#236902', color: '#fff', border: 'none', borderRadius: 6 }}>{t('confirmAndSend', siteLang) || 'Confirm & Send'}</button>
              <button onClick={() => setShowContractPreview(false)} style={{ padding: '8px 12px', background: '#ddd', border: 'none', borderRadius: 6 }}>{t('cancelButton', siteLang)}</button>
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
    </div>
  );
};

export default FarmerCart;
            
      