import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

export async function GET() {
  const testError = new Error("Sentry Test Verification Error — Intrihub Live Monitoring");
  
  Sentry.captureException(testError, {
    tags: {
      environment: process.env.NODE_ENV || "development",
      type: "manual_verification",
    },
    extra: {
      timestamp: new Date().toISOString(),
      source: "/api/sentry-test",
    },
  });

  return NextResponse.json({
    success: true,
    message: "Sentry test error captured and sent. Check your Sentry Issues dashboard!",
    timestamp: new Date().toISOString(),
  });
}
