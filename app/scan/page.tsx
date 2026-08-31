"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useScanStore } from "@/lib/scan-store";

export default function ScanPage() {
  const router = useRouter();
  const { openScan } = useScanStore();

  useEffect(() => {
    openScan();
    router.replace("/");
  }, [openScan, router]);

  return null;
}
