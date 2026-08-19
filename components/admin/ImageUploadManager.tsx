"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Star, Link as LinkIcon, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export default function ImageUploadManager({
  images,
  onChange,
}: ImageUploadManagerProps) {
  const [urlInput, setUrlInput] = useState("");
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidUrl = (url: string) => {
    try {
      if (url.startsWith("/")) return true; // Local path
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = urlInput.trim();
    if (!cleanUrl) return;

    if (!isValidUrl(cleanUrl)) {
      toast.error("Please enter a valid HTTP/HTTPS image URL");
      return;
    }

    if (images.includes(cleanUrl)) {
      toast.error("This image URL is already added");
      return;
    }

    onChange([...images.filter((img) => img !== "/placeholders/product.svg"), cleanUrl]);
    setUrlInput("");
    setIsAddingUrl(false);
    toast.success("Image URL added!");
  };

  const uploadFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("file", files[i]);
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.urls) && data.urls.length > 0) {
        const currentFiltered = images.filter((img) => img !== "/placeholders/product.svg");
        onChange([...currentFiltered, ...data.urls]);
        toast.success(`Uploaded ${data.urls.length} photo(s) successfully`);
      } else {
        toast.error(data.error || "Failed to upload photos");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error("Upload error: " + (err?.message || "Check network connection"));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      uploadFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated.length > 0 ? updated : ["/placeholders/product.svg"]);
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const selected = images[index];
    const rest = images.filter((_, i) => i !== index);
    onChange([selected, ...rest]);
    toast.success("Set as primary cover photo");
  };

  const displayImages = images.filter((img) => img.trim().length > 0);

  return (
    <div className="space-y-4">
      {/* Existing Images Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {displayImages.map((img, idx) => (
          <div
            key={`${img}-${idx}`}
            className="relative aspect-square rounded-2xl overflow-hidden border-2 border-gray-200 bg-gray-50 group shadow-2xs"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt={`Product preview ${idx + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholders/product.svg";
              }}
            />

            {/* Primary Image Badge */}
            {idx === 0 && (
              <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#F26522] text-white text-[9px] font-black rounded-md uppercase tracking-wider shadow-xs z-10">
                Primary Cover
              </span>
            )}

            {/* Hover Actions */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2 z-20">
              {idx !== 0 && (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(idx)}
                  className="p-2 bg-white/90 text-[#052a51] rounded-xl hover:bg-white text-xs font-bold flex items-center gap-1 shadow-md cursor-pointer transition-transform active:scale-95"
                  title="Make primary photo"
                >
                  <Star size={14} className="text-amber-500 fill-amber-500" />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-md cursor-pointer transition-transform active:scale-95"
                title="Remove photo"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}

        {/* Upload Trigger Box with Drag-and-Drop */}
        <label
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-2xl aspect-square flex flex-col items-center justify-center p-4 cursor-pointer text-center transition-all group ${
            isDragging
              ? "border-[#F26522] bg-[#F26522]/10 scale-98"
              : "border-gray-300 hover:border-[#F26522] bg-gray-50 hover:bg-[#F26522]/5"
          }`}
        >
          {isUploading ? (
            <>
              <Loader2 size={24} className="text-[#F26522] animate-spin" />
              <span className="text-xs font-bold text-[#052a51] mt-2">Uploading...</span>
            </>
          ) : (
            <>
              <Upload size={22} className="text-gray-400 group-hover:text-[#F26522] transition-colors" />
              <span className="text-xs font-bold text-[#052a51] mt-2 group-hover:text-[#F26522]">
                Upload Photos
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5">Drag & drop or browse</span>
              <span className="text-[9px] text-gray-400 font-medium">PNG, JPG, WebP</span>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            disabled={isUploading}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {/* URL Add and Presets Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-gray-100">
        {!isAddingUrl ? (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsAddingUrl(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-[#052a51] text-xs font-bold rounded-xl transition-colors cursor-pointer active:scale-95"
            >
              <LinkIcon size={14} />
              <span>Paste Image URL</span>
            </button>
            <span className="text-xs text-gray-400">
              Host photos elsewhere? Paste direct links (CDN, Imgur, S3)
            </span>
          </div>
        ) : (
          <form onSubmit={handleAddUrl} className="flex items-center gap-2 w-full max-w-lg">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/tile-photo.jpg"
              className="flex-1 px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden focus:border-[#F26522] font-medium bg-white"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
            >
              Add Link
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingUrl(false);
                setUrlInput("");
              }}
              className="px-2.5 py-2 text-gray-400 hover:text-gray-600 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
