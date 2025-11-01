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
  const [minPrice, setMinPrice] = React.useState('');
  const [maxPrice, setMaxPrice] = React.useState('');
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
          // wrap crops into a synthetic farmer so existing renderer flattens them
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
        // wrap crops into a synthetic farmer so existing renderer flattens them
        const synthetic = [{ id: '_all_crops', name: 'All listings', phone: '', crop_samples: j.crops }];
        setResults(synthetic);
      } else {
        setError('Failed to fetch listings');
      }
    }).catch(e => { setLoading(false); setError('Fetch failed'); });
  };

  React.useEffect(() => {
    // load state options from backend
    (async () => {
      try {
        const base = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
        const res = await fetch(`${base}/states/list`);
        if (res && res.ok) {
          const j = await res.json();
          if (j && j.ok && Array.isArray(j.states)) setStateOptions(j.states);
        }
      } catch (e) {
        // ignore
      }
    })();
    // load crop name options from backend
    (async () => {
      try {
        const base = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
        const res = await fetch(`${base}/crops/names`);
        if (res && res.ok) {
          const j = await res.json();
          if (j && j.ok && Array.isArray(j.crops)) setCropOptions(j.crops);
        }
      } catch (e) {
        // ignore
      }
    })();
    // load region options from backend (prefer DB values)
    (async () => {
      try {
        const base = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
        const res = await fetch(`${base}/regions/list`);
        if (res && res.ok) {
          const j = await res.json();
          if (j && j.ok && Array.isArray(j.regions)) setRegionOptions(j.regions);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'4.5rem 0rem 2rem 0rem'}}>
      <div style={{background:'#fff', padding:'1rem 5rem', borderRadius:8, boxShadow:'0 6px 12px rgba(0,0,0,0.06)', width:'100%', maxWidth:980, marginTop: '1.5rem'}}>
        <h3 style={{marginTop:0, color:'#236902', textAlign:'center', fontSize:26, lineHeight:1.2, paddingBottom:8}}>Find Farmers / Crops</h3>
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
          <div style={{flex:'0 0 120px', minWidth:100}}>
            <label style={{display:'block', marginBottom:2, fontWeight:700, fontSize:14}}>Min Price (₹)</label>
            <input value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder='Min' style={{width:'100%', padding:6}} />
          </div>
          <div style={{flex:'0 0 120px', minWidth:100}}>
            <label style={{display:'block', marginBottom:2, fontWeight:700, fontSize:14}}>Max Price (₹)</label>
            <input value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder='Max' style={{width:'100%', padding:6}} />
          </div>
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
            <h3 style={{margin:0,fontSize:25, lineHeight:1.25, color:'#236902'}}>Farmer / Crops</h3>
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
                // apply price filters
                const minP = parseFloat(minPrice);
                const maxP = parseFloat(maxPrice);
                const filtered = nameFiltered.filter(ci => {
                  const p = Number(ci.price_per_kg || 0);
                  if (!Number.isNaN(minP) && p < minP) return false;
                  if (!Number.isNaN(maxP) && p > maxP) return false;
                  return true;
                });
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
                    <div style={{marginTop:8, fontSize:12, color:'#000000ff'}}>{c._farmer_name ? `Seller Name: ${c._farmer_name}` : ''}</div>
                    {/* Location row: address | region | state (single row) */}
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
                            onClick={() => {
                              try {
                                const role = (typeof window !== 'undefined' && localStorage.getItem('agriai_role')) || '';
                                const cartKey = role === 'farmer' ? 'agriai_cart_farmer' : 'agriai_cart_buyer';
                                const raw = localStorage.getItem(cartKey);
                                let arr = raw ? JSON.parse(raw) : [];
                                // add minimal item (avoid heavy blobs)
                                const seller_addr = (c && (c._farmer_address || c.address || c.seller_address)) || '';
                                const seller_email = (c && (c.seller_email || c.email || c._farmer_email)) || '';
                                const seller_region = (c && (c._farmer_region || c.region || c.seller_region)) || '';
                                const seller_state = (c && (c._farmer_state || c.state || c.seller_state)) || '';
                                const item = { id: c.id, crop_name: c.crop_name, price_per_kg: c.price_per_kg, quantity_kg: c.quantity_kg, image_url: c.image_url, seller_name: c._farmer_name, seller_phone: c._farmer_phone, seller_address: seller_addr, seller_email: seller_email, seller_region: seller_region, seller_state: seller_state, category: c.category || c.cat || '' };
                                // avoid duplicate ids
                                if (!arr.find(x => x && x.id === item.id)) arr.push(item);
                                localStorage.setItem(cartKey, JSON.stringify(arr));
                              } catch (e) {
                                console.warn('addToCart error', e);
                              }
                              try { setAddAnimId(c.id); setTimeout(() => setAddAnimId(null), 220); } catch(e){}
                              // Redirect based on role
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
        {/* If buyer, show a compact horizontal search box; otherwise show promotional sections */}
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
      {/* Footer is rendered globally via src/index.js/Footer component */}
      <Chatbot />
    </div>
  );
}
