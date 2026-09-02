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
  MessageCircle,
  ScanLine,
  Image as ImageIcon,
  ArrowLeft,
  Search,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { useScanStore } from "@/lib/scan-store";
import { useCartStore } from "@/lib/cart-store";
import { getProductPriceInfo } from "@/lib/formatters";
import type { Product } from "@/lib/data/products";
import type { ScanMatchResult } from "@/lib/lens/catalog-matcher";

type ScannerMode = "choice" | "camera" | "upload";

export default function ScanModal() {
  const router = useRouter();
  const { isOpen, closeScan } = useScanStore();
  const { addItem, openCart } = useCartStore();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Mode & UI States
  const [mode, setMode] = useState<ScannerMode>("choice");
  const [isDragOver, setIsDragOver] = useState(false);

  // Camera States
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorchCapability, setHasTorchCapability] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);

  // Processing & Match States
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImagePreview, setCapturedImagePreview] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanMatchResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessageIndex, setStatusMessageIndex] = useState(0);

  const rotatingStatusTexts = [
    "Reading packaging label...",
    "Extracting brand & specifications...",
    "Matching IntriHub wholesale catalog...",
    "Finding verified in-stock materials...",
  ];

  // Rotate AI status texts during processing
  useEffect(() => {
    if (!isProcessing) {
      setStatusMessageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setStatusMessageIndex((prev) => (prev + 1) % rotatingStatusTexts.length);
    }, 1100);
    return () => clearInterval(interval);
  }, [isProcessing, rotatingStatusTexts.length]);

  // 1. Explicit Stop Function for Camera Hardware & Media Tracks
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

    setIsTorchOn(false);
    setHasTorchCapability(false);
    setCameraLoading(false);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // 2. Initialize Camera (Only when explicitly in camera mode)
  const startCamera = useCallback(async (modeFacing: "environment" | "user") => {
    stopCamera();
    setCameraLoading(true);
    setErrorMessage(null);

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        if (isMountedRef.current) {
          setHasCameraPermission(false);
          setCameraLoading(false);
          setErrorMessage("Camera access is not supported by this browser.");
        }
        return;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: modeFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!isMountedRef.current || !useScanStore.getState().isOpen) {
        mediaStream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {
            console.warn("Error stopping track:", e);
          }
        });
        return;
      }

      streamRef.current = mediaStream;
      setHasCameraPermission(true);
      setCameraLoading(false);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch((err) => {
          console.warn("Video play interrupted:", err);
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
        setCameraLoading(false);
        setErrorMessage("Camera access was denied or unavailable. You can upload a photo instead.");
      }
    }
  }, [stopCamera]);

  // 3. Modal Open/Close Lifecycle
  useEffect(() => {
    isMountedRef.current = true;

    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Start in choice mode so camera is not auto-started
      setMode("choice");
      setScanResult(null);
      setCapturedImagePreview(null);
      setErrorMessage(null);
    } else {
      document.body.style.overflow = "";
      stopCamera();
      setMode("choice");
      setScanResult(null);
      setCapturedImagePreview(null);
      setErrorMessage(null);
    }

    return () => {
      document.body.style.overflow = "";
      stopCamera();
    };
  }, [isOpen, stopCamera]);

  // 4. Mode change effect: start camera only when mode === "camera"
  useEffect(() => {
    if (isOpen && mode === "camera" && !capturedImagePreview && !scanResult) {
      startCamera(facingMode);
    } else if (mode !== "camera") {
      stopCamera();
    }
  }, [isOpen, mode, facingMode, capturedImagePreview, scanResult, startCamera, stopCamera]);

  // 5. Visibility / Window change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopCamera();
      } else if (
        document.visibilityState === "visible" &&
        isOpen &&
        mode === "camera" &&
        !capturedImagePreview &&
        !scanResult
      ) {
        startCamera(facingMode);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isOpen, mode, facingMode, capturedImagePreview, scanResult, startCamera, stopCamera]);

  // 6. Toggle Torch
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
      console.warn("Torch toggle not supported", e);
    }
  };

  // 7. Flip Camera
  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // 8. Close Modal
  const handleClose = () => {
    stopCamera();
    closeScan();
  };

  // 9. Core Scan Request
  const processScanPayload = async (payload: { image?: string; text?: string }) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errText = "Failed to analyze image";
        try {
          const errJson = await res.json();
          errText = errJson.message || errText;
        } catch {}
        setErrorMessage(errText);
      }

      const data: ScanMatchResult = await res.json();
      setScanResult(data);
    } catch (err: any) {
      console.error("[ScanModal] Error during scan request:", err);
      setErrorMessage("Could not connect to scan engine. Please check your connection and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 10. Capture Frame from Live Camera
  const handleCaptureFrame = async () => {
    if (!videoRef.current || isProcessing) return;

    const video = videoRef.current;

    // Guard against empty / uninitialized video metadata
    if (video.videoWidth <= 0 || video.videoHeight <= 0 || video.readyState < 2) {
      setErrorMessage("Camera feed is still initializing. Please wait a second and try again.");
      return;
    }

    try {
      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setErrorMessage("Could not capture image from camera.");
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.90);

      stopCamera();
      setCapturedImagePreview(dataUrl);
      await processScanPayload({ image: dataUrl });
    } catch (err) {
      console.error("[ScanModal] Capture frame error:", err);
      setErrorMessage("Failed to capture image. Please try uploading a photo.");
    }
  };

  // 11. File Upload Handler (with instant value reset for re-selecting same file)
  const handleProcessFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (JPEG, PNG, WEBP).");
      return;
    }

    stopCamera();

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setCapturedImagePreview(dataUrl);
      await processScanPayload({ image: dataUrl });
    };
    reader.onerror = () => {
      setErrorMessage("Failed to read image file. Please try another.");
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // CRITICAL: Reset input value immediately so the same file can be re-selected if needed
    e.target.value = "";
    if (file) {
      handleProcessFile(file);
    }
  };

  // 12. Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  // 13. Reset to Scan Again
  const handleResetScan = () => {
    setScanResult(null);
    setCapturedImagePreview(null);
    setErrorMessage(null);
    setMode("choice");
  };

  // 14. Quick Add to Cart
  const handleAddToCart = (product: Product) => {
    const defaultVariant = product.variants?.[0] || null;
    addItem(product, defaultVariant, 1);
    openCart();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end md:justify-center md:items-center p-0 md:p-6 transition-all duration-300 animate-in fade-in">
      {/* ── SEMI-TRANSPARENT BACKDROP ── */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[3px] transition-opacity"
        onClick={handleClose}
      />

      {/* ── ON-BRAND MODAL CARD / SHEET ── */}
      <div
        className="relative z-10 w-full md:max-w-[560px] max-h-[94vh] md:max-h-[88vh] bg-white text-gray-900 rounded-t-[32px] md:rounded-3xl border-t md:border border-gray-200 shadow-[0_-12px_48px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Scan & Find Products"
      >
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-2.5 mb-1 md:hidden" />

        {/* ── SHEET HEADER ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            {mode !== "choice" && !scanResult ? (
              <button
                onClick={() => {
                  stopCamera();
                  setMode("choice");
                  setErrorMessage(null);
                }}
                type="button"
                className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors mr-0.5 cursor-pointer"
                title="Back to options"
                aria-label="Back to options"
              >
                <ArrowLeft size={16} />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-[#F26522] shadow-2xs">
                <ScanLine size={17} strokeWidth={2.4} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#F26522]">
                  INTRIHUB LENS
                </span>
              </div>
              <h3 className="text-sm md:text-base font-black text-[#052a51] leading-tight">
                Scan & Find Products
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Camera Specific Controls */}
            {mode === "camera" && !scanResult && (
              <>
                {hasTorchCapability && (
                  <button
                    onClick={toggleTorch}
                    type="button"
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      isTorchOn
                        ? "bg-[#F26522] text-white shadow-xs"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                    title="Toggle Flashlight"
                    aria-label="Toggle Flashlight"
                  >
                    {isTorchOn ? <FlashlightOff size={16} /> : <Flashlight size={16} />}
                  </button>
                )}

                <button
                  onClick={toggleCameraFacing}
                  type="button"
                  className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-transform active:rotate-180"
                  title="Flip Camera"
                  aria-label="Flip Camera"
                >
                  <SwitchCamera size={16} />
                </button>
              </>
            )}

            <button
              onClick={handleClose}
              type="button"
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors cursor-pointer ml-1"
              aria-label="Close scanner"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── MODE SWITCHER TABS (WHEN NOT SHOWING RESULTS) ── */}
        {!scanResult && mode !== "choice" && (
          <div className="px-5 pt-3 pb-1 bg-white flex gap-2 border-b border-gray-100 shrink-0">
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setMode("camera");
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === "camera"
                  ? "bg-[#052a51] text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Camera size={14} />
              <span>Camera Scan</span>
            </button>

            <button
              type="button"
              onClick={() => {
                stopCamera();
                setErrorMessage(null);
                setMode("upload");
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === "upload"
                  ? "bg-[#052a51] text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Upload size={14} />
              <span>Upload Photo</span>
            </button>
          </div>
        )}

        {/* ── SCROLLABLE MODAL BODY ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-gray-50/60">
          {/* Hidden Canvas & File Input */}
          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 shadow-2xs">
              <AlertCircle size={17} className="shrink-0 text-red-500" />
              <span className="flex-1 font-medium">{errorMessage}</span>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 1: CHOICE SCREEN (INITIAL LANDING)
             ══════════════════════════════════════════════════════════════ */}
          {!scanResult && mode === "choice" && (
            <div className="space-y-4 py-2">
              <div className="text-center space-y-1 max-w-sm mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-[#F26522] text-[11px] font-bold mb-1">
                  <Sparkles size={13} />
                  <span>AI Visual Product Search</span>
                </div>
                <h4 className="text-base font-black text-[#052a51]">
                  How would you like to search?
                </h4>
                <p className="text-xs text-gray-500">
                  Point your camera at any packaging label or upload a photo from your gallery.
                </p>
              </div>

              {/* 2 Primary Choice Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Option 1: Live Camera Scan */}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setMode("camera");
                  }}
                  className="group relative p-5 rounded-2xl bg-white border-2 border-orange-200 hover:border-[#F26522] shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between gap-4 cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F26522] to-[#ff7a38] text-white flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-110 transition-transform">
                      <Camera size={24} />
                    </div>
                    <span className="text-[10px] font-bold text-[#F26522] bg-orange-50 px-2 py-0.5 rounded-full uppercase">
                      Live
                    </span>
                  </div>

                  <div>
                    <h5 className="text-sm font-black text-[#052a51] group-hover:text-[#F26522] transition-colors">
                      Scan with Camera
                    </h5>
                    <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                      Aim live camera at product packaging or brand logo
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-[#F26522]">
                    <span>Start Camera</span>
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* Option 2: Upload Photo */}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setMode("upload");
                  }}
                  className="group relative p-5 rounded-2xl bg-white border-2 border-gray-200 hover:border-[#052a51] shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between gap-4 cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-[#052a51] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Upload size={22} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase">
                      Gallery
                    </span>
                  </div>

                  <div>
                    <h5 className="text-sm font-black text-[#052a51] group-hover:text-[#052a51] transition-colors">
                      Upload Photo
                    </h5>
                    <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                      Choose or drag a photo from your phone or computer
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-[#052a51]">
                    <span>Choose File</span>
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>

              {/* Supported Materials Pill */}
              <div className="p-3 rounded-2xl bg-white border border-gray-200 flex items-center justify-between text-[11px] text-gray-600">
                <span className="font-semibold text-gray-700">Works best with:</span>
                <span className="text-gray-500 font-medium">Tiles • Cement • Paint • Adhesives • Pipes</span>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 2: LIVE CAMERA SCANNER
             ══════════════════════════════════════════════════════════════ */}
          {!scanResult && mode === "camera" && (
            <div className="space-y-3">
              {/* Viewfinder Frame */}
              <div className="relative p-[2.5px] rounded-2xl overflow-hidden shadow-md aspect-4/3 w-full bg-slate-900">
                {/* Animated multi-color flowing border */}
                <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,#F26522_0%,#052a51_30%,#38bdf8_50%,#F26522_75%,#052a51_100%)] animate-border-flow pointer-events-none" />

                <div
                  className="relative w-full h-full rounded-[13px] bg-black overflow-hidden flex items-center justify-center cursor-pointer"
                  onClick={() => {
                    if (!isProcessing && !capturedImagePreview) {
                      handleCaptureFrame();
                    }
                  }}
                  title="Click anywhere on viewfinder to capture"
                >
                  {/* Live Video Feed */}
                  {!capturedImagePreview && (
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Captured Freeze-Frame Preview */}
                  {capturedImagePreview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={capturedImagePreview}
                      alt="Captured packaging"
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Camera Loading Spinner */}
                  {cameraLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#052a51] text-white gap-2">
                      <RefreshCw size={24} className="animate-spin text-[#F26522]" />
                      <span className="text-xs font-bold">Starting camera hardware...</span>
                    </div>
                  )}

                  {/* Permission Denied Fallback */}
                  {hasCameraPermission === false && !capturedImagePreview && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 text-center bg-[#052a51] text-white space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-[#F26522]">
                        <Camera size={24} />
                      </div>
                      <div className="space-y-0.5 max-w-xs">
                        <p className="text-xs font-bold text-white">Camera Access Required</p>
                        <p className="text-[11px] text-white/70">
                          Please allow camera access in your browser or select a photo from your gallery.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          stopCamera();
                          setMode("upload");
                        }}
                        type="button"
                        className="px-4 py-2 rounded-xl bg-[#F26522] text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                      >
                        <Upload size={14} />
                        <span>Switch to Upload Photo</span>
                      </button>
                    </div>
                  )}

                  {/* Laser Scan Animation (While Processing) */}
                  {isProcessing && (
                    <div className="absolute inset-0 z-30 bg-black/50 backdrop-blur-2xs flex flex-col items-center justify-center pointer-events-none">
                      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#F26522] to-transparent shadow-[0_0_24px_#F26522] animate-laser" />
                      <div className="px-4 py-2 rounded-full bg-[#052a51]/95 border border-[#F26522]/50 shadow-xl flex items-center gap-2.5 backdrop-blur-md">
                        <RefreshCw size={14} className="text-[#F26522] animate-spin" />
                        <span className="text-xs font-bold text-white tracking-wide">
                          {rotatingStatusTexts[statusMessageIndex]}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Viewfinder Reticle & Tap Hint */}
                  {!isProcessing && !capturedImagePreview && !cameraLoading && (
                    <div className="absolute inset-4 rounded-xl border border-white/20 pointer-events-none flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full border border-white/40 flex items-center justify-center opacity-80">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#F26522]" />
                      </div>

                      <div className="absolute bottom-2 inset-x-0 flex justify-center">
                        <span className="px-3 py-1 rounded-full bg-black/75 text-[10px] font-bold text-white/90 border border-white/10 backdrop-blur-md">
                          Align label & tap shutter to capture
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Shutter Capture Button */}
              {!isProcessing && (
                <div className="flex flex-col items-center justify-center pt-1 gap-1.5">
                  <button
                    type="button"
                    onClick={handleCaptureFrame}
                    disabled={isProcessing || cameraLoading || hasCameraPermission === false}
                    className="w-16 h-16 rounded-full bg-white border-4 border-[#F26522] p-1 shadow-lg hover:shadow-orange-500/40 active:scale-90 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                    aria-label="Capture photo for scanning"
                  >
                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#F26522] to-[#ea580c] flex items-center justify-center text-white">
                      <Camera size={22} />
                    </div>
                  </button>
                  <span className="text-[11px] font-bold text-gray-600">
                    Tap to Capture & Scan
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 3: UPLOAD PHOTO / DROP ZONE
             ══════════════════════════════════════════════════════════════ */}
          {!scanResult && mode === "upload" && (
            <div className="space-y-4">
              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-3 ${
                  isDragOver
                    ? "border-[#F26522] bg-orange-50/60 scale-[0.99]"
                    : "border-gray-300 hover:border-[#F26522] bg-white hover:bg-orange-50/20"
                }`}
              >
                {/* Preview while processing upload */}
                {capturedImagePreview && isProcessing ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={capturedImagePreview}
                      alt="Uploading image"
                      className="w-full h-full object-cover opacity-70"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40">
                      <RefreshCw size={24} className="text-[#F26522] animate-spin" />
                      <span className="text-xs font-bold text-white">
                        {rotatingStatusTexts[statusMessageIndex]}
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200/80 text-[#F26522] flex items-center justify-center shadow-xs">
                      <Upload size={28} />
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-[#052a51]">
                        Select or drop product photo here
                      </h4>
                      <p className="text-xs text-gray-500 max-w-xs mx-auto">
                        Supports packaging bags, paint buckets, adhesive labels, pipes, or spec sheets.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-5 py-2.5 rounded-xl bg-[#052a51] hover:bg-[#08386a] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                    >
                      <ImageIcon size={14} />
                      <span>Browse Gallery / Files</span>
                    </button>
                  </>
                )}
              </div>

              {/* Camera Switch Pill */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setMode("camera");
                  }}
                  className="text-xs text-[#F26522] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Camera size={13} />
                  <span>Prefer live camera instead? Switch to Camera Scan</span>
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 4: SCAN RESULTS
             ══════════════════════════════════════════════════════════════ */}
          {scanResult && (
            <div className="space-y-4 pt-1">
              {/* Header Status Bar with Scanned Image Thumbnail */}
              <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  {capturedImagePreview && (
                    <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={capturedImagePreview}
                        alt="Scanned thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="min-w-0">
                    {scanResult.matched ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                        <CheckCircle2 size={12} />
                        <span>
                          Match Found ({Math.round(scanResult.confidence * 100)}%)
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
                        <AlertCircle size={12} />
                        <span>Item Not Listed</span>
                      </span>
                    )}
                    <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                      {scanResult.extractedInfo?.detectedBrand
                        ? `Detected: ${scanResult.extractedInfo.detectedBrand}`
                        : "Visual Scan Analysis"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleResetScan}
                  type="button"
                  className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <RefreshCw size={12} className="text-[#F26522]" />
                  <span>Scan New</span>
                </button>
              </div>

              {/* ── CASE 4A: EXACT HIGH-CONFIDENCE MATCH ── */}
              {scanResult.matched && scanResult.matchedProduct && (
                <div className="bg-white text-gray-900 rounded-2xl p-4 shadow-md border border-gray-200 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      <span>Verified In-Stock on IntriHub</span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Wholesale Price
                    </span>
                  </div>

                  <div className="flex gap-3.5">
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
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
                            <span className="text-lg font-black text-[#052a51]">
                              {priceInfo.formattedPrice}
                            </span>
                            {priceInfo.unitSuffix && (
                              <span className="text-xs font-semibold text-gray-500">
                                /{priceInfo.unitSuffix}
                              </span>
                            )}
                            {priceInfo.discountPercent > 0 && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
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
                      className="h-11 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 active:scale-95 transition-transform cursor-pointer"
                    >
                      <ShoppingBag size={15} />
                      <span>Add to Cart</span>
                    </button>

                    <Link
                      href={`/product/${scanResult.matchedProduct.slug}`}
                      onClick={handleClose}
                      className="h-11 rounded-xl bg-[#052a51] hover:bg-[#08386a] text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                    >
                      <span>View Product</span>
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              )}

              {/* ── CASE 4B: MEDIUM CONFIDENCE MULTIPLE CANDIDATES ── */}
              {scanResult.matched &&
                scanResult.confidenceTier === "medium" &&
                scanResult.possibleMatches &&
                scanResult.possibleMatches.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <h4 className="text-xs font-bold text-[#052a51] uppercase tracking-wider">
                      Possible Matching Products:
                    </h4>
                    <div className="space-y-2">
                      {scanResult.possibleMatches.map((item) => {
                        const priceInfo = getProductPriceInfo(item, item.variants?.[0]);
                        return (
                          <Link
                            key={item.id}
                            href={`/product/${item.slug}`}
                            onClick={handleClose}
                            className="bg-white text-gray-900 rounded-xl p-3 flex items-center gap-3 shadow-xs hover:border-[#F26522] border border-gray-200 transition-all active:scale-[0.98]"
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

              {/* ── CASE 4C: ITEM NOT AVAILABLE / UNMATCHED FALLBACK (PRD SECTION 3, STEP 7) ── */}
              {!scanResult.matched && (
                <div className="space-y-3.5">
                  {/* Informative Notice Card */}
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xs shrink-0">
                        !
                      </div>
                      <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide">
                        This item isn&apos;t listed on IntriHub yet
                      </h4>
                    </div>
                    <p className="text-xs text-amber-800/90 leading-relaxed pl-9">
                      {scanResult.message ||
                        "We couldn't find an exact catalog match for this item. Check out verified in-stock alternatives below or request custom procurement:"}
                    </p>
                  </div>

                  {/* Category In-Stock Recommendations Grid */}
                  {scanResult.alternatives && scanResult.alternatives.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#052a51] uppercase tracking-wider">
                          In-Stock Alternatives in Category:
                        </h4>
                        <span className="text-[10px] font-bold text-gray-500">
                          {scanResult.extractedInfo?.categoryGuess || "Building Materials"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        {scanResult.alternatives.slice(0, 4).map((alt) => {
                          const priceInfo = getProductPriceInfo(alt, alt.variants?.[0]);
                          return (
                            <div
                              key={alt.id}
                              className="bg-white text-gray-900 rounded-xl p-2.5 flex flex-col justify-between shadow-xs border border-gray-200 hover:border-gray-300 transition-all"
                            >
                              <div className="space-y-1.5">
                                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
                                  <Image
                                    src={alt.images?.[0] || "/placeholders/product.svg"}
                                    alt={alt.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <span className="text-[9px] font-bold text-[#F26522] uppercase tracking-wider block">
                                  {alt.brand || "IntriHub"}
                                </span>
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

                              <div className="pt-2 flex gap-1.5">
                                <button
                                  onClick={() => handleAddToCart(alt)}
                                  type="button"
                                  className="flex-1 py-1.5 bg-[#F26522] hover:bg-[#d95a1e] text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 active:scale-95 cursor-pointer transition-colors"
                                >
                                  <ShoppingBag size={11} />
                                  <span>Add</span>
                                </button>
                                <Link
                                  href={`/product/${alt.slug}`}
                                  onClick={handleClose}
                                  className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-bold flex items-center justify-center transition-colors"
                                >
                                  <ArrowRight size={11} />
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* WhatsApp Custom Sourcing Button */}
                  <a
                    href={`https://wa.me/919264920211?text=Hi%20IntriHub,%20I%20scanned%20${encodeURIComponent(
                      scanResult.extractedInfo?.detectedBrand || "a product"
                    )}%20and%20would%20like%20help%20sourcing%20it.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleClose}
                    className="w-full h-12 rounded-2xl bg-[#1E9E6B] hover:bg-[#168a5c] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors mt-2"
                  >
                    <MessageCircle size={16} />
                    <span>Can&apos;t find it? Ask us on WhatsApp for Custom Sourcing</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── FOOTER ACTIONS (ONLY ON ACTIVE CAMERA / UPLOAD VIEWS) ── */}
        {!scanResult && mode !== "choice" && (
          <div
            className="px-5 py-3 border-t border-gray-100 bg-white shrink-0 flex items-center justify-between gap-3"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))" }}
          >
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setMode("choice");
              }}
              className="text-xs text-gray-600 hover:text-gray-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>Back</span>
            </button>

            {mode === "camera" ? (
              <button
                type="button"
                onClick={handleCaptureFrame}
                disabled={isProcessing || cameraLoading || hasCameraPermission === false}
                className="h-10 px-5 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] text-white font-bold text-xs flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Camera size={15} />
                <span>Capture & Scan</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="h-10 px-5 rounded-xl bg-[#052a51] hover:bg-[#08386a] text-white font-bold text-xs flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Upload size={15} />
                <span>Select Photo</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
