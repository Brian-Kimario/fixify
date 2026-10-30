import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const refresh = vi.fn();
const cleanups: Array<() => void> = [];

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
vi.mock('react', () => ({
  useRef: <T,>(value: T) => ({ current: value }),
  useEffect: (fn: () => void | (() => void)) => {
    const cleanup = fn();
    if (cleanup) cleanups.push(cleanup);
  },
}));

import { POLL_MS, useRouteRefreshPoll } from './useRouteRefreshPoll';

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
}

function mountAll() {
  while (cleanups.length) cleanups.pop()?.();
}

let clock = Date.parse('2026-01-01T00:00:00Z');

describe('useRouteRefreshPoll', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // The module remembers its last refresh time, so each test starts well after the previous one.
    clock += 3_600_000;
    vi.setSystemTime(clock);
    refresh.mockClear();
    setVisibility('visible');
  });
  afterEach(() => {
    mountAll();
    vi.useRealTimers();
  });

  it('refreshes once per interval even with several subscribers', () => {
    useRouteRefreshPoll(); // the bell
    useRouteRefreshPoll(); // a thread
    vi.advanceTimersByTime(POLL_MS);
    expect(refresh).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(POLL_MS);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('does not poll while the tab is hidden', () => {
    useRouteRefreshPoll();
    setVisibility('hidden');
    vi.advanceTimersByTime(POLL_MS * 3);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('catches up when the tab becomes visible, but not more often than the minimum gap', () => {
    useRouteRefreshPoll();
    document.dispatchEvent(new Event('visibilitychange'));
    expect(refresh).toHaveBeenCalledTimes(1);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(refresh).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(6_000);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('stops the timer once the last subscriber unmounts', () => {
    useRouteRefreshPoll();
    useRouteRefreshPoll();
    cleanups.shift()?.();
    vi.advanceTimersByTime(POLL_MS);
    expect(refresh).toHaveBeenCalledTimes(1);
    mountAll();
    refresh.mockClear();
    vi.advanceTimersByTime(POLL_MS * 2);
    expect(refresh).not.toHaveBeenCalled();
  });
});
