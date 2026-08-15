"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Palette,
  Plus,
  Trash2,
  Edit,
  Save,
  Sparkles,
  ExternalLink,
  Sliders,
  Check,
  X,
} from "lucide-react";
import { useAdminStore, type AdminOfferBanner } from "@/lib/admin-store";
import { toast } from "sonner";

export default function AdminContentPage() {
  const heroContent = useAdminStore((s) => s.heroContent);
  const updateHeroContent = useAdminStore((s) => s.updateHeroContent);
  const offerBanners = useAdminStore((s) => s.offerBanners);
  const addOfferBanner = useAdminStore((s) => s.addOfferBanner);
  const updateOfferBanner = useAdminStore((s) => s.updateOfferBanner);
  const deleteOfferBanner = useAdminStore((s) => s.deleteOfferBanner);

  // Hero state
  const [heroHeadline, setHeroHeadline] = useState(heroContent.headline);
  const [heroSubheadline, setHeroSubheadline] = useState(heroContent.subheadline);
  const [heroBadge, setHeroBadge] = useState(heroContent.badge);
  const [heroCtaText, setHeroCtaText] = useState(heroContent.ctaText);
  const [heroCtaHref, setHeroCtaHref] = useState(heroContent.ctaHref);
  const [heroBgImage, setHeroBgImage] = useState(heroContent.bgImage);

  // Banner Modal state
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<AdminOfferBanner | null>(null);

  const [bBadge, setBBadge] = useState("");
  const [bTitle, setBTitle] = useState("");
  const [bSubtitle, setBSubtitle] = useState("");
  const [bCta, setBCta] = useState("");
  const [bHref, setBHref] = useState("");
  const [bImage, setBImage] = useState("");

  const handleSaveHero = (e: React.FormEvent) => {
    e.preventDefault();
    updateHeroContent({
      headline: heroHeadline,
      subheadline: heroSubheadline,
      badge: heroBadge,
      ctaText: heroCtaText,
      ctaHref: heroCtaHref,
      bgImage: heroBgImage,
    });
    toast.success("Desktop Hero section content updated!");
  };

  const handleOpenAddBanner = () => {
    setEditingBanner(null);
    setBBadge("Limited Deal");
    setBTitle("Flat 15% Off Bathroom Tiles");
    setBSubtitle("Waterproof & anti-slip glazed ceramic looks");
    setBCta("Shop Now");
    setBHref("/shop/bathroom-tiles");
    setBImage("https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80");
    setBannerModalOpen(true);
  };

  const handleOpenEditBanner = (b: AdminOfferBanner) => {
    setEditingBanner(b);
    setBBadge(b.badge);
    setBTitle(b.title);
    setBSubtitle(b.subtitle);
    setBCta(b.cta);
    setBHref(b.href);
    setBImage(b.image);
    setBannerModalOpen(true);
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bTitle.trim()) return;

    if (editingBanner) {
      updateOfferBanner(editingBanner.id, {
        badge: bBadge.trim(),
        title: bTitle.trim(),
        subtitle: bSubtitle.trim(),
        cta: bCta.trim(),
        href: bHref.trim(),
        image: bImage.trim(),
      });
      toast.success("Offer banner updated!");
    } else {
      const newBanner: AdminOfferBanner = {
        id: `slide-${Date.now().toString().slice(-4)}`,
        badge: bBadge.trim() || "Offer",
        title: bTitle.trim(),
        subtitle: bSubtitle.trim(),
        cta: bCta.trim() || "Explore",
        href: bHref.trim() || "/shop",
        image: bImage.trim() || "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80",
        bgGradient: "from-[#052a51]/95 via-[#052a51]/80 to-transparent",
        isActive: true,
      };
      addOfferBanner(newBanner);
      toast.success("New offer banner slide added!");
    }
    setBannerModalOpen(false);
  };

  const handleDeleteBanner = (id: string) => {
    if (offerBanners.length <= 1) {
      toast.error("You need at least 1 banner slide in the carousel");
      return;
    }
    deleteOfferBanner(id);
    toast.success("Banner slide removed");
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div>
          <h2 className="text-xl font-black text-[#052a51]">Homepage Content CMS</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Modify promotional banners, headlines, and call-to-actions without redeploying code
          </p>
        </div>

        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-[#052a51] text-xs font-bold rounded-xl transition-colors shadow-2xs w-fit"
        >
          <ExternalLink size={13} />
          <span>View Public Homepage</span>
        </Link>
      </div>

      {/* ── Section 1: Mobile Thin Offer Banner Carousel ── */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-[#052a51]">
              1. Mobile Thin Offer Banners (Carousel)
            </h3>
            <p className="text-xs text-gray-400">
              Slides auto-rotate on mobile homepage (height ~135px)
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddBanner}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-xs"
          >
            <Plus size={14} />
            <span>Add Banner Slide</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
          {offerBanners.map((slide) => (
            <div
              key={slide.id}
              className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50 flex flex-col justify-between group shadow-2xs"
            >
              <div className="relative h-32 w-full bg-[#052a51]">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-cover opacity-60"
                  sizes="300px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#052a51] via-[#052a51]/60 to-transparent p-3 flex flex-col justify-end text-white">
                  <span className="text-[9px] font-black uppercase text-[#F26522] bg-white px-1.5 py-0.5 rounded w-fit">
                    {slide.badge}
                  </span>
                  <h4 className="text-xs font-black line-clamp-1 mt-1">{slide.title}</h4>
                  <p className="text-[10px] text-white/80 line-clamp-1">{slide.subtitle}</p>
                </div>
              </div>

              <div className="p-3 bg-white flex items-center justify-between border-t border-gray-100">
                <span className="text-[10px] font-mono text-gray-400 truncate max-w-[120px]">
                  {slide.href}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditBanner(slide)}
                    className="p-1 text-gray-400 hover:text-[#052a51] rounded-md hover:bg-gray-100"
                  >
                    <Edit size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteBanner(slide.id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 2: Desktop Hero Section ── */}
      <form onSubmit={handleSaveHero} className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-[#052a51]">2. Desktop Hero Section</h3>
            <p className="text-xs text-gray-400">
              Main hero banner displayed for large viewport screens (≥ md)
            </p>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#052a51] hover:bg-[#041f3d] text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-xs"
          >
            <Save size={14} />
            <span>Update Hero Copy</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
              Highlight Badge
            </label>
            <input
              type="text"
              value={heroBadge}
              onChange={(e) => setHeroBadge(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
              Primary Headline
            </label>
            <input
              type="text"
              value={heroHeadline}
              onChange={(e) => setHeroHeadline(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
            Hero Subheadline
          </label>
          <textarea
            rows={2}
            value={heroSubheadline}
            onChange={(e) => setHeroSubheadline(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#F26522]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
              CTA Button Text
            </label>
            <input
              type="text"
              value={heroCtaText}
              onChange={(e) => setHeroCtaText(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
              CTA Destination Link
            </label>
            <input
              type="text"
              value={heroCtaHref}
              onChange={(e) => setHeroCtaHref(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-600 focus:outline-none focus:border-[#F26522]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
              Hero Background Image URL
            </label>
            <input
              type="url"
              value={heroBgImage}
              onChange={(e) => setHeroBgImage(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-600 focus:outline-none focus:border-[#F26522]"
            />
          </div>
        </div>
      </form>

      {/* ── Banner Add/Edit Modal ── */}
      {bannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
              <h3 className="font-black text-[#052a51] text-lg">
                {editingBanner ? "Edit Offer Slide" : "Add New Offer Slide"}
              </h3>
              <button
                onClick={() => setBannerModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                  Badge Tag (e.g. Special Deal)
                </label>
                <input
                  type="text"
                  value={bBadge}
                  onChange={(e) => setBBadge(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                  Headline Title *
                </label>
                <input
                  type="text"
                  required
                  value={bTitle}
                  onChange={(e) => setBTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                  Subtitle Description
                </label>
                <input
                  type="text"
                  value={bSubtitle}
                  onChange={(e) => setBSubtitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 focus:outline-none focus:border-[#F26522]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                    CTA Button
                  </label>
                  <input
                    type="text"
                    value={bCta}
                    onChange={(e) => setBCta(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                    Target Link
                  </label>
                  <input
                    type="text"
                    value={bHref}
                    onChange={(e) => setBHref(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-600 focus:outline-none focus:border-[#F26522]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                  Background Image URL
                </label>
                <input
                  type="url"
                  value={bImage}
                  onChange={(e) => setBImage(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-600 focus:outline-none focus:border-[#F26522]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setBannerModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl shadow-md"
                >
                  {editingBanner ? "Save Slide" : "Add Slide"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
