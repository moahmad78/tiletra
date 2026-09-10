import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { deliverEmail } from "@/lib/actions/email-otp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { emailOrPhone, accountType = "user", reason = "" } = body;

    if (!emailOrPhone || typeof emailOrPhone !== "string" || !emailOrPhone.trim()) {
      return NextResponse.json(
        { success: false, error: "Registered email address or phone number is required." },
        { status: 400 }
      );
    }

    const cleanInput = emailOrPhone.trim();
    const isEmail = cleanInput.includes("@");
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // 1. Locate user/vendor in database
    let matchedUser = null;
    let matchedVendor = null;

    if (accountType === "business") {
      matchedVendor = await prisma.vendor.findFirst({
        where: {
          OR: [
            { contactEmail: { equals: cleanInput, mode: "insensitive" } },
            { contactPhone: { contains: cleanInput.replace(/\D/g, "") } },
          ],
        },
      });
    } else {
      matchedUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: cleanInput, mode: "insensitive" } },
            { phone: { contains: cleanInput.replace(/\D/g, "") } },
          ],
        },
      });
    }

    // 2. Generate unique Deletion Tracking Reference Ticket ID
    const ticketId = `DEL-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    // 3. Persist audit log record
    await prisma.auditLog.create({
      data: {
        action: "ACCOUNT_DELETION_REQUEST",
        entity: accountType === "business" ? "Vendor" : "User",
        entityId: matchedUser?.id || matchedVendor?.id || null,
        userId: matchedUser?.id || null,
        details: {
          ticketId,
          identifier: cleanInput,
          accountType,
          reason: reason ? String(reason).trim().slice(0, 1000) : "Not specified",
          matchedUserId: matchedUser?.id || null,
          matchedVendorId: matchedVendor?.id || null,
          status: "PENDING_VERIFICATION",
          submittedAt: new Date().toISOString(),
          ipAddress: clientIp,
        },
        ipAddress: clientIp,
      },
    });

    console.log(
      `[ACCOUNT_DELETION_REQUEST] ticketId=${ticketId} type=${accountType} identifier=${cleanInput} matched=${Boolean(matchedUser || matchedVendor)}`
    );

    // 4. Send email confirmation if email is available
    const recipientEmail = isEmail
      ? cleanInput
      : matchedUser?.email || matchedVendor?.contactEmail;

    if (recipientEmail) {
      try {
        await deliverEmail({
          to: recipientEmail,
          subject: `IntriHub Account & Data Deletion Request Registered [${ticketId}]`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
              <h2 style="color: #052a51;">Account Deletion Request Registered</h2>
              <p>Hello,</p>
              <p>We have received an account and data deletion request for your <strong>IntriHub ${accountType === "business" ? "Business / Vendor" : "Customer"}</strong> account associated with <strong>${cleanInput}</strong>.</p>
              
              <div style="background-color: #f8fafc; border-left: 4px solid #052a51; padding: 12px 16px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px;"><strong>Reference Ticket ID:</strong> ${ticketId}</p>
                <p style="margin: 4px 0 0; font-size: 14px;"><strong>Target Timeline:</strong> 48 to 72 business hours</p>
                <p style="margin: 4px 0 0; font-size: 14px;"><strong>Status:</strong> Pending Security Verification</p>
              </div>

              <h4 style="color: #052a51; margin-bottom: 8px;">What will be purged:</h4>
              <ul style="font-size: 14px; line-height: 1.6; color: #475569;">
                <li>Profile details, saved delivery addresses, and authentication tokens.</li>
                <li>Saved shopping cart items, wishlists, and push notification tokens.</li>
                <li>Active user sessions across web and mobile applications.</li>
              </ul>

              <h4 style="color: #052a51; margin-bottom: 8px;">Data Retained:</h4>
              <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
                In accordance with Indian tax laws (Companies Act, 2013 and GST regulations), historical order transactions and invoices are retained for mandatory statutory audit periods with user linkages disassociated.
              </p>

              <p style="font-size: 13px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                If you did not request this deletion, please contact our support desk immediately at <a href="mailto:support@intrihub.com" style="color: #052a51;">support@intrihub.com</a>.
              </p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.warn(`[ACCOUNT_DELETION_EMAIL_FAILED] email=${recipientEmail}`, emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Account deletion request successfully submitted and registered.",
      ticketId,
      estimatedHours: 72,
    });
  } catch (error: any) {
    console.error("[ACCOUNT_DELETION_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process deletion request." },
      { status: 500 }
    );
  }
}
