import { useState, useRef, useEffect } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSpots } from '../context/SpotsContext';
import { BackIcon } from '../components/Icons';
import { CATEGORIES, SPOT_TAGS, SPOT_TAG_LABELS } from '../data/spots';
import { haversineMeters, MIN_SPOT_DISTANCE_M } from '../utils/geo';

const SPOT_CATEGORIES = CATEGORIES.filter((c) => c !== 'All');

const CATEGORY_VALUES = {
  'Street Cart': 'street_cart',
  'Car Meet':    'car_meet',
  'Hangout':     'hangout',
  'Pop-Up':      'pop_up',
  'Open Air':    'open_air',
};

export default function AddSpotScreen({ onBack, onRequireAuth, userPos }) {
  const { t } = useTheme();
  const { user, userProfile } = useAuth();
  const { spots } = useSpots();
  const fileRef    = useRef(null);
  const blobRef    = useRef(null);
  useEffect(() => () => { if (blobRef.current) URL.revokeObjectURL(blobRef.current); }, []);

  const [form, setForm] = useState({
    name: '', nameAr: '', category: 'hangout', description: '',
    address: '', isMobile: false, tags: [],
  });
  const [coverFile,    setCoverFile]    = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const onPickCover = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setMsg('Photo must be under 5 MB.'); return; }
    if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    blobRef.current = URL.createObjectURL(file);
    setCoverFile(file);
    setCoverPreview(blobRef.current);
  };

  if (!user) {
    return (
      <div style={{ height: '100%', background: t.bg, display: 'grid', placeItems: 'center' }}>
        <button onClick={onRequireAuth} style={{ border: 'none', background: t.accent, color: 'white', borderRadius: 10, padding: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Sign in first</button>
      </div>
    );
  }

  const toggleTag = (tag) => setForm((f) => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter((x) => x !== tag) : [...f.tags, tag] }));

  const submit = async () => {
    if (!userPos) { setMsg('GPS required — we need your location to pin this spot on the map.'); return; }
    if (!form.name.trim()) { setMsg('Spot name is required.'); return; }
    if (!form.address.trim()) { setMsg('Address is required.'); return; }
    const tooClose = spots.find((s) => haversineMeters(userPos, s) < MIN_SPOT_DISTANCE_M);
    if (tooClose) {
      setMsg(`Too close to "${tooClose.name}" — spots must be at least 300m apart.`);
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      // Upload cover photo first (if chosen)
      let coverPhotoURL = '';
      if (coverFile) {
        const tempPath = `spots/pending/${user.uid}_${Date.now()}.jpg`;
        const sRef = ref(storage, tempPath);
        await uploadBytes(sRef, coverFile, { contentType: coverFile.type || 'image/jpeg' });
        coverPhotoURL = await getDownloadURL(sRef);
      }

      await addDoc(collection(db, 'spots'), {
        name:          form.name.trim(),
        nameAr:        form.nameAr.trim() || null,
        category:      form.category,
        tags:          form.tags,
        description:   form.description.slice(0, 300),
        address:       form.address.trim(),
        neighborhood:  '',
        city:          userProfile?.city || 'Cairo',
        isMobile:      form.isMobile,
        founderId:     user.uid,
        founderName:   userProfile?.displayName || user.displayName || 'User',
        status:        'active',
        photoURLs:     [],
        coverPhotoURL,
        checkins:      0,
        totalCheckins: 0,
        checkinsToday: 0,
        weeklyCheckins:0,
        rating:        0,
        crowd:         'Chill',
        crowdPct:      0,
        lat:           userPos.lat,
        lng:           userPos.lng,
        operatingHours: null,
        createdAt:     serverTimestamp(),
      });
      setMsg('Spot added!');
      setTimeout(onBack, 1500);
    } catch (e) {
      setMsg(
        e.code === 'permission-denied'
          ? 'Permission denied — deploy Firestore rules first (firebase deploy --only firestore:rules).'
          : `Failed to add spot: ${e.code || e.message}`
      );
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100%', background: t.bg, display: 'flex', flexDirection: 'column', fontFamily: 'Outfit, sans-serif' }}>
      <div style={{ borderBottom: `1px solid ${t.border}` }}>
        <div style={{ height: 'env(safe-area-inset-top, 44px)' }} />
        <div style={{ padding: '12px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><BackIcon color={t.text} size={18} /></button>
          <div style={{ color: t.text, fontWeight: 700, fontSize: 16 }}>Add a Spot</div>
        </div>
      </div>

      {/* GPS status banner */}
      <div style={{
        padding: '8px 14px',
        background: userPos ? 'rgba(34,197,94,0.12)' : 'rgba(234,179,8,0.12)',
        borderBottom: `1px solid ${userPos ? 'rgba(34,197,94,0.3)' : 'rgba(234,179,8,0.3)'}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: userPos ? '#22c55e' : '#eab308', flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: userPos ? '#22c55e' : '#eab308', fontFamily: 'Outfit, sans-serif' }}>
          {userPos
            ? `GPS locked — spot will be pinned at your location (${userPos.lat.toFixed(4)}, ${userPos.lng.toFixed(4)})`
            : 'Acquiring GPS… enable location to pin this spot on the map'}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Cover photo picker */}
        <div
          onClick={() => fileRef.current?.click()}
          style={{ position: 'relative', width: '100%', height: 120, borderRadius: 12, overflow: 'hidden', background: t.surface, border: `1.5px dashed ${t.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {coverPreview
            ? <img src={coverPreview} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ textAlign: 'center', color: t.muted, fontSize: 12 }}><div style={{ fontSize: 24, marginBottom: 4 }}>📷</div>Add Cover Photo (optional)</div>
          }
          {coverPreview && <div style={{ position: 'absolute', bottom: 6, right: 6, background: t.accent, borderRadius: 16, padding: '3px 8px', fontSize: 10, color: 'white', fontWeight: 700 }}>Change</div>}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPickCover} />
        </div>

        <Label t={t} text="Spot Name *">
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Roadster Meet" style={inp(t)} />
        </Label>

        <Label t={t} text="Arabic Name (optional)">
          <input value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} placeholder="اسم المكان بالعربي" style={{ ...inp(t), direction: 'rtl' }} />
        </Label>

        <Label t={t} text="Category *">
          <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} style={inp(t)}>
            {SPOT_CATEGORIES.map((c) => <option key={c} value={CATEGORY_VALUES[c] || c}>{c}</option>)}
          </select>
        </Label>

        <Label t={t} text="Tags">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SPOT_TAGS.map((tag) => (
              <button key={tag} onClick={() => toggleTag(tag)} style={tagBtn(t, form.tags.includes(tag))}>
                {SPOT_TAG_LABELS[tag]}
              </button>
            ))}
          </div>
        </Label>

        <Label t={t} text="Description (max 300 chars)">
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value.slice(0, 300) }))}
            placeholder="What makes this spot special?"
            rows={3}
            style={{ ...inp(t), resize: 'none' }}
          />
          <div style={{ fontSize: 10, color: t.muted, marginTop: 4 }}>{form.description.length}/300</div>
        </Label>

        <Label t={t} text="Address / Location *">
          <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="e.g. Nasr City, Cairo" style={inp(t)} />
        </Label>

        <button onClick={() => setForm((f) => ({ ...f, isMobile: !f.isMobile }))} style={tagBtn(t, form.isMobile)}>
          {form.isMobile ? '✓ This spot moves (car meet / pop-up)' : 'This spot moves (car meet / pop-up)'}
        </button>

        {msg && <div style={{ fontSize: 13, color: msg.includes('added') ? (t.success || '#22c55e') : t.error }}>{msg}</div>}
      </div>

      <div style={{ borderTop: `1px solid ${t.border}`, padding: 12 }}>
        <button
          onClick={submit}
          disabled={loading || !userPos}
          style={{ width: '100%', border: 'none', background: t.accent, color: 'white', borderRadius: 12, padding: 14, cursor: (!userPos || loading) ? 'not-allowed' : 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 14, opacity: (loading || !userPos) ? 0.5 : 1 }}
        >
          {loading ? 'Publishing…' : !userPos ? 'Waiting for GPS…' : 'Add Spot'}
        </button>
      </div>
    </div>
  );
}

function Label({ t, text, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, marginBottom: 5 }}>{text}</div>
      {children}
    </div>
  );
}

const inp = (t) => ({ width: '100%', border: `1px solid ${t.border}`, background: t.surface, color: t.text, borderRadius: 10, padding: '11px 12px', fontFamily: 'Outfit, sans-serif', fontSize: 13, boxSizing: 'border-box', outline: 'none' });
const tagBtn = (t, on) => ({ border: `1px solid ${on ? t.accent : t.border}`, background: on ? t.accentBg : t.surface, color: on ? t.accent : t.text, borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 12 });
