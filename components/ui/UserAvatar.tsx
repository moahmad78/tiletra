"use client";

import { useState, useEffect, useRef } from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: number; // size in pixels, default 28
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  fallbackIconSize?: number;
  priority?: boolean;
}

export default function UserAvatar({
  src,
  name,
  email,
  size = 28,
  className,
  imageClassName,
  fallbackClassName,
  fallbackIconSize,
  priority = true,
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Clean effective image src: ignore unavatar.io broken placeholders
  const cleanSrc = src && !src.includes("unavatar.io") ? src.trim() : null;
  const cleanEmail = email?.trim().toLowerCase();

  // Reset states whenever cleanSrc changes
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [cleanSrc]);

  const initial = name?.trim()
    ? name.trim()[0].toUpperCase()
    : cleanEmail
    ? cleanEmail[0].toUpperCase()
    : null;
  const iconSize = fallbackIconSize || Math.max(12, Math.round(size * 0.48));
  const fontSize = Math.max(10, Math.round(size * 0.4));

  // If no image source at all, show fallback directly
  if (!cleanSrc || hasError) {
    return (
      <div
        className={cn(
          "rounded-full bg-[#052a51] text-white flex items-center justify-center font-black select-none shrink-0",
          fallbackClassName || className
        )}
        style={{ width: size, height: size, fontSize }}
        aria-label={name || cleanEmail || "User Avatar"}
      >
        {initial || <User size={iconSize} />}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative shrink-0 rounded-full overflow-hidden select-none bg-[#052a51] text-white flex items-center justify-center font-black",
        className
      )}
      style={{ width: size, height: size, fontSize }}
      aria-label={name || cleanEmail || "User Avatar"}
    >
      {/* Fallback initial shown underneath while image downloads */}
      {!isLoaded && (
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center select-none bg-[#052a51] text-white font-black",
            fallbackClassName
          )}
          style={{ fontSize }}
        >
          {initial || <User size={iconSize} />}
        </span>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cleanSrc}
        alt={name || cleanEmail || "User Avatar"}
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => {
          setIsLoaded(true);
          setHasError(false);
        }}
        onError={() => {
          setHasError(true);
        }}
        className={cn(
          "w-full h-full object-cover rounded-full block relative z-10 transition-opacity duration-150",
          isLoaded ? "opacity-100" : "opacity-0",
          imageClassName
        )}
      />
    </div>
  );
}
