import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await (prisma.storeSettings as any).findFirst({
      select: { appInstallPromptEnabled: true },
    });
    const enabled = settings ? (settings as any).appInstallPromptEnabled !== false : true;
    return NextResponse.json(
      { enabled },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ enabled: true });
  }
}
