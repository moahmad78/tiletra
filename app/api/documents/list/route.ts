import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/autobot/supabase";
import { getOrCreateDefaultProfile } from "@/lib/autobot/profile";

export async function GET() {
  try {
    const profile = await getOrCreateDefaultProfile();
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { data: chunks, error } = await supabaseAdmin
      .from("knowledge_base")
      .select("file_name, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("List documents error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const grouped: Record<string, { fileName: string; chunkCount: number; createdAt: string }> = {};
    for (const c of chunks || []) {
      if (!grouped[c.file_name]) {
        grouped[c.file_name] = {
          fileName: c.file_name,
          chunkCount: 1,
          createdAt: c.created_at,
        };
      } else {
        grouped[c.file_name].chunkCount++;
      }
    }

    return NextResponse.json({ documents: Object.values(grouped) });
  } catch (error) {
    console.error("GET /api/documents/list error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("fileName");

    if (!fileName) {
      return NextResponse.json({ error: "Missing fileName parameter" }, { status: 400 });
    }

    const profile = await getOrCreateDefaultProfile();
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from("knowledge_base")
      .delete()
      .eq("user_id", profile.id)
      .eq("file_name", fileName);

    if (error) {
      console.error("Delete document error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/documents/list error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
