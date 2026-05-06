import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import Navbar from './Navbar';
import ImageSlideshow from './ImageSlideshow';
import Chatbot from './Chatbot';
import { t } from './i18n';

function BuyerSearchBox() {
  const [region, setRegion] = React.useState('');
  const [state, setState] = React.useState('');
  const [stateOptions, setStateOptions] = React.useState([]);
  const [address, setAddress] = React.useState('');
  const [addressOptions, setAddressOptions] = React.useState([]);
  const [regionOptions, setRegionOptions] = React.useState([]);
  const [cropOptions, setCropOptions] = React.useState([]);

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

  const getExpiryDate = (item) => {
    try {
      const raw = (item.expiry_date || item.expiryDate || item.expiry || '').toString().trim();
      const date = new Date(raw);
      return Number.isNaN(date.getTime()) ? null : date;
    } catch (e) {
      return null;
    }
  };

  const isCropExpired = (item) => {
    const expiry = getExpiryDate(item);
    if (!expiry) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expiry < today;
  };

  const isCropValid = (item) => !isCropExpired(item);

  // translate dynamic option values when possible using i18n keys
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
      // try keys in order; use t() and accept first key where t() returns something different than the key
      for (let k of candidates) {
        try {
          const out = t(k, L);
          if (out && out !== k) return out;
        } catch (e) {}
      }
      return raw;
    } catch (e) { return value; }
  }, [lang]);

  const handleShowAll = async () => {
    setActiveCropFilter('');
    setResults(null);
    setError(null);
    setLoading(true);
    try {
      const base = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${base}/my-crops/list`);
      setLoading(false);
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Server returned ${res.status}: ${txt || res.statusText}`);
      }
      const j = await res.json().catch(() => null);
      if (j && j.ok && Array.isArray(j.crops)) {
        setResults((j.crops || []).filter(isCropValid));
      } else {
        setError((j && j.error) || 'No crops');
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Fetch failed');
    }
  };

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
    if (crop) q.append('crop_name', crop);
  if (category) q.append('category', category);
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
          // Apply category/variety filters client-side since API doesn’t support all
          const filteredCrops = (j.crops || []).filter(c => {
            try {
              if (!isCropValid(c)) return false;
              if (category && ((c.category || '').toString().trim().toLowerCase() !== category.toString().trim().toLowerCase())) return false;
              if (variety && ((c.variety || '').toString().trim().toLowerCase() !== variety.toString().trim().toLowerCase())) return false;
              if (address && !((c.address || c.seller_address || '').toString().toLowerCase().includes(address.toString().trim().toLowerCase()))) return false;
              if (crop && ((c.crop_name || '').toString().trim().toLowerCase() !== crop.toString().trim().toLowerCase())) return false;
            } catch (e) {}
            return true;
          });
          setResults(filteredCrops);
        } else {
          setError((j && j.error) || 'No crops');
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
        const crops = (j.crops || []).filter(isCropValid);
        // setResults(crops); // Removed to not display cards initially
        setCropsSource(crops);
      } catch (e) {}
    })();
  }, []);



  React.useEffect(() => {
    // Build cascading options: each option list is filtered by the current selections except for itself
    const validCrops = (cropsSource || []).filter(isCropValid);

    // Region options: filtered by state, category, crop
    let forRegion = validCrops;
    if (state) forRegion = forRegion.filter(d => (d.state || '').toString().trim().toLowerCase() === state.toLowerCase());
    if (category) forRegion = forRegion.filter(d => (d.category || '').toString().trim().toLowerCase() === category.toLowerCase());
    if (crop) forRegion = forRegion.filter(d => (d.crop_name || '').toString().trim().toLowerCase() === crop.toLowerCase());
    const regionMap = new Map();
    forRegion.forEach(d => {
      const rawR = (d.region || '').toString().trim();
      if (rawR) regionMap.set(rawR.toLowerCase(), rawR);
    });
    const regionArr = Array.from(regionMap.values()).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    // State options: filtered by region, category, crop
    let forState = validCrops;
    if (region) forState = forState.filter(d => (d.region || '').toString().trim().toLowerCase() === region.toLowerCase());
    if (category) forState = forState.filter(d => (d.category || '').toString().trim().toLowerCase() === category.toLowerCase());
    if (crop) forState = forState.filter(d => (d.crop_name || '').toString().trim().toLowerCase() === crop.toLowerCase());
    const stateMap = new Map();
    forState.forEach(d => {
      const rawS = (d.state || '').toString().trim();
      if (rawS) stateMap.set(rawS.toLowerCase(), rawS);
    });
    const stateArr = Array.from(stateMap.values()).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    // Category options: filtered by region, state, crop
    let forCategory = validCrops;
    if (region) forCategory = forCategory.filter(d => (d.region || '').toString().trim().toLowerCase() === region.toLowerCase());
    if (state) forCategory = forCategory.filter(d => (d.state || '').toString().trim().toLowerCase() === state.toLowerCase());
    if (crop) forCategory = forCategory.filter(d => (d.crop_name || '').toString().trim().toLowerCase() === crop.toLowerCase());
    const catMap = new Map();
    forCategory.forEach(d => {
      const catRaw = (d.category || '').toString().trim();
      if (catRaw) catMap.set(catRaw.toLowerCase(), catRaw);
    });
    const catArr = Array.from(catMap.values()).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    // Crop options: filtered by region, state, category
    let forCrop = validCrops;
    if (region) forCrop = forCrop.filter(d => (d.region || '').toString().trim().toLowerCase() === region.toLowerCase());
    if (state) forCrop = forCrop.filter(d => (d.state || '').toString().trim().toLowerCase() === state.toLowerCase());
    if (category) forCrop = forCrop.filter(d => (d.category || '').toString().trim().toLowerCase() === category.toLowerCase());
    const cropMap = new Map();
    forCrop.forEach(d => {
      const cnameRaw = (d.crop_name || '').toString().trim();
      if (cnameRaw) cropMap.set(cnameRaw.toLowerCase(), cnameRaw);
    });
    const cropArrLocal = Array.from(cropMap.values()).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    // Variety options: filtered by region, state, category, crop
    let forVariety = validCrops;
    if (region) forVariety = forVariety.filter(d => (d.region || '').toString().trim().toLowerCase() === region.toLowerCase());
    if (state) forVariety = forVariety.filter(d => (d.state || '').toString().trim().toLowerCase() === state.toLowerCase());
    if (category) forVariety = forVariety.filter(d => (d.category || '').toString().trim().toLowerCase() === category.toLowerCase());
    if (crop) forVariety = forVariety.filter(d => (d.crop_name || '').toString().trim().toLowerCase() === crop.toLowerCase());
    const varietyMap = new Map();
    forVariety.forEach(d => {
      const varnameRaw = (d.variety || '').toString().trim();
      if (varnameRaw) varietyMap.set(varnameRaw.toLowerCase(), varnameRaw);
    });
    const varietyArrLocal = Array.from(varietyMap.values()).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    setRegionOptions(regionArr);
    setStateOptions(stateArr);
    setCategoryOptions(catArr);
    setCropOptions(cropArrLocal);
    setVarietyOptions(varietyArrLocal);
  }, [cropsSource, region, state, category, crop]);



  // update filtered address suggestions as the user types
  React.useEffect(() => {
    try {
      const q = (address || '').toString().trim().toLowerCase();
      const pool = addressOptions || [];
      if (!q) {
        setFilteredAddressMatches([]);
        return;
      }
      const matches = pool.filter(x => (x || '').toString().toLowerCase().startsWith(q)).slice(0, 8);
      setFilteredAddressMatches(matches);
      setShowAddressSuggestions(!!matches.length);
    } catch (e) { setFilteredAddressMatches([]); setShowAddressSuggestions(false); }
  }, [address, addressOptions]);


  React.useEffect(() => {
    // State options are derived from the crops table via cropsSource,
    // so we intentionally do not overwrite them with a generic states API.
    (async () => {
      try {
        const base = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
        const res = await fetch(`${base}/crops/names`);
        if (res && res.ok) {
          const j = await res.json();
          if (j && j.ok && Array.isArray(j.crops)) setCropOptions(j.crops);
        }
      } catch (e) {}
    })();
    (async () => {
      try {
        const base = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
        const res = await fetch(`${base}/regions/list`);
        if (res && res.ok) {
          const j = await res.json();
          if (j && j.ok && Array.isArray(j.regions)) setRegionOptions(j.regions);
        }
      } catch (e) {}
    })();
  }, []);

  return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'0 1rem'}}>
      <div style={{background:'rgba(255,255,255,0.92)', backdropFilter:'blur(20px) saturate(1.6)', WebkitBackdropFilter:'blur(20px) saturate(1.6)', border:'1px solid rgba(255,255,255,0.6)', borderRadius:'24px', padding:'2.5rem', boxShadow:'0 8px 32px rgba(35,105,2,0.12), 0 32px 64px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)', width:'100%', maxWidth:1400}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'center', position:'relative', width:'100%', flexWrap:'wrap'}}>
          <h3 style={{position:'absolute', left:'50%', transform:'translateX(-50%)', margin:0, backgroundImage:'linear-gradient(135deg, #1a5c10 0%, #236902 50%, #53b635 100%)', WebkitBackgroundClip:'text', backgroundClip:'text', color:'transparent', fontSize:22, fontWeight:800, lineHeight:1.2, paddingBottom:5, textAlign:'center', width:'100%', pointerEvents:'none'}}>
            {t('findFarmersTitle', lang) || 'Find Farmers'}
          </h3>
        </div>
        <div style={{display:'flex', gap:6, alignItems:'center', flexWrap:'nowrap', marginTop:30, overflowX:'auto', paddingBottom:8}}>
          {/* Region, State, Category, Crop, Variety Dropdowns */}
          <div style={{flex:'1 1 160px', minWidth:120}}>
            <label style={{display:'block', marginBottom:2, fontWeight:700, fontSize:14, color:'#2d5c1a'}}>{t('labelRegion', lang)}</label>
            {regionOptions && regionOptions.length ? (
              <select value={region} onChange={e => setRegion(e.target.value)} style={{width:'100%', padding:'10px 14px', border:'1.5px solid #d4edcc', borderRadius:10, background:'rgba(255,255,255,0.95)', color:'#1a3d0a', fontSize:'0.9rem', fontFamily:'inherit', outline:'none', transition:'border-color 0.25s, box-shadow 0.25s'}}>
                <option value=''>{t('selectRegion', lang)}</option>
                {regionOptions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            ) : (
              <select value={region} onChange={e => setRegion(e.target.value)} style={{width:'100%', padding:'10px 14px', border:'1.5px solid #d4edcc', borderRadius:10, background:'rgba(255,255,255,0.95)', color:'#1a3d0a', fontSize:'0.9rem', fontFamily:'inherit', outline:'none', transition:'border-color 0.25s, box-shadow 0.25s'}}>
                <option value=''>{t('selectRegion', lang)}</option>
                <option value='North'>{t('regionNorth', lang)}</option>
                <option value='South'>{t('regionSouth', lang)}</option>
                <option value='East'>{t('regionEast', lang)}</option>
                <option value='West'>{t('regionWest', lang)}</option>
              </select>
            )}
          </div>
          <div style={{flex:'1 1 220px', minWidth:120}}>
            <label style={{display:'block', marginBottom:2, fontWeight:700, fontSize:14, color:'#2d5c1a'}}>{t('labelState', lang)}</label>
            <select value={state} onChange={e => setState(e.target.value)} style={{width:'100%', padding:'10px 14px', border:'1.5px solid #d4edcc', borderRadius:10, background:'rgba(255,255,255,0.95)', color:'#1a3d0a', fontSize:'0.9rem', fontFamily:'inherit', outline:'none', transition:'border-color 0.25s, box-shadow 0.25s'}}>
              <option value=''>{t('selectState', lang)}</option>
              {stateOptions && stateOptions.length ? stateOptions.map(s => <option key={s} value={s}>{s}</option>) : null}
            </select>
          </div>
          <div style={{flex:'1 1 160px', minWidth:120}}>
            <label style={{display:'block', marginBottom:2, fontWeight:700, fontSize:14, color:'#2d5c1a'}}>{t('labelAddress', lang)}</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder={t('labelAddress', lang)}
              style={{width:'100%', padding:'10px 14px', border:'1.5px solid #d4edcc', borderRadius:10, background:'rgba(255,255,255,0.95)', color:'#1a3d0a', fontSize:'0.9rem', fontFamily:'inherit', outline:'none', transition:'border-color 0.25s, box-shadow 0.25s'}}
            />
          </div>
          <div style={{flex:'1 1 180px', minWidth:120, marginLeft:12}}>
            <label style={{display:'block', marginBottom:2, fontWeight:700, fontSize:14, color:'#2d5c1a'}}>{t('labelCategory', lang)}</label>
            <select value={category} onChange={e => { setCategory(e.target.value); setCrop(''); setVariety(''); }} style={{width:'100%', padding:'10px 14px', border:'1.5px solid #d4edcc', borderRadius:10, background:'rgba(255,255,255,0.95)', color:'#1a3d0a', fontSize:'0.9rem', fontFamily:'inherit', outline:'none', transition:'border-color 0.25s, box-shadow 0.25s'}}>
              <option value=''>{t('selectCategory', lang)}</option>
              {categoryOptions && categoryOptions.length ? categoryOptions.map(s => <option key={s} value={s}>{s}</option>) : null}
            </select>
          </div>
          <div style={{flex:'1 1 180px', minWidth:110}}>
            <label style={{display:'block', marginBottom:2, fontWeight:700, fontSize:14, color:'#2d5c1a'}}>{t('labelCropName', lang)}</label>
            {(cropOptions).length ? (
              <select value={crop} onChange={e => { setCrop(e.target.value); setVariety(''); }} style={{width:'100%', padding:'10px 14px', border:'1.5px solid #d4edcc', borderRadius:10, background:'rgba(255,255,255,0.95)', color:'#1a3d0a', fontSize:'0.9rem', fontFamily:'inherit', outline:'none', transition:'border-color 0.25s, box-shadow 0.25s'}}>
                <option value=''>{t('selectCrop', lang)}</option>
                {cropOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <input value={crop} onChange={e => setCrop(e.target.value)} placeholder={t('placeholderCropExample', lang)} style={{width:'100%', padding:'10px 14px', border:'1.5px solid #d4edcc', borderRadius:10, background:'rgba(255,255,255,0.95)', color:'#1a3d0a', fontSize:'0.9rem', fontFamily:'inherit', outline:'none', transition:'border-color 0.25s, box-shadow 0.25s'}} />
            )}
          </div>
          <div style={{flex:'1 1 180px', minWidth:120}}>
            <label style={{display:'block', marginBottom:2, fontWeight:700, fontSize:14, color:'#2d5c1a'}}>{t('labelVariety', lang)}</label>
            <select value={variety} onChange={e => setVariety(e.target.value)} style={{width:'100%', padding:'10px 14px', border:'1.5px solid #d4edcc', borderRadius:10, background:'rgba(255,255,255,0.95)', color:'#1a3d0a', fontSize:'0.9rem', fontFamily:'inherit', outline:'none', transition:'border-color 0.25s, box-shadow 0.25s'}}>
              <option value=''>{t('selectVariety', lang)}</option>
              {varietyOptions && varietyOptions.length ? varietyOptions.map(s => <option key={s} value={s}>{s}</option>) : null}
            </select>
          </div>
        </div>

        <div style={{display:'flex', justifyContent:'center', marginTop:14, gap:10}}>
          <button
            onClick={handleSearch}
            onMouseDown={() => { try { setSearchAnim(true); } catch(e){} }}
            onMouseUp={() => { try { setSearchAnim(false); } catch(e){} }}
            onMouseLeave={() => { try { setSearchAnim(false); } catch(e){} }}
            style={{
              padding:'0.6rem 1.4rem',
              background:'#236902',
              color:'#fff',
              border:'none',
              borderRadius:6,
              cursor:'pointer',
              transform: searchAnim ? 'scale(0.96)' : 'scale(1)',
              transition: 'transform 140ms ease'
            }}
          >
            {t('searchButton', lang)}
          </button>
        </div>

        <div style={{marginTop:28}}>
          <div style={{textAlign:'center', marginBottom:10}}>
           
            {loading && <div style={{color:'#000000ff'}}>{t('searching', lang)}</div>}
            {error && <div style={{color:'crimson'}}>{error}</div>}
          </div>

          <div style={{display:'grid', gridTemplateColumns:'repeat(5, minmax(240px, 1fr))', gap:16, marginTop:12}}>
            {Array.isArray(results) && results.length ? (
              (() => {
                const crops = results;

                if (!crops.length) return <div style={{gridColumn: '1/-1', color:'#000000ff'}}>{t('noRecentListings', lang)}</div>;

                const activeTerm = (activeCropFilter || '').toString().trim().toLowerCase();

                // apply selection filters (region/state/category/crop/variety)
                const selectionFiltered = crops.filter(ci => {
                  try {
                    if (region) {
                      const r = (ci.region || '').toString().trim().toLowerCase();
                      if (r !== region.toString().trim().toLowerCase()) return false;
                    }
                    if (state) {
                      const s = (ci.state || '').toString().trim().toLowerCase();
                      if (s !== state.toString().trim().toLowerCase()) return false;
                    }
                    if (address) {
                      const a = (ci.address || ci.seller_address || '').toString().trim().toLowerCase();
                      if (!a.includes(address.toString().trim().toLowerCase())) return false;
                    }
                    if (category) {
                      const cat = (ci.category || '').toString().trim().toLowerCase();
                      if (cat !== category.toString().trim().toLowerCase()) return false;
                    }
                    if (crop) {
                      const cn = (ci.crop_name || '').toString().trim().toLowerCase();
                      if (cn !== crop.toString().trim().toLowerCase()) return false;
                    }
                    if (variety) {
                      const v = (ci.variety || '').toString().trim().toLowerCase();
                      if (v !== variety.toString().trim().toLowerCase()) return false;
                    }
                    return true;
                  } catch (e) { return true; }
                });

                const nonExpired = selectionFiltered.filter(isCropValid);
                const nameFiltered = activeTerm ? nonExpired.filter(ci => (ci.crop_name || '').toString().toLowerCase().includes(activeTerm)) : nonExpired;
                const minP = parseFloat(minPrice);
                const maxP = parseFloat(maxPrice);
                const filtered = nameFiltered.filter(ci => {
                  const p = Number(ci.price_per_kg || 0);
                  if (!Number.isNaN(minP) && p < minP) return false;
                  if (!Number.isNaN(maxP) && p > maxP) return false;
                  return true;
                });
                if (!filtered.length) return <div style={{gridColumn: '1/-1', color:'#000000ff'}}>{t('noListingsMatch', lang)}</div>;

                // hide cards that have zero available quantity
                const nonZero = filtered.filter(ci => Number(ci.quantity_kg || ci.quantity || ci.available || 0) > 0);
                if (!nonZero.length) return <div style={{gridColumn: '1/-1', color:'#000000ff'}}>{t('noListingsMatch', lang)}</div>;

                // ✅ Each card now has hover zoom + image zoom
                return nonZero.map(c => (
                  <div 
                    key={c.id || (c.crop_name + Math.random())} 
                    style={{
                      background:'#fff',
                      borderRadius:8,
                      padding:10,
                      border:'1px solid #eaeaea',
                      boxShadow:'0 6px 18px rgba(0,0,0,0.04)',
                      textAlign:'center',
                      transition:'transform 0.3s ease, box-shadow 0.3s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow='0 10px 25px rgba(0,0,0,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow='0 6px 18px rgba(0,0,0,0.04)'; }}
                  >
                    <div 
                      style={{
                        width:'100%',
                        height:140,
                        borderRadius:6,
                        overflow:'hidden',
                        background:'#f4f4f4',
                        display:'flex',
                        alignItems:'center',
                        justifyContent:'center',
                        transition:'transform 0.3s ease',
                      }}
                    >
                      <img 
                        src={c.image_url} 
                        alt={c.crop_name} 
                        style={{
                          width:'100%',
                          height:'100%',
                          objectFit:'cover',
                          transition:'transform 0.4s ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentNode.innerHTML = '<div style="color:#999">' + t('noImage', lang) + '</div>';
                        }}
                      />
                    </div>

                    <div style={{marginTop:8, fontWeight:800, color:'#236902', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span>{c.crop_name}</span>
                      <span style={{fontWeight:600, color:'#236902', fontSize:15}}>{c.variety ? c.variety : ''}</span>
                    </div>

                    <div style={{display:'flex', justifyContent:'space-between', gap:12, marginTop:6}}>
                      <div style={{fontSize:14, fontWeight:700, color:'#000'}}>{Number(c.quantity_kg || 0).toLocaleString(localeFor(lang))} {t('kg', lang)}</div>
                      <div style={{fontSize:14, fontWeight:700, color:'#000'}}>₹{Number(c.price_per_kg || 0).toLocaleString(localeFor(lang))} / {t('kg', lang)}</div>
                    </div>

                    <div style={{marginTop:8, fontSize:12, color:'#000000ff'}}>{c.farmer_name || c.seller_name ? `${t('farmerPrefix', lang)}: ${c.farmer_name || c.seller_name}` : ''}</div>

                    {(() => {
                      const addr = (c && (c.address || c.seller_address)) || '';
                      const state = (c && (c.state)) || '';
                      const region = (c && (c.region)) || '';
                      const parts = [];
                      if (addr) parts.push(`${t('addressPrefix', lang)}: ${addr}`);
                      if (state) parts.push(translateOption('state', state, lang));
                      if (region) parts.push((region || '').toString());
                      if (!parts.length) return null;
                      return (<div style={{marginTop:6, fontSize:12, color:'#000000ff', display:'flex', justifyContent:'space-between', gap:8}}>
                        <div style={{flex:1, textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{parts.join(' | ')}</div>
                      </div>);
                    })()}

                    <div style={{display:'flex', justifyContent:'center', marginTop:10}}>
                      <button
                        onClick={async () => {
                          try {
                            const role = (typeof window !== 'undefined' && localStorage.getItem('agriai_role')) || '';
                            const cartKey = role === 'farmer' ? 'agriai_cart_farmer' : 'agriai_cart_buyer';
                            const raw = localStorage.getItem(cartKey);
                            let arr = raw ? JSON.parse(raw) : [];
                            const seller_addr = (c && (c.address || c.seller_address)) || '';
                            const seller_email = (c && (c.seller_email || c.email)) || '';
                            const seller_region = (c && (c.region || c.seller_region)) || '';
                            const seller_state = (c && (c.state || c.seller_state)) || '';
                            const item = { id: c.id, crop_name: c.crop_name, price_per_kg: c.price_per_kg, quantity_kg: c.quantity_kg, image_url: c.image_url, seller_name: c.farmer_name || c.seller_name, seller_phone: c.farmer_phone || c.seller_phone, seller_address: seller_addr, seller_email: seller_email, seller_region: seller_region, seller_state: seller_state, category: c.category || c.cat || '', variety: c.variety || '' };
                            if (!arr.find(x => x && x.id === item.id)) arr.push(item);
                            localStorage.setItem(cartKey, JSON.stringify(arr));

                            // persist to backend
                            try {
                              const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
                              const userRole = (localStorage.getItem('agriai_role') || '').toString().trim();
                              const userId = localStorage.getItem('agriai_id') || null;
                              const userPhone = localStorage.getItem('agriai_phone') || null;
                              // Ensure we send explicit user_type and a numeric user_id when available for farmers
                              const payload = {
                                user_type: userRole || (userId ? 'farmer' : 'buyer'),
                                user_id: (userId != null && userId !== '') ? (isNaN(userId) ? userId : Number(userId)) : undefined,
                                user_phone: userPhone || undefined,
                                items: [ { crop_id: c.id, crop_name: c.crop_name, variety: c.variety || '', quantity_kg: c.quantity_kg || 0, price_per_kg: c.price_per_kg || null, image_path: c.image_url || null, category: c.category || c.cat || '' } ]
                              };
                              fetch(`${apiBase}/cart/add`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
                                .then(async res => { if (!res.ok) { const t = await res.text().catch(()=>''); console.warn('cart/add failed', res.status, t); } else { try { window.dispatchEvent(new Event('agriai:cart:update')); } catch(e){} } })
                                .catch(err => console.warn('cart/add network error', err));
                            } catch (e) { console.warn('persist cart error', e); }
                          } catch (e) { console.warn('addToCart error', e); }
                          try { setAddAnimId(c.id); setTimeout(() => setAddAnimId(null), 220); } catch(e){}
                          const role = (typeof window !== 'undefined' && localStorage.getItem('agriai_role')) || '';
                          if (role === 'buyer') {
                            try { navigate('/cart'); } catch (e) {}
                          } else {
                            try { navigate('/farmer/cart'); } catch (e) {}
                          }
                        }}
                        onMouseDown={() => { try { setAddAnimId(c.id); } catch(e){} }}
                        onMouseUp={() => { try { setAddAnimId(null); } catch(e){} }}
                        onMouseLeave={() => { try { setAddAnimId(null); } catch(e){} }}
                        style={{
                          padding: '8px 14px',
                          background: '#236902',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          cursor: 'pointer',
                          transform: addAnimId === c.id ? 'scale(0.96)' : 'scale(1)',
                          transition: 'transform 140ms ease'
                        }}
                      >
                        {t('addToCart', lang)}
                      </button>
                    </div>
                  </div>
                ));
              })()
            ) : (
              <div style={{gridColumn: '1/-1', color:'#666'}}></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FarmerDashboard() {
  const [lang, setLang] = React.useState((typeof window !== 'undefined' && localStorage.getItem('agri_lang')) || 'en');
  React.useEffect(() => {
    const onLang = () => {
      setLang((localStorage.getItem('agri_lang') || 'en'));
      window.location.reload(); // Refresh the page automatically on language change
    };
    try { window.addEventListener && window.addEventListener('agri:lang:change', onLang); } catch(e){}
    return () => { try { window.removeEventListener && window.removeEventListener('agri:lang:change', onLang); } catch(e){} };
  }, []);

  const role = (typeof window !== 'undefined' && localStorage.getItem('agriai_role')) ? localStorage.getItem('agriai_role') : '';
  const isBuyer = role === 'buyer';

  return (
    <div className="bd-root" style={{ background: 'rgba(83, 255, 3, 0.12)', backgroundAttachment: 'fixed', minHeight: '100vh', color: '#000', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        .bd-root {
          background: rgba(83, 255, 3, 0.12) !important;
        }
        .bd-root .homepage-hero {
          background: rgba(83, 255, 3, 0) !important;
        }
        .bd-root .navbar {
          background: oklch(0.12 0.03 160 / 0.5) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
        }
        .bd-root .navbar select {
          background: oklch(0.12 0.03 160 / 0.6) !important;
          border: 1px solid oklch(0.65 0.22 145 / 0.3) !important;
          color: rgba(255,255,255,0.9) !important;
        }
        .bd-root .navbar select option {
          background: #1a1a1a;
          color: #ffffff;
        }
      `}</style>
      <Navbar />
      <main className="homepage-hero" style={{ padding: '6rem 1rem 2rem', position: 'relative', zIndex: 1 }}>
        <BuyerSearchBox />
      </main>
      <Chatbot />
      <footer className="w-full border-t mt-8" style={{background:'oklch(0.12 0.03 160 / 0.5)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', borderColor:'oklch(0.65 0.22 145 / 0.12)', padding:'1em 0'}}>
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
                {t('footerDescription', lang)}
              </p>
            </div>

            {[
              { title: t('footerPlatform', lang), links: ['footerAbout', 'footerHowItWorks', 'footerFeatures', 'footerPricing'] },
              { title: t('footerUsers', lang), links: ['footerFarmers', 'footerBuyers', 'footerAgribusiness', 'footerPartners'] },
              { title: t('footerLegal', lang), links: ['footerPrivacy', 'footerTerms', { label: t('footerContact', lang), path: "/contact" }] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-white mb-2" style={{fontFamily:"'Times New Roman', Times, serif"}}>{col.title}</h4>
                <ul className="space-y-1">
                  {col.links.map((link) => {
                    const label = typeof link === 'string' ? t(link, lang) : link.label;
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
              © {new Date().getFullYear()} AgriAI. {t('footerRights', lang)}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
