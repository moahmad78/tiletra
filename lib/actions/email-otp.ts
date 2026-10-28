"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { deliverEmail, getFormattedFromEmail, maskEmail } from "@/lib/mail";
import { renderOtpEmailHtml } from "@/lib/email-templates";

export { deliverEmail, getFormattedFromEmail, maskEmail };

const OTP_EXPIRY_MINUTES = 10; // 10 minutes standard per security & OTP configuration requirement

export type OtpPurpose = "customer" | "admin" | "vendor" | "business";

function generateSecureOtp(): string {
  // Cryptographically secure 6-digit numeric OTP
  return crypto.randomInt(100000, 1000000).toString();
}

async function setWebAuthCookies(
  user: {
    id: string;
    email?: string | null;
    phone?: string | null;
    name?: string | null;
    avatar?: string | null;
    phoneVerified?: boolean;
    createdAt?: Date | string;
  },
  role: string,
  vendorId?: string
) {
  try {
    const { cookies } = await import("next/headers");
    const {
      generateCustomerSessionToken,
      generateAdminSessionToken,
      generateVendorSessionToken,
    } = await import("@/lib/server-auth");

    const cookieStore = await cookies();
    const isProd = process.env.NODE_ENV === "production";
    const emailOrPhone = user.email || user.phone || "";

    // ── ISOLATED ROLE AUTH ──
    // Admin, Vendor, and CPO portals have dedicated, isolated cookie namespaces.
    // They MUST NEVER touch or overwrite the customer session cookies
    // (intrihub_token, intrihub_session, next-auth.session-token).
    // This allows an admin/vendor to be logged into /admin or /vendor in one tab
    // while remaining logged into the customer storefront (intrihub.com) with their
    // customer account in another tab on the same browser.

    if (role === "admin" || role === "superadmin") {
      const adminToken = generateAdminSessionToken(user.id, user.email || "");
      cookieStore.set("intrihub_admin_token", adminToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
      cookieStore.set(
        "intrihub_admin_session",
        JSON.stringify({
          userId: user.id,
          email: user.email,
          role: "admin",
          verifiedAt: new Date().toISOString(),
        }),
        {
          httpOnly: true,
          secure: isProd,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        }
      );
      return;
    }

    if (role === "vendor" && vendorId) {
      const vendorToken = generateVendorSessionToken(
        vendorId,
        user.id,
        user.email || ""
      );
      cookieStore.set("intrihub_vendor_token", vendorToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
      return;
    }

    if (role === "cpo") {
      try {
        const { generateCpoSessionToken } = await import("@/lib/cpo/auth");
        const { CPO_SESSION_COOKIE } = await import(
          "@/lib/config/cpo-permissions"
        );
        const cpoToken = await generateCpoSessionToken(user.id, user.email || "");
        cookieStore.set(CPO_SESSION_COOKIE, cpoToken, {
          httpOnly: true,
          secure: isProd,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        });
      } catch (cpoErr) {
        console.error("Failed to generate CPO session token:", cpoErr);
      }
      return;
    }

    // ── CUSTOMER ONLY ──
    // 1. Signed customer session token (for server actions & API endpoints)
    const custToken = generateCustomerSessionToken(user.id, emailOrPhone, role);
    cookieStore.set("intrihub_token", custToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    // 2. NextAuth compatibility cookies
    cookieStore.set("next-auth.session-token", custToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    if (isProd) {
      cookieStore.set("__Secure-next-auth.session-token", custToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }

    // 3. Client-accessible JSON session payload for instant Zustand store hydration
    const sessionPayload = JSON.stringify({
      userId: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      phone: user.phone,
      phoneVerified: Boolean(user.phoneVerified),
      createdAt: user.createdAt
        ? new Date(user.createdAt).toISOString()
        : new Date().toISOString(),
    });
    const encodedSession = Buffer.from(sessionPayload).toString("base64url");
    cookieStore.set("intrihub_session", encodedSession, {
      httpOnly: false,
      secure: isProd,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
  } catch (err) {
    console.warn("[setWebAuthCookies] Non-request context or cookie error:", err);
  }
}

// ─── Email Delivery Layer (Titan Mail SMTP via lib/mail.ts) ───────────────────
// deliverEmail is imported and re-exported from @/lib/mail above.

// ─── Send OTP ────────────────────────────────────────────────────────────────

export async function sendEmailOtp(
  email: string,
  purpose: OtpPurpose = "customer",
  lang?: string
): Promise<{ success: boolean; message: string; expiresIn?: number }> {
  const cleanEmail = (email || "").trim().toLowerCase();
  console.log(`[OTP_REQUEST_STARTED] email=${maskEmail(cleanEmail)} purpose=${purpose} lang=${lang || "auto"}`);

  const { validateEmail } = await import("@/lib/validators");
  if (!validateEmail(cleanEmail)) {
    return { success: false, message: "Please enter a valid email address." };
  }

  // Strict role-based verification before generating or sending any OTP
  if (purpose === "admin") {
    const { STRICT_ADMIN_EMAIL } = await import("@/lib/admin-constants");
    const adminUser = await prisma.user.findFirst({
      where: {
        email: { equals: cleanEmail, mode: "insensitive" },
        role: { in: ["admin", "ADMIN", "superadmin"] },
      },
    });

    if (!adminUser || cleanEmail !== STRICT_ADMIN_EMAIL.toLowerCase()) {
      return { success: false, message: "Access Denied: Unauthorized admin credentials. User is not registered with ADMIN role." };
    }
  } else if (purpose === "vendor" || purpose === "business") {
    const allowedAdminEmail = (process.env.ADMIN_ALLOWED_EMAIL || "admin@intrihub.com").toLowerCase().trim();
    const cleanEmailLower = cleanEmail.toLowerCase();
    const isExplicitAdmin = cleanEmailLower === allowedAdminEmail;

    const adminOrCpoUser = !isExplicitAdmin
      ? await prisma.user.findFirst({
          where: {
            email: { equals: cleanEmailLower, mode: "insensitive" },
            role: { in: ["admin", "superadmin", "cpo", "ADMIN", "SUPERADMIN", "CPO"] },
          },
        })
      : null;

    if (!isExplicitAdmin && !adminOrCpoUser) {
      const vendorRecord = await prisma.vendor.findFirst({
        where: {
          OR: [
            { contactEmail: { equals: cleanEmailLower, mode: "insensitive" } },
            { owner: { email: { equals: cleanEmailLower, mode: "insensitive" } } },
          ],
        },
      });

      const vendorUser = !vendorRecord
        ? await prisma.user.findFirst({
            where: {
              email: { equals: cleanEmailLower, mode: "insensitive" },
              role: { in: ["vendor", "VENDOR"] },
            },
          })
        : null;

      if (!vendorRecord && !vendorUser) {
        return { success: false, message: "Access Denied: Email not registered as a vendor, CPO or admin." };
      }

      if (vendorRecord && vendorRecord.status !== "approved") {
        return {
          success: false,
          message:
            vendorRecord.status === "pending"
              ? "Your vendor application is currently under review."
              : `Access Denied: Vendor account status is ${vendorRecord.status}.`,
        };
      }
    }
  }

  // Google Play Console App Review Bypass (Zero MFA / Self-Contained Testing)
  const isReviewerAllowed = process.env.NODE_ENV !== "production" || process.env.ENABLE_REVIEWER_BYPASS === "true";
  if (isReviewerAllowed) {
    const { isPlayReviewerEmail, ensurePlayReviewerAccounts } = await import("@/lib/auth/reviewer-bypass");
    if (isPlayReviewerEmail(cleanEmail)) {
    await ensurePlayReviewerAccounts();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    try {
      await prisma.emailOtpToken.deleteMany({ where: { email: cleanEmail } });
      await prisma.emailOtpToken.create({
        data: {
          email: cleanEmail,
          otp: "123456",
          expiresAt,
          used: false,
        },
      });
    } catch {}
    console.log(`[PLAY_REVIEWER_OTP_BYPASS] Generated static test OTP for ${cleanEmail}`);
    return {
      success: true,
      message: "Verification code sent successfully to your email address.",
      expiresIn: OTP_EXPIRY_MINUTES * 60,
    };
  }
  }

  const { checkRateLimit } = await import("@/lib/rate-limit");

  // 1. Cooldown limit: 1 request every 60 seconds
  const cooldownCheck = checkRateLimit(`otp-cooldown:${cleanEmail}`, 1, 60 * 1000);
  if (!cooldownCheck.allowed) {
    const secondsRemaining = Math.max(1, Math.ceil((cooldownCheck.resetTime - Date.now()) / 1000));
    return {
      success: false,
      message: `Please wait ${secondsRemaining}s before requesting another verification code.`,
    };
  }

  // 2. Hourly rate limit: max 5 OTP requests per hour
  const hourlyCheck = checkRateLimit(`otp-hourly:${cleanEmail}`, 5, 60 * 60 * 1000);
  if (!hourlyCheck.allowed) {
    return {
      success: false,
      message: "Too many verification requests. Please try again after an hour.",
    };
  }

  console.log(`[OTP_GENERATION_STARTED] email=${maskEmail(cleanEmail)}`);
  const otp = generateSecureOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Store OTP token in Database
  try {
    // Invalidate any previous OTP tokens for this email
    await prisma.emailOtpToken.deleteMany({
      where: { email: cleanEmail },
    });

    await prisma.emailOtpToken.create({
      data: {
        email: cleanEmail,
        otp,
        expiresAt,
        used: false,
      },
    });
    console.log(`[OTP_STORAGE_SUCCESS] email=${maskEmail(cleanEmail)} expiresIn=${OTP_EXPIRY_MINUTES * 60}s`);
  } catch (dbErr: unknown) {
    const err = dbErr as { message?: string } | null;
    console.error(`[OTP_STORAGE_FAILED] email=${maskEmail(cleanEmail)} error=${err?.message}`);
    return {
      success: false,
      message: "Failed to initialize verification code. Database error occurred.",
    };
  }

  // Resolve user preferred language
  let resolvedLang = lang;
  if (!resolvedLang) {
    try {
      const userRec = await prisma.user.findFirst({
        where: { email: { equals: cleanEmail, mode: "insensitive" } },
        select: { language: true },
      });
      resolvedLang = userRec?.language || "en";
    } catch {
      resolvedLang = "en";
    }
  }

  const emailCopies: Record<string, { subject: string; title: string; desc: string; expire: string; note: string; footer: string }> = {
    en: {
      subject: "Your Intrihub Login Verification Code",
      title: "Your Login Verification Code",
      desc: "Use the 6-digit code below to securely sign into your Intrihub account.",
      expire: `⏱ This code will expire in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.<br />For security, never share this code with anyone.`,
      note: "Every Material. Every Space.",
      footer: "If you did not request this verification code, you can safely ignore this email.",
    },
    hi: {
      subject: "आपका Intrihub लॉगिन सत्यापन कोड (OTP)",
      title: "लॉगिन सत्यापन कोड",
      desc: "अपने Intrihub खाते में सुरक्षित रूप से साइन इन करने के लिए नीचे दिए गए 6-अंकों के कोड का उपयोग करें।",
      expire: `⏱ यह कोड <strong>${OTP_EXPIRY_MINUTES} मिनट</strong> में समाप्त हो जाएगा।<br />सुरक्षा के लिए, यह कोड कभी किसी के साथ साझा न करें।`,
      note: "हर सामग्री। हर स्पेस।",
      footer: "यदि आपने इस सत्यापन कोड का अनुरोध नहीं किया है, तो आप इस ईमेल को अनदेखा कर सकते हैं।",
    },
    kn: {
      subject: "ನಿಮ್ಮ Intrihub ಲಾಗಿನ್ ಪರಿಶೀಲನಾ ಕೋಡ್ (OTP)",
      title: "ಲಾಗಿನ್ ಪರಿಶೀಲನಾ ಕೋಡ್",
      desc: "ನಿಮ್ಮ Intrihub ಖಾತೆಗೆ ಸುರಕ್ಷಿತವಾಗಿ ಸೈನ್ ಇನ್ ಮಾಡಲು ಕೆಳಗಿನ 6-ಅಂಕಿಯ ಕೋಡ್ ಬಳಸಿ.",
      expire: `⏱ ಈ ಕೋಡ್ <strong>${OTP_EXPIRY_MINUTES} ನಿಮಿಷಗಳಲ್ಲಿ</strong> ಮುಕ್ತಾಯಗೊಳ್ಳುತ್ತದೆ.<br />ಭದ್ರತೆಗಾಗಿ, ಈ ಕೋಡ್ ಅನ್ನು ಯಾರೊಂದಿಗೂ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.`,
      note: "ಪ್ರತಿ ಸಾಮಗ್ರಿ. ಪ್ರತಿ ಜಾಗ.",
      footer: "ನೀವು ಈ ಪರಿಶೀಲನಾ ಕೋಡ್ ಅನ್ನು ವಿನಂತಿಸದಿದ್ದರೆ, ಈ ಇಮೇಲ್ ಅನ್ನು ನಿರ್ಲಕ್ಷಿಸಬಹುದು.",
    },
  };

  const copy = emailCopies[resolvedLang || "en"] || emailCopies.en;

  // Professional Localized Email Template matching brand design specification
  const emailHtml = renderOtpEmailHtml({
    otp,
    purpose,
    minutes: OTP_EXPIRY_MINUTES,
    language: resolvedLang || "en",
  });

  // Deliver Email through configured provider
  console.log(`[RESEND_SEND_STARTED] email=${maskEmail(cleanEmail)} lang=${resolvedLang}`);
  const deliveryResult = await deliverEmail({
    to: cleanEmail,
    subject: copy.subject,
    html: emailHtml,
  });

  if (!deliveryResult.success) {
    console.error(`[OTP_SEND_FAILED] email=${maskEmail(cleanEmail)} reason=${deliveryResult.error}`);
    const userSafeMessage =
      process.env.NODE_ENV === "development"
        ? deliveryResult.error || "Failed to send verification code email."
        : "Unable to send verification code email right now. Please try again in a few moments.";
    return {
      success: false,
      message: userSafeMessage,
    };
  }

  console.log(`[RESEND_SEND_SUCCESS] email=${maskEmail(cleanEmail)} provider=${deliveryResult.provider}`);
  return {
    success: true,
    message: "OTP sent successfully to your email address.",
    expiresIn: OTP_EXPIRY_MINUTES * 60,
  };
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────

export async function verifyEmailOtp(
  email: string,
  otp: string,
  purpose: OtpPurpose = "customer"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ success: boolean; message: string; userId?: string; role?: string; user?: any }> {
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanOtp = (otp || "").trim();

  console.log(`[OTP_VERIFICATION_STARTED] email=${maskEmail(cleanEmail)} purpose=${purpose}`);

  if (!cleanEmail || !cleanOtp || cleanOtp.length !== 6) {
    return { success: false, message: "Please enter a valid 6-digit verification code." };
  }

  // Google Play Console App Review Bypass (Zero MFA / Self-Contained Testing)
  const isReviewerAllowed = process.env.NODE_ENV !== "production" || process.env.ENABLE_REVIEWER_BYPASS === "true";
  if (isReviewerAllowed) {
    const { isPlayReviewerEmail, isPlayReviewerOtp, ensurePlayReviewerAccounts } = await import("@/lib/auth/reviewer-bypass");
    if (isPlayReviewerEmail(cleanEmail) && isPlayReviewerOtp(cleanEmail, cleanOtp)) {
    await ensurePlayReviewerAccounts();
    const { resetFailedAttempts } = await import("@/lib/rate-limit");
    resetFailedAttempts(`otp-fail:${cleanEmail}`);

    if (purpose === "vendor" || purpose === "business") {
      const vendorRecord = await prisma.vendor.findFirst({
        where: {
          OR: [
            { contactEmail: { equals: cleanEmail, mode: "insensitive" } },
            { owner: { email: { equals: cleanEmail, mode: "insensitive" } } },
          ],
        },
        include: { owner: true },
      });

      if (vendorRecord) {
        console.log(`[PLAY_REVIEWER_OTP_SUCCESS] Vendor verified: ${vendorRecord.businessName}`);
        return {
          success: true,
          message: "Vendor authenticated successfully!",
          userId: vendorRecord.ownerId,
          role: "vendor",
          user: {
            id: vendorRecord.id,
            businessName: vendorRecord.businessName,
            slug: vendorRecord.slug,
            contactEmail: vendorRecord.contactEmail,
            contactPhone: vendorRecord.contactPhone,
            category: vendorRecord.category,
            status: vendorRecord.status,
            commissionRate: vendorRecord.commissionRate,
            ownerName: vendorRecord.owner?.name || vendorRecord.businessName,
            ownerId: vendorRecord.ownerId,
            rejectionReason: vendorRecord.rejectionReason,
            mustChangePassword: vendorRecord.owner?.mustChangePassword ?? false,
          },
        };
      }
    } else {
      const customerUser = await prisma.user.findFirst({
        where: { email: { equals: cleanEmail, mode: "insensitive" } },
        include: { addresses: true },
      });
      if (customerUser) {
        console.log(`[PLAY_REVIEWER_OTP_SUCCESS] Customer verified: ${customerUser.email}`);
        return {
          success: true,
          message: "Customer authenticated successfully!",
          userId: customerUser.id,
          role: "customer",
          user: customerUser,
        };
      }
    }
  }
}

  const { recordFailedAttempt, resetFailedAttempts } = await import("@/lib/rate-limit");

  const token = await prisma.emailOtpToken.findFirst({
    where: {
      email: cleanEmail,
      otp: cleanOtp,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!token) {
    const attempt = recordFailedAttempt(`otp-fail:${cleanEmail}`, 5, 15 * 60 * 1000);
    console.warn(`[OTP_VERIFICATION_FAILED] email=${maskEmail(cleanEmail)} remainingAttempts=${attempt.remainingAttempts}`);

    const { securityLogger } = await import("@/lib/security-logger");
    if (attempt.locked) {
      await securityLogger.logAuthAttempt({
        type: "otp",
        status: "lockout",
        identifier: cleanEmail,
        reason: "Excessive failed OTP attempts (15-minute security lockout active)",
      });
      // Invalidate all tokens for this email on excessive failed attempts
      await prisma.emailOtpToken.updateMany({
        where: { email: cleanEmail, used: false },
        data: { used: true },
      });
      return {
        success: false,
        message: "Too many incorrect attempts. Verification code invalidated. Please request a new code.",
      };
    }

    await securityLogger.logAuthAttempt({
      type: "otp",
      status: "failure",
      identifier: cleanEmail,
      reason: `Incorrect OTP. ${attempt.remainingAttempts} attempt(s) remaining.`,
    });

    return {
      success: false,
      message: `Incorrect or expired OTP. ${attempt.remainingAttempts} attempt(s) remaining.`,
    };
  }

  // Reset failed attempt counter on success
  resetFailedAttempts(`otp-fail:${cleanEmail}`);

  try {
    const { securityLogger } = await import("@/lib/security-logger");
    await securityLogger.logAuthAttempt({
      type: "otp",
      status: "success",
      identifier: cleanEmail,
      role: purpose,
    });
  } catch {}

  // Admin authentication flow
  if (purpose === "admin") {
    const { STRICT_ADMIN_EMAIL } = await import("@/lib/admin-constants");
    if (cleanEmail !== STRICT_ADMIN_EMAIL.toLowerCase()) {
      return { success: false, message: "Access Denied: Unauthorized admin credentials." };
    }

    const adminUser = await prisma.user.findFirst({
      where: {
        email: { equals: cleanEmail, mode: "insensitive" },
        role: { in: ["admin", "ADMIN", "superadmin"] },
      },
    });

    if (!adminUser) {
      return { success: false, message: "Access Denied: User is not registered with ADMIN role." };
    }

    await prisma.user.update({
      where: { id: adminUser.id },
      data: { emailVerified: true },
    });

    await prisma.emailOtpToken.updateMany({
      where: { email: cleanEmail },
      data: { used: true },
    });
    await setWebAuthCookies(adminUser, "admin");

    console.log(`[OTP_VERIFY_SUCCESS] role=admin userId=${adminUser.id}`);
    return {
      success: true,
      message: "Admin authenticated successfully!",
      userId: adminUser.id,
      role: adminUser.role,
      user: {
        id: adminUser.id,
        name: adminUser.name || "Admin",
        email: adminUser.email,
        role: adminUser.role,
      },
    };
  }

  // Vendor authentication flow
  if (purpose === "vendor" || purpose === "business") {
    const allowedAdminEmail = (process.env.ADMIN_ALLOWED_EMAIL || "admin@intrihub.com").toLowerCase().trim();
    const adminUser = await prisma.user.findFirst({
      where: {
        email: { equals: cleanEmail, mode: "insensitive" },
        OR: [
          { role: { in: ["admin", "ADMIN", "superadmin", "SUPERADMIN"] } },
          { email: { equals: allowedAdminEmail, mode: "insensitive" } },
        ],
      },
    });

    if (adminUser) {
      await prisma.emailOtpToken.updateMany({
        where: { email: cleanEmail },
        data: { used: true },
      });
      await setWebAuthCookies(adminUser, adminUser.role || "admin");
      return {
        success: true,
        message: "Admin authenticated successfully!",
        userId: adminUser.id,
        role: adminUser.role || "admin",
        user: adminUser,
      };
    }

    // 1. Check if user has CPO role in DB
    const cpoUser = await prisma.user.findFirst({
      where: {
        email: { equals: cleanEmail, mode: "insensitive" },
        role: { equals: "cpo", mode: "insensitive" },
      },
    });

    if (cpoUser) {
      await prisma.emailOtpToken.updateMany({
        where: { email: cleanEmail },
        data: { used: true },
      });
      await setWebAuthCookies(cpoUser, "cpo");
      console.log(`[OTP_VERIFY_SUCCESS] role=cpo userId=${cpoUser.id}`);
      return {
        success: true,
        message: "CPO authenticated successfully!",
        userId: cpoUser.id,
        role: "cpo",
        user: {
          id: cpoUser.id,
          name: cpoUser.name || "Chief Product Officer",
          email: cpoUser.email,
          role: "cpo",
        },
      };
    }

    const vendorRecord = await prisma.vendor.findFirst({
      where: {
        OR: [
          { contactEmail: { equals: cleanEmail, mode: "insensitive" } },
          { owner: { email: { equals: cleanEmail, mode: "insensitive" } } },
        ],
      },
      include: { owner: true },
    });

    const vendorUser = !vendorRecord
      ? await prisma.user.findFirst({
          where: {
            email: { equals: cleanEmail, mode: "insensitive" },
            role: "vendor",
          },
        })
      : null;

    if (!vendorRecord && !vendorUser) {
      return {
        success: false,
        message: "Access Denied: Email not registered as a vendor.",
      };
    }

    const userVendorApp = !vendorRecord
      ? await prisma.vendorApplication.findFirst({
          where: { email: { equals: cleanEmail, mode: "insensitive" } },
          orderBy: { createdAt: "desc" },
        })
      : null;

    const resolvedStatus = vendorRecord
      ? vendorRecord.status
      : (userVendorApp?.status || "pending");

    // Upgrade owner role to vendor ONLY when vendor status is approved
    if (vendorRecord && vendorRecord.status === "approved") {
      if (vendorRecord.owner && vendorRecord.owner.role !== "vendor") {
        await prisma.user.update({
          where: { id: vendorRecord.owner.id },
          data: { role: "vendor" },
        });
        vendorRecord.owner.role = "vendor";
      }
    }

    // Invalidate token only on successful role validation
    await prisma.emailOtpToken.updateMany({
      where: { email: cleanEmail },
      data: { used: true },
    });

    const isApproved = resolvedStatus === "approved";
    console.log(`[OTP_VERIFY_SUCCESS] role=${isApproved ? "vendor" : "customer"} vendorId=${vendorRecord?.id || vendorUser?.id} status=${resolvedStatus}`);
    const ownerUserId = vendorRecord?.ownerId || vendorRecord?.owner?.id || vendorUser?.id;
    const sanitizedVendor = vendorRecord
      ? {
          id: vendorRecord.id,
          businessName: vendorRecord.businessName,
          slug: vendorRecord.slug,
          contactEmail: vendorRecord.contactEmail,
          contactPhone: vendorRecord.contactPhone,
          category: vendorRecord.category,
          status: vendorRecord.status,
          commissionRate: vendorRecord.commissionRate,
          ownerName: vendorRecord.owner?.name || vendorRecord.businessName,
          ownerId: vendorRecord.ownerId || vendorRecord.owner?.id,
          rejectionReason: vendorRecord.rejectionReason,
          mustChangePassword: vendorRecord.owner?.mustChangePassword ?? false,
        }
      : {
          id: vendorUser!.id,
          businessName: vendorUser!.name || "Vendor Partner",
          slug: "",
          contactEmail: vendorUser!.email,
          contactPhone: vendorUser!.phone,
          category: "VENDOR",
          status: resolvedStatus,
          commissionRate: 0,
          ownerName: vendorUser!.name || "Vendor Partner",
          ownerId: vendorUser!.id,
          rejectionReason: userVendorApp?.rejectionReason || null,
          mustChangePassword: vendorUser!.mustChangePassword ?? false,
        };

    let statusMessage = "Vendor authenticated successfully!";
    if (!isApproved) {
      if (resolvedStatus === "pending") {
        statusMessage = "Your vendor application is currently under review by the Intrihub Admin team. You will be notified upon approval.";
      } else if (resolvedStatus === "suspended") {
        statusMessage = "Your vendor store has been suspended. Please contact Intrihub Partner Support at +91 7090120211.";
      } else if (resolvedStatus === "rejected") {
        const reason = sanitizedVendor.rejectionReason;
        statusMessage = `Your vendor application was not approved.${reason ? ` Reason: ${reason}` : " Please contact partner support."}`;
      } else {
        statusMessage = `Your vendor account status is ${resolvedStatus}. Please contact partner support.`;
      }
    }

    if (isApproved && sanitizedVendor.id && ownerUserId) {
      await setWebAuthCookies(
        { id: ownerUserId, email: cleanEmail, name: sanitizedVendor.businessName },
        "vendor",
        sanitizedVendor.id
      );
    }

    return {
      success: true,
      message: statusMessage,
      userId: ownerUserId!,
      role: isApproved ? "vendor" : "customer",
      user: sanitizedVendor,
    };
  }

  // Customer authentication flow: Upsert user safely without creating duplicates
  const syntheticPhone = `email_${cleanEmail.replace(/[^a-z0-9]/gi, "_")}`;

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: { equals: cleanEmail, mode: "insensitive" } }, { phone: syntheticPhone }],
    },
  });

  const autoEmailAvatar = cleanEmail ? `https://unavatar.io/${encodeURIComponent(cleanEmail)}?fallback=false` : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let user: any;
  if (existingUser) {
    user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        emailVerified: true,
        email: cleanEmail,
        avatar: existingUser.avatar || autoEmailAvatar,
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
        emailVerified: true,
        phoneVerified: false,
        authProvider: "email",
        role: "customer",
        name: cleanEmail.split("@")[0],
        avatar: autoEmailAvatar,
      },
      include: {
        addresses: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        },
      },
    });
  }

  console.log(`[OTP_VERIFY_SUCCESS] role=customer userId=${user.id}`);

  // Set persistent session cookies on server response for instant hydration & auth
  const cleanAvatar = user.avatar || autoEmailAvatar || undefined;
  await setWebAuthCookies({
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: cleanAvatar,
    phone: user.phone,
    phoneVerified: user.phoneVerified,
    createdAt: user.createdAt,
  }, user.role || "customer");

  // Invalidate token on successful verification
  await prisma.emailOtpToken.updateMany({
    where: { email: cleanEmail },
    data: { used: true },
  });

  return {
    success: true,
    message: "Email verified successfully!",
    userId: user.id,
    role: user.role,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: cleanAvatar || null,
      addresses: user.addresses,
      language: user.language || "en",
    },
  };
}
