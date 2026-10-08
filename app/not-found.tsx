"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Instant client-side redirect to homepage replacing browser history
    router.replace("/");
  }, [router]);

  // Clean empty state to prevent UI flashes during redirection
  return null;
}
