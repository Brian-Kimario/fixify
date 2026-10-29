@AGENTS.md

# Feasy — project guide

Home-services marketplace (India, UPI/Razorpay). Customers book repairs, professionals
quote and complete jobs, admins verify professionals and monitor operations.

## Stack
Next.js 16 (App Router) · React 19 · TypeScript · Supabase (Postgres, Auth, RLS, @supabase/ssr)
· Tailwind 4 · Razorpay · Vitest · Playwright · pnpm

## Commands
- `pnpm dev` / `pnpm build` / `pnpm lint`
- `pnpm test` (Vitest) · `pnpm test:e2e` (Playwright)
- Type-check explicitly: `pnpm tsc --noEmit` (build ignores TS errors unless CI is set)

## Read before writing
Next 16 differs from older versions. Check `node_modules/next/dist/docs/` first.
Notably, `middleware.ts` is deprecated in favour of `proxy.ts`.

## Layout
- `src/app/{customer,professional,admin,support,auth,api}` — role-scoped routes; each has `layout.tsx` guard
- `src/lib/services/*` — data-access layer; add queries here, not inline in pages
- `src/lib/supabase/{server,client,admin}.ts` — pick the right client (see below)
- `src/lib/payments/*` — Razorpay order creation (`createUPIIntentPayment`); webhook in `api/webhooks/razorpay`
- `src/components/ui` — shared primitives, import from `@/components/ui`
- `supabase/migrations/` — schema, RLS, `transition_job_state()`
- `docs/` — specs; verify against code, some are stale

## Rules
1. Default to Server Components. Add `'use client'` only for state, effects or browser APIs.
2. Use `createClient()` from `lib/supabase/server` for user-scoped data (RLS applies).
   Use `createAdminClient()` only in admin actions and webhooks, and re-check the caller's role first.
3. Job state changes go through `supabase.rpc('transition_job_state', ...)`. Never `.update({ current_state })`.
4. Never trust client input for ownership, amounts or roles. Derive from the session and DB.
5. Validate every server action and API input with Zod (add schemas under `src/validators`).
6. Never return `{ success: true }` from a catch block. Return a typed error result.
7. Do not add `@ts-ignore` or `any`. Use `Database` types from `lib/supabase/database.types.ts`.
8. Use `next/link`, not `<a>`, for internal navigation. Reuse `@/components/ui` before creating a component.
9. Colors come from the design tokens in `tailwind.config.ts`, not new hex literals.
10. New tables need RLS policies in the same migration. Name migrations `YYYYMMDD_NNN_description.sql`.
11. No secrets in the repo. `.env.local` is ignored; update `.env.example` for new variables.
12. Debug or test endpoints must be gated by `NODE_ENV !== 'production'`.

## Known debt (do not copy these patterns)
In-memory rate limiter · `strict: false` · permissive CSP · 300 `console.*` calls · empty validators.
