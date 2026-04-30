import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSpots } from '../context/SpotsContext';
import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { XIcon, CameraIcon } from '../components/Icons';
import { haversineMeters, STORY_RADIUS_M } from '../utils/geo';

export default function AddStoryScreen({ onClose, onRequireAuth, defaultSpotId, userPos }) {
  const { t } = useTheme();
  const { user, userProfile } = useAuth();
  const { spots } = useSpots();
  const fileRef = useRef(null);

  const [step,       setStep]       = useState(1); // 1: pick photo, 2: spot+caption, 3: submit
  const [photo,      setPhoto]      = useState(null);
  const [preview,    setPreview]    = useState('');
  const [spotId,     setSpotId]     = useState(defaultSpotId || '');
  const [caption,    setCaption]    = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  if (!user) {
    onRequireAuth();
    return null;
  }

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(f);
    setPreview(URL.createObjectURL(f));
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!photo || !spotId) { setError('Please select a photo and a spot.'); return; }
    if (userPos && spot) {
      const dist = haversineMeters(userPos, spot);
      if (dist > STORY_RADIUS_M) {
        setError(`You need to be at ${spot.name} to post a story (you're ${Math.round(dist)}m away).`);
        return;
      }
    }
    setLoading(true);
    setError('');
    try {
      const storyId = `${user.uid}_${Date.now()}`;
      const storageRef = ref(storage, `stories/${spotId}/${storyId}.jpg`);
      await uploadBytes(storageRef, photo, { customMetadata: { uploadedBy: user.uid } });
      const photoURL = await getDownloadURL(storageRef);

      const now = Timestamp.now();
      const expiresAt = new Timestamp(now.seconds + 6 * 60 * 60, now.nanoseconds);

      await addDoc(collection(db, 'stories'), {
        spotId,
        userId:       user.uid,
        userName:     userProfile?.displayName || user.displayName || 'User',
        userPhotoURL: userProfile?.profilePhotoURL || user.photoURL || null,
        photoURL,
        caption:      caption.slice(0, 150),
        createdAt:    now,
        expiresAt,
        viewCount:    0,
        viewedBy:     [],
      });

      // Notify spot founder (fire-and-forget)
      if (spot?.founderId && spot.founderId !== user.uid) {
        addDoc(collection(db, 'notifications'), {
          toUserId:  spot.founderId,
          type:      'new_story',
          title:     `New story at ${spot.name}`,
          body:      `${userProfile?.displayName || 'Someone'} posted a story`,
          data:      { spotId },
          isRead:    false,
          createdAt: now,
        }).catch(() => {});
      }

      onClose();
    } catch (e) {
      setError('Failed to post story. Try again.');
      setLoading(false);
    }
  };

  const spot = spots.find((s) => s.id === spotId);

  return (
    <div style={{ height: '100%', background: t.bg, display: 'flex', flexDirection: 'column', fontFamily: 'Outfit, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '52px 16px 12px', borderBottom: `1px solid ${t.border}` }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 10 }}>
          <XIcon color={t.text} size={22} />
        </button>
        <div style={{ fontSize: 16, fontWeight: 800, color: t.text, flex: 1 }}>New Story</div>
        {step === 2 && (
          <button
            onClick={handleSubmit}
            disabled={loading || !spotId}
            style={{ padding: '8px 16px', borderRadius: 10, background: spotId ? t.accent : t.border, color: 'white', border: 'none', cursor: spotId ? 'pointer' : 'default', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13 }}
          >
            {loading ? 'Posting…' : 'Post'}
          </button>
        )}
      </div>

      {step === 1 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ fontSize: 48 }}>📸</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Add a photo to your story</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => { fileRef.current.setAttribute('capture', 'environment'); fileRef.current.click(); }}
              style={{ padding: '12px 20px', borderRadius: 12, background: t.accent, color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <CameraIcon color="white" size={16} /> Camera
            </button>
            <button
              onClick={() => { fileRef.current.removeAttribute('capture'); fileRef.current.click(); }}
              style={{ padding: '12px 20px', borderRadius: 12, background: t.surface, color: t.text, border: `1px solid ${t.border}`, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}
            >
              Gallery
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>
      )}

      {step === 2 && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Photo preview */}
          <div style={{ position: 'relative' }}>
            <img src={preview} alt="preview" style={{ width: '100%', borderRadius: 14, maxHeight: 280, objectFit: 'cover' }} />
            <button
              onClick={() => { setPhoto(null); setPreview(''); setStep(1); }}
              style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <XIcon color="white" size={14} />
            </button>
          </div>

          {/* Spot selector */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: t.muted, marginBottom: 6 }}>SPOT</div>
            <select
              value={spotId}
              onChange={(e) => setSpotId(e.target.value)}
              style={{ width: '100%', padding: '11px 12px', borderRadius: 10, border: `1px solid ${t.border}`, background: t.surface, color: t.text, fontFamily: 'Outfit, sans-serif', fontSize: 13 }}
            >
              <option value="">Select a spot…</option>
              {spots.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.neighborhood}</option>)}
            </select>
          </div>

          {/* Caption */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.muted }}>CAPTION</div>
              <div style={{ fontSize: 10, color: t.muted }}>{caption.length}/150</div>
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, 150))}
              placeholder="What's happening here?"
              rows={3}
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: `1px solid ${t.border}`, background: t.surface, color: t.text, fontFamily: 'Outfit, sans-serif', fontSize: 13, resize: 'none' }}
            />
          </div>

          {error && <div style={{ fontSize: 12, color: t.error || '#ef4444' }}>{error}</div>}

          <button
            onClick={handleSubmit}
            disabled={loading || !spotId}
            style={{ padding: '14px 0', borderRadius: 14, background: spotId ? t.accent : t.border, color: 'white', border: 'none', cursor: spotId ? 'pointer' : 'default', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14 }}
          >
            {loading ? 'Posting…' : 'Post Story'}
          </button>
        </div>
      )}
    </div>
  );
}
