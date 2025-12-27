import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import ImageSlideshow from './ImageSlideshow';
import Chatbot from './Chatbot';
import { t } from './i18n';

function BuyerSearchBox() {
  const [region, setRegion] = React.useState('');
  const [state, setState] = React.useState('');
  const [stateOptions, setStateOptions] = React.useState([]);
  const [regionOptions, setRegionOptions] = React.useState([]);
  const [cropOptions, setCropOptions] = React.useState([]);
  // master lists (all distinct values from cropsSource)
  const [regionMaster, setRegionMaster] = React.useState([]);
  const [stateMaster, setStateMaster] = React.useState([]);
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

  // compute master lists of distinct regions/states/categories/crops/varieties
  React.useEffect(() => {
    try {
      const r = new Map();
      const s = new Map();
      const c = new Map();
      const cr = new Map();
      const v = new Map();
      (cropsSource || []).forEach(d => {
        try {
          const rRaw = (d.region || '').toString().trim();
          const sRaw = (d.state || '').toString().trim();
          const catRaw = (d.category || '').toString().trim();
          const cnameRaw = (d.crop_name || '').toString().trim();
          const varRaw = (d.variety || '').toString().trim();
          if (rRaw) r.set(rRaw.toLowerCase(), rRaw);
          if (sRaw) s.set(sRaw.toLowerCase(), sRaw);
          if (catRaw) c.set(catRaw.toLowerCase(), catRaw);
          if (cnameRaw) cr.set(cnameRaw.toLowerCase(), cnameRaw);
          if (varRaw) v.set(varRaw.toLowerCase(), varRaw);
        } catch (e) {}
      });
      setRegionMaster(Array.from(r.values()).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'})));
      setStateMaster(Array.from(s.values()).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'})));
      setCategoryMaster(Array.from(c.values()).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'})));
      setCropMaster(Array.from(cr.values()).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'})));
      setVarietyMaster(Array.from(v.values()).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'})));
    } catch (e) {}
  }, [cropsSource]);

  React.useEffect(() => {
    try {
      const catMap = new Map();
      const cropMap = new Map();
      const varietyMap = new Map();
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

      const catArr = Array.from(catMap.values()).sort((a,b) => a.localeCompare(b, undefined, { sensitivity:'base' }));
      const cropArrLocal = Array.from(cropMap.values()).sort((a,b) => a.localeCompare(b, undefined, { sensitivity:'base' }));
      const varietyArrLocal = Array.from(varietyMap.values()).sort((a,b) => a.localeCompare(b, undefined, { sensitivity:'base' }));

      setCategoryOptions(catArr);
      setCropOptions(cropArrLocal);
      setVarietyOptions(varietyArrLocal);
    } catch (e) {}
  }, [cropsSource, category, crop]);

  // Link filters: recompute available options for each filter based on current selections.
  React.useEffect(() => {
    try {
      const seenRegion = new Map();
      const seenState = new Map();
      const seenCat = new Map();
      const seenCrop = new Map();
      const seenVar = new Map();

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
          const catRaw = (d.category || '').toString().trim();
          const cnameRaw = (d.crop_name || '').toString().trim();
          const varRaw = (d.variety || '').toString().trim();

          if (matches(d)) {
            if (rRaw) seenRegion.set(rRaw.toLowerCase(), rRaw);
            if (sRaw) seenState.set(sRaw.toLowerCase(), sRaw);
            if (catRaw) seenCat.set(catRaw.toLowerCase(), catRaw);
            if (cnameRaw) seenCrop.set(cnameRaw.toLowerCase(), cnameRaw);
            if (varRaw) seenVar.set(varRaw.toLowerCase(), varRaw);
          }
        } catch (e) {}
      });

      const regionArr = Array.from(seenRegion.values()).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'}));
      const stateArr = Array.from(seenState.values()).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'}));
      const catArr2 = Array.from(seenCat.values()).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'}));
      const cropArr2 = Array.from(seenCrop.values()).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'}));
      const varArr2 = Array.from(seenVar.values()).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'}));

      setRegionOptions(regionArr);
      setStateOptions(stateArr);
      setCategoryOptions(catArr2);
      setCropOptions(cropArr2);
      setVarietyOptions(varArr2);

      // Auto-clear selections that are no longer valid
      if (region && regionArr.length && !regionArr.find(x => x.toString().trim().toLowerCase() === region.toString().trim().toLowerCase())) setRegion('');
      if (state && stateArr.length && !stateArr.find(x => x.toString().trim().toLowerCase() === state.toString().trim().toLowerCase())) setState('');
      if (category && catArr2.length && !catArr2.find(x => x.toString().trim().toLowerCase() === category.toString().trim().toLowerCase())) { setCategory(''); setCrop(''); setVariety(''); }
      if (crop && cropArr2.length && !cropArr2.find(x => x.toString().trim().toLowerCase() === crop.toString().trim().toLowerCase())) { setCrop(''); setVariety(''); }
      if (variety && varArr2.length && !varArr2.find(x => x.toString().trim().toLowerCase() === variety.toString().trim().toLowerCase())) setVariety('');
    } catch (e) {}
  }, [cropsSource, region, state, category, crop, variety]);
  // Keep selections visible but mark incompatible options disabled; clear selection only if no matching crops exist
  const isOptionEnabled = React.useCallback((field, optionValue) => {
    try {
      const opt = (optionValue || '').toString().trim().toLowerCase();
      if (!opt) return true;
      const any = (cropsSource || []).some(d => {
        try {
          const r = (d.region || '').toString().trim().toLowerCase();
          const s = (d.state || '').toString().trim().toLowerCase();
          const cat = (d.category || '').toString().trim().toLowerCase();
          const cname = (d.crop_name || '').toString().trim().toLowerCase();
          const varname = (d.variety || '').toString().trim().toLowerCase();
          if (field !== 'region' && region && region.toString().trim().toLowerCase() !== r) return false;
          if (field !== 'state' && state && state.toString().trim().toLowerCase() !== s) return false;
          if (field !== 'category' && category && category.toString().trim().toLowerCase() !== cat) return false;
          if (field !== 'crop' && crop && crop.toString().trim().toLowerCase() !== cname) return false;
          if (field !== 'variety' && variety && variety.toString().trim().toLowerCase() !== varname) return false;
          if (field === 'region') return r === opt;
          if (field === 'state') return s === opt;
          if (field === 'category') return cat === opt;
          if (field === 'crop') return cname === opt;
          if (field === 'variety') return varname === opt;
          return true;
        } catch (e) { return true; }
      });
      return !!any;
    } catch (e) { return true; }
  }, [cropsSource, region, state, category, crop, variety]);

  // auto-clear selections that become invalid (not present in enabled options)
  React.useEffect(() => {
    try {
      if (region && !isOptionEnabled('region', region)) setRegion('');
      if (state && !isOptionEnabled('state', state)) setState('');
      if (category && !isOptionEnabled('category', category)) { setCategory(''); setCrop(''); setVariety(''); }
      if (crop && !isOptionEnabled('crop', crop)) { setCrop(''); setVariety(''); }
      if (variety && !isOptionEnabled('variety', variety)) setVariety('');
    } catch (e) {}
  }, [region, state, category, crop, variety, isOptionEnabled]);

  React.useEffect(() => {
    (async () => {
      try {
        const base = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
        const res = await fetch(`${base}/states/list`);
        if (res && res.ok) {
          const j = await res.json();
          if (j && j.ok && Array.isArray(j.states)) setStateOptions(j.states);
        }
      } catch (e) {}
    })();
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
    <div style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'4.5rem 0rem 2rem 0rem'}}>
      <div style={{background:'#fff', padding:'1rem 5rem', boxShadow:'0 6px 12px rgba(0,0,0,0.06)', width:'100%', maxWidth:980, marginTop: '1.5rem'}}>
        <h3 style={{marginTop:0, color:'#236902', textAlign:'center', fontSize:26, lineHeight:1.2, paddingBottom:8}}>{t('findFarmersTitle', lang)}</h3>
        <div style={{display:'flex', gap:6, alignItems:'flex-start', flexWrap:'wrap'}}>
          {/* Region, State, Category, Crop, Variety Dropdowns */}
          <div style={{flex:'1 1 160px', minWidth:120}}>
            <label style={{display:'block', marginBottom:2, fontWeight:700, fontSize:14}}>{t('labelRegion', lang)}</label>
            {(regionMaster && regionMaster.length ? regionMaster : regionOptions).length ? (
              <select value={region} onChange={e => setRegion(e.target.value)} style={{width:'100%', padding:6, whiteSpace:'normal'}}>
                <option value=''>{t('selectRegion', lang)}</option>
                    {(regionMaster && regionMaster.length ? regionMaster : regionOptions).filter(r => isOptionEnabled('region', r)).map(r => {
                      const label = (r || '').toString();
                      return <option key={r} value={r} title={label}>{label}</option>;
                    })}
              </select>
            ) : (
              <select value={region} onChange={e => setRegion(e.target.value)} style={{width:'100%', padding:6, whiteSpace:'normal'}}>
                <option value=''>{t('selectRegion', lang)}</option>
                <option value='North' title={'North'}>North</option>
                <option value='South' title={'South'}>South</option>
                <option value='East' title={'East'}>East</option>
                <option value='West' title={'West'}>West</option>
              </select>
            )}
          </div>
          <div style={{flex:'1 1 220px', minWidth:120}}>
            <label style={{display:'block', marginBottom:2, fontWeight:700, fontSize:14}}>{t('labelState', lang)}</label>
            {(stateMaster && stateMaster.length ? stateMaster : stateOptions).length ? (
              <select value={state} onChange={e => setState(e.target.value)} style={{width:'100%', padding:6, whiteSpace:'normal'}}>
                <option value=''>{t('selectState', lang)}</option>
                {(stateMaster && stateMaster.length ? stateMaster : stateOptions).filter(s => isOptionEnabled('state', s)).map(s => {
                  const label = translateOption('state', s, lang);
                  return <option key={s} value={s} title={label}>{label}</option>;
                })}
              </select>
            ) : (
              <input value={state} onChange={e => setState(e.target.value)} placeholder={t('placeholderState', lang) || t('placeholderState', 'en')} style={{width:'100%', padding:6}} />
            )}
          </div>
          <div style={{flex:'1 1 180px', minWidth:110}}>
            <label style={{display:'block', marginBottom:2, fontWeight:700, fontSize:14}}>{t('labelCategory', lang)}</label>
            <select value={category} onChange={e => { setCategory(e.target.value); setCrop(''); setVariety(''); }} style={{width:'100%', padding:6, whiteSpace:'normal'}}>
              <option value=''>{t('selectCategory', lang)}</option>
              {(categoryMaster && categoryMaster.length ? categoryMaster : categoryOptions).filter(s => isOptionEnabled('category', s)).map(s => {
                const label = translateOption('category', s, lang);
                return <option key={s} value={s} title={label}>{label}</option>;
              })}
            </select>
          </div>
          <div style={{flex:'1 1 180px', minWidth:110}}>
            <label style={{display:'block', marginBottom:2, fontWeight:700, fontSize:14}}>{t('labelCropName', lang)}</label>
            {(cropMaster && cropMaster.length ? cropMaster : cropOptions).length ? (
              <select value={crop} onChange={e => { setCrop(e.target.value); setVariety(''); }} style={{width:'100%', padding:6, whiteSpace:'normal'}}>
                <option value=''>{t('selectCrop', lang)}</option>
                {(cropMaster && cropMaster.length ? cropMaster : cropOptions).filter(s => isOptionEnabled('crop', s)).map(s => {
                  const label = translateOption('crop', s, lang);
                  return <option key={s} value={s} title={label}>{label}</option>;
                })}
              </select>
            ) : (
              <input value={crop} onChange={e => setCrop(e.target.value)} placeholder={t('placeholderCropExample', lang)} style={{width:'100%', padding:6}} />
            )}
          </div>
          <div style={{flex:'1 1 180px', minWidth:120}}>
            <label style={{display:'block', marginBottom:2, fontWeight:700, fontSize:14}}>{t('labelVariety', lang)}</label>
            <select value={variety} onChange={e => setVariety(e.target.value)} style={{width:'100%', padding:6, whiteSpace:'normal'}}>
              <option value=''>{t('selectVariety', lang)}</option>
              {(varietyMaster && varietyMaster.length ? varietyMaster : varietyOptions).filter(s => isOptionEnabled('variety', s)).map(s => {
                const label = translateOption('variety', s, lang);
                return <option key={s} value={s} title={label}>{label}</option>;
              })}
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

          <div style={{display:'grid', gridTemplateColumns:'repeat(4, minmax(240px, 1fr))', gap:16, marginTop:12}}>
            {Array.isArray(results) && results.length ? (
              (() => {
                const crops = [];
                if (Array.isArray(results) && results.length) {
                  results.forEach(f => {
                    if (Array.isArray(f.crop_samples)) {
                      f.crop_samples.forEach(c => {
                        const farmerName = (c && (c._farmer_name || c.farmer_name || c.seller_name || c.seller || c.uploader_name)) || f.name || '';
                        const farmerPhone = (c && (c._farmer_phone || c.seller_phone || c.phone)) || f.phone || '';
                        crops.push({ ...c, _farmer_name: farmerName, _farmer_phone: farmerPhone, _farmer_id: c.farmer_id || c.seller_id || f.id, _farmer_region: c.region || f.region, _farmer_state: c.state || f.state });
                      });
                    }
                  });
                } else {
                  (cropsSource || []).forEach(c => {
                    const farmerName = (c && (c._farmer_name || c.farmer_name || c.seller_name || c.seller || c.uploader_name)) || '';
                    const farmerPhone = (c && (c._farmer_phone || c.seller_phone || c.phone)) || '';
                    crops.push({ ...c, _farmer_name: farmerName, _farmer_phone: farmerPhone, _farmer_id: c.farmer_id || c.seller_id || c.id, _farmer_region: c.region, _farmer_state: c.state });
                  });
                }

                if (!crops.length) return <div style={{gridColumn: '1/-1', color:'#000000ff'}}>{t('noRecentListings', lang)}</div>;

                const activeTerm = (activeCropFilter || '').toString().trim().toLowerCase();

                // apply selection filters (region/state/category/crop/variety)
                const selectionFiltered = crops.filter(ci => {
                  try {
                    if (region) {
                      const r = (ci._farmer_region || ci.region || '').toString().trim().toLowerCase();
                      if (r !== region.toString().trim().toLowerCase()) return false;
                    }
                    if (state) {
                      const s = (ci._farmer_state || ci.state || '').toString().trim().toLowerCase();
                      if (s !== state.toString().trim().toLowerCase()) return false;
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
                      {c.image_url ? (
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
                        />
                      ) : <div style={{color:'#999'}}>{t('noImage', lang)}</div>}
                    </div>

                    <div style={{marginTop:8, fontWeight:800, color:'#236902', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span>{c.crop_name}</span>
                      <span style={{fontWeight:600, color:'#236902', fontSize:15}}>{c.variety ? c.variety : ''}</span>
                    </div>

                    <div style={{display:'flex', justifyContent:'space-between', gap:12, marginTop:6}}>
                      <div style={{fontSize:14, fontWeight:700, color:'#000'}}>{Number(c.quantity_kg || 0).toLocaleString(localeFor(lang))} {t('kg', lang)}</div>
                      <div style={{fontSize:14, fontWeight:700, color:'#000'}}>₹{Number(c.price_per_kg || 0).toLocaleString(localeFor(lang))} / {t('kg', lang)}</div>
                    </div>

                    <div style={{marginTop:8, fontSize:12, color:'#000000ff'}}>{c._farmer_name ? `${t('farmerPrefix', lang)}: ${c._farmer_name}` : ''}</div>

                    {(() => {
                      const addr = (c && (c._farmer_address || c.address || c.seller_address)) || '';
                      const state = (c && (c._farmer_state || c.state)) || '';
                      const region = (c && (c._farmer_region || c.region)) || '';
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
                            const seller_addr = (c && (c._farmer_address || c.address || c.seller_address)) || '';
                            const seller_email = (c && (c.seller_email || c.email || c._farmer_email)) || '';
                            const seller_region = (c && (c._farmer_region || c.region || c.seller_region)) || '';
                            const seller_state = (c && (c._farmer_state || c.state || c.seller_state)) || '';
                            const item = { id: c.id, crop_name: c.crop_name, price_per_kg: c.price_per_kg, quantity_kg: c.quantity_kg, image_url: c.image_url, seller_name: c._farmer_name, seller_phone: c._farmer_phone, seller_address: seller_addr, seller_email: seller_email, seller_region: seller_region, seller_state: seller_state, category: c.category || c.cat || '', variety: c.variety || '' };
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
    const onLang = () => setLang((localStorage.getItem('agri_lang') || 'en'));
    try { window.addEventListener && window.addEventListener('agri:lang:change', onLang); } catch(e){}
    return () => { try { window.removeEventListener && window.removeEventListener('agri:lang:change', onLang); } catch(e){} };
  }, []);

  const role = (typeof window !== 'undefined' && localStorage.getItem('agriai_role')) ? localStorage.getItem('agriai_role') : '';
  const isBuyer = role === 'buyer';

  return (
    <div className="min-h-screen bg-green-50 text-gray-900">
      <Navbar />
      <main className="homepage-hero">
          {isBuyer ? (
          <BuyerSearchBox />
        ) : (
          <>
            <ImageSlideshow />
            <section className="about-agriai">
              <h2 className="about-title">{t('aboutTitle', lang)}</h2>
              <p>{t('aboutText', lang)}</p>
            </section>
            <section className="why-choose-agriai">
              <h2 className="why-choose-title">{t('whyTitle', lang)}</h2>
              <div className="why-choose-cards">
                <div className="why-card">
                  <span className="why-icon" role="img" aria-label="contract">🤝</span>
                  <h3>{t('card1Title', lang)}</h3>
                  <p>{t('card1Text', lang)}</p>
                </div>
                <div className="why-card">
                  <span className="why-icon" role="img" aria-label="crop">🌾</span>
                  <h3>{t('card2Title', lang)}</h3>
                  <p>{t('card2Text', lang)}</p>
                </div>
                <div className="why-card">
                  <span className="why-icon" role="img" aria-label="price">💰</span>
                  <h3>{t('card3Title', lang)}</h3>
                  <p>{t('card3Text', lang)}</p>
                </div>
                <div className="why-card">
                  <span className="why-icon" role="img" aria-label="chatbot">🧠</span>
                  <h3>{t('card4Title', lang)}</h3>
                  <p>{t('card4Text', lang)}</p>
                </div>
                <div className="why-card">
                  <span className="why-icon" role="img" aria-label="government">🏛️</span>
                  <h3>{t('card5Title', lang)}</h3>
                  <p>{t('card5Text', lang)}</p>
                </div>
                <div className="why-card">
                  <span className="why-icon" role="img" aria-label="language">🌐</span>
                  <h3>{t('card6Title', lang)}</h3>
                  <p>{t('card6Text', lang)}</p>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      <Chatbot />
    </div>
  );
}
