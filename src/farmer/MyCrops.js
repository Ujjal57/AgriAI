import React from 'react';
import Navbar from '../Navbar';
import { t } from '../i18n';

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
  const [variety, setVariety] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [saved, setSaved] = React.useState(null);
  const [listings, setListings] = React.useState([]);
  const [lastFetchUrl, setLastFetchUrl] = React.useState('');
  const [lastFetchJson, setLastFetchJson] = React.useState(null);

  const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');

  const [siteLang, setSiteLang] = React.useState((typeof window !== 'undefined' && localStorage.getItem('agri_lang')) || 'en');
  React.useEffect(() => {
    const onLang = () => setSiteLang((localStorage.getItem('agri_lang') || 'en'));
    try { window.addEventListener && window.addEventListener('agri:lang:change', onLang); } catch(e){}
    return () => { try { window.removeEventListener && window.removeEventListener('agri:lang:change', onLang); } catch(e){} };
  }, []);

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
        try { setLastFetchJson(JSON.stringify(j, null, 2)); } catch (e) { setLastFetchJson(String(j)); }
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
    if (!window.confirm(t('confirmDelete', siteLang) || 'Are you sure you want to delete this listing? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${apiBase}/my-crops/${id}`, { method: 'DELETE' });
      const j = await res.json();
      if (res.ok && j.ok) {
        fetchListings();
      } else {
        alert((t('failedDelete', siteLang) || 'Delete failed') + ': ' + (j.error || JSON.stringify(j)));
      }
    } catch (e) {
      alert((t('failedDelete', siteLang) || 'Delete error') + ': ' + e);
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
        setEditError(t('editQtyIncreaseError', siteLang) || 'You cannot increase the quantity. Enter an equal or smaller value.');
        return;
      }
      const payload = {};
      if (priceVal != null) payload.price_per_kg = priceVal;
      if (editPhone != null) payload.seller_phone = editPhone;
      if (qtyVal != null) payload.quantity_kg = qtyVal;

      if (!Object.keys(payload).length) {
        setEditError(t('noChangesToSubmit', siteLang) || 'No changes to submit');
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
      setSaved({ status: 'error', message: t('attachImageError', siteLang) || 'Please attach an image for the crop.' });
      setLoading(false);
      return;
    }
    if (!expiryDate) {
      setSaved({ status: 'error', message: t('selectExpiryError', siteLang) || 'Please select an expiry date.' });
      setLoading(false);
      return;
    }
    if (!category) {
      setSaved({ status: 'error', message: t('selectCategoryError', siteLang) || 'Please select a crop category.' });
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
      if (variety) formData.append('variety', variety);
      formData.append('quantity_kg', quantity);
      formData.append('price_per_kg', price);
      if (expiryDate) formData.append('expiry_date', expiryDate);
      if (sellerId) formData.append('seller_id', sellerId);
      if (imageFile) {
        formData.append('image', imageFile, imageFile.name);
      }
      // include selected site language so backend can send localized emails
      try { formData.append('lang', siteLang || 'en'); } catch (e) {}

      const res = await fetch(`${apiBase}/my-crops`, { method: 'POST', body: formData });
      const j = await res.json();
      if (res.ok && j.ok) {
        setSaved({ status: 'success', stored: j.stored || 'unknown' });
        setSellerName(''); setCropName(''); setVariety(''); setQuantity(''); setPrice(''); setRegion(''); setState('');
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
        <div style={{maxWidth:1000,margin:'0 auto',background:'#fff',padding:'0.5rem 4rem 2rem',boxShadow:'0 8px 24px rgba(0,0,0,0.06)'}}>
          <h1 style={{color:'#236902', textAlign:'center', marginBottom:30}}>{t('myCropsAddTitle', siteLang)}</h1>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>

  {/* --- First Row: Crop Details --- */}
  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>

    {/* Crop Name */}
    <div style={{ flex: 2, minWidth: 220 }}>
      <div style={{ fontWeight: 700, color: '#000', marginBottom: 6, textAlign: 'center' }}>{t('formCropNameLabel', siteLang)}</div>
      <input
        placeholder={t('placeholderCropExample', siteLang)}
        value={cropName}
        onChange={e => setCropName(e.target.value)}
        style={{ width: '100%', padding: 10 }}
        required
      />
      <div style={{ fontSize: 14, color: '#000', marginTop: 6 }}>
        {t('cropNameHelper', siteLang)}
      </div>
    </div>

    {/* Variety */}
    <div style={{ flex: 1, minWidth: 180 }}>
      <div style={{ fontWeight: 700, color: '#000', marginBottom: 6, textAlign: 'center' }}>{t('formVarietyLabel', siteLang)}</div>
      <input
        placeholder={t('varietyHelper', siteLang)}
        value={variety}
        onChange={e => setVariety(e.target.value)}
        style={{ width: '100%', padding: 10 }}
      />
      <div style={{ fontSize: 12, color: '#000', marginTop: 6 }}>
        {t('varietyHelper', siteLang)}
      </div>
    </div>

    {/* Category */}
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 700, color: '#000', marginBottom: 6, textAlign: 'center' }}>{t('formCategoryLabel', siteLang)}</div>
      <select
        value={category}
        onChange={e => setCategory(e.target.value)}
        required
        style={{ width: '100%', padding: 10 }}
      >
        <option value="">{t('selectCategoryPlaceholder', siteLang)}</option>
        <option value="Food Crops">{t('catFood', siteLang)}</option>
        <option value="Fruits and Vegetables">{t('catFruits', siteLang)}</option>
        <option value="Masalas">{t('catMasalas', siteLang)}</option>
      </select>
      <div style={{ fontSize: 12, color: '#000', marginTop: 6 }}>
        {t('chooseCategoryText', siteLang)}
      </div>
    </div>

    {/* Quantity */}
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 700, color: '#000', marginBottom: 6, textAlign: 'center' }}>{t('formQuantityLabel', siteLang)}</div>
      <input
        placeholder={t('formQuantityLabel', siteLang)}
        type="number"
        step="0.001"
        value={quantity}
        onChange={e => setQuantity(e.target.value)}
        style={{ width: '100%', padding: 10 }}
        required
      />
      <div style={{ fontSize: 14, color: '#000', marginTop: 6 }}>
        {t('quantityHelper', siteLang)}
      </div>
    </div>

    {/* Price */}
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 700, color: '#000', marginBottom: 6, textAlign: 'center' }}>{t('tablePricePerKg', siteLang)}</div>
      <input
        placeholder={t('tablePricePerKg', siteLang)}
        type="number"
        step="0.01"
        value={price}
        onChange={e => setPrice(e.target.value)}
        style={{ width: '100%', padding: 10 }}
        required
      />
      <div style={{ fontSize: 14, color: '#000', marginTop: 6 }}>
        {t('cropNameHelper', siteLang)}
      </div>
    </div>

  </div>

  {/* --- Second Row: Image Upload + Expiry Date --- */}
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    gap: 24,
    marginTop: 12,
    alignItems: 'flex-start',
    flexWrap: 'wrap'
  }}>
    {/* Image Upload */}
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontWeight: 700, color: '#000', marginBottom: 6 }}>{t('formImageLabel', siteLang)}</div>
      <div style={{
        padding: 6,
        border: '1px dashed #ddd',
        borderRadius: 6,
        background: '#fafafa',
        display: 'inline-block'
      }}>
        <input
          required
          type="file"
          accept="image/*"
          onChange={e => setImageFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
        />
      </div>
      <div style={{ fontSize: 12, color: '#000', marginTop: 6 }}>
        {t('formAttachPhoto', siteLang)}
      </div>
    </div>

    {/* Expiry Date */}
    <div style={{ width: 140, textAlign: 'center' }}>
      <div style={{ fontWeight: 700, color: '#000', marginBottom: 6 }}>{t('formExpiryDateLabel', siteLang)}</div>
      <input
        type="date"
        value={expiryDate}
        onChange={e => setExpiryDate(e.target.value)}
        style={{ width: '100%', padding: 8, textAlign: 'center' }}
        required
      />
      <div style={{ fontSize: 12, color: '#000', marginTop: 6 }}>
        {t('noExpiryDateLabel', siteLang)}
      </div>
    </div>
  </div>

  {/* --- Submit Button --- */}
  <div style={{ display: 'flex', justifyContent: 'center' }}>
    <button
      type="submit"
      onMouseDown={e => e.currentTarget.style.transform = 'translateY(2px) scale(0.995)'}
      onMouseUp={e => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
      style={{
        padding: '0.8rem 1.6rem',
        background: '#236902',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        transform: loading ? 'scale(0.98)' : 'scale(1)',
        transition: 'transform 120ms ease, box-shadow 120ms ease',
        fontFamily: "'Times New Roman', Times, serif",
        cursor: 'pointer'
      }}
      disabled={loading}
    >
      {loading ? t('uploading', siteLang) : t('uploadButton', siteLang)}
    </button>
  </div>

</form>

          {/* My Crops Section */}
          <section style={{marginTop:15}}>
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
        height: 160px;
        object-fit: cover;
        border-radius: 8px;
        transition: transform 0.4s ease;
      }
      .card-container:hover .card-image {
        transform: scale(1.08);
      }
    `}
  </style>
            
            <h2 style={{marginBottom:8, textAlign:'center', color:'#236902'}}>{t('navMyCrops', siteLang)}</h2>
            {visibleListings.length === 0 && <div style={{textAlign:'center'}}>{t('noDealsYet', siteLang)}</div>}

            {visibleListings.length > 0 && (
              <div style={{display:'grid', gridTemplateColumns:'repeat(4, minmax(240px, 1fr))', gap:16}}>
                {visibleListings.map(l => (
                  <div key={l.id} className="card-container" style={{background:'#fff', borderRadius:8, padding:'12px 12px 1px', border:'1px solid #eaeaea', minHeight:340, display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
                    <div style={{width:'100%', height:160, borderRadius:8, overflow:'hidden', background:'#f6f6f6', display:'flex', alignItems:'center', justifyContent:'center'}}>
                      {(() => {
                        const imageSrc = l.image_url || (l.image_path ? (apiBase.replace(/\/$/, '') + '/images/' + l.image_path) : null);
                        return imageSrc ? <img src={imageSrc} alt={l.crop_name} className="card-image" /> : <div style={{color:'#999'}}>{t('noImage', siteLang)}</div>;
                      })()}
                    </div>

                    <div style={{marginTop:10, display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                      <div>
                        <h3 style={{margin:0, color:'#236902', fontSize:18}}>{l.crop_name}</h3>
                        {l.variety && <div style={{fontSize:14, color:'#000', marginTop:2}}>{l.variety}</div>}
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontWeight:800, fontSize:16}}>₹{Number(l.price_per_kg || 0).toLocaleString('en-IN')}</div>
                        <div style={{fontSize:12, color:'#000'}}>{t('tablePricePerKg', siteLang)}</div>
                      </div>
                    </div>

                    <div style={{display:'flex', gap:8, marginTop:10, flexWrap:'wrap'}}>
                      <div style={{padding:6, background:'#f3f3f3', borderRadius:6, flex:'1 1 120px'}}>
                        <div style={{fontSize:12, color:'#000'}}>{t('cardQuantityLabel', siteLang)}</div>
                        <div style={{fontWeight:700}}>{Number(l.quantity_kg || 0).toLocaleString('en-IN')} kg</div>
                      </div>
                      <div style={{padding:6, background:'#f3f3f3', borderRadius:6, flex:'1 1 160px'}}>
                        <div style={{fontSize:12, color:'#000'}}>{t('cardUploadedLabel', siteLang)}</div>
                        <div style={{fontWeight:700}}>{formatDate(l.created_at || l.createdAt || l.created)}</div>
                      </div>
                    </div>

                    <div style={{marginTop:10}}>
                      {(() => {
                        const today = new Date(); today.setHours(0,0,0,0);
                        const dd = l.expiry_date ? new Date(l.expiry_date) : null;
                        const isExpired = dd ? (dd < today) : false;
                        const isToday = dd ? (dd.getFullYear() === today.getFullYear() && dd.getMonth() === today.getMonth() && dd.getDate() === today.getDate()) : false;
                        if (isExpired) return (<div style={{background:'#f72213ff', color:'#fff', padding:'6px 8px', borderRadius:6, fontWeight:700, textAlign:'center'}}>{t('expiredLabel', siteLang)}</div>);
                        if (isToday) return (<div style={{background:'#ffb300', color:'#000', padding:'6px 8px', borderRadius:6, fontWeight:700, textAlign:'center'}}>{t('expiresToday', siteLang)}</div>);
                        return (
                          <div style={{color:'#236902', fontWeight:700, textAlign:'center'}}>
                            {l.expiry_date ? `${t('expiresLabelPrefix', siteLang) || 'Expires'}: ${formatDate(l.expiry_date)}` : <span style={{background:'#eaf6ea', padding:'4px 6px', borderRadius:6}}>{t('noDeliveryDateLabel', siteLang)}</span>}
                          </div>
                        );
                      })()}
                    </div>

                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', margin:'12px 0 8px', gap:8}}>
                      {editingId !== l.id && (
                          <button 
                          onClick={() => startEdit(l)} 
                          style={{
                            flex:1,
                            padding:'8px 12px',
                            background:'#05610aff',
                            color:'#fff',
                            border:'none',
                            borderRadius:8,
                            fontWeight:600,
                            transition:'background 0.3s, transform 0.2s',
                            cursor:'pointer'
                          }}
                          >
                          {t('editButton', siteLang)}
                        </button>
                      )}

                      <button 
                        onClick={() => deleteCrop(l.id)} 
                        style={{
                          flex:1,
                          padding:'8px 12px',
                          background:'#d32f2f',
                          color:'#fff',
                          border:'none',
                          borderRadius:8,
                          fontWeight:600,
                          transition:'background 0.3s, transform 0.2s',
                          cursor:'pointer'
                        }}
                        onMouseEnter={e => e.target.style.background='#c50c0cff'}
                      >
                        {t('deleteButton', siteLang)}
                      </button>
                    </div>

                    {editingId === l.id && (
                      <div style={{marginTop:12, padding:12, border:'1px solid #eee', borderRadius:8, background:'#fafafa'}}>
                        <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
                          <div style={{flex:'1 1 180px', minWidth:180}}>
                                <label style={{fontSize:12}}>{t('tablePricePerKg', siteLang)}</label>
                            <input type="number" step="0.01" value={editPrice} onChange={e => setEditPrice(e.target.value)} style={{width:'100%', padding:8}} />
                          </div>
                          <div style={{flex:'0 0 140px', minWidth:120}}>
                                <label style={{fontSize:12}}>{t('formQuantityLabel', siteLang)} — max {Number(l.quantity_kg || 0)}</label>
                            <input type="number" step="0.001" value={editQuantity} onChange={e => setEditQuantity(e.target.value)} style={{width:'100%', padding:8}} />
                          </div>
                        </div>
                        {editError && <div style={{color:'#d32f2f', marginTop:8}}>{editError}</div>}
                        <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginTop:12}}>
                          <button onClick={() => submitEdit(l.id, l.quantity_kg)} style={{background:'#1976d2', color:'#fff', border:'none', padding:'8px 12px', borderRadius:6}}>{t('saveButton', siteLang)}</button>
                          <button onClick={cancelEdit} style={{background:'#eee', border:'none', padding:'8px 12px', borderRadius:6}}>{t('cancelButton', siteLang)}</button>
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
