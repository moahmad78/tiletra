"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  MapPin,
  CreditCard,
  Truck,
  ArrowRight,
  ShieldCheck,
  Banknote,
  Home,
  Briefcase,
  Building,
  Plus,
  Lock,
  Phone,
  AlertTriangle,
  QrCode,
  Smartphone,
  ShoppingBag,
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useAuthStore, type CustomerAddress } from "@/lib/auth-store";
import { useNotificationsStore } from "@/lib/notifications-store";
import { getStoreSettings } from "@/lib/actions/settings";
import Header from "@/components/Header";
import LocationPicker from "@/components/location/LocationPicker";
import PaymentSection, { type PaymentSelectionState } from "@/components/checkout/PaymentSection";
import { toast } from "sonner";

function formatPrice(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

const STEPS = ["Address", "Delivery", "Payment"] as const;
type Step = typeof STEPS[number];

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { items, clearCart } = useCartStore();
  const subtotal = useCartStore((s) => s.getSubtotal());

  const [storeSettings, setStoreSettings] = useState<{
    freeDeliveryThreshold: number;
    standardDeliveryFee: number;
    codEnabled: boolean;
    codMaxLimit: number;
    codBlockedPincodes: string[];
  }>({
    freeDeliveryThreshold: 15000,
    standardDeliveryFee: 999,
    codEnabled: true,
    codMaxLimit: 25000,
    codBlockedPincodes: ["560099", "560088"],
  });

  const freeThreshold = storeSettings.freeDeliveryThreshold ?? 15000;
  const standardFee = storeSettings.standardDeliveryFee ?? 999;
  const deliveryFee = subtotal >= freeThreshold ? 0 : standardFee;
  const total = subtotal + deliveryFee;

  const { user, isAuthenticated, openLoginModal } = useAuthStore();

  const [step, setStep] = useState<Step>("Address");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [paymentSelection, setPaymentSelection] = useState<PaymentSelectionState>({
    method: "upi",
    upiApp: "gpay",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch live store settings from database
  useEffect(() => {
    getStoreSettings().then((s) => {
      if (s) {
        setStoreSettings({
          freeDeliveryThreshold: s.freeDeliveryThreshold ?? 15000,
          standardDeliveryFee: s.standardDeliveryFee ?? 999,
          codEnabled: s.codEnabled ?? true,
          codMaxLimit: s.codMaxLimit ?? 25000,
          codBlockedPincodes: s.codBlockedPincodes ?? ["560099", "560088"],
        });
      }
    });
  }, []);

  // Auto-select default address on load
  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0) {
      const def = user.addresses.find((a) => a.isDefault) || user.addresses[0];
      setSelectedAddressId(def.id);
    } else {
      setIsAddingNewAddress(true);
    }
  }, [user]);

  const selectedAddress = user?.addresses.find((a) => a.id === selectedAddressId) || user?.addresses[0];
  // COD Rules check: 100% enabled for every item and pincode as requested
  const isCodAllowed = true;

  const stepIndex = STEPS.indexOf(step);

  // Address step validation
  const handleProceedToDelivery = () => {
    if (!selectedAddress) {
      toast.error("Please select or add a delivery address to continue.");
      return;
    }
    setStep("Delivery");
  };

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const isPayingRef = useRef(false);
  const activeRzpRef = useRef<any>(null);

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

  // Place Order (Online or COD)
  const placeOrder = async (
    method: "Online" | "COD",
    paymentStatus: "Paid" | "Pending",
    customPaymentId?: string,
    razorpayData?: {
      orderId?: string;
      paymentId?: string;
      signature?: string;
    }
  ) => {
    if (!isAuthenticated) {
      openLoginModal({ type: "checkout" });
      return;
    }

    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    const orderId = `TL-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const { createOrder } = await import("@/lib/actions/orders");
      const res = await createOrder({
        id: orderId,
        userId: user?.id,
        customerName: selectedAddress.name?.trim() || user?.name || "Customer",
        customerPhone: selectedAddress.phone?.trim() || user?.phone || "+91 98765 43210",
        customerEmail: user?.email || "customer@intrihub.com",
        shippingAddress: {
          fullName: selectedAddress.name || user?.name || "Customer",
          phone: selectedAddress.phone || user?.phone || "+91 98765 43210",
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
          variantDetails: `${i.variant.size} · ${i.variant.finish} · ${i.variant.color}`,
          boxQuantity: i.quantity,
          pricePerBox: i.variant.pricePerBox,
          totalPrice: i.variant.pricePerBox * i.quantity,
          image: i.product.images[0] || "/placeholders/product.svg",
        })),
        subtotal,
        deliveryFee,
        discount: 0,
        total,
        paymentStatus,
        paymentMethod: method === "COD" ? "COD" : "Online",
        codConfirmed: method === "COD",
        paymentId: razorpayData?.paymentId || customPaymentId || (method === "COD" ? `cod_ref_${Date.now().toString().slice(-6)}` : `pay_rzp_${Date.now().toString().slice(-8)}`),
        razorpayOrderId: razorpayData?.orderId,
        razorpayPaymentId: razorpayData?.paymentId,
        razorpaySignature: razorpayData?.signature,
      });

      if (!res.success || !res.order) {
        toast.error(res.error || "Failed to create order. Please try again.");
        return;
      }
    } catch (err: any) {
      console.error("Error creating database order:", err);
      toast.error(err?.message || "Failed to create order. Please check your connection.");
      return;
    }

    // In-app notification
    const { addNotification } = useNotificationsStore.getState();
    addNotification({
      type: "order_placed",
      title: `Order ${orderId} Placed (${method === "COD" ? "Cash on Delivery" : "Online Paid"})!`,
      body: `Thank you, ${selectedAddress.name}! Your order for ${items.length} item(s) is scheduled for safe crate dispatch.`,
      link: "/account/orders",
    });

    clearCart();
    router.push(`/checkout/success?orderId=${orderId}&method=${method.toLowerCase()}&total=${total}`);
  };

  // Online Payment Flow with Razorpay Standard Modal targeted to selected method
  const handleOnlinePayment = async (selectedPayment: PaymentSelectionState) => {
    // 0. Prevent concurrent or double invocations
    if (isPayingRef.current || isProcessingPayment) {
      return;
    }

    if (!isAuthenticated) {
      openLoginModal({ type: "checkout" });
      return;
    }

    if (!selectedAddress) {
      toast.error("Please select or add a delivery address to continue.");
      return;
    }

    isPayingRef.current = true;
    setIsProcessingPayment(true);

    try {
      // 1. Load Razorpay checkout script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load Razorpay checkout SDK. Please check your internet connection.");
        isPayingRef.current = false;
        setIsProcessingPayment(false);
        return;
      }

      // 2. Create Razorpay Order on Backend
      const orderAmountPaise = Math.round(total * 100);
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: orderAmountPaise,
          currency: "INR",
          receipt: `rcpt_${Date.now().toString().slice(-8)}`,
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.order_id) {
        toast.error(orderData.error || "Failed to initiate online payment order");
        isPayingRef.current = false;
        setIsProcessingPayment(false);
        return;
      }

      // 3. Extract complete contact prefill details
      const customerName =
        selectedAddress?.name?.trim() || user?.name?.trim() || "Customer";
      const customerEmail =
        user?.email?.trim() || "customer@intrihub.com";
      const customerPhone =
        selectedAddress?.phone?.trim() ||
        user?.phone?.trim() ||
        "";

      const normalizedPhone = customerPhone
        ?.replace(/\D/g, "")
        .replace(/^91/, "")
        .replace(/^0/, "")
        .slice(-10);

      console.log("[Razorpay Checkout] Prefill contact initialized:", {
        method: selectedPayment.method,
        hasName: Boolean(customerName),
        hasEmail: Boolean(customerEmail),
        hasValidPhone: Boolean(normalizedPhone && normalizedPhone.length === 10),
      });

      // 4. Open Razorpay Standard Checkout targeting the selected method
      const razorpayKey =
        orderData.key_id ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
        "rzp_live_TRwZ7JnWhHsutK";

      const rzpMethod =
        selectedPayment.method === "card"
          ? "card"
          : selectedPayment.method === "netbanking"
          ? "netbanking"
          : "upi";

      const options: any = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Intrihub",
        description: `Order Payment (${items.length} item${items.length > 1 ? "s" : ""})`,
        image: "/logo/intri-web-logo.png",
        order_id: orderData.order_id,
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: normalizedPhone || undefined,
          method: rzpMethod,
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
            // 5. Verify Payment Signature on Backend (HMAC-SHA256)
            const verifyRes = await fetch("/api/verify-payment", {
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
              await placeOrder("Online", "Paid", response.razorpay_payment_id, {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              });
            } else {
              toast.error(verifyData.error || "Payment signature verification failed");
            }
          } catch (e: any) {
            console.error("Verification error:", e);
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

      // Direct Bank/VPA pass-through
      if (selectedPayment.method === "netbanking" && selectedPayment.bankCode) {
        options.prefill.bank = selectedPayment.bankCode;
      }
      if (selectedPayment.method === "upi" && selectedPayment.upiId) {
        options.prefill.vpa = selectedPayment.upiId;
      }

      // Close previous instance if any exists
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
        isPayingRef.current = false;
        setIsProcessingPayment(false);
        toast.error(response?.error?.description || "Payment failed. Please retry.");
      });

      rzp.open();
    } catch (err: any) {
      console.error("Online payment error:", err);
      toast.error(err?.message || "An unexpected error occurred during payment");
      isPayingRef.current = false;
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentSubmit = () => {
    if (paymentSelection.method === "cod") {
      placeOrder("COD", "Pending");
    } else {
      handleOnlinePayment(paymentSelection);
    }
  };

  if (!mounted) {
    return (
      <main className="min-h-screen flex flex-col bg-[#F3F4F5]">
        <Header />
        <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-6 lg:px-8 pt-[76px] sm:pt-[84px] md:pt-[175px] lg:pt-[180px] pb-14 flex-1">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded-xl w-48" />
            <div className="h-14 bg-white rounded-3xl border border-gray-200/80" />
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
              <div className="h-96 bg-white rounded-3xl border border-gray-200/80" />
              <div className="h-96 bg-white rounded-3xl border border-gray-200/80" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen flex flex-col bg-[#F3F4F5]">
        <Header />
        <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-6 lg:px-8 pt-[76px] sm:pt-[84px] md:pt-[175px] lg:pt-[180px] pb-14 flex-1 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-10 md:p-14 text-center max-w-md mx-auto shadow-sm border border-gray-100 my-8">
            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-4 text-[#F26522]">
              <ShoppingBag size={30} strokeWidth={1.75} />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-[#052a51]">Your cart is empty</h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-1.5 leading-relaxed">
              Add tiles to your cart before proceeding to checkout.
            </p>
            <div className="mt-6">
              <Link href="/shop">
                <button className="px-6 h-11 bg-[#F26522] text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-[#d95a1e] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xs mx-auto cursor-pointer">
                  Shop All Tiles <ArrowRight size={15} />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#F3F4F5]">
      <Header />

      <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-6 lg:px-8 pt-[76px] sm:pt-[84px] md:pt-[175px] lg:pt-[180px] pb-14 flex-1">
        {/* Breadcrumb / Title */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-3">
          <div>
            <span className="text-[10px] font-black text-[#F26522] uppercase tracking-[2px] bg-[#F26522]/10 px-2.5 py-0.5 rounded-md">
              Secure Checkout
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-[34px] font-black text-[#052a51] tracking-tight mt-1">
              Order Checkout
            </h1>
          </div>

          {/* User badge (Hidden on mobile) */}
          {isAuthenticated && user && (
            <div className="hidden sm:flex items-center gap-2 bg-white border border-gray-200 px-3.5 py-2 rounded-2xl shadow-2xs">
              <div className="w-7 h-7 rounded-full bg-[#052a51] text-white flex items-center justify-center text-xs font-black">
                {user.name ? user.name[0].toUpperCase() : "U"}
              </div>
              <div className="text-xs">
                <p className="font-bold text-[#052a51] leading-none">{user.name || "Customer"}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">+91 {user.phone}</p>
              </div>
            </div>
          )}
        </div>

        {/* Step Stepper Indicator (Fully Responsive on Mobile & Desktop) */}
        <div className="w-full max-w-2xl bg-white px-3 py-2.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-gray-200/80 shadow-2xs mb-6 sm:mb-10">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
                <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-[11px] sm:text-xs transition-colors shadow-2xs shrink-0 ${
                      i < stepIndex
                        ? "bg-[#2F7A4F] text-white"
                        : i === stepIndex
                        ? "bg-[#F26522] text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {i < stepIndex ? <Check size={14} className="sm:w-4 sm:h-4 stroke-[2.5]" /> : i + 1}
                  </div>
                  <span
                    className={`text-[11px] sm:text-xs font-bold whitespace-nowrap ${
                      i === stepIndex ? "text-[#052a51]" : i < stepIndex ? "text-[#2F7A4F]" : "text-gray-400"
                    }`}
                  >
                    {s}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1.5 sm:mx-3 md:mx-4 min-w-[8px] sm:min-w-[16px] ${
                      i < stepIndex ? "bg-[#2F7A4F]" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* Left: Interactive Steps */}
          <div>
            {/* ── STEP 1: ADDRESS ── */}
            {step === "Address" && (
              <div className="space-y-6">
                {!isAddingNewAddress && user?.addresses && user.addresses.length > 0 ? (
                  <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200/80 shadow-xs">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-black text-[#052a51]">Select Delivery Address</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Choose where you want your tiles delivered
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsAddingNewAddress(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F26522]/10 hover:bg-[#F26522]/20 text-[#F26522] text-xs font-bold transition-all border border-[#F26522]/20"
                      >
                        <Plus size={14} />
                        <span>Add New Address</span>
                      </button>
                    </div>

                    {/* Saved Address Cards */}
                    <div className="space-y-3">
                      {user.addresses.map((addr) => {
                        const isSelected = addr.id === selectedAddressId;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-4 ${
                              isSelected
                                ? "border-[#F26522] bg-[#F26522]/5 shadow-2xs"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="radio"
                                name="address-selection"
                                checked={isSelected}
                                onChange={() => setSelectedAddressId(addr.id)}
                                className="w-4 h-4 accent-[#F26522] mt-1 cursor-pointer"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-black text-[#052a51]">{addr.name}</p>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                    {addr.label}
                                  </span>
                                  {addr.isDefault && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#2F7A4F]/10 text-[#2F7A4F]">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                  {addr.line1}
                                  {addr.line2 ? `, ${addr.line2}` : ""}
                                  {addr.landmark ? ` (Landmark: ${addr.landmark})` : ""},{" "}
                                  {addr.city}, {addr.state} — <strong>{addr.pincode}</strong>
                                </p>
                                <p className="text-xs text-gray-500 font-semibold mt-1">
                                  📞 +91 {addr.phone}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Continue Action */}
                    <button
                      onClick={handleProceedToDelivery}
                      className="w-full h-13 mt-6 bg-[#F26522] hover:bg-[#d95a1e] text-white font-black text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <span>Deliver to Selected Address</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                ) : (
                  /* Add New Address with GPS auto-detect component */
                  <LocationPicker
                    onAddressSelected={(newAddr) => {
                      setSelectedAddressId(newAddr.id);
                      setIsAddingNewAddress(false);
                      setStep("Delivery");
                    }}
                    onCancel={user?.addresses && user.addresses.length > 0 ? () => setIsAddingNewAddress(false) : undefined}
                  />
                )}
              </div>
            )}

            {/* ── STEP 2: DELIVERY REVIEW ── */}
            {step === "Delivery" && (
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200/80 shadow-xs space-y-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#052a51] text-white flex items-center justify-center">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[#052a51]">Specialized Tile Freight</h2>
                    <p className="text-xs text-gray-500">Delivered in edge-cushioned wooden crates</p>
                  </div>
                </div>

                {/* Delivery Option Card */}
                <div className="p-5 rounded-2xl border-2 border-[#F26522] bg-[#F26522]/5 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-black text-[#052a51] text-sm">Direct Factory Doorstep Delivery</p>
                      <p className="text-xs text-gray-600 mt-0.5">Estimated Transit Time: 3–5 Business Days</p>
                    </div>
                    <span className={`text-base font-black ${deliveryFee === 0 ? "text-[#2F7A4F]" : "text-[#052a51]"}`}>
                      {deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed pt-2 border-t border-[#F26522]/20">
                    Your shipment will be handled by our dedicated Bangalore building materials carrier. The driver will call 30 minutes before arrival.
                  </p>
                </div>

                {/* Delivering To Card */}
                {selectedAddress && (
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-400 uppercase tracking-wider">Shipping To:</span>
                      <button
                        type="button"
                        onClick={() => setStep("Address")}
                        className="text-[#F26522] font-bold hover:underline"
                      >
                        Change Address
                      </button>
                    </div>
                    <p className="font-bold text-[#052a51]">{selectedAddress.name} ({selectedAddress.label})</p>
                    <p className="text-gray-600 mt-0.5">
                      {selectedAddress.line1}, {selectedAddress.city} — {selectedAddress.pincode}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep("Address")}
                    className="h-12 px-4 sm:px-6 border-2 border-gray-200 hover:border-gray-300 text-[#052a51] font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer shrink-0"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("Payment")}
                    className="flex-1 h-12 bg-[#F26522] hover:bg-[#d95a1e] text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <span>Proceed to Payment</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: EMBEDDED TILETRA PAYMENT SECTION ── */}
            {step === "Payment" && (
              <PaymentSection
                totalAmount={total}
                paymentState={paymentSelection}
                onPaymentStateChange={setPaymentSelection}
                isProcessing={isProcessingPayment}
                onPaySubmit={handlePaymentSubmit}
                onBack={() => setStep("Delivery")}
              />
            )}
          </div>

          {/* Right: Sticky Order Summary */}
          <div className="lg:sticky lg:top-[125px] h-fit">
            <div className="bg-white rounded-3xl p-6 shadow-2xs border border-gray-200/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="font-black text-[#052a51] text-base">Order Items ({items.length})</h3>
                <Link href="/cart" className="text-xs font-bold text-[#F26522] hover:underline">
                  Edit
                </Link>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.variant.id} className="flex justify-between text-xs py-1">
                    <div className="flex-1 pr-2">
                      <p className="font-black text-[#052a51] line-clamp-1">{item.product.name}</p>
                      <p className="text-gray-400 mt-0.5">
                        {item.variant.size} · {item.quantity} box(es)
                      </p>
                    </div>
                    <p className="font-bold text-[#052a51]">
                      {formatPrice(item.variant.pricePerBox * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <hr className="border-gray-100" />

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-bold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Freight Delivery</span>
                  <span className={`font-bold ${deliveryFee === 0 ? "text-[#2F7A4F]" : ""}`}>
                    {deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-[#052a51] pt-2 border-t border-gray-100">
                  <span>Total Amount</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-2xl text-[11px] text-gray-500 space-y-1 border border-gray-100">
                <p className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck size={14} className="text-[#2F7A4F]" /> 100% Breakage-proof crate packaging
                </p>
                <p className="flex items-center gap-1.5 font-medium">
                  <Truck size={14} className="text-[#F26522]" /> 3–5 Business Days Bangalore Delivery
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
