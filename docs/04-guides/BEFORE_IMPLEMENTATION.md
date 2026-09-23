# IDENTITY FOUNDATION — BEFORE IMPLEMENTATION CHECKLIST

**Status:** Specification Complete — Awaiting Approval & Implementation Kickoff

---

## Pre-Implementation Review

Before Kiro begins implementation of the Identity Foundation, complete this checklist:

### Product Owner Review

- [ ] Read `IDENTITY_FOUNDATION_SPEC.md` Part 1 (Requirements, R1–R8)
- [ ] Read `.kiro/steering/product.md` (product vision and rules)
- [ ] Confirm authentication approach (Supabase Auth, email/password, Google OAuth)
- [ ] Confirm four roles are correct (Customer, Professional, Admin, Support)
- [ ] Confirm professional verification states are correct (PENDING → VERIFIED workflow)
- [ ] Confirm one role per user is acceptable for MVP
- [ ] No questions or clarifications needed

### Technical Lead Review

- [ ] Read `IDENTITY_FOUNDATION_SPEC.md` Part 2 (Design, D1–D7)
- [ ] Read `.kiro/steering/technical.md` (tech stack and constraints)
- [ ] Read `.kiro/steering/security.md` (security model)
- [ ] Read `.kiro/steering/structure.md` (repository structure)
- [ ] Confirm Supabase PostgreSQL for database (no Prisma, no second database)
- [ ] Confirm RLS policies approach
- [ ] Confirm `@supabase/ssr` for session management
- [ ] Confirm middleware for session refresh
- [ ] Confirm 4 migration files are sufficient for MVP
- [ ] No questions or clarifications needed

### Infrastructure / DevOps Review

- [ ] Supabase project is created and accessible
- [ ] Supabase project URL available
- [ ] Supabase publishable key available
- [ ] Supabase service-role key available (store securely, not in repo)
- [ ] Google OAuth credentials obtained from Google Cloud Console
- [ ] Google OAuth client ID and secret available
- [ ] Redirect URLs confirmed:
  - [ ] Local: `http://localhost:3000/auth/callback`
  - [ ] Staging: `https://<staging-url>/auth/callback`
  - [ ] Production: `https://<production-url>/auth/callback`
- [ ] `.env.example` template prepared
- [ ] `.env.local` will be created (and git-ignored)

### Security Review

- [ ] Read `.kiro/steering/security.md` section 1–9
- [ ] Confirm "don't trust client input" is understood (prices, roles, ownership)
- [ ] Confirm "RLS policies enforce" is understood
- [ ] Confirm "service-role key is server-only" is understood
- [ ] Confirm audit logging approach is acceptable
- [ ] Confirm financial calculations will be server-side
- [ ] No security concerns or questions

### Architecture Review

- [ ] Confirm Supabase Auth is the only authentication system (no Clerk, no parallel auth)
- [ ] Confirm Next.js App Router with cookie-based sessions
- [ ] Confirm `profiles` table architecture (bridge between auth.users and app)
- [ ] Confirm four main tables: profiles, customer_profiles, professional_profiles, audit_logs
- [ ] Confirm RLS policies on all customer-owned tables
- [ ] Confirm role-based access control model
- [ ] No architectural concerns

### Testing Requirements Confirmed

- [ ] Team agrees to RLS testing (Customer A cannot see Customer B data)
- [ ] Team agrees to auth flow testing (signup, login, OAuth)
- [ ] Team agrees to authorization testing (role checks, data isolation)
- [ ] Team agrees to session persistence testing
- [ ] Team has testing environment available
- [ ] Team has test user credentials (Gmail account for OAuth testing)

---

## Supabase Project Preparation

### Create New Supabase Project

```bash
# Option 1: Via Supabase dashboard
# Go to: https://app.supabase.com
# Click "New Project"
# Choose organization and name: "Fixify"
# Wait for project creation (~2 minutes)

# Option 2: Via Supabase CLI
supabase projects create --name "Fixify"
```

### Gather Credentials

After project creation, record:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[anon key from API settings]
SUPABASE_SERVICE_ROLE_KEY=[service_role key from API settings]
```

Store service-role key securely (not in git, not in repo).

---

## Google OAuth Setup

### Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "Fixify"
3. Enable "Google+ API"
4. Create OAuth 2.0 credentials (consent screen):
   - User type: External
   - Scopes: email, profile
5. Create OAuth 2.0 credentials (Authorized JavaScript origins):
   - `http://localhost:3000`
   - `https://<staging-url>`
   - `https://<production-url>`
6. Create OAuth 2.0 credentials (Authorized redirect URIs):
   - `http://localhost:3000/auth/callback`
   - `https://<staging-url>/auth/callback`
   - `https://<production-url>/auth/callback`
7. Record Client ID and Client Secret

### Configure in Supabase

1. Go to Supabase project → Authentication → Providers
2. Enable "Google"
3. Paste Client ID and Client Secret
4. Copy Supabase callback URL provided by Supabase
5. Paste into Google Cloud Console (step 5 above)
6. Test OAuth flow locally

---

## Next.js Project Preparation

### Verify .env.example

Create `.env.example` in project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[anon key]

# Do NOT commit SUPABASE_SERVICE_ROLE_KEY to git
# Set it locally in .env.local only
```

### Verify .gitignore

Ensure `.gitignore` includes:

```
.env.local
.env.*.local
```

### Dependencies

Verify `package.json` will have:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x.x",
    "@supabase/ssr": "^0.x.x",
    "next": "^15.x.x",
    "react": "^19.x.x",
    "typescript": "^5.x.x"
  }
}
```

---

## Directory Structure Ready

Verify these directories exist:

```bash
mkdir -p src/app/(marketing)
mkdir -p src/app/(auth)
mkdir -p src/app/auth/callback
mkdir -p src/app/app
mkdir -p src/app/pro
mkdir -p src/app/admin
mkdir -p src/components/ui
mkdir -p src/components/auth
mkdir -p src/lib/supabase
mkdir -p src/lib/auth
mkdir -p src/types
mkdir -p supabase/migrations
mkdir -p supabase/functions
mkdir -p docs
mkdir -p .kiro/steering
```

---

## Documentation Requirements

Verify these docs are finalized or available for reference:

- [ ] `docs/FIXIFY_MASTER_BLUEPRINT.md` — Product vision
- [ ] `docs/PRODUCT_DECISIONS.md` — Business decisions
- [ ] `docs/DATA_MODEL.md` — Database schema
- [ ] `docs/RBAC.md` — Role-based access control
- [ ] `IDENTITY_FOUNDATION_SPEC.md` — This spec (authentication and identity)
- [ ] `.kiro/steering/product.md` — Auto-included product context
- [ ] `.kiro/steering/technical.md` — Auto-included technical constraints
- [ ] `.kiro/steering/security.md` — Auto-included security rules
- [ ] `.kiro/steering/structure.md` — Auto-included repository structure

---

## Approval Gate

### Get Signoff

Before proceeding with implementation:

- [ ] **Product Owner:** Approves requirements and roles
- [ ] **Technical Lead:** Approves architecture and design
- [ ] **Security Lead:** Approves security model
- [ ] **Infrastructure/DevOps:** Confirms Supabase and credentials ready
- [ ] **Team:** Agrees to testing approach

### Document Approval

- [ ] All steering files reviewed and accepted
- [ ] All specifications reviewed and accepted
- [ ] No blockers or concerns remain

---

## Implementation Kickoff Checklist

Once all above items are checked, implementation can begin:

### Kiro is Ready When:

- [ ] All prerequisites completed
- [ ] All approvals obtained
- [ ] Credentials securely stored in `.env.local`
- [ ] Team has access to Supabase project
- [ ] Team has test Google OAuth credentials
- [ ] Team understands the specification
- [ ] Task list printed (from IDENTITY_FOUNDATION_SPEC.md Part 3)

### First Kiro Command:

```bash
# Ask Kiro to implement Part 3, Tasks T1–T6
# Start with: "Implement identity foundation per IDENTITY_FOUNDATION_SPEC.md"
```

---

## Post-Implementation Verification

After Kiro completes implementation:

### Local Testing

```bash
# 1. Install dependencies
pnpm install

# 2. Start dev server
pnpm dev

# 3. Open http://localhost:3000 in browser

# 4. Test signup (email)
# 5. Test login (email)
# 6. Test Google OAuth
# 7. Verify profile created in Supabase dashboard
# 8. Verify session persists across refresh
# 9. Test RLS (try accessing other customer's data)
# 10. Verify audit logs created
```

### Test Coverage

All tests must pass:

```bash
pnpm test
```

Including:
- [ ] RLS policy tests
- [ ] Authentication flow tests
- [ ] Authorization tests
- [ ] Session persistence tests

---

## Success Criteria Met

Project is ready for next phase (Properties & Services) when:

- [ ] All tests pass (green CI/CD)
- [ ] Local testing verified all flows work
- [ ] Code reviewed and approved
- [ ] Merged to `develop` branch
- [ ] Deployed to staging
- [ ] Staging verification complete
- [ ] Ready for merge to `main`

---

## Document Signatures

Use this section to track approvals:

```
Product Owner:    ___________________  Date: ___________
Technical Lead:   ___________________  Date: ___________
Security Lead:    ___________________  Date: ___________
Infrastructure:   ___________________  Date: ___________
Team Lead:        ___________________  Date: ___________
```

---

## Next Steps (When Approved)

1. All boxes checked above ✓
2. Execute IDENTITY_FOUNDATION_SPEC.md Part 3 (Implementation Tasks T1–T6)
3. Run all tests (Part 3, T6)
4. Create pull request
5. Code review and approval
6. Merge to develop
7. Deploy to staging
8. Final verification
9. Merge to main
10. Begin Phase 2: Properties & Services spec

---

**Status:** Ready for review and approval  
**Next Action:** Obtain signoffs above, then kickoff implementation

