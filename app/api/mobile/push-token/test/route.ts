import { NextRequest } from "next/server";
import { POST as handleTestPush, OPTIONS as handleCors } from "@/app/api/mobile/push/test/route";

export async function OPTIONS() {
  return handleCors();
}

/**
 * Backward-compatible endpoint for existing apps calling /api/mobile/push-token/test.
 */
export async function POST(req: NextRequest) {
  return handleTestPush(req);
}
