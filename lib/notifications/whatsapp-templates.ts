/**
 * Intrihub Role-Aware Automated Notification & WhatsApp Template Engine
 *
 * Provides standardized, branded, warm, and role-specific messaging across:
 * - Vendor Onboarding & Welcome
 * - Customer Welcome & Follow-ups
 * - Internal Staff Invites & Role Grants
 * - Order Status Updates & Inquiries
 */

export const INTRIHUB_BRAND = {
  name: "Intrihub",
  tagline: "India's interior & construction supply marketplace",
  website: "https://intrihub.com",
  vendorLoginUrl: "https://intrihub.com/vendor/login",
  adminLoginUrl: "https://intrihub.com/admin/login",
  customerShopUrl: "https://intrihub.com/shop",
  ordersUrl: "https://intrihub.com/account/orders",
  supportPhone: "+91 78709 35277",
  supportEmail: "hello@intrihub.com",
  logoUrl: "https://intrihub.com/logo/intri-web-logo.png",
  iconUrl: "https://intrihub.com/logo/intri-icon.png",
};

export type NotificationRole = "vendor" | "customer" | "staff" | "order_update" | "inquiry";

export interface VendorWelcomeContext {
  businessName: string;
  contactName?: string;
  username: string;
  password?: string;
  commissionRate?: number | string;
  loginUrl?: string;
  phone?: string;
}

export interface CustomerWelcomeContext {
  customerName: string;
  phone?: string;
  shopUrl?: string;
}

export interface StaffInviteContext {
  staffName: string;
  roleTitle: string;
  username: string;
  password?: string;
  loginUrl?: string;
  phone?: string;
}

export interface OrderUpdateContext {
  orderId: string;
  customerName: string;
  status: string;
  totalAmount?: number;
  itemSummary?: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  phone?: string;
}

export interface InquiryContext {
  recipientName: string;
  subject?: string;
  contextNote?: string;
  phone?: string;
}

export type NotificationContextMap = {
  vendor: VendorWelcomeContext;
  customer: CustomerWelcomeContext;
  staff: StaffInviteContext;
  order_update: OrderUpdateContext;
  inquiry: InquiryContext;
};

/**
 * Generates branded, role-tailored text content for notifications & WhatsApp
 */
export function generateNotificationMessage<R extends NotificationRole>(
  role: R,
  context: NotificationContextMap[R]
): string {
  switch (role) {
    case "vendor": {
      const ctx = context as VendorWelcomeContext;
      const portalUrl = ctx.loginUrl || INTRIHUB_BRAND.vendorLoginUrl;
      const commissionText = ctx.commissionRate !== undefined ? `💰 *Commission Rate:* ${ctx.commissionRate}%\n` : "";
      const passwordText = ctx.password ? `🔑 *Initial Password:* ${ctx.password}\n` : "";

      return [
        `🎉 *Welcome to Intrihub, ${ctx.businessName}!*`,
        "",
        `We're thrilled to have you on board as a seller on India's growing interior & construction supply marketplace. 🏗️🛠️`,
        "",
        `Your shop is approved and ready to go live!`,
        "",
        `🔐 *Login Portal:* ${portalUrl}`,
        `👤 *Username:* ${ctx.username}`,
        passwordText ? passwordText.trimEnd() : null,
        commissionText ? commissionText.trimEnd() : null,
        "",
        `📌 *For your security, you'll be asked to set your own password on first login.*`,
        "",
        `Need help getting started? Just reply here — our team's got your back. 🚀`,
        "",
        `— *Team Intrihub*`,
      ]
        .filter((line) => line !== null)
        .join("\n");
    }

    case "customer": {
      const ctx = context as CustomerWelcomeContext;
      const shopUrl = ctx.shopUrl || INTRIHUB_BRAND.customerShopUrl;

      return [
        `👋 *Welcome to Intrihub, ${ctx.customerName}!*`,
        "",
        `Thank you for joining India's trusted destination for premium tiles, bath fittings, and building supplies. 🏠✨`,
        "",
        `Explore 10,000+ curated products from verified manufacturers with direct factory pricing and doorstep delivery.`,
        "",
        `🛍️ *Start Exploring:* ${shopUrl}`,
        `💬 *Need recommendations or a custom quote?* Just reply to this chat anytime — our experts are here to help.`,
        "",
        `Happy Building! 👷‍♂️📦`,
        `— *Team Intrihub*`,
      ].join("\n");
    }

    case "staff": {
      const ctx = context as StaffInviteContext;
      const adminUrl = ctx.loginUrl || INTRIHUB_BRAND.adminLoginUrl;
      const passwordText = ctx.password ? `🔑 *Temporary Password:* ${ctx.password}\n` : "";

      return [
        `🏢 *Welcome to the Intrihub Team, ${ctx.staffName}!*`,
        "",
        `Your internal operations account for the *${ctx.roleTitle}* role is active. 💼`,
        "",
        `🔐 *Admin Portal:* ${adminUrl}`,
        `👤 *Username:* ${ctx.username}`,
        passwordText ? passwordText.trimEnd() : null,
        "",
        `📌 *Please log in and update your security credentials upon first access.*`,
        "",
        `Let's build something extraordinary together! 🚀`,
        `— *Intrihub Operations*`,
      ]
        .filter((line) => line !== null)
        .join("\n");
    }

    case "order_update": {
      const ctx = context as OrderUpdateContext;
      const totalStr = ctx.totalAmount ? `\n🧾 *Total Amount:* ₹${ctx.totalAmount.toLocaleString("en-IN")}` : "";
      const deliveryStr = ctx.estimatedDelivery ? `\n🚚 *Estimated Delivery:* ${ctx.estimatedDelivery}` : "";
      const trackingStr = ctx.trackingNumber ? `\n📍 *Tracking No:* ${ctx.trackingNumber}` : "";

      return [
        `📦 *Order Update: #${ctx.orderId}*`,
        "",
        `Hi ${ctx.customerName}, here is the latest update on your Intrihub order.`,
        "",
        `📊 *Status:* ${ctx.status}${totalStr}${deliveryStr}${trackingStr}`,
        ctx.itemSummary ? `📋 *Items:* ${ctx.itemSummary}` : "",
        "",
        `Track your order live: ${INTRIHUB_BRAND.ordersUrl}`,
        "",
        `Have questions or need assistance? Reply directly to this chat. 💬`,
        `— *Team Intrihub*`,
      ]
        .filter((line) => line !== "")
        .join("\n");
    }

    case "inquiry": {
      const ctx = context as InquiryContext;
      return [
        `Hello ${ctx.recipientName},`,
        "",
        ctx.contextNote || `Regarding your request on Intrihub...`,
        "",
        `How can we best assist you today? Feel free to share your requirements or questions here. 💬`,
        "",
        `— *Team Intrihub*`,
      ].join("\n");
    }

    default:
      return `Welcome to Intrihub! 🏗️\n— Team Intrihub`;
  }
}

/**
 * Formats a clean, standard WhatsApp Web / mobile redirect URL
 */
export function buildWhatsAppShareUrl<R extends NotificationRole>(
  phone: string | undefined | null,
  role: R,
  context: NotificationContextMap[R]
): string {
  const cleanPhone = (phone || "").replace(/[^0-9]/g, "");
  // Prepend 91 (India) if 10 digits
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const message = generateNotificationMessage(role, context);

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Returns full message payload structure (Media Image + Caption)
 * Ready for direct WhatsApp Business Cloud API / Webhook integration
 */
export function buildWhatsAppApiPayload<R extends NotificationRole>(
  recipientPhone: string,
  role: R,
  context: NotificationContextMap[R]
) {
  const cleanPhone = recipientPhone.replace(/[^0-9]/g, "");
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const caption = generateNotificationMessage(role, context);

  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: formattedPhone,
    type: "image",
    image: {
      link: INTRIHUB_BRAND.logoUrl,
      caption: caption,
    },
  };
}
