# Fixify

A modern property-maintenance marketplace connecting property owners with verified professional technicians. Built with **Next.js**, **Supabase**, and **Tailwind CSS**.

**Status:** MVP Phase 1 Implementation  
**Stack:** Next.js 15 • React 19 • TypeScript • Tailwind CSS • Supabase (Postgres, Auth, Realtime)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+ ([install](https://pnpm.io/installation))
- Supabase account (free tier or local setup)

### Installation & Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Setup environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Start development server
pnpm dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Key Pages
- **Home:** [http://localhost:3000](http://localhost:3000)
- **Customer App:** [http://localhost:3000/customer](http://localhost:3000/customer) (protected)
- **Professional App:** [http://localhost:3000/pro](http://localhost:3000/pro) (protected)
- **Admin Panel:** [http://localhost:3000/admin](http://localhost:3000/admin) (admin only)
- **Help & FAQ:** [http://localhost:3000/help](http://localhost:3000/help)
- **Contact Support:** [http://localhost:3000/demo-contact](http://localhost:3000/demo-contact)

---

## 📁 Project Structure

```
fixify/
├── src/
│   ├── app/                    # Next.js app router (pages, layouts)
│   │   ├── (marketing)/        # Public pages (home, help, support)
│   │   ├── (auth)/             # Auth flow (login, register, reset)
│   │   ├── customer/           # Customer dashboard (protected)
│   │   ├── pro/                # Professional dashboard (protected)
│   │   └── admin/              # Admin panel (admin only)
│   ├── components/
│   │   ├── ui/                 # Reusable UI components (buttons, cards, etc.)
│   │   ├── shared/             # Shared across all domains (header, footer)
│   │   ├── customer/           # Customer-specific components
│   │   ├── professional/       # Professional-specific components
│   │   └── admin/              # Admin-specific components
│   ├── lib/
│   │   ├── supabase/           # Supabase client setup (client & server)
│   │   ├── auth/               # Authentication helpers
│   │   ├── services/           # Business logic (jobs, bookings, etc.)
│   │   ├── validators/         # Input validation schemas
│   │   └── utils/              # Utility functions
│   ├── types/                  # TypeScript type definitions
│   └── styles/                 # Global styles, CSS variables
├── supabase/
│   ├── migrations/             # Database schema (SQL)
│   ├── functions/              # SQL functions & triggers
│   └── storage/                # Storage configuration
├── public/                     # Static assets (images, fonts)
├── docs/                       # Project documentation (see below)
└── [config files]              # Next.js, Tailwind, ESLint, TypeScript
```

---

## 📚 Documentation Structure

All project documentation is organized in `docs/`:

| Folder | Purpose | Key Files |
|--------|---------|-----------|
| **[01-specifications/](docs/01-specifications/)** | Technical specs | Data model, API, RBAC, State machines |
| **[02-product/](docs/02-product/)** | Product & design | Brand assets, product decisions, payment spec |
| **[03-architecture/](docs/03-architecture/)** | System design | Master blueprint, AI specs, test plan |
| **[04-guides/](docs/04-guides/)** | How-to guides | Setup, deployment, implementation walkthroughs |
| **[05-decisions/](docs/05-decisions/)** | Decision logs | Approved decisions, open questions |
| **[06-ui-specs/](docs/06-ui-specs/)** | Design system | Design tokens, component specs, patterns |
| **[07-qa-artifacts/](docs/07-qa-artifacts/)** | QA reports | Latest accessibility & responsive test results |
| **[08-implementation-archive/](docs/08-implementation-archive/)** | Historical docs | Phase summaries, audit reports, old guides |

**📖 Start here:** Read [docs/04-guides/BEFORE_IMPLEMENTATION.md](docs/04-guides/BEFORE_IMPLEMENTATION.md) before contributing.

---

## 🛠 Development

### Common Commands

```bash
# Development
pnpm dev              # Start dev server (http://localhost:3000)
pnpm build            # Build for production
pnpm start            # Run production build locally
pnpm lint             # Lint and check code
pnpm type-check       # Run TypeScript checks

# Database (Supabase)
supabase start        # Start local Supabase (if using local dev)
supabase migration new <name>  # Create a new migration
supabase db push      # Apply migrations

# Testing
pnpm test             # Run tests (Vitest)
pnpm test:watch       # Run tests in watch mode
```

### First Time Setup

1. **Clone & Install**
   ```bash
   git clone <repo>
   cd fixify
   pnpm install
   ```

2. **Setup Supabase**
   - Create project at [supabase.com](https://supabase.com)
   - Copy API URL & Public Key to `.env.local`

3. **Run locally**
   ```bash
   pnpm dev
   ```

4. **Verify build**
   ```bash
   pnpm build
   ```

See **[docs/04-guides/GUIDE.md](docs/04-guides/GUIDE.md)** for detailed setup instructions.

---

## 🎨 Brand & Design

**Design System:** [docs/02-product/BRAND_ASSETS.md](docs/02-product/BRAND_ASSETS.md)

**Key Tokens:**
- **Colors:** Mint (#5FE3B0) • Dark (#0A0B0D) • Off-White (#F4F5F3)
- **Typography:** Space Grotesk (display) • Inter (body)
- **Components:** Fully spec'd in [docs/06-ui-specs/](docs/06-ui-specs/)

---

## ✨ Key Features

- **Authentication:** Supabase Auth (email/password + Google OAuth)
- **Marketplace:** Customers request services, professionals accept & complete
- **Payments:** Stripe integration for secure transactions
- **Real-time:** Job updates, notifications, live tracking
- **Professional Dashboard:** Manage jobs, reviews, earnings
- **Admin Panel:** User management, dispute resolution, analytics
- **Help & Support:** FAQ search, contact form, support dashboard

---

## 🏗 Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | Next.js 15 • React 19 • TypeScript |
| **Styling** | Tailwind CSS • CSS Variables • Shadcn/UI |
| **Backend** | Supabase (Postgres, Auth, Realtime, Storage) |
| **Payments** | Stripe |
| **Testing** | Vitest • React Testing Library |

---

## 🤝 Contributing

1. **Before starting:** Read [docs/04-guides/BEFORE_IMPLEMENTATION.md](docs/04-guides/BEFORE_IMPLEMENTATION.md)
2. **Create a feature branch** from `main`
3. **Make changes** and test thoroughly
4. **Run checks:**
   ```bash
   pnpm lint
   pnpm type-check
   pnpm test --run
   pnpm build
   ```
5. **Create a PR** with clear description
6. **After approval:** Merge to `main`

**Code Review Checklist:** See [docs/03-architecture/FIXIFY_MASTER_BLUEPRINT.md](docs/03-architecture/FIXIFY_MASTER_BLUEPRINT.md)

---

## ❓ Common Questions

**Q: Where do I find X documentation?**
- Architecture decisions → [docs/03-architecture/](docs/03-architecture/)
- Product decisions → [docs/05-decisions/](docs/05-decisions/)
- API endpoints → [docs/01-specifications/API.md](docs/01-specifications/API.md)
- Database schema → [docs/01-specifications/DATA_MODEL.md](docs/01-specifications/DATA_MODEL.md)
- Design system → [docs/06-ui-specs/](docs/06-ui-specs/)

**Q: How do I set up local Supabase?**
- See [docs/04-guides/DOCKER_QUICKSTART.md](docs/04-guides/DOCKER_QUICKSTART.md)

**Q: What's the code structure?**
- See Project Structure section above

**Q: How do I deploy?**
- See [docs/04-guides/GUIDE.md](docs/04-guides/GUIDE.md)

---

## 📋 Project Status

**Phase:** MVP Phase 1  
**Features:** Core marketplace, authentication, payments, admin panel  
**Next:** Phase 2 (Premium features, mobile app)

See full roadmap in [docs/05-decisions/](docs/05-decisions/)

---

## 📄 License

Copyright © 2025 Fixify. All rights reserved.

---

## 🆘 Need Help?

- **Setup issues?** → [docs/04-guides/GUIDE.md](docs/04-guides/GUIDE.md)
- **Architecture questions?** → [docs/03-architecture/](docs/03-architecture/)
- **Design system?** → [docs/06-ui-specs/](docs/06-ui-specs/)
- **API docs?** → [docs/01-specifications/API.md](docs/01-specifications/API.md)
- **Decisions log?** → [docs/05-decisions/](docs/05-decisions/)
