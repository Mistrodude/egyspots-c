import { describe, it, expect } from 'vitest';
import {
  explorerCheckinPts,
  isMilestone,
  shouldAwardFounder,
  computeCheckinPoints,
  computeStoryPoints,
  EXPLORER_FIRST_VISIT,
  EXPLORER_REPEAT_VISIT,
  EXPLORER_POST_STORY,
  EXPLORER_FIRST_SPOT_CHECKIN,
  FOUNDER_CHECKIN,
  FOUNDER_STORY,
  FOUNDER_MILESTONE,
  MILESTONE_THRESHOLDS,
} from '../utils/points';

// ---------------------------------------------------------------------------
// explorerCheckinPts — first visit vs repeat visit
// ---------------------------------------------------------------------------
describe('explorerCheckinPts', () => {
  it('awards EXPLORER_FIRST_VISIT on first visit', () => {
    expect(explorerCheckinPts(true)).toBe(EXPLORER_FIRST_VISIT);
    expect(explorerCheckinPts(true)).toBe(10);
  });

  it('awards EXPLORER_REPEAT_VISIT on repeat visit', () => {
    expect(explorerCheckinPts(false)).toBe(EXPLORER_REPEAT_VISIT);
    expect(explorerCheckinPts(false)).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// isMilestone — exact threshold detection
// ---------------------------------------------------------------------------
describe('isMilestone', () => {
  it('returns true at each milestone threshold', () => {
    MILESTONE_THRESHOLDS.forEach((n) => {
      expect(isMilestone(n)).toBe(true);
    });
  });

  it('returns false one below each threshold', () => {
    MILESTONE_THRESHOLDS.forEach((n) => {
      expect(isMilestone(n - 1)).toBe(false);
    });
  });

  it('returns false one above each threshold', () => {
    MILESTONE_THRESHOLDS.forEach((n) => {
      expect(isMilestone(n + 1)).toBe(false);
    });
  });

  it('returns false for arbitrary non-milestone values', () => {
    [0, 1, 5, 25, 75, 150, 999].forEach((n) => {
      expect(isMilestone(n)).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// shouldAwardFounder — self-checkin exclusion
// ---------------------------------------------------------------------------
describe('shouldAwardFounder', () => {
  it('returns false when founder checks into their own spot', () => {
    expect(shouldAwardFounder('founder_abc', 'founder_abc')).toBe(false);
  });

  it('returns true when a different user checks in', () => {
    expect(shouldAwardFounder('founder_abc', 'visitor_xyz')).toBe(true);
  });

  it('returns false when founderId is null', () => {
    expect(shouldAwardFounder(null, 'visitor_xyz')).toBe(false);
  });

  it('returns false when founderId is undefined', () => {
    expect(shouldAwardFounder(undefined, 'visitor_xyz')).toBe(false);
  });

  it('returns false when founderId is empty string', () => {
    expect(shouldAwardFounder('', 'visitor_xyz')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// computeCheckinPoints — full point map for a check-in event
// ---------------------------------------------------------------------------
describe('computeCheckinPoints', () => {
  const FOUNDER = 'founder_uid';
  const VISITOR = 'visitor_uid';

  it('first visit: visitor gets 10 pts, founder gets 5 founder pts', () => {
    const pts = computeCheckinPoints({
      userId: VISITOR, founderId: FOUNDER,
      prevTotalCheckins: 5, isFirstVisit: true,
    });
    expect(pts[VISITOR]).toBe(EXPLORER_FIRST_VISIT);      // 10
    expect(pts[FOUNDER]).toBe(FOUNDER_CHECKIN);            // 5
  });

  it('repeat visit: visitor gets 2 pts, founder gets 5 founder pts', () => {
    const pts = computeCheckinPoints({
      userId: VISITOR, founderId: FOUNDER,
      prevTotalCheckins: 5, isFirstVisit: false,
    });
    expect(pts[VISITOR]).toBe(EXPLORER_REPEAT_VISIT);     // 2
    expect(pts[FOUNDER]).toBe(FOUNDER_CHECKIN);            // 5
  });

  it('self-checkin: founder gets explorer pts only, no founder pts', () => {
    const pts = computeCheckinPoints({
      userId: FOUNDER, founderId: FOUNDER,
      prevTotalCheckins: 5, isFirstVisit: false,
    });
    expect(pts[FOUNDER]).toBe(EXPLORER_REPEAT_VISIT);     // 2, no FOUNDER_CHECKIN
    expect(Object.keys(pts)).toHaveLength(1);             // only one uid entry
  });

  it('milestone at 10: founder gets FOUNDER_CHECKIN + FOUNDER_MILESTONE', () => {
    const pts = computeCheckinPoints({
      userId: VISITOR, founderId: FOUNDER,
      prevTotalCheckins: 9, isFirstVisit: false,           // 9+1 = 10
    });
    expect(pts[FOUNDER]).toBe(FOUNDER_CHECKIN + FOUNDER_MILESTONE); // 5 + 50 = 55
  });

  it('milestone at 50: founder gets milestone bonus', () => {
    const pts = computeCheckinPoints({
      userId: VISITOR, founderId: FOUNDER,
      prevTotalCheckins: 49, isFirstVisit: false,
    });
    expect(pts[FOUNDER]).toBe(FOUNDER_CHECKIN + FOUNDER_MILESTONE);
  });

  it('milestone at 100: founder gets milestone bonus', () => {
    const pts = computeCheckinPoints({
      userId: VISITOR, founderId: FOUNDER,
      prevTotalCheckins: 99, isFirstVisit: false,
    });
    expect(pts[FOUNDER]).toBe(FOUNDER_CHECKIN + FOUNDER_MILESTONE);
  });

  it('self-checkin at milestone: founder still gets FOUNDER_MILESTONE', () => {
    const pts = computeCheckinPoints({
      userId: FOUNDER, founderId: FOUNDER,
      prevTotalCheckins: 9, isFirstVisit: false,
    });
    // No FOUNDER_CHECKIN (self), but milestone still fires
    expect(pts[FOUNDER]).toBe(EXPLORER_REPEAT_VISIT + FOUNDER_MILESTONE); // 2 + 50 = 52
  });

  it('first ever check-in (prevTotal=0): founder gets EXPLORER_FIRST_SPOT_CHECKIN bonus', () => {
    const pts = computeCheckinPoints({
      userId: VISITOR, founderId: FOUNDER,
      prevTotalCheckins: 0, isFirstVisit: true,
    });
    expect(pts[VISITOR]).toBe(EXPLORER_FIRST_VISIT);                        // 10
    expect(pts[FOUNDER]).toBe(FOUNDER_CHECKIN + EXPLORER_FIRST_SPOT_CHECKIN); // 5 + 20 = 25
  });

  it('no founderId: only acting user receives pts', () => {
    const pts = computeCheckinPoints({
      userId: VISITOR, founderId: null,
      prevTotalCheckins: 9, isFirstVisit: true,
    });
    expect(pts[VISITOR]).toBe(EXPLORER_FIRST_VISIT);
    expect(Object.keys(pts)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// computeStoryPoints
// ---------------------------------------------------------------------------
describe('computeStoryPoints', () => {
  const FOUNDER = 'founder_uid';
  const POSTER  = 'poster_uid';

  it('poster gets EXPLORER_POST_STORY, founder gets FOUNDER_STORY', () => {
    const pts = computeStoryPoints({ userId: POSTER, founderId: FOUNDER });
    expect(pts[POSTER]).toBe(EXPLORER_POST_STORY);  // 5
    expect(pts[FOUNDER]).toBe(FOUNDER_STORY);        // 3
  });

  it('self-post (founder posts at own spot): founder gets only explorer pts', () => {
    const pts = computeStoryPoints({ userId: FOUNDER, founderId: FOUNDER });
    expect(pts[FOUNDER]).toBe(EXPLORER_POST_STORY); // 5, no FOUNDER_STORY
    expect(Object.keys(pts)).toHaveLength(1);
  });
});
