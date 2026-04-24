import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useSpots } from '../context/SpotsContext';
import { XIcon, CheckIcon } from './Icons';

const REASONS = [
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'spam',          label: 'Spam' },
  { value: 'wrong_location',label: 'Wrong location' },
  { value: 'harassment',    label: 'Harassment' },
  { value: 'other',         label: 'Other' },
];

export default function ReportModal({ targetType, targetId, onClose }) {
  const { t } = useTheme();
  const { submitReport } = useSpots();
  const [reason,  setReason]  = useState('');
  const [note,    setNote]    = useState('');
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setLoading(true);
    await submitReport(targetType, targetId, reason, note);
    setLoading(false);
    setDone(true);
    setTimeout(onClose, 1500);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end',
    }}>
      <div style={{
        width: '100%', background: t.surface, borderRadius: '20px 20px 0 0',
        padding: '20px 16px 32px', fontFamily: 'Outfit, sans-serif',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ flex: 1, fontSize: 15, fontWeight: 800, color: t.text }}>Report Content</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <XIcon color={t.muted} size={20} />
          </button>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckIcon color={t.success || '#22c55e'} size={32} />
            <div style={{ color: t.text, fontWeight: 700, marginTop: 8 }}>Report submitted. Thank you.</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {REASONS.map((r) => (
                <button key={r.value} onClick={() => setReason(r.value)} style={{
                  padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${reason === r.value ? t.accent : t.border}`,
                  background: reason === r.value ? t.accentBg : t.bg,
                  color: reason === r.value ? t.accent : t.text,
                  fontFamily: 'Outfit, sans-serif', fontSize: 13, cursor: 'pointer', textAlign: 'left',
                }}>
                  {r.label}
                </button>
              ))}
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Additional details (optional)"
              rows={2}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '10px 12px',
                borderRadius: 10, border: `1px solid ${t.border}`,
                background: t.bg, color: t.text,
                fontFamily: 'Outfit, sans-serif', fontSize: 12, resize: 'none',
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={!reason || loading}
              style={{
                width: '100%', marginTop: 12, padding: '13px 0', borderRadius: 12,
                background: reason ? t.accent : t.border, color: 'white', border: 'none',
                fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 14,
                cursor: reason ? 'pointer' : 'default',
              }}
            >
              {loading ? 'Submitting…' : 'Submit Report'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
