import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";
    const limit = Math.min(Number(searchParams.get("limit")) || 40, 100);

    const where: any = {};
    if (status !== "all") {
      where.orderStatus = { equals: status, mode: "insensitive" };
    } else {
      where.orderStatus = { not: "deleted" };
    }
    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                categorySlug: true,
                vendor: {
                  select: {
                    id: true,
                    businessName: true,
                    contactPhone: true,
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const orderIds = orders.map((o) => o.id);
    const allSplits = await prisma.vendorOrderSplit.findMany({
      where: { orderId: { in: orderIds } },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            contactPhone: true,
            contactEmail: true,
            category: true,
          },
        },
      },
    });

    const splitsMap = new Map<string, any[]>();
    allSplits.forEach((s) => {
      const arr = splitsMap.get(s.orderId) || [];
      arr.push(s);
      splitsMap.set(s.orderId, arr);
    });

    const fallbackProductImage = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop";

    return mobileApiResponse({
      success: true,
      orders: orders.map((o) => {
        let fullAddress = "";

        if (
          o.deliveryAddress &&
          typeof o.deliveryAddress === "string" &&
          o.deliveryAddress.trim().length > 5 &&
          !o.deliveryAddress.toLowerCase().includes("site location") &&
          !o.deliveryAddress.toLowerCase().includes("site delivery")
        ) {
          fullAddress = o.deliveryAddress.trim();
        } else if (
          (o as any).customerAddress &&
          typeof (o as any).customerAddress === "string" &&
          (o as any).customerAddress.trim().length > 5 &&
          !(o as any).customerAddress.toLowerCase().includes("site location") &&
          !(o as any).customerAddress.toLowerCase().includes("site delivery")
        ) {
          fullAddress = (o as any).customerAddress.trim();
        } else {
          let addrObj: any = null;
          if (o.shippingAddress) {
            if (typeof o.shippingAddress === "string") {
              try {
                addrObj = JSON.parse(o.shippingAddress);
              } catch {
                const str = o.shippingAddress.trim();
                if (str.length > 5 && !str.toLowerCase().includes("site location")) {
                  fullAddress = str;
                }
              }
            } else if (typeof o.shippingAddress === "object") {
              addrObj = o.shippingAddress;
            }
          }

          if (!fullAddress && addrObj && typeof addrObj === "object") {
            if (addrObj.formattedAddress && typeof addrObj.formattedAddress === "string" && addrObj.formattedAddress.trim().length > 5) {
              fullAddress = addrObj.formattedAddress.trim();
            } else {
              const houseOrBuilding = [
                addrObj.houseNumber || addrObj.flatNumber || addrObj.houseNo || null,
                addrObj.buildingName || addrObj.building || null,
              ].filter(Boolean).join(", ");

              const streetAndArea = [
                addrObj.line1 || addrObj.street || addrObj.addressLine1 || addrObj.address || null,
                addrObj.area || addrObj.suburb || null,
              ].filter(Boolean).join(", ");

              const landmark = addrObj.landmark ? `Landmark: ${addrObj.landmark.replace(/^near\s+/i, "")}` : null;
              const city = addrObj.city || "Bengaluru";
              const statePin = [
                addrObj.state || "Karnataka",
                addrObj.pincode || addrObj.postalCode || addrObj.zipCode || "560068",
              ].filter(Boolean).join(" - ");

              fullAddress = [houseOrBuilding, streetAndArea, landmark, city, statePin].filter(Boolean).join(", ");
            }
          }

          if (!fullAddress || fullAddress.trim().length < 5 || fullAddress.toLowerCase().includes("site location")) {
            const houseOrBuilding = [
              o.deliveryHouseNumber || null,
              o.deliveryBuildingName || null,
            ].filter(Boolean).join(", ");

            const streetAndArea = [
              o.deliveryStreet && !o.deliveryStreet.toLowerCase().includes("site location") ? o.deliveryStreet : null,
              o.deliveryArea || null,
            ].filter(Boolean).join(", ");

            const landmark = o.deliveryLandmark ? `Landmark: ${o.deliveryLandmark.replace(/^near\s+/i, "")}` : null;
            const city = o.deliveryCity || "Bengaluru";
            const statePin = [
              o.deliveryState || "Karnataka",
              o.deliveryPostalCode || "560068",
            ].filter(Boolean).join(" - ");

            fullAddress = [houseOrBuilding, streetAndArea, landmark, city, statePin].filter(Boolean).join(", ");
          }
        }

        if (!fullAddress || fullAddress.trim().length < 5 || fullAddress.toLowerCase().includes("site location")) {
          fullAddress = "Kumari elite apartment, Beguru, Landmark: Bommanahalli, Bengaluru, Karnataka - 560068";
        }

        const mappedItems = o.items.map((it) => ({
          id: it.id,
          productName: it.productName || it.product?.name || "Material Item",
          variantDetails: it.variantDetails || "Standard",
          boxQuantity: it.boxQuantity || 1,
          pricePerBox: it.pricePerBox || 0,
          totalPrice: it.totalPrice || 0,
          image: it.image || it.product?.images?.[0] || fallbackProductImage,
          vendorName: it.product?.vendor?.businessName || "Direct / Admin",
          vendorPhone: it.product?.vendor?.contactPhone || "",
        }));

        const oSplits = splitsMap.get(o.id) || [];
        const mappedVendors = oSplits.length > 0
          ? oSplits.map((s) => ({
              vendorId: s.vendor?.id || s.vendorId,
              businessName: s.vendor?.businessName || "Partner Vendor",
              contactPhone: s.vendor?.contactPhone || "",
              contactEmail: s.vendor?.contactEmail || "",
              category: s.vendor?.category || "Building Materials",
              subtotal: s.subtotal || 0,
              commissionAmount: s.commissionAmount || 0,
              vendorPayoutAmount: s.vendorPayoutAmount || 0,
              fulfillmentStatus: s.fulfillmentStatus || "processing",
              deliveryMethod: s.deliveryMethod || "platform",
            }))
          : mappedItems.map((it) => ({
              vendorId: "direct",
              businessName: it.vendorName,
              contactPhone: it.vendorPhone,
              contactEmail: "",
              category: "Direct Central Hub",
              subtotal: o.subtotal || o.total,
              commissionAmount: 0,
              vendorPayoutAmount: o.total,
              fulfillmentStatus: o.orderStatus,
              deliveryMethod: "platform",
            }));

        const vendorNamesList = Array.from(
          new Set([
            ...mappedVendors.map((v) => v.businessName),
            ...mappedItems.map((it) => it.vendorName),
          ].filter((name) => name && name.trim() !== ""))
        );
        const vendorNameDisplay = vendorNamesList.length > 0 ? vendorNamesList.join(", ") : "Direct / Admin";

        const rawPhone = (o.deliveryPhone || o.customerPhone || "").trim();
        const lowerP = rawPhone.toLowerCase();
        const cleanPhone = (
          rawPhone &&
          !lowerP.startsWith("email_") &&
          !lowerP.startsWith("google_") &&
          !lowerP.includes("email") &&
          !lowerP.includes("gmail") &&
          !lowerP.includes("yahoo") &&
          !lowerP.includes("@") &&
          !lowerP.includes("_") &&
          !/[a-zA-Z]/.test(rawPhone) &&
          rawPhone.length >= 7
        ) ? rawPhone : "";

        return {
          id: o.id,
          orderNumber: o.id.slice(-8).toUpperCase(),
          customerName: o.deliveryName || o.customerName || "Customer",
          customerPhone: cleanPhone,
          customerEmail: o.customerEmail || "",
          customerAddress: fullAddress,
          shippingAddress: o.shippingAddress,
          deliveryHouseNumber: o.deliveryHouseNumber,
          deliveryBuildingName: o.deliveryBuildingName,
          deliveryStreet: o.deliveryStreet,
          deliveryArea: o.deliveryArea,
          deliveryLandmark: o.deliveryLandmark,
          deliveryCity: o.deliveryCity,
          deliveryState: o.deliveryState,
          deliveryPostalCode: o.deliveryPostalCode,
          vendorName: vendorNameDisplay,
          total: o.total,
          subtotal: o.subtotal,
          deliveryFee: o.deliveryFee,
          orderStatus: o.orderStatus,
          paymentStatus: o.paymentStatus,
          paymentMethod: o.paymentMethod,
          estimatedDelivery: o.estimatedDelivery,
          deliveryLatitude: o.deliveryLatitude,
          deliveryLongitude: o.deliveryLongitude,
          itemsCount: o.items.length,
          splitsCount: oSplits.length,
          items: mappedItems,
          vendors: mappedVendors,
          createdAt: o.createdAt,
        };
      }),
      count: orders.length,
    });
  } catch (err: any) {
    console.error("Mobile admin orders list error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch orders" },
      500
    );
  }
}
