# 📚 DOCUMENTATION ORGANIZATION GUIDE

**Purpose:** Reorganize all documentation files into logical structure under `docs/`  
**Root README:** Single `README.md` only (project overview)  
**Goal:** Clean, navigable documentation structure

---

## 📁 NEW DOCUMENTATION STRUCTURE

```
docs/
├── 01-specifications/          # Technical specifications
│   ├── IDENTITY_FOUNDATION_SPEC.md
│   ├── STATE_MACHINE.md
│   ├── API.md
│   ├── PAYMENT_SPEC.md
│   ├── NOTIFICATION_SPEC.md
│   ├── AI_SPEC.md
│   ├── TEST_PLAN.md
│   └── README.md (navigation for this folder)
│
├── 02-product/                 # Product & business documentation
│   ├── FIXIFY_MASTER_BLUEPRINT.md
│   ├── PRODUCT_DECISIONS.md
│   ├── DESIGN_BRIEF.md
│   ├── RBAC.md
│   ├── DATA_MODEL.md
│   ├── BRAND_ASSETS.md
│   └── README.md (navigation)
│
├── 03-architecture/            # Architecture & implementation details
│   ├── IDENTITY_FOUNDATION_SPEC.md
│   ├── IDENTITY_IMPLEMENTATION_SUMMARY.md
│   ├── BEFORE_IMPLEMENTATION.md
│   ├── ARCHITECTURE.md (new - high-level overview)
│   └── README.md (navigation)
│
├── 04-guides/                  # Implementation guides & roadmaps
│   ├── GUIDE.md (main execution guide)
│   ├── PHASE_2_KICKOFF.md
│   ├── PHASE_1_COMPLETE.md (new - phase 1 summary)
│   ├── INDEX.md (full document index)
│   ├── GIT_WORKFLOW.md (new - git practices)
│   ├── CONTRIBUTING.md (new - contribution guidelines)
│   ├── PROJECT_STATUS.md (new - current status)
│   └── README.md (navigation)
│
├── 05-decisions/               # Decision records & open items
│   ├── OPEN_DECISIONS.md
│   ├── SECURITY.md (new - security decisions)
│   ├── DEPLOYMENT.md (new - deployment strategy)
│   ├── TECH_STACK.md (new - technology choices)
│   └── README.md (navigation)
│
└── 06-ui-specs/                # UI/UX specifications (when available)
    ├── COMPONENT_LIBRARY.md (new - component specs)
    ├── DESIGN_TOKENS.md (new - spacing, colors, typography)
    ├── RESPONSIVE_DESIGN.md (new - mobile/tablet/desktop)
    ├── customer-dashboard.md (new - when ready)
    ├── booking-flow.md (new - when ready)
    ├── professional-dashboard.md (new - when ready)
    └── README.md (navigation)
```

---

## 🔄 MIGRATION STEPS

### Step 1: Create Directory Structure
```bash
mkdir -p docs/{01-specifications,02-product,03-architecture,04-guides,05-decisions,06-ui-specs}
```

### Step 2: Move Existing Documentation

**Into `01-specifications/`:**
```bash
cp docs/STATE_MACHINE.md docs/01-specifications/
cp docs/API.md docs/01-specifications/
cp docs/PAYMENT_SPEC.md docs/01-specifications/
cp docs/NOTIFICATION_SPEC.md docs/01-specifications/
cp docs/AI_SPEC.md docs/01-specifications/
cp docs/TEST_PLAN.md docs/01-specifications/
```

**Into `02-product/`:**
```bash
cp docs/FIXIFY_MASTER_BLUEPRINT.md docs/02-product/
cp docs/PRODUCT_DECISIONS.md docs/02-product/
cp docs/DESIGN_BRIEF.md docs/02-product/
cp docs/RBAC.md docs/02-product/
cp docs/DATA_MODEL.md docs/02-product/
cp BRAND_ASSETS.md docs/02-product/
```

**Into `03-architecture/`:**
```bash
cp IDENTITY_FOUNDATION_SPEC.md docs/03-architecture/
cp IDENTITY_IMPLEMENTATION_SUMMARY.md docs/03-architecture/
cp BEFORE_IMPLEMENTATION.md docs/03-architecture/
```

**Into `04-guides/`:**
```bash
cp docs/GUIDE.md docs/04-guides/
cp PHASE_2_KICKOFF.md docs/04-guides/
cp INDEX.md docs/04-guides/
```

**Into `05-decisions/`:**
```bash
cp docs/OPEN_DECISIONS.md docs/05-decisions/
```

### Step 3: Create Navigation READMEs

**`docs/01-specifications/README.md`:**
```markdown
# Technical Specifications

This folder contains detailed technical specifications for Fixify.

## Contents

- **[Identity Foundation Spec](./IDENTITY_FOUNDATION_SPEC.md)** — Authentication, profiles, RBAC, RLS
- **[State Machine](./STATE_MACHINE.md)** — Job lifecycle state transitions
- **[API Reference](./API.md)** — API endpoints and contracts
- **[Payment Specification](./PAYMENT_SPEC.md)** — Payment integration
- **[Notification Specification](./NOTIFICATION_SPEC.md)** — Notification system
- **[AI Specification](./AI_SPEC.md)** — AI-powered features
- **[Test Plan](./TEST_PLAN.md)** — Testing strategy and coverage

## Navigation

← [Back to Documentation Index](../04-guides/INDEX.md)
```

**`docs/02-product/README.md`:**
```markdown
# Product & Business Documentation

This folder contains product vision, business rules, and design specifications.

## Contents

- **[Master Blueprint](./FIXIFY_MASTER_BLUEPRINT.md)** — 103-point product specification
- **[Product Decisions](./PRODUCT_DECISIONS.md)** — Business decisions log
- **[Design Brief](./DESIGN_BRIEF.md)** — Design principles and personality
- **[RBAC](./RBAC.md)** — Role-based access control
- **[Data Model](./DATA_MODEL.md)** — Database schema documentation
- **[Brand Assets](./BRAND_ASSETS.md)** — Color palette, typography, logos, components

## Navigation

← [Back to Documentation Index](../04-guides/INDEX.md)
```

**`docs/03-architecture/README.md`:**
```markdown
# Architecture & Implementation

This folder contains architecture decisions and implementation details.

## Contents

- **[Identity Foundation Spec](./IDENTITY_FOUNDATION_SPEC.md)** — Complete auth & identity spec
- **[Identity Implementation Summary](./IDENTITY_IMPLEMENTATION_SUMMARY.md)** — What was built
- **[Before Implementation](./BEFORE_IMPLEMENTATION.md)** — Approval checklist

## Navigation

← [Back to Documentation Index](../04-guides/INDEX.md)
```

**`docs/04-guides/README.md`:**
```markdown
# Implementation Guides & Roadmaps

This folder contains step-by-step guides and roadmaps for building Fixify.

## Quick Start

1. **[Phase 2 Kickoff](./PHASE_2_KICKOFF.md)** — Start here (Week 1-4 roadmap)
2. **[Git Workflow Guide](./GIT_WORKFLOW.md)** — How to use Git (branches, commits, PR)
3. **[Contributing](./CONTRIBUTING.md)** — Contribution guidelines
4. **[Project Status](./PROJECT_STATUS.md)** — Current phase and milestones

## Complete Guides

- **[Main Guide](./GUIDE.md)** — Complete execution guide (Sections 42+)
- **[Full Documentation Index](./INDEX.md)** — Reference for all documents

## Navigation

← [Back to Documentation Index](./INDEX.md)
```

**`docs/05-decisions/README.md`:**
```markdown
# Decisions & Strategic Items

This folder contains decision records and open items.

## Contents

- **[Open Decisions](./OPEN_DECISIONS.md)** — Decisions that still need to be made
- **[Security](./SECURITY.md)** — Security strategy and decisions
- **[Deployment](./DEPLOYMENT.md)** — Deployment and infrastructure decisions
- **[Tech Stack](./TECH_STACK.md)** — Technology choices and rationale

## Navigation

← [Back to Documentation Index](../04-guides/INDEX.md)
```

**`docs/06-ui-specs/README.md`:**
```markdown
# UI/UX Specifications

This folder contains UI/UX designs and component specifications.

## Contents

- **[Component Library](./COMPONENT_LIBRARY.md)** — Reusable component specifications
- **[Design Tokens](./DESIGN_TOKENS.md)** — Spacing, colors, typography
- **[Responsive Design](./RESPONSIVE_DESIGN.md)** — Mobile, tablet, desktop specs

### Page Specs (Coming Soon)

These will be added as Lovable prototypes are approved and converted to specs.

- Customer Dashboard
- Booking Flow
- Professional Dashboard
- Admin Panel

## Navigation

← [Back to Documentation Index](../04-guides/INDEX.md)
```

### Step 4: Update Root README.md

**`README.md` (in root, only file here):**
```markdown
# Fixify — Property Care, Made Intelligent

A premium property-maintenance marketplace connecting customers with verified professionals.

[Complete README template in Day 1-2 artifact above]
```

### Step 5: Create Symlinks (Optional - for quick dev access)

```bash
# Create symlinks in root for commonly used docs during development
ln -s docs/04-guides/PHASE_2_KICKOFF.md PHASE_2_KICKOFF.md
ln -s docs/02-product/BRAND_ASSETS.md BRAND_ASSETS.md
ln -s docs/03-architecture/IDENTITY_FOUNDATION_SPEC.md IDENTITY_FOUNDATION_SPEC.md
ln -s docs/04-guides/INDEX.md DOCS_INDEX.md
```

### Step 6: Clean Up Root Directory

```bash
# Remove old readme files from root (if they exist)
rm -f README_*.md CONTRIBUTING_*.md SECURITY_*.md 2>/dev/null || true

# Verify only README.md exists in root
ls -la *.md
# Should show only: README.md
```

### Step 7: Update .gitignore (if needed)

Add to `.gitignore`:
```
# Keep docs/ tracked
!docs/

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Dependencies
node_modules/
pnpm-lock.yaml

# Build
.next/
dist/
build/

# Env
.env.local
.env.*.local
```

---

## 📝 CREATING NEW DOCUMENTATION

### When Adding New Docs

**Placement logic:**
- **Spec/Technical details** → `01-specifications/`
- **Product/Business rules** → `02-product/`
- **Architecture/Design decisions** → `03-architecture/`
- **Guides/How-tos** → `04-guides/`
- **Decisions/Open items** → `05-decisions/`
- **UI/Component specs** → `06-ui-specs/`

### Naming Convention
- Use clear, descriptive names
- Use UPPERCASE for top-level specs (e.g., `SPECIFICATION.md`)
- Use lowercase for section guides (e.g., `setup-guide.md`)
- Use CAPS for acronyms (e.g., `RBAC.md`)

### File Headers
Always start docs with:
```markdown
# Document Title

**Status:** Draft / In Progress / Approved  
**Version:** 1.0  
**Created:** YYYY-MM-DD  
**Updated:** YYYY-MM-DD  
**Owner:** [Name/Role]

---

[Content...]
```

---

## 🔍 DOCUMENTATION DISCOVERY

### Finding Docs

**For different audiences:**

**Product Manager:**
- Start: `docs/02-product/README.md`
- Main: `FIXIFY_MASTER_BLUEPRINT.md`
- Decisions: `PRODUCT_DECISIONS.md`

**Developer:**
- Start: `docs/04-guides/README.md`
- Main: `PHASE_2_KICKOFF.md`
- Specs: `docs/01-specifications/`

**Architect:**
- Start: `docs/03-architecture/README.md`
- Main: `IDENTITY_FOUNDATION_SPEC.md`
- Overview: `docs/04-guides/INDEX.md`

**Designer/UI:**
- Start: `docs/06-ui-specs/README.md`
- Brand: `docs/02-product/BRAND_ASSETS.md`
- Components: `COMPONENT_LIBRARY.md` (when ready)

---

## 🚀 GIT COMMIT FOR DOCUMENTATION REORGANIZATION

```bash
git add -A
git commit -m "docs: reorganize documentation structure

- Move all docs to docs/ subdirectories
- Create 6 logical categories (specifications, product, architecture, guides, decisions, ui-specs)
- Add navigation READMEs to each folder
- Create single README.md in root with project overview
- Remove duplicate readme files from root

Structure:
- docs/01-specifications/ — Technical specs
- docs/02-product/ — Product & business docs
- docs/03-architecture/ — Architecture decisions
- docs/04-guides/ — Implementation guides
- docs/05-decisions/ — Decision records
- docs/06-ui-specs/ — UI/UX specs

This improves discoverability and maintains clean root directory.

References: DOCS_ORGANIZATION.md"
```

---

## ✅ CHECKLIST: AFTER REORGANIZATION

- [ ] Created 6 subdirectories under `docs/`
- [ ] Moved all relevant `.md` files to appropriate folders
- [ ] Created navigation README.md in each subfolder
- [ ] Single README.md exists in root
- [ ] Created symlinks in root (optional)
- [ ] Old readme files removed from root
- [ ] .gitignore updated if needed
- [ ] Tested that all links work
- [ ] Git commit completed
- [ ] Changes pushed to feature branch

---

## 📊 RESULT

```
Root directory (clean):
  README.md                        ← Project overview only
  src/
  public/
  supabase/
  docs/                            ← All documentation here
    01-specifications/
    02-product/
    03-architecture/
    04-guides/
    05-decisions/
    06-ui-specs/

GitHub Profile:
  Shows: README.md
  Users can navigate: via links in README
                     via docs/ folder structure
```

---

## 🎯 BENEFITS

✅ **Clean root directory** — Only README.md  
✅ **Organized docs** — Logical folder structure  
✅ **Easy discovery** — Navigation READMEs guide users  
✅ **Scalable** — Easy to add new categories  
✅ **Team-friendly** — Everyone knows where to find things  
✅ **GitHub-friendly** — Clean repo appearance

