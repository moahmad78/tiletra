"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  Flashlight,
  FlashlightOff,
  SwitchCamera,
  Upload,
  Sparkles,
  ArrowLeft,
  X,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
  Search,
  MessageCircle,
  HelpCircle,
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { getProductPriceInfo, formatPrice } from "@/lib/formatters";
import type { Product } from "@/lib/data/products";
import type { ScanMatchResult } from "@/lib/lens/catalog-matcher";

export default function ScanAndFindPage() {
  const router = useRouter();
  const { addItem, openCart } = useCartStore();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // States
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorchCapability, setHasTorchCapability] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImagePreview, setCapturedImagePreview] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanMatchResult | null>(null);
  const [manualQuery, setManualQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Initialize Camera
  const startCamera = useCallback(async (mode: "environment" | "user") => {
    try {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }

      setErrorMessage(null);
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setHasCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      // Check torch capability
      const videoTrack = mediaStream.getVideoTracks()[0];
      const capabilities = (videoTrack?.getCapabilities?.() as any) || {};
      setHasTorchCapability(Boolean(capabilities.torch));
    } catch (err: any) {
      console.warn("Camera access failed:", err);
      setHasCameraPermission(false);
    }
  }, [stream]);

  useEffect(() => {
    startCamera(facingMode);

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode]);

  // 2. Toggle Flashlight / Torch
  const toggleTorch = async () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      const newTorchState = !isTorchOn;
      await (videoTrack as any).applyConstraints({
        advanced: [{ torch: newTorchState }],
      });
      setIsTorchOn(newTorchState);
    } catch (e) {
      console.warn("Torch toggle not supported on this device/browser", e);
    }
  };

  // 3. Flip Camera
  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // 4. Capture Canvas Frame & Send to API
  const handleCaptureFrame = async () => {
    if (!videoRef.current || isProcessing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

    setCapturedImagePreview(dataUrl);
    await processScanPayload({ image: dataUrl });
  };

  // 5. Gallery Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setCapturedImagePreview(dataUrl);
      await processScanPayload({ image: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  // 6. Manual Text Search Fallback
  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuery.trim() || isProcessing) return;
    await processScanPayload({ text: manualQuery.trim() });
  };

  // 7. Core Scan Request
  const processScanPayload = async (payload: { image?: string; text?: string }) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: ScanMatchResult = await res.json();
      setScanResult(data);

      // Section 9.1: High confidence (>0.85) -> auto-navigate directly to PDP
      if (data.matched && data.confidenceTier === "high" && data.matchedProduct?.slug) {
        setTimeout(() => {
          router.push(`/product/${data.matchedProduct!.slug}`);
        }, 900);
      }
    } catch (err: any) {
      setErrorMessage("Could not connect to scan engine. Please check your network and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 8. Reset to Scan Again
  const handleResetScan = () => {
    setScanResult(null);
    setCapturedImagePreview(null);
    setErrorMessage(null);
    setManualQuery("");
    if (facingMode) {
      startCamera(facingMode);
    }
  };

  // 9. Quick Add to Cart
  const handleAddToCart = (product: Product) => {
    const defaultVariant = product.variants?.[0] || null;
    addItem(product, defaultVariant, 1);
    openCart();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#02152b] text-white flex flex-col overflow-hidden font-sans">
      {/* ── TOP HEADER BAR ── */}
      <header className="relative z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-[#02152b]/90 to-transparent backdrop-blur-xs">
        <Link
          href="/"
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-90 transition-transform"
        >
          <ArrowLeft size={20} />
        </Link>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
          <Sparkles size={14} className="text-[#F26522] animate-pulse" />
          <span className="text-xs font-black tracking-wide uppercase text-white">IntriHub Lens</span>
        </div>

        <div className="flex items-center gap-2">
          {hasTorchCapability && (
            <button
              onClick={toggleTorch}
              type="button"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isTorchOn ? "bg-[#F26522] text-white shadow-md shadow-orange-500/40" : "bg-white/10 text-white"
              }`}
            >
              {isTorchOn ? <FlashlightOff size={18} /> : <Flashlight size={18} />}
            </button>
          )}

          <button
            onClick={toggleCameraFacing}
            type="button"
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:rotate-180 transition-transform"
          >
            <SwitchCamera size={18} />
          </button>
        </div>
      </header>

      {/* ── MAIN VIEWPORT (CAMERA / RETICLE / PREVIEW) ── */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {/* Hidden Canvas for Frame Capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Live Camera View */}
        {!capturedImagePreview && (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Captured Snapshot Preview */}
        {capturedImagePreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={capturedImagePreview}
            alt="Scanned product"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Camera Permission Error Fallback */}
        {hasCameraPermission === false && !capturedImagePreview && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-[#052a51] space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center text-[#F26522]">
              <Camera size={32} />
            </div>
            <div className="space-y-1 max-w-xs">
              <h3 className="text-base font-bold text-white">Camera Access Required</h3>
              <p className="text-xs text-white/70">
                Please allow camera access in your browser settings to scan physical packaging directly, or upload a photo from your gallery.
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 rounded-2xl bg-[#F26522] text-white font-bold text-xs flex items-center gap-2 shadow-lg"
            >
              <Upload size={16} />
              <span>Upload Photo from Gallery</span>
            </button>
          </div>
        )}

        {/* ── SCANNING RETICLE / BOUNDING BOX OVERLAY ── */}
        {!scanResult && (
          <div className="relative z-10 w-[78vw] max-w-[320px] aspect-square pointer-events-none flex items-center justify-center">
            {/* 4 Corner Markers */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#F26522] rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#F26522] rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#F26522] rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#F26522] rounded-br-xl" />

            {/* Glowing Laser Radar Line (when active or scanning) */}
            <div
              className={`absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#F26522] to-transparent shadow-[0_0_12px_#F26522] ${
                isProcessing ? "animate-bounce" : "animate-pulse"
              }`}
            />

            {/* Guidance Text */}
            <div className="absolute -bottom-10 left-0 right-0 text-center">
              <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-semibold text-white/90">
                {isProcessing
                  ? "⚡ Analyzing packaging & brand..."
                  : "Aim camera at packaging label (Cement, Paint, Tile)"}
              </span>
            </div>
          </div>
        )}

        {/* Processing Spinner Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 z-30 bg-black/65 backdrop-blur-xs flex flex-col items-center justify-center space-y-4">
            <div className="w-14 h-14 rounded-full border-4 border-white/20 border-t-[#F26522] animate-spin" />
            <p className="text-sm font-bold text-white tracking-wide">
              Matching IntriHub Live Catalog...
            </p>
          </div>
        )}
      </div>

      {/* ── BOTTOM CONTROLS & RESULT DRAWER ── */}
      <div className="relative z-20 bg-[#052a51] border-t border-white/10 px-4 pt-3 pb-8 space-y-3">
        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <span className="flex-1 font-medium">{errorMessage}</span>
          </div>
        )}

        {/* ── CASE 1: SCAN RESULT READY ── */}
        {scanResult && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pb-4 pt-1">
            {/* Header Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {scanResult.matched ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                    <CheckCircle2 size={13} />
                    <span>Exact Match Found ({Math.round(scanResult.confidence * 100)}%)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
                    <AlertCircle size={13} />
                    <span>Alternative Recommendations</span>
                  </span>
                )}
              </div>

              <button
                onClick={handleResetScan}
                className="text-xs text-white/70 hover:text-white flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg"
              >
                <RefreshCw size={12} />
                <span>Scan New</span>
              </button>
            </div>

            {/* Subtitle / Message */}
            <p className="text-xs text-white/80 font-medium leading-relaxed">
              {scanResult.message}
            </p>

            {/* ── 1. EXACT HIGH-CONFIDENCE MATCH CARD (>0.85) ── */}
            {scanResult.matched && scanResult.confidenceTier === "high" && scanResult.matchedProduct && (
              <div className="bg-white text-gray-900 rounded-2xl p-4 shadow-xl border border-white/20 space-y-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold">
                  <Sparkles size={13} className="text-emerald-600 animate-spin" />
                  <span>High confidence match found! Opening product page...</span>
                </div>
                <div className="flex gap-3">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                    <Image
                      src={scanResult.matchedProduct.images?.[0] || "/placeholders/product.svg"}
                      alt={scanResult.matchedProduct.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#F26522]">
                        {scanResult.matchedProduct.brand || "IntriHub"}
                      </span>
                      <h4 className="text-sm font-bold text-[#052a51] line-clamp-2 leading-snug">
                        {scanResult.matchedProduct.name}
                      </h4>
                    </div>

                    {(() => {
                      const priceInfo = getProductPriceInfo(scanResult.matchedProduct, scanResult.matchedProduct.variants?.[0]);
                      return (
                        <div className="flex items-baseline gap-2 pt-1">
                          <span className="text-base font-black text-[#052a51]">
                            {priceInfo.formattedPrice}
                          </span>
                          {priceInfo.unitSuffix && (
                            <span className="text-xs font-semibold text-gray-500">
                              /{priceInfo.unitSuffix}
                            </span>
                          )}
                          {priceInfo.discountPercent > 0 && (
                            <span className="text-[10px] font-bold text-emerald-700">
                              {priceInfo.discountPercent}% OFF
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleAddToCart(scanResult.matchedProduct!)}
                    className="h-11 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform"
                  >
                    <ShoppingBag size={14} />
                    <span>Add to Cart</span>
                  </button>

                  <Link
                    href={`/product/${scanResult.matchedProduct.slug}`}
                    className="h-11 rounded-xl bg-[#052a51] hover:bg-[#08386a] text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <span>View Product</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            )}

            {/* ── 2. POSSIBLE MATCHES LIST (MEDIUM CONFIDENCE 0.50 - 0.85) ── */}
            {scanResult.matched && scanResult.confidenceTier === "medium" && scanResult.possibleMatches && scanResult.possibleMatches.length > 0 && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Possible Matching Products (Tap to View):
                  </h4>
                </div>

                <div className="space-y-2">
                  {scanResult.possibleMatches.map((item) => {
                    const priceInfo = getProductPriceInfo(item, item.variants?.[0]);
                    return (
                      <Link
                        key={item.id}
                        href={`/product/${item.slug}`}
                        className="bg-white text-gray-900 rounded-xl p-3 flex items-center gap-3 shadow-md hover:border-[#F26522] border border-transparent transition-all active:scale-[0.98]"
                      >
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                          <Image
                            src={item.images?.[0] || "/placeholders/product.svg"}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] font-bold text-[#F26522] uppercase tracking-wider">
                            {item.brand || "IntriHub"}
                          </span>
                          <h5 className="text-xs font-bold text-[#052a51] line-clamp-1">
                            {item.name}
                          </h5>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-xs font-black text-[#052a51]">
                              {priceInfo.formattedPrice}
                            </span>
                            {priceInfo.unitSuffix && (
                              <span className="text-[10px] text-gray-500 font-semibold">
                                /{priceInfo.unitSuffix}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#052a51] text-white flex items-center justify-center shrink-0">
                          <ArrowRight size={14} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── 2. ALTERNATIVES LIST (IF UNMATCHED) ── */}
            {scanResult.alternatives && scanResult.alternatives.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  In-Stock Products in {scanResult.extractedInfo?.categoryGuess || "Category"}:
                </h4>

                <div className="grid grid-cols-2 gap-2.5">
                  {scanResult.alternatives.slice(0, 4).map((alt) => {
                    const priceInfo = getProductPriceInfo(alt, alt.variants?.[0]);
                    return (
                      <div
                        key={alt.id}
                        className="bg-white text-gray-900 rounded-xl p-2.5 flex flex-col justify-between shadow-md"
                      >
                        <div className="space-y-1">
                          <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={alt.images?.[0] || "/placeholders/product.svg"}
                              alt={alt.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <p className="text-[11px] font-bold text-[#052a51] line-clamp-2 leading-tight">
                            {alt.name}
                          </p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs font-black text-[#052a51]">
                              {priceInfo.formattedPrice}
                            </span>
                            {priceInfo.unitSuffix && (
                              <span className="text-[9px] text-gray-500 font-semibold">
                                /{priceInfo.unitSuffix}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 flex gap-1">
                          <button
                            onClick={() => handleAddToCart(alt)}
                            className="flex-1 py-1.5 bg-[#F26522] text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 active:scale-95"
                          >
                            <ShoppingBag size={11} />
                            <span>Add</span>
                          </button>
                          <Link
                            href={`/product/${alt.slug}`}
                            className="px-2 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-bold flex items-center justify-center"
                          >
                            <ArrowRight size={11} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* WhatsApp Consultation Button */}
                <a
                  href={`https://wa.me/919264920211?text=Hi%20IntriHub,%20I%20scanned%20${encodeURIComponent(
                    scanResult.extractedInfo?.detectedBrand || "a product"
                  )}%20and%20need%20help%20sourcing%20it.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors mt-2"
                >
                  <MessageCircle size={15} />
                  <span>Enquire on WhatsApp for Custom Sourcing</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* ── CASE 2: SCAN CONTROLS (WHEN NOT SHOWING RESULTS) ── */}
        {!scanResult && (
          <div className="space-y-4">
            {/* Main Shutter & Upload Buttons */}
            <div className="flex items-center justify-around px-4">
              {/* Gallery Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 rounded-full bg-white/10 flex flex-col items-center justify-center text-white active:scale-90 transition-transform"
                title="Upload from gallery"
              >
                <Upload size={20} />
                <span className="text-[9px] text-white/70 font-semibold mt-0.5">Gallery</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Central Shutter Capture Button */}
              <button
                type="button"
                onClick={handleCaptureFrame}
                disabled={isProcessing}
                className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center p-1.5 active:scale-95 transition-transform shadow-xl shadow-orange-500/20 bg-[#F26522]"
                aria-label="Capture and Scan Product"
              >
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[#F26522]">
                  <Sparkles size={26} className="animate-pulse" />
                </div>
              </button>

              {/* Quick Info Modal Trigger */}
              <div className="w-12 h-12 flex flex-col items-center justify-center text-white/60 text-center">
                <HelpCircle size={18} />
                <span className="text-[9px] text-white/50 font-semibold mt-0.5">Pilot MVP</span>
              </div>
            </div>

            {/* Quick Text Search Bar Fallback */}
            <form onSubmit={handleManualSearch} className="flex gap-2 pt-1">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
                <input
                  type="text"
                  placeholder="Or type brand / product (e.g. Roff T01)..."
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-white/10 border border-white/15 text-white text-xs placeholder:text-white/40 focus:outline-hidden focus:border-[#F26522]"
                />
              </div>
              <button
                type="submit"
                disabled={!manualQuery.trim() || isProcessing}
                className="px-4 h-10 rounded-xl bg-white/15 hover:bg-[#F26522] text-white text-xs font-bold transition-colors disabled:opacity-40"
              >
                Search
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
