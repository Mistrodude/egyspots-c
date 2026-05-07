import { useState } from 'react';
import { collection, doc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { db } from '../firebase';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { BackIcon } from '../components/Icons';

export default function SettingsScreen({ onBack, onRequireAuth }) {
  const { t, isDark, toggleTheme } = useTheme();
  const { user, userProfile, updateUserProfile, logOut } = useAuth();
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  if (!user) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.bg }}>
        <button onClick={onRequireAuth} style={{ border: 'none', background: t.accent, color: 'white', borderRadius: 10, padding: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Sign in to open settings</button>
      </div>
    );
  }

  const notif = userProfile?.notifSettings || {};
  const setNotif = (k) => updateUserProfile({ notifSettings: { ...notif, [k]: !notif[k] } });
  const doDelete = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      // Delete user's Firestore docs
      await deleteDoc(doc(db, 'users', user.uid));
      const storySnap = await getDocs(query(collection(db, 'stories'), where('userId', '==', user.uid)));
      await Promise.all(storySnap.docs.map((d) => deleteDoc(d.ref)));
      const checkinSnap = await getDocs(query(collection(db, 'checkins'), where('userId', '==', user.uid)));
      await Promise.all(checkinSnap.docs.map((d) => deleteDoc(d.ref)));
      // Delete Firebase Auth user
      await deleteUser(user);
      // Auth state change handles UI reset
    } catch (e) {
      if (e.code === 'auth/requires-recent-login') {
        setDeleteError('Please sign out and sign back in, then try again.');
      } else {
        setDeleteError(e.message || 'Failed to delete account. Try again.');
      }
      setDeleteLoading(false);
    }
  };

  return (
    <div style={{ height: '100%', background: t.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ borderBottom: `1px solid ${t.border}`, background: t.bg }}>
        <div style={{ height: 'env(safe-area-inset-top, 0px)' }} />
        <div style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><BackIcon color={t.text} size={18} /></button>
          <div style={{ fontWeight: 700, color: t.text }}>Settings</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Card t={t} title="Account">
          <div style={item(t)}>Change Password: use Forgot Password from sign-in</div>
          <div style={item(t)}>Google linked: {user.providerData?.some((p) => p.providerId?.includes('google')) ? 'Yes' : 'No'}</div>
        </Card>
        <Card t={t} title="Privacy">
          <button onClick={() => updateUserProfile({ defaultAnonymous: !userProfile?.defaultAnonymous })} style={toggle(t, !!userProfile?.defaultAnonymous)}>Anonymous check-ins default: {userProfile?.defaultAnonymous ? 'On' : 'Off'}</button>
          <div style={item(t)}>Profile visibility: account profile is visible in app.</div>
        </Card>
        <Card t={t} title="Notifications">
          {Object.keys(notif).map((k) => <button key={k} onClick={() => setNotif(k)} style={toggle(t, !!notif[k])}>{k}: {notif[k] ? 'On' : 'Off'}</button>)}
        </Card>
        <Card t={t} title="Language">
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => updateUserProfile({ language: 'ar' })} style={toggle(t, userProfile?.language === 'ar')}>Arabic</button>
            <button onClick={() => updateUserProfile({ language: 'en' })} style={toggle(t, userProfile?.language === 'en')}>English</button>
          </div>
        </Card>
        <Card t={t} title="Theme">
          <button onClick={toggleTheme} style={toggle(t, isDark)}>Current: {isDark ? 'Dark' : 'Light'}</button>
        </Card>
        <Card t={t} title="Legal">
          <button onClick={() => window.open('https://egyspots-dc9c1.web.app/terms.html', '_system')} style={toggle(t, false)}>Terms of Service</button>
          <button onClick={() => window.open('https://egyspots-dc9c1.web.app/privacy.html', '_system')} style={toggle(t, false)}>Privacy Policy</button>
        </Card>
        <Card t={t} title="Support">
          <button onClick={() => window.open('https://wa.me/201099091378', '_system')} style={toggle(t, false)}>Contact via WhatsApp</button>
          <button onClick={() => window.open('mailto:support@egyspots.com', '_system')} style={toggle(t, false)}>Report a Bug</button>
        </Card>
        <Card t={t} title="Danger Zone">
          <div style={{ fontSize: 11, color: t.muted }}>This permanently deletes your account, stories, and check-in history.</div>
          <input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder='Type "DELETE" to confirm' style={{ width: '100%', border: `1px solid ${t.border}`, background: t.surface, color: t.text, borderRadius: 8, padding: 8, fontFamily: 'Outfit, sans-serif', boxSizing: 'border-box' }} />
          {deleteError && <div style={{ fontSize: 11, color: t.error }}>{deleteError}</div>}
          <button
            onClick={doDelete}
            disabled={deleteConfirm !== 'DELETE' || deleteLoading}
            style={{ ...toggle(t, false), color: deleteConfirm === 'DELETE' ? t.error : t.muted, borderColor: deleteConfirm === 'DELETE' ? `${t.error}55` : t.border, opacity: deleteLoading ? 0.6 : 1 }}
          >
            {deleteLoading ? 'Deleting…' : 'Delete My Account'}
          </button>
        </Card>
      </div>
      <div style={{ borderTop: `1px solid ${t.border}`, padding: 12 }}>
        <button onClick={() => window.confirm('Sign out?') && logOut()} style={{ width: '100%', border: 'none', background: t.surface2, color: t.error, borderRadius: 10, padding: 10, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Sign Out</button>
      </div>
    </div>
  );
}

function Card({ t, title, children }) {
  return <div style={{ border: `1px solid ${t.border}`, background: t.surface, borderRadius: 10, padding: 10 }}><div style={{ fontSize: 12, color: t.muted, fontWeight: 700, marginBottom: 8 }}>{title}</div><div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div></div>;
}
const item = (t) => ({ fontSize: 12, color: t.text });
const toggle = (t, on) => ({ border: `1px solid ${on ? t.accent : t.border}`, background: on ? t.accentBg : t.surface2, color: t.text, borderRadius: 8, padding: 8, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', textAlign: 'left' });
