"use client";

import { useState, useEffect } from "react";
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
  RotateCw,
  Sparkles,
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useAdminStore } from "@/lib/admin-store";
import { useAuthStore, type CustomerAddress } from "@/lib/auth-store";
import { useNotificationsStore } from "@/lib/notifications-store";
import Header from "@/components/Header";
import LocationPicker from "@/components/location/LocationPicker";
import { toast } from "sonner";

function formatPrice(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

const STEPS = ["Address", "Delivery", "Payment"] as const;
type Step = typeof STEPS[number];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const subtotal = useCartStore((s) => s.getSubtotal());
  const deliveryFee = subtotal >= 15000 ? 0 : 999;
  const total = subtotal + deliveryFee;

  const { user, isAuthenticated, openLoginModal } = useAuthStore();
  const adminSettings = useAdminStore((s) => s.settings);

  const [step, setStep] = useState<Step>("Address");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"Online" | "COD">("Online");

  // COD Confirmation OTP Modal State
  const [isCodOtpModalOpen, setIsCodOtpModalOpen] = useState(false);
  const [codOtp, setCodOtp] = useState(["", "", "", ""]);
  const [codLoading, setCodLoading] = useState(false);

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

  // COD Rules check
  const codMaxLimit = adminSettings?.codMaxLimit || 25000;
  const isCodOverLimit = total > codMaxLimit;
  const isCodBlockedPincode =
    selectedAddress && adminSettings?.codBlockedPincodes?.includes(selectedAddress.pincode);
  const isCodAllowed = !isCodOverLimit && !isCodBlockedPincode && (adminSettings?.codEnabled !== false);

  const stepIndex = STEPS.indexOf(step);

  // Address step validation
  const handleProceedToDelivery = () => {
    if (!selectedAddress) {
      toast.error("Please select or add a delivery address to continue.");
      return;
    }
    setStep("Delivery");
  };

  // Place Order (Online or COD)
  const placeOrder = (method: "Online" | "COD", paymentStatus: "Paid" | "Pending") => {
    if (!selectedAddress) return;

    const orderId = `TL-${Math.floor(100000 + Math.random() * 900000)}`;

    const { addOrder } = useAdminStore.getState();
    addOrder({
      id: orderId,
      customerName: selectedAddress.name.trim() || user?.name || "Customer",
      customerPhone: selectedAddress.phone.trim() || user?.phone || "+91 98765 43210",
      customerEmail: user?.email || "customer@tiletra.in",
      shippingAddress: {
        line1: selectedAddress.line1,
        line2: selectedAddress.line2,
        city: selectedAddress.city,
        pincode: selectedAddress.pincode,
        state: selectedAddress.state,
      },
      items: items.map((i) => ({
        productId: i.product.id,
        productName: i.product.name,
        variantId: i.variant.id,
        variantDetails: `${i.variant.size} · ${i.variant.finish} · ${i.variant.color}`,
        boxQuantity: i.quantity,
        pricePerBox: i.variant.pricePerBox,
        totalPrice: i.variant.pricePerBox * i.quantity,
        image: i.product.images[0] || "https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800&q=80",
      })),
      subtotal,
      deliveryFee,
      discount: 0,
      total,
      paymentStatus,
      paymentMethod: method === "COD" ? "COD" : "Online",
      paymentCollected: method === "COD" ? false : true,
      paymentId: method === "COD" ? `cod_ref_${Date.now().toString().slice(-6)}` : `pay_rzp_${Date.now().toString().slice(-8)}`,
      orderStatus: "Processing",
      createdAt: new Date().toISOString(),
      estimatedDelivery: "3–7 Business Days",
    });

    // In-app notification
    const { addNotification } = useNotificationsStore.getState();
    addNotification({
      type: "order_placed",
      title: `Order ${orderId} Placed (${method === "COD" ? "Cash on Delivery" : "Online Paid"})!`,
      body: `Thank you, ${selectedAddress.name}! Your tile order for ${items.length} design(s) is scheduled for safe crate dispatch.`,
      link: "/account/orders",
    });

    clearCart();
    router.push(`/checkout/success?orderId=${orderId}&method=${method.toLowerCase()}&total=${total}`);
  };

  // Trigger COD Confirmation Dialog
  const handleInitiateCod = () => {
    if (!isCodAllowed) {
      if (isCodOverLimit) toast.error(`COD is available only up to ${formatPrice(codMaxLimit)}.`);
      if (isCodBlockedPincode) toast.error(`COD is unavailable for pincode ${selectedAddress?.pincode}.`);
      return;
    }
    setIsCodOtpModalOpen(true);
  };

  // Verify COD OTP & Finalize Order
  const handleConfirmCodOtp = () => {
    const code = codOtp.join("");
    if (code !== "1234" && code.length !== 4) {
      toast.error("Invalid confirmation code. Please enter 1234 to confirm.");
      return;
    }
    setCodLoading(true);
    setTimeout(() => {
      setCodLoading(false);
      setIsCodOtpModalOpen(false);
      placeOrder("COD", "Pending");
    }, 600);
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#F3F4F5]">
      <Header />

      <div className="w-full max-w-[1200px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] pt-[110px] md:pt-[168px] pb-16 flex-1">
        {/* Breadcrumb / Title */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <span className="text-[10px] font-black text-[#F26522] uppercase tracking-[2.5px] bg-[#F26522]/10 px-2.5 py-0.5 rounded-md">
              Secure Checkout
            </span>
            <h1 className="text-[28px] md:text-[36px] font-black text-[#052a51] tracking-tight mt-1">
              Order Checkout
            </h1>
          </div>

          {/* User badge */}
          {isAuthenticated && user && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 px-3.5 py-2 rounded-2xl shadow-2xs">
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

        {/* Step Stepper Indicator */}
        <div className="flex items-center justify-between mb-10 max-w-2xl bg-white p-4 rounded-3xl border border-gray-200/80 shadow-2xs">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs transition-colors shadow-2xs ${
                    i < stepIndex
                      ? "bg-[#2F7A4F] text-white"
                      : i === stepIndex
                      ? "bg-[#F26522] text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {i < stepIndex ? <Check size={16} /> : i + 1}
                </div>
                <span
                  className={`text-xs font-bold ${
                    i === stepIndex ? "text-[#052a51]" : i < stepIndex ? "text-[#2F7A4F]" : "text-gray-400"
                  }`}
                >
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    i < stepIndex ? "bg-[#2F7A4F]" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
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
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep("Address")}
                    className="flex-1 h-12 border-2 border-gray-200 text-[#052a51] font-bold rounded-xl hover:border-gray-400 text-xs"
                  >
                    ← Change Address
                  </button>
                  <button
                    onClick={() => setStep("Payment")}
                    className="flex-1 h-12 bg-[#F26522] hover:bg-[#d95a1e] text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <span>Proceed to Payment</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: PAYMENT METHOD SELECTION ── */}
            {step === "Payment" && (
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200/80 shadow-xs space-y-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#052a51] text-white flex items-center justify-center">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[#052a51]">Payment Method</h2>
                    <p className="text-xs text-gray-500">Choose between Online Payment or Cash on Delivery</p>
                  </div>
                </div>

                {/* Method 1: Pay Online */}
                <div
                  onClick={() => setPaymentMethod("Online")}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                    paymentMethod === "Online"
                      ? "border-[#F26522] bg-[#F26522]/5 shadow-2xs"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="payment-method"
                        checked={paymentMethod === "Online"}
                        onChange={() => setPaymentMethod("Online")}
                        className="w-4 h-4 accent-[#F26522] mt-1 cursor-pointer"
                      />
                      <div>
                        <p className="text-sm font-black text-[#052a51] flex items-center gap-2">
                          <span>Pay Online (Razorpay)</span>
                          <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 text-[10px] font-black uppercase">
                            Instant Confirmation
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                          Pay securely via UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, or NetBanking.
                        </p>
                      </div>
                    </div>
                    <CreditCard size={22} className="text-gray-400 shrink-0 mt-0.5" />
                  </div>
                </div>

                {/* Method 2: Cash on Delivery (COD) */}
                <div
                  onClick={() => {
                    if (isCodAllowed) setPaymentMethod("COD");
                  }}
                  className={`p-5 rounded-2xl border-2 transition-all ${
                    !isCodAllowed
                      ? "opacity-60 bg-gray-50 border-gray-200 cursor-not-allowed"
                      : paymentMethod === "COD"
                      ? "border-[#F26522] bg-[#F26522]/5 shadow-2xs cursor-pointer"
                      : "border-gray-200 hover:border-gray-300 bg-white cursor-pointer"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="payment-method"
                        disabled={!isCodAllowed}
                        checked={paymentMethod === "COD"}
                        onChange={() => {
                          if (isCodAllowed) setPaymentMethod("COD");
                        }}
                        className="w-4 h-4 accent-[#F26522] mt-1 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <div>
                        <p className="text-sm font-black text-[#052a51] flex items-center gap-2">
                          <span>Cash on Delivery (COD)</span>
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-black uppercase">
                            Pay on Arrival
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                          Pay cash to our delivery driver when your tiles reach your doorstep. Requires quick OTP confirmation.
                        </p>

                        {/* Warnings if COD is blocked */}
                        {isCodOverLimit && (
                          <p className="text-[11px] font-bold text-amber-700 mt-2 flex items-center gap-1">
                            <AlertTriangle size={13} />
                            COD is available only up to {formatPrice(codMaxLimit)}. Order total is {formatPrice(total)}.
                          </p>
                        )}
                        {isCodBlockedPincode && (
                          <p className="text-[11px] font-bold text-red-600 mt-2 flex items-center gap-1">
                            <AlertTriangle size={13} />
                            COD is currently restricted for pincode {selectedAddress?.pincode}.
                          </p>
                        )}
                      </div>
                    </div>
                    <Banknote size={22} className="text-gray-400 shrink-0 mt-0.5" />
                  </div>
                </div>

                {/* Final Place Order Action Button */}
                <div className="pt-3 border-t border-gray-100">
                  {paymentMethod === "Online" ? (
                    <button
                      id="razorpay-pay-btn"
                      onClick={() => placeOrder("Online", "Paid")}
                      className="w-full h-13 bg-[#052a51] hover:bg-[#0b3b6d] text-white font-black text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Lock size={16} className="text-[#F26522]" />
                      <span>Pay {formatPrice(total)} & Confirm Order</span>
                    </button>
                  ) : (
                    <button
                      id="cod-pay-btn"
                      onClick={handleInitiateCod}
                      className="w-full h-13 bg-[#F26522] hover:bg-[#d95a1e] text-white font-black text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Banknote size={18} />
                      <span>Confirm Cash on Delivery ({formatPrice(total)})</span>
                    </button>
                  )}
                </div>
              </div>
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

      {/* ── COD OTP CONFIRMATION MODAL ── */}
      {isCodOtpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsCodOtpModalOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl z-10 border border-gray-100 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
              <Banknote size={24} />
            </div>

            <div>
              <h3 className="text-xl font-black text-[#052a51]">Confirm Cash on Delivery</h3>
              <p className="text-xs text-gray-500 mt-1">
                Enter the 4-digit code sent to +91 {selectedAddress?.phone || user?.phone} to confirm your order of {formatPrice(total)}.
              </p>
            </div>

            {/* Quick Demo Hint */}
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-semibold flex items-center justify-center gap-1.5">
              <Sparkles size={14} className="text-[#F26522]" />
              <span>Demo Code: Enter <strong>1234</strong></span>
            </div>

            {/* OTP Boxes */}
            <div className="flex justify-center gap-2.5 py-2">
              {[0, 1, 2, 3].map((i) => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  inputMode="numeric"
                  value={codOtp[i]}
                  onChange={(e) => {
                    const newOtp = [...codOtp];
                    newOtp[i] = e.target.value.replace(/\D/g, "");
                    setCodOtp(newOtp);
                  }}
                  className="w-12 h-12 text-center text-xl font-black text-[#052a51] bg-gray-50 border-2 border-gray-200 focus:border-[#F26522] rounded-xl focus:outline-none"
                />
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCodOtpModalOpen(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCodOtp}
                disabled={codLoading || codOtp.join("").length !== 4}
                className="flex-1 py-3 bg-[#F26522] hover:bg-[#d95a1e] text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {codLoading ? <RotateCw size={15} className="animate-spin" /> : "Confirm Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
