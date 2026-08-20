"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import SearchModal from "@/components/SearchModal";

export default function MobileStickySearchBar() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-30 w-full bg-[#052a51] px-3 py-2 shadow-sm">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="w-full h-10 bg-white rounded-xl px-3 flex items-center gap-2.5 text-left text-gray-500 shadow-2xs active:bg-gray-50 transition-colors border border-gray-100"
        >
          <Search size={17} className="text-[#F26522] shrink-0" />
          <span className="text-[13px] font-medium text-gray-500 truncate">
            Search products, e.g. wires, tiles, pipes, hardware...
          </span>
        </button>
      </div>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
