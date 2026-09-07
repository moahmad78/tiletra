import { generateLocationIntro } from "@/lib/seo";
import type { SeoLocation } from "@/lib/data/seo-locations";

interface LocationSeoIntroProps {
  categoryName: string;
  location: SeoLocation;
}

/**
 * Short 100-150 word SEO intro shown above the product grid on
 * /shop/[category]/[location] pages. Uses rotating templates per zone type
 * to avoid identical doorway-page content across locations.
 */
export default function LocationSeoIntro({ categoryName, location }: LocationSeoIntroProps) {
  const intro = generateLocationIntro({
    categoryName,
    locationName: location.name,
    locationArea: location.area,
    zoneType: location.zoneType,
    context: location.context,
  });

  return (
    <div className="bg-[#052a51]/5 border border-[#052a51]/10 rounded-2xl px-5 py-4 mb-6">
      <div className="flex items-start gap-3">
        {/* Location pin accent */}
        <div className="w-8 h-8 rounded-xl bg-[#052a51] flex items-center justify-center shrink-0 mt-0.5">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <div>
          <p className="text-[13px] font-black text-[#052a51] mb-1">
            Delivering {categoryName} to {location.name}, {location.area}
          </p>
          <p className="text-[13px] text-gray-600 leading-relaxed">{intro}</p>
        </div>
      </div>
    </div>
  );
}
