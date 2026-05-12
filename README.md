# WeSplit

Application de gestion de voyages en groupe : itinéraires partagés, dépenses, comptes et règlements.

## Stack

- **Front** : Next.js 15 (App Router) + TailwindCSS + shadcn/ui
- **Back** : NestJS 11 + Prisma + PostgreSQL + JWT
- **Auth** : Google OAuth via NextAuth
- **Monorepo** : pnpm workspaces + Turborepo

## Structure

```
apps/
  web/      # Next.js 15
  api/      # NestJS 11
packages/
  shared/   # Types et schemas Zod partagés
docs/       # Maquette + impact map
```

## Démarrage

```bash
pnpm install
cp .env.example .env
pnpm db:up           # Postgres via Docker
pnpm --filter api prisma migrate dev
pnpm dev             # web (3000) + api (3001)
```
