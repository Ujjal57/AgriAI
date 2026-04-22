import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import Navbar from '../Navbar';
import logo from '../assets/logo192.png';
import { t } from '../i18n';

export default function FarmerHistory() {
  const [orders, setOrders] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  
  const [siteLang, setSiteLang] = React.useState(() => localStorage.getItem('agri_lang') || 'en');

  React.useEffect(() => {
    // Load contracts from both contract_b table (accepted/rejected) and contracts table (all)
    const loadContracts = async () => {
      try {
        const role = localStorage.getItem('agriai_role') || '';
        const farmerId = localStorage.getItem('agriai_id') || '';
        
        // Only load if user is a farmer
        if (role !== 'farmer' || !farmerId) {
          setOrders([]);
          return;
        }
        
        const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');
        
        // Transform contract data into order format
        const transformContract = (c) => ({
          contract_number: c.contract_number,
          contract_datetime: c.created_at,
          invoice_id: c.contract_number,
          created_at: c.created_at,
          payment_method: 'contract',
          items: [],
          totals: { subtotal: 0, gst: 0, platform_fee: 0, grand_total: c.amount || 0 },
          farmer_state: c.farmer_state,
          buyer_state: c.buyer_state,
          buyer_name: c.buyer_name,
          buyer_id: c.buyer_id,
          farmer_name: c.farmer_name,
          farmer_id: c.farmer_id,
          total_amount: c.amount,
          quantity_kg: c.quantity_kg,
          price_per_kg: c.price_per_kg,
          contract_nature: c.contract_nature,
          contract_duration: c.contract_duration,
          start_date: c.start_date,
          end_date: c.end_date,
          status: c.status,
          crop_name: c.crop_name,
          variety: c.variety,
          _db_contract: c // Store full contract object
        });
        
        let allContracts = [];
        
        // Fetch from contract_b table (status IN 'accepted', 'rejected')
        try {
          const urlB = `${apiBase}/farmer/contracts-b?farmer_id=${encodeURIComponent(farmerId)}`;
          const respB = await fetch(urlB);
          if (respB && respB.ok) {
            const jB = await respB.json().catch(() => null);
            if (jB && jB.ok && Array.isArray(jB.contracts)) {
              console.log(`✅ Loaded ${jB.contracts.length} contracts from contract_b:`, jB.contracts.map(c => c.contract_number));
              allContracts = allContracts.concat(jB.contracts.map(transformContract));
            }
          }
        } catch (e) {
          console.warn('Failed to load contracts from contract_b table:', e);
        }
        
        // Fetch from contracts table (no filter)
        try {
          const urlRegular = `${apiBase}/farmer/contracts?farmer_id=${encodeURIComponent(farmerId)}`;
          const respRegular = await fetch(urlRegular);
          if (respRegular && respRegular.ok) {
            const jRegular = await respRegular.json().catch(() => null);
            if (jRegular && jRegular.ok && Array.isArray(jRegular.contracts)) {
              console.log(`✅ Loaded ${jRegular.contracts.length} contracts from contracts table:`, jRegular.contracts.map(c => c.contract_number));
              allContracts = allContracts.concat(jRegular.contracts.map(transformContract));
            }
          }
        } catch (e) {
          console.warn('Failed to load contracts from contracts table:', e);
        }
        
        // Remove duplicates (by contract_number) and sort by date
        // Prioritize contract_b data over contracts table data for created_at
        const uniqueMap = new Map();
        allContracts.forEach(c => {
          const contractNum = c.contract_number;
          if (!uniqueMap.has(contractNum)) {
            uniqueMap.set(contractNum, c);
          } else {
            // If contract already exists, merge data prioritizing contract_b fields
            const existing = uniqueMap.get(contractNum);
            // If current contract is from contract_b (has sender field), use its created_at
            // Otherwise keep the existing one (which might be from contract_b)
            if (c._db_contract && c._db_contract.sender) {
              uniqueMap.set(contractNum, {
                ...existing,
                created_at: c.created_at,
                contract_datetime: c.contract_datetime,
                _db_contract: c._db_contract
              });
            }
          }
        });
        
        const getOrderDate = (item) => {
          const candidate = item.created_at || item.contract_datetime || (item._db_contract && (item._db_contract.updated_at || item._db_contract.created_at));
          if (!candidate) return 0;
          const dt = new Date(candidate);
          return isNaN(dt) ? 0 : dt.getTime();
        };

        const orders = Array.from(uniqueMap.values())
          .sort((a, b) => getOrderDate(b) - getOrderDate(a));

        console.log(`📊 Total unique contracts to display: ${orders.length}`, orders.map(o => o.contract_number));
        setOrders(orders);
      } catch (e) {
        console.warn('Failed to load contracts:', e);
        setOrders([]);
      }
    };

    // Load contracts immediately
    loadContracts();

    // Poll every 10 seconds for contract updates
    const pollInterval = setInterval(loadContracts, 10000);
    
    return () => clearInterval(pollInterval);
  }, []);

  React.useEffect(() => {
    const onLang = (e) => { const l = (e && e.detail && e.detail.lang) ? e.detail.lang : (localStorage.getItem('agri_lang') || 'en'); setSiteLang(l); };
    window.addEventListener('agri:lang:change', onLang);
    return () => { try { window.removeEventListener('agri:lang:change', onLang); } catch (e) {} };
  }, []);

  const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const formatDateTime = (iso) => {
    try {
      if (!iso && iso !== 0) return '';
      const raw = String(iso).trim();
      if (!raw) return '';

      // 1) If already dd/mm/yyyy return as-is
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
        return raw;
      }

      // 2) Try explicit y-m-d or y/m/d
      const ymd = raw.match(/^(\d{4})[-\/]?(\d{2})[-\/]?(\d{2})/);
      if (ymd) {
        return `${ymd[3].padStart(2, '0')}/${ymd[2].padStart(2, '0')}/${ymd[1].padStart(4, '0')}`;
      }

      // 3) parse standard Date, including RFC 2822 and ISO
      let normalized = raw;
      if (/\s\d{2}:\d{2}:\d{2}/.test(normalized) && !/T/.test(normalized)) {
        normalized = normalized.replace(' ', 'T');
      }
      if (!/[Zz]|[+-]\d{2}:?\d{2}$/.test(normalized)) {
        normalized += 'Z';
      }
      const dt = new Date(normalized);
      if (!isNaN(dt.getTime())) {
        const dd = String(dt.getUTCDate()).padStart(2, '0');
        const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
        const yyyy = dt.getUTCFullYear();
        return `${dd}/${mm}/${yyyy}`;
      }

      // 4) fallback to first date-appearing in string like '02 Apr 2026'
      const fallback = raw.match(/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/);
      if (fallback) {
        const months = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
        const m = months[fallback[2].slice(0, 3)];
        if (m) {
          return `${String(fallback[1]).padStart(2, '0')}/${m}/${fallback[3]}`;
        }
      }

      return raw;
    } catch (e) {
      return String(iso);
    }
  };

  const getOrderDate = (item) => {
    if (!item) return 0;
    const dateStr = item.created_at || item.contract_datetime || (item._db_contract && (item._db_contract.updated_at || item._db_contract.created_at));
    const dt = new Date(dateStr);
    return isNaN(dt.getTime()) ? 0 : dt.getTime();
  };

  // Ensure all contracts have authoritative data from contract_b table
  // This fetches contract_b data by `contract_number` from the backend
  // and updates created_at and other fields with contract_b data when available
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!Array.isArray(orders) || orders.length === 0) return;
        const contractsWithNumbers = orders.filter(o => o && o.contract_number);
        if (!contractsWithNumbers.length) return;
        // Only resolve contract_b details for entries that aren't already enriched
        const contractsToFetch = contractsWithNumbers.filter(o => !o._db_contract);
        if (!contractsToFetch.length) return;
        const apiBase = process.env.REACT_APP_API_BASE || (window.__AGRIAI_API_BASE__ || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000'));
        const fetchedMap = {};
        await Promise.all(contractsToFetch.map(async (o) => {
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
          setOrders(prev => {
            if (!Array.isArray(prev)) return prev;
            const updated = prev.map(p => {
              if (p && p.contract_number && fetchedMap[p.contract_number]) {
                const contractBData = fetchedMap[p.contract_number];
                return { 
                  ...p,
                  _db_contract: contractBData,
                  created_at: contractBData.updated_at || contractBData.created_at || p.created_at,
                  contract_datetime: contractBData.updated_at || contractBData.created_at || p.contract_datetime
                };
              }
              return p;
            });
            // Keep latest first by date after updating
            updated.sort((a, b) => getOrderDate(b) - getOrderDate(a));
            return updated;
          });
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
      
      // Find the contract to get its details (crop name, quantity, etc.)
      const contractToDelete = orders.find(o => (o.contract_number || o.invoice_id) === idKey);
      
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

      // Add the contract quantity back to the farmer's deals
      if (contractToDelete && contractToDelete.quantity_kg && contractToDelete.crop_name) {
        try {
          // Try to find and update deals using crop_name and buyer_id
          const listUrl = `${apiBase}/deals/list`;
          const listResp = await fetch(listUrl);
          const listJson = await listResp.json().catch(() => ({}));
          
          if (listResp.ok && listJson.ok && Array.isArray(listJson.deals)) {
            // Find deals matching the crop and buyer
            const matchingDeals = listJson.deals.filter(d => 
              d.crop_name === contractToDelete.crop_name && 
              String(d.buyer_id) === String(contractToDelete.buyer_id)
            );
            
            console.log(`[Delete] Found ${matchingDeals.length} matching deals for crop "${contractToDelete.crop_name}" and buyer ${contractToDelete.buyer_id}`);
            
            // Update all matching deals to add back the quantity
            for (const deal of matchingDeals) {
              const currentQty = Number(deal.quantity_kg || 0);
              const newQty = currentQty + Number(contractToDelete.quantity_kg);
              
              try {
                const updateResp = await fetch(`${apiBase}/deals/${deal.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ quantity_kg: newQty })
                });
                
                if (updateResp.ok) {
                  console.log(`[Delete] Restored ${contractToDelete.quantity_kg} kg to deal ${deal.id} (new qty: ${newQty})`);
                } else {
                  console.warn(`[Delete] Failed to update deal ${deal.id}:`, updateResp.status);
                }
              } catch (e) {
                console.warn('[Delete] Failed to update deal quantity:', e);
              }
            }
          }
        } catch (e) {
          console.warn('[Delete] Error restoring quantities:', e);
        }
      }

      // Remove from local state only (no localStorage)
      setOrders(prev => (prev || []).filter(o => ((o.contract_number || o.invoice_id) !== idKey)));

      // Dispatch event to notify other components about quantity restoration
      try {
        window.dispatchEvent(new CustomEvent('agriai:contract:deleted', { 
          detail: { 
            contract_number: idKey,
            quantity_restored: contractToDelete?.quantity_kg,
            buyer_id: contractToDelete?.buyer_id,
            crop_name: contractToDelete?.crop_name,
            restored_to_deals: true
          } 
        }));
      } catch (e) {}
    } catch (e) { console.warn('delete history failed', e); }
  };

  // Monitor for status changes to "rejected" and restore quantities
  React.useEffect(() => {
    (async () => {
      try {
        // Get list of already-processed rejections from sessionStorage
        const processedKey = 'agriai_farmer_rejections_processed';
        const processedRaw = sessionStorage.getItem(processedKey) || '[]';
        const processed = new Set(JSON.parse(processedRaw));
        
        const apiBase = process.env.REACT_APP_API_BASE || (window.__AGRIAI_API_BASE__ || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000'));
        
        for (const order of orders) {
          const contractNum = order.contract_number || order.invoice_id;
          const currentStatus = (order._db_contract && order._db_contract.status) || order.status || '';
          const isRejected = String(currentStatus).toLowerCase() === 'rejected';
          
          // If contract is rejected and we haven't processed it yet
          if (isRejected && contractNum && !processed.has(contractNum)) {
            // Restore quantities the same way as delete: for each item, reduce-quantity with negative
            const items = order.items || [];
            for (const item of items) {
              const dealId = item.deal_id;
              const qtyToRestore = Number(item.order_quantity || item.quantity || 0);
              if (dealId && qtyToRestore > 0) {
                try {
                  const resp = await fetch(`${apiBase}/deals/reduce-quantity`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deal_id: dealId, quantity: -qtyToRestore })
                  });
                  if (resp.ok) {
                    console.log(`[Rejection] Restored ${qtyToRestore} kg to deal ${dealId}`);
                  } else {
                    console.warn(`[Rejection] Failed to restore quantity for deal ${dealId}:`, resp.status);
                  }
                } catch (e) {
                  console.warn('[Rejection] Error restoring quantity:', e);
                }
              }
            }
            
            // Mark this contract as processed
            processed.add(contractNum);
            sessionStorage.setItem(processedKey, JSON.stringify(Array.from(processed)));
            
            // Dispatch event to notify other components about quantity restoration
            try {
              window.dispatchEvent(new CustomEvent('agriai:contract:rejected', { 
                detail: { 
                  contract_number: contractNum,
                  restored_to_deals: true
                } 
              }));
            } catch (e) {}
          }
        }
      } catch (e) {
        console.warn('[Rejection] Error in rejection handler:', e);
      }
    })();
  }, [orders]);

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
    
    // Filter by contract status
    if (statusFilter === 'all') {
      return matchesQuery;
    } else {
      const contractStatus = (o.status || 'pending').toLowerCase();
      return matchesQuery && contractStatus === statusFilter.toLowerCase();
    }
  }).sort((a, b) => {
    // Sort by creation date (newest first)
    const aDate = new Date(a.created_at || 0).getTime();
    const bDate = new Date(b.created_at || 0).getTime();
    return bDate - aDate;
  });

  const openInvoice = async (order, shouldPrint = false) => {
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
      const w = window.open(full, '_blank');
      if (shouldPrint && w) {
        setTimeout(() => { try { w.focus(); w.print(); } catch (e) {} }, 1200);
      }
      return w;
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
    const startDate = dbContract.updated_at || dbContract.updatedAt || dbContract.start_date || (cm.start_date || cm.startDate) || (order.start_date || order.startDate) || (new Date().toLocaleDateString('en-GB'));
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
      buyerRegion = buyerRegion || farmerRegion;
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

    const html = `<!doctype html>
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
          padding: 20px 20px;
          max-width: 1000px;
          margin: 0 auto;
        }
        @page {
          size: A4;
          margin: 20mm;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
            color: #000;
            background: #fff !important;
            line-height: 1.4;
            font-size: 12px;
            max-width: 100%;
          }
          .section, .signature-section, .header, .footer {
            page-break-inside: avoid;
          }
          h1, h2, h3 {
            page-break-after: avoid;
            page-break-before: avoid;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #888 !important;
            padding: 6px 8px !important;
            font-size: 11px !important;
          }
          .print-page-break {
            page-break-after: always;
          }
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
        <p><b>Address:</b> ${buyerState ? buyerState : ''}${buyerRegion ? (buyerState ? ', ' + buyerRegion : buyerRegion) : ''}</p>
      </div>
    
      <div class="party-section">
        <p><strong>Party B – Farmer / Producer</strong></p>
        <p><b>Name:</b> ${farmerName}</p>
        <p><b>Farmer ID:</b> ${farmerId}</p>
        <p><b>Address:</b> ${farmerState ? farmerState : ''}${farmerRegion ? (farmerState ? ', ' + farmerRegion : farmerRegion) : ''}</p>
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
        <p><b>Start Date:</b> ${formatDateTime(startDate)}</p>
        <p><b>End Date:</b> ${formatDateTime(endDate)}</p>
        <p><b>Duration:</b> ${days} Days</p>
        <p>
          ${contractNature === 'pre-harvest' ? 'Under this Pre-Harvest Production Contract, the Farmer agrees to cultivate and supply the produce as per the agreed specifications. Cultivation obligations apply under this contract.' : 'Under this Post-Harvest Procurement Contract, the produce has already been cultivated or harvested prior to execution of this Agreement. No cultivation obligation arises under this contract.'}
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
        <p><b>Platform Fee:</b> ${formatCurrency(displayFarmerCommission)}</p>
        <p><b>GST (18%):</b> ${formatCurrency(displayFarmerGst)}</p>
        <p><b style="font-size: 16px; color: #236902;">Total Amount (After Deduction):</b> <b style="font-size: 16px; color: #236902;">${formatCurrency(displayNetAmountToFarmer)}</b></p>
    
        <h3 style="margin-top: 20px;">5.2 Buyer's Payment Structure</h3>
        <p><b>Total Quantity:</b> ${totalContractQty.toLocaleString('en-IN')} kg</p>
        <p><b>Price per Unit:</b> ${formatCurrency(avgPricePerKg)} per kg</p>
        <p><b>Platform Fee:</b> ${formatCurrency(displayBuyerCommission)}</p>
        <p><b>GST (18%):</b> ${formatCurrency(displayBuyerGst)}</p>
        <p><b style="font-size: 16px; color: #236902;">Total Amount Payable:</b> <b style="font-size: 16px; color: #236902;">${formatCurrency(totalAmountPayableByBuyer)}</b></p>
    
        <h3 style="margin-top: 20px;">5.3 Payment Schedule</h3>
        <ul>
          <li><b>Advance (25%):</b> ${formatCurrency(totalAmountPayableByBuyer * 0.25)} – Due at contract confirmation</li>
          <li><b>On Delivery (50%):</b> ${formatCurrency(totalAmountPayableByBuyer * 0.50)} – Due upon successful delivery</li>
          <li><b>Final (25%):</b> ${formatCurrency(totalAmountPayableByBuyer * 0.25)} – Due within 7 working days after quality acceptance</li>
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
          ${ (dbContract && dbContract.status && String(dbContract.status).toLowerCase() === 'accepted') ?
    `<p><b>Buyer / Company</b></p>
     <p>Name: ${buyerName}</p>
     <p>Date: ${date}</p>
      ` :
    `<p><b>Buyer / Company</b></p>
     <p>Name: ___________________________</p>
     <p>Date: ___________________________</p>`
  }
          </div>
        <div class="signature-line">
          <p><b>Farmer / Producer</b></p>
          <p>Name: ${farmerName}</p>
          <p>Date: ${signatureDate}</p>
        </div>
      </section>
    
      <p style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; font-size: 12px; color: #000; font-weight: bold;">
        <b>Witness:</b> AgriAI Platform | Digital Record: ${new Date().toISOString()}
      </p>
    
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
          padding: 20px 20px;
          max-width: 1000px;
          margin: 0 auto;
        }
        @page {
          size: A4;
          margin: 20mm;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
            color: #000;
            background: #fff !important;
            line-height: 1.4;
            font-size: 12px;
            max-width: 100%;
          }
          .section, .signature-section, .header, .footer {
            page-break-inside: avoid;
          }
          h1, h2, h3 {
            page-break-after: avoid;
            page-break-before: avoid;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #888 !important;
            padding: 6px 8px !important;
            font-size: 11px !important;
          }
          .print-page-break {
            page-break-after: always;
          }
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
        <p><b>पता:</b> ${buyerState ? buyerState : ''}${buyerRegion ? (buyerState ? ', ' + buyerRegion : buyerRegion) : ''}</p>
      </div>
    
      <div class="party-section">
        <p><strong>पक्ष B – किसान / उत्पादक</strong></p>
        <p><b>नाम:</b> ${farmerName}</p>
        <p><b>किसान आईडी:</b> ${farmerId}</p>
        <p><b>पता:</b> ${farmerState ? farmerState : ''}${farmerRegion ? (farmerState ? ', ' + farmerRegion : farmerRegion) : ''}</p>
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
        <p><b>प्रारंभ तिथि:</b> ${formatDateTime(startDate)}</p>
        <p><b>समाप्ति तिथि:</b> ${formatDateTime(endDate)}</p>
        <p><b>अवधि:</b> ${days} दिन</p>
        <p>
          ${contractNature === 'pre-harvest' ? 'इस पूर्व-फसल उत्पादन अनुबंध के अंतर्गत, किसान सहमत शर्तों के अनुसार उत्पाद को उगाने और आपूर्ति करने के लिए सहमत है। इस अनुबंध के तहत खेती संबंधी दायित्व लागू होते हैं।' : 'इस फसल कटाई के बाद क्रय अनुबंध के अंतर्गत, उत्पाद पहले ही इस समझौते के निष्पादन से पूर्व उगाया या काटा जा चुका है। इस अनुबंध के तहत कोई भी खेती संबंधी दायित्व उत्पन्न नहीं होता।'}
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
        <p><b>प्लेटफ़ॉर्म शुल्क:</b> ${formatCurrency(displayFarmerCommission)}</p>
        <p><b>जीएसटी (18%):</b> ${formatCurrency(displayFarmerGst)}</p>
        <p><b style="font-size: 16px; color: #236902;">कुल राशि (कटौती के बाद):</b> <b style="font-size: 16px; color: #236902;">${formatCurrency(displayNetAmountToFarmer)}</b></p>
    
        <h3 style="margin-top: 20px;">5.2 खरीदार की भुगतान संरचना</h3>
        <p><b>कुल मात्रा:</b> ${totalContractQty.toLocaleString('en-IN')} किग्रा</p>
        <p><b>प्रति इकाई मूल्य:</b> ${formatCurrency(avgPricePerKg)} प्रति किग्रा</p>
        <p><b>प्लेटफ़ॉर्म शुल्क:</b> ${formatCurrency(displayBuyerCommission)}</p>
        <p><b>जीएसटी (18%):</b> ${formatCurrency(displayBuyerGst)}</p>
        <p><b style="font-size: 16px; color: #236902;">देय कुल राशि:</b> <b style="font-size: 16px; color: #236902;">${formatCurrency(totalAmountPayableByBuyer)}</b></p>
    
        <h3 style="margin-top: 20px;">5.3 भुगतान अनुसूची</h3>
        <ul>
          <li><b>अग्रिम (25%):</b> ${formatCurrency(totalAmountPayableByBuyer * 0.25)} – अनुबंध की पुष्टि पर देय</li>
          <li><b>डिलीवरी के समय (50%):</b> ${formatCurrency(totalAmountPayableByBuyer * 0.50)} – सफल डिलीवरी पर देय</li>
          <li><b>अंतिम (25%):</b> ${formatCurrency(totalAmountPayableByBuyer * 0.25)} – गुणवत्ता स्वीकृति के 7 कार्य दिवसों के भीतर देय</li>
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
          ${ (dbContract && dbContract.status && String(dbContract.status).toLowerCase() === 'accepted') ?
          `<p><b>खरीदार / कंपनी</b></p>
          <p>नाम: ${buyerName}</p>
          <p>तिथि:  ${date}</p>
          ` :
    `<p><b>खरीदार / कंपनी</b></p>
          <p>नाम: ___________________________</p></p>
          <p>तिथि: ___________________________</p>`
  }   
     </div>
        <div class="signature-line">
          <p><b>किसान / उत्पादक</b></p>
          <p>नाम: ${farmerName}</p></p>
          <p>तिथि: ${signatureDate}</p>
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
          padding: 20px 20px;
          max-width: 1000px;
          margin: 0 auto;
        }
        @page {
          size: A4;
          margin: 20mm;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
            color: #000;
            background: #fff !important;
            line-height: 1.4;
            font-size: 12px;
            max-width: 100%;
          }
          .section, .signature-section, .header, .footer {
            page-break-inside: avoid;
          }
          h1, h2, h3 {
            page-break-after: avoid;
            page-break-before: avoid;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #888 !important;
            padding: 6px 8px !important;
            font-size: 11px !important;
          }
          .print-page-break {
            page-break-after: always;
          }
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
        <p><b>ವಿಳಾಸ:</b> ${buyerState ? buyerState : ''}${buyerRegion ? (buyerState ? ', ' + buyerRegion : buyerRegion) : ''}</p>
      </div>
    
      <div class="party-section">
        <p><strong>ಪಕ್ಷ B – ರೈತ / ಉತ್ಪಾದಕ</strong></p>
        <p><b>ಹೆಸರು:</b> ${farmerName}</p>
        <p><b>ರೈತ ಐಡಿ:</b> ${farmerId}</p>
        <p><b>ವಿಳಾಸ:</b> ${farmerState ? farmerState : ''}${farmerRegion ? (farmerState ? ', ' + farmerRegion : farmerRegion) : ''}</p>
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
        <p><b>ಪ್ರಾರಂಭ ದಿನಾಂಕ:</b> ${formatDateTime(startDate)}</p>
        <p><b>ಅಂತ್ಯ ದಿನಾಂಕ:</b> ${formatDateTime(endDate)}</p>
        <p><b>ಅವಧಿ:</b> ${days} ದಿನಗಳು</p>
        <p>
          ${contractNature === 'pre-harvest' ? 'ಈ ಕೊಯ್ಲಿಗೆ ಮುನ್ನ ಉತ್ಪಾದನಾ ಒಪ್ಪಂದದ ಅಡಿಯಲ್ಲಿ, ರೈತರು ಒಪ್ಪಂದಿತ ನಿಬಂಧನೆಗಳ ಪ್ರಕಾರ ಉತ್ಪನ್ನವನ್ನು ಬೆಳೆಸಲು ಮತ್ತು ಪೂರೈಸಲು ಒಪ್ಪುತ್ತಾರೆ. ಈ ಒಪ್ಪಂದದ ಅಡಿಯಲ್ಲಿ ಬೆಳೆ ಉತ್ಪಾದನಾ ಬಾಧ್ಯತೆಗಳು ಅನ್ವಯಿಸುತ್ತವೆ.' : 'ಈ ಕೊಯ್ಲಿನ ನಂತರದ ಖರೀದಿ ಒಪ್ಪಂದದ ಅಡಿಯಲ್ಲಿ, ಉತ್ಪನ್ನವು ಈಗಾಗಲೇ ಈ ಒಪ್ಪಂದ ಜಾರಿಗೆ ಬರುವ ಮೊದಲು ಬೆಳೆಸಲ್ಪಟ್ಟಿದೆ ಅಥವಾ ಕೊಯ್ಯಲ್ಪಟ್ಟಿದೆ. ಈ ಒಪ್ಪಂದದ ಅಡಿಯಲ್ಲಿ ಯಾವುದೇ ಬೆಳೆ ಉತ್ಪಾದನಾ ಬಾಧ್ಯತೆ ಇರುವುದಿಲ್ಲ.'}
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
        <p><b>ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಶುಲ್ಕ:</b> ${formatCurrency(displayFarmerCommission)}</p>
        <p><b>ಜಿಎಸ್‌ಟಿ (18%):</b> ${formatCurrency(displayFarmerGst)}</p>
        <p><b style="font-size: 16px; color: #236902;">ಒಟ್ಟು ಮೊತ್ತ (ಕಡಿತದ ನಂತರ):</b> <b style="font-size: 16px; color: #236902;">${formatCurrency(displayNetAmountToFarmer)}</b></p>
    
        <h3 style="margin-top: 20px;">5.2 ಖರೀದಿದಾರರ ಪಾವತಿ ರಚನೆ</h3>
        <p><b>ಒಟ್ಟು ಪ್ರಮಾಣ:</b> ${totalContractQty.toLocaleString('en-IN')} ಕೆಜಿ</p>
        <p><b>ಪ್ರತಿ ಘಟಕದ ಬೆಲೆ:</b> ${formatCurrency(avgPricePerKg)} ಪ್ರತಿ ಕೆಜಿ</p>
        <p><b>ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಶುಲ್ಕ:</b> ${formatCurrency(displayBuyerCommission)}</p>
        <p><b>ಜಿಎಸ್‌ಟಿ (18%):</b> ${formatCurrency(displayBuyerGst)}</p>
        <p><b style="font-size: 16px; color: #236902;">ಪಾವತಿಸಬೇಕಾದ ಒಟ್ಟು ಮೊತ್ತ:</b> <b style="font-size: 16px; color: #236902;">${formatCurrency(totalAmountPayableByBuyer)}</b></p>
    
        <h3 style="margin-top: 20px;">5.3 ಪಾವತಿ ವೇಳಾಪಟ್ಟಿ</h3>
        <ul>
          <li><b>ಮುಂಗಡ (25%):</b> ${formatCurrency(totalAmountPayableByBuyer * 0.25)} – ಒಪ್ಪಂದ ದೃಢೀಕರಣದ ವೇಳೆ ಪಾವತಿಸಬೇಕು</li>
          <li><b>ಡಿಲಿವರಿ ಸಮಯದಲ್ಲಿ (50%):</b> ${formatCurrency(totalAmountPayableByBuyer * 0.50)} – ಯಶಸ್ವಿ ಡಿಲಿವರಿಯ ನಂತರ ಪಾವತಿಸಬೇಕು</li>
          <li><b>ಅಂತಿಮ (25%):</b> ${formatCurrency(totalAmountPayableByBuyer * 0.25)} – ಗುಣಮಟ್ಟ ಸ್ವೀಕೃತಿಯಾದ ನಂತರ 7 ಕಾರ್ಯದಿನಗಳೊಳಗೆ ಪಾವತಿಸಬೇಕು</li>
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
            ${ (dbContract && dbContract.status && String(dbContract.status).toLowerCase() === 'accepted') ?
            `<p><b>ಖರೀದಿದಾರ / ಕಂಪನಿ</b></p>
            <p>ಹೆಸರು: ${buyerName}</p>
            <p>ದಿನಾಂಕ: ${date}</p>
            ` :
    `<p>ಖರೀದಿದಾರ / ಕಂಪನಿ</p>
     <p>ಹೆಸರು: ___________________________</p>
     <p>ದಿನಾಂಕ: ___________________________</p>`
  }
          </div>
          <div class="signature-line">
            <p><b>ರೈತ / ಉತ್ಪಾದಕ</b></p>
            <p>ಹೆಸರು: ${farmerName}</p>
            <p>ದಿನಾಂಕ: ${signatureDate}</p>
          </div>
        </section>
    
        <p style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; font-size: 12px; color: #000; font-weight: bold;">
          <b>ಸಾಕ್ಷಿ:</b> AgriAI ವೇದಿಕೆ | ಡಿಜಿಟಲ್ ದಾಖಲೆ: ${new Date().toISOString()}
        </p>
    </section>
    
    </body>
    </html>`;

    // choose final HTML based on selected language; default to English `html` defined above
    let finalHtml = (selectedLang === 'hi') ? htmlHi : (selectedLang === 'kn' ? htmlKn : html);
    // insert contract number and status right after the main heading
    const numLabel = t('contractNumberLabel', selectedLang) || 'Contract Number';
    const statusLabel = t('statusLabel', selectedLang) || 'Status';
    finalHtml = finalHtml.replace('</h1>', `</h1>\n<p><strong>${numLabel}:</strong> ${contractNum}</p>\n<p><strong>${statusLabel}:</strong> ${dbContract.status || ''}</p>`);

    if (shouldPrint) {
      // For printing, create an invisible iframe and print directly without opening a new window
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
      doc.write(finalHtml);
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
      return;
    }

    const w = window.open('', '_blank');
    try { w.document.write(finalHtml); w.document.close(); } catch (e) { window.open('data:text/html;charset=utf-8,' + encodeURIComponent(finalHtml), '_blank'); }
    return w;
    };

  const printContract = async (order) => {
    try {
      await openInvoice(order, true);
    } catch (e) {
      console.warn('printContract failed', e);
    }
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
              <label style={{ marginRight: 8, fontWeight: 700, color: '#2d5c1a', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('statusLabel', siteLang) || 'Status:'}</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '10px 14px', border: '1.5px solid #d4edcc', borderRadius: 10, color: '#1a3d0a', background: 'rgba(255,255,255,0.95)', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.2s' }}
                onFocus={(e) => { e.target.style.borderColor = '#53b635'; e.target.style.boxShadow = '0 0 0 3px rgba(83,182,53,0.18), 0 2px 8px rgba(35,105,2,0.1)'; e.target.style.transform = 'translateY(-2px)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#d4edcc'; e.target.style.boxShadow = 'none'; e.target.style.transform = 'translateY(0)'; }}>
                <option value="all">{t('all', siteLang) || 'All'}</option>
                <option value="accepted">{t('accepted', siteLang) || 'Accepted'}</option>
                <option value="negotiated">{t('negotiated', siteLang) || 'Negotiated'}</option>
                <option value="rejected">{t('rejected', siteLang) || 'Rejected'}</option>
                <option value="pending">{t('pending', siteLang) || 'Pending'}</option>
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
                        <div style={{ color: '#2d5c1a', marginTop: 4, fontSize: '0.9rem' }}>
                          {(() => {
                            // Get sender from contract_b data (preferred) or fallback to contract data
                            const sender = (o._db_contract && o._db_contract.sender) || o.sender || 'farmer';
                            const senderLabel = sender === 'farmer' ? (t('sentByFarmer', siteLang) || 'Sent by Farmer') : (t('sentByBuyer', siteLang) || 'Sent by Buyer');
                            return senderLabel;
                          })()}
                        </div>
                        <div style={{ color: '#2d5c1a', marginTop: 4, fontSize: '0.9rem' }}>
                          {(() => {
                            // Prioritize created_at from contract_b (_db_contract) over contracts table
                            const createdDate = (o._db_contract && o._db_contract.created_at) || o.created_at || o.contract_datetime;
                            return formatDateTime(createdDate);
                          })()}
                        </div>
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
                          else if (s === 'negotiated') { bg = '#ffeb3b'; color = '#000'; border = '1px solid #fdd835'; }
                          else if (s === 'rejected' || s === 'declined' || s === 'cancelled') { bg = '#f44336'; color = '#fff'; border = '1px solid #e53935'; }
                          return (
                            <button disabled style={{ background: bg, color, border, padding: '8px 14px', borderRadius: 10, cursor: 'default', fontWeight: 600, fontSize: '0.85rem' }}>{(t(s, siteLang) || (st && String(st).toUpperCase()) || 'STATUS')}</button>
                          );
                        })()}
                        <button onClick={() => printContract(o)} style={{ background: '#ffffff', color: '#236902', border: '1px solid #236902', padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', boxShadow: '0 2px 8px rgba(35,105,2,0.15)', transition: 'transform 0.18s, box-shadow 0.18s, filter 0.18s' }} title={t('print', siteLang) || 'Print'}
                          onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px) scale(1.02)'; e.target.style.boxShadow = '0 6px 20px rgba(35,105,2,0.25)'; e.target.style.filter = 'brightness(1.05)'; }}
                          onMouseLeave={(e) => { e.target.style.transform = 'translateY(0) scale(1)'; e.target.style.boxShadow = '0 2px 8px rgba(35,105,2,0.15)'; e.target.style.filter = 'brightness(1)'; }}
                        >
                          🖨️
                        </button>
                        {( ((o._db_contract && (String(o._db_contract.status).toLowerCase() === 'pending' || String(o._db_contract.status).toLowerCase() === 'negotiated'))
                             || (String(o.status || '').toLowerCase() === 'pending' || String(o.status || '').toLowerCase() === 'negotiated')) && (
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



