import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("intrihub_help_session");

  if (session?.value === "authenticated_info_intrihub") {
    return NextResponse.json({
      authenticated: true,
      email: "info@intrihub.com",
    });
  }

  return NextResponse.json({
    authenticated: false,
  });
}
