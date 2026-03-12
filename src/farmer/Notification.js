import React from 'react';
import Navbar from '../Navbar';
import { t } from '../i18n';

export default function Notification() {
  const [notifList, setNotifList] = React.useState([]);
  const [notifCount, setNotifCount] = React.useState(0);
  const [siteLang, setSiteLang] = React.useState(() => localStorage.getItem('agri_lang') || 'en');

  const farmerId = localStorage.getItem('agriai_id') || '';
  const userRole = localStorage.getItem('agriai_role') || '';

  const computeNetAmount = (name, category, quantityKg, pricePerKg) => {
    const qty = Number(quantityKg || 0);
    const price = Number(pricePerKg || 0);
    const subtotal = qty * price;
    const cat = (category || '').toString().toLowerCase();
    let gstRate = 0;
    let commissionRate = 0;
    if (cat.includes('masala') || cat.includes('masalas')) {
      gstRate = 5; commissionRate = 15;
    } else if (cat.includes('fruit') || cat.includes('vegetable')) {
      gstRate = 0; commissionRate = 12;
    } else if (cat.includes('crop') || cat.includes('crops')) {
      gstRate = 0; commissionRate = 8;
    } else {
      const nm = (name || '').toString().toLowerCase();
      if (nm.includes('masala')) { gstRate = 5; commissionRate = 15; }
      else if (nm.includes('fruit') || nm.includes('vegetable')) { gstRate = 0; commissionRate = 12; }
      else { gstRate = 0; commissionRate = 8; }
    }
    const gstAmt = (subtotal * gstRate) / 100;
    const platformFee = (subtotal * commissionRate) / 100;
    const net = subtotal - gstAmt - platformFee;
    return { subtotal, gstAmt, platformFee, net };
  };

  const getPlatformRate = (name, category) => {
    try {
      const cat = (category || '').toString().toLowerCase();
      const nm = (name || '').toString().toLowerCase();
      if (cat.includes('fruit') || nm.includes('fruit') || cat.includes('vegetable') || nm.includes('vegetable')) return 0.09;
      if (cat.includes('crop') || nm.includes('crop') || nm.includes('food') || nm.includes('grain') || nm.includes('rice') || nm.includes('wheat')) return 0.07;
      return 0.12;
    } catch (e) {
      return 0.12;
    }
  };

  const formatCurrency = (v) => `\u20b9${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const formatDateTime = (iso) => {
    try {
      const d = new Date(iso);
      if (isNaN(d)) return String(iso);
      return d.toLocaleString();
    } catch (e) { return String(iso); }
  };

  React.useEffect(() => {
    const load = async () => {
      let notifications = [];
      try {
        const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');
        if (userRole === 'farmer') {
          const qp = farmerId ? `farmer_id=${encodeURIComponent(farmerId)}` : (localStorage.getItem('agriai_phone') ? `farmer_phone=${encodeURIComponent(localStorage.getItem('agriai_phone'))}` : '');
          const res = await fetch(`${apiBase}/notifications/list?${qp}`);
          if (res && res.ok) {
            const j = await res.json().catch(() => null);
            if (j && j.ok && Array.isArray(j.notifications)) {
              notifications = j.notifications;
            }
          }
        } else {
          try {
            const raw = localStorage.getItem('agriai_notifications');
            const arr = raw ? JSON.parse(raw) : [];
            notifications = Array.isArray(arr) ? arr.filter(n => {
              if (n && n.buyer_id) return String(n.buyer_id) === String(farmerId);
              return !n.buyer_id;
            }) : [];
          } catch (e) { notifications = []; }
        }
      } catch (e) {
        console.warn('Failed to load notifications', e);
      }
      setNotifList(notifications);
      try { setNotifCount((Array.isArray(notifications) ? notifications.filter(x => !(x && Number(x.is_read))).length : 0)); } catch (e) {}
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [userRole, farmerId]);

  React.useEffect(() => {
    const onLang = (e) => {
      const l = (e && e.detail && e.detail.lang) ? e.detail.lang : (localStorage.getItem('agri_lang') || 'en');
      setSiteLang(l);
    };
    window.addEventListener('agri:lang:change', onLang);
    return () => { try { window.removeEventListener('agri:lang:change', onLang); } catch (e) {} };
  }, []);

  return (
    <>
      <Navbar />
      <div className="notifications-page" style={{padding:20, maxWidth:800, margin:'0 auto'}}>
        <h2>{t('Notifications', siteLang) || 'Notifications'}</h2>
        {(!notifList || !notifList.length) && (
          <div style={{padding:'30px 0', textAlign:'center', color:'#a2b2aa'}}>
            <div style={{fontSize:40}}>🛎️</div>
            <div style={{fontSize:16, fontWeight:600}}>{t('noNotifications', siteLang) || 'No notifications yet'}</div>
          </div>
        )}
        {Array.isArray(notifList) && notifList.map(n => {
          const items = Array.isArray(n.items) ? n.items : (n.items ? [n.items] : []);
          const computedSubtotal = items.reduce((s,it) => s + ((Number(it.price_per_kg||it._price_per_kg||0)) * Number(it.order_quantity||it.quantity_kg||0 || 0)), 0);
          let platformSum = 0; let gstSum = 0;
          items.forEach(it => {
            try {
              const price = Number(it.price_per_kg || it._price_per_kg || 0);
              const qty = Number(it.order_quantity || it.quantity_kg || 0) || 0;
              const total = price * qty;
              const rate = getPlatformRate(it.crop_name || it.name || '', it._category || it.category || it.cat || '');
              const platformFee = total * (Number(rate) || 0);
              const gst = platformFee * 0.18;
              platformSum += platformFee;
              gstSum += gst;
            } catch (e) {}
          });
          const computedGrandTotal = computedSubtotal - platformSum - gstSum;
          let grandTotal = computedGrandTotal;
          if (n.buyer_fee_total != null && n.total_amount_payable != null) {
            grandTotal = Number(n.total_amount_payable);
          } else if (n.contract_meta && n.contract_meta.totalAmountPayableByBuyer != null) {
            grandTotal = Number(n.contract_meta.totalAmountPayableByBuyer);
          }
          const totals = (n && n.totals && typeof n.totals === 'object') ? {
            subtotal: (n.totals.subtotal != null ? n.totals.subtotal : computedSubtotal),
            platform_fee: (n.totals.platform_fee != null ? n.totals.platform_fee : platformSum),
            gst: (n.totals.gst != null ? n.totals.gst : gstSum),
            grand_total: (n.totals.grand_total != null ? n.totals.grand_total : grandTotal)
          } : { subtotal: computedSubtotal, gst: gstSum, platform_fee: platformSum, grand_total: grandTotal };
          const contractNum = n.contract_number || n.invoice_id;
          const invoiceId = contractNum || (`INV${n.id || Date.now()}`);

          return (
            <div key={n.id || invoiceId} style={{border:'1px solid #e0e0e0', padding:12, marginBottom:12, borderRadius:8, background: n.is_read ? '#fafafa' : '#e8f5e9'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <strong>{invoiceId}</strong>
                <small>{formatDateTime(n.created_at || n.created_on)}</small>
              </div>
              <div>{n.crop_name || n.contract_nature || ''}</div>
              <div style={{fontSize:14, color:'#555'}}>{t('quantity', siteLang) || 'Quantity'}: {n.quantity_kg || ''}</div>
              <div style={{fontSize:14, color:'#555'}}>{t('total', siteLang) || 'Total'}: {formatCurrency(totals.grand_total)}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
