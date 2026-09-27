import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getOrCreateDefaultProfile } from "@/lib/profile";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

// Define a chunking function with reasonable overlap
function chunkText(text: string, chunkSize = 800, overlap = 100): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const chunk = text.slice(i, i + chunkSize).trim();
    if (chunk.length > 20) {
      chunks.push(chunk);
    }
    i += chunkSize - overlap;
  }
  return chunks;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    let apiKey = formData.get("gemini_api_key") as string;

    const profile = await getOrCreateDefaultProfile();
    if (!profile) {
      return new NextResponse("Business profile could not be resolved or created", { status: 500 });
    }

    if (!apiKey) {
      apiKey = profile.gemini_api_key || process.env.GEMINI_API_KEY || "";
    }

    if (!file || !apiKey) {
      return new NextResponse("File and Gemini API Key are required", { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = "";

    // 1. Extract Text
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      const pdfParser = new PDFParse({ data: buffer });
      const data = await pdfParser.getText();
      extractedText = data.text;
    } else if (
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith(".docx")
    ) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      extractedText = buffer.toString("utf-8");
    } else {
      return new NextResponse("Unsupported file type. Please upload PDF, DOCX, TXT, or MD files.", { status: 400 });
    }

    if (!extractedText || !extractedText.trim()) {
      return new NextResponse("No readable text could be extracted from the document", { status: 400 });
    }

    // 2. Chunk Text
    const chunks = chunkText(extractedText);
    if (chunks.length === 0) {
      return new NextResponse("Document content was too short to generate chunks", { status: 400 });
    }

    // 3. Generate Embeddings and Save to Supabase
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

    return new NextResponse(
      JSON.stringify({
        success: true,
        fileName: file.name,
        chunksProcessed: chunks.length,
        chunksInserted: insertedCount,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Document upload error:", error);
    return new NextResponse("Internal Server Error: " + (error instanceof Error ? error.message : "Unknown"), {
      status: 500,
    });
  }
}
