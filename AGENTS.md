<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Security & Secret Masking Rule
- **NEVER** print, log, or output raw API tokens, secret keys, or passwords in terminal outputs, script logs, or user messages.
- Always mask sensitive credentials (e.g. `EAA5e9...xxxx`, `rzp_live_...xxxx`, `re_eDQ...xxxx`).

