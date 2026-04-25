import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useSpots } from '../context/SpotsContext';
import { BackIcon, CameraIcon, ImageIcon, CheckIcon, StarFilledIcon } from '../components/Icons';

export default function CheckInModal({ spot, onClose, onSuccess }) {
  const { t } = useTheme();
  const { checkIn } = useSpots();
  const [step, setStep] = useState(1);
  const [location, setLocation] = useState(null);
  const [locError, setLocError] = useState('');
  const [overrideDistance, setOverrideDistance] = useState(false);
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [file, setFile] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocError('Location is not supported on this device.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocError("Habibi, we need your GPS to verify you're actually at the spot. Enable location in your browser settings and try again."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const distanceM = useMemo(() => {
    if (!location) return null;
    const dLat = (spot.lat - location.lat) * (Math.PI / 180);
    const dLng = (spot.lng - location.lng) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(location.lat * Math.PI / 180) * Math.cos(spot.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return Math.round(2 * 6371000 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }, [location, spot.lat, spot.lng]);

  const distColor = distanceM == null ? t.muted : distanceM < 200 ? t.success : distanceM <= 500 ? t.warning : t.error;
  const canProceedStep1 = !!location && distanceM != null && (distanceM <= 500 || overrideDistance);

  const submit = async () => {
    setSubmitError('');
    const result = await checkIn(spot.id, {
      note,
      rating: rating || null,
      isAnonymous,
      location,
      photoURL: file ? URL.createObjectURL(file) : null,
    });
    if (!result?.success) {
      setSubmitError(result?.error || 'Could not complete check-in.');
      return;
    }
    setSuccess(true);
    setTimeout(() => onSuccess(), 2000);
  };

  return (
    <div style={{ height: '100%', background: t.bg, color: t.text, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderBottom: `1px solid ${t.border}` }}>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><BackIcon color={t.text} size={18} /></button>
        <div style={{ fontWeight: 700 }}>Check in at {spot.name}</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        <div style={{ fontSize: 12, color: t.muted, marginBottom: 8 }}>Step {step} of 5</div>

        {step === 1 && (
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Confirm Location</h3>
            {locError ? (
              <div style={{ border: `1px solid ${t.error}`, background: t.errorBg, borderRadius: 10, padding: 10, fontSize: 12 }}>{locError}</div>
            ) : (
              <div style={{ border: `1px solid ${distColor}`, background: t.surface, borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 12, color: t.muted }}>Distance to spot</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: distColor }}>{distanceM == null ? 'Locating...' : `${distanceM}m`}</div>
              </div>
            )}
            {distanceM > 500 && (
              <button onClick={() => setOverrideDistance(true)} style={{ marginTop: 10, border: `1px solid ${t.warning}`, background: t.warningBg, color: t.warning, borderRadius: 10, padding: '8px 10px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                Check in anyway
              </button>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Rate & Review (Optional)</h3>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                  <StarFilledIcon color={s <= rating ? t.gold : t.border} size={24} />
                </button>
              ))}
            </div>
            <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 200))} placeholder="Add a note..." style={{ width: '100%', minHeight: 100, borderRadius: 10, border: `1px solid ${t.border}`, background: t.surface, color: t.text, padding: 10, fontFamily: 'Outfit, sans-serif' }} />
            <div style={{ fontSize: 11, color: t.muted, textAlign: 'right' }}>{note.length}/200</div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Add Photo (Optional)</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <label style={pickBtn(t)}><CameraIcon color={t.text} size={16} /> Camera<input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
              <label style={pickBtn(t)}><ImageIcon color={t.text} size={16} /> Gallery<input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
            </div>
            {file && <div style={{ marginTop: 10, fontSize: 12, color: t.text }}>{file.name} <button onClick={() => setFile(null)} style={{ border: 'none', background: 'transparent', color: t.error, cursor: 'pointer' }}>Remove</button></div>}
          </div>
        )}

        {step === 4 && (
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Privacy</h3>
            <button onClick={() => setIsAnonymous((v) => !v)} style={{ border: `1px solid ${isAnonymous ? t.accent : t.border}`, background: isAnonymous ? t.accentBg : t.surface, color: t.text, borderRadius: 10, padding: 10, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
              {isAnonymous ? 'Anonymous check-in: ON' : 'Check in anonymously'}
            </button>
          </div>
        )}

        {step === 5 && (
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Submit</h3>
            {success ? (
              <div style={{ border: `1px solid ${t.success}`, background: t.successBg, borderRadius: 12, padding: 12, textAlign: 'center' }}>
                <CheckIcon color={t.success} size={26} />
                <div style={{ fontWeight: 700, marginTop: 6 }}>Checked in at {spot.name}!</div>
              </div>
            ) : (
              <>
                <button onClick={submit} style={{ width: '100%', border: 'none', background: t.accent, color: 'white', borderRadius: 12, padding: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                  Post Check-in
                </button>
                {submitError && <div style={{ marginTop: 8, fontSize: 12, color: t.error }}>{submitError}</div>}
              </>
            )}
          </div>
        )}
      </div>

      {!success && (
        <div style={{ padding: 12, borderTop: `1px solid ${t.border}`, display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, border: `1px solid ${t.border}`, background: t.surface, color: t.text, borderRadius: 10, padding: 10, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
          {step < 5 ? (
            <button onClick={() => setStep((n) => n + 1)} disabled={step === 1 && !canProceedStep1} style={{ flex: 1, border: 'none', background: t.accent, color: 'white', borderRadius: 10, padding: 10, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', opacity: step === 1 && !canProceedStep1 ? 0.5 : 1 }}>Confirm</button>
          ) : (
            <button onClick={() => setStep((n) => Math.max(1, n - 1))} style={{ flex: 1, border: `1px solid ${t.border}`, background: t.surface, color: t.text, borderRadius: 10, padding: 10, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Back</button>
          )}
        </div>
      )}
    </div>
  );
}

function pickBtn(t) {
  return {
    border: `1px solid ${t.border}`,
    background: t.surface,
    color: t.text,
    borderRadius: 10,
    padding: '10px 12px',
    cursor: 'pointer',
    fontFamily: 'Outfit, sans-serif',
    display: 'inline-flex',
    gap: 6,
    alignItems: 'center',
  };
}
