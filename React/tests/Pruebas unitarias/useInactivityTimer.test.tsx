import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useInactivityTimer } from '../../src/hooks/useInactivityTimer';

describe('useInactivityTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should call onTimeout after specified time of inactivity', () => {
    const onTimeout = vi.fn();
    renderHook(() => useInactivityTimer(1000, onTimeout));
    
    expect(onTimeout).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(1000);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('should not call onTimeout if active and user interacts', () => {
    const onTimeout = vi.fn();
    renderHook(() => useInactivityTimer(1000, onTimeout));
    
    vi.advanceTimersByTime(500);
    window.dispatchEvent(new Event('mousemove'));
    
    vi.advanceTimersByTime(600);
    expect(onTimeout).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(400);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('should not start timer if isActive is false', () => {
    const onTimeout = vi.fn();
    renderHook(() => useInactivityTimer(1000, onTimeout, false));
    
    vi.advanceTimersByTime(2000);
    expect(onTimeout).not.toHaveBeenCalled();
  });
});
