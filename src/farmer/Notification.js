import React from 'react';
import Navbar from '../Navbar';
import { t } from '../i18n';

export default function Notification() {
  const [notifList, setNotifList] = React.useState([]);
  const [notifCount, setNotifCount] = React.useState(0);
  const [siteLang, setSiteLang] = React.useState(() => localStorage.getItem('agri_lang') || 'en');
  const [showContractPreview, setShowContractPreview] = React.useState(false);
  const [contractHtml, setContractHtml] = React.useState('');
  const [currentContractNotification, setCurrentContractNotification] = React.useState(null);

  const farmerId = localStorage.getItem('agriai_id') || '';
  const userRole = localStorage.getItem('agriai_role') || '';
  
  // Debug: Log all localStorage keys
  React.useEffect(() => {
    console.log('=== NOTIFICATION.JS DEBUG ===');
    console.log('localStorage agriai_id:', localStorage.getItem('agriai_id'));
    console.log('localStorage agriai_role:', localStorage.getItem('agriai_role'));
    console.log('localStorage agriai_name:', localStorage.getItem('agriai_name'));
    console.log('localStorage agriai_email:', localStorage.getItem('agriai_email'));
    console.log('Computed farmerId:', farmerId);
    console.log('Computed userRole:', userRole);
    console.log('=============================');
  }, []);

  // Message-specific handlers
  const markAsRead = async (n) => {
    try {
      if (n.id) {
        // Call backend to mark as read (single notification)
        if (!Number(n.is_read)) {
          const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');
          const payload = {
            contract_numbers: [n.id],
            user_role: userRole,
            farmer_id: farmerId,
            mark_farmer_all: true
          };
          try {
            await fetch(`${apiBase}/notifications/mark-read`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
          } catch (e) {
            console.warn('Failed to call backend mark-read', e);
          }
        }

        // Update local state
        setNotifList(prev => prev.map(x => x.id === n.id ? { ...x, is_read: 1 } : x));
        setNotifCount(prev => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.warn('Failed to mark notification as read', e);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Collect unread ids from current list
      const unreadIds = (Array.isArray(notifList) ? notifList.filter(x => !(x && Number(x.is_read))) : []).map(x => x && x.id).filter(Boolean);
      console.log('Marking as read, IDs:', unreadIds);
      
      // Call backend to mark all as read
      const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');
      if (unreadIds.length) {
        try {
          const payload = {
            contract_numbers: unreadIds,
            user_role: userRole,
            farmer_id: farmerId,
            mark_farmer_all: true
          };
          const res = await fetch(`${apiBase}/notifications/mark-read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          console.log('Mark-read response:', res.status);
        } catch (e) {
          console.warn('Network error marking as read:', e);
        }
      }
      
      // Update local state immediately to reflect in UI
      setNotifList(prev => Array.isArray(prev) ? prev.map(n => ({ ...n, is_read: 1 })) : prev);
      setNotifCount(0);
    } catch (e) {
      console.warn('Failed to mark all as read', e);
    }
  };

  const formatDateTime = (iso) => {
    try {
      const d = new Date(iso);
      if (isNaN(d)) return String(iso);
      return d.toLocaleString();
    } catch (e) { return String(iso); }
  };
  const handleViewContract = async (n) => {
    try {
      console.log('🔔 VIEW CONTRACT BUTTON CLICKED!', n);
      console.log('🔔 About to mark as read');
      markAsRead(n);
      
      // Generate contract preview
      const lang = localStorage.getItem('agri_lang') || 'en';
      console.log('🔔 Language:', lang);
      
      const buyerName = n.buyer_name || 'Buyer Name';
      const buyerId = n.buyer_id || 'ID';
      const buyerAddress = n.buyer_address || 'Address';
      const buyerState = n.buyer_state || '';
      const farmerName = localStorage.getItem('agriai_name') || n.farmer_name || 'Farmer';
      const farmerId = localStorage.getItem('agriai_id') || n.farmer_id || 'ID';
      const farmerAddress = localStorage.getItem('agriai_address') || n.farmer_address || 'Address';
      const farmerState = n.farmer_state || '';
      const cropName = n.crop_name || 'Crop';
      const quantity = Number(n.quantity_kg || 0);
      const variety = n.variety || 'Variety';
      const pricePerKg = Number(n.price_per_kg || 0);
      const totalAmount = quantity * pricePerKg;
      const contractNumber = n.contract_number || 'CNT' + Date.now();
      const startDate = new Date().toLocaleDateString('en-GB');
      const endDate = new Date(Date.now() + 45 * 24 * 3600 * 1000).toLocaleDateString('en-GB');
      
      console.log('🔔 Contract params:', { buyerName, farmerName, cropName, quantity, pricePerKg });
      
      let html = '';
      if (lang === 'hi') {
        html = generateContractHindi(farmerName, farmerId, farmerAddress, farmerState, buyerName, buyerId, buyerAddress, buyerState, cropName, variety, quantity, pricePerKg, totalAmount, contractNumber, startDate, endDate);
      } else if (lang === 'kn') {
        html = generateContractKannada(farmerName, farmerId, farmerAddress, farmerState, buyerName, buyerId, buyerAddress, buyerState, cropName, variety, quantity, pricePerKg, totalAmount, contractNumber, startDate, endDate);
      } else {
        html = generateContractEnglish(farmerName, farmerId, farmerAddress, farmerState, buyerName, buyerId, buyerAddress, buyerState, cropName, variety, quantity, pricePerKg, totalAmount, contractNumber, startDate, endDate);
      }
      
      console.log('🔔 Generated HTML length:', html.length);
      console.log('🔔 First 200 chars:', html.substring(0, 200));
      
      setContractHtml(html);
      setCurrentContractNotification(n);
      
      setTimeout(() => {
        console.log('🔔 Setting showContractPreview to true');
        setShowContractPreview(true);
      }, 50);
    } catch (e) {
      console.error('❌ Failed to view contract', e);
      alert('Error: ' + e.message);
    }
  };

  const generateContractEnglish = (farmerName, farmerId, farmerAddress, farmerState, buyerName, buyerId, buyerAddress, buyerState, cropName, variety, quantity, pricePerKg, totalAmount, contractNumber, startDate, endDate) => {
    return `
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #fff; }
        .header { text-align: center; border-bottom: 3px solid #236902; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { color: #236902; margin: 0; font-size: 24px; }
        .header p { color: #666; margin: 5px 0 0 0; }
        .section { margin-bottom: 20px; }
        .section h3 { color: #236902; border-bottom: 2px solid #236902; padding-bottom: 8px; margin-top: 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th { background: #f0f7f0; color: #236902; padding: 10px; text-align: left; font-weight: bold; border: 1px solid #ddd; }
        td { padding: 10px; border: 1px solid #ddd; }
        .total-row { background: #f0f7f0; font-weight: bold; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #236902; text-align: center; color: #666; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🌾 AGRICULTURAL PROCUREMENT CONTRACT</h1>
        <p>Contract Number: ${contractNumber}</p>
        <p>Date: ${startDate}</p>
      </div>
      
      <div class="section">
        <h3>Farmer Details</h3>
        <table>
          <tr><td style="width: 40%; background: #f9f9f9;"><strong>Farmer Name:</strong></td><td>${farmerName}</td></tr>
          <tr><td style="background: #f9f9f9;"><strong>Farmer ID:</strong></td><td>${farmerId}</td></tr>
          <tr><td style="background: #f9f9f9;"><strong>Address:</strong></td><td>${farmerAddress}, ${farmerState}</td></tr>
        </table>
      </div>
      
      <div class="section">
        <h3>Buyer Details</h3>
        <table>
          <tr><td style="width: 40%; background: #f9f9f9;"><strong>Buyer Name:</strong></td><td>${buyerName}</td></tr>
          <tr><td style="background: #f9f9f9;"><strong>Buyer ID:</strong></td><td>${buyerId}</td></tr>
          <tr><td style="background: #f9f9f9;"><strong>Address:</strong></td><td>${buyerAddress}, ${buyerState}</td></tr>
        </table>
      </div>
      
      <div class="section">
        <h3>Commodity Details</h3>
        <table>
          <tr>
            <th>Crop Name</th>
            <th>Variety</th>
            <th>Quantity (kg)</th>
            <th>Price/kg (₹)</th>
            <th>Total (₹)</th>
          </tr>
          <tr>
            <td>${cropName}</td>
            <td>${variety}</td>
            <td style="text-align: right;">${quantity.toLocaleString('en-IN')}</td>
            <td style="text-align: right;">₹${pricePerKg.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
            <td style="text-align: right;">₹${totalAmount.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
          </tr>
          <tr class="total-row">
            <td colspan="4" style="text-align: right;">Contract Total:</td>
            <td style="text-align: right;">₹${totalAmount.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
          </tr>
        </table>
      </div>
      
      <div class="section">
        <h3>Contract Terms</h3>
        <table>
          <tr><td style="width: 40%; background: #f9f9f9;"><strong>Start Date:</strong></td><td>${startDate}</td></tr>
          <tr><td style="background: #f9f9f9;"><strong>End Date:</strong></td><td>${endDate}</td></tr>
          <tr><td style="background: #f9f9f9;"><strong>Contract Duration:</strong></td><td>45 days</td></tr>
          <tr><td style="background: #f9f9f9;"><strong>Contract Type:</strong></td><td>Agricultural Procurement</td></tr>
        </table>
      </div>
      
      <div class="footer">
        <p>This contract is valid as per AgriAI terms and conditions.</p>
        <p>For more information, visit www.agriai.com</p>
      </div>
    </body>
    </html>
    `;
  };

  const generateContractHindi = (farmerName, farmerId, farmerAddress, farmerState, buyerName, buyerId, buyerAddress, buyerState, cropName, variety, quantity, pricePerKg, totalAmount, contractNumber, startDate, endDate) => {
    return `
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #fff; }
        .header { text-align: center; border-bottom: 3px solid #236902; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { color: #236902; margin: 0; font-size: 24px; }
        .header p { color: #666; margin: 5px 0 0 0; }
        .section { margin-bottom: 20px; }
        .section h3 { color: #236902; border-bottom: 2px solid #236902; padding-bottom: 8px; margin-top: 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th { background: #f0f7f0; color: #236902; padding: 10px; text-align: left; font-weight: bold; border: 1px solid #ddd; }
        td { padding: 10px; border: 1px solid #ddd; }
        .total-row { background: #f0f7f0; font-weight: bold; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #236902; text-align: center; color: #666; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🌾 कृषि खरीद अनुबंध</h1>
        <p>अनुबंध संख्या: ${contractNumber}</p>
        <p>दिनांक: ${startDate}</p>
      </div>
      
      <div class="section">
        <h3>किसान विवरण</h3>
        <table>
          <tr><td style="width: 40%; background: #f9f9f9;"><strong>किसान का नाम:</strong></td><td>${farmerName}</td></tr>
          <tr><td style="background: #f9f9f9;"><strong>किसान ID:</strong></td><td>${farmerId}</td></tr>
          <tr><td style="background: #f9f9f9;"><strong>पता:</strong></td><td>${farmerAddress}, ${farmerState}</td></tr>
        </table>
      </div>
      
      <div class="section">
        <h3>खरीदार विवरण</h3>
        <table>
          <tr><td style="width: 40%; background: #f9f9f9;"><strong>खरीदार का नाम:</strong></td><td>${buyerName}</td></tr>
          <tr><td style="background: #f9f9f9;"><strong>खरीदार ID:</strong></td><td>${buyerId}</td></tr>
          <tr><td style="background: #f9f9f9;"><strong>पता:</strong></td><td>${buyerAddress}, ${buyerState}</td></tr>
        </table>
      </div>
      
      <div class="section">
        <h3>वस्तु विवरण</h3>
        <table>
          <tr>
            <th>फसल का नाम</th>
            <th>किस्म</th>
            <th>मात्रा (किलो)</th>
            <th>कीमत/किलो (₹)</th>
            <th>कुल (₹)</th>
          </tr>
          <tr>
            <td>${cropName}</td>
            <td>${variety}</td>
            <td style="text-align: right;">${quantity.toLocaleString('en-IN')}</td>
            <td style="text-align: right;">₹${pricePerKg.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
            <td style="text-align: right;">₹${totalAmount.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
          </tr>
          <tr class="total-row">
            <td colspan="4" style="text-align: right;">अनुबंध कुल:</td>
            <td style="text-align: right;">₹${totalAmount.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
          </tr>
        </table>
      </div>
      
      <div class="section">
        <h3>अनुबंध की शर्तें</h3>
        <table>
          <tr><td style="width: 40%; background: #f9f9f9;"><strong>शुरुआत तारीख:</strong></td><td>${startDate}</td></tr>
          <tr><td style="background: #f9f9f9;"><strong>समाप्ति तारीख:</strong></td><td>${endDate}</td></tr>
          <tr><td style="background: #f9f9f9;"><strong>अनुबंध अवधि:</strong></td><td>45 दिन</td></tr>
          <tr><td style="background: #f9f9f9;"><strong>अनुबंध प्रकार:</strong></td><td>कृषि खरीद</td></tr>
        </table>
      </div>
      
      <div class="footer">
        <p>यह अनुबंध AgriAI की शर्तों के अनुसार वैध है।</p>
        <p>अधिक जानकारी के लिए, www.agriai.com पर जाएं</p>
      </div>
    </body>
    </html>
    `;
  };

  const generateContractKannada = (farmerName, farmerId, farmerAddress, farmerState, buyerName, buyerId, buyerAddress, buyerState, cropName, variety, quantity, pricePerKg, totalAmount, contractNumber, startDate, endDate) => {
    return `
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #fff; }
        .header { text-align: center; border-bottom: 3px solid #236902; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { color: #236902; margin: 0; font-size: 24px; }
        .header p { color: #666; margin: 5px 0 0 0; }
        .section { margin-bottom: 20px; }
        .section h3 { color: #236902; border-bottom: 2px solid #236902; padding-bottom: 8px; margin-top: 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th { background: #f0f7f0; color: #236902; padding: 10px; text-align: left; font-weight: bold; border: 1px solid #ddd; }
        td { padding: 10px; border: 1px solid #ddd; }
        .total-row { background: #f0f7f0; font-weight: bold; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #236902; text-align: center; color: #666; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🌾 ಕೃಷಿ ಕ್ರಯ ಒಪ್ಪಂದ</h1>
        <p>ಒಪ್ಪಂದ ಸಂಖ್ಯೆ: ${contractNumber}</p>
        <p>ದಿನಾಂಕ: ${startDate}</p>
      </div>
      
      <div class="section">
        <h3>ರೈತ ವಿವರಣೆ</h3>
        <table>
          <tr><td style="width: 40%; background: #f9f9f9;"><strong>ರೈತ ಹೆಸರು:</strong></td><td>${farmerName}</td></tr>
          <tr><td style="background: #f9f9f9;"><strong>ರೈತ ID:</strong></td><td>${farmerId}</td></tr>
          <tr><td style="background: #f9f9f9;"><strong>ವಿಳಾಸ:</strong></td><td>${farmerAddress}, ${farmerState}</td></tr>
        </table>
      </div>
      
      <div class="section">
        <h3>ಖರೀದಿದಾರ ವಿವರಣೆ</h3>
        <table>
          <tr><td style="width: 40%; background: #f9f9f9;"><strong>ಖರೀದಿದಾರ ಹೆಸರು:</strong></td><td>${buyerName}</td></tr>
          <tr><td style="background: #f9f9f9;"><strong>ಖರೀದಿದಾರ ID:</strong></td><td>${buyerId}</td></tr>
          <tr><td style="background: #f9f9f9;"><strong>ವಿಳಾಸ:</strong></td><td>${buyerAddress}, ${buyerState}</td></tr>
        </table>
      </div>
      
      <div class="section">
        <h3>ಸರಕು ವಿವರಣೆ</h3>
        <table>
          <tr>
            <th>ಫಸಲಿನ ಹೆಸರು</th>
            <th>ಪ್ರಭೇದ</th>
            <th>ಪ್ರಮಾಣ (ಕಿಗ್ರಾ)</th>
            <th>ಬೆಲೆ/ಕಿಗ್ರಾ (₹)</th>
            <th>ಒಟ್ಟು (₹)</th>
          </tr>
          <tr>
            <td>${cropName}</td>
            <td>${variety}</td>
            <td style="text-align: right;">${quantity.toLocaleString('en-IN')}</td>
            <td style="text-align: right;">₹${pricePerKg.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
            <td style="text-align: right;">₹${totalAmount.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
          </tr>
          <tr class="total-row">
            <td colspan="4" style="text-align: right;">ಒಪ್ಪಂದ ಒಟ್ಟು:</td>
            <td style="text-align: right;">₹${totalAmount.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
          </tr>
        </table>
      </div>
      
      <div class="section">
        <h3>ಒಪ್ಪಂದ ನಿಯಮಗಳು</h3>
        <table>
          <tr><td style="width: 40%; background: #f9f9f9;"><strong>ಪ್ರಾರಂಭ ದಿನಾಂಕ:</strong></td><td>${startDate}</td></tr>
          <tr><td style="background: #f9f9f9;"><strong>ಮುಕ್ತಾಯ ದಿನಾಂಕ:</strong></td><td>${endDate}</td></tr>
          <tr><td style="background: #f9f9f9;"><strong>ಒಪ್ಪಂದ ಅವಧಿ:</strong></td><td>45 ದಿನಗಳು</td></tr>
          <tr><td style="background: #f9f9f9;"><strong>ಒಪ್ಪಂದ ಪ್ರಕಾರ:</strong></td><td>ಕೃಷಿ ಕ್ರಯ</td></tr>
        </table>
      </div>
      
      <div class="footer">
        <p>ಈ ಒಪ್ಪಂದ AgriAI ನಿಯಮಗಳ ಪ್ರಕಾರ ಮಾನ್ಯವಾಗಿದೆ.</p>
        <p>ಹೆಚ್ಚಿನ ಮಾಹಿತಿಗಾಗಿ, www.agriai.com ಗೆ ಭೇಟಿ ನೀಡಿ</p>
      </div>
    </body>
    </html>
    `;
  };

  React.useEffect(() => {
    const load = async () => {
      let notifications = [];
      try {
        // Only load notifications if user is a farmer
        if (userRole === 'farmer') {
          const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');
          
          // Debug logging
          console.log('🔔 NOTIF: Fetching notifications for farmer:', farmerId, 'Role:', userRole);
          
          // Build query parameters
          let qp = '';
          if (farmerId) {
            qp = `farmer_id=${encodeURIComponent(farmerId)}`;
          } else if (localStorage.getItem('agriai_phone')) {
            qp = `farmer_phone=${encodeURIComponent(localStorage.getItem('agriai_phone'))}`;
          }
          
          const url = `${apiBase}/notifications/list${qp ? '?' + qp : ''}`;
          console.log('🔔 NOTIF: Fetching from URL:', url);
          
          const res = await fetch(url);
          console.log('🔔 NOTIF: Response status:', res.status);
          
          if (res && res.ok) {
            const j = await res.json().catch(() => null);
            console.log('🔔 NOTIF: Raw API Response:', JSON.stringify(j, null, 2));
            if (j && j.ok && Array.isArray(j.notifications)) {
              notifications = j.notifications;
              console.log('🔔 NOTIF: Loaded notifications from contract_b count:', notifications.length);
              
              // LOG EACH NOTIFICATION INCLUDING farmer_total
              notifications.forEach((n, idx) => {
                console.log(`🔔 NOTIF[${idx}]: contract=${n.contract_number}, farmer_total=${n.farmer_total}, type=${typeof n.farmer_total}`);
              });
              // Use ONLY backend data - no localStorage caching
              // Backend contract_b.read column is the single source of truth
            } else {
              console.log('🔔 NOTIF: No notifications from API or invalid response');
              notifications = [];
            }
          } else {
            console.warn('🔔 NOTIF: Failed to fetch, status:', res?.status, res?.statusText);
            notifications = [];
          }
        }
      } catch (e) {
        console.warn('🔔 NOTIF: Failed to load notifications', e);
      }
      
      console.log('🔔 NOTIF: Setting state with notifications:', JSON.stringify(notifications, null, 2));
      setNotifList(notifications);
      
      // Calculate unread count from backend is_read field
      const unreadCount = (Array.isArray(notifications) ? notifications.filter(x => !(x && Number(x.is_read))).length : 0);
      console.log('🔔 NOTIF: Unread count:', unreadCount);
      
      // Update count (only show unread)
      setNotifCount(unreadCount);
    };
    
    load();
    // Poll every 3 seconds for new notifications
    const interval = setInterval(load, 3000);
    
    // Also listen for notification events
    const onMessageReceived = () => { try { load(); } catch (e) {} };
    window.addEventListener('agriai:message:received', onMessageReceived);
    
    return () => {
      clearInterval(interval);
      try { window.removeEventListener('agriai:message:received', onMessageReceived); } catch (e) {}
    };
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
    <div className="notifications-root" style={{ background: 'rgba(83, 255, 3, 0.12)', backgroundAttachment: 'fixed', minHeight: '100vh', color: '#000', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        .notifications-root {
          background: rgba(83, 255, 3, 0.12) !important;
        }
        .notifications-root .navbar {
          background: oklch(0.12 0.03 160 / 0.5) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
        }
        .notification-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .notification-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(35, 105, 2, 0.15);
        }
      `}</style>
      <Navbar />
      <main style={{padding: '4rem 1rem 2rem', position: 'relative', zIndex: 1}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'0 1rem', maxWidth:400, margin:'0 auto', width:'100%'}}>
          <div style={{width:'100%'}}>
            <div style={{padding:'12px 16px', borderBottom:'1px solid #eaf6ea', background:'#f9fffa', display:'flex', justifyContent:'space-between', alignItems:'center', borderRadius:'18px 18px 0 0'}}>
              <div style={{fontWeight:800, color:'#197a50', display:'flex', alignItems:'center', gap:8}}>� <span>{t('Contracts', siteLang) || 'Contracts'}</span></div>              <div style={{display:'flex', gap:8}}>
                <button onClick={markAllAsRead} style={{background:'#ecf8f2', color:'#236902', border:'2px solid #236902', borderRadius:8, padding:'2px 8px', fontWeight:600, fontSize:12, cursor:'pointer', transition:'all 0.3s ease'}} onMouseEnter={(e) => { e.target.style.background='#236902'; e.target.style.color='#fff'; e.target.style.transform='translateY(-2px)'; e.target.style.boxShadow='0 4px 12px rgba(35, 105, 2, 0.3)'; }} onMouseLeave={(e) => { e.target.style.background='#ecf8f2'; e.target.style.color='#236902'; e.target.style.transform='translateY(0)'; e.target.style.boxShadow='none'; }}>{t('markAll', siteLang) || 'Mark all'}</button>
              </div>            </div>
            <div style={{background:'rgba(255,255,255,0.92)',backdropFilter:'blur(20px) saturate(1.6)',WebkitBackdropFilter:'blur(20px) saturate(1.6)',border:'1px solid rgba(255,255,255,0.6)',borderRadius:'0 0 24px 24px',padding:'0.5rem',boxShadow:'0 8px 32px rgba(35,105,2,0.12), 0 32px 64px rgba(0,0,0,0.08)', width:'100%'}}>
              
              {(!notifList || !notifList.length) && (
                <div style={{padding:'30px 0', textAlign:'center', color:'#a2b2aa'}}>
                  <div style={{fontSize:40}}>�</div>
                  <div style={{fontSize:16, fontWeight:600}}>{t('noContracts', siteLang) || 'No contracts yet'}</div>
                </div>
              )}
              
              {Array.isArray(notifList) && notifList.length > 0 && (
                <div style={{maxHeight:'600px', overflowY:'auto', padding:'8px'}}>
                  {notifList.map(n => {
                    const messageId = n.id || Date.now();
                    const createdAtRaw = n.created_at || n.timestamp || Date.now();
                    const createdDateObj = new Date(createdAtRaw);
                    const createdDate = isNaN(createdDateObj) ? String(createdAtRaw) : createdDateObj.toLocaleDateString();
                    const sender = n.buyer_name || n.sender || 'Buyer';
                    const contractNum = n.contract_number || `CNT${n.id || Date.now()}`;
                    const cropName = n.crop_name || 'Crop';
                    const quantity = Number(n.quantity_kg || 0);
                    
                    // LOG farmer_total for EACH notification being rendered
                    const farmerTotal = Number(n.farmer_total || 0);
                    console.log(`🔔 RENDER: contract=${contractNum}, n.farmer_total='${n.farmer_total}' (type: ${typeof n.farmer_total}), farmerTotal=${farmerTotal}`);
                    
                    const message = `Contract ${contractNum} for ${cropName} (${quantity} kg) from ${sender}`;
                    
                    return (
                      <div key={messageId} style={{border: n.is_read ? '1px solid #ddd' : '2px solid #236902', borderRadius:8, overflow:'hidden', margin:'8px 6px', background: n.is_read ? '#fff' : '#d4f1ca', boxShadow: n.is_read ? 'none' : '0 4px 12px rgba(35, 105, 2, 0.25)'}}>
                        <div style={{padding:'12px 14px', background: n.is_read ? '#f7faf7' : '#c8e8bb', display:'flex', flexDirection:'column', gap:8}}>
                          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div style={{fontWeight:800, color:'#236902', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginRight:10}}>{contractNum}</div>
                            <div style={{fontWeight:700, color:'#236902', whiteSpace:'nowrap'}}>₹{farmerTotal.toLocaleString('en-IN', {maximumFractionDigits: 2})}</div>
                          </div>
                          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8}}>
                            <div style={{color:'#000', fontSize:13}}>{t('from', siteLang) || 'From'}: <span style={{fontWeight:700, color:'#236902'}}>{sender}</span></div>
                            <div style={{color:'#000', fontSize:13, whiteSpace:'nowrap'}}>{t('dateLabel', siteLang) || 'Date'}: {createdDate}</div>
                          </div>
                        </div>
                        
                        <div style={{padding:'12px 14px', borderTop: n.is_read ? '1px solid #eee' : '1px solid rgba(35, 105, 2, 0.2)', background: n.is_read ? 'transparent' : 'transparent'}}>
                          <div style={{fontSize:13, lineHeight:1.5, color:'#333', marginBottom:8}}>
                            <div style={{marginBottom:6}}><strong>{cropName}</strong></div>
                            <div style={{color:'#666'}}>{t('quantity', siteLang) || 'Quantity'}: {Number(quantity).toLocaleString('en-IN')} kg</div>
                            {n.price_per_kg && (
                              <div style={{color:'#666'}}>{t('pricePerKg', siteLang) || 'Price/kg'}: ₹{Number(n.price_per_kg).toLocaleString('en-IN', {maximumFractionDigits: 2})}</div>
                            )}
                            {n.status && (
                              <div style={{marginTop:6, padding:'4px 8px', borderRadius:4, background: n.status === 'accepted' ? '#c8e6c9' : n.status === 'rejected' ? '#ffcdd2' : '#fff9c4', fontSize:12, fontWeight:700, color: n.status === 'accepted' ? '#2e7d32' : n.status === 'rejected' ? '#c62828' : '#f57f17', display:'inline-block'}}>
                                {n.status.charAt(0).toUpperCase() + n.status.slice(1)}
                              </div>
                            )}
                          </div>
                          
                          <div style={{display:'flex', gap:8}}>
                            <button onClick={() => handleViewContract(n)} 
                              style={{flex:1, background: '#236902', color:'#fff', border:'none', padding:'6px 8px', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer', transition:'background .08s ease', lineHeight:1}} 
                              onMouseEnter={(e) => e.target.style.background = '#1a5c10'} 
                              onMouseLeave={(e) => e.target.style.background = '#236902'}
                            >
                              {t('viewContract', siteLang) || 'View Contract'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Contract Preview Modal */}
      {showContractPreview && contractHtml && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '900px', height: '90vh', background: '#fff', display: 'flex', flexDirection: 'column', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 24px', borderBottom: '2px solid #e5e5e5', background: '#f9f9f9' }}>
              <h2 style={{ margin: 0, color: '#236902', fontSize: '18px', fontWeight: 700 }}>{t('contractPreview', siteLang) || 'Contract Preview'}</h2>
              <div style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 10, alignItems: 'center' }}>
                <button 
                  onClick={() => window.print()}
                  onMouseEnter={(e) => { e.target.style.background = '#28a745'; e.target.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.target.style.background = '#fff'; e.target.style.color = '#28a745'; }}
                  style={{ padding: '5px 12px', background: '#fff', color: '#28a745', border: '2px solid #28a745', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s ease' }}>
                  {t('print', siteLang) || 'Print'}
                </button>
                <button 
                  onClick={() => {
                    console.log('🔔 CLOSING MODAL');
                    setShowContractPreview(false);
                    setContractHtml('');
                    setCurrentContractNotification(null);
                  }} 
                  onMouseEnter={(e) => { e.target.style.background = '#dc3545'; e.target.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.target.style.background = '#fff'; e.target.style.color = '#dc3545'; }}
                  style={{ padding: '5px 12px', background: '#fff', color: '#dc3545', border: '2px solid #dc3545', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s ease' }}>
                   {t('close', siteLang) || 'Close'}
                </button>
              </div>
            </div>
            
            {/* Contract Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '0', background: '#fff' }}>
              <div style={{ padding: '40px 48px', lineHeight: '1.8' }} dangerouslySetInnerHTML={{ __html: contractHtml }} />
            </div>
            
            {/* Footer Actions */}
            <div style={{ borderTop: '2px solid #e5e5e5', padding: '16px 24px', background: '#f9f9f9', display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button 
                onClick={() => {
                  // Accept contract action
                  console.log('🔔 ACCEPTING CONTRACT');
                  setShowContractPreview(false);
                  setContractHtml('');
                  setCurrentContractNotification(null);
                }}
                onMouseEnter={(e) => { e.target.style.background = '#1a5c10'; e.target.style.transform = 'scale(1.02)'; }}
                onMouseLeave={(e) => { e.target.style.background = '#28a745'; e.target.style.transform = 'scale(1)'; }}
                style={{ padding: '10px 24px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: '16px', transition: 'all 0.2s ease' }}>
                {t('contractAccept', siteLang) || 'Accept'}
              </button>
              <button 
                onClick={() => {
                  // Negotiate contract action
                  console.log('🔔 NEGOTIATING CONTRACT');
                  setShowContractPreview(false);
                  setContractHtml('');
                  setCurrentContractNotification(null);
                }}
                onMouseEnter={(e) => { e.target.style.background = '#e0a500'; e.target.style.transform = 'scale(1.02)'; }}
                onMouseLeave={(e) => { e.target.style.background = '#ffc107'; e.target.style.transform = 'scale(1)'; }}
                style={{ padding: '10px 24px', background: '#ffc107', color: '#000', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: '16px', transition: 'all 0.2s ease' }}>
                {t('contractNegotiate', siteLang) || 'Negotiate'}
              </button>
              <button 
                onClick={() => {
                  // Reject contract action
                  console.log('🔔 REJECTING CONTRACT');
                  setShowContractPreview(false);
                  setContractHtml('');
                  setCurrentContractNotification(null);
                }}
                onMouseEnter={(e) => { e.target.style.background = '#dc3545'; e.target.style.transform = 'scale(1.02)'; }}
                onMouseLeave={(e) => { e.target.style.background = '#dc3545'; e.target.style.transform = 'scale(1)'; }}
                style={{ padding: '10px 24px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: '16px', transition: 'all 0.2s ease' }}>
                {t('contractReject', siteLang) || 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
