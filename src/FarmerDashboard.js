import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import ImageSlideshow from './ImageSlideshow';
import Chatbot from './Chatbot';
import { t } from './i18n';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  * { box-sizing: border-box; }

  .fd-root {
    min-height: 100vh;
    font-family: 'Inter', sans-serif;
    background: linear-gradient(135deg, #0a2e0a 0%, #1a5c10 30%, #2d8a1f 60%, #53b635 100%);
    background-attachment: fixed;
    position: relative;
    overflow-x: hidden;
  }

  .fd-root::before {
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

  .fd-orb {
    position: fixed;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.18;
    pointer-events: none;
    z-index: 0;
    animation: fd-floatOrb 12s ease-in-out infinite;
  }
  .fd-orb-1 { width: 400px; height: 400px; background: #53b635; top: -100px; left: -100px; animation-delay: 0s; }
  .fd-orb-2 { width: 300px; height: 300px; background: #236902; bottom: 10%; right: -80px; animation-delay: 4s; }
  .fd-orb-3 { width: 250px; height: 250px; background: #8fdb5e; top: 40%; left: 60%; animation-delay: 8s; }

  @keyframes fd-floatOrb {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -20px) scale(1.05); }
    66% { transform: translate(-20px, 30px) scale(0.95); }
  }

  .fd-leaf {
    position: fixed;
    width: 10px;
    height: 10px;
    opacity: 0;
    pointer-events: none;
    z-index: 0;
    animation: fd-leafFall linear infinite;
  }
  .fd-leaf::before { content: '🌿'; font-size: 16px; }
  .fd-leaf-1 { left: 5%;  animation-duration: 14s; animation-delay: 0s; }
  .fd-leaf-2 { left: 20%; animation-duration: 18s; animation-delay: 3s; }
  .fd-leaf-3 { left: 40%; animation-duration: 12s; animation-delay: 6s; }
  .fd-leaf-4 { left: 65%; animation-duration: 16s; animation-delay: 1s; }
  .fd-leaf-5 { left: 85%; animation-duration: 20s; animation-delay: 9s; }

  @keyframes fd-leafFall {
    0%   { transform: translateY(-40px) rotate(0deg); opacity: 0; }
    10%  { opacity: 0.6; }
    90%  { opacity: 0.3; }
    100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
  }

  .fd-main {
    position: relative;
    z-index: 1;
    padding: 5rem 1.5rem 3rem;
    max-width: 1280px;
    margin: 0 auto;
    animation: fd-fadeSlideUp 0.7s cubic-bezier(0.22,1,0.36,1) both;
  }

  @keyframes fd-fadeSlideUp {
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .fd-glass {
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
  }

  .fd-title {
    text-align: center;
    font-size: 2.4rem;
    font-weight: 800;
    color: transparent;
    background: linear-gradient(135deg, #1a5c10 0%, #236902 50%, #53b635 100%);
    -webkit-background-clip: text;
    background-clip: text;
    margin: 0 0 0.25rem;
    letter-spacing: -0.5px;
  }
  .fd-subtitle {
    text-align: center;
    font-size: 0.95rem;
    color: #5a8a4a;
    margin: 0 0 2rem;
    font-weight: 500;
  }

  .fd-filter-row {
    display: flex;
    gap: 10px;
    align-items: flex-end;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
  }

  .fd-field {
    display: flex;
    flex-direction: column;
    gap: 5px;
    flex: 1 1 140px;
    min-width: 120px;
  }
  .fd-label {
    font-size: 0.78rem;
    font-weight: 700;
    color: #2d5c1a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .fd-select, .fd-input {
    padding: 10px 12px;
    border: 1.5px solid #d4edcc;
    border-radius: 10px;
    font-size: 0.88rem;
    font-family: inherit;
    background: rgba(255,255,255,0.95);
    color: #1a3d0a;
    outline: none;
    width: 100%;
    transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s;
  }
  .fd-select:focus, .fd-input:focus {
    border-color: #53b635;
    box-shadow: 0 0 0 3px rgba(83,182,53,0.18), 0 2px 8px rgba(35,105,2,0.1);
    transform: translateY(-2px);
  }

  .fd-search-btn {
    padding: 0.7rem 2rem;
    background: linear-gradient(135deg, #236902 0%, #53b635 100%);
    color: #fff;
    border: none;
    border-radius: 12px;
    font-size: 0.95rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(35,105,2,0.3), 0 1px 0 rgba(255,255,255,0.15) inset;
    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s, filter 0.18s;
    align-self: flex-end;
    white-space: nowrap;
  }
  .fd-search-btn:hover {
    transform: translateY(-3px) scale(1.03);
    box-shadow: 0 8px 28px rgba(35,105,2,0.35);
    filter: brightness(1.05);
  }
  .fd-search-btn:active {
    transform: translateY(0) scale(0.97);
  }

  .fd-status-row {
    text-align: center;
    margin: 10px 0;
    font-size: 0.95rem;
    font-weight: 600;
  }
  .fd-loading { color: #236902; }
  .fd-error   { color: #c62828; }

  .fd-section-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(83,182,53,0.3), transparent);
    margin: 1.5rem 0;
  }

  .fd-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
  }

  .fd-card {
    background: #fff;
    border-radius: 16px;
    border: 1px solid rgba(83,182,53,0.15);
    box-shadow: 0 4px 16px rgba(35,105,2,0.07), 0 1px 0 rgba(255,255,255,0.9) inset;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: transform 0.35s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.35s ease;
    cursor: default;
    animation: fd-cardIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes fd-cardIn {
    from { opacity: 0; transform: translateY(20px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .fd-card:hover {
    transform: translateY(-8px) rotateX(2deg) rotateY(-1deg) scale(1.02);
    box-shadow: 0 20px 48px rgba(35,105,2,0.18), 0 4px 12px rgba(0,0,0,0.08);
  }

  .fd-card-img-wrap {
    width: 100%;
    height: 165px;
    overflow: hidden;
    background: linear-gradient(135deg, #e8f5e2 0%, #f0faf0 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  .fd-card-img-wrap::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 40px;
    background: linear-gradient(transparent, rgba(255,255,255,0.8));
    pointer-events: none;
  }
  .fd-card-img {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94);
  }
  .fd-card:hover .fd-card-img { transform: scale(1.08); }
  .fd-card-no-img {
    color: #b2cfa8;
    font-size: 0.85rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .fd-card-no-img span { font-size: 2rem; }

  .fd-card-body {
    padding: 12px 14px 8px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .fd-card-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  .fd-card-crop-name {
    margin: 0;
    color: #1a5c10;
    font-size: 1.05rem;
    font-weight: 800;
    letter-spacing: -0.2px;
  }
  .fd-card-variety-badge {
    background: linear-gradient(135deg, #eaf6ea, #d4f0d4);
    color: #236902;
    padding: 3px 9px;
    border-radius: 20px;
    font-weight: 700;
    font-size: 0.75rem;
    border: 1px solid rgba(83,182,53,0.25);
    white-space: nowrap;
  }

  .fd-card-info-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .fd-card-info-box {
    background: linear-gradient(135deg, #f5fbf3 0%, #edf7ea 100%);
    border: 1px solid rgba(83,182,53,0.12);
    border-radius: 10px;
    padding: 7px 10px;
  }
  .fd-card-info-label {
    font-size: 0.68rem;
    color: #6b9b5a;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    margin-bottom: 2px;
  }
  .fd-card-info-value {
    font-size: 0.85rem;
    font-weight: 700;
    color: #1a3d0a;
  }
  .fd-card-meta {
    font-size: 0.78rem;
    color: #4a7a3a;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .fd-card-actions {
    padding: 0 14px 12px;
  }
  .fd-add-btn {
    width: 100%;
    padding: 9px 14px;
    background: linear-gradient(135deg, #236902 0%, #53b635 100%);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 0.88rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    box-shadow: 0 3px 12px rgba(35,105,2,0.28);
    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s;
  }
  .fd-add-btn:hover {
    transform: translateY(-2px) scale(1.03);
    box-shadow: 0 6px 20px rgba(35,105,2,0.35);
  }
  .fd-add-btn:active { transform: scale(0.97); }

  .fd-empty {
    text-align: center;
    padding: 4rem 2rem;
    color: #6b9b5a;
    grid-column: 1 / -1;
  }
  .fd-empty-icon { font-size: 3.5rem; display: block; margin-bottom: 0.75rem; opacity: 0.6; }
  .fd-empty-text { font-size: 1rem; font-weight: 600; }

  /* Farmer (non-buyer) sections */
  .fd-about {
    background: linear-gradient(135deg, rgba(234,246,234,0.6) 0%, rgba(255,255,255,0.4) 100%);
    border: 1px solid rgba(83,182,53,0.2);
    border-radius: 16px;
    padding: 1.75rem 2rem;
    margin-top: 1.5rem;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.8);
  }
  .fd-about h2 {
    font-size: 1.5rem;
    font-weight: 800;
    color: #236902;
    margin: 0 0 0.75rem;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .fd-about h2::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 20px;
    background: linear-gradient(180deg, #53b635, #236902);
    border-radius: 2px;
  }
  .fd-about p {
    color: #3a6b25;
    font-size: 0.95rem;
    line-height: 1.7;
    margin: 0;
  }

  .fd-why-section {
    margin-top: 1.5rem;
  }
  .fd-why-section h2 {
    font-size: 1.5rem;
    font-weight: 800;
    color: #236902;
    margin: 0 0 1.25rem;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .fd-why-section h2::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 20px;
    background: linear-gradient(180deg, #53b635, #236902);
    border-radius: 2px;
  }
  .fd-why-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
  }
  .fd-why-card {
    background: #fff;
    border-radius: 16px;
    border: 1px solid rgba(83,182,53,0.15);
    box-shadow: 0 4px 16px rgba(35,105,2,0.07);
    padding: 1.25rem;
    transition: transform 0.3s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.3s;
  }
  .fd-why-card:hover {
    transform: translateY(-6px) scale(1.02);
    box-shadow: 0 16px 36px rgba(35,105,2,0.15);
  }
  .fd-why-icon { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
  .fd-why-card h3 { font-size: 0.95rem; font-weight: 700; color: #1a5c10; margin: 0 0 0.4rem; }
  .fd-why-card p  { font-size: 0.84rem; color: #4a7a3a; margin: 0; line-height: 1.5; }

  @media (max-width: 768px) {
    .fd-glass { padding: 1.5rem; }
    .fd-title { font-size: 1.8rem; }
    .fd-cards-grid { grid-template-columns: 1fr; }
    .fd-filter-row { flex-direction: column; }
    .fd-field { min-width: 100%; }
    .fd-why-cards { grid-template-columns: 1fr; }
  }
`;

function BuyerSearchBox() {
  const [region, setRegion] = React.useState('');
  const [state, setState] = React.useState('');
  const [stateOptions, setStateOptions] = React.useState([]);
  const [address, setAddress] = React.useState('');
  const [addressOptions, setAddressOptions] = React.useState([]);
  const [regionOptions, setRegionOptions] = React.useState([]);
  const [cropOptions, setCropOptions] = React.useState([]);
  const [regionMaster, setRegionMaster] = React.useState([]);
  const [stateMaster, setStateMaster] = React.useState([]);
  const [addressMaster, setAddressMaster] = React.useState([]);
  const [categoryMaster, setCategoryMaster] = React.useState([]);
  const [cropMaster, setCropMaster] = React.useState([]);
  const [varietyMaster, setVarietyMaster] = React.useState([]);
  const [crop, setCrop] = React.useState('');
  const [categoryOptions, setCategoryOptions] = React.useState([]);
  const [category, setCategory] = React.useState('');
  const [varietyOptions, setVarietyOptions] = React.useState([]);
  const [variety, setVariety] = React.useState('');
  const [cropsSource, setCropsSource] = React.useState([]);
  const [minPrice] = React.useState('');
  const [maxPrice] = React.useState('');
  const [results, setResults] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [activeCropFilter, setActiveCropFilter] = React.useState('');
  const [searchAnim, setSearchAnim] = React.useState(false);
  const [addAnimId, setAddAnimId] = React.useState(null);
  const navigate = useNavigate();
  const addressRef = React.useRef(null);
  const [showAddressSuggestions, setShowAddressSuggestions] = React.useState(false);
  const [filteredAddressMatches, setFilteredAddressMatches] = React.useState([]);
  const [lang, setLang] = React.useState((typeof window !== 'undefined' && localStorage.getItem('agri_lang')) || 'en');

  React.useEffect(() => {
    const onLang = () => setLang((localStorage.getItem('agri_lang') || 'en'));
    try { window.addEventListener && window.addEventListener('agri:lang:change', onLang); } catch(e){}
    return () => { try { window.removeEventListener && window.removeEventListener('agri:lang:change', onLang); } catch(e){} };
  }, []);

  const localeFor = (L) => {
    if (!L) return 'en-IN';
    if (L.startsWith('hi')) return 'hi-IN';
    if (L.startsWith('kn')) return 'kn-IN';
    return 'en-IN';
  };

  const translateOption = React.useCallback((field, value, L = lang) => {
    try {
      if (!value) return value;
      const raw = value.toString().trim();
      const normalize = (s) => (
        s.toString().trim()
          .replace(/[^a-zA-Z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter(Boolean)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join('')
      );
      const Normal = normalize(raw);
      const candidates = [
        `${field}${Normal}`,
        `${field}_${raw.toString().trim().toLowerCase().replace(/\s+/g,'_')}`,
        `${raw}`
      ];
      for (let k of candidates) {
        try {
          const out = t(k, L);
          if (out && out !== k) return out;
        } catch (e) {}
      }
      return raw;
    } catch (e) { return value; }
  }, [lang]);

  const handleSearch = () => {
    setActiveCropFilter((crop || '').toString().trim());
    setResults(null);
    setError(null);
    setLoading(true);
    try { setSearchAnim(true); setTimeout(() => setSearchAnim(false), 180); } catch(e){}
    const base = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
    const q = new URLSearchParams();
    if (region) q.append('region', region);
    if (state) q.append('state', state);
    if (address) q.append('address', address);
    if (category) q.append('category', category);
    if (crop) q.append('crop_name', crop);
    if (variety) q.append('variety', variety);
    const listUrl = `${base}/my-crops/list` + (q.toString() ? ('?' + q.toString()) : '');
    fetch(listUrl)
      .then(async res => {
        setLoading(false);
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(`Server returned ${res.status}: ${txt || res.statusText}`);
        }
        const j = await res.json().catch(() => null);
        if (j && j.ok && Array.isArray(j.crops)) {
          const synthetic = [{ id: '_all_crops', name: 'All listings', phone: '', crop_samples: j.crops }];
          setResults(synthetic);
        } else {
          setError((j && j.error) || 'No results');
        }
      })
      .catch(err => {
        setLoading(false);
        setError(err.message || 'Fetch failed');
      });
  };

  React.useEffect(() => {
    (async () => {
      try {
        const base = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
        const res = await fetch(`${base}/my-crops/list`);
        if (!res || !res.ok) return;
        const j = await res.json().catch(() => null);
        if (!j || !j.ok || !Array.isArray(j.crops)) return;
        setCropsSource(j.crops || []);
      } catch (e) {}
    })();
  }, []);

  React.useEffect(() => {
    try {
      const r = new Map(); const s = new Map(); const a = new Map();
      const c = new Map(); const cr = new Map(); const v = new Map();
      (cropsSource || []).forEach(d => {
        try {
          const rRaw = (d.region || '').toString().trim();
          const sRaw = (d.state || '').toString().trim();
          const aRaw = (d.address || d.seller_address || d._farmer_address || '').toString().trim();
          const catRaw = (d.category || '').toString().trim();
          const cnameRaw = (d.crop_name || '').toString().trim();
          const varRaw = (d.variety || '').toString().trim();
          if (rRaw) r.set(rRaw.toLowerCase(), rRaw);
          if (sRaw) s.set(sRaw.toLowerCase(), sRaw);
          if (aRaw) a.set(aRaw.toLowerCase(), aRaw);
          if (catRaw) c.set(catRaw.toLowerCase(), catRaw);
          if (cnameRaw) cr.set(cnameRaw.toLowerCase(), cnameRaw);
          if (varRaw) v.set(varRaw.toLowerCase(), varRaw);
        } catch (e) {}
      });
      setRegionMaster(Array.from(r.values()).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'})));
      setStateMaster(Array.from(s.values()).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'})));
      setAddressMaster(Array.from(a.values()).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'})));
      setCategoryMaster(Array.from(c.values()).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'})));
      setCropMaster(Array.from(cr.values()).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'})));
      setVarietyMaster(Array.from(v.values()).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'})));
    } catch (e) {}
  }, [cropsSource]);

  React.useEffect(() => {
    try {
      const catMap = new Map(); const cropMap = new Map(); const varietyMap = new Map();
      (cropsSource || []).forEach(d => {
        try {
          const catRaw = (d.category || '').toString().trim();
          const cnameRaw = (d.crop_name || '').toString().trim();
          const varnameRaw = (d.variety || '').toString().trim();
          const catKey = catRaw.toLowerCase();
          const cnameKey = cnameRaw.toLowerCase();
          const varKey = varnameRaw.toLowerCase();
          if (catRaw && !catMap.has(catKey)) catMap.set(catKey, catRaw);
          const categoryMatch = !category || (catRaw && catRaw.toLowerCase() === category.toString().trim().toLowerCase());
          if (cnameRaw && !cropMap.has(cnameKey) && categoryMatch) cropMap.set(cnameKey, cnameRaw);
          const cropMatch = !crop || (cnameRaw && cnameRaw.toLowerCase() === (crop || '').toString().trim().toLowerCase());
          if (varnameRaw && !varietyMap.has(varKey) && cropMatch && categoryMatch) varietyMap.set(varKey, varnameRaw);
        } catch (e) {}
      });
      setCategoryOptions(Array.from(catMap.values()).sort((a,b) => a.localeCompare(b, undefined, { sensitivity:'base' })));
      setCropOptions(Array.from(cropMap.values()).sort((a,b) => a.localeCompare(b, undefined, { sensitivity:'base' })));
      setVarietyOptions(Array.from(varietyMap.values()).sort((a,b) => a.localeCompare(b, undefined, { sensitivity:'base' })));
    } catch (e) {}
  }, [cropsSource, category, crop]);

  React.useEffect(() => {
    try {
      const seenRegion = new Map(); const seenState = new Map(); const seenAddress = new Map();
      const seenCat = new Map(); const seenCrop = new Map(); const seenVar = new Map();
      const matches = (d) => {
        try {
          const r = (d.region || '').toString().trim().toLowerCase();
          const s = (d.state || '').toString().trim().toLowerCase();
          const cat = (d.category || '').toString().trim().toLowerCase();
          const cname = (d.crop_name || '').toString().trim().toLowerCase();
          const varname = (d.variety || '').toString().trim().toLowerCase();
          if (region && region.toString().trim().toLowerCase() !== r) return false;
          if (state && state.toString().trim().toLowerCase() !== s) return false;
          if (category && category.toString().trim().toLowerCase() !== cat) return false;
          if (crop && crop.toString().trim().toLowerCase() !== cname) return false;
          if (variety && variety.toString().trim().toLowerCase() !== varname) return false;
          return true;
        } catch (e) { return true; }
      };
      (cropsSource || []).forEach(d => {
        try {
          const rRaw = (d.region || '').toString().trim();
          const sRaw = (d.state || '').toString().trim();
          const aRaw = (d.address || d.seller_address || d._farmer_address || '').toString().trim();
          const catRaw = (d.category || '').toString().trim();
          const cnameRaw = (d.crop_name || '').toString().trim();
          const varRaw = (d.variety || '').toString().trim();
          if (matches(d)) {
            if (rRaw) seenRegion.set(rRaw.toLowerCase(), rRaw);
            if (sRaw) seenState.set(sRaw.toLowerCase(), sRaw);
            if (aRaw) seenAddress.set(aRaw.toLowerCase(), aRaw);
            if (catRaw) seenCat.set(catRaw.toLowerCase(), catRaw);
            if (cnameRaw) seenCrop.set(cnameRaw.toLowerCase(), cnameRaw);
            if (varRaw) seenVar.set(varRaw.toLowerCase(), varRaw);
          }
        } catch (e) {}
      });
      const regionArr = Array.from(seenRegion.values()).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'}));
      const stateArr = Array.from(seenState.values()).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'}));
      const addrArr = Array.from(seenAddress.values()).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'}));
      const catArr2 = Array.from(seenCat.values()).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'}));
      const cropArr2 = Array.from(seenCrop.values()).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'}));
      const varArr2 = Array.from(seenVar.values()).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'}));
      setRegionOptions(regionArr);
      setStateOptions(stateArr);
      setAddressOptions(addrArr);
      setCategoryOptions(catArr2);
      setCropOptions(cropArr2);
      setVarietyOptions(varArr2);
      if (region && regionArr.length && !regionArr.find(x => x.toString().trim().toLowerCase() === region.toString().trim().toLowerCase())) setRegion('');
      if (state && stateArr.length && !stateArr.find(x => x.toString().trim().toLowerCase() === state.toString().trim().toLowerCase())) setState('');
      if (category && catArr2.length && !catArr2.find(x => x.toString().trim().toLowerCase() === category.toString().trim().toLowerCase())) { setCategory(''); setCrop(''); setVariety(''); }
      if (crop && cropArr2.length && !cropArr2.find(x => x.toString().trim().toLowerCase() === crop.toString().trim().toLowerCase())) { setCrop(''); setVariety(''); }
      if (variety && varArr2.length && !varArr2.find(x => x.toString().trim().toLowerCase() === variety.toString().trim().toLowerCase())) setVariety('');
    } catch (e) {}
  }, [cropsSource, region, state, address, category, crop, variety]);

  React.useEffect(() => {
    try {
      const q = (address || '').toString().trim().toLowerCase();
      const pool = (addressMaster && addressMaster.length ? addressMaster : addressOptions) || [];
      if (!q) { setFilteredAddressMatches([]); return; }
      const matches = pool.filter(x => (x || '').toString().toLowerCase().startsWith(q)).slice(0, 8);
      setFilteredAddressMatches(matches);
      setShowAddressSuggestions(!!matches.length);
    } catch (e) { setFilteredAddressMatches([]); setShowAddressSuggestions(false); }
  }, [address, addressMaster, addressOptions]);

  const isOptionEnabled = React.useCallback((field, optionValue) => {
    try {
      const opt = (optionValue || '').toString().trim().toLowerCase();
      if (!opt) return true;
      const any = (cropsSource || []).some(d => {
        try {
          const r = (d.region || '').toString().trim().toLowerCase();
          const s = (d.state || '').toString().trim().toLowerCase();
          const a = (d.address || d.seller_address || d._farmer_address || '').toString().trim().toLowerCase();
          const cat = (d.category || '').toString().trim().toLowerCase();
          const cname = (d.crop_name || '').toString().trim().toLowerCase();
          const varname = (d.variety || '').toString().trim().toLowerCase();
          if (field !== 'region' && region && region.toString().trim().toLowerCase() !== r) return false;
          if (field !== 'state' && state && state.toString().trim().toLowerCase() !== s) return false;
          if (field !== 'address' && address && address.toString().trim().toLowerCase() !== a) return false;
          if (field !== 'category' && category && category.toString().trim().toLowerCase() !== cat) return false;
          if (field !== 'crop' && crop && crop.toString().trim().toLowerCase() !== cname) return false;
          if (field !== 'variety' && variety && variety.toString().trim().toLowerCase() !== varname) return false;
          if (field === 'region') return r === opt;
          if (field === 'state') return s === opt;
          if (field === 'address') return a === opt;
          if (field === 'category') return cat === opt;
          if (field === 'crop') return cname === opt;
          if (field === 'variety') return varname === opt;
          return true;
        } catch (e) { return true; }
      });
      return !!any;
    } catch (e) { return true; }
  }, [cropsSource, region, state, address, category, crop, variety]);

  React.useEffect(() => {
    try {
      if (region && !isOptionEnabled('region', region)) setRegion('');
      if (state && !isOptionEnabled('state', state)) setState('');
      if (category && !isOptionEnabled('category', category)) { setCategory(''); setCrop(''); setVariety(''); }
      if (crop && !isOptionEnabled('crop', crop)) { setCrop(''); setVariety(''); }
      if (variety && !isOptionEnabled('variety', variety)) setVariety('');
    } catch (e) {}
  }, [region, state, address, category, crop, variety, isOptionEnabled]);

  React.useEffect(() => {
    (async () => {
      try {
        const base = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
        const res = await fetch(`${base}/states/list`);
        if (res && res.ok) { const j = await res.json(); if (j && j.ok && Array.isArray(j.states)) setStateOptions(j.states); }
      } catch (e) {}
    })();
    (async () => {
      try {
        const base = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
        const res = await fetch(`${base}/crops/names`);
        if (res && res.ok) { const j = await res.json(); if (j && j.ok && Array.isArray(j.crops)) setCropOptions(j.crops); }
      } catch (e) {}
    })();
    (async () => {
      try {
        const base = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
        const res = await fetch(`${base}/regions/list`);
        if (res && res.ok) { const j = await res.json(); if (j && j.ok && Array.isArray(j.regions)) setRegionOptions(j.regions); }
      } catch (e) {}
    })();
  }, []);

  return (
    <div className="fd-glass" style={{marginTop: '1rem'}}>
      <h2 className="fd-title">{t('findFarmersTitle', lang)}</h2>
      <p className="fd-subtitle">{t('searchSubtitle', lang) || 'Find fresh produce directly from farmers'}</p>

      {/* Filter Row */}
      <div className="fd-filter-row">
        <div className="fd-field">
          <label className="fd-label">{t('labelRegion', lang)}</label>
          {(regionMaster && regionMaster.length ? regionMaster : regionOptions).length ? (
            <select className="fd-select" value={region} onChange={e => setRegion(e.target.value)}>
              <option value=''>{t('selectRegion', lang)}</option>
              {(regionMaster && regionMaster.length ? regionMaster : regionOptions).filter(r => isOptionEnabled('region', r)).map(r => (
                <option key={r} value={r} title={r.toString()}>{r.toString()}</option>
              ))}
            </select>
          ) : (
            <select className="fd-select" value={region} onChange={e => setRegion(e.target.value)}>
              <option value=''>{t('selectRegion', lang)}</option>
              <option value='North'>North</option>
              <option value='South'>South</option>
              <option value='East'>East</option>
              <option value='West'>West</option>
            </select>
          )}
        </div>

        <div className="fd-field">
          <label className="fd-label">{t('labelState', lang)}</label>
          {(stateMaster && stateMaster.length ? stateMaster : stateOptions).length ? (
            <select className="fd-select" value={state} onChange={e => setState(e.target.value)}>
              <option value=''>{t('selectState', lang)}</option>
              {(stateMaster && stateMaster.length ? stateMaster : stateOptions).filter(s => isOptionEnabled('state', s)).map(s => {
                const label = translateOption('state', s, lang);
                return <option key={s} value={s} title={label}>{label}</option>;
              })}
            </select>
          ) : (
            <input className="fd-input" value={state} onChange={e => setState(e.target.value)} placeholder={t('placeholderState', lang) || t('placeholderState', 'en')} />
          )}
        </div>

        <div className="fd-field">
          <label className="fd-label">{t('labelAddress', lang)}</label>
          <input
            ref={addressRef}
            type="text"
            className="fd-input"
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder={t('labelAddress', lang)}
          />
        </div>

        <div className="fd-field">
          <label className="fd-label">{t('labelCategory', lang)}</label>
          <select className="fd-select" value={category} onChange={e => { setCategory(e.target.value); setCrop(''); setVariety(''); }}>
            <option value=''>{t('selectCategory', lang)}</option>
            {(categoryMaster && categoryMaster.length ? categoryMaster : categoryOptions).filter(s => isOptionEnabled('category', s)).map(s => {
              const label = translateOption('category', s, lang);
              return <option key={s} value={s} title={label}>{label}</option>;
            })}
          </select>
        </div>

        <div className="fd-field">
          <label className="fd-label">{t('labelCropName', lang)}</label>
          {(cropMaster && cropMaster.length ? cropMaster : cropOptions).length ? (
            <select className="fd-select" value={crop} onChange={e => { setCrop(e.target.value); setVariety(''); }}>
              <option value=''>{t('selectCrop', lang)}</option>
              {(cropMaster && cropMaster.length ? cropMaster : cropOptions).filter(s => isOptionEnabled('crop', s)).map(s => {
                const label = translateOption('crop', s, lang);
                return <option key={s} value={s} title={label}>{label}</option>;
              })}
            </select>
          ) : (
            <input className="fd-input" value={crop} onChange={e => setCrop(e.target.value)} placeholder={t('placeholderCropExample', lang)} />
          )}
        </div>

        <div className="fd-field">
          <label className="fd-label">{t('labelVariety', lang)}</label>
          <select className="fd-select" value={variety} onChange={e => setVariety(e.target.value)}>
            <option value=''>{t('selectVariety', lang)}</option>
            {(varietyMaster && varietyMaster.length ? varietyMaster : varietyOptions).filter(s => isOptionEnabled('variety', s)).map(s => {
              const label = translateOption('variety', s, lang);
              return <option key={s} value={s} title={label}>{label}</option>;
            })}
          </select>
        </div>

        <button
          className="fd-search-btn"
          onClick={handleSearch}
          onMouseDown={() => { try { setSearchAnim(true); } catch(e){} }}
          onMouseUp={() => { try { setSearchAnim(false); } catch(e){} }}
          onMouseLeave={() => { try { setSearchAnim(false); } catch(e){} }}
          style={{ transform: searchAnim ? 'scale(0.96)' : undefined }}
        >
          {t('searchButton', lang)}
        </button>
      </div>

      {/* Status */}
      <div className="fd-status-row">
        {loading && <span className="fd-loading">{t('searching', lang)}</span>}
        {error && <span className="fd-error">{error}</span>}
      </div>

      <div className="fd-section-divider" />

      {/* Results */}
      <div className="fd-cards-grid">
        {Array.isArray(results) && results.length ? (
          (() => {
            const crops = [];
            results.forEach(f => {
              if (Array.isArray(f.crop_samples)) {
                f.crop_samples.forEach(c => {
                  const farmerName = (c && (c._farmer_name || c.farmer_name || c.seller_name || c.seller || c.uploader_name)) || f.name || '';
                  const farmerPhone = (c && (c._farmer_phone || c.seller_phone || c.phone)) || f.phone || '';
                  crops.push({ ...c, _farmer_name: farmerName, _farmer_phone: farmerPhone, _farmer_id: c.farmer_id || c.seller_id || f.id, _farmer_region: c.region || f.region, _farmer_state: c.state || f.state });
                });
              }
            });

            if (!crops.length) return <div className="fd-empty" key="empty"><span className="fd-empty-icon">🌾</span><div className="fd-empty-text">{t('noRecentListings', lang)}</div></div>;

            const activeTerm = (activeCropFilter || '').toString().trim().toLowerCase();
            const selectionFiltered = crops.filter(ci => {
              try {
                if (region) { const r = (ci._farmer_region || ci.region || '').toString().trim().toLowerCase(); if (r !== region.toString().trim().toLowerCase()) return false; }
                if (state) { const s = (ci._farmer_state || ci.state || '').toString().trim().toLowerCase(); if (s !== state.toString().trim().toLowerCase()) return false; }
                if (address) { const a = (ci._farmer_address || ci.address || ci.seller_address || '').toString().trim().toLowerCase(); if (!a.includes(address.toString().trim().toLowerCase())) return false; }
                if (category) { const cat = (ci.category || '').toString().trim().toLowerCase(); if (cat !== category.toString().trim().toLowerCase()) return false; }
                if (crop) { const cn = (ci.crop_name || '').toString().trim().toLowerCase(); if (cn !== crop.toString().trim().toLowerCase()) return false; }
                if (variety) { const v = (ci.variety || '').toString().trim().toLowerCase(); if (v !== variety.toString().trim().toLowerCase()) return false; }
                return true;
              } catch (e) { return true; }
            });
            const nonExpired = selectionFiltered.filter(ci => !ci.is_expired);
            const nameFiltered = activeTerm ? nonExpired.filter(ci => (ci.crop_name || '').toString().toLowerCase().includes(activeTerm)) : nonExpired;
            const minP = parseFloat(minPrice);
            const maxP = parseFloat(maxPrice);
            const filtered = nameFiltered.filter(ci => {
              const p = Number(ci.price_per_kg || 0);
              if (!Number.isNaN(minP) && p < minP) return false;
              if (!Number.isNaN(maxP) && p > maxP) return false;
              return true;
            });
            const nonZero = filtered.filter(ci => Number(ci.quantity_kg || ci.quantity || ci.available || 0) > 0);

            if (!nonZero.length) return <div className="fd-empty" key="empty"><span className="fd-empty-icon">🌾</span><div className="fd-empty-text">{t('noListingsMatch', lang)}</div></div>;

            return nonZero.map((c, idx) => (
              <div key={c.id || (c.crop_name + Math.random())} className="fd-card" style={{ animationDelay: `${idx * 60}ms` }}>
                <div className="fd-card-img-wrap">
                  {c.image_url ? (
                    <img className="fd-card-img" src={c.image_url} alt={c.crop_name} />
                  ) : (
                    <div className="fd-card-no-img">
                      <span>📷</span>
                      {t('noImage', lang)}
                    </div>
                  )}
                </div>

                <div className="fd-card-body">
                  <div className="fd-card-title-row">
                    <h3 className="fd-card-crop-name">{c.crop_name}</h3>
                    {c.variety && <span className="fd-card-variety-badge">{c.variety}</span>}
                  </div>

                  <div className="fd-card-info-row">
                    <div className="fd-card-info-box">
                      <div className="fd-card-info-label">{t('kg', lang)}</div>
                      <div className="fd-card-info-value">{Number(c.quantity_kg || 0).toLocaleString(localeFor(lang))} {t('kg', lang)}</div>
                    </div>
                    <div className="fd-card-info-box">
                      <div className="fd-card-info-label">Price / {t('kg', lang)}</div>
                      <div className="fd-card-info-value">₹{Number(c.price_per_kg || 0).toLocaleString(localeFor(lang))}</div>
                    </div>
                  </div>

                  {c._farmer_name && (
                    <div className="fd-card-meta">{t('farmerPrefix', lang)}: {c._farmer_name}</div>
                  )}

                  {(() => {
                    const addr = (c && (c._farmer_address || c.address || c.seller_address)) || '';
                    const st = (c && (c._farmer_state || c.state)) || '';
                    const rg = (c && (c._farmer_region || c.region)) || '';
                    const parts = [];
                    if (addr) parts.push(`${t('addressPrefix', lang)}: ${addr}`);
                    if (st) parts.push(translateOption('state', st, lang));
                    if (rg) parts.push(rg.toString());
                    if (!parts.length) return null;
                    return <div className="fd-card-meta">{parts.join(' | ')}</div>;
                  })()}
                </div>

                <div className="fd-card-actions">
                  <button
                    className="fd-add-btn"
                    style={{ transform: addAnimId === c.id ? 'scale(0.96)' : undefined }}
                    onMouseDown={() => { try { setAddAnimId(c.id); } catch(e){} }}
                    onMouseUp={() => { try { setAddAnimId(null); } catch(e){} }}
                    onMouseLeave={() => { try { setAddAnimId(null); } catch(e){} }}
                    onClick={async () => {
                      try {
                        const role = (typeof window !== 'undefined' && localStorage.getItem('agriai_role')) || '';
                        const cartKey = role === 'farmer' ? 'agriai_cart_farmer' : 'agriai_cart_buyer';
                        const raw = localStorage.getItem(cartKey);
                        let arr = raw ? JSON.parse(raw) : [];
                        const seller_addr = (c && (c._farmer_address || c.address || c.seller_address)) || '';
                        const seller_email = (c && (c.seller_email || c.email || c._farmer_email)) || '';
                        const seller_region = (c && (c._farmer_region || c.region || c.seller_region)) || '';
                        const seller_state = (c && (c._farmer_state || c.state || c.seller_state)) || '';
                        const item = { id: c.id, crop_name: c.crop_name, price_per_kg: c.price_per_kg, quantity_kg: c.quantity_kg, image_url: c.image_url, seller_name: c._farmer_name, seller_phone: c._farmer_phone, seller_address: seller_addr, seller_email: seller_email, seller_region: seller_region, seller_state: seller_state, category: c.category || c.cat || '', variety: c.variety || '' };
                        if (!arr.find(x => x && x.id === item.id)) arr.push(item);
                        localStorage.setItem(cartKey, JSON.stringify(arr));
                        try {
                          const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
                          const userRole = (localStorage.getItem('agriai_role') || '').toString().trim();
                          const userId = localStorage.getItem('agriai_id') || null;
                          const userPhone = localStorage.getItem('agriai_phone') || null;
                          const payload = {
                            user_type: userRole || (userId ? 'farmer' : 'buyer'),
                            user_id: (userId != null && userId !== '') ? (isNaN(userId) ? userId : Number(userId)) : undefined,
                            user_phone: userPhone || undefined,
                            items: [{ crop_id: c.id, crop_name: c.crop_name, variety: c.variety || '', quantity_kg: c.quantity_kg || 0, price_per_kg: c.price_per_kg || null, image_path: c.image_url || null, category: c.category || c.cat || '' }]
                          };
                          fetch(`${apiBase}/cart/add`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
                            .then(async res => { if (!res.ok) { const t = await res.text().catch(()=>''); console.warn('cart/add failed', res.status, t); } else { try { window.dispatchEvent(new Event('agriai:cart:update')); } catch(e){} } })
                            .catch(err => console.warn('cart/add network error', err));
                        } catch (e) { console.warn('persist cart error', e); }
                      } catch (e) { console.warn('addToCart error', e); }
                      try { setAddAnimId(c.id); setTimeout(() => setAddAnimId(null), 220); } catch(e){}
                      const role = (typeof window !== 'undefined' && localStorage.getItem('agriai_role')) || '';
                      if (role === 'buyer') { try { navigate('/cart'); } catch (e) {} }
                      else { try { navigate('/farmer/cart'); } catch (e) {} }
                    }}
                  >
                    {t('addToCart', lang)}
                  </button>
                </div>
              </div>
            ));
          })()
        ) : (
          <div style={{gridColumn:'1/-1'}} />
        )}
      </div>
    </div>
  );
}

export default function FarmerDashboard() {
  const [lang, setLang] = React.useState((typeof window !== 'undefined' && localStorage.getItem('agri_lang')) || 'en');
  React.useEffect(() => {
    const onLang = () => setLang((localStorage.getItem('agri_lang') || 'en'));
    try { window.addEventListener && window.addEventListener('agri:lang:change', onLang); } catch(e){}
    return () => { try { window.removeEventListener && window.removeEventListener('agri:lang:change', onLang); } catch(e){} };
  }, []);

  const role = (typeof window !== 'undefined' && localStorage.getItem('agriai_role')) ? localStorage.getItem('agriai_role') : '';
  const isBuyer = role === 'buyer';

  return (
    <>
      <style>{styles}</style>
      <div className="fd-root">
        {/* Animated orbs */}
        <div className="fd-orb fd-orb-1" />
        <div className="fd-orb fd-orb-2" />
        <div className="fd-orb fd-orb-3" />

        {/* Floating leaves */}
        <div className="fd-leaf fd-leaf-1" />
        <div className="fd-leaf fd-leaf-2" />
        <div className="fd-leaf fd-leaf-3" />
        <div className="fd-leaf fd-leaf-4" />
        <div className="fd-leaf fd-leaf-5" />

        <Navbar />

        <main className="fd-main">
          {isBuyer ? (
            <BuyerSearchBox />
          ) : (
            <div className="fd-glass">
              <ImageSlideshow />

              <div className="fd-section-divider" style={{marginTop:'1.5rem'}} />

              <div className="fd-about">
                <h2>{t('aboutTitle', lang)}</h2>
                <p>{t('aboutText', lang)}</p>
              </div>

              <div className="fd-why-section">
                <h2>{t('whyTitle', lang)}</h2>
                <div className="fd-why-cards">
                  <div className="fd-why-card">
                    <span className="fd-why-icon" role="img" aria-label="contract">🤝</span>
                    <h3>{t('card1Title', lang)}</h3>
                    <p>{t('card1Text', lang)}</p>
                  </div>
                  <div className="fd-why-card">
                    <span className="fd-why-icon" role="img" aria-label="crop">🌾</span>
                    <h3>{t('card2Title', lang)}</h3>
                    <p>{t('card2Text', lang)}</p>
                  </div>
                  <div className="fd-why-card">
                    <span className="fd-why-icon" role="img" aria-label="price">💰</span>
                    <h3>{t('card3Title', lang)}</h3>
                    <p>{t('card3Text', lang)}</p>
                  </div>
                  <div className="fd-why-card">
                    <span className="fd-why-icon" role="img" aria-label="chatbot">🧠</span>
                    <h3>{t('card4Title', lang)}</h3>
                    <p>{t('card4Text', lang)}</p>
                  </div>
                  <div className="fd-why-card">
                    <span className="fd-why-icon" role="img" aria-label="government">🏛️</span>
                    <h3>{t('card5Title', lang)}</h3>
                    <p>{t('card5Text', lang)}</p>
                  </div>
                  <div className="fd-why-card">
                    <span className="fd-why-icon" role="img" aria-label="language">🌐</span>
                    <h3>{t('card6Title', lang)}</h3>
                    <p>{t('card6Text', lang)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        <Chatbot />
      </div>
    </>
  );
}