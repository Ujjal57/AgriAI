import React from 'react';
import Navbar from '../Navbar';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { t } from '../i18n';

function BuyerSearchBox() {
  const [region, setRegion] = React.useState('');
  const [state, setState] = React.useState('');
  const [stateOptions, setStateOptions] = React.useState([]);
  const [address, setAddress] = React.useState('');
  const [regionOptions, setRegionOptions] = React.useState([]);
  const [cropOptions, setCropOptions] = React.useState([]);
  const [crop, setCrop] = React.useState('');
  const [categoryOptions, setCategoryOptions] = React.useState([]);
  const [category, setCategory] = React.useState('');
  const [varietyOptions, setVarietyOptions] = React.useState([]);
  const [variety, setVariety] = React.useState('');
  const [, setCropsSource] = React.useState([]);
  const [dealsSource, setDealsSource] = React.useState([]);

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
    const listUrl = `${base}/deals/list` + (q.toString() ? ('?' + q.toString()) : '');
    fetch(listUrl)
      .then(async res => {
        setLoading(false);
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(`Server returned ${res.status}: ${txt || res.statusText}`);
        }
        const j = await res.json().catch(() => null);
        if (j && j.ok && Array.isArray(j.deals)) {
          // Apply category/variety filters client-side since deals/list doesn't accept them
          const filteredDeals = (j.deals || []).filter(d => {
            try {
              if (category && ((d.category || '').toString().trim().toLowerCase() !== category.toString().trim().toLowerCase())) return false;
              if (variety && ((d.variety || '').toString().trim().toLowerCase() !== variety.toString().trim().toLowerCase())) return false;
              if (address && !((d.address || '').toString().toLowerCase().includes(address.toString().trim().toLowerCase()))) return false;
              if (crop && ((d.crop_name || '').toString().trim().toLowerCase() !== crop.toString().trim().toLowerCase())) return false;
            } catch (e) {}
            return true;
          });
          const mapped = filteredDeals.map(d => ({
            id: d.id,
            crop_name: d.crop_name,
            quantity_kg: d.quantity_kg,
            price_per_kg: d.price_per_kg || 0,
            image_url: d.image_url,
              _farmer_name: d.buyer_name || d.buyer || '',
              _farmer_phone: d.buyer_phone || '' ,
              address: d.address || '',
              category: d.category || '',
              variety: d.variety || '',
            region: d.region || '',
            state: d.state || '',
            created_at: d.created_at,
            delivery_date: d.delivery_date
          }));
          const synthetic = [{ id: '_all_deals', name: 'Deals', phone: '', crop_samples: mapped }];
          setResults(synthetic);
          setDealsSource(j.deals || []);
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
        const res = await fetch(`${base}/deals/list`);
        if (!res || !res.ok) return;
        const j = await res.json().catch(() => null);
        if (!j || !j.ok || !Array.isArray(j.deals)) return;
        setDealsSource(j.deals || []);
      } catch (e) {}
    })();
  }, []);

  // Fetch crops table to build category -> crop -> variety mappings
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
    // Build region/state option lists deduplicated case-insensitively but preserve original casing (first seen)
    const regionMap = new Map(); // lower -> original
    const stateMap = new Map();
    const regionArr = [];
    const stateArr = [];

    (dealsSource || []).forEach(d => {
      try {
        const rawR = (d.region || '').toString().trim();
        const rawS = (d.state || '').toString().trim();
        const rKey = rawR.toLowerCase();
        const sKey = rawS.toLowerCase();
        if (rawR && !regionMap.has(rKey)) { regionMap.set(rKey, rawR); regionArr.push(rawR); }
        // Only include state when region filter matches or not set
        if ((!region || rKey === (region || '').toString().trim().toLowerCase()) && rawS && !stateMap.has(sKey)) { stateMap.set(sKey, rawS); stateArr.push(rawS); }
        
      } catch (e) {}
    });

    // Sort display values case-insensitively
    regionArr.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    stateArr.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    setRegionOptions(regionArr);
    setStateOptions(stateArr);
    

    // Build category / crop / variety options from dealsSource (use values present in deals table)
    try {
      // Use case-insensitive dedupe maps to preserve first-seen original casing
      const catMap = new Map(); // lower -> original
      const cropMap = new Map();
      const varietyMap = new Map();

      (dealsSource || []).forEach(d => {
        try {
          const r = (d.region || '').toString().trim();
          const s = (d.state || '').toString().trim();
          const catRaw = (d.category || '').toString().trim();
          const cnameRaw = (d.crop_name || '').toString().trim();
          const varnameRaw = (d.variety || '').toString().trim();

          const catKey = catRaw.toLowerCase();
          const cnameKey = cnameRaw.toLowerCase();
          const varKey = varnameRaw.toLowerCase();

          if (catRaw && !catMap.has(catKey)) { catMap.set(catKey, catRaw); }

          // Only include crops matching selected category (if set) and region/state filters
          const regionMatch = !region || r.toLowerCase() === (region || '').toString().trim().toLowerCase();
          const stateMatch = !state || s.toLowerCase() === (state || '').toString().trim().toLowerCase();
          const categoryMatch = !category || (catRaw && catRaw.toLowerCase() === category.toString().trim().toLowerCase());
          if (regionMatch && stateMatch && categoryMatch) {
            if (cnameRaw && !cropMap.has(cnameKey)) { cropMap.set(cnameKey, cnameRaw); }
            // For variety, include when crop matches selected crop (if set)
            const cropMatch = !crop || cnameRaw.toLowerCase() === (crop || '').toString().trim().toLowerCase();
            if (cropMatch && varnameRaw && !varietyMap.has(varKey)) { varietyMap.set(varKey, varnameRaw); }
          }
        } catch (e) {}
      });

      // preserve order of first-seen originals
      const catArr = Array.from(catMap.values());
      const cropArrLocal = Array.from(cropMap.values());
      const varietyArrLocal = Array.from(varietyMap.values());

      // Sort options case-insensitively for nicer UX
      catArr.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
      cropArrLocal.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
      varietyArrLocal.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

      setCategoryOptions(catArr);
      setCropOptions(cropArrLocal);
      setVarietyOptions(varietyArrLocal);
    } catch (e) {
      // ignore
    }
  }, [dealsSource, region, state, category, crop]);

  return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'0 1rem'}}>
      <div style={{background:'rgba(255,255,255,0.92)',backdropFilter:'blur(20px) saturate(1.6)',WebkitBackdropFilter:'blur(20px) saturate(1.6)',border:'1px solid rgba(255,255,255,0.6)',borderRadius:'24px',padding:'2.5rem',boxShadow:'0 8px 32px rgba(35,105,2,0.12), 0 32px 64px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)', width:'100%', maxWidth:1400}}>
      <div
  style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    width: '100%',
    flexWrap: 'wrap'
  }}
>
  {/* Centered Heading */}
  <h3
    style={{
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)',
      margin: 0,
      backgroundImage: 'linear-gradient(135deg, #1a5c10 0%, #236902 50%, #53b635 100%)',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      fontSize: 22,
      fontWeight: 800,
      lineHeight: 1.2,
      paddingBottom: 5,
      textAlign: 'center',
      width: '100%',
      pointerEvents: 'none'
    }}
  >
    {t('findBuyersTitle', lang)}
  </h3>

</div>

        <div style={{display:'flex', gap:6, alignItems:'center', flexWrap:'nowrap', marginTop:30, overflowX:'auto', paddingBottom:8}}>
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
          <div style={{flex:'1 1 160px', minWidth:120}}>
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
          <div style={{flex:'1 1 180px', minWidth:140, marginLeft:12}}>
            <label style={{display:'block', marginBottom:2, fontWeight:700, fontSize:14, color:'#2d5c1a'}}>{t('labelCategory', lang)}</label>
            <select value={category} onChange={e => { setCategory(e.target.value); setCrop(''); setVariety(''); }} style={{width:'100%', padding:'10px 14px', border:'1.5px solid #d4edcc', borderRadius:10, background:'rgba(255,255,255,0.95)', color:'#1a3d0a', fontSize:'0.9rem', fontFamily:'inherit', outline:'none', transition:'border-color 0.25s, box-shadow 0.25s'}}>
              <option value=''>{t('selectCategory', lang)}</option>
              {categoryOptions && categoryOptions.length ? categoryOptions.map(s => <option key={s} value={s}>{s}</option>) : null}
            </select>
          </div>
          <div style={{flex:'1 1 180px', minWidth:110}}>
            <label style={{display:'block', marginBottom:2, fontWeight:700, fontSize:14, color:'#2d5c1a'}}>{t('labelCropName', lang)}</label>
            <select value={crop} onChange={e => setCrop(e.target.value)} style={{width:'100%', padding:'10px 14px', border:'1.5px solid #d4edcc', borderRadius:10, background:'rgba(255,255,255,0.95)', color:'#1a3d0a', fontSize:'0.9rem', fontFamily:'inherit', outline:'none', transition:'border-color 0.25s, box-shadow 0.25s'}}>
              <option value=''>{t('selectCrop', lang)}</option>
              {cropOptions && cropOptions.length ? cropOptions.map(s => <option key={s} value={s}>{s}</option>) : null}
            </select>
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
        <style>
          
        </style>
        <div style={{ marginTop: 28 }}>
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
        height: 140px;
        object-fit: cover;
        border-radius: 6px;
        transition: transform 0.4s ease;
      }

      .card-container:hover .card-image {
        transform: scale(1.08);
      }
    `}
  </style>
  <div style={{ textAlign: 'center', marginBottom: 10 }}>
    <h3 style={{ margin: 0, fontSize: 22, lineHeight: 1.25, fontWeight: 800, backgroundImage: 'linear-gradient(135deg, #1a5c10 0%, #236902 50%, #53b635 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{t('buyersTitle', lang)}</h3>
    {loading && <div style={{ color: '#000000ff' }}>{t('searching', lang)}</div>}
    {error && <div style={{ color: 'crimson' }}>{error}</div>}
  </div>

  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 240px)', gap: 16, marginTop: 12 }}>
    {Array.isArray(results) && results.length ? (
      (() => {
        const crops = [];
        results.forEach(f => {
          if (Array.isArray(f.crop_samples)) {
            f.crop_samples.forEach(c => {
              const farmerName =
                (c && (c._farmer_name || c.farmer_name || c.seller_name || c.seller || c.uploader_name)) ||
                f.name ||
                '';
              const farmerPhone = (c && (c._farmer_phone || c.seller_phone || c.phone)) || f.phone || '';
              crops.push({
                ...c,
                _farmer_name: farmerName,
                _farmer_phone: farmerPhone,
                _farmer_id: c.farmer_id || c.seller_id || f.id,
                _farmer_state: c.state || f.state,
                _farmer_region: c.region || f.region
                
              });
            });
          }
        });

        if (!crops.length)
          return <div style={{ gridColumn: '1/-1', color: '#000000ff' }}>{t('noRecentListings', lang)}</div>;

        const activeTerm = (activeCropFilter || '').toString().trim().toLowerCase();
        const nonExpired = crops.filter(ci => {
          if (ci.is_expired) return false;
          if (ci.delivery_date) {
            try {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const dd = new Date(ci.delivery_date);
              return dd >= today;
            } catch (e) {
              return true;
            }
          }
          return true;
        });

        const nameFiltered = activeTerm
          ? nonExpired.filter(ci => (ci.crop_name || '').toString().toLowerCase().includes(activeTerm))
          : nonExpired;

        const filtered = nameFiltered.filter(ci => Number(ci.quantity_kg || 0) > 0);

        if (!filtered.length)
          return <div style={{ gridColumn: '1/-1', color: '#000000ff' }}>{t('noListingsMatch', lang)}</div>;

        return filtered.map(c => (
          <div
            key={c.id || (c.crop_name + Math.random())}
            className="card-container"
            style={{
              background: '#fff',
              borderRadius: 8,
              padding: 10,
              border: '1px solid #eaeaea',
              boxShadow: '0 6px 18px rgba(0,0,0,0.04)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '100%',
                height: 140,
                borderRadius: 6,
                overflow: 'hidden',
                background: '#f4f4f4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {c.image_url ? (
                <img src={c.image_url} alt={c.crop_name} className="card-image" />
              ) : (
                <div style={{ color: '#999' }}>{t('noImage', lang)}</div>
              )}
            </div>

            <div style={{ marginTop: 8, fontWeight: 800, fontSize: 18, color: '#236902' }}>{c.crop_name}</div>

            <div style={{ marginTop: 8, fontSize: 15, fontWeight: 700, color: '#000', textAlign: 'center' }}>
              {t('quantityLabel', lang)}: {Number(c.quantity_kg || 0).toLocaleString(localeFor(lang))} {t('kg', lang)}
            </div>

            {(() => {
              const dd = c.delivery_date ? new Date(c.delivery_date) : null;
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              if (!dd) return null;
              const isToday =
                dd.getFullYear() === today.getFullYear() &&
                dd.getMonth() === today.getMonth() &&
                dd.getDate() === today.getDate();
              return (
                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, textAlign: 'center' }}>
                  {isToday ? t('expiresToday', lang) : `${t('deliveryPrefix', lang)}: ${dd.toLocaleDateString(localeFor(lang))}`}
                </div>
              );
            })()}

            <div style={{ marginTop: 8, fontSize: 13, color: '#000000ff', fontWeight: 700 }}>
              {c._farmer_name ? `${t('buyerPrefix', lang)}: ${c._farmer_name}` : ''}
            </div>

            {(() => {
              const addr = (c && (c.address || c._farmer_address || c.seller_address)) || '';
              const region = (c && (c.region || c._farmer_region)) || '';
              const state = (c && (c.state || c._farmer_state)) || '';

              if (!addr && !region && !state) return null;
              return (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: '#1f6f1f',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    alignItems: 'center'
                  }}
                >
                  {addr ? (
                    <div
                      style={{
                        fontSize: 12,
                        color: '#000000ff',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%'
                      }}
                    >{`${t('addressPrefix', lang)}: ${addr}`}</div>
                  ) : null}
                  {(region || state) ? (
                    <div style={{ fontSize: 12, color: '#000000ff' }}>
                      {[state, region].filter(Boolean).join(' | ')}
                    </div>
                  ) : null}
                </div>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
              <button
                onClick={async () => {
                  // optimistic localStorage update to preserve UX
                  try {
                    const role = (typeof window !== 'undefined' && localStorage.getItem('agriai_role')) || '';
                    const cartKey = role === 'farmer' ? 'agriai_cart_farmer' : 'agriai_cart_buyer';
                    const raw = localStorage.getItem(cartKey);
                    let arr = raw ? JSON.parse(raw) : [];
                    const seller_addr =
                      (c && (c._farmer_address || c.address || c.seller_address)) || '';
                    const seller_email =
                      (c && (c.seller_email || c.email || c._farmer_email)) || '';
                    const seller_region =
                      (c && (c._farmer_region || c.region || c.seller_region)) || '';
                    const seller_state =
                      (c && (c._farmer_state || c.state || c.seller_state)) || '';
                    const item = {
                      id: c.id,
                      crop_name: c.crop_name,
                      price_per_kg: c.price_per_kg,
                      quantity_kg: c.quantity_kg,
                      image_url: c.image_url,
                      seller_name: c._farmer_name,
                      seller_phone: c._farmer_phone,
                      seller_address: seller_addr,
                      seller_email: seller_email,
                      seller_region: seller_region,
                      seller_state: seller_state,
                      category: c.category || c.cat || '',
                      farmer_id: c._farmer_id || c.farmer_id || c.seller_id,
                      variety: c.variety || c.variety || ''
                    };
                    if (!arr.find(x => x && x.id === item.id)) arr.push(item);
                    localStorage.setItem(cartKey, JSON.stringify(arr));

                    // Attempt to persist to server-side cart table
                    try {
                      const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
                      const userRole = (localStorage.getItem('agriai_role') || '').toString().trim();
                      const userId = localStorage.getItem('agriai_id') || null;
                      const userPhone = localStorage.getItem('agriai_phone') || null;
                      // Ensure we send explicit user_type and a numeric user_id when available for farmers
                      // Attempt to resolve buyer_id from the deals table (dealsSource)
                      let buyerIdFromDeal = null;
                      try {
                        const match = (dealsSource || []).find(d => {
                          try { return String(d.id) === String(c.id) || String(d.crop_id) === String(c.id); } catch(e) { return false; }
                        });
                        if (match) buyerIdFromDeal = match.buyer_id || match.buyerId || match.buyer || null;
                      } catch (e) { buyerIdFromDeal = null; }

                      const payload = {
                        user_type: userRole || (userId ? 'farmer' : 'buyer'),
                        user_id: (userId != null && userId !== '') ? (isNaN(userId) ? userId : Number(userId)) : undefined,
                        buyer_id: (buyerIdFromDeal != null && buyerIdFromDeal !== '') ? (isNaN(buyerIdFromDeal) ? buyerIdFromDeal : Number(buyerIdFromDeal)) : undefined,
                        user_phone: userPhone || undefined,
                        items: [
                          {
                            crop_id: c.id,
                            crop_name: c.crop_name,
                            variety: c.variety || c.variety || '',
                            quantity_kg: c.quantity_kg || 0,
                            price_per_kg: c.price_per_kg || null,
                            image_path: c.image_url || null,
                            category: c.category || c.cat || ''
                          }
                        ]
                      };
                      fetch(`${apiBase}/cart/add`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                      }).then(async res => {
                        if (!res.ok) {
                          const txt = await res.text().catch(() => '');
                          console.warn('cart/add failed', res.status, txt);
                        } else {
                          // inform other parts of the app (Navbar) about cart change
                          try { window.dispatchEvent(new Event('agriai:cart:update')); } catch (e) {}
                        }
                      }).catch(err => {
                        console.warn('cart/add network error', err);
                      });
                    } catch (e) {
                      console.warn('persist cart error', e);
                    }
                  } catch (e) {
                    console.warn('addToCart error', e);
                  }
                  try {
                    setAddAnimId(c.id);
                    setTimeout(() => setAddAnimId(null), 220);
                  } catch (e) {}
                  const role = (typeof window !== 'undefined' && localStorage.getItem('agriai_role')) || '';
                  if (role === 'farmer') {
                    try {
                      navigate('/farmer/cart');
                    } catch (e) {}
                  } else {
                    try {
                      navigate('/cart');
                    } catch (e) {}
                  }
                }}
                onMouseDown={() => {
                  try {
                    setAddAnimId(c.id);
                  } catch (e) {}
                }}
                onMouseUp={() => {
                  try {
                    setAddAnimId(null);
                  } catch (e) {}
                }}
                onMouseLeave={() => {
                  try {
                    setAddAnimId(null);
                  } catch (e) {}
                }}
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
      <div style={{ gridColumn: '1/-1', color: '#666' }}></div>
    )}
  </div>
</div>

      </div>
    </div>
  );
}

export default function BuyerDashboard() {
  const [currentLang, setCurrentLang] = React.useState(localStorage.getItem('agri_lang') || 'en');

  React.useEffect(() => {
    const onLangChange = (e) => {
      const lang = (e && e.detail && e.detail.lang) ? e.detail.lang : (localStorage.getItem('agri_lang') || 'en');
      setCurrentLang(lang);
      try { window.location.reload(); } catch (e) {}
    };

    window.addEventListener('agri:lang:change', onLangChange);
    return () => window.removeEventListener('agri:lang:change', onLangChange);
  }, []);

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
      <main className="homepage-hero" style={{padding: '6rem 1rem 2rem', position: 'relative', zIndex: 1}}>
        <BuyerSearchBox />
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
                {t('footerDescription', currentLang)}
              </p>
            </div>

            {[
              { title: t('footerPlatform', currentLang), links: ['footerAbout', 'footerHowItWorks', 'footerFeatures', 'footerPricing'] },
              { title: t('footerUsers', currentLang), links: ['footerFarmers', 'footerBuyers', 'footerAgribusiness', 'footerPartners'] },
              { title: t('footerLegal', currentLang), links: ['footerPrivacy', 'footerTerms', { label: t('footerContact', currentLang), path: "/contact" }] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-white mb-2" style={{fontFamily:"'Times New Roman', Times, serif"}}>{col.title}</h4>
                <ul className="space-y-1">
                  {col.links.map((link) => {
                    const label = typeof link === 'string' ? t(link, localStorage.getItem('agri_lang') || 'en') : link.label;
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
              © {new Date().getFullYear()} AgriAI. {t('footerRights', currentLang)}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
