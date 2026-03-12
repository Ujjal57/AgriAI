import React from 'react';
import Navbar from './Navbar';
import logo from './assets/logo192.png'; // ✅ Import logo image
import { t } from './i18n';

const Cart = () => {
  const [items, setItems] = React.useState([]);
  const [editingId, setEditingId] = React.useState(null);
  const [editVal, setEditVal] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('cod'); // default cod for buyer (no UI)
  const [paymentError, setPaymentError] = React.useState('');
  const [contractNature, setContractNature] = React.useState('pre-harvest');
  const [contractDuration, setContractDuration] = React.useState('one-time');
  const [contractHtml, setContractHtml] = React.useState('');
  const [showContractPreview, setShowContractPreview] = React.useState(false);
  // metadata used when saving contracts to database
  const [contractMetadata, setContractMetadata] = React.useState(null);
  const [uploadingContracts, setUploadingContracts] = React.useState(false); // prevent duplicate saves

  // OTP & digital signature states for buyer contract sending
  const [showOtpModal, setShowOtpModal] = React.useState(false);
  const [otpEmail, setOtpEmail] = React.useState(localStorage.getItem('agriai_email') || '');
  const [otpCode, setOtpCode] = React.useState('');
  const [otpSent, setOtpSent] = React.useState(false);
  const [otpLoading, setOtpLoading] = React.useState(false);
  const [otpError, setOtpError] = React.useState('');
  const [otpVerified, setOtpVerified] = React.useState(false);
  const [digitalSignature, setDigitalSignature] = React.useState('');
  const [currentBuyerName, setCurrentBuyerName] = React.useState('');

  // track an action that should fire once OTP verification completes
  const [pendingContractAction, setPendingContractAction] = React.useState(null);

  // open OTP modal for a future action (typically sending contract)
  const openOtpForContract = () => {
    // refresh email from storage in case user changed it elsewhere
    setOtpEmail(localStorage.getItem('agriai_email') || '');
    setOtpCode('');
    setOtpSent(false);
    // keep otpVerified as-is; once verified it should remain true until user changes email
    setOtpError('');
    setShowOtpModal(true);
  };

  // helper to send OTP via backend
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
        body: JSON.stringify({ email: email, otp: otp, purpose: 'contract-signature' })
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.ok) {
        // generate digital signature
        const signature = generateDigitalSignature(email, otp);
        setDigitalSignature(signature);
        setOtpVerified(true);
        // update contract metadata if we already built it
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

  // create a digital signature using user email, timestamp and partial OTP
  const generateDigitalSignature = (email, otp) => {
    const timestamp = new Date().toISOString();
    const signatureData = `${email}|${timestamp}|${otp.slice(0,2)}***`;
    // note: simplistic hash for demo; in production use proper crypto
    const hashString = btoa(signatureData);
    return {
      signer_email: email,
      signature_timestamp: timestamp,
      signature_hash: hashString,
      signature_method: 'OTP_VERIFIED'
    };
  };

  const handleOtpSend = async () => {
    if (!otpEmail) {
      setOtpError('Email is required');
      return;
    }
    await sendOtpToEmail(otpEmail);
  };

  const handleOtpVerifyAndSign = async () => {
    if (!otpCode || otpCode.length < 4) {
      setOtpError('Please enter a valid OTP');
      return;
    }
    const result = await verifyOtp(otpEmail, otpCode);
    if (result && typeof result === 'object') {
      // directly update contractHtml with buyer name and verification timestamp
      const name = currentBuyerName || localStorage.getItem('agriai_name') || '';
      const ts = result.signature_timestamp || new Date().toISOString();
      // only show date part
      const formatted = new Date(ts).toLocaleDateString('en-GB');
      let updated = contractHtml || '';
      // update only buyer signature & date (avoid farmer block)
      updated = updated.replace(/(<p>Buyer \/ Authorized Representative<\/p>[\s\S]*?<p>Signature:)\s*[^<]*/m,
        `$1 <strong>${name}</strong>`);
      updated = updated.replace(/(<p>Buyer \/ Authorized Representative<\/p>[\s\S]*?<p>Date:)\s*[^<]*/m,
        `$1 <strong>${formatted}</strong>`);
      // hindi buyer section
      updated = updated.replace(/(<p>खरीदार \/ अधिकृत प्रतिनिधि<\/p>[\s\S]*?<p>हस्ताक्षर:)\s*[^<]*/m,
        `$1 <strong>${name}</strong>`);
      updated = updated.replace(/(<p>खरीदार \/ अधिकृत प्रतिनिधि<\/p>[\s\S]*?<p>तिथि:)\s*[^<]*/m,
        `$1 <strong>${formatted}</strong>`);
      // kannada buyer section
      updated = updated.replace(/(<p>ಖರೀದಿದಾರ \/ ಅಧಿಕೃತ ಪ್ರತಿನಿಧಿ<\/p>[\s\S]*?<p>ಸಹಿ:)\s*[^<]*/m,
        `$1 <strong>${name}</strong>`);
      updated = updated.replace(/(<p>ಖರೀದಿದಾರ \/ ಅಧಿಕೃತ ಪ್ರತಿನಿಧಿ<\/p>[\s\S]*?<p>ದಿನಾಂಕ:)\s*[^<]*/m,
        `$1 <strong>${formatted}</strong>`);
      setContractHtml(updated);
      // keep digitalSignature state for display if needed
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
    // do not reset otpVerified here; user stays verified until they change email
    // signature is kept so preview still shows it
  };

  const injectBuyerSignatureIntoHtml = (signatureObj) => {
    try {
      if (!signatureObj) return;
      const name = currentBuyerName || localStorage.getItem('agriai_name') || '';
      const ts = signatureObj.signature_timestamp || new Date().toISOString();
      const formatted = new Date(ts).toLocaleDateString('en-GB');
      let updated = contractHtml || '';
      // English
      updated = updated.replace(/<p>Buyer \/ Authorized Representative<\/>\s*<p>Signature:[\s\S]*?<\/>\s*<p>Date:[\s\S]*?<\/>/m,
        `<p>Buyer / Authorized Representative</p>\n  <p>Signature: <strong>${name}</strong></p>\n  <p>Date: <strong>${formatted}</strong></p>`);
      // Hindi
      updated = updated.replace(/<p>खरीदार \/ अधिकृत प्रतिनिधि<\/>\s*<p>हस्ताक्षर:[\s\S]*?<\/>\s*<p>तिथि:[\s\S]*?<\/>/m,
        `<p>खरीदार / अधिकृत प्रतिनिधि</p>\n  <p>हस्ताक्षर: <strong>${name}</strong></p>\n  <p>तिथि: <strong>${formatted}</strong></p>`);
      // Kannada
      updated = updated.replace(/<p>ಖರೀದಿದಾರ \/ ಅಧಿಕೃತ ಪ್ರತಿನಿಧಿ<\/>\s*<p>ಸಹಿ:[\s\S]*?<\/>\s*<p>ದಿನಾಂಕ:[\s\S]*?<\/>/m,
        `<p>ಖರೀದಿದಾರ / ಅಧಿಕೃತ ಪ್ರತಿನಿಧಿ</p>\n  <p>ಸಹಿ: <strong>${name}</strong></p>\n  <p>ದಿನಾಂಕ: <strong>${formatted}</strong></p>`);
      setContractHtml(updated);
    } catch (e) { console.warn('injectBuyerSignature failed', e); }
  };

  const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');

  // helper to upload contract records to server (kopied and trimmed from farmer side)
  const uploadContractsToServer = async () => {
    if (!contractMetadata) return;
    if (uploadingContracts) return;
    setUploadingContracts(true);
    try {
      console.log('🔍 uploading contract records...', contractMetadata);
      const failedSaves = [];
      let savedContractNumber = null;
      const summary = {
        subtotal: (items.reduce((s, it) => s + ((Number(it.order_quantity || 0) || 0) * (Number(it.price_per_kg || 0) || 0)), 0)),
        platform_fee: 0,
        gst: 0
      };
      const buyerTotals = { commission: contractMetadata.buyer_platform_fee || 0, gst: contractMetadata.buyer_gst || 0 };
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

      for (const crop of cropsToSave) {
        try {
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
                const subtotal = summary.subtotal || 0;
                const buyerPlatformTotal = buyerTotals.commission || 0;
                const buyerGstTotal = buyerTotals.gst || 0;
                const share = (subtotal > 0) ? (cropAmount / subtotal) : 0;
                const bf = Math.round((buyerPlatformTotal * share + Number.EPSILON) * 100) / 100;
                const bg = Math.round((buyerGstTotal * share + Number.EPSILON) * 100) / 100;
                return Math.round((cropAmount + bf + bg + Number.EPSILON) * 100) / 100;
              } catch (e) { return null; }
            })(),
            farmer_total: (function() {
              try {
                const cropAmount = Number(crop.amount || 0);
                // we don't have orderItems here, so just subtract platform & gst evenly
                const fpf = contractMetadata.farmer_platform_fee || 0;
                const fg = contractMetadata.farmer_gst || 0;
                return Math.round((cropAmount - fpf - fg + Number.EPSILON) * 100) / 100;
              } catch (e) { return null; }
            })(),
            delivery_cost: contractMetadata.delivery_cost,
            status: 'pending'
          };
          if (digitalSignature) {
            contractPayload.signature_method = digitalSignature.signature_method;
            contractPayload.signature_timestamp = digitalSignature.signature_timestamp;
          }

          const saveRes = await fetch(`${apiBase}/contracts/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contractPayload)
          });

          if (saveRes && saveRes.ok) {
            const bodyJson = await saveRes.json().catch(() => null);
            if (bodyJson && bodyJson.contract_number && !savedContractNumber) {
              savedContractNumber = bodyJson.contract_number;
            }
          } else {
            const text = await (saveRes.text ? saveRes.text() : Promise.resolve('')).catch(() => '');
            failedSaves.push({ crop: crop.crop_name, status: saveRes ? saveRes.status : 'no-response', body: text });
          }
        } catch (e) {
          console.warn('❌ Error saving contract (fetch failed):', e);
          failedSaves.push({ crop: crop.crop_name, status: 'fetch-error', body: String(e) });
        }
      }
      if (failedSaves.length) {
        console.warn('Some contract rows failed to save:', failedSaves);
        alert(`${failedSaves.length} rows failed to save. See console for details.`);
      } else {
        alert('Contract saved successfully to server.');
        // notify farmer(s) about the new contract regardless of whether the
        // database returned an official number.  Use a local fallback if needed.
        try {
          const buyer = {
            id: contractMetadata.buyer_id || localStorage.getItem('agriai_id') || null,
            name: contractMetadata.buyer_name || localStorage.getItem('agriai_name') || '',
            phone: contractMetadata.buyer_phone || localStorage.getItem('agriai_phone') || '',
            email: localStorage.getItem('agriai_email') || ''
          };
          const contractNum = savedContractNumber || contractMetadata.contract_number;
          fetch(`${apiBase}/notifications/contract-submitted`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contract_number: contractNum,
              buyer,
              items: (contractMetadata.crops || []).map(c => ({
                ...c,
                farmer_id: c.farmer_id || contractMetadata.farmer_id
              }))
            })
          }).catch(() => {});

          // also store a local copy so farmers see it immediately (use same
          // contractNum fallback)
          try {
            const localKey = 'agriai_notifications';
            const rawLocal = localStorage.getItem(localKey);
            const localArr = rawLocal ? JSON.parse(rawLocal) : [];
            const byFarmer = {};
            (contractMetadata.crops || []).forEach(it => {
              const fid = it.farmer_id || contractMetadata.farmer_id || 'unknown';
              if (!byFarmer[fid]) byFarmer[fid] = [];
              byFarmer[fid].push(it);
            });
            Object.keys(byFarmer).forEach((fid, idx) => {
              const group = byFarmer[fid];
              const qty = group.reduce((s, x) => s + (Number(x.quantity || x.order_quantity || 0) || 0), 0);
              const notif = {
                id: `N${Date.now()}C${idx}`,
                contract_number: contractNum,
                created_at: new Date().toISOString(),
                farmer_id: fid === 'unknown' ? null : fid,
                buyer_name: buyer.name || '',
                buyer_id: buyer.id || null,
                items: group,
                quantity_kg: qty,
                crop_name: group[0] ? group[0].crop_name : 'Contract'
              };
              localArr.unshift(notif);
            });
            try { localStorage.setItem(localKey, JSON.stringify(localArr)); } catch (e) {}
            try { window.dispatchEvent(new Event('agriai:notifications:local:update')); } catch (e) {}
          } catch (e) { /* ignore */ }
        } catch (e) {
          console.warn('Failed to send contract notification', e);
        }

        clearCart();
        setShowContractPreview(false);
        setContractMetadata(null);
      }
    } catch (e) {
      console.warn('Error uploading contracts:', e);
      alert('Contract upload failed. See console.');
    } finally {
      // once done, clear any pending action so UI doesn't try to re-run it
      try { setPendingContractAction(null); } catch (e) {}
      setUploadingContracts(false);
      // reset OTP state so new contracts require fresh verification
      setOtpVerified(false);
      setDigitalSignature('');
    }
  };


  React.useEffect(() => {
    const [siteLang, setSiteLang] = (function(){
      // provide helper which persists across renders via closure
      const lang = localStorage.getItem('agri_lang') || 'en';
      return [lang, (v)=>{ try{ localStorage.setItem('agri_lang', v); }catch(e){} }];
    })();
    // create a reusable loader so we can call it on mount and when cart updates
    const loadCart = async () => {
      try {
        const userRole = localStorage.getItem('agriai_role') || '';
        const userId = localStorage.getItem('agriai_id') || '';
        const userPhone = localStorage.getItem('agriai_phone') || '';
        const cartKey = userRole === 'farmer' ? 'agriai_cart_farmer' : 'agriai_cart_buyer';

        // If user is signed in with role and has id/phone, try server-backed cart
        if (userRole && (userId || userPhone)) {
          try {
            const qp = userId ? `user_type=${encodeURIComponent(userRole)}&user_id=${encodeURIComponent(userId)}` : `user_type=${encodeURIComponent(userRole)}&user_phone=${encodeURIComponent(userPhone)}`;
            const res = await fetch(`${apiBase}/cart/list?${qp}`);
            if (res && res.ok) {
              const j = await res.json().catch(() => null);
              if (j && j.ok && Array.isArray(j.cart)) {
                // Map server rows to client item shape (preserve crop_id in id)
                const mapped = j.cart.map(r => ({
                  id: r.crop_id || r.id,
                  cart_id: r.id,
                  crop_name: r.crop_name || '',
                  // For buyer-backed rows: show available quantity from `total_quantity`
                  // and use `quantity_kg` as the selected/order quantity stored in the row.
                  quantity_kg: Number(r.total_quantity != null ? r.total_quantity : r.quantity_kg || 0),
                  price_per_kg: r.price_per_kg != null ? Number(r.price_per_kg) : 0,
                  image_url: r.image_path || r.image_url || '',
                  order_quantity: Number(r.quantity_kg || 0),
                  variety: r.variety || '',
                  user_type: r.user_type || userRole,
                  user_id: r.user_id || null,
                  user_phone: r.user_phone || null,
                }));
                setItems(mapped);
                try { localStorage.setItem(cartKey, JSON.stringify(mapped)); } catch (e) {}
                return;
              }
            }
          } catch (e) {
            // network error -> fall back to localStorage
            console.warn('Failed to load server cart, falling back to localStorage', e);
          }
        }

        // Fallback: load from localStorage (respect role-specific key)
        try {
          const raw = localStorage.getItem(cartKey);
          const arr = raw ? JSON.parse(raw) : [];
          const normalized = (Array.isArray(arr) ? arr : []).map(it => {
            try {
              const avail = Number(it.quantity_kg || 0) || 0;
              const order = (it.order_quantity !== undefined && it.order_quantity !== null) ? Number(it.order_quantity) : 0;
              return { ...it, quantity_kg: avail, order_quantity: order };
            } catch (e) { return it; }
          });
          setItems(normalized);
        } catch (e) {
          setItems([]);
        }
      } catch (e) {
        setItems([]);
      }
    };

    // initial load
    loadCart();

    // Refresh cart when other parts of the app dispatch 'agriai:cart:update'
    const handler = () => { try { loadCart(); } catch (e) { console.warn('cart update handler error', e); } };
    window.addEventListener('agriai:cart:update', handler);

    // cleanup
    return () => {
      try { window.removeEventListener('agriai:cart:update', handler); } catch (e) {}
    };
  }, []);

  // site language reactive helper: listen for global language changes
  React.useEffect(() => {
    const handler = (ev) => {
      try {
        const newLang = (localStorage.getItem('agri_lang') || 'en');
        // force re-render by dispatching a small state change using window property (avoid adding state variable)
        // We'll update a dummy custom event to notify components relying on translate calls.
        // (Simpler: trigger a cart update so components re-render)
        window.dispatchEvent(new Event('agriai:cart:update'));
      } catch (e) {}
    };
    window.addEventListener('agri:lang:change', handler);
    return () => { try { window.removeEventListener('agri:lang:change', handler); } catch (e) {} };
  }, []);

  const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  const clearCart = () => {
    (async () => {
      const userRole = localStorage.getItem('agriai_role') || '';
      const userId = localStorage.getItem('agriai_id') || '';
      const userPhone = localStorage.getItem('agriai_phone') || '';
      const cartKey = userRole === 'farmer' ? 'agriai_cart_farmer' : 'agriai_cart_buyer';
      if (userRole && (userId || userPhone)) {
        try {
          const payload = { user_type: userRole, user_id: userId || undefined, user_phone: userPhone || undefined };
          const res = await fetch(`${apiBase}/cart/clear`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          if (!res.ok) console.warn('cart/clear failed');
        } catch (e) { console.warn('cart/clear error', e); }
      }
      try { localStorage.setItem(cartKey, JSON.stringify([])); } catch (e) {}
      setItems([]);
      try { window.dispatchEvent(new Event('agriai:cart:update')); } catch (e) {}
    })();
  };

  const updateQuantity = (id, delta) => {
    try {
      const updated = items.map(it => {
        if (it.id !== id) return it;
        const avail = Number(it.quantity_kg || 0) || 0;
        const current = Number(it.order_quantity || 0) || 0;
        const next = Math.max(0, Math.min(avail, current + delta));
        return { ...it, order_quantity: next };
      });
      setItems(updated);
      const userRole = localStorage.getItem('agriai_role') || '';
      const userId = localStorage.getItem('agriai_id') || '';
      const userPhone = localStorage.getItem('agriai_phone') || '';
      const cartKey = userRole === 'farmer' ? 'agriai_cart_farmer' : 'agriai_cart_buyer';
      try { localStorage.setItem(cartKey, JSON.stringify(updated)); } catch (e) {}

      // persist change to server if we have cart row id
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
    } catch (e) { console.warn(e); }
  };

  const removeItem = (id) => {
    (async () => {
      try {
        const userRole = localStorage.getItem('agriai_role') || '';
        const userId = localStorage.getItem('agriai_id') || '';
        const userPhone = localStorage.getItem('agriai_phone') || '';
        const cartKey = userRole === 'farmer' ? 'agriai_cart_farmer' : 'agriai_cart_buyer';
        const it = items.find(x => x.id === id);
        // If server-backed (has cart_id), request deletion
        if (it && it.cart_id && userRole && (userId || userPhone)) {
          try {
            const payload = { ids: [it.cart_id], user_type: userRole, user_id: userId || undefined, user_phone: userPhone || undefined };
            const res = await fetch(`${apiBase}/cart/remove`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok) console.warn('cart/remove failed');
          } catch (e) { console.warn('cart/remove error', e); }
        }
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
  };

  const cancelEdit = () => { setEditingId(null); setEditVal(''); };

  const saveEdit = (id) => {
    try {
      const newVal = parseFloat(editVal);
      if (Number.isNaN(newVal) || newVal <= 0) { 
        alert('Please enter a valid order quantity (greater than 0).'); 
        return; 
      }
      const updated = items.map(it => {
        if (it.id === id) {
          const avail = Number(it.quantity_kg || 0) || 0;
          const final = Math.min(newVal, avail);
          return { ...it, order_quantity: final };
        }
        return it;
      });
      setItems(updated);
      const userRole = localStorage.getItem('agriai_role') || '';
      const userId = localStorage.getItem('agriai_id') || '';
      const userPhone = localStorage.getItem('agriai_phone') || '';
      const cartKey = userRole === 'farmer' ? 'agriai_cart_farmer' : 'agriai_cart_buyer';
      try { localStorage.setItem(cartKey, JSON.stringify(updated)); } catch (e) {}

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

      setEditingId(null);
      setEditVal('');
    } catch (e) { console.warn(e); }
  };

  // --- GST and Platform Fee Calculation ---
  const calculateGstAndCommission = (item) => {
    const qty = Number(item.order_quantity || 0);
    const price = Number(item.price_per_kg || 0);
    const total = qty * price;

    const userRole = (typeof window !== 'undefined' && window.localStorage) ? (localStorage.getItem('agriai_role') || '') : '';
    const cat = (item.category || item.cat || '') .toString().toLowerCase();

    let gstRate = 0;
    let commissionRate = 0;

      // compute platform fee & GST the same for buyers and farmers
    if (cat.includes('masala') || cat.includes('masalas') || (item.crop_name || '').toString().toLowerCase().includes('masala')) {
      commissionRate = 12; // Masalas
      gstRate = 5; // item GST for masalas
    } else if (cat.includes('fruit') || cat.includes('vegetable') || (item.crop_name || '').toString().toLowerCase().includes('fruit') || (item.crop_name || '').toString().toLowerCase().includes('vegetable')) {
      commissionRate = 9; // Fruits & Vegetables
      gstRate = 0;
    } else if (cat.includes('food') || cat.includes('food crop') || cat.includes('food crops') || cat.includes('crop') || cat.includes('crops')) {
      commissionRate = 7; // Food Crops
      gstRate = 0;
    } else {
      // default to food crops
      commissionRate = 7;
      gstRate = 0;
    }

    // compute amounts
    const itemGstAmt = (total * gstRate) / 100; // GST on item total
    const commissionAmt = (total * commissionRate) / 100; // platform fee
    const gstOnPlatformFee = commissionAmt * 0.18; // 18% GST on platform fee

    const gstAmt = itemGstAmt + gstOnPlatformFee;

    return { gstRate, commissionRate, gstAmt, commissionAmt, gstOnPlatformFee, lineTotal: total };
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

  const grandTotal = totals.subtotal + totals.gst + totals.commission;
  const totalAvailableQty = items.reduce((s, it) => s + (Number(it.quantity_kg || 0) || 0), 0);
  const totalOrderedQty = items.reduce((s, it) => s + (Number(it.order_quantity || 0) || 0), 0);
  const userRole = (typeof window !== 'undefined' && window.localStorage) ? (localStorage.getItem('agriai_role') || '') : '';

  // 🧾 Generate Invoice (with logo)
  const generateBill = () => {
    const invoiceId = 'ORD' + Date.now();
    const date = new Date().toLocaleString();

    // ✅ Embed the imported logo as a data URL (for display in print)
    const logoSrc = window.location.origin + logo;

    // compute delivery rate display (estimate) and labour charge for invoice
    const totalContractQty = totalOrderedQty;
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

    const computeLabourCharge = (q) => {
      if (!Number.isFinite(q) || q <= 0) return 0;
      if (q <= 100) return 40;
      if (q <= 1000) return 750;
      return Math.round(750 + ((q - 1000) / 1000) * 300);
    };
    const labourCharge = computeLabourCharge(qtyKg);

    const userRoleForBill = (typeof window !== 'undefined' && window.localStorage) ? (localStorage.getItem('agriai_role') || '') : '';
    // always include GST and platform fee columns on the generated invoice so buyers can see breakdown
    const includeFeesInBill = true;

    let html = `
      <html>
        <head>
          <title>Invoice ${invoiceId}</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 20px; color: #333; }
            h1 { color: #236902; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
            th { background: #f4f4f4; }
            .total { text-align: right; font-weight: bold; padding-right: 10px; }
            .footer { margin-top: 20px; font-size: 14px; color: #555; text-align: center; }
            #printBtn {
              background-color: #236902;
              color: white;
              border: none;
              padding: 8px 12px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 15px;
              margin: 15px auto;
              display: block;
            }
            #printBtn:hover { background-color: #1a4f02; }
            .infoBtn { margin-left: 8px; border: 0; background: #1a4f02; color: #fff; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; line-height: 18px; cursor: pointer; }
            .modal { position: fixed; left: 0; top: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; z-index: 10000; background: rgba(0,0,0,0.5); }
            .modal-content { width: 92%; max-width: 760px; background: #fff; border-radius: 8px; padding: 18px; box-shadow: 0 12px 40px rgba(0,0,0,0.25); overflow: auto; }
          </style>
        </head>
        <body>
          <div style="text-align:center;">
            <img src="${logoSrc}" alt="AgriAI Logo" style="width:100px;height:100px;display:block;margin:0 auto 10px auto;" />
            <h1>Agri AI Invoice</h1>
          </div>
          <p>
            <strong>Invoice ID:</strong> ${invoiceId}<br>
            <strong>Date:</strong> ${date}<br>
            <strong>Contract Nature:</strong> ${contractNature === 'pre-harvest' ? 'Pre-Harvest Production Contract' : 'Post-Harvest Procurement Contract'}<br>
            <strong>Contract Duration:</strong> ${contractDuration === 'one-time' ? 'One-Time' : (contractDuration === 'seasonal' ? 'Seasonal' : 'Yearly')}
          </p>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Crop Name</th>
                <th>Variety</th>
                <th>Quantity (kg)</th>
                <th>Price/kg</th>
                ${includeFeesInBill ? '<th>GST</th><th>Platform Fee</th>' : ''}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
    `;

    items.forEach((it, idx) => {
      const { gstAmt, commissionAmt, lineTotal } = calculateGstAndCommission(it);
      const itemTotal = lineTotal + gstAmt + commissionAmt;
      html += `
        <tr>
          <td>${idx + 1}</td>
          <td>${it.crop_name}</td>
          <td>${it.variety || ''}</td>
          <td>${it.order_quantity}</td>
          <td>₹${it.price_per_kg}</td>
          ${includeFeesInBill ? `<td>₹${gstAmt.toFixed(2)}</td><td>₹${commissionAmt.toFixed(2)}</td>` : ''}
          <td>₹${itemTotal.toFixed(2)}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
      <h3 style="text-align:right;margin-top:10px;">
        ${includeFeesInBill ? `GST Total: ₹${totals.gst.toFixed(2)}<br>Platform Fee: ₹${totals.commission.toFixed(2)}<br>` : ''}
        <span style="color:#236902;">Grand Total: ₹${grandTotal.toFixed(2)}</span>
      </h3>

      <div style="margin-top:8px;">
        <strong>Delivery / Logistics Charges (Payable After Delivery):</strong> ${deliveryRateDisplay} <button class="infoBtn" onclick="showDeliveryInfo()" aria-label="Delivery info">i</button><br/>
        
      </div>

      <div class="footer">
        <p><strong>Payment Method:</strong> ${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'}</p>
        <p>Thank you for choosing Agri AI!<br>We connect farmers and buyers with trust.</p>
      </div>

      <button id="printBtn" onclick="window.print()">Print / Save as PDF</button>

      <div id="deliveryModal" class="modal" style="display: none;">
        <div class="modal-content">
          <div style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px;">
            <div style="flex: 1;">
              <h3 style="margin: 0 0 8px 0; color: #236902;">Delivery & Logistics Charges</h3>
              <div style="font-size: 14px; color: #111; line-height: 1.5;">
                <div style="overflow: auto;">
                  <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 14px; text-align: center;">
                    <thead>
                      <tr>
                        <th style="border: 1px solid #ddd; padding: 8px; background: #f7f7f7; text-align: center;">Vehicle Type</th>
                        <th style="border: 1px solid #ddd; padding: 8px; background: #f7f7f7; text-align: center;">Typical Distance Range (km)</th>
                        <th style="border: 1px solid #ddd; padding: 8px; background: #f7f7f7; text-align: center;">Vehicle Capacity</th>
                        <th style="border: 1px solid #ddd; padding: 8px; background: #f7f7f7; text-align: center;">FIXED Cost per km (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td style="border: 1px solid #ddd; padding: 8px;">Bike Courier</td><td style="border: 1px solid #ddd; padding: 8px;">0 – 20 km</td><td style="border: 1px solid #ddd; padding: 8px;">Up to 40 kg</td><td style="border: 1px solid #ddd; padding: 8px;"><strong>₹12 / km</strong></td></tr>
                      <tr><td style="border: 1px solid #ddd; padding: 8px;">3-Wheeler Cargo (Auto / Ape)</td><td style="border: 1px solid #ddd; padding: 8px;">0 – 80 km</td><td style="border: 1px solid #ddd; padding: 8px;">0 – 400 kg</td><td style="border: 1px solid #ddd; padding: 8px;"><strong>₹18 / km</strong></td></tr>
                      <tr><td style="border: 1px solid #ddd; padding: 8px;">Mini Truck (Tata Ace / Pickup)</td><td style="border: 1px solid #ddd; padding: 8px;">0 – 100 km</td><td style="border: 1px solid #ddd; padding: 8px;">40 – 1500 kg</td><td style="border: 1px solid #ddd; padding: 8px;"><strong>₹22 / km</strong></td></tr>
                      </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div style="flex: 0 0 auto; margin-top: 12px;">
              <button onclick="hideDeliveryInfo()" style="background: #236902; color: #fff; border: none; border-radius: 6px; padding: 8px 10px; cursor: pointer; display: inline-block;">Close</button>
            </div>
          </div>
        </div>
      </div>

      <script>
        function showDeliveryInfo() {
          document.getElementById('deliveryModal').style.display = 'flex';
        }
        function hideDeliveryInfo() {
          document.getElementById('deliveryModal').style.display = 'none';
        }
      </script>
    </body>
  </html>
  `;

    const newWindow = window.open('', '_blank');
    newWindow.document.write(html);
    newWindow.document.close();
  };

  const sendContract = async () => {
    try {
      // if OTP has already been verified and we already built metadata, the
      // next invocation should actually persist the contract records instead of
      // re-generating the HTML.  This handles the case where the user clicked
      // "Send Contract" after verification.
      if (otpVerified && contractMetadata) {
        await uploadContractsToServer();
        // after upload we don't want to re-run the rest of this method
        return;
      }

      // start fresh: clear any previous OTP state so user gets a clean flow
      resetOtpModal();
      // determine language early so picker can use localized strings
      const lang = localStorage.getItem('agri_lang') || 'en';
      const tLang = (key) => t(key, lang);

      const startDateObj = new Date();
      const startDate = startDateObj.toLocaleDateString('en-GB');

      // create a small modal calendar control and wait for selection
      // resolves to a string (possibly empty) if OK was clicked, or null if
      // cancelled.  caller is responsible for looping if needed.
      const pickEndDate = () => {
        return new Promise(resolve => {
          const overlay = document.createElement('div');
          overlay.style = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; z-index:10001;';
          const box = document.createElement('div');
          box.style = 'background:#fff; padding:18px; border-radius:6px; text-align:center;';
          const label = document.createElement('p');
          label.textContent = tLang('enterDeliveryDate');
          label.style = 'margin:0 0 8px 0; font-size:16px; font-weight:bold;';
          box.appendChild(label);
          const inp = document.createElement('input');
          inp.type = 'date';
          inp.style = 'font-size:16px; padding:6px;';
          inp.placeholder = tLang('dateFormatHint') || 'dd-mm-yyyy';
          box.appendChild(inp);
          // show a hint about expected format below the field
          const hint = document.createElement('p');
          box.appendChild(hint);
          const btn = document.createElement('button');
          btn.textContent = tLang('ok') || 'OK';
          btn.style = 'margin-left:8px;padding:6px 12px;';
          btn.onclick = () => {
            const val = inp.value; // yyyy-mm-dd (may be empty)
            document.body.removeChild(overlay);
            resolve(val);
          };
          const cancel = document.createElement('button');
          // prefer generic cancel key; fallback to cancelButton or english
          cancel.textContent = tLang('cancel') || tLang('cancelButton') || 'Cancel';
          cancel.style = 'margin-left:4px;padding:6px 12px;';
          cancel.onclick = () => { document.body.removeChild(overlay); resolve(null); };
          box.appendChild(btn);
          box.appendChild(cancel);
          overlay.appendChild(box);
          document.body.appendChild(overlay);
        });
      };

      let endDate = '';
      let days = 0;
      try {
        // loop until user either cancels (null) or enters a non-empty value
        while (true) {
          const picked = await pickEndDate();
          if (picked === null) {
            // user clicked cancel – abort without alert
            return;
          }
          if (picked) {
            const ed = new Date(picked);
            if (!isNaN(ed.getTime())) {
              endDate = ed.toLocaleDateString('en-GB');
              days = Math.round((ed - startDateObj) / (24 * 3600 * 1000));
              if (days < 0) days = 0;
            }
            break; // valid date selected, exit loop
          }
          // picked was '', meaning OK pressed with no value
          alert(tLang('deliveryDateRequired') || 'Please enter a delivery date');
          // loop continues, picker will be shown again
        }
      } catch (e) { console.warn('date picker error', e); }

      const totalContractQty = totalOrderedQty;
      const totalCropTradeValue = items.reduce((s, it) => s + ((Number(it.order_quantity || 0) || 0) * (Number(it.price_per_kg || 0) || 0)), 0);
      const avgPricePerKg = totalContractQty > 0 ? (totalCropTradeValue / totalContractQty) : 0;

      // gather parties info & language
      // reuse lang from above (initialized before picker)
      const langName = lang === 'en' ? 'English' : (lang === 'hi' ? 'हिंदी' : (lang === 'kn' ? 'ಕನ್ನಡ' : 'English'));
      const fetchFirst = (keys, fallback) => {
        for (let k of keys) {
          try {
            const v = localStorage.getItem(k);
            if (v && v.toString().trim()) return v.toString().trim();
          } catch (e) {}
        }
        return fallback;
      };
      // determine farmer details from cart rows and/or backend lookup
      let farmerName = '';
      let farmerId = '';
      let farmerState = '';
      let farmerRegion = '';
      let farmerAddress = '';
      let farmerPhone = '';

      if (items && items.length > 0) {
        const first = items[0];
        // the cart row may carry the farmer id under several names depending
        // on where it came from (server, buyer dashboard, localStorage,
        // farmer cart, etc.).  check all known variants.
        farmerId = first.user_id || first.farmer_id || first.seller_id || first._farmer_id || '';
        // phone may also appear under buyer/color but usually user_phone or
        // seller_phone
        farmerPhone = first.user_phone || first.seller_phone || '';
      }

      if (farmerId || farmerPhone) {
        try {
          let qs = '';
          if (farmerId) qs += `id=${encodeURIComponent(farmerId)}`;
          if (farmerPhone) {
            if (qs) qs += '&';
            qs += `phone=${encodeURIComponent(farmerPhone)}`;
          }
          const resF = await fetch(`${apiBase}/farmer/get?${qs}`);
          if (resF && resF.ok) {
            const jf = await resF.json().catch(() => null);
            if (jf && jf.ok && jf.farmer) {
              farmerId = jf.farmer.id ? String(jf.farmer.id) : farmerId;
              if (jf.farmer.name) farmerName = jf.farmer.name;
              farmerState = jf.farmer.state || farmerState;
              farmerRegion = jf.farmer.region || farmerRegion;
              // other fields like address could be added here
            }
          }
        } catch (e) {
          console.warn('farmer/get failed', e);
        }
      }

      // fallback: if we still lack a name, maybe the user is actually the
      // farmer (unlikely on buyer page but safe)
      if (!farmerName && farmerId) {
        farmerName = localStorage.getItem('agriai_name') || '';
      }
      // if we still have no address, maybe the cart item itself stored one
      if (!farmerAddress && items && items.length > 0) {
        const first = items[0];
        farmerAddress = first.seller_address || first.farmer_address || '';
      }

      let buyerName = localStorage.getItem('agriai_name') || '[Buyer Name]';
      let buyerId = localStorage.getItem('agriai_id') || '';
      let buyerPhone = localStorage.getItem('agriai_phone') || '';
      let buyerState = localStorage.getItem('agriai_state') || '';
      let buyerRegion = localStorage.getItem('agriai_region') || '';
      let buyerAddress = '';
      // attempt to refresh buyer info from backend (use id or phone to ensure we
      // pick up the correct buyer row – localStorage value may be stale).
      if (buyerId || buyerPhone) {
        try {
          let qs = '';
          if (buyerId) qs += `id=${encodeURIComponent(buyerId)}`;
          if (buyerPhone) {
            if (qs) qs += '&';
            qs += `phone=${encodeURIComponent(buyerPhone)}`;
          }
          const resB = await fetch(`${apiBase}/buyer/get?${qs}`);
          if (resB && resB.ok) {
            const jb = await resB.json().catch(() => null);
            if (jb && jb.ok && jb.buyer) {
              buyerId = jb.buyer.id ? String(jb.buyer.id) : buyerId;
              if (jb.buyer.name) buyerName = jb.buyer.name;
              buyerState = jb.buyer.state || buyerState;
              buyerRegion = jb.buyer.region || buyerRegion;
              buyerAddress = jb.buyer.address || buyerAddress;
            }
          }
        } catch (e) { console.warn('buyer/get failed', e); }
      }
      // keep state in sync so signature injection can use same display name
      setCurrentBuyerName(buyerName);

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

      const logoSrc = window.location.origin + logo;

      // assemble contract metadata for later upload
      const metadata = {
        contract_number: 'CNT' + Date.now(),
        farmer_id: farmerId,
        farmer_name: farmerName,
        farmer_address: farmerAddress,
        farmer_state: farmerState,
        buyer_id: buyerId,
        buyer_name: buyerName,
        buyer_address: buyerAddress,
        buyer_state: buyerState,
        contract_nature: contractNature,
        contract_duration: contractDuration,
        start_date: startDate,
        end_date: endDate,
        duration: days,
        farmer_platform_fee: totalPlatformFee,
        farmer_gst: totalGst,
        buyer_platform_fee: buyerPlatformFee,
        buyer_gst: buyerGst,
        delivery_cost: deliveryRateDisplay,
        crops: (items || []).map(it => ({
          id: it.id,
          buyer_id: it.buyer_id,
          crop_name: it.crop_name,
          variety: it.variety || '',
          quantity: Number(it.order_quantity || 0),
          price_per_kg: Number(it.price_per_kg || 0),
          amount: Number(it.order_quantity || 0) * Number(it.price_per_kg || 0)
        }))
      };
      setContractMetadata(metadata);

      const rowsHtml = (items || []).map((it, idx) => {
        const qty = Number(it.order_quantity || 0) || 0;
        const variety = it.variety || it.Variety || '';
        const price = Number(it.price_per_kg || 0) || 0;
        const amount = Math.round((qty * price + Number.EPSILON) * 100) / 100;
        return `<tr>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${idx + 1}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${it.crop_name || ''}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${variety}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${qty.toLocaleString('en-IN')} kg</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${formatCurrency(price)}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${formatCurrency(amount)}</td>
        </tr>`;
      }).join('');

      let html = '';
      // choose template based on language
      if (lang === 'hi') {
        // hindi contract
        html = `<!doctype html>
          <html>
    <head>
      <meta charset="utf-8" />
      <title>AgriAI Contract</title>
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
        <img src="${logoSrc}" alt="AgriAI" style="width:120px;height:auto;margin-bottom:8px" />
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
      <p><b>पता:</b> ${buyerAddress || '[Buyer Address]'}${buyerState ? ', ' + buyerState : ''}</p>
      <p><strong>पक्ष B – किसान / उत्पादक</strong></p>
      <p><b>नाम: </b> ${farmerName}</p>
      <p><b>किसान आईडी:</b> ${farmerId}</p>
      <p><b>पता:</b> ${farmerAddress || ''}${farmerState ? (farmerAddress ? ', ' + farmerState : '' + farmerState) : ''}
</p>
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
        यह अनुबंध किसान को ${langName} (भाषा) में समझाया एवं अनुवादित किया गया है।
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
    
      <p>गवाह : <strong>एग्री एआई</strong></p>
    </section>
    
    
`;
      } else if (lang === 'kn') {
        // kannada contract
        html = `<!doctype html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>AgriAI Contract</title>
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
        <img src="${logoSrc}" alt="AgriAI" style="width:120px;height:auto;margin-bottom:8px" />
        <h1>
      ಅಗ್ರಿ AI<br/>
      ಒಪ್ಪಂದ ಕೃಷಿ ಒಪ್ಪಂದ
    </h1>
    
    </div>
    
    <section class="section">
      <h2>ಪಕ್ಷಗಳು </h2>
    
      <p><strong>ಪಕ್ಷ A – ಖರೀದಿದಾರ / ಕಂಪನಿ</strong></p>
      <p><b>ಹೆಸರು:</b> ${buyerName}</p>
      <p><b>ಖರೀದಿದಾರ ಐಡಿ:</b> ${buyerId || '[Buyer ID]'}</p>
      <p><b>ವಿಳಾಸ:</b>${buyerAddress || buyerState || '[Buyer Address/State]'}${(buyerAddress && buyerState) ? ', ' + buyerState : ''}</p>
    
      <p><strong>ಪಕ್ಷ B – ರೈತ / ಉತ್ಪಾದಕ</strong></p>
      <p><b>ಹೆಸರು:</b> ${farmerName}</p>
      <p><b>ರೈತ ಐಡಿ:</b> ${farmerId}</p>
      <p><b>ವಿಳಾಸ:</b> ${farmerAddress || '[Farmer Address]'}${farmerState ? ', ' + farmerState : ''}</p>
    
      <p>
        ಪಕ್ಷ A ಮತ್ತು ಪಕ್ಷ B ಒಟ್ಟಾಗಿ “ಪಕ್ಷಗಳು” ಎಂದು ಕರೆಯಲ್ಪಡುತ್ತವೆ.
        ಅಗ್ರಿAI ಕೇವಲ ಡಿಜಿಟಲ್ ಸೌಲಭ್ಯ ಒದಗಿಸುವ ವೇದಿಕೆಯಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ ಮತ್ತು ಯಾವುದೇ ಖರೀದಿದಾರ, ಮಾರಾಟಗಾರ, ಸಾರಿಗೆದಾರ, ವಿಮೆದಾರ ಅಥವಾ ಯಾವುದಾದರೂ ಪಕ್ಷದ ಪ್ರತಿನಿಧಿಯಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುವುದಿಲ್ಲ.
      </p>
    </section>
    
    <section class="section">
      <h2>1. ಒಪ್ಪಂದದ ಉದ್ದೇಶ</h2>
    
      <p>
        ಈ ಒಪ್ಪಂದವು ರೈತನು ಕೃಷಿ ಉತ್ಪನ್ನಗಳನ್ನು ಉತ್ಪಾದಿಸಿ ಖರೀದಿದಾರರಿಗೆ ಪೂರೈಸಲು ಹಾಗೂ ಖರೀದಿದಾರನು ಪೂರ್ವನಿರ್ಧರಿತ ಬೆಲೆಗೆ ಆ ಉತ್ಪನ್ನಗಳನ್ನು ಖರೀದಿಸಲು ಒಪ್ಪಿಕೊಂಡಿರುವ ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ವಗಳನ್ನು ವಿವರಿಸುತ್ತದೆ. ಇದರ ಮೂಲಕ ಕೆಳಗಿನ ಉದ್ದೇಶಗಳನ್ನು ಸಾಧಿಸಲಾಗುತ್ತದೆ:
      </p>
    
      <ul>
        <li>ರೈತನಿಗೆ ಖಚಿತ ಮಾರುಕಟ್ಟೆ ಪ್ರವೇಶ</li>
        <li>ನ್ಯಾಯಸಮ್ಮತ ಮತ್ತು ಪಾರದರ್ಶಕ ಬೆಲೆ ನಿಗದಿ</li>
        <li>ಸಮಯೋಚಿತ ಮತ್ತು ಸುರಕ್ಷಿತ ಪಾವತಿ</li>
        <li>ಮಧ್ಯವರ್ತಿಗಳ ಮೇಲಿನ ಅವಲಂಬನೆ ಕಡಿತ</li>
      </ul>
    </section>
    <section class="section">
      <h2>2. ಒಪ್ಪಂದದ ಪ್ರಕಾರ ಮತ್ತು ಅವಧಿ </h2>
    
      <p>
        ಒಪ್ಪಂದದ ಸ್ವರೂಪ:
        ${contractNature === 'pre-harvest'
          ? 'ಕೊಯ್ಲು ಪೂರ್ವ ಉತ್ಪಾದನಾ ಒಪ್ಪಂದ (Pre-Harvest Production Contract)'
          : 'ಕೊಯ್ಲು ನಂತರ ಖರೀದಿ ಒಪ್ಪಂದ (Post-Harvest Procurement Contract)'}
      </p>
    
      <p>
        ಒಪ್ಪಂದ ಅವಧಿ:
        ${contractDuration === 'one-time'
          ? 'ಒಮ್ಮೆ ಮಾತ್ರ (One-Time)'
          : (contractDuration === 'seasonal'
              ? 'ಋತು ಆಧಾರಿತ (Seasonal)'
              : 'ವಾರ್ಷಿಕ (Yearly)')}
      </p>
    
      <p><b>ಪ್ರಾರಂಭ ದಿನಾಂಕ:</b> ${startDate}</p>
      <p><b>ಅಂತಿಮ ದಿನಾಂಕ:</b> ${endDate}</p>
      <p><b>ಒಟ್ಟು ಅವಧಿ:</b> ${days} ದಿನಗಳು</p>
    
      <p>
        ಈ ಕೊಯ್ಲು ನಂತರದ ಖರೀದಿ ಒಪ್ಪಂದದ ಅಡಿಯಲ್ಲಿ, ಕೃಷಿ ಉತ್ಪನ್ನವನ್ನು ಈ ಒಪ್ಪಂದವನ್ನು ಜಾರಿಗೆ ತರುವ ಮೊದಲುಲೇ ಬೆಳೆಯಲಾಗಿದ್ದು ಅಥವಾ ಕೊಯ್ಲು ಮಾಡಲಾಗಿದೆ. ಆದ್ದರಿಂದ, ಈ ಒಪ್ಪಂದದ ಅಡಿಯಲ್ಲಿ ಯಾವುದೇ ಕೃಷಿ ಉತ್ಪಾದನಾ ಕर्तವ್ಯ ಅಥವಾ ಬೆಳೆ ಬೆಳೆಸುವ ಬಾಧ್ಯತೆ ಉಂಟಾಗುವುದಿಲ್ಲ.
      </p>
    
      <h3><strong>2.1 ಒಪ್ಪಂದ ಸ್ವೀಕೃತಿ ಮತ್ತು ಮಾತುಕತೆ ಅವಧಿ </strong></h3>
    
      <p>
        ಈ ಖರೀದಿ ಒಪ್ಪಂದವು ರೈತನು ಅಗ್ರಿAI ವೇದಿಕೆಯ ಮೂಲಕ ಖರೀದಿದಾರರಿಗೆ ಡಿಜಿಟಲ್ ರೀತಿಯಲ್ಲಿ ಕಳುಹಿಸಿದ ಸಮಯದಿಂದ ನಾಲ್ವತ್ತೆಂಟು (48) ಗಂಟೆಗಳ ಅವಧಿಯವರೆಗೆ ಸ್ವೀಕೃತಿಗಾಗಿ ಮಾನ್ಯವಾಗಿರುತ್ತದೆ.
      </p>
    
      <p>
        ಈ 48 ಗಂಟೆಗಳ ಅವಧಿಯೊಳಗೆ, ಖರೀದಿದಾರನು ವೇದಿಕೆಯ ಮೂಲಕ ಕೆಳಗಿನ ಕ್ರಮಗಳಲ್ಲಿ ಒಂದನ್ನು ಕೈಗೊಳ್ಳಬೇಕು:
      </p>
    
      <ul>
        <li>ಒಪ್ಪಂದವನ್ನು ಪ್ರಸ್ತುತ ರೂಪದಲ್ಲೇ ಸ್ವೀಕರಿಸುವುದು; ಅಥವಾ</li>
        <li>ಒಪ್ಪಂದವನ್ನು ತಿರಸ್ಕರಿಸುವುದು; ಅಥವಾ</li>
        <li>ಬೆಲೆ ಮಾತುಕತೆಗೆ ವಿನಂತಿಸುವುದು.</li>
      </ul>
    
      <p>
        ಖರೀದಿದಾರನು 48 ಗಂಟೆಗಳ ಮಾನ್ಯ ಅವಧಿಯೊಳಗೆ ಯಾವುದೇ ಕ್ರಮ ಕೈಗೊಳ್ಳದಿದ್ದರೆ,
        ಒಪ್ಪಂದವು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಅವಧಿ ಮುಗಿದಂತೆ ಪರಿಗಣಿಸಲಾಗುತ್ತದೆ ಮತ್ತು
        ಯಾವುದೇ ಪಕ್ಷಕ್ಕೂ ಕಾನೂನುಬದ್ಧ ಅಥವಾ ಬಾಧ್ಯತೆಯ ಪರಿಣಾಮ ಉಂಟಾಗುವುದಿಲ್ಲ.
      </p>
    
      <p>
        ಬೆಲೆ ಮಾತುಕತೆಗೆ ಸಂಬಂಧಿಸಿದ ಯಾವುದೇ ವಿನಂತಿ ಸಮಯ ಮಿತಿಯೊಳಗೆ ಪೂರ್ಣಗೊಳ್ಳಬೇಕು
        ಮತ್ತು ಮಾತುಕತೆ ಪ್ರಾರಂಭವಾದ ಸಮಯದಿಂದ ನಾಲ್ವತ್ತೆಂಟು (48) ಗಂಟೆಗಳೊಳಗೆ
        ಅಂತಿಮಗೊಳ್ಳಬೇಕು. ಈ ಅವಧಿಯೊಳಗೆ ಒಪ್ಪಂದ ಸಾಧಿಸಲ್ಪಡದಿದ್ದರೆ,
        ಮಾತುಕತೆ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ರದ್ದು ಆಗುತ್ತದೆ ಮತ್ತು ಒಪ್ಪಂದವೂ
        ರದ್ದುಗೊಂಡಂತೆ ಪರಿಗಣಿಸಲಾಗುತ್ತದೆ.
      </p>
    </section>
    
<section class="section">
      <h2>3. ಡೇಟಾ ಗೌಪ್ಯತೆ ಮತ್ತು ವೇದಿಕೆ ಅನುಸರಣೆ </h2>
    
      <p>
        ಅಗ್ರಿAI ವೇದಿಕೆಯ ಮೂಲಕ ಸಂಗ್ರಹಿಸಲಾದ ಎಲ್ಲಾ ವೈಯಕ್ತಿಕ,
        ಕೃಷಿ ಸಂಬಂಧಿತ ಮತ್ತು ವ್ಯವಹಾರ ಸಂಬಂಧಿತ ಮಾಹಿತಿಯನ್ನು:
      </p>
    
      <ul>
        <li>ಸುರಕ್ಷಿತವಾಗಿ ಸಂಗ್ರಹಿಸಲಾಗುತ್ತದೆ</li>
        <li>ಕೆಳಗಿನ ಉದ್ದೇಶಗಳಿಗೆ ಮಾತ್ರ ಬಳಸಲಾಗುತ್ತದೆ:</li>
        <li>ಒಪ್ಪಂದ ಜಾರಿಗೆ ಮತ್ತು ನವೀಕರಣಕ್ಕೆ</li>
        <li>ಪಾವತಿ ಸಮನ್ವಯ ಮತ್ತು ಪರಿಹಾರಕ್ಕಾಗಿ</li>
        <li>ವಿಮೆ ಸೌಲಭ್ಯ ಒದಗಿಸಲು</li>
        <li>ಕಾನೂನು ಮತ್ತು ನಿಯಂತ್ರಣ ಅನುಸರಣೆಗೆ</li>
      </ul>
    
      <p>
        ಈ ಒಪ್ಪಂದವು ಡಿಜಿಟಲ್ ಪರ್ಸನಲ್ ಡೇಟಾ ಪ್ರೊಟೆಕ್ಷನ್ ಕಾಯ್ದೆ, 2023
        (Digital Personal Data Protection Act, 2023) ಗೆ ಸಂಪೂರ್ಣವಾಗಿ ಅನುಗುಣವಾಗಿದೆ.
      </p>
    </section>
    <section class="section">
      <h2>4. ವಸ್ತು ವಿವರಗಳು </h2>
    
      <table style="border-collapse:collapse;width:100%;margin-top:12px;">
        <thead>
          <tr>
            <th style="padding:8px;border:1px solid #ddd;text-align:center">ಕ್ರಮ ಸಂಖ್ಯೆ</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:center">ಬೆಳೆ ಹೆಸರು</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:center">ವೈವಿಧ್ಯ (Variety)</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:center">ಪ್ರಮಾಣ</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:center">ಬೆಲೆ (₹/ಕೆಜಿ)</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:center">ಮೊತ್ತ</th>
          </tr>
        </thead>
    
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </section>
    
    <section class="section">
      <h2>5. ಬೆಲೆ ಮತ್ತು ಪಾವತಿ ನಿಯಮಗಳು </h2>
    
      <p><strong>5.1 ರೈತ </strong></p>
      <p>ಒಟ್ಟು ಪ್ರಮಾಣ: ${totalContractQty.toLocaleString('en-IN')} ಕೆಜಿ</p>
      <p>ಬೆಲೆ: ${formatCurrency(avgPricePerKg)} ಪ್ರತಿ ಕೆಜಿ</p>
      <p>ವೇದಿಕೆ ಶುಲ್ಕ (Platform Fee): ${formatCurrency(totalPlatformFee)}</p>
      <p>ವೇದಿಕೆ ಶುಲ್ಕದ ಮೇಲೆ GST: ${formatCurrency(totalGst)}</p>
      <p><strong>ಒಟ್ಟು ಮೊತ್ತ (ಕಡಿತದ ನಂತರ): ${formatCurrency(totalAmountInvoice)}</strong></p>
    
      <p><strong>5.2 ಖರೀದಿದಾರ </strong></p>
      <p>ಒಟ್ಟು ಪ್ರಮಾಣ: ${totalContractQty.toLocaleString('en-IN')} ಕೆಜಿ</p>
      <p>ಬೆಲೆ: ${formatCurrency(avgPricePerKg)} ಪ್ರತಿ ಕೆಜಿ</p>
      <p>ವೇದಿಕೆ ಶುಲ್ಕ (Platform Fee): ${formatCurrency(buyerPlatformFee)}</p>
      <p>ವೇದಿಕೆ ಶುಲ್ಕದ ಮೇಲೆ GST: ${formatCurrency(buyerGst)}</p>
      <p><strong>ಒಟ್ಟು ಮೊತ್ತ (ಸೇರಿಕೆಯ ನಂತರ): ${formatCurrency(buyerTotalAmount)}</strong></p>
    
      <p><strong>5.3 ಪಾವತಿ ವೇಳಾಪಟ್ಟಿ </strong></p>
    
      <p>
        ಒಟ್ಟು ಬೆಳೆ ವಹಿವಾಟಿನ ಮೌಲ್ಯದ 25% ಅನ್ನು ಖರೀದಿದಾರನು
        ಒಪ್ಪಂದ ದೃಢೀಕರಣದ ಸಮಯದಲ್ಲಿ ಅಗ್ರಿAI ವೇದಿಕೆಯ ಮೂಲಕ ಮುಂಗಡವಾಗಿ ಪಾವತಿಸಬೇಕು.
      </p>
    
      <p>
        ಒಟ್ಟು ಬೆಳೆ ವಹಿವಾಟಿನ ಮೌಲ್ಯದ 50% ಅನ್ನು ಉತ್ಪನ್ನದ
        ಯಶಸ್ವಿ ವಿತರಣೆಯ ತಕ್ಷಣ ಪಾವತಿಸಬೇಕು.
      </p>
    
      <p>
        ಉತ್ಪನ್ನದ ಗುಣಮಟ್ಟ ಪರಿಶೀಲನೆ ಮತ್ತು ಅಧಿಕೃತ ಸ್ವೀಕೃತಿಯ ನಂತರ
        ಉಳಿದ 25% ಮೊತ್ತವನ್ನು 7 (ಏಳು) ಕಾರ್ಯದಿನಗಳೊಳಗೆ ಪಾವತಿಸಬೇಕು.
      </p>
    
      <p><strong>5.4 ಪಾವತಿ ವಿಧಾನ </strong></p>
    
      <p>ಬ್ಯಾಂಕ್ ವರ್ಗಾವಣೆ / UPI / ಚೆಕ್</p>
    
      <p>
        ಈ ಒಪ್ಪಂದದ ಅಡಿಯಲ್ಲಿ ಮಾಡಿದ ಎಲ್ಲಾ ಪಾವತಿಗಳಿಗೆ ಖರೀದಿದಾರನು
        ಡಿಜಿಟಲ್ ಅಥವಾ ಭೌತಿಕ ರಸೀದಿಗಳನ್ನು ನೀಡಬೇಕು.
      </p>
    
    </section>
    <section class="section">
      <h2>6. ವಿತರಣೆ, ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಮತ್ತು ಸಾರಿಗೆ </h2>
    
      <p><strong>6.1 ಅಗ್ರಿAI ಯ ಪಾತ್ರ </strong></p>
      <p>
        ಅಗ್ರಿAI ಖರೀದಿದಾರರು ಮತ್ತು ರೈತರ ನಡುವೆ ವ್ಯವಹಾರಗಳನ್ನು ಸುಗಮಗೊಳಿಸುವ
        ಡಿಜಿಟಲ್ ತಂತ್ರಜ್ಞಾನ ವೇದಿಕೆಯಾಗಿ ಮಾತ್ರ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ.
        ಅಗ್ರಿAI ಅನ್ನು ಯಾವುದೇ ಸಂದರ್ಭದಲ್ಲೂ ಖರೀದಿದಾರ, ಮಾರಾಟಗಾರ, ವ್ಯಾಪಾರಿ,
        ಕಮಿಷನ್ ಏಜೆಂಟ್, ಸಾರಿಗೆದಾರ ಅಥವಾ ಸರಕುಗಳ ಸಂರಕ್ಷಕ ಎಂದು ಪರಿಗಣಿಸಲಾಗುವುದಿಲ್ಲ.
        ಮಾರಾಟ ಮತ್ತು ಖರೀದಿಗೆ ಸಂಬಂಧಿಸಿದ ಎಲ್ಲಾ ಬಾಧ್ಯತೆಗಳು ಸಂಪೂರ್ಣವಾಗಿ
        ಸಂಬಂಧಿತ ಪಕ್ಷಗಳ ನಡುವೆಯೇ ಇರುತ್ತವೆ.
      </p>
    
      <p><strong>6.2 ವಿತರಣಾ ಸೌಲಭ್ಯ </strong></p>
      <p>
        ಸಾರಿಗೆ ಸೇವೆಯನ್ನು ಅಗ್ರಿAI ವೇದಿಕೆಯಲ್ಲಿ ಲಭ್ಯವಿರುವ ಅಥವಾ ಅನುಮೋದಿತ
        ತೃತೀಯ ಪಕ್ಷ ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಸೇವಾ ಪೂರೈಕೆದಾರರ ಮೂಲಕ ವ್ಯವಸ್ಥೆ ಮಾಡಲಾಗುತ್ತದೆ.
        ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಪೂರೈಕೆದಾರ ಹಾಗೂ ವಾಹನದ ಆಯ್ಕೆ ಬೆಳೆ ಸ್ವರೂಪ,
        ಪ್ರಮಾಣ, ದೂರ ಮತ್ತು ನಿರ್ವಹಣಾ ಅಗತ್ಯತೆಗಳ ಆಧಾರದ ಮೇಲೆ ನಿರ್ಧರಿಸಲಾಗುತ್ತದೆ.
      </p>
    
      <p><strong>6.3 ವಿತರಣಾ ಶುಲ್ಕಗಳು </strong></p>
      <p>
        ವಿತರಣಾ ಶುಲ್ಕಗಳನ್ನು ತೃತೀಯ ಪಕ್ಷ ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಪೂರೈಕೆದಾರರು
        ನಿಜವಾದ ದೂರ, ವಾಹನದ ಪ್ರಕಾರ, ಲೋಡಿಂಗ್ ಅಗತ್ಯತೆಗಳು ಮತ್ತು ಸ್ಥಳದ ಆಧಾರದ ಮೇಲೆ ನಿರ್ಧರಿಸುತ್ತಾರೆ.
        ಈ ಶುಲ್ಕಗಳನ್ನು ಖರೀದಿದಾರನು ನೇರವಾಗಿ ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಪೂರೈಕೆದಾರರಿಗೆ ಪಾವತಿಸಬೇಕು.
        ವಿತರಣಾ ಬೆಲೆ ನಿರ್ಧಾರ ಅಥವಾ ಮಾತುಕತೆಯಲ್ಲಿ ಅಗ್ರಿAI ಯಾವುದೇ ಜವಾಬ್ದಾರಿಯನ್ನು ಹೊಂದಿರುವುದಿಲ್ಲ.
      </p>
    
      <p><strong>6.4 ಅಪಾಯದ ವರ್ಗಾವಣೆ </strong></p>
      <p>
        ಸಾಗಣೆಯ ಅವಧಿಯಲ್ಲಿ ಉತ್ಪನ್ನದ ಅಪಾಯ ಮತ್ತು ಜವಾಬ್ದಾರಿ
        ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಪೂರೈಕೆದಾರರಲ್ಲೇ ಇರುತ್ತದೆ.
        ಯಶಸ್ವಿ ವಿತರಣೆ ಹಾಗೂ ಸಹಿ ಮಾಡಲಾದ ವಿತರಣಾ ದೃಢೀಕರಣ (Proof of Delivery – POD)
        ನಂತರ ಮಾತ್ರ ಅಪಾಯವು ಖರೀದಿದಾರರಿಗೆ ವರ್ಗಾಯಿಸಲಾಗುತ್ತದೆ.
      </p>
    
      <p><strong>6.5 ವಿಳಂಬ, ಹಾನಿ ಮತ್ತು ನಷ್ಟ </strong></p>
      <p>
        ಸಾಗಣೆ ವೇಳೆ ಉಂಟಾಗುವ ಯಾವುದೇ ವಿಳಂಬ, ಹಾನಿ, ಕೊರತೆ ಅಥವಾ ನಷ್ಟವು
        ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಪೂರೈಕೆದಾರರ ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳ ಪ್ರಕಾರ ನಿರ್ವಹಿಸಲಾಗುತ್ತದೆ.
        ಇಂತಹ ಯಾವುದೇ ದಾವೆಗಳಿಗೆ ಅಗ್ರಿAI ಜವಾಬ್ದಾರಿಯಾಗಿರುವುದಿಲ್ಲ.
      </p>
    
      <p><strong>6.6 ವಿತರಣಾ ದೃಢೀಕರಣ </strong></p>
      <p>
        ವಿತರಣೆಯನ್ನು ಭೌತಿಕ ರಸೀದಿ, ಡಿಜಿಟಲ್ ದೃಢೀಕರಣ ಮತ್ತು/ಅಥವಾ
        ಅಗ್ರಿAI ವೇದಿಕೆಯಲ್ಲಿ ದಾಖಲಾಗುವ ಎಲೆಕ್ಟ್ರಾನಿಕ್ POD ಮೂಲಕ ದೃಢೀಕರಿಸಲಾಗುತ್ತದೆ.
        ಅಗ್ರಿAI ನಿರ್ವಹಿಸುವ ಡಿಜಿಟಲ್ ದಾಖಲೆಗಳು ಮಾನ್ಯವಾದ
        ವಿತರಣಾ ಸಾಕ್ಷ್ಯವಾಗಿ ಪರಿಗಣಿಸಲಾಗುತ್ತದೆ.
      </p>
    
    </section>
    <section class="section">
      <h2>7. ಗುಣಮಟ್ಟದ ಮಾನದಂಡಗಳು, ಪರಿಶೀಲನೆ ಮತ್ತು ಸ್ವೀಕೃತಿ
        
      </h2>
    
      <p>
        ಪೂರೈಸಲಾಗುವ ಕೃಷಿ ಉತ್ಪನ್ನವು ಈ ಒಪ್ಪಂದದಲ್ಲಿ ಪರಸ್ಪರ ಒಪ್ಪಿಕೊಂಡಿರುವ
        ನಿರ್ದಿಷ್ಟ ಗುಣಮಟ್ಟದ ಮಾನದಂಡಗಳನ್ನು ಪೂರೈಸಿರಬೇಕು.
      </p>
    
      <p>
        ವಿತರಣೆಯ ದಿನಾಂಕದಿಂದ 3 (ಮೂರು) ಕಾರ್ಯದಿನಗಳೊಳಗೆ
        ಖರೀದಿದಾರನು ಗುಣಮಟ್ಟ ಪರಿಶೀಲನೆಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಬೇಕು.
      </p>
    
      <p>
        ಯಾವುದೇ ತಿರಸ್ಕಾರವನ್ನು ಪರಿಶೀಲನಾ ಅವಧಿಯೊಳಗೆ ಅಗ್ರಿAI ವೇದಿಕೆಯ ಮೂಲಕ
        ಲಿಖಿತ ರೂಪದಲ್ಲಿ ಸಲ್ಲಿಸಬೇಕು ಹಾಗೂ ಮಾನ್ಯ ಮತ್ತು ಪರಿಶೀಲಿಸಬಹುದಾದ
        ಕಾರಣಗಳನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಉಲ್ಲೇಖಿಸಬೇಕು.
      </p>
    
      <p>
        3 ಕಾರ್ಯದಿನಗಳೊಳಗೆ ಯಾವುದೇ ವಿವಾದ ದಾಖಲಿಸಲಾಗದಿದ್ದರೆ,
        ಉತ್ಪನ್ನವನ್ನು ಸ್ವೀಕರಿಸಲಾಗಿದೆ ಎಂದು ಪರಿಗಣಿಸಲಾಗುತ್ತದೆ.
      </p>
    
      <p>
        ಸಮರ್ಥನೀಯ ತಿರಸ್ಕಾರದ ಸಂದರ್ಭದಲ್ಲಿ, ದೋಷವು ಸಾಗಣೆಗೆ ಮುನ್ನವೇ ಉಂಟಾಗಿದೆ
        ಎಂದು ಸಾಬೀತಾಗದ ಹೊರತು, ಮರಳಿ ಸಾಗಣೆ ವೆಚ್ಚವನ್ನು ಖರೀದಿದಾರನು ಭರಿಸಬೇಕು.
      </p>
    </section>
    
    <section class="section">
      <h2>8. ಅಪಾಯ, ಜವಾಬ್ದಾರಿ ಮತ್ತು ವಿಮೆ
        
      </h2>
    
      <p>
        ರೈತನು ಸಾಮಾನ್ಯ ಕೃಷಿ ಮತ್ತು ಕೊಯ್ಲಿನ ನಂತರದ
        ಪ್ರಮಾಣಿತ ವಿಧಾನಗಳನ್ನು ಅನುಸರಿಸಬೇಕು.
      </p>
    
      <p>
        ಸಾಗಣೆಗೆ ಮುನ್ನ ಪ್ರಕೃತಿ ವಿಕೋಪಗಳು ಅಥವಾ ಫೋರ್ಸ್ ಮಜ್ಯೂರ್
        (Force Majeure) ಪರಿಸ್ಥಿತಿಗಳಿಂದ ಬೆಳೆ ನಷ್ಟವಾದಲ್ಲಿ,
        ಪಕ್ಷಗಳ ಪರಸ್ಪರ ಒಪ್ಪಿಗೆಯೊಂದಿಗೆ ಬಾಧ್ಯತೆಗಳನ್ನು ಮರುಪರಿಶೀಲಿಸಬಹುದು.
        ಪ್ರಧಾನಮಂತ್ರಿ ಫಸಲ್ ಬೀಮಾ ಯೋಜನೆ (PMFBY) ಅಥವಾ ಇತರ
        ಅನುಮೋದಿತ ವಿಮಾ ಯೋಜನೆಗಳ ಅಡಿಯಲ್ಲಿ ಪಡೆದಿರುವ ಬೆಳೆ ವಿಮೆ
        ರೈತನ ಹೆಸರಿನಲ್ಲೇ ಮುಂದುವರಿಯುತ್ತದೆ.
      </p>
    
      <p>
        ಯಾವುದೇ ವಿಮಾ ಪರಿಹಾರ ಮೊತ್ತ ಸಂಪೂರ್ಣವಾಗಿ ರೈತನಿಗೇ ಸೇರಿರುತ್ತದೆ.
      </p>
    
      <p>
        ವಿತರಣೆ ಪೂರ್ಣಗೊಂಡು ಉತ್ಪನ್ನವನ್ನು ಸ್ವೀಕರಿಸಲಾಗಿದೆ ಎಂದು ಪರಿಗಣಿಸಿದ ನಂತರ,
        ಎಲ್ಲಾ ಅಪಾಯಗಳು, ಮಾಲೀಕತ್ವ ಮತ್ತು ಜವಾಬ್ದಾರಿಗಳು ಸಂಪೂರ್ಣವಾಗಿ
        ಖರೀದಿದಾರರಿಗೆ ವರ್ಗಾಯಿಸಲಾಗುತ್ತವೆ.
      </p>
    </section>
    <section class="section">
      <h2>9. ಅನಿವಾರ್ಯ ಪರಿಸ್ಥಿತಿಗಳು </h2>
    
      <p>
        ಪ್ರಕೃತಿ ವಿಕೋಪಗಳು, ಸರ್ಕಾರಿ ನಿರ್ಬಂಧಗಳು, ಯುದ್ಧ, ಮುಷ್ಕರಗಳು,
        ಸಾರಿಗೆ ವ್ಯತ್ಯಯಗಳು ಅಥವಾ ಯಾವುದೇ ಅನಿರೀಕ್ಷಿತ ವಿಪತ್ತುಗಳಂತಹ
        ಸಮಂಜಸ ನಿಯಂತ್ರಣದ ಹೊರಗಿನ ಘಟನೆಗಳಿಂದ ಉಂಟಾಗುವ ವಿಫಲತೆ ಅಥವಾ
        ವಿಳಂಬಕ್ಕಾಗಿ ಯಾವುದೇ ಪಕ್ಷ ಜವಾಬ್ದಾರಿಯಾಗಿರುವುದಿಲ್ಲ.
      </p>
    
      <p>
        ಇಂತಹ ಪರಿಸ್ಥಿತಿಗಳು ಕೊನೆಗೊಂಡ ನಂತರ, ಒಪ್ಪಂದದ ಬಾಧ್ಯತೆಗಳು
        ಮರುಪ್ರಾರಂಭವಾಗುತ್ತವೆ.
      </p>
    </section>
    
    <section class="section">
      <h2>10. ವಿವಾದ ಪರಿಹಾರ ಮತ್ತು ನ್ಯಾಯಾಧಿಕಾರ
        
      </h2>
    
      <p>
        ಈ ಒಪ್ಪಂದದಿಂದ ಉಂಟಾಗುವ ಯಾವುದೇ ವಿವಾದವನ್ನು ಮೊದಲು
        ಅಗ್ರಿAI ವೇದಿಕೆಯ ಮೂಲಕ ಪರಸ್ಪರ ಚರ್ಚೆಯ ಮೂಲಕ ಸ್ನೇಹಪೂರ್ವಕವಾಗಿ
        ಪರಿಹರಿಸಲು ಪ್ರಯತ್ನಿಸಲಾಗುತ್ತದೆ.
      </p>
    
      <p>
        15 ದಿನಗಳೊಳಗೆ ವಿವಾದ ಪರಿಹಾರವಾಗದಿದ್ದರೆ,
        Arbitration and Conciliation Act, 1996 ಅನ್ವಯ
        ಮಧ್ಯಸ್ಥಿಕೆ (Arbitration)ಗೆ ಸಲ್ಲಿಸಲಾಗುತ್ತದೆ.
        ಮಧ್ಯಸ್ಥಿಕೆಯ ಸ್ಥಳವನ್ನು ಅಗ್ರಿAI ನಿರ್ಧರಿಸುತ್ತದೆ.
      </p>
    
      <p>
        ಮಧ್ಯಸ್ಥಿಕೆ ಪ್ರಕ್ರಿಯೆಗೆ ಒಳಪಟ್ಟಿರುವುದರ ಜೊತೆಗೆ,
        ಈ ಒಪ್ಪಂದದ ಜಾರಿಗೆ ಸಂಬಂಧಿಸಿದ ಎಲ್ಲಾ ಕಾನೂನು ಕ್ರಮಗಳಿಗೆ
        <strong>ಬೆಂಗಳೂರು, ಕರ್ನಾಟಕ</strong> ನ್ಯಾಯಾಲಯಗಳಿಗೆ
        ವಿಶೇಷ ನ್ಯಾಯಾಧಿಕಾರ (Exclusive Jurisdiction) ಇರುತ್ತದೆ.
      </p>
    </section>
    
    <section class="section">
      <h2>11. ಒಪ್ಪಂದ ರದ್ದುಪಡಿಸುವಿಕೆ </h2>
    
      <p>
        ಪಾವತಿ ವಿಫಲತೆ, ವಿತರಣೆ ವಿಫಲತೆ, ತಪ್ಪು ಮಾಹಿತಿ ನೀಡುವುದು
        ಅಥವಾ ಒಪ್ಪಿಕೊಂಡ ನಿಯಮಗಳನ್ನು ಉಲ್ಲಂಘಿಸುವಂತಹ ಪ್ರಮುಖ ಉಲ್ಲಂಘನೆಗಳ
        ಸಂದರ್ಭಗಳಲ್ಲಿ ಯಾವುದೇ ಪಕ್ಷ ಈ ಒಪ್ಪಂದವನ್ನು ರದ್ದುಪಡಿಸಬಹುದು.
      </p>
    
      <p>
        ಒಪ್ಪಂದದಲ್ಲಿ ನಿಗದಿಪಡಿಸಿದ ಸಮಯ ಮಿತಿಯನ್ನು ಮೀರಿ ಪಾವತಿ ವಿಫಲವಾದಲ್ಲಿ,
        ತಪ್ಪಿತಸ್ಥ ಪಕ್ಷದ ಖಾತೆಯನ್ನು ಅಮಾನತುಗೊಳಿಸುವುದು,
        ದಂಡ ವಿಧಿಸುವುದು ಹಾಗೂ ಕಾನೂನು ಅನುಮತಿಸಿದಂತೆ
        ವಸೂಲಿ ಕ್ರಮಗಳನ್ನು ಕೈಗೊಳ್ಳಬಹುದು.
      </p>
    </section>
    
    <section class="section">
      <h2>12. ಒಪ್ಪಂದದ ಭಾಷೆ </h2>
    
      <p>
        ಈ ಒಪ್ಪಂದವನ್ನು ರೈತನಿಗೆ ${langName} (ಭಾಷೆ) ಯಲ್ಲಿ ವಿವರಿಸಿ ಅನುವಾದಿಸಲಾಗಿದೆ.
        ಯಾವುದೇ ವ್ಯತ್ಯಾಸ ಉಂಟಾದಲ್ಲಿ, ಇಂಗ್ಲಿಷ್ ಆವೃತ್ತಿಯೇ ಅಂತಿಮವಾಗಿ ಮಾನ್ಯವಾಗುತ್ತದೆ.
      </p>
    </section>
    <section class="section">
      <h2>13. ಜಾರಿಗೆ ತರುವುದು ಮತ್ತು ಡಿಜಿಟಲ್ ಸ್ವೀಕೃತಿ
        
      </h2>
    
      <p>
        ಈ ಒಪ್ಪಂದವನ್ನು ಅಗ್ರಿAI ವೇದಿಕೆಯ ಮೂಲಕ ಎಲೆಕ್ಟ್ರಾನಿಕ್ ವಿಧಾನದಲ್ಲಿ
        ಜಾರಿಗೆ ತರಬಹುದು.
        ನೋಂದಾಯಿತ ವಿವರಗಳನ್ನು ಬಳಸಿಕೊಂಡು ನೀಡುವ ಡಿಜಿಟಲ್ ಸ್ವೀಕೃತಿ
        ಕಾನೂನುಬದ್ಧವಾಗಿ ಬಾಧ್ಯಕರ ಒಪ್ಪಿಗೆಯಾಗಿ ಪರಿಗಣಿಸಲಾಗುತ್ತದೆ.
      </p>
    
      <p>ಖರೀದಿದಾರ / ಅಧಿಕೃತ ಪ್ರತಿನಿಧಿ</p>
      <p>ಸಹಿ: ___________________________</p>
      <p>ದಿನಾಂಕ: ___________________________</p>
    
      <p>ರೈತ / ಉತ್ಪಾದಕ</p>
      <p>ಸಹಿ: ___________________________</p>
      <p>ದಿನಾಂಕ: ___________________________</p>
    
      <p>ಸಾಕ್ಷಿ : <strong>AgriAI</strong></p>
    </section>
    `;
      } else {
        html = `<!doctype html>
      <html>
<head>
  <meta charset="utf-8" />
  <title>AgriAI Contract</title>
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
    <img src="${logoSrc}" alt="AgriAI" style="width:120px;height:auto;margin-bottom:8px" />
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
  <p><b>Address:</b> ${buyerAddress || buyerState || '[Buyer Address/State]'}${(buyerAddress && buyerState) ? ', ' + buyerState : ''}</p>
  <p><strong>Party B – Farmer / Producer</strong></p>
  <p><b>Name:</b> ${farmerName}</p>
  <p><b>Farmer ID:</b> ${farmerId}</p>
  <p><b>Address:</b> ${farmerAddress || '[Farmer Address]'}${farmerState ? ', ' + farmerState : ''}</p>
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
    This Agreement has been explained and translated to the Farmer in ${langName} (Language).
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

  <p>Witness :<strong>AgriAI</strong></p>
</section>

</body>
</html>`;
      } // end language-specific template

      // store for preview instead of immediately opening
      setContractHtml(html);
      setShowContractPreview(true);
    } catch (e) {
      console.error('sendContract failed', e);
      alert('Failed to prepare contract. See console.');
    }
  };

  const downloadContract = () => {
    try {
      const blob = new Blob([contractHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contract.html';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) { console.warn(e); }
  };

  const printContract = () => {
    try {
      const w = window.open('', '_blank');
      w.document.write(contractHtml);
      w.document.close();
      w.focus();
      w.print();
    } catch (e) { console.warn(e); }
  };

  const handleBuyNow = () => {
    setPaymentError('');
    // note: payment method is fixed for buyers, no selection required

    const invalid = items.some(it => !it.order_quantity || Number(it.order_quantity) <= 0);
    if (invalid) {
      alert(t('editEnterOrderQty', (localStorage.getItem('agri_lang') || 'en')));
      return;
    }

    // Persist order to history and send to backend
    try {
      const invoiceId = 'ORD' + Date.now();
      const createdAt = new Date().toISOString();

      const orderItems = items.map(it => {
        const { gstAmt, commissionAmt, lineTotal } = calculateGstAndCommission(it);
        return {
          id: it.id,
          crop_name: it.crop_name,
          variety: it.variety || it.Variety || '',
          farmer_id: it.user_id || it.seller_id || it._farmer_id || null,
          category: it.category || it.cat || '',
          price_per_kg: Number(it.price_per_kg || 0),
          order_quantity: Number(it.order_quantity || 0),
          image_url: it.image_url || '',
          subtotal: lineTotal,
          gst: gstAmt,
          platform_fee: commissionAmt,
          total: lineTotal + gstAmt + commissionAmt
        };
      });

      const summary = orderItems.reduce((acc, it) => {
        acc.subtotal += it.subtotal;
        acc.gst += it.gst;
        acc.platform_fee += it.platform_fee;
        return acc;
      }, { subtotal: 0, gst: 0, platform_fee: 0 });
      const grand_total = summary.subtotal + summary.gst + summary.platform_fee;

      const buyer = {
        id: localStorage.getItem('agriai_id') || null,
        name: localStorage.getItem('agriai_name') || '',
        phone: localStorage.getItem('agriai_phone') || '',
        email: localStorage.getItem('agriai_email') || ''
      };

      const orderRecord = {
        invoice_id: invoiceId,
        created_at: createdAt,
        payment_method: paymentMethod,
        contract_nature: contractNature,
        contract_duration: contractDuration,
        buyer_id: buyer.id || null,
        buyer,
        items: orderItems,
        totals: { ...summary, grand_total }
      };

      const rawHist = localStorage.getItem('agriai_history');
      const hist = rawHist ? JSON.parse(rawHist) : [];
      const nextHist = [orderRecord, ...(Array.isArray(hist) ? hist : [])];
      localStorage.setItem('agriai_history', JSON.stringify(nextHist));

      // Attempt to decrement farmer inventory for each purchased item (best effort)
      try {
        const updates = orderItems
          .filter(it => it && typeof it.id !== 'undefined')
          .map(async (it) => {
            const remaining = Math.max(0, Number((items.find(x => x.id === it.id) || {}).quantity_kg || 0) - Number(it.order_quantity || 0));
            try {
              await fetch(`${apiBase}/my-crops/${it.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity_kg: remaining })
              });
            } catch (e) { /* non-blocking */ }
          });
        Promise.allSettled(updates).catch(() => {});
      } catch (e) { /* ignore */ }

      // Notify farmers of this purchase intent (best-effort)
      try {
        const siteLang = localStorage.getItem('agri_lang') || 'en';
        fetch(`${apiBase}/notifications/purchase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Agri-Lang': siteLang },
          body: JSON.stringify({ invoice_id: invoiceId, lang: siteLang, buyer, items: orderItems.map(({ id, crop_name, order_quantity, variety, farmer_id }) => ({ id, crop_name, order_quantity, variety, farmer_id })) })
        }).catch(() => {});
      
        // Also add local notifications so farmers see the invoice/details immediately
        try {
          const localKey = 'agriai_notifications';
          const rawLocal = localStorage.getItem(localKey);
          const localArr = rawLocal ? JSON.parse(rawLocal) : [];
          const byFarmer = {};
          orderItems.forEach(it => {
            const fid = it.farmer_id || 'unknown';
            if (!byFarmer[fid]) byFarmer[fid] = [];
            byFarmer[fid].push(it);
          });
          Object.keys(byFarmer).forEach((fid, idx) => {
            const group = byFarmer[fid];
            const qty = group.reduce((s, x) => s + (Number(x.order_quantity||0)||0), 0);
            const subtotal = group.reduce((s, x) => s + (Number(x.subtotal||0)||0), 0);
            const notif = {
              id: `N${Date.now()}${idx}`,
              invoice_id: invoiceId,
              created_at: createdAt,
              farmer_id: fid === 'unknown' ? null : fid,
              buyer_name: buyer.name || '',
              buyer_id: buyer.id || null,
              items: group,
              quantity_kg: qty,
              _subtotal: subtotal,
              crop_name: group[0] ? group[0].crop_name : 'Order'
            };
            localArr.unshift(notif);
          });
          try { localStorage.setItem(localKey, JSON.stringify(localArr)); } catch (e) {}
          try { window.dispatchEvent(new Event('agriai:notifications:local:update')); } catch (e) {}
        } catch (e) { /* ignore */ }
      } catch (e) { /* ignore */ }

      // Clear cart locally
      localStorage.setItem('agriai_cart_buyer', JSON.stringify([]));
      setItems([]);
      // Clear server-side cart for buyer as well (if signed in)
      try { clearCart(); } catch (e) { console.warn('clearCart call failed', e); }

      // Generate bill in a new window
      generateBill();

      // Also send a normalized order list to backend MySQL buyer_orders table
      try {
        const buyerId = localStorage.getItem('agriai_id') || null;
        const ordersPayload = orderItems.map(it => ({
          invoice_id: invoiceId,
          crop_id: it.id,
          farmer_id: it.farmer_id || it.seller_id || it._farmer_id || null,
          buyer_id: buyerId,
          crop_name: it.crop_name,
          quantity_kg: Number(it.order_quantity || 0),
          price_per_kg: Number(it.price_per_kg || 0),
          total: Number(it.total || 0),
          payment_method: paymentMethod,
          contract_nature: contractNature,
          contract_duration: contractDuration
        }));
        fetch(`${apiBase}/buyer-orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orders: ordersPayload })
        }).catch(() => {});
      } catch (e) { /* non-blocking */ }

      // Navigate to history
      setTimeout(() => { window.location.href = '/history'; }, 100);
    } catch (e) {
      console.error('Failed to complete purchase:', e);
      alert(t('purchaseFailed', (localStorage.getItem('agri_lang') || 'en')));
    }
  };

  return (
    <div style={{ fontFamily: 'Times New Roman, serif', background: '#53b635', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ padding: '6rem 1rem 2rem' }}>
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          background: '#fff',
          padding: '1.25rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 60, flexWrap: 'wrap', position: 'relative', padding: '2px 0 10px', minHeight: 64 }}>
            <h1 style={{ color: '#236902', margin: 0, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>{t('cartTitle', (localStorage.getItem('agri_lang') || 'en'))}</h1>
            {items.length > 0 && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto', zIndex: 2 }}>
                <button onClick={() => window.location.href = '/dashboard/farmer'} style={{ background: '#fff', border: '1px solid #dfeadf', color: '#236902', padding: '6px 10px', borderRadius: 6 }}>{t('continueShopping', (localStorage.getItem('agri_lang') || 'en'))}</button>
                <button onClick={clearCart} style={{ background: '#fff', border: '1px solid #f0dede', color: '#d32f2f', padding: '6px 10px', borderRadius: 6 }}>{t('clearCart', (localStorage.getItem('agri_lang') || 'en'))}</button>
              </div>
            )}
          </div>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <div style={{ fontSize: 52, lineHeight: 1 }}>🧺</div>
              <p style={{ marginTop: 8 }}>{t('cartEmptyMessage', (localStorage.getItem('agri_lang') || 'en'))}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Items Column */}
              <div style={{ flex: '1 1 620px', minWidth: 320 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                {items.map(it => {
                  const { gstRate, commissionRate, gstAmt, commissionAmt, lineTotal } = calculateGstAndCommission(it);
                  return (
                    <div key={it.id} style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      border: '1px solid #eee',
                      padding: 12,
                      borderRadius: 8
                    }}>
                      <div style={{
                        width: 120,
                        height: 80,
                        borderRadius: 6,
                        overflow: 'hidden',
                        background: '#f4f4f4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {it.image_url ? (
                          <img
                            src={it.image_url}
                            alt={it.crop_name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ color: '#999' }}>{t('noImage', (localStorage.getItem('agri_lang') || 'en'))}</div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <div style={{ fontWeight: 800, color: '#236902' }}>{it.crop_name}</div>
                            {it.variety ? (
                              <div style={{ background: '#f0f7ef', color: '#236902', padding: '2px 8px', borderRadius: 8, fontSize: 12, fontWeight: 700, marginLeft: 6 }}>{it.variety}</div>
                            ) : null}
                          </div>
                          {(it.category || it.cat) && (
                            <div style={{ background: '#eaf6ea', color: '#236902', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{it.category || it.cat}</div>
                          )}
                        </div>
                        <div style={{ marginTop: 6, fontWeight: 700 }}>
                          {formatCurrency(it.price_per_kg)} / {t('kg', (localStorage.getItem('agri_lang') || 'en'))}
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          {userRole !== 'buyer' && (
                            <>
                              <div style={{ fontSize: 13, color: '#555' }}>{t('tableGst', (localStorage.getItem('agri_lang') || 'en'))}: {gstRate}% ({formatCurrency(gstAmt)})</div>
                              <div style={{ fontSize: 13, color: '#555' }}>{t('tablePlatformFee', (localStorage.getItem('agri_lang') || 'en'))}: {formatCurrency(commissionAmt)}</div>
                            </>
                          )}
                          <div style={{ fontSize: 13, color: '#000', fontWeight: 700 }}>{t('itemTotalLabel', (localStorage.getItem('agri_lang') || 'en'))} {formatCurrency(lineTotal + gstAmt + commissionAmt)}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: 220 }}>
                        <div style={{ fontWeight: 700 }}>
                          {t('availableLabel', (localStorage.getItem('agri_lang') || 'en'))} {Number(it.quantity_kg || 0).toLocaleString('en-IN')} {t('kg', (localStorage.getItem('agri_lang') || 'en'))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 6 }}>
                          <button onClick={() => updateQuantity(it.id, -1)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e5e5', background: '#fff' }}>-</button>
                          <div style={{ minWidth: 60, textAlign: 'center', fontWeight: 800 }}>{Number(it.order_quantity || 0).toLocaleString('en-IN')} {t('kg', (localStorage.getItem('agri_lang') || 'en'))}</div>
                          <button onClick={() => updateQuantity(it.id, 1)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e5e5', background: '#fff' }}>+</button>
                        </div>
                        <div style={{
                          marginTop: 8,
                          display: 'flex',
                          gap: 8,
                          justifyContent: 'flex-end'
                        }}>
                          {editingId === it.id ? (
                            <>
                              <input
                                type="number"
                                step="0.001"
                                value={editVal}
                                onChange={e => setEditVal(e.target.value)}
                                style={{ width: 120, padding: 6 }}
                              />
                              <button
                                onClick={() => saveEdit(it.id)}
                                style={{
                                  padding: '6px 8px',
                                  background: '#236902',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: 6
                                }}
                              >{t('saveButton', (localStorage.getItem('agri_lang') || 'en'))}</button>
                              <button
                                onClick={cancelEdit}
                                style={{
                                  padding: '6px 8px',
                                  background: '#ddd',
                                  border: 'none',
                                  borderRadius: 6
                                }}
                              >{t('cancelButton', (localStorage.getItem('agri_lang') || 'en'))}</button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(it)}
                                style={{
                                  padding: '6px 8px',
                                  background: '#1976d2',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: 6
                                }}
                              >{t('editButton', (localStorage.getItem('agri_lang') || 'en'))}</button>
                              <button
                                onClick={() => removeItem(it.id)}
                                style={{
                                  background: '#fff',
                                  border: '1px solid #d32f2f',
                                  color: '#d32f2f',
                                  padding: '6px 10px',
                                  borderRadius: 6
                                }}
                              >{t('deleteButton', (localStorage.getItem('agri_lang') || 'en'))}</button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>

              {/* Summary Column */}
              <div style={{ flex: '0 0 320px', width: 320, position: 'sticky', top: 88, alignSelf: 'flex-start' }}>
                <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontWeight: 800, color: '#236902', marginBottom: 8 }}>{t('orderSummary', (localStorage.getItem('agri_lang') || 'en'))}</div>
                  <div style={{ display: 'grid', gap: 6, fontWeight: 700 }}>
                    <div>{t('totalItemsLabel', (localStorage.getItem('agri_lang') || 'en'))} {items.length}</div>
                    <div>{t('totalAvailableLabel', (localStorage.getItem('agri_lang') || 'en'))} {Number(totalAvailableQty).toLocaleString('en-IN')} {t('kg', (localStorage.getItem('agri_lang') || 'en'))}</div>
                    <div>{t('totalOrderedLabel', (localStorage.getItem('agri_lang') || 'en'))} {Number(totalOrderedQty).toLocaleString('en-IN')} {t('kg', (localStorage.getItem('agri_lang') || 'en'))}</div>
                    <div>{t('platformFeeLabel', (localStorage.getItem('agri_lang') || 'en'))} {formatCurrency(totals.commission)}</div>
                    <div>{t('gstTotalLabel', (localStorage.getItem('agri_lang') || 'en'))} {formatCurrency(totals.gst)}</div>
                    <div style={{ fontSize: 18, color: '#236902', marginTop: 6 }}>{t('grandTotalLabel', (localStorage.getItem('agri_lang') || 'en'))} {formatCurrency(grandTotal)}</div>
                </div>

                  {/* contract options for buyer */}
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{t('contractNatureLabel', (localStorage.getItem('agri_lang') || 'en'))}</div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="radio"
                          name="contractNature"
                          value="pre-harvest"
                          checked={contractNature === 'pre-harvest'}
                          onChange={() => setContractNature('pre-harvest')}
                        /> {t('preHarvestContract', (localStorage.getItem('agri_lang') || 'en'))}
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="radio"
                          name="contractNature"
                          value="post-harvest"
                          checked={contractNature === 'post-harvest'}
                          onChange={() => setContractNature('post-harvest')}
                        /> {t('postHarvestContract', (localStorage.getItem('agri_lang') || 'en'))}
                      </label>
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{t('contractDurationLabel', (localStorage.getItem('agri_lang') || 'en'))}</div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="radio"
                          name="contractDuration"
                          value="one-time"
                          checked={contractDuration === 'one-time'}
                          onChange={() => setContractDuration('one-time')}
                        /> {t('contractOneTime', (localStorage.getItem('agri_lang') || 'en'))}
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="radio"
                          name="contractDuration"
                          value="seasonal"
                          checked={contractDuration === 'seasonal'}
                          onChange={() => setContractDuration('seasonal')}
                        /> {t('contractSeasonal', (localStorage.getItem('agri_lang') || 'en'))}
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="radio"
                          name="contractDuration"
                          value="yearly"
                          checked={contractDuration === 'yearly'}
                          onChange={() => setContractDuration('yearly')}
                        /> {t('contractYearly', (localStorage.getItem('agri_lang') || 'en'))}
                      </label>
                    </div>
                  </div>

                    {userRole === 'buyer' && totalOrderedQty > 40 ? (
                      <button
                        onClick={sendContract}
                        disabled={!items.length}
                        style={{
                          marginTop: 12,
                          width: '100%',
                          background: '#236902',
                          color: '#fff',
                          padding: '10px 12px',
                          borderRadius: 6,
                          border: 'none'
                        }}
                      >
                        {t('sendContract', (localStorage.getItem('agri_lang') || 'en'))}
                      </button>
                    ) : (
                      <button
                        onClick={handleBuyNow}
                        disabled={!items.length}
                        style={{
                          marginTop: 12,
                          width: '100%',
                          background: '#236902',
                          color: '#fff',
                          padding: '10px 12px',
                          borderRadius: 6,
                          border: 'none'
                        }}
                      >
                        {t('buyNow', (localStorage.getItem('agri_lang') || 'en'))}
                      </button>
                    )}
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
              <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontWeight: 800 }}>{t('contractPreview', (localStorage.getItem('agri_lang') || 'en'))}</div>
              <div style={{ position: 'absolute', right: 0, top: 0, display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={downloadContract} style={{ padding: '6px 10px' }}>{t('download', (localStorage.getItem('agri_lang') || 'en')) || 'Download'}</button>
                <button onClick={printContract} style={{ padding: '6px 10px' }}>{t('print', (localStorage.getItem('agri_lang') || 'en')) || 'Print'}</button>
                <button onClick={() => {
                      setShowContractPreview(false);
                      setContractMetadata(null);
                      setOtpVerified(false);
                      setDigitalSignature('');
                    }} style={{ padding: '6px 10px' }}>{t('close', (localStorage.getItem('agri_lang') || 'en')) || 'Close'}</button>
              </div>
            </div>
            <div style={{ border: '1px solid #eee', borderRadius: 6, padding: 12, background: '#fff' }} dangerouslySetInnerHTML={{ __html: contractHtml }} />
            <div style={{ textAlign: 'right', marginTop: 12 }}>
              <button disabled={uploadingContracts} onClick={async () => {
                  if (otpVerified) {
                    // OTP already verified; perform upload immediately
                    await sendContract();
                  } else {
                    setPendingContractAction(() => sendContract);
                    openOtpForContract();
                  }
                }} style={{ padding: '8px 12px', background: '#236902', color: '#fff', border: 'none', borderRadius: 6, cursor: uploadingContracts ? 'not-allowed' : 'pointer', opacity: uploadingContracts ? 0.6 : 1 }}>{t('sendContract', (localStorage.getItem('agri_lang') || 'en'))}</button>
            </div>
          </div>
        </div>
      )}

      {/* OTP verification modal for contract signature */}
      {showOtpModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ width: '90%', maxWidth: 500, background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <h2 style={{ margin: '0 0 16px 0', color: '#236902', fontSize: 20, textAlign: 'center' }}>
              {otpVerified ? t('signatureVerified', (localStorage.getItem('agri_lang') || 'en')) : t('verifyIdentity', (localStorage.getItem('agri_lang') || 'en'))}
            </h2>

            <p style={{ color: '#666', marginBottom: 16, fontSize: 14 }}>
              {otpVerified 
                ? t('verifyIdentitySigned', (localStorage.getItem('agri_lang') || 'en'))
                : t('verifyIdentityDesc', (localStorage.getItem('agri_lang') || 'en'))}
            </p>

            {otpVerified ? (
              <div style={{ background: '#f0f7ff', border: '2px solid #236902', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                  <div style={{ marginBottom: 8 }}>
                    <strong>{t('signatureDetails', (localStorage.getItem('agri_lang') || 'en'))}</strong>
                  </div>
                  <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#333' }}>
                    <div>📧 {t('signatureEmailLabel', (localStorage.getItem('agri_lang') || 'en'))}: {otpEmail}</div>
                    <div>🕐 {t('signatureTimeLabel', (localStorage.getItem('agri_lang') || 'en'))}: {digitalSignature.signature_timestamp}</div>
                    <div>✔ {t('signatureMethodLabel', (localStorage.getItem('agri_lang') || 'en'))}: {digitalSignature.signature_method}</div>
                    <div style={{ marginTop: 8, wordBreak: 'break-all' }}>{t('signatureHashLabel', (localStorage.getItem('agri_lang') || 'en'))}: {digitalSignature.signature_hash ? digitalSignature.signature_hash.substring(0,40) + '...' : ''}</div>
                  </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>{t('signatureEmailLabel', (localStorage.getItem('agri_lang') || 'en'))}</label>
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
                      {otpLoading ? t('sendingOtp', (localStorage.getItem('agri_lang') || 'en')) || 'Sending...' : t('sendOtpButton', (localStorage.getItem('agri_lang') || 'en'))}
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Enter OTP</label>
                      <input 
                        type="text" 
                        placeholder={t('otpPlaceholder', (localStorage.getItem('agri_lang') || 'en'))}
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
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{t('checkEmailMsg', (localStorage.getItem('agri_lang') || 'en'))}</div>
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
                        {otpLoading ? t('verifying', (localStorage.getItem('agri_lang') || 'en')) || 'Verifying...' : t('verifyAndSign', (localStorage.getItem('agri_lang') || 'en'))}
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
                      {t('proceedToSend', (localStorage.getItem('agri_lang') || 'en'))}
                  </button>
              )}
              <button onClick={resetOtpModal} disabled={otpLoading} style={{ flex: 1, padding: 10, background: '#ccc', color: '#000', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  {t('close', (localStorage.getItem('agri_lang') || 'en')) || 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
