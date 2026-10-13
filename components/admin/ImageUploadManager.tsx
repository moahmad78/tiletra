"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  X,
  Star,
  Link as LinkIcon,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  Trash2,
  Check,
  Plus,
  Shield,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface ImageUploadManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
  onUploadingChange?: (isUploading: boolean) => void;
  vendorId?: string | null;
  defaultWatermark?: boolean;
}

export default function ImageUploadManager({
  images,
  onChange,
  onUploadingChange,
  vendorId,
  defaultWatermark = true,
}: ImageUploadManagerProps) {
  // Modes for Primary and Gallery
  const [primaryMode, setPrimaryMode] = useState<"upload" | "link">("upload");
  const [primaryUrlInput, setPrimaryUrlInput] = useState("");
  const [galleryMode, setGalleryMode] = useState<"upload" | "link">("upload");
  const [galleryUrlInput, setGalleryUrlInput] = useState("");

  // Watermark Settings (Default ON for trademark anti-theft protection)
  const [applyWatermark, setApplyWatermark] = useState<boolean>(defaultWatermark);
  const [isWatermarking, setIsWatermarking] = useState<boolean>(false);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDraggingPrimary, setIsDraggingPrimary] = useState(false);
  const [isDraggingGallery, setIsDraggingGallery] = useState(false);

  const primaryFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  const setUploadingState = (uploading: boolean) => {
    setIsUploading(uploading);
    onUploadingChange?.(uploading);
  };

  const isValidUrl = (url: string) => {
    try {
      if (url.startsWith("/")) return true; // Local path
      if (url.startsWith("data:image")) return true; // Base64 image
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  // Extract clean primary & gallery images
  const cleanImages = images.filter((img) => img && img.trim() && img !== "/placeholders/product.svg");
  const primaryImage = cleanImages.length > 0 ? cleanImages[0] : null;
  const galleryImages = cleanImages.length > 1 ? cleanImages.slice(1) : [];

  // ── Primary Image Actions ──
  const handleSetPrimaryUrl = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const cleanUrl = primaryUrlInput.trim();
    if (!cleanUrl) {
      toast.error("Please enter a valid image link");
      return;
    }
    if (!isValidUrl(cleanUrl)) {
      toast.error("Invalid URL. Please enter an http:// or https:// image link");
      return;
    }

    const currentGallery = galleryImages;
    onChange([cleanUrl, ...currentGallery]);
    setPrimaryUrlInput("");
    setUploadError(null);
    toast.success("Primary cover image set!");
  };

  const handleRemovePrimary = () => {
    if (galleryImages.length > 0) {
      onChange(galleryImages);
      toast.info("First gallery image promoted to primary cover photo.");
    } else {
      onChange([]);
      toast.info("Primary image removed.");
    }
  };

  // ── Gallery Images Actions ──
  const handleAddGalleryUrl = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const cleanUrl = galleryUrlInput.trim();
    if (!cleanUrl) {
      toast.error("Please enter a valid image link");
      return;
    }
    if (!isValidUrl(cleanUrl)) {
      toast.error("Invalid URL. Please enter an http:// or https:// image link");
      return;
    }
    if (cleanImages.includes(cleanUrl)) {
      toast.error("This image link is already added");
      return;
    }

    if (!primaryImage) {
      onChange([cleanUrl]);
      toast.success("Set as Primary cover image!");
    } else {
      onChange([primaryImage, ...galleryImages, cleanUrl]);
      toast.success("Added to gallery images!");
    }
    setGalleryUrlInput("");
    setUploadError(null);
  };

  const handleRemoveGallery = (galleryIdx: number) => {
    const updatedGallery = galleryImages.filter((_, i) => i !== galleryIdx);
    if (primaryImage) {
      onChange([primaryImage, ...updatedGallery]);
    } else {
      onChange(updatedGallery);
    }
    toast.info("Gallery photo removed.");
  };

  const handlePromoteToPrimary = (galleryIdx: number) => {
    const selected = galleryImages[galleryIdx];
    const restGallery = galleryImages.filter((_, i) => i !== galleryIdx);
    const newGallery = primaryImage ? [primaryImage, ...restGallery] : restGallery;
    onChange([selected, ...newGallery]);
    toast.success("Promoted to primary cover photo!");
  };

  // ── Resilient File Upload Handler ──
  const uploadFiles = async (files: FileList | File[], target: "primary" | "gallery" = "gallery") => {
    if (!files || files.length === 0) return;

    setUploadingState(true);
    setUploadError(null);

    const formData = new FormData();
    if (vendorId) {
      formData.append("vendorId", vendorId);
    }
    formData.append("applyWatermark", applyWatermark ? "true" : "false");
    for (let i = 0; i < files.length; i++) {
      formData.append("file", files[i]);
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const contentType = res.headers.get("content-type") || "";
      if (res.ok && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success && Array.isArray(data.urls) && data.urls.length > 0) {
          if (target === "primary") {
            const newPrimary = data.urls[0];
            const extra = data.urls.slice(1);
            onChange([newPrimary, ...galleryImages, ...extra]);
            toast.success("Primary cover image uploaded!");
          } else {
            if (!primaryImage) {
              onChange(data.urls);
            } else {
              onChange([primaryImage, ...galleryImages, ...data.urls]);
            }
            toast.success(`Uploaded ${data.urls.length} gallery photo(s)!`);
          }
          return;
        } else if (data.error) {
          throw new Error(data.error);
        }
      }

      // If server returned non-OK or HTML error, fallback to local Base64 reading so user is never blocked
      console.warn(`[Upload] Server returned status ${res.status}. Falling back to client-side encoding.`);
      const dataUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        dataUrls.push(dataUrl);
      }

      if (target === "primary") {
        const newPrimary = dataUrls[0];
        const extra = dataUrls.slice(1);
        onChange([newPrimary, ...galleryImages, ...extra]);
        toast.success("Primary photo loaded!");
      } else {
        if (!primaryImage) {
          onChange(dataUrls);
        } else {
          onChange([primaryImage, ...galleryImages, ...dataUrls]);
        }
        toast.success(`Loaded ${dataUrls.length} gallery photo(s)!`);
      }
    } catch (err: any) {
      console.warn("Upload fallback triggered:", err);
      try {
        const dataUrls: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          dataUrls.push(dataUrl);
        }
        if (target === "primary") {
          const newPrimary = dataUrls[0];
          const extra = dataUrls.slice(1);
          onChange([newPrimary, ...galleryImages, ...extra]);
          toast.success("Primary photo loaded!");
        } else {
          if (!primaryImage) {
            onChange(dataUrls);
          } else {
            onChange([primaryImage, ...galleryImages, ...dataUrls]);
          }
          toast.success(`Loaded ${dataUrls.length} gallery photo(s)!`);
        }
      } catch (fallbackErr: any) {
        const errMsg = "Upload failed: " + (fallbackErr?.message || "Check file");
        setUploadError(errMsg);
        toast.error(errMsg);
      }
    } finally {
      setUploadingState(false);
      if (primaryFileInputRef.current) primaryFileInputRef.current.value = "";
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = "";
    }
  };

  // ── Client-Side Canvas Watermark Engine ──
  const applyWatermarkToDataUrl = async (imgSrc: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const logo = new Image();
        logo.crossOrigin = "anonymous";
        logo.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(imgSrc);
            return;
          }
          // Draw original image
          ctx.drawImage(img, 0, 0);

          // Calculate watermark dimensions (28% of image width, maintain logo aspect ratio)
          const targetW = Math.max(120, Math.min(480, Math.round(img.width * 0.28)));
          const targetH = Math.round(targetW * (logo.height / logo.width));
          const padding = Math.max(16, Math.round(img.width * 0.03));
          const x = img.width - targetW - padding;
          const y = img.height - targetH - padding;

          ctx.globalAlpha = 0.65;
          ctx.drawImage(logo, x, y, targetW, targetH);
          ctx.globalAlpha = 1.0;

          resolve(canvas.toDataURL("image/webp", 0.88));
        };
        logo.onerror = () => resolve(imgSrc);
        logo.src = "/logo/intri-web-logo.png";
      };
      img.onerror = () => resolve(imgSrc);
      img.src = imgSrc;
    });
  };

  const handleApplyWatermarkToExisting = async () => {
    if (cleanImages.length === 0) return;
    setIsWatermarking(true);
    try {
      const watermarkedList: string[] = [];
      for (const src of cleanImages) {
        const res = await applyWatermarkToDataUrl(src);
        watermarkedList.push(res);
      }
      onChange(watermarkedList);
      toast.success(`Official IntriHub logo watermark applied to ${watermarkedList.length} image(s)!`);
    } catch (err) {
      console.error("Watermark error:", err);
      toast.error("Failed to apply watermark to some images.");
    } finally {
      setIsWatermarking(false);
    }
  };

  // Add paste event listener to support Ctrl+V anywhere in this component
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      if (e.clipboardData && e.clipboardData.files.length > 0) {
        e.preventDefault();
        uploadFiles(e.clipboardData.files, primaryImage ? "gallery" : "primary");
        return;
      }

      const text = e.clipboardData?.getData("text")?.trim();
      if (text && isValidUrl(text)) {
        e.preventDefault();
        if (!primaryImage) {
          onChange([text, ...galleryImages]);
          toast.success("Pasted as Primary cover photo!");
        } else {
          onChange([primaryImage, ...galleryImages, text]);
          toast.success("Pasted as Gallery photo!");
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [images, primaryImage, galleryImages]);

  return (
    <div className="space-y-6">
      {isUploading && (
        <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-2xl flex items-center gap-3 text-xs font-bold text-[#F26522] animate-pulse">
          <Loader2 className="animate-spin shrink-0" size={16} />
          <span>Uploading and processing images... Please wait.</span>
        </div>
      )}

      {uploadError && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="shrink-0 text-red-600" size={16} />
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-red-500 hover:text-red-800 text-xs underline cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── INTRIHUB LOGO WATERMARK PROTECTION CONTROL BAR ── */}
      <div className="p-4 sm:p-4.5 rounded-3xl border transition-all bg-gradient-to-r from-orange-50/70 via-amber-50/40 to-slate-50 border-orange-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F26522]/10 text-[#F26522] border border-orange-200 flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-[#052a51] tracking-wide">
                IntriHub Trademark Watermark Protection
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  applyWatermark
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-gray-100 text-gray-600 border border-gray-200"
                }`}
              >
                {applyWatermark ? "🛡️ WATERMARK ON" : "OFF"}
              </span>
            </div>
            <p className="text-[11px] text-gray-600 mt-0.5">
              Automatically stamps the official IntriHub logo watermark on uploaded product photos to prevent competitors &amp; unauthorized buyers from copying your listing images.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          {cleanImages.length > 0 && applyWatermark && (
            <button
              type="button"
              onClick={handleApplyWatermarkToExisting}
              disabled={isWatermarking}
              className="px-3 py-1.5 rounded-xl border border-orange-300 bg-white hover:bg-orange-50 text-[#F26522] text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
              title="Apply watermark immediately to all current images"
            >
              {isWatermarking ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              <span>Watermark Current Photos</span>
            </button>
          )}

          {/* Toggle Switch */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-500 hidden sm:inline">
              {applyWatermark ? "Enabled" : "Disabled"}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={applyWatermark}
              onClick={() => {
                const nextState = !applyWatermark;
                setApplyWatermark(nextState);
                if (nextState) {
                  toast.success("IntriHub watermark enabled: all new uploads will have official branding.");
                } else {
                  toast.info("IntriHub watermark disabled.");
                }
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                applyWatermark ? "bg-[#F26522]" : "bg-gray-300"
              }`}
              title="Toggle watermark ON or OFF"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  applyWatermark ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── 1. PRIMARY COVER IMAGE SECTION ── */}
        <div className="lg:col-span-5 flex flex-col space-y-3 bg-white p-4.5 rounded-3xl border-2 border-orange-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-gray-900 flex items-center gap-1.5 uppercase tracking-wide">
              <ImageIcon className="text-[#F26522]" size={16} />
              <span>Primary Image</span>
              <span className="text-red-500">*</span>
            </label>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#F26522] text-white font-black uppercase">
              Main Cover
            </span>
          </div>

          <p className="text-[11px] text-gray-500">
            This is the main thumbnail displayed on search, catalog &amp; checkout.
          </p>

          {primaryImage ? (
            /* Primary Image Preview Box */
            <div className="space-y-3">
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center group shadow-xs">
                <img
                  src={primaryImage}
                  alt="Primary cover preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholders/product.svg";
                  }}
                />
                <span className="absolute top-2.5 left-2.5 px-2.5 py-1 bg-[#F26522] text-white text-[10px] font-black rounded-lg uppercase tracking-wider shadow-sm z-10">
                  Cover Photo
                </span>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 z-20 gap-2">
                  <button
                    type="button"
                    onClick={handleRemovePrimary}
                    className="p-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-lg cursor-pointer transition-transform active:scale-95 flex items-center gap-1 text-xs font-bold"
                    title="Remove primary cover"
                  >
                    <Trash2 size={15} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
                <span className="truncate max-w-[200px] font-mono text-[10px]">{primaryImage}</span>
                <button
                  type="button"
                  onClick={handleRemovePrimary}
                  className="text-red-600 font-bold hover:underline cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Trash2 size={12} /> Change / Remove
                </button>
              </div>
            </div>
          ) : (
            /* Primary Image Upload / Link Box */
            <div className="space-y-3">
              {/* Mode Switcher */}
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPrimaryMode("upload")}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    primaryMode === "upload"
                      ? "bg-white text-gray-900 shadow-2xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Upload size={13} />
                  <span>Upload File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrimaryMode("link")}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    primaryMode === "link"
                      ? "bg-white text-gray-900 shadow-2xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <LinkIcon size={13} />
                  <span>Image Link</span>
                </button>
              </div>

              {primaryMode === "upload" ? (
                /* Primary File Dropzone */
                <div
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingPrimary(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      uploadFiles(e.dataTransfer.files, "primary");
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingPrimary(true);
                  }}
                  onDragLeave={() => setIsDraggingPrimary(false)}
                  onClick={() => primaryFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl aspect-square flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
                    isDraggingPrimary
                      ? "border-[#F26522] bg-orange-50/60"
                      : "border-gray-300 hover:border-[#F26522] hover:bg-orange-50/20 bg-gray-50/60"
                  }`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 size={32} className="text-[#F26522] animate-spin" />
                      <span className="text-xs font-bold text-gray-700">Uploading cover...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#F26522] flex items-center justify-center shadow-2xs">
                        <Upload size={22} />
                      </div>
                      <span className="text-xs font-black text-[#052a51]">
                        Upload Primary Cover
                      </span>
                      <span className="text-[11px] text-gray-400">
                        Drag &amp; drop or click to browse
                      </span>
                      <span className="text-[10px] text-gray-400 mt-1">PNG, JPG, WebP up to 10MB</span>
                    </div>
                  )}
                  <input
                    ref={primaryFileInputRef}
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    onChange={(e) => {
                      if (e.target.files) uploadFiles(e.target.files, "primary");
                    }}
                    className="hidden"
                  />
                </div>
              ) : (
                /* Primary Image Link Input */
                <div className="space-y-2 pt-1">
                  <label className="text-[11px] font-bold text-gray-600 block">
                    Paste Direct Image Link (URL):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={primaryUrlInput}
                      onChange={(e) => setPrimaryUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSetPrimaryUrl(e);
                      }}
                      placeholder="e.g. https://encrypted-tbn0.gstatic.com/... or https://..."
                      className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#F26522] font-mono bg-white"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSetPrimaryUrl}
                      className="px-4 py-2 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 shadow-xs"
                    >
                      Set Primary
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Supports Google images, CDN links, Unsplash &amp; external product URLs.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 2. GALLERY IMAGES SECTION ── */}
        <div className="lg:col-span-7 flex flex-col space-y-3 bg-white p-4.5 rounded-3xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-gray-900 flex items-center gap-1.5 uppercase tracking-wide">
              <Star className="text-amber-500 fill-amber-500" size={16} />
              <span>Gallery Images</span>
              <span className="text-[11px] font-normal text-gray-400 normal-case">(Optional)</span>
            </label>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-bold">
              {galleryImages.length} Photo{galleryImages.length === 1 ? "" : "s"}
            </span>
          </div>

          <p className="text-[11px] text-gray-500">
            Add multiple angles, packaging photos, back views, and application mockups.
          </p>

          {/* Gallery Top Action Controls (File vs Link) */}
          <div className="p-3 bg-gray-50/70 rounded-2xl border border-gray-200 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1 p-1 bg-white border border-gray-200 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setGalleryMode("upload")}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    galleryMode === "upload"
                      ? "bg-[#052a51] text-white shadow-2xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Upload size={13} />
                  <span>Upload Files</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGalleryMode("link")}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    galleryMode === "link"
                      ? "bg-[#052a51] text-white shadow-2xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <LinkIcon size={13} />
                  <span>Add by Link</span>
                </button>
              </div>

              <span className="text-[10px] text-gray-400">
                You can also Ctrl+V paste anywhere
              </span>
            </div>

            {galleryMode === "upload" ? (
              /* Gallery File Drop Trigger */
              <div
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingGallery(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    uploadFiles(e.dataTransfer.files, "gallery");
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingGallery(true);
                }}
                onDragLeave={() => setIsDraggingGallery(false)}
                onClick={() => galleryFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-all ${
                  isDraggingGallery
                    ? "border-[#F26522] bg-orange-50/60"
                    : "border-gray-300 hover:border-[#F26522] bg-white hover:bg-orange-50/20"
                }`}
              >
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-700">
                  <Upload size={15} className="text-[#F26522]" />
                  <span>Click to choose multiple gallery photos (or drag &amp; drop)</span>
                </div>
                <input
                  ref={galleryFileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  disabled={isUploading}
                  onChange={(e) => {
                    if (e.target.files) uploadFiles(e.target.files, "gallery");
                  }}
                  className="hidden"
                />
              </div>
            ) : (
              /* Gallery URL Input */
              <div className="flex gap-2">
                <input
                  type="url"
                  value={galleryUrlInput}
                  onChange={(e) => setGalleryUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddGalleryUrl(e);
                  }}
                  placeholder="Paste gallery image link (https://...)"
                  className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#F26522] font-mono bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddGalleryUrl}
                  className="px-4 py-2 bg-[#052a51] hover:bg-[#073666] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Add to Gallery</span>
                </button>
              </div>
            )}
          </div>

          {/* Gallery Thumbnails Grid */}
          {galleryImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
              {galleryImages.map((img, idx) => (
                <div
                  key={`${img}-${idx}`}
                  className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 group shadow-2xs"
                >
                  <img
                    src={img}
                    alt={`Gallery preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholders/product.svg";
                    }}
                  />

                  {/* Badges & Actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2 z-20">
                    <button
                      type="button"
                      onClick={() => handlePromoteToPrimary(idx)}
                      className="p-2 bg-white text-[#052a51] rounded-xl hover:bg-orange-50 hover:text-[#F26522] text-xs font-bold shadow-md cursor-pointer transition-transform active:scale-95"
                      title="Make Primary Cover Photo"
                    >
                      <Star size={14} className="fill-amber-500 text-amber-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveGallery(idx)}
                      className="p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-md cursor-pointer transition-transform active:scale-95"
                      title="Remove from gallery"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/40">
              <p className="text-xs text-gray-500 font-medium">
                No additional gallery photos added yet.
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Upload files or paste links above to showcase different angles.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
