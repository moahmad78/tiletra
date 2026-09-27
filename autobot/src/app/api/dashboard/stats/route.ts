import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getOrCreateDefaultProfile } from "@/lib/profile";

export async function GET() {
  try {
    const profile = await getOrCreateDefaultProfile();
    
    // 1. Total Chats
    const { count: totalChats, error: chatsErr } = await supabaseAdmin
      .from("chats")
      .select("*", { count: "exact", head: true });

    // 2. Active Sessions (Chats updated in last 24 hours)
    const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: activeChats } = await supabaseAdmin
      .from("chats")
      .select("*", { count: "exact", head: true })
      .gte("last_message_at", past24h);

    // 3. AI Mode Chats vs Human Mode Chats
    const { count: aiChatsCount } = await supabaseAdmin
      .from("chats")
      .select("*", { count: "exact", head: true })
      .eq("chat_mode", "ai");

    // 4. Messages Breakdown (AI vs Human Agent vs Customer)
    const { data: messages } = await supabaseAdmin
      .from("messages")
      .select("sender, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    const totalMessages = messages?.length || 0;
    const aiMessages = messages?.filter((m) => m.sender === "ai").length || 0;
    const humanMessages = messages?.filter((m) => m.sender === "human_agent").length || 0;
    const customerMessages = messages?.filter((m) => m.sender === "customer").length || 0;

    // AI resolution rate: AI responses / Total outbound responses
    const totalOutbound = aiMessages + humanMessages;
    const aiResolutionRate = totalOutbound > 0 ? Math.round((aiMessages / totalOutbound) * 100) : (totalChats && totalChats > 0 ? 90 : 0);

    // 5. Knowledge Base Chunks
    const { count: totalKnowledgeChunks } = await supabaseAdmin
      .from("knowledge_base")
      .select("*", { count: "exact", head: true });

    // 6. Recent Chats
    const { data: recentChats } = await supabaseAdmin
      .from("chats")
      .select("id, customer_phone, customer_name, chat_mode, last_message_at")
      .order("last_message_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      totalChats: totalChats || 0,
      activeChats: activeChats || 0,
      aiResolutionRate: `${aiResolutionRate}%`,
      totalMessages,
      aiMessages,
      humanMessages,
      customerMessages,
      totalKnowledgeChunks: totalKnowledgeChunks || 0,
      recentChats: recentChats || [],
      businessName: profile?.business_name || "Intrihub",
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
