# Revistra PWA

Production-oriented loyalty platform built with Next.js App Router, TypeScript, TailwindCSS, Prisma, and server actions.

## Tech Stack

- Next.js (App Router)
- TypeScript
- TailwindCSS
- Prisma + PostgreSQL
- Server Actions for backend workflows

## Quick Start

```bash
npm install
npx prisma generate
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Create `.env` from `.env.example`.

Required:

- `DATABASE_URL`
- `SESSION_SECRET` (minimum 32 characters)
- `OTP_API_KEY` (optional for OTP provider integration)

## Scripts

- `npm run icons:sync` - regenerate favicon + PWA icons from `public/logo.jpg` on Windows (skips safely on Linux/macOS CI)
- `npm run dev` - local development
- `npm run build` - production build
- `npm run start` - run built app
- `npm run lint` - eslint checks
- `npm run backfill:card-serials` - normalize legacy card serials

## Architecture

- `src/app` - routes and UI shells
- `src/actions` - server-side business actions
- `src/components` - reusable UI and layout primitives
- `src/lib` - utilities, env/session, validation
- `src/features` - feature-specific config and modules
- `prisma` - schema and scripts

## Production Notes

- Do not commit real secrets to Git.
- Rotate any leaked credentials immediately.
- Keep Prisma migrations and schema changes versioned.
- Run `npm run lint` and `npx tsc --noEmit` before deployment.
- App icons auto-sync from `public/logo.jpg` when running `dev` or `build`.
