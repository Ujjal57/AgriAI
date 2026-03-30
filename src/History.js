import React from 'react';
import Navbar from './Navbar';
import logo from './assets/logo192.png';
import { t } from './i18n';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  * { box-sizing: border-box; }

  .hist-root {
    min-height: 100vh;
    font-family: 'Inter', sans-serif;
    background: linear-gradient(135deg, #0a2e0a 0%, #1a5c10 30%, #2d8a1f 60%, #53b635 100%);
    background-attachment: fixed;
    position: relative;
    overflow-x: hidden;
  }
  .hist-root::before {
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

  .hist-orb {
    position: fixed;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.18;
    pointer-events: none;
    z-index: 0;
    animation: histFloatOrb 12s ease-in-out infinite;
  }
  .hist-orb-1 { width:400px;height:400px;background:#53b635;top:-100px;left:-100px;animation-delay:0s; }
  .hist-orb-2 { width:300px;height:300px;background:#236902;bottom:10%;right:-80px;animation-delay:4s; }
  .hist-orb-3 { width:250px;height:250px;background:#8fdb5e;top:40%;left:60%;animation-delay:8s; }
  @keyframes histFloatOrb {
    0%,100%{transform:translate(0,0) scale(1);}
    33%{transform:translate(30px,-20px) scale(1.05);}
    66%{transform:translate(-20px,30px) scale(0.95);}
  }

  .hist-leaf {
    position: fixed;
    width:10px;height:10px;
    opacity:0;pointer-events:none;z-index:0;
    animation:histLeafFall linear infinite;
  }
  .hist-leaf::before{content:'🌿';font-size:16px;}
  .hist-leaf-1{left:5%;animation-duration:14s;animation-delay:0s;}
  .hist-leaf-2{left:20%;animation-duration:18s;animation-delay:3s;}
  .hist-leaf-3{left:40%;animation-duration:12s;animation-delay:6s;}
  .hist-leaf-4{left:65%;animation-duration:16s;animation-delay:1s;}
  .hist-leaf-5{left:85%;animation-duration:20s;animation-delay:9s;}
  @keyframes histLeafFall {
    0%{transform:translateY(-40px) rotate(0deg);opacity:0;}
    10%{opacity:0.6;}
    90%{opacity:0.3;}
    100%{transform:translateY(110vh) rotate(720deg);opacity:0;}
  }

  .hist-main {
    position: relative;
    z-index: 1;
    padding: 5rem 1.5rem 3rem;
    max-width: 1100px;
    margin: 0 auto;
    animation: histFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes histFadeUp {
    from{opacity:0;transform:translateY(32px);}
    to{opacity:1;transform:translateY(0);}
  }

  .hist-glass {
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(20px) saturate(1.6);
    -webkit-backdrop-filter: blur(20px) saturate(1.6);
    border-radius: 24px;
    border: 1px solid rgba(255,255,255,0.6);
    box-shadow:
      0 8px 32px rgba(35,105,2,0.12),
      0 32px 64px rgba(0,0,0,0.08),
      inset 0 1px 0 rgba(255,255,255,0.8);
    padding: 2.5rem;
  }

  .hist-title {
    text-align: center;
    font-size: 2.2rem;
    font-weight: 800;
    color: transparent;
    background: linear-gradient(135deg, #1a5c10 0%, #236902 50%, #53b635 100%);
    -webkit-background-clip: text;
    background-clip: text;
    margin: 0 0 1.75rem;
    letter-spacing: -0.5px;
  }

  /* Search / filter bar */
  .hist-filter-bar {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.75rem;
  }
  .hist-search-input {
    flex: 1 1 280px;
    min-width: 220px;
    padding: 10px 14px;
    border: 1.5px solid #d4edcc;
    border-radius: 10px;
    font-size: 0.9rem;
    font-family: inherit;
    background: rgba(255,255,255,0.95);
    color: #1a3d0a;
    outline: none;
    transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s;
  }
  .hist-search-input:focus {
    border-color: #53b635;
    box-shadow: 0 0 0 3px rgba(83,182,53,0.18);
    transform: translateY(-2px);
  }
  .hist-filter-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .hist-filter-label {
    font-size: 0.78rem;
    font-weight: 700;
    color: #2d5c1a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }
  .hist-filter-select {
    padding: 10px 14px;
    border: 1.5px solid #d4edcc;
    border-radius: 10px;
    font-size: 0.9rem;
    font-family: inherit;
    background: rgba(255,255,255,0.95);
    color: #1a3d0a;
    outline: none;
    transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s;
  }
  .hist-filter-select:focus {
    border-color: #53b635;
    box-shadow: 0 0 0 3px rgba(83,182,53,0.18);
    transform: translateY(-2px);
  }

  /* Empty state */
  .hist-empty {
    text-align: center;
    padding: 4rem 2rem;
    color: #6b9b5a;
    animation: histFadeUp 0.6s ease both;
  }
  .hist-empty-icon { font-size: 4rem; display: block; margin-bottom: 1rem; opacity: 0.6; }
  .hist-empty-text { font-size: 1rem; font-weight: 600; }

  /* Orders list */
  .hist-orders-list { display: grid; gap: 16px; }

  /* Order card */
  .hist-order-card {
    background: #fff;
    border-radius: 16px;
    border: 1px solid rgba(83,182,53,0.15);
    box-shadow: 0 4px 16px rgba(35,105,2,0.07);
    overflow: hidden;
    transition: transform 0.35s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.35s;
    animation: histCardIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes histCardIn {
    from{opacity:0;transform:translateY(20px) scale(0.97);}
    to{opacity:1;transform:translateY(0) scale(1);}
  }
  .hist-order-card:hover {
    transform: translateY(-4px) scale(1.005);
    box-shadow: 0 16px 40px rgba(35,105,2,0.14);
  }

  /* Card header row */
  .hist-card-header {
    padding: 12px 16px;
    background: linear-gradient(135deg, rgba(234,246,234,0.7) 0%, rgba(255,255,255,0.5) 100%);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    border-bottom: 1px solid rgba(83,182,53,0.1);
  }
  .hist-card-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .hist-invoice-id {
    font-weight: 800;
    color: #236902;
    font-size: 0.95rem;
  }
  .hist-date-text {
    font-size: 0.82rem;
    color: #4a7a3a;
    font-weight: 600;
  }
  .hist-payment-badge {
    background: linear-gradient(135deg, #eaf6ea, #d4f0d4);
    color: #236902;
    padding: 3px 10px;
    border-radius: 999px;
    font-weight: 700;
    font-size: 0.78rem;
    border: 1px solid rgba(83,182,53,0.25);
    white-space: nowrap;
  }

  .hist-card-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .hist-total-amount {
    font-weight: 800;
    color: #236902;
    font-size: 1rem;
  }
  .hist-btn-invoice {
    padding: 7px 12px;
    background: linear-gradient(135deg,#1565c0,#1976d2);
    color: #fff;
    border: none;
    border-radius: 9px;
    font-size: 0.82rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(25,118,210,0.25);
    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s;
  }
  .hist-btn-invoice:hover { transform:translateY(-2px) scale(1.04); box-shadow:0 6px 16px rgba(25,118,210,0.35); }
  .hist-btn-toggle {
    padding: 7px 12px;
    background: #fff;
    color: #236902;
    border: 1.5px solid #d4edcc;
    border-radius: 9px;
    font-size: 0.82rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), border-color 0.18s, box-shadow 0.18s;
  }
  .hist-btn-toggle:hover { transform:translateY(-2px) scale(1.04); border-color:#53b635; box-shadow:0 4px 12px rgba(35,105,2,0.12); }

  /* Expanded details */
  .hist-card-details {
    padding: 14px 16px;
    overflow-x: auto;
  }
  .hist-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.88rem;
  }
  .hist-table th {
    border: 1px solid rgba(83,182,53,0.2);
    padding: 9px 10px;
    background: linear-gradient(135deg,#f5fbf3,#edf7ea);
    color: #2d5c1a;
    font-weight: 700;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    text-align: center;
  }
  .hist-table td {
    border: 1px solid rgba(83,182,53,0.1);
    padding: 9px 10px;
    text-align: center;
    color: #1a3d0a;
    font-weight: 600;
  }
  .hist-table tr:hover td { background: rgba(234,246,234,0.4); }

  .hist-grand-total {
    text-align: right;
    margin-top: 12px;
    font-size: 1.05rem;
    font-weight: 800;
    color: #236902;
    background: linear-gradient(135deg,#eaf6ea,#d4f0d4);
    border: 1px solid rgba(83,182,53,0.25);
    border-radius: 10px;
    padding: 9px 14px;
    display: inline-block;
    float: right;
  }
  .hist-clear { clear: both; }

  @media (max-width: 768px) {
    .hist-glass { padding: 1.5rem; }
    .hist-title { font-size: 1.6rem; }
    .hist-filter-bar { flex-direction: column; align-items: stretch; }
    .hist-search-input { min-width: unset; }
  }
`;

export default function History() {
  const [orders, setOrders] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [paymentFilter, setPaymentFilter] = React.useState('all');
  const [expanded, setExpanded] = React.useState({});
  const [siteLang, setSiteLang] = React.useState(() => localStorage.getItem('agri_lang') || 'en');

  React.useEffect(() => {
    const onLang = (e) => { const l = (e && e.detail && e.detail.lang) ? e.detail.lang : (localStorage.getItem('agri_lang') || 'en'); setSiteLang(l); };
    window.addEventListener('agri:lang:change', onLang);
    return () => { try { window.removeEventListener('agri:lang:change', onLang); } catch (e) {} };
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = localStorage.getItem('agriai_history');
        const hist = raw ? JSON.parse(raw) : [];
        const arr = Array.isArray(hist) ? hist : [];
        const signedId = localStorage.getItem('agriai_id');
        const signedPhone = localStorage.getItem('agriai_phone');
        let filtered = [];
        if (signedId || signedPhone) {
          filtered = arr.filter(o => {
            try {
              if (signedId && (o.buyer_id == signedId || (o.buyer && (''+o.buyer.id) === ''+signedId))) return true;
              if (signedPhone && (o.buyer && o.buyer.phone && (''+o.buyer.phone) === ''+signedPhone)) return true;
              return false;
            } catch (e) { return false; }
          });
        }
        if (mounted) setOrders(filtered);
        try {
          const apiBase = process.env.REACT_APP_API_BASE || (window.__AGRIAI_API_BASE__ || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000'));
          for (let o of filtered) {
            const cn = o.contract_number || o.invoice_id;
            if (!cn) continue;
            try {
              const resp = await fetch(`${apiBase}/contracts/get/${encodeURIComponent(cn)}`);
              if (resp && resp.status === 404) {
                const raw2 = localStorage.getItem('agriai_history');
                const arr2 = raw2 ? JSON.parse(raw2) : [];
                const arr3 = (arr2 || []).filter(h => (h.contract_number || h.invoice_id) !== cn);
                localStorage.setItem('agriai_history', JSON.stringify(arr3));
                if (mounted) setOrders(prev => (prev || []).filter(h => (h.contract_number || h.invoice_id) !== cn));
              }
            } catch (e) {}
          }
        } catch (e) {}
      } catch (e) {
        if (mounted) setOrders([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const formatDateTime = (iso) => {
    try {
      const d = new Date(iso);
      if (isNaN(d)) return String(iso);
      return d.toLocaleString();
    } catch (e) { return String(iso); }
  };

  const translateVar = (val) => {
    try {
      const raw = (val || '').toString().trim();
      if (!raw) return '';
      const normalize = (s) => (
        s.toString().trim()
          .replace(/[^a-zA-Z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter(Boolean)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join('')
      );
      const Normal = normalize(raw);
      const candidates = [`variety${Normal}`, `variety_${raw.toLowerCase().replace(/\s+/g,'_')}`, raw];
      for (let k of candidates) {
        try { const out = t(k, siteLang); if (out && out !== k) return out; } catch (e) {}
      }
      return raw;
    } catch (e) { return val || ''; }
  };

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const filtered = orders.filter(o => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q ||
      (o.invoice_id || '').toString().toLowerCase().includes(q) ||
      (o.items || []).some(it => {
        try {
          const cropMatch = (it.crop_name || '').toString().toLowerCase().includes(q);
          const varRaw = (it.variety || '').toString().toLowerCase();
          const varMatchRaw = varRaw.includes(q);
          const varMatchTranslated = (translateVar(it.variety) || '').toString().toLowerCase().includes(q);
          return cropMatch || varMatchRaw || varMatchTranslated;
        } catch (e) { return false; }
      });
    const matchesPayment = paymentFilter === 'all' || o.payment_method === paymentFilter;
    return matchesQuery && matchesPayment;
  });

  const openInvoice = (order) => {
    const invoiceId = order.invoice_id;
    const date = formatDateTime(order.created_at);
    const logoSrc = window.location.origin + logo;
    const totalOrderedQty = (order.items || []).reduce((s, it) => s + (Number(it.order_quantity || 0) || 0), 0);
    const qtyKg = Math.round(totalOrderedQty || 0);
    const qtyRateMap = [
      { min:0,max:40,rates:[12,18,22] },{ min:41,max:400,rates:[18,22,28] },
      { min:401,max:1500,rates:[22,28,35] },{ min:1501,max:5000,rates:[28,35,45] },
      { min:5001,max:10000,rates:[35,45,60] }
    ];
    let matching = qtyRateMap.find(r => qtyKg >= r.min && qtyKg <= r.max);
    if (!matching) matching = qtyRateMap[qtyRateMap.length - 1];
    const formatRates = (arr) => { const parts = (arr || []).map(v => `₹${v} / km`); if (parts.length === 0) return '₹-- / km'; if (parts.length === 1) return parts[0]; if (parts.length === 2) return `${parts[0]} or ${parts[1]}`; return `${parts.slice(0,-1).join(', ')} or ${parts[parts.length-1]}`; };
    const deliveryRateDisplay = `${formatRates(matching.rates)}`;
    const computeLabourCharge = (q) => { if (!Number.isFinite(q) || q <= 0) return 0; if (q <= 100) return 40; if (q <= 1000) return 750; return Math.round(750 + ((q - 1000) / 1000) * 300); };
    const labourCharge = computeLabourCharge(qtyKg);
    let html = `<html><head><title>Invoice ${invoiceId}</title><style>body{font-family:'Times New Roman',serif;padding:20px;color:#333;}h1{color:#236902;text-align:center;}table{width:100%;border-collapse:collapse;margin-top:20px;}th,td{border:1px solid #ccc;padding:8px;text-align:center;}th{background:#f4f4f4;}.footer{margin-top:20px;font-size:14px;color:#555;text-align:center;}#printBtn{background-color:#236902;color:white;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;font-size:15px;margin:15px auto;display:block;}#printBtn:hover{background-color:#1a4f02;}.infoBtn{margin-left:8px;border:0;background:#1976d2;color:#fff;border-radius:50%;width:20px;height:20px;font-size:12px;line-height:18px;cursor:pointer;}.modal{position:fixed;left:0;top:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;z-index:10000;background:rgba(0,0,0,0.5);}.modal-content{width:92%;max-width:760px;background:#fff;border-radius:8px;padding:18px;box-shadow:0 12px 40px rgba(0,0,0,0.25);overflow:auto;}</style></head><body><div style="text-align:center;"><img src="${logoSrc}" alt="AgriAI Logo" style="width:100px;height:100px;display:block;margin:0 auto 10px auto;"/><h1>${t('invoiceTitle', siteLang) || 'Agri AI Invoice'}</h1></div><p><strong>${t('invoiceIdLabel', siteLang) || 'Invoice ID:'}</strong> ${invoiceId}<br><strong>${t('dateLabel', siteLang) || 'Date:'}</strong> ${date}</p><table><thead><tr><th>${t('tableIndex', siteLang) || '#'}</th><th>${t('tableCropName', siteLang) || 'Crop Name'}</th><th>${t('tableVariety', siteLang) || 'Variety'}</th><th>${t('tableQuantity', siteLang) || 'Quantity (kg)'}</th><th>${t('tablePricePerKg', siteLang) || 'Price/kg'}</th><th>${t('tableTotal', siteLang) || 'Total'}</th></tr></thead><tbody>`;
    (order.items || []).forEach((it, idx) => { html += `<tr><td style="text-align:center">${idx+1}</td><td style="text-align:center">${it.crop_name}</td><td style="text-align:center">${translateVar(it.variety)}</td><td style="text-align:center">${it.order_quantity}</td><td style="text-align:center">₹${it.price_per_kg}</td><td style="text-align:center">₹${Number(it.total).toFixed(2)}</td></tr>`; });
    const totals = order.totals || { subtotal:0,gst:0,platform_fee:0,grand_total:0 };
    html += `</tbody></table><h3 style="text-align:right;margin-top:10px;color:#000;"><span style="color:#236902;">${t('grandTotalLabel', siteLang) || 'Grand Total'}: ₹${Number(totals.grand_total).toFixed(2)}</span></h3><div style="margin-top:8px;"><strong>Delivery / Logistics Charges (Payable After Delivery):</strong> ${deliveryRateDisplay} <button class="infoBtn" onclick="showDeliveryInfo()" aria-label="Delivery info">i</button><br/></div><div class="footer"><p><strong>${t('paymentMethod', siteLang) || 'Payment Method:'}</strong> ${order.payment_method === 'cod' ? (t('cashOnDelivery', siteLang) || 'Cash on Delivery') : (t('online', siteLang) || 'Online')}</p><p>${t('thankYou', siteLang) || 'Thank you for choosing Agri AI!'}</p></div><button id="printBtn" onclick="window.print()">${t('printButton', siteLang) || 'Print / Save as PDF'}</button><div id="deliveryModal" class="modal" style="display:none;"><div class="modal-content"><div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;"><div style="flex:1;"><h3 style="margin:0 0 8px 0;color:#236902;">Delivery & Logistics Charges</h3><div style="font-size:14px;color:#111;line-height:1.5;"><div style="overflow:auto;"><table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:14px;text-align:center;"><thead><tr><th style="border:1px solid #ddd;padding:8px;background:#f7f7f7;">Vehicle Type</th><th style="border:1px solid #ddd;padding:8px;background:#f7f7f7;">Typical Distance Range (km)</th><th style="border:1px solid #ddd;padding:8px;background:#f7f7f7;">Vehicle Capacity</th><th style="border:1px solid #ddd;padding:8px;background:#f7f7f7;">FIXED Cost per km (₹)</th></tr></thead><tbody><tr><td style="border:1px solid #ddd;padding:8px;">Bike Courier</td><td style="border:1px solid #ddd;padding:8px;">0 – 20 km</td><td style="border:1px solid #ddd;padding:8px;">Up to 40 kg</td><td style="border:1px solid #ddd;padding:8px;"><strong>₹12 / km</strong></td></tr><tr><td style="border:1px solid #ddd;padding:8px;">3-Wheeler Cargo (Auto / Ape)</td><td style="border:1px solid #ddd;padding:8px;">0 – 80 km</td><td style="border:1px solid #ddd;padding:8px;">0 – 400 kg</td><td style="border:1px solid #ddd;padding:8px;"><strong>₹18 / km</strong></td></tr><tr><td style="border:1px solid #ddd;padding:8px;">Mini Truck (Tata Ace / Pickup)</td><td style="border:1px solid #ddd;padding:8px;">0 – 100 km</td><td style="border:1px solid #ddd;padding:8px;">40 – 1500 kg</td><td style="border:1px solid #ddd;padding:8px;"><strong>₹22 / km</strong></td></tr></tbody></table></div></div></div><div style="flex:0 0 auto;margin-top:12px;"><button onclick="hideDeliveryInfo()" style="background:#236902;color:#fff;border:none;border-radius:6px;padding:8px 10px;cursor:pointer;">Close</button></div></div></div></div><script>function showDeliveryInfo(){document.getElementById('deliveryModal').style.display='flex';}function hideDeliveryInfo(){document.getElementById('deliveryModal').style.display='none';}<\/script></body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
  };

  return (
    <>
      <style>{styles}</style>

      <div className="hist-root">
        {/* Orbs */}
        <div className="hist-orb hist-orb-1" />
        <div className="hist-orb hist-orb-2" />
        <div className="hist-orb hist-orb-3" />
        {/* Leaves */}
        <div className="hist-leaf hist-leaf-1" />
        <div className="hist-leaf hist-leaf-2" />
        <div className="hist-leaf hist-leaf-3" />
        <div className="hist-leaf hist-leaf-4" />
        <div className="hist-leaf hist-leaf-5" />

        <Navbar />

        <main className="hist-main">
          <div className="hist-glass">

            <h1 className="hist-title">{t('historyTitle', siteLang) || 'Purchase History'}</h1>

            {/* Search & Filter */}
            <div className="hist-filter-bar">
              <input
                className="hist-search-input"
                placeholder={t('historySearchPlaceholder', siteLang) || 'Search by invoice or crop name'}
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <div className="hist-filter-group">
                <span className="hist-filter-label">{t('paymentLabel', siteLang) || 'Payment:'}</span>
                <select className="hist-filter-select" value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}>
                  <option value="all">{t('all', siteLang) || 'All'}</option>
                  <option value="online">{t('online', siteLang) || 'Online'}</option>
                  <option value="cod">{t('cashOnDelivery', siteLang) || 'Cash on Delivery'}</option>
                </select>
              </div>
            </div>

            {/* Empty state */}
            {filtered.length === 0 ? (
              <div className="hist-empty">
                <span className="hist-empty-icon">🧾</span>
                <div className="hist-empty-text">{t('historyNoPurchases', siteLang) || 'No matching purchases yet.'}</div>
              </div>
            ) : (
              <div className="hist-orders-list">
                {filtered.map((o, idx) => {
                  const total = o?.totals?.grand_total || 0;
                  const isExpanded = !!expanded[o.invoice_id];
                  return (
                    <div key={o.invoice_id} className="hist-order-card" style={{ animationDelay: `${idx * 60}ms` }}>

                      {/* Card header */}
                      <div className="hist-card-header">
                        <div className="hist-card-meta">
                          <span className="hist-invoice-id">
                            {((o.payment_method === 'contract' || o.contract_number)
                              ? (t('contractLabel', siteLang) || 'Contract')
                              : (t('invoiceLabel', siteLang) || 'Invoice')) + ': '}
                            {o.invoice_id || o.contract_number}
                          </span>
                          <span className="hist-date-text">
                            {t('dateLabel', siteLang) || 'Date'}: {(new Date(o.created_at)).toLocaleDateString()}
                          </span>
                          <span className="hist-payment-badge">
                            {o.payment_method === 'cod'
                              ? (t('cashOnDelivery', siteLang) || 'Cash on Delivery')
                              : (t('online', siteLang) || 'Online')}
                          </span>
                        </div>

                        <div className="hist-card-actions">
                          <span className="hist-total-amount">{formatCurrency(total)}</span>
                          <button className="hist-btn-invoice" onClick={() => openInvoice(o)}>
                            {t('viewInvoice', siteLang) || 'View Invoice'}
                          </button>
                          <button className="hist-btn-toggle" onClick={() => toggleExpand(o.invoice_id)}>
                            {isExpanded ? (t('hide', siteLang) || 'Hide') : (t('details', siteLang) || 'Details')}
                          </button>
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="hist-card-details">
                          <table className="hist-table">
                            <thead>
                              <tr>
                                <th>{t('tableIndex', siteLang) || '#'}</th>
                                <th>{t('tableCrop', siteLang) || 'Crop'}</th>
                                <th>{t('tableVariety', siteLang) || 'Variety'}</th>
                                <th>{t('tableQty', siteLang) || 'Qty (kg)'}</th>
                                <th>{t('tablePricePerKg', siteLang) || 'Price/kg'}</th>
                                <th>{t('tableTotal', siteLang) || 'Total'}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(o.items || []).map((it, idx) => (
                                <tr key={idx}>
                                  <td>{idx + 1}</td>
                                  <td>{it.crop_name}</td>
                                  <td>{translateVar(it.variety)}</td>
                                  <td>{Number(it.order_quantity || 0).toLocaleString('en-IN')}</td>
                                  <td>{formatCurrency(it.price_per_kg)}</td>
                                  <td>{formatCurrency(it.total)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          <div className="hist-grand-total">
                            {t('grandTotalLabel', siteLang) || 'Grand Total'}: {formatCurrency(o?.totals?.grand_total)}
                          </div>
                          <div className="hist-clear" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
}