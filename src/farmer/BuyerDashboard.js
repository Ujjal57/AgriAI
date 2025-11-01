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
          const mapped = j.deals.map(d => ({
            id: d.id,
            crop_name: d.crop_name,
            quantity_kg: d.quantity_kg,
            price_per_kg: d.price_per_kg || 0,
            image_url: d.image_url,
            _farmer_name: d.buyer_name || d.buyer || '',
            _farmer_phone: d.buyer_phone || '' ,
            address: d.address || '',
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
        const mapped = j.deals.map(d => ({ 
          id: d.id, 
          crop_name: d.crop_name, 
          quantity_kg: d.quantity_kg, 
          price_per_kg: d.price_per_kg || 0, 
          image_url: d.image_url, 
          _farmer_name: d.buyer_name || '', 
          _farmer_phone: d.buyer_phone || '', 
          address: d.address || '',
          region: d.region || '',
          state: d.state || '',
          created_at: d.created_at,
          delivery_date: d.delivery_date
        }));
        const synthetic = [{ id: '_all_deals', name: 'Deals', phone: '', crop_samples: mapped }];
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
        const res = await fetch(`${base}/deals/list`);
        if (!res || !res.ok) return;
        const j = await res.json().catch(() => null);
        if (!j || !j.ok || !Array.isArray(j.deals)) return;
        setDealsSource(j.deals || []);
      } catch (e) {}
    })();
  }, []);

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
        if ((!region || r === region) && s && !stateSet.has(s)) { stateSet.add(s); stateArr.push(s); }
        if ((!region || r === region) && (!state || s === state) && c && !cropSet.has(c)) { cropSet.add(c); cropArr.push(c); }
      } catch (e) {}
    });

    // Keep distinct names (case-sensitive) and sort case-sensitively
    setRegionOptions([...regionArr].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'case' })));
    setStateOptions(stateArr);
    setCropOptions(cropArr);
  }, [dealsSource, region, state]);

  return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem 1rem 6rem 1rem'}}>
      <div style={{background:'#fff', padding:'1rem 3rem', borderRadius:8, boxShadow:'0 6px 12px rgba(0,0,0,0.06)', width:'100%', maxWidth:1000, marginTop: '1.5rem'}}>
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
      color: '#236902',
      fontSize: 22,
      lineHeight: 1.2,
      paddingBottom: 8,
      textAlign: 'center',
      width: '100%',
      pointerEvents: 'none'
    }}
  >
    Find Buyers
  </h3>

  {/* Right-Aligned Button */}
  <div style={{ marginLeft: 'auto' }}>
    <button
      onClick={handleShowAll}
      style={{
        background: '#fff',
        border: '1px solid #dfeadf',
        color: '#236902',
        padding: '6px 10px',
        borderRadius: 6,
        cursor: 'pointer'
      }}
    >
      Show All
    </button>
  </div>
</div>

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
            <h3 style={{margin:0,fontSize:22, lineHeight:1.25, color:'#236902'}}>Buyers</h3>
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
                const nonExpired = crops.filter(ci => {
                  if (ci.is_expired) return false;
                  if (ci.delivery_date) {
                    try {
                      const today = new Date(); today.setHours(0,0,0,0);
                      const dd = new Date(ci.delivery_date);
                      return dd >= today;
                    } catch (e) { return true; }
                  }
                  return true;
                });
                const nameFiltered = activeTerm ? nonExpired.filter(ci => (ci.crop_name || '').toString().toLowerCase().includes(activeTerm)) : nonExpired;
                const filtered = nameFiltered;
                if (!filtered.length) return <div style={{gridColumn: '1/-1', color:'#000000ff'}}>No listings match your crop search</div>;
                return filtered.map(c => (
                  <div key={c.id || (c.crop_name + Math.random())} style={{background:'#fff', borderRadius:8, padding:10, border:'1px solid #eaeaea', boxShadow:'0 6px 18px rgba(0,0,0,0.04)', textAlign:'center'}}>
                    <div style={{width:'100%', height:140, borderRadius:6, overflow:'hidden', background:'#f4f4f4', display:'flex', alignItems:'center', justifyContent:'center'}}>
                      {c.image_url ? <img src={c.image_url} alt={c.crop_name} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <div style={{color:'#999'}}>No image</div>}
                    </div>
                    <div style={{marginTop:8, fontWeight:800, fontSize:18, color:'#236902'}}>{c.crop_name}</div>

                    {/* Quantity centered inside the card */}
                    <div style={{marginTop:8, fontSize:15, fontWeight:700, color:'#000', textAlign:'center'}}>
                      {Number(c.quantity_kg || 0).toLocaleString('en-IN')} kg
                    </div>

                    {/* Delivery date display */}
                    {(() => {
                      const dd = c.delivery_date ? new Date(c.delivery_date) : null;
                      const today = new Date(); today.setHours(0,0,0,0);
                      if (!dd) return null;
                      const isToday = dd.getFullYear() === today.getFullYear() && dd.getMonth() === today.getMonth() && dd.getDate() === today.getDate();
                      return (
                        <div style={{marginTop:6, fontSize:12, fontWeight:700, textAlign:'center'}}>
                          {isToday ? 'Expires today' : `Delivery: ${dd.toLocaleDateString('en-GB')}`}
                        </div>
                      );
                    })()}

                    <div style={{marginTop:8, fontSize:12, color:'#000000ff'}}>{c._farmer_name ? `Buyer: ${c._farmer_name}` : ''}</div>

                    {(() => {
                      const addr = (c && (c.address || c._farmer_address || c.seller_address)) || '';
                      const region = (c && (c.region || c._farmer_region)) || '';
                      const state = (c && (c.state || c._farmer_state)) || '';
                      const parts = [];
                      if (addr) parts.push(addr);
                      if (region) parts.push(region);
                      if (state) parts.push(state);
                      if (!parts.length) return null;
                      return (
                        <div style={{marginTop:6, fontSize:12, color:'#000000ff', display:'flex', justifyContent:'space-between', gap:8}}>
                          <div style={{flex:1, textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{parts.join(' | ')}</div>
                        </div>
                      );
                    })()}
                    <div style={{display:'flex', justifyContent:'center', marginTop:10}}>
                      <button
                        onClick={() => {
                          try {
                            const role = (typeof window !== 'undefined' && localStorage.getItem('agriai_role')) || '';
                            const cartKey = role === 'farmer' ? 'agriai_cart_farmer' : 'agriai_cart_buyer';
                            const raw = localStorage.getItem(cartKey);
                            let arr = raw ? JSON.parse(raw) : [];
                            const seller_addr = (c && (c._farmer_address || c.address || c.seller_address)) || '';
                            const seller_email = (c && (c.seller_email || c.email || c._farmer_email)) || '';
                            const seller_region = (c && (c._farmer_region || c.region || c.seller_region)) || '';
                            const seller_state = (c && (c._farmer_state || c.state || c.seller_state)) || '';
                            const item = { id: c.id, crop_name: c.crop_name, price_per_kg: c.price_per_kg, quantity_kg: c.quantity_kg, image_url: c.image_url, seller_name: c._farmer_name, seller_phone: c._farmer_phone, seller_address: seller_addr, seller_email: seller_email, seller_region: seller_region, seller_state: seller_state, category: c.category || c.cat || '', farmer_id: c._farmer_id || c.farmer_id || c.seller_id };
                            if (!arr.find(x => x && x.id === item.id)) arr.push(item);
                            localStorage.setItem(cartKey, JSON.stringify(arr));
                          } catch (e) {
                            console.warn('addToCart error', e);
                          }
                          try { setAddAnimId(c.id); setTimeout(() => setAddAnimId(null), 220); } catch(e){}
                          const role = (typeof window !== 'undefined' && localStorage.getItem('agriai_role')) || '';
                          if (role === 'farmer') {
                            try { navigate('/farmer/cart'); } catch (e) {}
                          } else {
                            try { navigate('/cart'); } catch (e) {}
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

export default function BuyerDashboard() {
  return (
    <div className="min-h-screen bg-green-50 text-gray-900">
      <Navbar />
      <main className="homepage-hero">
        <BuyerSearchBox />
      </main>
      {/* Footer and Chatbot rendered globally */}
    </div>
  );
}
