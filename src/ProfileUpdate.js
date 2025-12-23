import React from 'react';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';

export default function ProfileUpdate() {
  const [form, setForm] = React.useState({ name: '', phone: '', email: '', aadhar: '', region: '', state: '', address: '' });
  const [meta, setMeta] = React.useState({ role: '', id: null });
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  const [originalEmail, setOriginalEmail] = React.useState('');

  const fetchProfile = async (email) => {
    setLoading(true);
    try {
      const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');
      const res = await fetch(`${apiBase}/profile/get`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
      });
      const j = await res.json();
      if (res.ok && j.user) {
        setForm({ name: j.user.name || '', phone: j.user.phone || '', email: j.user.email || '', aadhar: j.user.aadhar || '', region: j.user.region || '', state: j.user.state || '', address: j.user.address || '' });
        setOriginalEmail(j.user.email || '');
        setMeta({ role: j.user.role || '', id: j.user.id || null });
      } else {
        console.error('Profile load failed', res.status, j);
        alert(j.error || 'Could not load profile');
      }
    } catch (e) {
      console.error('fetchProfile error', e);
      alert('Error connecting to server. Make sure the backend is running (python backend\\app.py) and reachable at http://127.0.0.1:5000');
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
  if (!form.name) { alert('Name required'); return; }
  if (!form.phone || !/^\d{10}$/.test(form.phone)) { alert('Phone must be 10 digits'); return; }
  if (!form.aadhar || !/^\d{12}$/.test(form.aadhar)) { alert('Aadhar must be 12 digits'); return; }
  if (form.region && !/^(north|south|east|west)$/i.test(form.region)) { alert('Region must be one of North, South, East, West'); return; }
  if (form.state && !/^[A-Za-z\s]{2,}$/.test(form.state)) { alert('State must be alphabetic and at least 2 characters'); return; }
  if (!form.address || form.address.trim().length < 5) { alert('Address required and must be at least 5 characters'); return; }

    setLoading(true);
    try {
      const apiBase = process.env.REACT_APP_API_BASE || (window.location.protocol + '//' + (process.env.REACT_APP_API_HOST || '127.0.0.1') + ':5000');
  const origPhone = localStorage.getItem('agriai_phone') || form.phone || '';
  const body = { original_email: originalEmail, original_phone: origPhone, email: form.email, name: form.name, phone: form.phone, aadhar: form.aadhar, region: form.region, state: form.state, address: form.address };
      const res = await fetch(`${apiBase}/profile/update`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await res.json();
      if (res.ok) {
        alert('Profile updated');
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
        alert(j.error || 'Update failed');
      }
    } catch (e) {
      console.error('profile update error', e);
      alert('Error connecting to server. Ensure backend is running at http://127.0.0.1:5000');
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
          <div style={{color: '#fff'}}>Loading...</div>
        ) : (
          <div style={{width: '100%', maxWidth: 820}}>
            <div style={{background: '#fff', padding: '2rem', borderRadius: 8, boxShadow: '0 12px 30px rgba(0,0,0,0.15)', marginTop: '3rem'}}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12}}>
                <h2 style={{marginTop: 8, marginBottom: 0, color: '#236902'}}>Update Profile</h2>
                {meta && meta.role ? (
                  <div style={{display:'flex', alignItems:'center', gap:8}}>
                    <div style={{background:'#eaf6ea', color:'#236902', padding:'4px 8px', borderRadius:999, fontWeight:700}}>{meta.role.charAt(0).toUpperCase() + meta.role.slice(1)}</div>
                    {meta.id != null && <div style={{fontSize:12, color:'#555'}}>ID: {meta.id}</div>}
                  </div>
                ) : null}
              </div>
              <form onSubmit={handleSubmit}>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                  <div>
                    <label style={{display:'block', marginBottom:6, fontWeight:700, textAlign: 'left'}}>Name</label>
                    <input name='name' placeholder='Full name' value={form.name} onChange={handleChange} style={{width: '100%', padding: 10, fontFamily: "'Times New Roman', Times, serif"}} />
                  </div>
                  <div>
                    <label style={{display:'block', marginBottom:6, fontWeight:700, textAlign: 'left'}}>Phone</label>
                    <input name='phone' placeholder='10-digit phone number' value={form.phone} onChange={handleChange} style={{width: '100%', padding: 10}} />
                  </div>
                  <div>
                    <label style={{display:'block', marginBottom:6, fontWeight:700, textAlign: 'left'}}>Email</label>
                    <input name='email' placeholder='you@example.com' value={form.email} onChange={handleChange} style={{width: '100%', padding: 10}} />
                  </div>
                  <div>
                    <label style={{display:'block', marginBottom:6, fontWeight:700, textAlign: 'left'}}>Aadhar</label>
                    <input name='aadhar' placeholder='12-digit Aadhar' value={form.aadhar} onChange={handleChange} style={{width: '100%', padding: 10}} />
                  </div>
                  <div>
                    <label style={{display:'block', marginBottom:6, fontWeight:700, textAlign: 'left'}}>Region</label>
                    <select name='region' value={form.region} onChange={e => setForm({...form, region: e.target.value})} style={{width: '100%', padding: 10}}>
                      <option value=''>-- Select region --</option>
                      <option value='North'>North</option>
                      <option value='South'>South</option>
                      <option value='East'>East</option>
                      <option value='West'>West</option>
                    </select>
                  </div>
                  <div>
                    <label style={{display:'block', marginBottom:6, fontWeight:700, textAlign: 'left'}}>State</label>
                    <input name='state' placeholder='e.g., Karnataka' value={form.state} onChange={e => setForm({...form, state: e.target.value})} style={{width: '100%', padding: 10}} />
                  </div>
                  <div style={{gridColumn:'1 / -1'}}>
                    <label style={{display:'block', marginBottom:6, fontWeight:700, textAlign: 'left'}}>Address</label>
                    <input name='address' placeholder='House no, Street, City' value={form.address} onChange={handleChange} style={{width: '100%', padding: 10}} />
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
                  >{loading ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
