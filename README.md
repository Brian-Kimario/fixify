# Fixify

A modern property-maintenance marketplace connecting property managers and professionals with skilled technicians. Built with Next.js, Supabase, and Tailwind CSS.

## Quick Start

### Prerequisites
- Node.js 18+ / pnpm 8+
- Supabase account (local development setup available)

### Installation

```bash
# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
fixify/
├── src/
│   ├── app/              # Next.js app router pages and layouts
│   ├── components/       # React components organized by domain
│   ├── lib/              # Utilities, services, and client/server configurations
│   ├── types/            # TypeScript type definitions
│   ├── styles/           # Global styles and CSS variables
│   └── validators/       # Data validation schemas
├── supabase/             # Database migrations and edge functions
├── public/               # Static assets and brand files
├── docs/                 # Project documentation (see below)
└── [config files]        # Next.js, Tailwind, ESLint, TypeScript config
```

## Documentation

All documentation is organized in the `docs/` folder:

- **[01-specifications/](docs/01-specifications/)** — Technical specifications
  - Data models, API specifications, RBAC, state machines
  
- **[02-product/](docs/02-product/)** — Product & design documentation
  - Brand assets, design decisions, payment & notification specs
  
- **[03-architecture/](docs/03-architecture/)** — Architecture & implementation
  - Master blueprint, AI specs, test plans, identity foundation
  
- **[04-guides/](docs/04-guides/)** — Development guides & walkthroughs
  - Setup instructions, implementation guides, phase kickoff docs
  
- **[05-decisions/](docs/05-decisions/)** — Product decisions & open issues
  - Decision logs, open questions, product roadmap
  
- **[06-ui-specs/](docs/06-ui-specs/)** — UI component specifications
  - Component library, design tokens, style guide

## Development

### Build & Deploy

```bash
# Build for production
pnpm build

# Run production build locally
pnpm start

# Lint and format
pnpm lint
```

### Database

Local Supabase setup:

```bash
# Start Supabase locally
supabase start

# Create a migration
supabase migration new <migration_name>

# Apply migrations
supabase db push
```

## Brand & Design System

The brand system is fully documented in [docs/02-product/BRAND_ASSETS.md](docs/02-product/BRAND_ASSETS.md).

**Key Design Tokens:**
- **Colors:** Mint (#5FE3B0), Dark (#0A0B0D), Off-White (#F4F5F3)
- **Fonts:** Space Grotesk (display), Inter (body)
- **Logo:** Rooftop + connection node symbol (SVG)

See [docs/02-product/BRAND_ASSETS.md](docs/02-product/BRAND_ASSETS.md) for complete design system.

## Key Features

- **Authentication:** Supabase Auth with email/password and OAuth
- **Marketplace:** Property managers post jobs, professionals bid and complete work
- **Payments:** Stripe integration for secure transactions
- **Notifications:** Real-time updates for jobs, bids, and messages
- **Professional Dashboard:** Manage bids, reviews, earnings
- **Admin Interface:** Dispute resolution, user management, analytics

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS with CSS variables for theming
- **Backend:** Supabase (Postgres, Auth, Realtime, Storage)
- **Payments:** Stripe
- **Database:** PostgreSQL (Supabase)
- **Testing:** Vitest, React Testing Library

## Contributing

1. Create a feature branch from `develop`
2. Make changes and test thoroughly
3. Create a pull request with a clear description
4. After review and approval, merge to `develop`, then to `main`

## License

Copyright 2025 Fixify. All rights reserved.

## Support & Questions

For questions about the project structure, see [docs/04-guides/](docs/04-guides/).

For architecture decisions, see [docs/03-architecture/](docs/03-architecture/).

For product decisions, see [docs/05-decisions/](docs/05-decisions/).
