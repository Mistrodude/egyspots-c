import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useState, useCallback } from 'react';

// Isolated test of checkIn toggle logic (without Firebase)
function useCheckInLogic(initialId = null) {
  const [checkedInId, setCheckedInId] = useState(initialId);

  const checkIn = useCallback((spotId) => {
    const isLeaving = checkedInId === spotId;
    setCheckedInId(isLeaving ? null : spotId);
    return isLeaving ? null : spotId;
  }, [checkedInId]);

  return { checkedInId, checkIn };
}

describe('checkIn toggle logic', () => {
  it('starts with no check-in', () => {
    const { result } = renderHook(() => useCheckInLogic());
    expect(result.current.checkedInId).toBeNull();
  });

  it('checks in to a spot', () => {
    const { result } = renderHook(() => useCheckInLogic());
    act(() => { result.current.checkIn('kazoku'); });
    expect(result.current.checkedInId).toBe('kazoku');
  });

  it('leaves a spot when checking in to same spot', () => {
    const { result } = renderHook(() => useCheckInLogic('kazoku'));
    act(() => { result.current.checkIn('kazoku'); });
    expect(result.current.checkedInId).toBeNull();
  });

  it('switches to new spot when already checked in elsewhere', () => {
    const { result } = renderHook(() => useCheckInLogic('kazoku'));
    act(() => { result.current.checkIn('elfishawy'); });
    expect(result.current.checkedInId).toBe('elfishawy');
  });

  it('multiple check-in/out cycle works correctly', () => {
    const { result } = renderHook(() => useCheckInLogic());
    act(() => { result.current.checkIn('kazoku'); });
    expect(result.current.checkedInId).toBe('kazoku');
    act(() => { result.current.checkIn('kazoku'); });
    expect(result.current.checkedInId).toBeNull();
    act(() => { result.current.checkIn('zoobastreet'); });
    expect(result.current.checkedInId).toBe('zoobastreet');
  });
});

// Test SPOTS_SEED data integrity
import { SPOTS_SEED } from '../data/spots';

describe('SPOTS_SEED integrity', () => {
  it('has at least 8 spots', () => {
    expect(SPOTS_SEED.length).toBeGreaterThanOrEqual(8);
  });

  it('all spots have valid coordinates', () => {
    SPOTS_SEED.forEach((s) => {
      expect(s.lat).toBeGreaterThan(29);
      expect(s.lat).toBeLessThan(31);
      expect(s.lng).toBeGreaterThan(30);
      expect(s.lng).toBeLessThan(33);
    });
  });

  it('all spot IDs are unique', () => {
    const ids = SPOTS_SEED.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all spots have a valid crowd level', () => {
    const valid = ['Chill', 'Lively', 'Packed'];
    SPOTS_SEED.forEach((s) => {
      expect(valid).toContain(s.crowd);
    });
  });
});
