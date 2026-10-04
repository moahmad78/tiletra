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
  const [retryAttempt, setRetryAttempt] = useState(0);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Clean effective image src: ignore unavatar.io broken placeholders
  const cleanSrc = src && !src.includes("unavatar.io") ? src.trim() : null;
  const cleanEmail = email?.trim().toLowerCase();

  // Reset error state and retry count whenever cleanSrc changes
  useEffect(() => {
    setHasError(false);
    setRetryAttempt(0);
  }, [cleanSrc]);

  // If already complete in cache upon mount, clear error
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth > 0) {
        setHasError(false);
      } else if (imgRef.current.naturalWidth === 0 && cleanSrc) {
        // Natural width 0 means image failed to load
        if (cleanSrc.includes("googleusercontent.com") && retryAttempt === 0) {
          setRetryAttempt(1);
        } else {
          setHasError(true);
        }
      }
    }
  }, [cleanSrc, retryAttempt]);

  // Compute alternative URL if first attempt on Google avatar fails
  const getEffectiveSrc = () => {
    if (!cleanSrc) return null;
    if (retryAttempt === 0) return cleanSrc;

    // Retry 1: If Google URL with `=s...`, try upgrading to `=s256-c` or removing size parameter
    if (cleanSrc.includes("googleusercontent.com")) {
      if (cleanSrc.includes("=")) {
        return cleanSrc.replace(/=s\d+(-c)?$/, "=s256-c");
      }
      return `${cleanSrc}=s256-c`;
    }

    return cleanSrc;
  };

  const effectiveSrc = getEffectiveSrc();

  const handleImageError = () => {
    // If it's a Google image and we haven't retried with alternative format yet, retry once
    if (cleanSrc?.includes("googleusercontent.com") && retryAttempt === 0) {
      setRetryAttempt(1);
    } else {
      setHasError(true);
    }
  };

  const initial = name?.trim()
    ? name.trim()[0].toUpperCase()
    : cleanEmail
    ? cleanEmail[0].toUpperCase()
    : null;
  const iconSize = fallbackIconSize || Math.max(12, Math.round(size * 0.48));
  const fontSize = Math.max(10, Math.round(size * 0.4));

  // If no source or image errored out completely, display fallback circle
  if (!effectiveSrc || hasError) {
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
      className={cn("relative shrink-0 rounded-full overflow-hidden select-none bg-gray-100", className)}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        key={`${effectiveSrc}-${retryAttempt}`}
        src={effectiveSrc}
        alt={name || cleanEmail || "User Avatar"}
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onError={handleImageError}
        className={cn(
          "w-full h-full object-cover rounded-full block",
          imageClassName
        )}
      />
    </div>
  );
}
