import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

/**
 * Clean phone number helper to prevent showing synthetic identifiers on printed bills.
 */
function sanitizePhone(phone?: string | null): string {
  if (!phone) return "";
  const str = String(phone).trim();
  const lower = str.toLowerCase();
  if (
    lower.startsWith("email_") ||
    lower.startsWith("google_") ||
    lower.includes("email") ||
    lower.includes("gmail") ||
    lower.includes("yahoo") ||
    lower.includes("@") ||
    lower.includes("_") ||
    /[a-zA-Z]/.test(str)
  ) {
    return "";
  }
  const digits = str.replace(/\D/g, "");
  if (digits.length < 7) return "";
  return digits.length > 10 ? digits.slice(-10) : digits;
}

/**
 * Generate standard HTML Tax Invoice template for IntriHub Orders with dynamic CMS controls
 */
export function generateOrderInvoiceHtml(order: any, customSettings?: any): string {
  const orderId = order?.orderNumber || order?.id?.slice(-8).toUpperCase() || "ORD-0000";
  const orderDate = order?.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleDateString("en-IN");

  const customerName = order?.deliveryName || order?.customerName || "Valued Customer";
  const rawPhone = order?.deliveryPhone || order?.customerPhone;
  const cleanPhone = sanitizePhone(rawPhone);
  const phoneDisplay = cleanPhone ? `+91 ${cleanPhone}` : "Not Provided";

  // Build clean, non-repeating full customer address
  let fullAddress = "";
  if (
    order?.deliveryAddress &&
    typeof order.deliveryAddress === "string" &&
    order.deliveryAddress.trim().length > 5 &&
    !order.deliveryAddress.toLowerCase().includes("site location")
  ) {
    fullAddress = order.deliveryAddress.trim();
  } else if (
    order?.customerAddress &&
    typeof order.customerAddress === "string" &&
    order.customerAddress.trim().length > 5 &&
    !order.customerAddress.toLowerCase().includes("site location")
  ) {
    fullAddress = order.customerAddress.trim();
  } else {
    let addrObj: any = null;
    if (order?.shippingAddress) {
      if (typeof order.shippingAddress === "string") {
        try {
          addrObj = JSON.parse(order.shippingAddress);
        } catch {
          if (order.shippingAddress.trim().length > 3 && !order.shippingAddress.toLowerCase().includes("site location")) {
            fullAddress = order.shippingAddress.trim();
          }
        }
      } else if (typeof order.shippingAddress === "object") {
        addrObj = order.shippingAddress;
      }
    }

    if (!fullAddress && addrObj && typeof addrObj === "object") {
      if (addrObj.formattedAddress && typeof addrObj.formattedAddress === "string" && addrObj.formattedAddress.trim().length > 5) {
        fullAddress = addrObj.formattedAddress.trim();
      } else {
        const houseOrBuilding = [
          addrObj.houseNumber || addrObj.flatNumber || null,
          addrObj.buildingName || addrObj.building || null,
        ].filter(Boolean).join(", ");

        const streetAndArea = [
          addrObj.line1 || addrObj.street || addrObj.addressLine1 || null,
          addrObj.line2 || addrObj.area || addrObj.addressLine2 || null,
        ].filter(Boolean).join(", ");

        const landmark = addrObj.landmark ? `Landmark: ${addrObj.landmark}` : null;
        const city = addrObj.city || null;
        const statePin = [
          addrObj.state || null,
          addrObj.pincode || addrObj.postalCode || addrObj.zipCode || null,
        ].filter(Boolean).join(" - ");

        fullAddress = [houseOrBuilding, streetAndArea, landmark, city, statePin].filter(Boolean).join(", ");
      }
    }

    if (!fullAddress || fullAddress.trim().length < 5) {
      const houseOrBuilding = [
        order?.deliveryHouseNumber || null,
        order?.deliveryBuildingName || null,
      ].filter(Boolean).join(", ");

      const streetAndArea = [
        order?.deliveryStreet || null,
        order?.deliveryArea || null,
      ].filter(Boolean).join(", ");

      const landmark = order?.deliveryLandmark ? `Landmark: ${order.deliveryLandmark}` : null;
      const city = order?.deliveryCity || null;
      const statePin = [
        order?.deliveryState || null,
        order?.deliveryPostalCode || null,
      ].filter(Boolean).join(" - ");

      fullAddress = [houseOrBuilding, streetAndArea, landmark, city, statePin].filter(Boolean).join(", ");
    }
  }

  if (!fullAddress || fullAddress.toLowerCase().includes("site location") || fullAddress.trim().length < 3) {
    fullAddress = "Bengaluru, Karnataka";
  }

  const pMethod = String(order?.paymentMethod || "cod").toLowerCase();
  const paymentText = pMethod === "cod" ? "COD Payment" : "Online Payment";

  // Dynamic CMS Settings with fallback
  const settings = customSettings || order?.storeSettings || {};
  const gstNo = settings.gstNumber || "29AAAAA0000A1Z5";
  const supportPhone = settings.contactPhone || "+91 9264920211";
  const supportEmail = settings.email || "support@intrihub.com";
  const sigText = settings.invoiceSignatureText || "INTRIHUB";
  const sigTitle = settings.invoiceSignatureTitle || "Authorized Signatory";
  const digitalBadge = settings.invoiceDigitalBadge || "✔ Digitally Signed";
  const termsText = settings.invoiceTermsNotes || "• Computer-generated tax invoice verified by IntriHub.\n• Everything, Every Place • www.intrihub.com";
  const footerTagline = settings.invoiceFooterTagline || "This is an official computer-generated tax invoice verified by IntriHub.";
  const watermarkUrl = settings.invoiceWatermarkUrl || "https://www.intrihub.com/logo/intri-web-logo.png";

  const termsListHtml = termsText
    .split("\n")
    .map((line: string) => `<div>${line.startsWith("•") ? line : `• ${line}`}</div>`)
    .join("");

  const items = order?.items || [];
  const itemsRows = items.length > 0
    ? items
        .map((item: any, idx: number) => {
          const qty = item.boxQuantity || item.quantity || 1;
          const price = item.pricePerBox || item.price || 0;
          const lineTotal = item.totalPrice || qty * price;
          return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #475569; text-align: center;">${idx + 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #0f172a; font-weight: 600;">
            ${item.productName || "Material Product"}
            ${item.variantDetails ? `<div style="font-size: 10px; color: #64748b; font-weight: normal; margin-top: 2px;">${item.variantDetails}</div>` : ""}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #475569; text-align: center;">${qty} Box</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #475569; text-align: right;">₹${price.toLocaleString("en-IN")}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #0f172a; font-weight: 700; text-align: right;">₹${lineTotal.toLocaleString("en-IN")}</td>
        </tr>
      `;
        })
        .join("")
    : `
      <tr>
        <td colspan="5" style="padding: 16px; text-align: center; color: #64748b; font-size: 12px;">Standard Order Package</td>
      </tr>
    `;

  const subtotal = order?.subtotal || order?.total || 0;
  const deliveryFee = order?.deliveryFee || 0;
  const grandTotal = order?.total || order?.totalAmount || subtotal + deliveryFee;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Tax Invoice #${orderId}</title>
  <style>
    @page { size: A4; margin: 10mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 16px;
      color: #0f172a;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 24px;
      position: relative;
      background: #ffffff;
    }
    .watermark {
      position: absolute;
      top: 52%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 340px;
      height: 340px;
      opacity: 0.05;
      pointer-events: none;
      z-index: 0;
      object-fit: contain;
    }
    .content-wrapper {
      position: relative;
      z-index: 1;
    }
    .header-table {
      width: 100%;
      margin-bottom: 20px;
      border-bottom: 2px solid #052a51;
      padding-bottom: 16px;
    }
    .logo-img {
      height: 52px;
      max-width: 220px;
      object-fit: contain;
      margin-bottom: 6px;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-title {
      font-size: 18px;
      font-weight: 900;
      color: #052a51;
      letter-spacing: 0.5px;
    }
    .info-grid {
      width: 100%;
      margin-bottom: 20px;
    }
    .info-col {
      width: 100%;
      vertical-align: top;
    }
    .info-heading {
      font-size: 11px;
      font-weight: 800;
      color: #052a51;
      text-transform: uppercase;
      margin-bottom: 6px;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .items-table th {
      background: #f8fafc;
      padding: 10px;
      border-bottom: 2px solid #cbd5e1;
      border-top: 1px solid #cbd5e1;
      font-size: 11px;
      font-weight: 800;
      color: #052a51;
      text-transform: uppercase;
    }
    .totals-box {
      width: 260px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #475569;
      margin-bottom: 6px;
    }
    .grand-total-row {
      display: flex;
      justify-content: space-between;
      font-size: 15px;
      font-weight: 900;
      color: #052a51;
      border-top: 2px dashed #cbd5e1;
      padding-top: 8px;
      margin-top: 8px;
    }
    .signature-box {
      border: 1px dashed #94a3b8;
      border-radius: 6px;
      padding: 8px;
      background: #fafafa;
    }
    .footer {
      margin-top: 28px;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      text-align: center;
      font-size: 10px;
      color: #64748b;
      line-height: 15px;
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <img src="${watermarkUrl}" class="watermark" alt="IntriHub Watermark" />

    <div class="content-wrapper">
      <table class="header-table">
        <tr>
          <td style="vertical-align: top;">
            <img src="${watermarkUrl}" alt="IntriHub Logo" class="logo-img" onerror="this.style.display='none'" />
            <div style="font-size: 11px; color: #334155; margin-top: 4px; line-height: 18px; font-weight: 600;">
              <div>GSTIN: <b>${gstNo}</b></div>
              <div>Mobile: <b>${supportPhone}</b></div>
              <div>Email: <b>${supportEmail}</b></div>
            </div>
          </td>
          <td class="invoice-meta" style="vertical-align: top;">
            <div class="invoice-title">OFFICIAL TAX INVOICE</div>
            <div style="font-size: 12px; font-weight: 700; margin-top: 6px; color: #0f172a;">Order #: ${orderId}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Date: ${orderDate}</div>
            <div style="font-size: 11px; color: #0f172a; font-weight: 700; margin-top: 4px;">Payment: <span>${paymentText}</span></div>
          </td>
        </tr>
      </table>

      <div class="info-grid">
        <div class="info-col">
          <div class="info-heading">Billed & Delivered To:</div>
          <div style="font-weight: 800; color: #0f172a; font-size: 13px; margin-top: 4px;">${customerName}</div>
          <div style="color: #2563eb; font-weight: 700; margin-top: 2px; font-size: 12px;">Phone: ${phoneDisplay}</div>
          <div style="color: #334155; margin-top: 6px; font-size: 11px; line-height: 17px; font-weight: 500;">
            <b>Delivery Address:</b> ${fullAddress}
          </div>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">#</th>
            <th style="text-align: left;">Product Description</th>
            <th style="width: 100px; text-align: center;">Quantity</th>
            <th style="width: 110px; text-align: right;">Unit Rate</th>
            <th style="width: 120px; text-align: right;">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div style="width: 100%; margin-top: 16px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div style="font-size: 11px; color: #64748b; line-height: 16px; max-width: 340px;">
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">Terms & Notes:</div>
          ${termsListHtml}
        </div>

        <div style="text-align: right;">
          <div class="totals-box" style="margin-left: auto;">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span>₹${subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div class="totals-row">
              <span>Delivery & Freight:</span>
              <span>${deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span>
            </div>
            <div class="grand-total-row">
              <span>Grand Total:</span>
              <span>₹${grandTotal.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div style="margin-top: 16px; text-align: center; width: 170px; margin-left: auto;">
            <div class="signature-box">
              <div style="font-family: cursive, sans-serif; font-size: 18px; color: #052a51; font-weight: bold;">${sigText}</div>
              <div style="font-size: 9px; color: #16a34a; font-weight: 800; text-transform: uppercase; margin-top: 2px;">${digitalBadge}</div>
            </div>
            <div style="font-size: 10px; color: #475569; font-weight: 600; margin-top: 4px;">${sigTitle}</div>
          </div>
        </div>
      </div>

      <div class="footer">
        <div>${footerTagline}</div>
        <div>Everything, Every Place • www.intrihub.com • Support: ${supportEmail}</div>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Print order invoice via Expo Print
 */
export async function printOrderInvoice(order: any, customSettings?: any): Promise<void> {
  try {
    const html = generateOrderInvoiceHtml(order, customSettings);
    await Print.printAsync({ html });
  } catch (error: any) {
    console.error("Invoice Print Error:", error);
    Alert.alert("Print Error", error.message || "Failed to trigger print");
  }
}

/**
 * Share PDF invoice via Expo Sharing
 */
export async function shareOrderInvoice(order: any, customSettings?: any): Promise<void> {
  try {
    const html = generateOrderInvoiceHtml(order, customSettings);
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `Tax Invoice #${order.orderNumber || order.id}`,
        UTI: "com.adobe.pdf",
      });
    } else {
      Alert.alert("Sharing Unavailable", "Sharing is not supported on this device.");
    }
  } catch (error: any) {
    console.error("Invoice Share Error:", error);
    Alert.alert("Share Error", error.message || "Failed to share invoice");
  }
}
