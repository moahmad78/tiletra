# Website & Customer User App Protection Rule — STRICTLY LOCKED

The following directories and files are **STRICTLY LOCKED** and must NOT be modified by any agent prompt under any circumstance unless the user **explicitly** commands "unlock website" or "unlock intrihub-mobile":

---

## 1. Protected System 1: Intrihub Website (Next.js Web App)
**LOCKED ROOT**: `d:\Intrihub\` (excluding `intrihub-business/`)

### Protected Components & Routes
- `app/` (all consumer pages, shop, checkout, cart, product pages, vendor web pages)
- `components/` (all UI components, location pickers, reviews, auth modals, checkout)
- `lib/` (all server actions, auth engine `lib/actions/email-otp.ts`, prisma client, rate limiter)
- `prisma/schema.prisma` (Database schema)
- `.env` (Environment variables and secrets)
- `public/` (Web public assets and branding)
- `server.ts` & `package.json`

---

## 2. Protected System 2: Intrihub Customer User Mobile App
**LOCKED ROOT**: `d:\Intrihub\intrihub-mobile\`

### Protected Mobile Components & Routes
- `intrihub-mobile/app/` (all customer tabs, explore, cart, orders, profile, auth login)
- `intrihub-mobile/src/` (components, animated splash screen, address modal, stores, hooks)
- `intrihub-mobile/assets/` (production white icon, splash, logos)
- `intrihub-mobile/app.json`, `eas.json`, `package.json`

---

## 3. Allowed Active Workspace
**ACTIVE ONLY**: `d:\Intrihub\intrihub-business\`
- All vendor dashboard, admin consoles, product management, order processing, and business APK features.

---

## Mandatory Guardrail Rules
1. **DO NOT** edit, overwrite, format, or delete any file in `d:\Intrihub\intrihub-mobile\` or website root.
2. **DO NOT** alter database schemas, prisma models, or existing shared backend APIs.
3. **DO NOT** modify authentication tokens or customer-facing business logic.
4. Any change must be strictly isolated to `d:\Intrihub\intrihub-business\`.
