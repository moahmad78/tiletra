import { prisma } from "@/lib/prisma";
import { createCustomerNotification } from "@/lib/actions/notifications";
import { sendExpoPushNotification } from "@/lib/push-notifications";

export interface WorkspaceChangeSummary {
  itemsCreated: number;
  itemsUpdated: number;
  itemsDeleted: number;
  ordersUpdated: number;
  slotsUpdated: boolean;
  notes?: string;
}

/**
 * Dispatches a consolidated, batched notification to the vendor when an admin workspace session
 * ends or makes significant modifications. Avoids spamming the vendor per keystroke.
 *
 * Supports two call signatures:
 * 1. notifyVendorOfAdminChanges({ vendorId, adminEmail, summary, reason })  — batched
 * 2. notifyVendorOfAdminChanges(vendorId, message)  — simple inline message
 */
export async function notifyVendorOfAdminChanges(
  paramsOrVendorId:
    | {
        vendorId: string;
        adminEmail: string;
        summary: WorkspaceChangeSummary;
        reason: string;
      }
    | string,
  simpleMessage?: string
) {
  try {
    let vendorId: string;
    let message: string;
    let title = "Store Activity: IntriHub Team Support";

    if (typeof paramsOrVendorId === "string") {
      // Simple signature: notifyVendorOfAdminChanges(vendorId, message)
      vendorId = paramsOrVendorId;
      message = simpleMessage || "IntriHub team made changes to your store.";
    } else {
      // Object signature
      const { vendorId: vid, summary, reason, adminEmail } = paramsOrVendorId as any;
      vendorId = vid;

      const changeParts: string[] = [];
      if (summary.itemsCreated > 0) {
        changeParts.push(`added ${summary.itemsCreated} product${summary.itemsCreated > 1 ? "s" : ""}`);
      }
      if (summary.itemsUpdated > 0) {
        changeParts.push(`updated ${summary.itemsUpdated} product${summary.itemsUpdated > 1 ? "s" : ""}`);
      }
      if (summary.itemsDeleted > 0) {
        changeParts.push(`removed ${summary.itemsDeleted} product${summary.itemsDeleted > 1 ? "s" : ""}`);
      }
      if (summary.ordersUpdated > 0) {
        changeParts.push(`updated ${summary.ordersUpdated} order${summary.ordersUpdated > 1 ? "s" : ""}`);
      }
      if (summary.slotsUpdated) {
        changeParts.push("configured delivery slot settings");
      }

      if (changeParts.length === 0) {
        // No state-changing modifications made during session; skip spamming
        return { success: true, skipped: true };
      }

      const actorLabel = (adminEmail?.toLowerCase().includes("cpo") || reason?.toLowerCase().includes("cpo"))
        ? "IntriHub CPO"
        : "IntriHub Team";

      message = `${actorLabel} ${changeParts.join(", ")} on your store (${reason}).`;
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        owner: {
          include: {
            pushTokens: true,
          },
        },
      },
    });

    if (!vendor || !vendor.owner) return { success: false, error: "Vendor not found" };

    // 1. In-App Notification (Vendor Account)
    await createCustomerNotification({
      userId: vendor.owner.id,
      title,
      message,
      type: "system",
      link: "/vendor/products",
    });

    // 2. Mobile Push Notification
    if (vendor.owner.pushTokens && vendor.owner.pushTokens.length > 0) {
      const tokens = vendor.owner.pushTokens.map((t) => t.token);
      await sendExpoPushNotification({
        to: tokens,
        title,
        body: message,
        data: {
          type: "vendor_admin_activity",
          vendorId,
        },
        priority: "high",
      });
    }

    return { success: true, messageSent: true };
  } catch (error: any) {
    console.error("notifyVendorOfAdminChanges error:", error);
    return { success: false, error: error?.message || "Notification failed" };
  }
}
