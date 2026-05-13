import { useState, useEffect } from 'react';

const STEPS = [
  {
    targetId: 'tour-fab',
    title: 'Check In or Post a Story',
    body: "When you're near a spot, tap to check in and let people know you're there. Anywhere else, tap to post a 6-hour story.",
    cta: 'Got it →',
    padding: 12,
  },
  {
    targetId: 'tour-add-spot',
    title: 'Add a New Spot',
    body: "Don't see a spot on the map? Tap + to add it yourself. You become the founder and get notified when others check in.",
    cta: 'Next →',
    padding: 10,
  },
  {
    targetId: 'tour-explore',
    title: 'Discover What\'s Hot',
    body: 'Browse trending spots near you — car meets, pop-ups, open-air hangouts — sorted by who\'s active right now.',
    cta: 'Next →',
    padding: 10,
  },
  {
    targetId: 'tour-stories',
    title: 'Live Stories',
    body: 'Stories from spots near you. They disappear after 6 hours — so catch them while they\'re live.',
    cta: 'Next →',
    padding: 10,
  },
  {
    targetId: null,
    title: "You're all set 🔥",
    body: 'Cairo is live right now. Go find your spot.',
    cta: 'Start Exploring',
    padding: 0,
    isFinal: true,
  },
];

export default function TourOverlay({ onDone }) {
  const [step, setStep]   = useState(0);
  const [rect, setRect]   = useState(null);
  const current           = STEPS[step];

  // Measure the target element whenever the step changes
  useEffect(() => {
    if (!current.targetId) { setRect(null); return; }
    const el = document.getElementById(current.targetId);
    if (el) setRect(el.getBoundingClientRect());
  }, [step, current.targetId]);

  const advance = () => {
    if (step + 1 < STEPS.length) setStep((s) => s + 1);
    else onDone();
  };

  const hasSpotlight = !!rect;
  // Bottom-nav elements sit in the lower half — tooltip goes above them
  const tooltipAbove = rect ? rect.top > window.innerHeight * 0.5 : false;

  const tooltipPos = (() => {
    if (!hasSpotlight) return { top: '50%', transform: 'translateY(-50%)' };
    if (tooltipAbove) return { bottom: window.innerHeight - rect.top + current.padding + 20 };
    return { top: rect.bottom + current.padding + 20 };
  })();

  return (
    <div
      onClick={advance}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        fontFamily: 'Outfit, sans-serif',
        // When spotlighting, the box-shadow on the spotlight div handles darkening.
        // When no spotlight, dim the whole screen here.
        background: hasSpotlight ? 'transparent' : 'rgba(0,0,0,0.82)',
      }}
    >
      {/* Spotlight — transparent box whose box-shadow darkens everything outside it */}
      {rect && (
        <div style={{
          position: 'fixed',
          top:    rect.top    - current.padding,
          left:   rect.left   - current.padding,
          width:  rect.width  + current.padding * 2,
          height: rect.height + current.padding * 2,
          borderRadius: 18,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.82)',
          border: '2px solid rgba(255,255,255,0.22)',
          pointerEvents: 'none',
        }} />
      )}

      {/* Tooltip card */}
      <div
        key={step}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          left: 16, right: 16,
          ...tooltipPos,
          background: 'rgba(18, 12, 36, 0.97)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 22,
          padding: '22px 20px 18px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          animation: 'fadeUp 0.22s ease both',
        }}
      >
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 16 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              height: 5, borderRadius: 3,
              width: i === step ? 20 : 5,
              background: i === step ? '#A78BFA' : 'rgba(255,255,255,0.18)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        <div style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 10, lineHeight: 1.3 }}>
          {current.title}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.65, marginBottom: 20 }}>
          {current.body}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={advance}
            style={{
              flex: 1,
              padding: '13px 0',
              borderRadius: 13,
              background: current.isFinal
                ? 'linear-gradient(135deg, #A78BFA, #7C3AED)'
                : 'rgba(167,139,250,0.15)',
              color: 'white',
              border: current.isFinal ? 'none' : '1px solid rgba(167,139,250,0.35)',
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: current.isFinal ? '0 4px 24px rgba(124,58,237,0.45)' : 'none',
            }}
          >
            {current.cta}
          </button>

          {!current.isFinal && (
            <button
              onClick={(e) => { e.stopPropagation(); onDone(); }}
              style={{
                padding: '13px 18px',
                borderRadius: 13,
                background: 'none',
                color: 'rgba(255,255,255,0.35)',
                border: '1px solid rgba(255,255,255,0.1)',
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
