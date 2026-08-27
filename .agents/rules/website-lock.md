# Website Protection Rule — DO NOT MODIFY

The following files and directories are **LOCKED** and must NOT be modified by any agent prompt unless the user **explicitly** says "unlock website" or "modify website":

## Protected Files (Website / Next.js Web App)

### Authentication
- `lib/actions/email-otp.ts` — Email OTP send/verify engine
- `lib/auth-store.ts` — Web auth store (Zustand)
- `components/auth/LoginModal.tsx` — Web login modal UI
- `app/api/auth/**` — All OAuth API routes
- `app/api/mobile/auth/**` — Mobile auth API routes

### Core Business Logic
- `lib/actions/` — All server actions
- `lib/prisma.ts` — Prisma client
- `prisma/schema.prisma` — Database schema

### Email & Rate Limiting
- `lib/rate-limit.ts` — Rate limiting engine
- `lib/email/` — Email templates and delivery

### Environment
- `.env` — Environment variables (NEVER expose secrets)

### Payments
- All Razorpay integration files

## Rules

1. **DO NOT** modify any protected file unless the user explicitly requests a website change.
2. **DO NOT** add, remove, or change authentication flows on the website.
3. **DO NOT** modify the Prisma schema without explicit user approval.
4. **DO NOT** change environment variables.
5. **DO NOT** alter the Resend email configuration or sender address.
6. **DO NOT** touch payment/Razorpay integration.
7. **DO NOT** change Google OAuth configuration.
8. Mobile app (`intrihub-mobile/`) changes are allowed — they do not affect the website.

## Current Verified State (2026-08-27)
- Resend domain `intrihub.com`: **VERIFIED**
- Sender: `Intrihub <noreply@intrihub.com>`
- Email OTP: **WORKING** (tested with external recipients)
- Google OAuth: **WORKING**
- Database: Neon PostgreSQL **SYNCED**
- Latest commit: `4f96d84`
