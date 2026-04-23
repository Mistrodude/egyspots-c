import { useTheme } from '../../context/ThemeContext';
import Avatar from '../../components/Avatar';
import { STORIES, SEED_MESSAGES } from '../../data/mockData';

export default function ChatTab({ spot, onOpenChat }) {
  const { t } = useTheme();

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Stories */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, marginBottom: 8, letterSpacing: '1px' }}>MOMENTS FROM HERE</div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
          {STORIES.map((s) => (
            <div key={s.id} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', padding: 2,
                background: s.seen ? t.border : `linear-gradient(135deg, ${t.accent}, #E07A5F)`,
              }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: t.surface, padding: 2 }}>
                  <Avatar initials={s.avatar} size={44} color={t.accent} bg={t.accentBg} />
                </div>
              </div>
              <span style={{ fontSize: 9, color: t.muted, maxWidth: 52, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.user.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Preview messages */}
      <div style={{ background: t.surface, borderRadius: 14, padding: 14, border: `1px solid ${t.border}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: t.text, marginBottom: 10 }}>Live Chat · {spot.checkins} here</div>
        {SEED_MESSAGES.slice(-3).map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, justifyContent: m.mine ? 'flex-end' : 'flex-start' }}>
            {!m.mine && <Avatar initials={m.avatar} size={24} color={t.accent} bg={t.accentBg} />}
            <div style={{ maxWidth: '70%' }}>
              <div style={{ fontSize: 10, color: t.muted, marginBottom: 2, textAlign: m.mine ? 'right' : 'left' }}>
                {m.mine ? 'You' : m.user}
              </div>
              <div style={{
                padding: '7px 10px', borderRadius: 12,
                background: m.mine ? t.accent : t.surface2,
                color: m.mine ? 'white' : t.text,
                fontSize: 11,
              }}>{m.text}</div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={onOpenChat} style={{
        width: '100%', padding: 12, borderRadius: 14,
        border: `1.5px solid ${t.accent}`, background: t.accentBg,
        color: t.accent, fontSize: 13, fontWeight: 700,
        cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
      }}>
        Open Live Chat →
      </button>
    </div>
  );
}
