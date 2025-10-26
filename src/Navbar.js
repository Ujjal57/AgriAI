import React from 'react';
import './Navbar.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = React.useState(!!localStorage.getItem('agriai_email'));
  const [userName, setUserName] = React.useState(localStorage.getItem('agriai_name') || '');
  const [userRole, setUserRole] = React.useState(localStorage.getItem('agriai_role') || '');
  const location = useLocation();

  React.useEffect(() => {
    const onStorage = () => {
      setIsLoggedIn(!!localStorage.getItem('agriai_email'));
      setUserName(localStorage.getItem('agriai_name') || '');
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
    // also poll once on mount in case localStorage changed in same tab
    onStorage();

    // If logged in but name missing, fetch profile from backend to get authoritative DB name
    (async function fetchNameIfMissing() {
      try {
        const email = localStorage.getItem('agriai_email') || '';
        const phone = localStorage.getItem('agriai_phone') || '';
        const nameStored = localStorage.getItem('agriai_name') || '';
        if ((email || phone) && !nameStored) {
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
    };
  }, []);

  const handleLogout = () => {
    // For now just navigate to login page. Clear any client-side auth if added.
    setOpen(false);
    try { localStorage.removeItem('agriai_email'); localStorage.removeItem('agriai_role'); localStorage.removeItem('agriai_name'); } catch (e) {}
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo-group">
        <span className="navbar-logo-circle">
          <img src={require('./assets/logo192.png')} alt="AgriAI Logo" className="navbar-logo-img" />
        </span>
        <span className="navbar-logo">AgriAI</span>
      </div>
      <div className="navbar-right">
        <ul className="navbar-links">
          <li><Link to="/" className="navbar-link-anim navbar-link-bold">Home</Link></li>
          {/* Show Contact Us only for guests (hide when signed in) */}
          {!isLoggedIn && (
            <li><Link to="/contact" className="navbar-link-anim navbar-link-bold">Contact Us</Link></li>
          )}
          {userRole === 'buyer' && (
            <>
              <li><Link to="/dashboard/farmer" className="navbar-link-anim navbar-link-bold">Farmers</Link></li>
              <li><Link to="/my-deals" className="navbar-link-anim navbar-link-bold">My Deals</Link></li>
              <li><Link to="/market" className="navbar-link-anim navbar-link-bold">Market</Link></li>
              <li><Link to="/cart" className="navbar-link-anim navbar-link-bold">Cart</Link></li>
            </>
          )}
          {userRole === 'farmer' && (
            <>
              <li><Link to="/dashboard/buyer" className="navbar-link-anim navbar-link-bold">Buyers</Link></li>
              <li><Link to="/my-crops" className="navbar-link-anim navbar-link-bold">My Crops</Link></li>
              <li><Link to="/market" className="navbar-link-anim navbar-link-bold">Market</Link></li>
              <li><Link to="/farmer/cart" className="navbar-link-anim navbar-link-bold">Cart</Link></li>
            </>
          )}
        </ul>
        {/* Bell: show for signed-in users, aligned to the right of the cart */}
        {isLoggedIn && (
          <button
            className="navbar-message-btn"
            aria-label="Open notifications"
            onClick={() => { try { window.dispatchEvent(new Event('open-chatbot')); } catch (e) { console.error(e); } }}
            style={{background:'none', border:'none', marginLeft:2, marginRight:2, cursor:'pointer', display:'inline-flex', alignItems:'center'}}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2z" fill="#236902" />
              <path d="M18 16v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5S10.5 3.17 10.5 4v.68C7.63 5.36 6 7.92 6 11v5l-1.99 2H20l-2-2z" fill="#236902" />
            </svg>
          </button>
        )}
        <div style={{position: 'relative'}}>
          <button className="navbar-profile-btn" aria-label="Profile" onClick={() => {
            // if not logged in, go to login page; if logged in, toggle profile menu
            if (!isLoggedIn) {
              navigate('/login');
              return;
            }
            setOpen(o => !o);
          }}>
            <span className="navbar-profile-circle">
              <svg className="navbar-profile-icon" width="32" height="32" viewBox="0 0 24 24" fill="#319701" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="12" fill="#e6f4ea" />
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#319701"/>
              </svg>
            </span>
          </button>
          {open && (
            <div className="navbar-profile-menu" style={{position:'absolute', right:0, top:52, background:'#fff', border:'1px solid #eee', boxShadow:'0 8px 24px rgba(0,0,0,0.12)', borderRadius:8, minWidth:220, zIndex:200}}>
              <div style={{display:'flex', gap:12, alignItems:'center', padding:'12px 14px', borderBottom: '1px solid #f1f1f1'}}>
                <div style={{width:48, height:48, borderRadius: 24, background:'#e6f4ea', display:'flex', alignItems:'center', justifyContent:'center'}}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="#319701" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <div style={{flex:1, textAlign:'left'}}>
                  <div style={{fontWeight:700, color:'#236902'}}>{userName || 'Profile'}</div>
                  <div style={{fontSize:12, color:'#000000ff'}}>{userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'User'}</div>
                </div>
              </div>
              <div className="navbar-profile-links">
                  <Link to="/profile" onClick={() => setOpen(false)} className="navbar-profile-link">Update Details</Link>
                  <Link to="/history" onClick={() => setOpen(false)} className="navbar-profile-link">History</Link>
                  <Link to="/contact" onClick={() => setOpen(false)} className="navbar-profile-link">Contact Us</Link>
                  <div className="navbar-profile-divider" />
                  <button onClick={handleLogout} className="navbar-profile-logout">Logout</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
