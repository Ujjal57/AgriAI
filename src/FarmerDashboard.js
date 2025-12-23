import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import ImageSlideshow from './ImageSlideshow';
import Chatbot from './Chatbot';

function BuyerSearchBox() {
  const [region, setRegion] = React.useState('');
  const [state, setState] = React.useState('');
  const [stateOptions, setStateOptions] = React.useState([]);
  const [regionOptions, setRegionOptions] = React.useState([]);
  const [cropOptions, setCropOptions] = React.useState([]);
  const [crop, setCrop] = React.useState('');
  const [categoryOptions, setCategoryOptions] = React.useState([]);
  const [category, setCategory] = React.useState('');
  const [varietyOptions, setVarietyOptions] = React.useState([]);
  const [variety, setVariety] = React.useState('');
  const [cropsSource, setCropsSource] = React.useState([]);
  const [minPrice, setMinPrice] = React.useState('');
  const [maxPrice, setMaxPrice] = React.useState('');
  const [results, setResults] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [activeCropFilter, setActiveCropFilter] = React.useState('');
  const [searchAnim, setSearchAnim] = React.useState(false);
  const [addAnimId, setAddAnimId] = React.useState(null);
  const navigate = useNavigate();

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

  const handleShowAll = () => {
    setActiveCropFilter('');
    setResults(null);
    setError(null);
    setLoading(true);
    const base = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
    const listUrl = `${base}/my-crops/list`;
    fetch(listUrl).then(r => r.json()).then(j => {
      setLoading(false);
      if (j && j.ok && Array.isArray(j.crops)) {
        const synthetic = [{ id: '_all_crops', name: 'All listings', phone: '', crop_samples: j.crops }];
        setResults(synthetic);
      } else {
        setError('Failed to fetch listings');
      }
    }).catch(e => { setLoading(false); setError('Fetch failed'); });
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
      <div style={{background:'#fff', padding:'1rem 5rem', borderRadius:8, boxShadow:'0 6px 12px rgba(0,0,0,0.06)', width:'100%', maxWidth:980, marginTop: '1.5rem'}}>
        <h3 style={{marginTop:0, color:'#236902', textAlign:'center', fontSize:26, lineHeight:1.2, paddingBottom:8}}>Find Farmers / Crops</h3>
        <div style={{display:'flex', gap:6, alignItems:'flex-start', flexWrap:'wrap'}}>
          {/* Region, State, Category, Crop, Variety Dropdowns */}
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
            <label style={{display:'block', marginBottom:2, fontWeight:700, fontSize:14}}>Category</label>
            <select value={category} onChange={e => { setCategory(e.target.value); setCrop(''); setVariety(''); }} style={{width:'100%', padding:6}}>
              <option value=''>-- Select Category --</option>
              {categoryOptions && categoryOptions.length ? categoryOptions.map(s => <option key={s} value={s}>{s}</option>) : null}
            </select>
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
          <div style={{flex:'1 1 180px', minWidth:120}}>
            <label style={{display:'block', marginBottom:2, fontWeight:700, fontSize:14}}>Variety</label>
            <select value={variety} onChange={e => setVariety(e.target.value)} style={{width:'100%', padding:6}}>
              <option value=''>-- Select Variety --</option>
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
            Search
          </button>
        </div>

        <div style={{marginTop:28}}>
          <div style={{textAlign:'center', marginBottom:10}}>
            <h3 style={{margin:0,fontSize:25, lineHeight:1.25, color:'#236902'}}>Farmer / Crops</h3>
            {loading && <div style={{color:'#000000ff'}}>Searching...</div>}
            {error && <div style={{color:'crimson'}}>{error}</div>}
          </div>

          <div style={{display:'grid', gridTemplateColumns:'repeat(4, minmax(240px, 1fr))', gap:16, marginTop:12}}>
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
                if (!crops.length) return <div style={{gridColumn: '1/-1', color:'#000000ff'}}>No recent listings</div>;
                const activeTerm = (activeCropFilter || '').toString().trim().toLowerCase();
                const nonExpired = crops.filter(ci => !ci.is_expired);
                const nameFiltered = activeTerm ? nonExpired.filter(ci => (ci.crop_name || '').toString().toLowerCase().includes(activeTerm)) : nonExpired;
                const minP = parseFloat(minPrice);
                const maxP = parseFloat(maxPrice);
                const filtered = nameFiltered.filter(ci => {
                  const p = Number(ci.price_per_kg || 0);
                  if (!Number.isNaN(minP) && p < minP) return false;
                  if (!Number.isNaN(maxP) && p > maxP) return false;
                  return true;
                });
                if (!filtered.length) return <div style={{gridColumn: '1/-1', color:'#000000ff'}}>No listings match your crop search</div>;

                // ✅ Each card now has hover zoom + image zoom
                return filtered.map(c => (
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
                      ) : <div style={{color:'#999'}}>No image</div>}
                    </div>

                    <div style={{marginTop:8, fontWeight:800, color:'#236902', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span>{c.crop_name}</span>
                      <span style={{fontWeight:600, color:'#236902', fontSize:15}}>{c.variety ? c.variety : ''}</span>
                    </div>

                    <div style={{display:'flex', justifyContent:'space-between', gap:12, marginTop:6}}>
                      <div style={{fontSize:14, fontWeight:700, color:'#000'}}>{Number(c.quantity_kg || 0).toLocaleString('en-IN')} kg</div>
                      <div style={{fontSize:14, fontWeight:700, color:'#000'}}>₹{Number(c.price_per_kg || 0).toLocaleString('en-IN')} / kg</div>
                    </div>

                    <div style={{marginTop:8, fontSize:12, color:'#000000ff'}}>{c._farmer_name ? `Farmer: ${c._farmer_name}` : ''}</div>

                    {(() => {
                      const addr = (c && (c._farmer_address || c.address || c.seller_address)) || '';
                      const state = (c && (c._farmer_state || c.state)) || '';
                      const region = (c && (c._farmer_region || c.region)) || '';
                      const parts = [];
                      if (addr) parts.push(addr);
                      if (state) parts.push(state);
                      if (region) parts.push(region);
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
                                items: [ { crop_id: c.id, crop_name: c.crop_name, variety: c.variety || '', quantity_kg: c.quantity_kg || 0, price_per_kg: c.price_per_kg || null, image_path: c.image_url || null } ]
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

export default function FarmerDashboard() {
  const role = (typeof window !== 'undefined' && localStorage.getItem('agriai_role')) ? localStorage.getItem('agriai_role') : '';
  const isBuyer = role === 'buyer';
  const cartKey = role === 'farmer' ? 'agriai_cart_farmer' : 'agriai_cart_buyer';

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
              <h2 className="about-title">About AgriAI</h2>
              <p>
                AgriAI is an AI-driven platform that empowers farmers with smart crop recommendations, price forecasts, and real-time chatbot support. It ensures stable market access through assured contract farming and connects farmers directly with buyers. With multilingual support and access to government schemes, AgriAI promotes sustainable, profitable, and tech-enabled farming in India.
              </p>
            </section>
            <section className="why-choose-agriai">
              <h2 className="why-choose-title">Why Choose AgriAI?</h2>
              <div className="why-choose-cards">
                <div className="why-card">
                  <span className="why-icon" role="img" aria-label="contract">🤝</span>
                  <h3>Assured Contract Farming</h3>
                  <p>Connect directly with reliable buyers through secure digital contracts ensuring stable income.</p>
                </div>
                <div className="why-card">
                  <span className="why-icon" role="img" aria-label="crop">🌾</span>
                  <h3>AI-Based Crop Recommendation</h3>
                  <p>Get smart crop suggestions using AI that analyzes soil, weather, and market demand.</p>
                </div>
                <div className="why-card">
                  <span className="why-icon" role="img" aria-label="price">💰</span>
                  <h3>Price Prediction</h3>
                  <p>Predict future market prices using machine learning for informed selling decisions.</p>
                </div>
                <div className="why-card">
                  <span className="why-icon" role="img" aria-label="chatbot">🧠</span>
                  <h3>AI Chatbot Assistant</h3>
                  <p>Interact with our intelligent chatbot for farming queries, crop advice, and scheme details.</p>
                </div>
                <div className="why-card">
                  <span className="why-icon" role="img" aria-label="government">🏛️</span>
                  <h3>Government Schemes & Loans</h3>
                  <p>Search and access real-time information on government subsidies, loans, and farmer welfare programs.</p>
                </div>
                <div className="why-card">
                  <span className="why-icon" role="img" aria-label="language">🌐</span>
                  <h3>Multilingual Support</h3>
                  <p>Use AgriAI in your preferred language for a personalized and accessible experience.</p>
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
