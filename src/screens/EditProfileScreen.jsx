import { useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { BackIcon, CameraIcon } from '../components/Icons';

const CITIES = ['Cairo', 'Giza', 'Alexandria', 'New Cairo', '6th of October', 'Other'];

export default function EditProfileScreen({ onBack }) {
  const { t } = useTheme();
  const { userProfile, updateUserProfile, checkUsernameAvailable } = useAuth();
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    profilePhotoURL: userProfile?.profilePhotoURL || '',
    displayName: userProfile?.displayName || '',
    username: userProfile?.username || '',
    bio: userProfile?.bio || '',
    city: userProfile?.city || 'Cairo',
    phoneNumber: userProfile?.phoneNumber || '',
    language: userProfile?.language || 'ar',
    notifSettings: userProfile?.notifSettings || {},
  });
  const [saving, setSaving] = useState(false);
  const [usernameMsg, setUsernameMsg] = useState('');

  const onPickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((f) => ({ ...f, profilePhotoURL: URL.createObjectURL(file) }));
  };

  const checkUsername = async () => {
    if (!form.username || form.username === userProfile?.username) return setUsernameMsg('');
    const ok = await checkUsernameAvailable(form.username);
    setUsernameMsg(ok ? 'Username available' : 'Username is taken');
  };

  const save = async () => {
    setSaving(true);
    await updateUserProfile(form);
    setSaving(false);
    onBack();
  };

  return (
    <div style={{ height: '100%', background: t.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 12, borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><BackIcon color={t.text} size={18} /></button>
        <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>Edit Profile</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Avatar — tap to pick photo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
          <div onClick={() => fileRef.current.click()} style={{ position: 'relative', width: 80, height: 80, cursor: 'pointer' }}>
            {form.profilePhotoURL
              ? <img src={form.profilePhotoURL} alt="avatar" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 80, height: 80, borderRadius: '50%', background: t.accentBg, color: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 28 }}>
                  {(form.displayName || 'U')[0].toUpperCase()}
                </div>
            }
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CameraIcon color="white" size={13} />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPickFile} />
        </div>
        <input value={form.displayName} onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))} placeholder="Display Name" style={inp(t)} />
        <input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase() }))} onBlur={checkUsername} placeholder="Username" style={inp(t)} />
        {usernameMsg && <div style={{ fontSize: 11, color: usernameMsg.includes('available') ? t.success : t.error }}>{usernameMsg}</div>}
        <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value.slice(0, 150) }))} placeholder="Bio" style={{ ...inp(t), minHeight: 90 }} />
        <div style={{ fontSize: 10, color: t.muted, textAlign: 'right' }}>{form.bio.length}/150</div>
        <select value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} style={inp(t)}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
        <input value={form.phoneNumber || ''} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))} placeholder="Phone number" style={inp(t)} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setForm((f) => ({ ...f, language: 'ar' }))} style={langBtn(t, form.language === 'ar')}>AR</button>
          <button onClick={() => setForm((f) => ({ ...f, language: 'en' }))} style={langBtn(t, form.language === 'en')}>EN</button>
        </div>
        <div style={{ fontSize: 11, color: t.muted }}>Notification settings</div>
        {Object.keys(form.notifSettings || {}).map((k) => (
          <button key={k} onClick={() => setForm((f) => ({ ...f, notifSettings: { ...f.notifSettings, [k]: !f.notifSettings[k] } }))} style={toggleBtn(t, !!form.notifSettings[k])}>
            {k}: {form.notifSettings[k] ? 'On' : 'Off'}
          </button>
        ))}
      </div>
      <div style={{ borderTop: `1px solid ${t.border}`, padding: 12, display: 'flex', gap: 8 }}>
        <button onClick={onBack} style={{ ...btn(t), background: t.surface }}>Cancel</button>
        <button onClick={save} disabled={saving} style={{ ...btn(t), background: t.accent, color: 'white' }}>{saving ? 'Saving...' : 'Save Changes'}</button>
      </div>
    </div>
  );
}

const inp = (t) => ({ width: '100%', border: `1px solid ${t.border}`, background: t.surface, color: t.text, borderRadius: 10, padding: 10, fontFamily: 'Outfit, sans-serif' });
const btn = (t) => ({ flex: 1, border: 'none', borderRadius: 10, padding: 10, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', color: t.text });
const label = (t) => ({ fontSize: 12, color: t.text });
const langBtn = (t, active) => ({ border: `1px solid ${active ? t.accent : t.border}`, background: active ? t.accentBg : t.surface, color: active ? t.accent : t.text, borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' });
const toggleBtn = (t, on) => ({ border: `1px solid ${on ? t.accent : t.border}`, background: on ? t.accentBg : t.surface, color: t.text, borderRadius: 10, padding: 8, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', textAlign: 'left' });
