/**
 * R0 live authorization tests. Run against the shared test project with synthetic accounts:
 *   E2E_TEST_PASSWORD=... pnpm test:live tests/security/r0-live.test.ts
 * Skipped when credentials are absent. Writes nothing (every write is expected to be rejected).
 */
import { describe, it, expect, beforeAll } from 'vitest';

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const PW = process.env.E2E_TEST_PASSWORD ?? '';
const enabled = Boolean(URL_ && KEY && PW);

const accounts = {
  customerA: 'customer.a@fixify.dev',
  customerB: 'customer.b@fixify.dev',
  proA: 'pro.a@fixify.dev',
  proB: 'pro.b@fixify.dev',
  admin: 'admin.test@fixify.dev',
} as const;

type Session = { token: string; id: string };
const sessions: Record<string, Session> = {};

async function login(email: string): Promise<Session> {
  const r = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: PW }),
  });
  const j = await r.json();
  return { token: j.access_token, id: j.user.id };
}

const rest = (token: string | null, path: string, init: RequestInit = {}) =>
  fetch(`${URL_}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: KEY,
      authorization: `Bearer ${token ?? KEY}`,
      'content-type': 'application/json',
      ...(init.headers as Record<string, string>),
    },
  });

describe.skipIf(!enabled)('R0 live: audit_logs and function grants', () => {
  beforeAll(async () => {
    for (const [k, email] of Object.entries(accounts)) sessions[k] = await login(email);
  });

  it.each(Object.keys(accounts))('%s cannot insert an audit row for themselves', async (k) => {
    const s = sessions[k];
    const r = await rest(s.token, 'audit_logs', {
      method: 'POST',
      body: JSON.stringify({ user_id: s.id, action: 'R0_TEST_FORGED' }),
    });
    expect([401, 403]).toContain(r.status);
  });

  it('anonymous caller cannot insert an audit row', async () => {
    const r = await rest(null, 'audit_logs', {
      method: 'POST',
      body: JSON.stringify({ user_id: sessions.customerA.id, action: 'R0_TEST_FORGED' }),
    });
    expect([401, 403]).toContain(r.status);
  });

  it.each(Object.keys(accounts))('%s cannot update or delete audit rows', async (k) => {
    const s = sessions[k];
    const upd = await rest(s.token, `audit_logs?user_id=eq.${s.id}`, {
      method: 'PATCH',
      headers: { prefer: 'return=representation' },
      body: JSON.stringify({ action: 'R0_TEST_TAMPER' }),
    });
    const del = await rest(s.token, `audit_logs?user_id=eq.${s.id}`, {
      method: 'DELETE',
      headers: { prefer: 'return=representation' },
    });
    for (const r of [upd, del]) {
      const body = r.ok ? await r.json() : [];
      expect(r.ok ? body.length : 0).toBe(0);
    }
  });

  it('a user can still read only their own audit rows', async () => {
    const s = sessions.customerB;
    const r = await rest(s.token, 'audit_logs?select=user_id');
    expect(r.status).toBe(200);
    const rows: { user_id: string }[] = await r.json();
    expect(rows.every((x) => x.user_id === s.id)).toBe(true);
  });

  it('anonymous caller cannot read audit rows', async () => {
    const r = await rest(null, 'audit_logs?select=id');
    const rows = r.ok ? await r.json() : [];
    expect(rows.length).toBe(0);
  });

  it.each(['on_job_state_transition', 'sync_profile_email'])(
    'internal trigger function %s is not callable by anon or authenticated',
    async (fn) => {
      for (const token of [null, sessions.customerA.token]) {
        const r = await rest(token, `rpc/${fn}`, { method: 'POST', body: '{}' });
        expect(r.status).not.toBe(200);
        expect([401, 403, 404]).toContain(r.status);
      }
    },
  );

  it('internal helper functions are not callable by authenticated users', async () => {
    const r = await rest(sessions.customerA.token, 'rpc/_notify', { method: 'POST', body: '{}' });
    expect([401, 403, 404]).toContain(r.status);
  });
});
