"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Instant client-side redirect to homepage replacing browser history
    router.replace("/");
  }, [router]);

  return (
    <>
      <meta httpEquiv="refresh" content="0; url=/" />
      <script
        dangerouslySetInnerHTML={{
          __html: "window.location.replace('/');",
        }}
      />
    </>
  );
}
