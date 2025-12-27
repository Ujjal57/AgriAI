import React from 'react';
import Navbar from '../Navbar';
import logo from '../assets/logo192.png';
import { t } from '../i18n';

export default function FarmerHistory() {
  const [orders, setOrders] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [paymentFilter, setPaymentFilter] = React.useState('all');
  const [expanded, setExpanded] = React.useState({});
  const [siteLang, setSiteLang] = React.useState(() => localStorage.getItem('agri_lang') || 'en');

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('agriai_history_farmer');
      const hist = raw ? JSON.parse(raw) : [];
      setOrders(Array.isArray(hist) ? hist : []);
    } catch (e) {
      setOrders([]);
    }
  }, []);

  React.useEffect(() => {
    const onLang = (e) => { const l = (e && e.detail && e.detail.lang) ? e.detail.lang : (localStorage.getItem('agri_lang') || 'en'); setSiteLang(l); };
    window.addEventListener('agri:lang:change', onLang);
    return () => { try { window.removeEventListener('agri:lang:change', onLang); } catch (e) {} };
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

  const translateVar = (val) => {
    try {
      const raw = (val || '').toString().trim();
      if (!raw) return '';
      const normalize = (s) => (
        s.toString().trim()
          .replace(/[^a-zA-Z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter(Boolean)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join('')
      );
      const Normal = normalize(raw);
      const candidates = [ `variety${Normal}`, `variety_${raw.toLowerCase().replace(/\s+/g,'_')}`, raw ];
      for (let k of candidates) {
        try {
          const out = t(k, siteLang);
          if (out && out !== k) return out;
        } catch (e) {}
      }
      return raw;
    } catch (e) { return val || ''; }
  };

  const filtered = orders.filter(o => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q ||
      (o.invoice_id || '').toString().toLowerCase().includes(q) ||
      (o.items || []).some(it => {
        try {
          const cropMatch = (it.crop_name || '').toString().toLowerCase().includes(q);
          const varRaw = (it.variety || '').toString().toLowerCase();
          const varMatchRaw = varRaw.includes(q);
          const varMatchTranslated = (translateVar(it.variety) || '').toString().toLowerCase().includes(q);
          return cropMatch || varMatchRaw || varMatchTranslated;
        } catch (e) { return false; }
      });
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
            <h1>${t('invoiceTitle', siteLang) || 'Agri AI Invoice'}</h1>
          </div>
          <p>
            <strong>${t('invoiceIdLabel', siteLang) || 'Invoice ID:'}</strong> ${invoiceId}<br>
            <strong>${t('dateLabel', siteLang) || 'Date:'}</strong> ${date}
          </p>
          <table>
            <thead>
              <tr>
                <th>${t('tableIndex', siteLang) || '#'}</th>
                <th>${t('tableCropName', siteLang) || 'Crop Name'}</th>
                <th>${t('tableQuantity', siteLang) || 'Quantity (kg)'}</th>
                <th>${t('tablePricePerKg', siteLang) || 'Price/kg'}</th>
                <th>${t('tableSubtotal', siteLang) || 'Subtotal'}</th>
                <th>${t('tableGst', siteLang) || 'GST'}</th>
                <th>${t('tablePlatformFee', siteLang) || 'Platform Fee'}</th>
                <th>${t('tableTotal', siteLang) || 'Total'}</th>
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
            ${t('tableSubtotal', siteLang) || 'Subtotal'}: ₹${Number(t.subtotal).toFixed(2)}<br>
            ${t('gstTotalLabel', siteLang) || 'GST Total'}: ₹${Number(t.gst).toFixed(2)}<br>
            ${t('platformFeeLabel', siteLang) || 'Platform Fee'}: ₹${Number(t.platform_fee).toFixed(2)}<br>
            <span style="color:#236902;">${t('grandTotalLabel', siteLang) || 'Grand Total'}: ₹${Number(t.grand_total).toFixed(2)}</span>
          </h3>
          <div class="footer">
            <p><strong>${t('paymentMethod', siteLang) || 'Payment Method:'}</strong> ${order.payment_method === 'cod' ? (t('cashOnDelivery', siteLang) || 'Cash on Delivery') : (t('online', siteLang) || 'Online')}</p>
            <p>${t('thankYou', siteLang) || 'Thank you for choosing Agri AI!'}</p>
          </div>
          <button id="printBtn" onclick="window.print()">${t('printButton', siteLang) || 'Print / Save as PDF'}</button>
        </body>
      </html>
    `;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
  };

  return (
    <div style={{ background: '#53b635', minHeight: '100vh', color: '#fff' }}>
      <Navbar />
      <main style={{ padding: '6rem 1rem 2rem' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', background: '#fff', padding: '1.5rem', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
          <h1 style={{ color: '#236902', textAlign: 'center' }}>{t('historyTitle', siteLang) || 'Sales History'}</h1>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12, alignItems: 'center', justifyContent: 'space-between' }}>
            <input
              placeholder={t('historySearchPlaceholder', siteLang) || 'Search by invoice or crop name'}
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ flex: '1 1 280px', minWidth: 240, padding: 10, border: '1px solid #e5e5e5', borderRadius: 6, color: '#333' }}
            />
            <div>
              <label style={{ marginRight: 8, fontWeight: 700 }}>{t('paymentLabel', siteLang) || 'Payment:'}</label>
              <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} style={{ padding: 10, border: '1px solid #e5e5e5', borderRadius: 6 }}>
                <option value="all">{t('all', siteLang) || 'All'}</option>
                <option value="online">{t('online', siteLang) || 'Online'}</option>
                <option value="cod">{t('cashOnDelivery', siteLang) || 'Cash on Delivery'}</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <div style={{ fontSize: 52, lineHeight: 1 }}>🧾</div>
              <div style={{ marginTop: 8 }}>{t('historyNoPurchases', siteLang) || 'No matching sales yet.'}</div>
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
                        <div style={{ fontWeight: 800, color: '#236902' }}>{(t('invoiceLabel', siteLang) || 'Invoice') + ': '}{o.invoice_id}</div>
                        <div style={{ color: '#333' }}>{t('dateLabel', siteLang) || 'Date'}: {formatDateTime(o.created_at)}</div>
                        <div style={{ background: '#eaf6ea', color: '#236902', padding: '4px 8px', borderRadius: 999, fontWeight: 700 }}>
                          {o.payment_method === 'cod' ? (t('cashOnDelivery', siteLang) || 'Cash on Delivery') : (t('online', siteLang) || 'Online')}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontWeight: 800, color: '#236902' }}>{formatCurrency(total)}</div>
                        <button onClick={() => openInvoice(o)} style={{ background: '#1976d2', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 6 }}>{t('viewInvoice', siteLang) || 'View Invoice'}</button>
                        <button onClick={() => toggleExpand(o.invoice_id)} style={{ background: '#fff', color: '#236902', border: '1px solid #dfeadf', padding: '6px 10px', borderRadius: 6 }}>{isExpanded ? (t('hide', siteLang) || 'Hide') : (t('details', siteLang) || 'Details')}</button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ padding: 12, overflowX: 'auto', color: '#000' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={{ border: '1px solid #ddd', padding: 8, background: '#f4f4f4' }}>{t('tableIndex', siteLang) || '#'}</th>
                              <th style={{ border: '1px solid #ddd', padding: 8, background: '#f4f4f4' }}>{t('tableCrop', siteLang) || 'Crop'}</th>
                              <th style={{ border: '1px solid #ddd', padding: 8, background: '#f4f4f4' }}>{t('tableQty', siteLang) || 'Qty (kg)'}</th>
                              <th style={{ border: '1px solid #ddd', padding: 8, background: '#f4f4f4' }}>{t('tablePricePerKg', siteLang) || 'Price/kg'}</th>
                              <th style={{ border: '1px solid #ddd', padding: 8, background: '#f4f4f4' }}>{t('tableSubtotal', siteLang) || 'Subtotal'}</th>
                              <th style={{ border: '1px solid #ddd', padding: 8, background: '#f4f4f4' }}>{t('tableGst', siteLang) || 'GST'}</th>
                              <th style={{ border: '1px solid #ddd', padding: 8, background: '#f4f4f4' }}>{t('tablePlatformFee', siteLang) || 'Platform Fee'}</th>
                              <th style={{ border: '1px solid #ddd', padding: 8, background: '#f4f4f4' }}>{t('tableTotal', siteLang) || 'Total'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(o.items || []).map((it, idx) => (
                              <tr key={idx}>
                                <td style={{ border: '1px solid #eee', padding: 8, textAlign: 'center' }}>{idx + 1}</td>
                                <td style={{ border: '1px solid #eee', padding: 8, textAlign: 'center' }}>{it.crop_name}</td>
                                <td style={{ border: '1px solid #eee', padding: 8, textAlign: 'center' }}>{Number(it.order_quantity || 0).toLocaleString('en-IN')}</td>
                                <td style={{ border: '1px solid #eee', padding: 8, textAlign: 'center' }}>{formatCurrency(it.price_per_kg)}</td>
                                <td style={{ border: '1px solid #eee', padding: 8, textAlign: 'center' }}>{formatCurrency(it.subtotal)}</td>
                                <td style={{ border: '1px solid #eee', padding: 8, textAlign: 'center' }}>{formatCurrency(it.gst)}</td>
                                <td style={{ border: '1px solid #eee', padding: 8, textAlign: 'center' }}>{formatCurrency(it.platform_fee)}</td>
                                <td style={{ border: '1px solid #eee', padding: 8, textAlign: 'center' }}>{formatCurrency(it.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div style={{ textAlign: 'right', marginTop: 12, fontWeight: 800, color: '#000' }}>
                          <div style={{ color: '#236902', fontSize: 18 }}>{t('grandTotalLabel', siteLang) || 'Grand Total'}: {formatCurrency(o?.totals?.grand_total)}</div>
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


