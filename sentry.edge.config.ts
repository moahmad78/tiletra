import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || "https://1cbe738f4586b8e9bb9d55840396ee51@o4512085765521408.ingest.us.sentry.io/4512085786558464",
  tracesSampleRate: 1.0,
  debug: false,
});
