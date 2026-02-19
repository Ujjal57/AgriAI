import React from 'react';
import Navbar from './Navbar';
import logo from './assets/logo192.png'; // ✅ Import logo image
import { t } from './i18n';

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
    const [siteLang, setSiteLang] = (function(){
      // provide helper which persists across renders via closure
      const lang = localStorage.getItem('agri_lang') || 'en';
      return [lang, (v)=>{ try{ localStorage.setItem('agri_lang', v); }catch(e){} }];
    })();
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
                  // For buyer-backed rows: show available quantity from `total_quantity`
                  // and use `quantity_kg` as the selected/order quantity stored in the row.
                  quantity_kg: Number(r.total_quantity != null ? r.total_quantity : r.quantity_kg || 0),
                  price_per_kg: r.price_per_kg != null ? Number(r.price_per_kg) : 0,
                  image_url: r.image_path || r.image_url || '',
                  order_quantity: Number(r.quantity_kg || 0),
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

  // site language reactive helper: listen for global language changes
  React.useEffect(() => {
    const handler = (ev) => {
      try {
        const newLang = (localStorage.getItem('agri_lang') || 'en');
        // force re-render by dispatching a small state change using window property (avoid adding state variable)
        // We'll update a dummy custom event to notify components relying on translate calls.
        // (Simpler: trigger a cart update so components re-render)
        window.dispatchEvent(new Event('agriai:cart:update'));
      } catch (e) {}
    };
    window.addEventListener('agri:lang:change', handler);
    return () => { try { window.removeEventListener('agri:lang:change', handler); } catch (e) {} };
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

    const userRole = (typeof window !== 'undefined' && window.localStorage) ? (localStorage.getItem('agriai_role') || '') : '';
    const cat = (item.category || item.cat || '') .toString().toLowerCase();

    let gstRate = 0;
    let commissionRate = 0;

    // If signed in as buyer, do NOT apply item GST or platform commission in cart
    if (userRole === 'buyer') {
      gstRate = 0;
      commissionRate = 0;
    } else {
      // Farmer: apply platform fee rules
      if (cat.includes('masala') || cat.includes('masalas') || (item.crop_name || '').toString().toLowerCase().includes('masala')) {
        commissionRate = 12; // Masalas
        gstRate = 5; // item GST for masalas
      } else if (cat.includes('fruit') || cat.includes('vegetable') || (item.crop_name || '').toString().toLowerCase().includes('fruit') || (item.crop_name || '').toString().toLowerCase().includes('vegetable')) {
        commissionRate = 9; // Fruits & Vegetables
        gstRate = 0;
      } else if (cat.includes('food') || cat.includes('food crop') || cat.includes('food crops') || cat.includes('crop') || cat.includes('crops')) {
        commissionRate = 7; // Food Crops
        gstRate = 0;
      } else {
        // default to food crops
        commissionRate = 7;
        gstRate = 0;
      }
    }

    // compute amounts
    const itemGstAmt = (total * gstRate) / 100; // GST on item total
    const commissionAmt = (total * commissionRate) / 100; // platform fee
    const gstOnPlatformFee = commissionAmt * 0.18; // 18% GST on platform fee

    const gstAmt = itemGstAmt + gstOnPlatformFee;

    return { gstRate, commissionRate, gstAmt, commissionAmt, gstOnPlatformFee, lineTotal: total };
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
  const userRole = (typeof window !== 'undefined' && window.localStorage) ? (localStorage.getItem('agriai_role') || '') : '';

  // 🧾 Generate Invoice (with logo)
  const generateBill = () => {
    const invoiceId = 'ORD' + Date.now();
    const date = new Date().toLocaleString();

    // ✅ Embed the imported logo as a data URL (for display in print)
    const logoSrc = window.location.origin + logo;

    // compute delivery rate display (estimate) and labour charge for invoice
    const totalContractQty = totalOrderedQty;
    const qtyKg = Math.round(totalContractQty || 0);
    const qtyRateMap = [
      { min: 0, max: 40, rates: [12, 18, 22] },
      { min: 41, max: 400, rates: [18, 22, 28] },
      { min: 401, max: 1500, rates: [22, 28, 35] },
      { min: 1501, max: 5000, rates: [28, 35, 45] },
      { min: 5001, max: 10000, rates: [35, 45, 60] }
    ];
    let matching = qtyRateMap.find(r => qtyKg >= r.min && qtyKg <= r.max);
    if (!matching) matching = qtyRateMap[qtyRateMap.length - 1];
    const formatRates = (arr) => {
      const parts = (arr || []).map(v => `₹${v} / km`);
      if (parts.length === 0) return '₹-- / km';
      if (parts.length === 1) return parts[0];
      if (parts.length === 2) return `${parts[0]} or ${parts[1]}`;
      return `${parts.slice(0, -1).join(', ')} or ${parts[parts.length - 1]}`;
    };
    const deliveryRateDisplay = `${formatRates(matching.rates)}`;

    const computeLabourCharge = (q) => {
      if (!Number.isFinite(q) || q <= 0) return 0;
      if (q <= 100) return 40;
      if (q <= 1000) return 750;
      return Math.round(750 + ((q - 1000) / 1000) * 300);
    };
    const labourCharge = computeLabourCharge(qtyKg);

    const userRoleForBill = (typeof window !== 'undefined' && window.localStorage) ? (localStorage.getItem('agriai_role') || '') : '';
    const includeFeesInBill = userRoleForBill !== 'buyer';

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
            .infoBtn { margin-left: 8px; border: 0; background: #1976d2; color: #fff; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; line-height: 18px; cursor: pointer; }
            .modal { position: fixed; left: 0; top: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; z-index: 10000; background: rgba(0,0,0,0.5); }
            .modal-content { width: 92%; max-width: 760px; background: #fff; border-radius: 8px; padding: 18px; box-shadow: 0 12px 40px rgba(0,0,0,0.25); overflow: auto; }
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
                ${includeFeesInBill ? '<th>GST</th><th>Platform Fee</th>' : ''}
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
          ${includeFeesInBill ? `<td>₹${gstAmt.toFixed(2)}</td><td>₹${commissionAmt.toFixed(2)}</td>` : ''}
          <td>₹${itemTotal.toFixed(2)}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
      <h3 style="text-align:right;margin-top:10px;">
        ${includeFeesInBill ? `GST Total: ₹${totals.gst.toFixed(2)}<br>Platform Fee: ₹${totals.commission.toFixed(2)}<br>` : ''}
        <span style="color:#236902;">Grand Total: ₹${grandTotal.toFixed(2)}</span>
      </h3>

      <div style="margin-top:8px;">
        <strong>Delivery / Logistics Charges (Payable After Delivery):</strong> ${deliveryRateDisplay} <button class="infoBtn" onclick="showDeliveryInfo()" aria-label="Delivery info">i</button><br/>
        
      </div>

      <div class="footer">
        <p><strong>Payment Method:</strong> ${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'}</p>
        <p>Thank you for choosing Agri AI!<br>We connect farmers and buyers with trust.</p>
      </div>

      <button id="printBtn" onclick="window.print()">Print / Save as PDF</button>

      <div id="deliveryModal" class="modal" style="display: none;">
        <div class="modal-content">
          <div style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px;">
            <div style="flex: 1;">
              <h3 style="margin: 0 0 8px 0; color: #236902;">Delivery & Logistics Charges</h3>
              <div style="font-size: 14px; color: #111; line-height: 1.5;">
                <div style="overflow: auto;">
                  <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 14px; text-align: center;">
                    <thead>
                      <tr>
                        <th style="border: 1px solid #ddd; padding: 8px; background: #f7f7f7; text-align: center;">Vehicle Type</th>
                        <th style="border: 1px solid #ddd; padding: 8px; background: #f7f7f7; text-align: center;">Typical Distance Range (km)</th>
                        <th style="border: 1px solid #ddd; padding: 8px; background: #f7f7f7; text-align: center;">Vehicle Capacity</th>
                        <th style="border: 1px solid #ddd; padding: 8px; background: #f7f7f7; text-align: center;">FIXED Cost per km (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td style="border: 1px solid #ddd; padding: 8px;">Bike Courier</td><td style="border: 1px solid #ddd; padding: 8px;">0 – 20 km</td><td style="border: 1px solid #ddd; padding: 8px;">Up to 40 kg</td><td style="border: 1px solid #ddd; padding: 8px;"><strong>₹12 / km</strong></td></tr>
                      <tr><td style="border: 1px solid #ddd; padding: 8px;">3-Wheeler Cargo (Auto / Ape)</td><td style="border: 1px solid #ddd; padding: 8px;">0 – 80 km</td><td style="border: 1px solid #ddd; padding: 8px;">0 – 400 kg</td><td style="border: 1px solid #ddd; padding: 8px;"><strong>₹18 / km</strong></td></tr>
                      <tr><td style="border: 1px solid #ddd; padding: 8px;">Mini Truck (Tata Ace / Pickup)</td><td style="border: 1px solid #ddd; padding: 8px;">0 – 100 km</td><td style="border: 1px solid #ddd; padding: 8px;">40 – 1500 kg</td><td style="border: 1px solid #ddd; padding: 8px;"><strong>₹22 / km</strong></td></tr>
                      </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div style="flex: 0 0 auto; margin-top: 12px;">
              <button onclick="hideDeliveryInfo()" style="background: #236902; color: #fff; border: none; border-radius: 6px; padding: 8px 10px; cursor: pointer; display: inline-block;">Close</button>
            </div>
          </div>
        </div>
      </div>

      <script>
        function showDeliveryInfo() {
          document.getElementById('deliveryModal').style.display = 'flex';
        }
        function hideDeliveryInfo() {
          document.getElementById('deliveryModal').style.display = 'none';
        }
      </script>
    </body>
  </html>
  `;

    const newWindow = window.open('', '_blank');
    newWindow.document.write(html);
    newWindow.document.close();
  };

  const sendContract = () => {
    try {
      const startDateObj = new Date();
      const startDate = startDateObj.toLocaleDateString('en-GB');
      const days = 30;
      const endDateObj = new Date(Date.now() + days * 24 * 3600 * 1000);
      const endDate = endDateObj.toLocaleDateString('en-GB');

      const totalContractQty = totalOrderedQty;
      const totalCropTradeValue = items.reduce((s, it) => s + ((Number(it.order_quantity || 0) || 0) * (Number(it.price_per_kg || 0) || 0)), 0);
      const avgPricePerKg = totalContractQty > 0 ? (totalCropTradeValue / totalContractQty) : 0;

      const qtyKg = Math.round(totalContractQty || 0);
      const qtyRateMap = [
        { min: 0, max: 40, rates: [12, 18, 22] },
        { min: 41, max: 400, rates: [18, 22, 28] },
        { min: 401, max: 1500, rates: [22, 28, 35] },
        { min: 1501, max: 5000, rates: [28, 35, 45] },
        { min: 5001, max: 10000, rates: [35, 45, 60] }
      ];
      let matching = qtyRateMap.find(r => qtyKg >= r.min && qtyKg <= r.max);
      if (!matching) matching = qtyRateMap[qtyRateMap.length - 1];
      const formatRates = (arr) => {
        const parts = (arr || []).map(v => `₹${v} / km`);
        if (parts.length === 0) return '₹-- / km';
        if (parts.length === 1) return parts[0];
        if (parts.length === 2) return `${parts[0]} or ${parts[1]}`;
        return `${parts.slice(0, -1).join(', ')} or ${parts[parts.length - 1]}`;
      };
      const deliveryRateDisplay = `${formatRates(matching.rates)}`;

      const logoSrc = window.location.origin + logo;

      const rowsHtml = (items || []).map((it, idx) => {
        const qty = Number(it.order_quantity || 0) || 0;
        const variety = it.variety || it.Variety || '';
        const price = Number(it.price_per_kg || 0) || 0;
        const amount = Math.round((qty * price + Number.EPSILON) * 100) / 100;
        return `<tr>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${idx + 1}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${it.crop_name || ''}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${variety}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${qty.toLocaleString('en-IN')} kg</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${formatCurrency(price)}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${formatCurrency(amount)}</td>
        </tr>`;
      }).join('');

      const html = `<!doctype html><html><head><meta charset="utf-8" /><title>Procurement Contract</title></head><body style="font-family:'Times New Roman', Times, serif;color:#111;padding:24px;line-height:1.6;">
        <div style="text-align:center;margin-bottom:20px;">
          <img src="${logoSrc}" alt="AgriAI" style="width:120px;height:auto;margin-bottom:8px" />
          <h1 style="color:#236902;margin:0;">Agri AI<br/>PROCUREMENT CONTRACT FARMING AGREEMENT</h1>
        </div>
        <section><h2>PARTIES</h2>
          <p><strong>Party A – Buyer / Company</strong></p>
          <p><b>Name:</b> ${localStorage.getItem('agriai_name') || '[Buyer Name]'}</p>
          <p><b>Buyer ID:</b> ${localStorage.getItem('agriai_id') || ''}</p>
          <p><b>Address:</b> ${localStorage.getItem('agriai_address') || ''}</p>
          <p><strong>Party B – Farmer / Producer</strong></p>
          <p><b>Name:</b> ${sellerInfo.name || ''}</p>
          <p><b>Farmer ID:</b> ${sellerInfo.id || ''}</p>
          <p><b>Address:</b> ${sellerInfo.state || ''}${sellerInfo.region ? ', ' + sellerInfo.region : ''}</p>
        </section>
        <section><h2>4. COMMODITY DETAILS</h2>
          <table style="border-collapse:collapse;width:100%;margin-top:12px;"><thead><tr><th style="padding:8px;border:1px solid #ddd;text-align:center">Sl. No</th><th style="padding:8px;border:1px solid #ddd;text-align:center">Crop Name</th><th style="padding:8px;border:1px solid #ddd;text-align:center">Variety</th><th style="padding:8px;border:1px solid #ddd;text-align:center">Quantity</th><th style="padding:8px;border:1px solid #ddd;text-align:center">Price (₹/kg)</th><th style="padding:8px;border:1px solid #ddd;text-align:center">Amount</th></tr></thead><tbody>${rowsHtml}</tbody></table>
        </section>
        <section><h2>5. PRICE & PAYMENT TERMS</h2>
          <p>Price: ${formatCurrency(avgPricePerKg)} per kg</p>
          <p>Total Contract Quantity: ${totalContractQty.toLocaleString('en-IN')} kg</p>
          <p><strong>Total Crop Trade Value (GST Exempt): ${formatCurrency(totalCropTradeValue)}</strong></p>
          <p>Delivery / Logistics Charges (Payable After Delivery): ${deliveryRateDisplay}</p>
        </section>
        <section><p>Start Date: ${startDate}</p><p>End Date: ${endDate}</p><p>Duration: ${days} Days</p></section>
      </body></html>`;

      const newWindow = window.open('', '_blank');
      newWindow.document.write(html);
      newWindow.document.close();
    } catch (e) {
      console.error('sendContract failed', e);
      alert('Failed to open contract. See console.');
    }
  };

  const handleBuyNow = () => {
    setPaymentError('');
    if (!paymentMethod) {
      setPaymentError(t('selectPaymentMethod', (localStorage.getItem('agri_lang') || 'en')));
      return;
    }

    const invalid = items.some(it => !it.order_quantity || Number(it.order_quantity) <= 0);
    if (invalid) {
      alert(t('editEnterOrderQty', (localStorage.getItem('agri_lang') || 'en')));
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
          farmer_id: it.user_id || it.seller_id || it._farmer_id || null,
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
        const siteLang = localStorage.getItem('agri_lang') || 'en';
        fetch(`${apiBase}/notifications/purchase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Agri-Lang': siteLang },
          body: JSON.stringify({ invoice_id: invoiceId, lang: siteLang, buyer, items: orderItems.map(({ id, crop_name, order_quantity, variety, farmer_id }) => ({ id, crop_name, order_quantity, variety, farmer_id })) })
        }).catch(() => {});
      
        // Also add local notifications so farmers see the invoice/details immediately
        try {
          const localKey = 'agriai_notifications';
          const rawLocal = localStorage.getItem(localKey);
          const localArr = rawLocal ? JSON.parse(rawLocal) : [];
          const byFarmer = {};
          orderItems.forEach(it => {
            const fid = it.farmer_id || 'unknown';
            if (!byFarmer[fid]) byFarmer[fid] = [];
            byFarmer[fid].push(it);
          });
          Object.keys(byFarmer).forEach((fid, idx) => {
            const group = byFarmer[fid];
            const qty = group.reduce((s, x) => s + (Number(x.order_quantity||0)||0), 0);
            const subtotal = group.reduce((s, x) => s + (Number(x.subtotal||0)||0), 0);
            const notif = {
              id: `N${Date.now()}${idx}`,
              invoice_id: invoiceId,
              created_at: createdAt,
              farmer_id: fid === 'unknown' ? null : fid,
              buyer_name: buyer.name || '',
              buyer_id: buyer.id || null,
              items: group,
              quantity_kg: qty,
              _subtotal: subtotal,
              crop_name: group[0] ? group[0].crop_name : 'Order'
            };
            localArr.unshift(notif);
          });
          try { localStorage.setItem(localKey, JSON.stringify(localArr)); } catch (e) {}
          try { window.dispatchEvent(new Event('agriai:notifications:local:update')); } catch (e) {}
        } catch (e) { /* ignore */ }
      } catch (e) { /* ignore */ }

      // Clear cart locally
      localStorage.setItem('agriai_cart_buyer', JSON.stringify([]));
      setItems([]);
      // Clear server-side cart for buyer as well (if signed in)
      try { clearCart(); } catch (e) { console.warn('clearCart call failed', e); }

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
      alert(t('purchaseFailed', (localStorage.getItem('agri_lang') || 'en')));
    }
  };

  return (
    <div style={{ fontFamily: 'Times New Roman, serif', background: '#53b635', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ padding: '6rem 1rem 2rem' }}>
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          background: '#fff',
          padding: '1.25rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 60, flexWrap: 'wrap', position: 'relative', padding: '2px 0 10px', minHeight: 64 }}>
            <h1 style={{ color: '#236902', margin: 0, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>{t('cartTitle', (localStorage.getItem('agri_lang') || 'en'))}</h1>
            {items.length > 0 && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto', zIndex: 2 }}>
                <button onClick={() => window.location.href = '/dashboard/farmer'} style={{ background: '#fff', border: '1px solid #dfeadf', color: '#236902', padding: '6px 10px', borderRadius: 6 }}>{t('continueShopping', (localStorage.getItem('agri_lang') || 'en'))}</button>
                <button onClick={clearCart} style={{ background: '#fff', border: '1px solid #f0dede', color: '#d32f2f', padding: '6px 10px', borderRadius: 6 }}>{t('clearCart', (localStorage.getItem('agri_lang') || 'en'))}</button>
              </div>
            )}
          </div>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <div style={{ fontSize: 52, lineHeight: 1 }}>🧺</div>
              <p style={{ marginTop: 8 }}>{t('cartEmptyMessage', (localStorage.getItem('agri_lang') || 'en'))}</p>
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
                          <div style={{ color: '#999' }}>{t('noImage', (localStorage.getItem('agri_lang') || 'en'))}</div>
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
                          {formatCurrency(it.price_per_kg)} / {t('kg', (localStorage.getItem('agri_lang') || 'en'))}
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          {userRole !== 'buyer' && (
                            <>
                              <div style={{ fontSize: 13, color: '#555' }}>{t('tableGst', (localStorage.getItem('agri_lang') || 'en'))}: {gstRate}% ({formatCurrency(gstAmt)})</div>
                              <div style={{ fontSize: 13, color: '#555' }}>{t('tablePlatformFee', (localStorage.getItem('agri_lang') || 'en'))}: {formatCurrency(commissionAmt)}</div>
                            </>
                          )}
                          <div style={{ fontSize: 13, color: '#000', fontWeight: 700 }}>{t('itemTotalLabel', (localStorage.getItem('agri_lang') || 'en'))} {formatCurrency(lineTotal + gstAmt + commissionAmt)}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: 220 }}>
                        <div style={{ fontWeight: 700 }}>
                          {t('availableLabel', (localStorage.getItem('agri_lang') || 'en'))} {Number(it.quantity_kg || 0).toLocaleString('en-IN')} {t('kg', (localStorage.getItem('agri_lang') || 'en'))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 6 }}>
                          <button onClick={() => updateQuantity(it.id, -1)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e5e5', background: '#fff' }}>-</button>
                          <div style={{ minWidth: 60, textAlign: 'center', fontWeight: 800 }}>{Number(it.order_quantity || 0).toLocaleString('en-IN')} {t('kg', (localStorage.getItem('agri_lang') || 'en'))}</div>
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
                              >{t('saveButton', (localStorage.getItem('agri_lang') || 'en'))}</button>
                              <button
                                onClick={cancelEdit}
                                style={{
                                  padding: '6px 8px',
                                  background: '#ddd',
                                  border: 'none',
                                  borderRadius: 6
                                }}
                              >{t('cancelButton', (localStorage.getItem('agri_lang') || 'en'))}</button>
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
                              >{t('editButton', (localStorage.getItem('agri_lang') || 'en'))}</button>
                              <button
                                onClick={() => removeItem(it.id)}
                                style={{
                                  background: '#fff',
                                  border: '1px solid #d32f2f',
                                  color: '#d32f2f',
                                  padding: '6px 10px',
                                  borderRadius: 6
                                }}
                              >{t('deleteButton', (localStorage.getItem('agri_lang') || 'en'))}</button>
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
                  <div style={{ fontWeight: 800, color: '#236902', marginBottom: 8 }}>{t('orderSummary', (localStorage.getItem('agri_lang') || 'en'))}</div>
                  <div style={{ display: 'grid', gap: 6, fontWeight: 700 }}>
                    <div>{t('totalItemsLabel', (localStorage.getItem('agri_lang') || 'en'))} {items.length}</div>
                    <div>{t('totalAvailableLabel', (localStorage.getItem('agri_lang') || 'en'))} {Number(totalAvailableQty).toLocaleString('en-IN')} {t('kg', (localStorage.getItem('agri_lang') || 'en'))}</div>
                    <div>{t('totalOrderedLabel', (localStorage.getItem('agri_lang') || 'en'))} {Number(totalOrderedQty).toLocaleString('en-IN')} {t('kg', (localStorage.getItem('agri_lang') || 'en'))}</div>
                    {userRole !== 'buyer' && <div>{t('gstTotalLabel', (localStorage.getItem('agri_lang') || 'en'))} {formatCurrency(totals.gst)}</div>}
                    {userRole !== 'buyer' && <div>{t('platformFeeLabel', (localStorage.getItem('agri_lang') || 'en'))} {formatCurrency(totals.commission)}</div>}
                    <div style={{ fontSize: 18, color: '#236902', marginTop: 6 }}>{t('grandTotalLabel', (localStorage.getItem('agri_lang') || 'en'))} {formatCurrency(grandTotal)}</div>
                </div>

                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                      {t('paymentMethod', (localStorage.getItem('agri_lang') || 'en'))} <span style={{ color: 'crimson' }}>*</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="radio"
                        name="payment"
                        value="online"
                        checked={paymentMethod === 'online'}
                        onChange={() => { setPaymentMethod('online'); setPaymentError(''); }}
                      /> {t('online', (localStorage.getItem('agri_lang') || 'en'))}
                    </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={() => { setPaymentMethod('cod'); setPaymentError(''); }}
                      /> {t('cashOnDelivery', (localStorage.getItem('agri_lang') || 'en'))}
                    </label>
                    </div>
                    {paymentError && <div style={{ color: 'crimson', marginTop: 6 }}>{paymentError}</div>}
                  </div>

                    {userRole === 'buyer' && totalOrderedQty > 40 ? (
                      <button
                        onClick={sendContract}
                        disabled={!items.length}
                        style={{
                          marginTop: 12,
                          width: '100%',
                          background: '#1976d2',
                          color: '#fff',
                          padding: '10px 12px',
                          borderRadius: 6,
                          border: 'none'
                        }}
                      >
                        Send Contract
                      </button>
                    ) : (
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
                    )}
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
