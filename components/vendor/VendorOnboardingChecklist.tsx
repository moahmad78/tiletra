"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Rocket,
  X,
} from "lucide-react";
import type { OnboardingProgress } from "@/lib/actions/vendor-onboarding";

// ─── Step definition ────────────────────────────────────────────────────────

type Step = {
  key: keyof OnboardingProgress;
  label: string;
  description: string;
  href: string;
  autoComplete?: boolean; // steps that complete without manual navigation
};

const STEPS: Step[] = [
  {
    key: "hasProfile",
    label: "Complete Shop Profile",
    description: "Business name, logo & description filled in",
    href: "/vendor/settings",
  },
  {
    key: "hasBankDetails",
    label: "Add Bank Details",
    description: "Payout information added to receive payments",
    href: "/vendor/settings#bank-details",
  },
  {
    key: "hasFirstProduct",
    label: "Upload First Product",
    description: "At least 1 product submitted for approval",
    href: "/vendor/products/new",
  },
  {
    key: "hasApprovedProduct",
    label: "Get First Product Approved",
    description: "Super Admin will review and approve your listing",
    href: "/vendor/products",
    autoComplete: true,
  },
  {
    key: "hasFirstOrder",
    label: "Receive First Order",
    description: "Your first real customer order will arrive here",
    href: "/vendor/orders",
    autoComplete: true,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

interface VendorOnboardingChecklistProps {
  progress: OnboardingProgress;
}

const DISMISSED_KEY = "vendor-checklist-dismissed";
const COLLAPSED_KEY = "vendor-checklist-collapsed";

export default function VendorOnboardingChecklist({
  progress,
}: VendorOnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISSED_KEY) === "true");
    setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "true");
    setMounted(true);
  }, []);

  const completedCount = STEPS.filter((s) => progress[s.key]).length;
  const allDone = completedCount === STEPS.length;

  // Auto-dismiss permanently once everything is done
  useEffect(() => {
    if (allDone && mounted) {
      localStorage.setItem(DISMISSED_KEY, "true");
      setDismissed(true);
    }
  }, [allDone, mounted]);

  const handleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(COLLAPSED_KEY, String(next));
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  };

  // Don't render until hydrated (avoids flicker)
  if (!mounted || dismissed) return null;

  const pct = Math.round((completedCount / STEPS.length) * 100);

  return (
    <div className="bg-white border border-[#052a51]/15 rounded-3xl shadow-sm overflow-hidden">
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer select-none"
        onClick={handleCollapse}
        role="button"
        aria-expanded={!collapsed}
        aria-label="Toggle onboarding checklist"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#052a51] flex items-center justify-center shrink-0">
            <Rocket size={17} className="text-[#F26522]" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-black text-[#052a51] leading-tight">
              Get to your first sale
            </p>
            <p className="text-[11px] text-gray-500 font-medium leading-tight mt-0.5">
              {completedCount}/{STEPS.length} steps complete
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Progress pill */}
          <span
            className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
              allDone
                ? "bg-emerald-100 text-emerald-700"
                : "bg-[#052a51]/8 text-[#052a51]"
            }`}
          >
            {pct}%
          </span>

          {/* Dismiss button (only shown when not all done) */}
          {!allDone && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              className="w-7 h-7 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-400 hover:text-gray-600"
              title="Dismiss for now"
              aria-label="Dismiss checklist"
            >
              <X size={14} />
            </button>
          )}

          {collapsed ? (
            <ChevronDown size={16} className="text-gray-400" />
          ) : (
            <ChevronUp size={16} className="text-gray-400" />
          )}
        </div>
      </div>

      {/* ── Progress Bar ── */}
      {!collapsed && (
        <div className="px-5 pb-1">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-[#052a51] to-[#F26522] rounded-full transition-all duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Steps ── */}
      {!collapsed && (
        <div className="px-4 pb-4 pt-3 space-y-1">
          {STEPS.map((step, idx) => {
            const done = progress[step.key];
            return (
              <StepRow
                key={step.key}
                step={step}
                done={done}
                index={idx + 1}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Step Row ────────────────────────────────────────────────────────────────

function StepRow({
  step,
  done,
  index,
}: {
  step: Step;
  done: boolean;
  index: number;
}) {
  const inner = (
    <div
      className={`group flex items-start gap-3 rounded-2xl px-3 py-2.5 transition-colors ${
        done
          ? "opacity-60"
          : "hover:bg-[#052a51]/5 cursor-pointer active:bg-[#052a51]/10"
      }`}
    >
      {/* Icon */}
      <div className="mt-0.5 shrink-0">
        {done ? (
          <CheckCircle2 size={18} className="text-emerald-500" />
        ) : (
          <Circle
            size={18}
            className="text-gray-300 group-hover:text-[#052a51]/40 transition-colors"
          />
        )}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p
          className={`text-[13px] font-bold leading-snug ${
            done ? "line-through text-gray-400" : "text-gray-800"
          }`}
        >
          {index}. {step.label}
        </p>
        <p
          className={`text-[11px] leading-snug mt-0.5 ${
            done ? "text-gray-300" : "text-gray-400"
          }`}
        >
          {step.autoComplete && !done ? "⚡ Auto-completes · " : ""}
          {step.description}
        </p>
      </div>

      {/* Arrow chip (only when not done and not auto-complete) */}
      {!done && !step.autoComplete && (
        <span className="shrink-0 mt-0.5 px-2 py-0.5 rounded-lg bg-[#F26522]/10 text-[#F26522] text-[10px] font-black uppercase tracking-wide group-hover:bg-[#F26522] group-hover:text-white transition-colors">
          Go →
        </span>
      )}
    </div>
  );

  // Non-done + non-auto-complete = tappable link
  if (!done && !step.autoComplete) {
    return <Link href={step.href}>{inner}</Link>;
  }

  return inner;
}
