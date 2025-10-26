import React from 'react';
import Navbar from './Navbar';

const MyDeals = () => {
  const [sellerName, setSellerName] = React.useState(localStorage.getItem('agriai_name') || '');
  const [sellerPhone, setSellerPhone] = React.useState(localStorage.getItem('agriai_phone') || '');
  const [sellerId, setSellerId] = React.useState(localStorage.getItem('agriai_id') || null);
  const [sellerEmail, setSellerEmail] = React.useState(localStorage.getItem('agriai_email') || '');
  const [region, setRegion] = React.useState('');
  const [state, setState] = React.useState('');
  const [cropName, setCropName] = React.useState('');
  const [quantity, setQuantity] = React.useState('');
  const [imageFile, setImageFile] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [saved, setSaved] = React.useState(null);
  const [listings, setListings] = React.useState([]);
  const [editingId, setEditingId] = React.useState(null);
  const [editQuantity, setEditQuantity] = React.useState('');
  const [lastFetchUrl, setLastFetchUrl] = React.useState('');
  const [lastFetchJson, setLastFetchJson] = React.useState(null);

  const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');

  const fetchListings = React.useCallback(() => {
    // Fetch deals from the backend deals table for the logged-in buyer only
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

  // listings are fetched server-side filtered by buyer_id/buyer_phone; show them as-is
  const visibleListings = listings;

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

  // Poll listings periodically to keep UI in sync (every 15s)
  React.useEffect(() => {
    const id = setInterval(() => {
      fetchListings();
    }, 15000);
    return () => clearInterval(id);
  }, [fetchListings]);

  // ref to focus the crop name input for the empty-state CTA
  const cropNameRef = React.useRef(null);

  const startEdit = (l) => {
    setEditingId(l.id);
    setEditQuantity(l.quantity_kg || '');
  };
  const cancelEdit = () => { setEditingId(null); setEditQuantity(''); };
  const saveEdit = async (id) => {
    const sid = sellerId || localStorage.getItem('agriai_id') || '';
    try {
      const body = { quantity_kg: editQuantity };
      if (sid) body.buyer_id = sid;
      const res = await fetch(`${apiBase}/deals/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await res.json();
      if (res.ok && j.ok) {
        setEditingId(null);
        setEditQuantity('');
        fetchListings();
      } else {
        console.error('Failed to save edit', j);
        alert('Failed to update quantity: ' + (j.error || JSON.stringify(j)));
      }
    } catch (e) {
      console.error('saveEdit error', e);
      alert('Failed to update quantity');
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
    try{
      const formData = new FormData();
      formData.append('buyer_name', sellerName);
      formData.append('buyer_phone', sellerPhone);
  if (sellerEmail) formData.append('buyer_email', sellerEmail);
      formData.append('region', region);
      formData.append('state', state);
      formData.append('crop_name', cropName);
      formData.append('quantity_kg', quantity);
      // Price and expiry are intentionally omitted from this form on the My Details page
      if (sellerId) formData.append('buyer_id', sellerId);
      if (imageFile) {
        formData.append('image', imageFile, imageFile.name);
      }

      const res = await fetch(`${apiBase}/deals`, { method: 'POST', body: formData });
      const j = await res.json();
      if (res.ok && j.ok) {
        setSaved({ status: 'success', stored: j.stored || 'unknown' });
        setSellerName(''); setCropName(''); setQuantity(''); setRegion(''); setState('');
        setImageFile(null);
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
                <div style={{fontWeight:700, color:'#000', marginBottom:6, textAlign:'center'}}>Buyer Name</div>
                <input placeholder="Seller name" value={sellerName} readOnly style={{width:'100%',padding:10, background:'#fafafa'}} required />
                
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700, color:'#000', marginBottom:6,textAlign:'center'}}>Buyer Phone</div>
                <input placeholder="Seller phone" value={sellerPhone} readOnly style={{width:'100%',padding:10, background:'#fafafa'}} />
                
              </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700, color:'#000', marginBottom:6,textAlign:'center'}}>Buyer Email</div>
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
            {/* Second row: crop details, quantity and image */}
            <div style={{display:'flex', gap:12, alignItems:'flex-start', flexWrap: 'wrap'}}>
              <div style={{flex:2}}>
                <div style={{fontWeight:700, color:'#000', marginBottom:6,textAlign:'center'}}>Crop name</div>
                <input ref={cropNameRef} placeholder="Crop name" value={cropName} onChange={e=>setCropName(e.target.value)} style={{width:'100%',padding:10}} required />
                <div style={{fontSize:14,color:'#000',marginTop:6}}>Name of the crop (e.g., Wheat, Rice)</div>
              </div>

              <div style={{flex:1}}>
                <div style={{fontWeight:700, color:'#000', marginBottom:6,textAlign:'center'}}>Quantity (kg)</div>
                <input placeholder="Quantity (kg)" type="number" step="0.001" value={quantity} onChange={e=>setQuantity(e.target.value)} style={{width:'100%',padding:10}} required />
                <div style={{fontSize:14,color:'#000',marginTop:6}}>Total available quantity in kilograms</div>
              </div>

              <div style={{flex:'0.6 4 180px', textAlign:'center'}}>
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
        <h2 style={{marginBottom:8, textAlign:'center', color:'#236902' }}>My Deals</h2>
  {visibleListings.length === 0 && (
          <div style={{textAlign:'center'}}>
            <div style={{marginBottom:8}}>No deals yet.</div>
            <button onClick={() => { if (cropNameRef.current) { cropNameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); cropNameRef.current.focus(); } }} style={{padding:'8px 12px', background:'#236902', color:'#fff', border:'none', borderRadius:6, cursor:'pointer'}}>Upload a deal</button>
          </div>
        )}

        {visibleListings.length > 0 && (
          <div style={{display:'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap:12}}>
            {visibleListings.map(l => (
              <div key={l.id} style={{background:'#fff', borderRadius:8, padding:'12px 12px 1px', border:'1px solid #eaeaea', boxShadow:'0 6px 18px rgba(0,0,0,0.06)', height:340, display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
                <div style={{width:'100%', height:160, borderRadius:8, overflow:'hidden', background:'#f6f6f6', display:'flex', alignItems:'center', justifyContent:'center'}}>
                  {l.image_url ? (
                    <img src={l.image_url} alt={l.crop_name} style={{width:'100%', height:'100%', objectFit:'cover', display:'block'}} />
                  ) : (
                    <div style={{color:'#999'}}>No image</div>
                  )}
                </div>

                <div style={{marginTop:10, display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8}}>
                  <div>
                    <h3 style={{margin:0, color:'#236902', fontSize:18,textAlign:'center'}}>{l.crop_name}</h3>
                    <div style={{marginTop:4, color:'#444', fontSize:13}}>{l.subtitle || ''}</div>
                  </div>
                </div>

                <div style={{display:'flex', gap:8, marginTop:10, flexWrap:'wrap'}}>
                  <div style={{padding:6, background:'#f3f3f3', borderRadius:6, minWidth:110, flex:'1 1 120px'}}>
                    <div style={{fontSize:12, color:'#000000ff'}}>Quantity</div>
                    {editingId === l.id ? (
                      <div style={{display:'flex', gap:6, alignItems:'center'}}>
                        <input value={editQuantity} onChange={e=>setEditQuantity(e.target.value)} style={{width:120,padding:6}} />
                        <button onClick={() => saveEdit(l.id)} style={{padding:'6px 8px', background:'#236902', color:'#fff', border:'none', borderRadius:6}}>Save</button>
                        <button onClick={cancelEdit} style={{padding:'6px 8px', background:'#ddd', border:'none', borderRadius:6}}>Cancel</button>
                      </div>
                    ) : (
                      <div style={{fontWeight:700}}>{Number(l.quantity_kg || 0).toLocaleString('en-IN')} kg</div>
                    )}
                  </div>
                  <div style={{padding:6, background:'#f3f3f3', borderRadius:6, minWidth:140, flex:'1 1 160px'}}>
                    <div style={{fontSize:12, color:'#000000ff'}}>Uploaded</div>
                    <div style={{fontWeight:700}}>{formatDate(l.created_at || l.createdAt || l.created)}</div>
                  </div>
                </div>

                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8, marginBottom:8}}>
                  <div>
                    {l.is_expired ? (
                      <div style={{background:'#f44336', color:'#fff', padding:'6px 8px', borderRadius:6, fontWeight:700}}>Expired</div>
                    ) : (
                      <div style={{color:'#236902', fontWeight:700}}>{l.expiry_date ? `Expires: ${l.expiry_date}` : ''}</div>
                    )}
                  </div>

                  <div style={{display:'flex', gap:120}}>
                    {editingId !== l.id && (
                      <button onClick={() => startEdit(l)} style={{padding:'5px 7px', background:'#1976d2', color:'#fff', border:'none', borderRadius:6}}>Edit</button>
                    )}
                    <button onClick={() => deleteDeal(l.id)} style={{padding:'5px 7px', background:'#e53935', color:'#fff', border:'none', borderRadius:6}}>Delete</button>
                  </div>
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
