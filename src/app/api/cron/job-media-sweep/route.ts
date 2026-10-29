import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

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
 * Removes job-media uploads that were never attached to a job (no job_media row) and are more
 * than a day old. Rows in storage.objects cannot be deleted with SQL, so this goes through the
 * Storage API. Call it with `Authorization: Bearer $CRON_SECRET`; each call handles up to 1000.
 */
export async function POST(request: NextRequest) {
  if (!authorised(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = await createAdminClient();
  const { data, error } = await admin.rpc('list_orphan_job_media');
  // The admin client is untyped, so check the shape before using it.
  const parsed = z.array(z.string()).safeParse(data);
  if (error || !parsed.success) {
    console.error('list_orphan_job_media error:', error?.message ?? 'unexpected result shape');
    return NextResponse.json({ error: 'Sweep failed' }, { status: 500 });
  }
  const paths = parsed.data;
  if (paths.length === 0) {
    return NextResponse.json({ ok: true, removed: 0 });
  }

  const { data: removed, error: removeError } = await admin.storage.from('job-media').remove(paths);
  if (removeError) {
    console.error('job-media sweep remove error:', removeError.message);
    return NextResponse.json({ error: 'Sweep failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, removed: removed?.length ?? 0 });
}
