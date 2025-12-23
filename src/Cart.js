import React from 'react';
import Navbar from './Navbar';
import logo from './assets/logo192.png'; // ✅ Import logo image

const Cart = () => {
  const [items, setItems] = React.useState([]);
  const [editingId, setEditingId] = React.useState(null);
  const [editVal, setEditVal] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('');
  const [paymentError, setPaymentError] = React.useState('');

  const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');

  // Example seller details (you can fetch from localStorage or API)
  const sellerInfo = {
    name: 'Ujjal Kumar',
    address: '123, Farm Lane',
    state: 'Karnataka',
    region: 'South India'
  };

  React.useEffect(() => {
    // create a reusable loader so we can call it on mount and when cart updates
    const loadCart = async () => {
      try {
        const userRole = localStorage.getItem('agriai_role') || '';
        const userId = localStorage.getItem('agriai_id') || '';
        const userPhone = localStorage.getItem('agriai_phone') || '';
        const cartKey = userRole === 'farmer' ? 'agriai_cart_farmer' : 'agriai_cart_buyer';

        // If user is signed in with role and has id/phone, try server-backed cart
        if (userRole && (userId || userPhone)) {
          try {
            const qp = userId ? `user_type=${encodeURIComponent(userRole)}&user_id=${encodeURIComponent(userId)}` : `user_type=${encodeURIComponent(userRole)}&user_phone=${encodeURIComponent(userPhone)}`;
            const res = await fetch(`${apiBase}/cart/list?${qp}`);
            if (res && res.ok) {
              const j = await res.json().catch(() => null);
              if (j && j.ok && Array.isArray(j.cart)) {
                // Map server rows to client item shape (preserve crop_id in id)
                const mapped = j.cart.map(r => ({
                  id: r.crop_id || r.id,
                  cart_id: r.id,
                  crop_name: r.crop_name || '',
                  quantity_kg: Number(r.quantity_kg || 0),
                  price_per_kg: r.price_per_kg != null ? Number(r.price_per_kg) : 0,
                  image_url: r.image_path || r.image_url || '',
                  order_quantity: 0,
                  variety: r.variety || '',
                  user_type: r.user_type || userRole,
                  user_id: r.user_id || null,
                  user_phone: r.user_phone || null,
                }));
                setItems(mapped);
                try { localStorage.setItem(cartKey, JSON.stringify(mapped)); } catch (e) {}
                return;
              }
            }
          } catch (e) {
            // network error -> fall back to localStorage
            console.warn('Failed to load server cart, falling back to localStorage', e);
          }
        }

        // Fallback: load from localStorage (respect role-specific key)
        try {
          const raw = localStorage.getItem(cartKey);
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
      } catch (e) {
        setItems([]);
      }
    };

    // initial load
    loadCart();

    // Refresh cart when other parts of the app dispatch 'agriai:cart:update'
    const handler = () => { try { loadCart(); } catch (e) { console.warn('cart update handler error', e); } };
    window.addEventListener('agriai:cart:update', handler);

    // cleanup
    return () => {
      try { window.removeEventListener('agriai:cart:update', handler); } catch (e) {}
    };
  }, []);

  const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  const clearCart = () => {
    (async () => {
      const userRole = localStorage.getItem('agriai_role') || '';
      const userId = localStorage.getItem('agriai_id') || '';
      const userPhone = localStorage.getItem('agriai_phone') || '';
      const cartKey = userRole === 'farmer' ? 'agriai_cart_farmer' : 'agriai_cart_buyer';
      if (userRole && (userId || userPhone)) {
        try {
          const payload = { user_type: userRole, user_id: userId || undefined, user_phone: userPhone || undefined };
          const res = await fetch(`${apiBase}/cart/clear`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          if (!res.ok) console.warn('cart/clear failed');
        } catch (e) { console.warn('cart/clear error', e); }
      }
      try { localStorage.setItem(cartKey, JSON.stringify([])); } catch (e) {}
      setItems([]);
      try { window.dispatchEvent(new Event('agriai:cart:update')); } catch (e) {}
    })();
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
      setItems(updated);
      const userRole = localStorage.getItem('agriai_role') || '';
      const userId = localStorage.getItem('agriai_id') || '';
      const userPhone = localStorage.getItem('agriai_phone') || '';
      const cartKey = userRole === 'farmer' ? 'agriai_cart_farmer' : 'agriai_cart_buyer';
      try { localStorage.setItem(cartKey, JSON.stringify(updated)); } catch (e) {}

      // persist change to server if we have cart row id
      const it = updated.find(x => x.id === id);
      if (it && it.cart_id && userRole && (userId || userPhone)) {
        (async () => {
          try {
            const payload = { id: it.cart_id, quantity_kg: it.order_quantity, user_type: userRole, user_id: userId || undefined, user_phone: userPhone || undefined };
            const res = await fetch(`${apiBase}/cart/update`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok) console.warn('cart/update failed');
          } catch (e) { console.warn('cart/update error', e); }
        })();
      }
    } catch (e) { console.warn(e); }
  };

  const removeItem = (id) => {
    (async () => {
      try {
        const userRole = localStorage.getItem('agriai_role') || '';
        const userId = localStorage.getItem('agriai_id') || '';
        const userPhone = localStorage.getItem('agriai_phone') || '';
        const cartKey = userRole === 'farmer' ? 'agriai_cart_farmer' : 'agriai_cart_buyer';
        const it = items.find(x => x.id === id);
        // If server-backed (has cart_id), request deletion
        if (it && it.cart_id && userRole && (userId || userPhone)) {
          try {
            const payload = { ids: [it.cart_id], user_type: userRole, user_id: userId || undefined, user_phone: userPhone || undefined };
            const res = await fetch(`${apiBase}/cart/remove`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok) console.warn('cart/remove failed');
          } catch (e) { console.warn('cart/remove error', e); }
        }
        let arr = items.filter(itm => itm && itm.id !== id);
        try { localStorage.setItem(cartKey, JSON.stringify(arr)); } catch (e) {}
        setItems(arr);
        try { window.dispatchEvent(new Event('agriai:cart:update')); } catch (e) {}
      } catch (e) { console.warn(e); }
    })();
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
      setItems(updated);
      const userRole = localStorage.getItem('agriai_role') || '';
      const userId = localStorage.getItem('agriai_id') || '';
      const userPhone = localStorage.getItem('agriai_phone') || '';
      const cartKey = userRole === 'farmer' ? 'agriai_cart_farmer' : 'agriai_cart_buyer';
      try { localStorage.setItem(cartKey, JSON.stringify(updated)); } catch (e) {}

      const it = updated.find(x => x.id === id);
      if (it && it.cart_id && userRole && (userId || userPhone)) {
        (async () => {
          try {
            const payload = { id: it.cart_id, quantity_kg: it.order_quantity, user_type: userRole, user_id: userId || undefined, user_phone: userPhone || undefined };
            const res = await fetch(`${apiBase}/cart/update`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok) console.warn('cart/update failed');
          } catch (e) { console.warn('cart/update error', e); }
        })();
      }

      setEditingId(null);
      setEditVal('');
    } catch (e) { console.warn(e); }
  };

  // --- GST and Platform Fee Calculation ---
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

  // 🧾 Generate Invoice (with logo)
  const generateBill = () => {
    const invoiceId = 'ORD' + Date.now();
    const date = new Date().toLocaleString();

    // ✅ Embed the imported logo as a data URL (for display in print)
    const logoSrc = window.location.origin + logo;

    let html = `
      <html>
        <head>
          <title>Invoice ${invoiceId}</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 20px; color: #333; }
            h1 { color: #236902; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
            th { background: #f4f4f4; }
            .total { text-align: right; font-weight: bold; padding-right: 10px; }
            .footer { margin-top: 20px; font-size: 14px; color: #555; text-align: center; }
            #printBtn {
              background-color: #236902;
              color: white;
              border: none;
              padding: 8px 12px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 15px;
              margin: 15px auto;
              display: block;
            }
            #printBtn:hover { background-color: #1a4f02; }
          </style>
        </head>
        <body>
          <div style="text-align:center;">
            <img src="${logoSrc}" alt="AgriAI Logo" style="width:100px;height:100px;display:block;margin:0 auto 10px auto;" />
            <h1>Agri AI Invoice</h1>
          </div>
          <p>
            <strong>Invoice ID:</strong> ${invoiceId}<br>
            <strong>Date:</strong> ${date}
          </p>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Crop Name</th>
                <th>Variety</th>
                <th>Quantity (kg)</th>
                <th>Price/kg</th>
                <th>Subtotal</th>
                <th>GST</th>
                <th>Platform Fee</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
    `;

    items.forEach((it, idx) => {
      const { gstAmt, commissionAmt, lineTotal } = calculateGstAndCommission(it);
      const itemTotal = lineTotal + gstAmt + commissionAmt;
      html += `
        <tr>
          <td>${idx + 1}</td>
          <td>${it.crop_name}</td>
          <td>${it.variety || ''}</td>
          <td>${it.order_quantity}</td>
          <td>₹${it.price_per_kg}</td>
          <td>₹${lineTotal.toFixed(2)}</td>
          <td>₹${gstAmt.toFixed(2)}</td>
          <td>₹${commissionAmt.toFixed(2)}</td>
          <td>₹${itemTotal.toFixed(2)}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
      <h3 style="text-align:right;margin-top:10px;">
        Subtotal: ₹${totals.subtotal.toFixed(2)}<br>
        GST Total: ₹${totals.gst.toFixed(2)}<br>
        Platform Fee: ₹${totals.commission.toFixed(2)}<br>
        <span style="color:#236902;">Grand Total: ₹${grandTotal.toFixed(2)}</span>
      </h3>

      <div class="footer">
        <p><strong>Payment Method:</strong> ${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'}</p>
        <p>Thank you for choosing Agri AI!<br>We connect farmers and buyers with trust.</p>
      </div>

      <button id="printBtn" onclick="window.print()">Print / Save as PDF</button>
    </body>
  </html>
  `;

    const newWindow = window.open('', '_blank');
    newWindow.document.write(html);
    newWindow.document.close();
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

    // Persist order to history and send to backend
    try {
      const invoiceId = 'ORD' + Date.now();
      const createdAt = new Date().toISOString();

      const orderItems = items.map(it => {
        const { gstAmt, commissionAmt, lineTotal } = calculateGstAndCommission(it);
        return {
          id: it.id,
          crop_name: it.crop_name,
          variety: it.variety || it.Variety || '',
          category: it.category || it.cat || '',
          price_per_kg: Number(it.price_per_kg || 0),
          order_quantity: Number(it.order_quantity || 0),
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

      const buyer = {
        id: localStorage.getItem('agriai_id') || null,
        name: localStorage.getItem('agriai_name') || '',
        phone: localStorage.getItem('agriai_phone') || '',
        email: localStorage.getItem('agriai_email') || ''
      };

      const orderRecord = {
        invoice_id: invoiceId,
        created_at: createdAt,
        payment_method: paymentMethod,
        buyer_id: buyer.id || null,
        buyer,
        items: orderItems,
        totals: { ...summary, grand_total }
      };

      const rawHist = localStorage.getItem('agriai_history');
      const hist = rawHist ? JSON.parse(rawHist) : [];
      const nextHist = [orderRecord, ...(Array.isArray(hist) ? hist : [])];
      localStorage.setItem('agriai_history', JSON.stringify(nextHist));

      // Attempt to decrement farmer inventory for each purchased item (best effort)
      try {
        const updates = orderItems
          .filter(it => it && typeof it.id !== 'undefined')
          .map(async (it) => {
            const remaining = Math.max(0, Number((items.find(x => x.id === it.id) || {}).quantity_kg || 0) - Number(it.order_quantity || 0));
            try {
              await fetch(`${apiBase}/my-crops/${it.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity_kg: remaining })
              });
            } catch (e) { /* non-blocking */ }
          });
        Promise.allSettled(updates).catch(() => {});
      } catch (e) { /* ignore */ }

      // Notify farmers of this purchase intent (best-effort)
      try {
        fetch(`${apiBase}/notifications/purchase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ buyer, items: orderItems.map(({ id, crop_name, order_quantity, variety }) => ({ id, crop_name, order_quantity, variety })) })
        }).catch(() => {});
      } catch (e) { /* ignore */ }

      // Clear cart locally
      localStorage.setItem('agriai_cart_buyer', JSON.stringify([]));
      setItems([]);

      // Generate bill in a new window
      generateBill();

      // Also send a normalized order list to backend MySQL buyer_orders table
      try {
        const buyerId = localStorage.getItem('agriai_id') || null;
        const ordersPayload = orderItems.map(it => ({
          invoice_id: invoiceId,
          crop_id: it.id,
          farmer_id: it.farmer_id || it.seller_id || it._farmer_id || null,
          buyer_id: buyerId,
          crop_name: it.crop_name,
          quantity_kg: Number(it.order_quantity || 0),
          price_per_kg: Number(it.price_per_kg || 0),
          total: Number(it.total || 0),
          payment_method: paymentMethod
        }));
        fetch(`${apiBase}/buyer-orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orders: ordersPayload })
        }).catch(() => {});
      } catch (e) { /* non-blocking */ }

      // Navigate to history
      setTimeout(() => { window.location.href = '/history'; }, 100);
    } catch (e) {
      console.error('Failed to complete purchase:', e);
      alert('Something went wrong while completing your purchase. Please try again.');
    }
  };

  return (
    <div style={{ fontFamily: 'Times New Roman, serif' }}>
      <Navbar />
      <main style={{ padding: '6rem 1rem 2rem' }}>
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          background: '#fff',
          padding: '1.25rem',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ color: '#236902', margin: 0 }}>My Cart</h1>
            {items.length > 0 && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => window.location.href = '/dashboard/farmer'} style={{ background: '#fff', border: '1px solid #dfeadf', color: '#236902', padding: '6px 10px', borderRadius: 6 }}>Continue Shopping</button>
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
              {/* Items Column */}
              <div style={{ flex: '1 1 620px', minWidth: 320 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                {items.map(it => {
                  const { gstRate, commissionRate, gstAmt, commissionAmt, lineTotal } = calculateGstAndCommission(it);
                  return (
                    <div key={it.id} style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      border: '1px solid #eee',
                      padding: 12,
                      borderRadius: 8
                    }}>
                      <div style={{
                        width: 120,
                        height: 80,
                        borderRadius: 6,
                        overflow: 'hidden',
                        background: '#f4f4f4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {it.image_url ? (
                          <img
                            src={it.image_url}
                            alt={it.crop_name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ color: '#999' }}>No image</div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <div style={{ fontWeight: 800, color: '#236902' }}>{it.crop_name}</div>
                            {it.variety ? (
                              <div style={{ background: '#f0f7ef', color: '#236902', padding: '2px 8px', borderRadius: 8, fontSize: 12, fontWeight: 700, marginLeft: 6 }}>{it.variety}</div>
                            ) : null}
                          </div>
                          {(it.category || it.cat) && (
                            <div style={{ background: '#eaf6ea', color: '#236902', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{it.category || it.cat}</div>
                          )}
                        </div>
                        <div style={{ marginTop: 6, fontWeight: 700 }}>
                          {formatCurrency(it.price_per_kg)} / kg
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          <div style={{ fontSize: 13, color: '#555' }}>GST: {gstRate}% ({formatCurrency(gstAmt)})</div>
                          <div style={{ fontSize: 13, color: '#555' }}>Platform: {formatCurrency(commissionAmt)}</div>
                          <div style={{ fontSize: 13, color: '#000', fontWeight: 700 }}>Item Total: {formatCurrency(lineTotal + gstAmt + commissionAmt)}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: 220 }}>
                        <div style={{ fontWeight: 700 }}>
                          Available: {Number(it.quantity_kg || 0).toLocaleString('en-IN')} kg
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 6 }}>
                          <button onClick={() => updateQuantity(it.id, -1)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e5e5', background: '#fff' }}>-</button>
                          <div style={{ minWidth: 60, textAlign: 'center', fontWeight: 800 }}>{Number(it.order_quantity || 0).toLocaleString('en-IN')} kg</div>
                          <button onClick={() => updateQuantity(it.id, 1)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e5e5', background: '#fff' }}>+</button>
                        </div>
                        <div style={{
                          marginTop: 8,
                          display: 'flex',
                          gap: 8,
                          justifyContent: 'flex-end'
                        }}>
                          {editingId === it.id ? (
                            <>
                              <input
                                type="number"
                                step="0.001"
                                value={editVal}
                                onChange={e => setEditVal(e.target.value)}
                                style={{ width: 120, padding: 6 }}
                              />
                              <button
                                onClick={() => saveEdit(it.id)}
                                style={{
                                  padding: '6px 8px',
                                  background: '#236902',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: 6
                                }}
                              >Save</button>
                              <button
                                onClick={cancelEdit}
                                style={{
                                  padding: '6px 8px',
                                  background: '#ddd',
                                  border: 'none',
                                  borderRadius: 6
                                }}
                              >Cancel</button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(it)}
                                style={{
                                  padding: '6px 8px',
                                  background: '#1976d2',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: 6
                                }}
                              >Edit</button>
                              <button
                                onClick={() => removeItem(it.id)}
                                style={{
                                  background: '#fff',
                                  border: '1px solid #d32f2f',
                                  color: '#d32f2f',
                                  padding: '6px 10px',
                                  borderRadius: 6
                                }}
                              >Remove</button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>

              {/* Summary Column */}
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

                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                      Payment method <span style={{ color: 'crimson' }}>*</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="radio"
                        name="payment"
                        value="online"
                        checked={paymentMethod === 'online'}
                        onChange={() => { setPaymentMethod('online'); setPaymentError(''); }}
                      /> Online
                    </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={() => { setPaymentMethod('cod'); setPaymentError(''); }}
                      /> Cash on Delivery
                    </label>
                    </div>
                    {paymentError && <div style={{ color: 'crimson', marginTop: 6 }}>{paymentError}</div>}
                  </div>

                    <button
                      onClick={handleBuyNow}
                      disabled={!items.length}
                      style={{
                      marginTop: 12,
                      width: '100%',
                        background: '#236902',
                        color: '#fff',
                      padding: '10px 12px',
                        borderRadius: 6,
                        border: 'none'
                      }}
                    >
                      Buy Now
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

export default Cart;
