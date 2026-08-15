"use client";

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  color: "orange" | "navy" | "green" | "amber" | "purple";
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const colorMap = {
  orange: "bg-[#F26522]/10 text-[#F26522] border-[#F26522]/20",
  navy: "bg-[#052a51]/10 text-[#052a51] border-[#052a51]/20",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs hover:shadow-sm transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          {title}
        </span>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorMap[color]}`}
        >
          <Icon size={18} />
        </div>
      </div>

      <div className="mt-3">
        <h3 className="text-2xl md:text-3xl font-black text-[#052a51] tracking-tight leading-none">
          {value}
        </h3>

        <div className="flex items-center gap-2 mt-2">
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 text-[11px] font-extrabold px-1.5 py-0.5 rounded-md ${
                trend.isPositive
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {trend.isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {trend.value}
            </span>
          )}
          {subtitle && <span className="text-xs text-gray-400 font-medium">{subtitle}</span>}
        </div>
      </div>
    </div>
  );
}
