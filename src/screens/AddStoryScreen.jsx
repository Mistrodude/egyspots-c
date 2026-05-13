import { useState, useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraSource, CameraResultType } from '@capacitor/camera';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSpots } from '../context/SpotsContext';
import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addDoc, collection, Timestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { computeStoryPoints } from '../utils/points';
import { XIcon, CameraIcon } from '../components/Icons';
import { haversineMeters, STORY_RADIUS_M } from '../utils/geo';

function compressImage(blob, maxWidth = 1280, quality = 0.75) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => resolve(b || blob), 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(blob); };
    img.src = url;
  });
}

export default function AddStoryScreen({ onClose, onRequireAuth, defaultSpotId, userPos }) {
  const { t } = useTheme();
  const { user, userProfile } = useAuth();
  const { spots } = useSpots();
  const fileRef = useRef(null);

  const [step,       setStep]       = useState(1); // 1: pick photo, 2: spot+caption, 3: submit
  const [photo,      setPhoto]      = useState(null); // File from gallery
  const [nativePath, setNativePath] = useState(null); // webPath from Capacitor Camera
  const [preview,    setPreview]    = useState('');
  const [spotId,     setSpotId]     = useState(defaultSpotId || '');
  const [caption,    setCaption]    = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  useEffect(() => () => { if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview); }, [preview]);

  // Request camera + photo library permission on mount so dialog appears on first install
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      Camera.requestPermissions({ permissions: ['camera', 'photos'] }).catch(() => {});
    }
  }, []);

  if (!user) {
    onRequireAuth();
    return null;
  }

  const applyFile = (f) => {
    if (!f) return;
    if (f.size > 30 * 1024 * 1024) { setError('Photo must be under 30 MB.'); return; }
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setPhoto(f);
    setNativePath(null);
    setPreview(URL.createObjectURL(f));
    setStep(2);
  };

  const handleFileChange = (e) => applyFile(e.target.files[0]);

  const handleNativeCamera = async () => {
    try {
      const result = await Camera.getPhoto({
        quality: 70,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });
      // Show preview immediately without fetching — fetch + compress happens at upload time
      if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
      setPhoto(null);
      setNativePath(result.webPath);
      setPreview(result.webPath);
      setStep(2);
    } catch (e) {
      const msg = e?.message?.toLowerCase() || '';
      if (msg.includes('cancel') || msg.includes('dismiss')) return;
      if (msg.includes('denied') || msg.includes('permission')) {
        setError('Camera access is blocked. Go to iOS Settings → EgySpots → Camera and enable it.');
      }
    }
  };

  const handleSubmit = async () => {
    if (!photo && !nativePath) { setError('Please select a photo.'); return; }
    if (!spotId) { setError('Please select a spot.'); return; }
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
      // Resolve blob: fetch native temp file or use File from gallery directly
      let rawBlob = photo;
      if (nativePath) {
        const r = await fetch(nativePath);
        rawBlob = await r.blob();
      }
      // Compress to ≤1280px wide, 75% JPEG — typically reduces 3 MB → ~250 KB
      const compressed = await compressImage(rawBlob);

      const storyId = `${user.uid}_${Date.now()}`;
      const storageRef = ref(storage, `stories/${spotId}/${storyId}.jpg`);
      const uploadPromise = uploadBytes(storageRef, compressed, { customMetadata: { uploadedBy: user.uid } });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 30000)
      );
      await Promise.race([uploadPromise, timeoutPromise]);
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

      // Award story points — fire-and-forget
      const storyPts = computeStoryPoints({ userId: user.uid, founderId: spot?.founderId || null });
      Object.entries(storyPts).forEach(([uid, pts]) => {
        updateDoc(doc(db, 'users', uid), { points: increment(pts) }).catch(() => {});
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
      setError(e?.message === 'timeout'
        ? 'Upload timed out — check your connection and try again.'
        : 'Failed to post story. Try again.');
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
              onClick={() => Capacitor.isNativePlatform() ? handleNativeCamera() : (fileRef.current.setAttribute('capture', 'environment'), fileRef.current.click())}
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
              onClick={() => { setPhoto(null); setNativePath(null); setPreview(''); setStep(1); }}
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
