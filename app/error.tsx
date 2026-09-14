"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sentry instrumented error capture: Next.js segment-level catch-all
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4 text-2xl font-bold">
        !
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-gray-600 mb-6 text-sm max-w-md">
        An unexpected error occurred. Our system monitoring team has been notified automatically.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2.5 bg-[#F26522] hover:bg-[#d95516] text-white font-medium rounded-lg transition-colors shadow-sm"
      >
        Try again
      </button>
    </div>
  );
}
