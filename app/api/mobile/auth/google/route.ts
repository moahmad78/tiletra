import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateMobileTokens, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { idToken, accessToken, profile: clientProfile } = body;

    let email = clientProfile?.email;
    let name = clientProfile?.name;
    let avatar = clientProfile?.avatar || clientProfile?.picture;

    // 1. If accessToken provided, verify and fetch Google userinfo
    if (accessToken && !email) {
      try {
        const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (googleRes.ok) {
          const info = await googleRes.json();
          email = info.email;
          name = info.name || name;
          avatar = info.picture || avatar;
        }
      } catch (e) {
        console.error("Google userinfo fetch failed:", e);
      }
    }

    // 2. If idToken provided and email not yet resolved, verify via tokeninfo
    if (idToken && !email) {
      try {
        const tokenRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
        if (tokenRes.ok) {
          const info = await tokenRes.json();
          email = info.email;
          name = info.name || name;
          avatar = info.picture || avatar;
        }
      } catch (e) {
        console.error("Google tokeninfo verify failed:", e);
      }
    }

    if (!email || typeof email !== "string") {
      return mobileApiResponse(
        { success: false, error: "Could not verify Google account or retrieve email address" },
        400
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const syntheticPhone = `google_${cleanEmail.replace(/[^a-z0-9]/gi, "_")}`;

    // 3. Upsert user in database
    const existingByEmail = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        addresses: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        },
      },
    });

    let user: any = null;

    if (existingByEmail) {
      const shouldUpdateName = name && (!existingByEmail.name || existingByEmail.name.startsWith("User "));
      const shouldUpdateAvatar = avatar && !existingByEmail.avatar;

      user = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          emailVerified: true,
          authProvider: (existingByEmail as any).authProvider || "google",
          name: shouldUpdateName ? name : undefined,
          avatar: shouldUpdateAvatar ? avatar : undefined,
        },
        include: {
          addresses: {
            orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
          },
        },
      });
    } else {
      const existingByPhone = await prisma.user.findUnique({
        where: { phone: syntheticPhone },
        include: { addresses: true },
      });

      if (existingByPhone) {
        user = await prisma.user.update({
          where: { id: existingByPhone.id },
          data: {
            email: cleanEmail,
            emailVerified: true,
            authProvider: "google",
            name: name || existingByPhone.name,
            avatar: avatar || existingByPhone.avatar,
          },
          include: {
            addresses: {
              orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
            },
          },
        });
      } else {
        user = await prisma.user.create({
          data: {
            email: cleanEmail,
            phone: syntheticPhone,
            name: name || cleanEmail.split("@")[0],
            avatar: avatar || null,
            emailVerified: true,
            phoneVerified: false,
            authProvider: "google",
            role: "customer",
          },
          include: {
            addresses: true,
          },
        });
      }
    }

    // 4. Generate standard JWT tokens for mobile
    const tokens = generateMobileTokens({
      id: user.id,
      role: user.role,
      email: user.email,
      phone: user.phone,
      name: user.name,
    });

    return mobileApiResponse({
      success: true,
      message: "Google login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        phoneVerified: user.phoneVerified,
        emailVerified: user.emailVerified,
        addresses: user.addresses,
      },
      tokens,
    });
  } catch (err: any) {
    console.error("Mobile Google auth error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to authenticate with Google" },
      500
    );
  }
}
