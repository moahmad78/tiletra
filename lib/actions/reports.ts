"use server";

import { prisma } from "@/lib/prisma";

export async function getReportStats() {
  try {
    const [ordersCount, customersCount, vendorsCount, productsCount] = await Promise.all([
      prisma.order.count(),
      prisma.user.count({ where: { role: "customer" } }),
      prisma.vendor.count(),
      prisma.product.count(),
    ]);

    return {
      ordersCount,
      customersCount,
      vendorsCount,
      productsCount,
    };
  } catch {
    return {
      ordersCount: 0,
      customersCount: 0,
      vendorsCount: 0,
      productsCount: 0,
    };
  }
}

export async function exportSalesReportCsv() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 2000,
    });

    const orderIds = orders.map((o) => o.id);
    const splits = await prisma.vendorOrderSplit.findMany({
      where: { orderId: { in: orderIds } },
      select: {
        orderId: true,
        commissionAmount: true,
      },
    });

    const commMap = new Map<string, number>();
    for (const s of splits) {
      const cur = commMap.get(s.orderId) || 0;
      commMap.set(s.orderId, cur + (s.commissionAmount || 0));
    }

    const headers = [
      "Order ID",
      "Date",
      "Customer Name",
      "Customer Phone",
      "Payment Method",
      "Payment Status",
      "Order Status",
      "Subtotal (INR)",
      "Delivery Fee (INR)",
      "Discount (INR)",
      "Total Amount (INR)",
      "Platform Commission (INR)",
      "Estimated Delivery",
    ];

    const rows = orders.map((o) => {
      const comm = commMap.get(o.id) || 0;
      return [
        `"${o.id}"`,
        `"${new Date(o.createdAt).toISOString().split("T")[0]}"`,
        `"${(o.customerName || "").replace(/"/g, '""')}"`,
        `"${o.customerPhone || ""}"`,
        `"${o.paymentMethod || "Online"}"`,
        `"${o.paymentStatus || "Pending"}"`,
        `"${o.orderStatus || "Processing"}"`,
        o.subtotal || 0,
        o.deliveryFee || 0,
        o.discount || 0,
        o.total || 0,
        comm,
        `"${o.estimatedDelivery || ""}"`,
      ].join(",");
    });

    return {
      success: true,
      filename: `intrihub_sales_report_${new Date().toISOString().split("T")[0]}.csv`,
      csv: [headers.join(","), ...rows].join("\n"),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function exportTaxGstReportCsv() {
  try {
    const orders = await prisma.order.findMany({
      where: { paymentStatus: "Paid" },
      orderBy: { createdAt: "desc" },
      take: 2000,
    });

    const headers = [
      "Invoice / Order ID",
      "Invoice Date",
      "Customer Name",
      "Customer Phone",
      "State",
      "City",
      "Gross Invoice Total (INR)",
      "Estimated Taxable Value (INR)",
      "CGST 9% (INR)",
      "SGST 9% (INR)",
      "IGST 18% (INR)",
      "Payment Mode",
    ];

    const rows = orders.map((o) => {
      const gross = o.total || 0;
      // 18% GST estimate: Taxable = Gross / 1.18
      const taxable = Number((gross / 1.18).toFixed(2));
      const totalGst = Number((gross - taxable).toFixed(2));
      const isKarnataka = String(o.deliveryState || "").toLowerCase().includes("karnataka");
      const cgst = isKarnataka ? Number((totalGst / 2).toFixed(2)) : 0;
      const sgst = isKarnataka ? Number((totalGst / 2).toFixed(2)) : 0;
      const igst = !isKarnataka ? totalGst : 0;

      return [
        `"${o.id}"`,
        `"${new Date(o.createdAt).toISOString().split("T")[0]}"`,
        `"${(o.customerName || "").replace(/"/g, '""')}"`,
        `"${o.customerPhone || ""}"`,
        `"${o.deliveryState || "Karnataka"}"`,
        `"${o.deliveryCity || "Bengaluru"}"`,
        gross,
        taxable,
        cgst,
        sgst,
        igst,
        `"${o.paymentMethod}"`,
      ].join(",");
    });

    return {
      success: true,
      filename: `intrihub_gst_tax_report_${new Date().toISOString().split("T")[0]}.csv`,
      csv: [headers.join(","), ...rows].join("\n"),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function exportVendorSettlementReportCsv() {
  try {
    const splits = await prisma.vendorOrderSplit.findMany({
      orderBy: { createdAt: "desc" },
      take: 2000,
    });

    const vendorIds = Array.from(new Set(splits.map((s) => s.vendorId)));
    const orderIds = Array.from(new Set(splits.map((s) => s.orderId)));

    const [vendors, orders] = await Promise.all([
      prisma.vendor.findMany({
        where: { id: { in: vendorIds } },
        select: {
          id: true,
          businessName: true,
          contactPhone: true,
          bankAccountNumber: true,
        },
      }),
      prisma.order.findMany({
        where: { id: { in: orderIds } },
        select: {
          id: true,
          createdAt: true,
          customerName: true,
          paymentStatus: true,
        },
      }),
    ]);

    const vendorMap = new Map(vendors.map((v) => [v.id, v]));
    const orderMap = new Map(orders.map((o) => [o.id, o]));

    const headers = [
      "Split ID",
      "Order ID",
      "Date",
      "Vendor Business Name",
      "Vendor Phone",
      "Fulfillment Status",
      "Customer Payment Status",
      "Order Subtotal (INR)",
      "Platform Commission Rate (%)",
      "Platform Commission Cut (INR)",
      "Net Vendor Payout (INR)",
      "Bank Account Number",
    ];

    const rows = splits.map((s) => {
      const v = vendorMap.get(s.vendorId);
      const o = orderMap.get(s.orderId);

      return [
        `"${s.id}"`,
        `"${s.orderId}"`,
        `"${new Date(s.createdAt).toISOString().split("T")[0]}"`,
        `"${(v?.businessName || "Registered Vendor").replace(/"/g, '""')}"`,
        `"${v?.contactPhone || ""}"`,
        `"${s.fulfillmentStatus}"`,
        `"${o?.paymentStatus || "Pending"}"`,
        s.subtotal || 0,
        s.commissionRate || 15,
        s.commissionAmount || 0,
        s.vendorPayoutAmount || 0,
        `"${v?.bankAccountNumber ? "XXXX" + v.bankAccountNumber.slice(-4) : "Not Configured"}"`,
      ].join(",");
    });

    return {
      success: true,
      filename: `intrihub_vendor_settlements_${new Date().toISOString().split("T")[0]}.csv`,
      csv: [headers.join(","), ...rows].join("\n"),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function exportCustomerCrmReportCsv() {
  try {
    const customers = await prisma.user.findMany({
      where: { role: "customer" },
      take: 2000,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        phoneVerified: true,
        language: true,
        createdAt: true,
      },
    });

    const orders = await prisma.order.findMany({
      select: {
        userId: true,
        total: true,
      },
    });

    const spendMap = new Map<string, { count: number; spend: number }>();
    for (const o of orders) {
      if (o.userId) {
        const cur = spendMap.get(o.userId) || { count: 0, spend: 0 };
        spendMap.set(o.userId, { count: cur.count + 1, spend: cur.spend + (o.total || 0) });
      }
    }

    const headers = [
      "User ID",
      "Customer Name",
      "Phone",
      "Email",
      "Phone Verified",
      "Language",
      "Total Orders Placed",
      "Lifetime Spend (INR)",
      "Joined Date",
    ];

    const rows = customers.map((c) => {
      const m = spendMap.get(c.id) || { count: 0, spend: 0 };
      return [
        `"${c.id}"`,
        `"${(c.name || "Customer").replace(/"/g, '""')}"`,
        `"${c.phone || ""}"`,
        `"${c.email || ""}"`,
        c.phoneVerified ? "Yes" : "No",
        `"${c.language || "en"}"`,
        m.count,
        m.spend,
        `"${new Date(c.createdAt).toISOString().split("T")[0]}"`,
      ].join(",");
    });

    return {
      success: true,
      filename: `intrihub_customer_crm_${new Date().toISOString().split("T")[0]}.csv`,
      csv: [headers.join(","), ...rows].join("\n"),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
