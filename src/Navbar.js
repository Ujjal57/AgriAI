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
    const onLangChange = (e) => { const l = (e && e.detail && e.detail.lang) ? e.detail.lang : (localStorage.getItem('agri_lang') || 'en'); setSiteLang(l); };
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
    if (userRole !== 'farmer') return;
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
    if (userRole !== 'farmer') return;
    const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');
    let pollTimer = null;

    const loadFull = async () => {
      try {
        const qp = farmerId ? `farmer_id=${encodeURIComponent(farmerId)}` : (localStorage.getItem('agriai_phone') ? `farmer_phone=${encodeURIComponent(localStorage.getItem('agriai_phone'))}` : '');
        const res = await fetch(`${apiBase}/notifications/list?${qp}`);
        if (!res.ok) return;
        const j = await res.json();
        if (j && j.ok && Array.isArray(j.notifications)) {
          let notifs = j.notifications || [];
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
              if (n && n.farmer_id) return String(n.farmer_id) === String(farmerId);
              return !n.farmer_id;
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

  return (
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
              <li><Link to="/market" className="navbar-link-anim navbar-link-bold">{t('navMarket', siteLang)}</Link></li>
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
              <li><Link to="/market" className="navbar-link-anim navbar-link-bold">{t('navMarket', siteLang)}</Link></li>
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
        {isLoggedIn && (
          <button
            className="navbar-message-btn"
            aria-label="Open notifications"
            onClick={async () => {
              if (userRole !== 'farmer') { try { window.dispatchEvent(new Event('open-chatbot')); } catch (e) {} return; }
              setNotifOpen(o => !o);
              if (!notifOpen) {
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
              }
            }}
            style={{background:'none', border:'none', marginLeft:2, marginRight:2, cursor:'pointer', display:'inline-flex', alignItems:'center'}}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2z" fill="#236902" />
              <path d="M18 16v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5S10.5 3.17 10.5 4v.68C7.63 5.36 6 7.92 6 11v5l-1.99 2H20l-2-2z" fill="#236902" />
            </svg>
            {userRole === 'farmer' && notifCount > 0 && (
              <span style={{position:'relative', left:-6, top:-10, background:'#d32f2f', color:'#fff', borderRadius:10, padding:'0 6px', fontSize:12, lineHeight:'18px', height:18, minWidth:18, textAlign:'center'}}>{notifCount}</span>
            )}
          </button>
        )}
            {notifOpen && userRole === 'farmer' && (
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
                    const totals = (n && n.totals && typeof n.totals === 'object') ? {
                      subtotal: (n.totals.subtotal != null ? n.totals.subtotal : computedSubtotal),
                      platform_fee: (n.totals.platform_fee != null ? n.totals.platform_fee : platformSum),
                      gst: (n.totals.gst != null ? n.totals.gst : gstSum),
                      grand_total: (n.totals.grand_total != null ? n.totals.grand_total : (n.totals.grandTotal != null ? n.totals.grandTotal : computedGrandTotal))
                    } : { subtotal: computedSubtotal, gst: gstSum, platform_fee: platformSum, grand_total: computedGrandTotal };
                    const invoiceId = n.invoice_id || (`INV${n.id || Date.now()}`);
                    const createdAtRaw = n.created_at || n.createdAt || Date.now();
                    const createdDateObj = new Date(createdAtRaw);
                    const createdDate = isNaN(createdDateObj) ? String(createdAtRaw) : createdDateObj.toLocaleDateString();
                    const createdTime = isNaN(createdDateObj) ? '' : createdDateObj.toLocaleTimeString();
                    return (
                      <div key={n.id || invoiceId} style={{border:'1px solid #eee', borderRadius:8, overflow:'hidden', margin:'8px 6px', background: n.is_read ? '#fff' : '#eafff1'}}>
                        <div style={{padding:'12px 14px', background:'#f7faf7', display:'flex', flexDirection:'column', gap:8}}>
                          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div style={{fontWeight:800, color:'#236902', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginRight:10}}>{(t('invoiceLabel', siteLang) || 'Invoice') + ': '}{invoiceId}</div>
                            <div style={{fontWeight:800, color:'#236902'}}>{formatCurrency(totals.grand_total)}</div>
                          </div>
                          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div style={{color:'#000', fontSize:13}}>{t('dateLabel', siteLang) || 'Date'}: {createdDate}{createdTime ? (' ' + createdTime) : ''}</div>
                            <div style={{display:'flex', alignItems:'center', gap:8}}>
                              {/* selection removed: Clear/delete feature disabled per request */}
                              <button onClick={() => {
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
                                }}
                                onMouseDown={e => { try { e.currentTarget.style.transform = 'translateY(1px) scale(0.99)'; } catch(_){} }}
                                onMouseUp={e => { try { e.currentTarget.style.transform = ''; } catch(_){} }}
                                onMouseLeave={e => { try { e.currentTarget.style.transform = ''; setHoveredInvoice(null); } catch(_){} }}
                                onMouseEnter={e => { try { setHoveredInvoice(invoiceId); } catch(_){} }}
                                aria-label={t('viewInvoice', siteLang) || 'View Invoice'}
                                style={{ background: hoveredInvoice === invoiceId ? '#155a9e' : '#1976d2', color:'#fff', border:'none', padding:'5px 8px', borderRadius:6, fontSize:13, lineHeight:1, marginTop:0, transition:'transform .08s ease, background .08s ease', cursor:'pointer' }}
                              >{t('viewInvoice', siteLang) || 'View Invoice'}</button>
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
  );
};

export default Navbar;
