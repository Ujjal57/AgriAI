import React from 'react';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';
import { t } from './i18n';

export default function ProfileUpdate() {
  const [form, setForm] = React.useState({ name: '', phone: '', email: '', aadhar: '', region: '', state: '', address: '', language: (localStorage.getItem('agri_lang') || 'en') });
  const [meta, setMeta] = React.useState({ role: '', id: null });
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  const [originalEmail, setOriginalEmail] = React.useState('');
  const [siteLang, setSiteLang] = React.useState(() => localStorage.getItem('agri_lang') || 'en');

  React.useEffect(() => {
    const onLang = (e) => { const l = (e && e.detail && e.detail.lang) ? e.detail.lang : (localStorage.getItem('agri_lang') || 'en'); setSiteLang(l); };
    window.addEventListener('agri:lang:change', onLang);
    return () => { try { window.removeEventListener('agri:lang:change', onLang); } catch (e) {} };
  }, []);

  const fetchProfile = async (email) => {
    setLoading(true);
    try {
      const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');
      const res = await fetch(`${apiBase}/profile/get`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
      });
      const j = await res.json();
      if (res.ok && j.user) {
        setForm({ name: j.user.name || '', phone: j.user.phone || '', email: j.user.email || '', aadhar: j.user.aadhar || '', region: j.user.region || '', state: j.user.state || '', address: j.user.address || '', language: j.user.lang || localStorage.getItem('agri_lang') || 'en' });
        setOriginalEmail(j.user.email || '');
        setMeta({ role: j.user.role || '', id: j.user.id || null });
      } else {
        console.error('Profile load failed', res.status, j);
        alert(j.error || t('profileLoadFailed', siteLang));
      }
    } catch (e) {
      console.error('fetchProfile error', e);
      alert(t('profileServerError', siteLang));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const email = localStorage.getItem('agriai_email');
    const phone = localStorage.getItem('agriai_phone');
    if (!email && !phone) {
      // not logged in
      navigate('/login');
      return;
    }
    if (email) fetchProfile(email);
    else fetchProfile('');
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    // client validation
    if (!form.name) { alert(t('profileNameRequired', siteLang)); return; }
    if (!form.phone || !/^\d{10}$/.test(form.phone)) { alert(t('profilePhoneInvalid', siteLang)); return; }
    if (!form.aadhar || !/^\d{12}$/.test(form.aadhar)) { alert(t('profileAadharInvalid', siteLang)); return; }
    if (form.region && !/^(north|south|east|west)$/i.test(form.region)) { alert(t('profileRegionInvalid', siteLang)); return; }
    if (form.state && !/^[A-Za-z\s]{2,}$/.test(form.state)) { alert(t('profileStateInvalid', siteLang)); return; }
    if (!form.address || form.address.trim().length < 5) { alert(t('profileAddressInvalid', siteLang)); return; }

    setLoading(true);
    try {
      const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');
  const origPhone = localStorage.getItem('agriai_phone') || form.phone || '';
  const body = { original_email: originalEmail, original_phone: origPhone, email: form.email, name: form.name, phone: form.phone, aadhar: form.aadhar, region: form.region, state: form.state, address: form.address, lang: (form.language || 'en') };
      const res = await fetch(`${apiBase}/profile/update`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await res.json();
      if (res.ok) {
        alert(t('profileSaveSuccess', siteLang));
        // Update localStorage values so other pages reflect changes
        try {
          if (form.email) localStorage.setItem('agriai_email', form.email);
          if (form.phone) localStorage.setItem('agriai_phone', form.phone);
          if (form.name) localStorage.setItem('agriai_name', form.name);
        } catch (e) {}
        // Navigate back to dashboard
        // Buyer navigates to farmer dashboard, farmer navigates to buyer dashboard
        const role = localStorage.getItem('agriai_role') || meta.role || 'farmer';
        if (role === 'buyer') {
          navigate('/dashboard/farmer');
        } else {
          navigate('/dashboard/buyer');
        }
      } else {
        alert(j.error || t('profileSaveFailed', siteLang));
      }
    } catch (e) {
      console.error('profile update error', e);
      alert(t('profileServerError', siteLang));
    } finally {
      setLoading(false);
    }
  };

  // Transient click animation state for the Save button
  const [saveAnim, setSaveAnim] = React.useState(false);

  const triggerSaveAnimation = () => {
    try {
      setSaveAnim(true);
      // short animation; restore state after it completes
      setTimeout(() => setSaveAnim(false), 180);
    } catch (e) {
      // ignore
    }
  };

  return (
    <div style={{background: '#53b635', minHeight: '85vh', fontFamily: "'Times New Roman', Times, serif", color: '#000'}}>
      <Navbar />
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem'}}>
        {loading ? (
          <div style={{color: '#fff'}}>{t('loading', siteLang)}</div>
        ) : (
          <div style={{width: '100%', maxWidth: 820}}>
            <div style={{background: '#fff', padding: '2rem', boxShadow: '0 12px 30px rgba(0,0,0,0.15)', marginTop: '3rem'}}>
              <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6}}>
                <h2 style={{marginTop: 8, marginBottom: 0, color: '#236902', textAlign: 'center'}}>{t('profileTitle', siteLang)}</h2>
                {meta && meta.id != null && (meta.role === 'farmer' || (localStorage.getItem('agriai_role') || '').toLowerCase() === 'farmer') ? (
                  <div style={{marginTop:6, marginBottom:20, background:'#f0f8f0', padding:'6px 10px', borderRadius:8, fontWeight:700, color:'#236902', textAlign:'center'}}>{`${t('profileIdLabel', siteLang) || 'ID'}: ${meta.id}`}</div>
                ) : null}
                
              </div>
              <form onSubmit={handleSubmit}>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                  <div>
                    <label style={{display:'block', marginBottom:6, fontWeight:700, textAlign: 'left'}}>{t('profileNameLabel', siteLang) || t('placeholderFullName', siteLang)}</label>
                    <input name='name' placeholder={t('placeholderFullName', siteLang)} value={form.name} onChange={handleChange} style={{width: '100%', padding: 10, fontFamily: "'Times New Roman', Times, serif"}} />
                  </div>
                  <div>
                    <label style={{display:'block', marginBottom:6, fontWeight:700, textAlign: 'left'}}>{t('profilePhoneLabel', siteLang) || 'Phone'}</label>
                    <input name='phone' placeholder={t('placeholderPhone10', siteLang)} value={form.phone} onChange={handleChange} style={{width: '100%', padding: 10}} />
                  </div>
                  <div>
                    <label style={{display:'block', marginBottom:6, fontWeight:700, textAlign: 'left'}}>{t('labelEmail', siteLang) || 'Email'}</label>
                    <input name='email' placeholder={t('placeholderEmail', siteLang)} value={form.email} onChange={handleChange} style={{width: '100%', padding: 10}} />
                  </div>
                  <div>
                    <label style={{display:'block', marginBottom:6, fontWeight:700, textAlign: 'left'}}>{t('profileAadharLabel', siteLang) || t('placeholderAadhar', siteLang)}</label>
                    <input name='aadhar' placeholder={t('placeholderAadhar', siteLang)} value={form.aadhar} onChange={handleChange} style={{width: '100%', padding: 10}} />
                  </div>
                  <div>
                    <label style={{display:'block', marginBottom:6, fontWeight:700, textAlign: 'left'}}>{t('regionLabel', siteLang)}</label>
                    <select name='region' value={form.region} onChange={e => setForm({...form, region: e.target.value})} style={{width: '100%', padding: 10}}>
                      <option value=''>{t('selectRegion', siteLang)}</option>
                      <option value='north'>{t('regionNorth', siteLang)}</option>
                      <option value='south'>{t('regionSouth', siteLang)}</option>
                      <option value='east'>{t('regionEast', siteLang)}</option>
                      <option value='west'>{t('regionWest', siteLang)}</option>
                    </select>
                  </div>
                  <div>
                    <label style={{display:'block', marginBottom:6, fontWeight:700, textAlign: 'left'}}>{t('labelState', siteLang) || t('placeholderState', siteLang)}</label>
                    <input name='state' placeholder={t('placeholderStateExample', siteLang)} value={form.state} onChange={e => setForm({...form, state: e.target.value})} style={{width: '100%', padding: 10}} />
                  </div>
                  <div style={{gridColumn:'1 / -1', display:'grid', gridTemplateColumns: '1fr 220px', gap:12}}>
                    <div>
                      <label style={{display:'block', marginBottom:6, fontWeight:700, textAlign: 'left'}}>{t('labelAddress', siteLang) || t('placeholderAddress', siteLang)}</label>
                      <input name='address' placeholder={t('placeholderAddress', siteLang)} value={form.address} onChange={handleChange} style={{width: '100%', padding: 10}} />
                    </div>
                    <div>
                      <label style={{display:'block', marginBottom:6, fontWeight:700, textAlign: 'left'}}>{t('language', siteLang) || 'Language'}</label>
                      <select value={form.language || (localStorage.getItem('agri_lang') || 'en')} onChange={e => { const l = e.target.value; setForm({ ...form, language: l }); }} style={{width: '100%', padding: 10}}>
                        <option value='en'>English</option>
                        <option value='hi'>हिन्दी</option>
                        <option value='kn'>ಕನ್ನಡ</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 16}}>
                  {/** Save button: small scale animation on click (mouse or keyboard). Disabled while saving. */}
                  <button
                    type='submit'
                    disabled={loading}
                    onMouseDown={() => { if (!loading) triggerSaveAnimation(); }}
                    onKeyDown={(e) => { if (!loading && (e.key === 'Enter' || e.key === ' ')) { triggerSaveAnimation(); } }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#236902',
                      color: '#fff',
                      border: 'none',
                      cursor: loading ? 'default' : 'pointer',
                      transform: saveAnim ? 'scale(0.96)' : 'scale(1)',
                      transition: 'transform 150ms ease, box-shadow 150ms ease',
                      outline: 'none'
                    }}
                  >{loading ? t('saving', siteLang) : t('saveButton', siteLang)}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
