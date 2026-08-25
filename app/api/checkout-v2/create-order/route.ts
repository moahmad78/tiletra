import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Razorpay from "razorpay";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log("[Checkout-V2 Create Order] Incoming request started at:", new Date().toISOString());

  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "anonymous";
    const rateCheck = checkRateLimit(`create-order-v2:${ip}`, 30, 60 * 1000);
    if (!rateCheck.allowed) {
      console.warn(`[Checkout-V2 Create Order] Rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { error: "Too many payment initialization requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { items, couponCode, deliveryType, customAddress } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty. Please add items to checkout." },
        { status: 400 }
      );
    }

    // 1. Fetch Store Settings for Delivery & Free Delivery Thresholds
    let settings = await prisma.storeSettings.findFirst();
    if (!settings) {
      settings = {
        freeDeliveryThreshold: 15000,
        standardDeliveryFee: 999,
        deliveryFeeEnabled: true,
        bikeDeliveryRate: 99,
        fourWheelerDeliveryRate: 349,
        weightThresholdKg: 20,
      } as any;
    }

    // 2. Independently recalculate Cart Subtotal & Total Weight from Database
    let recalculatedSubtotal = 0;
    let totalWeightKg = 0;
    const verifiedItems: any[] = [];

    for (const item of items) {
      const quantity = Math.max(1, Number(item.boxQuantity || item.quantity || 1));
      let unitPrice = 0;
      let unitWeight = 1.5; // safe default per box/unit (1.5 kg)
      let title = "Product Item";
      let sku = "SKU-DEFAULT";

      if (item.variantId && item.variantId !== "default") {
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true },
        });

        if (variant) {
          unitPrice =
            variant.pricePerBox ||
            (variant.pricePerSqft ? variant.pricePerSqft * (variant.sqftPerBox || 1) : 0) ||
            variant.product?.pricePerSqft ||
            0;
          unitWeight = variant.weightKg || (variant.sqftPerBox ? (variant.sqftPerBox || 1) * 2 : 2.0);
          title = `${variant.product?.name || "Product"} - ${variant.attributeValue || variant.color || "Standard"}`;
          sku = variant.id;
        }
      } else if (item.productId) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (product) {
          unitPrice = product.pricePerSqft || 0;
          title = product.name;
        }
      }

      if (unitPrice <= 0 && item.pricePerBox) {
        unitPrice = Number(item.pricePerBox);
      }

      const itemTotal = unitPrice * quantity;
      recalculatedSubtotal += itemTotal;
      totalWeightKg += unitWeight * quantity;

      verifiedItems.push({
        productId: item.productId,
        variantId: item.variantId,
        title,
        sku,
        quantity,
        price: unitPrice,
        total: itemTotal,
        weightKg: unitWeight * quantity,
      });
    }

    // 3. Evaluate Vehicle Delivery Fee Slabs
    const freeDeliveryThreshold = settings?.freeDeliveryThreshold ?? 15000;
    const weightThreshold = settings?.weightThresholdKg ?? 20;
    const bikeRate = settings?.bikeDeliveryRate ?? 99;
    const fourWheelerRate = settings?.fourWheelerDeliveryRate ?? 349;

    let deliveryFee = 0;
    let vehicleType = "Free Delivery";

    if (recalculatedSubtotal >= freeDeliveryThreshold) {
      deliveryFee = 0;
      vehicleType = "FREE Delivery (Above ₹" + freeDeliveryThreshold.toLocaleString("en-IN") + ")";
    } else {
      if (totalWeightKg <= weightThreshold) {
        deliveryFee = bikeRate;
        vehicleType = `Bike Delivery (${totalWeightKg.toFixed(1)} kg ≤ ${weightThreshold} kg)`;
      } else {
        deliveryFee = fourWheelerRate;
        vehicleType = `4-Wheeler Delivery (${totalWeightKg.toFixed(1)} kg > ${weightThreshold} kg)`;
      }
    }

    // 4. Validate Coupon Discount server-side
    let discount = 0;
    let appliedCoupon: any = null;

    if (couponCode) {
      const cleanCoupon = couponCode.toUpperCase().trim();
      const coupon = await prisma.coupon.findUnique({
        where: { code: cleanCoupon },
      });

      if (coupon && coupon.isActive) {
        const isExpired = coupon.validTill && new Date() > new Date(coupon.validTill);
        const limitReached = coupon.usageLimit && coupon.usedCount >= coupon.usageLimit;
        const minOrderSatisfied = !coupon.minOrderValue || recalculatedSubtotal >= coupon.minOrderValue;

        if (!isExpired && !limitReached && minOrderSatisfied) {
          discount =
            coupon.discountType === "percentage"
              ? Math.min(coupon.maxDiscountCap || Infinity, Math.round((recalculatedSubtotal * coupon.value) / 100))
              : Math.min(coupon.value, recalculatedSubtotal);
          appliedCoupon = coupon.code;
        }
      }
    }

    // 5. Final Grand Total in INR and Paise
    const finalTotalRupees = Math.max(1, recalculatedSubtotal + deliveryFee - discount);
    const amountPaise = Math.round(finalTotalRupees * 100);

    console.log("[Checkout-V2 Create Order] Price Breakdown:", {
      subtotal: recalculatedSubtotal,
      totalWeightKg: totalWeightKg.toFixed(2),
      deliveryFee,
      vehicleType,
      discount,
      appliedCoupon,
      finalTotalRupees,
      amountPaise,
    });

    // 6. Razorpay API Key Check
    const key_id = (process.env.RAZORPAY_KEY_ID || "").trim();
    const key_secret = (process.env.RAZORPAY_KEY_SECRET || "").trim();

    if (!key_id || !key_secret) {
      console.error("[Checkout-V2 Create Order] Missing Razorpay credentials in server environment variables!");
      return NextResponse.json(
        { error: "Razorpay credentials not configured on server" },
        { status: 500 }
      );
    }

    // 7. Call Razorpay Orders API with Full Error Diagnostic Logging
    const razorpay = new Razorpay({ key_id, key_secret });
    const receipt = `rcpt_${Date.now().toString().slice(-8)}`;

    try {
      const rzpOrder = await razorpay.orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt,
        payment_capture: true,
        notes: {
          subtotal: recalculatedSubtotal.toString(),
          deliveryFee: deliveryFee.toString(),
          vehicleType,
          discount: discount.toString(),
          coupon: appliedCoupon || "NONE",
          itemCount: items.length.toString(),
        },
      });

      console.log(`[Checkout-V2 Create Order] ✔ Razorpay Order Created [${Date.now() - startTime}ms]:`, {
        order_id: rzpOrder.id,
        amount: rzpOrder.amount,
        status: rzpOrder.status,
        receipt: rzpOrder.receipt,
      });

      return NextResponse.json({
        success: true,
        order_id: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        receipt: rzpOrder.receipt,
        key_id,
        breakdown: {
          subtotal: recalculatedSubtotal,
          deliveryFee,
          vehicleType,
          totalWeightKg: Number(totalWeightKg.toFixed(1)),
          discount,
          grandTotal: finalTotalRupees,
        },
      });
    } catch (rzpError: any) {
      console.error("[Checkout-V2 Create Order] ❌ FULL Razorpay API Error:", {
        statusCode: rzpError?.statusCode,
        error: rzpError?.error,
        code: rzpError?.error?.code || rzpError?.code,
        description: rzpError?.error?.description || rzpError?.description || rzpError?.message,
        source: rzpError?.error?.source,
        step: rzpError?.error?.step,
        reason: rzpError?.error?.reason,
        field: rzpError?.error?.field,
        raw: rzpError,
      });

      const message =
        rzpError?.error?.description ||
        rzpError?.description ||
        rzpError?.message ||
        "Razorpay order initialization failed";

      return NextResponse.json(
        {
          error: message,
          details: {
            code: rzpError?.error?.code || "RAZORPAY_ERROR",
            description: message,
            source: rzpError?.error?.source || "razorpay",
            step: rzpError?.error?.step,
            reason: rzpError?.error?.reason,
          },
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("[Checkout-V2 Create Order] Unexpected Server Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error creating order" },
      { status: 500 }
    );
  }
}
