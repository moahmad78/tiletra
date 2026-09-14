import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://1cbe738f4586b8e9bb9d55840396ee51@o4512085765521408.ingest.us.sentry.io/4512085786558464",
  // Capture 100% of transactions for tracing in initial setup
  tracesSampleRate: 1.0,
  // Setting this to false in production to avoid console clutter
  debug: false,
});
