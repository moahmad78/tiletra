"use client";

import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
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
  size = 28,
  className,
  imageClassName,
  fallbackClassName,
  fallbackIconSize,
  priority = false,
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error state when src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const initial = name?.trim() ? name.trim()[0].toUpperCase() : null;
  const iconSize = fallbackIconSize || Math.max(12, Math.round(size * 0.48));
  const fontSize = Math.max(10, Math.round(size * 0.4));

  if (!src || hasError) {
    return (
      <div
        className={cn(
          "rounded-full bg-[#052a51] text-white flex items-center justify-center font-black select-none shrink-0",
          fallbackClassName || className
        )}
        style={{ width: size, height: size, fontSize }}
        aria-label={name || "User Avatar"}
      >
        {initial || <User size={iconSize} />}
      </div>
    );
  }

  return (
    <div
      className={cn("relative shrink-0 rounded-full overflow-hidden select-none", className)}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={name || "User Avatar"}
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        loading={priority ? "eager" : "lazy"}
        onError={() => setHasError(true)}
        className={cn("w-full h-full object-cover rounded-full", imageClassName)}
      />
    </div>
  );
}
