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
  X,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
  Search,
  MessageCircle,
  ScanLine,
  Sparkles,
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { getProductPriceInfo } from "@/lib/formatters";
import type { Product } from "@/lib/data/products";
import type { ScanMatchResult } from "@/lib/lens/catalog-matcher";

export default function ScanAndFindPage() {
  const router = useRouter();
  const { addItem, openCart } = useCartStore();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Camera & Scanner States
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorchCapability, setHasTorchCapability] = useState(false);

  // Processing & Match States
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImagePreview, setCapturedImagePreview] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanMatchResult | null>(null);
  const [manualQuery, setManualQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessageIndex, setStatusMessageIndex] = useState(0);

  const rotatingStatusTexts = [
    "Reading packaging label...",
    "Analyzing with Google Vision...",
    "Matching IntriHub catalog...",
    "Almost there...",
  ];

  // Rotate AI status texts during processing
  useEffect(() => {
    if (!isProcessing) {
      setStatusMessageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setStatusMessageIndex((prev) => (prev + 1) % rotatingStatusTexts.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [isProcessing, rotatingStatusTexts.length]);

  // 1. Explicit Stop Function for Camera Hardware & Tracks
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      try {
        const tracks = streamRef.current.getTracks();
        tracks.forEach((track) => {
          try {
            track.stop();
          } catch (e) {
            console.warn("Failed to stop media track:", e);
          }
        });
      } catch (e) {
        console.warn("Failed to retrieve tracks from stream:", e);
      }
      streamRef.current = null;
    }

    setStream(null);
    setIsTorchOn(false);
    setHasTorchCapability(false);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // 2. Initialize Camera
  const startCamera = useCallback(async (mode: "environment" | "user") => {
    // Release any previously held camera track before requesting a new one
    stopCamera();

    try {
      setErrorMessage(null);

      if (!navigator?.mediaDevices?.getUserMedia) {
        if (isMountedRef.current) {
          setHasCameraPermission(false);
          setErrorMessage("Camera access is not supported by this browser.");
        }
        return;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      // If the component unmounted while getUserMedia was resolving, release immediately
      if (!isMountedRef.current) {
        mediaStream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {
            console.warn("Error stopping track after unmount:", e);
          }
        });
        return;
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setHasCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch((err) => {
          console.warn("Video play interrupted/prevented:", err);
        });
      }

      // Check torch capability
      const videoTrack = mediaStream.getVideoTracks()[0];
      const capabilities = (videoTrack?.getCapabilities?.() as any) || {};
      setHasTorchCapability(Boolean(capabilities.torch));
    } catch (err: any) {
      if (isMountedRef.current) {
        console.warn("Camera access failed:", err);
        setHasCameraPermission(false);
      }
    }
  }, [stopCamera]);

  // 3. Lifecycle Effect: Start on Mount / Facing change & Stop on Unmount
  useEffect(() => {
    isMountedRef.current = true;
    startCamera(facingMode);

    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [facingMode, startCamera, stopCamera]);

  // 4. Background / Visibility & Window Lifecycle Handlers (stop camera on tab switch / window hide)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopCamera();
      } else if (
        document.visibilityState === "visible" &&
        isMountedRef.current &&
        !capturedImagePreview &&
        !scanResult
      ) {
        startCamera(facingMode);
      }
    };

    const handleWindowHide = () => {
      stopCamera();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handleWindowHide);
    window.addEventListener("beforeunload", handleWindowHide);
    window.addEventListener("popstate", handleWindowHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handleWindowHide);
      window.removeEventListener("beforeunload", handleWindowHide);
      window.removeEventListener("popstate", handleWindowHide);
    };
  }, [facingMode, capturedImagePreview, scanResult, startCamera, stopCamera]);

  // 5. Toggle Flashlight / Torch
  const toggleTorch = async () => {
    const activeStream = streamRef.current;
    if (!activeStream) return;
    const videoTrack = activeStream.getVideoTracks()[0];
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

  // 6. Flip Camera
  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // 7. Explicit Close Handler (navigate back cleanly)
  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    stopCamera();
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  // 8. Capture Canvas Frame & Send to API
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

    // Stop live camera hardware track once snapshot is captured
    stopCamera();

    setCapturedImagePreview(dataUrl);
    await processScanPayload({ image: dataUrl });
  };

  // 9. Gallery Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Release camera hardware on gallery upload
    stopCamera();

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setCapturedImagePreview(dataUrl);
      await processScanPayload({ image: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  // 10. Manual Text Search Fallback
  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuery.trim() || isProcessing) return;
    stopCamera();
    await processScanPayload({ text: manualQuery.trim() });
  };

  // 11. Core Scan Request
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

      // High confidence (>0.85) -> auto-navigate directly to PDP
      if (data.matched && data.confidenceTier === "high" && data.matchedProduct?.slug) {
        setTimeout(() => {
          stopCamera();
          router.push(`/product/${data.matchedProduct!.slug}`);
        }, 900);
      }
    } catch (err: any) {
      setErrorMessage("Could not connect to scan engine. Please check your network and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 12. Reset to Scan Again
  const handleResetScan = () => {
    setScanResult(null);
    setCapturedImagePreview(null);
    setErrorMessage(null);
    setManualQuery("");
    if (facingMode) {
      startCamera(facingMode);
    }
  };

  // 13. Quick Add to Cart
  const handleAddToCart = (product: Product) => {
    const defaultVariant = product.variants?.[0] || null;
    addItem(product, defaultVariant, 1);
    openCart();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#052a51]/75 backdrop-blur-sm flex flex-col justify-end md:justify-center md:items-center p-0 md:p-6 transition-all duration-300">
      {/* Click Outside / Backdrop Dismiss Layer */}
      <div className="fixed inset-0 -z-10" onClick={handleClose} />

      {/* ── ON-BRAND HALF-SCREEN BOTTOM-SHEET / CARD MODAL ── */}
      <div
        className="w-full md:max-w-[560px] max-h-[92vh] md:max-h-[85vh] bg-[#052a51] text-white rounded-t-[32px] md:rounded-3xl border-t md:border border-white/15 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Scan & Find Products"
      >
        {/* Drag Handle Indicator (Mobile only) */}
        <div className="w-12 h-1.5 bg-white/25 rounded-full mx-auto mt-2.5 mb-1 md:hidden" />

        {/* ── SHEET HEADER ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F26522] flex items-center justify-center text-white shadow-xs">
              <ScanLine size={17} strokeWidth={2.4} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#F26522]">
                  IntriHub Lens
                </span>
                <span className="text-white/30">•</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                  <Sparkles size={10} /> AI Vision
                </span>
              </div>
              <h3 className="text-sm md:text-base font-black text-white leading-tight">
                Scan & Find Products
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {hasTorchCapability && !scanResult && (
              <button
                onClick={toggleTorch}
                type="button"
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  isTorchOn ? "bg-[#F26522] text-white shadow-xs" : "bg-white/10 text-white/80 hover:text-white"
                }`}
                title="Toggle Flashlight"
                aria-label="Toggle Flashlight"
              >
                {isTorchOn ? <FlashlightOff size={16} /> : <Flashlight size={16} />}
              </button>
            )}

            {!scanResult && (
              <button
                onClick={toggleCameraFacing}
                type="button"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-transform active:rotate-180"
                title="Flip Camera"
                aria-label="Flip Camera"
              >
                <SwitchCamera size={16} />
              </button>
            )}

            <button
              onClick={handleClose}
              type="button"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer ml-1"
              aria-label="Close scanner"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── SCROLLABLE BODY (VIEWFINDER / RESULTS) ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-red-400" />
              <span className="flex-1 font-medium">{errorMessage}</span>
            </div>
          )}

          {/* ── CASE 1: SCANNER VIEWFINDER BOX (READY STATE) ── */}
          {!scanResult && (
            <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-black border border-white/15 shadow-inner flex items-center justify-center">
              {/* Hidden Canvas for Capture */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Live Camera Video */}
              {!capturedImagePreview && (
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="w-full h-full object-cover"
                />
              )}

              {/* Captured Image Preview */}
              {capturedImagePreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={capturedImagePreview}
                  alt="Scanned item"
                  className="w-full h-full object-cover"
                />
              )}

              {/* Camera Permission Denied Fallback */}
              {hasCameraPermission === false && !capturedImagePreview && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 text-center bg-[#052a51]/95 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-[#F26522]">
                    <Camera size={24} />
                  </div>
                  <div className="space-y-0.5 max-w-xs">
                    <p className="text-xs font-bold text-white">Camera Access Required</p>
                    <p className="text-[11px] text-white/70">
                      Allow camera access in your browser or select a photo from your gallery.
                    </p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                    className="px-4 py-2 rounded-xl bg-[#F26522] text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                  >
                    <Upload size={14} />
                    <span>Upload from Gallery</span>
                  </button>
                </div>
              )}

              {/* ── GEMINI-STYLE AI SCANNING LASER BEAM ANIMATION (WHEN PROCESSING) ── */}
              {isProcessing && (
                <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-2xs flex flex-col items-center justify-center pointer-events-none">
                  {/* Sweeping Laser Beam */}
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#F26522] to-transparent shadow-[0_0_20px_#F26522] animate-laser" />

                  {/* AI Status Badge */}
                  <div className="px-4 py-2 rounded-full bg-[#052a51]/90 border border-[#F26522]/50 shadow-xl flex items-center gap-2.5 backdrop-blur-md">
                    <RefreshCw size={14} className="text-[#F26522] animate-spin" />
                    <span className="text-xs font-bold text-white tracking-wide">
                      {rotatingStatusTexts[statusMessageIndex]}
                    </span>
                  </div>
                </div>
              )}

              {/* Viewfinder Target Reticle Frame */}
              {!isProcessing && !capturedImagePreview && (
                <div className="absolute inset-4 rounded-xl border border-white/20 pointer-events-none flex items-center justify-center">
                  {/* 4 Precision Corner Accents in Brand Orange */}
                  <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t-2 border-l-2 border-[#F26522] rounded-tl-md" />
                  <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t-2 border-r-2 border-[#F26522] rounded-tr-md" />
                  <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b-2 border-l-2 border-[#F26522] rounded-bl-md" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b-2 border-r-2 border-[#F26522] rounded-br-md" />

                  {/* Center Target Indicator */}
                  <div className="w-6 h-6 rounded-full border border-white/30 flex items-center justify-center opacity-60">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#F26522]" />
                  </div>

                  {/* Bottom Hint Pill */}
                  <div className="absolute bottom-2 inset-x-0 flex justify-center">
                    <span className="px-3 py-1 rounded-full bg-black/75 text-[10px] font-bold text-white/90 border border-white/10 backdrop-blur-md">
                      Align packaging label in frame
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── CASE 2: SCAN RESULTS READY ── */}
          {scanResult && (
            <div className="space-y-3.5 pt-1">
              {/* Header Status Row */}
              <div className="flex items-center justify-between">
                <div>
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
                  type="button"
                  className="text-xs text-white/80 hover:text-white flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl cursor-pointer transition-colors font-bold"
                >
                  <RefreshCw size={12} />
                  <span>Scan New</span>
                </button>
              </div>

              <p className="text-xs text-white/80 font-medium leading-relaxed">
                {scanResult.message}
              </p>

              {/* 1. EXACT HIGH CONFIDENCE MATCH CARD */}
              {scanResult.matched && scanResult.matchedProduct && (
                <div className="bg-white text-gray-900 rounded-2xl p-4 shadow-xl border border-white/20 space-y-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>In-Stock on IntriHub</span>
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
                        const priceInfo = getProductPriceInfo(
                          scanResult.matchedProduct!,
                          scanResult.matchedProduct!.variants?.[0]
                        );
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
                      type="button"
                      className="h-10 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform cursor-pointer"
                    >
                      <ShoppingBag size={14} />
                      <span>Add to Cart</span>
                    </button>

                    <Link
                      href={`/product/${scanResult.matchedProduct.slug}`}
                      onClick={() => stopCamera()}
                      className="h-10 rounded-xl bg-[#052a51] hover:bg-[#08386a] text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                    >
                      <span>View Product</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              )}

              {/* 2. POSSIBLE CANDIDATES LIST */}
              {scanResult.matched &&
                scanResult.confidenceTier === "medium" &&
                scanResult.possibleMatches &&
                scanResult.possibleMatches.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                      Possible Matching Products:
                    </h4>
                    <div className="space-y-2">
                      {scanResult.possibleMatches.map((item) => {
                        const priceInfo = getProductPriceInfo(item, item.variants?.[0]);
                        return (
                          <Link
                            key={item.id}
                            href={`/product/${item.slug}`}
                            onClick={() => stopCamera()}
                            className="bg-white text-gray-900 rounded-xl p-3 flex items-center gap-3 shadow-md hover:border-[#F26522] border border-transparent transition-all active:scale-[0.98]"
                          >
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
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
                            <div className="w-7 h-7 rounded-full bg-[#052a51] text-white flex items-center justify-center shrink-0">
                              <ArrowRight size={13} />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* 3. ALTERNATIVES LIST */}
              {scanResult.alternatives && scanResult.alternatives.length > 0 && (
                <div className="space-y-2 pt-1">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    In-Stock Options in {scanResult.extractedInfo?.categoryGuess || "Category"}:
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
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
                              type="button"
                              className="flex-1 py-1.5 bg-[#F26522] text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                            >
                              <ShoppingBag size={11} />
                              <span>Add</span>
                            </button>
                            <Link
                              href={`/product/${alt.slug}`}
                              onClick={() => stopCamera()}
                              className="px-2 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-bold flex items-center justify-center"
                            >
                              <ArrowRight size={11} />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* WhatsApp Custom Sourcing Button */}
                  <a
                    href={`https://wa.me/919264920211?text=Hi%20IntriHub,%20I%20scanned%20${encodeURIComponent(
                      scanResult.extractedInfo?.detectedBrand || "a product"
                    )}%20and%20need%20help%20sourcing%20it.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => stopCamera()}
                    className="w-full h-10 rounded-xl bg-[#1E9E6B] hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors mt-2"
                  >
                    <MessageCircle size={15} />
                    <span>Enquire on WhatsApp for Custom Sourcing</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── SHEET BOTTOM CONTROLS (SIMPLIFIED TO 2 MAIN ACTIONS) ── */}
        {!scanResult && (
          <div className="px-5 pt-3 pb-6 border-t border-white/10 bg-[#04203f] space-y-3 shrink-0">
            {/* Hidden File Input for Gallery Selection */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Exactly 2 Clean Primary Actions: [ Upload Photo ] & [ Scan / Shutter ] */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Action 1: Upload from Gallery */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="h-12 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Upload size={16} className="text-[#F26522]" />
                <span>Upload Photo</span>
              </button>

              {/* Action 2: Scan Camera Shutter */}
              <button
                type="button"
                onClick={handleCaptureFrame}
                disabled={isProcessing || hasCameraPermission === false}
                className="h-12 rounded-2xl bg-gradient-to-r from-[#F26522] to-[#d95a1e] hover:from-[#d95a1e] hover:to-[#c44e18] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Camera size={16} />
                <span>Scan Product</span>
              </button>
            </div>

            {/* Manual Query Fallback Search Bar */}
            <form onSubmit={handleManualSearch} className="flex gap-2 pt-0.5">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Or type brand / grade (e.g. Roff T01)..."
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  className="w-full h-9 pl-8 pr-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs placeholder:text-white/40 focus:outline-hidden focus:border-[#F26522]"
                />
              </div>
              <button
                type="submit"
                disabled={!manualQuery.trim() || isProcessing}
                className="px-3.5 h-9 rounded-xl bg-white/15 hover:bg-[#F26522] text-white text-xs font-bold transition-colors disabled:opacity-30 cursor-pointer shrink-0"
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
