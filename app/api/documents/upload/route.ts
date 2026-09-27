import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/autobot/supabase";
import { getOrCreateDefaultProfile } from "@/lib/autobot/profile";
import { GoogleGenerativeAI } from "@google/generative-ai";

function chunkText(text: string, chunkSize = 800, overlap = 100): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize));
    i += chunkSize - overlap;
  }
  return chunks;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const providedApiKey = formData.get("gemini_api_key") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const profile = await getOrCreateDefaultProfile();
    if (!profile) {
      return NextResponse.json({ error: "No profile found" }, { status: 404 });
    }

    const apiKey = providedApiKey || profile.gemini_api_key || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Google Gemini API Key is required to index catalog." }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    let extractedText = "";

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "txt" || ext === "md" || ext === "csv") {
      extractedText = fileBuffer.toString("utf-8");
    } else {
      extractedText = fileBuffer.toString("utf-8");
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({ error: "Could not extract text from document." }, { status: 400 });
    }

    const chunks = chunkText(extractedText);
    if (chunks.length === 0) {
      return NextResponse.json({ error: "Document content was too short." }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

    let insertedCount = 0;

    for (const chunk of chunks) {
      try {
        const result = await model.embedContent(chunk);
        const embedding = result.embedding.values;

        const { error } = await supabaseAdmin.from("knowledge_base").insert({
          user_id: profile.id,
          file_name: file.name,
          content: chunk,
          embedding: embedding,
        });

        if (!error) {
          insertedCount++;
        } else {
          console.error("Failed to insert chunk embedding:", error);
        }
      } catch (embErr) {
        console.error("Embedding generation error for chunk:", embErr);
      }
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      chunksInserted: insertedCount,
      totalChunks: chunks.length,
    });
  } catch (error: any) {
    console.error("Upload route error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
