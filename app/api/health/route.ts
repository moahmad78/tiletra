import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "healthy";
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch (error) {
    dbStatus = "unreachable";
    console.error("[HealthCheck] Database connection error:", error);
  }

  const isHealthy = dbStatus === "healthy";
  const totalResponseTimeMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: isHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      responseTimeMs: totalResponseTimeMs,
      services: {
        webServer: "healthy",
        database: dbStatus,
        dbLatencyMs: isHealthy ? dbLatencyMs : undefined,
      },
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    }
  );
}
