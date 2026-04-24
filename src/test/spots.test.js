import { describe, it, expect } from 'vitest';
import { SPOTS_SEED, CATEGORIES, filterSpots, SPOT_TAGS } from '../data/spots';

describe('spots data', () => {
  it('has correct categories including All', () => {
    expect(CATEGORIES).toEqual(['All', 'Street Cart', 'Car Meet', 'Hangout', 'Pop-Up', 'Open Air']);
  });

  it('all seed spots use new category values', () => {
    const valid = ['street_cart', 'car_meet', 'hangout', 'pop_up', 'open_air'];
    SPOTS_SEED.forEach((s) => expect(valid).toContain(s.category));
  });

  it('all seed spots have a founder', () => {
    SPOTS_SEED.forEach((s) => {
      expect(s.founderId).toBeTruthy();
      expect(s.founderName).toBeTruthy();
    });
  });

  it('all seed spots have valid Cairo coordinates', () => {
    SPOTS_SEED.forEach((s) => {
      expect(s.lat).toBeGreaterThan(29);
      expect(s.lat).toBeLessThan(31);
      expect(s.lng).toBeGreaterThan(30);
      expect(s.lng).toBeLessThan(32);
    });
  });

  it('all seed spots have required fields', () => {
    SPOTS_SEED.forEach((s) => {
      expect(s).toHaveProperty('id');
      expect(s).toHaveProperty('name');
      expect(s).toHaveProperty('lat');
      expect(s).toHaveProperty('lng');
      expect(s).toHaveProperty('crowdPct');
      expect(s).toHaveProperty('crowd');
      expect(s.crowdPct).toBeGreaterThanOrEqual(0);
      expect(s.crowdPct).toBeLessThanOrEqual(100);
    });
  });

  it('tags are from allowed list', () => {
    SPOTS_SEED.forEach((s) => {
      s.tags.forEach((tag) => expect(SPOT_TAGS).toContain(tag));
    });
  });

  it('filterSpots returns all on "All"', () => {
    expect(filterSpots(SPOTS_SEED, 'All')).toEqual(SPOTS_SEED);
  });

  it('filterSpots filters by Hangout', () => {
    const result = filterSpots(SPOTS_SEED, 'Hangout');
    expect(result.length).toBeGreaterThan(0);
    result.forEach((s) => expect(s.category).toBe('hangout'));
  });

  it('filterSpots filters by Car Meet', () => {
    const result = filterSpots(SPOTS_SEED, 'Car Meet');
    expect(result.length).toBeGreaterThan(0);
    result.forEach((s) => expect(s.category).toBe('car_meet'));
  });

  it('no seed spot uses removed categories', () => {
    const removed = ['Cafe', 'Traditional', 'coffee', 'food', 'Coffee', 'Food'];
    SPOTS_SEED.forEach((s) => expect(removed).not.toContain(s.category));
  });
});
