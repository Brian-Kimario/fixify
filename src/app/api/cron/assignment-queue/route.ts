import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
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
 * Reassigns offers professionals did not answer in time and retries bookings that
 * had no eligible professional. Call it every few minutes with
 * `Authorization: Bearer $CRON_SECRET`.
 */
export async function POST(request: NextRequest) {
  if (!authorised(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = await createAdminClient();
  const { data, error } = await admin.rpc('process_assignment_queue');

  if (error) {
    console.error('process_assignment_queue error:', error.message);
    return NextResponse.json({ error: 'Queue processing failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, result: data });
}
