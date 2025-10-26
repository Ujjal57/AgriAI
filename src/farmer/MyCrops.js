import React from 'react';
import Navbar from '../Navbar';

const MyCrops = () => {
  const [sellerName, setSellerName] = React.useState(localStorage.getItem('agriai_name') || '');
  const [sellerPhone, setSellerPhone] = React.useState(localStorage.getItem('agriai_phone') || '');
  const [sellerId, setSellerId] = React.useState(localStorage.getItem('agriai_id') || null);
  const [sellerEmail, setSellerEmail] = React.useState(localStorage.getItem('agriai_email') || '');
  const [region, setRegion] = React.useState('');
  const [state, setState] = React.useState('');
  const [cropName, setCropName] = React.useState('');
  const [quantity, setQuantity] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [imageFile, setImageFile] = React.useState(null);
  const [expiryDate, setExpiryDate] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [saved, setSaved] = React.useState(null);
  const [listings, setListings] = React.useState([]);
  const [lastFetchUrl, setLastFetchUrl] = React.useState('');
  const [lastFetchJson, setLastFetchJson] = React.useState(null);

  const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');

  const fetchListings = React.useCallback(() => {
    const sid = sellerId || localStorage.getItem('agriai_id') || '';
    const sphone = localStorage.getItem('agriai_phone') || sellerPhone || '';
    let url = `${apiBase}/my-crops/list`;
    if (sid) url += `?seller_id=${encodeURIComponent(sid)}`;
    else if (sphone) url += `?seller_phone=${encodeURIComponent(sphone)}`;
    fetch(url)
      .then(r => r.json())
      .then(j => {
        setLastFetchUrl(url);
        try { setLastFetchJson(JSON.parse(JSON.stringify(j)).crops ? JSON.stringify(j, null, 2) : JSON.stringify(j, null, 2)); } catch (e) { setLastFetchJson(String(j)); }
        if (j && j.ok) setListings(j.crops || []);
        else setListings([]);
      }).catch(e => { console.error('fetchListings error', e); setLastFetchUrl(url); setLastFetchJson(String(e)); setListings([]); });
  }, [apiBase, sellerId, sellerPhone]);

  const loggedPhone = localStorage.getItem('agriai_phone') || '';
  const loggedId = sellerId || localStorage.getItem('agriai_id') || null;
  const visibleListings = listings.filter(l => {
    try {
      if (loggedId && l.seller_id != null && String(l.seller_id) === String(loggedId)) return true;
    } catch (e) {}
    if (loggedPhone && l.seller_phone && String(l.seller_phone) === String(loggedPhone)) return true;
    return false;
  });

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

  const deleteCrop = async (id) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${apiBase}/my-crops/${id}`, { method: 'DELETE' });
      const j = await res.json();
      if (res.ok && j.ok) {
        fetchListings();
      } else {
        alert('Delete failed: ' + (j.error || JSON.stringify(j)));
      }
    } catch (e) {
      alert('Delete error: ' + e);
    }
  };

  const [editingId, setEditingId] = React.useState(null);
  const [editPrice, setEditPrice] = React.useState('');
  const [editPhone, setEditPhone] = React.useState('');
  const [editQuantity, setEditQuantity] = React.useState('');
  const [editError, setEditError] = React.useState(null);

  const startEdit = (l) => {
    setEditingId(l.id);
    setEditPrice(l.price_per_kg || '');
    setEditPhone(l.seller_phone || '');
    setEditQuantity(l.quantity_kg || '');
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError(null);
  };

  const submitEdit = async (id, currentQty) => {
    try {
      const priceVal = editPrice === '' ? null : Number(editPrice);
      const qtyVal = editQuantity === '' ? null : Number(editQuantity);
      if (qtyVal != null && currentQty != null && qtyVal > Number(currentQty)) {
        setEditError('You cannot increase the quantity. Enter an equal or smaller value.');
        return;
      }
      const payload = {};
      if (priceVal != null) payload.price_per_kg = priceVal;
      if (editPhone != null) payload.seller_phone = editPhone;
      if (qtyVal != null) payload.quantity_kg = qtyVal;

      if (!Object.keys(payload).length) {
        setEditError('No changes to submit');
        return;
      }

      const res = await fetch(`${apiBase}/my-crops/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await res.json();
      if (res.ok && j.ok) {
        cancelEdit();
        fetchListings();
      } else {
        setEditError(j.error || JSON.stringify(j));
      }
    } catch (e) {
      setEditError(String(e));
    }
  };

  React.useEffect(() => {
    const email = localStorage.getItem('agriai_email');
    const phone = localStorage.getItem('agriai_phone');
    if (!email && !phone) return;
    const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');
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
    if (!expiryDate) {
      setSaved({ status: 'error', message: 'Please select an expiry date.' });
      setLoading(false);
      return;
    }
    if (!category) {
      setSaved({ status: 'error', message: 'Please select a crop category.' });
      setLoading(false);
      return;
    }
    try{
      const formData = new FormData();
      formData.append('seller_name', sellerName);
      formData.append('seller_phone', sellerPhone);
  if (sellerEmail) formData.append('seller_email', sellerEmail);
      formData.append('region', region);
      formData.append('state', state);
      formData.append('category', category);
      formData.append('crop_name', cropName);
      formData.append('quantity_kg', quantity);
      formData.append('price_per_kg', price);
      if (expiryDate) formData.append('expiry_date', expiryDate);
      if (sellerId) formData.append('seller_id', sellerId);
      if (imageFile) {
        formData.append('image', imageFile, imageFile.name);
      }

      const res = await fetch(`${apiBase}/my-crops`, { method: 'POST', body: formData });
      const j = await res.json();
      if (res.ok && j.ok) {
        setSaved({ status: 'success', stored: j.stored || 'unknown' });
        setSellerName(''); setCropName(''); setQuantity(''); setPrice(''); setRegion(''); setState('');
        setImageFile(null); setExpiryDate('');
        fetchListings();
      } else {
        setSaved({ status: 'error', message: (j.error || JSON.stringify(j)) });
      }
    }catch(err){
      console.error(err);
      setSaved('error');
    }finally{ setLoading(false); }
  };

  return (
    <div>
      <Navbar />
      <main style={{padding: '6rem 1rem 2rem', background: '#53b635'}}>
        <div style={{maxWidth:980,margin:'0 auto',background:'#fff',padding:'2rem',borderRadius:8,boxShadow:'0 8px 24px rgba(0,0,0,0.06)'}}>
          <h1 style={{color:'#236902', textAlign:'center'}}>Add Crops</h1>
          <form onSubmit={handleSubmit} style={{display:'grid', gap:12}}>
            {/* First row: seller details */}
            <div style={{display:'flex', gap:12, alignItems:'flex-start', flexWrap: 'wrap'}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:700, color:'#000', marginBottom:6, textAlign:'center'}}>Seller Name</div>
                <input placeholder="Seller name" value={sellerName} readOnly style={{width:'100%',padding:10, background:'#fafafa'}} required />
                
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700, color:'#000', marginBottom:6,textAlign:'center'}}>Seller Phone</div>
                <input placeholder="Seller phone" value={sellerPhone} readOnly style={{width:'100%',padding:10, background:'#fafafa'}} />
                
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700, color:'#000', marginBottom:6,textAlign:'center'}}>Seller Email</div>
                <input placeholder="Seller email" value={sellerEmail} readOnly style={{width:'100%',padding:10, background:'#fafafa'}} />
              </div>
              <div style={{flex:'0 0 180px'}}>
                <div style={{fontWeight:700, color:'#000', marginBottom:6,textAlign:'center'}}>Region</div>
                <input placeholder="Region" value={region} readOnly style={{width:'100%',padding:10, background:'#fafafa'}} required />
              </div>
              <div style={{flex:'0 0 180px'}}>
                <div style={{fontWeight:700, color:'#000', marginBottom:6,textAlign:'center'}}>State</div>
                <input placeholder="State" value={state} readOnly style={{width:'100%',padding:10, background:'#fafafa'}} required />
                
              </div>
            </div>
            {/* Second row: crop details, quantity, price */}
            <div style={{display:'flex', gap:12, alignItems:'flex-start', flexWrap: 'wrap'}}>
              <div style={{flex:2}}>
                <div style={{fontWeight:700, color:'#000', marginBottom:6,textAlign:'center'}}>Crop Name</div>
                <input placeholder="Crop name" value={cropName} onChange={e=>setCropName(e.target.value)} style={{width:'100%',padding:10}} required />
                <div style={{fontSize:14,color:'#000',marginTop:6}}>Name of the crop (e.g., Wheat, Rice)</div>
              </div>

              <div style={{flex:1}}>
                <div style={{fontWeight:700, color:'#000', marginBottom:6,textAlign:'center'}}>Category</div>
                <select value={category} onChange={e => setCategory(e.target.value)} required style={{width:'100%', padding:10}}>
                  <option value="">-- Select category --</option>
                  <option value="Food Crops">Food Crops</option>
                  <option value="Fruits and Vegetables">Fruits and Vegetables</option>
                  <option value="Masalas">Masalas</option>
                </select>
                <div style={{fontSize:12,color:'#000',marginTop:6}}>Select category (required)</div>
              </div>

              <div style={{flex:1}}>
                <div style={{fontWeight:700, color:'#000', marginBottom:6,textAlign:'center'}}>Quantity (kg)</div>
                <input placeholder="Quantity (kg)" type="number" step="0.001" value={quantity} onChange={e=>setQuantity(e.target.value)} style={{width:'100%',padding:10}} required />
                <div style={{fontSize:14,color:'#000',marginTop:6}}>Total available quantity in kilograms</div>
              </div>

              <div style={{flex:1}}>
                <div style={{fontWeight:700, color:'#000', marginBottom:6,textAlign:'center'}}>Price Per Kg (₹)</div>
                <input placeholder="Price per kg" type="number" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} style={{width:'100%',padding:10}} required />
                <div style={{fontSize:14,color:'#000',marginTop:6}}>Expected price per kilogram (₹)</div>
              </div>
            </div>

            {/* Image and expiry row: image centered below, expiry small and centered beneath it */}
            <div style={{display:'flex', justifyContent:'center', gap:24, marginTop:12, alignItems:'flex-start', flexWrap:'wrap'}}>
              <div style={{textAlign:'center'}}>
                <div style={{fontWeight:700, color:'#000', marginBottom:6}}>Image</div>
                <div style={{padding:6, border:'1px dashed #ddd', borderRadius:6, background:'#fafafa', display:'inline-block'}}>
                  <input required type="file" accept="image/*" onChange={e=> setImageFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)} />
                </div>
                <div style={{fontSize:12, color:'#000', marginTop:6}}>Attach a photo</div>
              </div>

              <div style={{width:140, textAlign:'center'}}>
                <div style={{fontWeight:700, color:'#000', marginBottom:6}}>Expiry date</div>
                <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} style={{width:'100%',padding:8, textAlign:'center'}} required />
                <div style={{fontSize:12, color:'#000', marginTop:6}}>Expiry</div>
              </div>
            </div>

            <div style={{display:'flex', justifyContent:'center'}}>
              <button
                type="submit"
                onMouseDown={e => e.currentTarget.style.transform = 'translateY(2px) scale(0.995)'}
                onMouseUp={e => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
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
      <section style={{marginTop:18}}>
        <h2 style={{marginBottom:8, textAlign:'center', color:'#236902' }}>My Crops</h2>
        {visibleListings.length === 0 && <div style={{textAlign:'center'}}>No listings yet.</div>}

        {visibleListings.length > 0 && (
          <div style={{display:'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap:12}}>
            {visibleListings.map(l => (
              <div key={l.id} style={{background:'#fff', borderRadius:8, padding:12, border:'1px solid #eaeaea', boxShadow:'0 6px 18px rgba(0,0,0,0.06)'}}>
                <div style={{width:'100%', height:140, borderRadius:8, overflow:'hidden', background:'#f6f6f6', display:'flex', alignItems:'center', justifyContent:'center'}}>
                  {l.image_url ? (
                    <img src={l.image_url} alt={l.crop_name} style={{width:'100%', height:'100%', objectFit:'cover', display:'block'}} />
                  ) : (
                    <div style={{color:'#999'}}>No image</div>
                  )}
                </div>

                <div style={{marginTop:10, display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8}}>
                  <div>
                    <div style={{display:'flex', alignItems:'center', gap:8}}>
                      <h3 style={{margin:0, color:'#236902', fontSize:18}}>{l.crop_name}</h3>
                      {l.category ? (
                        <div style={{background:'#eaf6ea', textAlign:'center', color:'#236902', padding:'4px 8px', borderRadius:999, fontSize:12, fontWeight:700, boxShadow:'inset 0 0 0 1px rgba(35,105,2,0.06)'}}>{l.category}</div>
                      ) : null}
                    </div>
                    <div style={{marginTop:4, color:'#444', fontSize:13}}>{l.subtitle || ''}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontWeight:800, fontSize:16}}>₹{Number(l.price_per_kg || 0).toLocaleString('en-IN')}</div>
                    <div style={{fontSize:12, color:'#000000ff'}}>Per Kg</div>
                  </div>
                </div>

                <div style={{display:'flex', gap:8, marginTop:10, flexWrap:'wrap'}}>
                  <div style={{padding:6, background:'#f3f3f3', borderRadius:6, minWidth:110, flex:'1 1 120px'}}>
                    <div style={{fontSize:12, color:'#000000ff'}}>Quantity</div>
                    <div style={{fontWeight:700}}>{Number(l.quantity_kg || 0).toLocaleString('en-IN')} kg</div>
                  </div>
                  <div style={{padding:6, background:'#f3f3f3', borderRadius:6, minWidth:140, flex:'1 1 160px'}}>
                    <div style={{fontSize:12, color:'#000000ff'}}>Uploaded</div>
                    <div style={{fontWeight:700}}>{formatDate(l.created_at || l.createdAt || l.created)}</div>
                  </div>
                </div>

                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10}}>
                  <div>
                    {l.is_expired ? (
                      <div style={{background:'#f44336', color:'#fff', padding:'6px 8px', borderRadius:6, fontWeight:700}}>Expired</div>
                    ) : (
                      <div style={{color:'#236902', fontWeight:700}}>{l.expiry_date ? `Expires: ${l.expiry_date}` : ''}</div>
                    )}
                  </div>

                  <div style={{display:'flex', gap:8, alignItems:'center'}}>
                    <div style={{display:'flex', flexDirection:'column', gap:6}}>
                      <button onClick={() => startEdit(l)} title="Edit listing" style={{background:'#1976d2', color:'#fff', border:'none', padding:'6px 10px', borderRadius:6, cursor:'pointer'}}>Edit</button>
                      <button onClick={() => deleteCrop(l.id)} title="Delete listing" style={{background:'#fff', color:'#d32f2f', border:'1px solid #f0dede', padding:'6px 10px', borderRadius:6, cursor:'pointer'}}>Delete</button>
                    </div>
                  </div>
                </div>

                {editingId === l.id && (
                  <div style={{marginTop:12, padding:12, border:'1px solid #eee', borderRadius:8, background:'#fafafa'}}>
                    <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
                      <div style={{flex:'1 1 180px', minWidth:180}}>
                        <label style={{fontSize:12}}>Price per kg (₹)</label>
                        <input type="number" step="0.01" value={editPrice} onChange={e => setEditPrice(e.target.value)} style={{width:'100%', padding:8}} />
                      
                      </div>
                      
                      <div style={{flex:'0 0 140px', minWidth:120}}>
                        <label style={{fontSize:12}}>Quantity (kg) — max {Number(l.quantity_kg || 0)}</label>
                        <input type="number" step="0.001" value={editQuantity} onChange={e => setEditQuantity(e.target.value)} style={{width:'100%', padding:8}} />
                      </div>
                    </div>
                    {editError && <div style={{color:'#d32f2f', marginTop:8}}>{editError}</div>}
                    <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginTop:12}}>
                      <button onClick={() => submitEdit(l.id, l.quantity_kg)} style={{background:'#1976d2', color:'#fff', border:'none', padding:'8px 12px', borderRadius:6}}>Save</button>
                      <button onClick={cancelEdit} style={{background:'#eee', border:'none', padding:'8px 12px', borderRadius:6}}>Cancel</button>
                    </div>
                  </div>
                )}
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

export default MyCrops;
