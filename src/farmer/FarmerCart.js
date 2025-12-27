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
  const [contractType, setContractType] = React.useState('one-time');
  const [contractHtml, setContractHtml] = React.useState('');
  const [showContractPreview, setShowContractPreview] = React.useState(false);

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
      if (categoryTotal < 200001) commissionRate = 2.0;
      else if (categoryTotal < 600001) commissionRate = 2.5;
      else if (categoryTotal < 1000001) commissionRate = 3.0;
      else commissionRate = 3.4;
    } else if (group === 'fruitveg') {
      if (categoryTotal < 200001) commissionRate = 2.5;
      else if (categoryTotal < 600001) commissionRate = 3.0;
      else if (categoryTotal < 1000001) commissionRate = 3.4;
      else commissionRate = 4.0;
    } else if (group === 'masala') {
      if (categoryTotal < 200001) commissionRate = 3.0;
      else if (categoryTotal < 600001) commissionRate = 3.4;
      else if (categoryTotal < 1000001) commissionRate = 4.0;
      else commissionRate = 4.4;
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

      const invoiceId = 'ORD' + Date.now();
      const createdAt = new Date().toISOString();

      const orderRecord = {
        invoice_id: invoiceId,
        created_at: createdAt,
        payment_method: 'contract',
        buyer,
        items: orderItems,
        totals: { ...summary, grand_total }
      };

      try {
        const rawHist = localStorage.getItem('agriai_history_farmer');
        const hist = rawHist ? JSON.parse(rawHist) : [];
        const nextHist = [orderRecord, ...(Array.isArray(hist) ? hist : [])];
        localStorage.setItem('agriai_history_farmer', JSON.stringify(nextHist));
      } catch (e) {}
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
      // default end date 30 days later for one-time, seasonal ~90 days, yearly ~365
      const days = contractType === 'one-time' ? 30 : (contractType === 'seasonal' ? 90 : 365);
      const endDate = new Date(Date.now() + days * 24 * 3600 * 1000).toLocaleDateString('en-GB');

      // Build commodity rows from items (separate from the big template to avoid nested template parsing issues)
      const rowsHtml = (items || []).map((it, idx) => {
        const qty = Number(it.order_quantity || 0) || 0;
        const variety = it.variety || it.crop_variety || it.var || '';
        return `<tr>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${idx + 1}</td>
          <td style="padding:8px;border:1px solid #ddd">${it.crop_name || ''}</td>
          <td style="padding:8px;border:1px solid #ddd">${variety}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:right">${qty.toLocaleString('en-IN')} kg</td>
        </tr>`;
      }).join('');
      const rowsPlaceholder = rowsHtml && rowsHtml.trim() ? rowsHtml : `<tr><td colspan="4" style="padding:8px;border:1px solid #ddd;text-align:center">${t('noItems', siteLang)}</td></tr>`;
      const html = `<!doctype html>
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
      PROCUREMENT CONTRACT FARMING AGREEMENT
    </h1>
    <div style="margin-top:6px;font-weight:800">
      Contract Type: ${contractType}
    </div>
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
      Party A and Party B are hereinafter collectively referred to as "the Parties".
      All communication, delivery, and payments shall be conducted via the AgriAI platform unless otherwise authorized.
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
    <p>Contract Type: ${contractType === 'one-time' ? 'One-Time Procurement Contract' : contractType}</p>
    <p>Start Date: ${startDate}</p>
    <p>End Date: ${endDate}</p>
    <p>Duration: ${days} Days</p>
    <p>
      This Agreement shall automatically expire on the End Date unless renewed digitally through
      the AgriAI platform with explicit consent from both Parties using registered login credentials.
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
    <table>
      <thead>
        <tr>
          <th style="padding:8px;border:1px solid #ddd;text-align:center">Sl. No</th>
          <th style="padding:8px;border:1px solid #ddd">Crop Name</th>
          <th style="padding:8px;border:1px solid #ddd">Variety</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:right">Quantity</th>
        </tr>
      </thead>
      <tbody>
        ${rowsPlaceholder}
      </tbody>
    </table>
  </section>

  <section class="section">
    <h2>5. PRICE & PAYMENT TERMS</h2>
    <p><strong>5.1 Fixed Procurement Price</strong></p>
    <p>Price: ₹________ per kg / quintal / ton</p>
    <p>The agreed price shall remain fixed throughout the contract period, irrespective of market fluctuations.</p>

    <p><strong>5.2 Payment Schedule</strong></p>
    <p>50% payment upon successful delivery of produce</p>
    <p>50% payment within 7 working days after quality inspection and acceptance</p>

    <p><strong>5.3 Mode of Payment</strong></p>
    <p>Bank Transfer / UPI / Cheque</p>
    <p>The Buyer shall issue digital or physical receipts for all payments made under this Agreement.</p>
  </section>

  <section class="section">
    <h2>6. DELIVERY, LOGISTICS & TRANSPORTATION</h2>

    <p><strong>6.1 Delivery Responsibility</strong></p>
    <p>
      Delivery of agricultural produce under this Agreement shall be facilitated through third-party
      logistics service providers available on or approved by the AgriAI platform.
    </p>
    <p>
      Neither the Buyer nor the Farmer shall be required to independently arrange transportation unless
      mutually agreed in writing.
    </p>

    <p><strong>6.2 Vehicle Selection</strong></p>
    <p>
      The type of vehicle used for transportation shall be selected based on quantity of produce,
      nature of crop, and handling requirements.
    </p>
    <p>Selected Vehicle Type: ___________________________</p>

    <p><strong>6.3 Delivery Pricing Method</strong></p>
    <p>
      Delivery charges shall be determined solely by the third-party logistics provider.
      The final delivery cost shall be calculated and communicated at the delivery location.
    </p>

    <p><strong>6.4 Payment of Delivery Charges</strong></p>
    <p>
      Delivery charges shall be paid directly by the Buyer to the logistics provider or delivery personnel,
      offline or online.
    </p>

    <p><strong>6.5 Transfer of Risk During Transit</strong></p>
    <p>
      During transit, responsibility shall lie with the logistics provider.
      Upon delivery, risk transfers to the Buyer.
    </p>

    <p><strong>6.6 Delay, Damage & Loss</strong></p>
    <p>
      Any delay, damage, or loss shall be governed by the logistics provider’s terms.
      AgriAI shall not be held liable.
    </p>

    <p><strong>6.7 Proof of Delivery</strong></p>
    <p>
      Delivery shall be confirmed through physical receipt, digital confirmation, and Proof of Delivery (POD).
      Records may be stored digitally or on blockchain.
    </p>
  </section>

  <section class="section">
    <h2>7. QUALITY STANDARDS & ACCEPTANCE</h2>
    <p>Produce supplied shall meet mutually agreed quality standards.</p>
    <p>Buyer shall complete inspection within 3 working days of delivery.</p>
    <p>Any rejection must be communicated transparently with valid reasons.</p>
  </section>

  <section class="section">
    <h2>8. RISK, LIABILITY & INSURANCE</h2>
    <p>The Farmer shall follow standard agricultural practices.</p>
    <p>
      In case of crop loss due to natural calamities, losses shall be addressed fairly.
      Insurance may be facilitated under PMFBY or government-approved insurers.
    </p>
    <p>
      Any insurance compensation received shall be transferred to the Farmer.
    </p>
    <p>
      After delivery and acceptance, all risks shall transfer to the Buyer.
    </p>
  </section>

  <section class="section">
    <h2>9. FORCE MAJEURE</h2>
    <p>
      Neither Party shall be liable for delay or failure caused by events beyond reasonable control.
      Obligations shall resume once normal conditions are restored.
    </p>
  </section>

  <section class="section">
    <h2>10. DISPUTE RESOLUTION & JURISDICTION</h2>
    <p>Disputes shall first be resolved through mutual discussion.</p>
    <p>
      If unresolved, disputes shall be referred to local authorities or arbitration under the
      Arbitration and Conciliation Act, 1996.
    </p>
    <p>Courts of ________________ shall have exclusive jurisdiction.</p>
  </section>

  <section class="section">
    <h2>11. TERMINATION</h2>
    <p>
      Either Party may terminate this Agreement with 30 days’ written notice
      for valid reasons including breach, non-payment, or force majeure.
    </p>
  </section>

  <section class="section">
    <h2>12. LANGUAGE OF AGREEMENT</h2>
    <p>
      This Agreement has been explained and translated to the Farmer in ________________ (Language).
      In case of any inconsistency, the English version shall prevail.
    </p>
  </section>

  <section class="section">
    <h2>13. EXECUTION & SIGNATURES</h2>

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
      setShowContractPreview(true);
    } catch (e) {
      console.error('Failed to generate contract', e);
      alert(t('contractGenerateFailed', siteLang) || 'Failed to generate contract. See console for details.');
    }
  };

  const handleSendContract = () => {
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
                    <div>{t('totalAvailableLabel', siteLang)} {Number(totalAvailableQty).toLocaleString('en-IN')} {t('kg', siteLang)}</div>
                    <div>{t('totalOrderedLabel', siteLang)} {Number(totalOrderedQty).toLocaleString('en-IN')} {t('kg', siteLang)}</div>
                    <div>{t('subTotalLabel', siteLang)} {formatCurrency(totals.subtotal)}</div>
                    <div>{t('platformFeeTotalLabel', siteLang)} {formatCurrency(totals.commission)}</div>
                    <div>{t('gstTotalLabel', siteLang)} {formatCurrency(totals.gst)}</div>
                    <div style={{ fontSize: 18, color: '#236902', marginTop: 6 }}>{t('grandTotalLabel', siteLang)}: {formatCurrency(grandTotal)}</div>
                  </div>
                  
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{t('contractTypeLabel', siteLang)}</div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="radio" name="contractType" value="one-time" checked={contractType === 'one-time'} onChange={() => setContractType('one-time')} /> {t('contractOneTime', siteLang)}
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="radio" name="contractType" value="seasonal" checked={contractType === 'seasonal'} onChange={() => setContractType('seasonal')} /> {t('contractSeasonal', siteLang)}
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="radio" name="contractType" value="yearly" checked={contractType === 'yearly'} onChange={() => setContractType('yearly')} /> {t('contractYearly', siteLang)}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontWeight: 800 }}>{t('contractPreview', siteLang)}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={downloadContract} style={{ padding: '6px 10px' }}>{t('download', siteLang) || 'Download'}</button>
                  <button onClick={printContract} style={{ padding: '6px 10px' }}>{t('print', siteLang) || 'Print'}</button>
                  <button onClick={() => setShowContractPreview(false)} style={{ padding: '6px 10px' }}>{t('close', siteLang) || 'Close'}</button>
                </div>
              </div>
            <div style={{ border: '1px solid #eee', borderRadius: 6, padding: 12, background: '#fff' }} dangerouslySetInnerHTML={{ __html: contractHtml }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button onClick={() => { setShowContractPreview(false); handleBuyNow(); }} style={{ padding: '8px 12px', background: '#236902', color: '#fff', border: 'none', borderRadius: 6 }}>{t('confirmAndSend', siteLang) || 'Confirm & Send'}</button>
              <button onClick={() => setShowContractPreview(false)} style={{ padding: '8px 12px', background: '#ddd', border: 'none', borderRadius: 6 }}>{t('cancelButton', siteLang)}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerCart;
