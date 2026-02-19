import React from 'react';
import Navbar from '../Navbar';
import logo from '../assets/logo192.png';
import { t } from '../i18n';

export default function FarmerHistory() {
  const [orders, setOrders] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [paymentFilter, setPaymentFilter] = React.useState('all');
  const [expanded, setExpanded] = React.useState({});
  const [siteLang, setSiteLang] = React.useState(() => localStorage.getItem('agri_lang') || 'en');

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('agriai_history_farmer');
      const hist = raw ? JSON.parse(raw) : [];
      const localOrders = Array.isArray(hist) ? hist : [];
      setOrders(localOrders);

      // Attempt to fetch authoritative contract rows from backend and merge contract_number/contract_datetime
      (async () => {
        try {
          const role = localStorage.getItem('agriai_role') || '';
          const userId = localStorage.getItem('agriai_id') || '';
          const userEmail = localStorage.getItem('agriai_email') || '';
          if (role === 'farmer' && (userId || userEmail)) {
            const q = userId ? `?farmer_id=${encodeURIComponent(userId)}` : `?farmer_email=${encodeURIComponent(userEmail)}`;
            const apiBase = (window.__AGRIAI_API_BASE__ || '');
            const url = apiBase ? (apiBase + '/farmer/contracts' + q) : (`/farmer/contracts${q}`);
            const resp = await fetch(url);
            if (resp && resp.ok) {
              const j = await resp.json().catch(() => null);
              if (j && j.ok && Array.isArray(j.contracts)) {
                const contracts = j.contracts;
                // Build map by timestamp (seconds) for heuristic matching
                const contractMap = contracts.map(c => ({
                  contract_number: c.contract_number,
                  contract_datetime: c.contract_datetime,
                  total_amount: c.total_amount
                }));
                // merge into localOrders by nearest datetime within 10 seconds
                const merged = localOrders.map(o => {
                  try {
                    const oTime = new Date(o.created_at).getTime();
                    let matched = null;
                    for (let c of contractMap) {
                      if (!c.contract_datetime) continue;
                      const cTime = new Date(c.contract_datetime.replace(' ', 'T') + 'Z').getTime();
                      if (isNaN(cTime) || isNaN(oTime)) continue;
                      if (Math.abs(cTime - oTime) <= 10000) { matched = c; break; }
                    }
                    if (matched) {
                      return { ...o, contract_number: matched.contract_number, contract_datetime: matched.contract_datetime };
                    }
                  } catch (e) {}
                  return o;
                });

                // Add any contracts that didn't match local orders as standalone entries
                const unmatched = [];
                for (let c of contractMap) {
                  const exists = merged.some(m => (m.contract_number && m.contract_number === c.contract_number));
                  if (!exists) {
                    unmatched.push({ invoice_id: c.contract_number || ('CTR-' + Date.now()), created_at: c.contract_datetime || new Date().toISOString(), payment_method: 'contract', items: [], totals: { subtotal: 0, gst: 0, platform_fee: 0, grand_total: c.total_amount || 0 }, contract_number: c.contract_number, contract_datetime: c.contract_datetime });
                  }
                }

                const combined = [...merged, ...unmatched].sort((a,b) => new Date(b.contract_datetime || b.created_at) - new Date(a.contract_datetime || a.created_at));
                setOrders(combined);
              }
            }
          }
        } catch (e) {
          console.warn('Failed to fetch farmer contracts:', e);
        }
      })();
    } catch (e) {
      setOrders([]);
    }
  }, []);

  React.useEffect(() => {
    const onLang = (e) => { const l = (e && e.detail && e.detail.lang) ? e.detail.lang : (localStorage.getItem('agri_lang') || 'en'); setSiteLang(l); };
    window.addEventListener('agri:lang:change', onLang);
    return () => { try { window.removeEventListener('agri:lang:change', onLang); } catch (e) {} };
  }, []);

  const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const formatDateTime = (iso) => {
    try {
      const d = new Date(iso);
      if (isNaN(d)) return String(iso);
      return d.toLocaleString();
    } catch (e) { return String(iso); }
  };

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const handleDelete = (idKey) => {
    try {
      const raw = localStorage.getItem('agriai_history_farmer');
      const hist = raw ? JSON.parse(raw) : [];
      const filtered = (hist || []).filter(h => {
        const key = h.contract_number || h.invoice_id;
        return key !== idKey;
      });
      localStorage.setItem('agriai_history_farmer', JSON.stringify(filtered));
      setOrders(prev => (prev || []).filter(o => ((o.contract_number || o.invoice_id) !== idKey)));
    } catch (e) { console.warn('delete history failed', e); }
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
      const candidates = [ `variety${Normal}`, `variety_${raw.toLowerCase().replace(/\s+/g,'_')}`, raw ];
      for (let k of candidates) {
        try {
          const out = t(k, siteLang);
          if (out && out !== k) return out;
        } catch (e) {}
      }
      return raw;
    } catch (e) { return val || ''; }
  };

  const filtered = orders.filter(o => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q ||
      ((o.contract_number || o.invoice_id || '').toString().toLowerCase().includes(q)) ||
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

  const openInvoice = async (order) => {
    // Prefer PDF/HTML URL saved on the order if present
    const pdfUrl = order.contract_pdf_url || order.contract_html_url || order.contract_pdf || null;
    if (pdfUrl) {
      const full = pdfUrl.startsWith('http') ? pdfUrl : (window.location.origin + pdfUrl);
      window.open(full, '_blank');
      return;
    }

    // Build a full contract HTML similar to the contract generated in FarmerCart
    let buyerName = order.buyerName || order.buyer_name || (order.buyer && order.buyer.name) || '[Buyer Name]';
    const buyerId = order.buyerId || order.buyer_id || (order.buyer && order.buyer.id) || '';
    let buyerState = order.buyerState || order.buyer_state || (order.buyer && order.buyer.state) || '';
    let buyerRegion = order.buyerRegion || order.buyer_region || (order.buyer && order.buyer.region) || '';
    let farmerName = order.farmerName || order.farmer_name || (order.farmer && order.farmer.name) || (localStorage.getItem('agriai_name') || '');
    let farmerId = order.farmerId || order.farmer_id || (order.farmer && order.farmer.id) || (localStorage.getItem('agriai_id') || '');
    let farmerState = order.farmerState || order.farmer_state || (order.farmer && order.farmer.state) || (localStorage.getItem('agriai_state') || '');
    let farmerRegion = order.farmerRegion || order.farmer_region || (order.farmer && order.farmer.region) || (localStorage.getItem('agriai_region') || '');
    const contractNum = order.contract_number || order.invoice_id || ('CTR-' + (Date.now()));
    const date = formatDateTime(order.contract_datetime || order.created_at || new Date().toISOString());
    // prefer stored contract_meta values (saved at Confirm & Send)
    const cm = order.contract_meta || order.contractMeta || order.contract_meta || {};
    const contractType = order.contract_type || order.contractType || cm.contract_type || cm.contractType || 'one-time';
    const contractLang = order.contract_language || order.contractLanguage || cm.lang || (localStorage.getItem('agri_lang') || 'en');
    const startDate = (cm.start_date || cm.startDate) || (order.start_date || order.startDate) || (new Date().toLocaleDateString('en-GB'));
    // compute endDate: prefer ISO if available, else use stored strings, else derive from start + duration
    let endDate = (cm.end_date || cm.endDate) || (order.end_date || order.endDate) || '';
    try {
      const endIso = cm.end_date_iso || cm.endDateIso || order.contract_meta && (order.contract_meta.end_date_iso || order.contract_meta.endDateIso) || null;
      const startIso = cm.start_date_iso || cm.startDateIso || order.contract_meta && (order.contract_meta.start_date_iso || order.contract_meta.startDateIso) || null;
      const durationDays = (cm.duration_days || cm.durationDays || cm.days || cm.duration || null);
      if (!endDate && endIso) {
        endDate = new Date(endIso).toLocaleDateString('en-GB');
      }
      if (!endDate && durationDays != null && startIso) {
        try {
          const sd = new Date(startIso);
          if (!isNaN(sd)) {
            const ed = new Date(sd.getTime() + (Number(durationDays) * 24 * 3600 * 1000));
            endDate = ed.toLocaleDateString('en-GB');
          }
        } catch (e) {}
      }
    } catch (e) { /* ignore date parse errors */ }

    // If endDate still missing, try to fetch delivery/end date from deals table for the crop
    if (!endDate) {
      try {
        const apiBase = (window.__AGRIAI_API_BASE__ || '');
        const firstCropRaw = (order.items && order.items.length && (order.items[0].crop_name || order.items[0].id)) ? (order.items[0].crop_name || order.items[0].id) : (cm && cm.description ? cm.description.split(';')[0] : '');
        const firstCrop = firstCropRaw ? encodeURIComponent(String(firstCropRaw)) : '';
        if (firstCrop) {
          const dealsUrl = apiBase ? `${apiBase}/deals/list?crop_name=${firstCrop}` : `/deals/list?crop_name=${firstCrop}`;
          const rd = await fetch(dealsUrl);
          if (rd && rd.ok) {
            const jd = await rd.json().catch(() => null);
            if (jd && jd.ok && Array.isArray(jd.deals) && jd.deals.length) {
              const deal = jd.deals[0];
              const deliveryDateRaw = deal.delivery_date || deal.end_date || deal.deliveryDate || null;
              if (deliveryDateRaw) {
                const ed = new Date(deliveryDateRaw);
                if (!isNaN(ed)) {
                  endDate = ed.toLocaleDateString('en-GB');
                  // compute days from start
                  try {
                    const startIso = cm.start_date_iso || cm.startDateIso || (order.contract_meta && (order.contract_meta.start_date_iso || order.contract_meta.startDateIso)) || null;
                    const sd = startIso ? new Date(startIso) : new Date(startDate);
                    if (!isNaN(sd)) {
                      days = Math.max(0, Math.round((ed.getTime() - sd.getTime()) / (1000 * 60 * 60 * 24)));
                    }
                  } catch (e) {}
                }
              }
            }
          }
        }
      } catch (e) { console.warn('Failed to fetch deals for end date', e); }
    }
    const totals = order.totals || { subtotal: 0, gst: 0, platform_fee: 0, grand_total: 0 };
    const logoSrc = window.location.origin + logo;

    // Try to fetch authoritative contract details from backend by contract_number
    try {
      const apiBase = (window.__AGRIAI_API_BASE__ || '');
      let url = apiBase ? `${apiBase}/farmer/contracts?contract_number=${encodeURIComponent(contractNum)}` : `/farmer/contracts?contract_number=${encodeURIComponent(contractNum)}`;
      let resp = await fetch(url);
      if ((!resp || !resp.ok)) {
        // fallback: request contracts for this farmer and match locally
        const fid = localStorage.getItem('agriai_id') || localStorage.getItem('agriai_email') || '';
        if (fid) {
          const q = apiBase ? `${apiBase}/farmer/contracts?farmer_id=${encodeURIComponent(localStorage.getItem('agriai_id') || '')}` : `/farmer/contracts?farmer_id=${encodeURIComponent(localStorage.getItem('agriai_id') || '')}`;
          resp = await fetch(q);
        }
      }
      if (resp && resp.ok) {
        const j = await resp.json().catch(() => null);
        let fetched = null;
        if (j) {
          if (Array.isArray(j.contracts) && j.contracts.length) {
            fetched = j.contracts.find(c => (c.contract_number && String(c.contract_number) === String(contractNum))) || j.contracts[0];
          } else if (j.contract) {
            fetched = j.contract;
          }
        }
        if (fetched) {
          // if server stored a saved html/pdf url, open directly
          const remoteUrl = fetched.contract_pdf_url || fetched.contract_html_url || fetched.contract_pdf || null;
          if (remoteUrl) { window.open(remoteUrl.startsWith('http') ? remoteUrl : (window.location.origin + remoteUrl), '_blank'); return; }

          // merge authoritative fields
          buyerName = fetched.buyer_name || fetched.buyerName || buyerName;
          if (fetched.buyer_state) buyerState = fetched.buyer_state;
          if (fetched.buyer_region) buyerRegion = fetched.buyer_region;
          farmerName = fetched.farmer_name || fetched.farmerName || farmerName;
          farmerId = fetched.farmer_id || fetched.farmerId || farmerId;
          farmerState = fetched.farmer_state || fetched.farmerState || farmerState;
          farmerRegion = fetched.farmer_region || fetched.farmerRegion || farmerRegion;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch contract from server', e);
    }

    // Prefer stored contract_meta when available (saved at Confirm & Send); otherwise derive from order.items
    const totalContractQty = (cm.total_contract_qty || cm.totalContractQty) != null ? Number(cm.total_contract_qty || cm.totalContractQty) : (order.items || []).reduce((s, it) => s + (Number(it.order_quantity || it.quantity || 0) || 0), 0);
    const totalCropTradeValue = (cm.total_crop_trade_value || cm.totalCropTradeValue) != null ? Number(cm.total_crop_trade_value || cm.totalCropTradeValue) : (order.items || []).reduce((s, it) => s + ((Number(it.order_quantity || it.quantity || 0) || 0) * (Number(it.price_per_kg || it.price || 0) || 0)), 0);
    const avgPricePerKg = (cm.avg_price_per_kg || cm.avgPricePerKg) != null ? Number(cm.avg_price_per_kg || cm.avgPricePerKg) : (totalContractQty > 0 ? (totalCropTradeValue / totalContractQty) : 0);
    const buyerTotals = order.buyerTotals || order.buyer_totals || cm.buyer_totals || { commission: 0, gst: 0 };
    const buyerFeeTotal = (cm.buyer_fee_total || cm.buyerFeeTotal) != null ? Number(cm.buyer_fee_total || cm.buyerFeeTotal) : ((buyerTotals.commission || 0) + (buyerTotals.gst || 0));
    const totalAmountPayableByBuyer = (cm.total_amount_payable_by_buyer || cm.totalAmountPayableByBuyer) != null ? Number(cm.total_amount_payable_by_buyer || cm.totalAmountPayableByBuyer) : Math.round((totalCropTradeValue + buyerFeeTotal + Number.EPSILON) * 100) / 100;
    const deliveryRateDisplay = cm.delivery_rate_display || cm.deliveryRateDisplay || order.delivery_rate_display || order.deliveryRateDisplay || 'Calculated at delivery';
    const labourCharge = (cm.labour_charge || cm.labourCharge) != null ? Number(cm.labour_charge || cm.labourCharge) : Number(order.labour_charge || order.labourCharge || 0) || 0;
    const qtyKg = Number(totalContractQty || 0);
    const contractLanguage = order.contract_language || order.contractLanguage || order.lang || cm.lang || contractLang || 'en';
    // duration in days
    let days = '';
    try {
      const s = order.start_date || order.startDate || cm.start_date || cm.startDate || null;
      const e = order.end_date || order.endDate || cm.end_date || cm.endDate || null;
      if (s && e) {
        const sd = new Date(s);
        const ed = new Date(e);
        if (!isNaN(sd) && !isNaN(ed)) {
          days = Math.max(0, Math.round((ed - sd) / (1000 * 60 * 60 * 24)));
        }
      } else if ((cm.duration_days || cm.days) != null) {
        days = Number(cm.duration_days || cm.days || '');
      }
    } catch (e) { days = ''; }
    const logo192 = window.location.origin + logo;

    // Normalize buyer/farmer platform fee and GST for display (prefer saved contract_meta)
    const displayBuyerCommission = (cm && cm.buyer_totals && Number(cm.buyer_totals.commission || 0)) || (buyerTotals.commission || 0);
    const displayBuyerGst = (cm && cm.buyer_totals && Number(cm.buyer_totals.gst || 0)) || (buyerTotals.gst || 0);
    const displayFarmerCommission = (cm && (cm.farmer_platform_fee != null ? Number(cm.farmer_platform_fee) : (cm.farmerPlatformFee != null ? Number(cm.farmerPlatformFee) : undefined))) != null ? Number(cm.farmer_platform_fee || cm.farmerPlatformFee) : (totals.commission || totals.platform_fee || 0);
    const displayFarmerGst = (cm && (cm.farmer_gst_on_fee != null ? Number(cm.farmer_gst_on_fee) : (cm.farmerGstOnFee != null ? Number(cm.farmerGstOnFee) : undefined))) != null ? Number(cm.farmer_gst_on_fee || cm.farmerGstOnFee) : (totals.gst || 0);
    const displayNetAmountToFarmer = (cm && (cm.net_amount_payable_to_farmer != null ? Number(cm.net_amount_payable_to_farmer) : (cm.netAmountPayableToFarmer != null ? Number(cm.netAmountPayableToFarmer) : undefined))) != null ? Number(cm.net_amount_payable_to_farmer || cm.netAmountPayableToFarmer) : Math.round((totalCropTradeValue - ((displayFarmerCommission || 0) + (displayFarmerGst || 0)) + Number.EPSILON) * 100) / 100;

    const rowsPlaceholder = (order.items || []).map((it, idx) => {
      const qty = Number(it.order_quantity || it.quantity || 0) || 0;
      const price = Number(it.price_per_kg || it.price || 0) || 0;
      const amount = Math.round((qty * price + Number.EPSILON) * 100) / 100;
      return `<tr>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${idx + 1}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${it.crop_name || it.name || ''}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${it.variety || it.var || ''}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${qty.toLocaleString('en-IN')} kg</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${formatCurrency(price)}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${formatCurrency(amount)}</td>
        </tr>`;
    }).join('') || `<tr><td colspan="6" style="padding:8px;border:1px solid #ddd;text-align:center">${t('noItems', siteLang)}</td></tr>`;

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
        /* delivery info modal */
        #deliveryInfoModal{display:none;position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,0.5);align-items:center;justify-content:center;z-index:99999}
        #deliveryInfoModal .dialog{background:#fff;padding:18px;border-radius:8px;max-width:640px;width:92%;box-shadow:0 12px 40px rgba(0,0,0,0.25);font-family:'Times New Roman', Times, serif}
        #deliveryInfoModal .closeBtn{background:#236902;color:#fff;border:none;border-radius:6px;padding:8px 10px;cursor:pointer}
        .infoBtn{margin-left:8px;border:0;background:#1976d2;color:#fff;border-radius:50%;width:20px;height:20px;font-size:12px;line-height:18px;cursor:pointer}
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
    
      <!-- Delivery info modal (hidden by default) -->
      <div id="deliveryInfoModal">
        <div class="dialog" role="dialog" aria-modal="true">
              <div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px">
            <div>
              <h3 style="margin:0 0 8px 0;color:#236902">Delivery & Logistics Charges</h3>
              <div style="color:#111;line-height:1.5;font-size:14px">
                <div style="overflow:auto">
                  <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:14px;text-align:center">
                    <thead>
                      <tr>
                        <th style="border:1px solid #ddd;padding:8px;background:#f7f7f7;text-align:center">Vehicle Type</th>
                        <th style="border:1px solid #ddd;padding:8px;background:#f7f7f7;text-align:center">Typical Distance Range (km)</th>
                        <th style="border:1px solid #ddd;padding:8px;background:#f7f7f7;text-align:center">Vehicle Capacity</th>
                        <th style="border:1px solid #ddd;padding:8px;background:#f7f7f7;text-align:center">FIXED Cost per km (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style="border:1px solid #ddd;padding:8px">Bike Courier</td>
                        <td style="border:1px solid #ddd;padding:8px">0 – 20 km</td>
                        <td style="border:1px solid #ddd;padding:8px">Up to 40 kg</td>
                        <td style="border:1px solid #ddd;padding:8px"><strong>₹12 / km</strong></td>
                      </tr>
                      <tr>
                        <td style="border:1px solid #ddd;padding:8px">3-Wheeler Cargo (Auto / Ape)</td>
                        <td style="border:1px solid #ddd;padding:8px">0 – 80 km</td>
                        <td style="border:1px solid #ddd;padding:8px">0 – 400 kg</td>
                        <td style="border:1px solid #ddd;padding:8px"><strong>₹18 / km</strong></td>
                      </tr>
                      <tr>
                        <td style="border:1px solid #ddd;padding:8px">Mini Truck (Tata Ace / Pickup)</td>
                        <td style="border:1px solid #ddd;padding:8px">0 – 100 km</td>
                        <td style="border:1px solid #ddd;padding:8px">40 – 1500 kg</td>
                        <td style="border:1px solid #ddd;padding:8px"><strong>₹22 / km</strong></td>
                      </tr>
                      <tr>
                        <td style="border:1px solid #ddd;padding:8px">LCV / Small Truck</td>
                        <td style="border:1px solid #ddd;padding:8px">50 – 250 km</td>
                        <td style="border:1px solid #ddd;padding:8px">1000 – 5 tons</td>
                        <td style="border:1px solid #ddd;padding:8px"><strong>₹28 / km</strong></td>
                      </tr>
                      <tr>
                        <td style="border:1px solid #ddd;padding:8px">6-Wheeler Truck</td>
                        <td style="border:1px solid #ddd;padding:8px">100 – 400 km</td>
                        <td style="border:1px solid #ddd;padding:8px">1000 – 10 tons</td>
                        <td style="border:1px solid #ddd;padding:8px"><strong>₹35 / km</strong></td>
                      </tr>
                      <tr>
                        <td style="border:1px solid #ddd;padding:8px">10-Wheeler Truck</td>
                        <td style="border:1px solid #ddd;padding:8px">200 – 1000 km</td>
                        <td style="border:1px solid #ddd;padding:8px">10 – 20 tons</td>
                        <td style="border:1px solid #ddd;padding:8px"><strong>₹45 / km</strong></td>
                      </tr>
                      <tr>
                        <td style="border:1px solid #ddd;padding:8px">Multi-Axle / Heavy Truck</td>
                        <td style="border:1px solid #ddd;padding:8px">300 – 1500 km</td>
                        <td style="border:1px solid #ddd;padding:8px">20 – 40 tons</td>
                        <td style="border:1px solid #ddd;padding:8px"><strong>₹60 / km</strong></td>
                      </tr>
                      <tr>
                        <td style="border:1px solid #ddd;padding:8px">Refrigerated Truck (Addon)</td>
                        <td style="border:1px solid #ddd;padding:8px">50 – 2000 km</td>
                        <td style="border:1px solid #ddd;padding:8px">Any</td>
                        <td style="border:1px solid #ddd;padding:8px"><strong>+ ₹12 / km</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div style="flex:0 0 auto;margin-top:12px">
              <button class="closeBtn" onclick="hideDeliveryInfo()" style="display:inline-block">Close</button>
            </div>
          </div>
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
              <th style="padding:8px;border:1px solid #ddd;text-align:center">Crop Name</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:center">Variety</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:center">Quantity</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:center">Price (₹/kg)</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:center">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rowsPlaceholder}
          </tbody>
        </table>
      </section>
    
      <section class="section">
        <h2>5. PRICE & PAYMENT TERMS</h2>
        <p><strong>5.1 Fixed Procurement Price (Trade Value)</strong></p>
        <p>Price: ${formatCurrency(avgPricePerKg)} per kg</p>
        <p>Total Contract Quantity: ${totalContractQty.toLocaleString('en-IN')} kg</p>
        <p><strong>Total Crop Trade Value (GST Exempt): ${formatCurrency(totalCropTradeValue)}</strong></p>
        <p>The agreed price shall remain fixed throughout the contract period, irrespective of market fluctuations.</p>
    
        <p><strong>5.2 Platform Service Fees & Taxes</strong></p>
    <p>
      AgriAI acts as a digital facilitation platform and charges a platform service fee to both the Buyer and the Farmer for enabling discovery, contracting, payment settlement, and compliance services. The platform service fee is subject to GST as per applicable laws.
    </p>
    
    <table>
      <tr>
        <th>Description</th>
        <th>Buyer</th>
        <th>Farmer</th>
      </tr>
      <tr>
        <td>Platform Service Fee</td>
        <td>${formatCurrency(displayBuyerCommission)}</td>
        <td>${formatCurrency(displayFarmerCommission)}</td>
      </tr>
      <tr>
        <td>GST @ 18% on Platform Fee</td>
        <td>${formatCurrency(displayBuyerGst)}</td>
        <td>${formatCurrency(displayFarmerGst)}</td>
      </tr>
    </table>
    
    <p><strong>5.3 Buyer Payable Amount</strong></p>
      <p>
      Crop Trade Value (GST Exempt): ${formatCurrency(totalCropTradeValue)}<br/>
      Platform Service Fee + GST @18% (Payable by Buyer): ${formatCurrency(buyerFeeTotal)}<br/>
      <p>
      <strong>
        Amount Payable Before Delivery: ${formatCurrency(totalAmountPayableByBuyer)}
      </strong>
    </p>
        <div style="display:inline-block;vertical-align:middle">
        Delivery / Logistics Charges (Payable After Delivery): ${deliveryRateDisplay}
        <button class="infoBtn" onclick="(function(ev){try{ev && ev.stopPropagation();}catch(e){}; showDeliveryInfo();})(event)" aria-label="Delivery info">i</button>
      </div>
      <br/>
      Labour Charges: ${formatCurrency(labourCharge)} (for ${qtyKg.toLocaleString('en-IN')} kg)<br/>
    </p>
    <p>
      <strong>
        Amount Payable After Delivery: ${formatCurrency(labourCharge)} + Delivery Charges + Platform Delivery Facilitation Fee (4%) + GST @18% (on delivery platform fee)
      </strong>
    </p>
    <p>
      Delivery charges shall be calculated by the third-party logistics provider
      based on actual distance, vehicle type, and delivery location, and shall be
      payable by the Buyer after successful delivery confirmation.
    </p>
    
    <p><strong>5.4 Farmer Settlement Amount</strong></p>
      <p>
      Crop Trade Value: ${formatCurrency(totalCropTradeValue)}<br/>
      Less Platform Fee + GST: ${formatCurrency((displayFarmerCommission || 0) + (displayFarmerGst || 0))}<br/>
      <strong>Net Amount Payable to Farmer via AgriAI: ${formatCurrency(displayNetAmountToFarmer)}</strong>
    </p>
    
        <p><strong>5.5 Payment Schedule</strong></p>
    
    <p>
    <strong>50% Advance Payment:</strong>
    The Buyer shall pay fifty percent (50%) of the total contract value as advance at the time of contract execution. 
    This amount shall be adjusted against the final payable amount.
    </p>
    
    <p>
    <strong>25% Payment on Delivery:</strong>
    An additional twenty-five percent (25%) of the total contract value shall be paid upon successful delivery of the produce to the Buyer.
    </p>
    
    <p>
    <strong>25% Payment After Quality Inspection:</strong>
    The remaining twenty-five percent (25%) shall be paid within seven (7) working days after completion of quality inspection and acceptance of the produce.
    </p>
    
    <p>
    <strong>Late Payment Penalty:</strong>
    If the Buyer fails to pay the remaining twenty-five percent (25%) within seven (7) working days after acceptance, the Buyer shall be liable to pay a late payment penalty of one percent (1%) per day on the delayed amount, subject to a maximum of ten percent (10%) of the delayed amount.
    </p>
    
    <p>
    <strong>Deemed Acceptance:</strong>
    If no quality objection is raised within seven (7) working days from the date of delivery, the produce shall be deemed accepted, and the remaining payment shall become immediately payable.
    </p>
    
    
        <p><strong>5.3 Mode of Payment</strong></p>
        <p>Bank Transfer / UPI / Cheque</p>
        <p>The Buyer shall issue digital or physical receipts for all payments made under this Agreement.</p>
      </section>
    
      <section class="section">
        <h2>6. DELIVERY, LOGISTICS & TRANSPORTATION</h2>
    
        <p><strong>6.1 Delivery Responsibility</strong></p>
        <p>
            Delivery of agricultural produce under this Agreement shall be facilitated exclusively through third-party
            logistics service providers approved by the AgriAI platform.
        </p>
        <p>
            Neither the Buyer nor the Farmer shall be required to arrange transportation independently, unless mutually
            agreed in writing.
        </p>
    
        <p><strong>6.2 Vehicle Selection</strong></p>
        <p>
            The type of vehicle used for transportation shall be selected based on the quantity of produce, type of crop,
            and handling requirements.
        </p>
        <p>Selected Vehicle Type: Will be Decided based on the Distance <button class="infoBtn" onclick="(function(ev){try{ev && ev.stopPropagation();}catch(e){}; showDeliveryInfo();})(event)" aria-label="Delivery info">i</button></p>
    
        <p><strong>6.3 Delivery Pricing Method</strong></p>
        <p>
            Delivery charges shall be determined by the third-party logistics provider. The final delivery cost shall be
            calculated and communicated to the Buyer at or before the delivery.
        </p>
    
        <p><strong>6.4 Payment of Delivery Charges</strong></p>
        <p>
            Delivery charges shall be paid directly by the Buyer to the logistics provider or delivery personnel, either
            offline or online.
        </p>
    
        <p><strong>6.5 Transfer of Risk During Transit</strong></p>
        <p>
            During transit, responsibility and risk shall lie with the logistics provider. Upon delivery, risk transfers
            to the Buyer.
        </p>
    
        <p><strong>6.6 Delay, Damage & Loss</strong></p>
        <p>
            Any delay, damage, or loss during transit shall be governed by the logistics provider’s terms and conditions.
            AgriAI shall not be held liable for such incidents.
        </p>
    
        <p><strong>6.7 Proof of Delivery</strong></p>
        <p>
            Delivery shall be confirmed through physical receipt, digital confirmation, or Proof of Delivery (POD).
            Records may be stored digitally for verification purposes.
        </p>
    </section>
    
    
      <section class="section">
        <h2>7. QUALITY STANDARDS & ACCEPTANCE</h2>
        <p>All produce supplied under this Agreement shall conform to the quality standards mutually agreed upon by the Parties and documented in Annexure A (or any other mutually agreed record).</p>
        <p>The Buyer shall inspect the delivered produce within three (3) working days from the date of delivery.</p>
        <p>Any rejection of produce must be communicated in writing, clearly specifying the reasons for rejection. If no communication is received within the inspection period, the produce shall be deemed accepted by the Buyer.</p>
    </section>
    
    
      <section class="section">
        <h2>8. RISK, LIABILITY & INSURANCE</h2>
    
        <p>1. The Farmer shall make all reasonable efforts to follow good agricultural practices to ensure the expected production.</p>
    
        <p>2. The Farmer shall obtain crop insurance under the Pradhan Mantri Fasal Bima Yojana (PMFBY) or any other equivalent government-approved insurer for all contracted produce. Any compensation received from such insurance shall belong to the Farmer.</p>
    
        <p>3. In the event of partial or total crop loss due to natural disasters such as floods, droughts, cyclones, or other force majeure events, losses shall be covered through the Farmer’s insurance. In case of uncovered losses, both parties may mutually agree on a fair settlement.</p>
    
        <p>4. After the produce is collected from the Farmer, all logistics-related risks—including handling, transit, and transportation—shall lie with the logistics provider engaged for delivery.</p>
    
        <p>5. Once the produce is delivered and accepted by the Buyer, all market risks—including price fluctuation, storage loss, and any post-delivery damage—shall transfer to the Buyer.</p>
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
        <p>1. Any dispute, difference, or claim arising out of or in connection with this Agreement shall first be attempted to be resolved amicably through mutual discussion between the Parties.</p>
        <p>2. If the Parties are unable to resolve the dispute within 30 days from the date of notification, the dispute shall be referred to arbitration under the Arbitration and Conciliation Act, 1996. The arbitration proceedings shall be conducted in ${buyerState || '[Buyer State]'}, ${buyerRegion || '[Buyer Region]'} (city/state).</p>
    
        <p>3. The courts of  ${buyerState || '[Buyer State]'}, ${buyerRegion || '[Buyer Region]'} (city/state) shall have exclusive jurisdiction over any disputes not resolved through arbitration.</p>
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
          This Agreement has been explained and translated to the Farmer in <b>${contractLanguage}</b> (Language).
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
        <p>Date: ${startDate}</p>
    
        <p>Witness 1: ___________________________</p>
      </section>
    
    </body>
    <script>
      function showDeliveryInfo(){
        try{document.getElementById('deliveryInfoModal').style.display='flex';}catch(e){}
      }
      function hideDeliveryInfo(){
        try{document.getElementById('deliveryInfoModal').style.display='none';}catch(e){}
      }
    </script>
    </html>`;

    const w = window.open('', '_blank');
    try { w.document.write(html); w.document.close(); } catch (e) { window.open('data:text/html;charset=utf-8,' + encodeURIComponent(html), '_blank'); }
  };

  return (
    <div style={{ background: '#53b635', minHeight: '100vh', color: '#fff' }}>
      <Navbar />
      <main style={{ padding: '6rem 1rem 2rem' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', background: '#fff', padding: '1.5rem', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
          <h1 style={{ color: '#236902', textAlign: 'center' }}>{t('historyTitle', siteLang) || 'Sales History'}</h1>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12, alignItems: 'center', justifyContent: 'space-between' }}>
            <input
              placeholder={t('historySearchPlaceholder', siteLang) || 'Search by Contract ID or crop name'}
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ flex: '1 1 280px', minWidth: 240, padding: 10, border: '1px solid #e5e5e5', borderRadius: 6, color: '#333' }}
            />
            <div>
              <label style={{ marginRight: 8, fontWeight: 700 }}>{t('paymentLabel', siteLang) || 'Payment:'}</label>
              <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} style={{ padding: 10, border: '1px solid #e5e5e5', borderRadius: 6 }}>
                <option value="all">{t('all', siteLang) || 'All'}</option>
                <option value="online">{t('online', siteLang) || 'Online'}</option>
                <option value="cod">{t('cashOnDelivery', siteLang) || 'Cash on Delivery'}</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <div style={{ fontSize: 52, lineHeight: 1 }}>🧾</div>
              <div style={{ marginTop: 8 }}>{t('historyNoPurchases', siteLang) || 'No matching sales yet.'}</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
              {filtered.map((o) => {
                const total = o?.totals?.grand_total || 0;
                const idKey = o.contract_number || o.invoice_id;
                const isExpanded = !!expanded[idKey];
                return (
                  <div key={idKey} style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 14px', background: '#f7faf7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div style={{ fontWeight: 800, color: '#236902' }}>{(t('contractLabel', siteLang) || 'Contract') + ': '}{idKey}</div>
                        <div style={{ color: '#333', marginTop: 4 }}>{formatDateTime(o.contract_datetime || o.created_at)}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontWeight: 800, color: '#236902' }}>{formatCurrency(total)}</div>
                        <button onClick={() => openInvoice(o)} style={{ background: '#1976d2', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 6 }}>{t('viewContract', siteLang) || 'View Contract'}</button>
                        <button onClick={() => toggleExpand(idKey)} style={{ background: '#fff', color: '#236902', border: '1px solid #dfeadf', padding: '6px 10px', borderRadius: 6 }}>{isExpanded ? (t('hide', siteLang) || 'Hide') : (t('details', siteLang) || 'Details')}</button>
                        <button onClick={() => handleDelete(idKey)} title={t('delete', siteLang) || 'Delete'} style={{ background: 'transparent', color: '#c62828', border: '1px solid #f5c6c6', padding: '6px 10px', borderRadius: 6, marginLeft: 6 }}>{'🗑️'}</button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ padding: 12, overflowX: 'auto', color: '#000' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={{ border: '1px solid #ddd', padding: 8, background: '#f4f4f4' }}>{t('tableIndex', siteLang) || '#'}</th>
                              <th style={{ border: '1px solid #ddd', padding: 8, background: '#f4f4f4' }}>{t('tableCrop', siteLang) || 'Crop'}</th>
                              <th style={{ border: '1px solid #ddd', padding: 8, background: '#f4f4f4' }}>{t('tableQty', siteLang) || 'Qty (kg)'}</th>
                              <th style={{ border: '1px solid #ddd', padding: 8, background: '#f4f4f4' }}>{t('tablePricePerKg', siteLang) || 'Price/kg'}</th>
                              <th style={{ border: '1px solid #ddd', padding: 8, background: '#f4f4f4' }}>{t('tableSubtotal', siteLang) || 'Subtotal'}</th>
                              <th style={{ border: '1px solid #ddd', padding: 8, background: '#f4f4f4' }}>{t('tableGst', siteLang) || 'GST'}</th>
                              <th style={{ border: '1px solid #ddd', padding: 8, background: '#f4f4f4' }}>{t('tablePlatformFee', siteLang) || 'Platform Fee'}</th>
                              <th style={{ border: '1px solid #ddd', padding: 8, background: '#f4f4f4' }}>{t('tableTotal', siteLang) || 'Total'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(o.items || []).map((it, idx) => (
                              <tr key={idx}>
                                <td style={{ border: '1px solid #eee', padding: 8, textAlign: 'center' }}>{idx + 1}</td>
                                <td style={{ border: '1px solid #eee', padding: 8, textAlign: 'center' }}>{it.crop_name}</td>
                                <td style={{ border: '1px solid #eee', padding: 8, textAlign: 'center' }}>{Number(it.order_quantity || 0).toLocaleString('en-IN')}</td>
                                <td style={{ border: '1px solid #eee', padding: 8, textAlign: 'center' }}>{formatCurrency(it.price_per_kg)}</td>
                                <td style={{ border: '1px solid #eee', padding: 8, textAlign: 'center' }}>{formatCurrency(it.subtotal)}</td>
                                <td style={{ border: '1px solid #eee', padding: 8, textAlign: 'center' }}>{formatCurrency(it.gst)}</td>
                                <td style={{ border: '1px solid #eee', padding: 8, textAlign: 'center' }}>{formatCurrency(it.platform_fee)}</td>
                                <td style={{ border: '1px solid #eee', padding: 8, textAlign: 'center' }}>{formatCurrency(it.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div style={{ textAlign: 'right', marginTop: 12, fontWeight: 800, color: '#000' }}>
                          <div style={{ color: '#236902', fontSize: 18 }}>{t('grandTotalLabel', siteLang) || 'Grand Total'}: {formatCurrency(o?.totals?.grand_total)}</div>
                        </div>
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
  );
}


