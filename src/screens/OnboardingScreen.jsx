import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const SLIDES = [
  {
    emoji: '🗺️',
    title: 'Discover hidden spots',
    titleAr: 'اكتشف الأماكن المخفية',
    body:  'Find the best cafes, street food, and hangout spots across Cairo — all in real time.',
    bodyAr: 'اكتشف أفضل المقاهي والأكل الشعبي وأماكن السهر في القاهرة — في الوقت الحقيقي.',
    bg: '#A78BFA',
  },
  {
    emoji: '📍',
    title: 'Check in & share',
    titleAr: 'سجّل وشارك',
    body:  'Check in to your favourite spots, leave a rating, and tell others what\'s happening right now.',
    bodyAr: 'سجّل تواجدك في أماكنك المفضلة، اترك تقييم، وأخبر الناس بما يحدث الآن.',
    bg: '#C8A96E',
  },
  {
    emoji: '🛵',
    title: 'Follow vendors',
    titleAr: 'تابع البائعين',
    body:  'Follow your favourite coffee carts and food trucks — get notified when they\'re nearby.',
    bodyAr: 'تابع عربيات القهوة والأكل المفضلة — واعرف لما يكونوا قريبين منك.',
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
      <div style={{ padding: '56px 20px 0', display: 'flex', justifyContent: 'flex-end' }}>
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
