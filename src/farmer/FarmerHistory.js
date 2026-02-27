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

      // Attempt to fetch authoritative contract rows from backend and merge all details
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
                
                // Build map indexed by contract_number for direct lookup
                const contractByNumber = {};
                contracts.forEach(c => {
                  if (c.contract_number) {
                    contractByNumber[c.contract_number] = c;
                  }
                });

                // Merge contracts into localOrders by timestamp matching
                const merged = localOrders.map(o => {
                  try {
                    const oTime = new Date(o.created_at).getTime();
                    let matched = null;
                    
                    // Try direct contract_number match first
                    if (o.contract_number && contractByNumber[o.contract_number]) {
                      matched = contractByNumber[o.contract_number];
                    }
                    
                    // If no direct match, try timestamp matching
                    if (!matched) {
                      for (let c of contracts) {
                        if (!c.contract_datetime) continue;
                        const cTime = new Date(c.contract_datetime.replace(' ', 'T') + 'Z').getTime();
                        if (isNaN(cTime) || isNaN(oTime)) continue;
                        if (Math.abs(cTime - oTime) <= 10000) { matched = c; break; }
                      }
                    }
                    
                    if (matched) {
                      // Merge all contract table fields into order
                      return { 
                        ...o, 
                        contract_number: matched.contract_number,
                        contract_datetime: matched.contract_datetime,
                        farmer_state: matched.farmer_state || o.farmer_state,
                        buyer_state: matched.buyer_state || o.buyer_state,
                        buyer_name: matched.buyer_name || o.buyer_name,
                        buyer_id: matched.buyer_id || o.buyer_id,
                        farmer_name: matched.farmer_name || o.farmer_name,
                        farmer_id: matched.farmer_id || o.farmer_id,
                        total_amount: matched.total_amount || o.total_amount,
                        quantity_kg: matched.quantity_kg || matched.total_quantity || o.quantity_kg,
                        price_per_kg: matched.price_per_kg || o.price_per_kg,
                        contract_nature: matched.contract_nature || o.contract_nature,
                        contract_duration: matched.contract_duration || o.contract_duration,
                        start_date: matched.start_date || o.start_date,
                        end_date: matched.end_date || o.end_date,
                        _db_contract: matched // Store full contract object for later use
                      };
                    }
                  } catch (e) {}
                  return o;
                });

                // Add any contracts from DB that didn't match local orders
                const unmatched = [];
                for (let c of contracts) {
                  const exists = merged.some(m => (m.contract_number && m.contract_number === c.contract_number));
                  if (!exists) {
                    unmatched.push({ 
                      contract_number: c.contract_number,
                      contract_datetime: c.contract_datetime,
                      invoice_id: c.contract_number,
                      created_at: c.contract_datetime || new Date().toISOString(), 
                      payment_method: 'contract', 
                      items: [], 
                      totals: { subtotal: 0, gst: 0, platform_fee: 0, grand_total: c.total_amount || 0 },
                      farmer_state: c.farmer_state,
                      buyer_state: c.buyer_state,
                      buyer_name: c.buyer_name,
                      buyer_id: c.buyer_id,
                      farmer_name: c.farmer_name,
                      farmer_id: c.farmer_id,
                      total_amount: c.total_amount,
                      quantity_kg: c.quantity_kg || c.total_quantity,
                      price_per_kg: c.price_per_kg,
                      contract_nature: c.contract_nature,
                      contract_duration: c.contract_duration,
                      start_date: c.start_date,
                      end_date: c.end_date,
                      _db_contract: c
                    });
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

    // Use database contract details if available, otherwise fall back to order data
    const dbContract = order._db_contract || {};

    // Build a full contract HTML using database contract as primary source
    let buyerName = dbContract.buyer_name || order.buyerName || order.buyer_name || (order.buyer && order.buyer.name) || '[Buyer Name]';
    const buyerId = dbContract.buyer_id || order.buyerId || order.buyer_id || (order.buyer && order.buyer.id) || '';
    let buyerState = dbContract.buyer_state || order.buyerState || order.buyer_state || (order.buyer && order.buyer.state) || '';
    let buyerRegion = dbContract.buyer_region || order.buyerRegion || order.buyer_region || (order.buyer && order.buyer.region) || '';
    let farmerName = dbContract.farmer_name || order.farmerName || order.farmer_name || (order.farmer && order.farmer.name) || (localStorage.getItem('agriai_name') || '');
    let farmerId = dbContract.farmer_id || order.farmerId || order.farmer_id || (order.farmer && order.farmer.id) || (localStorage.getItem('agriai_id') || '');
    let farmerState = dbContract.farmer_state || order.farmerState || order.farmer_state || (order.farmer && order.farmer.state) || (localStorage.getItem('agriai_state') || '');
    let farmerRegion = dbContract.farmer_region || order.farmerRegion || order.farmer_region || (order.farmer && order.farmer.region) || (localStorage.getItem('agriai_region') || '');
    const contractNum = dbContract.contract_number || order.contract_number || order.invoice_id || ('CTR-' + (Date.now()));
    const date = formatDateTime(dbContract.contract_datetime || order.contract_datetime || order.created_at || new Date().toISOString());
    // prefer stored contract_meta values (saved at Confirm & Send), then database values
    const cm = order.contract_meta || order.contractMeta || {};
    const contractType = dbContract.contract_type || order.contract_type || order.contractType || cm.contract_type || cm.contractType || 'one-time';
    const contractNature = dbContract.contract_nature || order.contract_nature || order.contractNature || cm.contract_nature || cm.contractNature || 'post-harvest';
    const contractDuration = dbContract.contract_duration || order.contract_duration || order.contractDuration || cm.contract_duration || cm.contractDuration || 'one-time';
    const contractLang = order.contract_language || order.contractLanguage || cm.lang || (localStorage.getItem('agri_lang') || 'en');
    const startDate = dbContract.start_date || (cm.start_date || cm.startDate) || (order.start_date || order.startDate) || (new Date().toLocaleDateString('en-GB'));
    // compute endDate: prefer database, then ISO if available, else use stored strings, else derive from start + duration
    let endDate = dbContract.end_date || (cm.end_date || cm.endDate) || (order.end_date || order.endDate) || '';
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
    // Try multiple strategies to get authoritative contract details from backend
    let fetched = dbContract || null;
    const apiBase = (window.__AGRIAI_API_BASE__ || '');
    const tryFetchContract = async (cn) => {
      if (!cn) return null;
      try {
        const url = apiBase ? `${apiBase}/contracts/get/${encodeURIComponent(cn)}` : `/contracts/get/${encodeURIComponent(cn)}`;
        const r = await fetch(url);
        if (r && r.ok) {
          const jj = await r.json().catch(() => null);
          if (jj && jj.contract) return jj.contract;
        }
      } catch (e) {}
      return null;
    };

    try {
      // 1) Try by contract number (primary)
      fetched = fetched && Object.keys(fetched).length ? fetched : await tryFetchContract(contractNum);

      // 2) Try by invoice_id (some local orders use ORD... ids)
      if (!fetched && order.invoice_id) fetched = await tryFetchContract(order.invoice_id);

      // 3) Fallback: fetch farmer contracts and attempt matching
      if (!fetched) {
        const fid = localStorage.getItem('agriai_id') || '';
        if (fid) {
          const q = apiBase ? `${apiBase}/farmer/contracts?farmer_id=${encodeURIComponent(fid)}` : `/farmer/contracts?farmer_id=${encodeURIComponent(fid)}`;
          const resp = await fetch(q);
          if (resp && resp.ok) {
            const j = await resp.json().catch(() => null);
            if (j && Array.isArray(j.contracts) && j.contracts.length) {
              // prefer exact contract_number match
              fetched = j.contracts.find(c => (c.contract_number && String(c.contract_number) === String(contractNum)))
                || j.contracts.find(c => (c.contract_number && String(c.contract_number) === String(order.invoice_id)));

              // try timestamp proximity
              if (!fetched) {
                const oTime =   new Date(order.contract_datetime || order.created_at || '').getTime();
                fetched = j.contracts.find(c => {
                  try {
                    const cTime = new Date((c.contract_datetime || '').replace(' ', 'T') + 'Z').getTime();
                    if (isNaN(oTime) || isNaN(cTime)) return false;
                    return Math.abs(cTime - oTime) <= 10000;
                  } catch (e) { return false; }
                });
              }

              if (!fetched) fetched = j.contracts[0];
            }
          }
        }
      }

      if (fetched && Object.keys(fetched).length) {
        // if server stored a saved html/pdf url, open directly
        const remoteUrl = fetched.contract_pdf_url || fetched.contract_html_url || fetched.contract_pdf || null;
        if (remoteUrl) { window.open(remoteUrl.startsWith('http') ? remoteUrl : (window.location.origin + remoteUrl), '_blank'); return; }

        // merge authoritative fields and attach DB contract to order
        buyerName = fetched.buyer_name || fetched.buyerName || buyerName;
        if (fetched.buyer_state) buyerState = fetched.buyer_state;
        if (fetched.buyer_region) buyerRegion = fetched.buyer_region;
        farmerName = fetched.farmer_name || fetched.farmerName || farmerName;
        farmerId = fetched.farmer_id || fetched.farmerId || farmerId;
        farmerState = fetched.farmer_state || fetched.farmerState || farmerState;
        farmerRegion = fetched.farmer_region || fetched.farmerRegion || farmerRegion;
        if (fetched.contract_number) {
          order.contract_number = fetched.contract_number;
          order.invoice_id = order.invoice_id || fetched.contract_number;
          order._db_contract = fetched;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch contract from server', e);
    }
    
    if (fetched && Object.keys(fetched).length > 0) {
      // if server stored a saved html/pdf url, open directly
      const remoteUrl = fetched.contract_pdf_url || fetched.contract_html_url || fetched.contract_pdf || null;
      if (remoteUrl) { window.open(remoteUrl.startsWith('http') ? remoteUrl : (window.location.origin + remoteUrl), '_blank'); return; }

      // merge authoritative fields from database contract
      buyerName = fetched.buyer_name || fetched.buyerName || buyerName;
      if (fetched.buyer_state) buyerState = fetched.buyer_state;
      if (fetched.buyer_region) buyerRegion = fetched.buyer_region;
      farmerName = fetched.farmer_name || fetched.farmerName || farmerName;
      farmerId = fetched.farmer_id || fetched.farmerId || farmerId;
      farmerState = fetched.farmer_state || fetched.farmerState || farmerState;
      farmerRegion = fetched.farmer_region || fetched.farmerRegion || farmerRegion;
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

    const rowsHtml = (order.items || []).map((it, idx) => {
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

    const html = `<html>
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
      Party A and Party B are collectively referred to as "the Parties."
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
    <h3><strong>2.1 Contracto Acceptance &amp; Negotiation Window</strong>orS</h3>
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
    <p>Platform Fee: ${formatCurrency(displayFarmerCommission)}</p>
    <p>GST on Platform Fee: ${formatCurrency(displayFarmerGst)}</p>
    <p><strong>Total Amount (After Deduction): ${formatCurrency(displayNetAmountToFarmer)}</strong></p>
 
    <p><strong>5.2 Buyer</strong></p>
    <p>Total Quantity: ${totalContractQty.toLocaleString('en-IN')} kg</p>
    <p>Price: ${formatCurrency(avgPricePerKg)} per kg</p>
    <p>Platform Fee: ${formatCurrency(displayBuyerCommission)}</p>
    <p>GST on Platform Fee: ${formatCurrency(displayBuyerGst)}</p>
    <p><strong>Total Amount (After Addition): ${formatCurrency(totalAmountPayableByBuyer)}</strong></p>
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
    Any delay, damage, shortage, or loss occurring during transit shall be governed by the logistics provider's terms and conditions.
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



