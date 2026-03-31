import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { t } from './i18n';
import Navbar from './Navbar';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  * { box-sizing: border-box; }

  .pu-root {
    min-height: 100vh;
    font-family: 'Times New Roman', Times, serif !important;
    background: rgba(83, 255, 3, 0.12);
    background-attachment: fixed;
    position: relative;
    overflow-x: hidden;
  }
  .pu-root::before {
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

  .pu-orb {
    position: fixed;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.18;
    pointer-events: none;
    z-index: 0;
    animation: puFloatOrb 12s ease-in-out infinite;
  }
  .pu-orb-1 { width:400px;height:400px;background:#53b635;top:-100px;left:-100px;animation-delay:0s; }
  .pu-orb-2 { width:300px;height:300px;background:#236902;bottom:10%;right:-80px;animation-delay:4s; }
  .pu-orb-3 { width:250px;height:250px;background:#8fdb5e;top:40%;left:60%;animation-delay:8s; }
  @keyframes puFloatOrb {
    0%,100%{transform:translate(0,0) scale(1);}
    33%{transform:translate(30px,-20px) scale(1.05);}
    66%{transform:translate(-20px,30px) scale(0.95);}
  }

  .pu-leaf {
    position: fixed;
    width:10px;height:10px;
    opacity:0;pointer-events:none;z-index:0;
    animation:puLeafFall linear infinite;
  }
  .pu-leaf::before{content:'🌿';font-size:16px;}
  .pu-leaf-1{left:5%;animation-duration:8s;animation-delay:0s;}
  .pu-leaf-2{left:15%;animation-duration:10s;animation-delay:1s;}
  .pu-leaf-3{left:25%;animation-duration:7s;animation-delay:2s;}
  .pu-leaf-4{left:35%;animation-duration:9s;animation-delay:0.5s;}
  .pu-leaf-5{left:45%;animation-duration:11s;animation-delay:3s;}
  .pu-leaf-6{left:55%;animation-duration:8s;animation-delay:1.5s;}
  .pu-leaf-7{left:65%;animation-duration:10s;animation-delay:2.5s;}
  .pu-leaf-8{left:75%;animation-duration:9s;animation-delay:0s;}
  .pu-leaf-9{left:85%;animation-duration:7s;animation-delay:4s;}
  .pu-leaf-10{left:12%;animation-duration:12s;animation-delay:5s;}
  .pu-leaf-11{left:38%;animation-duration:8s;animation-delay:3.5s;}
  .pu-leaf-12{left:70%;animation-duration:10s;animation-delay:1.8s;}
  @keyframes puLeafFall {
    0%{transform:translateY(-40px) rotate(0deg);opacity:0;}
    10%{opacity:0.6;}
    90%{opacity:0.3;}
    100%{transform:translateY(110vh) rotate(720deg);opacity:0;}
  }

  .pu-main {
    position: relative;
    z-index: 1;
    padding: 5rem 1.5rem 3rem;
    max-width: 900px;
    margin: 0 auto;
    animation: puFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes puFadeUp {
    from{opacity:0;transform:translateY(32px);}
    to{opacity:1;transform:translateY(0);}
  }

  .pu-glass {
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

  .pu-title {
    text-align: center;
    font-size: 2rem;
    font-weight: 800;
    color: transparent;
    background: linear-gradient(135deg, #1a5c10 0%, #236902 50%, #53b635 100%);
    -webkit-background-clip: text;
    background-clip: text;
    margin: 0 0 0.5rem;
    letter-spacing: -0.5px;
  }

  .pu-id-badge {
    display: inline-block;
    margin: 0 auto 1.5rem;
    background: linear-gradient(135deg, #eaf6ea, #d4f0d4);
    border: 1px solid rgba(83,182,53,0.25);
    color: #236902;
    padding: 6px 16px;
    border-radius: 999px;
    font-weight: 700;
    font-size: 0.9rem;
  }

  .pu-loading {
    text-align: center;
    padding: 4rem 2rem;
    color: #fff;
    font-size: 1rem;
    font-weight: 600;
  }

  /* Form grid */
  .pu-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .pu-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .pu-label {
    font-size: 0.78rem;
    font-weight: 700;
    color: #2d5c1a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .pu-input, .pu-select {
    padding: 10px 14px;
    border: 1.5px solid #d4edcc;
    border-radius: 10px;
    font-size: 0.9rem;
    font-family: inherit;
    background: rgba(255,255,255,0.95);
    color: #1a3d0a;
    outline: none;
    width: 100%;
    transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s;
  }
  .pu-input:focus, .pu-select:focus {
    border-color: #53b635;
    box-shadow: 0 0 0 3px rgba(83,182,53,0.18), 0 2px 8px rgba(35,105,2,0.1);
    transform: translateY(-2px);
  }

  .pu-full-row {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: 1fr 220px;
    gap: 16px;
  }

  .pu-section-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(83,182,53,0.3), transparent);
    margin: 1.5rem 0;
  }

  .pu-submit-wrap {
    display: flex;
    justify-content: center;
    margin-top: 1.5rem;
  }
  .pu-submit-btn {
    padding: 0.85rem 3rem;
    background: linear-gradient(135deg, #236902 0%, #53b635 100%);
    color: #fff;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(35,105,2,0.3), 0 1px 0 rgba(255,255,255,0.15) inset;
    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s, filter 0.18s;
    position: relative;
    overflow: hidden;
    letter-spacing: 0.3px;
    outline: none;
  }
  .pu-submit-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
    border-radius: inherit;
  }
  .pu-submit-btn:hover:not(:disabled) {
    transform: translateY(-3px) scale(1.03);
    box-shadow: 0 8px 28px rgba(35,105,2,0.35);
    filter: brightness(1.05);
  }
  .pu-submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    animation: puPulse 1.2s ease-in-out infinite;
  }
  @keyframes puPulse { 0%,100%{opacity:0.7;} 50%{opacity:0.5;} }

  .pu-root .navbar {
    background: oklch(0.12 0.03 160 / 0.5) !important;
    backdrop-filter: blur(12px) !important;
    -webkit-backdrop-filter: blur(12px) !important;
  }

  .pu-root .navbar select {
    background: oklch(0.12 0.03 160 / 0.6) !important;
    border: 1px solid oklch(0.65 0.22 145 / 0.3) !important;
    color: rgba(255,255,255,0.9) !important;
  }

  .pu-root .navbar select option {
    background: #1a1a1a;
    color: #ffffff;
  }

  @media (max-width: 768px) {
    .pu-glass { padding: 1.5rem; }
    .pu-title { font-size: 1.6rem; }
    .pu-form-grid { grid-template-columns: 1fr; }
    .pu-full-row { grid-template-columns: 1fr; }
  }
`;

export default function ProfileUpdate() {
  const [form, setForm] = React.useState({ name: '', phone: '', email: '', aadhar: '', region: '', state: '', address: '', language: (localStorage.getItem('agri_lang') || 'en') });
  const [meta, setMeta] = React.useState({ role: '', id: null });
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  const [originalEmail, setOriginalEmail] = React.useState('');
  const [siteLang, setSiteLang] = React.useState(() => localStorage.getItem('agri_lang') || 'en');

  React.useEffect(() => {
    const onLang = (e) => { 
      const l = (e && e.detail && e.detail.lang) ? e.detail.lang : (localStorage.getItem('agri_lang') || 'en'); 
      setSiteLang(l);
      // Auto refresh page when language is changed from navbar
      setTimeout(() => window.location.reload(), 100);
    };
    window.addEventListener('agri:lang:change', onLang);
    return () => { try { window.removeEventListener('agri:lang:change', onLang); } catch (e) {} };
  }, []);

  // Derive display language name from code
  const getLanguageName = (lang) => lang === 'hi' ? 'Hindi' : lang === 'kn' ? 'Kannada' : 'English';

  const handleLanguageChange = (e) => {
    const langName = e.target.value;
    const langCode = langName === 'Hindi' ? 'hi' : langName === 'Kannada' ? 'kn' : 'en';
    setSiteLang(langCode);
    localStorage.setItem('agri_lang', langCode);
    window.dispatchEvent(new CustomEvent('agri:lang:change', { detail: { lang: langCode } }));
    setTimeout(() => window.location.reload(), 100);
  };

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
    if (!email && !phone) { navigate('/login'); return; }
    if (email) fetchProfile(email);
    else fetchProfile('');
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
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
        try {
          if (form.email) localStorage.setItem('agriai_email', form.email);
          if (form.phone) localStorage.setItem('agriai_phone', form.phone);
          if (form.name) localStorage.setItem('agriai_name', form.name);
        } catch (e) {}
        const role = localStorage.getItem('agriai_role') || meta.role || 'farmer';
        if (role === 'buyer') { navigate('/dashboard/farmer'); }
        else { navigate('/dashboard/buyer'); }
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

  const [saveAnim, setSaveAnim] = React.useState(false);

  const triggerSaveAnimation = () => {
    try {
      setSaveAnim(true);
      setTimeout(() => setSaveAnim(false), 180);
    } catch (e) {}
  };

  return (
    <>
      <style>{styles}</style>

      <div className="pu-root">
        {/* Orbs */}
        <div className="pu-orb pu-orb-1" />
        <div className="pu-orb pu-orb-2" />
        <div className="pu-orb pu-orb-3" />
        {/* Leaves */}
        <div className="pu-leaf pu-leaf-1" />
        <div className="pu-leaf pu-leaf-2" />
        <div className="pu-leaf pu-leaf-3" />
        <div className="pu-leaf pu-leaf-4" />
        <div className="pu-leaf pu-leaf-5" />
        <div className="pu-leaf pu-leaf-6" />
        <div className="pu-leaf pu-leaf-7" />
        <div className="pu-leaf pu-leaf-8" />
        <div className="pu-leaf pu-leaf-9" />
        <div className="pu-leaf pu-leaf-10" />
        <div className="pu-leaf pu-leaf-11" />
        <div className="pu-leaf pu-leaf-12" />

        {/* Navbar from BuyerDashboard */}
        <Navbar />

        {loading ? (
          <div className="pu-loading">{t('loading', siteLang)}</div>
        ) : (
          <main className="pu-main">
            <div className="pu-glass">

              {/* Title */}
              <h2 className="pu-title">{t('profileTitle', siteLang)}</h2>

              {/* Farmer/Buyer ID badge */}
              {meta && meta.id != null ? (
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <span className="pu-id-badge">{`${t('profileIdLabel', siteLang) || 'ID'}: ${meta.id}`}</span>
                </div>
              ) : null}

              <div className="pu-section-divider" />

              <form onSubmit={handleSubmit}>
                <div className="pu-form-grid">

                  <div className="pu-field">
                    <label className="pu-label">{t('profileNameLabel', siteLang) || t('placeholderFullName', siteLang)}</label>
                    <input className="pu-input" name="name" placeholder={t('placeholderFullName', siteLang)} value={form.name} onChange={handleChange} />
                  </div>

                  <div className="pu-field">
                    <label className="pu-label">{t('profilePhoneLabel', siteLang) || 'Phone'}</label>
                    <input className="pu-input" name="phone" placeholder={t('placeholderPhone10', siteLang)} value={form.phone} onChange={handleChange} />
                  </div>

                  <div className="pu-field">
                    <label className="pu-label">{t('labelEmail', siteLang) || 'Email'}</label>
                    <input className="pu-input" name="email" placeholder={t('placeholderEmail', siteLang)} value={form.email} onChange={handleChange} />
                  </div>

                  <div className="pu-field">
                    <label className="pu-label">{t('profileAadharLabel', siteLang) || t('placeholderAadhar', siteLang)}</label>
                    <input className="pu-input" name="aadhar" placeholder={t('placeholderAadhar', siteLang)} value={form.aadhar} onChange={handleChange} />
                  </div>

                  <div className="pu-field">
                    <label className="pu-label">{t('regionLabel', siteLang)}</label>
                    <select className="pu-select" name="region" value={form.region} onChange={e => setForm({ ...form, region: e.target.value })}>
                      <option value="">{t('selectRegion', siteLang)}</option>
                      <option value="north">{t('regionNorth', siteLang)}</option>
                      <option value="south">{t('regionSouth', siteLang)}</option>
                      <option value="east">{t('regionEast', siteLang)}</option>
                      <option value="west">{t('regionWest', siteLang)}</option>
                    </select>
                  </div>

                  <div className="pu-field">
                    <label className="pu-label">{t('labelState', siteLang) || t('placeholderState', siteLang)}</label>
                    <input className="pu-input" name="state" placeholder={t('placeholderStateExample', siteLang)} value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
                  </div>

                  {/* Full-width row: Address + Language */}
                  <div className="pu-full-row">
                    <div className="pu-field">
                      <label className="pu-label">{t('labelAddress', siteLang) || t('placeholderAddress', siteLang)}</label>
                      <input className="pu-input" name="address" placeholder={t('placeholderAddress', siteLang)} value={form.address} onChange={handleChange} />
                    </div>
                    <div className="pu-field">
                      <label className="pu-label">{t('language', siteLang) || 'Language'}</label>
                      <select className="pu-select" value={form.language || (localStorage.getItem('agri_lang') || 'en')} onChange={e => { const l = e.target.value; setForm({ ...form, language: l }); }}>
                        <option value="en">English</option>
                        <option value="hi">हिन्दी</option>
                        <option value="kn">ಕನ್ನಡ</option>
                      </select>
                    </div>
                  </div>

                </div>

                <div className="pu-submit-wrap">
                  <button
                    type="submit"
                    className="pu-submit-btn"
                    disabled={loading}
                    onMouseDown={() => { if (!loading) triggerSaveAnimation(); }}
                    onKeyDown={(e) => { if (!loading && (e.key === 'Enter' || e.key === ' ')) { triggerSaveAnimation(); } }}
                    style={{ transform: saveAnim ? 'scale(0.96)' : 'scale(1)' }}
                  >
                    {loading ? t('saving', siteLang) : t('saveButton', siteLang)}
                  </button>
                </div>
              </form>

            </div>
          </main>
        )}
        
        {/* Footer */}
        <footer className="w-full border-t" style={{background:'oklch(0.12 0.03 160)', borderColor:'oklch(0.65 0.22 145 / 0.12)', padding:'1em 0'}}>
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
    </>
  );
}