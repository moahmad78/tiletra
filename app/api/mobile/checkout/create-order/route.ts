import { NextRequest } from "next/server";
import { getAuthenticatedMobileUser, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { createRazorpayOrder, createOrder } from "@/lib/actions/orders";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedMobileUser(req);
    const body = await req.json().catch(() => ({}));
    const {
      amount,
      currency = "INR",
      paymentMethod = "online", // online | cod
      items = [],
      shippingAddress,
      customerName,
      customerPhone,
      customerEmail,
      couponCode,
      deliveryFee,
      discount,
    } = body;

    const finalUserId = user?.id || body.userId;
    const finalCustomerName = customerName || user?.name || "Customer";
    const finalCustomerPhone = customerPhone || user?.phone || "";
    const finalCustomerEmail = customerEmail || user?.email || "";

    if (paymentMethod === "cod") {
      // Direct COD order creation
      const orderResult = await createOrder({
        userId: finalUserId,
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        customerEmail: finalCustomerEmail,
        shippingAddress,
        items,
        deliveryFee,
        discount,
        couponCode,
        paymentMethod: "cod",
        paymentStatus: "pending",
        codConfirmed: true,
      });

      if (!orderResult.success) {
        return mobileApiResponse({ success: false, error: orderResult.error }, 400);
      }

      return mobileApiResponse({
        success: true,
        paymentMethod: "cod",
        order: orderResult.order,
      });
    }

    // Online Razorpay Payment initialization
    const razorpayRes = await createRazorpayOrder({
      amount: Math.round(amount * 100), // in paise
      currency,
      receipt: `mob_${Date.now().toString().slice(-8)}`,
      items,
      couponCode,
    });

    if (!razorpayRes.success) {
      return mobileApiResponse({ success: false, error: razorpayRes.error }, 400);
    }

    return mobileApiResponse({
      success: true,
      paymentMethod: "online",
      razorpayOrder: {
        order_id: razorpayRes.order_id,
        amount: razorpayRes.amount,
        currency: razorpayRes.currency,
        key_id: razorpayRes.key_id || process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      },
    });
  } catch (err: any) {
    console.error("Mobile checkout create-order error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to initialize checkout" },
      500
    );
  }
}
