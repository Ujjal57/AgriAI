import React from 'react';
import Navbar from '../Navbar';
import Chatbot from '../Chatbot';
import { useNavigate } from 'react-router-dom';

function BuyerSearchBox() {
  const [region, setRegion] = React.useState('');
  const [state, setState] = React.useState('');
  const [stateOptions, setStateOptions] = React.useState([]);
  const [regionOptions, setRegionOptions] = React.useState([]);
  const [cropOptions, setCropOptions] = React.useState([]);
  const [crop, setCrop] = React.useState('');
  const [dealsSource, setDealsSource] = React.useState([]);
  
  const [results, setResults] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  // activeCropFilter is applied only when the user clicks Search
  const [activeCropFilter, setActiveCropFilter] = React.useState('');
  const [searchAnim, setSearchAnim] = React.useState(false);
  const [addAnimId, setAddAnimId] = React.useState(null);
  const navigate = useNavigate();

  const handleSearch = () => {
    // set the active crop filter (applies client-side after click)
    setActiveCropFilter((crop || '').toString().trim());
    setResults(null);
    setError(null);
    setLoading(true);
    // button animation
    try { setSearchAnim(true); setTimeout(() => setSearchAnim(false), 180); } catch(e){}
    // default to local backend during development
    const base = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
    // prefer server-side filtering for region/state/crop_name when available; otherwise fetch all and filter client-side
    const q = new URLSearchParams();
    if (region) q.append('region', region);
    if (state) q.append('state', state);
    if (crop) q.append('crop_name', crop);
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
          // Map deals to the crop_samples shape so the existing renderer can be reused.
          const mapped = j.deals.map(d => ({
            id: d.id,
            crop_name: d.crop_name,
            quantity_kg: d.quantity_kg,
            // deals don't have price_per_kg; leave undefined
            price_per_kg: d.price_per_kg || 0,
            image_url: d.image_url,
            // use buyer_name as the uploader/seller name for display
            _farmer_name: d.buyer_name || d.buyer || '',
            _farmer_phone: d.buyer_phone || '' ,
            created_at: d.created_at
          }));
          const synthetic = [{ id: '_all_deals', name: 'Deals', phone: '', crop_samples: mapped }];
          setResults(synthetic);
          // store raw deals for deriving dropdowns
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

  const handleShowAll = () => {
    setActiveCropFilter('');
    setResults(null);
    setError(null);
    setLoading(true);
    const base = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
    const listUrl = `${base}/deals/list`;
    fetch(listUrl).then(r => r.json()).then(j => {
      setLoading(false);
      if (j && j.ok && Array.isArray(j.deals)) {
        // map deals -> crop_samples shape so renderer can be reused
        const mapped = j.deals.map(d => ({ id: d.id, crop_name: d.crop_name, quantity_kg: d.quantity_kg, price_per_kg: d.price_per_kg || 0, image_url: d.image_url, _farmer_name: d.buyer_name || '', _farmer_phone: d.buyer_phone || '', created_at: d.created_at }));
        const synthetic = [{ id: '_all_deals', name: 'Deals', phone: '', crop_samples: mapped }];
        setResults(synthetic);
      } else {
        setError('Failed to fetch listings');
      }
    }).catch(e => { setLoading(false); setError('Fetch failed'); });
  };

  React.useEffect(() => {
    // load deals initially so dropdowns can be derived from them
    (async () => {
      try {
        const base = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
        const res = await fetch(`${base}/deals/list`);
        if (!res || !res.ok) return;
        const j = await res.json().catch(() => null);
        if (!j || !j.ok || !Array.isArray(j.deals)) return;
        setDealsSource(j.deals || []);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Recompute dropdown options when dealsSource or parent selections change.
  React.useEffect(() => {
    const regionSet = new Set();
    const stateSet = new Set();
    const cropSet = new Set();
    const regionArr = [];
    const stateArr = [];
    const cropArr = [];

    (dealsSource || []).forEach(d => {
      try {
        const r = (d.region || '').toString().trim();
        const s = (d.state || '').toString().trim();
        const c = (d.crop_name || '').toString().trim();
        if (r && !regionSet.has(r)) { regionSet.add(r); regionArr.push(r); }
        // include state only if it belongs to the selected region (or no region selected)
        if ((!region || r === region) && s && !stateSet.has(s)) { stateSet.add(s); stateArr.push(s); }
        // include crop only if it belongs to selected region+state (or parent not selected)
        if ((!region || r === region) && (!state || s === state) && c && !cropSet.has(c)) { cropSet.add(c); cropArr.push(c); }
      } catch (e) {
        // ignore
      }
    });

    setRegionOptions(regionArr);
    setStateOptions(stateArr);
    setCropOptions(cropArr);
  }, [dealsSource, region, state]);

  return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem 1rem 6rem 1rem'}}>
      <div style={{background:'#fff', padding:'1rem 3rem', borderRadius:8, boxShadow:'0 6px 12px rgba(0,0,0,0.06)', width:'100%', maxWidth:1000, marginTop: '1.5rem'}}>
        <h3 style={{marginTop:0, color:'#236902', textAlign:'center', fontSize:22, lineHeight:1.2, paddingBottom:8}}>Find Buyers</h3>
        <div style={{display:'flex', gap:6, alignItems:'flex-start', flexWrap:'wrap'}}>
          <div style={{flex:'1 1 160px', minWidth:120}}>
            <label style={{display:'block', marginBottom:2, fontWeight:700, fontSize:14}}>Region</label>
            {regionOptions && regionOptions.length ? (
              <select value={region} onChange={e => setRegion(e.target.value)} style={{width:'100%', padding:6}}>
                <option value=''>-- Select region --</option>
                {regionOptions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            ) : (
              <select value={region} onChange={e => setRegion(e.target.value)} style={{width:'100%', padding:6}}>
                <option value=''>-- Select region --</option>
                <option value='North'>North</option>
                <option value='South'>South</option>
                <option value='East'>East</option>
                <option value='West'>West</option>
              </select>
            )}
          </div>
          <div style={{flex:'1 1 220px', minWidth:120}}>
            <label style={{display:'block', marginBottom:2, fontWeight:700, fontSize:14}}>State</label>
            {stateOptions && stateOptions.length ? (
              <select value={state} onChange={e => setState(e.target.value)} style={{width:'100%', padding:6}}>
                <option value=''>-- Select State --</option>
                {stateOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <input value={state} onChange={e => setState(e.target.value)} placeholder='Enter state name' style={{width:'100%', padding:6}} />
            )}
          </div>
          <div style={{flex:'1 1 180px', minWidth:110}}>
            <label style={{display:'block', marginBottom:2, fontWeight:700, fontSize:14}}>Crop Name</label>
            {cropOptions && cropOptions.length ? (
              <select value={crop} onChange={e => setCrop(e.target.value)} style={{width:'100%', padding:6}}>
                <option value=''>-- Select Crop --</option>
                {cropOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <input value={crop} onChange={e => setCrop(e.target.value)} placeholder='e.g., Rice, Maize' style={{width:'100%', padding:6}} />
            )}
          </div>
          {/* Min/Max price filters removed per request */}
        </div>
        <div style={{display:'flex', justifyContent:'center', marginTop:14, gap:10}}>
          {/* Single Search button: repurposed from previous Show all listings button */}
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
            Search
          </button>
        </div>
          <div style={{marginTop:28}}>
          <div style={{textAlign:'center', marginBottom:10}}>
            <h3 style={{margin:0,fontSize:22, lineHeight:1.25, color:'#236902'}}>Buyers</h3>
            {loading && <div style={{color:'#000000ff'}}>Searching...</div>}
            {error && <div style={{color:'crimson'}}>{error}</div>}
          </div>

          {/* Render crop samples as individual cards (flattened from farmer results) */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(4, minmax(240px, 1fr))', gap:16, marginTop:12}}>
            {Array.isArray(results) && results.length ? (
              (() => {
                // Flatten crop samples across farmers into a single array
                // When results come from /my-crops/list we sometimes wrap them into a synthetic farmer
                // named 'All listings'. In that case the real seller/uploader name may exist on the crop
                // object itself (fields like farmer_name, seller_name, _farmer_name, etc). Prefer those
                // before falling back to the enclosing farmer's name to avoid showing "All listings".
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
                if (!crops.length) return <div style={{gridColumn: '1/-1', color:'#000000ff'}}>No recent listings</div>;
                // filter out expired crops, then apply crop name filter (case-insensitive substring)
                const activeTerm = (activeCropFilter || '').toString().trim().toLowerCase();
                const nonExpired = crops.filter(ci => !ci.is_expired);
                // apply crop name filter
                const nameFiltered = activeTerm ? nonExpired.filter(ci => (ci.crop_name || '').toString().toLowerCase().includes(activeTerm)) : nonExpired;
                // no price filters (min/max price inputs removed)
                const filtered = nameFiltered;
                if (!filtered.length) return <div style={{gridColumn: '1/-1', color:'#000000ff'}}>No listings match your crop search</div>;
                return filtered.map(c => (
                  <div key={c.id || (c.crop_name + Math.random())} style={{background:'#fff', borderRadius:8, padding:10, border:'1px solid #eaeaea', boxShadow:'0 6px 18px rgba(0,0,0,0.04)', textAlign:'center'}}>
                    <div style={{width:'100%', height:140, borderRadius:6, overflow:'hidden', background:'#f4f4f4', display:'flex', alignItems:'center', justifyContent:'center'}}>
                      {c.image_url ? <img src={c.image_url} alt={c.crop_name} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <div style={{color:'#999'}}>No image</div>}
                    </div>
                    <div style={{marginTop:8, fontWeight:800, color:'#236902'}}>{c.crop_name}</div>
                    <div style={{display:'flex', justifyContent:'space-between', gap:12, marginTop:6}}>
                      <div style={{fontSize:14, fontWeight:700, color:'#000'}}>{Number(c.quantity_kg || 0).toLocaleString('en-IN')} kg</div>
                      <div style={{fontSize:14, fontWeight:700, color:'#000'}}>₹{Number(c.price_per_kg || 0).toLocaleString('en-IN')} / kg</div>
                    </div>
                    <div style={{marginTop:8, fontSize:12, color:'#000000ff'}}>{c._farmer_name ? `Seller: ${c._farmer_name}` : ''}</div>
                    {/* Location row: address | region | state (single row) */}
                    {(() => {
                      const addr = (c && (c._farmer_address || c.address || c.seller_address)) || '';
                      const region = (c && (c._farmer_region || c.region)) || '';
                      const state = (c && (c._farmer_state || c.state)) || '';
                      const parts = [];
                      if (addr) parts.push(addr);
                      if (region) parts.push(region);
                      if (state) parts.push(state);
                      if (!parts.length) return null;
                      return (<div style={{marginTop:6, fontSize:12, color:'#444', display:'flex', justifyContent:'space-between', gap:8}}>
                        <div style={{flex:1, textAlign:'left', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{parts.join(' | ')}</div>
                      </div>);
                    })()}
                        <div style={{display:'flex', justifyContent:'center', marginTop:10}}>
                          <button
                            onClick={() => {
                              try {
                                const key = 'agriai_cart';
                                const raw = localStorage.getItem(key);
                                let arr = raw ? JSON.parse(raw) : [];
                                // add minimal item (avoid heavy blobs)
                                const seller_addr = (c && (c._farmer_address || c.address || c.seller_address)) || '';
                                const seller_email = (c && (c.seller_email || c.email || c._farmer_email)) || '';
                                const seller_region = (c && (c._farmer_region || c.region || c.seller_region)) || '';
                                const seller_state = (c && (c._farmer_state || c.state || c.seller_state)) || '';
                                const item = { id: c.id, crop_name: c.crop_name, price_per_kg: c.price_per_kg, quantity_kg: c.quantity_kg, image_url: c.image_url, seller_name: c._farmer_name, seller_phone: c._farmer_phone, seller_address: seller_addr, seller_email: seller_email, seller_region: seller_region, seller_state: seller_state, category: c.category || c.cat || '' };
                                // avoid duplicate ids
                                if (!arr.find(x => x && x.id === item.id)) arr.push(item);
                                localStorage.setItem(key, JSON.stringify(arr));
                              } catch (e) {
                                console.warn('addToCart error', e);
                              }
                              try { setAddAnimId(c.id); setTimeout(() => setAddAnimId(null), 220); } catch(e){}
                              try { navigate('/cart'); } catch (e) {}
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
                            Add to cart
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

export default function BuyerDashboard() {
  return (
    <div className="min-h-screen bg-green-50 text-gray-900">
      <Navbar />
      <main className="homepage-hero">
        <BuyerSearchBox />
      </main>
  {/* Footer and Chatbot are rendered globally via src/index.js */}
    </div>
  );
}
