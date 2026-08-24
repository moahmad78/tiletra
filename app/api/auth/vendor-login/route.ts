import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword } from "@/lib/password-security";
import { checkRateLimit, isLockedOut, recordFailedAttempt, resetFailedAttempts } from "@/lib/rate-limit";

// Explicitly disallow GET to prevent unauthenticated vendor discovery / IDOR
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Authentication required via POST." },
    { status: 405 }
  );
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "anonymous";

    // 1. IP Rate Limiting (max 15 login attempts per minute per IP)
    const rateCheck = checkRateLimit(`login-ip:${ip}`, 15, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts from this network. Please wait a minute." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { username, password } = body;

    const query = (username || "").toLowerCase().trim();
    if (!query) {
      return NextResponse.json({ error: "Please enter your email or phone number" }, { status: 400 });
    }

    // 2. Account Brute-Force Lockout Check
    const lockoutStatus = isLockedOut(`vendor-auth:${query}`);
    if (lockoutStatus.locked) {
      const waitMinutes = Math.ceil(((lockoutStatus.lockoutUntil || Date.now()) - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Account temporarily locked due to repeated failed logins. Please retry in ${waitMinutes} minute(s).` },
        { status: 423 }
      );
    }

    const cleanPhone = query.replace(/\D/g, "");

    const vendor = await prisma.vendor.findFirst({
      where: {
        OR: [
          { contactEmail: { equals: query, mode: "insensitive" } },
          cleanPhone.length === 10 ? { contactPhone: cleanPhone } : {},
          { slug: query },
        ],
      },
      include: {
        owner: true,
      },
    });

    if (!vendor) {
      recordFailedAttempt(`vendor-auth:${query}`, 5, 15 * 60 * 1000);
      return NextResponse.json({ error: "Invalid credentials. Please check your email or password." }, { status: 401 });
    }

    // 3. Strict Password Verification
    const ownerPasswordHash = vendor.owner?.passwordHash;

    if (ownerPasswordHash) {
      if (!password || !password.trim()) {
        recordFailedAttempt(`vendor-auth:${query}`, 5, 15 * 60 * 1000);
        return NextResponse.json({ error: "Password is required to access vendor portal." }, { status: 401 });
      }

      const isValidPassword = verifyPassword(password.trim(), ownerPasswordHash);

      if (!isValidPassword) {
        const attemptResult = recordFailedAttempt(`vendor-auth:${query}`, 5, 15 * 60 * 1000);
        if (attemptResult.locked) {
          return NextResponse.json(
            { error: "Too many failed attempts. Account locked for 15 minutes." },
            { status: 423 }
          );
        }
        return NextResponse.json(
          { error: "Invalid credentials. Please check your email or password." },
          { status: 401 }
        );
      }

      // Upgrade legacy SHA256 to modern salted scrypt in background
      if (!ownerPasswordHash.startsWith("scrypt:") && vendor.ownerId) {
        const upgradedHash = hashPassword(password.trim());
        await prisma.user.update({
          where: { id: vendor.ownerId },
          data: { passwordHash: upgradedHash },
        }).catch((err) => console.warn("Failed to upgrade password hash:", err));
      }
    }

    // 4. Successful login: reset failed attempt counter
    resetFailedAttempts(`vendor-auth:${query}`);

    return NextResponse.json({
      success: true,
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        slug: vendor.slug,
        contactEmail: vendor.contactEmail,
        contactPhone: vendor.contactPhone,
        category: vendor.category,
        status: vendor.status,
        commissionRate: vendor.commissionRate,
        rejectionReason: vendor.rejectionReason,
        ownerName: vendor.owner?.name || vendor.businessName,
        ownerId: vendor.ownerId,
        mustChangePassword: vendor.owner?.mustChangePassword ?? (ownerPasswordHash ? false : true),
      },
    });
  } catch (error: any) {
    console.error("Vendor login POST error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
