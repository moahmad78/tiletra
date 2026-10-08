import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const envFingerprints = process.env.APP_SIGNING_SHA256?.trim();
  const fingerprints: string[] = envFingerprints
    ? envFingerprints
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [
        // Placeholder until user provides APP_SIGNING_SHA256
        "14:6D:E9:7D:0F:52:AB:E0:5F:AE:D3:21:40:E1:92:0B:4F:9C:23:4E:91:0F:7A:B3:C2:5E:D4:2B:6A:E7:8C:91",
      ];

  const assetLinks = [
    {
      relation: [
        "delegate_permission/common.handle_all_urls",
        "delegate_permission/common.get_login_creds",
      ],
      target: {
        namespace: "android_app",
        package_name: "com.intrihub.app",
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ];

  return NextResponse.json(assetLinks, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
