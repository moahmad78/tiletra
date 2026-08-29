"use server";

import { headers, cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { sendEmailOtp, verifyEmailOtp } from "@/lib/actions/email-otp";
import {
  checkAdminLoginLockout,
  recordAdminLoginFailure,
  resetAdminLoginLockout,
  checkVendorLoginLockout,
  recordVendorLoginFailure,
  resetVendorLoginLockout,
} from "@/lib/rate-limit";
import { verifyPassword } from "@/lib/password-security";

async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    const forwarded = headerList.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    return headerList.get("x-real-ip") || "127.0.0.1";
  } catch {
    return "127.0.0.1";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. ADMIN WEB PORTAL AUTHENTICATION
// ─────────────────────────────────────────────────────────────────────────────

export async function sendAdminWebOtp(email: string): Promise<{
  success: boolean;
  message: string;
  locked?: boolean;
  remainingAttempts?: number;
  retryAfterSeconds?: number;
}> {
  const clientIp = await getClientIp();

  // 1. Check IP lockout (3 failed attempts -> 15-minute lockout)
  const lockout = checkAdminLoginLockout(clientIp);
  if (lockout.locked) {
    const minutes = Math.ceil((lockout.retryAfterSeconds || 900) / 60);
    return {
      success: false,
      locked: true,
      remainingAttempts: 0,
      retryAfterSeconds: lockout.retryAfterSeconds,
      message: `Too many failed login attempts from this network. Security lockout active. Please retry in ${minutes} minute(s).`,
    };
  }

  const cleanEmail = (email || "").trim().toLowerCase();
  const allowedAdminEmail = (process.env.ADMIN_ALLOWED_EMAIL || "admin@intrihub.com").toLowerCase().trim();

  // 2. Strict single email check
  if (!cleanEmail || cleanEmail !== allowedAdminEmail) {
    const failCheck = recordAdminLoginFailure(clientIp);
    if (failCheck.locked) {
      return {
        success: false,
        locked: true,
        remainingAttempts: 0,
        retryAfterSeconds: failCheck.retryAfterSeconds,
        message: "Too many failed attempts (3/3). Login locked for 15 minutes.",
      };
    }
    return {
      success: false,
      locked: false,
      remainingAttempts: failCheck.remainingAttempts,
      message: `Invalid admin credentials. (${failCheck.remainingAttempts} attempt${failCheck.remainingAttempts === 1 ? "" : "s"} remaining before 15-min lockout)`,
    };
  }

  // 3. Dispatch OTP
  const res = await sendEmailOtp(cleanEmail, "admin");
  if (!res.success) {
    return {
      success: false,
      locked: false,
      message: res.message || "Failed to send verification code.",
    };
  }

  return {
    success: true,
    message: `6-digit security code sent to ${cleanEmail}.`,
  };
}

export async function verifyAdminWebOtp(email: string, otp: string): Promise<{
  success: boolean;
  message: string;
  locked?: boolean;
  remainingAttempts?: number;
  retryAfterSeconds?: number;
  user?: { id: string; name: string; email: string; role: string };
}> {
  const clientIp = await getClientIp();

  // 1. Check IP lockout
  const lockout = checkAdminLoginLockout(clientIp);
  if (lockout.locked) {
    const minutes = Math.ceil((lockout.retryAfterSeconds || 900) / 60);
    return {
      success: false,
      locked: true,
      remainingAttempts: 0,
      retryAfterSeconds: lockout.retryAfterSeconds,
      message: `Too many failed login attempts. Security lockout active. Please retry in ${minutes} minute(s).`,
    };
  }

  const cleanEmail = (email || "").trim().toLowerCase();
  const allowedAdminEmail = (process.env.ADMIN_ALLOWED_EMAIL || "admin@intrihub.com").toLowerCase().trim();

  if (cleanEmail !== allowedAdminEmail) {
    const failCheck = recordAdminLoginFailure(clientIp);
    if (failCheck.locked) {
      return {
        success: false,
        locked: true,
        remainingAttempts: 0,
        retryAfterSeconds: failCheck.retryAfterSeconds,
        message: "Too many failed attempts (3/3). Account locked for 15 minutes.",
      };
    }
    return {
      success: false,
      locked: false,
      remainingAttempts: failCheck.remainingAttempts,
      message: `Invalid credentials. (${failCheck.remainingAttempts} attempt${failCheck.remainingAttempts === 1 ? "" : "s"} remaining)`,
    };
  }

  // 2. Verify OTP
  const res = await verifyEmailOtp(cleanEmail, otp, "admin");
  if (!res.success) {
    const failCheck = recordAdminLoginFailure(clientIp);
    if (failCheck.locked) {
      return {
        success: false,
        locked: true,
        remainingAttempts: 0,
        retryAfterSeconds: failCheck.retryAfterSeconds,
        message: "Too many failed attempts (3/3). Account locked for 15 minutes.",
      };
    }
    return {
      success: false,
      locked: false,
      remainingAttempts: failCheck.remainingAttempts,
      message: `${res.message || "Invalid or expired verification code."} (${failCheck.remainingAttempts} attempt${failCheck.remainingAttempts === 1 ? "" : "s"} remaining)`,
    };
  }

  // 3. Reset failed attempts on successful login
  resetAdminLoginLockout(clientIp);

  // 4. Set secure HTTP-only admin session cookie
  try {
    const cookieStore = await cookies();
    cookieStore.set(
      "intrihub_admin_session",
      JSON.stringify({
        userId: res.userId,
        email: cleanEmail,
        role: "admin",
        verifiedAt: new Date().toISOString(),
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      }
    );
  } catch {}

  return {
    success: true,
    message: "Admin authenticated successfully!",
    user: res.user || {
      id: res.userId || "admin-root",
      name: "Super Admin",
      email: cleanEmail,
      role: "admin",
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. VENDOR WEB PORTAL AUTHENTICATION
// ─────────────────────────────────────────────────────────────────────────────

export type VendorWebLoginReason = "NOT_FOUND" | "PENDING_APPROVAL" | "REJECTED" | "SUSPENDED" | "LOCKED_OUT";

/**
 * Pre-auth method lookup: returns whether vendor logs in via OTP or Password
 */
export async function checkVendorLoginMethod(email: string): Promise<{
  success: boolean;
  loginMethod: "otp" | "password" | "not_found";
  reason?: VendorWebLoginReason;
  rejectionReason?: string | null;
  vendorName?: string;
  locked?: boolean;
  remainingAttempts?: number;
  retryAfterSeconds?: number;
  message?: string;
}> {
  const clientIp = await getClientIp();

  // 1. IP Lockout Check
  const lockout = checkVendorLoginLockout(clientIp);
  if (lockout.locked) {
    const minutes = Math.ceil((lockout.retryAfterSeconds || 900) / 60);
    return {
      success: false,
      loginMethod: "not_found",
      locked: true,
      reason: "LOCKED_OUT",
      remainingAttempts: 0,
      retryAfterSeconds: lockout.retryAfterSeconds,
      message: `Too many failed login attempts from this network. Security lockout active. Please retry in ${minutes} minute(s).`,
    };
  }

  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { success: false, loginMethod: "not_found", message: "Please enter a valid email address." };
  }

  const allowedAdminEmail = (process.env.ADMIN_ALLOWED_EMAIL || "admin@intrihub.com").toLowerCase().trim();
  const isAdmin = cleanEmail === allowedAdminEmail;

  if (isAdmin) {
    return {
      success: true,
      loginMethod: "otp",
      vendorName: "Super Admin",
    };
  }

  // 2. Check vendor in DB
  const vendor = await prisma.vendor.findFirst({
    where: {
      OR: [
        { contactEmail: { equals: cleanEmail, mode: "insensitive" } },
        { owner: { email: { equals: cleanEmail, mode: "insensitive" } } },
      ],
    },
    include: { owner: true },
  });

  const vendorUser = !vendor
    ? await prisma.user.findFirst({
        where: {
          email: { equals: cleanEmail, mode: "insensitive" },
          role: "vendor",
        },
      })
    : null;

  if (!vendor && !vendorUser) {
    const failCheck = recordVendorLoginFailure(clientIp);
    if (failCheck.locked) {
      return {
        success: false,
        loginMethod: "not_found",
        locked: true,
        reason: "LOCKED_OUT",
        remainingAttempts: 0,
        retryAfterSeconds: failCheck.retryAfterSeconds,
        message: "Too many failed attempts (3/3). Account locked for 15 minutes.",
      };
    }
    return {
      success: false,
      loginMethod: "not_found",
      locked: false,
      reason: "NOT_FOUND",
      remainingAttempts: failCheck.remainingAttempts,
      message: `This email isn't registered as an approved vendor partner on Intrihub. (${failCheck.remainingAttempts} attempt${failCheck.remainingAttempts === 1 ? "" : "s"} remaining before lockout)`,
    };
  }

  if (vendor) {
    if (vendor.status === "pending") {
      return {
        success: false,
        loginMethod: (vendor.loginMethod as any) || "otp",
        reason: "PENDING_APPROVAL",
        vendorName: vendor.businessName,
        message: "Your vendor partner application is currently under review by our onboarding team.",
      };
    }

    if (vendor.status === "suspended") {
      return {
        success: false,
        loginMethod: (vendor.loginMethod as any) || "otp",
        reason: "SUSPENDED",
        vendorName: vendor.businessName,
        message: "Your vendor partner account has been suspended or deactivated. Please contact partner support.",
      };
    }

    if (vendor.status === "rejected") {
      return {
        success: false,
        loginMethod: (vendor.loginMethod as any) || "otp",
        reason: "REJECTED",
        vendorName: vendor.businessName,
        rejectionReason: vendor.rejectionReason,
        message: `Your vendor application was not approved.${vendor.rejectionReason ? ` Reason: ${vendor.rejectionReason}` : " Please contact partner support."}`,
      };
    }
  }

  const isPasswordMethod =
    vendor?.loginMethod === "password" && Boolean(vendor?.passwordHash || vendor?.owner?.passwordHash);

  return {
    success: true,
    loginMethod: isPasswordMethod ? "password" : "otp",
    vendorName: vendor?.businessName || vendorUser?.name || "Vendor Partner",
  };
}

export async function sendVendorWebOtp(email: string): Promise<{
  success: boolean;
  message: string;
  reason?: VendorWebLoginReason;
  rejectionReason?: string | null;
  vendorName?: string;
  locked?: boolean;
  remainingAttempts?: number;
  retryAfterSeconds?: number;
}> {
  const clientIp = await getClientIp();

  // 1. Check IP lockout (3 failed attempts -> 15-minute lockout)
  const lockout = checkVendorLoginLockout(clientIp);
  if (lockout.locked) {
    const minutes = Math.ceil((lockout.retryAfterSeconds || 900) / 60);
    return {
      success: false,
      locked: true,
      reason: "LOCKED_OUT",
      remainingAttempts: 0,
      retryAfterSeconds: lockout.retryAfterSeconds,
      message: `Too many failed login attempts from this network. Security lockout active. Please retry in ${minutes} minute(s).`,
    };
  }

  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { success: false, message: "Please enter a valid email address." };
  }

  const allowedAdminEmail = (process.env.ADMIN_ALLOWED_EMAIL || "admin@intrihub.com").toLowerCase().trim();
  const isAdmin = cleanEmail === allowedAdminEmail;

  // 2. Check vendor record in DB
  if (!isAdmin) {
    const vendor = await prisma.vendor.findFirst({
      where: {
        OR: [
          { contactEmail: { equals: cleanEmail, mode: "insensitive" } },
          { owner: { email: { equals: cleanEmail, mode: "insensitive" } } },
        ],
      },
      include: { owner: true },
    });

    const vendorUser = !vendor
      ? await prisma.user.findFirst({
          where: {
            email: { equals: cleanEmail, mode: "insensitive" },
            role: "vendor",
          },
        })
      : null;

    if (!vendor && !vendorUser) {
      const failCheck = recordVendorLoginFailure(clientIp);
      if (failCheck.locked) {
        return {
          success: false,
          locked: true,
          reason: "LOCKED_OUT",
          remainingAttempts: 0,
          retryAfterSeconds: failCheck.retryAfterSeconds,
          message: "Too many failed attempts (3/3). Account locked for 15 minutes.",
        };
      }
      return {
        success: false,
        locked: false,
        reason: "NOT_FOUND",
        remainingAttempts: failCheck.remainingAttempts,
        message: `This email isn't registered as an approved vendor partner on Intrihub. (${failCheck.remainingAttempts} attempt${failCheck.remainingAttempts === 1 ? "" : "s"} remaining before lockout)`,
      };
    }

    if (vendor) {
      if (vendor.status === "pending") {
        return {
          success: false,
          reason: "PENDING_APPROVAL",
          vendorName: vendor.businessName,
          message: "Your vendor partner application is currently under review by our onboarding team.",
        };
      }

      if (vendor.status === "suspended") {
        return {
          success: false,
          reason: "SUSPENDED",
          vendorName: vendor.businessName,
          message: "Your vendor partner account has been suspended or deactivated. Please contact partner support.",
        };
      }

      if (vendor.status === "rejected") {
        return {
          success: false,
          reason: "REJECTED",
          vendorName: vendor.businessName,
          rejectionReason: vendor.rejectionReason,
          message: `Your vendor application was not approved.${vendor.rejectionReason ? ` Reason: ${vendor.rejectionReason}` : " Please contact partner support."}`,
        };
      }
    }
  }

  // 3. Approved vendor: dispatch OTP
  const res = await sendEmailOtp(cleanEmail, "vendor");
  if (!res.success) {
    return {
      success: false,
      message: res.message || "Failed to dispatch verification code.",
    };
  }

  return {
    success: true,
    message: `6-digit verification code sent to ${cleanEmail}.`,
  };
}

export async function verifyVendorWebOtp(email: string, otp: string): Promise<{
  success: boolean;
  message: string;
  locked?: boolean;
  remainingAttempts?: number;
  retryAfterSeconds?: number;
  vendor?: any;
}> {
  const clientIp = await getClientIp();

  // 1. Check IP lockout
  const lockout = checkVendorLoginLockout(clientIp);
  if (lockout.locked) {
    const minutes = Math.ceil((lockout.retryAfterSeconds || 900) / 60);
    return {
      success: false,
      locked: true,
      remainingAttempts: 0,
      retryAfterSeconds: lockout.retryAfterSeconds,
      message: `Too many failed login attempts. Security lockout active. Please retry in ${minutes} minute(s).`,
    };
  }

  const cleanEmail = (email || "").trim().toLowerCase();

  // 2. Verify OTP
  const res = await verifyEmailOtp(cleanEmail, otp, "vendor");
  if (!res.success) {
    const failCheck = recordVendorLoginFailure(clientIp);
    if (failCheck.locked) {
      return {
        success: false,
        locked: true,
        remainingAttempts: 0,
        retryAfterSeconds: failCheck.retryAfterSeconds,
        message: "Too many failed attempts (3/3). Account locked for 15 minutes.",
      };
    }
    return {
      success: false,
      locked: false,
      remainingAttempts: failCheck.remainingAttempts,
      message: `${res.message || "Invalid or expired verification code."} (${failCheck.remainingAttempts} attempt${failCheck.remainingAttempts === 1 ? "" : "s"} remaining)`,
    };
  }

  // 3. Reset failed attempts on successful login
  resetVendorLoginLockout(clientIp);

  // 4. Fetch full vendor profile for session
  let vendorRecord = await prisma.vendor.findFirst({
    where: {
      OR: [
        { contactEmail: { equals: cleanEmail, mode: "insensitive" } },
        { owner: { email: { equals: cleanEmail, mode: "insensitive" } } },
      ],
    },
    include: { owner: true },
  });

  if (!vendorRecord) {
    const allowedAdminEmail = (process.env.ADMIN_ALLOWED_EMAIL || "admin@intrihub.com").toLowerCase().trim();
    if (cleanEmail === allowedAdminEmail) {
      vendorRecord = await prisma.vendor.findFirst({
        where: { status: "approved" },
        include: { owner: true },
      });
    }
  }

  if (!vendorRecord) {
    return {
      success: false,
      message: "No active vendor profile found for this account.",
    };
  }

  // 5. Set secure HTTP-only vendor session cookie
  try {
    const cookieStore = await cookies();
    cookieStore.set(
      "intrihub_vendor_session",
      JSON.stringify({
        vendorId: vendorRecord.id,
        ownerId: vendorRecord.ownerId,
        businessName: vendorRecord.businessName,
        contactEmail: vendorRecord.contactEmail,
        role: "vendor",
        verifiedAt: new Date().toISOString(),
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      }
    );
  } catch {}

  return {
    success: true,
    message: "Vendor authenticated successfully!",
    vendor: {
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
      mustChangePassword: false,
      loginMethod: vendorRecord.loginMethod,
    },
  };
}

/**
 * Web portal Vendor Email + Password Login
 */
export async function loginVendorWithPassword(
  email: string,
  password: string
): Promise<{
  success: boolean;
  message: string;
  locked?: boolean;
  remainingAttempts?: number;
  retryAfterSeconds?: number;
  vendor?: any;
}> {
  const clientIp = await getClientIp();

  // 1. Check IP lockout
  const lockout = checkVendorLoginLockout(clientIp);
  if (lockout.locked) {
    const minutes = Math.ceil((lockout.retryAfterSeconds || 900) / 60);
    return {
      success: false,
      locked: true,
      remainingAttempts: 0,
      retryAfterSeconds: lockout.retryAfterSeconds,
      message: `Too many failed login attempts. Security lockout active. Please retry in ${minutes} minute(s).`,
    };
  }

  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail || !password) {
    return { success: false, message: "Please enter both email address and password." };
  }

  // 2. Fetch vendor record
  const vendor = await prisma.vendor.findFirst({
    where: {
      OR: [
        { contactEmail: { equals: cleanEmail, mode: "insensitive" } },
        { owner: { email: { equals: cleanEmail, mode: "insensitive" } } },
      ],
    },
    include: { owner: true },
  });

  if (!vendor) {
    const failCheck = recordVendorLoginFailure(clientIp);
    if (failCheck.locked) {
      return {
        success: false,
        locked: true,
        remainingAttempts: 0,
        retryAfterSeconds: failCheck.retryAfterSeconds,
        message: "Too many failed attempts (3/3). Account locked for 15 minutes.",
      };
    }
    return {
      success: false,
      remainingAttempts: failCheck.remainingAttempts,
      message: `Invalid email or password. (${failCheck.remainingAttempts} attempt${failCheck.remainingAttempts === 1 ? "" : "s"} remaining)`,
    };
  }

  // 3. Status check
  if (vendor.status !== "approved") {
    return {
      success: false,
      message: `Your vendor account status is '${vendor.status}'. Access is restricted to approved vendors.`,
    };
  }

  // 4. Verify password
  const storedHash = vendor.passwordHash || vendor.owner?.passwordHash;
  if (!storedHash) {
    return {
      success: false,
      message: "Password login is not enabled for this vendor account. Please use Email OTP.",
    };
  }

  const isValid = verifyPassword(password, storedHash);
  if (!isValid) {
    const failCheck = recordVendorLoginFailure(clientIp);
    if (failCheck.locked) {
      return {
        success: false,
        locked: true,
        remainingAttempts: 0,
        retryAfterSeconds: failCheck.retryAfterSeconds,
        message: "Too many failed attempts (3/3). Account locked for 15 minutes.",
      };
    }
    return {
      success: false,
      remainingAttempts: failCheck.remainingAttempts,
      message: `Invalid password. (${failCheck.remainingAttempts} attempt${failCheck.remainingAttempts === 1 ? "" : "s"} remaining before lockout)`,
    };
  }

  // 5. Reset lockout on success
  resetVendorLoginLockout(clientIp);

  // 6. Set secure HTTP-only vendor session cookie
  try {
    const cookieStore = await cookies();
    cookieStore.set(
      "intrihub_vendor_session",
      JSON.stringify({
        vendorId: vendor.id,
        ownerId: vendor.ownerId,
        businessName: vendor.businessName,
        contactEmail: vendor.contactEmail,
        role: "vendor",
        verifiedAt: new Date().toISOString(),
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      }
    );
  } catch {}

  return {
    success: true,
    message: "Vendor authenticated successfully!",
    vendor: {
      id: vendor.id,
      businessName: vendor.businessName,
      slug: vendor.slug,
      contactEmail: vendor.contactEmail,
      contactPhone: vendor.contactPhone,
      category: vendor.category,
      status: vendor.status,
      commissionRate: vendor.commissionRate,
      ownerName: vendor.owner?.name || vendor.businessName,
      ownerId: vendor.ownerId,
      rejectionReason: vendor.rejectionReason,
      mustChangePassword: false,
      loginMethod: vendor.loginMethod,
    },
  };
}
