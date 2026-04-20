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
  // master lists (all distinct values from cropsSource)
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
  const [farmersSource, setFarmersSource] = React.useState([]);
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
        setResults(j.crops);
        setFarmersSource([]); // not needed
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
    if (crop) q.append('crop', crop);
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
          let crops = j.crops;
          // client-side category/variety/address filter since API doesn’t support all
          crops = crops.filter(c => {
            try {
              if (address && !( (c.address||'').toString().toLowerCase().includes(address.toString().trim().toLowerCase()) )) return false;
              if (category && !(c.category||'').toString().trim().toLowerCase() === category.toString().trim().toLowerCase()) return false;
              if (variety && !(c.variety||'').toString().trim().toLowerCase() === variety.toString().trim().toLowerCase()) return false;
              return true;
            } catch (e) { return true; }
          });
          setResults(crops);
          setFarmersSource([]); // not needed
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
        const crops = j.crops || [];
        // setResults(crops); // Removed to not display cards initially
        setCropsSource(crops);
      } catch (e) {}
    })();
  }, []);

  // compute master lists of distinct regions/states/categories/crops/varieties
  React.useEffect(() => {
    try {
      const r = new Map();
      const s = new Map();
      const a = new Map();
      const c = new Map();
      const cr = new Map();
      const v = new Map();
      const source = (farmersSource && farmersSource.length ? farmersSource : cropsSource) || [];
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      source.forEach(d => {
        try {
          const samples = Array.isArray(d.crop_samples) ? d.crop_samples : [];
          const hasAvailableCrop = samples.some(cropItem => {
            const qty = cropItem.quantity_kg;
            const qtyNum = qty !== null && qty !== undefined ? parseFloat(qty) : 1; // assume available if not set
            const expiry = cropItem.expiry_date;
            return qtyNum > 0 && (!expiry || expiry >= today);
          });
          if (!hasAvailableCrop) return; // skip this farmer if no available crops

          const rRaw = (d.region || '').toString().trim();
          const sRaw = (d.state || '').toString().trim();
          const aRaw = (d.address || d.seller_address || d._farmer_address || '').toString().trim();
          if (rRaw) r.set(rRaw.toLowerCase(), rRaw);
          if (sRaw) s.set(sRaw.toLowerCase(), sRaw);
          if (aRaw) a.set(aRaw.toLowerCase(), aRaw);
          samples.forEach(cropItem => {
            const qty = cropItem.quantity_kg;
            const qtyNum = qty !== null && qty !== undefined ? parseFloat(qty) : 1;
            const expiry = cropItem.expiry_date;
            if (qtyNum <= 0 || (expiry && expiry < today)) return; // skip unavailable crops

            const catRaw = (cropItem.category || '').toString().trim();
            const cnameRaw = (cropItem.crop_name || cropItem.name || '').toString().trim();
            const varRaw = (cropItem.variety || '').toString().trim();
            if (catRaw) c.set(catRaw.toLowerCase(), catRaw);
            if (cnameRaw) cr.set(cnameRaw.toLowerCase(), cnameRaw);
            if (varRaw) v.set(varRaw.toLowerCase(), varRaw);
          });
        } catch (e) {}
      });
      setRegionMaster(Array.from(r.values()).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'})));
      setStateMaster(Array.from(s.values()).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'})));
      setAddressMaster(Array.from(a.values()).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'})));
      setCategoryMaster(Array.from(c.values()).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'})));
      setCropMaster(Array.from(cr.values()).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'})));
      setVarietyMaster(Array.from(v.values()).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'})));
    } catch (e) {}
  }, [cropsSource, farmersSource]);

  React.useEffect(() => {
    try {
      const catMap = new Map();
      const cropMap = new Map();
      const varietyMap = new Map();
      const source = (farmersSource && farmersSource.length ? farmersSource : cropsSource) || [];
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      source.forEach(d => {
        try {
          const samples = Array.isArray(d.crop_samples) ? d.crop_samples : [];
          samples.forEach(cropItem => {
            const qty = cropItem.quantity_kg;
            const qtyNum = qty !== null && qty !== undefined ? parseFloat(qty) : 1;
            const expiry = cropItem.expiry_date;
            if (qtyNum <= 0 || (expiry && expiry < today)) return; // skip unavailable crops

            const catRaw = (cropItem.category || '').toString().trim();
            const cnameRaw = (cropItem.crop_name || cropItem.name || '').toString().trim();
            const varnameRaw = (cropItem.variety || '').toString().trim();

            const catKey = catRaw.toLowerCase();
            const cnameKey = cnameRaw.toLowerCase();
            const varKey = varnameRaw.toLowerCase();

            if (catRaw && !catMap.has(catKey)) catMap.set(catKey, catRaw);
            const categoryMatch = !category || (catRaw && catRaw.toLowerCase() === category.toString().trim().toLowerCase());
            if (cnameRaw && !cropMap.has(cnameKey) && categoryMatch) cropMap.set(cnameKey, cnameRaw);
            const cropMatch = !crop || (cnameRaw && cnameRaw.toLowerCase() === (crop || '').toString().trim().toLowerCase());
            if (varnameRaw && !varietyMap.has(varKey) && cropMatch && categoryMatch) varietyMap.set(varKey, varnameRaw);
          });
        } catch (e) {}
      });

      const catArr = Array.from(catMap.values()).sort((a,b) => a.localeCompare(b, undefined, { sensitivity:'base' }));
      const cropArrLocal = Array.from(cropMap.values()).sort((a,b) => a.localeCompare(b, undefined, { sensitivity:'base' }));
      const varietyArrLocal = Array.from(varietyMap.values()).sort((a,b) => a.localeCompare(b, undefined, { sensitivity:'base' }));

      setCategoryOptions(catArr);
      setCropOptions(cropArrLocal);
      setVarietyOptions(varietyArrLocal);
    } catch (e) {}
  }, [cropsSource, farmersSource, category, crop]);

  // Link filters: recompute available options for each filter based on current selections.
  React.useEffect(() => {
    try {
      const seenRegion = new Map();
      const seenState = new Map();
      const seenAddress = new Map();
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

      const source = (farmersSource && farmersSource.length ? farmersSource : cropsSource) || [];
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      source.forEach(d => {
        try {
          const samples = Array.isArray(d.crop_samples) ? d.crop_samples : [];
          const hasAvailableCrop = samples.some(cropItem => {
            const qty = cropItem.quantity_kg;
            const qtyNum = qty !== null && qty !== undefined ? parseFloat(qty) : 1;
            const expiry = cropItem.expiry_date;
            return qtyNum > 0 && (!expiry || expiry >= today);
          });
          if (!hasAvailableCrop) return; // skip farmers without available crops

          const rRaw = (d.region || '').toString().trim();
          const sRaw = (d.state || '').toString().trim();
          const aRaw = (d.address || d.seller_address || d._farmer_address || '').toString().trim();

          if (matches(d)) {
            if (rRaw) seenRegion.set(rRaw.toLowerCase(), rRaw);
            if (sRaw) seenState.set(sRaw.toLowerCase(), sRaw);
            if (aRaw) seenAddress.set(aRaw.toLowerCase(), aRaw);
          }

          samples.forEach(cropItem => {
            const qty = cropItem.quantity_kg;
            const qtyNum = qty !== null && qty !== undefined ? parseFloat(qty) : 1;
            const expiry = cropItem.expiry_date;
            if (qtyNum <= 0 || (expiry && expiry < today)) return; // skip unavailable crops

            const catRaw = (cropItem.category || '').toString().trim();
            const cnameRaw = (cropItem.crop_name || cropItem.name || '').toString().trim();
            const varRaw = (cropItem.variety || '').toString().trim();
            if (matches({ ...d, category: catRaw, crop_name: cnameRaw, variety: varRaw })) {
              if (catRaw) seenCat.set(catRaw.toLowerCase(), catRaw);
              if (cnameRaw) seenCrop.set(cnameRaw.toLowerCase(), cnameRaw);
              if (varRaw) seenVar.set(varRaw.toLowerCase(), varRaw);
            }
          });
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

      // Auto-clear selections that are no longer valid
      if (region && regionArr.length && !regionArr.find(x => x.toString().trim().toLowerCase() === region.toString().trim().toLowerCase())) setRegion('');
      if (state && stateArr.length && !stateArr.find(x => x.toString().trim().toLowerCase() === state.toString().trim().toLowerCase())) setState('');
      if (category && catArr2.length && !catArr2.find(x => x.toString().trim().toLowerCase() === category.toString().trim().toLowerCase())) { setCategory(''); setCrop(''); setVariety(''); }
      if (crop && cropArr2.length && !cropArr2.find(x => x.toString().trim().toLowerCase() === crop.toString().trim().toLowerCase())) { setCrop(''); setVariety(''); }
      if (variety && varArr2.length && !varArr2.find(x => x.toString().trim().toLowerCase() === variety.toString().trim().toLowerCase())) setVariety('');
    } catch (e) {}
  }, [cropsSource, region, state, address, category, crop, variety]);

  // update filtered address suggestions as the user types
  React.useEffect(() => {
    try {
      const q = (address || '').toString().trim().toLowerCase();
      const pool = (addressMaster && addressMaster.length ? addressMaster : addressOptions) || [];
      if (!q) {
        setFilteredAddressMatches([]);
        return;
      }
      const matches = pool.filter(x => (x || '').toString().toLowerCase().startsWith(q)).slice(0, 8);
      setFilteredAddressMatches(matches);
      setShowAddressSuggestions(!!matches.length);
    } catch (e) { setFilteredAddressMatches([]); setShowAddressSuggestions(false); }
  }, [address, addressMaster, addressOptions]);
  // Keep selections visible but mark incompatible options disabled; clear selection only if no matching crops exist
  const isOptionEnabled = React.useCallback((field, optionValue) => {
    try {
      const opt = (optionValue || '').toString().trim().toLowerCase();
      if (!opt) return true;
      const source = (farmersSource && farmersSource.length ? farmersSource : cropsSource) || [];
      const any = source.some(d => {
        try {
          const r = (d.region || '').toString().trim().toLowerCase();
          const s = (d.state || '').toString().trim().toLowerCase();
          const a = (d.address || d.seller_address || d._farmer_address || '').toString().trim().toLowerCase();
          const samples = Array.isArray(d.crop_samples) ? d.crop_samples : [];
          if (field === 'region') {
            if (region && region.toString().trim().toLowerCase() !== r) return false;
            return r === opt;
          }
          if (field === 'state') {
            if (state && state.toString().trim().toLowerCase() !== s) return false;
            return s === opt;
          }
          if (field === 'address') {
            if (address && address.toString().trim().toLowerCase() !== a) return false;
            return a === opt;
          }
          let cat = '';
          let cname = '';
          let varname = '';
          for (const cropItem of samples) {
            cat = (cropItem.category || '').toString().trim().toLowerCase();
            cname = (cropItem.crop_name || cropItem.name || '').toString().trim().toLowerCase();
            varname = (cropItem.variety || '').toString().trim().toLowerCase();
            if (field !== 'category' && category && category.toString().trim().toLowerCase() !== cat) continue;
            if (field !== 'crop' && crop && crop.toString().trim().toLowerCase() !== cname) continue;
            if (field !== 'variety' && variety && variety.toString().trim().toLowerCase() !== varname) continue;
            if (field === 'category' && cat === opt) return true;
            if (field === 'crop' && cname === opt) return true;
            if (field === 'variety' && varname === opt) return true;
          }
          return false;
        } catch (e) { return true; }
      });
      return !!any;
    } catch (e) { return true; }
  }, [cropsSource, farmersSource, region, state, address, category, crop, variety]);

  // auto-clear selections that become invalid (not present in enabled options)
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
            {(regionMaster && regionMaster.length ? regionMaster : regionOptions).length ? (
              <select value={region} onChange={e => setRegion(e.target.value)} style={{width:'100%', padding:'10px 14px', border:'1.5px solid #d4edcc', borderRadius:10, background:'rgba(255,255,255,0.95)', color:'#1a3d0a', fontSize:'0.9rem', fontFamily:'inherit', outline:'none', transition:'border-color 0.25s, box-shadow 0.25s'}}>
                <option value=''>{t('selectRegion', lang)}</option>
                    {(regionMaster && regionMaster.length ? regionMaster : regionOptions).filter(r => isOptionEnabled('region', r)).map(r => {
                      const label = (r || '').toString();
                      return <option key={r} value={r} title={label}>{label}</option>;
                    })}
              </select>
            ) : (
              <select value={region} onChange={e => setRegion(e.target.value)} style={{width:'100%', padding:'10px 14px', border:'1.5px solid #d4edcc', borderRadius:10, background:'rgba(255,255,255,0.95)', color:'#1a3d0a', fontSize:'0.9rem', fontFamily:'inherit', outline:'none', transition:'border-color 0.25s, box-shadow 0.25s'}}>
                <option value=''>{t('selectRegion', lang)}</option>
                <option value='North' title={'North'}>North</option>
                <option value='South' title={'South'}>South</option>
                <option value='East' title={'East'}>East</option>
                <option value='West' title={'West'}>West</option>
              </select>
            )}
          </div>
          <div style={{flex:'1 1 220px', minWidth:120}}>
            <label style={{display:'block', marginBottom:2, fontWeight:700, fontSize:14, color:'#2d5c1a'}}>{t('labelState', lang)}</label>
            {(stateMaster && stateMaster.length ? stateMaster : stateOptions).length ? (
              <select value={state} onChange={e => setState(e.target.value)} style={{width:'100%', padding:'10px 14px', border:'1.5px solid #d4edcc', borderRadius:10, background:'rgba(255,255,255,0.95)', color:'#1a3d0a', fontSize:'0.9rem', fontFamily:'inherit', outline:'none', transition:'border-color 0.25s, box-shadow 0.25s'}}>
                <option value=''>{t('selectState', lang)}</option>
                {(stateMaster && stateMaster.length ? stateMaster : stateOptions).filter(s => isOptionEnabled('state', s)).map(s => {
                  const label = translateOption('state', s, lang);
                  return <option key={s} value={s} title={label}>{label}</option>;
                })}
              </select>
            ) : (
              <input value={state} onChange={e => setState(e.target.value)} placeholder={t('placeholderState', lang) || t('placeholderState', 'en')} style={{width:'100%', padding:'10px 14px', border:'1.5px solid #d4edcc', borderRadius:10, background:'rgba(255,255,255,0.95)', color:'#1a3d0a', fontSize:'0.9rem', fontFamily:'inherit', outline:'none', transition:'border-color 0.25s, box-shadow 0.25s'}} />
            )}
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
              {(categoryMaster && categoryMaster.length ? categoryMaster : categoryOptions).filter(s => isOptionEnabled('category', s)).map(s => {
                const label = translateOption('category', s, lang);
                return <option key={s} value={s} title={label}>{label}</option>;
              })}
            </select>
          </div>
          <div style={{flex:'1 1 180px', minWidth:110}}>
            <label style={{display:'block', marginBottom:2, fontWeight:700, fontSize:14, color:'#2d5c1a'}}>{t('labelCropName', lang)}</label>
            {(cropMaster && cropMaster.length ? cropMaster : cropOptions).length ? (
              <select value={crop} onChange={e => { setCrop(e.target.value); setVariety(''); }} style={{width:'100%', padding:'10px 14px', border:'1.5px solid #d4edcc', borderRadius:10, background:'rgba(255,255,255,0.95)', color:'#1a3d0a', fontSize:'0.9rem', fontFamily:'inherit', outline:'none', transition:'border-color 0.25s, box-shadow 0.25s'}}>
                <option value=''>{t('selectCrop', lang)}</option>
                {(cropMaster && cropMaster.length ? cropMaster : cropOptions).filter(s => isOptionEnabled('crop', s)).map(s => {
                  const label = translateOption('crop', s, lang);
                  return <option key={s} value={s} title={label}>{label}</option>;
                })}
              </select>
            ) : (
              <input value={crop} onChange={e => setCrop(e.target.value)} placeholder={t('placeholderCropExample', lang)} style={{width:'100%', padding:'10px 14px', border:'1.5px solid #d4edcc', borderRadius:10, background:'rgba(255,255,255,0.95)', color:'#1a3d0a', fontSize:'0.9rem', fontFamily:'inherit', outline:'none', transition:'border-color 0.25s, box-shadow 0.25s'}} />
            )}
          </div>
          <div style={{flex:'1 1 180px', minWidth:120}}>
            <label style={{display:'block', marginBottom:2, fontWeight:700, fontSize:14, color:'#2d5c1a'}}>{t('labelVariety', lang)}</label>
            <select value={variety} onChange={e => setVariety(e.target.value)} style={{width:'100%', padding:'10px 14px', border:'1.5px solid #d4edcc', borderRadius:10, background:'rgba(255,255,255,0.95)', color:'#1a3d0a', fontSize:'0.9rem', fontFamily:'inherit', outline:'none', transition:'border-color 0.25s, box-shadow 0.25s'}}>
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
