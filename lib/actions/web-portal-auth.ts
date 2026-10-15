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
import { generateAdminSessionToken, generateVendorSessionToken } from "@/lib/server-auth";
import { securityLogger } from "@/lib/security-logger";

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

  // 2. Strict database-level role and existence check
  const adminUser = await prisma.user.findFirst({
    where: {
      email: { equals: cleanEmail, mode: "insensitive" },
      role: { in: ["admin", "ADMIN", "superadmin"] },
    },
  });

  const isAuthorizedAdmin = Boolean(adminUser && cleanEmail === allowedAdminEmail);

  if (!cleanEmail || !isAuthorizedAdmin) {
    const failCheck = recordAdminLoginFailure(clientIp);
    await securityLogger.logAuthAttempt({
      type: "login",
      status: failCheck.locked ? "lockout" : "failure",
      identifier: cleanEmail || "unknown",
      ip: clientIp,
      role: "admin",
      reason: failCheck.locked
        ? "Too many failed attempts. Admin login locked 15m."
        : "Access Denied: Email not registered with ADMIN role.",
    });
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
      message: `Access Denied: Email not registered with ADMIN role. (${failCheck.remainingAttempts} attempt${failCheck.remainingAttempts === 1 ? "" : "s"} remaining before 15-min lockout)`,
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
    message: "6-digit security code sent to your registered admin email.",
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

  // Strict database check for ADMIN role
  const adminUser = await prisma.user.findFirst({
    where: {
      email: { equals: cleanEmail, mode: "insensitive" },
      role: { in: ["admin", "ADMIN", "superadmin"] },
    },
  });

  if (!adminUser || cleanEmail !== allowedAdminEmail) {
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
      message: `Access Denied: User is not registered with ADMIN role. (${failCheck.remainingAttempts} attempt${failCheck.remainingAttempts === 1 ? "" : "s"} remaining)`,
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
  await securityLogger.logAuthAttempt({
    type: "login",
    status: "success",
    identifier: cleanEmail,
    ip: clientIp,
    role: "admin",
    userId: res.userId,
  });

  // 4. Set secure HTTP-only admin session cookie & signed HMAC token
  try {
    const cookieStore = await cookies();
    const adminToken = generateAdminSessionToken(res.userId || "admin-root", cleanEmail);
    cookieStore.set("intrihub_admin_token", adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
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

/**
 * Web portal Admin Email + Password Login
 */
export async function loginAdminWithPassword(
  email: string,
  password: string
): Promise<{
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

  // 2. Query admin user from database
  const adminUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: cleanEmail, mode: "insensitive" } },
        cleanEmail === allowedAdminEmail ? { email: { equals: allowedAdminEmail, mode: "insensitive" } } : {},
      ],
      role: "admin",
    },
  });

  const isAllowedEmail = cleanEmail === allowedAdminEmail || adminUser !== null;
  if (!isAllowedEmail) {
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
      remainingAttempts: failCheck.remainingAttempts,
      message: `Invalid admin credentials. (${failCheck.remainingAttempts} attempt(s) remaining)`,
    };
  }

  const storedHash = adminUser?.passwordHash;
  if (!storedHash) {
    return {
      success: false,
      message: "Password login is not set up for this admin account. Please use Email OTP to sign in.",
    };
  }

  const isValid = verifyPassword(password, storedHash);
  if (!isValid) {
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
      remainingAttempts: failCheck.remainingAttempts,
      message: `Invalid password. (${failCheck.remainingAttempts} attempt(s) remaining)`,
    };
  }

  // 3. Reset lockout on success
  resetAdminLoginLockout(clientIp);
  await securityLogger.logAuthAttempt({
    type: "login",
    status: "success",
    identifier: cleanEmail,
    ip: clientIp,
    role: "admin",
    userId: adminUser?.id || "admin-root",
  });

  const userId = adminUser?.id || "admin-root";
  const adminToken = generateAdminSessionToken(userId, cleanEmail);
  const cookieStore = await cookies();
  cookieStore.set("intrihub_admin_token", adminToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  cookieStore.set(
    "intrihub_admin_session",
    JSON.stringify({
      userId,
      email: cleanEmail,
      role: "admin",
      verifiedAt: new Date().toISOString(),
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    }
  );

  return {
    success: true,
    message: "Admin authenticated successfully!",
    user: {
      id: userId,
      name: adminUser?.name || "Super Admin",
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
  isCpo?: boolean;
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
    const adminUser = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: "insensitive" } },
    });
    return {
      success: true,
      loginMethod: "otp",
      vendorName: adminUser?.name || "Super Admin",
    };
  }

  // 1b. Check if CPO User in DB
  const cpoUser = await prisma.user.findFirst({
    where: {
      email: { equals: cleanEmail, mode: "insensitive" },
      role: { equals: "cpo", mode: "insensitive" },
    },
  });

  if (cpoUser) {
    return {
      success: true,
      loginMethod: "otp",
      vendorName: cpoUser.name || "Chief Product Officer",
      isCpo: true,
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
        loginMethod: "otp",
        reason: "PENDING_APPROVAL",
        vendorName: vendor.businessName,
        message: "Your vendor partner application is currently under review by our onboarding team.",
      };
    }

    if (vendor.status === "suspended") {
      return {
        success: false,
        loginMethod: "otp",
        reason: "SUSPENDED",
        vendorName: vendor.businessName,
        message: "Your vendor partner account has been suspended or deactivated. Please contact partner support.",
      };
    }

    if (vendor.status === "rejected") {
      return {
        success: false,
        loginMethod: "otp",
        reason: "REJECTED",
        vendorName: vendor.businessName,
        rejectionReason: vendor.rejectionReason,
        message: `Your vendor application was not approved.${vendor.rejectionReason ? ` Reason: ${vendor.rejectionReason}` : " Please contact partner support."}`,
      };
    }
  }

  return {
    success: true,
    loginMethod: "otp",
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
  let resolvedVendorName = isAdmin ? "Super Admin" : "Vendor Partner";

  // 1b. Check if user is CPO in local PostgreSQL User table
  const cpoUser = await prisma.user.findFirst({
    where: {
      email: { equals: cleanEmail, mode: "insensitive" },
      role: { in: ["cpo", "CPO"] },
    },
  });

  // 2. Check vendor record in PostgreSQL Vendor table
  const vendor = await prisma.vendor.findFirst({
    where: {
      OR: [
        { contactEmail: { equals: cleanEmail, mode: "insensitive" } },
        { owner: { email: { equals: cleanEmail, mode: "insensitive" } } },
      ],
    },
    include: { owner: true },
  });

  if (cpoUser) {
    resolvedVendorName = cpoUser.name || "Chief Product Officer";
  } else if (isAdmin) {
    resolvedVendorName = "Super Admin";
  } else if (!vendor) {
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
      message: "Access Denied: Email not registered as a vendor.",
    };
  } else {
    resolvedVendorName = vendor.businessName || vendor.owner?.name || "Vendor Partner";

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
        message: "Access Denied: Your vendor account has been suspended or deactivated. Please contact partner support.",
      };
    }

    if (vendor.status === "rejected") {
      return {
        success: false,
        reason: "REJECTED",
        vendorName: vendor.businessName,
        rejectionReason: vendor.rejectionReason,
        message: `Access Denied: Your vendor application was not approved.${vendor.rejectionReason ? ` Reason: ${vendor.rejectionReason}` : " Please contact partner support."}`,
      };
    }

    if (vendor.status !== "approved") {
      return {
        success: false,
        message: `Access Denied: Vendor account status is ${vendor.status}. Only approved vendors may sign in.`,
      };
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
    vendorName: resolvedVendorName,
  };
}

export async function verifyVendorWebOtp(email: string, otp: string): Promise<{
  success: boolean;
  message: string;
  locked?: boolean;
  remainingAttempts?: number;
  retryAfterSeconds?: number;
  vendor?: any;
  redirectTo?: string;
  role?: string;
  user?: any;
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
  await securityLogger.logAuthAttempt({
    type: "login",
    status: "success",
    identifier: cleanEmail,
    ip: clientIp,
    role: "vendor",
  });

  // 3b. Check if account is CPO in DB
  const cpoUser = await prisma.user.findFirst({
    where: {
      email: { equals: cleanEmail, mode: "insensitive" },
      role: { equals: "cpo", mode: "insensitive" },
    },
  });

  if (cpoUser) {
    const { generateCpoSessionToken, sendCpoNewDeviceAlert } = await import("@/lib/cpo/auth");
    const { CPO_SESSION_COOKIE } = await import("@/lib/config/cpo-permissions");
    const cpoToken = await generateCpoSessionToken(cpoUser.id, cpoUser.email || cleanEmail);

    try {
      const cookieStore = await cookies();
      cookieStore.set(CPO_SESSION_COOKIE, cpoToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      const headerList = await headers();
      const userAgent = headerList.get("user-agent") || undefined;
      await sendCpoNewDeviceAlert(cpoUser.email || cleanEmail, clientIp, userAgent);
    } catch (cookieErr) {
      console.warn("[verifyVendorWebOtp] Non-request context cookie error:", cookieErr);
    }

    return {
      success: true,
      message: "CPO authentication verified. Redirecting to CPO Panel.",
      redirectTo: "/cpo",
      role: "cpo",
      user: {
        id: cpoUser.id,
        email: cpoUser.email,
        name: cpoUser.name || "Chief Product Officer",
        role: "cpo",
      },
    };
  }

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
      message: "Access Denied: Email not registered as a vendor.",
    };
  }

  if (vendorRecord.status !== "approved") {
    return {
      success: false,
      message: `Access Denied: Vendor account status is ${vendorRecord.status}. Only approved vendors may sign in.`,
    };
  }

  // 5. Set secure HTTP-only vendor session cookie & signed HMAC token
  try {
    const cookieStore = await cookies();
    const vendorToken = generateVendorSessionToken(
      vendorRecord.id,
      vendorRecord.ownerId,
      vendorRecord.contactEmail || cleanEmail
    );
    cookieStore.set("intrihub_vendor_token", vendorToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
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
  redirectTo?: string;
  role?: string;
  vendor?: any;
  user?: any;
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

  if (password.length > 128) {
    return { success: false, message: "Password cannot exceed 128 characters." };
  }

  // 1b. Check if CPO account
  const cpoUser = await prisma.user.findFirst({
    where: {
      email: { equals: cleanEmail, mode: "insensitive" },
      role: { equals: "cpo", mode: "insensitive" },
    },
  });

  if (cpoUser) {
    if (!cpoUser.passwordHash) {
      return {
        success: false,
        message: "Password login is not enabled for this CPO account. Please use Email OTP.",
      };
    }

    const isValid = verifyPassword(password, cpoUser.passwordHash);
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
        message: `Invalid password. (${failCheck.remainingAttempts} attempt(s) remaining)`,
      };
    }

    resetVendorLoginLockout(clientIp);
    const { generateCpoSessionToken, sendCpoNewDeviceAlert } = await import("@/lib/cpo/auth");
    const { CPO_SESSION_COOKIE } = await import("@/lib/config/cpo-permissions");
    const cpoToken = await generateCpoSessionToken(cpoUser.id, cpoUser.email || cleanEmail);

    const cookieStore = await cookies();
    cookieStore.set(CPO_SESSION_COOKIE, cpoToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    const headerList = await headers();
    const userAgent = headerList.get("user-agent") || undefined;
    await sendCpoNewDeviceAlert(cpoUser.email || cleanEmail, clientIp, userAgent);

    return {
      success: true,
      message: "CPO authenticated successfully! Redirecting to CPO Panel.",
      redirectTo: "/cpo",
      role: "cpo",
      user: {
        id: cpoUser.id,
        email: cpoUser.email,
        name: cpoUser.name || "Chief Product Officer",
        role: "cpo",
      },
    };
  }

  // 1c. Check if Admin account
  const allowedAdminEmail = (process.env.ADMIN_ALLOWED_EMAIL || "admin@intrihub.com").toLowerCase().trim();
  const isAdmin = cleanEmail === allowedAdminEmail;
  if (isAdmin) {
    const adminUser = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: "insensitive" } },
    });
    if (adminUser?.passwordHash) {
      const isValid = verifyPassword(password, adminUser.passwordHash);
      if (isValid) {
        resetVendorLoginLockout(clientIp);
        const adminToken = generateAdminSessionToken(adminUser.id, cleanEmail);
        const cookieStore = await cookies();
        cookieStore.set("intrihub_admin_token", adminToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
        return {
          success: true,
          message: "Admin authenticated successfully! Redirecting to Admin Panel.",
          redirectTo: "/admin",
          role: "admin",
          user: {
            id: adminUser.id,
            email: cleanEmail,
            name: adminUser.name || "Super Admin",
            role: "admin",
          },
        };
      }
    }
  }

  // 2. Fetch vendor record
  let vendor = await prisma.vendor.findFirst({
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
        remainingAttempts: 0,
        retryAfterSeconds: failCheck.retryAfterSeconds,
        message: "Too many failed attempts (3/3). Account locked for 15 minutes.",
      };
    }
    return {
      success: false,
      remainingAttempts: failCheck.remainingAttempts,
      message: `Invalid email or password. (${failCheck.remainingAttempts} attempt(s) remaining)`,
    };
  }

  // Verify password against vendor or owner or vendorUser
  const storedHash = vendor?.passwordHash || vendor?.owner?.passwordHash || vendorUser?.passwordHash;
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
      message: `Invalid password. (${failCheck.remainingAttempts} attempt(s) remaining before lockout)`,
    };
  }

  // 5. Reset lockout on success
  resetVendorLoginLockout(clientIp);

  // 6. Set secure HTTP-only vendor session cookie & signed HMAC token
  const vendorId = vendor?.id || vendorUser?.id || "vendor-id";
  const ownerId = vendor?.ownerId || vendorUser?.id || "owner-id";
  const contactEmail = vendor?.contactEmail || vendorUser?.email || cleanEmail;
  const businessName = vendor?.businessName || vendorUser?.name || "Vendor Partner";

  try {
    const cookieStore = await cookies();
    const vendorToken = generateVendorSessionToken(vendorId, ownerId, contactEmail);
    cookieStore.set("intrihub_vendor_token", vendorToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    cookieStore.set(
      "intrihub_vendor_session",
      JSON.stringify({
        vendorId,
        ownerId,
        businessName,
        contactEmail,
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
    redirectTo: "/vendor",
    role: "vendor",
    vendor: {
      id: vendorId,
      businessName,
      slug: vendor?.slug || "vendor",
      contactEmail,
      contactPhone: vendor?.contactPhone,
      category: vendor?.category,
      status: vendor?.status || "approved",
      commissionRate: vendor?.commissionRate,
      ownerName: vendor?.owner?.name || businessName,
      ownerId,
      rejectionReason: vendor?.rejectionReason,
      mustChangePassword: false,
      loginMethod: vendor?.loginMethod || "password",
    },
  };
}


/**
 * Request an expiring, single-use password reset verification code
 */
export async function requestPasswordReset(email: string): Promise<{
  success: boolean;
  message: string;
  locked?: boolean;
  retryAfterSeconds?: number;
}> {
  const clientIp = await getClientIp();
  const lockout = checkVendorLoginLockout(clientIp);
  if (lockout.locked) {
    return {
      success: false,
      locked: true,
      retryAfterSeconds: lockout.retryAfterSeconds,
      message: "Too many attempts. Security lockout active.",
    };
  }

  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, message: "Please enter a valid email address." };
  }

  const { checkRateLimit } = await import("@/lib/rate-limit");
  const cooldown = checkRateLimit(`pwd-reset-cooldown:${cleanEmail}`, 1, 60 * 1000);
  if (!cooldown.allowed) {
    return {
      success: false,
      message: "Please wait at least 1 minute before requesting another password reset code.",
    };
  }

  const res = await sendEmailOtp(cleanEmail, "vendor");
  return {
    success: res.success,
    message: res.message,
  };
}

/**
 * Reset account password using verified OTP token
 */
export async function resetPasswordWithToken(
  email: string,
  otp: string,
  newPassword: string
): Promise<{
  success: boolean;
  message: string;
}> {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail || !otp || !newPassword) {
    return { success: false, message: "All fields are required." };
  }

  const { validatePasswordStrength, hashPassword, MAX_PASSWORD_LENGTH } = await import(
    "@/lib/password-security"
  );
  if (newPassword.length > MAX_PASSWORD_LENGTH) {
    return { success: false, message: `Password cannot exceed ${MAX_PASSWORD_LENGTH} characters.` };
  }

  const strength = validatePasswordStrength(newPassword);
  if (!strength.valid) {
    return { success: false, message: strength.error || "Password does not meet security requirements." };
  }

  // Verify and consume OTP token immediately
  const otpRes = await verifyEmailOtp(cleanEmail, otp, "vendor");
  if (!otpRes.success) {
    return { success: false, message: otpRes.message || "Invalid or expired verification code." };
  }

  const passwordHash = hashPassword(newPassword.trim());

  const user = await prisma.user.findFirst({
    where: { email: { equals: cleanEmail, mode: "insensitive" } },
  });

  if (!user) {
    return { success: false, message: "User account not found." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      mustChangePassword: false,
      emailVerified: true,
    },
  });

  await prisma.vendor.updateMany({
    where: {
      OR: [
        { ownerId: user.id },
        { contactEmail: { equals: cleanEmail, mode: "insensitive" } },
      ],
    },
    data: {
      passwordHash,
    },
  });

  return {
    success: true,
    message: "Password reset successfully! You can now log in with your new password.",
  };
}
