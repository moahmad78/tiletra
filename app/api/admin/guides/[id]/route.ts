import { NextRequest, NextResponse } from "next/server";
import { requireAdminAction } from "@/lib/admin-guard";
import {
  getGuidePostById,
  updateGuidePost,
  deleteGuidePost,
  GuidePostInput,
} from "@/lib/actions/guides";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAction();
    const { id } = await params;
    const guide = await getGuidePostById(id);
    if (!guide) {
      return NextResponse.json({ success: false, error: "Guide not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, guide });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Unauthorized" },
      { status: err.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAction();
    const { id } = await params;
    const body: GuidePostInput = await req.json();
    const guide = await updateGuidePost(id, body);
    return NextResponse.json({ success: true, guide });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update guide post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAction();
    const { id } = await params;
    await deleteGuidePost(id);
    return NextResponse.json({ success: true, message: "Guide post deleted" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete guide post" },
      { status: 500 }
    );
  }
}
