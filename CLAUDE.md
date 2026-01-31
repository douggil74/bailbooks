# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains two products for a bail bonds business (Bailbonds Financed) serving St. Tammany Parish, Louisiana:

1. **Main Website** - Next.js marketing site with quote calculator, case tracker, and lead capture
2. **Recovery App** (`/recovery-app`) - Expo/React Native mobile app for licensed bail recovery professionals

## Tech Stack

- **Next.js 16** with App Router, **React 19**, **TypeScript 5.9**
- **Tailwind CSS 4** for styling
- **Vercel Postgres** for database
- **OpenAI** (gpt-4o-mini) for payment recommendations
- **Resend** for email notifications
- **Firebase** for authentication/data

## Development Commands

```bash
npm run dev      # Start Next.js dev server
npm run build    # Production build
npm run lint     # Run linter
npm start        # Start production server
```

For the mobile app:
```bash
cd recovery-app
npm start        # Start Expo dev server
```

## Architecture

### Main Website (`/app`)

Uses Next.js App Router structure:
- `app/page.tsx` - Homepage with hero, services, testimonials, lead capture form
- `app/quote/` - Bond quote calculator with AI-powered payment recommendations
- `app/tracker/` - Case tracking interface (Postgres-backed)
- `app/api/recommend/` - OpenAI payment term recommendations
- `app/api/bonds/` - Bond CRUD operations
- `app/api/lead/` - Lead capture + Resend email
- `app/api/risk/` - Risk assessment

### Recovery App (`/recovery-app`)

Standalone Expo app with its own architecture (see `/recovery-app/ARCHITECTURE.md`):
- Passcode/biometric auth with AES-256 encryption
- SQLite for local encrypted storage
- PDF analysis and AI-powered recovery briefs

## Styling Conventions

Custom Tailwind theme colors:
- Primary green: `#1a4d2e` (use `bg-[#1a4d2e]`, `text-[#1a4d2e]`)
- Gold accent: `#d4af37` (use `bg-[#d4af37]`, `text-[#d4af37]`)
- Font: Inter (Google Fonts)

## Path Aliases

TypeScript path alias configured: `@/*` maps to project root.

## Environment Variables

Required in `.env.local`:
- `OPENAI_API_KEY` - For payment recommendations
- `POSTGRES_URL` - Vercel Postgres connection
- `RESEND_API_KEY` - Email notifications
- `ADMIN_EMAIL` - Lead notification recipient
