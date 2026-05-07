import { useEffect, useRef, useState } from 'react';
import {
  arrayUnion, collection, doc, getDoc, getDocs,
  limit, orderBy, query, runTransaction, serverTimestamp,
  setDoc, updateDoc, where,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useTheme } from '../context/ThemeContext';
import { useSpots } from '../context/SpotsContext';
import { useAuth } from '../context/AuthContext';
import { useStories } from '../context/StoriesContext';
import { BackIcon, HeartIcon, ShareIcon, MapPinIcon, PlusIcon, EditIcon } from '../components/Icons';
import { SPOT_TAG_LABELS } from '../data/spots';
import StoryRing from '../components/StoryRing';
import ReportModal from '../components/ReportModal';
import { haversineMeters, CHECKIN_RADIUS_M } from '../utils/geo';
import { getOpenStatus } from '../utils/openStatus';

export default function SpotDetailScreen({ spot, userPos, onBack, onOpenChat, onStoryViewer, onAddStory, onEditSpot, onRequireAuth }) {
  const { t } = useTheme();
  const { checkedInId, checkIn } = useSpots();
  const { user, userProfile, toggleSaveSpot } = useAuth();
  const { storiesBySpot, markViewed } = useStories();
  const [checkins, setCheckins] = useState([]);
  const [feedLimit, setFeedLimit] = useState(10);
  const [showHours, setShowHours] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [distWarn, setDistWarn] = useState(false);
  const [photoURLs, setPhotoURLs] = useState(spot.photoURLs || []);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoMsg, setPhotoMsg] = useState('');
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [userRating, setUserRating] = useState(null);
  const [hoverRating, setHoverRating] = useState(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const photoInputRef = useRef(null);
  const openStatus = getOpenStatus(spot.operatingHours);

  const isCheckedIn = checkedInId === spot.id;
  const isSaved = (userProfile?.savedSpots || []).includes(spot.id);

  const handleHeart = async () => {
    if (!user) { onRequireAuth(); return; }
    await toggleSaveSpot(spot.id);
  };

  const textDescription = userProfile?.language === 'ar' && spot.descriptionAr ? spot.descriptionAr : spot.description;
  const spotStories = storiesBySpot[spot.id] || [];

  const distanceToSpot = userPos ? haversineMeters(userPos, spot) : null;
  const canCheckIn = isCheckedIn || distanceToSpot === null || distanceToSpot <= CHECKIN_RADIUS_M;
  const formatDist = (m) => m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)} km`;

  const stats = [
    { label: 'Today', value: spot.checkinsToday || 0 },
    { label: 'Week', value: spot.weeklyCheckins || 0 },
    { label: 'Rating', value: spot.rating ? spot.rating.toFixed(1) : '--' },
    { label: 'Distance', value: distanceToSpot !== null ? formatDist(distanceToSpot) : '--' },
  ];

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(
          collection(db, 'checkins'),
          where('spotId', '==', spot.id),
          orderBy('timestamp', 'desc'),
          limit(feedLimit)
        );
        const snap = await getDocs(q);
        setCheckins(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (_) {
        setCheckins([]);
      }
    };
    load();
  }, [spot.id, feedLimit]);

  // Load user's existing rating
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'spots', spot.id, 'ratings', user.uid))
      .then((snap) => { if (snap.exists()) setUserRating(snap.data().rating); })
      .catch(() => {});
  }, [spot.id, user]);

  const submitRating = async (stars) => {
    if (!user) { onRequireAuth(); return; }
    setRatingLoading(true);
    try {
      const ratingRef = doc(db, 'spots', spot.id, 'ratings', user.uid);
      const spotRef   = doc(db, 'spots', spot.id);
      await runTransaction(db, async (tx) => {
        const existingSnap = await tx.get(ratingRef);
        const spotSnap     = await tx.get(spotRef);
        const data = spotSnap.data() || {};
        let ratingSum   = data.ratingSum   || 0;
        let ratingCount = data.ratingCount || 0;
        if (existingSnap.exists()) {
          ratingSum = ratingSum - existingSnap.data().rating + stars;
        } else {
          ratingSum  += stars;
          ratingCount += 1;
        }
        const rating = ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : stars;
        tx.set(ratingRef, { rating: stars, userId: user.uid, timestamp: serverTimestamp() });
        tx.update(spotRef, { ratingSum, ratingCount, rating });
      });
      setUserRating(stars);
    } catch (e) {
      console.warn('Rating error:', e.message);
    }
    setRatingLoading(false);
  };

  const handlePrimaryCheckIn = async () => {
    if (!user) { onRequireAuth(); return; }
    if (!canCheckIn) {
      setDistWarn(true);
      setTimeout(() => setDistWarn(false), 3000);
      return;
    }
    await checkIn(spot.id);
  };

  const shareSpot = async () => {
    const mapsUrl = `https://maps.google.com/?q=${spot.lat},${spot.lng}`;
    const text = `${spot.name} — ${spot.neighborhood || spot.address}\n${mapsUrl}`;
    try {
      if (navigator.share) await navigator.share({ title: spot.name, text, url: mapsUrl });
      else if (navigator.clipboard) await navigator.clipboard.writeText(text);
    } catch (_) {}
  };

  const openMaps = () => window.open(`maps://?ll=${spot.lat},${spot.lng}&q=${encodeURIComponent(spot.name || 'Spot')}`, '_system');

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { setPhotoMsg('Photo must be under 5 MB.'); return; }
    setPhotoMsg('');
    setUploadingPhoto(true);
    try {
      const sRef = ref(storage, `spots/${spot.id}/photos/${Date.now()}.jpg`);
      await uploadBytes(sRef, file, { contentType: file.type || 'image/jpeg' });
      const url = await getDownloadURL(sRef);
      await updateDoc(doc(db, 'spots', spot.id), { photoURLs: arrayUnion(url) });
      setPhotoURLs((prev) => [...prev, url]);
    } catch (_) {}
    setUploadingPhoto(false);
  };

  const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = dayKeys[new Date().getDay()];
  const hoursRows = Object.entries(spot.operatingHours || {});

  const displayRating = hoverRating ?? userRating ?? 0;

  return (
    <div style={{ height: '100%', background: t.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', height: 'calc(160px + env(safe-area-inset-top, 44px))', background: `linear-gradient(135deg, ${spot.color || t.accent}33, ${spot.color || t.accent}77)` }}>
        {spot.coverPhotoURL && (
          <img src={spot.coverPhotoURL} alt={spot.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        {spot.coverPhotoURL && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 40%, rgba(0,0,0,0.65) 100%)' }} />
        )}
        <button onClick={onBack} style={iconBtn(t, 'calc(env(safe-area-inset-top, 44px) + 8px)', 12)}><BackIcon color={t.text} size={18} /></button>
        <button onClick={handleHeart} style={iconBtn(t, 'calc(env(safe-area-inset-top, 44px) + 8px)', null, 12)}><HeartIcon color={isSaved ? '#ef4444' : t.text} size={18} /></button>
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: t.text }}>{spot.name}</div>
            {openStatus && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
                background: openStatus.isOpen ? '#22c55e22' : '#ef444422',
                color: openStatus.isOpen ? '#22c55e' : '#ef4444',
                border: `1px solid ${openStatus.isOpen ? '#22c55e55' : '#ef444455'}`,
              }}>
                {openStatus.label}
              </span>
            )}
          </div>
          {spot.nameAr && <div style={{ fontSize: 13, color: t.muted }}>{spot.nameAr}</div>}
        </div>
      </div>

      {/* Stories ring bar */}
      <div style={{ padding: '10px 12px 6px', borderBottom: `1px solid ${t.border}`, background: t.surface }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
          <button
            onClick={() => { if (!user) { onRequireAuth(); return; } onAddStory ? onAddStory() : onStoryViewer && onStoryViewer(); }}
            style={{ width: 48, height: 48, borderRadius: '50%', background: t.accentBg, border: `2px dashed ${t.accent}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <PlusIcon color={t.accent} size={16} />
          </button>
          {spotStories.length === 0 && <span style={{ fontSize: 11, color: t.muted, fontFamily: 'Outfit, sans-serif' }}>Be the first to post a story here</span>}
          {spotStories.map((s) => (
            <StoryRing
              key={s.id}
              name={s.userName}
              photoURL={s.userPhotoURL}
              hasUnviewed={!(s.viewedBy || []).includes(user?.uid)}
              size={40}
              onPress={() => { markViewed(s.id); onStoryViewer && onStoryViewer(); }}
            />
          ))}
        </div>
      </div>

      {/* Founder badge */}
      {spot.founderName && spot.founderName !== 'Egyspots Team' && (
        <div style={{ padding: '8px 14px', background: t.surface, borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: t.accentBg, color: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>
            {(spot.founderName || 'E')[0].toUpperCase()}
          </div>
          <span style={{ fontSize: 11, color: t.muted, fontFamily: 'Outfit, sans-serif' }}>Founded by <span style={{ color: t.text, fontWeight: 700 }}>{spot.founderName}</span></span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: `1px solid ${t.border}`, background: t.surface }}>
        {stats.map((s) => (
          <div key={s.label} style={{ textAlign: 'center', padding: '10px 4px' }}>
            <div style={{ fontSize: 14, color: t.accent, fontWeight: 800 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: t.muted }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, padding: 10, borderBottom: `1px solid ${t.border}`, overflowX: 'auto', background: t.surface }}>
        <button onClick={handlePrimaryCheckIn} style={actionBtn(t, true)}>
          {isCheckedIn ? '✓ Checked In' : 'Check In'}
        </button>
        <button onClick={shareSpot} style={actionBtn(t, false)}><ShareIcon color={t.text} size={14} /> Share</button>
        {onEditSpot && <button onClick={onEditSpot} style={actionBtn(t, false)}><EditIcon color={t.text} size={14} /> Edit</button>}
        <button onClick={() => setReportOpen(true)} style={actionBtn(t, false)}>Report</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          <Badge t={t} color={t.accent} label={(spot.category || '').replace('_', ' ').toUpperCase()} />
          {spot.isMobile && <Badge t={t} color={t.warning || '#f59e0b'} label="Mobile" />}
        </div>
        {textDescription && <div style={{ fontSize: 13, color: t.text, marginBottom: 10 }}>{textDescription}</div>}
        {(spot.tags || []).length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {(spot.tags || []).map((tag) => (
              <span key={tag} style={{ fontSize: 11, color: t.accentText, background: t.accentBg, borderRadius: 999, padding: '4px 10px', fontWeight: 600 }}>
                {SPOT_TAG_LABELS[tag] || tag}
              </span>
            ))}
          </div>
        )}

        {/* Photo gallery */}
        {(photoURLs.length > 0 || user?.uid === spot.founderId) && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 6 }}>Photos</div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
              {photoURLs.map((url, i) => (
                <img
                  key={i} src={url} alt=""
                  onClick={() => setLightboxUrl(url)}
                  style={{ width: 100, height: 80, borderRadius: 10, objectFit: 'cover', flexShrink: 0, cursor: 'pointer' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ))}
              {user?.uid === spot.founderId && (
                <button
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  style={{ width: 100, height: 80, borderRadius: 10, flexShrink: 0, border: `1.5px dashed ${t.border}`, background: t.surface, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: t.muted, fontSize: 11, gap: 4, fontFamily: 'Outfit, sans-serif' }}
                >
                  <span style={{ fontSize: 22 }}>📷</span>
                  {uploadingPhoto ? 'Uploading…' : 'Add Photo'}
                </button>
              )}
              <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadPhoto} />
            </div>
            {photoMsg && <div style={{ fontSize: 12, color: t.error || '#ef4444', marginTop: 6 }}>{photoMsg}</div>}
          </div>
        )}

        <div style={{ border: `1px solid ${t.border}`, background: t.surface, borderRadius: 12, padding: 10, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: t.text }}><MapPinIcon color={t.text} size={14} /> {spot.address || spot.neighborhood}</div>
          <button onClick={openMaps} style={{ marginTop: 8, border: `1px solid ${t.border}`, background: t.surface2, color: t.text, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Open in Maps</button>
        </div>

        <div style={{ border: `1px solid ${t.border}`, background: t.surface, borderRadius: 12, padding: 10, marginBottom: 10 }}>
          <button onClick={() => setShowHours((v) => !v)} style={{ border: 'none', background: 'transparent', color: t.text, fontWeight: 700, cursor: 'pointer', padding: 0, fontFamily: 'Outfit, sans-serif' }}>
            Operating Hours {showHours ? '▲' : '▼'}
          </button>
          {showHours && (
            <div style={{ marginTop: 8, fontSize: 12 }}>
              {hoursRows.map(([day, h]) => (
                <div key={day} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: day === today ? t.accent : t.text }}>
                  <span style={{ textTransform: 'capitalize' }}>{day}</span>
                  <span>{h.closed ? 'Closed' : `${h.open} – ${h.close}`}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Star rating */}
        <div style={{ border: `1px solid ${t.border}`, background: t.surface, borderRadius: 12, padding: 12, marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: t.text, marginBottom: 8 }}>
            {userRating ? `Your rating: ${userRating} ★` : 'Rate this spot'}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => submitRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                disabled={ratingLoading}
                style={{
                  border: 'none', background: 'none', cursor: ratingLoading ? 'wait' : 'pointer',
                  fontSize: 28, lineHeight: 1, padding: '2px 4px',
                  color: star <= displayRating ? '#F4C430' : t.border,
                  transition: 'color 0.1s',
                }}
              >
                ★
              </button>
            ))}
            {ratingLoading && <span style={{ fontSize: 11, color: t.muted, alignSelf: 'center', marginLeft: 4 }}>Saving…</span>}
          </div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 8 }}>Recent Check-ins</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {checkins.map((c) => (
            <div key={c.id} style={{ border: `1px solid ${t.border}`, background: t.surface, borderRadius: 10, padding: 10 }}>
              <div style={{ fontSize: 12, color: t.text, fontWeight: 700 }}>{c.isAnonymous ? 'Anonymous' : c.username || 'User'}</div>
              {c.note && <div style={{ fontSize: 12, color: t.text, marginTop: 3 }}>{c.note}</div>}
              <div style={{ fontSize: 10, color: t.muted, marginTop: 4 }}>{c.rating ? `★ ${c.rating}` : ''}</div>
            </div>
          ))}
          {checkins.length === 0 && <div style={{ color: t.muted, fontSize: 12 }}>No check-ins yet.</div>}
        </div>
        <button onClick={() => setFeedLimit((n) => n + 10)} style={{ marginTop: 10, border: `1px solid ${t.border}`, background: t.surface, color: t.text, borderRadius: 9, padding: '8px 10px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Show More</button>
      </div>

      <div style={{ padding: '12px 12px calc(12px + env(safe-area-inset-bottom, 0px))', borderTop: `1px solid ${t.border}`, background: t.navBg }}>
        {distWarn && distanceToSpot !== null && (
          <div style={{ textAlign: 'center', color: t.error || '#ef4444', fontSize: 12, marginBottom: 6, fontFamily: 'Outfit, sans-serif' }}>
            You're {formatDist(distanceToSpot)} away — get within 200m to check in
          </div>
        )}
        <button
          onClick={handlePrimaryCheckIn}
          style={{
            width: '100%',
            border: `2px solid ${canCheckIn ? t.accent : t.border}`,
            background: isCheckedIn ? t.accent : 'transparent',
            color: isCheckedIn ? 'white' : canCheckIn ? t.accent : t.muted,
            borderRadius: 12, padding: 12, cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif', fontWeight: 700,
            transition: 'all 0.2s',
          }}
        >
          {isCheckedIn
            ? '✓ Checked In — Tap to Leave'
            : canCheckIn
              ? 'Check In Here'
              : `${formatDist(distanceToSpot)} away`}
        </button>
        <button onClick={onOpenChat} style={{ marginTop: 8, width: '100%', border: `1px solid ${t.border}`, background: t.surface, color: t.text, borderRadius: 10, padding: 10, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Open Chat</button>
      </div>

      {reportOpen && <ReportModal targetType="spot" targetId={spot.id} onClose={() => setReportOpen(false)} />}

      {/* Photo lightbox */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.93)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <img
            src={lightboxUrl}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 4 }}
          />
          <button
            onClick={() => setLightboxUrl(null)}
            style={{
              position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 16px)', right: 16,
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)', border: 'none',
              color: 'white', fontSize: 20, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

function iconBtn(t, top, left, right) {
  return {
    position: 'absolute', top, left, right,
    border: 'none', width: 34, height: 34, borderRadius: '50%',
    background: t.surface,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  };
}
function Badge({ t, color, label }) {
  return <span style={{ fontSize: 10, fontWeight: 700, color, border: `1px solid ${color}44`, background: `${color}22`, borderRadius: 999, padding: '3px 8px' }}>{label}</span>;
}
function actionBtn(t, primary) {
  return {
    border: 'none',
    background: primary ? t.gold : t.surface2,
    color: primary ? '#1a1714' : t.text,
    borderRadius: 9, padding: '8px 10px', cursor: 'pointer',
    fontFamily: 'Outfit, sans-serif', fontWeight: 600,
    display: 'inline-flex', alignItems: 'center', gap: 5,
  };
}
