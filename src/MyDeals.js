import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { t } from './i18n';
import Navbar from './Navbar';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  * { box-sizing: border-box; }

  .mydeals-root {
    min-height: 100vh;
    font-family: 'Inter', sans-serif;
    background: linear-gradient(135deg, #0a2e0a 0%, #1a5c10 30%, #2d8a1f 60%, #53b635 100%);
    background-attachment: fixed;
    position: relative;
    overflow-x: hidden;
  }

  .mydeals-root::before {
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

  /* Floating orbs */
  .orb {
    position: fixed;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.18;
    pointer-events: none;
    z-index: 0;
    animation: floatOrb 12s ease-in-out infinite;
  }
  .orb-1 { width: 400px; height: 400px; background: #53b635; top: -100px; left: -100px; animation-delay: 0s; }
  .orb-2 { width: 300px; height: 300px; background: #236902; bottom: 10%; right: -80px; animation-delay: 4s; }
  .orb-3 { width: 250px; height: 250px; background: #8fdb5e; top: 40%; left: 60%; animation-delay: 8s; }

  @keyframes floatOrb {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -20px) scale(1.05); }
    66% { transform: translate(-20px, 30px) scale(0.95); }
  }

  /* Leaf particles */
  .leaf {
    position: fixed;
    width: 10px;
    height: 10px;
    opacity: 0;
    pointer-events: none;
    z-index: 0;
    animation: leafFall linear infinite;
  }
  .leaf::before {
    content: '🌿';
    font-size: 16px;
  }
  .leaf-1 { left: 5%;  animation-duration: 14s; animation-delay: 0s; }
  .leaf-2 { left: 20%; animation-duration: 18s; animation-delay: 3s; }
  .leaf-3 { left: 40%; animation-duration: 12s; animation-delay: 6s; }
  .leaf-4 { left: 65%; animation-duration: 16s; animation-delay: 1s; }
  .leaf-5 { left: 85%; animation-duration: 20s; animation-delay: 9s; }

  @keyframes leafFall {
    0%   { transform: translateY(-40px) rotate(0deg); opacity: 0; }
    10%  { opacity: 0.6; }
    90%  { opacity: 0.3; }
    100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
  }

  /* Main container */
  .mydeals-main {
    position: relative;
    z-index: 1;
    padding: 5rem 1.5rem 3rem;
    max-width: 1280px;
    margin: 0 auto;
    animation: fadeSlideUp 0.7s cubic-bezier(0.22,1,0.36,1) both;
  }

  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Glass panel */
  .glass-panel {
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
    transform-style: preserve-3d;
  }

  /* Header */
  .deals-title {
    text-align: center;
    font-size: 2.4rem;
    font-weight: 800;
    color: transparent;
    background: linear-gradient(135deg, #1a5c10 0%, #236902 50%, #53b635 100%);
    -webkit-background-clip: text;
    background-clip: text;
    margin: 0 0 0.25rem;
    letter-spacing: -0.5px;
    text-shadow: none;
  }
  .deals-subtitle {
    text-align: center;
    font-size: 0.95rem;
    color: #5a8a4a;
    margin: 0 0 2rem;
    font-weight: 500;
  }

  /* Search/sort bar */
  .search-bar {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: flex-end;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }
  .search-input, .sort-select {
    padding: 9px 14px;
    border: 1.5px solid #d4edcc;
    border-radius: 10px;
    font-size: 0.9rem;
    font-family: inherit;
    background: rgba(255,255,255,0.9);
    color: #1a3d0a;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
  }
  .search-input:focus, .sort-select:focus {
    border-color: #53b635;
    box-shadow: 0 0 0 3px rgba(83,182,53,0.15);
    transform: translateY(-1px);
  }

  /* Form section */
  .form-section {
    background: linear-gradient(135deg, rgba(234,246,234,0.6) 0%, rgba(255,255,255,0.4) 100%);
    border: 1px solid rgba(83,182,53,0.2);
    border-radius: 16px;
    padding: 1.75rem;
    margin-bottom: 2rem;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.8);
  }
  .form-section-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: #236902;
    margin: 0 0 1.25rem;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .form-section-title::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 18px;
    background: linear-gradient(180deg, #53b635, #236902);
    border-radius: 2px;
  }

  .form-grid {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .form-label {
    font-size: 0.8rem;
    font-weight: 700;
    color: #2d5c1a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .form-input, .form-select {
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
  .form-input:focus, .form-select:focus {
    border-color: #53b635;
    box-shadow: 0 0 0 3px rgba(83,182,53,0.18), 0 2px 8px rgba(35,105,2,0.1);
    transform: translateY(-2px);
  }
  .form-helper {
    font-size: 0.74rem;
    color: #6b9b5a;
  }

  /* File upload zone */
  .upload-zone {
    border: 2px dashed #b2dfa0;
    border-radius: 12px;
    padding: 16px 24px;
    background: rgba(234,246,234,0.5);
    text-align: center;
    transition: border-color 0.2s, background 0.2s;
    cursor: pointer;
  }
  .upload-zone:hover {
    border-color: #53b635;
    background: rgba(83,182,53,0.07);
  }

  /* Submit button */
  .submit-btn {
    padding: 0.85rem 2.5rem;
    background: linear-gradient(135deg, #236902 0%, #53b635 100%);
    color: #fff;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(35,105,2,0.3), 0 1px 0 rgba(255,255,255,0.15) inset;
    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s, filter 0.18s;
    letter-spacing: 0.3px;
    position: relative;
    overflow: hidden;
  }
  .submit-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
    border-radius: inherit;
  }
  .submit-btn:hover:not(:disabled) {
    transform: translateY(-3px) scale(1.03);
    box-shadow: 0 8px 28px rgba(35,105,2,0.35);
    filter: brightness(1.05);
  }
  .submit-btn:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
    box-shadow: 0 2px 8px rgba(35,105,2,0.2);
  }
  .submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    animation: pulse 1.2s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100%{opacity:0.7;} 50%{opacity:0.5;} }

  /* Toast notifications */
  .toast {
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 9999;
    padding: 14px 20px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.95rem;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    animation: toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: 360px;
  }
  .toast-success { background: #236902; color: #fff; }
  .toast-error { background: #c62828; color: #fff; }
  @keyframes toastIn {
    from { opacity: 0; transform: translateX(60px) scale(0.9); }
    to   { opacity: 1; transform: translateX(0) scale(1); }
  }

  /* Cards grid */
  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px;
  }

  /* Deal card */
  .deal-card {
    background: #fff;
    border-radius: 16px;
    border: 1px solid rgba(83,182,53,0.15);
    box-shadow: 0 4px 16px rgba(35,105,2,0.07), 0 1px 0 rgba(255,255,255,0.9) inset;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: transform 0.35s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.35s ease;
    transform-style: preserve-3d;
    cursor: default;
    animation: cardIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(20px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .deal-card:hover {
    transform: translateY(-8px) rotateX(2deg) rotateY(-1deg) scale(1.02);
    box-shadow: 0 20px 48px rgba(35,105,2,0.18), 0 4px 12px rgba(0,0,0,0.08);
  }

  /* Card image */
  .card-img-wrap {
    width: 100%;
    height: 165px;
    overflow: hidden;
    background: linear-gradient(135deg, #e8f5e2 0%, #f0faf0 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  .card-img-wrap::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    background: linear-gradient(transparent, rgba(255,255,255,0.8));
    pointer-events: none;
  }
  .card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94);
  }
  .deal-card:hover .card-img { transform: scale(1.08); }
  .card-no-img {
    color: #b2cfa8;
    font-size: 0.85rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .card-no-img span { font-size: 2rem; }

  /* Card body */
  .card-body {
    padding: 14px 14px 10px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .card-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  .card-crop-name {
    margin: 0;
    color: #1a5c10;
    font-size: 1.1rem;
    font-weight: 800;
    letter-spacing: -0.2px;
  }
  .card-variety-badge {
    background: linear-gradient(135deg, #eaf6ea, #d4f0d4);
    color: #236902;
    padding: 3px 9px;
    border-radius: 20px;
    font-weight: 700;
    font-size: 0.78rem;
    border: 1px solid rgba(83,182,53,0.25);
    white-space: nowrap;
  }

  .card-info-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .card-info-box {
    background: linear-gradient(135deg, #f5fbf3 0%, #edf7ea 100%);
    border: 1px solid rgba(83,182,53,0.12);
    border-radius: 10px;
    padding: 8px 10px;
  }
  .card-info-label {
    font-size: 0.7rem;
    color: #6b9b5a;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    margin-bottom: 2px;
  }
  .card-info-value {
    font-size: 0.88rem;
    font-weight: 700;
    color: #1a3d0a;
  }

  /* Status badge */
  .status-badge {
    text-align: center;
    padding: 6px 10px;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.3px;
  }
  .status-expired { background: linear-gradient(135deg, #ffebee, #fce4ec); color: #c62828; border: 1px solid rgba(198,40,40,0.2); }
  .status-today { background: linear-gradient(135deg, #fff8e1, #fff3cd); color: #e65100; border: 1px solid rgba(230,81,0,0.2); }
  .status-active { background: linear-gradient(135deg, #e8f5e2, #d4f0d4); color: #2e7d32; border: 1px solid rgba(46,125,50,0.2); }
  .status-none { background: rgba(240,240,240,0.8); color: #888; border: 1px solid rgba(0,0,0,0.06); }

  /* Edit inline inputs */
  .edit-input {
    padding: 10px 14px;
    border: 1.5px solid #d4edcc;
    border-radius: 10px;
    font-size: 0.9rem;
    font-family: inherit;
    background: rgba(255,255,255,0.95);
    color: #1a3d0a;
    outline: none;
    width: 100%;
    transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s;
  }
  .edit-input:focus {
    border-color: #53b635;
    box-shadow: 0 0 0 3px rgba(83,182,53,0.15);
    transform: translateY(-1px);
  }

  /* Card action buttons */
  .card-actions {
    display: flex;
    gap: 8px;
    padding: 0 14px 12px;
  }
  .btn-edit {
    flex: 1;
    padding: 8px 12px;
    background: linear-gradient(135deg, #1565c0, #1976d2);
    color: #fff;
    border: none;
    border-radius: 9px;
    font-size: 0.82rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s;
    box-shadow: 0 2px 8px rgba(25,118,210,0.25);
  }
  .btn-edit:hover {
    transform: translateY(-2px) scale(1.04);
    box-shadow: 0 6px 16px rgba(25,118,210,0.35);
  }
  .btn-delete {
    flex: 1;
    padding: 8px 12px;
    background: linear-gradient(135deg, #b71c1c, #e53935);
    color: #fff;
    border: none;
    border-radius: 9px;
    font-size: 0.82rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s;
    box-shadow: 0 2px 8px rgba(229,57,53,0.25);
  }
  .btn-delete:hover {
    transform: translateY(-2px) scale(1.04);
    box-shadow: 0 6px 16px rgba(229,57,53,0.35);
  }
  .btn-save {
    padding: 8px 12px;
    background: linear-gradient(135deg, #236902, #53b635);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.3s, transform 0.2s;
    box-shadow: 0 2px 8px rgba(35,105,2,0.2);
    white-space: nowrap;
  }
  .btn-save:hover { background: linear-gradient(135deg, #1a5c10, #2e7d32); transform: translateY(-2px); box-shadow: 0 6px 16px rgba(35,105,2,0.35); }
  .btn-cancel {
    padding: 8px 12px;
    background: #ffb300;
    color: #000;
    border: none;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.3s, transform 0.2s;
    box-shadow: 0 2px 8px rgba(255,179,0,0.2);
    white-space: nowrap;
  }
  .btn-cancel:hover { background: #e65100; color: #fff; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(255,179,0,0.35); }
  .btn-edit:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(5,97,10,0.35); }
  .btn-delete:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(211,47,47,0.35); }

  /* Empty state */
  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: #6b9b5a;
    animation: fadeSlideUp 0.6s ease both;
  }
  .empty-icon { font-size: 4rem; display: block; margin-bottom: 1rem; opacity: 0.6; }
  .empty-text { font-size: 1rem; font-weight: 600; }

  /* Section divider */
  .section-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(83,182,53,0.3), transparent);
    margin: 2rem 0;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .glass-panel { padding: 1.5rem; }
    .deals-title { font-size: 1.8rem; }
    .cards-grid { grid-template-columns: 1fr; }
    .search-bar { justify-content: stretch; }
    .search-input { flex: 1; }
    .form-grid { flex-direction: column; }
  }
`;

const MyDeals = () => {
  const [sellerName, setSellerName] = React.useState(localStorage.getItem('agriai_name') || '');
  const [sellerPhone, setSellerPhone] = React.useState(localStorage.getItem('agriai_phone') || '');
  const [sellerId, setSellerId] = React.useState(localStorage.getItem('agriai_id') || null);
  const [sellerEmail, setSellerEmail] = React.useState(localStorage.getItem('agriai_email') || '');
  const [region, setRegion] = React.useState('');
  const [state, setState] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [variety, setVariety] = React.useState('');
  const [cropName, setCropName] = React.useState('');
  const [quantity, setQuantity] = React.useState('');
  const [imageFile, setImageFile] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [saved, setSaved] = React.useState(null);
  const [listings, setListings] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [sort, setSort] = React.useState('recent');
  const [editingId, setEditingId] = React.useState(null);
  const [editQuantity, setEditQuantity] = React.useState('');
  const [editDeliveryDate, setEditDeliveryDate] = React.useState('');
  const [deliveryDate, setDeliveryDate] = React.useState('');
  const [lastFetchUrl, setLastFetchUrl] = React.useState('');
  const [lastFetchJson, setLastFetchJson] = React.useState(null);
  const [siteLang, setSiteLang] = React.useState(() => localStorage.getItem('agri_lang') || 'en');

  const todayStr = React.useMemo(() => {
    try { return new Date().toISOString().slice(0,10); } catch (e) { return ''; }
  }, []);

  const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');

  const fetchListings = React.useCallback(() => {
    const sid = sellerId || localStorage.getItem('agriai_id') || '';
    const sphone = localStorage.getItem('agriai_phone') || sellerPhone || '';
    let url = `${apiBase}/deals/list`;
    const qs = [];
    if (sid) qs.push(`buyer_id=${encodeURIComponent(sid)}`);
    else if (sphone) qs.push(`buyer_phone=${encodeURIComponent(sphone)}`);
    if (qs.length) url += '?' + qs.join('&');
    fetch(url)
      .then(r => r.json())
      .then(j => {
        setLastFetchUrl(url);
        try { setLastFetchJson(JSON.stringify(j, null, 2)); } catch (e) { setLastFetchJson(String(j)); }
        if (j && j.ok) {
          const buyerId = (sellerId || localStorage.getItem('agriai_id') || '').toString();
          const buyerPhone = (sellerPhone || localStorage.getItem('agriai_phone') || '').toString();
          const filteredDeals = Array.isArray(j.deals) ? j.deals.filter(d => {
            if (buyerId) return String(d.buyer_id || '').trim() === buyerId.trim();
            if (buyerPhone) return String(d.buyer_phone || '').trim() === buyerPhone.trim();
            return true;
          }) : [];
          setListings(filteredDeals);
        } else {
          setListings([]);
        }
      }).catch(e => { console.error('fetchListings error', e); setLastFetchUrl(url); setLastFetchJson(String(e)); setListings([]); });
  }, [apiBase, sellerId, sellerPhone]);

  const visibleListings = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = Array.isArray(listings) ? [...listings] : [];
    if (q) arr = arr.filter(l => (l.crop_name || '').toLowerCase().includes(q));
    if (sort === 'recent') arr.sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    if (sort === 'qty_desc') arr.sort((a,b) => Number(b.quantity_kg||0) - Number(a.quantity_kg||0));
    if (sort === 'qty_asc') arr.sort((a,b) => Number(a.quantity_kg||0) - Number(b.quantity_kg||0));
    return arr;
  }, [listings, query, sort]);

  const formatDate = (v) => {
    if (!v) return '';
    try {
      const d = new Date(v);
      if (isNaN(d)) return String(v);
      const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const timePart = d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
      return `${datePart}, ${timePart}`;
    } catch (e) { return String(v); }
  };

  React.useEffect(() => { fetchListings(); }, [fetchListings]);

  // Listen for contract deletion event from farmer's FarmerHistory and refresh deals
  React.useEffect(() => {
    const onContractDeleted = (e) => {
      console.log('Contract deleted, refreshing deals with restored quantities:', e.detail);
      fetchListings();
    };
    const onContractCreated = (e) => {
      console.log('Contract created, refreshing deals with updated quantities:', e.detail);
      fetchListings();
    };
    window.addEventListener('agriai:contract:deleted', onContractDeleted);
    window.addEventListener('agriai:contracts:created', onContractCreated);
    return () => { 
      try { window.removeEventListener('agriai:contract:deleted', onContractDeleted); } catch (e) {}
      try { window.removeEventListener('agriai:contracts:created', onContractCreated); } catch (e) {}
    };
  }, [fetchListings]);

  React.useEffect(() => {
    const onLang = (e) => { 
      const l = (e && e.detail && e.detail.lang) ? e.detail.lang : (localStorage.getItem('agri_lang') || 'en'); 
      setSiteLang(l); 
      window.location.reload(); // Refresh the page automatically on language change
    };
    window.addEventListener('agri:lang:change', onLang);
    return () => { try { window.removeEventListener('agri:lang:change', onLang); } catch (e) {} };
  }, []);

  React.useEffect(() => {
    const id = setInterval(() => { fetchListings(); }, 15000);
    return () => clearInterval(id);
  }, [fetchListings]);

  // Auto-dismiss toast
  React.useEffect(() => {
    if (saved) {
      const timer = setTimeout(() => setSaved(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [saved]);

  const cropNameRef = React.useRef(null);

  const startEdit = (l) => {
    setEditingId(l.id);
    setEditQuantity(l.quantity_kg || '');
    setEditDeliveryDate((l.delivery_date || '').slice(0, 10));
  };
  const cancelEdit = () => { setEditingId(null); setEditQuantity(''); setEditDeliveryDate(''); };
  const saveEdit = async (id) => {
    const sid = sellerId || localStorage.getItem('agriai_id') || '';
    try {
      const body = { quantity_kg: editQuantity };
      if (editDeliveryDate) body.delivery_date = editDeliveryDate;
      if (sid) body.buyer_id = sid;
      const res = await fetch(`${apiBase}/deals/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await res.json();
      if (res.ok && j.ok) {
        setEditingId(null);
        setEditQuantity('');
        setEditDeliveryDate('');
        fetchListings();
      } else {
        console.error('Failed to save edit', j);
        alert(t('failedUpdate', siteLang) + ': ' + (j.error || JSON.stringify(j)));
      }
    } catch (e) {
      console.error('saveEdit error', e);
      alert(t('failedUpdate', siteLang));
    }
  };

  const deleteDeal = async (id) => {
    if (!window.confirm(t('confirmDelete', siteLang))) return;
    const sid = sellerId || localStorage.getItem('agriai_id') || '';
    try {
      let url = `${apiBase}/deals/${id}`;
      if (sid) url += `?buyer_id=${encodeURIComponent(sid)}`;
      const res = await fetch(url, { method: 'DELETE' });
      const j = await res.json();
      if (res.ok && j.ok) {
        setListings(prev => prev.filter(x => x.id !== id));
        setTimeout(fetchListings, 300);
      } else {
        console.error('delete failed', j);
        alert(t('failedDelete', siteLang) + ': ' + (j.error || JSON.stringify(j)));
      }
    } catch (e) {
      console.error('deleteDeal error', e);
      alert(t('failedDelete', siteLang) + ': ' + String(e));
    }
  };

  React.useEffect(() => {
    const email = localStorage.getItem('agriai_email');
    const phone = localStorage.getItem('agriai_phone');
    if (!email && !phone) return;
    (async () => {
      try {
        const body = email ? { email } : { phone };
        const res = await fetch(`${apiBase}/profile/get`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const j = await res.json();
        if (res.ok && j.user) {
          if (j.user.id) {
            setSellerId(j.user.id);
            try { localStorage.setItem('agriai_id', String(j.user.id)); } catch (e) {}
          }
          if (j.user.name) setSellerName(j.user.name);
          if (j.user.phone) setSellerPhone(j.user.phone);
          if (j.user.email) { setSellerEmail(j.user.email); try { localStorage.setItem('agriai_email', j.user.email); } catch (e) {} }
          if (j.user.region) setRegion(j.user.region);
          if (j.user.state) setState(j.user.state);
        }
      } catch (e) { console.error('Could not fetch profile for seller id', e); }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaved(null);
    if (!imageFile) {
      setSaved({ status: 'error', message: t('attachImageError', siteLang) });
      setLoading(false);
      return;
    }
    try {
      const formData = new FormData();
      formData.append('buyer_name', sellerName);
      formData.append('buyer_phone', sellerPhone);
      if (sellerEmail) formData.append('buyer_email', sellerEmail);
      formData.append('region', region);
      formData.append('state', state);
      formData.append('crop_name', cropName);
      if (category) formData.append('category', category);
      if (variety) formData.append('variety', variety);
      formData.append('quantity_kg', quantity);
      if (deliveryDate) formData.append('delivery_date', deliveryDate);
      if (sellerId) formData.append('buyer_id', sellerId);
      if (imageFile) formData.append('image', imageFile, imageFile.name);
      if (siteLang) formData.append('lang', siteLang);

      const res = await fetch(`${apiBase}/deals`, { method: 'POST', body: formData });
      const j = await res.json();
      if (res.ok && j.ok) {
        setSaved({ status: 'success', stored: j.stored || 'unknown' });
        setSellerName(''); setCropName(''); setCategory(''); setVariety(''); setQuantity(''); setDeliveryDate(''); setRegion(''); setState('');
        setImageFile(null);
        fetchListings();
      } else {
        setSaved({ status: 'error', message: (j.error || JSON.stringify(j)) });
      }
    } catch (err) {
      console.error(err);
      setSaved('error');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ background: 'rgba(83, 255, 3, 0.12)', backgroundAttachment: 'fixed', minHeight: '100vh', color: '#000', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        .mc-root .navbar {
          background: oklch(0.12 0.03 160 / 0.5) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
        }
        .mc-root .navbar select {
          background: oklch(0.12 0.03 160 / 0.6) !important;
          border: 1px solid oklch(0.65 0.22 145 / 0.3) !important;
          color: rgba(255,255,255,0.9) !important;
        }
        .mc-root .navbar select option {
          background: #1a1a1a;
          color: #ffffff;
        }
      `}</style>
      <div className="mc-root">
        <Navbar />
        <main style={{padding: '6rem 1rem 6rem', position: 'relative', zIndex: 1}}>
          <div style={{maxWidth:1000,margin:'0 auto',background:'rgba(255,255,255,0.92)',backdropFilter:'blur(20px) saturate(1.6)',WebkitBackdropFilter:'blur(20px) saturate(1.6)',border:'1px solid rgba(255,255,255,0.6)',borderRadius:'24px',padding:'2.5rem',boxShadow:'0 8px 32px rgba(35,105,2,0.12), 0 32px 64px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)'}}>
            <h1 style={{backgroundImage:'linear-gradient(135deg, #1a5c10 0%, #236902 50%, #53b635 100%)',WebkitBackgroundClip:'text',backgroundClip:'text',color:'transparent',textAlign:'center',marginBottom:40,fontSize:'2rem',fontWeight:800,margin:0}}>{t('myDealsTitle', siteLang)}</h1>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>

  {/* --- First Row: Deal Details --- */}
  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>


    {/* Category */}
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 700, color: '#2d5c1a', marginBottom: 6, textAlign: 'center', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('formCategoryLabel', siteLang)}</div>
      <select
        value={category}
        onChange={e => setCategory(e.target.value)}
        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #d4edcc', borderRadius: 10, fontSize: '0.9rem', fontFamily: 'inherit', background: 'rgba(255,255,255,0.95)', color: '#1a3d0a', outline: 'none', transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.2s' }}
      >
        <option value="">{t('selectCategoryPlaceholder', siteLang)}</option>
        <option value="Food Crops">{t('catFood', siteLang)}</option>
        <option value="Fruits and Vegetables">{t('catFruits', siteLang)}</option>
        <option value="Masalas">{t('catMasalas', siteLang)}</option>
      </select>
      <div style={{ fontSize: 14,color: '#000', marginTop: 6 }}>
        {t('chooseCategoryText', siteLang)}
      </div>
    </div>

    {/* Crop Name */}
    <div style={{ flex: 2, minWidth: 220 }}>
      <div style={{ fontWeight: 700, color: '#2d5c1a', marginBottom: 6, textAlign: 'center', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('formCropNameLabel', siteLang)}</div>
      <input
        ref={cropNameRef}
        placeholder={t('placeholderCropExample', siteLang)}
        value={cropName}
        onChange={e => setCropName(e.target.value)}
        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #d4edcc', borderRadius: 10, fontSize: '0.9rem', fontFamily: 'inherit', background: 'rgba(255,255,255,0.95)', color: '#1a3d0a', outline: 'none', transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.2s' }}
        required
      />
      <div style={{ fontSize: 14, color: '#000000', marginTop: 6 }}>
        {t('cropNameHelper', siteLang)}
      </div>
    </div>

    {/* Variety */}
    <div style={{ flex: 1, minWidth: 180 }}>
      <div style={{ fontWeight: 700, color: '#2d5c1a', marginBottom: 6, textAlign: 'center', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('formVarietyLabel', siteLang)}</div>
      <input
        placeholder={t('varietyHelper', siteLang)}
        value={variety}
        onChange={e => setVariety(e.target.value)}
        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #d4edcc', borderRadius: 10, fontSize: '0.9rem', fontFamily: 'inherit', background: 'rgba(255,255,255,0.95)', color: '#1a3d0a', outline: 'none', transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.2s' }}
      />
      <div style={{ fontSize: 14, color: '#000000', marginTop: 6 }}>
        {t('varietyHelper', siteLang)}
      </div>
    </div>

    {/* Quantity */}
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 700, color: '#2d5c1a', marginBottom: 6, textAlign: 'center', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('formQuantityLabel', siteLang)}</div>
      <input
        placeholder={t('formQuantityLabel', siteLang)}
        type="number"
        step="0.001"
        value={quantity}
        onChange={e => setQuantity(e.target.value)}
        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #d4edcc', borderRadius: 10, fontSize: '0.9rem', fontFamily: 'inherit', background: 'rgba(255,255,255,0.95)', color: '#1a3d0a', outline: 'none', transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.2s' }}
        required
      />
      <div style={{ fontSize: 14, color: '#000', marginTop: 6 }}>
        {t('quantityHelper', siteLang)}
      </div>
    </div>

    {/* Delivery Date */}
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 700, color: '#2d5c1a', marginBottom: 6, textAlign: 'center', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('formDeliveryDateLabel', siteLang)}</div>
      <input
        type="date"
        min={todayStr}
        value={deliveryDate}
        onChange={e => setDeliveryDate(e.target.value)}
        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #d4edcc', borderRadius: 10, fontSize: '0.9rem', fontFamily: 'inherit', background: 'rgba(255,255,255,0.95)', color: '#1a3d0a', outline: 'none', transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.2s' }}
      />
      <div style={{ fontSize: 14, color: '#000', marginTop: 6 }}>
        {t('formDeliveryDateLabel', siteLang)}
      </div>
    </div>

  </div>

  {/* --- Second Row: Image Upload --- */}
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    gap: 24,
    marginTop: 12,
    alignItems: 'flex-start',
    flexWrap: 'wrap'
  }}>
    {/* Image Upload */}
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontWeight: 700, color: '#2d5c1a', marginBottom: 6, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('formImageLabel', siteLang)}</div>
      <div style={{
        padding: 6,
        border: '1.5px dashed #d4edcc',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.95)',
        display: 'inline-block'
      }}>
        <input
          required
          type="file"
          accept="image/*"
          onChange={e => setImageFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
        />
      </div>
      <div style={{ fontSize: 14,color: '#000', marginTop: 6 }}>
        {t('formAttachPhoto', siteLang)}
      </div>
    </div>
  </div>

  {/* --- Submit Button --- */}
  <div style={{ display: 'flex', justifyContent: 'center' }}>
    <button
      type="submit"
      onMouseDown={e => e.currentTarget.style.transform = 'translateY(2px) scale(0.995)'}
      onMouseUp={e => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
      style={{
        padding: '0.85rem 3rem',
        background: (!sellerName || !cropName || !quantity || !category || !imageFile) 
          ? '#ccc' 
          : 'linear-gradient(135deg, #236902 0%, #53b635 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: 12,
        transform: loading ? 'scale(0.98)' : 'scale(1)',
        transition: 'transform 120ms ease, box-shadow 120ms ease, filter 120ms ease',
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: '1rem',
        fontWeight: 700,
        cursor: (!sellerName || !cropName || !quantity || !category || !imageFile) ? 'not-allowed' : 'pointer',
        boxShadow: (!sellerName || !cropName || !quantity || !category || !imageFile) 
          ? 'none' 
          : '0 4px 16px rgba(35,105,2,0.3), 0 1px 0 rgba(255,255,255,0.15) inset',
        outline: 'none',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => { if (!loading && sellerName && cropName && quantity && category && imageFile) { e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(35,105,2,0.35)'; e.currentTarget.style.filter = 'brightness(1.05)'; } }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(35,105,2,0.3), 0 1px 0 rgba(255,255,255,0.15) inset'; e.currentTarget.style.filter = 'brightness(1)'; }}
      disabled={loading || !sellerName || !cropName || !quantity || !category || !imageFile}
    >
      {loading ? t('uploading', siteLang) : t('uploadButton', siteLang)}
    </button>
  </div>

</form>

        {/* My Deals Section */}
        <section style={{marginTop:15}}>
             <style>
    {`
      .card-container {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .card-container:hover {
        transform: translateY(-8px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
      }
      .card-image {
        width: 100%;
        height: 160px;
        object-fit: cover;
        border-radius: 8px;
        transition: transform 0.4s ease;
      }
      .card-container:hover .card-image {
        transform: scale(1.08);
      }
    `}
  </style>
            
            <h2 style={{marginBottom:8, textAlign:'center', color:'#236902', fontSize:'1.8rem', fontWeight: 800}}>{t('myDealsTitle', siteLang)}</h2>
            {visibleListings.length === 0 && <div style={{textAlign:'center'}}>{t('noDealsYet', siteLang)}</div>}

              {visibleListings.length > 0 && (
              <div style={{display:'grid', gridTemplateColumns:'repeat(4, minmax(240px, 1fr))', gap:16}}>
                  {visibleListings.map((l, idx) => {
                    const today = new Date(); today.setHours(0,0,0,0);
                    const dd = l.delivery_date ? new Date(l.delivery_date) : null;
                    const isExpired = dd ? (dd < today) : false;
                    const isToday = dd ? (
                      dd.getFullYear() === today.getFullYear() &&
                      dd.getMonth() === today.getMonth() &&
                      dd.getDate() === today.getDate()
                    ) : false;

                    return (
                  <div key={l.id} className="card-container" style={{background:'#fff', borderRadius:8, padding:'12px 12px 1px', border:'1px solid #eaeaea', minHeight:180, display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
                    <div style={{width:'100%', height:160, borderRadius:8, overflow:'hidden', background:'#f6f6f6', display:'flex', alignItems:'center', justifyContent:'center', position:'relative'}}>
                      {(() => {
                        let imageSrc = null;
                        // Try image_url first (from backend)
                        if (l.image_url && typeof l.image_url === 'string' && l.image_url.trim()) {
                          imageSrc = l.image_url;
                        } 
                        // Fallback to image_path (from backend)
                        else if (l.image_path && typeof l.image_path === 'string' && l.image_path.trim()) {
                          imageSrc = apiBase.replace(/\/$/, '') + '/images/' + encodeURIComponent(l.image_path);
                        }
                        
                        if (imageSrc) {
                          return (
                            <img 
                              src={imageSrc} 
                              alt={l.crop_name}
                              className="card-image" 
                              style={{width:'100%', height:'100%', objectFit:'cover', display:'block'}}
                              onError={(e) => {
                                console.warn('Image load error for:', imageSrc);
                                e.target.parentElement.innerHTML = `<div style="color:#999;textAlign:'center';width:100%;height:100%;display:flex;alignItems:center;justifyContent:center">${t('noImage', siteLang)}</div>`;
                              }}
                            />
                          );
                        }
                        return <div style={{color:'#999', textAlign:'center'}}>{t('noImage', siteLang)}</div>;
                      })()}
                    </div>

                    <div style={{marginTop:10, padding:'0 0 4px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, flexWrap:'wrap'}}>
                      <div>
                        <h3 style={{margin:0, color:'#236902', fontSize:18}}>{l.crop_name}</h3>
                        {l.variety && <div style={{fontSize:14, color:'#000', marginTop:2}}>{l.variety}</div>}
                      </div>
                    </div>

                    <div style={{display:'flex', gap:8, marginTop:10, flexWrap:'wrap'}}>
                      <div style={{padding:6, background:'#f3f3f3', borderRadius:6, flex:'1 1 120px'}}>
                        <div style={{fontSize:12, color:'#000'}}>{t('cardQuantityLabel', siteLang)}</div>
                        {editingId === l.id ? (
                          <input
                            className="edit-input"
                            value={editQuantity}
                            onChange={e => setEditQuantity(e.target.value)}
                            style={{width:'100%', padding:4, fontSize:12}}
                          />
                        ) : (
                          <div style={{fontWeight:700}}>{Number(l.quantity_kg || 0).toLocaleString('en-IN')} kg</div>
                        )}
                      </div>
                      <div style={{padding:6, background:'#f3f3f3', borderRadius:6, flex:'1 1 160px'}}>
                        <div style={{fontSize:12, color:'#000'}}>{t('cardDeliveryDateLabel', siteLang)}</div>
                        {editingId === l.id ? (
                          <input
                            className="edit-input"
                            type="date"
                            min={todayStr}
                            value={editDeliveryDate}
                            onChange={e => setEditDeliveryDate(e.target.value)}
                            style={{width:'100%', padding:4, fontSize:12}}
                          />
                        ) : (
                          <div style={{fontWeight:700}}>{l.delivery_date ? new Date(l.delivery_date).toLocaleDateString('en-GB') : '—'}</div>
                        )}
                      </div>
                    </div>

                    <div style={{display:'flex', gap:8, marginTop:10, flexWrap:'wrap'}}>
                      <div style={{padding:6, background:'#f3f3f3', borderRadius:6, flex:'1 1 160px'}}>
                        <div style={{fontSize:12, color:'#000'}}>{t('cardUploadedLabel', siteLang)}</div>
                        <div style={{fontWeight:700}}>{formatDate(l.created_at || l.createdAt || l.created)}</div>
                      </div>
                    </div>

                    <div style={{marginTop:10}}>
                      {(() => {
                        const today = new Date(); today.setHours(0,0,0,0);
                        const dd = l.delivery_date ? new Date(l.delivery_date) : null;
                        const isExpired = dd ? (dd < today) : false;
                        const isToday = dd ? (dd.getFullYear() === today.getFullYear() && dd.getMonth() === today.getMonth() && dd.getDate() === today.getDate()) : false;
                        if (isExpired) return (<div style={{background:'#f72213ff', color:'#fff', padding:'6px 8px', borderRadius:6, fontWeight:700, textAlign:'center'}}>{t('expiredLabel', siteLang)}</div>);
                        if (isToday) return (<div style={{background:'#ffb300', color:'#000', padding:'6px 8px', borderRadius:6, fontWeight:700, textAlign:'center'}}>{t('expiresToday', siteLang)}</div>);
                        return null;
                      })()}
                    </div>

                    <div style={{display:'flex', flexDirection: editingId === l.id ? 'column' : 'row', justifyContent:'space-between', alignItems:'center', margin:'12px 0 8px', gap:8}}>
                      {editingId === l.id ? (
                        <>
                          <div style={{display:'flex', gap:8}}>
                            <button className="btn-save" onClick={() => saveEdit(l.id)} style={{padding:'4px 8px', fontSize:12}}>{t('saveButton', siteLang)}</button>
                            <button className="btn-cancel" onClick={cancelEdit} style={{padding:'4px 8px', fontSize:12}}>{t('cancelButton', siteLang)}</button>
                          </div>
                          <button 
                            onClick={() => deleteDeal(l.id)} 
                            style={{
                              flex:1,
                              padding:'8px 12px',
                              background:'#d32f2f',
                              color:'#fff',
                              border:'none',
                              borderRadius:8,
                              fontWeight:600,
                              transition:'background 0.3s, transform 0.2s',
                              cursor:'pointer'
                            }}
                            onMouseEnter={e => e.target.style.background='#c50c0cff'}
                          >
                            {t('deleteButton', siteLang)}
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => startEdit(l)} 
                            style={{
                              flex:1,
                              padding:'8px 12px',
                              background:'#05610aff',
                              color:'#fff',
                              border:'none',
                              borderRadius:8,
                              fontWeight:600,
                              transition:'background 0.3s, transform 0.2s',
                              cursor:'pointer'
                            }}
                          >
                            {t('editButton', siteLang)}
                          </button>
                          <button 
                            onClick={() => deleteDeal(l.id)} 
                            style={{
                              flex:1,
                              padding:'8px 12px',
                              background:'#d32f2f',
                              color:'#fff',
                              border:'none',
                              borderRadius:8,
                              fontWeight:600,
                              transition:'background 0.3s, transform 0.2s',
                              cursor:'pointer'
                            }}
                            onMouseEnter={e => e.target.style.background='#c50c0cff'}
                          >
                            {t('deleteButton', siteLang)}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  );
                  })}
                </div>
              )}
          </section>
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
    </div>
  );
};

export default MyDeals;
