'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/** Refetch interval used when Realtime cannot be authenticated. */
const POLL_MS = 15_000;

interface Options {
  /** Unique per subscription on the page. */
  channel: string;
  table: 'job_messages' | 'notifications';
  /** Postgres filter such as `job_id=eq.<uuid>`. Narrows traffic; access is still decided by RLS. */
  filter?: string;
}

/**
 * Re-renders the current route when a row changes in a table the signed-in user can read.
 *
 * Realtime is only a nudge: the payload is ignored and the server component refetches, so what
 * is shown always comes from the database under the user's own RLS. The subscription is made
 * with the user's session, so it can only ever deliver rows that user may SELECT. If Realtime is
 * unavailable (including when the browser has no readable session, as with httpOnly auth cookies, where
 * it polls instead) nothing breaks: the page still refreshes on navigation, after the user's own
 * actions, and when the tab becomes visible again. On every (re)connect and on tab focus the
 * route is refreshed once, so anything missed while disconnected is reconciled from the database.
 */
export function useRealtimeRefresh({ channel, table, filter }: Options) {
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;
    const refresh = () => {
      if (timer) return;
      // Coalesce bursts (a send produces a message and a notification).
      timer = setTimeout(() => {
        timer = null;
        if (!disposed) routerRef.current.refresh();
      }, 300);
    };

    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      return;
    }

    let subscription: ReturnType<typeof supabase.channel> | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    void (async () => {
      // Subscribe as the signed-in user, never with the anonymous key: RLS then decides every row.
      const { data } = await supabase.auth.getSession();
      if (disposed) return;
      if (!data.session) {
        // Auth cookies are httpOnly, so the browser has no session to subscribe with (and tokens are
        // deliberately not handed to client script). Fall back to refetching while the tab is visible.
        poll = setInterval(() => {
          if (document.visibilityState === 'visible') refresh();
        }, POLL_MS);
        return;
      }
      await supabase.realtime.setAuth(data.session.access_token);
      if (disposed) return;
      subscription = supabase
        .channel(channel)
        .on('postgres_changes', { event: '*', schema: 'public', table, ...(filter ? { filter } : {}) }, refresh)
        .subscribe((status) => {
          // Each SUBSCRIBED (first connect or reconnect) reconciles with the database.
          if (status === 'SUBSCRIBED') refresh();
        });
    })();

    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      if (poll) clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisible);
      if (subscription) void supabase.removeChannel(subscription);
    };
  }, [channel, table, filter]);
}
