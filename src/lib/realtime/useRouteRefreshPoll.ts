'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/** How often an open, visible tab re-fetches the route. */
export const POLL_MS = 15_000;
/** Visibility/online catch-up refreshes closer together than this are dropped. */
const MIN_GAP_MS = 5_000;

type Refresh = () => void;

// One timer per tab, however many components ask for polling (the bell is on every page and the
// thread is on case pages): the route is refetched once per tick, not once per subscriber.
const subscribers = new Set<Refresh>();
let timer: ReturnType<typeof setInterval> | null = null;
let lastRefreshAt = 0;

function canRefresh(): boolean {
  return document.visibilityState === 'visible' && navigator.onLine !== false;
}

function tick(force: boolean) {
  if (!canRefresh()) return;
  const now = Date.now();
  if (!force && now - lastRefreshAt < MIN_GAP_MS) return;
  lastRefreshAt = now;
  // Every subscriber shares the same router, so one call refreshes the route for all of them.
  const first = subscribers.values().next().value;
  if (first) first();
}

const onVisibleOrOnline = () => tick(false);

function start() {
  timer = setInterval(() => tick(true), POLL_MS);
  document.addEventListener('visibilitychange', onVisibleOrOnline);
  window.addEventListener('online', onVisibleOrOnline);
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
  document.removeEventListener('visibilitychange', onVisibleOrOnline);
  window.removeEventListener('online', onVisibleOrOnline);
}

/**
 * Keeps the current route fresh while it is open: refetches it every 15 seconds, but only while the
 * tab is visible and online, and once more when the tab becomes visible or the connection returns.
 *
 * Auth cookies are httpOnly by design, so browser JavaScript has no session and cannot authenticate
 * to Supabase Realtime. Polling is the deliberate MVP substitute; the refetch is the ordinary server
 * render under the user's own session and RLS, nothing new is exposed to the browser. A message
 * can therefore take up to about 15 seconds to appear, and the UI must not promise instant delivery.
 * Live push needs a separately reviewed auth bridge; do not add a subscription without one.
 */
export function useRouteRefreshPoll() {
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    const refresh: Refresh = () => routerRef.current.refresh();
    subscribers.add(refresh);
    if (subscribers.size === 1) start();
    return () => {
      subscribers.delete(refresh);
      if (subscribers.size === 0) stop();
    };
  }, []);
}
