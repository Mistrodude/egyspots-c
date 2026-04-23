import { describe, it, expect } from 'vitest';
import { DARK, LIGHT } from '../theme';

const REQUIRED_KEYS = [
  'bg', 'surface', 'surface2', 'border', 'text', 'muted',
  'accent', 'accentText', 'accentBg', 'navBg', 'mapBg',
  'pill', 'pillText', 'shadow', 'shadow2', 'overlay', 'crowd',
];

const CROWD_LEVELS = ['Chill', 'Lively', 'Packed'];

describe('Theme objects', () => {
  it('DARK has all required keys', () => {
    REQUIRED_KEYS.forEach((key) => {
      expect(DARK, `DARK missing key: ${key}`).toHaveProperty(key);
    });
  });

  it('LIGHT has all required keys', () => {
    REQUIRED_KEYS.forEach((key) => {
      expect(LIGHT, `LIGHT missing key: ${key}`).toHaveProperty(key);
    });
  });

  it('DARK crowd has all levels', () => {
    CROWD_LEVELS.forEach((level) => {
      expect(DARK.crowd).toHaveProperty(level);
      expect(typeof DARK.crowd[level]).toBe('string');
    });
  });

  it('LIGHT crowd has all levels', () => {
    CROWD_LEVELS.forEach((level) => {
      expect(LIGHT.crowd).toHaveProperty(level);
      expect(typeof LIGHT.crowd[level]).toBe('string');
    });
  });

  it('DARK and LIGHT accent colors differ', () => {
    expect(DARK.accent).not.toBe(LIGHT.accent);
  });

  it('DARK bg is darker than LIGHT bg', () => {
    expect(DARK.bg.toLowerCase()).toContain('0');
    expect(LIGHT.bg).not.toBe(DARK.bg);
  });

  it('all color values are strings', () => {
    ['bg', 'surface', 'accent', 'text', 'muted', 'border'].forEach((key) => {
      expect(typeof DARK[key]).toBe('string');
      expect(typeof LIGHT[key]).toBe('string');
    });
  });
});
