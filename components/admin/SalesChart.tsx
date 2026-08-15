"use client";

import { useState } from "react";
import { BarChart3, TrendingUp, Calendar } from "lucide-react";

interface DataPoint {
  label: string;
  revenue: number;
  orders: number;
}

const weeklyData: DataPoint[] = [
  { label: "Mon", revenue: 24500, orders: 3 },
  { label: "Tue", revenue: 38200, orders: 5 },
  { label: "Wed", revenue: 19800, orders: 2 },
  { label: "Thu", revenue: 45000, orders: 6 },
  { label: "Fri", revenue: 52400, orders: 7 },
  { label: "Sat", revenue: 68900, orders: 9 },
  { label: "Sun", revenue: 41200, orders: 5 },
];

const monthlyData: DataPoint[] = [
  { label: "Jan", revenue: 320000, orders: 42 },
  { label: "Feb", revenue: 410000, orders: 55 },
  { label: "Mar", revenue: 480000, orders: 62 },
  { label: "Apr", revenue: 390000, orders: 49 },
  { label: "May", revenue: 520000, orders: 68 },
  { label: "Jun", revenue: 610000, orders: 79 },
  { label: "Jul", revenue: 590000, orders: 74 },
  { label: "Aug (MTD)", revenue: 290000, orders: 38 },
];

export default function SalesChart() {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const data = period === "week" ? weeklyData : monthlyData;
  const maxRevenue = Math.max(...data.map((d) => d.revenue));
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200/80 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-[#F26522]" />
            <h3 className="font-black text-[#052a51] text-base">Revenue & Sales Trends</h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Total {period === "week" ? "This Week" : "Year to Date"}:{" "}
            <strong className="text-[#052a51]">₹{totalRevenue.toLocaleString("en-IN")}</strong>
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => {
              setPeriod("week");
              setHoveredIdx(null);
            }}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              period === "week"
                ? "bg-white text-[#052a51] shadow-2xs"
                : "text-gray-500 hover:text-[#052a51]"
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => {
              setPeriod("month");
              setHoveredIdx(null);
            }}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              period === "month"
                ? "bg-white text-[#052a51] shadow-2xs"
                : "text-gray-500 hover:text-[#052a51]"
            }`}
          >
            Monthly Overview
          </button>
        </div>
      </div>

      {/* Bar Chart Visualizer */}
      <div className="h-[220px] flex items-end gap-2 sm:gap-4 pt-8 pb-4 relative">
        {data.map((d, i) => {
          const heightPercent = Math.round((d.revenue / maxRevenue) * 100);
          const isHovered = hoveredIdx === i;

          return (
            <div
              key={d.label}
              className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute -top-10 z-20 bg-[#052a51] text-white px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap shadow-lg animate-in fade-in zoom-in-95 pointer-events-none">
                  ₹{d.revenue.toLocaleString("en-IN")} ({d.orders} orders)
                </div>
              )}

              {/* Bar */}
              <div className="w-full max-w-[42px] bg-gray-100 rounded-t-xl overflow-hidden flex items-end relative h-full">
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t-xl transition-all duration-500 ${
                    isHovered
                      ? "bg-[#F26522] shadow-sm"
                      : "bg-gradient-to-t from-[#052a51] to-[#0d4b8a]"
                  }`}
                />
              </div>

              {/* Label */}
              <span
                className={`text-[10px] font-bold mt-2 truncate ${
                  isHovered ? "text-[#F26522]" : "text-gray-400"
                }`}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#052a51]" /> Completed Tile Orders
        </span>
        <span className="flex items-center gap-1 font-bold text-emerald-600">
          <TrendingUp size={13} /> +18.4% vs last period
        </span>
      </div>
    </div>
  );
}
