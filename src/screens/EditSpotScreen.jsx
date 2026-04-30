import { useState, useRef, useEffect } from 'react';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useTheme } from '../context/ThemeContext';
import { BackIcon } from '../components/Icons';
import { CATEGORIES, SPOT_TAGS, SPOT_TAG_LABELS } from '../data/spots';
import { DEFAULT_HOURS } from '../utils/openStatus';

const SPOT_CATEGORIES = CATEGORIES.filter((c) => c !== 'All');
const CATEGORY_VALUES = {
  'Street Cart': 'street_cart', 'Car Meet': 'car_meet',
  'Hangout': 'hangout', 'Pop-Up': 'pop_up', 'Open Air': 'open_air',
};

export default function EditSpotScreen({ spot, onBack }) {
  const { t } = useTheme();
  const fileRef  = useRef(null);
  const blobRef  = useRef(null);

  useEffect(() => () => { if (blobRef.current) URL.revokeObjectURL(blobRef.current); }, []);

  const [form, setForm] = useState({
    name:        spot.name || '',
    nameAr:      spot.nameAr || '',
    description: spot.description || '',
    category:    spot.category || 'hangout',
    address:     spot.address || '',
    tags:        spot.tags || [],
  });
  const [hours, setHours] = useState(spot.operatingHours || DEFAULT_HOURS());
  const [coverFile,    setCoverFile]    = useState(null);
  const [coverPreview, setCoverPreview] = useState(spot.coverPhotoURL || '');
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const onPickCover = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    blobRef.current = URL.createObjectURL(file);
    setCoverFile(file);
    setCoverPreview(blobRef.current);
  };

  const toggleTag = (tag) => setForm((f) => ({
    ...f, tags: f.tags.includes(tag) ? f.tags.filter((x) => x !== tag) : [...f.tags, tag],
  }));

  const setHourField = (day, field, value) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const save = async () => {
    if (!form.name.trim()) { setMsg('Name is required.'); return; }
    setSaving(true);
    setMsg('');
    try {
      let coverPhotoURL = spot.coverPhotoURL || '';
      if (coverFile) {
        const sRef = ref(storage, `spots/${spot.id}/cover.jpg`);
        await uploadBytes(sRef, coverFile, { contentType: coverFile.type || 'image/jpeg' });
        coverPhotoURL = await getDownloadURL(sRef);
      }
      await updateDoc(doc(db, 'spots', spot.id), {
        name:           form.name.trim(),
        nameAr:         form.nameAr.trim() || null,
        description:    form.description.slice(0, 300),
        category:       form.category,
        address:        form.address.trim(),
        tags:           form.tags,
        coverPhotoURL,
        operatingHours: hours,
        updatedAt:      serverTimestamp(),
      });
      setMsg('Saved!');
      setTimeout(onBack, 1200);
    } catch (e) {
      setMsg(e.code === 'permission-denied' ? 'Permission denied — only the founder can edit this spot.' : `Failed: ${e.code || e.message}`);
      setSaving(false);
    }
  };

  const deleteSpot = async () => {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'spots', spot.id));
      onBack();
    } catch (e) {
      setMsg(`Delete failed: ${e.code || e.message}`);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div style={{ height: '100%', background: t.bg, display: 'flex', flexDirection: 'column', fontFamily: 'Outfit, sans-serif' }}>
      <div style={{ borderBottom: `1px solid ${t.border}` }}>
        <div style={{ height: 'env(safe-area-inset-top, 44px)' }} />
        <div style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><BackIcon color={t.text} size={18} /></button>
          <div style={{ color: t.text, fontWeight: 700, fontSize: 16 }}>Edit Spot</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Cover photo */}
        <div
          onClick={() => fileRef.current?.click()}
          style={{ position: 'relative', width: '100%', height: 140, borderRadius: 12, overflow: 'hidden', background: t.surface, border: `1.5px dashed ${t.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {coverPreview
            ? <img src={coverPreview} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ textAlign: 'center', color: t.muted, fontSize: 12 }}><div style={{ fontSize: 28, marginBottom: 4 }}>📷</div>Add Cover Photo</div>
          }
          <div style={{ position: 'absolute', bottom: 8, right: 8, background: t.accent, borderRadius: 20, padding: '4px 10px', fontSize: 11, color: 'white', fontWeight: 700 }}>Change</div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPickCover} />
        </div>

        <Label t={t} text="Spot Name *">
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={inp(t)} />
        </Label>
        <Label t={t} text="Arabic Name (optional)">
          <input value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} style={{ ...inp(t), direction: 'rtl' }} />
        </Label>
        <Label t={t} text="Category">
          <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} style={inp(t)}>
            {SPOT_CATEGORIES.map((c) => <option key={c} value={CATEGORY_VALUES[c] || c}>{c}</option>)}
          </select>
        </Label>
        <Label t={t} text="Description (max 300 chars)">
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value.slice(0, 300) }))} rows={3} style={{ ...inp(t), resize: 'none' }} />
          <div style={{ fontSize: 10, color: t.muted, marginTop: 4 }}>{form.description.length}/300</div>
        </Label>
        <Label t={t} text="Address">
          <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} style={inp(t)} />
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

        <Label t={t} text="Operating Hours">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map((day) => {
              const h = hours[day] || { closed: false, open: '10:00', close: '22:00' };
              return (
                <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: t.text, width: 80, textTransform: 'capitalize' }}>{day.slice(0,3)}</span>
                  <button
                    onClick={() => setHourField(day, 'closed', !h.closed)}
                    style={{ border: `1px solid ${h.closed ? t.error || '#ef4444' : t.border}`, background: h.closed ? '#ef444422' : t.surface, color: h.closed ? '#ef4444' : t.muted, borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 11, fontWeight: 600, flexShrink: 0 }}
                  >
                    {h.closed ? 'Closed' : 'Open'}
                  </button>
                  {!h.closed && (
                    <>
                      <input type="time" value={h.open || '10:00'} onChange={(e) => setHourField(day, 'open', e.target.value)} style={{ ...inp(t), flex: 1, padding: '6px 8px' }} />
                      <span style={{ fontSize: 11, color: t.muted }}>–</span>
                      <input type="time" value={h.close || '22:00'} onChange={(e) => setHourField(day, 'close', e.target.value)} style={{ ...inp(t), flex: 1, padding: '6px 8px' }} />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Label>

        {msg && <div style={{ fontSize: 13, color: msg === 'Saved!' ? '#22c55e' : t.error }}>{msg}</div>}

        <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 12, marginTop: 4 }}>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} style={{ width: '100%', border: `1px solid ${t.error || '#ef4444'}`, background: 'transparent', color: t.error || '#ef4444', borderRadius: 10, padding: 10, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 13 }}>
              Delete This Spot
            </button>
          ) : (
            <div style={{ border: `1px solid ${t.error || '#ef4444'}`, borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 13, color: t.text, fontWeight: 700, marginBottom: 8 }}>Delete "{spot.name}"? This cannot be undone.</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, border: `1px solid ${t.border}`, background: t.surface, color: t.text, borderRadius: 10, padding: 10, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
                <button onClick={deleteSpot} disabled={deleting} style={{ flex: 1, border: 'none', background: t.error || '#ef4444', color: 'white', borderRadius: 10, padding: 10, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                  {deleting ? 'Deleting…' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${t.border}`, padding: 12 }}>
        <button onClick={save} disabled={saving} style={{ width: '100%', border: 'none', background: t.accent, color: 'white', borderRadius: 12, padding: 14, cursor: saving ? 'wait' : 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 14 }}>
          {saving ? 'Saving…' : 'Save Changes'}
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
