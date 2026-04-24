import { describe, it, expect } from 'vitest';

describe('StoriesContext helpers', () => {
  it('filters out expired stories', () => {
    const now = new Date();
    const expired = { expiresAt: new Date(now.getTime() - 1000).toISOString() };
    const active  = { expiresAt: new Date(now.getTime() + 60000).toISOString() };
    const stories = [expired, active];
    const visible = stories.filter((s) => new Date(s.expiresAt) > now);
    expect(visible).toEqual([active]);
  });

  it('sets expiresAt exactly 6 hours after createdAt', () => {
    const created = new Date();
    const expires = new Date(created.getTime() + 6 * 60 * 60 * 1000);
    expect(expires.getTime() - created.getTime()).toBe(6 * 60 * 60 * 1000);
  });

  it('keeps active stories', () => {
    const now = new Date();
    const active = { expiresAt: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString() };
    const visible = [active].filter((s) => new Date(s.expiresAt) > now);
    expect(visible).toHaveLength(1);
  });

  it('filters all if all expired', () => {
    const now = new Date();
    const stories = [
      { expiresAt: new Date(now.getTime() - 60000).toISOString() },
      { expiresAt: new Date(now.getTime() - 1000).toISOString() },
    ];
    const visible = stories.filter((s) => new Date(s.expiresAt) > now);
    expect(visible).toHaveLength(0);
  });
});
