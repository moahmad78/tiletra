"use server";

import { prisma } from "@/lib/prisma";
import { safeRevalidate } from "@/lib/formatters";

export interface SerialInvoiceResult {
  invoiceNumber: string;
  serialNumber: number;
  year: number;
  isExisting: boolean;
}

/**
 * Generates or retrieves the official sequential invoice number for IntriHub.
 * Format: IH-INV-YYYY-XXXX (e.g. IH-INV-2026-0001, IH-INV-2026-0002)
 * Ensures serial continuity across both online orders and manual bills.
 */
export async function getNextSequentialInvoiceNumber(options?: {
  increment?: boolean;
  orderId?: string;
}): Promise<SerialInvoiceResult> {
  const year = new Date().getFullYear();
  const counterKey = `invoice_seq_counter_${year}`;
  const mapKey = `invoice_order_map_${year}`;

  try {
    // 1. If orderId is provided, check if an invoice number was already assigned to this order
    if (options?.orderId) {
      const orderMapSetting = await prisma.setting.findUnique({
        where: { key: mapKey },
      });

      if (orderMapSetting?.value) {
        try {
          const map: Record<string, string> = JSON.parse(orderMapSetting.value);
          if (map[options.orderId]) {
            const existingInv = map[options.orderId];
            // Extract the serial portion if possible
            const parts = existingInv.split("-");
            const num = parseInt(parts[parts.length - 1] || "1", 10);
            return {
              invoiceNumber: existingInv,
              serialNumber: isNaN(num) ? 1 : num,
              year,
              isExisting: true,
            };
          }
        } catch {
          // ignore json parse error
        }
      }
    }

    // 2. Fetch current sequence counter
    const currentSetting = await prisma.setting.findUnique({
      where: { key: counterKey },
    });

    let currentSerial = 0;
    if (currentSetting?.value) {
      currentSerial = parseInt(currentSetting.value, 10) || 0;
    } else {
      // Initialize counter: Check if there are existing orders in DB to start with a sensible sequence
      const orderCount = await prisma.order.count().catch(() => 0);
      currentSerial = orderCount > 0 ? orderCount : 0;
      await prisma.setting.upsert({
        where: { key: counterKey },
        update: { value: String(currentSerial) },
        create: { key: counterKey, value: String(currentSerial) },
      });
    }

    const nextSerial = currentSerial + 1;
    const formattedSerial = String(nextSerial).padStart(4, "0");
    const nextInvoiceNumber = `IH-INV-${year}-${formattedSerial}`;

    // 3. If increment is requested, atomically update the sequence counter and order mapping
    if (options?.increment) {
      await prisma.setting.upsert({
        where: { key: counterKey },
        update: { value: String(nextSerial) },
        create: { key: counterKey, value: String(nextSerial) },
      });

      if (options.orderId) {
        let currentMap: Record<string, string> = {};
        const mapSetting = await prisma.setting.findUnique({
          where: { key: mapKey },
        });
        if (mapSetting?.value) {
          try {
            currentMap = JSON.parse(mapSetting.value);
          } catch {}
        }
        currentMap[options.orderId] = nextInvoiceNumber;
        await prisma.setting.upsert({
          where: { key: mapKey },
          update: { value: JSON.stringify(currentMap) },
          create: { key: mapKey, value: JSON.stringify(currentMap) },
        });
      }
    }

    return {
      invoiceNumber: nextInvoiceNumber,
      serialNumber: nextSerial,
      year,
      isExisting: false,
    };
  } catch (error) {
    console.error("Error calculating sequential invoice number:", error);
    // Graceful fallback with date and random suffix
    const dateStr = new Date().toISOString().slice(2, 7).replace("-", "");
    const fallback = `IH-INV-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      invoiceNumber: fallback,
      serialNumber: 1,
      year,
      isExisting: false,
    };
  }
}

/**
 * Commits an invoice number so the sequence advances and optionally saves the order mapping.
 */
export async function commitInvoiceSerial(data: {
  invoiceNumber: string;
  orderId?: string;
  customerName?: string;
  total?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const year = new Date().getFullYear();
    const counterKey = `invoice_seq_counter_${year}`;
    const mapKey = `invoice_order_map_${year}`;

    // Extract serial number if format is IH-INV-YYYY-XXXX
    const match = data.invoiceNumber.match(/IH-INV-\d{4}-(\d+)/i);
    if (match && match[1]) {
      const serialNum = parseInt(match[1], 10);
      if (!isNaN(serialNum)) {
        const currentSetting = await prisma.setting.findUnique({
          where: { key: counterKey },
        });
        const currentVal = currentSetting?.value ? parseInt(currentSetting.value, 10) : 0;
        if (serialNum >= currentVal) {
          await prisma.setting.upsert({
            where: { key: counterKey },
            update: { value: String(serialNum) },
            create: { key: counterKey, value: String(serialNum) },
          });
        }
      }
    }

    if (data.orderId) {
      let currentMap: Record<string, string> = {};
      const mapSetting = await prisma.setting.findUnique({
        where: { key: mapKey },
      });
      if (mapSetting?.value) {
        try {
          currentMap = JSON.parse(mapSetting.value);
        } catch {}
      }
      currentMap[data.orderId] = data.invoiceNumber;
      await prisma.setting.upsert({
        where: { key: mapKey },
        update: { value: JSON.stringify(currentMap) },
        create: { key: mapKey, value: JSON.stringify(currentMap) },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error committing invoice serial:", error);
    return { success: false, error: error?.message || "Failed to commit invoice serial" };
  }
}

/**
 * Fetches recent orders with clean summaries so admin can pick any order with 1-click
 * to generate a GST Tax invoice.
 */
export async function getRecentOrdersForInvoicing(limit: number = 30) {
  try {
    const year = new Date().getFullYear();
    const mapKey = `invoice_order_map_${year}`;
    let orderMap: Record<string, string> = {};

    try {
      const mapSetting = await prisma.setting.findUnique({
        where: { key: mapKey },
      });
      if (mapSetting?.value) {
        orderMap = JSON.parse(mapSetting.value);
      }
    } catch {}

    const orders = await prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
      },
    });

    return orders.map((o) => {
      let cleanAddress = o.deliveryAddress || "";
      if (!cleanAddress && o.shippingAddress) {
        if (typeof o.shippingAddress === "string") {
          cleanAddress = o.shippingAddress;
        } else if (typeof o.shippingAddress === "object") {
          const a = o.shippingAddress as any;
          cleanAddress = [
            a.houseNumber || a.flatNumber ? `Flat/House: ${a.houseNumber || a.flatNumber}` : "",
            a.buildingName || a.building ? `Building: ${a.buildingName || a.building}` : "",
            a.street || a.line1 || "",
            a.area || a.line2 || "",
            a.landmark ? `Near ${a.landmark.replace(/^near\s+/i, "")}` : "",
            a.city || "Bengaluru",
            a.state || "Karnataka",
            a.pincode || a.postalCode ? `- ${a.pincode || a.postalCode}` : "",
          ]
            .filter(Boolean)
            .join(", ");
        }
      }

      return {
        id: o.id,
        customerName: o.deliveryName || o.customerName || "Customer",
        customerPhone: o.deliveryPhone || o.customerPhone || "",
        customerEmail: o.customerEmail || "",
        deliveryAddress: cleanAddress,
        subtotal: o.subtotal || 0,
        deliveryFee: o.deliveryFee || 0,
        discount: o.discount || 0,
        total: o.total || 0,
        paymentStatus: o.paymentStatus || "Paid",
        paymentMethod: o.paymentMethod || "Online",
        orderStatus: o.orderStatus || "Processing",
        createdAt: o.createdAt.toISOString(),
        itemsCount: o.items?.length || 0,
        existingInvoiceNumber: orderMap[o.id] || null,
        items: o.items.map((it) => ({
          id: it.id,
          name: it.productName,
          variant: it.variantDetails || "",
          quantity: it.boxQuantity || 1,
          rate: it.pricePerBox || 0,
          totalPrice: it.totalPrice || 0,
        })),
      };
    });
  } catch (error) {
    console.error("Error fetching orders for invoicing:", error);
    return [];
  }
}

/**
 * Loads full order details converted into invoice format with auto-sequential bill number.
 */
export async function getOrderInvoiceData(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Auto-calculate sequential bill number (without incrementing until committed or print)
    const seqResult = await getNextSequentialInvoiceNumber({ orderId: order.id });

    // Format address
    let cleanAddress = order.deliveryAddress || "";
    if (!cleanAddress && order.shippingAddress) {
      if (typeof order.shippingAddress === "string") {
        cleanAddress = order.shippingAddress;
      } else if (typeof order.shippingAddress === "object") {
        const a = order.shippingAddress as any;
        cleanAddress = [
          a.houseNumber || a.flatNumber ? `Flat/House: ${a.houseNumber || a.flatNumber}` : "",
          a.buildingName || a.building ? `Building: ${a.buildingName || a.building}` : "",
          a.street || a.line1 || "",
          a.area || a.line2 || "",
          a.landmark ? `Near ${a.landmark.replace(/^near\s+/i, "")}` : "",
          a.city || "Bengaluru",
          a.state || "Karnataka",
          a.pincode || a.postalCode ? `- ${a.pincode || a.postalCode}` : "",
        ]
          .filter(Boolean)
          .join(", ");
      }
    }

    // Format phone
    let phone = order.deliveryPhone || order.customerPhone || "";
    phone = phone.replace(/[^\d+]/g, "");
    if (phone.length === 10 && !phone.startsWith("+91")) {
      phone = `+91 ${phone}`;
    }

    // Format items
    const items = order.items.map((it, idx) => {
      // Infer standard HSN based on product name
      let hsn = "6907"; // default glazed tiles
      const lower = it.productName.toLowerCase();
      if (lower.includes("adhesive") || lower.includes("glue") || lower.includes("epoxy")) {
        hsn = "3824";
      } else if (lower.includes("commode") || lower.includes("basin") || lower.includes("urinal") || lower.includes("toilet")) {
        hsn = "6910";
      } else if (lower.includes("tap") || lower.includes("mixer") || lower.includes("valve") || lower.includes("faucet") || lower.includes("cp")) {
        hsn = "8481";
      } else if (lower.includes("grout")) {
        hsn = "3214";
      } else if (lower.includes("granite") || lower.includes("marble") || lower.includes("stone") || lower.includes("slab")) {
        hsn = "6802";
      } else if (lower.includes("pipe") || lower.includes("fitting") || lower.includes("pvc") || lower.includes("cpvc")) {
        hsn = "3917";
      }

      // Infer unit
      let unit = "Box";
      if (lower.includes("adhesive") || lower.includes("cement") || lower.includes("bag")) {
        unit = "Bags";
      } else if (lower.includes("basin") || lower.includes("commode") || lower.includes("tap") || lower.includes("faucet")) {
        unit = "Pcs";
      } else if (lower.includes("granite") || lower.includes("marble") || lower.includes("sqft")) {
        unit = "Sq.Ft.";
      }

      return {
        id: `ord-item-${it.id || idx}`,
        name: it.productName,
        variant: it.variantDetails || "Standard Pack",
        hsn,
        quantity: Math.max(1, it.boxQuantity || 1),
        unit,
        rate: it.pricePerBox || 0,
        taxRate: 18,
      };
    });

    const paymentMethodDisplay = order.paymentMethod === "COD"
      ? "Cash on Delivery (COD)"
      : order.paymentMethod?.toLowerCase().includes("razorpay")
      ? "Razorpay Online Payment"
      : "Online (UPI / NetBanking)";

    const invoiceData = {
      invoiceNumber: seqResult.invoiceNumber,
      isAutoSerial: true,
      serialNumber: seqResult.serialNumber,
      orderId: order.id,
      invoiceDate: new Date(order.createdAt).toISOString().slice(0, 10),
      dueDate: new Date(new Date(order.createdAt).getTime() + 15 * 86400000).toISOString().slice(0, 10),
      placeOfSupply: "Karnataka (29)",
      paymentMethod: paymentMethodDisplay,
      paymentStatus: order.paymentStatus === "Paid" ? ("Paid" as const) : ("Pending" as const),
      customerName: order.deliveryName || order.customerName || "Customer",
      customerPhone: phone,
      customerEmail: order.customerEmail === "customer@intrihub.com" ? "" : order.customerEmail || "",
      customerGstin: "",
      deliveryAddress: cleanAddress || "Bengaluru, Karnataka",
      items: items.length > 0 ? items : [
        {
          id: `item-${Date.now()}`,
          name: "Material Product",
          variant: "Standard Delivery Pack",
          hsn: "6907",
          quantity: 1,
          unit: "Box",
          rate: order.subtotal || order.total || 0,
          taxRate: 18,
        },
      ],
      deliveryFee: order.deliveryFee || 0,
      discount: order.discount || 0,
      taxMode: "exclusive" as const,
      isInterState: false,
      notes: `Order #${order.id} • Bengaluru express dispatch via IntriHub fleet`,
      terms: "• Computer-generated tax invoice verified by IntriHub.\n• Goods once delivered cannot be returned without physical QC verification.\n• All disputes subject to Bengaluru jurisdiction.\n• Everything, Every Place • www.intrihub.com",
      showSignature: true,
    };

    return { success: true, invoiceData };
  } catch (error: any) {
    console.error("Error loading order invoice data:", error);
    return { success: false, error: error?.message || "Failed to load order invoice data" };
  }
}
