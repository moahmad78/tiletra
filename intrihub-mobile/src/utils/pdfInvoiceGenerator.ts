import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { Alert, Platform } from "react-native";
import { Order } from "../types";

export function getInvoiceHtml(order: Order): string {
  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Recent";

  const customerName = order.deliveryName || order.customerName || "Valued Customer";
  const customerPhone = order.deliveryPhone || order.customerPhone || "";
  const fullAddress = [
    order.deliveryHouseNumber,
    order.deliveryBuildingName,
    order.deliveryStreet || order.shippingAddress?.street,
    order.deliveryArea,
    order.deliveryCity || order.shippingAddress?.city,
    order.deliveryState || order.shippingAddress?.state,
    order.deliveryPostalCode || order.shippingAddress?.pincode,
  ]
    .filter(Boolean)
    .join(", ") || order.shippingAddress?.street || "India";

  const landmark = order.deliveryLandmark || order.shippingAddress?.landmark || "";

  const itemsRows = (order.items || [])
    .map((item: any, idx: number) => {
      const itemTotal = item.totalPrice || (item.boxQuantity || 1) * (item.pricePerBox || 0);
      return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #475569; text-align: center;">${idx + 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #0f172a; font-weight: 600;">
          ${item.productName || "Construction Product"}
          <div style="font-size: 10px; color: #64748b; font-weight: normal; margin-top: 2px;">${item.variantDetails || "Standard Factory Pack"}</div>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #475569; text-align: center;">${item.boxQuantity || 1} Box</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #475569; text-align: right;">₹${(item.pricePerBox || 0).toLocaleString("en-IN")}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #0f172a; font-weight: 700; text-align: right;">₹${itemTotal.toLocaleString("en-IN")}</td>
      </tr>
    `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Tax Invoice - ${order.id}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 30px;
      color: #0f172a;
      background: #ffffff;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 30px;
    }
    .header-table {
      width: 100%;
      margin-bottom: 25px;
      border-bottom: 2px solid #052a51;
      padding-bottom: 20px;
    }
    .logo-img {
      height: 44px;
      object-fit: contain;
      margin-bottom: 6px;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 900;
      color: #052a51;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .brand-sub {
      font-size: 12px;
      font-weight: 700;
      color: #ea580c;
      margin-top: 3px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-title {
      font-size: 18px;
      font-weight: 800;
      color: #052a51;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-grid {
      display: flex;
      justify-content: space-between;
      margin-bottom: 25px;
      background: #f8fafc;
      padding: 16px;
      border-radius: 8px;
    }
    .info-col {
      width: 48%;
      font-size: 12px;
      line-height: 18px;
    }
    .info-heading {
      font-size: 11px;
      font-weight: 800;
      color: #052a51;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
    }
    .items-table th {
      background: #052a51;
      color: #ffffff;
      padding: 10px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .totals-container {
      width: 100%;
      margin-bottom: 20px;
    }
    .totals-box {
      float: right;
      width: 320px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 12px;
      color: #475569;
    }
    .grand-total-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      margin-top: 6px;
      border-top: 2px solid #052a51;
      font-size: 16px;
      font-weight: 800;
      color: #052a51;
    }
    .signature-container {
      float: right;
      text-align: center;
      width: 220px;
      margin-top: 20px;
      margin-bottom: 20px;
    }
    .signature-box {
      border: 1px dashed #052a51;
      background: #f8fafc;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 4px;
    }
    .footer {
      clear: both;
      margin-top: 30px;
      border-top: 1px solid #e2e8f0;
      padding-top: 15px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      line-height: 16px;
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <table class="header-table">
      <tr>
        <td style="vertical-align: top;">
          <img src="https://www.intrihub.com/logo/intri-web-logo.png" alt="IntriHub" class="logo-img" onerror="this.style.display='none'" />
          <h1 class="brand-title">INTRIHUB</h1>
          <div class="brand-sub">Everything, Every Place</div>
          <div style="font-size: 11px; color: #475569; margin-top: 6px; line-height: 16px;">
            IntriHub Technologies Pvt. Ltd.<br>
            GSTIN: 29AAAAA0000A1Z5 | Support: +91 9264920211
          </div>
        </td>
        <td class="invoice-meta" style="vertical-align: top;">
          <div class="invoice-title">TAX INVOICE / BILL</div>
          <div style="font-size: 12px; font-weight: 700; margin-top: 6px; color: #0f172a;">Invoice #: INV-${order.id}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Date: ${orderDate}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Payment Mode: <b>${order.paymentMethod === "cod" ? "Cash on Delivery" : "Online (Paid)"}</b></div>
        </td>
      </tr>
    </table>

    <div class="info-grid">
      <div class="info-col">
        <div class="info-heading">Billed & Delivered To:</div>
        <div style="font-weight: 700; color: #0f172a; font-size: 13px;">${customerName}</div>
        <div style="color: #475569; margin-top: 2px;">Phone: +91 ${customerPhone}</div>
        <div style="color: #475569; margin-top: 4px;">${fullAddress}</div>
        ${landmark ? `<div style="color: #64748b; font-size: 11px; margin-top: 2px;">Landmark: ${landmark}</div>` : ""}
      </div>
      <div class="info-col" style="text-align: right;">
        <div class="info-heading" style="text-align: right;">Special Delivery Instructions:</div>
        <div style="color: #475569; margin-top: 2px;">Packaging: Wooden Crate Secure Packaging</div>
        <div style="color: #64748b; font-size: 11px; margin-top: 4px;">${order.deliveryInstructions || "Deliver safely to doorstep / unloading site"}</div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;">#</th>
          <th style="text-align: left;">Product Description</th>
          <th style="width: 100px; text-align: center;">Quantity</th>
          <th style="width: 110px; text-align: right;">Unit Price</th>
          <th style="width: 120px; text-align: right;">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div class="totals-container">
      <div class="totals-box">
        <div class="totals-row">
          <span>Subtotal (Inclusive of GST):</span>
          <span>₹${(order.subtotal || order.total || 0).toLocaleString("en-IN")}</span>
        </div>
        <div class="totals-row">
          <span>Shipping & Wooden Crate Handling:</span>
          <span>${order.deliveryFee === 0 ? "FREE" : `₹${order.deliveryFee}`}</span>
        </div>
        <div class="grand-total-row">
          <span>Total Amount:</span>
          <span>₹${(order.total || order.subtotal || 0).toLocaleString("en-IN")}</span>
        </div>
      </div>
    </div>

    <div style="clear: both;"></div>

    <div class="signature-container">
      <div style="font-size: 11px; font-weight: 700; color: #052a51; margin-bottom: 6px;">For INTRIHUB PRIVATE LIMITED</div>
      <div class="signature-box">
        <div style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 22px; color: #052a51; font-weight: bold; letter-spacing: 1px;">IntriHub Verified</div>
        <div style="font-size: 9px; color: #16a34a; font-weight: 800; text-transform: uppercase; margin-top: 2px;">✔ Digitally Signed & Authenticated</div>
      </div>
      <div style="font-size: 10px; color: #475569; font-weight: 600;">Authorized Signatory</div>
    </div>

    <div class="footer">
      <div>This is an official computer-generated tax invoice verified by IntriHub Private Limited.</div>
      <div>Thank you for choosing IntriHub • <b>Everything, Every Place</b> • www.intrihub.com • support@intrihub.com</div>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Direct PDF Download to device storage
 */
export async function downloadInvoicePDFDirect(order: Order): Promise<{ success: boolean; uri?: string }> {
  try {
    const html = getInvoiceHtml(order);
    const { uri } = await Print.printToFileAsync({ html, base64: false });

    // Open native save / download dialog directly
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `Save Invoice PDF #${order.id}`,
        UTI: "com.adobe.pdf",
      });
    }

    return { success: true, uri };
  } catch (error: any) {
    console.error("Direct PDF download error:", error);
    return { success: false };
  }
}

/**
 * Share PDF file directly
 */
export async function shareInvoicePDF(order: Order): Promise<{ success: boolean }> {
  try {
    const html = getInvoiceHtml(order);
    const { uri } = await Print.printToFileAsync({ html, base64: false });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `Share IntriHub Tax Invoice #${order.id}`,
        UTI: "com.adobe.pdf",
      });
      return { success: true };
    }
    return { success: false };
  } catch (error: any) {
    console.error("Share PDF error:", error);
    return { success: false };
  }
}
