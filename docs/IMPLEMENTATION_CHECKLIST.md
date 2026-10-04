# Implementation Checklist — Copy This to Your Notes

Use this checklist to track your progress through all 11 phases.

---

## ✅ Pre-Implementation Checklist

- [ ] Node v18+ installed (`node --version`)
- [ ] pnpm v8+ installed (`pnpm --version`)
- [ ] Project dependencies installed (`pnpm install`)
- [ ] MCPs configured (Playwright, Chrome, Supabase, Shadcn, 21st)
- [ ] Output directories created (`mkdir -p docs/phase-outputs docs/baselines docs/screenshots`)
- [ ] Kiro available in VS Code
- [ ] START_HERE.md read (15 minutes)
- [ ] KIRO_QUICK_PROMPTS.md bookmarked
- [ ] KIRO_STRATEGY.md bookmarked

---

## 📊 Phase 0: Baseline Discovery (2–4 hours)

**Goal:** Understand current system state

- [ ] Open Kiro
- [ ] Copy Phase 0 prompt from KIRO_QUICK_PROMPTS.md
- [ ] Paste into Kiro and run
- [ ] Wait for completion (~45 min)
- [ ] Review `/docs/FIXIFY_RUNTIME_TRUTH.md`
- [ ] Verify 4 key questions answered:
  - [ ] Where does authentication happen?
  - [ ] Where is authorization enforced?
  - [ ] Where is job state changed?
  - [ ] Where does each dashboard get its data?
- [ ] Check `/docs/baselines/` for screenshots (at least 5 captured)
- [ ] Run: `pnpm build` (should succeed)
- [ ] Run: `pnpm lint` (should succeed)
- [ ] Commit: `git commit -m "Phase 0: Baseline discovery complete"`

**Expected Output:** `docs/FIXIFY_RUNTIME_TRUTH.md` ✅

---

## 🔒 Phase 1: Authentication & Logout Hardening (3–5 hours)

**Goal:** Verify auth, logout, and RBAC work correctly

- [ ] Copy Phase 1 prompt from KIRO_QUICK_PROMPTS.md
- [ ] Paste into Kiro and run
- [ ] Wait for completion
- [ ] Review `/docs/phase-outputs/phase1-auth-results.md`
- [ ] Verify all tests passing:
  - [ ] Customer login works
  - [ ] Professional login works
  - [ ] Admin login works
  - [ ] Invalid login fails safely
  - [ ] Logout invalidates session
  - [ ] Cross-role access denied
  - [ ] Back-button after logout denied
  - [ ] Cookies have correct flags (HttpOnly, Secure, SameSite)
- [ ] Run: `pnpm build` (should succeed)
- [ ] Commit: `git commit -m "Phase 1: Auth, logout, RBAC hardened and verified"`

**Expected Output:** `docs/phase-outputs/phase1-auth-results.md` ✅

---

## 🛡️ Phase 2: RLS & Data Ownership (4–8 hours)

**Goal:** Database-layer security is proven

- [ ] Copy Phase 2 prompt from KIRO_QUICK_PROMPTS.md
- [ ] Paste into Kiro and run
- [ ] Wait for completion
- [ ] Review `/docs/phase-outputs/phase2-rls-results.md`
- [ ] Verify all tests passing:
  - [ ] Customer A cannot read Customer B property
  - [ ] Professional A cannot read unassigned job
  - [ ] Direct SQL bypass attempts denied
  - [ ] All RLS policies implemented and tested
- [ ] Run: `pnpm build` (should succeed)
- [ ] Commit: `git commit -m "Phase 2: RLS policies implemented and tested"`

**Expected Output:** `docs/phase-outputs/phase2-rls-results.md` ✅

---

## ⚙️ Phase 3: State Machine Enforcement (4–8 hours)

**Goal:** Job state can only be changed through authorized transitions

- [ ] Copy Phase 3 prompt from KIRO_QUICK_PROMPTS.md
- [ ] Paste into Kiro and run
- [ ] Wait for completion
- [ ] Review `/docs/phase-outputs/phase3-state-machine-results.md`
- [ ] Verify all tests passing:
  - [ ] All unsafe mutations replaced with authoritative calls
  - [ ] Invalid transitions (REQUESTED→COMPLETED) denied
  - [ ] Valid transitions (REQUESTED→ACCEPTED→INSPECTION...) work
  - [ ] Audit events created for each transition
  - [ ] No race conditions (two simultaneous actions handled correctly)
- [ ] Run: `pnpm build` (should succeed)
- [ ] Commit: `git commit -m "Phase 3: State machine enforcement complete"`

**Expected Output:** `docs/phase-outputs/phase3-state-machine-results.md` ✅

---

## 👤 Phase 4: Customer Dashboard Live Data (4–8 hours)

**Goal:** Customer dashboard shows real data, not mocks

- [ ] Copy Phase 4 prompt from KIRO_QUICK_PROMPTS.md
- [ ] Paste into Kiro and run
- [ ] Wait for completion
- [ ] Review `/docs/phase-outputs/phase4-customer-dashboard-results.md`
- [ ] Verify all components built:
  - [ ] CustomerDashboard component
  - [ ] PropertyList component
  - [ ] JobCard component
  - [ ] LoadingState component
  - [ ] EmptyState component
  - [ ] ErrorState component
- [ ] Verify all states work:
  - [ ] Loading skeleton appears while fetching
  - [ ] Data displayed when loaded
  - [ ] Empty state when no jobs
  - [ ] Error state with retry button
- [ ] Verify security:
  - [ ] Customer A sees only own data
  - [ ] Customer B does not see Customer A data
- [ ] Check screenshots:
  - [ ] Baseline screenshot captured (at least 3 viewports)
  - [ ] Visual defects identified (top 3)
  - [ ] Defects fixed
  - [ ] Final screenshot captured
  - [ ] Before/after compared
- [ ] Run: `pnpm build` (should succeed)
- [ ] Commit: `git commit -m "Phase 4: Customer dashboard real data binding complete"`

**Expected Output:** 
- `docs/phase-outputs/phase4-customer-dashboard-results.md` ✅
- Screenshots in `docs/baselines/` and `docs/screenshots/` ✅

---

## 💼 Phase 5: Professional Workspace Live Data (4–8 hours)

**Goal:** Professional workspace shows real assigned jobs

- [ ] Copy Phase 5 prompt from KIRO_QUICK_PROMPTS.md
- [ ] Paste into Kiro and run
- [ ] Wait for completion
- [ ] Review `/docs/phase-outputs/phase5-professional-dashboard-results.md`
- [ ] Verify all components built:
  - [ ] ProfessionalDashboard component
  - [ ] RequestQueue component
  - [ ] JobCard component
  - [ ] InspectionForm component
  - [ ] QuoteForm component
- [ ] Verify information architecture:
  - [ ] Needs action first
  - [ ] Today's work visible
  - [ ] Active job workspace
  - [ ] History/earnings visible
- [ ] Verify security:
  - [ ] Professional sees only assigned jobs
  - [ ] Cannot accept already-assigned request
  - [ ] State transitions enforced
- [ ] Check screenshots:
  - [ ] Baseline captured
  - [ ] Top 3 defects identified and fixed
  - [ ] Final screenshot captured
  - [ ] Before/after compared
- [ ] Run: `pnpm build` (should succeed)
- [ ] Commit: `git commit -m "Phase 5: Professional dashboard real data binding complete"`

**Expected Output:** 
- `docs/phase-outputs/phase5-professional-dashboard-results.md` ✅
- Screenshots updated ✅

---

## 👨‍💼 Phase 6: Admin Operations (4–8 hours)

**Goal:** Admin interface for operations management

- [ ] Copy Phase 6 prompt from KIRO_QUICK_PROMPTS.md
- [ ] Paste into Kiro and run
- [ ] Wait for completion
- [ ] Review `/docs/phase-outputs/phase6-admin-operations-results.md`
- [ ] Verify all modules built:
  - [ ] OperationsQueue component
  - [ ] CaseDrawer component (side-over)
  - [ ] CaseTimeline component
  - [ ] Permitted action buttons
- [ ] Verify admin operations:
  - [ ] Quote dispute resolution
  - [ ] Job reassignment
  - [ ] Professional verification
  - [ ] Every action creates audit event
- [ ] Verify security:
  - [ ] Admin cannot arbitrarily modify records
  - [ ] All operations require authorization
- [ ] Run: `pnpm build` (should succeed)
- [ ] Commit: `git commit -m "Phase 6: Admin operations properly built"`

**Expected Output:** `docs/phase-outputs/phase6-admin-operations-results.md` ✅

---

## 🎨 Phase 7: Design System Consolidation (3–6 hours)

**Goal:** Consistent visual tokens and components

- [ ] Copy Phase 7 prompt from KIRO_QUICK_PROMPTS.md
- [ ] Paste into Kiro and run
- [ ] Wait for completion
- [ ] Review `/docs/phase-outputs/phase7-design-system-results.md`
- [ ] Verify all components standardized:
  - [ ] Buttons (primary, secondary, destructive)
  - [ ] Inputs (text, select, checkbox, radio)
  - [ ] Badges (status, category)
  - [ ] Dialogs (modal, side-over)
  - [ ] Tables
  - [ ] Headers
  - [ ] User menus
  - [ ] Empty/Loading/Error states
- [ ] Verify tokens consolidated:
  - [ ] Colors: Porcelain, Paper, Ink, Teal, Deep Teal, Clay
  - [ ] Spacing rhythm (4px base)
  - [ ] Typography hierarchy
  - [ ] Border radius standard
  - [ ] Shadows restrained
- [ ] Run: `pnpm build` (should succeed)
- [ ] Commit: `git commit -m "Phase 7: Design system consolidated"`

**Expected Output:** `docs/phase-outputs/phase7-design-system-results.md` ✅

---

## 📲 Phase 8: Loading / Error / Empty States (2–4 hours)

**Goal:** All async states have clear visual feedback

- [ ] Copy Phase 8 prompt from KIRO_QUICK_PROMPTS.md
- [ ] Paste into Kiro and run
- [ ] Wait for completion
- [ ] Review `/docs/phase-outputs/phase8-states-results.md`
- [ ] Verify for each data-driven component:
  - [ ] Loading state (skeleton or spinner)
  - [ ] Empty state (message + CTA)
  - [ ] Error state (reason + retry)
  - [ ] Success state (data displayed)
- [ ] Verify for each mutation:
  - [ ] Idle (ready to submit)
  - [ ] Submitting (spinner, button disabled)
  - [ ] Success (confirmation)
  - [ ] Error (retry available)
- [ ] Verify no optimistic UI claims without verification
- [ ] Run: `pnpm build` (should succeed)
- [ ] Commit: `git commit -m "Phase 8: Loading, error, empty states complete"`

**Expected Output:** `docs/phase-outputs/phase8-states-results.md` ✅

---

## 📱 Phase 9: Responsive & Accessibility QA (3–5 hours)

**Goal:** Product works at all target viewports with keyboard/assistive tech

- [ ] Copy Phase 9 prompt from KIRO_QUICK_PROMPTS.md
- [ ] Paste into Kiro and run
- [ ] Wait for completion
- [ ] Review `/docs/phase-outputs/phase9-responsive-a11y-results.md`
- [ ] Verify viewport testing:
  - [ ] Desktop: 1440×900
  - [ ] Desktop: 1280×800
  - [ ] Desktop: 1024×768
  - [ ] Tablet: 768×1024
  - [ ] Mobile: 430×932
  - [ ] Mobile: 390×844
- [ ] Verify responsive checks:
  - [ ] No horizontal overflow
  - [ ] Text readable at all sizes
  - [ ] Touch targets ≥44×44px (mobile)
  - [ ] Layout reflows intentionally
- [ ] Verify keyboard navigation:
  - [ ] Tab order logical
  - [ ] Shift+Tab goes backward
  - [ ] Enter/Space activates buttons
  - [ ] Escape closes modals/menus
- [ ] Verify reduced motion:
  - [ ] Test with prefers-reduced-motion: reduce
  - [ ] Animations disabled or simplified
  - [ ] No motion delays access to content
- [ ] Verify accessibility:
  - [ ] Heading hierarchy (h1, h2, h3)
  - [ ] Form labels associated with inputs
  - [ ] Button accessible names
  - [ ] Image alt text present
- [ ] Run: `pnpm build` (should succeed)
- [ ] Commit: `git commit -m "Phase 9: Responsive and accessibility QA complete"`

**Expected Output:** `docs/phase-outputs/phase9-responsive-a11y-results.md` ✅

---

## ✨ Phase 10: Visual Polish via Screenshots (2–5 hours)

**Goal:** Visual refinement proven through rendered inspection

- [ ] Copy Phase 10 prompt from KIRO_QUICK_PROMPTS.md
- [ ] Paste into Kiro and run
- [ ] Wait for completion
- [ ] Review `/docs/phase-outputs/phase10-visual-refinement-results.md`
- [ ] For each major page (/customer, /professional, /admin):
  - [ ] Baseline screenshot captured (1440×900, 390×844)
  - [ ] Visual hierarchy verified
  - [ ] Spacing verified
  - [ ] Composition verified
  - [ ] Top 3 defects identified
  - [ ] Top 3 defects fixed
  - [ ] Final screenshot captured
  - [ ] Before/after compared
- [ ] Verify visual quality:
  - [ ] No generic SaaS template appearance
  - [ ] Brand palette used consistently
  - [ ] Typography hierarchy clear
  - [ ] Spacing intentional
  - [ ] No rogue gradients or decorative clutter
- [ ] Run: `pnpm build` (should succeed)
- [ ] Commit: `git commit -m "Phase 10: Visual refinement complete"`

**Expected Output:** 
- `docs/phase-outputs/phase10-visual-refinement-results.md` ✅
- Before/after screenshots ✅

---

## 🚀 Final Verification (1–2 hours)

**Goal:** All systems ready for production

### Security Tests
- [ ] All negative security tests pass
- [ ] IDOR tests pass (Customer A cannot access Customer B)
- [ ] Cross-role access tests pass
- [ ] State transition tests pass
- [ ] Logout/back-button tests pass
- [ ] Input validation tests pass
- [ ] Concurrency tests pass

### Build & Deployment
- [ ] `pnpm build` succeeds (0 errors)
- [ ] `pnpm lint` passes (0 errors)
- [ ] `pnpm test:run` passes (if tests exist)
- [ ] No console errors (browser)
- [ ] No console errors (Node)
- [ ] No secrets in bundle
- [ ] Environment variables documented

### Documentation
- [ ] FIXIFY_RUNTIME_TRUTH.md complete ✅
- [ ] All 11 phase-outputs files exist ✅
- [ ] Screenshots captured ✅
- [ ] No unresolved issues or TODOs in code

### Release Gate Checklist
- [ ] Authentication verified
- [ ] RBAC verified
- [ ] RLS verified
- [ ] State machine verified
- [ ] Real data binding verified
- [ ] Error handling complete
- [ ] Session security verified
- [ ] Responsive design verified
- [ ] Accessibility verified
- [ ] Security negative tests pass
- [ ] Screenshots inspected
- [ ] Build successful
- [ ] Documentation complete

### Final Steps
- [ ] Review each phase output file
- [ ] Tag release: `git tag -a v1.0.0-mvp -m "MVP Release"`
- [ ] Push to remote: `git push origin main --tags`
- [ ] Create release notes

**Expected Output:** ✅ PRODUCTION READY

---

## 📋 Progress Tracking

Track which phases are complete:

```
WEEK 1
Phase 0: ☐ In Progress ☑ Complete
Phase 1: ☐ In Progress ☑ Complete

WEEK 2
Phase 2: ☐ In Progress ☑ Complete
Phase 3: ☐ In Progress ☑ Complete

WEEK 3
Phase 4: ☐ In Progress ☑ Complete
Phase 5: ☐ In Progress ☑ Complete

WEEK 4
Phase 6: ☐ In Progress ☑ Complete
Phase 7: ☐ In Progress ☑ Complete
Phase 8: ☐ In Progress ☑ Complete
Phase 9: ☐ In Progress ☑ Complete

WEEK 5
Phase 10: ☐ In Progress ☑ Complete
Verification: ☐ In Progress ☑ Complete
PRODUCTION: ☐ Not Ready ☑ Ready
```

---

## 🆘 If Stuck

1. **Check KIRO_STRATEGY.md** for the right prompt approach
2. **Check SYSTEM_AUDIT.md** for official requirements
3. **Ask Kiro directly:** "I'm stuck on [problem]. Investigate and suggest fixes."
4. **Root cause analysis:** Ask Kiro to investigate specific files/areas

---

## ✅ Success Criteria Met When:

- [✅] All 11 phases have passing results files
- [✅] All negative security tests pass
- [✅] All screenshots captured and compared
- [✅] pnpm build succeeds
- [✅] pnpm lint passes
- [✅] No console errors
- [✅] All phases committed to git
- [✅] Release notes created
- [✅] v1.0.0-mvp tag created

---

**Good luck! You've got a complete roadmap.** 🚀
