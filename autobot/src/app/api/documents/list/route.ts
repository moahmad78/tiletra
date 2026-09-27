import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getOrCreateDefaultProfile } from "@/lib/profile";

export async function GET() {
  try {
    const profile = await getOrCreateDefaultProfile();
    if (!profile) {
      return NextResponse.json({ documents: [] }, { status: 200 });
    }

    const { data: chunks, error } = await supabaseAdmin
      .from("knowledge_base")
      .select("id, file_name, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch knowledge base error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group chunks by file_name
    const fileMap: { [fileName: string]: { fileName: string; chunkCount: number; createdAt: string } } = {};
    for (const chunk of chunks || []) {
      const name = chunk.file_name || "Untitled Document";
      if (!fileMap[name]) {
        fileMap[name] = {
          fileName: name,
          chunkCount: 1,
          createdAt: chunk.created_at,
        };
      } else {
        fileMap[name].chunkCount++;
      }
    }

    const documents = Object.values(fileMap);
    return NextResponse.json({ documents });
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
      return NextResponse.json({ error: "fileName query parameter is required" }, { status: 400 });
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
      console.error("Delete knowledge base chunks error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Deleted ${fileName} chunks.` });
  } catch (error) {
    console.error("DELETE /api/documents/list error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
