import { ConnectTemplateData } from "./types";

export const DEFAULT_TEMPLATES: ConnectTemplateData[] = [
  {
    id: "tmpl-del-delay",
    name: "Delivery Update & Rescheduling",
    category: "Delivery update",
    channel: "ALL",
    subject: "Update on your IntriHub order {{order_id}}",
    variables: ["customer_name", "order_id", "delivery_address", "agent_name"],
    language: "English",
    status: "APPROVED",
    textContent:
      "Hello {{customer_name}},\n\nWe are checking the dispatch status of your order {{order_id}} for delivery to {{delivery_address}}. Our freight vehicle is scheduled for offloading shortly. We will share the driver's contact once en route.\n\nBest regards,\n{{agent_name}}\nIntriHub Operations Desk",
    updatedAt: "2026-09-20",
  },
  {
    id: "tmpl-ord-conf",
    name: "Order Confirmation & Dispatch Notice",
    category: "Order confirmation",
    channel: "ALL",
    subject: "Confirmed: Order {{order_id}} is being prepared",
    variables: ["customer_name", "order_id", "product_name", "agent_name"],
    language: "English",
    status: "APPROVED",
    textContent:
      "Hello {{customer_name}},\n\nYour order {{order_id}} for {{product_name}} has been confirmed and is queued for warehouse packaging. Delivery is expected within 24 to 48 hours.\n\nThank you for choosing IntriHub,\n{{agent_name}}",
    updatedAt: "2026-09-20",
  },
  {
    id: "tmpl-quote-bulk",
    name: "B2B Contractor Bulk Quotation",
    category: "Sales",
    channel: "ALL",
    subject: "IntriHub Commercial Quotation for {{product_name}}",
    variables: ["customer_name", "product_name", "agent_name"],
    language: "English",
    status: "APPROVED",
    textContent:
      "Hello {{customer_name}},\n\nThank you for your bulk inquiry regarding {{product_name}}. We have applied tier-1 contractor pricing with full GST input tax credit (ITC). Please let us know your required delivery date to lock the dispatch schedule.\n\nSincerely,\n{{agent_name}}\nIntriHub Commercial Sales Desk",
    updatedAt: "2026-09-20",
  },
  {
    id: "tmpl-pay-recon",
    name: "Payment Verification & Reconciliation",
    category: "Payment",
    channel: "ALL",
    subject: "Payment Status Update for Order {{order_id}}",
    variables: ["customer_name", "order_id", "agent_name"],
    language: "English",
    status: "APPROVED",
    textContent:
      "Hello {{customer_name}},\n\nWe are verifying the payment transaction for order {{order_id}} with our banking gateway. If the amount was debited from your account, it will reflect within 24 hours without any deduction.\n\nWarm regards,\n{{agent_name}}\nIntriHub Accounts Team",
    updatedAt: "2026-09-20",
  },
];

export interface TemplateContext {
  customer_name?: string;
  order_id?: string;
  product_name?: string;
  order_total?: string;
  delivery_address?: string;
  tracking_link?: string;
  agent_name?: string;
  company_name?: string;
}

/**
 * Interpolates variables in template text (e.g. {{customer_name}} -> Rahul Sharma)
 */
export function renderTemplateText(templateText: string, context: TemplateContext): string {
  let result = templateText;
  const defaults: TemplateContext = {
    customer_name: "Customer",
    order_id: "IH-10291",
    product_name: "20mm PVC Conduit Pipes",
    order_total: "₹8,400",
    delivery_address: "Bangalore, Karnataka",
    tracking_link: "https://intrihub.com/track/IH-10291",
    agent_name: "Amit (Support Lead)",
    company_name: "IntriHub",
    ...context,
  };

  for (const [key, val] of Object.entries(defaults)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    result = result.replace(regex, val || "");
  }

  return result;
}
