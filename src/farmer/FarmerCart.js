import React from 'react';
import Navbar from '../Navbar';

const FarmerCart = () => {
  const [items, setItems] = React.useState([]);
  const [editingId, setEditingId] = React.useState(null);
  const [editVal, setEditVal] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('');
  const [paymentError, setPaymentError] = React.useState('');

  const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('agriai_cart_farmer');
      const arr = raw ? JSON.parse(raw) : [];
      const normalized = (Array.isArray(arr) ? arr : []).map(it => {
        try {
          const avail = Number(it.quantity_kg || 0) || 0;
          const order = (it.order_quantity !== undefined && it.order_quantity !== null) ? Number(it.order_quantity) : 0;
          return { ...it, quantity_kg: avail, order_quantity: order };
        } catch (e) { return it; }
      });
      setItems(normalized);
    } catch (e) {
      setItems([]);
    }
  }, []);

  const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  const clearCart = () => {
    try {
      localStorage.setItem('agriai_cart_farmer', JSON.stringify([]));
      setItems([]);
      try { window.dispatchEvent(new Event('agriai:cart:update')); } catch (e) {}
    } catch (e) {}
  };

  const updateQuantity = (id, delta) => {
    try {
      const updated = items.map(it => {
        if (it.id !== id) return it;
        const avail = Number(it.quantity_kg || 0) || 0;
        const current = Number(it.order_quantity || 0) || 0;
        const next = Math.max(0, Math.min(avail, current + delta));
        return { ...it, order_quantity: next };
      });
      localStorage.setItem('agriai_cart_farmer', JSON.stringify(updated));
      setItems(updated);
      try { window.dispatchEvent(new Event('agriai:cart:update')); } catch (e) {}
    } catch (e) {}
  };

  const removeItem = (id) => {
    try {
      const raw = localStorage.getItem('agriai_cart_farmer');
      let arr = raw ? JSON.parse(raw) : [];
      arr = arr.filter(it => it && it.id !== id);
      localStorage.setItem('agriai_cart_farmer', JSON.stringify(arr));
      setItems(arr);
      try { window.dispatchEvent(new Event('agriai:cart:update')); } catch (e) {}
    } catch (e) {
      console.warn(e);
    }
  };

  const startEdit = (it) => {
    setEditingId(it.id);
    setEditVal(String(Number(it.order_quantity || 0)));
  };

  const cancelEdit = () => { setEditingId(null); setEditVal(''); };

  const saveEdit = (id) => {
    try {
      const newVal = parseFloat(editVal);
      if (Number.isNaN(newVal) || newVal <= 0) {
        alert('Please enter a valid order quantity (greater than 0).');
        return;
      }
      const updated = items.map(it => {
        if (it.id === id) {
          const avail = Number(it.quantity_kg || 0) || 0;
          const final = Math.min(newVal, avail);
          return { ...it, order_quantity: final };
        }
        return it;
      });
      localStorage.setItem('agriai_cart_farmer', JSON.stringify(updated));
      setItems(updated);
      setEditingId(null);
      setEditVal('');
      try { window.dispatchEvent(new Event('agriai:cart:update')); } catch (e) {}
    } catch (e) { console.warn(e); }
  };

  const calculateGstAndCommission = (item) => {
    const qty = Number(item.order_quantity || 0);
    const price = Number(item.price_per_kg || 0);
    const total = qty * price;
    const cat = (item.category || item.cat || '').toString().toLowerCase();
    let gstRate = 0;
    let commissionRate = 0;
    if (cat.includes('masala') || cat.includes('masalas')) {
      gstRate = 5; commissionRate = 15;
    } else if (cat.includes('fruit') || cat.includes('vegetable')) {
      gstRate = 0; commissionRate = 12;
    } else if (cat.includes('crop') || cat.includes('crops')) {
      gstRate = 0; commissionRate = 8;
    } else {
      const name = (item.crop_name || '').toString().toLowerCase();
      if (name.includes('masala')) { gstRate = 5; commissionRate = 15; }
      else if (name.includes('fruit') || name.includes('vegetable')) { gstRate = 0; commissionRate = 12; }
      else { gstRate = 0; commissionRate = 8; }
    }
    const gstAmt = (total * gstRate) / 100;
    const commissionAmt = (total * commissionRate) / 100;
    return { gstRate, commissionRate, gstAmt, commissionAmt, lineTotal: total };
  };

  const totals = items.reduce(
    (acc, it) => {
      const { gstAmt, commissionAmt, lineTotal } = calculateGstAndCommission(it);
      acc.subtotal += lineTotal;
      acc.gst += gstAmt;
      acc.commission += commissionAmt;
      return acc;
    },
    { subtotal: 0, gst: 0, commission: 0 }
  );
  const grandTotal = totals.subtotal + totals.gst + totals.commission;
  const totalAvailableQty = items.reduce((s, it) => s + (Number(it.quantity_kg || 0) || 0), 0);
  const totalOrderedQty = items.reduce((s, it) => s + (Number(it.order_quantity || 0) || 0), 0);

  const buyer = {
    name: localStorage.getItem('agriai_name') || '',
    phone: localStorage.getItem('agriai_phone') || '',
    email: localStorage.getItem('agriai_email') || ''
  };

  const handleBuyNow = () => {
    setPaymentError('');
    if (!paymentMethod) {
      setPaymentError('Please select a payment method (Online or Cash on Delivery).');
      return;
    }
    const invalid = items.some(it => !it.order_quantity || Number(it.order_quantity) <= 0);
    if (invalid) {
      alert('Please edit each item and enter the order quantity before proceeding.');
      return;
    }
    try {
      const orderItems = items.map(it => {
        const qty = Number(it.order_quantity || 0);
        const price = Number(it.price_per_kg || 0);
        const lineTotal = qty * price;
        const { gstAmt, commissionAmt } = calculateGstAndCommission(it);
        return {
          id: it.id,
          crop_name: it.crop_name,
          category: it.category || it.cat || '',
          price_per_kg: price,
          order_quantity: qty,
          image_url: it.image_url || '',
          subtotal: lineTotal,
          gst: gstAmt,
          platform_fee: commissionAmt,
          total: lineTotal + gstAmt + commissionAmt
        };
      });

      const summary = orderItems.reduce((acc, it) => {
        acc.subtotal += it.subtotal;
        acc.gst += it.gst;
        acc.platform_fee += it.platform_fee;
        return acc;
      }, { subtotal: 0, gst: 0, platform_fee: 0 });
      const grand_total = summary.subtotal + summary.gst + summary.platform_fee;

      const invoiceId = 'ORD' + Date.now();
      const createdAt = new Date().toISOString();

      const orderRecord = {
        invoice_id: invoiceId,
        created_at: createdAt,
        payment_method: 'contract',
        buyer,
        items: orderItems,
        totals: { ...summary, grand_total }
      };

      try {
        const rawHist = localStorage.getItem('agriai_history_farmer');
        const hist = rawHist ? JSON.parse(rawHist) : [];
        const nextHist = [orderRecord, ...(Array.isArray(hist) ? hist : [])];
        localStorage.setItem('agriai_history_farmer', JSON.stringify(nextHist));
      } catch (e) {}
      // best-effort notify counterparties (reuse same endpoint)
      try {
        fetch(`${apiBase}/notifications/purchase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ buyer, items: orderItems.map(({ id, crop_name, order_quantity }) => ({ id, crop_name, order_quantity })) })
        }).catch(() => {});
      } catch (e) {}
      // clear cart
      localStorage.setItem('agriai_cart_farmer', JSON.stringify([]));
      setItems([]);
      try { window.dispatchEvent(new Event('agriai:cart:update')); } catch (e) {}
      // navigate optionally
      setTimeout(() => { window.location.href = '/farmer/history'; }, 100);
    } catch (e) {
      console.error('FarmerCart checkout failed', e);
      alert('Something went wrong while completing your purchase. Please try again.');
    }
  };

  return (
    <div>
      <Navbar />
      <main style={{ padding: '6rem 1rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', background: '#fff', padding: '1.25rem', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ color: '#236902', margin: 0 }}>My Cart</h1>
            {items.length > 0 && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => window.location.href = '/dashboard/buyer'} style={{ background: '#fff', border: '1px solid #dfeadf', color: '#236902', padding: '6px 10px', borderRadius: 6 }}>Continue Shopping</button>
                <button onClick={clearCart} style={{ background: '#fff', border: '1px solid #f0dede', color: '#d32f2f', padding: '6px 10px', borderRadius: 6 }}>Clear Cart</button>
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <div style={{ fontSize: 52, lineHeight: 1 }}>🧺</div>
              <p style={{ marginTop: 8 }}>Your cart is empty. Add listings from the Market.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 620px', minWidth: 320 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                  {items.map(it => {
                    const { gstRate, commissionRate, gstAmt, commissionAmt, lineTotal } = calculateGstAndCommission(it);
                    return (
                      <div key={it.id} style={{ display: 'flex', gap: 12, alignItems: 'center', border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
                        <div style={{ width: 120, height: 80, borderRadius: 6, overflow: 'hidden', background: '#f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {it.image_url ? (
                            <img src={it.image_url} alt={it.crop_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ color: '#999' }}>No image</div>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <div style={{ fontWeight: 800, color: '#236902' }}>{it.crop_name}</div>
                            {(it.category || it.cat) && (
                              <div style={{ background: '#eaf6ea', color: '#236902', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{it.category || it.cat}</div>
                            )}
                          </div>
                          <div style={{ marginTop: 6, fontWeight: 700 }}>{formatCurrency(it.price_per_kg)} / kg</div>
                          <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ fontSize: 13, color: '#555' }}>GST: {gstRate}% ({formatCurrency(gstAmt)})</div>
                            <div style={{ fontSize: 13, color: '#555' }}>Platform: {formatCurrency(commissionAmt)}</div>
                            <div style={{ fontSize: 13, color: '#000', fontWeight: 700 }}>Item Total: {formatCurrency(lineTotal + gstAmt + commissionAmt)}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: 220 }}>
                          <div style={{ fontWeight: 700 }}>Available: {Number(it.quantity_kg || 0).toLocaleString('en-IN')} kg</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 6 }}>
                            <button onClick={() => updateQuantity(it.id, -1)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e5e5', background: '#fff' }}>-</button>
                            <div style={{ minWidth: 60, textAlign: 'center', fontWeight: 800 }}>{Number(it.order_quantity || 0).toLocaleString('en-IN')} kg</div>
                            <button onClick={() => updateQuantity(it.id, 1)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e5e5', background: '#fff' }}>+</button>
                          </div>
                          <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            {editingId === it.id ? (
                              <>
                                <input type="number" step="0.001" value={editVal} onChange={e => setEditVal(e.target.value)} style={{ width: 120, padding: 6 }} />
                                <button onClick={() => saveEdit(it.id)} style={{ padding: '6px 8px', background: '#236902', color: '#fff', border: 'none', borderRadius: 6 }}>Save</button>
                                <button onClick={cancelEdit} style={{ padding: '6px 8px', background: '#ddd', border: 'none', borderRadius: 6 }}>Cancel</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEdit(it)} style={{ padding: '6px 8px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6 }}>Edit</button>
                                <button onClick={() => removeItem(it.id)} style={{ background: '#fff', border: '1px solid #d32f2f', color: '#d32f2f', padding: '6px 10px', borderRadius: 6 }}>Remove</button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ flex: '0 0 320px', width: 320, position: 'sticky', top: 88, alignSelf: 'flex-start' }}>
                <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontWeight: 800, color: '#236902', marginBottom: 8 }}>Order Summary</div>
                  <div style={{ display: 'grid', gap: 6, fontWeight: 700 }}>
                    <div>Total items: {items.length}</div>
                    <div>Total available: {Number(totalAvailableQty).toLocaleString('en-IN')} kg</div>
                    <div>Total ordered: {Number(totalOrderedQty).toLocaleString('en-IN')} kg</div>
                    <div>Subtotal: {formatCurrency(totals.subtotal)}</div>
                    <div>GST Total: {formatCurrency(totals.gst)}</div>
                    <div>Platform Fee: {formatCurrency(totals.commission)}</div>
                    <div style={{ fontSize: 18, color: '#236902', marginTop: 6 }}>Grand Total: {formatCurrency(grandTotal)}</div>
                  </div>
                  
                  <button onClick={handleBuyNow} disabled={!items.length} style={{ marginTop: 12, width: '100%', background: '#236902', color: '#fff', padding: '10px 12px', borderRadius: 6, border: 'none' }}>
                    Send Contract
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FarmerCart;
