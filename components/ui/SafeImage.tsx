"use client";

import React, { useState, useEffect, useRef } from "react";
import Image, { ImageProps } from "next/image";
import { imageUrl, PLACEHOLDER_IMAGE, ImageVariantSize } from "@/lib/image-url";

export interface SafeImageProps extends Omit<ImageProps, "src" | "onError"> {
  src: string | null | undefined;
  variantSize?: ImageVariantSize;
  fallbackSrc?: string;
  enableRetry?: boolean;
}

const reportedBeaconUrls = new Set<string>();

export function SafeImage({
  src,
  alt,
  variantSize,
  fallbackSrc = PLACEHOLDER_IMAGE,
  enableRetry = true,
  className = "",
  sizes,
  priority = false,
  ...rest
}: SafeImageProps) {
  const initialUrl = imageUrl(src, variantSize);
  const [currentSrc, setCurrentSrc] = useState<string>(initialUrl);
  const [hasRetried, setHasRetried] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const nextUrl = imageUrl(src, variantSize);
    setCurrentSrc(nextUrl);
    setHasRetried(false);
    setIsLoaded(false);
  }, [src, variantSize]);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const handleError = () => {
    // If not yet retried and retries enabled, retry once with cache buster query after 1s
    if (enableRetry && !hasRetried && currentSrc !== fallbackSrc) {
      setHasRetried(true);
      retryTimeoutRef.current = setTimeout(() => {
        const separator = currentSrc.includes("?") ? "&" : "?";
        setCurrentSrc(`${currentSrc}${separator}retry=1`);
      }, 1000);
      return;
    }

    // Final failure: swap to local lightweight placeholder and send beacon once
    if (currentSrc !== fallbackSrc) {
      const failedUrl = currentSrc;
      if (!reportedBeaconUrls.has(failedUrl)) {
        reportedBeaconUrls.add(failedUrl);
        if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.sendBeacon) {
          try {
            const payload = JSON.stringify({
              url: failedUrl,
              page: window.location.pathname,
              connectionType: (navigator as any)?.connection?.effectiveType || "unknown",
              retryCount: hasRetried ? 1 : 0,
            });
            navigator.sendBeacon("/api/img-error", payload);
          } catch {
            // Ignore beacon send errors
          }
        }
      }

      setCurrentSrc(fallbackSrc);
    }
  };

  return (
    <Image
      src={currentSrc}
      alt={alt || "IntriHub Building Supplies"}
      onError={handleError}
      onLoad={() => setIsLoaded(true)}
      priority={priority}
      sizes={sizes || "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
      className={`${className} ${!isLoaded ? "animate-pulse bg-slate-100 dark:bg-slate-800/60" : ""} transition-opacity duration-300`}
      unoptimized
      {...rest}
    />
  );
}

export default SafeImage;
