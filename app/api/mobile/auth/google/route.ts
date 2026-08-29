import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateMobileTokens, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import {
  checkVendorLoginLockout,
  recordVendorLoginFailure,
  resetVendorLoginLockout,
} from "@/lib/rate-limit";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { idToken, accessToken, profile: clientProfile, purpose = "customer" } = body;

    const isBusinessLogin = purpose === "business" || purpose === "vendor" || purpose === "admin";
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    // 1. Check IP lockout for business login attempts
    if (isBusinessLogin) {
      const lockoutCheck = checkVendorLoginLockout(clientIp);
      if (lockoutCheck.locked) {
        const mins = Math.floor((lockoutCheck.retryAfterSeconds || 0) / 60);
        const secs = (lockoutCheck.retryAfterSeconds || 0) % 60;
        const timeStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

        return mobileApiResponse(
          {
            success: false,
            error: `Too many failed attempts. Try again in ${timeStr}`,
            locked: true,
            lockoutUntil: lockoutCheck.lockoutUntil,
            retryAfterSeconds: lockoutCheck.retryAfterSeconds,
          },
          429
        );
      }
    }

    let email = clientProfile?.email;
    let name = clientProfile?.name;
    let avatar = clientProfile?.avatar || clientProfile?.picture;

    // Verify and fetch Google user info
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
      if (isBusinessLogin) {
        const failRecord = recordVendorLoginFailure(clientIp);
        if (failRecord.locked) {
          return mobileApiResponse(
            {
              success: false,
              error: "Too many failed attempts. Try again in 15:00",
              locked: true,
              lockoutUntil: failRecord.lockoutUntil,
              retryAfterSeconds: failRecord.retryAfterSeconds,
            },
            429
          );
        }
      }
      return mobileApiResponse(
        { success: false, error: "Could not verify Google account or retrieve email address" },
        400
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const syntheticPhone = `google_${cleanEmail.replace(/[^a-z0-9]/gi, "_")}`;

    // 2. Pre-verify Business Portal Access BEFORE creating any User records
    if (isBusinessLogin) {
      const allowedAdminEmail = (process.env.ADMIN_ALLOWED_EMAIL || "admin@intrihub.com").toLowerCase().trim();
      const isAdmin = cleanEmail === allowedAdminEmail;

      if (!isAdmin) {
        const matchedVendor = await prisma.vendor.findFirst({
          where: {
            OR: [
              { contactEmail: { equals: cleanEmail, mode: "insensitive" } },
              { owner: { email: { equals: cleanEmail, mode: "insensitive" } } },
            ],
          },
        });

        if (!matchedVendor) {
          const failRecord = recordVendorLoginFailure(clientIp);
          return mobileApiResponse(
            {
              success: false,
              reason: "NOT_FOUND",
              error: "This Google account isn't registered as an approved vendor partner on Intrihub Business.",
              email: cleanEmail,
              remainingAttempts: failRecord.remainingAttempts,
              locked: failRecord.locked,
            },
            403
          );
        }

        if (matchedVendor.status !== "approved") {
          const failRecord = recordVendorLoginFailure(clientIp);
          let reason = "UNAPPROVED";
          let msg = `Vendor account status is '${matchedVendor.status}'. Access denied before approval.`;
          if (matchedVendor.status === "pending") {
            reason = "PENDING_APPROVAL";
            msg = "Your vendor partner application is currently under review.";
          } else if (matchedVendor.status === "rejected") {
            reason = "REJECTED";
            msg = `Your vendor application was rejected.${matchedVendor.rejectionReason ? ` Reason: ${matchedVendor.rejectionReason}` : ""}`;
          } else if (matchedVendor.status === "suspended") {
            reason = "SUSPENDED";
            msg = "Your vendor account has been suspended. Please contact partner support.";
          }

          return mobileApiResponse(
            {
              success: false,
              reason,
              error: msg,
              email: cleanEmail,
              vendorName: matchedVendor.businessName,
              remainingAttempts: failRecord.remainingAttempts,
              locked: failRecord.locked,
            },
            403
          );
        }
      }
    }

    // 3. Lookup existing user
    const existingByEmail = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        vendor: true,
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
          vendor: true,
          addresses: {
            orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
          },
        },
      });
    } else {
      const existingByPhone = await prisma.user.findUnique({
        where: { phone: syntheticPhone },
        include: {
          vendor: true,
          addresses: true,
        },
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
            vendor: true,
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
            role: isBusinessLogin ? "vendor" : "customer",
          },
          include: {
            vendor: true,
            addresses: true,
          },
        });
      }
    }

    // 3. Business Login Security Whitelist Verification
    if (isBusinessLogin) {
      const allowedAdminEmail = (process.env.ADMIN_ALLOWED_EMAIL || "admin@intrihub.com").toLowerCase().trim();
      const isAdmin =
        (user.role === "admin" || user.role === "superadmin") &&
        user.email?.toLowerCase().trim() === allowedAdminEmail;

      if (!isAdmin) {
        let vendor = user.vendor;

        // Check if there is an approved Vendor with this contactEmail
        if (!vendor) {
          const matchedVendor = await prisma.vendor.findFirst({
            where: {
              OR: [
                { contactEmail: cleanEmail },
                { contactEmail: { equals: cleanEmail, mode: "insensitive" } },
              ],
            },
          });

          if (matchedVendor) {
            await prisma.vendor.update({
              where: { id: matchedVendor.id },
              data: { ownerId: user.id },
            });
            await prisma.user.update({
              where: { id: user.id },
              data: { role: "vendor" },
            });
            vendor = matchedVendor;
            user.role = "vendor";
          }
        }

        if (!vendor) {
          const failRecord = recordVendorLoginFailure(clientIp);
          return mobileApiResponse(
            {
              success: false,
              reason: "NOT_FOUND",
              error:
                "This Google account isn't registered as an approved vendor partner on Intrihub Business.",
              email: cleanEmail,
              remainingAttempts: failRecord.remainingAttempts,
              locked: failRecord.locked,
            },
            403
          );
        }

        if (vendor.status !== "approved") {
          const failRecord = recordVendorLoginFailure(clientIp);
          let msg = "Your vendor account is not approved.";
          let reason = "UNAPPROVED";
          if (vendor.status === "pending") {
            reason = "PENDING_APPROVAL";
            msg = "Your vendor partner application is currently under review by the Intrihub Admin team.";
          } else if (vendor.status === "suspended") {
            reason = "SUSPENDED";
            msg = "Your vendor store has been suspended. Please contact Intrihub Partner Support.";
          } else if (vendor.status === "rejected") {
            reason = "REJECTED";
            msg = `Your vendor application was not approved.${vendor.rejectionReason ? ` Reason: ${vendor.rejectionReason}` : " Please contact partner support."}`;
          }

          return mobileApiResponse(
            {
              success: false,
              reason,
              error: msg,
              vendorName: vendor.businessName,
              vendorStatus: vendor.status,
              remainingAttempts: failRecord.remainingAttempts,
              locked: failRecord.locked,
            },
            403
          );
        }
      }

      // Successful business login -> reset IP lockout
      resetVendorLoginLockout(clientIp);
    }

    const allowedAdminEmail = (process.env.ADMIN_ALLOWED_EMAIL || "admin@intrihub.com").toLowerCase().trim();
    let effectiveRole = user.role;
    if ((effectiveRole === "admin" || effectiveRole === "superadmin") && user.email?.toLowerCase().trim() !== allowedAdminEmail) {
      effectiveRole = "customer";
    }

    // 4. Generate standard JWT tokens for mobile
    const tokens = generateMobileTokens({
      id: user.id,
      role: effectiveRole,
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
        role: effectiveRole,
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
