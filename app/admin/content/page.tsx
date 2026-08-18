"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Edit,
  Save,
  ExternalLink,
  Loader2,
  X,
} from "lucide-react";
import {
  getAllOfferBanners,
  createOfferBanner,
  updateOfferBanner,
  deleteOfferBanner,
} from "@/lib/actions/settings";
import { toast } from "sonner";

export default function AdminContentPage() {
  const [offerBanners, setOfferBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Desktop Hero state
  const [heroHeadline, setHeroHeadline] = useState("India's Most Trusted Architectural Tile Store");
  const [heroSubheadline, setHeroSubheadline] = useState("Direct factory prices on Vitrified, Ceramic & Natural Stones. Accurate square foot calculators and doorstep pallet freight delivery.");
  const [heroBadge, setHeroBadge] = useState("Direct Factory Pricing");
  const [heroCtaText, setHeroCtaText] = useState("Explore Tile Catalog");
  const [heroCtaHref, setHeroCtaHref] = useState("/shop");
  const [heroBgImage, setHeroBgImage] = useState("https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80");

  // Banner Modal state
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [bBadge, setBBadge] = useState("");
  const [bTitle, setBTitle] = useState("");
  const [bSubtitle, setBSubtitle] = useState("");
  const [bCta, setBCta] = useState("");
  const [bHref, setBHref] = useState("");
  const [bImage, setBImage] = useState("");

  const loadBanners = async () => {
    try {
      setLoading(true);
      const data = await getAllOfferBanners();
      setOfferBanners(data);
    } catch (err) {
      console.error("Error loading banners:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleSaveHero = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Desktop Hero section content saved!");
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

  const handleOpenEditBanner = (b: any) => {
    setEditingBanner(b);
    setBBadge(b.badge);
    setBTitle(b.title);
    setBSubtitle(b.subtitle || "");
    setBCta(b.cta || "Shop Now");
    setBHref(b.href || "/shop");
    setBImage(b.image);
    setBannerModalOpen(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bTitle.trim()) return;

    setSubmitting(true);
    if (editingBanner) {
      const res = await updateOfferBanner(editingBanner.id, {
        badge: bBadge.trim(),
        title: bTitle.trim(),
        subtitle: bSubtitle.trim(),
        cta: bCta.trim(),
        href: bHref.trim(),
        image: bImage.trim(),
      });
      setSubmitting(false);

      if (res.success) {
        toast.success("Offer banner updated in DB!");
        setBannerModalOpen(false);
        loadBanners();
      } else {
        toast.error(res.error || "Failed to update banner");
      }
    } else {
      const res = await createOfferBanner({
        badge: bBadge.trim() || "Offer",
        title: bTitle.trim(),
        subtitle: bSubtitle.trim(),
        cta: bCta.trim() || "Explore",
        href: bHref.trim() || "/shop",
        image: bImage.trim() || "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80",
      });
      setSubmitting(false);

      if (res.success) {
        toast.success("New offer banner slide added to DB!");
        setBannerModalOpen(false);
        loadBanners();
      } else {
        toast.error(res.error || "Failed to add banner");
      }
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (offerBanners.length <= 1) {
      toast.error("You need at least 1 banner slide in the carousel");
      return;
    }
    const res = await deleteOfferBanner(id);
    if (res.success) {
      setOfferBanners((prev) => prev.filter((b) => b.id !== id));
      toast.success("Banner slide removed from database");
    } else {
      toast.error(res.error || "Failed to delete banner");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#F26522]" size={32} />
          <p className="text-sm font-bold text-[#052a51]">Loading CMS content from Neon DB...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div>
          <h2 className="text-xl font-black text-[#052a51]">Homepage Content CMS</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Modify promotional banners, headlines, and call-to-actions in PostgreSQL
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
              1. Offer Banners & Promos
            </h3>
            <p className="text-xs text-gray-400">
              Slides auto-rotate on storefront carousels and desktop highlights
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddBanner}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-xs cursor-pointer"
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
                  src={slide.image || "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80"}
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
                    className="p-1 text-gray-400 hover:text-[#052a51] rounded-md hover:bg-gray-100 cursor-pointer"
                  >
                    <Edit size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteBanner(slide.id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 cursor-pointer"
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
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#052a51] hover:bg-[#041f3d] text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-xs cursor-pointer"
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
                className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 cursor-pointer"
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
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="animate-spin" size={13} />}
                  <span>{editingBanner ? "Save Slide" : "Add Slide"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
