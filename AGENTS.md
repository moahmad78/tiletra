<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Security & Secret Masking Rule
- **NEVER** print, log, or output raw API tokens, secret keys, or passwords in terminal outputs, script logs, or user messages.
- Always mask sensitive credentials (e.g. `EAA5e9...xxxx`, `rzp_live_...xxxx`, `re_eDQ...xxxx`).

# Project Scope & Lock Rules (ACTIVE)
- **LOCKED (NO CHANGES):** 
  - User Mobile App (`intrihub-mobile/`) is LOCKED. Do not make any edits or changes.
  - Website / Web Customer Portal (`app/`, `components/`, `public/`, etc.) is LOCKED. Do not make changes.
- **ACTIVE WORKING DIRECTORY:** 
  - All current changes and features MUST be restricted ONLY to the Business App (`intrihub-business/`).
