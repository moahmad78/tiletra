"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload, X, Star, Plus, Link as LinkIcon, Image as ImageIcon } from "lucide-react";

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

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim() && !images.includes(urlInput.trim())) {
      onChange([...images, urlInput.trim()]);
      setUrlInput("");
      setIsAddingUrl(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const url = URL.createObjectURL(files[i]);
      newUrls.push(url);
    }
    onChange([...images, ...newUrls]);
  };

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const selected = images[index];
    const rest = images.filter((_, i) => i !== index);
    onChange([selected, ...rest]);
  };

  // Curated Tile Presets for Quick Demo/Adding
  const presetTiles = [
    "https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800&q=80",
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80",
    "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80",
    "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&q=80",
  ];

  return (
    <div className="space-y-4">
      {/* Existing Images Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="relative aspect-square rounded-2xl overflow-hidden border-2 border-gray-200 bg-gray-50 group shadow-2xs"
          >
            <Image
              src={img}
              alt={`Product preview ${idx + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
            />

            {/* Primary Image Badge */}
            {idx === 0 && (
              <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#F26522] text-white text-[9px] font-black rounded-md uppercase tracking-wider shadow-xs">
                Primary Cover
              </span>
            )}

            {/* Hover Actions */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
              {idx !== 0 && (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(idx)}
                  className="p-2 bg-white/90 text-[#052a51] rounded-xl hover:bg-white text-xs font-bold flex items-center gap-1 shadow-md"
                  title="Make primary photo"
                >
                  <Star size={13} className="text-amber-500 fill-amber-500" />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-md"
                title="Remove photo"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}

        {/* Upload Trigger Box */}
        <label className="border-2 border-dashed border-gray-300 hover:border-[#F26522] rounded-2xl aspect-square flex flex-col items-center justify-center p-4 cursor-pointer text-center bg-gray-50 hover:bg-[#F26522]/5 transition-all group">
          <Upload size={22} className="text-gray-400 group-hover:text-[#F26522] transition-colors" />
          <span className="text-xs font-bold text-[#052a51] mt-2 group-hover:text-[#F26522]">
            Upload Photos
          </span>
          <span className="text-[10px] text-gray-400 mt-0.5">JPG, PNG, WebP</span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* URL Add and Presets Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {!isAddingUrl ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddingUrl(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#052a51] text-xs font-bold rounded-xl transition-colors"
            >
              <LinkIcon size={13} />
              <span>Add Image by URL</span>
            </button>
            <span className="text-xs text-gray-400">or pick high-res sample presets below</span>
          </div>
        ) : (
          <form onSubmit={handleAddUrl} className="flex gap-2 w-full max-w-md">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-[#F26522]"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#052a51] text-white text-xs font-bold rounded-xl"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAddingUrl(false)}
              className="px-2 py-1.5 text-gray-400 hover:text-gray-600 text-xs"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Quick Sample Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {presetTiles.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (!images.includes(url)) onChange([...images, url]);
              }}
              className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-200 shrink-0 hover:scale-110 transition-transform"
              title="Click to insert tile preset"
            >
              <Image src={url} alt="" fill className="object-cover" sizes="32px" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
