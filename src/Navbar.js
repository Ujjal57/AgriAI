import React from 'react';
import './Navbar.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { t } from './i18n';

const Navbar = () => {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = React.useState(!!localStorage.getItem('agriai_email'));
  const [userName, setUserName] = React.useState(localStorage.getItem('agriai_name') || '');
  const [userRole, setUserRole] = React.useState(localStorage.getItem('agriai_role') || '');
  const location = useLocation();
  const [showLogin, setShowLogin] = React.useState(false);
  const [loginEmail, setLoginEmail] = React.useState('');
  const [loginPassword, setLoginPassword] = React.useState('');
  const [loginError, setLoginError] = React.useState('');
  const getCartKeyByRole = (role) => role === 'farmer' ? 'agriai_cart_farmer' : (role === 'buyer' ? 'agriai_cart_buyer' : 'agriai_cart');
  const [cartCount, setCartCount] = React.useState(() => {
    const role = localStorage.getItem('agriai_role');
    const key = getCartKeyByRole(role);
    try { const raw = localStorage.getItem(key); const arr = raw ? JSON.parse(raw) : []; return Array.isArray(arr) ? arr.length : 0; } catch (e) { return 0; }
  });
  const [farmerId, setFarmerId] = React.useState(localStorage.getItem('agriai_id') || '');
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [notifCount, setNotifCount] = React.useState(0);
  const [notifList, setNotifList] = React.useState([]);
  const [notifExpanded, setNotifExpanded] = React.useState(() => new Set());
  const [siteLang, setSiteLang] = React.useState(() => localStorage.getItem('agri_lang') || 'en');
  const [notifSelectMode, setNotifSelectMode] = React.useState(false);
  const [notifSelected, setNotifSelected] = React.useState(() => new Set());
  const [hoveredInvoice, setHoveredInvoice] = React.useState(null);
  const [showContractModal, setShowContractModal] = React.useState(false);
  const [contractHtml, setContractHtml] = React.useState('');
  const [contractLang, setContractLang] = React.useState(() => localStorage.getItem('agri_lang') || 'en');
  // persist contract language so it survives reloads
  React.useEffect(() => { try { localStorage.setItem('agri_lang', contractLang); } catch (e) {} }, [contractLang]);
  const [currentContractNotification, setCurrentContractNotification] = React.useState(null);

  React.useEffect(() => {
    if (showContractModal && currentContractNotification) {
      (async () => {
        const html = await generateContractHtml(currentContractNotification);
        setContractHtml(html);
      })();
    }
  }, [contractLang, showContractModal, currentContractNotification]);

  React.useEffect(() => {
    const onStorage = () => {
      setIsLoggedIn(!!localStorage.getItem('agriai_email'));
      setUserName(localStorage.getItem('agriai_name') || '');
      setFarmerId(localStorage.getItem('agriai_id') || '');
      try {
        const role = localStorage.getItem('agriai_role');
        const key = getCartKeyByRole(role);
        const raw = localStorage.getItem(key); const arr = raw ? JSON.parse(raw) : []; setCartCount(Array.isArray(arr) ? arr.length : 0);
      } catch (e) { setCartCount(0); }
    };
    const onLoginEvent = (ev) => {
      try {
        const d = ev && ev.detail ? ev.detail : null;
        if (d) {
          if (d.email) localStorage.setItem('agriai_email', d.email);
          if (d.role) localStorage.setItem('agriai_role', d.role);
          if (d.name) localStorage.setItem('agriai_name', d.name);
        }
      } catch (e) {}
      // re-run the storage read logic
      onStorage();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('agriai:login', onLoginEvent);
    const onLangChange = (e) => { const l = (e && e.detail && e.detail.lang) ? e.detail.lang : (localStorage.getItem('agri_lang') || 'en'); setSiteLang(l); setContractLang(l); };
    window.addEventListener('agri:lang:change', onLangChange);
    // track cart updates dispatched manually by cart page
    const onCartEvent = () => onStorage();
    window.addEventListener('agriai:cart:update', onCartEvent);
    // also poll once on mount in case localStorage changed in same tab
    onStorage();

    // If logged in but name missing, fetch profile from backend to get authoritative DB name
    (async function fetchProfileIfMissing() {
      try {
        const email = localStorage.getItem('agriai_email') || '';
        const phone = localStorage.getItem('agriai_phone') || '';
        const nameStored = localStorage.getItem('agriai_name') || '';
        if ((email || phone) && (!nameStored || !farmerId)) {
          const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');
          const body = { email: email || undefined, phone: phone || undefined };
          try {
            const res = await fetch(`${apiBase}/profile/get`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (res && res.ok) {
              const j = await res.json();
              if (j && j.user && j.user.name) {
                localStorage.setItem('agriai_name', j.user.name);
                // update state
                setUserName(j.user.name || '');
                setIsLoggedIn(true);
              }
              if (j && j.user && j.user.id) {
                try { localStorage.setItem('agriai_id', String(j.user.id)); } catch (e) {}
                setFarmerId(String(j.user.id));
              }
            }
          } catch (e) {
            // fail silently; leave name as-is
            console.warn('Navbar: failed to fetch profile for name', e);
          }
        }
      } catch (e) {}
    })();

    return () => {
      try { window.removeEventListener('storage', onStorage); } catch (e) {}
      try { window.removeEventListener('agriai:login', onLoginEvent); } catch (e) {}
      try { window.removeEventListener('agriai:cart:update', onCartEvent); } catch (e) {}
      try { window.removeEventListener('agri:lang:change', onLangChange); } catch (e) {}
    };
  }, []);

  // Fetch notifications count/list for farmer
  React.useEffect(() => {
    if (userRole !== 'farmer') {
      // For buyers, count unread local notifications
      try {
        const localKey = 'agriai_notifications';
        const rawLocal = localStorage.getItem(localKey);
        const localArr = rawLocal ? JSON.parse(rawLocal) : [];
        const relevant = Array.isArray(localArr) ? localArr.filter(n => {
          if (n && n.buyer_id) return String(n.buyer_id) === String(farmerId); // farmerId is actually userId
          return !n.buyer_id;
        }) : [];
        setNotifCount(relevant.filter(x => !(x && Number(x.is_read))).length);
      } catch (e) { setNotifCount(0); }
      return;
    }
    const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');
    let timer;
    const load = async () => {
      try {
        const qp = farmerId ? `farmer_id=${encodeURIComponent(farmerId)}` : (localStorage.getItem('agriai_phone') ? `farmer_phone=${encodeURIComponent(localStorage.getItem('agriai_phone'))}` : '');
        const url = `${apiBase}/notifications/list?${qp}&unread_only=1`;
        const res = await fetch(url);
        if (!res.ok) return;
        const j = await res.json();
        if (j && j.ok && Array.isArray(j.notifications)) {
          setNotifCount(j.notifications.length);
          // Do not overwrite the open list with unread-only results; that makes read items disappear
        }
      } catch (e) {}
    };
    load();
    timer = setInterval(load, 15000);
    return () => { try { clearInterval(timer); } catch (e) {} };
  }, [userRole, farmerId, notifOpen]);

  // When the notifications pane is open, keep the full list fresh:
  React.useEffect(() => {
    const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');
    let pollTimer = null;

    const loadFull = async () => {
      let notifs = [];
      try {
        if (userRole === 'farmer') {
          const qp = farmerId ? `farmer_id=${encodeURIComponent(farmerId)}` : (localStorage.getItem('agriai_phone') ? `farmer_phone=${encodeURIComponent(localStorage.getItem('agriai_phone'))}` : '');
          const res = await fetch(`${apiBase}/notifications/list?${qp}`);
          if (!res.ok) return;
          const j = await res.json();
          if (j && j.ok && Array.isArray(j.notifications)) {
            notifs = j.notifications;
          }
        } else {
          notifs = [];
          try {
            const cropsRes = await fetch(`${apiBase}/my-crops/list`);
            const cropsJson = await cropsRes.json();
            const crops = (cropsJson && cropsJson.crops) ? cropsJson.crops : [];
            const byId = new Map();
            crops.forEach(c => { if (c && c.id != null) byId.set(c.id, c); });
            notifs = notifs.map(n => {
              const crop = byId.get(n.crop_id) || {};
              const pricePerKg = crop.price_per_kg != null ? Number(crop.price_per_kg) : undefined;
              const category = crop.category || crop.cat || '';
              if (pricePerKg != null && n.quantity_kg != null) {
                const fees = computeNetAmount(n.crop_name, category, n.quantity_kg, pricePerKg);
                return { ...n, _price_per_kg: pricePerKg, _category: category, _net_amount: fees.net, _subtotal: fees.subtotal };
              }
              return { ...n, _price_per_kg: pricePerKg, _category: category };
            });
          } catch (e) {}

          try {
            const localKey = 'agriai_notifications';
            const rawLocal = localStorage.getItem(localKey);
            const localArr = rawLocal ? JSON.parse(rawLocal) : [];
            const relevantLocal = Array.isArray(localArr) ? localArr.filter(n => {
              if (userRole === 'farmer') {
                if (n && n.farmer_id) return String(n.farmer_id) === String(farmerId);
                return !n.farmer_id;
              } else {
                if (n && n.buyer_id) return String(n.buyer_id) === String(farmerId);
                return !n.buyer_id;
              }
            }) : [];
            const byId = new Map();
            relevantLocal.concat(notifs || []).forEach(x => { if (x && x.id) byId.set(x.id, x); else if (x) byId.set(JSON.stringify(x), x); });
            const merged = Array.from(byId.values());
            setNotifList(merged);
            // update notifCount to reflect unread in merged list
            try { setNotifCount((Array.isArray(merged) ? merged.filter(x => !(x && Number(x.is_read))).length : 0)); } catch (e) {}
          } catch (e) {
            setNotifList(notifs);
            try { setNotifCount((Array.isArray(notifs) ? notifs.filter(x => !(x && Number(x.is_read))).length : 0)); } catch (e) {}
          }
        }
      } catch (e) {}
    };

    const onEvent = () => { try { if (notifOpen) loadFull(); else {/* no-op */} } catch (e) {} };
    try { window.addEventListener('agriai:notifications:update', onEvent); } catch (e) {}

    // Only poll the full list while the pane is open
    if (notifOpen) {
      loadFull();
      pollTimer = setInterval(() => { try { loadFull(); } catch (e) {} }, 15000);
    }

    return () => {
      try { window.removeEventListener('agriai:notifications:update', onEvent); } catch (e) {}
      try { if (pollTimer) clearInterval(pollTimer); } catch (e) {}
    };
  }, [userRole, farmerId, notifOpen]);

  // Listen for local notification additions (from Cart.js) and merge them
  React.useEffect(() => {
    const handler = () => {
      try {
        const raw = localStorage.getItem('agriai_notifications');
        const arr = raw ? JSON.parse(raw) : [];
        const relevant = Array.isArray(arr) ? arr.filter(n => {
          if (n && n.farmer_id) return String(n.farmer_id) === String(farmerId);
          return !n.farmer_id;
        }) : [];
        setNotifList(prev => {
          const byId = new Map();
          relevant.concat(prev || []).forEach(x => { if (x && x.id) byId.set(x.id, x); else if (x) byId.set(JSON.stringify(x), x); });
          return Array.from(byId.values());
        });
        if (relevant.length) setNotifCount(c => c + relevant.length);
      } catch (e) {}
    };
    window.addEventListener('agriai:notifications:local:update', handler);
    return () => { try { window.removeEventListener('agriai:notifications:local:update', handler); } catch (e) {} };
  }, [farmerId]);

  const handleLogout = () => {
    // For now just navigate to login page. Clear any client-side auth if added.
    setOpen(false);
    try { localStorage.removeItem('agriai_email'); localStorage.removeItem('agriai_role'); localStorage.removeItem('agriai_name'); } catch (e) {}
    navigate('/login');
  };

  const initials = (name) => {
    if (!name) return 'U';
    const parts = String(name).trim().split(/\s+/);
    const a = (parts[0] || '').charAt(0) || '';
    const b = (parts[1] || '').charAt(0) || '';
    return (a + b).toUpperCase() || 'U';
  };

  const generateContractHtml = async (notification) => {
    try {
      const meta = notification.contract_meta || {};
      const contractNumber = notification.contract_number || '';
      
      // Fetch contract from backend to get authoritative details
      let dbContract = {};
      if (contractNumber) {
        try {
          const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');
          const res = await fetch(`${apiBase}/contracts/get/${encodeURIComponent(contractNumber)}`);
          if (res && res.ok) {
            const j = await res.json();
            if (j && j.ok && j.contract) {
              dbContract = j.contract;
            }
          }
        } catch (e) { /* ignore */ }
      }
      
      const logoSrc = window.location.origin + require('./assets/logo192.png');
      
      // Extract all variables with fallbacks to meta and notification
      const buyerName = notification.buyer_name || dbContract.buyer_name || '[Buyer Name]';
      const buyerId = notification.buyer_id || dbContract.buyer_id || '[Buyer ID]';
      const buyerAddress = meta.buyer_address || dbContract.buyer_address || '[Buyer Address]';
      const buyerState = meta.buyer_state || dbContract.buyer_state || '[Buyer State]';
      const buyerRegion = meta.buyer_region || dbContract.buyer_region || '[Buyer Region]';
      const farmerName = notification.farmer_name || dbContract.farmer_name || '[Farmer Name]';
      const farmerId = notification.farmer_id || dbContract.farmer_id || '[Farmer ID]';
      const farmerAddress = meta.farmer_address || dbContract.farmer_address || '';
      const farmerState = meta.farmer_state || dbContract.farmer_state || '[Farmer State]';
      const farmerRegion = meta.farmer_region || dbContract.farmer_region || '[Farmer Region]';
      const contractNature = meta.contract_nature || dbContract.contract_nature || 'post-harvest';
      const contractDuration = meta.contract_duration || dbContract.contract_duration || 'one-time';
      const contractType = contractDuration === 'one-time' ? 'One-Time' : (contractDuration === 'seasonal' ? 'Seasonal' : 'Yearly');
      const startDate = meta.startDate || dbContract.start_date || new Date().toLocaleDateString('en-GB');
      const endDate = meta.endDate || dbContract.end_date || new Date(Date.now() + 30 * 24 * 3600 * 1000).toLocaleDateString('en-GB');
      const days = meta.days || dbContract.duration || 30;
      const totalContractQty = meta.totalContractQty || dbContract.quantity_kg || dbContract.total_quantity || 0;
      const totalCropTradeValue = meta.totalCropTradeValue || dbContract.amount || 0;
      const avgPricePerKg = meta.avgPricePerKg || dbContract.price_per_kg || 0;
      const displayFarmerCommission = dbContract.farmer_platform_fee || meta.farmer_platform_fee || 0;
      const displayFarmerGst = dbContract.farmer_gst || meta.farmer_gst_on_fee || 0;
      const displayNetAmountToFarmer = dbContract.net_amount_payable_to_farmer || dbContract.farmer_total || (totalCropTradeValue - displayFarmerCommission - displayFarmerGst) || 0;
      const displayBuyerCommission = dbContract.buyer_platform_fee || meta.buyer_platform_fee || 0;
      const displayBuyerGst = dbContract.buyer_gst || meta.buyer_gst_on_fee || 0;
      const buyerFeeTotal = (displayBuyerCommission || 0) + (displayBuyerGst || 0);
      const totalAmountPayableByBuyer = (dbContract.buyer_total != null ? Number(dbContract.buyer_total) : (totalCropTradeValue + buyerFeeTotal));
      const deliveryRateDisplay = meta.deliveryRateDisplay || '₹-- / km';
      const labourCharge = meta.labourCharge || dbContract.labour_charge || 0;
      const qtyKg = meta.qtyKg || totalContractQty || 0;
      const date = new Date().toLocaleDateString('en-GB');
      const signatureDate = startDate;
      const buyerTotals = meta.buyer_totals || { commission: 0, gst: 0 };
      const totals = meta.farmer_totals || { commission: 0, gst: 0 };
      let items = notification.items || [];
      // if notification has no line items, fall back to single-entry fields saved in dbContract
      if ((!items || items.length === 0) && dbContract && dbContract.crop_name) {
        const qty = Number(dbContract.quantity || dbContract.quantity_kg || 0);
        const price = Number(dbContract.price_per_kg || 0);
        const amount = Math.round((qty * price + Number.EPSILON) * 100) / 100;
        items = [{
          crop_name: dbContract.crop_name,
          variety: dbContract.variety,
          order_quantity: qty,
          price_per_kg: price,
          amount
        }];
      }

      const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

      const rowsHtml = items.map((it, idx) => {
        const qty = Number(it.order_quantity || 0);
        const price = Number(it.price_per_kg || 0);
        const amount = Math.round((qty * price + Number.EPSILON) * 100) / 100;
        const varietyVal = it.variety || it.var || it.variety_name || it.varity || dbContract.variety || '';
        return `<tr>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${idx + 1}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${it.crop_name || ''}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${varietyVal}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${qty.toLocaleString('en-IN')} kg</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${formatCurrency(price)}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${formatCurrency(amount)}</td>
        </tr>`;
      }).join('');

      const langMap = { en: 'English', hi: 'Hindi', kn: 'Kannada', ta: 'Tamil', te: 'Telugu', mr: 'Marathi', bn: 'Bengali', or: 'Odia' };
      const contractLanguage = (langMap[contractLang] || contractLang || 'English');

      // include some dbContract-specific display values
      const contractNumDisplay = contractNumber || dbContract.contract_number || '';
      const contractStatus = dbContract.status || '[status]';
      const contractNumLabel = t('contractNumberLabel', siteLang) || 'Contract Number';
      const statusLabel = t('statusLabel', siteLang) || 'Status';
      const langName = contractLang === 'hi' ? 'हिंदी' : (contractLang === 'kn' ? 'ಕನ್ನಡ' : 'English');

      // Generate Hindi contract if language is Hindi
      if (contractLang === 'hi') {
        const hindiHtml = `<!doctype html>
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
<p><b>पता:</b> ${farmerAddress || ''}${farmerState ? (farmerAddress ? ', ' + farmerState : '' + farmerState) : ''}</p>
<p>
  पक्ष A और पक्ष B को सामूहिक रूप से "पक्षकार" कहा जाएगा।
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
<p>कुल अवधि: ${days} दिन</p>
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
  यदि अस्वीकृति उचित एवं प्रमाणित पाई जाती है, तो वापसी परिवहन व्यय खरीदार द्वारा वहन किया जाएगा।
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
</p>

<p>
  किसी भी बीमा दावे के अंतर्गत प्राप्त क्षतिपूर्ति राशि पर पूर्ण अधिकार केवल किसान का होगा।
</p>

<p>
  सफल डिलीवरी एवं स्वीकृति के पश्चात उपज से संबंधित सभी जोखिम, स्वामित्व एवं दायित्व पूर्णतः खरीदार को हस्तांतरित हो जाएंगे।
</p>

</section>

<section class="section">
<h2>9. अप्रत्याशित परिस्थितियाँ</h2>

<p>
  किसी भी पक्ष को ऐसी परिस्थितियों के कारण हुई विफलता या विलंब के लिए उत्तरदायी नहीं ठहराया जाएगा,
  जो उसके उचित नियंत्रण से परे हों, जिनमें प्राकृतिक आपदाएँ, सरकारी प्रतिबंध, युद्ध, हड़ताल शामिल हैं।
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
</p>

<p>
  मध्यस्थता के अधीन रहते हुए, इस अनुबंध से संबंधित प्रवर्तन एवं अन्य कानूनी कार्यवाहियों के लिए
  <strong>बेंगलुरु, कर्नाटक</strong> की न्यायालयों को विशेष अधिकार क्षेत्र प्राप्त होगा।
</p>
</section>

<section class="section">
<h2>11. समाप्ति</h2>

<p>
  किसी भी पक्ष द्वारा इस अनुबंध की किसी महत्वपूर्ण शर्त के उल्लंघन की स्थिति में,
  जिसमें भुगतान न करना, डिलीवरी न करना, मिथ्या प्रस्तुतीकरण या सहमत शर्तों का उल्लंघन शामिल है,
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
        return hindiHtml;
      }

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
  <p><b>Address:</b> ${buyerAddress || '[Buyer Address]'}${buyerState ? ', ' + buyerState : ''}</p>
  <p><strong>Party B – Farmer / Producer</strong></p>
  <p><b>Name:</b> ${farmerName}</p>
  <p><b>Farmer ID:</b> ${farmerId}</p>
  <p><b>Address:</b> ${farmerAddress || ''}${farmerState ? (farmerAddress ? ', ' + farmerState : '' + farmerState) : ''}</p>
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
      return html;
    } catch (e) {
      console.error('generateContractHtml failed', e);
      return '<html><body>Error generating contract</body></html>';
    }
  };

  // Compute GST and platform fee similar to Cart.js rules
  const computeNetAmount = (name, category, quantityKg, pricePerKg) => {
    const qty = Number(quantityKg || 0);
    const price = Number(pricePerKg || 0);
    const subtotal = qty * price;
    const cat = (category || '').toString().toLowerCase();
    let gstRate = 0;
    let commissionRate = 0;
    if (cat.includes('masala') || cat.includes('masalas')) {
      gstRate = 5; commissionRate = 15;
    } else if (cat.includes('fruit') || cat.includes('vegetable')) {
      gstRate = 0; commissionRate = 12;
    } else if (cat.includes('crop') || cat.includes('crops')) {
      gstRate = 0; commissionRate = 8;
    } else {
      const nm = (name || '').toString().toLowerCase();
      if (nm.includes('masala')) { gstRate = 5; commissionRate = 15; }
      else if (nm.includes('fruit') || nm.includes('vegetable')) { gstRate = 0; commissionRate = 12; }
      else { gstRate = 0; commissionRate = 8; }
    }
    const gstAmt = (subtotal * gstRate) / 100;
    const platformFee = (subtotal * commissionRate) / 100;
    const net = subtotal - gstAmt - platformFee;
    return { subtotal, gstAmt, platformFee, net };
  };

  const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const formatDateTime = (iso) => {
    try { const d = new Date(iso); if (isNaN(d)) return String(iso); return d.toLocaleString(); } catch (e) { return String(iso); }
  };
  const translateVar = (val) => {
    try {
      const raw = (val || '').toString().trim(); if (!raw) return '';
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
        try { const out = t(k, siteLang); if (out && out !== k) return out; } catch (e) {}
      }
      return raw;
    } catch (e) { return val || ''; }
  };
  const getPlatformRate = (name, category) => {
    try {
      const cat = (category || '').toString().toLowerCase();
      const nm = (name || '').toString().toLowerCase();
      if (cat.includes('fruit') || nm.includes('fruit') || cat.includes('vegetable') || nm.includes('vegetable')) return 0.09;
      if (cat.includes('crop') || nm.includes('crop') || nm.includes('food') || nm.includes('grain') || nm.includes('rice') || nm.includes('wheat')) return 0.07;
      return 0.12;
    } catch (e) { return 0.12; }
  };

  const doInlineLogin = async (e) => {
    e && e.preventDefault && e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('http://127.0.0.1:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const j = await res.json();
      if (!res.ok) {
        setLoginError(j.error || 'Login failed');
        return;
      }
      const role = j.role;
      const name = j.name || (j.user && j.user.name) || '';
      try {
        localStorage.setItem('agriai_email', loginEmail);
        localStorage.setItem('agriai_role', role);
        localStorage.setItem('agriai_name', name);
        if (j && j.user && j.user.phone) localStorage.setItem('agriai_phone', j.user.phone);
      } catch (e) {}
      try { window.dispatchEvent(new CustomEvent('agriai:login', { detail: { email: loginEmail, role, name } })); } catch (e) {}
      setShowLogin(false);
      setLoginEmail(''); setLoginPassword('');
      if (role === 'buyer') {
        if (location.pathname === '/login') navigate('/');
      } else {
        navigate(`/dashboard/${role}`);
      }
    } catch (e) {
      setLoginError('Error connecting to server');
    }
  };

  const isBuyer = userRole === 'buyer';

  return (<>
    <nav className="navbar">
      <div className="navbar-logo-group">
        <span className="navbar-logo-circle">
          <img src={require('./assets/logo192.png')} alt="AgriAI Logo" className="navbar-logo-img" />
        </span>
        <span className="navbar-logo">{t('siteName', siteLang)}</span>
      </div>
      <div className="navbar-right">
        <ul className={`navbar-links ${(userRole === 'farmer' || userRole === 'buyer') ? 'centered' : ''}`}>
          <li><Link to="/" className="navbar-link-anim navbar-link-bold">{t('navHome', siteLang)}</Link></li>
          {/* Show Contact Us only for guests (hide when signed in) */}
          {!isLoggedIn && (
            <li><Link to="/contact" className="navbar-link-anim navbar-link-bold">{t('navContact', siteLang)}</Link></li>
          )}
          {userRole === 'buyer' && (
            <>
              <li><Link to="/dashboard/farmer" className="navbar-link-anim navbar-link-bold">{t('navFarmers', siteLang)}</Link></li>
              <li><Link to="/my-deals" className="navbar-link-anim navbar-link-bold">{t('navMyDeals', siteLang)}</Link></li>
              {userRole === 'buyer' && cartCount > 0 && (
                <li style={{position:'relative'}}>
                  <Link to="/cart" className="navbar-link-anim navbar-link-bold">{t('navCart', siteLang)}</Link>
                  <span style={{position:'absolute', top:-8, right:-12, background:'#d32f2f', color:'#fff', borderRadius:10, padding:'0 6px', fontSize:12, lineHeight:'18px', height:18, minWidth:18, textAlign:'center'}}>{cartCount}</span>
                </li>
              )}
            </>
          )}
          {userRole === 'farmer' && (
            <>
              <li><Link to="/dashboard/buyer" className="navbar-link-anim navbar-link-bold">{t('navBuyers', siteLang)}</Link></li>
              <li><Link to="/my-crops" className="navbar-link-anim navbar-link-bold">{t('navMyCrops', siteLang)}</Link></li>
              {userRole === 'farmer' && cartCount > 0 && (
                <li style={{position:'relative'}}>
                  <Link to="/farmer/cart" className="navbar-link-anim navbar-link-bold">{t('navCart', siteLang)}</Link>
                  <span style={{position:'absolute', top:-8, right:-12, background:'#d32f2f', color:'#fff', borderRadius:10, padding:'0 6px', fontSize:12, lineHeight:'18px', height:18, minWidth:18, textAlign:'center'}}>{cartCount}</span>
                </li>
              )}
            </>
          )}
        </ul>
        {/* Language selector */}
        <div style={{display:'inline-flex', alignItems:'center', marginRight:-30}}>
          <select value={siteLang} onChange={e => {
            const l = e.target.value; setSiteLang(l); try { localStorage.setItem('agri_lang', l); } catch (e) {}
            try { window.dispatchEvent(new CustomEvent('agri:lang:change', { detail: { lang: l } })); } catch (e) {}
          }} aria-label="Site language" style={{padding:'3px 1px', border:'1px solid #e6e6e6', background:'#fff'}}>
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="kn">ಕನ್ನಡ</option>
          </select>
        </div>

        {/* Bell: show for signed-in users; for farmers this shows purchase notifications */}
        <div style={{display:'flex', gap:2, alignItems:'center'}}></div>
        {isLoggedIn && location.pathname !== '/login' && location.pathname !== '/signup' && (
          <button
            className="navbar-message-btn"
            aria-label="Open notifications"
            onClick={async () => {
              // Toggle notifications panel for both farmers and buyers.
              setNotifOpen(o => !o);
              if (!notifOpen) {
                if (userRole === 'farmer') {
                  try {
                    const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');
                    const qp = farmerId ? `farmer_id=${encodeURIComponent(farmerId)}` : (localStorage.getItem('agriai_phone') ? `farmer_phone=${encodeURIComponent(localStorage.getItem('agriai_phone'))}` : '');
                    const res = await fetch(`${apiBase}/notifications/list?${qp}`);
                    const j = await res.json();
                    if (j && j.ok && Array.isArray(j.notifications)) {
                      let notifs = j.notifications;
                      try {
                        // Fetch crops to get price/category for net amount calculation
                        const cropsRes = await fetch(`${apiBase}/my-crops/list`);
                        const cropsJson = await cropsRes.json();
                        const crops = (cropsJson && cropsJson.crops) ? cropsJson.crops : [];
                        const byId = new Map();
                        crops.forEach(c => { if (c && c.id != null) byId.set(c.id, c); });
                        notifs = notifs.map(n => {
                          const crop = byId.get(n.crop_id) || {};
                          const pricePerKg = crop.price_per_kg != null ? Number(crop.price_per_kg) : undefined;
                          const category = crop.category || crop.cat || '';
                          if (pricePerKg != null && n.quantity_kg != null) {
                            const fees = computeNetAmount(n.crop_name, category, n.quantity_kg, pricePerKg);
                            return { ...n, _price_per_kg: pricePerKg, _category: category, _net_amount: fees.net, _subtotal: fees.subtotal };
                          }
                          return { ...n, _price_per_kg: pricePerKg, _category: category };
                        });
                      } catch (e) {}
                      try {
                        const localKey = 'agriai_notifications';
                        const rawLocal = localStorage.getItem(localKey);
                        const localArr = rawLocal ? JSON.parse(rawLocal) : [];
                        const relevantLocal = Array.isArray(localArr) ? localArr.filter(n => {
                          if (n && n.farmer_id) return String(n.farmer_id) === String(farmerId);
                          return !n.farmer_id;
                        }) : [];
                        const byId = new Map();
                        // local first so they appear on top
                        relevantLocal.concat(notifs || []).forEach(x => { if (x && x.id) byId.set(x.id, x); else if (x) byId.set(JSON.stringify(x), x); });
                        const merged = Array.from(byId.values());
                        setNotifList(merged);
                      } catch (e) {
                        setNotifList(notifs);
                      }
                    }
                  } catch (e) {}
                } else {
                  // For non-farmer users (buyers), load notifications from localStorage
                  try {
                    const raw = localStorage.getItem('agriai_notifications');
                    const arr = raw ? JSON.parse(raw) : [];
                    const buyerId = localStorage.getItem('agriai_id');
                    const relevant = Array.isArray(arr) ? arr.filter(n => {
                      if (!n) return false;
                      if (n.buyer_id) return String(n.buyer_id) === String(buyerId);
                      if (!n.farmer_id && !n.buyer_id) return true;
                      return false;
                    }) : [];
                    setNotifList(relevant);
                    const unread = Array.isArray(relevant) ? relevant.filter(x => !(x && Number(x.is_read))).length : 0;
                    setNotifCount(unread);
                  } catch (e) {}
                }
              }
            }}
            style={{background:'none', border:'none', marginLeft:2, marginRight:2, cursor:'pointer', display:'inline-flex', alignItems:'center'}}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2z" fill="#236902" />
              <path d="M18 16v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5S10.5 3.17 10.5 4v.68C7.63 5.36 6 7.92 6 11v5l-1.99 2H20l-2-2z" fill="#236902" />
            </svg>
            {notifCount > 0 && (
              <span style={{position:'relative', left:-6, top:-10, background:'#d32f2f', color:'#fff', borderRadius:10, padding:'0 6px', fontSize:12, lineHeight:'18px', height:18, minWidth:18, textAlign:'center'}}>{notifCount}</span>
            )}
          </button>
        )}
            {notifOpen && (userRole === 'farmer' || userRole === 'buyer') && (
              <div style={{
                position: 'absolute', right: 72, top: 56, background: '#fff', border: '2px solid #c7f1c3',
                boxShadow: '0 12px 38px 0 rgba(32,101,67,0.13)', borderRadius: 18, minWidth: 340, maxWidth: 400, zIndex: 250,
                padding: 0, overflow: 'hidden'
              }}>
                  <div style={{padding:'12px 16px', borderBottom:'1px solid #eaf6ea', background:'#f9fffa', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div style={{fontWeight:800, color:'#197a50', display:'flex', alignItems:'center', gap:8}}>🔔 <span>{t('Notifications', siteLang) || 'Notifications'}</span></div>
                  <div style={{display:'flex', gap:8}}>
                    <button onClick={async ()=>{
                      try {
                        // Collect unread ids from current list
                        const unreadIds = (Array.isArray(notifList) ? notifList.filter(x => !(x && Number(x.is_read))) : []).map(x => x && x.id).filter(Boolean);
                        // If we have server-side ids, call backend to mark them read
                        const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');
                        if (unreadIds.length) {
                          try {
                            await fetch(`${apiBase}/notifications/mark-read`, {
                              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: unreadIds })
                            });
                          } catch (e) {
                            // ignore network errors; will still update UI locally
                          }
                        }
                        // Update local state and localStorage as canonical client-side view
                        setNotifList(list => (Array.isArray(list) ? list.map(n=>({ ...n, is_read: 1 })) : list));
                        setNotifCount(0);
                        try {
                          const raw = localStorage.getItem('agriai_notifications');
                          const arr = raw ? JSON.parse(raw) : [];
                          const updated = Array.isArray(arr) ? arr.map(x => ({ ...(x||{}), is_read: 1 })) : arr;
                          localStorage.setItem('agriai_notifications', JSON.stringify(updated));
                        } catch (e) {}
                      } catch (e) {}
                    }} style={{background:'#ecf8f2', color:'#236902', border:'none', borderRadius:8, padding:'6px 10px', fontWeight:700}}>{t('markAll', siteLang) || 'Mark all'}</button>
                  </div>
                </div>
                <div style={{maxHeight:360, overflowY:'auto', padding:8}}>
                  {(!notifList || !notifList.length) && (
                    <div style={{padding:'30px 0', textAlign:'center', color:'#a2b2aa'}}>
                      <div style={{fontSize:40}}>🛎️</div>
                      <div style={{fontSize:16, fontWeight:600}}>{t('noNotifications', siteLang) || 'No notifications yet'}</div>
                    </div>
                  )}
                  {Array.isArray(notifList) && notifList.map(n => {
                    const items = Array.isArray(n.items) ? n.items : (n.items ? [n.items] : []);
                    const computedSubtotal = items.reduce((s,it) => s + ((Number(it.price_per_kg||it._price_per_kg||0)) * Number(it.order_quantity||it.quantity_kg||0 || 0)), 0);
                    // compute platform fee and gst same as invoice view: platformFee = total * rate; gst = platformFee * 0.18
                    let platformSum = 0; let gstSum = 0;
                    items.forEach(it => {
                      try {
                        const price = Number(it.price_per_kg || it._price_per_kg || 0);
                        const qty = Number(it.order_quantity || it.quantity_kg || 0) || 0;
                        const total = price * qty;
                        const rate = getPlatformRate(it.crop_name || it.name || '', it._category || it.category || it.cat || '');
                        const platformFee = total * (Number(rate) || 0);
                        const gst = platformFee * 0.18;
                        platformSum += platformFee;
                        gstSum += gst;
                      } catch (e) {}
                    });
                    const computedGrandTotal = computedSubtotal - platformSum - gstSum;
                    // compute base grand total from items
                    let grandTotal = computedGrandTotal;
                    // prefer explicit buyer totals provided via notification payload or contract_meta
                    if (n.buyer_fee_total != null && n.total_amount_payable != null) {
                      grandTotal = Number(n.total_amount_payable);
                    } else if (n.contract_meta && n.contract_meta.totalAmountPayableByBuyer != null) {
                      grandTotal = Number(n.contract_meta.totalAmountPayableByBuyer);
                    }
                    const totals = (n && n.totals && typeof n.totals === 'object') ? {
                      subtotal: (n.totals.subtotal != null ? n.totals.subtotal : computedSubtotal),
                      platform_fee: (n.totals.platform_fee != null ? n.totals.platform_fee : platformSum),
                      gst: (n.totals.gst != null ? n.totals.gst : gstSum),
                      grand_total: (n.totals.grand_total != null ? n.totals.grand_total : grandTotal)
                    } : { subtotal: computedSubtotal, gst: gstSum, platform_fee: platformSum, grand_total: grandTotal };
                    const contractNum = n.contract_number || n.invoice_id;
                    const invoiceId = contractNum || (`INV${n.id || Date.now()}`);
                    const label = n.contract_number ? (t('contractLabel', siteLang) || 'Contract') : (t('invoiceLabel', siteLang) || 'Invoice');
                    const createdAtRaw = n.created_at || n.createdAt || Date.now();
                    const createdDateObj = new Date(createdAtRaw);
                    const createdDate = isNaN(createdDateObj) ? String(createdAtRaw) : createdDateObj.toLocaleDateString();
                    return (
                      <div key={n.id || invoiceId} style={{border:'1px solid #eee', borderRadius:8, overflow:'hidden', margin:'8px 6px', background: n.is_read ? '#fff' : '#eafff1'}}>
                        <div style={{padding:'12px 14px', background:'#f7faf7', display:'flex', flexDirection:'column', gap:8}}>
                          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div style={{fontWeight:800, color:'#236902', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginRight:10}}>{label + ': '}{invoiceId}</div>
                            <div style={{fontWeight:800, color:'#236902'}}>{formatCurrency(totals.grand_total)}</div>
                          </div>
                          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div style={{color:'#000', fontSize:13}}>{t('dateLabel', siteLang) || 'Date'}: {createdDate}</div>
                            <div style={{display:'flex', alignItems:'center', gap:8}}>
                              {/* selection removed: Clear/delete feature disabled per request */}
                              <button onClick={async () => {
                                if (userRole === 'buyer') {
                                  // For buyers, show contract modal
                                  setCurrentContractNotification(n);
                                  const html = await generateContractHtml(n);
                                  setContractHtml(html);
                                  setShowContractModal(true);
                                } else {
                                  // For farmers, show invoice in new window
                                  try {
                                    const date = formatDateTime(n.created_at || n.createdAt || Date.now());
                                    const logoSrc = window.location.origin + require('./assets/logo192.png');
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
                                          .footer { margin-top: 20px; font-size: 14px; color: #555; text-align: center; }
                                          #printBtn { background-color: #236902; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 15px; margin: 15px auto; display: block; }
                                          #printBtn:hover { background-color: #1a4f02; }
                                        </style>
                                      </head>
                                      <body>
                                        <div style="text-align:center;"><img src="${logoSrc}" alt="AgriAI Logo" style="width:100px;height:100px;display:block;margin:0 auto 10px auto;" /><h1>${t('invoiceTitle', siteLang) || 'Agri AI Invoice'}</h1></div>
                                        <p><strong>${t('invoiceIdLabel', siteLang) || 'Invoice ID:'}</strong> ${invoiceId}<br /><strong>${t('dateLabel', siteLang) || 'Date:'}</strong> ${date}</p>
                                        <table>
                                          <thead>
                                            <tr>
                                              <th>${t('tableIndex', siteLang) || 'S No'}</th>
                                              <th>${t('tableCropName', siteLang) || 'Crop Name'}</th>
                                              <th>${t('tableVariety', siteLang) || 'Variety'}</th>
                                              <th>${t('tableQuantity', siteLang) || 'Quantity (kg)'}</th>
                                              <th>${t('tablePricePerKg', siteLang) || 'Price/kg'}</th>
                                              <th>${t('tableTotal', siteLang) || 'Total'}</th>
                                              <th>${t('platformFeeLabel', siteLang) || 'Platform Fee'}</th>
                                              <th>${t('gstLabel', siteLang) || 'GST (18%)'}</th>
                                            </tr>
                                          </thead>
                                          <tbody>`;
                                    let subtotalSum = 0, platformSum = 0, gstSum = 0;
                                    items.forEach((it, idx) => {
                                      const price = Number(it.price_per_kg || it._price_per_kg || 0);
                                      const qty = Number(it.order_quantity || it.quantity_kg || 0);
                                      const total = price * qty;
                                      const rate = getPlatformRate(it.crop_name || it.name || '', it._category || it.category || it.cat || '');
                                      const platformFee = total * rate;
                                      const gst = platformFee * 0.18;
                                      subtotalSum += total;
                                      platformSum += platformFee;
                                      gstSum += gst;
                                      html += `<tr><td>${idx+1}</td><td>${it.crop_name||''}</td><td>${translateVar(it.variety)||''}</td><td>${qty}</td><td>₹${price}</td><td>₹${total.toFixed(2)}</td><td>₹${platformFee.toFixed(2)}</td><td>₹${gst.toFixed(2)}</td></tr>`;
                                    });
                                    const grandTotal = subtotalSum - platformSum - gstSum;
                                    html += `</tbody></table>
                                    <div style="text-align:right;margin-top:10px;color:#000;">
                                      <div>${t('subTotalLabel', siteLang) || 'Sub Total'}: ₹${subtotalSum.toFixed(2)}</div>
                                      <div>${t('platformFeeTotalLabel', siteLang) || 'Platform Fee'}: ₹${platformSum.toFixed(2)}</div>
                                      <div>${t('gstTotalLabel', siteLang) || 'GST'}: ₹${gstSum.toFixed(2)}</div>
                                      <h3 style="color:#236902;">${t('grandTotalLabel', siteLang) || 'Grand Total'}: ₹${grandTotal.toFixed(2)}</h3>
                                      <div><strong>${t('paymentMethod', siteLang) || 'Payment Method:'}</strong> ${(n.payment_method === 'cod' ? (t('cashOnDelivery', siteLang) || 'Cash on Delivery') : (t('online', siteLang) || 'Online'))}</div>
                                    </div>
                                    <div class="footer"><p>${t('thankYou', siteLang) || 'Thank you for choosing Agri AI!'}</p></div>
                                    <button id="printBtn" onclick="window.print()">${t('printButton', siteLang) || 'Print / Save as PDF'}</button></body></html>`;
                                    const w = window.open('', '_blank'); w.document.write(html); w.document.close();
                                  } catch (e) {}
                                }
                              }}
                                onMouseDown={e => { try { e.currentTarget.style.transform = 'translateY(1px) scale(0.99)'; } catch(_){} }}
                                onMouseUp={e => { try { e.currentTarget.style.transform = ''; } catch(_){} }}
                                onMouseLeave={e => { try { e.currentTarget.style.transform = ''; setHoveredInvoice(null); } catch(_){} }}
                                onMouseEnter={e => { try { setHoveredInvoice(invoiceId); } catch(_){} }}
                                aria-label={userRole === 'buyer' ? 'View Contract' : (t('viewInvoice', siteLang) || 'View Invoice')}
                                style={{ background: hoveredInvoice === invoiceId ? '#155a9e' : '#1976d2', color:'#fff', border:'none', padding:'5px 8px', borderRadius:6, fontSize:13, lineHeight:1, marginTop:0, transition:'transform .08s ease, background .08s ease', cursor:'pointer' }}
                              >{userRole === 'buyer' ? 'View Contract' : (t('viewInvoice', siteLang) || 'View Invoice')}</button>
                            </div>
                          </div>
                        </div>
                            
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
        <div style={{position: 'relative'}}>
          <button className="navbar-profile-btn" aria-label="Profile" onClick={() => {
            if (!isLoggedIn) { navigate('/login'); return; }
            setOpen(o => !o);
          }}>
            <span className="navbar-profile-circle" style={{display:'inline-flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:18, background:'#e6f4ea', color:'#236902', fontWeight:800}}>
              {isLoggedIn ? initials(userName) : '👤'}
            </span>
          </button>
          {open && (
            <div className="navbar-profile-menu" style={{position:'absolute', right:0, top:52, background:'#fff', border:'1px solid #eee', boxShadow:'0 8px 24px rgba(0,0,0,0.12)', borderRadius:8, minWidth:220, zIndex:200}}>
              <div style={{display:'flex', gap:12, alignItems:'center', padding:'12px 14px', borderBottom: '1px solid #f1f1f1'}}>
                <div style={{width:48, height:48, borderRadius: 24, background:'#e6f4ea', display:'flex', alignItems:'center', justifyContent:'center', color:'#236902', fontWeight:800}}>{initials(userName)}</div>
                <div style={{flex:1, textAlign:'left'}}>
                  <div style={{fontWeight:700, color:'#236902'}}>{userName || 'Profile'}</div>
                  <div style={{fontSize:12, color:'#000000ff'}}>{userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'User'}</div>
                </div>
              </div>
              <div className="navbar-profile-links">
                  <Link to="/profile" onClick={() => setOpen(false)} className="navbar-profile-link">{t('navUpdateDetails', siteLang)}</Link>
                  <Link to={userRole === 'farmer' ? "/farmer/history" : "/history"} onClick={() => setOpen(false)} className="navbar-profile-link">{t('navHistory', siteLang)}</Link>
                  <Link to="/contact" onClick={() => setOpen(false)} className="navbar-profile-link">{t('navContact', siteLang)}</Link>
                  <div className="navbar-profile-divider" />
                  <button onClick={handleLogout} className="navbar-profile-logout">{t('navLogout', siteLang)}</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Inline Sign-In Modal */}
      {showLogin && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{width:420, maxWidth:'92vw', background:'#fff', borderRadius:10, boxShadow:'0 12px 32px rgba(0,0,0,0.2)', overflow:'hidden'}}>
            <div style={{padding:'14px 16px', background:'#f7faf7', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div style={{fontWeight:800, color:'#236902'}}>Sign in to AgriAI</div>
              <button onClick={() => setShowLogin(false)} style={{background:'none', border:'none', fontSize:20, lineHeight:1, cursor:'pointer'}}>×</button>
            </div>
            <form onSubmit={doInlineLogin} style={{padding:'16px'}}>
              <div style={{display:'grid', gap:10}}>
                <div>
                  <div style={{fontWeight:700, fontSize:13, marginBottom:6}}>Email</div>
                  <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="you@example.com" style={{width:'100%', padding:10, border:'1px solid #e5e5e5', borderRadius:6}} />
                </div>
                <div>
                  <div style={{fontWeight:700, fontSize:13, marginBottom:6}}>Password</div>
                  <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" style={{width:'100%', padding:10, border:'1px solid #e5e5e5', borderRadius:6}} />
                </div>
                {loginError && <div style={{color:'#d32f2f', fontSize:13}}>{loginError}</div>}
                <button type="submit" style={{background:'#236902', color:'#fff', border:'none', borderRadius:6, padding:'10px 12px', fontWeight:700}}>Sign In</button>
                <div style={{fontSize:13, color:'#555', textAlign:'center'}}>New here? <span onClick={() => { setShowLogin(false); navigate('/login'); }} style={{color:'#236902', cursor:'pointer', fontWeight:700}}>Create an account</span></div>
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
    {showContractModal && (
      <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center'}}>
        <div style={{width:'90vw', maxWidth:800, height:'90vh', background:'#fff', borderRadius:8, boxShadow:'0 12px 40px rgba(0,0,0,0.25)', display:'flex', flexDirection:'column'}}>
          <div style={{padding:'12px 16px', background:'#f7faf7', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #e5e5e5', position:'relative'}}>
            <div style={{width:200}} />
            <div style={{position:'absolute', left:0, right:0, textAlign:'center', fontWeight:800, color:'#236902', pointerEvents:'none'}}>AgriAI Contract</div>
            <div style={{display:'flex', gap:8, alignItems:'center', zIndex:2}}>
              
              <button onClick={() => {
                const blob = new Blob([contractHtml], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'procurement_contract.html';
                a.click();
                URL.revokeObjectURL(url);
              }} style={{background:'#236902', color:'#fff', border:'none', borderRadius:4, padding:'6px 12px', cursor:'pointer'}}>Download</button>
              <button onClick={() => window.print()} style={{background:'#1976d2', color:'#fff', border:'none', borderRadius:4, padding:'6px 12px', cursor:'pointer'}}>Print</button>
              <button onClick={() => setShowContractModal(false)} style={{background:'none', border:'none', fontSize:20, lineHeight:1, cursor:'pointer'}}>×</button>
            </div>
          </div>
          <div style={{flex:1, overflow:'auto', padding:0}}>
            <iframe srcDoc={contractHtml} style={{width:'100%', height:'100%', border:'none'}} title="Contract Preview" />
          </div>
        </div>
      </div>
    )}
  </> );
};

export default Navbar;
