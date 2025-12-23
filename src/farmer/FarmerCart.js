import React from 'react';
import Navbar from '../Navbar';
import logo192 from '../assets/logo192.png';

const FarmerCart = () => {
  const [items, setItems] = React.useState([]);
  const [editingId, setEditingId] = React.useState(null);
  const [editVal, setEditVal] = React.useState('');
  const [editPrice, setEditPrice] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('');
  const [paymentError, setPaymentError] = React.useState('');
  const [contractType, setContractType] = React.useState('one-time');
  const [contractHtml, setContractHtml] = React.useState('');
  const [showContractPreview, setShowContractPreview] = React.useState(false);

  const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');

  React.useEffect(() => {
    // Try to load server-backed farmer cart when signed in; otherwise fall back to localStorage
    const load = async () => {
      try {
        const userRole = localStorage.getItem('agriai_role') || '';
        const userId = localStorage.getItem('agriai_id') || '';
        const userPhone = localStorage.getItem('agriai_phone') || '';
        const cartKey = 'agriai_cart_farmer';

        if (userRole && (userId || userPhone)) {
          try {
            const qp = userId ? `user_type=${encodeURIComponent(userRole)}&user_id=${encodeURIComponent(userId)}` : `user_type=${encodeURIComponent(userRole)}&user_phone=${encodeURIComponent(userPhone)}`;
            const res = await fetch(`${apiBase}/cart/list?${qp}`);
            if (res && res.ok) {
              const j = await res.json().catch(() => null);
              if (j && j.ok && Array.isArray(j.cart)) {
                const mapped = j.cart.map(r => ({
                  id: r.crop_id || r.id,
                  cart_id: r.id,
                  crop_name: r.crop_name || '',
                  quantity_kg: Number(r.quantity_kg || 0),
                  price_per_kg: r.price_per_kg != null ? Number(r.price_per_kg) : 0,
                  image_url: r.image_path || r.image_url || '',
                  order_quantity: 0,
                  variety: r.variety || '',
                  category: r.category || r.cat || '',
                  user_type: r.user_type || userRole,
                  user_id: r.user_id || null,
                  user_phone: r.user_phone || null,
                }));
                setItems(mapped);
                try { localStorage.setItem(cartKey, JSON.stringify(mapped)); } catch (e) {}
                return;
              }
            }
          } catch (e) { console.warn('Failed to load server farmer cart, falling back to localStorage', e); }
        }

        // Fallback to localStorage
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
        } catch (e) { setItems([]); }
      } catch (e) { setItems([]); }
    };

    load();
  }, []);

  const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  const clearCart = () => {
    (async () => {
      try {
        const userRole = localStorage.getItem('agriai_role') || '';
        const userId = localStorage.getItem('agriai_id') || '';
        const userPhone = localStorage.getItem('agriai_phone') || '';
        const cartKey = 'agriai_cart_farmer';

        if (userRole && (userId || userPhone)) {
          try {
            await fetch(`${apiBase}/cart/clear`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_type: userRole, user_id: userId || undefined, user_phone: userPhone || undefined }) });
          } catch (e) { console.warn('cart/clear failed', e); }
        }

        // Always clear local storage/UI
        try { localStorage.setItem(cartKey, JSON.stringify([])); } catch (e) {}
        setItems([]);
        try { window.dispatchEvent(new Event('agriai:cart:update')); } catch (e) {}
      } catch (e) { console.warn(e); }
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
      localStorage.setItem('agriai_cart_farmer', JSON.stringify(updated));
      setItems(updated);
      try { window.dispatchEvent(new Event('agriai:cart:update')); } catch (e) {}
    } catch (e) {}
  };

  const removeItem = (id) => {
    (async () => {
      try {
        const userRole = localStorage.getItem('agriai_role') || '';
        const userId = localStorage.getItem('agriai_id') || '';
        const userPhone = localStorage.getItem('agriai_phone') || '';
        const cartKey = 'agriai_cart_farmer';
        const it = items.find(x => x.id === id);

        // If server-backed (has cart_id), request deletion on server
        if (it && it.cart_id && userRole && (userId || userPhone)) {
          try {
            const payload = { ids: [it.cart_id], user_type: userRole, user_id: userId || undefined, user_phone: userPhone || undefined };
            const res = await fetch(`${apiBase}/cart/remove`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok) console.warn('cart/remove failed');
          } catch (e) { console.warn('cart/remove error', e); }
        }

        // Always remove locally (fallback/offline)
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
    setEditPrice(String(Number(it.price_per_kg || it.price || 0)));
  };

  const cancelEdit = () => { setEditingId(null); setEditVal(''); setEditPrice(''); };

  const saveEdit = (id) => {
    try {
      const newQty = parseFloat(editVal);
      const newPrice = parseFloat(editPrice);
      if (Number.isNaN(newQty) || newQty <= 0) {
        alert('Please enter a valid order quantity (greater than 0).');
        return;
      }
      if (Number.isNaN(newPrice) || newPrice < 0) {
        alert('Please enter a valid price per kg (>= 0).');
        return;
      }
      const updated = items.map(it => {
        if (it.id === id) {
          const avail = Number(it.quantity_kg || 0) || 0;
          const finalQty = Math.min(newQty, avail);
          return { ...it, order_quantity: finalQty, price_per_kg: Number(newPrice) };
        }
        return it;
      });
      localStorage.setItem('agriai_cart_farmer', JSON.stringify(updated));
      setItems(updated);
      setEditingId(null);
      setEditVal('');
      setEditPrice('');
      try { window.dispatchEvent(new Event('agriai:cart:update')); } catch (e) {}

      // If this item exists on server (has cart_id) and user is signed in, persist quantity change
      (async () => {
        try {
          const userRole = localStorage.getItem('agriai_role') || '';
          const userId = localStorage.getItem('agriai_id') || '';
          const userPhone = localStorage.getItem('agriai_phone') || '';
          if (userRole && (userId || userPhone)) {
            const changed = updated.find(x => x.id === id);
            if (changed && changed.cart_id) {
              try {
                await fetch(`${apiBase}/cart/update`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: changed.cart_id, quantity_kg: Number(changed.order_quantity || 0), user_type: userRole, user_id: userId || undefined, user_phone: userPhone || undefined }) });
              } catch (e) { console.warn('cart/update failed', e); }
            }
          }
        } catch (e) { console.warn(e); }
      })();
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

  const handleBuyNow = async () => {
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
      // If signed in and server rows exist, remove them on server
      try {
        const userRole = localStorage.getItem('agriai_role') || '';
        const userId = localStorage.getItem('agriai_id') || '';
        const userPhone = localStorage.getItem('agriai_phone') || '';
        const ids = items.map(it => it && it.cart_id).filter(x => !!x);
        if (userRole && (userId || userPhone) && ids.length) {
          try {
            await fetch(`${apiBase}/cart/remove`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, user_type: userRole, user_id: userId || undefined, user_phone: userPhone || undefined }) });
          } catch (e) { console.warn('cart/remove during checkout failed', e); }
        }
      } catch (e) { console.warn(e); }

      // clear cart locally
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

  const generateContract = () => {
    try {
      // Attempt to obtain buyer and farmer details from localStorage / items
      const farmerName = localStorage.getItem('agriai_name') || '';
      const farmerEmail = localStorage.getItem('agriai_email') || '';
      const farmerAddress = localStorage.getItem('agriai_address') || '';

      // Helper: try multiple possible localStorage keys for buyer/farmer fields
      const fetchFirst = (keys, fallback) => {
        for (let k of keys) {
          try {
            const v = localStorage.getItem(k);
            if (v && v.toString().trim()) return v.toString().trim();
          } catch (e) { continue; }
        }
        return fallback;
      };
 
      // Buye
      // r info: check a list of commonly-used keys, then fall back to placeholders
      const buyerName = fetchFirst(['contract_buyer_name', 'agriai_buyer_name', 'buyer_name', 'selected_buyer_name'], '[Buyer Name]');
      const buyerEmail = fetchFirst(['contract_buyer_email', 'agriai_buyer_email', 'buyer_email', 'selected_buyer_email'], '[Buyer Email]');
      const buyerAddress = fetchFirst(['contract_buyer_address', 'agriai_buyer_address', 'buyer_address', 'selected_buyer_address'], '[Buyer Address]');
      const buyerPhone = fetchFirst(['contract_buyer_phone', 'agriai_buyer_phone', 'buyer_phone', 'selected_buyer_phone'], '');

      const startDate = new Date().toLocaleDateString('en-GB');
      // default end date 30 days later for one-time, seasonal ~90 days, yearly ~365
      const days = contractType === 'one-time' ? 30 : (contractType === 'seasonal' ? 90 : 365);
      const endDate = new Date(Date.now() + days * 24 * 3600 * 1000).toLocaleDateString('en-GB');

      // Build commodity rows from items
      const rows = (items || []).map((it, idx) => {
        const qty = Number(it.order_quantity || 0) || 0;
        const variety = it.variety || it.crop_variety || it.var || '';
        const quality = it.quality || it.grade || '';
        return `<tr>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${idx + 1}</td>
          <td style="padding:8px;border:1px solid #ddd">${it.crop_name || ''}</td>
          <td style="padding:8px;border:1px solid #ddd">${variety}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:right">${qty.toLocaleString('en-IN')} kg</td>
        </tr>`;
      }).join('') || `<tr><td colspan="5" style="padding:8px;border:1px solid #ddd;text-align:center">No items</td></tr>`;

      const html = `<!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Procurement Contract</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <style>
          body { font-family: 'Times New Roman', Times, serif; color: #111; padding: 24px; }
          h1 { text-align: center; color: #236902; margin: 0 }
          table { border-collapse: collapse; width: 100%; margin-top: 12px }
          th, td { border: 1px solid #ddd; padding: 8px }
          th { background: #f7f7f7; text-align: left }
          .muted { color: #000000ff; font-size: 0.95rem }
          .section { margin-top: 16px }
        </style>
      </head>
      <body>
        <div style="text-align:center;">
              <img src="${logo192}" alt="AgriAI" style="width:120px;height:auto;margin-bottom:8px" />
          <h1>Agri AI<br/>PROCUREMENT CONTRACT FARMING AGREEMENT</h1>
          <div style="margin-top:6px;font-weight:800">Contract Type: ${contractType}</div>
        </div>

        <div class="section">
          <strong>Party A – The Buyer / Company</strong>
          <div class="muted">Name: ${buyerName}</div>
          <div class="muted">Address: ${buyerAddress}</div>
          <div class="muted">Contact: ${buyerEmail}</div>
        </div>

        <div class="section">
          <strong>Party B – The Farmer / Producer</strong>
          <div class="muted">Name: ${farmerName}</div>
          <div class="muted">Address: ${farmerAddress}</div>
          <div class="muted">Contact: ${farmerEmail}</div>
        </div>

        <div class="section">
          <strong>1. Purpose of Agreement</strong>
          <div class="muted">This agreement outlines the terms under which the Farmer agrees to produce and supply agricultural produce to the Buyer, and the Buyer agrees to purchase the same at a predetermined price, ensuring stable market access and fair remuneration to the Farmer.</div>
        </div>

        <div class="section">
          <strong>2. Duration of Contract</strong>
          <div class="muted">Start Date: ${startDate}</div>
          <div class="muted">End Date: ${endDate}</div>
          <div class="muted">Duration: ${days} days</div>
          <div class="muted">The contract may be renewed or extended only through the official Agri AI website using registered login credentials. Both parties must agree digitally to confirm renewal.</div>
        </div>

        <div class="section">
          <strong>Data Privacy</strong>
          <div class="muted">All farmer data collected via the Agri AI platform will be stored securely and used only for:</div>
          <ul>
            <li class="muted">Contract processing &amp; renewal</li>
            <li class="muted">Payment settlement</li>
            <li class="muted">Insurance facilitation</li>
          </ul>
          <div class="muted">This is in full compliance with the Digital Personal Data Protection Act, 2023.</div>
        </div>

        <div class="section">
          <strong>3. Commodity Details</strong>
          <table>
            <thead>
              <tr>
                <th style="width:6%">Item</th>
                <th>Crop Name</th>
                <th>Variety</th>
                <th style="width:14%;text-align:right">Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>

        <div class="section">
          <strong>4. Price and Payment Terms</strong>
          <div class="muted"><strong>Fixed Procurement Price:</strong> ₹________ per kg / quintal / ton.</div>
          <div class="muted">Price remains fixed throughout the contract period irrespective of market fluctuations.</div>

          <div style="margin-top:8px"><strong>Payment Schedule</strong></div>
          <ul>
            <li class="muted">50% payment on delivery of produce.</li>
            <li class="muted">50% payment within 7 working days after quality assessment and acceptance.</li>
          </ul>

          <div style="margin-top:8px"><strong>Mode of Payment</strong></div>
          <ul>
            <li class="muted">Bank Transfer</li>
            <li class="muted">UPI</li>
            <li class="muted">Cheque</li>
          </ul>

          <div class="muted">Buyer shall issue digital or physical receipts for all payments.</div>
        </div>

        <div class="section">
          <strong>5. Risk, Liability &amp; Insurance</strong>
          <div class="muted">The Farmer will follow standard agricultural practices to achieve expected production.</div>
          <div class="muted">In case of crop loss due to natural calamities (flood, drought, cyclone, pest outbreak etc.), both parties shall share losses fairly and transparently.</div>
          <div class="muted">Buyer shall facilitate insurance coverage for contracted farmers under:</div>
          <ul>
            <li class="muted">Pradhan Mantri Fasal Bima Yojana (PMFBY)</li>
            <li class="muted">through ICICI Lombard General Insurance Co. or any approved insurer.</li>
          </ul>
          <div class="muted">Any insurance compensation received shall be transferred to the Farmer without delay.</div>
          <div class="muted">In case of complete crop failure with no insurance coverage, the Buyer may voluntarily provide up to 25% relief of the expected procurement value.</div>
          <div class="muted">After delivery and acceptance of produce, all risks (transport/storage/price fluctuations) shift to the Buyer.</div>
        </div>

        <div class="section">
          <strong>6. Force Majeure</strong>
          <div class="muted">Neither party shall be liable for delays or failure caused by events beyond control, including natural disasters, war, government restrictions, strikes, lockdowns or pandemics. Performance obligations will resume once conditions normalize.</div>
        </div>

        <div class="section">
          <strong>7. Dispute Resolution &amp; Jurisdiction</strong>
          <div class="muted">Initial resolution through mutual negotiation between Farmer and Buyer.</div>
          <div class="muted">If unresolved, the issue shall be referred to the local Farmer Dispute Resolution Board, District Agriculture Office, or respective Rural Development Authority.</div>
          <div class="muted">Final arbitration as per the Arbitration and Conciliation Act, 1996. Courts of ________________ (District / State) shall have exclusive jurisdiction.</div>
        </div>

        <div class="section">
          <strong>8. Termination Clause</strong>
          <div class="muted">Either party may terminate the agreement with 30 days’ written notice for valid reasons:</div>
          <ul>
            <li class="muted">Non-payment</li>
            <li class="muted">Non-delivery</li>
            <li class="muted">Fraudulent activity</li>
            <li class="muted">Force majeure</li>
            <li class="muted">Violation of terms</li>
          </ul>
          <div class="muted">All outstanding dues must be fully settled before termination becomes effective.</div>
        </div>

        <div class="section">
          <strong>9. Language of Agreement</strong>
          <div class="muted">This Agreement has been explained and translated to the Farmer in ________________ (Language). In case of any conflict, the English version shall be legally binding.</div>
        </div>

        <div class="section">
          <strong>10. Execution &amp; Signatures</strong>
          <div class="muted">This Agreement is executed on non-judicial stamp paper of appropriate value as per state laws, and signed by both parties in presence of witnesses.</div>
          <div style="margin-top:12px">Buyer / Company Representative: ___________________________</div>
          <div style="margin-top:12px">Farmer / Producer: ___________________________</div>
          <div style="margin-top:12px">Witness 1: ___________________________</div>
          <div style="margin-top:12px">Witness 2: ___________________________</div>
        </div>

        <div style="margin-top:18px;font-size:0.9rem;color:#666">Contract Type: ${contractType}</div>
      </body>
      </html>`;

      // show an in-app preview modal instead of opening a new tab
      setContractHtml(html);
      setShowContractPreview(true);
    } catch (e) {
      console.error('Failed to generate contract', e);
      alert('Failed to generate contract. See console for details.');
    }
  };

  const handleSendContract = () => {
    // show preview and let user confirm before actually sending/clearing cart
    generateContract();
  };

  const downloadContract = () => {
    try {
      const blob = new Blob([contractHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'procurement-contract.html';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download failed', e);
      alert('Download failed. See console for details.');
    }
  };

  const printContract = () => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(contractHtml);
      doc.close();
      iframe.contentWindow.focus();
      // give time for render
      setTimeout(() => {
        try { iframe.contentWindow.print(); } catch (err) { console.warn('Print failed', err); }
        // remove iframe after a short delay
        setTimeout(() => { try { document.body.removeChild(iframe); } catch (e) {} }, 500);
      }, 250);
    } catch (e) {
      console.error('Print failed', e);
      alert('Print failed. See console for details.');
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
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <label style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Qty (kg)</label>
                                    <input type="number" step="0.001" value={editVal} onChange={e => setEditVal(e.target.value)} style={{ width: 120, padding: 6 }} />
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <label style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Price/kg</label>
                                    <input type="number" step="0.01" value={editPrice} onChange={e => setEditPrice(e.target.value)} style={{ width: 120, padding: 6 }} />
                                  </div>
                                </div>
                                <button onClick={() => saveEdit(it.id)} style={{ padding: '6px 8px', background: '#236902', color: '#fff', border: 'none', borderRadius: 6, marginLeft: 8 }}>Save</button>
                                <button onClick={cancelEdit} style={{ padding: '6px 8px', background: '#ddd', border: 'none', borderRadius: 6, marginLeft: 6 }}>Cancel</button>
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
                  
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Contract Type</div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="radio" name="contractType" value="one-time" checked={contractType === 'one-time'} onChange={() => setContractType('one-time')} /> One-time
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="radio" name="contractType" value="seasonal" checked={contractType === 'seasonal'} onChange={() => setContractType('seasonal')} /> Seasonal
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="radio" name="contractType" value="yearly" checked={contractType === 'yearly'} onChange={() => setContractType('yearly')} /> Yearly
                      </label>
                    </div>
                  </div>

                  <button onClick={handleSendContract} disabled={!items.length} style={{ marginTop: 12, width: '100%', background: '#236902', color: '#fff', padding: '10px 12px', borderRadius: 6, border: 'none' }}>
                    Send Contract
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      {showContractPreview && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ width: '94%', maxWidth: 960, maxHeight: '92%', background: '#fff', padding: 16, overflow: 'auto', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 800 }}>Contract Preview</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={downloadContract} style={{ padding: '6px 10px' }}>Download</button>
                <button onClick={printContract} style={{ padding: '6px 10px' }}>Print</button>
                <button onClick={() => setShowContractPreview(false)} style={{ padding: '6px 10px' }}>Close</button>
              </div>
            </div>
            <div style={{ border: '1px solid #eee', borderRadius: 6, padding: 12, background: '#fff' }} dangerouslySetInnerHTML={{ __html: contractHtml }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button onClick={() => { setShowContractPreview(false); handleBuyNow(); }} style={{ padding: '8px 12px', background: '#236902', color: '#fff', border: 'none', borderRadius: 6 }}>Confirm & Send</button>
              <button onClick={() => setShowContractPreview(false)} style={{ padding: '8px 12px', background: '#ddd', border: 'none', borderRadius: 6 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerCart;
