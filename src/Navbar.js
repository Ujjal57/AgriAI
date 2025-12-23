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
  const [siteLang, setSiteLang] = React.useState(() => localStorage.getItem('agri_lang') || 'en');
  const [notifSelectMode, setNotifSelectMode] = React.useState(false);
  const [notifSelected, setNotifSelected] = React.useState(() => new Set());

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

  return (
    <nav className="navbar">
      <div className="navbar-logo-group">
        <span className="navbar-logo-circle">
          <img src={require('./assets/logo192.png')} alt="AgriAI Logo" className="navbar-logo-img" />
        </span>
        <span className="navbar-logo">{t('siteName', siteLang)}</span>
      </div>
      <div className="navbar-right">
        <ul className="navbar-links">
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
              <li><Link to="/dashboard/buyer" className="navbar-link-anim navbar-link-bold">Buyers</Link></li>
              <li><Link to="/my-crops" className="navbar-link-anim navbar-link-bold">My Crops</Link></li>
              <li><Link to="/market" className="navbar-link-anim navbar-link-bold">Market</Link></li>
              {userRole === 'farmer' && cartCount > 0 && (
                <li style={{position:'relative'}}>
                  <Link to="/farmer/cart" className="navbar-link-anim navbar-link-bold">Cart</Link>
                  <span style={{position:'absolute', top:-8, right:-12, background:'#d32f2f', color:'#fff', borderRadius:10, padding:'0 6px', fontSize:12, lineHeight:'18px', height:18, minWidth:18, textAlign:'center'}}>{cartCount}</span>
                </li>
              )}
            </>
          )}
        </ul>
        {/* Language selector */}
        <div style={{display:'inline-flex', alignItems:'center', marginRight:8}}>
          <select value={siteLang} onChange={e => {
            const l = e.target.value; setSiteLang(l); try { localStorage.setItem('agri_lang', l); } catch (e) {}
            try { window.dispatchEvent(new CustomEvent('agri:lang:change', { detail: { lang: l } })); } catch (e) {}
          }} aria-label="Site language" style={{padding:'3px 1px', border:'1px solid #e6e6e6', background:'#fff'}}>
            <option value="en">EN</option>
            <option value="hi">हिन्दी</option>
            <option value="kn">ಕನ್ನಡ</option>
          </select>
        </div>

        {/* Bell: show for signed-in users; for farmers this shows purchase notifications */}
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
                    setNotifList(notifs);
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
    padding: 0, animation: 'fadein .25s', opacity: 1, transition: 'opacity .22s',
    overflow: 'hidden'
  }}>
    {/* Top Header */}
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
      padding:'16px 30px 10px 18px', borderBottom:'1.5px solid #eaf6ea', background:'#f9fffa'}}>
      <div style={{display:'flex', alignItems:'center', gap:2}}>
        <span style={{fontSize:25}}>🔔</span>
        <span style={{ fontWeight:800, fontSize:19, color:'#197a50' }}>Notifications</span>
        {notifCount > 0 && (
          <span style={{background:'#36cf6d22', color:'#197a50', borderRadius:9, padding:'2px 8px', fontWeight:700, fontSize:13, marginLeft:6}}>{notifCount}</span>
        )}
      </div>
      {(notifList && notifList.length > 0) && (
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          {!notifSelectMode && (
            <button onClick={async()=>{
              const ids = notifList.filter(n=>!n.is_read).map(n=>n.id);
              if(!ids.length) return;
              const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');
              await fetch(`${apiBase}/notifications/mark-read`, {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ids}) });
              // Do not clear notifications list automatically
              // Update local state to reflect read status
              setNotifList(list => list.map(n => ids.includes(n.id) ? { ...n, is_read: 1 } : n));
              // Clear unread badge count as messages are now marked read
              setNotifCount(0);
            }} style={{background:'#ecf8f2', color:'#236902', border:'none', borderRadius:8, padding:'4px 10px', fontWeight:700, cursor:'pointer', fontSize:13}}>
              Mark all as read
            </button>
          )}
          {!notifSelectMode ? (
            <button onClick={()=>{ setNotifSelectMode(true); setNotifSelected(new Set()); }} style={{background:'#ffecec', color:'#b11a1a', border:'none', borderRadius:8, padding:'4px 14px', fontWeight:700, cursor:'pointer', fontSize:13, boxShadow: '0 2px 12px #ffd2d2'}}>
              Delete
            </button>
          ) : (
            <>
              <button disabled={!notifSelected.size} onClick={async()=>{
                const ids = Array.from(notifSelected);
                if(!ids.length) return;
                const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');
                try {
                  const res = await fetch(`${apiBase}/notifications/delete`, {
                    method: 'POST', headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({ ids })
                  });
                  const j = await res.json();
                  if (res.ok && j && j.ok) {
                    setNotifList(list => list.filter(n => !notifSelected.has(n.id)));
                    setNotifCount(c => Math.max(0, c - ids.length));
                    setNotifSelected(new Set());
                    setNotifSelectMode(false);
                  }
                } catch (e) {}
              }} style={{background:'#ffdede', color:'#b11a1a', border:'none', borderRadius:8, padding:'4px 14px', fontWeight:700, cursor:'pointer', fontSize:13, boxShadow: '0 2px 12px #ffd2d2'}}>
                Delete Selected
              </button>
              <button onClick={()=>{ setNotifSelectMode(false); setNotifSelected(new Set()); }} style={{background:'#f0f0f0', color:'#333', border:'none', borderRadius:8, padding:'4px 14px', fontWeight:700, cursor:'pointer', fontSize:13}}>
                Cancel
              </button>
            </>
          )}
        </div>
      )}
    </div>
    <div style={{maxHeight:370, overflowY:'auto', background:'#f8fefa', padding:'0 2px 8px 2px'}}>
      {(!notifList || !notifList.length) && (
        <div style={{padding:'30px 0', textAlign:'center', color:'#a2b2aa'}}>
          <div style={{fontSize:40, marginBottom:4}}>🛎️</div>
          <div style={{fontSize:18, fontWeight:600}}>No notifications yet!</div>
        </div>
      )}
      {Array.isArray(notifList) && notifList.map(n => (
        <div key={n.id} style={{
            margin:'16px 10px', borderRadius: 13, background: n.is_read ? '#fff' : '#eafff1',
            boxShadow:'0 2px 10px rgba(22,119,80,0.05)', borderLeft: n.is_read?'4px solid #f9fff7':'5px solid #236902',
            display:'flex', padding:'16px 7px 12px 16px', alignItems:'flex-start',gap:12, transition:'background .2s'}}>
          {notifSelectMode && (
            <input type="checkbox" checked={notifSelected.has(n.id)} onChange={(e)=>{
              setNotifSelected(prev => {
                const next = new Set(prev);
                if (e.target.checked) next.add(n.id); else next.delete(n.id);
                return next;
              });
            }} style={{marginTop:6}} />
          )}
          <div style={{fontSize:26, marginTop:3}} role="img" aria-label="Order">🛒</div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontWeight:800, color:'#197a50', fontSize:16, marginBottom:2}}>{n.crop_name || 'N/A'}</div>
            <div style={{fontWeight:700, color:'#333', fontSize:14}}>
              Qty: <span style={{color:'#197a50'}}>{Number(n.quantity_kg||0).toLocaleString('en-IN')} kg</span>
            </div>
            {typeof n._subtotal === 'number' && (
              <div style={{fontWeight:800, color:'#1b5e20', fontSize:14, marginTop:2}}>
                Amount Received: <span style={{color:'#197a50'}}>
                  ₹{Number(n._subtotal||0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
            
            <div style={{color:'#1e3d22', fontSize:13, fontWeight:600, marginTop:2}}>
              Buyer: <span style={{color:'#2573b3', fontWeight:700}}>{n.buyer_name}</span>
            </div>
            <div style={{color:'#bbb', fontSize:12, marginTop:4, textAlign:'right', letterSpacing:'0.04em'}}>
              {n.created_at ? new Date(n.created_at).toLocaleString('en-IN', {year:'2-digit', month:'short', day:'2-digit', hour:'2-digit', minute:'2-digit'}) : ''}
            </div>
          </div>
        </div>
      ))}
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
