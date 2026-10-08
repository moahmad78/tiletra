"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Circle, RotateCcw, Sparkles } from "lucide-react";

interface ChecklistItem {
  id: string;
  text: string;
  detail: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "budget-scope",
    text: "Decide budget and scope this week",
    detail: "Confirm which rooms to refresh and establish a realistic spend limit.",
  },
  {
    id: "measure-quantities",
    text: "Measure rooms and confirm quantities",
    detail: "Calculate wall area for paint and square footage for tiles (+10% buffer).",
  },
  {
    id: "book-contractors",
    text: "Book painter, electrician and carpenter",
    detail: "Secure your trade professionals early before festival rush surge.",
  },
  {
    id: "complete-repairs",
    text: "Complete repairs before painting",
    detail: "Address wall seepage, hairline cracks, leaking taps, and loose tiles first.",
  },
  {
    id: "order-materials",
    text: "Order materials by the end of Week 2",
    detail: "Source paints, tiles, adhesives, switches, and CP fittings on IntriHub.",
  },
  {
    id: "finish-construction",
    text: "Finish construction work before the last week of October",
    detail: "Complete all messy drilling, tiling, and painting with buffer for drying.",
  },
  {
    id: "keep-diwali-week-clean",
    text: "Keep Diwali week for cleaning and decoration",
    detail: "Reserve the final days exclusively for rangoli, diyas, lights, and family.",
  },
];

export default function DiwaliInteractiveChecklist() {
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("intrihub_diwali_checklist_2026");
      if (saved) {
        setCheckedIds(JSON.parse(saved));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const toggleItem = (id: string) => {
    setCheckedIds((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem("intrihub_diwali_checklist_2026", JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }
      return updated;
    });
  };

  const resetAll = () => {
    setCheckedIds({});
    try {
      localStorage.removeItem("intrihub_diwali_checklist_2026");
    } catch {
      // Ignore localStorage errors
    }
  };

  const completedCount = CHECKLIST_ITEMS.filter((item) => checkedIds[item.id]).length;
  const progressPercent = Math.round((completedCount / CHECKLIST_ITEMS.length) * 100);

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-slate-50 to-orange-500/10 rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-amber-200/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles size={13} className="text-amber-600" />
            Interactive Tool
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900">
            Quick Diwali Renovation Checklist
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Tap each milestone as you complete it. Progress saves automatically in your browser.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Progress
            </div>
            <div className="text-lg font-black text-slate-900">
              {completedCount} of {CHECKLIST_ITEMS.length}
            </div>
          </div>
          {completedCount > 0 && (
            <button
              onClick={resetAll}
              type="button"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-xl transition-colors border border-slate-200 shadow-xs"
              title="Reset checklist"
              aria-label="Reset checklist"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 mb-6">
        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-[#FF9900] to-orange-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {completedCount === CHECKLIST_ITEMS.length && (
          <div className="mt-2 text-xs font-bold text-emerald-700 flex items-center gap-1.5 animate-fadeIn">
            <Sparkles size={13} className="text-emerald-600" />
            Superb work! Your home is 100% ready for Diwali celebrations!
          </div>
        )}
      </div>

      {/* Checklist items list */}
      <div className="space-y-3">
        {CHECKLIST_ITEMS.map((item) => {
          const isDone = mounted && Boolean(checkedIds[item.id]);
          return (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-3.5 select-none ${
                isDone
                  ? "bg-white/90 border-emerald-300 shadow-xs"
                  : "bg-white hover:bg-amber-50/40 border-slate-200 hover:border-amber-300 shadow-xs"
              }`}
            >
              <button
                type="button"
                className="mt-0.5 shrink-0 focus:outline-hidden"
                aria-label={isDone ? `Mark ${item.text} as incomplete` : `Mark ${item.text} as complete`}
              >
                {isDone ? (
                  <CheckCircle2 size={20} className="text-emerald-600" />
                ) : (
                  <Circle size={20} className="text-slate-300 hover:text-amber-500" />
                )}
              </button>
              <div className="flex-1">
                <span
                  className={`text-sm sm:text-base font-semibold block transition-colors ${
                    isDone ? "text-slate-500 line-through" : "text-slate-900"
                  }`}
                >
                  {item.text}
                </span>
                <span className="text-xs text-slate-500 block mt-0.5 leading-relaxed">
                  {item.detail}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
