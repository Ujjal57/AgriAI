import React from 'react';
import Navbar from '../Navbar';

const Cart = () => {
  const [items, setItems] = React.useState([]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('agriai_cart');
      const arr = raw ? JSON.parse(raw) : [];
      setItems(Array.isArray(arr) ? arr : []);
    } catch (e) {
      setItems([]);
    }
  }, []);

  const removeItem = (id) => {
    try {
      const raw = localStorage.getItem('agriai_cart');
      let arr = raw ? JSON.parse(raw) : [];
      arr = arr.filter(it => it && it.id !== id);
      localStorage.setItem('agriai_cart', JSON.stringify(arr));
      setItems(arr);
    } catch (e) {
      console.warn(e);
    }
  };

  const total = items.reduce((s, it) => s + (Number(it.price_per_kg || 0) * (Number(it.quantity_kg || 0) || 1)), 0);

  return (
    <div>
      <Navbar />
      <main style={{padding: '6rem 1rem 2rem'}}>
        <div style={{maxWidth:980,margin:'0 auto',background:'#fff',padding:'2rem',borderRadius:8,boxShadow:'0 8px 24px rgba(0,0,0,0.06)'}}>
          <h1 style={{color:'#236902'}}>Cart</h1>
          {items.length === 0 ? (
            <p>Your cart is empty. Add listings from the Farmers/Crops page.</p>
          ) : (
            <div>
              <div style={{display:'grid', gridTemplateColumns:'1fr', gap:12}}>
                {items.map(it => (
                  <div key={it.id} style={{display:'flex', gap:12, alignItems:'center', border:'1px solid #eee', padding:12, borderRadius:8}}>
                    <div style={{width:120, height:80, borderRadius:6, overflow:'hidden', background:'#f4f4f4', display:'flex', alignItems:'center', justifyContent:'center'}}>
                      {it.image_url ? <img src={it.image_url} alt={it.crop_name} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <div style={{color:'#999'}}>No image</div>}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:800, color:'#236902'}}>{it.crop_name}</div>
                      <div style={{fontSize:13, color:'#444'}}>Seller: {it.seller_name || '—'}</div>
                      <div style={{marginTop:6, fontWeight:700}}>₹{Number(it.price_per_kg || 0).toLocaleString('en-IN')} / kg</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontWeight:800}}>Qty: {it.quantity_kg || 1} kg</div>
                      <div style={{marginTop:8}}>
                        <button onClick={() => removeItem(it.id)} style={{background:'#fff', border:'1px solid #d32f2f', color:'#d32f2f', padding:'6px 10px', borderRadius:6}}>Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:16}}>
                <div style={{fontWeight:800}}>Total: ₹{Number(total).toLocaleString('en-IN')}</div>
                <div>
                  <button style={{background:'#236902', color:'#fff', padding:'8px 12px', borderRadius:6, border:'none'}}>Proceed to Checkout</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Cart;
