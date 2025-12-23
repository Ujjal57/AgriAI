import React from 'react';
import Navbar from './Navbar';
import logo from './assets/logo192.png';

export default function History() {
  const [orders, setOrders] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [paymentFilter, setPaymentFilter] = React.useState('all');
  const [expanded, setExpanded] = React.useState({});

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('agriai_history');
      const hist = raw ? JSON.parse(raw) : [];
      const arr = Array.isArray(hist) ? hist : [];
      // Filter orders to the signed-in buyer id (fallback to phone match)
      const signedId = localStorage.getItem('agriai_id');
      const signedPhone = localStorage.getItem('agriai_phone');
      if (signedId || signedPhone) {
        const filtered = arr.filter(o => {
          try {
            if (signedId && (o.buyer_id == signedId || (o.buyer && (''+o.buyer.id) === ''+signedId))) return true;
            if (signedPhone && (o.buyer && o.buyer.phone && (''+o.buyer.phone) === ''+signedPhone)) return true;
            return false;
          } catch (e) { return false; }
        });
        setOrders(filtered);
      } else {
        // no signed-in buyer, show no orders
        setOrders([]);
      }
    } catch (e) {
      setOrders([]);
    }
  }, []);

  const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const formatDateTime = (iso) => {
    try {
      const d = new Date(iso);
      if (isNaN(d)) return String(iso);
      return d.toLocaleString();
    } catch (e) { return String(iso); }
  };

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const filtered = orders.filter(o => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q ||
      o.invoice_id.toLowerCase().includes(q) ||
      (o.items || []).some(it => (it.crop_name || '').toLowerCase().includes(q));
    const matchesPayment = paymentFilter === 'all' || o.payment_method === paymentFilter;
    return matchesQuery && matchesPayment;
  });

  const openInvoice = (order) => {
    const invoiceId = order.invoice_id;
    const date = formatDateTime(order.created_at);
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
            .footer { margin-top: 20px; font-size: 14px; color: #555; text-align: center; }
            #printBtn { background-color: #236902; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 15px; margin: 15px auto; display: block; }
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
    (order.items || []).forEach((it, idx) => {
      html += `
        <tr>
          <td>${idx + 1}</td>
          <td>${it.crop_name}</td>
          <td>${it.order_quantity}</td>
          <td>₹${it.price_per_kg}</td>
          <td>₹${Number(it.subtotal).toFixed(2)}</td>
          <td>₹${Number(it.gst).toFixed(2)}</td>
          <td>₹${Number(it.platform_fee).toFixed(2)}</td>
          <td>₹${Number(it.total).toFixed(2)}</td>
        </tr>
      `;
    });
    const t = order.totals || { subtotal: 0, gst: 0, platform_fee: 0, grand_total: 0 };
    html += `
            </tbody>
          </table>
          <h3 style="text-align:right;margin-top:10px;">
            Subtotal: ₹${Number(t.subtotal).toFixed(2)}<br>
            GST Total: ₹${Number(t.gst).toFixed(2)}<br>
            Platform Fee: ₹${Number(t.platform_fee).toFixed(2)}<br>
            <span style="color:#236902;">Grand Total: ₹${Number(t.grand_total).toFixed(2)}</span>
          </h3>
          <div class="footer">
            <p><strong>Payment Method:</strong> ${order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online'}</p>
            <p>Thank you for choosing Agri AI!</p>
          </div>
          <button id="printBtn" onclick="window.print()">Print / Save as PDF</button>
        </body>
      </html>
    `;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="min-h-screen bg-green-50 text-gray-900">
      <Navbar />
      <main style={{ padding: '6rem 1rem 2rem' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', background: '#fff', padding: '1.5rem', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
          <h1 style={{ color: '#236902', textAlign: 'center' }}>Purchase History</h1>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12, alignItems: 'center', justifyContent: 'space-between' }}>
            <input
              placeholder="Search by invoice or crop name"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ flex: '1 1 280px', minWidth: 240, padding: 10, border: '1px solid #e5e5e5', borderRadius: 6 }}
            />
            <div>
              <label style={{ marginRight: 8, fontWeight: 700 }}>Payment:</label>
              <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} style={{ padding: 10, border: '1px solid #e5e5e5', borderRadius: 6 }}>
                <option value="all">All</option>
                <option value="online">Online</option>
                <option value="cod">Cash on Delivery</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <div style={{ fontSize: 52, lineHeight: 1 }}>🧾</div>
              <div style={{ marginTop: 8 }}>No matching purchases yet.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
              {filtered.map((o) => {
                const total = o?.totals?.grand_total || 0;
                const isExpanded = !!expanded[o.invoice_id];
                return (
                  <div key={o.invoice_id} style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 14px', background: '#f7faf7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ fontWeight: 800, color: '#236902' }}>Invoice: {o.invoice_id}</div>
                        <div style={{ color: '#333' }}>Date: {formatDateTime(o.created_at)}</div>
                        <div style={{ background: '#eaf6ea', color: '#236902', padding: '4px 8px', borderRadius: 999, fontWeight: 700 }}>
                          {o.payment_method === 'cod' ? 'Cash on Delivery' : 'Online'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontWeight: 800, color: '#236902' }}>{formatCurrency(total)}</div>
                        <button onClick={() => openInvoice(o)} style={{ background: '#1976d2', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 6 }}>View Invoice</button>
                        <button onClick={() => toggleExpand(o.invoice_id)} style={{ background: '#fff', color: '#236902', border: '1px solid #dfeadf', padding: '6px 10px', borderRadius: 6 }}>{isExpanded ? 'Hide' : 'Details'}</button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ padding: 12, overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={{ border: '1px solid #ddd', padding: 8, background: '#f4f4f4' }}>#</th>
                              <th style={{ border: '1px solid #ddd', padding: 8, background: '#f4f4f4' }}>Crop</th>
                              <th style={{ border: '1px solid #ddd', padding: 8, background: '#f4f4f4' }}>Qty (kg)</th>
                              <th style={{ border: '1px solid #ddd', padding: 8, background: '#f4f4f4' }}>Price/kg</th>
                              <th style={{ border: '1px solid #ddd', padding: 8, background: '#f4f4f4' }}>Subtotal</th>
                              <th style={{ border: '1px solid #ddd', padding: 8, background: '#f4f4f4' }}>GST</th>
                              <th style={{ border: '1px solid #ddd', padding: 8, background: '#f4f4f4' }}>Platform Fee</th>
                              <th style={{ border: '1px solid #ddd', padding: 8, background: '#f4f4f4' }}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(o.items || []).map((it, idx) => (
                              <tr key={idx}>
                                <td style={{ border: '1px solid #eee', padding: 8, textAlign: 'center' }}>{idx + 1}</td>
                                <td style={{ border: '1px solid #eee', padding: 8 }}>{it.crop_name}</td>
                                <td style={{ border: '1px solid #eee', padding: 8, textAlign: 'right' }}>{Number(it.order_quantity || 0).toLocaleString('en-IN')}</td>
                                <td style={{ border: '1px solid #eee', padding: 8, textAlign: 'right' }}>{formatCurrency(it.price_per_kg)}</td>
                                <td style={{ border: '1px solid #eee', padding: 8, textAlign: 'right' }}>{formatCurrency(it.subtotal)}</td>
                                <td style={{ border: '1px solid #eee', padding: 8, textAlign: 'right' }}>{formatCurrency(it.gst)}</td>
                                <td style={{ border: '1px solid #eee', padding: 8, textAlign: 'right' }}>{formatCurrency(it.platform_fee)}</td>
                                <td style={{ border: '1px solid #eee', padding: 8, textAlign: 'right' }}>{formatCurrency(it.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div style={{ textAlign: 'right', marginTop: 12, fontWeight: 800 }}>
                          <div>Subtotal: {formatCurrency(o?.totals?.subtotal)}</div>
                          <div>GST Total: {formatCurrency(o?.totals?.gst)}</div>
                          <div>Platform Fee: {formatCurrency(o?.totals?.platform_fee)}</div>
                          <div style={{ color: '#236902', fontSize: 18 }}>Grand Total: {formatCurrency(o?.totals?.grand_total)}</div>
      </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
