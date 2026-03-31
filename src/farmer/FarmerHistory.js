import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import Navbar from '../Navbar';
import logo from '../assets/logo192.png';
import { t } from '../i18n';

export default function FarmerHistory() {
  const [orders, setOrders] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [paymentFilter, setPaymentFilter] = React.useState('all');
  
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
      return d.toLocaleDateString();
    } catch (e) { return String(iso); }
  };

  // Ensure orders have authoritative contract rows attached when possible.
  // This fetches missing contract rows by `contract_number` from the backend
  // and merges them into `orders` so fields like `farmer_total` are available
  // for display just like `contract_number` is.
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!Array.isArray(orders) || orders.length === 0) return;
        const missing = orders.filter(o => o && o.contract_number && !o._db_contract);
        if (!missing.length) return;
        const apiBase = process.env.REACT_APP_API_BASE || (window.__AGRIAI_API_BASE__ || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000'));
        const fetchedMap = {};
        await Promise.all(missing.map(async (o) => {
          try {
            const resp = await fetch(`${apiBase}/contracts/get/${encodeURIComponent(o.contract_number)}`);
            if (!resp) return;
            const j = await resp.json().catch(() => null);
            if (resp.ok && j && j.ok && j.contract) {
              fetchedMap[o.contract_number] = j.contract;
            }
          } catch (e) { /* ignore per-item errors */ }
        }));
        if (!mounted) return;
        if (Object.keys(fetchedMap).length) {
          setOrders(prev => (Array.isArray(prev) ? prev.map(p => {
            if (p && p.contract_number && fetchedMap[p.contract_number]) {
              return { ...p, _db_contract: fetchedMap[p.contract_number] };
            }
            return p;
          }) : prev));
        }
      } catch (e) { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, [orders]);

  React.useEffect(() => {
    const onLang = (e) => { 
      const l = (e && e.detail && e.detail.lang) ? e.detail.lang : (localStorage.getItem('agri_lang') || 'en'); 
      setSiteLang(l);
      // Auto refresh page when language is changed from navbar
      setTimeout(() => window.location.reload(), 100);
    };
    window.addEventListener('agri:lang:change', onLang);
    return () => { try { window.removeEventListener('agri:lang:change', onLang); } catch (e) {} };
  }, []);

  const handleDelete = async (idKey) => {
    if (!window.confirm(t('confirmDelete', siteLang) || 'Delete this deal? This action cannot be undone.')) return;
    try {
      const apiBase = process.env.REACT_APP_API_BASE || (window.__AGRIAI_API_BASE__ || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000'));
      // ask server to remove contract row
      try {
        const resp = await fetch(`${apiBase}/contracts/delete/${encodeURIComponent(idKey)}`, { method: 'DELETE' });
        const j = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          console.warn('contract delete failed', resp.status, j);
          alert((t('failedDelete', siteLang) || 'Delete failed') + ': ' + (j.error || resp.status));
          return;
        }
      } catch (e) {
        console.warn('contract delete network error', e);
        alert((t('failedDelete', siteLang) || 'Delete failed') + ': ' + String(e));
        return;
      }

      // remove from local farmer history
      const raw = localStorage.getItem('agriai_history_farmer');
      const hist = raw ? JSON.parse(raw) : [];
      const filtered = (hist || []).filter(h => {
        const key = h.contract_number || h.invoice_id;
        return key !== idKey;
      });
      localStorage.setItem('agriai_history_farmer', JSON.stringify(filtered));
      setOrders(prev => (prev || []).filter(o => ((o.contract_number || o.invoice_id) !== idKey)));

      // also wipe buyer history record if present
      try {
        const rawB = localStorage.getItem('agriai_history');
        const histB = rawB ? JSON.parse(rawB) : [];
        const filtB = (histB || []).filter(h => (h.contract_number || h.invoice_id) !== idKey);
        localStorage.setItem('agriai_history', JSON.stringify(filtB));
      } catch (e) { /* ignore */ }

      // also drop any local notifications for this contract
      try {
        const key = 'agriai_notifications';
        const rawN = localStorage.getItem(key);
        const arrN = rawN ? JSON.parse(rawN) : [];
        const filtN = arrN.filter(n => n.contract_number !== idKey);
        localStorage.setItem(key, JSON.stringify(filtN));
        try { window.dispatchEvent(new Event('agriai:notifications:local:update')); } catch (e) {}
      } catch (e) {}
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
    return matchesQuery;
  }).sort((a, b) => {
    // Sort by date based on paymentFilter
    const aDate = new Date(a.created_at || 0).getTime();
    const bDate = new Date(b.created_at || 0).getTime();
    if (paymentFilter === 'latest') {
      return bDate - aDate; // Latest first
    } else if (paymentFilter === 'old') {
      return aDate - bDate; // Oldest first
    }
    return 0; // 'all' keeps original order
  });

  const openInvoice = async (order) => {
    // determine contract number early so we can fetch authoritative row
    // use `let` so we can overwrite later with dbContract value if present
    let contractNum = order.contract_number || order.invoice_id || '';

    // always try to fetch fresh copy from backend if we have a number
    let dbContract = order._db_contract || {};
    if (contractNum) {
      try {
        const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');
        const res = await fetch(`${apiBase}/contracts/get/${encodeURIComponent(contractNum)}`);
        const j = await res.json().catch(() => null);
        if (res.ok && j && j.ok && j.contract) {
          dbContract = j.contract;
          order._db_contract = dbContract; // cache for later
        }
      } catch (e) {
        console.warn('openInvoice fetch contract error', e);
      }
    }

    // Prefer PDF/HTML URL saved on the dbContract or on the order if present
    const pdfUrl = (dbContract.contract_pdf_url || dbContract.contract_html_url || dbContract.contract_pdf)
                    || order.contract_pdf_url || order.contract_html_url || order.contract_pdf || null;
    if (pdfUrl) {
      const full = pdfUrl.startsWith('http') ? pdfUrl : (window.location.origin + pdfUrl);
      window.open(full, '_blank');
      return;
    }

    // Use database contract details if available, otherwise fall back to order data

    // Build a full contract HTML using database contract as primary source
    let buyerName = dbContract.buyer_name || order.buyerName || order.buyer_name || (order.buyer && order.buyer.name) || '[Buyer Name]';
    const buyerId = dbContract.buyer_id || order.buyerId || order.buyer_id || (order.buyer && order.buyer.id) || '';
    let buyerAddress = dbContract.buyer_address || order.buyer_address || (order.buyer && order.buyer.address) || '';
    let buyerState = dbContract.buyer_state || order.buyerState || order.buyer_state || (order.buyer && order.buyer.state) || '';
    let buyerRegion = dbContract.buyer_region || order.buyerRegion || order.buyer_region || (order.buyer && order.buyer.region) || '';
    let farmerName = dbContract.farmer_name || order.farmerName || order.farmer_name || (order.farmer && order.farmer.name) || (localStorage.getItem('agriai_name') || '');
    let farmerId = dbContract.farmer_id || order.farmerId || order.farmer_id || (order.farmer && order.farmer.id) || (localStorage.getItem('agriai_id') || '');
    let farmerAddress = dbContract.farmer_address || order.farmer_address || (order.farmer && order.farmer.address) || '';
    let farmerState = dbContract.farmer_state || order.farmerState || order.farmer_state || (order.farmer && order.farmer.state) || (localStorage.getItem('agriai_state') || '');
    let farmerRegion = dbContract.farmer_region || order.farmerRegion || order.farmer_region || (order.farmer && order.farmer.region) || (localStorage.getItem('agriai_region') || '');
    // update contractNum with authoritative database value or generate one if missing
    contractNum = dbContract.contract_number || order.contract_number || order.invoice_id || ('CTR-' + (Date.now()));
    const date = formatDateTime(dbContract.contract_datetime || order.contract_datetime || order.created_at || new Date().toISOString());
    // Format signature timestamp for display
    const signatureDate = dbContract.signature_timestamp 
      ? formatDateTime(dbContract.signature_timestamp)
      : date;
    // prefer stored contract_meta values (saved at Confirm & Send), then database values
    let cm = order.contract_meta || order.contractMeta || {};
    if (dbContract.contract_meta) {
      cm = { ...cm, ...dbContract.contract_meta };
    }
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
    const totals = dbContract.totals || order.totals || { subtotal: 0, gst: 0, platform_fee: 0, grand_total: 0 };
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

    // Prefer stored contract_meta or authoritative DB values; fall back to order items
    const totalContractQty = (dbContract.quantity_kg || dbContract.total_quantity || cm.total_contract_qty || cm.totalContractQty) != null
      ? Number(dbContract.quantity_kg || dbContract.total_quantity || cm.total_contract_qty || cm.totalContractQty)
      : (order.items || []).reduce((s, it) => s + (Number(it.order_quantity || it.quantity || 0) || 0), 0);
    const defaultVariety = dbContract.variety || '';
    const totalCropTradeValue = (dbContract.amount || cm.total_crop_trade_value || cm.totalCropTradeValue) != null
      ? Number(dbContract.amount || cm.total_crop_trade_value || cm.totalCropTradeValue)
      : (order.items || []).reduce((s, it) => s + ((Number(it.order_quantity || it.quantity || 0) || 0) * (Number(it.price_per_kg || it.price || 0) || 0)), 0);
    const avgPricePerKg = (dbContract.price_per_kg || cm.avg_price_per_kg || cm.avgPricePerKg) != null
      ? Number(dbContract.price_per_kg || cm.avg_price_per_kg || cm.avgPricePerKg)
      : (totalContractQty > 0 ? (totalCropTradeValue / totalContractQty) : 0);
    const buyerTotals = dbContract.buyer_totals || order.buyerTotals || order.buyer_totals || cm.buyer_totals || { commission: 0, gst: 0 };
    const displayBuyerCommission = (dbContract.buyer_platform_fee != null ? Number(dbContract.buyer_platform_fee)
      : (cm.buyer_platform_fee != null ? Number(cm.buyer_platform_fee)
        : (buyerTotals.commission || 0)));
    const displayBuyerGst = (dbContract.buyer_gst != null ? Number(dbContract.buyer_gst)
      : (cm.buyer_gst != null ? Number(cm.buyer_gst)
        : (buyerTotals.gst || 0)));
    const buyerFeeTotal = (dbContract.buyer_fee_total != null ? Number(dbContract.buyer_fee_total)
      : (cm.buyer_fee_total != null ? Number(cm.buyer_fee_total)
        : ((displayBuyerCommission || 0) + (displayBuyerGst || 0))));
    const totalAmountPayableByBuyer = (dbContract.buyer_total != null ? Number(dbContract.buyer_total)
      : (dbContract.total_amount != null ? Number(dbContract.total_amount)
        : (cm.total_amount_payable_by_buyer != null ? Number(cm.total_amount_payable_by_buyer)
          : Math.round((totalCropTradeValue + buyerFeeTotal + Number.EPSILON) * 100) / 100)));
    const labourCharge = dbContract.labour_charge != null ? Number(dbContract.labour_charge)
      : ((cm.labour_charge || cm.labourCharge) != null ? Number(cm.labour_charge || cm.labourCharge)
         : Number(order.labour_charge || order.labourCharge || 0) || 0);
    const qtyKg = Number(totalContractQty || 0);
    const contractLanguage = order.contract_language || order.contractLanguage || order.lang || cm.lang || contractLang || 'en';
    // duration in days, prefer explicit duration field from dbContract if present
    let days = '';
    try {
      if (dbContract.duration != null) {
        days = Number(dbContract.duration);
      } else {
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
      }
    } catch (e) { days = ''; }
    const logo192 = window.location.origin + logo;

    // Normalize farmer platform fee and GST for display (prefer dbContract or saved contract_meta)
    const displayFarmerCommission = (dbContract.farmer_platform_fee != null ? Number(dbContract.farmer_platform_fee) :
      ((cm && cm.farmer_platform_fee != null) ? Number(cm.farmer_platform_fee) :
        ((cm && cm.farmerPlatformFee != null) ? Number(cm.farmerPlatformFee) :
          (totals.commission || totals.platform_fee || 0))));
    const displayFarmerGst = (dbContract.farmer_gst != null ? Number(dbContract.farmer_gst) :
      (dbContract.farmer_gst_on_fee != null ? Number(dbContract.farmer_gst_on_fee) :
        ((cm && cm.farmer_gst_on_fee != null) ? Number(cm.farmer_gst_on_fee) :
          ((cm && cm.farmerGstOnFee != null) ? Number(cm.farmerGstOnFee) :
            (totals.gst || 0)))));
    const displayNetAmountToFarmer = (dbContract.net_amount_payable_to_farmer != null ? Number(dbContract.net_amount_payable_to_farmer) :
      ((cm && cm.net_amount_payable_to_farmer != null) ? Number(cm.net_amount_payable_to_farmer) :
        ((cm && cm.netAmountPayableToFarmer != null) ? Number(cm.netAmountPayableToFarmer) :
          Math.round((totalCropTradeValue - ((displayFarmerCommission || 0) + (displayFarmerGst || 0)) + Number.EPSILON) * 100) / 100)));

    // prepare list of line items; if none exist, fall back to single-entry fields from dbContract
    let itemsArr = order.items || [];
    if ((!itemsArr || itemsArr.length === 0) && dbContract && dbContract.crop_name) {
      const qty = Number(dbContract.quantity || dbContract.quantity_kg || 0);
      const price = Number(dbContract.price_per_kg || 0);
      const amount = Math.round((qty * price + Number.EPSILON) * 100) / 100;
      itemsArr = [{
        crop_name: dbContract.crop_name,
        variety: dbContract.variety,
        order_quantity: qty,
        price_per_kg: price,
        amount
      }];
    }
    const rowsHtml = (itemsArr || []).map((it, idx) => {
      const qty = Number(it.order_quantity || it.quantity || 0) || 0;
      const price = Number(it.price_per_kg || it.price || 0) || 0;
      const amount = Math.round((qty * price + Number.EPSILON) * 100) / 100;
      const varietyVal = it.variety || it.var || it.variety_name || it.varity || defaultVariety || dbContract.variety || '';
      return `<tr>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${idx + 1}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${it.crop_name || it.name || ''}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${varietyVal}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${qty.toLocaleString('en-IN')} kg</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${formatCurrency(price)}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${formatCurrency(amount)}</td>
        </tr>`;
    }).join('') || `<tr><td colspan="6" style="padding:8px;border:1px solid #ddd;text-align:center">${t('noItems', siteLang)}</td></tr>`;

    const html = `<html>
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
  <p><b>Address:</b> ${buyerAddress || '[Buyer Address]'}${buyerState ? ', ' + buyerState : ''}${buyerRegion ? ', ' + buyerRegion : ''}</p>
  <p><strong>Party B – Farmer / Producer</strong></p>
  <p><b>Name:</b> ${farmerName}</p>
  <p><b>Farmer ID:</b> ${farmerId}</p>
  <p><b>Address:</b> ${farmerAddress || ''}${farmerState ? (farmerAddress ? ', ' + farmerState : '' + farmerState) : ''}${farmerRegion ? (farmerState || farmerAddress ? ', ' + farmerRegion : '' + farmerRegion) : ''}</p>
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

  


  ${ (dbContract && dbContract.status && String(dbContract.status).toLowerCase() === 'accepted') ?
    `<p>Buyer / Authorized Representative</p>
     <p>Signature: ${buyerName}</p>
     <p>Date: ${date}</p>
     ${dbContract.signature_method ? `<p>Signature Method: ${dbContract.signature_method}</p>` : ''}
     ${dbContract.signature_timestamp ? `<p>Signature Time: ${dbContract.signature_timestamp}</p>` : ''}`
    :
    `<p>Buyer / Authorized Representative</p>
     <p>Signature: ___________________________</p>
     <p>Date: ___________________________</p>`
  }

  <p>Farmer / Producer</p>
  <p>Signature: ${farmerName}</p>
  <p>Date: ${signatureDate}</p>
  

  <p>Witness : <strong>AgriAI</strong></p>
</section>


</body>
</html>`;

    // decide which language template to open: prefer user's selected site language
    const selectedLang = (localStorage.getItem('agri_lang') || contractLanguage || 'en').toLowerCase();
    const langName = selectedLang === 'hi' ? 'हिंदी' : (selectedLang === 'kn' ? 'ಕನ್ನಡ' : 'English');

    const htmlHi = `<!doctype html>
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
      <p><b>पता:</b> ${buyerAddress || '[Buyer Address]'}${buyerState ? ', ' + buyerState : ''}${buyerRegion ? ', ' + buyerRegion : ''}</p>
      <p><strong>पक्ष B – किसान / उत्पादक</strong></p>
      <p><b>नाम: </b> ${farmerName}</p>
      <p><b>किसान आईडी:</b> ${farmerId}</p>
      <p><b>पता:</b> ${farmerAddress || ''}${farmerState ? (farmerAddress ? ', ' + farmerState : '' + farmerState) : ''}${farmerRegion ? (farmerState || farmerAddress ? ', ' + farmerRegion : '' + farmerRegion) : ''}
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
      <p>प्लेटफ़ॉर्म शुल्क: ${formatCurrency(displayFarmerCommission)}</p>
      <p>प्लेटफ़ॉर्म शुल्क पर जीएसटी: ${formatCurrency(displayFarmerGst)}</p>
      <p><strong>कुल देय राशि (कटौती पश्चात): ${formatCurrency(displayNetAmountToFarmer)}</strong></p>
    
      <p><strong>5.2 खरीदार</strong></p>
      <p>कुल मात्रा: ${totalContractQty.toLocaleString('en-IN')} किग्रा</p>
      <p>मूल्य: ${formatCurrency(avgPricePerKg)} प्रति किग्रा</p>
      <p>प्लेटफ़ॉर्म शुल्क: ${formatCurrency(displayBuyerCommission)}</p>
      <p>प्लेटफ़ॉर्म शुल्क पर जीएसटी: ${formatCurrency(displayBuyerGst)}</p>
      <p><strong>कुल देय राशि (जोड़कर): ${formatCurrency(totalAmountPayableByBuyer)}</strong></p>
      
    
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
      <p>हस्ताक्षर: ${farmerName}</p>
      <p>तिथि: ${signatureDate}</p>
    
      <p>गवाह : <strong>एग्री एआई</strong></p>
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
      ಅಗ್ರಿ AI<br/>
      ಒಪ್ಪಂದ ಕೃಷಿ ಒಪ್ಪಂದ
    </h1>
    
    </div>
    
    <section class="section">
      <h2>ಪಕ್ಷಗಳು </h2>
    
      <p><strong>ಪಕ್ಷ A – ಖರೀದಿದಾರ / ಕಂಪನಿ</strong></p>
      <p><b>ಹೆಸರು:</b> ${buyerName}</p>
      <p><b>ಖರೀದಿದಾರ ಐಡಿ:</b> ${buyerId || '[Buyer ID]'}</p>
      <p><b>ವಿಳಾಸ:</b>${buyerAddress || '[Buyer Address]'}${buyerState ? ', ' + buyerState : ''}${buyerRegion ? ', ' + buyerRegion : ''}</p>
    
      <p><strong>ಪಕ್ಷ B – ರೈತ / ಉತ್ಪಾದಕ</strong></p>
      <p><b>ಹೆಸರು:</b> ${farmerName}</p>
      <p><b>ರೈತ ಐಡಿ:</b> ${farmerId}</p>
      <p><b>ವಿಳಾಸ:</b> ${farmerAddress || ''}${farmerState ? (farmerAddress ? ', ' + farmerState : '' + farmerState) : ''}${farmerRegion ? (farmerState || farmerAddress ? ', ' + farmerRegion : '' + farmerRegion) : ''}</p>
    
      <p>
        ಪಕ್ಷ A ಮತ್ತು ಪಕ್ಷ B ಒಟ್ಟಾಗಿ “ಪಕ್ಷಗಳು” ಎಂದು ಕರೆಯಲ್ಪಡುತ್ತವೆ.
        ಅಗ್ರಿAI ಕೇವಲ ಡಿಜಿಟಲ್ ಸೌಲಭ್ಯ ಒದಗಿಸುವ ವೇದಿಕೆಯಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ ಮತ್ತು ಯಾವುದೇ ಖರೀದಿದಾರ, ಮಾರಾಟಗಾರ, ಸಾರಿಗೆದಾರ, ವಿಮೆದಾರ ಅಥವಾ ಯಾವುದಾದರೂ ಪಕ್ಷದ ಪ್ರತಿನಿಧಿಯಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುವುದಿಲ್ಲ.
      </p>
    </section>
    
    <section class="section">
      <h2>1. ಒಪ್ಪಂದದ ಉದ್ದೇಶ</h2>
    
      <p>
        ಈ ಒಪ್ಪಂದವು ರೈತನು ಕೃಷಿ ಉತ್ಪನ್ನಗಳನ್ನು ಉತ್ಪಾದಿಸಿ ಖರೀದಿದಾರರಿಗೆ ಪೂರೈಸಲು ಹಾಗೂ ಖರೀದಿದಾರನು ಪೂರ್ವನಿರ್ಧರಿತ ಬೆಲೆಗೆ ಆ ಉತ್ಪನ್ನಗಳನ್ನು ಖರೀದಿಸಲು ಒಪ್ಪಿಕೊಂಡಿರುವ ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳನ್ನು ವಿವರಿಸುತ್ತದೆ. ಇದರ ಮೂಲಕ ಕೆಳಗಿನ ಉದ್ದೇಶಗಳನ್ನು ಸಾಧಿಸಲಾಗುತ್ತದೆ:
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
      <p>ವೇದಿಕೆ ಶುಲ್ಕ (Platform Fee): ${formatCurrency(displayFarmerCommission)}</p>
      <p>ವೇದಿಕೆ ಶುಲ್ಕದ ಮೇಲೆ GST: ${formatCurrency(displayFarmerGst)}</p>
      <p><strong>ಒಟ್ಟು ಮೊತ್ತ (ಕಡಿತದ ನಂತರ): ${formatCurrency(displayNetAmountToFarmer)}</strong></p>
    
      <p><strong>5.2 ಖರೀದಿದಾರ </strong></p>
      <p>ಒಟ್ಟು ಪ್ರಮಾಣ: ${totalContractQty.toLocaleString('en-IN')} ಕೆಜಿ</p>
      <p>ಬೆಲೆ: ${formatCurrency(avgPricePerKg)} ಪ್ರತಿ ಕೆಜಿ</p>
      <p>ವೇದಿಕೆ ಶುಲ್ಕ (Platform Fee): ${formatCurrency(displayBuyerCommission)}</p>
      <p>ವೇದಿಕೆ ಶುಲ್ಕದ ಮೇಲೆ GST: ${formatCurrency(displayBuyerGst)}</p>
      <p><strong>ಒಟ್ಟು ಮೊತ್ತ (ಸೇರಿಕೆಯ ನಂತರ): ${formatCurrency(totalAmountPayableByBuyer)}</strong></p>
    
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
      <p>ಸಹಿ: ${farmerName}</p>
      <p>ದಿನಾಂಕ: ${signatureDate}</p>
    
      <p>ಸಾಕ್ಷಿ : <strong>AgriAI</strong></p>
    </section>
    </body>
    </html>`;

    // choose final HTML based on selected language; default to English `html` defined above
    let finalHtml = (selectedLang === 'hi') ? htmlHi : (selectedLang === 'kn' ? htmlKn : html);
    // insert contract number and status right after the main heading
    const numLabel = t('contractNumberLabel', selectedLang) || 'Contract Number';
    const statusLabel = t('statusLabel', selectedLang) || 'Status';
    finalHtml = finalHtml.replace('</h1>', `</h1>\n<p><strong>${numLabel}:</strong> ${contractNum}</p>\n<p><strong>${statusLabel}:</strong> ${dbContract.status || ''}</p>`);

    const w = window.open('', '_blank');
    try { w.document.write(finalHtml); w.document.close(); } catch (e) { window.open('data:text/html;charset=utf-8,' + encodeURIComponent(finalHtml), '_blank'); }
    };

  return (
    <div className="fh-root" style={{ background: 'rgba(83, 255, 3, 0.12)', backgroundAttachment: 'fixed', minHeight: '100vh', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        .fh-root .navbar {
          background: oklch(0.12 0.03 160 / 0.5) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
        }
        .fh-root .navbar select {
          background: oklch(0.12 0.03 160 / 0.6) !important;
          border: 1px solid oklch(0.65 0.22 145 / 0.3) !important;
          color: rgba(255,255,255,0.9) !important;
        }
        .fh-root .navbar select option {
          background: #1a1a1a;
          color: #ffffff;
        }
      `}</style>
      <Navbar />
      <main style={{ padding: '6rem 1rem 2rem' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px) saturate(1.6)', WebkitBackdropFilter: 'blur(20px) saturate(1.6)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 8px 32px rgba(35,105,2,0.12), 0 32px 64px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)' }}>
          <h1 style={{ backgroundImage: 'linear-gradient(135deg, #1a5c10 0%, #236902 50%, #53b635 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', textAlign: 'center', fontSize: '2rem', fontWeight: 800, margin: 0 }}>{t('historyTitle', siteLang) || 'Sales History'}</h1>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12, alignItems: 'center', justifyContent: 'space-between' }}>
            <input
              placeholder={t('historySearchPlaceholder', siteLang) || 'Search by Contract ID or crop name'}
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ flex: '1 1 280px', minWidth: 240, padding: '10px 14px', border: '1.5px solid #d4edcc', borderRadius: 10, color: '#1a3d0a', background: 'rgba(255,255,255,0.95)', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.2s' }}
              onFocus={(e) => { e.target.style.borderColor = '#53b635'; e.target.style.boxShadow = '0 0 0 3px rgba(83,182,53,0.18), 0 2px 8px rgba(35,105,2,0.1)'; e.target.style.transform = 'translateY(-2px)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#d4edcc'; e.target.style.boxShadow = 'none'; e.target.style.transform = 'translateY(0)'; }}
            />
            <div>
              <label style={{ marginRight: 8, fontWeight: 700, color: '#2d5c1a', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('sortLabel', siteLang) || 'Sort:'}</label>
              <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} style={{ padding: '10px 14px', border: '1.5px solid #d4edcc', borderRadius: 10, color: '#1a3d0a', background: 'rgba(255,255,255,0.95)', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.2s' }}
                onFocus={(e) => { e.target.style.borderColor = '#53b635'; e.target.style.boxShadow = '0 0 0 3px rgba(83,182,53,0.18), 0 2px 8px rgba(35,105,2,0.1)'; e.target.style.transform = 'translateY(-2px)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#d4edcc'; e.target.style.boxShadow = 'none'; e.target.style.transform = 'translateY(0)'; }}>
                <option value="all">{t('all', siteLang) || 'All'}</option>
                <option value="latest">{t('latest', siteLang) || 'Latest'}</option>
                <option value="old">{t('old', siteLang) || 'Old'}</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <div style={{ fontSize: 52, lineHeight: 1 }}>🧾</div>
              <div style={{ marginTop: 8, color: '#1a3d0a' }}>{t('historyNoPurchases', siteLang) || 'No matching sales yet.'}</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
              {filtered.map((o) => {
                const total = o?.totals?.grand_total || 0;
                const idKey = o.contract_number || o.invoice_id;
                // Fetch farmer amount from contracts table
                const farmerAmount = (o._db_contract && (o._db_contract.farmer_total || o._db_contract.net_amount_payable_to_farmer)) 
                  || o?.totals?.net_amount_to_farmer 
                  || 0;
                
                return (
                  <div key={idKey} style={{ border: '1px solid rgba(83,182,53,0.15)', borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.5)' }}>
                    <div style={{ padding: '12px 14px', background: 'linear-gradient(135deg, rgba(234,246,234,0.8), rgba(212,240,212,0.8))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div style={{ fontWeight: 800, color: '#236902' }}>{(t('contractLabel', siteLang) || 'Contract') + ': '}{idKey}</div>
                        <div style={{ color: '#2d5c1a', marginTop: 4, fontSize: '0.9rem' }}>{formatDateTime(o.contract_datetime || o.created_at)}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <div style={{ fontWeight: 800, color: '#236902', whiteSpace: 'nowrap', marginRight: 10 }}>{formatCurrency(farmerAmount)}</div>
                        <button 
                          onClick={() => openInvoice(o)} 
                          style={{ background: 'linear-gradient(135deg, #236902 0%, #53b635 100%)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 10, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(35,105,2,0.2)', transition: 'transform 0.18s, box-shadow 0.18s, filter 0.18s' }}
                          onMouseEnter={(e) => { e.target.style.transform = 'translateY(-3px) scale(1.03)'; e.target.style.boxShadow = '0 8px 24px rgba(35,105,2,0.35)'; e.target.style.filter = 'brightness(1.08)'; }}
                          onMouseLeave={(e) => { e.target.style.transform = 'translateY(0) scale(1)'; e.target.style.boxShadow = '0 4px 12px rgba(35,105,2,0.2)'; e.target.style.filter = 'brightness(1)'; }}
                        >
                          {t('viewContract', siteLang) || 'View Contract'}
                        </button>
                        {/* Show contract status instead of a generic Details button */}
                        {(() => {
                          const st = (o._db_contract && o._db_contract.status) || o.status || 'pending';
                          const s = String(st).toLowerCase();
                          let bg = '#f5f5f5';
                          let color = '#333';
                          let border = '1px solid #ddd';
                          if (s === 'accepted' || s === 'accept' || s === 'approved') { bg = '#4caf50'; color = '#fff'; border = '1px solid #45a049'; }
                          else if (s === 'pending' || s === 'awaiting' || s === 'pending_confirmation') { bg = '#ffeb3b'; color = '#000'; border = '1px solid #fdd835'; }
                          else if (s === 'rejected' || s === 'declined' || s === 'cancelled') { bg = '#f44336'; color = '#fff'; border = '1px solid #e53935'; }
                          return (
                            <button disabled style={{ background: bg, color, border, padding: '8px 14px', borderRadius: 10, cursor: 'default', fontWeight: 600, fontSize: '0.85rem' }}>{(t(s, siteLang) || (st && String(st).toUpperCase()) || 'STATUS')}</button>
                          );
                        })()}
                        {( ((o._db_contract && String(o._db_contract.status).toLowerCase() === 'pending')
                             || String(o.status || '').toLowerCase() === 'pending') && (
                          <button onClick={() => handleDelete(idKey)} title={t('delete', siteLang) || 'Delete'} style={{ background: 'rgba(198,40,40,0.1)', color: '#c62828', border: '1px solid rgba(198,40,40,0.3)', padding: '8px 12px', borderRadius: 10, marginLeft: 6, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, transition: 'all 0.2s' }}>{'🗑️'}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

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
                {t('footerDescription', siteLang)}
              </p>
            </div>

            {[
              { title: t('footerPlatform', siteLang), links: ['footerAbout', 'footerHowItWorks', 'footerFeatures', 'footerPricing'] },
              { title: t('footerUsers', siteLang), links: ['footerFarmers', 'footerBuyers', 'footerAgribusiness', 'footerPartners'] },
              { title: t('footerLegal', siteLang), links: ['footerPrivacy', 'footerTerms', { label: t('footerContact', siteLang), path: "/contact" }] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-white mb-2" style={{fontFamily:"'Times New Roman', Times, serif"}}>{col.title}</h4>
                <ul className="space-y-1">
                  {col.links.map((link) => {
                    const label = typeof link === 'string' ? t(link, siteLang) : link.label;
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
              © {new Date().getFullYear()} AgriAI. {t('footerRights', siteLang)}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}



