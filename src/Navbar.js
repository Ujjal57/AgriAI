import React from 'react';
import './Navbar.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { t } from './i18n';
import { Leaf } from 'lucide-react';
import logo192 from './assets/logo192.png';

const Navbar = () => {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = React.useState(!!localStorage.getItem('agriai_email'));
  const [userName, setUserName] = React.useState(localStorage.getItem('agriai_name') || '');
  const [userRole, setUserRole] = React.useState(localStorage.getItem('agriai_role') || '');
  const [userId, setUserId] = React.useState(localStorage.getItem('agriai_id') || '');
  const [userEmail, setUserEmail] = React.useState(localStorage.getItem('agriai_email') || '');
  const location = useLocation();
  // common API base URL used by various helpers
  const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');
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
  // OTP/modal state for buyer contract acceptance
  const [otpModalOpen, setOtpModalOpen] = React.useState(false);
  const [otpValue, setOtpValue] = React.useState('');
  const [otpError, setOtpError] = React.useState('');
  const [otpLoading, setOtpLoading] = React.useState(false);
  const [otpSent, setOtpSent] = React.useState(false);
  const [otpEmail, setOtpEmail] = React.useState(localStorage.getItem('agriai_email') || '');
  const [otpVerified, setOtpVerified] = React.useState(false);
  const [digitalSignature, setDigitalSignature] = React.useState(null);
  // track whether OTP flow is for accept or reject
  const [pendingAction, setPendingAction] = React.useState('');
  // override values to inject into generated contract HTML after OTP verification
  const [contractBuyerNameOverride, setContractBuyerNameOverride] = React.useState('');
  const [contractSignatureDate, setContractSignatureDate] = React.useState('');
  // Track farmer signature info for OTP verification
  const [farmerNameVerified, setFarmerNameVerified] = React.useState('');
  const [farmerDateVerified, setFarmerDateVerified] = React.useState('');

  React.useEffect(() => {
    if (showContractModal && currentContractNotification) {
      (async () => {
        const html = await generateContractHtml(currentContractNotification);
        setContractHtml(html);
      })();
    }
  }, [contractLang, showContractModal, currentContractNotification, contractBuyerNameOverride, contractSignatureDate, farmerNameVerified, farmerDateVerified]);

  // reset overrides when modal is closed so subsequent contracts start clean
  React.useEffect(() => {
    if (!showContractModal) {
      setContractBuyerNameOverride('');
      setContractSignatureDate('');
      setFarmerNameVerified('');
      setFarmerDateVerified('');
    }
  }, [showContractModal]);

  React.useEffect(() => {
    const onStorage = () => {
      setIsLoggedIn(!!localStorage.getItem('agriai_email'));
      setUserName(localStorage.getItem('agriai_name') || '');
      setUserRole(localStorage.getItem('agriai_role') || '');
      setUserId(localStorage.getItem('agriai_id') || '');
      setUserEmail(localStorage.getItem('agriai_email') || '');
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
    if (userRole === 'buyer') {
      // For buyers, fetch from API
      const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');
      let timer;
      const load = async () => {
        if (!userId) {
          setNotifCount(0);
          return;
        }
        try {
          const qp = userId ? `buyer_id=${encodeURIComponent(userId)}` : '';
          const url = `${apiBase}/notifications/list?${qp}`;
          const res = await fetch(url);
          if (!res.ok) return;
          const j = await res.json();
          if (j && j.ok && Array.isArray(j.notifications)) {
            // Count only unread contracts from backend (read column in contracts)
            // For buyers, exclude contracts with status 'accepted'
            const unreadCount = j.notifications.filter(n => {
              if (!(n && Number(n.is_read))) {
                if (userRole === 'buyer' && n.status && (n.status).toLowerCase() === 'accepted') {
                  return false;
                }
                return true;
              }
              return false;
            }).length;
            setNotifCount(unreadCount);
          }
        } catch (e) {}
      };
      load();
      const pollInterval = userRole === 'buyer' ? 5000 : 3000;
      timer = setInterval(load, pollInterval);
      return () => { try { clearInterval(timer); } catch (e) {} };
    } else if (userRole === 'farmer') {
      const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');
    let timer;
    const load = async () => {
      try {
        const qp = farmerId ? `farmer_id=${encodeURIComponent(farmerId)}` : (localStorage.getItem('agriai_phone') ? `farmer_phone=${encodeURIComponent(localStorage.getItem('agriai_phone'))}` : '');
        const url = `${apiBase}/notifications/list?${qp}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const j = await res.json();
        if (j && j.ok && Array.isArray(j.notifications)) {
          // Count only unread contracts from backend (read column in contract_b)
          // For farmers, exclude contracts with status 'accepted'
          const unreadCount = j.notifications.filter(n => {
            if (!(n && Number(n.is_read))) {
              if (userRole === 'farmer' && n.status && (n.status).toLowerCase() === 'accepted') {
                return false;
              }
              return true;
            }
            return false;
          }).length;
          setNotifCount(unreadCount);
        }
      } catch (e) {}
    };
    load();
    const pollInterval = userRole === 'farmer' ? 3000 : 5000;
    timer = setInterval(load, pollInterval);
    return () => { try { clearInterval(timer); } catch (e) {} };
    } else {
      setNotifCount(0);
    }
  }, [userRole, farmerId, userId]);
  // When the notifications pane is open, keep the full list fresh:
  React.useEffect(() => {
    const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');
    let pollTimer = null;

    const loadFull = async () => {
      let notifs = [];
      try {
        if (userRole === 'farmer') {
          if (!farmerId && !localStorage.getItem('agriai_phone')) {
            notifs = [];
            return;
          }
          const qp = farmerId ? `farmer_id=${encodeURIComponent(farmerId)}` : (localStorage.getItem('agriai_phone') ? `farmer_phone=${encodeURIComponent(localStorage.getItem('agriai_phone'))}` : '');
          const res = await fetch(`${apiBase}/notifications/list?${qp}`);
          if (!res.ok) return;
          const j = await res.json();
          if (j && j.ok && Array.isArray(j.notifications)) {
            // Show ONLY backend contract_b data - NO localStorage caching
            notifs = j.notifications;
          }
        } else if (userRole === 'buyer') {
          if (!userId) {
            notifs = [];
            return;
          }
          const qp = userId ? `buyer_id=${encodeURIComponent(userId)}` : '';
          const res = await fetch(`${apiBase}/notifications/list?${qp}`);
          if (!res.ok) return;
          const j = await res.json();
          if (j && j.ok && Array.isArray(j.notifications)) {
            // Show ONLY backend contracts data - NO localStorage caching
            notifs = j.notifications;
          }
        } else {
          notifs = [];
        }
        
        // Display ONLY API data - no merging with localStorage
        setNotifList(notifs);
        try { 
          const filteredNotifs = Array.isArray(notifs) 
            ? notifs.filter(x => {
                // For farmers and buyers, exclude notifications with status 'accepted'
                if ((userRole === 'farmer' || userRole === 'buyer') && x.status && (x.status).toLowerCase() === 'accepted') {
                  return false;
                }
                return !(x && Number(x.is_read));
              })
            : [];
          setNotifCount(filteredNotifs.length);
        } catch (e) {}
      } catch (e) {}
    };

    const onEvent = () => { try { if (notifOpen) loadFull(); else {/* no-op */} } catch (e) {} };
    try { window.addEventListener('agriai:notifications:update', onEvent); } catch (e) {}
    try { window.addEventListener('agriai:contracts:saved', onEvent); } catch (e) {}

    // Only poll the full list while the pane is open - check every 3 seconds for farmer notifications
    if (notifOpen) {
      loadFull();
      const pollInterval = userRole === 'farmer' ? 3000 : 5000;
      pollTimer = setInterval(() => { try { loadFull(); } catch (e) {} }, pollInterval);
    }

    return () => {
      try { window.removeEventListener('agriai:notifications:update', onEvent); } catch (e) {}
      try { if (pollTimer) clearInterval(pollTimer); } catch (e) {}
    };
  }, [userRole, farmerId, notifOpen]);

  // Do NOT sync localStorage notifications - show ONLY API/contract_b data
  React.useEffect(() => {
    // Placeholder - notifications come ONLY from API
    return () => {};
  }, [farmerId]);

  const handleLogout = () => {
    setOpen(false);

    try {
      localStorage.removeItem('agriai_email');
      localStorage.removeItem('agriai_role');
      localStorage.removeItem('agriai_name');
    } catch (e) {}

    // update navbar state instantly
    setIsLoggedIn(false);
    setUserRole('');
    setUserName('');

    // notify navbar listeners (same pattern you already use for login)
    try {
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}

    navigate('/login');
  };

  // send OTP email/phone for contract acceptance
  const sendAcceptanceOtp = async () => {
    setOtpError('');
    setOtpLoading(true);
    try {
      const email = localStorage.getItem('agriai_email') || '';
      const phone = localStorage.getItem('agriai_phone') || '';
      const payload = {};
      if (email) payload.email = email;
      if (phone) payload.phone = phone;
      payload.purpose = 'contract-acceptance';
      const res = await fetch(`${apiBase}/auth/send-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.ok) {
        setOtpSent(true);
        
      } else {
        setOtpError(j.error || 'Failed to send OTP');
      }
    } catch (e) {
      setOtpError('Server error. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const generateDigitalSignature = (email, otp) => {
    // Create a digital signature using email, timestamp, and OTP verification
    const timestamp = new Date().toISOString();
    const signatureData = `${email}-${otp}-${timestamp}`;
    // Simple SHA-like hash (in production use proper crypto)
    let hash = 0;
    for (let i = 0; i < signatureData.length; i++) {
      const char = signatureData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const hashHex = Math.abs(hash).toString(16).padStart(16, '0');
    
    return {
      signer_email: email,
      signature_timestamp: timestamp,
      signature_method: 'OTP-Verified',
      signature_hash: hashHex
    };
  };

  const verifyAcceptanceOtp = async () => {
    setOtpError('');
    if (!otpValue.trim()) {
      setOtpError(t('otpRequired', siteLang) || 'OTP is required');
      return;
    }
    setOtpLoading(true);
    try {
      const email = localStorage.getItem('agriai_email') || '';
      const phone = localStorage.getItem('agriai_phone') || '';
      const payload = { otp: otpValue.trim(), purpose: 'contract-acceptance' };
      if (email) payload.email = email;
      if (phone) payload.phone = phone;
      const res = await fetch(`${apiBase}/auth/verify-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.ok) {
        // OTP verified; create digital signature (only needed for accept)
        let signature = null;
        if (pendingAction === 'accept') {
          signature = generateDigitalSignature(email, otpValue.trim());
          setDigitalSignature(signature);
        }
        setOtpVerified(true);
        
        const verifiedDate = new Date().toLocaleDateString('en-GB');
        const userName = localStorage.getItem('agriai_name') || '';
        
        if (userRole === 'buyer') {
          // Set buyer name and verified date for contract display
          setContractBuyerNameOverride(userName);
          setContractSignatureDate(verifiedDate);
        } else if (userRole === 'farmer') {
          // Set farmer name and verified date for contract display
          setFarmerNameVerified(userName);
          setFarmerDateVerified(verifiedDate);
        }
        
        // update notification status locally so contract HTML shows signature or rejection
        const newStatus = pendingAction === 'reject' ? 'rejected' : 'accepted';
        setCurrentContractNotification(prev => prev ? { ...prev, status: newStatus } : prev);
        
        // regenerate HTML immediately if acceptance (so signature appears)
        if (pendingAction === 'accept') {
          try {
            const html = await generateContractHtml({ ...currentContractNotification, status: newStatus });
            setContractHtml(html);
          } catch (e) { /* ignore */ }
        }
        
        // OTP verified successfully - finalize action
        console.log('OTP verified successfully - finalizing contract', pendingAction);
        const finalStatus = pendingAction === 'reject' ? 'rejected' : 'accepted';
        await finalizeContract(finalStatus);
        setOtpModalOpen(false);
        setOtpValue('');
        setOtpError('');
        setOtpSent(false);
        setPendingAction('');
      } else {
        setOtpError(j.error || 'Invalid or expired OTP');
      }
    } catch (e) {
      setOtpError('Server error. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const resetOtpModal = () => {
    setOtpModalOpen(false);
    setOtpValue('');
    setOtpError('');
    setOtpSent(false);
    // Note: otpVerified is NOT reset here - it persists until contract is finalized
    // setOtpVerified(false);
    // setDigitalSignature(null);
  };

  // finalize contract action (accept/reject) after OTP verification
  const finalizeContract = async (status = 'accepted') => {
    if (!currentContractNotification) {
      console.error('finalizeContract: No contract notification set');
      alert('Error: Contract data not found. Please try again.');
      return;
    }
    
    const contractNumber = currentContractNotification.contract_number;
    const buyerId = localStorage.getItem('agriai_id') || '';
    const farmerId = localStorage.getItem('agriai_id') || '';
    const userName = localStorage.getItem('agriai_name') || '';

    if (!contractNumber) {
      console.error('finalizeContract: No contract_number found', currentContractNotification);
      alert('Error: Contract number not found. Please try again.');
      return;
    }

    console.log('finalizeContract initiated', { contractNumber, buyerId, status, userRole, otpVerified, digitalSignature });

    const doRequest = async () => {
      const payload = { 
        contract_number: contractNumber, 
        status: status
      };
      
      // Add buyer or farmer info based on user role
      if (userRole === 'buyer') {
        payload.buyer_id = buyerId;
        // include signature only for buyer acceptance
        if (status === 'accepted' && digitalSignature) {
          payload.signature_data = digitalSignature;
        }
      } else if (userRole === 'farmer') {
        payload.farmer_id = farmerId;
        // include farmer signature info for farmer acceptance
        if (status === 'accepted') {
          payload.farmer_signature_data = {
            farmer_name: userName,
            farmer_signed_date: farmerDateVerified,
            signature_method: 'OTP-Verified',
            signature_timestamp: new Date().toISOString()
          };
        }
      }
      
      console.log('Sending POST to /contracts/accept with payload:', payload);
      
      // update contract status on backend (endpoint handles generic status)
      const res = await fetch(`${apiBase}/contracts/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res;
    };

    try {
      let res;
      try {
        res = await doRequest();
      } catch (netErr) {
        console.warn('Network error on first attempt to accept contract', netErr);
        // retry once after a short pause
        await new Promise(r => setTimeout(r, 1000));
        res = await doRequest();
      }

      const responseText = await res.text();
      let responseJson = null;
      try { responseJson = responseText ? JSON.parse(responseText) : null; } catch(e) { /* ignore */ }
      console.log('Response from /contracts/accept:', res.status, responseText, responseJson);

      if (res && res.ok) {
        console.log('✅ Contract status API succeeded for', contractNumber, 'status=', status);
        // update local notification to reflect new status
        setCurrentContractNotification(prev => prev ? { ...prev, status: status } : prev);
        // update the notifications list to show new status
        setNotifList(prev => {
          const updated = prev.map(notif => 
            notif.contract_number === contractNumber 
              ? { ...notif, status: status }
              : notif
          );
          console.log('✅ Updated local notifList after contract status change:', updated);
          return updated;
        });

        // success: close modal & reset OTP
        setShowContractModal(false);
        resetOtpModal();
        setOtpVerified(false);
        setDigitalSignature(null);
        setContractBuyerNameOverride('');
        setContractSignatureDate('');
        
        // Show success message to user
        alert(`Contract ${status === 'accepted' ? 'accepted' : 'rejected'} successfully!`);
    
    
      } else {
        const status = res ? res.status : 'no response';
        console.warn('Contract acceptance API returned non-ok status:', status);
        console.warn('Response body:', responseText);
        // show error message but keep modal open so user can retry
        let msg = `Unable to update contract status (server: ${status}). Please check network or try again.`;
        if (responseJson && responseJson.error) {
          msg += `\nServer message: ${responseJson.error}`;
        }
        alert(msg);
      }
    } catch (e) {
      console.error('Failed to finalize acceptance after retries:', e);
      alert('Unable to update contract status. Please check network or try again.');
      // leave modal open for retry, but reset button state so OTP can be resent if needed
      setOtpVerified(false);
    }
  };
  // handle buyer/farmer actions on viewed contract (accept, negotiate, reject) - UNIFIED LOGIC FOR BOTH ROLES
  const handleContractAction = async (action) => {
    if (!currentContractNotification) return;
    console.log('handleContractAction', action, 'otpVerified=', otpVerified, 'currentContract=', currentContractNotification, 'userRole=', userRole);
    
    // Handle negotiate action - same for both buyer and farmer
    if (action === 'negotiate') {
      console.log('Contract negotiation:', currentContractNotification);
      setShowContractModal(false);
      return;
    }
    
    // UNIFIED ACCEPT/REJECT LOGIC - works identically for both buyer and farmer
    if (action === 'accept' || action === 'reject') {
      // If OTP is already verified for this action, finalize directly
      if (otpVerified && pendingAction === action) {
        console.log(`OTP already verified—finalizing ${action}`);
        await finalizeContract(action === 'reject' ? 'rejected' : 'accepted');
        setPendingAction('');
        return;
      }

      // Start OTP flow for acceptance or rejection
      console.log(`Starting OTP flow for contract ${action}`);
      setPendingAction(action);
      setOtpEmail(localStorage.getItem('agriai_email') || '');
      setOtpValue('');
      setOtpError('');
      setOtpSent(false);
      setOtpVerified(false);
      setDigitalSignature(null);
      setOtpModalOpen(true);
      sendAcceptanceOtp();
    }
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
      
      const logoSrc = window.location.origin + logo192;
      
      // Extract all variables with fallbacks to meta and notification
      const buyerNameOrig = notification.buyer_name || dbContract.buyer_name || '[Buyer Name]';
      const buyerName = contractBuyerNameOverride || buyerNameOrig;
      const buyerId = notification.buyer_id || dbContract.buyer_id || '[Buyer ID]';
      const buyerAddress = meta.buyer_address || notification.buyer_address || dbContract.buyer_address || '[Buyer Address]';
      const buyerState = meta.buyer_state || notification.buyer_state || dbContract.buyer_state || '[Buyer State]';
      const buyerRegion = meta.buyer_region || dbContract.buyer_region || '[Buyer Region]';
      const farmerName = notification.farmer_name || dbContract.farmer_name || '[Farmer Name]';
      const farmerId = notification.farmer_id || dbContract.farmer_id || '[Farmer ID]';
      const farmerAddress = meta.farmer_address || notification.farmer_address || dbContract.farmer_address || '';
      const farmerState = meta.farmer_state || notification.farmer_state || dbContract.farmer_state || '[Farmer State]';
      const farmerRegion = meta.farmer_region || dbContract.farmer_region || '[Farmer Region]';
      const contractNature = meta.contract_nature || notification.contract_nature || dbContract.contract_nature || 'post-harvest';
      const contractDuration = meta.contract_duration || notification.contract_duration || dbContract.contract_duration || 'one-time';
      const contractType = contractDuration === 'one-time' ? 'One-Time' : (contractDuration === 'seasonal' ? 'Seasonal' : 'Yearly');
      // Helper function to parse and format dates as dd/mm/yyyy
      const formatDateDDMMYYYY = (dateStr) => {
        try {
          if (!dateStr) return '';
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return dateStr; // return as-is if not a valid date
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        } catch (e) {
          return dateStr || '';
        }
      };

      // Extract and format dates
      let rawStartDate = meta.startDate || notification.start_date || dbContract.start_date || new Date().toISOString();
      let rawEndDate = meta.endDate || notification.end_date || dbContract.end_date || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
      const startDate = formatDateDDMMYYYY(rawStartDate);
      const endDate = formatDateDDMMYYYY(rawEndDate);
      const days = meta.days || notification.duration || dbContract.duration || 30;
      const totalContractQty = meta.totalContractQty || notification.quantity_kg || dbContract.quantity_kg || dbContract.total_quantity || 0;
      const totalCropTradeValue = meta.totalCropTradeValue || notification.amount || dbContract.amount || 0;
      const avgPricePerKg = meta.avgPricePerKg || notification.price_per_kg || dbContract.price_per_kg || 0;
      const displayFarmerCommission = notification.farmer_platform_fee || dbContract.farmer_platform_fee || meta.farmer_platform_fee || 0;
      const displayFarmerGst = notification.farmer_gst || dbContract.farmer_gst || meta.farmer_gst_on_fee || 0;
      const displayNetAmountToFarmer = notification.net_amount_payable_to_farmer || dbContract.net_amount_payable_to_farmer || dbContract.farmer_total || (totalCropTradeValue - displayFarmerCommission - displayFarmerGst) || 0;
      const displayBuyerCommission = notification.buyer_platform_fee || dbContract.buyer_platform_fee || meta.buyer_platform_fee || 0;
      const displayBuyerGst = notification.buyer_gst || dbContract.buyer_gst || meta.buyer_gst_on_fee || 0;
      
      // Define missing financial variables for English contract template
      const totalPlatformFee = Number(displayFarmerCommission || 0);
      const totalGst = Number(displayFarmerGst || 0);
      const totalAmountInvoice = Number(displayNetAmountToFarmer || 0);
      const buyerPlatformFee = Number(displayBuyerCommission || 0);
      const buyerGst = Number(displayBuyerGst || 0);
      
      const buyerFeeTotal = (displayBuyerCommission || 0) + (displayBuyerGst || 0);
      const buyerTotalAmount = (dbContract.buyer_total != null ? Number(dbContract.buyer_total) : (totalCropTradeValue + buyerFeeTotal));
      const deliveryRateDisplay = meta.deliveryRateDisplay || '₹-- / km';
      const labourCharge = meta.labourCharge || dbContract.labour_charge || 0;
      const qtyKg = meta.qtyKg || totalContractQty || 0;
      // buyer date shown in signature; prefer override or backend timestamp
      let date = contractSignatureDate || '';
      if (!date) {
        if (dbContract && dbContract.signature_timestamp) {
          try {
            date = new Date(dbContract.signature_timestamp).toLocaleDateString('en-GB');
          } catch (e) { date = new Date().toLocaleDateString('en-GB'); }
        } else {
          date = new Date().toLocaleDateString('en-GB');
        }
      }
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
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${Math.round(qty).toLocaleString('en-IN')} kg</td>
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
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      color: #000;
      line-height: 1.8;
      background: #fff;
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
      color: #000;
    }
    .section {
      margin: 12px 0;
      padding: 8px 0;
    }
    ul {
      margin: 6px 0 6px 24px;
      font-size: 14px;
      list-style-type: disc;
      color: #000;
    }
    li {
      margin: 3px 0;
      list-style-type: disc;
      color: #000;
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
      color: #000;
    }
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    tr:hover {
      background: #f0f7ff;
    }
    strong {
      font-weight: 700;
      color: #000;
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
            <p><b>पता:</b> ${buyerState || '[Buyer State]'}</p>
          </div>

          <div class="party-section">
            <p><strong>पक्ष B – किसान / उत्पादक</strong></p>
            <p><b>नाम:</b> ${farmerName}</p>
            <p><b>किसान आईडी:</b> ${farmerId}</p>
            <p><b>पता:</b> ${farmerState || '[Farmer State]'}</p>
          </div>
          <p>
             पक्ष A और पक्ष B को सामूहिक रूप से "पक्ष" कहा जाता है। AgriAI केवल एक डिजिटल सहायता प्लेटफ़ॉर्म के रूप में कार्य करता है और किसी भी पक्ष का खरीदार, विक्रेता, परिवहनकर्ता, बीमाकर्ता या एजेंट नहीं है।
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
            <p><b>प्रारंभ तिथि:</b> ${startDate}</p>
            <p><b>समाप्ति तिथि:</b> ${endDate}</p>
            <p><b>अवधि:</b> ${days} दिन</p>
            <p>
              इस फसल कटाई के बाद क्रय अनुबंध के अंतर्गत, उत्पाद पहले ही इस समझौते के निष्पादन से पूर्व उगाया या काटा जा चुका है। इस अनुबंध के तहत कोई भी खेती संबंधी दायित्व उत्पन्न नहीं होता।
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
            <p><b>कुल मात्रा:</b> ${Math.round(totalContractQty).toLocaleString('en-IN')} किग्रा</p>
            <p><b>प्रति इकाई मूल्य:</b> ${formatCurrency(avgPricePerKg)} प्रति किग्रा</p>
            <p><b>उप-योग:</b> ${formatCurrency(totalCropTradeValue)}</p>
            <p><b>प्लेटफ़ॉर्म शुल्क:</b> ${formatCurrency(totalPlatformFee)}</p>
            <p><b>जीएसटी (18%):</b> ${formatCurrency(totalGst)}</p>
            <p><b style="font-size: 16px; color: #236902;">कुल राशि (कटौती के बाद):</b> <b style="font-size: 16px; color: #236902;">${formatCurrency(totalAmountInvoice)}</b></p>
        
            <h3 style="margin-top: 20px;">5.2 खरीदार की भुगतान संरचना</h3>
            <p><b>कुल मात्रा:</b> ${Math.round(totalContractQty).toLocaleString('en-IN')} किग्रा</p>
            <p><b>प्रति इकाई मूल्य:</b> ${formatCurrency(avgPricePerKg)} प्रति किग्रा</p>
            <p><b>उप-योग:</b> ${formatCurrency(totalCropTradeValue)}</p>
            <p><b>प्लेटफ़ॉर्म शुल्क:</b> ${formatCurrency(buyerPlatformFee)}</p>
            <p><b>जीएसटी (18%):</b> ${formatCurrency(buyerGst)}</p>
            <p><b style="font-size: 16px; color: #236902;">देय कुल राशि:</b> <b style="font-size: 16px; color: #236902;">${formatCurrency(buyerTotalAmount)}</b></p>
        
            <h3 style="margin-top: 20px;">5.3 भुगतान अनुसूची</h3>
            <ul>
              <li><b>अग्रिम (25%):</b> ${formatCurrency(buyerTotalAmount * 0.25)} – अनुबंध की पुष्टि पर देय</li>
              <li><b>डिलीवरी के समय (50%):</b> ${formatCurrency(buyerTotalAmount * 0.50)} – सफल डिलीवरी पर देय</li>
              <li><b>अंतिम (25%):</b> ${formatCurrency(buyerTotalAmount * 0.25)} – गुणवत्ता स्वीकृति के 7 कार्य दिवसों के भीतर देय</li>
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
              <p><b>खरीदार / कंपनी</b></p>
              <p>नाम: ${userRole === 'buyer' && otpVerified ? (buyerName || '________________') : (userRole === 'farmer' && !otpVerified ? (buyerName || '________________') : '________________')}</p>
              <p>तिथि: ${userRole === 'buyer' && otpVerified ? (contractSignatureDate || startDate || '________________') : (userRole === 'farmer' && !otpVerified ? (startDate || '________________') : '________________')}</p>
            </div>
            <div class="signature-line">
              <p><b>किसान / उत्पादक</b></p>
              <p>नाम: ${userRole === 'farmer' && otpVerified ? (farmerNameVerified || farmerName || '________________') : (userRole === 'buyer' && !otpVerified ? (farmerName || '________________') : '________________')}</p>
              <p>तिथि: ${userRole === 'farmer' && otpVerified ? (farmerDateVerified || startDate || '________________') : (userRole === 'buyer' && !otpVerified ? (startDate || '________________') : '________________')}</p>
            </div>
          </section>
        
          <p style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; font-size: 12px; color: #000; font-weight: bold;">
            <b>गवाह:</b> AgriAI प्लेटफ़ॉर्म | डिजिटल रिकॉर्ड: ${new Date().toISOString()}
          </p>
        </section>
        
        </body>
        </html>`;
        return hindiHtml;
      }

      // generate contract in Kannada when selected
      if (contractLang === 'kn') {
        const kannadaHtml = `<!doctype html>
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
      color: #000;
      line-height: 1.8;
      background: #fff;
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
      color: #000;
    }
    .section {
      margin: 12px 0;
      padding: 8px 0;
    }
    ul {
      margin: 6px 0 6px 24px;
      font-size: 14px;
      list-style-type: disc;
      color: #000;
    }
    li {
      margin: 3px 0;
      list-style-type: disc;
      color: #000;
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
      color: #000;
    }
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    tr:hover {
      background: #f0f7ff;
    }
    strong {
      font-weight: 700;
      color: #000;
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
            <p><b>ವಿಳಾಸ:</b> ${buyerState || '[Buyer State]'}</p>
          </div>

          <div class="party-section">
            <p><strong>ಪಕ್ಷ B – ರೈತ / ಉತ್ಪಾದಕ</strong></p>
            <p><b>ಹೆಸರು:</b> ${farmerName}</p>
            <p><b>ರೈತ ಐಡಿ:</b> ${farmerId}</p>
            <p><b>ವಿಳಾಸ:</b> ${farmerState || '[Farmer State]'}</p>
          </div>

          <p>
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
            <p><b>ಪ್ರಾರಂಭ ದಿನಾಂಕ:</b> ${startDate}</p>
            <p><b>ಅಂತ್ಯ ದಿನಾಂಕ:</b> ${endDate}</p>
            <p><b>ಅವಧಿ:</b> ${days} ದಿನಗಳು</p>
            <p>
              ಈ ಕೊಯ್ಲಿನ ನಂತರದ ಖರೀದಿ ಒಪ್ಪಂದದ ಅಡಿಯಲ್ಲಿ, ಉತ್ಪನ್ನವು ಈಗಾಗಲೇ ಈ ಒಪ್ಪಂದ ಜಾರಿಗೆ ಬರುವ ಮೊದಲು ಬೆಳೆಸಲ್ಪಟ್ಟಿದೆ ಅಥವಾ ಕೊಯ್ಯಲ್ಪಟ್ಟಿದೆ.
              ಈ ಒಪ್ಪಂದದ ಅಡಿಯಲ್ಲಿ ಯಾವುದೇ ಬೆಳೆ ಉತ್ಪಾದನಾ ಬಾಧ್ಯತೆ ಇರುವುದಿಲ್ಲ.
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
            <p><b>ಒಟ್ಟು ಪ್ರಮಾಣ:</b> ${Math.round(totalContractQty).toLocaleString('en-IN')} ಕೆಜಿ</p>
            <p><b>ಪ್ರತಿ ಘಟಕದ ಬೆಲೆ:</b> ${formatCurrency(avgPricePerKg)} ಪ್ರತಿ ಕೆಜಿ</p>
            <p><b>ಉಪಮೊತ್ತ:</b> ${formatCurrency(totalCropTradeValue)}</p>
            <p><b>ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಶುಲ್ಕ:</b> ${formatCurrency(totalPlatformFee)}</p>
            <p><b>ಜಿಎಸ್‌ಟಿ (18%):</b> ${formatCurrency(totalGst)}</p>
            <p><b style="font-size: 16px; color: #236902;">ಒಟ್ಟು ಮೊತ್ತ (ಕಡಿತದ ನಂತರ):</b> <b style="font-size: 16px; color: #236902;">${formatCurrency(totalAmountInvoice)}</b></p>
        
            <h3 style="margin-top: 20px;">5.2 ಖರೀದಿದಾರರ ಪಾವತಿ ರಚನೆ</h3>
            <p><b>ಒಟ್ಟು ಪ್ರಮಾಣ:</b> ${Math.round(totalContractQty).toLocaleString('en-IN')} ಕೆಜಿ</p>
            <p><b>ಪ್ರತಿ ಘಟಕದ ಬೆಲೆ:</b> ${formatCurrency(avgPricePerKg)} ಪ್ರತಿ ಕೆಜಿ</p>
            <p><b>ಉಪಮೊತ್ತ:</b> ${formatCurrency(totalCropTradeValue)}</p>
            <p><b>ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಶುಲ್ಕ:</b> ${formatCurrency(buyerPlatformFee)}</p>
            <p><b>ಜಿಎಸ್‌ಟಿ (18%):</b> ${formatCurrency(buyerGst)}</p>
            <p><b style="font-size: 16px; color: #236902;">ಪಾವತಿಸಬೇಕಾದ ಒಟ್ಟು ಮೊತ್ತ:</b> <b style="font-size: 16px; color: #236902;">${formatCurrency(buyerTotalAmount)}</b></p>
        
            <h3 style="margin-top: 20px;">5.3 ಪಾವತಿ ವೇಳಾಪಟ್ಟಿ</h3>
            <ul>
              <li><b>ಮುಂಗಡ (25%):</b> ${formatCurrency(buyerTotalAmount * 0.25)} – ಒಪ್ಪಂದ ದೃಢೀಕರಣದ ವೇಳೆ ಪಾವತಿಸಬೇಕು</li>
              <li><b>ಡಿಲಿವರಿ ಸಮಯದಲ್ಲಿ (50%):</b> ${formatCurrency(buyerTotalAmount * 0.50)} – ಯಶಸ್ವಿ ಡಿಲಿವರಿಯ ನಂತರ ಪಾವತಿಸಬೇಕು</li>
              <li><b>ಅಂತಿಮ (25%):</b> ${formatCurrency(buyerTotalAmount * 0.25)} – ಗುಣಮಟ್ಟ ಸ್ವೀಕೃತಿಯಾದ ನಂತರ 7 ಕಾರ್ಯದಿನಗಳೊಳಗೆ ಪಾವತಿಸಬೇಕು</li>
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
                <p><b>ಖರೀದಿದಾರ / ಕಂಪನಿ</b></p>
                <p>ಹೆಸರು: ${userRole === 'buyer' && otpVerified ? (buyerName || '________________') : (userRole === 'farmer' && !otpVerified ? (buyerName || '________________') : '________________')}</p>
                <p>ದಿನಾಂಕ: ${userRole === 'buyer' && otpVerified ? (contractSignatureDate || startDate || '________________') : (userRole === 'farmer' && !otpVerified ? (startDate || '________________') : '________________')}</p>
              </div>
              <div class="signature-line">
                <p><b>ರೈತ / ಉತ್ಪಾದಕ</b></p>
                <p>ಹೆಸರು: ${userRole === 'farmer' && otpVerified ? (farmerNameVerified || farmerName || '________________') : (userRole === 'buyer' && !otpVerified ? (farmerName || '________________') : '________________')}</p>
                <p>ದಿನಾಂಕ: ${userRole === 'farmer' && otpVerified ? (farmerDateVerified || startDate || '________________') : (userRole === 'buyer' && !otpVerified ? (startDate || '________________') : '________________')}</p>
              </div>
            </section>
        
            <p style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; font-size: 12px; color: #000; font-weight: bold;">
              <b>ಸಾಕ್ಷಿ:</b> AgriAI ವೇದಿಕೆ | ಡಿಜಿಟಲ್ ದಾಖಲೆ: ${new Date().toISOString()}
            </p>
        </section>
        
        </body>
        </html>`;
        return kannadaHtml;
      }

      // Default: Generate English contract  
      const htmlContent = `<!doctype html>
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
      color: #000;
      line-height: 1.8;
      background: #fff;
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
      color: #000;
    }
    .section {
      margin: 12px 0;
      padding: 8px 0;
    }
    ul {
      margin: 6px 0 6px 24px;
      font-size: 14px;
      list-style-type: disc;
      color: #000;
    }
    li {
      margin: 3px 0;
      list-style-type: disc;
      color: #000;
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
      color: #000;
    }
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    tr:hover {
      background: #f0f7ff;
    }
    strong {
      font-weight: 700;
      color: #000;
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
    <p><b>Address:</b> ${buyerState || '[Buyer State]'}</p>
  </div>

  <div class="party-section">
    <p><strong>Party B – Farmer / Producer</strong></p>
    <p><b>Name:</b> ${farmerName}</p>
    <p><b>Farmer ID:</b> ${farmerId}</p>
    <p><b>Address:</b> ${farmerState || '[Farmer State]'}</p>
  </div>

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
    <p><b>Contract Nature:</b> ${contractNature === 'pre-harvest' ? 'Pre-Harvest Production Contract' : 'Post-Harvest Procurement Contract'}</p>
    <p><b>Contract Duration:</b> ${contractDuration === 'one-time' ? 'One-Time' : (contractDuration === 'seasonal' ? 'Seasonal' : 'Yearly')}</p>
    <p><b>Start Date:</b> ${startDate}</p>
    <p><b>End Date:</b> ${endDate}</p>
    <p><b>Duration:</b> ${days} Days</p>
    <p>
      Under this Post-Harvest Procurement Contract, the produce has already been cultivated or harvested prior to execution of this Agreement. No cultivation obligation arises under this contract. Under this Post-Harvest Procurement Contract, the produce has already been cultivated or harvested prior to execution of this Agreement. No cultivation obligation arises under this contract.
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
    <p><b>Total Quantity:</b> ${Math.round(totalContractQty).toLocaleString('en-IN')} kg</p>
    <p><b>Price per Unit:</b> ${formatCurrency(avgPricePerKg)} per kg</p>
    <p><b>Subtotal:</b> ${formatCurrency(totalCropTradeValue)}</p>
    <p><b>Platform Fee:</b> ${formatCurrency(totalPlatformFee)}</p>
    <p><b>GST (18%):</b> ${formatCurrency(totalGst)}</p>
    <p><b style="font-size: 16px; color: #236902;">Total Amount (After Deduction):</b> <b style="font-size: 16px; color: #236902;">${formatCurrency(totalAmountInvoice)}</b></p>

    <h3 style="margin-top: 20px;">5.2 Buyer's Payment Structure</h3>
    <p><b>Total Quantity:</b> ${Math.round(totalContractQty).toLocaleString('en-IN')} kg</p>
    <p><b>Price per Unit:</b> ${formatCurrency(avgPricePerKg)} per kg</p>
    <p><b>Subtotal:</b> ${formatCurrency(totalCropTradeValue)}</p>
    <p><b>Platform Fee:</b> ${formatCurrency(buyerPlatformFee)}</p>
    <p><b>GST (18%):</b> ${formatCurrency(buyerGst)}</p>
    <p><b style="font-size: 16px; color: #236902;">Total Amount Payable:</b> <b style="font-size: 16px; color: #236902;">${formatCurrency(buyerTotalAmount)}</b></p>

    <h3 style="margin-top: 20px;">5.3 Payment Schedule</h3>
    <ul>
      <li><b>Advance (25%):</b> ${formatCurrency(buyerTotalAmount * 0.25)} – Due at contract confirmation</li>
      <li><b>On Delivery (50%):</b> ${formatCurrency(buyerTotalAmount * 0.50)} – Due upon successful delivery</li>
      <li><b>Final (25%):</b> ${formatCurrency(buyerTotalAmount * 0.25)} – Due within 7 working days after quality acceptance</li>
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
      <p><b>Buyer / Company</b></p>
      <p>Name: ${userRole === 'buyer' && otpVerified ? (buyerName || '________________') : (userRole === 'farmer' && !otpVerified ? (buyerName || '________________') : '________________')}</p>
      <p>Date: ${userRole === 'buyer' && otpVerified ? (contractSignatureDate || startDate || '________________') : (userRole === 'farmer' && !otpVerified ? (startDate || '________________') : '________________')}</p>
    </div>
    <div class="signature-line">
      <p><b>Farmer / Producer</b></p>
      <p>Name: ${userRole === 'farmer' && otpVerified ? (farmerNameVerified || farmerName || '________________') : (userRole === 'buyer' && !otpVerified ? (farmerName || '________________') : '________________')}</p>
      <p>Date: ${userRole === 'farmer' && otpVerified ? (farmerDateVerified || startDate || '________________') : (userRole === 'buyer' && !otpVerified ? (startDate || '________________') : '________________')}</p>
    </div>
  </section>

  <p style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; font-size: 12px; color: #000; font-weight: bold;">
    <b>Witness:</b> AgriAI Platform | Digital Record: ${new Date().toISOString()}
  </p>

</body>
</html>`;
      return htmlContent;
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

  const formatCurrency = (v) => `\u20B9${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
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
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-2xl text-foreground">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary flex items-center justify-center">
              <Leaf className="w-4 h-4 text-neon" />
            </div>
            <span className="neon-shimmer">AgriAI</span>
        </Link>
        </div>
      </div>
      <div className="navbar-right">
        <ul className={`navbar-links ${(userRole === 'farmer' || userRole === 'buyer') ? 'centered' : ''}`}>
          {!isLoggedIn && (
          <li><Link to="/" className="navbar-link-anim navbar-link-bold">{t('navHome', siteLang)}</Link></li>
          )}
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
                  <span style={{position:'absolute', top:-8, right:-12, background:'#d32f2f', color:'#ffffff', borderRadius:10, padding:'0 6px', fontSize:12, lineHeight:'18px', height:18, minWidth:18, textAlign:'center'}}>{cartCount}</span>
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
                  <span style={{position:'absolute', top:-8, right:-12, background:'#d32f2f', color:'#ffffff', borderRadius:10, padding:'0 6px', fontSize:12, lineHeight:'18px', height:18, minWidth:18, textAlign:'center'}}>{cartCount}</span>
                </li>
              )}
            </>
          )}
        </ul>
        {/* Language selector */}
        <div style={{display:'inline-flex', alignItems:'center', marginRight:-30}}>
          <select value={siteLang} onChange={e => {
            const l = e.target.value;
            setSiteLang(l);
            try { localStorage.setItem('agri_lang', l); } catch (e) {}
            try { window.dispatchEvent(new CustomEvent('agri:lang:change', { detail: { lang: l } })); } catch (e) {}
            // Reload the current page so buyer pages like History.js update immediately
            setTimeout(() => window.location.reload(), 100);
          }} aria-label="Site language" style={{padding:'3px 1px', border:'3px solid #130e0e', background:'#52ca43fb',color:'#ffffff'}}>
            <option value="en">English</option>
            <option value="hi">हिन्दी </option>
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
              // Toggle notifications panel for both farmers and buyers - using identical logic
              setNotifOpen(o => !o);
              if (!notifOpen) {
                try {
                  const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');
                  
                  // Build query parameters based on user role
                  let qp = '';
                  if (userRole === 'farmer') {
                    qp = farmerId ? `farmer_id=${encodeURIComponent(farmerId)}` : (localStorage.getItem('agriai_phone') ? `farmer_phone=${encodeURIComponent(localStorage.getItem('agriai_phone'))}` : '');
                  } else if (userRole === 'buyer') {
                    qp = userId ? `buyer_id=${encodeURIComponent(userId)}` : '';
                  } else {
                    setNotifList([]);
                    setNotifCount(0);
                    return;
                  }
                  
                  if (!qp) {
                    setNotifList([]);
                    setNotifCount(0);
                    return;
                  }
                  
                  // Fetch notifications using role-appropriate parameters
                  const res = await fetch(`${apiBase}/notifications/list?${qp}`);
                  const j = await res.json();
                  if (j && j.ok && Array.isArray(j.notifications)) {
                    // Show ONLY API data - NO localStorage merging for both buyer and farmer
                    setNotifList(j.notifications);
                    const unread = Array.isArray(j.notifications) ? j.notifications.filter(x => !(x && Number(x.is_read))).length : 0;
                    setNotifCount(unread);
                  } else {
                    setNotifList([]);
                    setNotifCount(0);
                  }
                } catch (e) {
                  setNotifList([]);
                  setNotifCount(0);
                }
              }
            }}
            style={{background:'none', border:'none', marginLeft:2, marginRight:2, cursor:'pointer', display:'inline-flex', alignItems:'center'}}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2z" fill="#fcfffb" />
              <path d="M18 16v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5S10.5 3.17 10.5 4v.68C7.63 5.36 6 7.92 6 11v5l-1.99 2H20l-2-2z" fill="#ffffff" />
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
                        // Collect unread ids and prepare user info
                        const unreadIds = (Array.isArray(notifList) ? notifList.filter(x => !(x && Number(x.is_read))) : []).map(x => x && x.id).filter(Boolean);
                        // Send user role and ID along with ids to mark
                        const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');
                        if (unreadIds.length) {
                          try {
                            const payload = { ids: unreadIds };
                            // Add user identifier based on role
                            if (userRole === 'buyer') {
                              payload.buyer_id = userId;
                            } else if (userRole === 'farmer') {
                              payload.farmer_id = farmerId;
                            }
                            payload.user_role = userRole;
                            await fetch(`${apiBase}/notifications/mark-read`, {
                              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                            });
                          } catch (e) {
                            // ignore network errors; will still update UI locally
                          }
                        }
                        // Update local state - already marked server-side via API
                        setNotifList(list => (Array.isArray(list) ? list.map(n=>({ ...n, is_read: 1 })) : list));
                        setNotifCount(0);
                      } catch (e) {}
                    }} style={{background:'#ecf8f2', color:'#236902', border:'2px solid #236902', borderRadius:8, padding:'2px 8px', fontWeight:600, transition:'all 0.3s ease', cursor:'pointer'}} onMouseEnter={(e) => { e.target.style.background='#236902'; e.target.style.color='#fff'; e.target.style.transform='translateY(-2px)'; e.target.style.boxShadow='0 4px 12px rgba(35, 105, 2, 0.3)'; }} onMouseLeave={(e) => { e.target.style.background='#ecf8f2'; e.target.style.color='#236902'; e.target.style.transform='translateY(0)'; e.target.style.boxShadow='none'; }}>{t('markAll', siteLang) || 'Mark all'}</button>
                  </div>
                </div>
                <div style={{maxHeight:360, overflowY:'auto', padding:8}}>
                  {(!notifList || !notifList.length) && (
                    <div style={{padding:'30px 0', textAlign:'center', color:'#a2b2aa'}}>
                      <div style={{fontSize:40}}>🛎️</div>
                      <div style={{fontSize:16, fontWeight:600}}>{t('noNotifications', siteLang) || 'No notifications yet'}</div>
                    </div>
                  )}
                  {Array.isArray(notifList) && notifList.filter(n => {
                    // Exclude notifications with status 'accepted' for both farmers and buyers
                    if (n.status && (n.status).toLowerCase() === 'accepted') {
                      return false;
                    }
                    return true;
                  }).map(n => {
                    // Extract items early so it's available everywhere in this closure
                    const items = Array.isArray(n.items) ? n.items : (n.items ? [n.items] : []);
                    
                    // UNIFIED: Calculate display amount for both farmer and buyer using role-appropriate total
                    let displayAmount = 0;
                    
                    // Use the role-appropriate total from the contract if available
                    if (userRole === 'farmer' && n.farmer_total != null) {
                      // For farmers: use farmer_total from contract_b (source of truth)
                      displayAmount = Number(n.farmer_total || 0);
                    } else if (userRole === 'buyer' && n.buyer_total != null) {
                      // For buyers: use buyer_total from contracts (source of truth)
                      displayAmount = Number(n.buyer_total || 0);
                    } else {
                      // Fallback: compute from items or use totals (works for both)
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
                      // prefer explicit totals provided via notification payload or contract_meta
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
                      displayAmount = totals.grand_total;
                    }
                    const contractNum = n.contract_number || n.invoice_id;
                    const invoiceId = contractNum || (`INV${n.id || Date.now()}`);
                    const label = n.contract_number ? (t('contractLabel', siteLang) || 'Contract') : (t('invoiceLabel', siteLang) || 'Invoice');
                    const createdAtRaw = n.created_at || n.createdAt || Date.now();
                    const createdDateObj = new Date(createdAtRaw);
                    const createdDate = isNaN(createdDateObj) ? String(createdAtRaw) : `${String(createdDateObj.getDate()).padStart(2, '0')}/${String(createdDateObj.getMonth() + 1).padStart(2, '0')}/${createdDateObj.getFullYear()}`;
                    return (
                      <div key={n.id || invoiceId} style={{border: n.is_read ? '1px solid #ddd' : '2px solid #236902', borderRadius:8, overflow:'hidden', margin:'8px 6px', background: n.is_read ? '#fff' : '#d4f1ca', boxShadow: n.is_read ? 'none' : '0 4px 12px rgba(35, 105, 2, 0.25)'}}>
                        <div style={{padding:'12px 14px', background: n.is_read ? '#f7faf7' : '#c8e8bb', display:'flex', flexDirection:'column', gap:8}}>
                          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div style={{fontWeight:800, color:'#236902', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginRight:10}}>{label + ': '}{invoiceId}</div>
                            <div style={{fontWeight:800, color:'#236902'}}>{formatCurrency(displayAmount)}</div>
                          </div>
                          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div style={{color:'#000', fontSize:13}}>{t('dateLabel', siteLang) || 'Date'}: {createdDate}</div>
                            <div style={{display:'flex', alignItems:'center', gap:8}}>
                              {/* selection removed: Clear/delete feature disabled per request */}
                              <button onClick={async () => {
                                // Show contract modal for both buyers and farmers
                                // Fetch latest contract status from backend
                                let updatedNotif = { ...n };
                                if (n.contract_number) {
                                  try {
                                    const res = await fetch(`${apiBase}/contracts/get/${encodeURIComponent(n.contract_number)}`);
                                    if (res && res.ok) {
                                      const j = await res.json();
                                      if (j && j.ok && j.contract) {
                                        updatedNotif.status = j.contract.status;
                                      }
                                    }
                                  } catch (e) { /* ignore */ }
                                }
                                setCurrentContractNotification(updatedNotif);
                                const html = await generateContractHtml(updatedNotif);
                                setContractHtml(html);
                                setShowContractModal(true);
                              }}
                                onMouseDown={e => { try { e.currentTarget.style.transform = 'translateY(1px) scale(0.99)'; } catch(_){} }}
                                onMouseUp={e => { try { e.currentTarget.style.transform = ''; } catch(_){} }}
                                onMouseLeave={e => { try { e.currentTarget.style.transform = ''; setHoveredInvoice(null); } catch(_){} }}
                                onMouseEnter={e => { try { setHoveredInvoice(invoiceId); } catch(_){} }}
                                aria-label={t('viewContract', siteLang) || 'View Contract'}
                                style={{ background: hoveredInvoice === invoiceId ? '#155a9e' : '#1976d2', color:'#fff', border:'none', padding:'5px 8px', borderRadius:6, fontSize:13, lineHeight:1, marginTop:0, transition:'transform .08s ease, background .08s ease', cursor:'pointer' }}
                              >{t('viewContract', siteLang) || 'View Contract'}</button>
                              <button disabled style={{
                                marginTop: 4,
                                fontWeight: 600,
                                background: (function() {
                                  const s = String(n.status || 'pending').toLowerCase();
                                  if (s === 'accepted') return '#2e7d32';
                                  if (s === 'pending') return '#fdd835';
                                  if (s === 'rejected') return '#c62828';
                                  return '#ccc';
                                })(),
                                color: '#fff',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: 4,
                                cursor: 'default',
                                fontSize: 12,
                                lineHeight: 1
                              }}>
                                {t(n.status || 'pending', siteLang) || (n.status || 'pending')}
                              </button>
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
            <div className="navbar-profile-menu" style={{position:'absolute', right:0, top:52, background:'rgba(255,255,255,0.92)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.6)', boxShadow:'0 8px 32px rgba(35,105,2,0.12), 0 32px 64px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)', borderRadius:16, minWidth:240, zIndex:200}}>
              <div style={{display:'flex', gap:12, alignItems:'center', padding:'14px 16px', borderBottom: '1px solid rgba(83,182,53,0.1)'}}>
                <div style={{width:48, height:48, borderRadius: 24, background:'linear-gradient(135deg, #e8f5e2 0%, #f0faf0 100%)', display:'flex', alignItems:'center', justifyContent:'center', color:'#236902', fontWeight:800, fontSize:'1.1rem', boxShadow:'0 2px 8px rgba(35,105,2,0.1)'}}>{initials(userName)}</div>
                <div style={{flex:1, textAlign:'left'}}>
                  <div style={{fontWeight:700, color:'#236902', fontSize:'0.95rem'}}>{userName || 'Profile'}</div>
                  <div style={{fontSize:'0.8rem', color:'#53b635', fontWeight:600}}>{userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'User'}</div>
                </div>
              </div>
              <div className="navbar-profile-links" style={{display:'flex', flexDirection:'column'}}>
                  <Link to="/profile" onClick={() => setOpen(false)} className="navbar-profile-link" style={{padding:'10px 16px', color:'#236902', textDecoration:'none', fontSize:'0.9rem', fontWeight:600, transition:'all 0.2s', borderBottom:'1px solid rgba(83,182,53,0.08)', display:'block'}} onMouseEnter={(e) => e.target.style.background='rgba(83,182,53,0.08)'} onMouseLeave={(e) => e.target.style.background='transparent'}>{t('navUpdateDetails', siteLang)}</Link>
                  <Link to={userRole === 'farmer' ? "/farmer/history" : "/history"} onClick={() => setOpen(false)} className="navbar-profile-link" style={{padding:'10px 16px', color:'#236902', textDecoration:'none', fontSize:'0.9rem', fontWeight:600, transition:'all 0.2s', borderBottom:'1px solid rgba(83,182,53,0.08)', display:'block'}} onMouseEnter={(e) => e.target.style.background='rgba(83,182,53,0.08)'} onMouseLeave={(e) => e.target.style.background='transparent'}>{t('navHistory', siteLang)}</Link>
                  <button onClick={handleLogout} className="navbar-profile-logout" style={{padding:'10px 16px', background:'linear-gradient(135deg, #236902 0%, #53b635 100%)', color:'#fff', border:'none', borderRadius:'0 0 16px 16px', fontSize:'0.9rem', fontWeight:700, cursor:'pointer', boxShadow:'0 4px 16px rgba(35,105,2,0.2)', transition:'all 0.2s', width:'100%'}} onMouseEnter={(e) => {e.target.style.transform='translateY(-2px)'; e.target.style.boxShadow='0 8px 24px rgba(35,105,2,0.3)';}} onMouseLeave={(e) => {e.target.style.transform='translateY(0)'; e.target.style.boxShadow='0 4px 16px rgba(35,105,2,0.2)';}}>{t('navLogout', siteLang)}</button>
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
      <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10000, padding:'20px'}}>
        <div style={{width:'100%', maxWidth:'900px', height:'90vh', background:'#fff', display:'flex', flexDirection:'column', borderRadius:'12px', boxShadow:'0 20px 60px rgba(0,0,0,0.3)', overflow:'hidden', margin:'0 auto'}}>
          {/* Header */}
          <div style={{position:'relative', display:'flex', justifyContent:'center', alignItems:'center', padding:'16px 24px', borderBottom:'2px solid #e5e5e5', background:'#f9f9f9'}}>
            <h2 style={{margin:0, color:'#236902', fontSize:'18px', fontWeight:700}}>{t('contractPreview', siteLang) || 'Contract Preview'}</h2>
            <div style={{position:'absolute', right:24, top:'50%', transform:'translateY(-50%)', display:'flex', gap:10, alignItems:'center'}}>
              <button 
                onClick={() => {
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
                  doc.write(contractHtml);
                  doc.close();
                  
                  setTimeout(() => {
                    try {
                      iframe.contentWindow.focus();
                      iframe.contentWindow.print();
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
                }}
                onMouseEnter={(e) => { e.target.style.background='#28a745'; e.target.style.color='#fff'; }}
                onMouseLeave={(e) => { e.target.style.background='#fff'; e.target.style.color='#28a745'; }}
                style={{padding:'5px 12px', background:'#fff', color:'#28a745', border:'2px solid #28a745', borderRadius:6, fontWeight:600, cursor:'pointer', fontSize:'12px', transition:'all 0.2s ease'}}>
                {t('print', siteLang) || 'Print'}
              </button>
              <button 
                onClick={() => setShowContractModal(false)}
                onMouseEnter={(e) => { e.target.style.background='#dc3545'; e.target.style.color='#fff'; }}
                onMouseLeave={(e) => { e.target.style.background='#fff'; e.target.style.color='#dc3545'; }}
                style={{padding:'5px 12px', background:'#fff', color:'#dc3545', border:'2px solid #dc3545', borderRadius:6, fontWeight:600, cursor:'pointer', fontSize:'12px', transition:'all 0.2s ease'}}>
                {t('close', siteLang) || 'Close'}
              </button>
            </div>
          </div>
          
          {/* Contract Content */}
          <div style={{flex:1, overflow:'auto', padding:'0', background:'#fff'}}>
            <div style={{padding:'40px 48px', lineHeight:'1.8'}} dangerouslySetInnerHTML={{__html:contractHtml}} />
          </div>
          
          {/* Footer Actions */}
          <div style={{borderTop:'2px solid #e5e5e5', padding:'16px 24px', background:'#f9f9f9', display:'flex', justifyContent:'center', gap:12}}>
            <button 
              onClick={() => handleContractAction('accept')}
              onMouseEnter={(e) => { e.target.style.background='#1a5c10'; e.target.style.transform='scale(1.02)'; }}
              onMouseLeave={(e) => { e.target.style.background='#28a745'; e.target.style.transform='scale(1)'; }}
              style={{padding:'8px 20px', background:'#28a745', color:'#fff', border:'none', borderRadius:6, fontWeight:700, cursor:'pointer', fontSize:'13px', transition:'all 0.2s ease'}}>
              {t('contractAccept', siteLang) || 'Accept'}
            </button>
            <button 
              onClick={() => handleContractAction('negotiate')}
              onMouseEnter={(e) => { e.target.style.background='#e0a500'; e.target.style.transform='scale(1.02)'; }}
              onMouseLeave={(e) => { e.target.style.background='#ffc107'; e.target.style.transform='scale(1)'; }}
              style={{padding:'8px 20px', background:'#ffc107', color:'#000', border:'none', borderRadius:6, fontWeight:700, cursor:'pointer', fontSize:'13px', transition:'all 0.2s ease'}}>
              {t('contractNegotiate', siteLang) || 'Negotiate'}
            </button>
            <button 
              onClick={() => {
                if (window.confirm(t('confirmRejectContract', siteLang) || 'Are you sure you want to reject this contract?')) {
                  handleContractAction('reject');
                }
              }}
              onMouseEnter={(e) => { e.target.style.background='#dc3545'; e.target.style.transform='scale(1.02)'; }}
              onMouseLeave={(e) => { e.target.style.background='#dc3545'; e.target.style.transform='scale(1)'; }}
              style={{padding:'8px 20px', background:'#dc3545', color:'#fff', border:'none', borderRadius:6, fontWeight:700, cursor:'pointer', fontSize:'13px', transition:'all 0.2s ease'}}>
              {t('contractReject', siteLang) || 'Reject'}
            </button>
          </div>
          {/* Digital Signature OTP Verification Modal - FarmerCart Design */}
          {otpModalOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
              <div style={{ width: '90%', maxWidth: 500, background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                <h2 style={{ margin: '0 0 16px 0', color: '#236902', fontSize: 20, textAlign: 'center' }}>
                  {otpVerified ? ((t('signatureVerified', siteLang) || 'Signature Verified')) : t('verifyIdentity', siteLang) || 'Verify Identity'}
                </h2>

                <p style={{ color: '#666', marginBottom: 16, fontSize: 14 }}>
                  {otpVerified 
                    ? (t('verifyIdentitySigned', siteLang) || 'Your contract has been digitally signed with your verified email.')
                    : (t('verifyIdentityDesc', siteLang) || 'Enter the OTP sent to your email to verify your identity and digitally sign the contract.')}
                </p>

                {otpVerified ? (
                  <div style={{ background: '#f0f7ff', border: '2px solid #236902', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                    <div style={{ marginBottom: 8 }}>
                      <strong>{t('signatureDetails', siteLang) || 'Digital Signature Details'}</strong>
                    </div>
                    <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#333' }}>
                      <div>📧 {t('signatureEmailLabel', siteLang) || 'Email'}: {otpEmail}</div>
                      <div>🕐 {t('signatureTimeLabel', siteLang) || 'Time'}: {digitalSignature?.signature_timestamp}</div>
                      <div>✔ {t('signatureMethodLabel', siteLang) || 'Method'}: {digitalSignature?.signature_method}</div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>{t('signatureEmailLabel', siteLang) || 'Email'}</label>
                      <input 
                        type="email" 
                        value={otpEmail} 
                        disabled
                        style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6, fontSize: 14, background: '#f5f5f5' }} 
                      />
                    </div>

                    {!otpSent ? (
                      <div style={{ marginBottom: 16 }}>
                        <button 
                          onClick={sendAcceptanceOtp}
                          disabled={otpLoading}
                          style={{ 
                            width: '100%', 
                            padding: 10, 
                            background: '#236902', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: 6, 
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: otpLoading ? 'not-allowed' : 'pointer',
                            opacity: otpLoading ? 0.6 : 1
                          }}
                        >
                          {otpLoading ? (t('sendingOtp', siteLang) || 'Sending...') : (t('sendOtpButton', siteLang) || 'Send OTP')}
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ marginBottom: 16 }}>
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Enter OTP</label>
                          <input 
                            type="text" 
                            placeholder={t('otpPlaceholder', siteLang) || '000000'}
                            value={otpValue}
                            onChange={(e) => setOtpValue(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                            style={{ 
                              width: '100%', 
                              padding: 10, 
                              border: '1px solid #ddd', 
                              borderRadius: 6, 
                              fontSize: 14,
                              textAlign: 'center',
                              letterSpacing: '4px',
                              fontWeight: 'bold'
                            }} 
                          />
                          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{t('checkEmailMsg', siteLang) || 'Check your email for the 6-digit code'}</div>
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                          <button 
                            onClick={verifyAcceptanceOtp}
                            disabled={otpLoading || otpValue.length < 6}
                            style={{ 
                              flex: 1, 
                              padding: 10, 
                              background: '#236902', 
                              color: '#fff', 
                              border: 'none', 
                              borderRadius: 6, 
                              fontSize: 14,
                              fontWeight: 600,
                              cursor: (otpLoading || otpValue.length < 6) ? 'not-allowed' : 'pointer',
                              opacity: (otpLoading || otpValue.length < 6) ? 0.6 : 1
                            }}
                          >
                            {otpLoading ? (t('verifying', siteLang) || 'Verifying...') : (t('verifyAndSign', siteLang) || 'Verify & Sign')}
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}

                {otpError && (
                  <div style={{ background: '#ffebee', border: '1px solid #d32f2f', color: '#d32f2f', padding: 10, borderRadius: 6, marginTop: 12, fontSize: 13 }}>
                    ⚠ {otpError}
                  </div>
                )}

                <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                  {otpVerified ? (
                    <>
                      <button 
                        onClick={() => {
                          // Close modal without finalizing
                          resetOtpModal();
                          setShowContractModal(false);
                          setOtpVerified(false);
                          setDigitalSignature(null);
                        }}
                        disabled={otpLoading}
                        style={{ 
                          flex: 1, 
                          padding: 10, 
                          background: '#ddd', 
                          color: '#000',
                          border: 'none', 
                          borderRadius: 6, 
                          fontSize: 14,
                          fontWeight: 400,
                          cursor: 'pointer'
                        }}
                      >
                        {t('cancelButton', siteLang) || 'Cancel'}
                      </button>
                      <button 
                        onClick={async () => {
                          console.log('Action button clicked after OTP verification, pendingAction=', pendingAction);
                          await finalizeContract(pendingAction || 'accepted');
                        }}
                        disabled={otpLoading}
                        style={{ 
                          flex: 1, 
                          padding: 10, 
                          background: '#236902', 
                          color: '#fff',
                          border: 'none', 
                          borderRadius: 6, 
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: otpLoading ? 'not-allowed' : 'pointer',
                          opacity: otpLoading ? 0.6 : 1
                        }}
                      >
                        {otpLoading ? (t('processing', siteLang) || 'Processing...') : 
                          (pendingAction === 'reject' ? (t('contractReject', siteLang) || 'Reject & Confirm') : (t('acceptContract', siteLang) || 'Accept & Confirm'))}
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={resetOtpModal}
                      disabled={otpLoading}
                      style={{ 
                        flex: 1, 
                        padding: 10, 
                        background: '#ddd', 
                        color: '#000',
                        border: 'none', 
                        borderRadius: 6, 
                        fontSize: 14,
                        fontWeight: 400,
                        cursor: 'pointer'
                      }}
                    >
                      {t('cancelButton', siteLang) || 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )}
  </> );
};

export default Navbar;
