import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/autobot/supabase";
import { getOrCreateDefaultProfile } from "@/lib/autobot/profile";

export async function GET() {
  try {
    const profile = await getOrCreateDefaultProfile();
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { business_name, gemini_api_key, global_system_prompt, default_mode } = body;

    const profile = await getOrCreateDefaultProfile();
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { data: updatedProfile, error } = await supabaseAdmin
      .from("profiles")
      .update({
        business_name: business_name ?? profile.business_name,
        gemini_api_key: gemini_api_key ?? profile.gemini_api_key,
        global_system_prompt: global_system_prompt ?? profile.global_system_prompt,
        default_mode: default_mode ?? profile.default_mode,
      })
      .eq("id", profile.id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update profile error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.error("POST /api/settings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
