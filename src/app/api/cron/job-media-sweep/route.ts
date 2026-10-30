import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/** list_orphan_job_media returns at most this many paths per call. */
const BATCH_LIMIT = 1000;

function authorised(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get('authorization') ?? '';
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Removes job-media uploads that were never attached to a job and are more than a day old, up
 * to 1000 per run. Called every 6 hours by pg_cron (20261030_016) with the shared CRON_SECRET.
 *
 * Safe to repeat or overlap: removing a path that is already gone is a no-op, attached files are
 * never listed, and add_job_media refuses uploads over an hour old, so nothing listed here can be
 * attached while it is being removed. Logs carry counts and error messages, never file paths.
 */
export async function POST(request: NextRequest) {
  if (!authorised(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = await createAdminClient();
  const { data, error } = await admin.rpc('list_orphan_job_media');
  const parsed = z.array(z.string()).safeParse(data);
  if (error || !parsed.success) {
    console.error('job-media sweep list error:', error?.message ?? 'unexpected result shape');
    return NextResponse.json({ error: 'Sweep failed' }, { status: 500 });
  }

  const paths = parsed.data;
  if (paths.length === 0) return NextResponse.json({ ok: true, found: 0, removed: 0, more: false });

  const { data: removed, error: removeError } = await admin.storage.from('job-media').remove(paths);
  if (removeError) {
    // Nothing is lost: whatever was not removed is listed again on the next run.
    console.error(`job-media sweep remove error (${paths.length} listed):`, removeError.message);
    return NextResponse.json({ error: 'Sweep failed', found: paths.length }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    found: paths.length,
    removed: removed?.length ?? 0,
    more: paths.length === BATCH_LIMIT,
  });
}
