# Fixify Full-System Audit Playbook (One-Man Army Edition)

This playbook gives you an automated, high-precision method to perform a complete **Logic, UI/UX, and Engineering Audit** of your deployed Fixify application using **ChatGPT (with Vercel & Supabase MCP)** combined with our custom **Fixify Playwright Crawler**.

---

## 🎯 The Architecture: Why Generic Prompts Fail & What Works

A generic crawler visiting `['/dashboard', '/settings']` fails on Fixify because:
1. **Fixify has 3 distinct RBAC personas**: Customer (`/customer`), Professional (`/professional`), and Admin (`/admin`), guarded by Next.js `middleware.ts`.
2. **State Machine Integrity**: Fixify is not a simple CRUD app; it uses `transition_job_state()` in PostgreSQL for request intake → inspection → quote → completion.
3. **Design System Specifics**: Fixify uses a light-first porcelain/paper/teal design system (`#F7F4EC`, `#FFFEFA`, `#176B5B`), not standard dark-mode templates.

By combining **Live Vercel/Supabase telemetry (via MCP)** with **Automated Multi-Role Visual & DOM Captures**, ChatGPT can deliver a **single, unified, phased improvement backlog (`SYSTEM_AUDIT_README.md`)** that you can execute feature by feature.

---

## 🛠️ Step 1: Capture Your Live Deployment Assets (2 Minutes)

We have created an automated crawler script pre-configured with all 21 canonical Fixify routes: [`scripts/audit-crawler.mjs`](../scripts/audit-crawler.mjs).

Run it against your deployed Vercel site:

```bash
# Against your production/preview Vercel URL:
TARGET_URL="https://fixify.vercel.app" pnpm audit:crawl

# Or against your local staging build:
TARGET_URL="http://localhost:3000" pnpm audit:crawl
```

### What this does automatically:
1. Launches Chromium with high-DPI Retina resolution (1440×900 @ 2x).
2. Audits all **Public & Auth routes** (`/`, `/help`, `/support`, `/auth/login`, `/auth/register`, `/auth/register/professional`).
3. Pauses for you to log into **Customer**, **Professional**, and **Admin** workspaces.
4. Generates:
   - `audit-results/screenshots/*.png` (Full-page high-resolution captures).
   - `audit-results/dom/*_dom.txt` (Clean, sanitized semantic DOM structures without script bloat).
   - `audit-results/AUDIT_MANIFEST.json` (Console errors, 4xx/5xx network failures, load times).
   - `audit-results/CHATGPT_AUDIT_INPUT.md` (Consolidated single-file markdown payload ready for ChatGPT).

---

## 🔌 Step 2: Connect MCP Servers to ChatGPT

In ChatGPT (Team, Plus, or Developer settings):

### 1. Connect Vercel MCP
- Use the official [Vercel MCP](https://vercel.com/changelog/chatgpt-is-now-supported-on-vercel-mcp).
- Authorize your Vercel account and select the `fixify` project.
- *Visibility provided:* Real build logs, Edge runtime latency, serverless cold starts, deployment environment variables.

### 2. Connect Supabase MCP
- Use your existing project reference URL:
  ```
  https://mcp.supabase.com/mcp?project_ref=azmajqztvcuwajaaldqm&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching
  ```
- *Visibility provided:* Schema validation, RLS policy audit, and SQL state machine checks.

---

## 📋 Step 3: The Master Audit Prompt for ChatGPT / Codex

Upload `audit-results/CHATGPT_AUDIT_INPUT.md` and select key screenshots from `audit-results/screenshots/` (e.g. `01_homepage.png`, `10_customer_dashboard.png`, `20_pro_today_workspace.png`, `30_admin_operations.png`).

Paste this prompt into ChatGPT:

```markdown
You are a Principal Full-Stack Engineer, Lead Product Designer, and QA Architect. 
I am a solo founder ("one-man army") deploying Fixify: an on-demand property maintenance platform built with:
- Next.js 16.3 (App Router with Turbopack) & React 19
- Supabase (PostgreSQL with RLS, state machines, cookie-based SSR auth)
- Tailwind CSS 4 with a bespoke design system (Porcelain #F7F4EC, Paper #FFFEFA, Fixify Teal #176B5B)
- Razorpay payments & transactional job workflows.

I have provided:
1. Live build logs and runtime stats via [Vercel MCP].
2. Live database schema and RLS policies via [Supabase MCP].
3. The attached `CHATGPT_AUDIT_INPUT.md` containing sanitized DOM trees, route HTTP statuses, and console/network errors.
4. Attached high-resolution full-page screenshots of our core routes.

YOUR TASK:
Perform a comprehensive system audit covering Logic, UI/UX, and Engineering. Generate a SINGLE exhaustive, implementation-ready Markdown document named `SYSTEM_AUDIT_README.md` organized in the exact structure below:

---

# SYSTEM_AUDIT_README.md Structure:

## 1. Executive Summary & Production Readiness Score
- Overall Readiness Score (0-100) across Design, Logic, and Reliability.
- Top 3 show-stopping blockers that must be resolved before general traffic.

## 2. UI & Design System Audit
- Brand consistency against our Porcelain/Paper/Teal palette (check for rogue pure blacks, off-brand grays, or improper contrast).
- Layout shifts, flex/grid alignment defects, and responsive breakpoint vulnerabilities (Mobile 390px vs Desktop 1440px).
- Typography hierarchy & microcopy clarity (check for developer-centric wording vs human customer language).
- Visual feedback states (missing loading spinners, skeleton states, active hover/pressed styles).

## 3. Workflow & Business Logic Audit
- Customer Problem Intake Flow: Does the problem description → category match → booking schedule retain integrity?
- Professional Field Experience: Inspection notes → quote drafting → customer approval → completion evidence.
- State Machine Integrity: Audit `transition_job_state()` calls and verify whether UI is currently relying on mock demo data instead of live Supabase tables.
- Authentication & RBAC: Middleware redirect behavior, session expiry handling, and sign-out safety.

## 4. Engineering, Performance & Security Audit
- Next.js 16 / React 19 Patterns: Identify redundant client components (`'use client'`), unoptimized image loading, or memory leaks in animation libraries (GSAP / Anime.js).
- Supabase RLS & API Safety: Potential data leakage between customers and professionals, missing RLS policies, or unvalidated server action inputs.
- Error Boundaries & Resilience: Missing 404/500 handlers, unhandled promise rejections, and fallback states.

## 5. The One-Man Army Priority Matrix (Phased Roadmap)
Break every single finding into a prioritized task with estimated fix time:
- **Phase 1: Immediate Quick Wins (< 4 hours total)**
  * Visual polish, broken links, missing image attributes, quick CSS adjustments.
- **Phase 2: Core UX & State Binding (1 - 2 days)**
  * Connecting mock UI cards to live Supabase actions, fixing form validations, standardizing error toasts.
- **Phase 3: Deep Logic & Production Hardening (3 - 5 days)**
  * Payment webhooks (Razorpay), idempotent state machine transitions, edge caching, and strict RLS locking.

Be extremely concrete: reference actual component names, CSS classes, and SQL tables. No generic fluff.
```

---

## 🚀 Step 4: Resolving Findings in Rapid Sprints

Once ChatGPT generates your `SYSTEM_AUDIT_README.md`:
1. Save it to your repository as [`SYSTEM_AUDIT_README.md`](../SYSTEM_AUDIT_README.md).
2. Work through **Phase 1** first: this will instantly give you a polished, professional look without deep refactoring.
3. Move to **Phase 2** to replace remaining demo UI components with active Supabase hooks.
4. Finish with **Phase 3** before opening payments to live customers.
