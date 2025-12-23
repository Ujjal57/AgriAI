import React from 'react';
import Navbar from './Navbar';

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
        if (j && j.ok) setListings(j.deals || []);
        else setListings([]);
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

  React.useEffect(() => {
    const id = setInterval(() => {
      fetchListings();
    }, 15000);
    return () => clearInterval(id);
  }, [fetchListings]);

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
        alert('Failed to update: ' + (j.error || JSON.stringify(j)));
      }
    } catch (e) {
      console.error('saveEdit error', e);
      alert('Failed to update');
    }
  };

  const deleteDeal = async (id) => {
    if (!window.confirm('Delete this deal? This action cannot be undone.')) return;
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
        alert('Failed to delete: ' + (j.error || JSON.stringify(j)));
      }
    } catch (e) {
      console.error('deleteDeal error', e);
      alert('Delete failed: ' + String(e));
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
      setSaved({ status: 'error', message: 'Please attach an image for the crop.' });
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
    <div>
      <Navbar />
      <main style={{padding: '6rem 1rem 2rem', background: '#53b635'}}>
        <div style={{maxWidth:1200,margin:'0 auto',background:'#fff',padding:'2rem',borderRadius:8,boxShadow:'0 8px 24px rgba(0,0,0,0.06)'}}>
          
          {/* Top Row: Add New Deal */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            flexWrap: 'wrap',
            position: 'relative'
          }}>
            <h2 style={{
              color: '#236902',
              margin: 0,
              textAlign: 'center',
              flex: '1 1 100%',
              fontSize: '2rem'
            }}>
              Add New Deal
            </h2>

            <div style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)'
            }}>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search crop name"
                style={{ padding: 8, border: '1px solid #e5e5e5', borderRadius: 6 }}
              />
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                style={{ padding: 8, border: '1px solid #e5e5e5', borderRadius: 6 }}
              >
                <option value="recent">Most recent</option>
                <option value="qty_desc">Quantity: High to Low</option>
                <option value="qty_asc">Quantity: Low to High</option>
              </select>
            </div>
          </div>

          <div style={{height:8}} />

          {/* Form Section */}
          <form onSubmit={handleSubmit} style={{display:'grid', gap:12}}>
            {/* Crop details row */}
            <div style={{display:'flex', gap:12, alignItems:'flex-start', flexWrap: 'wrap'}}>
              <div style={{flex:'0 0 220px'}}>
                <div style={{fontWeight:700, color:'#000', marginBottom:6, textAlign:'center'}}>Category</div>
                <select value={category} onChange={e=>setCategory(e.target.value)} style={{width:'100%', padding:10}}>
                  <option value=''>-- Select Category --</option>
                  <option value='Food Crops'>Food Crops</option>
                  <option value='Fruits and Vegetables'>Fruits and Vegetables</option>
                  <option value='Masalas'>Masalas</option>
                </select>
                <div style={{fontSize:12,color:'#000',marginTop:6}}>Choose category</div>
              </div>

              <div style={{flex:2}}>
                <div style={{fontWeight:700, color:'#000', marginBottom:6,textAlign:'center'}}>Crop name</div>
                <input ref={cropNameRef} placeholder="Crop name" value={cropName} onChange={e=>setCropName(e.target.value)} style={{width:'100%',padding:10}} required />
                <div style={{fontSize:14,color:'#000',marginTop:6}}>Name of the crop (e.g., Wheat, Rice)</div>
              </div>

              <div style={{flex:'0 0 220px'}}>
                <div style={{fontWeight:700, color:'#000', marginBottom:6, textAlign:'center'}}>Variety</div>
                <input placeholder="Variety name" value={variety} onChange={e=>setVariety(e.target.value)} style={{width:'100%',padding:10}} />
                <div style={{fontSize:12,color:'#000',marginTop:6}}>Variety or cultivar name</div>
              </div>

              <div style={{flex:1}}>
                <div style={{fontWeight:700, color:'#000', marginBottom:6,textAlign:'center'}}>Quantity (kg)</div>
                <input placeholder="Quantity (kg)" type="number" step="0.001" value={quantity} onChange={e=>setQuantity(e.target.value)} style={{width:'100%',padding:10}} required />
                <div style={{fontSize:14,color:'#000',marginTop:6}}>Total available quantity in kilograms</div>
              </div>

              <div style={{flex:'0 0 220px'}}>
                <div style={{fontWeight:700, color:'#000', marginBottom:6, textAlign:'center'}}>Delivery Date</div>
                <input type="date" min={todayStr} value={deliveryDate} onChange={e=>setDeliveryDate(e.target.value)} style={{width:'100%', padding:10}} />
                <div style={{fontSize:12, color:'#000', marginTop:6, textAlign:'center'}}>Expected delivery</div>
              </div>
            </div>

            <div style={{display:'flex', justifyContent:'center', marginTop:8}}>
              <div style={{flex:'0.6 4 220px', textAlign:'center'}}>
                <div style={{fontWeight:700, color:'#000', marginBottom:6}}>Image</div>
                <div style={{padding:6, border:'1px dashed #ddd', borderRadius:6, background:'#fafafa', display:'inline-block'}}>
                  <input required type="file" accept="image/*" onChange={e=> setImageFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)} />
                </div>
                <div style={{fontSize:12, color:'#000', marginTop:6}}>Attach a photo</div>
              </div>
            </div>

            <div style={{display:'flex', justifyContent:'center'}}>
              <button
                type="submit"
                style={{
                  padding:'0.8rem 1.6rem',
                  background:'#236902',
                  color:'#fff',
                  border:'none',
                  borderRadius:6,
                  transform: loading ? 'scale(0.98)' : 'scale(1)',
                  transition:'transform 120ms ease, box-shadow 120ms ease',
                  fontFamily: "'Times New Roman', Times, serif",
                  cursor: 'pointer'
                }}
                disabled={loading}
              >
                {loading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </form>

          {/* Crop Cards */}
          <section style={{marginTop:18}}>
            {visibleListings.length === 0 && (
              <div style={{textAlign:'center'}}>
                <div style={{marginBottom:8}}>No deals yet.</div>
              </div>
            )}

            {visibleListings.length > 0 && (
              <div style={{display:'grid', gridTemplateColumns: 'repeat(4, minmax(240px, 1fr))', gap:16}}>
                {visibleListings.map(l => (
                  <div 
                    key={l.id}
                    style={{
                      background:'#fff',
                      borderRadius:8,
                      padding:'12px 12px 1px',
                      border:'1px solid #eaeaea',
                      boxShadow:'0 6px 18px rgba(0,0,0,0.06)',
                      minHeight:340,
                      display:'flex',
                      flexDirection:'column',
                      justifyContent:'space-between',
                      transition:'transform 0.3s ease, box-shadow 0.3s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-5px) scale(1.03)';
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.06)';
                    }}
                  >
                    <div 
                      style={{
                        width:'100%',
                        height:160,
                        borderRadius:8,
                        overflow:'hidden',
                        background:'#f6f6f6',
                        display:'flex',
                        alignItems:'center',
                        justifyContent:'center',
                        transition:'transform 0.4s ease',
                      }}
                    >
                      {l.image_url ? (
                        <img 
                          src={l.image_url} 
                          alt={l.crop_name} 
                          style={{
                            width:'100%',
                            height:'100%',
                            objectFit:'cover',
                            display:'block',
                            transition:'transform 0.4s ease',
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        />
                      ) : (
                        <div style={{color:'#999'}}>No image</div>
                      )}
                    </div>

                    {/* Crop name + Variety side by side */}
                    <div style={{marginTop:10, display:'flex', justifyContent:'space-between', alignItems:'center', gap:8}}>
                      <h3 style={{margin:0, color:'#236902', fontSize:18}}>{l.crop_name}</h3>
                      {l.variety && (
                        <span style={{
                          background:'#eaf6ea',
                          color:'#236902',
                          padding:'4px 8px',
                          borderRadius:6,
                          fontWeight:600,
                          fontSize:15
                        }}>
                          {l.variety}
                        </span>
                      )}
                    </div>

                    <div style={{display:'flex', gap:8, marginTop:10, flexWrap:'wrap'}}>
                      <div style={{padding:6, background:'#f3f3f3', borderRadius:6, minWidth:110, flex:'1 1 120px'}}>
                        <div style={{fontSize:12, color:'#000000ff'}}>Quantity</div>
                        {editingId === l.id ? (
                          <div style={{display:'flex', gap:6, alignItems:'center'}}>
                            <input value={editQuantity} onChange={e=>setEditQuantity(e.target.value)} style={{width:120,padding:6}} />
                          </div>
                        ) : (
                          <div style={{fontWeight:700}}>{Number(l.quantity_kg || 0).toLocaleString('en-IN')} kg</div>
                        )}
                      </div>
                      <div style={{padding:6, background:'#f3f3f3', borderRadius:6, minWidth:160, flex:'1 1 180px'}}>
                        <div style={{fontSize:12, color:'#000000ff'}}>Delivery Date</div>
                        {editingId === l.id ? (
                          <div style={{display:'flex', gap:6, alignItems:'center'}}>
                            <input type="date" min={todayStr} value={editDeliveryDate} onChange={e=>setEditDeliveryDate(e.target.value)} style={{width:150,padding:6}} />
                            <button onClick={() => saveEdit(l.id)} style={{padding:'6px 8px', background:'#236902', color:'#fff', border:'none', borderRadius:6}}>Save</button>
                            <button onClick={cancelEdit} style={{padding:'6px 8px', background:'#ddd', border:'none', borderRadius:6}}>Cancel</button>
                          </div>
                        ) : (
                          <div style={{fontWeight:700}}>{l.delivery_date ? new Date(l.delivery_date).toLocaleDateString('en-GB') : '—'}</div>
                        )}
                      </div>
                      <div style={{padding:6, background:'#f3f3f3', borderRadius:6, minWidth:140, flex:'1 1 160px'}}>
                        <div style={{fontSize:12, color:'#000000ff'}}>Uploaded</div>
                        <div style={{fontWeight:700}}>{formatDate(l.created_at || l.createdAt || l.created)}</div>
                      </div>
                    </div>

                    <div style={{marginTop:8, marginBottom:8, textAlign:'center'}}>
                      {(() => {
                        const today = new Date(); today.setHours(0,0,0,0);
                        const dd = l.delivery_date ? new Date(l.delivery_date) : null;
                        const isExpired = dd ? (dd < today) : false;
                        const isToday = dd ? (dd.getFullYear() === today.getFullYear() && dd.getMonth() === today.getMonth() && dd.getDate() === today.getDate()) : false;
                        if (isExpired) return (<div style={{background:'#f44336', color:'#fff', padding:'6px 8px', borderRadius:6, fontWeight:700}}>Expired</div>);
                        if (isToday) return (<div style={{background:'#ffb300', color:'#000', padding:'6px 8px', borderRadius:6, fontWeight:700}}>Expires today</div>);
                        return (
                          <div style={{color:'#236902', fontWeight:700}}>
                            {l.delivery_date ? `Delivery: ${new Date(l.delivery_date).toLocaleDateString('en-GB')}` : <span style={{background:'#eaf6ea', padding:'4px 6px', borderRadius:6}}>No delivery date</span>}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Buttons */}
                    <div style={{display:'flex', flexDirection:'row', alignItems:'center', gap:8, marginBottom:10}}>
                      {editingId !== l.id && (
                        <button onClick={() => startEdit(l)} style={{padding:'6px 10px', width:'80%', background:'#1976d2', color:'#fff', border:'none', borderRadius:6}}>Edit</button>
                      )}
                      <button onClick={() => deleteDeal(l.id)} style={{padding:'6px 10px', width:'80%', background:'#e53935', color:'#fff', border:'none', borderRadius:6}}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default MyDeals;
