import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import Navbar from './Navbar';
import logo from './assets/logo192.png';
import { t } from './i18n';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  * { box-sizing: border-box; }

  .hist-root {
    min-height: 100vh;
    font-family: 'Inter', sans-serif;
    background: linear-gradient(135deg, #0a2e0a 0%, #1a5c10 30%, #2d8a1f 60%, #53b635 100%);
    background-attachment: fixed;
    position: relative;
    overflow-x: hidden;
  }
  .hist-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse at 20% 20%, rgba(83,182,53,0.18) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 80%, rgba(35,105,2,0.22) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  .hist-orb {
    position: fixed;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.18;
    pointer-events: none;
    z-index: 0;
    animation: histFloatOrb 12s ease-in-out infinite;
  }
  .hist-orb-1 { width:400px;height:400px;background:#53b635;top:-100px;left:-100px;animation-delay:0s; }
  .hist-orb-2 { width:300px;height:300px;background:#236902;bottom:10%;right:-80px;animation-delay:4s; }
  .hist-orb-3 { width:250px;height:250px;background:#8fdb5e;top:40%;left:60%;animation-delay:8s; }
  @keyframes histFloatOrb {
    0%,100%{transform:translate(0,0) scale(1);}
    33%{transform:translate(30px,-20px) scale(1.05);}
    66%{transform:translate(-20px,30px) scale(0.95);}
  }

  .hist-leaf {
    position: fixed;
    width:10px;height:10px;
    opacity:0;pointer-events:none;z-index:0;
    animation:histLeafFall linear infinite;
  }
  .hist-leaf::before{content:'🌿';font-size:16px;}
  .hist-leaf-1{left:5%;animation-duration:14s;animation-delay:0s;}
  .hist-leaf-2{left:20%;animation-duration:18s;animation-delay:3s;}
  .hist-leaf-3{left:40%;animation-duration:12s;animation-delay:6s;}
  .hist-leaf-4{left:65%;animation-duration:16s;animation-delay:1s;}
  .hist-leaf-5{left:85%;animation-duration:20s;animation-delay:9s;}
  @keyframes histLeafFall {
    0%{transform:translateY(-40px) rotate(0deg);opacity:0;}
    10%{opacity:0.6;}
    90%{opacity:0.3;}
    100%{transform:translateY(110vh) rotate(720deg);opacity:0;}
  }

  .hist-main {
    position: relative;
    z-index: 1;
    padding: 5rem 1.5rem 3rem;
    max-width: 1100px;
    margin: 0 auto;
    animation: histFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes histFadeUp {
    from{opacity:0;transform:translateY(32px);}
    to{opacity:1;transform:translateY(0);}
  }

  .hist-glass {
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(20px) saturate(1.6);
    -webkit-backdrop-filter: blur(20px) saturate(1.6);
    border-radius: 24px;
    border: 1px solid rgba(255,255,255,0.6);
    box-shadow:
      0 8px 32px rgba(35,105,2,0.12),
      0 32px 64px rgba(0,0,0,0.08),
      inset 0 1px 0 rgba(255,255,255,0.8);
    padding: 2.5rem;
  }

  .hist-title {
    text-align: center;
    font-size: 2.2rem;
    font-weight: 800;
    color: transparent;
    background: linear-gradient(135deg, #1a5c10 0%, #236902 50%, #53b635 100%);
    -webkit-background-clip: text;
    background-clip: text;
    margin: 0 0 1.75rem;
    letter-spacing: -0.5px;
  }

  /* Search / filter bar */
  .hist-filter-bar {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.75rem;
  }
  .hist-search-input {
    flex: 1 1 280px;
    min-width: 220px;
    padding: 10px 14px;
    border: 1.5px solid #d4edcc;
    border-radius: 10px;
    font-size: 0.9rem;
    font-family: inherit;
    background: rgba(255,255,255,0.95);
    color: #1a3d0a;
    outline: none;
    transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s;
  }
  .hist-search-input:focus {
    border-color: #53b635;
    box-shadow: 0 0 0 3px rgba(83,182,53,0.18);
    transform: translateY(-2px);
  }
  .hist-filter-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .hist-filter-label {
    font-size: 0.78rem;
    font-weight: 700;
    color: #2d5c1a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }
  .hist-filter-select {
    padding: 10px 14px;
    border: 1.5px solid #d4edcc;
    border-radius: 10px;
    font-size: 0.9rem;
    font-family: inherit;
    background: rgba(255,255,255,0.95);
    color: #1a3d0a;
    outline: none;
    transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s;
  }
  .hist-filter-select:focus {
    border-color: #53b635;
    box-shadow: 0 0 0 3px rgba(83,182,53,0.18);
    transform: translateY(-2px);
  }

  /* Empty state */
  .hist-empty {
    text-align: center;
    padding: 4rem 2rem;
    color: #6b9b5a;
    animation: histFadeUp 0.6s ease both;
  }
  .hist-empty-icon { font-size: 4rem; display: block; margin-bottom: 1rem; opacity: 0.6; }
  .hist-empty-text { font-size: 1rem; font-weight: 600; }

  /* Orders list */
  .hist-orders-list { display: grid; gap: 16px; }

  /* Order card */
  .hist-order-card {
    background: #fff;
    border-radius: 16px;
    border: 1px solid rgba(83,182,53,0.15);
    box-shadow: 0 4px 16px rgba(35,105,2,0.07);
    overflow: hidden;
    transition: transform 0.35s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.35s;
    animation: histCardIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes histCardIn {
    from{opacity:0;transform:translateY(20px) scale(0.97);}
    to{opacity:1;transform:translateY(0) scale(1);}
  }
  .hist-order-card:hover {
    transform: translateY(-4px) scale(1.005);
    box-shadow: 0 16px 40px rgba(35,105,2,0.14);
  }

  /* Card header row */
  .hist-card-header {
    padding: 12px 16px;
    background: linear-gradient(135deg, rgba(234,246,234,0.7) 0%, rgba(255,255,255,0.5) 100%);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    border-bottom: 1px solid rgba(83,182,53,0.1);
  }
  .hist-card-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .hist-invoice-id {
    font-weight: 800;
    color: #236902;
    font-size: 0.95rem;
  }
  .hist-date-text {
    font-size: 0.82rem;
    color: #4a7a3a;
    font-weight: 600;
  }
  .hist-payment-badge {
    background: linear-gradient(135deg, #eaf6ea, #d4f0d4);
    color: #236902;
    padding: 3px 10px;
    border-radius: 999px;
    font-weight: 700;
    font-size: 0.78rem;
    border: 1px solid rgba(83,182,53,0.25);
    white-space: nowrap;
  }

  .hist-card-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .hist-total-amount {
    font-weight: 800;
    color: #236902;
    font-size: 1rem;
  }
  .hist-btn-invoice {
    padding: 7px 12px;
    background: linear-gradient(135deg,#1565c0,#1976d2);
    color: #fff;
    border: none;
    border-radius: 9px;
    font-size: 0.82rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(25,118,210,0.25);
    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s;
  }
  .hist-btn-invoice:hover { transform:translateY(-2px) scale(1.04); box-shadow:0 6px 16px rgba(25,118,210,0.35); }
  .hist-btn-toggle {
    padding: 7px 12px;
    background: #fff;
    color: #236902;
    border: 1.5px solid #d4edcc;
    border-radius: 9px;
    font-size: 0.82rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), border-color 0.18s, box-shadow 0.18s;
  }
  .hist-btn-toggle:hover { transform:translateY(-2px) scale(1.04); border-color:#53b635; box-shadow:0 4px 12px rgba(35,105,2,0.12); }

  /* Expanded details */
  .hist-card-details {
    padding: 14px 16px;
    overflow-x: auto;
  }
  .hist-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.88rem;
  }
  .hist-table th {
    border: 1px solid rgba(83,182,53,0.2);
    padding: 9px 10px;
    background: linear-gradient(135deg,#f5fbf3,#edf7ea);
    color: #2d5c1a;
    font-weight: 700;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    text-align: center;
  }
  .hist-table td {
    border: 1px solid rgba(83,182,53,0.1);
    padding: 9px 10px;
    text-align: center;
    color: #1a3d0a;
    font-weight: 600;
  }
  .hist-table tr:hover td { background: rgba(234,246,234,0.4); }

  .hist-grand-total {
    text-align: right;
    margin-top: 12px;
    font-size: 1.05rem;
    font-weight: 800;
    color: #236902;
    background: linear-gradient(135deg,#eaf6ea,#d4f0d4);
    border: 1px solid rgba(83,182,53,0.25);
    border-radius: 10px;
    padding: 9px 14px;
    display: inline-block;
    float: right;
  }
  .hist-clear { clear: both; }

  @media (max-width: 768px) {
    .hist-glass { padding: 1.5rem; }
    .hist-title { font-size: 1.6rem; }
    .hist-filter-bar { flex-direction: column; align-items: stretch; }
    .hist-search-input { min-width: unset; }
  }
`;

export default function History() {
  const [orders, setOrders] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [expanded, setExpanded] = React.useState({});
  const [siteLang, setSiteLang] = React.useState(() => localStorage.getItem('agri_lang') || 'en');

  React.useEffect(() => {
    const onLang = (e) => {
      const l = (e && e.detail && e.detail.lang) ? e.detail.lang : (localStorage.getItem('agri_lang') || 'en');
      setSiteLang(l);
    };
    window.addEventListener('agri:lang:change', onLang);
    return () => { try { window.removeEventListener('agri:lang:change', onLang); } catch (e) {} };
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const signedId = localStorage.getItem('agriai_id');
        const signedPhone = localStorage.getItem('agriai_phone');
        if (!signedId && !signedPhone) {
          if (mounted) setOrders([]);
          return;
        }

        const apiBase = process.env.REACT_APP_API_BASE || (window.__AGRIAI_API_BASE__ || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000'));
        const params = signedId ? `buyer_id=${encodeURIComponent(signedId)}` : `buyer_email=${encodeURIComponent(signedPhone)}`;
        
        // Fetch contracts from contract_b table
        const contractBResp = await fetch(`${apiBase}/buyer/contracts-b?${params}`);
        if (!contractBResp.ok) {
          throw new Error(`HTTP ${contractBResp.status} from contracts-b`);
        }
        const contractBData = await contractBResp.json();
        if (!contractBData.ok) {
          throw new Error(contractBData.error || 'Failed to fetch contracts-b');
        }

        // Fetch contracts from contracts table
        const contractsResp = await fetch(`${apiBase}/buyer/contracts?${params}`);
        if (!contractsResp.ok) {
          throw new Error(`HTTP ${contractsResp.status} from contracts`);
        }
        const contractsData = await contractsResp.json();
        if (!contractsData.ok) {
          throw new Error(contractsData.error || 'Failed to fetch contracts');
        }

        // Transform contracts from contract_b table
        const contractBList = contractBData.contracts || [];
        const transformedContractB = contractBList.map(contract => ({
          invoice_id: contract.contract_number,
          contract_number: contract.contract_number,
          created_at: contract.created_at,
          status: contract.status,
          buyer_id: contract.buyer_id,
          buyer_name: contract.buyer_name,
          farmer_id: contract.farmer_id,
          farmer_phone: contract.farmer_phone,
          farmer_name: contract.farmer_name,
          crop_id: contract.crop_id,
          crop_name: contract.crop_name,
          variety: contract.variety,
          quantity_kg: contract.quantity_kg,
          sender: contract.sender ? contract.sender.toString().trim().toLowerCase() : '',
          items: [{
            crop_name: contract.crop_name,
            variety: contract.variety,
            order_quantity: contract.quantity_kg,
            price_per_kg: contract.amount / contract.quantity_kg,
            total: contract.amount
          }],
          totals: {
            subtotal: contract.amount,
            gst: contract.buyer_gst || 0,
            platform_fee: contract.buyer_platform_fee || 0,
            grand_total: contract.buyer_total || contract.amount
          },
          payment_method: 'online',
          source_table: 'contract_b',
          _db_contract: contract
        }));

        // Transform contracts from contracts table - filter for accepted/rejected status
        const contractsList = contractsData.contracts || [];
        const transformedContracts = contractsList
          .filter(contract => {
            const status = (contract.status || '').toLowerCase();
            return status === 'accepted' || status === 'rejected';
          })
          .map(contract => ({
            invoice_id: contract.contract_number,
            contract_number: contract.contract_number,
            created_at: contract.created_at || contract.updated_at,
            status: contract.status,
            buyer_id: contract.buyer_id,
            buyer_name: contract.buyer_name,
            farmer_id: contract.farmer_id,
            farmer_phone: contract.farmer_phone,
            farmer_name: contract.farmer_name,
            crop_id: contract.crop_id,
            crop_name: contract.crop_name,
            variety: contract.variety,
            quantity_kg: contract.quantity_kg,
            sender: contract.sender ? contract.sender.toString().trim().toLowerCase() : '',
            items: [{
              crop_name: contract.crop_name,
              variety: contract.variety,
              order_quantity: contract.quantity_kg,
              price_per_kg: contract.price_per_kg || (contract.amount / contract.quantity_kg),
              total: contract.amount
            }],
            totals: {
              subtotal: contract.amount,
              gst: contract.buyer_gst || 0,
              platform_fee: contract.buyer_platform_fee || 0,
              grand_total: contract.buyer_total || contract.amount
            },
            payment_method: 'online',
            source_table: 'contracts',
            _db_contract: contract
          }));

        // Combine both lists and sort by latest date
        const allOrders = [...transformedContractB, ...transformedContracts]
          .sort((a, b) => {
            const getDate = (row) => {
              const dt = row.created_at || (row._db_contract && row._db_contract.updated_at) || row.updated_at || row.contract_datetime;
              const parsed = new Date(dt);
              return isNaN(parsed) ? 0 : parsed.getTime();
            };
            return getDate(b) - getDate(a);
          });

        if (mounted) setOrders(allOrders);
      } catch (e) {
        console.error('Error fetching contracts:', e);
        if (mounted) setOrders([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const formatDateTime = (iso) => {
    try {
      const d = new Date(iso);
      if (isNaN(d)) return String(iso);
      return d.toLocaleDateString('en-GB');
    } catch (e) { return String(iso); }
  };

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
      const candidates = [`variety${Normal}`, `variety_${raw.toLowerCase().replace(/\s+/g,'_')}`, raw];
      for (let k of candidates) {
        try { const out = t(k, siteLang); if (out && out !== k) return out; } catch (e) {}
      }
      return raw;
    } catch (e) { return val || ''; }
  };

  const getContractHtml = (lang, {
    logo192,
    contractNumber,
    signatureDate,
    buyerName,
    buyerId,
    buyerAddress,
    farmerName,
    farmerId,
    farmerAddress,
    contractNature,
    contractDuration,
    startDate,
    endDate,
    days,
    rowsHtml,
    totalContractQty,
    avgPricePerKg,
    displayFarmerCommission,
    displayFarmerGst,
    displayNetAmountToFarmer,
    displayBuyerCommission,
    displayBuyerGst,
    totalAmountPayableByBuyer,
    languageName,
    dbContract,
    order
  }) => {
    const tr = (en, hi, kn) => lang === 'hi' ? hi : (lang === 'kn' ? kn : en);
    const contractNatureLabel = contractNature === 'pre-harvest'
      ? tr('Pre-Harvest Production Contract', 'प्री-हेरस्ट उत्पादन अनुबंध', 'ಪೂರ್ವಗಾರಿಕೆ ಉತ್ಪಾದನಾ ಒಪ್ಪಂದ')
      : tr('Post-Harvest Procurement Contract', 'पोस्ट-हेरस्ट क्रय अनुबंध', 'ಹಿಣುಗಾರಿಕೆ కొనుగೊಳನೆ ಒಪ್ಪಂದ');
    const contractDurationLabel = contractDuration === 'one-time'
      ? tr('One-Time', 'एक बार', 'ಒಮ್ಮೆ')
      : contractDuration === 'seasonal'
        ? tr('Seasonal', 'मौसमी', 'ಅವಧಿವಾರು')
        : tr('Yearly', 'वार्षिक', 'ವಾರ್ಷಿಕ');

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>AgriAI Contract</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      color: #1a1a1a;
      line-height: 1.8;
      background: #fff;
      padding: 20px 20px;
      max-width: 1000px;
      margin: 0 auto;
    }
    @page {
      size: A4;
      margin: 20mm;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
        color: #000;
        background: #fff !important;
        line-height: 1.4;
        font-size: 12px;
        max-width: 100%;
      }
      .section, .signature-section, .header, .footer {
        page-break-inside: avoid;
      }
      h1, h2, h3 {
        page-break-after: avoid;
        page-break-before: avoid;
      }
      table {
        width: 100% !important;
        border-collapse: collapse !important;
      }
      th, td {
        border: 1px solid #888 !important;
        padding: 6px 8px !important;
        font-size: 11px !important;
      }
      .print-page-break {
        page-break-after: always;
      }
    }
    .header {
      text-align: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 3px solid #236902;
    }
    .header img {
      width: 80px;
      height: auto;
      margin: 0 auto 16px auto;
      display: block;
    }
    h1 {
      text-align: center;
      color: #236902;
      margin: 8px 0;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    h2 {
      color: #1a5c10;
      margin: 12px 0 8px 0;
      font-size: 18px;
      font-weight: 700;
      padding-bottom: 8px;
      border-bottom: 2px solid #e0e0e0;
    }
    h3 {
      color: #236902;
      margin: 10px 0 6px 0;
      font-size: 15px;
      font-weight: 700;
    }
    p {
      margin: 6px 0;
      text-align: justify;
      font-size: 14px;
    }
    ul {
      margin: 6px 0 6px 24px;
      font-size: 14px;
      list-style-type: disc;
    }
    li {
      margin: 3px 0;
      list-style-type: disc;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      background: #fff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    th {
      background: #236902;
      color: #fff;
      padding: 12px 8px;
      text-align: center;
      font-weight: 700;
      font-size: 13px;
      border: 1px solid #ddd;
    }
    td {
      padding: 10px 8px;
      border: 1px solid #ddd;
      text-align: center;
      font-size: 13px;
    }
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    tr:hover {
      background: #f0f7ff;
    }
    strong {
      font-weight: 700;
      color: #1a5c10;
    }
    .party-section {
      background: #f5f9f5;
      padding: 12px;
      border-left: 4px solid #236902;
      margin: 8px 0;
      border-radius: 4px;
    }
    .signature-section {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 2px solid #ddd;
      display: flex;
      justify-content: space-around;
      gap: 32px;
    }
    .signature-line {
      text-align: center;
      width: 200px;
    }
    .signature-line p {
      margin: 4px 0;
      font-size: 15px;
    }
    .signature-line .line {
      border-top: 1px solid #000;
      margin: 24px 0 4px 0;
      min-height: 20px;
    }
  </style>
</head>
<body>
<div class="header">
  <img src="${logo192}" alt="AgriAI" />
  <h1>${tr('AGRIAI FARMING AGREEMENT', 'एग्रीएआई फ़ार्मिंग समझौता', 'ಎಗ್ರಿಐ ಕೃಷಿ ಒಪ್ಪಂದ')}</h1>
  <div style="text-align: center; margin-top: 10px; font-size: 14px;">
    <p><strong>${tr('Contract Number:', 'अनुबंध संख्या:', 'ಒಪ್ಪಂದ ಸಂಖ್ಯೆ:')}</strong> ${contractNumber}</p>
    <p><strong>${tr('Date:', 'तारीख:', 'ದಿನಾಂಕ:')}</strong> ${signatureDate}</p>
  </div>
</div>

<section class="section">
  <h2>${tr('PARTIES TO THE CONTRACT', 'समझौते के पक्ष', 'ಒಪ್ಪಂದಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ಪಕ್ಷಗಳು')}</h2>
  <div class="party-section">
    <p><strong>${tr('Party A – Buyer / Company', 'पक्ष A – खरीदार / कंपनी', 'ಪಕ್ಷ A – ಖರೀದಿದಾರ / ಕಂಪನಿ')}</strong></p>
    <p><b>${tr('Name:', 'नाम:', 'ಹೆಸರು:')}</b> ${buyerName}</p>
    <p><b>${tr('Buyer ID:', 'खरीदार आईडी:', 'ಖರೀದಿದಾರ ಐಡಿ:')}</b> ${buyerId}</p>
    <p><b>${tr('Address:', 'पता:', 'ವಿಳಾಸ:')}</b> ${buyerAddress}</p>
  </div>
  <div class="party-section">
    <p><strong>${tr('Party B – Farmer / Producer', 'पक्ष B – किसान / उत्पादक', 'ಪಕ್ಷ B – ರೈತ / ಉತ್ಪಾದಕ')}</strong></p>
    <p><b>${tr('Name:', 'नाम:', 'ಹೆಸರು:')}</b> ${farmerName}</p>
    <p><b>${tr('Farmer ID:', 'किसान आईडी:', 'ರೈತ ಐಡಿ:')}</b> ${farmerId}</p>
    <p><b>${tr('Address:', 'पता:', 'ವಿಳಾಸ:')}</b> ${farmerAddress}</p>
  </div>
  <p>${tr('Party A and Party B are collectively referred to as "the Parties." AgriAI acts solely as a digital facilitation platform and is not a buyer, seller, transporter, insurer, or agent of either Party.', 'पक्ष A और पक्ष B को सामूहिक रूप से "पक्ष" कहा जाता है। AgriAI केवल एक डिजिटल सहायता प्लेटफ़ॉर्म के रूप में कार्य करता है और किसी भी पक्ष का खरीदार, विक्रेता, परिवहनकर्ता, बीमाकर्ता या एजेंट नहीं है।', 'ಪಕ್ಷ A ಮತ್ತು ಪಕ್ಷ B ಒಟ್ಟಾಗಿ "ಪಕ್ಷಗಳು" ಎಂದುเรียಲಾಗುತ್ತವೆ. AgriAI ಕೇವಲ ಡಿಜಿಟಲ್ ಸಹಾಯ ವೇದಿಕೆಯಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ ಮತ್ತು ಯಾವುದೇ ಪಕ್ಷದ ಖರೀದಿದಾರ, ಮಾರಾಟಗಾರ, ಸಾಗಣೆದಾರ, ವಿಮೆದಾರ ಅಥವಾ ಏಜೆಂಟ್ ಅಲ್ಲ.')}</p>
</section>

<section class="section">
  <h2>${tr('1. PURPOSE OF AGREEMENT', '1. समझौते का उद्देश्य', '1. ಒಪ್ಪಂದದ ಉದ್ದೇಶ')}</h2>
  <p>${tr('This Agreement defines the terms and conditions under which the Farmer agrees to produce and supply agricultural produce to the Buyer, and the Buyer agrees to procure such produce at a pre-determined price, ensuring:', 'यह समझौता उन शर्तों और नियमों को परिभाषित करता है जिनके तहत किसान कृषि उत्पाद का उत्पादन और आपूर्ति करने के लिए सहमत होता है, तथा खरीदार पूर्व-निर्धारित मूल्य पर ऐसे उत्पाद को खरीदने के लिए सहमत होता है, यह सुनिश्चित करते हुए:', 'ಈ ಒಪ್ಪಂದವು ಶರತ್ತುಗಳನ್ನು ಮತ್ತು ನಿಯಮಗಳನ್ನು ವ್ಯಾಖ್ಯಾನಿಸುತ್ತದೆ, ಅದರಡಿ ರೈತರರು ಕೃಷಿ ಉತ್ಪನ್ನವನ್ನು ಉತ್ಪಾದಿಸಿ ಖರೀದಿದಾರರಿಗೆ ಪೂರೈಸಲು ಒಪ್ಪಿಕೊಳ್ಳುತ್ತಾರೆ ಮತ್ತು ಖರೀದಿದಾರರು ಪೂರ್ವನಿರ್ಧರಿತ ಬೆಲೆಯಲ್ಲಿ ಆ ಉತ್ಪನ್ನವನ್ನು ಖರೀದಿಸಲು ಒಪ್ಪಿಕೊಳ್ಳುತ್ತಾರೆ, ಇದು ಖಚಿತಪಡಿಸುತ್ತದೆ:')}</p>
  <ul>
    <li>${tr('Assured market access to the Farmer', 'किसान को सुनिश्चित बाज़ार पहुंच', 'ರೈತರಿಗೆ ಖಚಿತವಾದ ಮಾರುಕಟ್ಟೆ ಪ್ರವೇಶ')}</li>
    <li>${tr('Fair and transparent pricing', 'न्यायसंगत और पारदर्शी मूल्य निर्धारण', 'ನ್ಯಾಯಪ್ರದ ಮತ್ತು ಪಾರದರ್ಶಕ ಬೆಲೆ ನಿರ್ಧಾರ')}</li>
    <li>${tr('Timely and secure payment', 'समय पर और सुरक्षित भुगतान', 'ಸಮಯಕ್ಕೊಮ್ಮೆ ಮತ್ತು ಭದ್ರ ಪಾವತಿ')}</li>
    <li>${tr('Reduced dependency on intermediaries', 'मध्यस्थों पर निर्भरता कम', 'ಮಧ್ಯವರ್ತಿಗಳ ಮೇಲೆ ಅವಲಂಬನೆ ಕಡಿಮೆ')}</li>
  </ul>
</section>

<section class="section">
  <h2>${tr('2. CONTRACT TYPE & DURATION', '2. अनुबंध का प्रकार और अवधि', '2. ಒಪ್ಪಂದದ ಪ್ರಕಾರ ಮತ್ತು ಅವಧಿ')}</h2>
  <p><b>${tr('Contract Nature:', 'अनुबंध प्रकृति:', 'ಒಪ್ಪಂದದ ಸ್ವಭಾವ:')}</b> ${contractNatureLabel}</p>
  <p><b>${tr('Contract Duration:', 'अनुबंध अवधि:', 'ಒಪ್ಪಂದದ ಅವಧಿ:')}</b> ${contractDurationLabel}</p>
  <p><b>${tr('Start Date:', 'प्रारंभ तिथि:', 'ಆರಂಭದ ದಿನಾಂಕ:')}</b> ${formatDateTime(startDate)}</p>
  <p><b>${tr('End Date:', 'समाप्ति तिथि:', 'ಅಂತ್ಯದ ದಿನಾಂಕ:')}</b> ${formatDateTime(endDate)}</p>
  <p><b>${tr('Duration:', 'अवधि:', 'ಅವಧಿ:')}</b> ${days} ${tr('Days', 'दिन', 'ದಿನಗಳು')}</p>
  <p>${tr(contractNature === 'pre-harvest'
      ? 'Under this Pre-Harvest Production Contract, the Farmer agrees to cultivate and supply the produce as per the agreed specifications. Cultivation obligations apply under this contract.'
      : 'Under this Post-Harvest Procurement Contract, the produce has already been cultivated or harvested prior to execution of this Agreement. No cultivation obligation arises under this contract.',
      contractNature === 'pre-harvest'
      ? 'इस प्री-हेरस्ट उत्पादन अनुबंध के तहत, किसान सहमत विनिर्देशों के अनुसार उपज उगाने और आपूर्ति करने के लिए सहमत होता है। इस अनुबंध के तहत खेती की जिम्मेदारियां लागू होती हैं।'
      : 'इस पोस्ट-हेरस्ट क्रय अनुबंध के तहत, उपज पहले से ही इस समझौते के निष्पादन से पहले उगाई या कटाई जा चुकी होती है। इस अनुबंध के तहत कोई खेती की जिम्मेदारी उत्पन्न नहीं होती।',
      contractNature === 'pre-harvest'
      ? 'ಈ ಪೂರ್ವಗಾರಿಕೆ ಉತ್ಪಾದನಾ ಒಪ್ಪಂದದಡಿ, ರೈತ ಒಪ್ಪಂದಿತ ನಿರ್ದಿಷ್ಟತೆಗಳ ಪ್ರಕಾರ ಉತ್ಪನ್ನವನ್ನು ಬೆಳೆಸಿ ಪೂರೈಸಲು ಒಪ್ಪಿಕೊಳ್ಳುತ್ತಾರೆ. ಈ ಒಪ್ಪಂದದಡಿ ಬೆಳೆಹಣ್ಣಿನ ಕರ್ತವ್ಯಗಳು ಅನ್ವಯಿಸುತ್ತವೆ.'
      : 'ಈ ಹಿಣುಗಾರಿಕೆ కొಲత ಒಪ್ಪಂದದಡಿ, ಉತ್ಪನ್ನವು ಈ ಒಪ್ಪಂದದ ಜಾರಿಗೆ ಮೊದಲು ಈಗಾಗಲೇ ಬೆಳೆದ ಅಥವಾ ಕಟೈಗೆ ಒಳಗಾಗಿದ್ದಾಗ. ಈ ಒಪ್ಪಂದದಡಿ ಯಾವುದೇ ಬೆಳೆಹಣ್ಣಿನ ಕರ್ತವ್ಯ ಉಂಟಾಗುವುದಿಲ್ಲ.'
    )}</p>
  <h3>${tr('2.1 Contract Acceptance & Negotiation Window', '2.1 अनुबंध स्वीकृति और वार्ता अवधि', '2.1 ಒಪ್ಪಂದ ಸ್ವೀಕಾರ ಮತ್ತು ನಡುವೆ ಚರ್ಚಾ ವಿಂಡೋ')}</h3>
  <p>${tr('This procurement contract shall remain valid for acceptance for a period of forty-eight (48) hours from the time it is digitally sent by the Farmer to the Buyer through the AgriAI platform.', 'यह क्रय अनुबंध AgrAI प्लेटफ़ॉर्म के माध्यम से किसान द्वारा खरीदार को डिजिटल रूप से भेजे जाने के समय से अड़तालीस (48) घंटों की अवधि के लिए स्वीकृति के लिए मान्य रहेगा।', 'ಈ ಖರೀದಿ ಒಪ್ಪಂದವು AgriAI ವೇದಿಕೆಯ ಮೂಲಕ ರೈತರಿಂದ ಖರೀದಿದಾರಿಗೆ ಡಿಜಿಟಲ್ ಮೂಲಕ ಕಳುಹಿಸಲಾದ ಸಮಯದಿಂದ ಗುರುತುಮೂಡಿದ ಎಪ್ಪತ್ತು ಎಂಟು (48) ಗಂಟೆಗಳ ಕಾಲ ಸ್ವೀಕೃತಿಗೆ ಮಾನ್ಯವಾಗಿರುತ್ತದೆ.')}</p>
  <p>${tr('Within this 48-hour period, the Buyer must take one of the following actions through the platform:', 'इस 48-घंटे की अवधि के भीतर, खरीदार को प्लेटफ़ॉर्म के माध्यम से निम्नलिखित में से कोई एक कार्रवाई करनी होगी:', 'ಈ 48 ಗಂಟೆಗಳ ಅವಧಿಯೊಳಗೆ, ಖರೀದಿದಾರನು ವೇದಿಕೆಯ ಮೂಲಕ ಕೆಳಗಿನ ಯಾವುದೇ ಒಪ್ಪಂದವನ್ನು ತೆಗೆದುಕೊಳ್ಳಬೇಕು:')}</p>
  <ul>
    <li>${tr('Accept the contract in its current form; or', 'अनुबंध को वर्तमान रूप में स्वीकार करें; या', 'ಒಪ್ಪಂದವನ್ನು ಅದರ ವಿವರಣೆಯಲ್ಲಿ ಅಂಗೀಕರಿಸಿ; ಅಥವಾ')}</li>
    <li>${tr('Reject the contract; or', 'अनुबंध को अस्वीकार करें; या', 'ಒಪ್ಪಂದವನ್ನು ತಿರಸ್ಕರಿಸಿ; ಅಥವಾ')}</li>
    <li>${tr('Request a negotiation.', 'सौदे की मांग करें।', 'ಉಭಯೋನ್ಮುಖ ಚರ್ಚೆಯನ್ನು ಕೇಳಿ.')}</li>
  </ul>
  <p>${tr('If the Buyer does not take any action within the 48-hour validity period, the contract shall automatically expire and shall have no legal or binding effect on either Party.', 'यदि खरीदार 48-घंटे की वैधता अवधि के भीतर कोई कार्रवाई नहीं करता है, तो अनुबंध स्वचालित रूप से समाप्त हो जाएगा और किसी भी पक्ष पर कोई कानूनी या बाध्य प्रभाव नहीं होगा।', 'ಖರೀದಿದಾರನು 48 ಗಂಟೆಗಳ ಮಾನ್ಯತಾ ಅವಧಿಯೊಳಗೆ ಯಾವುದೇ ಕ್ರಮವನ್ನು ಕೈಗೊಳ್ಳದಿದ್ದರೆ, ಒಪ್ಪಂದವು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಅಂತಿಮಗೊಳ್ಳುತ್ತದೆ ಮತ್ತು ಯಾವುದೇ ಪಕ್ಷದ ಮೇಲೂ ಯಾವುದೇ ಕಾನೂನು ಬದ್ಧ ಪರಿಣಾಮವಿಲ್ಲ.')}</p>
  <p>${tr('Any request for price negotiation shall be time-bound and must be concluded within forty-eight (48) hours from the time the negotiation is initiated. If no agreement is reached within this period, the negotiation shall automatically lapse, and the contract shall stand cancelled.', 'किसी भी मूल्य वार्ता का अनुरोध समयबद्ध होना चाहिए और वार्ता आरंभ करने के समय से अड़तालीस (48) घंटों के भीतर निष्कर्षण किया जाना चाहिए। यदि इस अवधि के भीतर कोई समझौता नहीं होता है, तो वार्ता स्वचालित रूप से समाप्त हो जाएगी और अनुबंध रद्द घोषित किया जाएगा।', 'ಬೆಲೆ ಸಂವಹನಕ್ಕಾಗಿ ಯಾವುದೇ ವಿನಂತಿಯೂ ಸಮಯ ನಿರ್ಧಾರಿತವಾಗಿರಬೇಕು ಮತ್ತು ಸಂವಹನ ಪ್ರಾರಂಭವಾಗಿದ ದಿನಾಂಕದಿಂದ ಎಪ್ಪತ್ತು ಎಂಟು (48) ಗಂಟೆಗಳೊಳಗೆ ಮುಗಿಯಬೇಕು. ಈ ಅವಧಿಯೊಳಗೆ ಯಾವುದೇ ಒಪ್ಪಂದವಿಲ್ಲದಿದ್ದರೆ, ಸಂವಹನವು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ರದ್ದುಪಡ Jok and ಒಪ್ಪಂದವು ರದ್ದುಮಾಡಲ್ಪಡುತ್ತದೆ.')}</p>
</section>

<section class="section">
  <h2>${tr('3. DATA PRIVACY & PLATFORM COMPLIANCE', '3. डेटा गोपनीयता और प्लेटफ़ॉर्म अनुपालन', '3. ಡೇಟಾ ಗೌಪ್ಯತೆ ಮತ್ತು ವೇದಿಕೆ ಅನುಸರಣ')}</h2>
  <p>${tr('All personal, agricultural, and transactional data collected through the AgriAI platform shall be:', 'AgriAI प्लेटफ़ॉर्म के माध्यम से एकत्रित सभी व्यक्तिगत, कृषि और लेनदेन डेटा निम्नानुसार होंगे:', 'AgriAI ವೇದಿಕೆಯ ಮೂಲಕ ಸಂಗ್ರಹಿಸಲಾಗುವ ಎಲ್ಲಾ ವೈಯಕ್ತಿಕ, ಕೃಷಿ ಮತ್ತು ವ್ಯವಹಾರ ಡೇಟಾಗಳು ಕೆಳಗಿನಂತೆ ಇರುತ್ತವೆ:')}</p>
  <ul>
    <li>${tr('Stored securely', 'सुरक्षित रूप से संग्रहीत', 'ಭದ್ರವಾಗಿ ಸಂಗ್ರಹಿಸಲಾಗಿದೆ')}</li>
    <li>${tr('Contract execution and renewal', 'अनुबंध निष्पादन और नवीनीकरण', 'ಒಪ್ಪಂದದ ಜಾರಿ ಮತ್ತು ನವೀಕරණ')}</li>
    <li>${tr('Payment settlement', 'भुगतान निपटान', 'ಪಾವತಿ ಸಮೀಕ್ಷೆ')}</li>
    <li>${tr('Insurance facilitation', 'बीमा सुविधा', 'ವಿಮೆ ಸಹಾಯ')}</li>
    <li>${tr('Legal and regulatory compliance', 'कानूनी और नियामक अनुपालन', 'ಕಾನೂನಾತ್ಮಕ ಮತ್ತು ನಿಯಂತ್ರಣ ಹೊಂದಾಣಿಕೆ')}</li>
  </ul>
  <p>${tr('This Agreement is fully compliant with the Digital Personal Data Protection Act, 2023.', 'यह समझौता डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 के साथ पूरी तरह से अनुपालन करता है।', 'ಈ ಒಪ್ಪಂದವು ಡಿಜಿಟಲ್ ವೈಯಕ್ತಿಕ ಡೇಟಾ ರಕ್ಷಣೆ ಅಕ್ಟ್, 2023 ಗೆ ಸಂಪೂರ್ಣವಾಗಿ ಅನುಗುಣವಿದೆ.')}</p>
</section>

<section class="section">
  <h2>${tr('4. COMMODITY DETAILS', '4. वस्तु विवरण', '4. ಸರಕಿನ ವಿವರ')}</h2>
  <table>
    <thead>
      <tr>
        <th>${tr('Sl. No', 'क्रमांक', 'ಕ್ರಮ ಸಂಖ್ಯೆ')}</th>
        <th>${tr('Crop Name', 'फसल का नाम', 'ಪಶುವಿನ ಹೆಸರು')}</th>
        <th>${tr('Variety', 'किस्म', 'ವೈವಿಧ್ಯ')}</th>
        <th>${tr('Quantity (kg)', 'मात्रा (किग्रा)', 'ಪ್ರಮಾಣಿ (ಕೆಜಿ)')}</th>
        <th>${tr('Price (₹/kg)', 'कीमत (₹/किग्रा)', 'ಬೆಲೆ (₹/ಕೆಜಿ)' )}</th>
        <th>${tr('Amount (₹)', 'राशि (₹)', 'ಮೊತ್ತ (₹)')}</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
</section>

<section class="section">
  <h2>${tr('5. PRICE & PAYMENT TERMS', '5. मूल्य और भुगतान शर्तें', '5. ಬೆಲೆ ಮತ್ತು ಪಾವತಿ ಷರತ್ತುಗಳು')}</h2>

  <h3>${tr('5.1 Farmer\'s Payment Structure', '5.1 किसान की भुगतान संरचना', '5.1 ರೈತನ ಪಾವತಿ ರಚನೆ')}</h3>
  <p><b>${tr('Total Quantity:', 'कुल मात्रा:', 'ಒಟ್ಟು ಪ್ರಮಾಣಿ:')}</b> ${totalContractQty.toLocaleString('en-IN')} ${tr('kg', 'कि.ग्रा', 'ಕೆಜಿ')}</p>
  <p><b>${tr('Price per Unit:', 'प्रति इकाई कीमत:', 'ಪ್ರತಿ ಘಟಕದ ಬೆಲೆ:')}</b> ${formatCurrency(avgPricePerKg)} ${tr('per kg', 'प्रति कि.ग्रा', 'ಪ್ರತಿ ಕೆಜಿ')}</p>
  <p><b>${tr('Platform Fee:', 'प्लेटफ़ॉर्म शुल्क:', 'ವೇದಿಕೆ ಶುಲ್ಕ:')}</b> ${formatCurrency(displayFarmerCommission)}</p>
  <p><b>${tr('GST (18%):', 'जीएसटी (18%):', 'ಜಿಎಸ್‍ಟಿ (18%):')}</b> ${formatCurrency(displayFarmerGst)}</p>
  <p><b style="font-size: 16px; color: #236902;">${tr('Total Amount (After Deduction):', 'कटौती के बाद कुल राशि:', 'ಕಟೌಟ್ ನಂತರ ಒಟ್ಟು ಮೊತ್ತ:')}</b> <b style="font-size: 16px; color: #236902;">${formatCurrency(displayNetAmountToFarmer)}</b></p>

  <h3 style="margin-top: 20px;">${tr('5.2 Buyer\'s Payment Structure', '5.2 खरीदार की भुगतान संरचना', '5.2 ಖರೀದಿದಾರರ ಪಾವತಿ ರಚನೆ')}</h3>
  <p><b>${tr('Total Quantity:', 'कुल मात्रा:', 'ಒಟ್ಟು ಪ್ರಮಾಣಿ:')}</b> ${totalContractQty.toLocaleString('en-IN')} ${tr('kg', 'कि.ग्रा', 'ಕೆಜಿ')}</p>
  <p><b>${tr('Price per Unit:', 'प्रति इकाई कीमत:', 'ಪ್ರತಿ ಘಟಕದ ಬೆಲೆ:')}</b> ${formatCurrency(avgPricePerKg)} ${tr('per kg', 'प्रति कि.ग्रा', 'ಪ್ರತಿ ಕೆಜಿ')}</p>
  <p><b>${tr('Platform Fee:', 'प्लेटफ़ॉर्म शुल्क:', 'ವೇದಿಕೆ ಶುಲ್ಕ:')}</b> ${formatCurrency(displayBuyerCommission)}</p>
  <p><b>${tr('GST (18%):', 'जीएसटी (18%):', 'ಜಿಎಸ್‍ಟಿ (18%):')}</b> ${formatCurrency(displayBuyerGst)}</p>
  <p><b style="font-size: 16px; color: #236902;">${tr('Total Amount Payable:', 'देय कुल राशि:', 'ಪಾವತಿಸಲು ಒಟ್ಟು ಮೊತ್ತ:')}</b> <b style="font-size: 16px; color: #236902;">${formatCurrency(totalAmountPayableByBuyer)}</b></p>

  <h3 style="margin-top: 20px;">${tr('5.3 Payment Schedule', '5.3 भुगतान कार्यक्रम', '5.3 ಪಾವತಿ ವೇಳಾಪಟ್ಟಿ')}</h3>
  <ul>
    <li><b>${tr('Advance (25%):', 'अग्रिम (25%):', 'ಮುಂಗಡ (25%):')}</b> ${formatCurrency(totalAmountPayableByBuyer * 0.25)} – ${tr('Due at contract confirmation', 'अनुबंध पुष्टि पर देय', 'ಒಪ್ಪಂದ ದೃಢೀಕರಣಕ್ಕೆ ಬಂದ ನಂತರ')}</li>
    <li><b>${tr('On Delivery (50%):', 'डिलीवरी पर (50%):', 'ವಿತರಣೆ zamanı (50%):')}</b> ${formatCurrency(totalAmountPayableByBuyer * 0.50)} – ${tr('Due upon successful delivery', 'सफल डिलीवरी पर देय', 'ಯಶಸ್ವಿ ವಿತರಕಕ್ಕೆ ಬರುವ ನಂತರ')}</li>
    <li><b>${tr('Final (25%):', 'अंतिम (25%):', 'ಕೊನೆ (25%):')}</b> ${formatCurrency(totalAmountPayableByBuyer * 0.25)} – ${tr('Due within 7 working days after quality acceptance', 'गुणवत्ता स्वीकृति के बाद 7 कार्य दिवसों के भीतर देय', 'ಗुणಮಟ್ಟದ ಒಪ್ಪಿಗೆಯ ನಂತರ 7 ಕಾರ್ಯದಿನಗಳಲ್ಲಿ ಪಾವತಿಗೆ ಬರುವ')}</li>
  </ul>

  <h3 style="margin-top: 20px;">${tr('5.4 Mode of Payment', '5.4 भुगतान का तरीका', '5.4 ಪಾವತಿ ವಿಧಾನ')}</h3>
  <p>${tr('Bank Transfer / UPI / Cheque', 'बैंक ट्रांसफर / यूपीआई / चेक', 'ಬ್ಯಾಂಕ್ ವರ್ಗಾವಣೆ / ಯುಪಿಐ / ಚೆಕ್')}</p>
  <p>${tr('The Buyer shall issue digital or physical receipts for all payments made under this Agreement.', 'खरीदार इस समझौते के तहत की गई सभी भुगतानों के लिए डिजिटल या भौतिक रसीद जारी करेगा।', 'ಖರೀದಿದಾರನು ಈ ಒಪ್ಪಂದದಡಿ ಮಾಡಲಾದ ಎಲ್ಲಾ ಪಾವತಿಗಳಿಗಾಗಿ ಡಿಜಿಟಲ್ ಅಥವಾ ಭೌತಿಕ ರಸೀದಿಗಳನ್ನು ನೀಡುತ್ತಾನೆ.')}</p>
</section>

<section class="section">
  <h2>${tr('6. DELIVERY, LOGISTICS & TRANSPORTATION', '6. वितरण, लॉजिस्टिक्स और परिवहन', '6. ವಿತರಣೆ, ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಮತ್ತು ಸಾರಿಗೆ')}</h2>
  <h3>${tr('6.1 Role of AgriAI', '6.1 AgriAI की भूमिका', '6.1 AgriAI ರ ಪಾತ್ರ')}</h3>
  <p>${tr('AgriAI operates solely as a digital technology platform facilitating transactions between Buyers and Farmers. AgriAI shall not be deemed a buyer, seller, trader, commission agent, transporter, or custodian of goods. All obligations relating to sale and purchase remain strictly between the Parties.', 'AgriAI केवल खरीदारों और किसानों के बीच लेनदेन को सुगम बनाने वाला एक डिजिटल तकनीकी मंच है। AgriAI को खरीदार, विक्रेता, व्यापारी, कमीशन एजेंट, परिवहनकर्ता या माल का संरक्षक नहीं माना जाएगा। बिक्री और खरीद से संबंधित सभी दायित्व सख्ती से पक्षों के बीच ही रहते हैं।', 'AgriAI ಖರೀದಿದಾರರು ಮತ್ತು ರೈತರು ನಡುವಣ ವ್ಯವಹಾರಗಳನ್ನು ಸುಲಭಗೊಳಿಸುವ ಡಿಜಿಟಲ್ ತಂತ್ರಜ್ಞಾನ ವೇದಿಕೆಯಾಗಿ ಮಾತ್ರ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ. AgriAI ಅನ್ನು ಖರೀದಿದಾರ, ಮಾರಾಟಗಾರ, ವ್ಯಾಪಾರಿ, ಕಮೀಷನ್ ಏಜೆಂಟ್, ಸಾರಿಗೆದಾರ ಅಥವಾ ಸರಕಿನ ರಕ್ಷಕರಾಗಿ ಪರಿಗಣಿಸಲಾಗುವುದಿಲ್ಲ. ಮಾರಾಟ ಮತ್ತು ಖರೀದಿಗೆ ಸಂಬಂಧಿಸಿದ ಎಲ್ಲಾ ಕರ್ತವ್ಯಗಳು ಕಠಿಣವಾಗಿ ಪಕ್ಷಗಳ ನಡುವೆ ಇರುತ್ತವೆ.')}</p>
  <h3>${tr('6.2 Transportation', '6.2 परिवहन', '6.2 ಸಾರಿಗೆ')}</h3>
  <p>${tr('Transportation shall be facilitated through third-party logistics service providers available on or approved by the AgriAI platform. The selection of logistics provider and vehicle type shall be based on crop nature, quantity, distance, and handling requirements.', 'परिवहन AgriAI प्लेटफ़ॉर्म पर उपलब्ध या AgriAI द्वारा अनुमोदित तृतीय-पक्ष लॉजिस्टिक्स सेवा प्रदाताओं के माध्यम से सुगम होगा। लॉजिस्टिक्स प्रदाता और वाहन प्रकार का चयन फसलों की प्रकृति, मात्रा, दूरी और हैंडलिंग आवश्यकताओं के आधार पर किया जाएगा।', 'ಸಾರಿಗೆ AgriAI ವೇದಿಕೆಯಲ್ಲಿ ಲಭ್ಯವಿರುವ ಅಥವಾ AgriAI ಅನುಮೋದಿಸಿದ ತೃತೀಯ-ಪಕ್ಷ ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಸೇವಾ ಒದಗಿಸುವವರ ಮೂಲಕ ಸುಗಮವಾಗುತ್ತದೆ. ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಒದಗಿಸುವವರ ಹಾಗೂ ವಾಹನ ಪ್ರಕಾರದ ಆಯ್ಕೆ ಬೆಳೆ ಸ್ವಭಾವ, ಪ್ರಮಾಣಿ, ದೂರ ಮತ್ತು ಹ್ಯಾಂಡ್ಲಿಂಗ್ ಅಗತ್ಯಗಳ ಆಧಾರದ ಮೇಲೆ ಮಾಡಲಾಗುತ್ತದೆ.')}</p>
  <h3>${tr('6.3 Delivery Charges', '6.3 डिलीवरी शुल्क', '6.3 ವಿತರಣಾ ಶುಲ್ಕ')}</h3>
  <p>${tr('Delivery charges shall be determined by the third-party logistics provider based on actual distance, vehicle type, loading requirements, and location. Such charges shall be paid directly by the Buyer to the logistics provider. AgriAI shall not be responsible for determining or negotiating delivery pricing.', 'डिलीवरी शुल्क वास्तविक दूरी, वाहन प्रकार, लोडिंग आवश्यकताओं और स्थान के आधार पर तृतीय-पक्ष लॉजिस्टिक्स प्रदाता द्वारा निर्धारित किए जाएंगे। ऐसे शुल्क सीधे खरीदार द्वारा लॉजिस्टिक्स प्रदाता को भुगतान किए जाएंगे। AgriAI डिलीवरी मूल्य निर्धारण तय करने या वार्ता करने के लिए जिम्मेदार नहीं होगा।', 'ವಿತರಣಾ ಶುಲ್ಕವನ್ನು ಯಥಾರ್ಥ ದೂರ, ವಾಹನ ಪ್ರಕಾರ, ಲೋಡಿಂಗ್ ಅಗತ್ಯಗಳು ಹಾಗೂ ಸ್ಥಳ ಆಧರಿಸಿ ತೃತೀಯ-ಪಕ್ಷ ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಒದಗಿಸುವವರು ನಿರ್ಧರಿಸುತ್ತಾರೆ. ಇಂತಹ ಶುಲ್ಕಗಳನ್ನು ಖರೀದಿದಾರನು ನೇರವಾಗಿ ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಒದಗಿಸುವವರಿಗೆ ಪಾವತಿಸಬೇಕು. ವಿತರಣಾ ಬೆಲೆಯನ್ನು ನಿರ್ಧರಿಸುವ ಅಥವಾ ಚರ್ಚಿಸುವುದಕ್ಕೆ AgriAI ಜವಾಬ್ದಾರಿಯಲ್ಲ.')}</p>
</section>

<section class="section">
  <h2>${tr('7. QUALITY STANDARDS, INSPECTION & ACCEPTANCE', '7. गुणवत्ता मानक, निरीक्षण और स्वीकृति', '7. ಗುಣಮಟ್ಟದ ಮಾನದಂಡಗಳು, ಪರಿಶೀಲನೆ ಮತ್ತು ಅಂಗೀಕಾರ')}</h2>
  <p>${tr('The produce supplied shall meet the mutually agreed specifications mentioned in this Agreement.', 'आपूर्तिकृत उत्पाद को इस समझौते में उल्लिखित परस्पर सहमत विनिर्देशों को पूरा करना चाहिए।', 'ಬಂಡವಾಳವಾಗಿ ಒಪ್ಪಿಕೋರಿಕೆಗಳ ಅನುಸಾರ ಈ ಒప్పಂದದಲ್ಲಿ ಉಲ್ಲೇಖಿಸಲಾದ ನಿರ್ದಿಷ್ಟತೆಗಳನ್ನು ಪೂರೈಸಬೇಕು.')}</p>
  <p>${tr('The Buyer shall complete quality inspection within 3 (three) working days from the date of delivery.', 'खरीदार को डिलीवरी की तारीख से 3 (तीन) कार्य दिवसों के भीतर गुणवत्ता निरीक्षण पूरा करना चाहिए।', 'ಖರೀದಿದಾರನು ವಿತರಣೆ ದಿನಾಂಕದಿಂದ 3 (ಮೂರು) ಕಾರ್ಯದಿನಗಳೊಳಗೆ ಗುಣಮಟ್ಟ ಪರಿಶೀಲನೆಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಬೇಕು.')}</p>
  <p>${tr('Any rejection must be raised in writing through the AgriAI platform within the inspection period, clearly stating valid and verifiable reasons.', 'किसी भी अस्वीकृति को निरीक्षण अवधि के भीतर AgriAI प्लेटफ़ॉर्म के माध्यम से लिखित में प्रस्तुत किया जाना चाहिए, जिसमें मान्य और सत्यापनीय कारण स्पष्ट रूप से दिए गए हों।', 'ಯಾವುದೇ ತಿರಸ್ಕಾರವನ್ನು ಪರಿಶೀಲನೆ ಅವಧಿಯೊಳಗೆ AgriAI ವೇದಿಕೆಯ ಮೂಲಕ ಬರೆದ ರೂಪದಲ್ಲಿ ಸಲ್ಲಿಸಬೇಕು, ಮಾನ್ಯ ಮತ್ತು ಪರಿಶೀಲಿಸಲು ಆಗುವ ಕಾರಣಗಳನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಹೇಳಬೇಕು.')}</p>
  <p>${tr('If no dispute is raised within 3 working days, the produce shall be deemed accepted.', 'यदि 3 कार्य दिवसों के भीतर कोई विवाद नहीं उठाया जाता है, तो उत्पाद को स्वीकार किया गया माना जाएगा।', '3 ಕಾರ್ಯದಿನಗಳೊಳಗೆ ಯಾವುದೇ ವಿವಾದವನ್ನು ತೆರೆದ하지 않ದಿದ್ದರೆ, ಉತ್ಪನ್ನವನ್ನು ಅಂಗೀಕೃತವೆಂದು ಪರಿಗಣಿಸಲಾಗುತ್ತದೆ.')}</p>
  <p>${tr('In case of justified rejection, return transportation costs shall be borne by the Buyer unless the defect is proven to have originated prior to dispatch.', 'यदि उचित अस्वीकृति होती है, तो वापसी परिवहन लागत खरीदार द्वारा वहन की जाएगी जब तक कि यह प्रमाणित न हो कि दोष प्रेषण से पहले उत्पन्न हुआ था।', 'ಸರಿಯಾದ ತಿರಸ್ಕಾರದ ಸಂದರ್ಭದಲ್ಲಿ, ವಾಪಾಸು ಸಾರಿಗೆ ವೆಚ್ಚವನ್ನು ಖರೀದಿದಾರನು ಹೊತ್ತುಕೊಳ್ಳಬೇಕು, ಜೊತೆಗೆ ದೋಷವು ರವಾನೆಗೆ ಮೊದಲು ಉಂಟಾಗಿದ್ದುದು ಪ್ರಮಾಣಿತವಾಗದಿದ್ದರೆ.')}</p>
</section>

<section class="section">
  <h2>${tr('8. RISK, LIABILITY & INSURANCE', '8. जोखिम, देयता और बीमा', '8. ಅಪಾಯ, ಹೊಣೆಗಾರಿಕೆ ಮತ್ತು ವಿಮೆ')}</h2>
  <p>${tr('The Farmer shall follow standard agricultural and post-harvest practices.', 'किसान को मानक कृषि और पोस्ट-हेरस्ट प्रथाओं का पालन करना चाहिए।', 'ರೈತನು ಮಾನಕ ಕೃಷಿ ಮತ್ತು ಹಿಣುಗಾರಿಕೆ ನಂತರದ ಅಭ್ಯಾಸಗಳನ್ನು ಅನುಸರಿಸಬೇಕು.')}</p>
  <p>${tr('In case of crop loss due to natural calamities or force majeure before dispatch, obligations may be reviewed mutually. Crop insurance, if applicable under government schemes such as PMFBY or other approved insurers, shall remain in the Farmer\'s name.', 'प्रकृतिक आपदाओं या बल majeure के कारण प्रेषण से पहले फसल हानि के मामले में, दायित्वों की पारस्परिक समीक्षा की जा सकती है। यदि PMFBY या अन्य अनुमोदित बीमाकर्ताओं जैसे सरकारी योजनाओं के तहत फसल बीमा लागू है, तो वह किसान के नाम पर रहेगा।', 'ಪ್ರಕೃತಿ ವಿಪತ್ತುಗಳು ಅಥವಾ ಕೊಪ್ಪೆ ಬಲ ಕಾರಣದಿಂದ ರವಾನೆಗೂ ಮುಂಚೆ ಹಣ್ಣು ಹಾನಿಯಾಗಿದ್ದಲ್ಲಿ, ಕರ್ತವ್ಯಗಳನ್ನು ಪರಸ್ಪರ ಪರಿಶೀಲಿಸಬಹುದು. PMFBY ಅಥವಾ ಇತರ ಅನುಮೋದಿತ ವಿಮೆದಾರರಂತಹ ಸರಕಾರಿ ಯೋಜನೆಗಳಡಿ ಅನ್ವಯಿಸಿದಲ್ಲಿ, ಬೆಳೆ ವಿಮೆ ರೈತನ ಹೆಸರಲ್ಲಿ ಉಳಿಯುತ್ತದೆ.')}</p>
  <p>${tr('Any insurance compensation received shall belong solely to the Farmer.', 'प्राप्त कोई भी बीमा मुआवजा केवल किसान के लिए होगा।', 'ಪ್ರಾಪ್ತವಾದ ಯಾವುದೇ ವಿಮಾ ಪರಿಹಾರವು ಮಾತ್ರ ರೈತನದಾಗಿರುತ್ತದೆ.')}</p>
  <p>${tr('After delivery and deemed acceptance, all risks, ownership, and liabilities shall transfer entirely to the Buyer.', 'डिलीवरी और स्वीकार किए जाने के बाद, सभी जोखिम, स्वामित्व और दायित्व पूरी तरह से खरीदार को स्थानांतरित हो जाएंगे।', 'ವಿತರಿಸುವ ನಂತರ ಮತ್ತು ಅಂಗೀಕೃತವಾದಂತೆ ಪರಿಗಣಿಸಿದ ನಂತರ, ಎಲ್ಲಾ ಅಪಾಯಗಳು, ಮಾಲೀಕತ್ವ ಮತ್ತು ಹೊಣೆಗಾರಿಕೆ ಸಂಪೂರ್ಣವಾಗಿ ಖರೀದಿದಾರಿಗೆ ಹಸ್ತಾಂತರವಾಗುತ್ತವೆ.')}</p>
</section>

<section class="section">
  <h2>${tr('9. FORCE MAJEURE', '9. फोर्स मेज्योर', '9. ಫೋರ್ಸ್ ಮೇಜರ್')}</h2>
  <p>${tr('Neither Party shall be liable for failure or delay caused by events beyond reasonable control, including natural disasters, government restrictions, war, strikes, transportation disruptions, or unforeseen calamities.', 'किसी भी पक्ष को उन घटनाओं के कारण हुई विफलता या देरी के लिए उत्तरदायी नहीं ठहराया जाएगा जो उचित नियंत्रण के बाहर हों, जिनमें प्राकृतिक आपदाएं, सरकारी प्रतिबंध, युद्ध, हड़ताल, परिवहन व्यवधान या अप्रत्याशित आपदाएं शामिल हैं।', 'ಯೋಗ್ಯ ನಿಯಂತ್ರಣದ ಹೊರಗಿನ ಘಟನೆಗಳಿಂದ ಉಂಟಾದ ವಿಫಲತೆ ಅಥವಾ ವಿಳಂಬಕ್ಕೆ ಯಾವುದೇ ಪಕ್ಷಕ್ಕೂ ಹೊಣೆಗಾರಿಕೆ ಇರದು, ಇದರಲ್ಲಿ ಸಹಜ ವಿಪತ್ತುಗಳು, ಸರ್ಕಾರಿ ನಿರ್ಬಂಧಗಳು, ಯುದ್ಧ, ಹಡತ, ಸಾರಿಗೆ ವ್ಯತ್ಯಯಗಳು ಅಥವಾ ಅನಿರೀಕ್ಷಿತ ಅಪಾಯಗಳು ಸೇರಿವೆ.')}</p>
  <p>${tr('Obligations shall resume once such conditions cease to exist.', 'ऐसी परिस्थितियों के समाप्त होने पर दायित्व फिर से शुरू हो जाएंगे।', 'ಅಂತಹ ಪರಿಸ್ಥಿತಿಗಳು ನಿಲ್ಲಿದ ಮೇಲೆ ಕರ್ತವ್ಯಗಳು ಪುನಃ ಪ್ರಾರಂಭವಾಗುತ್ತವೆ.')}</p>
</section>

<section class="section">
  <h2>${tr('10. DISPUTE RESOLUTION & JURISDICTION', '10. विवाद समाधान एवं क्षेत्राधिकार', '10. ವಿವಾದ ಪರಿಹಾರ ಮತ್ತು ನ್ಯಾಯಾಧಿಕಾರ')}</h2>
  <p>${tr('Any dispute arising out of this Agreement shall first be resolved amicably through discussion via the AgriAI platform.', 'इस समझौते से उत्पन्न किसी भी विवाद को पहले AgriAI प्लेटफ़ॉर्म के माध्यम से आपसी चर्चा द्वारा सौहार्दपूर्वक सुलझाया जाएगा।', 'ಈ ಒಪ್ಪಂದದಿಂದ ಉಂಟಾಗುವ ಯಾವುದೇ ವಿವಾದವನ್ನು ಮೊದಲು AgriAI ವೇದಿಕೆಯ ಮೂಲಕ ಚರ್ಚೆಯಿಂದ ಸ್ನೇಹಪೂರಕವಾಗಿ ಪರಿಹರಿಸಲಾಗುತ್ತದೆ.')}</p>
  <p>${tr('If unresolved within 15 days, disputes shall be referred to arbitration under the Arbitration and Conciliation Act, 1996. The seat of arbitration shall be determined by AgriAI.', 'यदि 15 दिनों के भीतर हल नहीं होता है, तो विवादों को मध्यस्थता एवं सुलह अधिनियम, 1996 के अंतर्गत मध्यस्थता के लिए भेजा जाएगा। मध्यस्थता का स्थान AgriAI द्वारा निर्धारित किया जाएगा।', '15 ದಿನಗಳೊಳಗೆ ಬಗೆಬರದಿದ್ದರೆ, ವಿವಾದಗಳನ್ನು ಮಧ್ಯಸ್ಥಿಕೆ ಮತ್ತು ಸಮ್ಮತಿ ಕಾಯ್ದೆ, 1996 ರಡಿಯಲ್ಲಿ ಮಧ್ಯಸ್ಥಿಕೆಗೆ ಹೇರಲಾಗುತ್ತದೆ. ಮಧ್ಯಸ್ಥಿಕೆಯ ಸ್ಥಳವನ್ನು AgriAI ನಿರ್ಧರಿಸುತ್ತದೆ.')}</p>
  <p>${tr('Subject to arbitration, the courts of Bengaluru, Karnataka shall have exclusive jurisdiction for enforcement and legal proceedings arising under this Agreement.', 'मध्यस्थता के अधीन रहते हुए, बेंगलुरु, कर्नाटक की अदालतों को इस समझौते के तहत उत्पन्न प्रवर्तन और कानूनी कार्यवाहियों के लिए विशेष क्षेत्राधिकार प्राप्त होगा।', 'ಮಧ್ಯಸ್ಥಿಕೆಯ ಅಡಿಯಲ್ಲಿ, ಬೆಂಗಳೂರ, ಕರ್ನಾಟಕದ ನ್ಯಾಯಾಲಯಗಳು ಈ ಒಪ್ಪಂದದ ಅಡಿಯಲ್ಲಿ ಉಂಟಾಗುವ ಜಾರಿಮಾಡುವಿಕೆ ಮತ್ತು ಕಾನೂನು ಕ್ರಮಗಳಿಗೆ ವಿಶೇಷ ನ್ಯಾಯಾಧಿಕಾರ ಹೊಂದಿದ್ದವೆ.')}</p>
</section>

<section class="section">
  <h2>${tr('11. TERMINATION', '11. समाप्ति', '11. ರದ್ದುಪಡಿಸುವಿಕೆ')}</h2>
  <p>${tr('Either Party may terminate this Agreement for material breach, including non-payment, non-delivery, misrepresentation, or violation of agreed terms.', 'किसी भी पक्ष द्वारा इस समझौते को महत्वपूर्ण उल्लंघन के कारण समाप्त किया जा सकता है, जिसमें भुगतान न करना, वितरण न करना, गलत प्रस्तुति या सहमत शर्तों का उल्लंघन शामिल है।', 'ಯಾವುದೇ ಪಕ್ಷವು ಈ ಒಪ್ಪಂದವನ್ನು ಮಹತ್ವದ ಉಲ್ಲಂಘನೆಯ ಕಾರಣದಿಂದ ರದ್ದುಮಾಡಬಹುದು, ಇದರಲ್ಲಿ ಪಾವತಿ ಮಾಡದಿರುವುದು, ವಿತರಣೆ ಮಾಡದಿರುವುದು, ತಪ್ಪು ಪ್ರತಿನಿಧಿಸುವುದು ಅಥವಾ ಒಪ್ಪಿಗೆಯ ಶರತ್ತುಗಳನ್ನು ಉಲ್ಲಂಘಿಸುವುದು ಸೇರಿವೆ.')}</p>
  <p>${tr('In case of payment default beyond agreed timelines, the defaulting Party may face account suspension, penalty charges, and recovery proceedings as permitted by law.', 'समझौते की समय सीमाओं से बचकर भुगतान में चूक की स्थिति में, दोषी पक्ष को खाते की निलंबन, दंडात्मक शुल्क और कानूनी रूप से अनुमति प्राप्त वसूली कार्यवाहियों का सामना करना पड़ सकता है।', 'ಒಪ್ಪಿಗೆಯ ಸಮಯಸೀಮೆಗಳನ್ನು ಮೀರಿ ಪಾವತಿಯನ್ನು ವಿಫಲಗೊಳಿಸಿದಲ್ಲಿ, ದೋಷಿತ ಪಕ್ಷದ ಖಾತೆ ಸ್ಥಗಿತ, ದಂಡ ಶುಲ್ಕಗಳು ಮತ್ತು ಕಾನೂನಾತ್ಮಕವಾಗಿ ಅನುಮೋದಿತ ವಸೂಲಿ ಕ್ರಮಗಳನ್ನು ಎದುರಿಸಬಹುದು.')}</p>
</section>

<section class="section">
  <h2>${tr('12. LANGUAGE OF AGREEMENT', '12. समझौते की भाषा', '12. ಒಪ್ಪಂದದ ಭಾಷೆ')}</h2>
  <p>${tr('This Agreement has been explained and translated to the Farmer in', 'इस समझौते को किसान को समझाया और अनुवादित किया गया है', 'ಈ ಒಪ್ಪಂದವನ್ನು ರೈತನಿಗೆ ವಿವರಿಸಲಾಯಿತು ಮತ್ತು ಅನುವಾದಿಸಲಾಯಿತು')} <strong>${languageName}</strong>. ${tr('In case of any inconsistency, the English version shall prevail.', 'किसी भी असंगति की स्थिति में, अंग्रेजी संस्करण मान्य होगा।', 'ಯಾವುದೇ ಅಸಮಾಯತೆಯಲ್ಲಿ, ಇಂಗ್ಲಿಷ್ ಆವೃತ್ತಿಯೇ ಮಾನ್ಯವಾಗುತ್ತದೆ।')}</p>
</section>

<section class="section">
  <h2>${tr('13. EXECUTION & DIGITAL ACCEPTANCE', '13. निष्पादन एवं डिजिटल स्वीकृति', '13. ಜಾರಿಗೊಳಿಸುವಿಕೆ ಮತ್ತು ಡಿಜಿಟಲ್ ಅಂಗೀಕಾರ')}</h2>
  <p>${tr('This Agreement may be executed electronically through the AgriAI platform. Digital acceptance using registered credentials shall constitute legally binding consent.', 'इस समझौते को AgriAI प्लेटफ़ॉर्म के माध्यम से इलेक्ट्रॉनिक रूप से निष्पादित किया जा सकता है। पंजीकृत क्रेडेंशियल का उपयोग करके डिजिटल स्वीकार्यता कानूनी रूप से बाध्यकारी सहमति होगी।', 'ಈ ಒಪ್ಪಂದವನ್ನು AgriAI ವೇದಿಕೆಯ ಮೂಲಕ ಎಲೆಕ್ಟ್ರಾನಿಕ್ ರೂಪದಲ್ಲಿ ಜಾರಿಗೊಳಿಸಬಹುದು. ನೋಂದಾಯಿತ ಕ್ರೀಡೆಗಳನ್ನು ಬಳಸಿಕೊಂಡು ಡಿಜಿಟಲ್ ಅಂಗೀಕಾರವು ಕಾನೂನು ಬದ್ಧ ಒಪ್ಪಿಗೆಯಾಗಿ ಗಣನೆಗೆ ಬರುತ್ತದೆ.')}</p>
  <section class="signature-section">
    <div class="signature-line">
      ${((dbContract?.status && String(dbContract.status).toLowerCase() === 'accepted') || (order.status && String(order.status).toLowerCase() === 'accepted')) ?
      `<p><strong>${tr('Buyer / Company', 'खरीदार / कंपनी', 'ಖರೀದಿದಾರ / ಕಂಪನಿ')}</strong></p>
       <p>${tr('Name:', 'नाम:', 'ಹೆಸರು:')} ${buyerName}</p>
       <p>${tr('Date:', 'तारीख:', 'ದಿನಾಂಕ:')} ${signatureDate}</p>` :
      `<p><strong>${tr('Buyer / Company', 'खरीदार / कंपनी', 'ಖರೀದಿದಾರ / ಕಂಪನಿ')}</strong></p>
       <p>${tr('Name:', 'नाम:', 'ಹೆಸರು:')} ___________________________</p>
       <p>${tr('Date:', 'तारीख:', 'ದಿನಾಂಕ:')} ___________________________</p>`}
    </div>
    <div class="signature-line">
      <p><strong>${tr('Farmer / Producer', 'किसान / उत्पादक', 'ರೈತ / ಉತ್ಪಾದಕ')}</strong></p>
      <p>${tr('Name:', 'नाम:', 'ಹೆಸರು:')} ${farmerName}</p>
      <p>${tr('Date:', 'तारीख:', 'ದಿನಾಂಕ:')} ${signatureDate}</p>
    </div>
  </section>

  <p style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; font-size: 12px; color: #000; font-weight: bold;">
    <strong>${tr('Witness:', 'गवाह:', 'ಸಾಕ್ಷಿ:')}</strong> AgriAI ${tr('Platform | Digital Record:', 'प्लेटफ़ॉर्म | डिजिटल रिकॉर्ड:', 'ವೇದಿಕೆ | ಡಿಜಿಟಲ್ ದಾಖಲೆ:')} ${new Date().toISOString()}
  </p>
</section>

</body>
</html>`;
  };

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const filtered = orders.filter(o => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q ||
      (o.invoice_id || '').toString().toLowerCase().includes(q) ||
      (o.contract_number || '').toString().toLowerCase().includes(q) ||
      (o.items || []).some(it => {
        try {
          const cropMatch = (it.crop_name || '').toString().toLowerCase().includes(q);
          const varRaw = (it.variety || '').toString().toLowerCase();
          const varMatchRaw = varRaw.includes(q);
          const varMatchTranslated = (translateVar(it.variety) || '').toString().toLowerCase().includes(q);
          return cropMatch || varMatchRaw || varMatchTranslated;
        } catch (e) { return false; }
      });
    if (statusFilter === 'all') return matchesQuery;
    const contractStatus = (o._db_contract && o._db_contract.status) || o.status || 'pending';
    return matchesQuery && contractStatus === statusFilter.toLowerCase();
  });

  const openInvoice = async (order, isPrint = false) => {
    const contractNumber = order.contract_number || order.invoice_id;
    const logo192 = window.location.origin + logo;

    // Fetch contract details from backend
    let dbContract = null;
    let farmerDetails = null;
    let buyerDetails = null;
    const apiBase = process.env.REACT_APP_API_BASE || (window.__AGRIAI_API_BASE__ || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000'));
    try {
      const url = apiBase ? `${apiBase}/contracts/get/${encodeURIComponent(contractNumber)}` : `/contracts/get/${encodeURIComponent(contractNumber)}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data && data.contract) {
          dbContract = data.contract;
          console.log('✅ dbContract fetched:', dbContract); // Debug log
        } else {
          console.log('❌ No contract in response:', data); // Debug log
        }
      } else {
        console.log('❌ Fetch failed:', response.status, response.statusText); // Debug log
      }
    } catch (e) {
      console.warn('Failed to fetch contract details from backend:', e);
    }

    // Fetch buyer details if buyer_id exists
    if (dbContract && dbContract.buyer_id) {
      try {
        const buyerUrl = apiBase ? `${apiBase}/buyer/get?id=${dbContract.buyer_id}` : `/buyer/get?id=${dbContract.buyer_id}`;
        const buyerResponse = await fetch(buyerUrl);
        if (buyerResponse.ok) {
          const buyerData = await buyerResponse.json();
          buyerDetails = buyerData.buyer || buyerData.user || buyerData;
        }
      } catch (e) {
        console.warn('Failed to fetch buyer details:', e);
      }
    }

    // Fetch farmer details if farmer_id exists
    if (dbContract && dbContract.farmer_id) {
      try {
        const farmerUrl = apiBase ? `${apiBase}/farmer/get?id=${dbContract.farmer_id}` : `/farmer/get?id=${dbContract.farmer_id}`;
        const farmerResponse = await fetch(farmerUrl);
        if (farmerResponse.ok) {
          const farmerData = await farmerResponse.json();
          farmerDetails = farmerData.user || farmerData.farmer;
        }
      } catch (e) {
        console.warn('Failed to fetch farmer details:', e);
      }
    }

    // Extract contract details from dbContract or fallback to order/fetched data
    const buyerName = dbContract?.buyer_name || dbContract?.buyerName || order.buyer_name || buyerDetails?.name || 'Buyer Name';
    const buyerId = dbContract?.buyer_id || dbContract?.buyerId || order.buyer_id || buyerDetails?.id || '[Buyer ID]';
    const buyerState = dbContract?.buyer_state || order.buyer_state || buyerDetails?.state || '';
    const buyerRegion = dbContract?.buyer_region || order.buyer_region || buyerDetails?.region || '';
    const buyerAddress = `${buyerState}${buyerRegion ? (buyerState ? ', ' + buyerRegion : buyerRegion) : ''}`.trim() || buyerDetails?.address || buyerDetails?.location || '';
    console.log('Buyer address construction:', { buyerState, buyerRegion, buyerAddress, buyerDetailsAddress: buyerDetails?.address }); // Debug log
    const farmerName = dbContract?.farmer_name || dbContract?.farmerName || order.farmer_name || farmerDetails?.name || 'Farmer Name';
    const farmerId = dbContract?.farmer_id || dbContract?.farmerId || order.farmer_id || farmerDetails?.id || '[Farmer ID]';
    const farmerState = dbContract?.farmer_state || dbContract?.farmerState || order.farmer_state || farmerDetails?.state || '';
    const farmerRegion = dbContract?.farmer_region || dbContract?.farmerRegion || order.farmer_region || farmerDetails?.region || '';
    const farmerAddress = `${farmerState}${farmerRegion ? (farmerState ? ', ' + farmerRegion : farmerRegion) : ''}`.trim() || farmerDetails?.address || farmerDetails?.location || '';

    // Contract details from dbContract or defaults
    const contractNature = dbContract?.contract_nature || order.contract_nature || 'pre-harvest';
    const contractDuration = dbContract?.contract_duration || order.contract_duration || 'seasonal';
    const startDate = dbContract?.updated_at || dbContract?.updatedAt || dbContract?.start_date || dbContract?.startDate || order.start_date || order.created_at;
    const endDate = dbContract?.end_date || dbContract?.endDate || order.end_date || order.created_at;
    const createdDate = dbContract?.created_at || order.created_at;
    const signatureDate = formatDateTime(createdDate);

    // Calculate duration in days
    let days = '';
    try {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (!isNaN(s) && !isNaN(e)) {
        days = Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
      }
    } catch (e) { days = ''; }

    // Get items from dbContract or order
    let itemsArr = order.items || [];
    if ((!itemsArr || itemsArr.length === 0) && dbContract && dbContract.crop_name) {
      const qty = Number(dbContract.quantity || dbContract.quantity_kg || 0);
      const price = Number(dbContract.price_per_kg || 0);
      const amount = Math.round((qty * price + Number.EPSILON) * 100) / 100;
      itemsArr = [{
        crop_name: dbContract.crop_name,
        variety: dbContract.variety,
        order_quantity: qty,
        price_per_kg: price,
        amount
      }];
    }

    // Calculate totals from items
    const totalContractQty = (itemsArr || []).reduce((s, it) => s + (Number(it.order_quantity || it.quantity || 0) || 0), 0);
    const totalCropTradeValue = (itemsArr || []).reduce((s, it) => s + ((Number(it.order_quantity || it.quantity || 0) || 0) * (Number(it.price_per_kg || it.price || 0) || 0)), 0);
    const avgPricePerKg = totalContractQty > 0 ? (totalCropTradeValue / totalContractQty) : 0;

    // Farmer fees from dbContract or calculated
    const displayFarmerCommission = (dbContract?.farmer_platform_fee != null ? Number(dbContract.farmer_platform_fee) :
      (dbContract?.farmerPlatformFee != null ? Number(dbContract.farmerPlatformFee) :
        (totalCropTradeValue * 0.05))); // 5% default
    const displayFarmerGst = (dbContract?.farmer_gst != null ? Number(dbContract.farmer_gst) :
      (dbContract?.farmer_gst_on_fee != null ? Number(dbContract.farmer_gst_on_fee) :
        (displayFarmerCommission * 0.18))); // 18% GST
    const displayNetAmountToFarmer = (dbContract?.net_amount_payable_to_farmer != null ? Number(dbContract.net_amount_payable_to_farmer) :
      Math.round((totalCropTradeValue - displayFarmerCommission - displayFarmerGst + Number.EPSILON) * 100) / 100);

    // Buyer fees from dbContract or calculated
    const displayBuyerCommission = (dbContract?.buyer_platform_fee != null ? Number(dbContract.buyer_platform_fee) :
      (dbContract?.buyerPlatformFee != null ? Number(dbContract.buyerPlatformFee) :
        (totalCropTradeValue * 0.05))); // 5% default
    const displayBuyerGst = (dbContract?.buyer_gst != null ? Number(dbContract.buyer_gst) :
      (displayBuyerCommission * 0.18)); // 18% GST
    const totalAmountPayableByBuyer = (dbContract?.buyer_total != null ? Number(dbContract.buyer_total) :
      (dbContract?.total_amount != null ? Number(dbContract.total_amount) :
        Math.round((totalCropTradeValue + displayBuyerCommission + displayBuyerGst + Number.EPSILON) * 100) / 100));

    // Generate table rows
    const rowsHtml = (itemsArr || []).map((it, idx) => {
      const qty = Number(it.order_quantity || it.quantity || 0) || 0;
      const price = Number(it.price_per_kg || it.price || 0) || 0;
      const amount = Math.round((qty * price + Number.EPSILON) * 100) / 100;
      const varietyVal = it.variety || it.var || it.variety_name || it.varity || dbContract?.variety || '';
      return `<tr>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${idx + 1}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${it.crop_name || it.name || ''}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${translateVar(varietyVal)}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${qty.toLocaleString('en-IN')} kg</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${formatCurrency(price)}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${formatCurrency(amount)}</td>
        </tr>`;
    }).join('') || `<tr><td colspan="6" style="padding:8px;border:1px solid #ddd;text-align:center">${t('noItems', siteLang) || 'No items'}</td></tr>`;

    const html = `<!doctype html>
          <html>
    <head>
      <meta charset="utf-8" />
      <title>AgriAI Contract</title>
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          color: #1a1a1a;
          line-height: 1.8;
          background: #fff;
          padding: 20px 20px;
          max-width: 1000px;
          margin: 0 auto;
        }
        @page {
          size: A4;
          margin: 20mm;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
            color: #000;
            background: #fff !important;
            line-height: 1.4;
            font-size: 12px;
            max-width: 100%;
          }
          .section, .signature-section, .header, .footer {
            page-break-inside: avoid;
          }
          h1, h2, h3 {
            page-break-after: avoid;
            page-break-before: avoid;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #888 !important;
            padding: 6px 8px !important;
            font-size: 11px !important;
          }
          .print-page-break {
            page-break-after: always;
          }
        }
        .header {
          text-align: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 3px solid #236902;
        }
        .header img {
          width: 80px;
          height: auto;
          margin: 0 auto 16px auto;
          display: block;
        }
        h1 {
          text-align: center;
          color: #236902;
          margin: 8px 0;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        h2 {
          color: #1a5c10;
          margin: 12px 0 8px 0;
          font-size: 18px;
          font-weight: 700;
          padding-bottom: 8px;
          border-bottom: 2px solid #e0e0e0;
        }
        h3 {
          color: #236902;
          margin: 10px 0 6px 0;
          font-size: 15px;
          font-weight: 700;
        }
        p {
          margin: 6px 0;
          text-align: justify;
          font-size: 14px;
        }
        .section {
          margin: 12px 0;
          padding: 8px 0;
        }
        ul {
          margin: 6px 0 6px 24px;
          font-size: 14px;
          list-style-type: disc;
        }
        li {
          margin: 3px 0;
          list-style-type: disc;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        th {
          background: #236902;
          color: #fff;
          padding: 12px 8px;
          text-align: center;
          font-weight: 700;
          font-size: 13px;
          border: 1px solid #ddd;
        }
        td {
          padding: 10px 8px;
          border: 1px solid #ddd;
          text-align: center;
          font-size: 13px;
        }
        tr:nth-child(even) {
          background: #f9f9f9;
        }
        tr:hover {
          background: #f0f7ff;
        }
        strong {
          font-weight: 700;
          color: #1a5c10;
        }
        .party-section {
          background: #f5f9f5;
          padding: 12px;
          border-left: 4px solid #236902;
          margin: 8px 0;
          border-radius: 4px;
        }
        .signature-section {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 2px solid #ddd;
          display: flex;
          justify-content: space-around;
          gap: 32px;
        }
        .signature-line {
          text-align: center;
          width: 200px;
        }
        .signature-line p {
          margin: 4px 0;
          font-size: 15px;
        }
        .signature-line .line {
          border-top: 1px solid #000;
          margin: 24px 0 4px 0;
          min-height: 20px;
        }
        @media print {
          body {
            padding: 0;
          }
          .section {
            page-break-inside: avoid;
          }
          h2 {
            page-break-after: avoid;
          }
        }
      </style>
    </head>
    <body>
    <div class="header">
      <img src="${logo192}" alt="AgriAI" />
      <h1>AGRIAI FARMING AGREEMENT</h1>
      <div style="text-align: center; margin-top: 10px; font-size: 14px;">
        <p><strong>Contract Number:</strong> ${contractNumber}</p>
        <p><strong>Date:</strong> ${signatureDate}</p>
      </div>
    </div>

      <section class="section">
      <h2>PARTIES TO THE CONTRACT</h2>
      <div class="party-section">
        <p><strong>Party A – Buyer / Company</strong></p>
        <p><b>Name:</b> ${buyerName}</p>
        <p><b>Buyer ID:</b> ${buyerId}</p>
        <p><b>Address:</b> ${buyerAddress}</p>
      </div>

      <div class="party-section">
        <p><strong>Party B – Farmer / Producer</strong></p>
        <p><b>Name:</b> ${farmerName}</p>
        <p><b>Farmer ID:</b> ${farmerId}</p>
        <p><b>Address:</b> ${farmerAddress}</p>
      </div>

      <p>
         Party A and Party B are collectively referred to as "the Parties."
          AgriAI acts solely as a digital facilitation platform and is not a buyer, seller, transporter, insurer, or agent of either Party.
      </p>
    </section>

      <section class="section">
        <h2>1. PURPOSE OF AGREEMENT</h2>
        <p>
          This Agreement defines the terms and conditions under which the Farmer agrees to produce
          and supply agricultural produce to the Buyer, and the Buyer agrees to procure such produce
          at a pre-determined price, ensuring:
        </p>
        <ul>
          <li>Assured market access to the Farmer</li>
          <li>Fair and transparent pricing</li>
          <li>Timely and secure payment</li>
          <li>Reduced dependency on intermediaries</li>
        </ul>
      </section>

      <section class="section">
        <h2>2. CONTRACT TYPE & DURATION</h2>
        <p><b>Contract Nature:</b> ${contractNature === 'pre-harvest' ? 'Pre-Harvest Production Contract' : 'Post-Harvest Procurement Contract'}</p>
        <p><b>Contract Duration:</b> ${contractDuration === 'one-time' ? 'One-Time' : (contractDuration === 'seasonal' ? 'Seasonal' : 'Yearly')}</p>
        <p><b>Start Date:</b> ${formatDateTime(startDate)}</p>
        <p><b>End Date:</b> ${formatDateTime(endDate)}</p>
        <p><b>Duration:</b> ${days} Days</p>
        <p>
          ${contractNature === 'pre-harvest' ? 'Under this Pre-Harvest Production Contract, the Farmer agrees to cultivate and supply the produce as per the agreed specifications. Cultivation obligations apply under this contract.' : 'Under this Post-Harvest Procurement Contract, the produce has already been cultivated or harvested prior to execution of this Agreement. No cultivation obligation arises under this contract.'}
        </p>
        <h3>2.1 Contract Acceptance & Negotiation Window</h3>
        <p>
          This procurement contract shall remain valid for acceptance for a period of forty-eight (48) hours from the time it is digitally sent by the Farmer to the Buyer through the AgriAI platform.
        </p>
        <p>
          Within this 48-hour period, the Buyer must take one of the following actions through the platform:
        </p>
        <ul>
          <li>Accept the contract in its current form; or</li>
          <li>Reject the contract; or</li>
          <li>Request a negotiation.</li>
        </ul>
        <p>
          If the Buyer does not take any action within the 48-hour validity period, the contract shall automatically expire and shall have no legal or binding effect on either Party.
        </p>
        <p>
          Any request for price negotiation shall be time-bound and must be concluded within forty-eight (48) hours from the time the negotiation is initiated. If no agreement is reached within this period, the negotiation shall automatically lapse, and the contract shall stand cancelled.
        </p>
      </section>

      <section class="section">
        <h2>3. DATA PRIVACY & PLATFORM COMPLIANCE</h2>
        <p>
          All personal, agricultural, and transactional data collected through the AgriAI platform shall be:
        </p>
        <ul>
          <li>Stored securely</li>
          <li>Contract execution and renewal</li>
          <li>Payment settlement</li>
          <li>Insurance facilitation</li>
          <li>Legal and regulatory compliance</li>
        </ul>
        <p>
          This Agreement is fully compliant with the Digital Personal Data Protection Act, 2023.
        </p>
      </section>

      <section class="section">
        <h2>4. COMMODITY DETAILS</h2>
        <table>
          <thead>
            <tr>
              <th>Sl. No</th>
              <th>Crop Name</th>
              <th>Variety</th>
              <th>Quantity (kg)</th>
              <th>Price (₹/kg)</th>
              <th>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </section>

      <section class="section">
        <h2>5. PRICE & PAYMENT TERMS</h2>

        <h3>5.1 Farmer's Payment Structure</h3>
        <p><b>Total Quantity:</b> ${totalContractQty.toLocaleString('en-IN')} kg</p>
        <p><b>Price per Unit:</b> ${formatCurrency(avgPricePerKg)} per kg</p>
        <p><b>Platform Fee:</b> ${formatCurrency(displayFarmerCommission)}</p>
        <p><b>GST (18%):</b> ${formatCurrency(displayFarmerGst)}</p>
        <p><b style="font-size: 16px; color: #236902;">Total Amount (After Deduction):</b> <b style="font-size: 16px; color: #236902;">${formatCurrency(displayNetAmountToFarmer)}</b></p>

        <h3 style="margin-top: 20px;">5.2 Buyer's Payment Structure</h3>
        <p><b>Total Quantity:</b> ${totalContractQty.toLocaleString('en-IN')} kg</p>
        <p><b>Price per Unit:</b> ${formatCurrency(avgPricePerKg)} per kg</p>
        <p><b>Platform Fee:</b> ${formatCurrency(displayBuyerCommission)}</p>
        <p><b>GST (18%):</b> ${formatCurrency(displayBuyerGst)}</p>
        <p><b style="font-size: 16px; color: #236902;">Total Amount Payable:</b> <b style="font-size: 16px; color: #236902;">${formatCurrency(totalAmountPayableByBuyer)}</b></p>

        <h3 style="margin-top: 20px;">5.3 Payment Schedule</h3>
        <ul>
          <li><b>Advance (25%):</b> ${formatCurrency(totalAmountPayableByBuyer * 0.25)} – Due at contract confirmation</li>
          <li><b>On Delivery (50%):</b> ${formatCurrency(totalAmountPayableByBuyer * 0.50)} – Due upon successful delivery</li>
          <li><b>Final (25%):</b> ${formatCurrency(totalAmountPayableByBuyer * 0.25)} – Due within 7 working days after quality acceptance</li>
        </ul>

        <h3 style="margin-top: 20px;">5.4 Mode of Payment</h3>
         <p>Bank Transfer / UPI / Cheque</p>
        <p>The Buyer shall issue digital or physical receipts for all payments made under this Agreement.</p></section>

      <section class="section">
        <h2>6. DELIVERY, LOGISTICS & TRANSPORTATION</h2>
        <h3>6.1 Role of AgriAI</h3>
        <p>
        AgriAI operates solely as a digital technology platform facilitating transactions between Buyers and Farmers.
        AgriAI shall not be deemed a buyer, seller, trader, commission agent, transporter, or custodian of goods.
        All obligations relating to sale and purchase remain strictly between the Parties.
      </p>

        <h3>6.2 Transportation</h3>
        <p>
        Transportation shall be facilitated through third-party logistics service providers available on or approved by the AgriAI platform.
        The selection of logistics provider and vehicle type shall be based on crop nature, quantity, distance, and handling requirements.
      </p>

        <h3>6.3 Delivery Charges</h3>
        <p>
        Delivery charges shall be determined by the third-party logistics provider based on actual distance, vehicle type, loading requirements, and location.
        Such charges shall be paid directly by the Buyer to the logistics provider.
        AgriAI shall not be responsible for determining or negotiating delivery pricing.
      </p>
        <h3>6.4 Transfer of Risk</h3>
        <p>
        Risk and responsibility for the produce shall remain with the logistics provider during transit.
        Risk shall transfer to the Buyer only upon successful delivery and signed Proof of Delivery (POD).
      </p>
        <h3>6.5 Delay, Damage & Loss</h3>
        <p>
        Any delay, damage, shortage, or loss occurring during transit shall be governed by the logistics provider's terms and conditions.
        AgriAI shall not be liable for any such claims.
      </p>
        <h3>6.6 Proof of Delivery</h3>
        <p>
        Delivery shall be confirmed through physical receipt, digital confirmation, and/or electronic POD recorded on the AgriAI platform.
        Digital records maintained by AgriAI shall constitute valid evidence of delivery.
      </p>
      </section>
      <section class="section">
        <h2>7. QUALITY STANDARDS, INSPECTION & ACCEPTANCE</h2>

      <p>
        The produce supplied shall meet the mutually agreed specifications mentioned in this Agreement.
      </p>

      <p>
        The Buyer shall complete quality inspection within 3 (three) working days from the date of delivery.
      </p>

      <p>
        Any rejection must be raised in writing through the AgriAI platform within the inspection period,
        clearly stating valid and verifiable reasons.
      </p>

      <p>
        If no dispute is raised within 3 working days, the produce shall be deemed accepted.
      </p>

      <p>
        In case of justified rejection, return transportation costs shall be borne by the Buyer unless the defect is proven to have originated prior to dispatch.
      </p>
    </section>

    <section class="section">
        <h2>8. RISK, LIABILITY & INSURANCE</h2>

      <p>
        The Farmer shall follow standard agricultural and post-harvest practices.
      </p>

      <p>
        In case of crop loss due to natural calamities or force majeure before dispatch, obligations may be reviewed mutually.
        Crop insurance, if applicable under government schemes such as PMFBY or other approved insurers, shall remain in the Farmer's name.
      </p>

      <p>
        Any insurance compensation received shall belong solely to the Farmer.
      </p>

      <p>
        After delivery and deemed acceptance, all risks, ownership, and liabilities shall transfer entirely to the Buyer.
      </p>
    </section>

      <section class="section">
        <h2>9. FORCE MAJEURE</h2>

      <p>
        Neither Party shall be liable for failure or delay caused by events beyond reasonable control,
        including natural disasters, government restrictions, war, strikes, transportation disruptions, or unforeseen calamities.
      </p>

      <p>
        Obligations shall resume once such conditions cease to exist.
      </p>
    </section>

      <section class="section">
        <h2>10. DISPUTE RESOLUTION & JURISDICTION</h2>

      <p>
        Any dispute arising out of this Agreement shall first be resolved amicably through discussion via the AgriAI platform.
      </p>

      <p>
        If unresolved within 15 days, disputes shall be referred to arbitration under the Arbitration and Conciliation Act, 1996.
        The seat of arbitration shall be determined by AgriAI.
      </p>

      <p>
        Subject to arbitration, the courts of <strong>Bengaluru, Karnataka</strong> shall have exclusive jurisdiction
      for enforcement and legal proceedings arising under this Agreement.
      </p>
    </section>

      <section class="section">
        <h2>11. TERMINATION</h2>

      <p>
        Either Party may terminate this Agreement for material breach, including non-payment, non-delivery,
        misrepresentation, or violation of agreed terms.
      </p>

      <p>
        In case of payment default beyond agreed timelines, the defaulting Party may face account suspension,
        penalty charges, and recovery proceedings as permitted under law.
      </p>
    </section>

      <section class="section">
        <h2>12. LANGUAGE OF AGREEMENT</h2>

      <p>
        This Agreement has been explained and translated to the Farmer in <strong> ${siteLang === 'en' ? 'English' : (siteLang === 'hi' ? 'हिंदी' : (siteLang === 'kn' ? 'ಕನ್ನಡ' : 'English'))} (Language)</strong>.
        In case of any inconsistency, the English version shall prevail.
      </p>
    </section>

      <section class="section">
        <h2>13. EXECUTION & DIGITAL ACCEPTANCE</h2>

      <p>
        This Agreement may be executed electronically through the AgriAI platform.
        Digital acceptance using registered credentials shall constitute legally binding consent.
      </p>

      <section class="signature-section">
        <div class="signature-line">
          
    <p><b>Buyer / Company</b></p>
     <p>Name: ${buyerName}</p>
     <p>Date: ${signatureDate}</p>
      
    
          </div>
        <div class="signature-line">
        ${((dbContract?.status && String(dbContract.status).toLowerCase() === 'accepted') || (order.status && String(order.status).toLowerCase() === 'accepted')) ?
          `<p><b>Farmer / Producer</b></p>
          <p>Name: ${farmerName}</p>
          <p>Date: ${signatureDate}</p>
          ` :
          `<p><b>Farmer / Producer</b></p>
          <p>Name: ___________________________</p>
          <p>Date: ___________________________</p>`
        }
        
        </div>
      </section>

      <p style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; font-size: 12px; color: #000; font-weight: bold;">
        <b>Witness:</b> AgriAI Platform | Digital Record: ${new Date().toISOString()}
      </p>

    </body>
    </html>`;

    const selectedLang = siteLang || localStorage.getItem('agri_lang') || 'en';
    const languageName = selectedLang === 'hi' ? 'हिंदी' : (selectedLang === 'kn' ? 'ಕನ್ನಡ' : 'English');
    const htmlToRender = (selectedLang === 'hi' || selectedLang === 'kn')
      ? getContractHtml(selectedLang, {
        logo192,
        contractNumber,
        signatureDate,
        buyerName,
        buyerId,
        buyerAddress,
        farmerName,
        farmerId,
        farmerAddress,
        contractNature,
        contractDuration,
        startDate,
        endDate,
        days,
        rowsHtml,
        totalContractQty,
        avgPricePerKg,
        displayFarmerCommission,
        displayFarmerGst,
        displayNetAmountToFarmer,
        displayBuyerCommission,
        displayBuyerGst,
        totalAmountPayableByBuyer,
        languageName,
        dbContract,
        order
      })
      : html;

    if (isPrint) {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      iframe.contentWindow.document.write(htmlToRender);
      iframe.contentWindow.document.close();
      setTimeout(() => {
        iframe.contentWindow.print();
        document.body.removeChild(iframe);
      }, 500);
    } else {
      const w = window.open('', '_blank');
      w.document.write(htmlToRender);
      w.document.close();
    }
  };

  const printContract = async (order) => {
    try {
      await openInvoice(order, true);
    } catch (e) {
      console.warn('printContract failed', e);
    }
  };





  const handleDelete = async (idKey) => {
    if (!window.confirm(t('confirmDelete', siteLang) || 'Delete this contract? This action cannot be undone.')) return;
    try {
      const apiBase = process.env.REACT_APP_API_BASE || (window.__AGRIAI_API_BASE__ || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000'));
      
      // ask server to remove contract and restore crops (backend handles everything now)
      try {
        const resp = await fetch(`${apiBase}/contracts/delete/${encodeURIComponent(idKey)}`, { method: 'DELETE' });
        const j = await resp.json().catch(() => ({}));
        console.log('🗑️ handleDelete: Delete response status:', resp.status, j);
        if (!resp.ok) {
          console.warn('contract delete failed', resp.status, j);
          alert((t('failedDelete', siteLang) || 'Delete failed') + ': ' + (j.error || resp.status));
          return;
        }
      } catch (e) {
        console.warn('contract delete network error', e);
        alert((t('failedDelete', siteLang) || 'Delete failed') + ': ' + String(e));
        return;
      }

      // Remove from local state only (no localStorage)
      setOrders(prev => (prev || []).filter(o => ((o.contract_number || o.invoice_id) !== idKey)));

      // Dispatch event to notify farmer deals page to refresh with restored quantities
      try {
        window.dispatchEvent(new CustomEvent('agriai:contract:deleted', {
          detail: {
            contract_number: idKey,
            crops_restored: true  // backend now handles crop restoration
          }
        }));
      } catch (e) {}

      alert(t('deleteSuccess', siteLang) || 'Contract deleted and crops restored.');
    } catch (e) { console.warn('delete history failed', e); }
  };

  return (
    <div className="fh-root" style={{ background: 'rgba(83, 255, 3, 0.12)', backgroundAttachment: 'fixed', minHeight: '100vh', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        .fh-root .navbar {
          background: oklch(0.12 0.03 160 / 0.5) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
        }
        .fh-root .navbar select {
          background: oklch(0.12 0.03 160 / 0.6) !important;
          border: 1px solid oklch(0.65 0.22 145 / 0.3) !important;
          color: rgba(255,255,255,0.9) !important;
        }
        .fh-root .navbar select option {
          background: #1a1a1a;
          color: #ffffff;
        }
      `}</style>
      <Navbar />
      <main style={{ padding: '6rem 1rem 2rem' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px) saturate(1.6)', WebkitBackdropFilter: 'blur(20px) saturate(1.6)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: '24px', padding: '2.5rem', boxShadow: '0 8px 32px rgba(35,105,2,0.12), 0 32px 64px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)' }}>
          <h1 style={{ backgroundImage: 'linear-gradient(135deg, #1a5c10 0%, #236902 50%, #53b635 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', textAlign: 'center', fontSize: '2rem', fontWeight: 800, margin: 0 }}>{t('historyTitle', siteLang) || 'Purchase History'}</h1>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12, alignItems: 'center', justifyContent: 'space-between' }}>
            <input
              placeholder={t('historySearchPlaceholder', siteLang) || 'Search by Contract ID or crop name'}
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ flex: '1 1 280px', minWidth: 240, padding: '10px 14px', border: '1.5px solid #d4edcc', borderRadius: 10, color: '#1a3d0a', background: 'rgba(255,255,255,0.95)', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.2s' }}
              onFocus={(e) => { e.target.style.borderColor = '#53b635'; e.target.style.boxShadow = '0 0 0 3px rgba(83,182,53,0.18), 0 2px 8px rgba(35,105,2,0.1)'; e.target.style.transform = 'translateY(-2px)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#d4edcc'; e.target.style.boxShadow = 'none'; e.target.style.transform = 'translateY(0)'; }}
            />
            <div>
              <label style={{ marginRight: 8, fontWeight: 700, color: '#2d5c1a', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('statusLabel', siteLang) || 'Status:'}</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '10px 14px', border: '1.5px solid #d4edcc', borderRadius: 10, color: '#1a3d0a', background: 'rgba(255,255,255,0.95)', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.2s' }}
                onFocus={(e) => { e.target.style.borderColor = '#53b635'; e.target.style.boxShadow = '0 0 0 3px rgba(83,182,53,0.18), 0 2px 8px rgba(35,105,2,0.1)'; e.target.style.transform = 'translateY(-2px)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#d4edcc'; e.target.style.boxShadow = 'none'; e.target.style.transform = 'translateY(0)'; }}>
                <option value="all">{t('all', siteLang) || 'All'}</option>
                <option value="accepted">{t('accepted', siteLang) || 'Accepted'}</option>
                <option value="rejected">{t('rejected', siteLang) || 'Rejected'}</option>
                <option value="pending">{t('pending', siteLang) || 'Pending'}</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <div style={{ fontSize: 52, lineHeight: 1 }}>🧾</div>
              <div style={{ marginTop: 8, color: '#1a3d0a' }}>{t('historyNoPurchases', siteLang) || 'No matching purchases yet.'}</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
              {filtered.map((o) => {
                const total = o?.totals?.grand_total || 0;
                const idKey = o.contract_number || o.invoice_id;
                // Fetch buyer amount from contracts table
                const buyerAmount = (o._db_contract && (o._db_contract.buyer_total || o._db_contract.total_amount_payable_by_buyer)) 
                  || o?.totals?.grand_total 
                  || 0;
                
                return (
                  <div key={idKey} style={{ border: '1px solid rgba(83,182,53,0.15)', borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.5)' }}>
                    <div style={{ padding: '12px 14px', background: 'linear-gradient(135deg, rgba(234,246,234,0.8), rgba(212,240,212,0.8))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div style={{ fontWeight: 800, color: '#236902' }}>{(t('contractLabel', siteLang) || 'Contract') + ': '}{idKey}</div>
                        {(() => {
                          const sender = ((o.sender || (o._db_contract && o._db_contract.sender) || '') + '').toString().trim().toLowerCase();
                          
                          // For contracts from the contracts table (accepted/rejected), default to "Sent by Farmer"
                          // since these are contracts that were sent by farmers and accepted/rejected by buyers
                          let effectiveSender = sender;
                          if (!sender && o.source_table === 'contracts') {
                            effectiveSender = 'farmer';
                          }
                          
                          if (!effectiveSender) {
                            return null;
                          }
                          const senderLabel = effectiveSender === 'farmer'
                            ? (t('sentByFarmer', siteLang) || 'Sent by Farmer')
                            : effectiveSender === 'buyer'
                              ? (t('sentByBuyer', siteLang) || 'Sent by Buyer')
                              : '';
                          return senderLabel ? (
                            <div style={{ color: '#2d5c1a', marginTop: 4, fontSize: '0.9rem' }}>
                              {senderLabel}
                            </div>
                          ) : null;
                        })()}
                        <div style={{ color: '#2d5c1a', marginTop: 4, fontSize: '0.9rem' }}>
                          {(() => {
                            // Prioritize created_at from contract_b (_db_contract) over contracts table
                            const createdDate = (o._db_contract && o._db_contract.created_at) || o.created_at || o.contract_datetime;
                            return formatDateTime(createdDate);
                          })()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <div style={{ fontWeight: 800, color: '#236902', whiteSpace: 'nowrap', marginRight: 10 }}>{formatCurrency(buyerAmount)}</div>
                        <button 
                          onClick={() => openInvoice(o)} 
                          style={{ background: 'linear-gradient(135deg, #236902 0%, #53b635 100%)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 10, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(35,105,2,0.2)', transition: 'transform 0.18s, box-shadow 0.18s, filter 0.18s' }}
                          onMouseEnter={(e) => { e.target.style.transform = 'translateY(-3px) scale(1.03)'; e.target.style.boxShadow = '0 8px 24px rgba(35,105,2,0.35)'; e.target.style.filter = 'brightness(1.08)'; }}
                          onMouseLeave={(e) => { e.target.style.transform = 'translateY(0) scale(1)'; e.target.style.boxShadow = '0 4px 12px rgba(35,105,2,0.2)'; e.target.style.filter = 'brightness(1)'; }}
                        >
                          {t('viewContract', siteLang) || 'View Contract'}
                        </button>
                        {/* Show contract status instead of a generic Details button */}
                        {(() => {
                          const st = (o._db_contract && o._db_contract.status) || o.status || 'pending';
                          const s = String(st).toLowerCase();
                          let bg = '#f5f5f5';
                          let color = '#333';
                          let border = '1px solid #ddd';
                          if (s === 'accepted' || s === 'accept' || s === 'approved') { bg = '#4caf50'; color = '#fff'; border = '1px solid #45a049'; }
                          else if (s === 'pending' || s === 'awaiting' || s === 'pending_confirmation') { bg = '#ffeb3b'; color = '#000'; border = '1px solid #fdd835'; }
                          else if (s === 'rejected' || s === 'declined' || s === 'cancelled') { bg = '#f44336'; color = '#fff'; border = '1px solid #e53935'; }
                          return (
                            <button disabled style={{ background: bg, color, border, padding: '8px 14px', borderRadius: 10, cursor: 'default', fontWeight: 600, fontSize: '0.85rem' }}>{(t(s, siteLang) || (st && String(st).toUpperCase()) || 'STATUS')}</button>
                          );
                        })()}
                        <button onClick={() => printContract(o)} style={{ background: '#ffffff', color: '#236902', border: '1px solid #236902', padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', boxShadow: '0 2px 8px rgba(35,105,2,0.15)', transition: 'transform 0.18s, box-shadow 0.18s, filter 0.18s' }} title={t('print', siteLang) || 'Print'}
                          onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px) scale(1.02)'; e.target.style.boxShadow = '0 6px 20px rgba(35,105,2,0.25)'; e.target.style.filter = 'brightness(1.05)'; }}
                          onMouseLeave={(e) => { e.target.style.transform = 'translateY(0) scale(1)'; e.target.style.boxShadow = '0 2px 8px rgba(35,105,2,0.15)'; e.target.style.filter = 'brightness(1)'; }}
                        >
                          🖨️
                        </button>
                        {( ((o._db_contract && (String(o._db_contract.status).toLowerCase() === 'pending' || String(o._db_contract.status).toLowerCase() === 'negotiated'))
                             || (String(o.status || '').toLowerCase() === 'pending' || String(o.status || '').toLowerCase() === 'negotiated')) && (
                          <button onClick={() => handleDelete(idKey)} title={t('delete', siteLang) || 'Delete'} style={{ background: 'rgba(198,40,40,0.1)', color: '#c62828', border: '1px solid rgba(198,40,40,0.3)', padding: '8px 12px', borderRadius: 10, marginLeft: 6, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, transition: 'all 0.2s' }}>{'🗑️'}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t" style={{background:'oklch(0.12 0.03 160 / 0.5)', backdropFilter: 'blur(12px)', WebkitBilter: 'blur(12px)', borderColor:'oklch(0.65 0.22 145 / 0.12)', padding:'1em 0'}}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2 font-bold text-xl mb-2">
                <div className="w-7 h-7 rounded-lg border border-primary/40 flex items-center justify-center" style={{background:'oklch(0.65 0.22 145 / 0.2)', borderColor:'oklch(0.65 0.22 145)'}}>
                  <Leaf className="w-3.5 h-3.5" style={{color:'oklch(0.65 0.22 145)'}} />
                </div>
                <span style={{color:'oklch(0.65 0.22 145)', fontFamily:"'Times New Roman', Times, serif"}}>AgriAI</span>
              </div>
              <p className="text-white text-sm leading-relaxed" style={{fontFamily:"'Times New Roman', Times, serif"}}>
                {t('footerDescription', siteLang)}
              </p>
            </div>

            {[
              { title: t('footerPlatform', siteLang), links: ['footerAbout', 'footerHowItWorks', 'footerFeatures', 'footerPricing'] },
              { title: t('footerUsers', siteLang), links: ['footerFarmers', 'footerBuyers', 'footerAgribusiness', 'footerPartners'] },
              { title: t('footerLegal', siteLang), links: ['footerPrivacy', 'footerTerms', { label: t('footerContact', siteLang), path: "/contact" }] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-white mb-2" style={{fontFamily:"'Times New Roman', Times, serif"}}>{col.title}</h4>
                <ul className="space-y-1">
                  {col.links.map((link) => {
                    const label = typeof link === 'string' ? t(link, siteLang) : link.label;
                    const path = typeof link === 'string' ? "/" : link.path;
                    return (
                      <li key={label}>
                        {path === "/contact" ? (
                          <Link to="/contact" className="text-white text-sm transition-colors" style={{fontFamily:"'Times New Roman', Times, serif"}}>
                            {label}
                          </Link>
                        ) : (
                          <a href={path} className="text-white text-sm transition-colors" style={{fontFamily:"'Times New Roman', Times, serif"}}>
                            {label}
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-3 flex justify-center items-center text-white text-sm" style={{borderTop:'1px solid oklch(0.65 0.22 145 / 0.12)', fontFamily:"'Times New Roman', Times, serif"}}>
            <span>
              © {new Date().getFullYear()} AgriAI. {t('footerRights', siteLang)}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}