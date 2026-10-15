import { NextRequest, NextResponse } from "next/server";

function performLogout(req: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully.",
  });

  const cookiesToClear = [
    "intrihub_token",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "intrihub_session",
    "intrihub_admin_token",
    "intrihub_vendor_token",
    "oauth_state",
  ];

  cookiesToClear.forEach((name) => {
    response.cookies.set(name, "", {
      maxAge: 0,
      path: "/",
      expires: new Date(0),
    });
  });

  return response;
}

export async function POST(req: NextRequest) {
  return performLogout(req);
}

export async function GET(req: NextRequest) {
  return performLogout(req);
}
