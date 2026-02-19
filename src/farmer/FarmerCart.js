import React from 'react';
import Navbar from '../Navbar';
import logo192 from '../assets/logo192.png';
import { t } from '../i18n';

const FarmerCart = () => {
  const [items, setItems] = React.useState([]);
  const [editingId, setEditingId] = React.useState(null);
  const [editVal, setEditVal] = React.useState('');
  const [editPrice, setEditPrice] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('contract');
  const [paymentError, setPaymentError] = React.useState('');
  const [contractType, setContractType] = React.useState('one-time');
  const [contractHtml, setContractHtml] = React.useState('');
  const [showContractPreview, setShowContractPreview] = React.useState(false);
  const [showDeliveryInfoModal, setShowDeliveryInfoModal] = React.useState(false);

  const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');

  const [siteLang, setSiteLang] = React.useState(() => localStorage.getItem('agri_lang') || 'en');
    const [contractLang, setContractLang] = React.useState(() => localStorage.getItem('agri_lang') || 'en');
  React.useEffect(() => {
    const onLang = (e) => { const l = (e && e.detail && e.detail.lang) ? e.detail.lang : (localStorage.getItem('agri_lang') || 'en'); setSiteLang(l); };
    try { window.addEventListener('agri:lang:change', onLang); } catch (e) {}
    return () => { try { window.removeEventListener('agri:lang:change', onLang); } catch (e) {} };
  }, []);

  // Keep the generated contract HTML's language line in sync with the `siteLang` selector
  React.useEffect(() => {
    try {
      if (!showContractPreview || !contractHtml) return;
      const langMap = { en: 'English', hi: 'Hindi', kn: 'Kannada', ta: 'Tamil', te: 'Telugu', mr: 'Marathi', bn: 'Bengali', or: 'Odia' };
      const contractLanguage = (langMap[contractLang] || contractLang || 'English');
      const updated = contractHtml.replace(/This Agreement has been explained and translated to the Farmer in[\s\S]*?\(Language\)/, `This Agreement has been explained and translated to the Farmer in ${contractLanguage} (Language)`);
      if (updated && updated !== contractHtml) setContractHtml(updated);
    } catch (e) {}
  }, [contractLang, showContractPreview, contractHtml]);

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

  // Compute labour charge (INR) based on total weight in kilograms
  const computeLabourCharge = (weightKg) => {
    const w = Number(weightKg || 0) || 0;
    if (w <= 40) return 80;
    if (w <= 200) return 200;
    if (w <= 500) return 300;
    if (w <= 1500) return 550; // 1.5 ton
    if (w <= 5000) return 1000; // 5 ton
    if (w <= 10000) return 1500; // 10 ton
    if (w <= 20000) return 2500; // 20 ton
    if (w <= 40000) return 4000; // 40 ton
    // For weights above 40 ton, charge multiples of the 40-ton slab
    const blocks = Math.ceil(w / 40000);
    return 4000 * blocks;
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
  // Compute buyer-side platform fee and GST using requested tiered rates per category group
  const computeBuyerTotals = (itemsList) => {
    const round2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;
    // reuse group detection logic (same as in calculateGstAndCommission)
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

    // Sum line totals by group
    const categoryTotals = (itemsList || []).reduce((acc, it) => {
      try {
        const q = Number(it.order_quantity || 0) || 0;
        const p = Number(it.price_per_kg || 0) || 0;
        const line = round2(q * p);
        const g = getGroupFromItem(it);
        acc[g] = (acc[g] || 0) + line;
      } catch (e) {}
      return acc;
    }, { crop: 0, fruitveg: 0, masala: 0 });

    // Determine buyer-side commission rates per group and compute commission/GST per group
    const ratesForGroup = (group, categoryTotal) => {
      // thresholds: <200001, <600001, <1000001, >=1000001
      if (group === 'crop') {
        if (categoryTotal < 200001) return 1.5;
        if (categoryTotal < 600001) return 2.0;
        if (categoryTotal < 1000001) return 2.5;
        return 3.0;
      }
      if (group === 'masala') {
        if (categoryTotal < 200001) return 2.5;
        if (categoryTotal < 600001) return 3.0;
        if (categoryTotal < 1000001) return 3.5;
        return 4.0;
      }
      // fruitveg
      if (group === 'fruitveg') {
        if (categoryTotal < 200001) return 2.0;
        if (categoryTotal < 600001) return 2.5;
        if (categoryTotal < 1000001) return 3.0;
        return 3.5;
      }
      return 0;
    };

    const gstRate = 18;
    let buyerCommissionTotal = 0;
    let buyerGstTotal = 0;
    // cap per-group commission similar to existing logic
    const capAmt = 100000;
    Object.keys(categoryTotals).forEach(g => {
      const catTotal = round2(categoryTotals[g] || 0);
      if (!catTotal) return;
      const rate = ratesForGroup(g, catTotal) || 0;
      let commissionAmt = round2((catTotal * (rate / 100)) || 0);
      if (!Number.isFinite(commissionAmt) || commissionAmt < 0) commissionAmt = 0;
      if (commissionAmt > capAmt) commissionAmt = capAmt;
      const gstAmt = round2((commissionAmt * gstRate) / 100);
      buyerCommissionTotal += commissionAmt;
      buyerGstTotal += gstAmt;
    });

    return { commission: round2(buyerCommissionTotal), gst: round2(buyerGstTotal) };
  };

  const buyerTotals = computeBuyerTotals(items);
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
          variety: it.variety || it.var || it.crop_variety || '',
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

      // Compute additional contract-level fields to persist to history and send to backend
      const totalContractQty = (orderItems || []).reduce((s, it) => s + (Number(it.order_quantity || 0) || 0), 0);
      const totalCropTradeValue = (orderItems || []).reduce((s, it) => s + ((Number(it.order_quantity || 0) || 0) * (Number(it.price_per_kg || 0) || 0)), 0);
      const avgPricePerKg = totalContractQty > 0 ? (totalCropTradeValue / totalContractQty) : 0;
      const buyerFeeTotal = (buyerTotals.commission || 0) + (buyerTotals.gst || 0);
      const totalAmountPayableByBuyer = Math.round((totalCropTradeValue + buyerFeeTotal + Number.EPSILON) * 100) / 100;
      const qtyKg = Math.round(totalContractQty || 0);
      const labourCharge = computeLabourCharge(qtyKg);
      // delivery rate display (reuse same banding as in generateContract)
      const qtyRateMap = [
        { min: 0, max: 40, rates: [12, 18, 22] },
        { min: 41, max: 400, rates: [18, 22, 28] },
        { min: 401, max: 1500, rates: [22, 28, 35] },
        { min: 1501, max: 5000, rates: [28, 35, 45] },
        { min: 5001, max: 10000, rates: [35, 45, 60] },
        { min: 10001, max: 20000, rates: [40] },
        { min: 20001, max: 40000, rates: [75] }
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

      // Contract duration and dates: use current defaults (can be overridden elsewhere)
      const startDateObj = new Date();
      const startDate = startDateObj.toLocaleDateString('en-GB');
      let days = contractType === 'one-time' ? 30 : (contractType === 'seasonal' ? 90 : 365);
      // compute end date based on days
      const endDateObj = new Date(Date.now() + (days * 24 * 3600 * 1000));
      const endDate = endDateObj.toLocaleDateString('en-GB');

      // Short description and variety summary
      const description = orderItems.map(it => `${it.crop_name || ''} x ${it.order_quantity || 0}kg`).join('; ');
      const variety = orderItems.map(it => it.variety || '').filter(Boolean).join(', ');

      // Farmer settlement calculations
      const farmerPlatformFee = (totals.commission || 0);
      const farmerGstOnFee = (totals.gst || 0);
      const netAmountPayableToFarmer = Math.round((totalCropTradeValue - (farmerPlatformFee + farmerGstOnFee) + Number.EPSILON) * 100) / 100;

      // Attach these fields to the order record so history immediately reflects them
      orderRecord.contract_meta = {
        startDate,
        start_date_iso: startDateObj.toISOString(),
        endDate,
        end_date_iso: endDateObj.toISOString(),
        days,
        contract_type: contractType,
        variety,
        description,
        totalContractQty,
        totalCropTradeValue,
        avgPricePerKg,
        buyerFeeTotal,
        totalAmountPayableByBuyer,
        deliveryRateDisplay,
        labourCharge,
        qtyKg,
        farmerPlatformFee,
        farmerGstOnFee,
        netAmountPayableToFarmer
      };
      // include buyer and farmer totals for precise breakdowns
      try {
        orderRecord.contract_meta.buyer_totals = buyerTotals || { commission: 0, gst: 0 };
        orderRecord.contract_meta.farmer_totals = { commission: (totals && (totals.commission || totals.platform_fee)) || 0, gst: (totals && totals.gst) || 0 };
      } catch (e) {}

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
      // Also add local notifications so buyer sees the contract/details immediately
      try {
        const localKey = 'agriai_notifications';
        const rawLocal = localStorage.getItem(localKey);
        const localArr = rawLocal ? JSON.parse(rawLocal) : [];
        const contractNotif = {
          id: `C${Date.now()}`,
          invoice_id: invoiceId,
          created_at: createdAt,
          buyer_id: buyer.id || null,
          farmer_name: localStorage.getItem('agriai_name') || '',
          farmer_id: localStorage.getItem('agriai_id') || null,
          items: orderItems,
          quantity_kg: totalContractQty,
          _subtotal: totalCropTradeValue,
          crop_name: orderItems[0] ? orderItems[0].crop_name : 'Contract',
          contract_meta: orderRecord.contract_meta
        };
        localArr.unshift(contractNotif);
        try { localStorage.setItem(localKey, JSON.stringify(localArr)); } catch (e) {}
        try { window.dispatchEvent(new Event('agriai:notifications:local:update')); } catch (e) {}
      } catch (e) { /* ignore */ }
      // Store contract record in backend contract_b table (include buyer fields when available)
      try {
        const role = localStorage.getItem('agriai_role') || '';
        const farmerId = role === 'farmer' ? localStorage.getItem('agriai_id') : null;
        const farmerName = localStorage.getItem('agriai_name') || '';
        const farmerEmail = localStorage.getItem('agriai_email') || '';
        let farmerState = localStorage.getItem('agriai_state') || '';
        let farmerRegion = localStorage.getItem('agriai_region') || '';

        // If localStorage lacks state/region, try to fetch authoritative profile
        try {
          if ((!farmerState || !farmerRegion)) {
            const farmPhone = localStorage.getItem('agriai_phone') || '';
            const farmEmail = localStorage.getItem('agriai_email') || '';
            if (farmPhone || farmEmail) {
              const resp = await fetch(`${apiBase}/profile/get`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: farmPhone || undefined, email: farmEmail || undefined }) });
              if (resp && resp.ok) {
                const j = await resp.json().catch(() => null);
                if (j && j.user) {
                  farmerState = farmerState || (j.user.state || '');
                  farmerRegion = farmerRegion || (j.user.region || '');
                }
              }
            }
          }
        } catch (e) { console.warn('profile/get failed when preparing contract payload (handleBuyNow)', e); }

        // helper to fetch first non-empty localStorage key
        const fetchFirstLocal = (keys, fallback) => {
          for (let k of keys) {
            try {
              const v = localStorage.getItem(k);
              if (v && v.toString().trim()) return v.toString().trim();
            } catch (e) { continue; }
          }
          return fallback;
        };

        // Determine buyer fields: prefer buyer_id on items, then localStorage keys
        const buyerIdFromItems = (items && Array.isArray(items) && items.find(it => it && it.buyer_id)) ? String(items.find(it => it && it.buyer_id).buyer_id) : '';
        let buyer_id = buyerIdFromItems || fetchFirstLocal(['contract_buyer_id', 'agriai_buyer_id', 'buyer_id', 'selected_buyer_id'], '') || undefined;
        let buyer_name = fetchFirstLocal(['contract_buyer_name', 'agriai_buyer_name', 'buyer_name', 'selected_buyer_name'], '') || undefined;
        let buyer_email = fetchFirstLocal(['contract_buyer_email', 'agriai_buyer_email', 'buyer_email', 'selected_buyer_email'], '') || undefined;
        let buyer_state = fetchFirstLocal(['contract_buyer_state', 'agriai_buyer_state', 'buyer_state', 'selected_buyer_state'], '') || undefined;
        let buyer_region = fetchFirstLocal(['contract_buyer_region', 'agriai_buyer_region', 'buyer_region', 'selected_buyer_region'], '') || undefined;

        // If we have a buyer_id, try to fetch authoritative buyer details
        try {
          if (buyer_id) {
            const resB = await fetch(`${apiBase}/buyer/get?id=${encodeURIComponent(buyer_id)}`);
            if (resB && resB.ok) {
              const jb = await resB.json().catch(() => null);
              if (jb && jb.ok && jb.buyer) {
                buyer_id = jb.buyer.id ? String(jb.buyer.id) : buyer_id;
                buyer_name = jb.buyer.name || buyer_name;
                buyer_email = jb.buyer.email || buyer_email;
                buyer_state = jb.buyer.state || buyer_state;
                buyer_region = jb.buyer.region || buyer_region;
              }
            }
          }
        } catch (e) { console.warn('buyer/get failed when preparing contract payload', e); }

        const payload = {
          farmer_id: farmerId || undefined,
          farmer_name: farmerName || undefined,
          farmer_email: farmerEmail || undefined,
          farmer_state: farmerState || undefined,
          farmer_region: farmerRegion || undefined,
          buyer_id: buyer_id || undefined,
          buyer_name: buyer_name || undefined,
          buyer_state: buyer_state || undefined,
          buyer_region: buyer_region || undefined,
          buyer_email: buyer_email || undefined,
          total_quantity: totalOrderedQty,
          total_amount: grand_total,
          // include detailed computed contract meta for accurate history rendering
          contract_meta: {
            start_date: orderRecord.contract_meta && orderRecord.contract_meta.startDate,
            end_date: orderRecord.contract_meta && orderRecord.contract_meta.endDate,
            duration_days: orderRecord.contract_meta && orderRecord.contract_meta.days,
            variety: orderRecord.contract_meta && orderRecord.contract_meta.variety,
            description: orderRecord.contract_meta && orderRecord.contract_meta.description,
            total_contract_qty: orderRecord.contract_meta && orderRecord.contract_meta.totalContractQty,
            total_crop_trade_value: orderRecord.contract_meta && orderRecord.contract_meta.totalCropTradeValue,
            avg_price_per_kg: orderRecord.contract_meta && orderRecord.contract_meta.avgPricePerKg,
            buyer_fee_total: orderRecord.contract_meta && orderRecord.contract_meta.buyerFeeTotal,
            total_amount_payable_by_buyer: orderRecord.contract_meta && orderRecord.contract_meta.totalAmountPayableByBuyer,
            delivery_rate_display: orderRecord.contract_meta && orderRecord.contract_meta.deliveryRateDisplay,
            labour_charge: orderRecord.contract_meta && orderRecord.contract_meta.labourCharge,
            qty_kg: orderRecord.contract_meta && orderRecord.contract_meta.qtyKg,
            farmer_platform_fee: orderRecord.contract_meta && orderRecord.contract_meta.farmerPlatformFee,
            farmer_gst_on_fee: orderRecord.contract_meta && orderRecord.contract_meta.farmerGstOnFee,
            net_amount_payable_to_farmer: orderRecord.contract_meta && orderRecord.contract_meta.netAmountPayableToFarmer,
            buyer_totals: orderRecord.contract_meta && orderRecord.contract_meta.buyer_totals,
            farmer_totals: orderRecord.contract_meta && orderRecord.contract_meta.farmer_totals
          },
          lang: contractLang || siteLang || 'en'
        };

        (async () => {
          try {
            console.log('contract-submitted payload:', payload);
            const res = await fetch(`${apiBase}/notifications/contract-submitted`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res) {
              console.warn('No response from contract-submitted');
              alert('Contract request failed: no response from server');
              return;
            }
            const text = await res.text().catch(() => '');
            let j = null;
            try { j = text ? JSON.parse(text) : null; } catch (e) { j = null; }
            console.log('contract-submitted response:', res.status, text, j);
                if (res.ok && j && j.ok) {
              const cn = j.contract_number || j.contractNumber || '';
              const cdt = j.contract_datetime || j.contractDatetime || null;
              try {
                // Update local history entry (match by invoiceId) to store contract_number, contract_datetime and all payload fields
                const rawHist = localStorage.getItem('agriai_history_farmer');
                if (rawHist) {
                  try {
                    const hist = JSON.parse(rawHist) || [];
                    let updated = hist.map(h => {
                      try {
                        if (h && h.invoice_id && h.invoice_id === invoiceId) {
                          return {
                            ...h,
                            contract_number: cn || h.contract_number,
                            contract_datetime: cdt || new Date().toISOString(),
                              contract_meta: (payload && payload.contract_meta) || orderRecord.contract_meta || h.contract_meta || h.contractMeta || undefined,
                            // persist authoritative contract fields we sent to server so History can render them
                            farmer_id: payload && payload.farmer_id || h.farmer_id || undefined,
                            farmer_name: payload && payload.farmer_name || h.farmer_name || undefined,
                            farmer_email: payload && payload.farmer_email || h.farmer_email || undefined,
                            farmer_state: payload && payload.farmer_state || h.farmer_state || undefined,
                            farmer_region: payload && payload.farmer_region || h.farmer_region || undefined,
                            buyer_id: payload && payload.buyer_id || h.buyer_id || undefined,
                            buyer_name: payload && payload.buyer_name || h.buyer_name || undefined,
                            buyer_email: payload && payload.buyer_email || h.buyer_email || undefined,
                            buyer_state: payload && payload.buyer_state || h.buyer_state || undefined,
                            buyer_region: payload && payload.buyer_region || h.buyer_region || undefined,
                            total_quantity: payload && payload.total_quantity || (h.totals && h.totals.order_quantity) || h.total_quantity || undefined,
                            total_amount: payload && payload.total_amount || (h.totals && h.totals.grand_total) || h.total_amount || undefined,
                            lang: payload && payload.lang || h.lang || undefined
                          };
                        }
                      } catch (e) {}
                      return h;
                    });
                    // upload contract HTML to backend to create PDF/HTML file
                    try {
                      (async () => {
                        try {
                          const apiBase = (window.__AGRIAI_API_BASE__ || '');
                          const url = apiBase ? (apiBase + '/notifications/contract-pdf') : '/notifications/contract-pdf';
                          const resp2 = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contract_number: cn, contract_html: contractHtml }) });
                          if (resp2 && resp2.ok) {
                            const jr = await resp2.json().catch(() => null);
                            if (jr && jr.ok) {
                              const pdfUrl = jr.pdf_url || jr.html_url || null;
                              if (pdfUrl) {
                                updated = updated.map(h => {
                                  try { if (h && h.invoice_id === invoiceId) { return { ...h, contract_pdf_url: pdfUrl }; } } catch (e) {}
                                  return h;
                                });
                                localStorage.setItem('agriai_history_farmer', JSON.stringify(updated));
                              } else {
                                localStorage.setItem('agriai_history_farmer', JSON.stringify(updated));
                              }
                            } else {
                              localStorage.setItem('agriai_history_farmer', JSON.stringify(updated));
                            }
                          } else {
                            localStorage.setItem('agriai_history_farmer', JSON.stringify(updated));
                          }
                        } catch (e) { console.warn('contract-pdf upload failed', e); localStorage.setItem('agriai_history_farmer', JSON.stringify(updated)); }
                      })();
                    } catch (e) { localStorage.setItem('agriai_history_farmer', JSON.stringify(updated)); }
                  } catch (e) {}
                }
                alert((t('contractSaved', siteLang) || 'Contract saved') + (cn ? '\n' + cn : ''));
              } catch (e) {}
            } else {
              alert('Contract request failed: ' + (j && j.error ? j.error : ('HTTP ' + res.status)));
            }
          } catch (e) { console.warn('contract-submitted POST failed', e); alert('Contract request failed: ' + e); }
        })();
      } catch (e) { console.warn('contract record creation error', e); }
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
      let resolvedBuyerId = '';
      try {
        const buyerIdFromItems = (items && Array.isArray(items) && items.find(it => it && it.buyer_id)) ? String(items.find(it => it && it.buyer_id).buyer_id) : '';
        resolvedBuyerId = buyerIdFromItems || buyerIdFromStorage || '';
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

      const startDateObj = new Date();
      const startDate = startDateObj.toLocaleDateString('en-GB');
      // default days based on contractType
      let days = contractType === 'one-time' ? 30 : (contractType === 'seasonal' ? 90 : 365);
      // default end date based on days
      let endDateObj = new Date(Date.now() + days * 24 * 3600 * 1000);

      // If we have a resolved buyer id, try to fetch recent deals for that buyer and use delivery_date
      try {
        const buyerIdForDeals = (resolvedBuyerId) ? resolvedBuyerId : (buyerId || '');
        if (buyerIdForDeals) {
          // prefer narrowing by crop_name of first item if available
          const firstCrop = (items && items.length && items[0] && (items[0].crop_name || items[0].id)) ? encodeURIComponent(items[0].crop_name || items[0].id) : '';
          const q = `${apiBase}/deals/list?buyer_id=${encodeURIComponent(buyerIdForDeals)}${firstCrop ? '&crop_name=' + firstCrop : ''}`;
          const rd = await fetch(q);
          if (rd && rd.ok) {
            const jd = await rd.json().catch(() => null);
            if (jd && jd.ok && Array.isArray(jd.deals) && jd.deals.length) {
              // take most recent deal (list_deals orders by created_at desc)
              const deal = jd.deals[0];
              if (deal && deal.delivery_date) {
                // parse delivery_date which may be 'YYYY-MM-DD' or ISO
                const parsed = new Date(deal.delivery_date);
                if (!isNaN(parsed.getTime())) {
                  endDateObj = parsed;
                  // compute days difference from startDateObj to endDateObj (round up)
                  const diffMs = endDateObj.setHours(0,0,0,0) - new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate()).getTime();
                  const computedDays = Math.ceil(diffMs / (24 * 3600 * 1000));
                  if (Number.isFinite(computedDays) && computedDays > 0) days = computedDays;
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn('deals lookup for delivery_date failed', e);
      }

      const endDate = endDateObj.toLocaleDateString('en-GB');

      // Build commodity rows from items (separate from the big template to avoid nested template parsing issues)
      const rowsHtml = (items || []).map((it, idx) => {
        const qty = Number(it.order_quantity || 0) || 0;
        const variety = it.variety || it.crop_variety || it.var || '';
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
      const rowsPlaceholder = rowsHtml && rowsHtml.trim() ? rowsHtml : `<tr><td colspan="6" style="padding:8px;border:1px solid #ddd;text-align:center">${t('noItems', siteLang)}</td></tr>`;

      // compute totals for contract summary
      const totalContractQty = (items || []).reduce((s, it) => s + (Number(it.order_quantity || 0) || 0), 0);
      const totalCropTradeValue = (items || []).reduce((s, it) => s + ((Number(it.order_quantity || 0) || 0) * (Number(it.price_per_kg || 0) || 0)), 0);
      const avgPricePerKg = totalContractQty > 0 ? (totalCropTradeValue / totalContractQty) : 0;
      // buyer fee total (commission + gst) and final payable by buyer (excluding delivery)
      const buyerFeeTotal = (buyerTotals.commission || 0) + (buyerTotals.gst || 0);
      const totalAmountPayableByBuyer = Math.round((totalCropTradeValue + buyerFeeTotal + Number.EPSILON) * 100) / 100;

      // Determine delivery rate options per km based on total contracted quantity (kg)
      const qtyKg = Math.round(totalContractQty || 0);
      const labourCharge = computeLabourCharge(qtyKg);
      // Map quantity bands to possible per-km rates (INR)
      const qtyRateMap = [
        { min: 0, max: 40, rates: [12, 18, 22] },
        { min: 41, max: 400, rates: [18, 22, 28] },
        { min: 401, max: 1500, rates: [22, 28, 35] },
        { min: 1501, max: 5000, rates: [28, 35, 45] },
        { min: 5001, max: 10000, rates: [35, 45, 60] },
        { min: 10001, max: 20000, rates: [40] },
        { min: 20001, max: 40000, rates: [75] }
      ];

      // find the matching band; if none found, fall back to last band rates
      let matching = qtyRateMap.find(r => qtyKg >= r.min && qtyKg <= r.max);
      if (!matching) matching = qtyRateMap[qtyRateMap.length - 1];

      // Build a human-friendly rates string: "₹12 / km or ₹18 / km or ₹22 / km"
      const formatRates = (arr) => {
        const parts = (arr || []).map(v => `₹${v} / km`);
        if (parts.length === 0) return '₹-- / km';
        if (parts.length === 1) return parts[0];
        if (parts.length === 2) return `${parts[0]} or ${parts[1]}`;
        return `${parts.slice(0, -1).join(', ')} or ${parts[parts.length - 1]}`;
      };

      const deliveryRateDisplay = `${formatRates(matching.rates)}`;

      // Map language codes to display names for the contract
      

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 10, position: 'relative' }}>
              <div style={{ fontWeight: 800, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>{t('contractPreview', siteLang)}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', position: 'absolute', right: 0, top: '58%', transform: 'translateY(-50%)', paddingTop: 6 }}>
                  <select value={contractLang} onChange={(e) => { const v = e.target.value; setContractLang(v); }} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', fontWeight: 700, color: '#000' }} aria-label="Select language for contract">
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="kn">Kannada</option>
                    <option value="ta">Tamil</option>
                    <option value="te">Telugu</option>
                    <option value="mr">Marathi</option>
                    <option value="bn">Bengali</option>
                    <option value="or">Odia</option>
                  </select>
                  <button onClick={downloadContract} style={{ padding: '6px 10px' }}>{t('download', siteLang) || 'Download'}</button>
                  <button onClick={printContract} style={{ padding: '6px 10px' }}>{t('print', siteLang) || 'Print'}</button>
                  <button onClick={() => setShowContractPreview(false)} style={{ padding: '6px 10px' }}>{t('close', siteLang) || 'Close'}</button>
                </div>
              </div>
            <div style={{ border: '1px solid #eee', borderRadius: 6, padding: 12, background: '#fff' }} dangerouslySetInnerHTML={{ __html: contractHtml }} />
            {showDeliveryInfoModal && (
              <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                <div style={{ width: '92%', maxWidth: 760, background: '#fff', borderRadius: 8, padding: 18, boxShadow: '0 12px 40px rgba(0,0,0,0.25)', overflow: 'auto' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 8px 0', color: '#236902' }}>Delivery & Logistics Charges</h3>
                      <div style={{ fontSize: 14, color: '#111', lineHeight: 1.5 }}>
                        <div style={{ overflow: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, fontSize: 14, textAlign: 'center' }}>
                            <thead>
                              <tr>
                                <th style={{ border: '1px solid #ddd', padding: 8, background: '#f7f7f7', textAlign: 'center' }}>Vehicle Type</th>
                                <th style={{ border: '1px solid #ddd', padding: 8, background: '#f7f7f7', textAlign: 'center' }}>Typical Distance Range (km)</th>
                                <th style={{ border: '1px solid #ddd', padding: 8, background: '#f7f7f7', textAlign: 'center' }}>Vehicle Capacity</th>
                                <th style={{ border: '1px solid #ddd', padding: 8, background: '#f7f7f7', textAlign: 'center' }}>FIXED Cost per km (₹)</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr><td style={{ border: '1px solid #ddd', padding: 8 }}>Bike Courier</td><td style={{ border: '1px solid #ddd', padding: 8 }}>0 – 20 km</td><td style={{ border: '1px solid #ddd', padding: 8 }}>Up to 40 kg</td><td style={{ border: '1px solid #ddd', padding: 8 }}><strong>₹12 / km</strong></td></tr>
                              <tr><td style={{ border: '1px solid #ddd', padding: 8 }}>3-Wheeler Cargo (Auto / Ape)</td><td style={{ border: '1px solid #ddd', padding: 8 }}>0 – 80 km</td><td style={{ border: '1px solid #ddd', padding: 8 }}>0 – 400 kg</td><td style={{ border: '1px solid #ddd', padding: 8 }}><strong>₹18 / km</strong></td></tr>
                              <tr><td style={{ border: '1px solid #ddd', padding: 8 }}>Mini Truck (Tata Ace / Pickup)</td><td style={{ border: '1px solid #ddd', padding: 8 }}>0 – 100 km</td><td style={{ border: '1px solid #ddd', padding: 8 }}>40 – 1500 kg</td><td style={{ border: '1px solid #ddd', padding: 8 }}><strong>₹22 / km</strong></td></tr>
                              <tr><td style={{ border: '1px solid #ddd', padding: 8 }}>LCV / Small Truck</td><td style={{ border: '1px solid #ddd', padding: 8 }}>50 – 250 km</td><td style={{ border: '1px solid #ddd', padding: 8 }}>1000 – 5 tons</td><td style={{ border: '1px solid #ddd', padding: 8 }}><strong>₹28 / km</strong></td></tr>
                              <tr><td style={{ border: '1px solid #ddd', padding: 8 }}>6-Wheeler Truck</td><td style={{ border: '1px solid #ddd', padding: 8 }}>100 – 400 km</td><td style={{ border: '1px solid #ddd', padding: 8 }}>1000 – 10 tons</td><td style={{ border: '1px solid #ddd', padding: 8 }}><strong>₹35 / km</strong></td></tr>
                              <tr><td style={{ border: '1px solid #ddd', padding: 8 }}>10-Wheeler Truck</td><td style={{ border: '1px solid #ddd', padding: 8 }}>200 – 1000 km</td><td style={{ border: '1px solid #ddd', padding: 8 }}>10 – 20 tons</td><td style={{ border: '1px solid #ddd', padding: 8 }}><strong>₹45 / km</strong></td></tr>
                              <tr><td style={{ border: '1px solid #ddd', padding: 8 }}>Multi-Axle / Heavy Truck</td><td style={{ border: '1px solid #ddd', padding: 8 }}>300 – 1500 km</td><td style={{ border: '1px solid #ddd', padding: 8 }}>20 – 40 tons</td><td style={{ border: '1px solid #ddd', padding: 8 }}><strong>₹60 / km</strong></td></tr>
                              <tr><td style={{ border: '1px solid #ddd', padding: 8 }}>Refrigerated Truck (Addon)</td><td style={{ border: '1px solid #ddd', padding: 8 }}>50 – 2000 km</td><td style={{ border: '1px solid #ddd', padding: 8 }}>Any</td><td style={{ border: '1px solid #ddd', padding: 8 }}><strong>+ ₹12 / km</strong></td></tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                    <div style={{ flex: '0 0 auto', marginTop: 12 }}>
                      <button onClick={() => setShowDeliveryInfoModal(false)} style={{ background: '#236902', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 10px', cursor: 'pointer', display: 'inline-block' }}>Close</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
