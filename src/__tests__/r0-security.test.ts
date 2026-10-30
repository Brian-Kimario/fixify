import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '../..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');

describe('R0 security regressions (static)', () => {
  it.each([
    'src/app/auth/debug',
    'src/app/auth/test-login',
    'src/app/auth/debug-check.tsx',
    'src/app/api/auth/test',
  ])('debug/test-login surface %s is gone', (p) => {
    expect(fs.existsSync(path.join(root, p))).toBe(false);
  });

  it('no shared test password is hard-coded in source, scripts or tests', () => {
    const dirs = ['src', 'scripts', 'tests'];
    const hits: string[] = [];
    const walk = (d: string) => {
      for (const e of fs.readdirSync(path.join(root, d), { withFileTypes: true })) {
        const rel = path.join(d, e.name);
        if (e.isDirectory()) walk(rel);
        else if (/\.(ts|tsx|js|mjs)$/.test(e.name) && rel !== path.join('src', '__tests__', 'r0-security.test.ts')) {
          if (/Test@\d{6}/.test(read(rel))) hits.push(rel);
        }
      }
    };
    dirs.forEach(walk);
    expect(hits).toEqual([]);
  });

  it('sign-out audit rows are written with the service-role client, not the user client', () => {
    const src = read('src/lib/auth/signout.ts');
    const fn = src.slice(src.indexOf('export async function logSignOutEvent'));
    expect(fn).toContain('createAdminClient');
    expect(fn.slice(0, fn.indexOf('catch'))).not.toContain('createServerSupabase');
  });

  it('migration closes audit_logs writes and anon trigger-function grants', () => {
    const sql = read('supabase/migrations/20261030_102_r0_security_hardening.sql');
    expect(sql).toMatch(/DROP POLICY IF EXISTS audit_logs_insert_own/);
    expect(sql).toMatch(/REVOKE ALL ON TABLE public\.audit_logs FROM PUBLIC, anon, authenticated/);
    expect(sql).toMatch(/BEFORE UPDATE OR DELETE ON public\.audit_logs/);
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.on_job_state_transition\(\)/);
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.sync_profile_email\(\)/);
  });
});
