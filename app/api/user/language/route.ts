import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LANGUAGE_COOKIE, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from "@/lib/i18n/config";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (userId && !userId.startsWith("usr-")) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { language: true },
      });
      if (user?.language) {
        return NextResponse.json({ success: true, language: user.language });
      }
    }

    const cookieLang = req.cookies.get(LANGUAGE_COOKIE)?.value;
    const resolved = SUPPORTED_LANGUAGES.some((l) => l.code === cookieLang)
      ? cookieLang
      : DEFAULT_LANGUAGE;

    return NextResponse.json({ success: true, language: resolved });
  } catch (err: any) {
    return NextResponse.json({ success: false, language: DEFAULT_LANGUAGE }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { language, userId } = body;

    const isValid = SUPPORTED_LANGUAGES.some((l) => l.code === language);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid language. Supported: en, hi, kn" },
        { status: 400 }
      );
    }

    if (userId && !userId.startsWith("usr-")) {
      await prisma.user.update({
        where: { id: userId },
        data: { language },
      });
    }

    const res = NextResponse.json({ success: true, language });
    res.cookies.set(LANGUAGE_COOKIE, language, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });

    return res;
  } catch (err: any) {
    console.error("Language update error:", err);
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
