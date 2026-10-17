import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmailOtp } from "@/lib/actions/email-otp";
import { mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import {
  checkVendorLoginLockout,
  recordVendorLoginFailure,
} from "@/lib/rate-limit";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, phone, purpose = "customer" } = body;
    const isBusinessPortal = purpose === "business" || purpose === "vendor" || purpose === "admin";
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    if (!email && !phone) {
      return mobileApiResponse(
        { success: false, error: "Please provide either an email address or phone number" },
        400
      );
    }

    // IP-level rate limiting on mobile OTP send (Max 5 per hour per IP)
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const ipRateCheck = checkRateLimit(`mobile_otp_ip:${clientIp}`, 5, 60 * 60 * 1000);
    if (!ipRateCheck.allowed) {
      return mobileApiResponse(
        { success: false, error: "Too many verification requests from this device. Please try again later." },
        429
      );
    }

    if (email) {
      const { validateStrictEmail } = await import("@/lib/validations/schemas");
      const emailValidation = validateStrictEmail(email);
      if (!emailValidation.valid || !emailValidation.email) {
        return mobileApiResponse(
          { success: false, error: emailValidation.error || "Please provide a valid email address." },
          400
        );
      }
    }

    // Strict pre-OTP checks for Business portal
    if (isBusinessPortal) {
      const targetIdentifier = email ? email.trim() : phone ? phone.trim() : undefined;
      // 1. Check account & IP lockout (5 failed attempts -> 15-min lockout)
      const lockoutCheck = checkVendorLoginLockout(clientIp, targetIdentifier);
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

      const allowedAdminEmail = (process.env.ADMIN_ALLOWED_EMAIL || "admin@intrihub.com").toLowerCase().trim();

      if (email) {
        const cleanEmail = email.trim().toLowerCase();
        const isAdmin = cleanEmail === allowedAdminEmail;

        if (!isAdmin) {
          // Check Vendor table
          const vendor = await prisma.vendor.findFirst({
            where: {
              OR: [
                { contactEmail: { equals: cleanEmail, mode: "insensitive" } },
                { owner: { email: { equals: cleanEmail, mode: "insensitive" } } },
              ],
            },
            include: { owner: true },
          });

          // Check if User with role vendor exists
          const vendorUser = !vendor
            ? await prisma.user.findFirst({
                where: {
                  email: { equals: cleanEmail, mode: "insensitive" },
                  role: "vendor",
                },
              })
            : null;

          if (!vendor && !vendorUser) {
            return mobileApiResponse(
              {
                success: false,
                reason: "NOT_FOUND",
                error: "Access Denied: Email not registered as a vendor.",
                locked: false,
                remainingAttempts: lockoutCheck.remainingAttempts ?? 5,
                email: cleanEmail,
              },
              403
            );
          }

          if (vendor) {
            if (vendor.status === "pending") {
              return mobileApiResponse(
                {
                  success: false,
                  reason: "PENDING_APPROVAL",
                  error: "Your vendor partner application is currently under review by our onboarding team.",
                  email: cleanEmail,
                  vendorName: vendor.businessName,
                },
                403
              );
            }

            if (vendor.status === "suspended") {
              return mobileApiResponse(
                {
                  success: false,
                  reason: "SUSPENDED",
                  error: "Your vendor partner account has been suspended or deactivated. Please contact partner support.",
                  email: cleanEmail,
                  vendorName: vendor.businessName,
                },
                403
              );
            }

            if (vendor.status === "rejected") {
              return mobileApiResponse(
                {
                  success: false,
                  reason: "REJECTED",
                  error: `Your vendor application was not approved.${vendor.rejectionReason ? ` Reason: ${vendor.rejectionReason}` : " Please contact partner support."}`,
                  email: cleanEmail,
                  vendorName: vendor.businessName,
                },
                403
              );
            }

            if (vendor.status !== "approved") {
              return mobileApiResponse(
                {
                  success: false,
                  reason: "UNAPPROVED",
                  error: `Your vendor status is currently '${vendor.status}'. Please contact partner support.`,
                  email: cleanEmail,
                  vendorName: vendor.businessName,
                },
                403
              );
            }
          }
        }
      } else if (phone) {
        const cleanPhone = phone.replace(/\D/g, "");
        if (cleanPhone.length !== 10) {
          return mobileApiResponse(
            { success: false, error: "Please enter a valid 10-digit phone number" },
            400
          );
        }

        const vendor = await prisma.vendor.findFirst({
          where: {
            OR: [
              { contactPhone: { contains: cleanPhone } },
              { owner: { phone: { contains: cleanPhone } } },
            ],
          },
        });

        if (!vendor) {
          return mobileApiResponse(
            {
              success: false,
              reason: "NOT_FOUND",
              error: "This phone number isn't registered as an approved vendor partner on Intrihub Business.",
              locked: false,
              remainingAttempts: lockoutCheck.remainingAttempts ?? 5,
              phone: cleanPhone,
            },
            403
          );
        }

        if (vendor.status !== "approved") {
          return mobileApiResponse(
            {
              success: false,
              reason: vendor.status === "pending" ? "PENDING_APPROVAL" : "SUSPENDED",
              error: `Vendor account status is '${vendor.status}'. Access denied before approval.`,
              phone: cleanPhone,
              vendorName: vendor.businessName,
            },
            403
          );
        }
      }
    }

    if (email) {
      const result = await sendEmailOtp(email, purpose);
      if (!result.success) {
        return mobileApiResponse({ success: false, error: result.message }, 400);
      }
      return mobileApiResponse({
        success: true,
        message: result.message,
        channel: "email",
        expiresIn: result.expiresIn || 300,
      });
    }

    // Phone OTP support (Customer flow or approved vendor phone)
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      return mobileApiResponse(
        { success: false, error: "Please enter a valid 10-digit phone number" },
        400
      );
    }

    return mobileApiResponse({
      success: true,
      message: "Verification code prepared for phone verification",
      channel: "phone",
    });
  } catch (err: any) {
    console.error("Mobile send-otp error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to send verification code" },
      500
    );
  }
}
