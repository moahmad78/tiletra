"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Truck,
  CreditCard,
  CheckCircle2,
  Lock,
  ArrowLeft,
  ShieldCheck,
  Building,
  Check,
  ShoppingBag,
} from "lucide-react";
import { useAuthStore, type CustomerAddress } from "@/lib/auth-store";
import { useCartStore } from "@/lib/cart-store";
import AddressStep from "@/components/checkout-v2/AddressStep";
import DeliveryStep from "@/components/checkout-v2/DeliveryStep";
import PaymentStep, { type PaymentData } from "@/components/checkout-v2/PaymentStep";
import OrderSummaryV2 from "@/components/checkout-v2/OrderSummaryV2";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InAppBrowserBanner from "@/components/InAppBrowserBanner";
import { detectInAppBrowser, openInSystemBrowser } from "@/lib/in-app-browser";
import { toast } from "sonner";

export default function CheckoutV2Page() {
  const router = useRouter();
  const { user, isAuthenticated, openLoginModal } = useAuthStore();
  const { items, clearCart, getSubtotal, getTotalWeightKg } = useCartStore();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null);

  const addresses = user?.addresses || [];

  // Store Settings (with safe fallback)
  const [storeSettings, setStoreSettings] = useState({
    freeDeliveryThreshold: 15000,
    bikeDeliveryRate: 99,
    fourWheelerDeliveryRate: 349,
    weightThresholdKg: 20,
    standardDeliveryFee: 999,
  });

  // Coupons
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);

  // Payment Selection State (Simplified: Online Payment vs COD)
  const [paymentData, setPaymentData] = useState<PaymentData>({
    method: "online",
  });

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const isPayingRef = useRef(false);
  const activeRzpRef = useRef<any>(null);

  // Order ID generated for current session
  const [sessionOrderId] = useState(() => `IH-${Math.floor(100000 + Math.random() * 900000)}`);

  // 1. Preload Razorpay SDK script on component mount
  useEffect(() => {
    loadRazorpayScript().catch((e) => console.warn("[Checkout-V2] Razorpay preload:", e));
  }, []);

  // 2. Fetch Store Settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const { getStoreSettings } = await import("@/lib/actions/settings");
        const s: any = await getStoreSettings();
        if (s) {
          setStoreSettings({
            freeDeliveryThreshold: s.freeDeliveryThreshold ?? 15000,
            bikeDeliveryRate: s.bikeDeliveryRate ?? 99,
            fourWheelerDeliveryRate: s.fourWheelerDeliveryRate ?? 349,
            weightThresholdKg: s.weightThresholdKg ?? 20,
            standardDeliveryFee: s.standardDeliveryFee ?? 999,
          });
        }
      } catch (err) {
        console.warn("[Checkout-V2] Could not load store settings:", err);
      }
    }
    loadSettings();
  }, []);

  // 2. Select default address when addresses are loaded
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddress) {
      const defaultAddr = addresses.find((a: CustomerAddress) => a.isDefault) || addresses[0];
      setSelectedAddress(defaultAddr);
    }
  }, [addresses, selectedAddress]);

  // 3. Cart calculations
  const subtotal = getSubtotal();
  const totalWeightKg = getTotalWeightKg();

  const isFreeDelivery = subtotal >= storeSettings.freeDeliveryThreshold;
  const isBikeDelivery = !isFreeDelivery && totalWeightKg <= storeSettings.weightThresholdKg;
  const calculatedDeliveryFee = isFreeDelivery
    ? 0
    : isBikeDelivery
    ? storeSettings.bikeDeliveryRate
    : storeSettings.fourWheelerDeliveryRate;

  const grandTotal = Math.max(1, subtotal + calculatedDeliveryFee - discountAmount);

  // 4. Coupon Handler
  const handleApplyCoupon = async (code: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/checkout-v2/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.product.id,
            variantId: i.variant.id,
            quantity: i.quantity,
            pricePerBox: i.variant.pricePerBox,
          })),
          couponCode: code,
        }),
      });

      const data = await res.json();
      if (data.breakdown?.discount && data.breakdown.discount > 0) {
        setCouponCode(code);
        setDiscountAmount(data.breakdown.discount);
        toast.success(`Coupon ${code} applied successfully! Saved ₹${data.breakdown.discount}`);
        return true;
      } else {
        toast.error(data.error || "Invalid or ineligible coupon code for this order.");
        return false;
      }
    } catch {
      toast.error("Failed to validate coupon. Please try again.");
      return false;
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setDiscountAmount(0);
    toast.info("Coupon removed");
  };

  // 5. Razorpay SDK Script Loader
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") {
        resolve(false);
        return;
      }
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const existingScript = document.getElementById("razorpay-checkout-script");
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(true), { once: true });
        existingScript.addEventListener("error", () => resolve(false), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.id = "razorpay-checkout-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // 6. Complete Order Creation in Intrihub Database
  const completeOrderInDb = async (
    method: "Online" | "COD",
    paymentStatus: "Paid" | "Pending",
    razorpayData?: {
      orderId?: string;
      paymentId?: string;
      signature?: string;
    }
  ) => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    const rawPhone =
      selectedAddress.phone?.trim() ||
      (user?.phone && !user.phone.startsWith("google_") && !user.phone.startsWith("email_")
        ? user.phone
        : "");
    const cleanPhone = rawPhone.replace(/\D/g, "").slice(-10);

    const { createOrder } = await import("@/lib/actions/orders");
    const res = await createOrder({
      id: sessionOrderId,
      userId: user?.id,
      customerName: selectedAddress.name?.trim() || user?.name || "Customer",
      customerPhone: cleanPhone,
      customerEmail:
        user?.email && !user.email.endsWith("@local.dev")
          ? user.email
          : "customer@intrihub.com",
      shippingAddress: {
        fullName: selectedAddress.name || user?.name || "Customer",
        phone: selectedAddress.phone?.trim() || cleanPhone,
        street: `${selectedAddress.line1}${selectedAddress.line2 ? `, ${selectedAddress.line2}` : ""}`,
        city: selectedAddress.city || "Bangalore",
        state: selectedAddress.state || "Karnataka",
        pincode: selectedAddress.pincode,
        landmark: selectedAddress.landmark,
      },
      items: items.map((i) => ({
        productId: i.product.id,
        productName: i.product.name,
        variantId: i.variant.id,
        variantDetails: [
          i.variant.attributeValue || i.variant.size,
          i.variant.color !== "Standard" && i.variant.color,
          i.variant.finish !== "Standard" && i.variant.finish,
        ]
          .filter(Boolean)
          .join(" · "),
        boxQuantity: i.quantity,
        pricePerBox: i.variant.pricePerBox,
        totalPrice: i.variant.pricePerBox * i.quantity,
        image: i.variant.image || i.product.images[0] || "/placeholders/product.svg",
      })),
      subtotal,
      deliveryFee: calculatedDeliveryFee,
      discount: discountAmount,
      total: grandTotal,
      paymentStatus,
      paymentMethod: method === "COD" ? "COD" : "Online",
      codConfirmed: method === "COD",
      paymentId:
        razorpayData?.paymentId ||
        (method === "COD"
          ? `cod_ref_${Date.now().toString().slice(-6)}`
          : `pay_rzp_${Date.now().toString().slice(-8)}`),
      razorpayOrderId: razorpayData?.orderId,
      razorpayPaymentId: razorpayData?.paymentId,
      razorpaySignature: razorpayData?.signature,
    });

    if (!res.success || !res.order) {
      throw new Error(res.error || "Failed to create order");
    }

    clearCart();
    router.push(
      `/checkout/success?orderId=${sessionOrderId}&method=${method.toLowerCase()}&total=${grandTotal}`
    );
  };

  // 7. Handle Payment Submission
  const handleTriggerPayment = async () => {
    if (isPayingRef.current || isProcessingPayment) return;

    if (!isAuthenticated) {
      openLoginModal({ type: "checkout" });
      return;
    }

    if (!selectedAddress) {
      toast.error("Please choose a delivery address");
      setCurrentStep(1);
      return;
    }

    if (paymentData.method === "cod") {
      isPayingRef.current = true;
      setIsProcessingPayment(true);
      try {
        await completeOrderInDb("COD", "Pending");
        toast.success("Cash on Delivery order placed successfully!");
      } catch (err: any) {
        console.error("[Checkout-V2] COD error:", err);
        toast.error(err?.message || "Failed to place COD order");
      } finally {
        isPayingRef.current = false;
        setIsProcessingPayment(false);
      }
      return;
    }

    // Online payment flow (UPI / Card / NetBanking)
    isPayingRef.current = true;
    setIsProcessingPayment(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load Razorpay checkout SDK. Please check your internet connection.");
        isPayingRef.current = false;
        setIsProcessingPayment(false);
        return;
      }

      // Step A: Create Order on Backend
      const res = await fetch("/api/checkout-v2/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.product.id,
            variantId: i.variant.id,
            quantity: i.quantity,
            pricePerBox: i.variant.pricePerBox,
          })),
          couponCode: couponCode || undefined,
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.order_id) {
        console.error("[Checkout-V2] Server Order Creation Error:", orderData);
        toast.error(orderData.error || "Failed to initiate online payment order");
        isPayingRef.current = false;
        setIsProcessingPayment(false);
        return;
      }

      // Step B: Configure Razorpay Standard Modal Options
      const customerName = selectedAddress?.name?.trim() || user?.name?.trim() || "Customer";
      const customerEmail = user?.email?.trim() || "customer@intrihub.com";
      const rawPhone = selectedAddress?.phone?.trim() || user?.phone?.trim() || "";
      const normalizedPhone = rawPhone.replace(/\D/g, "").slice(-10);
      const razorpayKey =
        orderData.key_id ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
        "rzp_live_TU11DGRRHXy1CH";

      const options: any = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Intrihub",
        description: `Order #${sessionOrderId} (${items.length} item${items.length > 1 ? "s" : ""})`,
        image: "/logo/intri-web-logo.png",
        order_id: orderData.order_id,
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: normalizedPhone || undefined,
        },
        theme: {
          color: "#052a51",
        },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            // Step C: Verify Signature on Backend
            const verifyRes = await fetch("/api/checkout-v2/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              toast.success("Payment verified successfully!");
              await completeOrderInDb("Online", "Paid", {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              });
            } else {
              toast.error(verifyData.error || "Payment signature verification failed");
            }
          } catch (e: any) {
            console.error("[Checkout] Verification error:", e);
            toast.error("Failed to verify payment with server");
          } finally {
            isPayingRef.current = false;
            setIsProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: function () {
            isPayingRef.current = false;
            setIsProcessingPayment(false);
            toast.info("Payment window closed");
          },
        },
      };

      if (activeRzpRef.current) {
        try {
          activeRzpRef.current.close();
        } catch {
          // ignore
        }
      }

      const rzp = new (window as any).Razorpay(options);
      activeRzpRef.current = rzp;

      rzp.on("payment.failed", function (response: any) {
        console.error("[Checkout-V2] ❌ Razorpay Client Payment Failed Event:", {
          error: response?.error,
          code: response?.error?.code,
          description: response?.error?.description,
          source: response?.error?.source,
          step: response?.error?.step,
          reason: response?.error?.reason,
        });
        isPayingRef.current = false;
        setIsProcessingPayment(false);
        toast.error(response?.error?.description || "Payment failed. Please retry.");
      });

      try {
        rzp.open();
      } catch (openErr: any) {
        console.error("[Checkout-V2] rzp.open() error:", openErr);
        const inApp = detectInAppBrowser();
        if (inApp.isInApp) {
          toast.error("In-app browser blocked payment window. Opening in your main browser...", {
            action: {
              label: "Open Browser",
              onClick: () => openInSystemBrowser(),
            },
          });
          openInSystemBrowser();
        } else {
          toast.error("Could not open payment window. Please check your browser popup settings.");
        }
        isPayingRef.current = false;
        setIsProcessingPayment(false);
      }
    } catch (err: any) {
      console.error("[Checkout-V2] Payment error:", err);
      toast.error(err?.message || "An unexpected error occurred during payment");
      isPayingRef.current = false;
      setIsProcessingPayment(false);
    }
  };

  const handleQrPaymentSuccess = async (paymentId: string) => {
    isPayingRef.current = true;
    setIsProcessingPayment(true);
    try {
      await completeOrderInDb("Online", "Paid", {
        paymentId,
      });
      toast.success("QR Payment confirmed!");
    } catch (err: any) {
      console.error("[Checkout-V2] QR fulfillment error:", err);
      toast.error(err?.message || "Failed to finalize order");
    } finally {
      isPayingRef.current = false;
      setIsProcessingPayment(false);
    }
  };

  // If cart is empty, show empty state
  if (items.length === 0) {
    return (
      <main className="min-h-screen flex flex-col bg-[#F3F4F5] pt-[56px] md:pt-[124px]">
        <Header />
        <div className="flex-1 min-h-[60vh] flex flex-col items-center justify-center px-4 py-12 text-center">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center text-[#F26522] mb-4">
            <ShoppingBag size={36} />
          </div>
          <h2 className="text-2xl font-black text-[#052a51] mb-2">Your Cart is Empty</h2>
          <p className="text-sm text-gray-500 max-w-sm mb-6">
            Add tiles, granite, sanitaryware, or paints to your cart before proceeding to checkout.
          </p>
          <Link
            href="/shop"
            className="px-8 py-3.5 bg-[#052a51] hover:bg-[#041f3d] text-white text-sm font-black rounded-2xl shadow-md transition-all cursor-pointer"
          >
            Explore Catalog
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#F3F4F5] pt-[56px] md:pt-[124px]">
      <Header />
      <InAppBrowserBanner context="checkout" />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/cart"
              className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 transition-colors shadow-2xs"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#052a51]">Secure Checkout</h1>
              <p className="text-xs text-gray-500">Order ID: #{sessionOrderId}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-[#2F7A4F] bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
            <ShieldCheck size={16} />
            <span className="hidden sm:inline">256-Bit SSL Encrypted</span>
          </div>
        </div>

        {/* 3-Step Progress Stepper */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-4 sm:p-5 shadow-xs">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { num: 1, title: "Delivery Address", desc: "Select or Add Address", icon: MapPin },
              { num: 2, title: "Logistics Slab", desc: "Weight-Based Rate", icon: Truck },
              { num: 3, title: "Payment Mode", desc: "UPI, Card, NetBanking, COD", icon: CreditCard },
            ].map((step) => {
              const isCompleted = currentStep > step.num;
              const isActive = currentStep === step.num;
              return (
                <div
                  key={step.num}
                  onClick={() => {
                    if (isCompleted) setCurrentStep(step.num as any);
                  }}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-2 p-2.5 rounded-2xl transition-all ${
                    isCompleted
                      ? "bg-green-50/70 border border-green-200 cursor-pointer"
                      : isActive
                      ? "bg-[#052a51] text-white border border-[#052a51] shadow-xs"
                      : "bg-gray-50 border border-gray-200/60 opacity-60"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                      isCompleted
                        ? "bg-[#2F7A4F] text-white"
                        : isActive
                        ? "bg-white text-[#052a51]"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {isCompleted ? <Check size={14} strokeWidth={3} /> : step.num}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p
                      className={`text-xs font-black leading-tight ${
                        isActive ? "text-white" : isCompleted ? "text-green-900" : "text-gray-700"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p
                      className={`text-[10px] leading-tight mt-0.5 ${
                        isActive ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content Grid: Left Steps + Right Sticky Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Active Step (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {currentStep === 1 && (
              <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-5 sm:p-7">
                <AddressStep
                  selectedAddress={selectedAddress}
                  onSelectAddress={(addr) => setSelectedAddress(addr)}
                  onProceedToDelivery={() => {
                    if (!selectedAddress) {
                      toast.error("Please choose a delivery address");
                      return;
                    }
                    setCurrentStep(2);
                  }}
                />
              </div>
            )}

            {currentStep === 2 && (
              <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-5 sm:p-7">
                <DeliveryStep
                  storeSettings={storeSettings}
                  onProceedToPayment={() => setCurrentStep(3)}
                  onBackToAddress={() => setCurrentStep(1)}
                />
              </div>
            )}

            {currentStep === 3 && (
              <PaymentStep
                totalAmount={grandTotal}
                orderId={sessionOrderId}
                pincode={selectedAddress?.pincode}
                paymentData={paymentData}
                onPaymentDataChange={(data) => setPaymentData(data)}
                onTriggerPayment={handleTriggerPayment}
                onQrPaymentSuccess={handleQrPaymentSuccess}
                onBackToDelivery={() => setCurrentStep(2)}
                isProcessing={isProcessingPayment}
              />
            )}
          </div>

          {/* Right Column: Sticky Order Summary (4 cols) */}
          <div className="lg:col-span-4">
            <OrderSummaryV2
              items={items}
              subtotal={subtotal}
              deliveryFee={calculatedDeliveryFee}
              deliveryType={
                isFreeDelivery
                  ? "FREE Delivery"
                  : isBikeDelivery
                  ? "Bike Delivery"
                  : "4-Wheeler Delivery"
              }
              totalWeightKg={totalWeightKg}
              couponCode={couponCode}
              discountAmount={discountAmount}
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={handleRemoveCoupon}
              grandTotal={grandTotal}
            />
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
