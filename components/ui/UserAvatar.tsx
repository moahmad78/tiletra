"use client";

import { useState, useEffect } from "react";
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
  const [isLoaded, setIsLoaded] = useState(false);

  // Clean effective image src: ignore unavatar.io broken placeholders
  const cleanSrc = src && !src.includes("unavatar.io") ? src.trim() : null;
  const cleanEmail = email?.trim().toLowerCase();

  // Reset error state and retry count whenever cleanSrc changes
  useEffect(() => {
    setHasError(false);
    setRetryAttempt(0);
    setIsLoaded(false);
  }, [cleanSrc]);

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
      {/* Fallback initial visible beneath while image is loading */}
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-[#052a51] text-white flex items-center justify-center font-black select-none"
          style={{ fontSize }}
        >
          {initial || <User size={iconSize} />}
        </div>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={`${effectiveSrc}-${retryAttempt}`}
        src={effectiveSrc}
        alt={name || cleanEmail || "User Avatar"}
        width={size}
        height={size}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={handleImageError}
        className={cn(
          "w-full h-full object-cover rounded-full transition-opacity duration-150",
          isLoaded ? "opacity-100" : "opacity-0",
          imageClassName
        )}
      />
    </div>
  );
}
