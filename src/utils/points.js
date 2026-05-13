// Point values — single source of truth for both runtime and tests
export const EXPLORER_FIRST_VISIT        = 10;
export const EXPLORER_REPEAT_VISIT       = 2;
export const EXPLORER_POST_STORY         = 5;
export const EXPLORER_FIRST_SPOT_CHECKIN = 20; // awarded to founderId when spot gets its first-ever check-in
export const FOUNDER_CHECKIN             = 5;
export const FOUNDER_STORY               = 3;
export const FOUNDER_MILESTONE           = 50;
export const MILESTONE_THRESHOLDS        = [10, 50, 100];

/** Explorer points for checking in: +10 first visit, +2 repeat. */
export function explorerCheckinPts(isFirstVisit) {
  return isFirstVisit ? EXPLORER_FIRST_VISIT : EXPLORER_REPEAT_VISIT;
}

/** True when newTotalCheckins is exactly 10, 50, or 100. */
export function isMilestone(newTotalCheckins) {
  return MILESTONE_THRESHOLDS.includes(newTotalCheckins);
}

/**
 * True when the acting user is NOT the spot founder.
 * Founder points must never be self-awarded.
 */
export function shouldAwardFounder(founderId, actingUserId) {
  return !!founderId && founderId !== actingUserId;
}

/**
 * Build a { uid → pointsDelta } map for a check-in event.
 * Caller passes current spot.totalCheckins (before this check-in).
 */
export function computeCheckinPoints({ userId, founderId, prevTotalCheckins, isFirstVisit }) {
  const pts = {};
  const add = (uid, n) => { pts[uid] = (pts[uid] || 0) + n; };
  const newTotal = prevTotalCheckins + 1;

  // Explorer pts always go to the acting user
  add(userId, explorerCheckinPts(isFirstVisit));

  if (founderId) {
    // Founder check-in pts — only when NOT self
    if (shouldAwardFounder(founderId, userId)) {
      add(founderId, FOUNDER_CHECKIN);
    }
    // Milestone bonus to founder regardless of who triggers it
    if (isMilestone(newTotal)) {
      add(founderId, FOUNDER_MILESTONE);
    }
    // Spot's first-ever check-in: reward the founder for creating a popular spot
    if (newTotal === 1) {
      add(founderId, EXPLORER_FIRST_SPOT_CHECKIN);
    }
  }

  return pts;
}

/**
 * Build a { uid → pointsDelta } map for a story-post event.
 */
export function computeStoryPoints({ userId, founderId }) {
  const pts = {};
  const add = (uid, n) => { pts[uid] = (pts[uid] || 0) + n; };
  add(userId, EXPLORER_POST_STORY);
  if (founderId && shouldAwardFounder(founderId, userId)) {
    add(founderId, FOUNDER_STORY);
  }
  return pts;
}
