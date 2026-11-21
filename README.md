# SUMEXORA PENAL

**Ultimate Enterprise Hosting & AI Project Management Platform**

Official Branding: **SUMEXORA ADMIN PANEL**

## Overview

SUMEXORA PENAL is a production-oriented, full-stack SaaS platform for managing, hosting, deploying, and AI-editing multiple independent web projects. It provides branded subdomain generation, real hosting provider adapters, domain lifecycle management, file management, backups, security, and an AI Command Center.

This is **not** a demo or mockup. Core systems are implemented with real backend logic, database persistence, authentication, file storage, and integration interfaces. External services (DNS, hosting providers, AI, SSL) require valid credentials configured via environment variables.

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS + Framer Motion + Monaco Editor
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with migrations
- **Storage**: Local/persistent volume (extensible to S3-compatible)
- **Auth**: JWT + bcrypt + session management + RBAC
- **AI**: Configurable provider (Gemini by default)
- **Hosting Adapters**: Render, Cloudflare Pages, GitHub Actions (extensible)
- **DNS**: Cloudflare API (or compatible) for wildcard + custom domains
- **TLS**: ACME / provider-managed certificates

## Quick Start (Development)

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (via Docker)

### 1. Clone & Install
```bash
cd SUMEXORA-PENAL
cp .env.example .env
# Edit .env with your secrets and provider keys
npm install
cd frontend && npm install
cd ../backend && npm install
```

### 2. Start Infrastructure
```bash
docker-compose up -d
```

### 3. Run Migrations
```bash
cd backend && npm run migrate
```

### 4. Start Development Servers
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

Access: http://localhost:5173 (frontend)  
API: http://localhost:4000

Default admin (created on first migrate if none exists):
- Email: admin@sumexora.com
- Password: ChangeMeImmediately! (change after first login)

## Required External Configuration

For full functionality the following must be configured in `.env`:

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | Auth token signing |
| `DATABASE_URL` | PostgreSQL connection |
| `GEMINI_API_KEY` | AI Command Center |
| `CLOUDFLARE_API_TOKEN` | DNS & optional Pages |
| `CLOUDFLARE_ZONE_ID` | For sumexora.com (or your root domain) |
| `RENDER_API_KEY` | Hosting adapter |
| `ROOT_DOMAIN` | e.g. sumexora.com |
| `STORAGE_PATH` | Persistent project files |

Without these keys, the corresponding modules return clear configuration-required errors instead of fake success.

## Project Structure

```
SUMEXORA-PENAL/
├── frontend/          # React admin panel
├── backend/           # Express API + services
├── database/          # Schema & migrations
├── infrastructure/    # Docker, deployment configs
├── scripts/           # Utility scripts
├── tests/             # Integration & unit tests
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## Key Features Implemented

- Real JWT authentication & role-based access
- Project CRUD with real database records
- File upload + ZIP extraction with path-traversal protection
- Project versioning & backups
- Domain generation & lifecycle tracking (Active / Expiring / Expired)
- Hosting provider connection interfaces
- AI instruction → file modification pipeline (requires API key)
- Monaco-based file manager
- Premium Framer Motion animations matching the design system
- Audit logging & security middleware

## Deployment (Render / Docker)

See `infrastructure/deployment/` and the root `Dockerfile`. The platform itself can be deployed on Render with a PostgreSQL addon and persistent disk. Project hosting uses external adapters.

## License

Proprietary – SUMEXORA PENAL

---

**Build. Deploy. Grow.**
