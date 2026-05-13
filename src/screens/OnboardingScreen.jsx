import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const SLIDES = [
  {
    emoji: '🗺️',
    title: 'What\'s live near you',
    titleAr: 'شوف إيه اللي شغال دلوقتي',
    body:  'Car meets, pop-ups, street spots, open-air hangouts — EgySpots shows you what\'s happening in Cairo right now.',
    bodyAr: 'ميتنجات سيارات، بوب-أبز، أكل شعبي، وأماكن مفتوحة — EgySpots بيوريك اللي بيحصل في القاهرة دلوقتي.',
    bg: '#A78BFA',
  },
  {
    emoji: '📍',
    title: 'Check in & share',
    titleAr: 'سجّل وشارك',
    body:  'When you\'re at a spot, tap to check in. Leave a rating, chat, and post a story so others know it\'s live.',
    bodyAr: 'لما تكون في مكان، سجّل تواجدك. قيّم، تكلم الناس، وانشر ستوري عشان كل الناس يعرفوا.',
    bg: '#C8A96E',
  },
  {
    emoji: '🔥',
    title: 'Stories disappear in 6 hours',
    titleAr: 'الستوريز بتختفي في ٦ ساعات',
    body:  'Every story is live for just 6 hours. Post when you\'re there — and catch others before they\'re gone.',
    bodyAr: 'كل ستوري بتتحذف بعد ٦ ساعات. انشر لما تكون موجود — وشوف الستوريز قبل ما تختفي.',
    bg: '#4ECDC4',
  },
];

export default function OnboardingScreen({ onDone }) {
  const { t } = useTheme();
  const [slide, setSlide] = useState(0);

  const current = SLIDES[slide];
  const isLast  = slide === SLIDES.length - 1;

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: t.bg, overflow: 'hidden',
    }}>

      {/* Skip */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 44px) + 12px) 20px 0', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onDone} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: t.muted, fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 600,
        }}>
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px' }}>

        {/* Emoji circle */}
        <div style={{
          width: 130, height: 130, borderRadius: 40,
          background: current.bg + '22',
          border: `2px solid ${current.bg}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 36, fontSize: 56,
          transition: 'all 0.4s ease',
        }}>
          {current.emoji}
        </div>

        <div style={{ fontSize: 26, fontWeight: 800, color: t.text, textAlign: 'center', marginBottom: 12, lineHeight: 1.3 }}>
          {current.title}
        </div>
        <div style={{ fontSize: 13, color: t.muted, textAlign: 'center', lineHeight: 1.7, maxWidth: 300 }}>
          {current.body}
        </div>
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
        {SLIDES.map((_, i) => (
          <div key={i} style={{
            width: i === slide ? 20 : 8, height: 8, borderRadius: 4,
            background: i === slide ? current.bg : t.border,
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      {/* Buttons */}
      <div style={{ padding: '0 24px 48px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLast ? (
          <>
            <button onClick={onDone} style={{
              padding: 15, borderRadius: 16,
              background: t.accent, color: 'white',
              border: 'none', cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 700,
              boxShadow: `0 4px 16px ${t.accent}55`,
            }}>
              Get Started
            </button>
            <button onClick={onDone} style={{
              padding: 12, borderRadius: 14,
              background: 'none', border: `1px solid ${t.border}`,
              color: t.muted, cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 600,
            }}>
              Already have an account? Sign In
            </button>
          </>
        ) : (
          <button onClick={() => setSlide((s) => s + 1)} style={{
            padding: 15, borderRadius: 16,
            background: t.accent, color: 'white',
            border: 'none', cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 700,
            boxShadow: `0 4px 16px ${t.accent}55`,
          }}>
            Next
          </button>
        )}
      </div>
    </div>
  );
}
