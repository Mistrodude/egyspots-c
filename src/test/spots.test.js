import { describe, it, expect } from 'vitest';
import { SPOTS_SEED, CATEGORIES, filterSpots } from '../data/spots';

describe('filterSpots', () => {
  it('returns all spots for "All"', () => {
    const result = filterSpots(SPOTS_SEED, 'All');
    expect(result).toHaveLength(SPOTS_SEED.length);
  });

  it('filters to cafes only', () => {
    const result = filterSpots(SPOTS_SEED, 'Cafes');
    expect(result.length).toBeGreaterThan(0);
    result.forEach((s) => expect(s.category).toBe('Cafe'));
  });

  it('filters to street food only', () => {
    const result = filterSpots(SPOTS_SEED, 'Street Food');
    expect(result.length).toBeGreaterThan(0);
    result.forEach((s) => expect(s.category).toBe('Street Food'));
  });

  it('filters to shisha spots (by vibe)', () => {
    const result = filterSpots(SPOTS_SEED, 'Shisha');
    result.forEach((s) => expect(s.vibe).toContain('Shisha'));
  });

  it('filters to car meets only', () => {
    const result = filterSpots(SPOTS_SEED, 'Car Meets');
    expect(result.length).toBeGreaterThan(0);
    result.forEach((s) => expect(s.category).toBe('Car Meet'));
  });

  it('filters to parks only', () => {
    const result = filterSpots(SPOTS_SEED, 'Parks');
    expect(result.length).toBeGreaterThan(0);
    result.forEach((s) => expect(s.category).toBe('Park'));
  });

  it('filters to open air only', () => {
    const result = filterSpots(SPOTS_SEED, 'Open Air');
    expect(result.length).toBeGreaterThan(0);
    result.forEach((s) => expect(s.category).toBe('Open Air'));
  });

  it('CATEGORIES array contains expected values', () => {
    expect(CATEGORIES).toContain('All');
    expect(CATEGORIES).toContain('Cafes');
    expect(CATEGORIES).toContain('Street Food');
  });

  it('all seed spots have required fields', () => {
    SPOTS_SEED.forEach((s) => {
      expect(s).toHaveProperty('id');
      expect(s).toHaveProperty('name');
      expect(s).toHaveProperty('lat');
      expect(s).toHaveProperty('lng');
      expect(s).toHaveProperty('crowdPct');
      expect(s.crowdPct).toBeGreaterThanOrEqual(0);
      expect(s.crowdPct).toBeLessThanOrEqual(100);
    });
  });
});
