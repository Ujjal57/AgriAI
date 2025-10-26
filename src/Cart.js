import React from 'react';
import Navbar from './Navbar';

const Cart = () => {
  const [items, setItems] = React.useState([]);
  const [editingId, setEditingId] = React.useState(null);
  const [editVal, setEditVal] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('');
  const [paymentError, setPaymentError] = React.useState('');

  // Example seller details (you can fetch from localStorage or API)
  const sellerInfo = {
    name: 'Ujjal Kumar',
    address: '123, Farm Lane',
    state: 'Karnataka',
    region: 'South India'
  };

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('agriai_cart');
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
      localStorage.setItem('agriai_cart', JSON.stringify(updated));
      setItems(updated);
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
      gstRate = 5; commissionRate = 9;
    } else if (cat.includes('fruit') || cat.includes('vegetable')) {
      gstRate = 0; commissionRate = 8;
    } else if (cat.includes('crop') || cat.includes('crops')) {
      gstRate = 0; commissionRate = 5;
    } else {
      const name = (item.crop_name || '').toString().toLowerCase();
      if (name.includes('masala')) { gstRate = 5; commissionRate = 9; }
      else if (name.includes('fruit') || name.includes('vegetable')) { gstRate = 0; commissionRate = 8; }
      else { gstRate = 0; commissionRate = 5; }
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

  // 🧾 Function to Generate the Invoice with logo + print/save option
  const generateBill = () => {
    const invoiceId = 'ORD' + Date.now();
    const date = new Date().toLocaleString();

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
         
          <h1>Agri AI Invoice</h1>
          <p>
            <strong>Invoice ID:</strong> ${invoiceId}<br>
            <strong>Date:</strong> ${date}
          </p>
          <p>
            <strong>Seller Name:</strong> ${sellerInfo.name}<br>
            <strong>Address:</strong> ${sellerInfo.address}<br>
            <strong>Address:</strong> ${sellerInfo.phone}<br>
            <strong>State:</strong> ${sellerInfo.state}<br>
            <strong>Region:</strong> ${sellerInfo.region}
          </p>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Crop Name</th>
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

    generateBill(); // ✅ Generate and open the bill
  };

  return (
    <div style={{ fontFamily: 'Times New Roman, serif' }}>
      <Navbar />
      <main style={{ padding: '6rem 1rem 2rem' }}>
        <div style={{
          maxWidth: 980,
          margin: '0 auto',
          background: '#fff',
          padding: '2rem',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
        }}>
          <h1 style={{ color: '#236902', textAlign: 'center' }}>My Cart</h1>
          {items.length === 0 ? (
            <p>Your cart is empty. Add listings from the Farmers/Crops page.</p>
          ) : (
            <div>
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
                        <div style={{ fontWeight: 800, color: '#236902' }}>{it.crop_name}</div>
                        <div style={{ marginTop: 6, fontWeight: 700 }}>
                          ₹{Number(it.price_per_kg || 0).toLocaleString('en-IN')} / kg
                        </div>
                        <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>
                          GST: {gstRate}% (₹{gstAmt.toLocaleString('en-IN')})
                        </div>
                        <div style={{ fontSize: 13, color: '#000', marginTop: 4, fontWeight: 700 }}>
                          Item Total: ₹{(lineTotal + gstAmt + commissionAmt).toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700 }}>
                          Available: {Number(it.quantity_kg || 0).toLocaleString('en-IN')} kg
                        </div>
                        <div style={{ fontWeight: 800, marginTop: 6 }}>
                          Order: {Number(it.order_quantity || 0).toLocaleString('en-IN')} kg
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

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 16
              }}>
                <div style={{ fontWeight: 800 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#236902' }}>
                    Total available: {Number(totalAvailableQty).toLocaleString('en-IN')} kg
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#000000ff' }}>
                    Total ordered: {Number(totalOrderedQty).toLocaleString('en-IN')} kg
                  </div>
                  <div>Subtotal: ₹{totals.subtotal.toLocaleString('en-IN')}</div>
                  <div>GST Total: ₹{totals.gst.toLocaleString('en-IN')}</div>
                  <div>Platform Fee: ₹{totals.commission.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: 18, color: '#236902', marginTop: 6 }}>
                    Grand Total: ₹{grandTotal.toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ marginBottom: 8, textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                      Payment method <span style={{ color: 'crimson' }}>*</span>
                    </div>
                    <label style={{ marginRight: 12 }}>
                      <input
                        type="radio"
                        name="payment"
                        value="online"
                        checked={paymentMethod === 'online'}
                        onChange={() => { setPaymentMethod('online'); setPaymentError(''); }}
                      /> Online
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={() => { setPaymentMethod('cod'); setPaymentError(''); }}
                      /> Cash on Delivery
                    </label>
                    {paymentError && <div style={{ color: 'crimson', marginTop: 6 }}>{paymentError}</div>}
                  </div>
                  <div>
                    <button
                      onClick={handleBuyNow}
                      disabled={!items.length}
                      style={{
                        background: '#236902',
                        color: '#fff',
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: 'none'
                      }}
                    >
                      Buy Now
                    </button>
                  </div>
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
