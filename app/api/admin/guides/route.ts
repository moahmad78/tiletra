import { NextRequest, NextResponse } from "next/server";
import { requireAdminAction } from "@/lib/admin-guard";
import {
  getGuidePosts,
  createGuidePost,
  seedInitialGuidesIfEmpty,
  GuidePostInput,
} from "@/lib/actions/guides";

export async function GET() {
  try {
    await requireAdminAction();
    await seedInitialGuidesIfEmpty();
    const guides = await getGuidePosts();
    return NextResponse.json({ success: true, guides });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Unauthorized" },
      { status: err.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminAction();
    const body: GuidePostInput = await req.json();
    const guide = await createGuidePost(body);
    return NextResponse.json({ success: true, guide });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create guide post" },
      { status: 500 }
    );
  }
}
