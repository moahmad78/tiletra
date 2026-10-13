"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Loader2,
  Save,
  Zap,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Info,
  Sliders,
  Layers,
  Image as ImageIcon,
  IndianRupee,
  Package,
  Plus,
  Trash2,
  Upload,
  Link as LinkIcon,
  Search,
  Store,
  Video,
  ExternalLink,
  Truck,
  RotateCcw,
  FileCheck2,
  Globe,
  Eye,
  Smartphone,
  Monitor,
  CheckCircle2,
  Box,
  X,
  History,
  Pin,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import ImageUploadManager from "@/components/admin/ImageUploadManager";
import UnifiedVariantManager from "@/components/shared/UnifiedVariantManager";
import ColorRadioSelector from "@/components/shared/ColorRadioSelector";
import ProductWebsitePreviewModal from "@/components/shared/ProductWebsitePreviewModal";
import { createProduct, checkDuplicateProduct } from "@/lib/actions/products";
import { getCategories, createCustomCategory } from "@/lib/actions/categories";
import { getVendorProfile, getActiveVendorsForSelection } from "@/lib/actions/vendor";
import type { Category } from "@/lib/data/categories";
import type { ProductVariant } from "@/lib/data/products";
import { UNIT_OF_SALE_OPTIONS, getDefaultUnitOfSale } from "@/lib/units";
import { resolveColorHex, resolveCategoryBulkImage } from "@/lib/catalog";
import { safeSlugify } from "@/lib/validators";
import WeightSelectorInput from "@/components/shared/WeightSelectorInput";

export interface SharedProductUploadWizardProps {
  onSuccessRedirectUrl?: string;
  vendorId?: string | null;
  isAdminOrCpo?: boolean;
  initialListingType?: "single" | "multi";
  headerTitle?: string;
  headerSubtitle?: string;
  headerBadge?: string;
  headerVendorSlot?: React.ReactNode;
}

const GST_SLABS = [0, 5, 12, 18, 28];
const CONDITIONS = ["New", "Refurbished", "Used"] as const;

type CategoryWithChildren = Category & { children?: any[]; attributeSchema?: any };

const DEFAULT_CATEGORY_SCHEMAS: Record<string, Array<{ name: string; type: "select" | "text" | "number"; options?: string[]; required?: boolean; unit?: string }>> = {
  "tiles-stone": [
    { name: "Material", type: "select", options: ["Vitrified", "Ceramic", "Porcelain", "Granite", "Italian Marble", "Natural Stone"], required: true },
    { name: "Thickness", type: "text", options: ["9mm", "10mm", "12mm", "15mm", "18mm", "20mm"], unit: "mm" },
    { name: "Surface Finish", type: "select", options: ["Glossy / Mirror Polish", "Matte Anti-skid", "Satin Silk", "Sugar Finish", "Carving", "Rustic / Textured"] },
    { name: "Usage Area", type: "select", options: ["Floor", "Wall", "Outdoor / Parking", "Bathroom", "Kitchen Countertop", "Elevation"] },
    { name: "Water Absorption", type: "text", unit: "%" },
    { name: "Coverage per Box", type: "number", unit: "sq.ft" },
  ],
  "electrical": [
    { name: "Conductor Material", type: "select", options: ["Pure Copper (EC Grade)", "Aluminum"], required: true },
    { name: "Cable / Wire Gauge", type: "select", options: ["1.0 sq mm", "1.5 sq mm", "2.5 sq mm", "4.0 sq mm", "6.0 sq mm", "10 sq mm"] },
    { name: "Voltage Grade", type: "select", options: ["1100V", "415V", "230V"], unit: "V" },
    { name: "Insulation Type", type: "select", options: ["FR PVC (Flame Retardant)", "FRLS (Low Smoke)", "ZHFR (Zero Halogen)", "XLPE"] },
    { name: "Standard / Certification", type: "select", options: ["IS 694", "ISI Marked", "CE Certified", "RoHS Compliant"] },
  ],
  "hardware-fittings": [
    { name: "Material Grade", type: "select", options: ["SS 304 Grade", "SS 202 Grade", "Solid Brass", "Zinc Alloy", "Mild Steel"], required: true },
    { name: "Finish Type", type: "select", options: ["Antique Brass", "Matt Black PVD", "Satin Nickel", "Chrome Mirror", "Rose Gold PVD"] },
    { name: "Load Capacity", type: "text", unit: "kg" },
    { name: "Mounting Type", type: "select", options: ["Surface Mount", "Mortise / Concealed", "Side Mount Slide"] },
  ],
  "paint-finishes": [
    { name: "Finish Sheen", type: "select", options: ["Matte", "Soft Sheen", "Eggshell", "Gloss", "High Gloss Enamel"], required: true },
    { name: "Coverage Area", type: "text", unit: "sq.ft / litre" },
    { name: "Drying Time", type: "text", unit: "hours" },
    { name: "Dilution Ratio", type: "text", unit: "%" },
    { name: "Washability", type: "select", options: ["High Washable", "Moderate", "Standard"] },
  ],
  "sanitaryware": [
    { name: "Material", type: "select", options: ["Vitreous China Ceramic", "Solid Brass", "SS 304", "Composite Quartz"], required: true },
    { name: "Installation Type", type: "select", options: ["Wall Hung", "Floor Mounted / One Piece", "Table Top", "Under Counter"] },
    { name: "Trap Type", type: "select", options: ["S-Trap 220mm", "S-Trap 300mm", "P-Trap 180mm", "Not Applicable"] },
    { name: "Flushing System", type: "select", options: ["Rimless Tornado Flush", "Dual Flush 3/6L", "Single Flush", "Gravity"] },
  ],
};

export default function SharedProductUploadWizard({
  onSuccessRedirectUrl = "/vendor/products",
  vendorId: initialVendorId = null,
  isAdminOrCpo = false,
  initialListingType = "single",
  headerTitle,
  headerSubtitle,
  headerBadge,
  headerVendorSlot,
}: SharedProductUploadWizardProps) {
  const router = useRouter();

  // ── Step Navigation State (Steps 1 to 8) ──
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitAction, setSubmitAction] = useState<"draft" | "publish" | "review">("publish");

  // ── Vendor Context ──
  const [activeVendorId, setActiveVendorId] = useState<string | null>(initialVendorId);
  const [vendorProfile, setVendorProfile] = useState<any | null>(null);
  const [vendorList, setVendorList] = useState<
    Array<{ id: string; businessName: string; contactPhone?: string | null; category?: string | null; status?: string }>
  >([]);
  const [loadingVendors, setLoadingVendors] = useState<boolean>(false);

  useEffect(() => {
    setActiveVendorId(initialVendorId || null);
  }, [initialVendorId]);

  useEffect(() => {
    if (activeVendorId) {
      getVendorProfile(activeVendorId).then((v) => setVendorProfile(v));
    }
  }, [activeVendorId]);

  useEffect(() => {
    if (isAdminOrCpo) {
      setLoadingVendors(true);
      getActiveVendorsForSelection()
        .then((list) => {
          setVendorList(list || []);
          if (!activeVendorId && list && list.length > 0) {
            setActiveVendorId(list[0].id);
          }
        })
        .catch((err) => console.error("Error fetching active vendors:", err))
        .finally(() => setLoadingVendors(false));
    }
  }, [isAdminOrCpo]);

  // ── STEP 1: Category & Custom Category ──
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [categorySearch, setCategorySearch] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState<boolean>(false);
  const [customCategoryName, setCustomCategoryName] = useState<string>("");
  const [customCategoryDesc, setCustomCategoryDesc] = useState<string>("");
  const [customCategoryImage, setCustomCategoryImage] = useState<string>("");
  const [categoryImageMode, setCategoryImageMode] = useState<"upload" | "link">("upload");
  const [customCategoryUrlInput, setCustomCategoryUrlInput] = useState<string>("");
  const [isUploadingCategoryImage, setIsUploadingCategoryImage] = useState<boolean>(false);
  const categoryFileInputRef = useRef<HTMLInputElement>(null);
  const [isSavingCategory, setIsSavingCategory] = useState<boolean>(false);

  // ── STEP 2: Basic Details & Rate Details ──
  const [title, setTitle] = useState<string>("");
  const [brand, setBrand] = useState<string>("Intrihub");
  const [customBrandInput, setCustomBrandInput] = useState<string>("");
  const [manufacturer, setManufacturer] = useState<string>("");
  const [modelNumber, setModelNumber] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [highlights, setHighlights] = useState<string[]>([
    "Durable & weather-resistant construction",
    "Manufactured to strict industry quality benchmarks",
    "Easy installation for interior and architectural spaces",
    "Backed by manufacturer quality guarantee",
  ]);
  const [newHighlightInput, setNewHighlightInput] = useState<string>("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeywordInput, setNewKeywordInput] = useState<string>("");
  const [countryOfOrigin, setCountryOfOrigin] = useState<string>("India");
  const [condition, setCondition] = useState<"New" | "Refurbished" | "Used">("New");
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState<boolean>(false);

  // Rate & Stock details (3-Tier Pricing: MRP, Selling Price, Cost Price)
  const [mrp, setMrp] = useState<string>("");
  const [sellingPrice, setSellingPrice] = useState<string>("");
  const [costPrice, setCostPrice] = useState<string>("");
  const [gstRate, setGstRate] = useState<number>(18);
  const [hsnCode, setHsnCode] = useState<string>("");
  const [unitOfSale, setUnitOfSale] = useState<string>("box");
  const [isCustomUnit, setIsCustomUnit] = useState<boolean>(false);
  const [customUnitText, setCustomUnitText] = useState<string>("");
  const [stockQuantity, setStockQuantity] = useState<string>("100");
  const [sku, setSku] = useState<string>("");
  const [barcode, setBarcode] = useState<string>("");
  const [lowStockAlert, setLowStockAlert] = useState<string>("10");
  const [minOrderQuantity, setMinOrderQuantity] = useState<string>("1");
  const [maxOrderQuantity, setMaxOrderQuantity] = useState<string>("");
  const [allowBackorders, setAllowBackorders] = useState<boolean>(false);
  const [priceTiers, setPriceTiers] = useState<Array<{ minQuantity: number; price: number }>>([]);
  const [newTierQty, setNewTierQty] = useState<string>("");
  const [newTierPrice, setNewTierPrice] = useState<string>("");

  // ── STEP 3: Images & Media ──
  const [images, setImages] = useState<string[]>([]);
  const [isImageUploading, setIsImageUploading] = useState<boolean>(false);
  const [videoUrl, setVideoUrl] = useState<string>("");

  // ── STEP 4: Sub-category & Dynamic Specs ──
  const [isSubcategoryRevealed, setIsSubcategoryRevealed] = useState<boolean>(false);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>("");
  const [productType, setProductType] = useState<string>("");
  const [isAddingCustomSubcategory, setIsAddingCustomSubcategory] = useState<boolean>(false);
  const [customSubcategoryName, setCustomSubcategoryName] = useState<string>("");
  const [customSubcategoryDesc, setCustomSubcategoryDesc] = useState<string>("");
  const [customSubcategoryImage, setCustomSubcategoryImage] = useState<string>("");
  const [customSubcategoryGallery, setCustomSubcategoryGallery] = useState<string[]>([]);
  const [customSubcategoryImageMode, setCustomSubcategoryImageMode] = useState<"upload" | "link">("upload");
  const [customSubcategoryUrlInput, setCustomSubcategoryUrlInput] = useState<string>("");
  const [isUploadingSubcategoryImage, setIsUploadingSubcategoryImage] = useState<boolean>(false);
  const subcategoryFileInputRef = useRef<HTMLInputElement>(null);
  const [customSubcategoryPrice, setCustomSubcategoryPrice] = useState<string>("");
  const [customSubcategoryMrp, setCustomSubcategoryMrp] = useState<string>("");
  const [customSubcategoryColour, setCustomSubcategoryColour] = useState<string>("");
  const [customSubcategoryLength, setCustomSubcategoryLength] = useState<string>("");
  const [customSubcategoryWidth, setCustomSubcategoryWidth] = useState<string>("");
  const [customSubcategoryHeight, setCustomSubcategoryHeight] = useState<string>("");
  const [customSubcategoryWeight, setCustomSubcategoryWeight] = useState<string>("");
  const [isSavingSubcategory, setIsSavingSubcategory] = useState<boolean>(false);
  const [colorImages, setColorImages] = useState<Record<string, string>>({});
  const [customSubcategoryColorImages, setCustomSubcategoryColorImages] = useState<Record<string, string>>({});
  const [dynamicAttributes, setDynamicAttributes] = useState<Record<string, string>>({});
  const [customSpecs, setCustomSpecs] = useState<Array<{ key: string; value: string }>>([]);
  const [newSpecKey, setNewSpecKey] = useState<string>("");
  const [newSpecValue, setNewSpecValue] = useState<string>("");
  const [lengthCm, setLengthCm] = useState<string>("");
  const [widthCm, setWidthCm] = useState<string>("");
  const [heightCm, setHeightCm] = useState<string>("");
  const [packedWeightKg, setPackedWeightKg] = useState<string>("");
  const [inTheBox, setInTheBox] = useState<string>("");

  // ── Sub-category Image Gallery State & References ──
  const [subcategoryGallery, setSubcategoryGallery] = useState<string[]>([]);
  const [subcatGalleryUrlInput, setSubcatGalleryUrlInput] = useState<string>("");
  const [isUploadingSubcatGallery, setIsUploadingSubcatGallery] = useState<boolean>(false);
  const subcatGalleryFileInputRef = useRef<HTMLInputElement>(null);

  // ── STEP 4: Promotional Badges & Marketing Labels (PRD) ──
  const [showAutoDiscount, setShowAutoDiscount] = useState<boolean>(true);
  const [selectedTags, setSelectedTags] = useState<string[]>(["BEST_SELLER"]);
  const [customBadgeText, setCustomBadgeText] = useState<string>("");
  const [badgeColor, setBadgeColor] = useState<string>("RED");

  // ── STEP 5: Variants Matrix (Decides Single vs Multi) ──
  const [isMultiVariety, setIsMultiVariety] = useState<boolean>(initialListingType === "multi");
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // ── STEP 6: Shipping & Delivery ──
  const [shippingMode, setShippingMode] = useState<string>("instant");
  const [dispatchTimeDays, setDispatchTimeDays] = useState<string>("1");
  const [shippingCoverage, setShippingCoverage] = useState<"all_india" | "custom_pincodes">("all_india");
  const [pincodesServed, setPincodesServed] = useState<string[]>([]);
  const [pincodeInput, setPincodeInput] = useState<string>("");
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState<string>("");
  const [deliveryCharge, setDeliveryCharge] = useState<string>("");
  const [allowScheduledDelivery, setAllowScheduledDelivery] = useState<boolean>(true);
  const [allowCod, setAllowCod] = useState<boolean>(true);
  const [isFragile, setIsFragile] = useState<boolean>(false);
  const [isPerishable, setIsPerishable] = useState<boolean>(false);

  // ── STEP 7: Returns, Warranty & Compliance ──
  const [hasReturnPolicy, setHasReturnPolicy] = useState<boolean>(true);
  const [returnType, setReturnType] = useState<"replacement" | "refund_replacement">("replacement");
  const [returnPolicyDays, setReturnPolicyDays] = useState<string>("7");
  const [replacementAllowed, setReplacementAllowed] = useState<boolean>(true);
  const [warrantyType, setWarrantyType] = useState<string>("brand");
  const [warrantyDuration, setWarrantyDuration] = useState<string>("1 Year");
  const [returnConditions, setReturnConditions] = useState<string>(
    "Item must be returned unused in original packaging with all tags and inserts intact."
  );
  const [complianceAge, setComplianceAge] = useState<boolean>(false);
  const [complianceHazardous, setComplianceHazardous] = useState<boolean>(false);
  const [complianceBattery, setComplianceBattery] = useState<boolean>(false);
  const [complianceLiquid, setComplianceLiquid] = useState<boolean>(false);
  const [certificates, setCertificates] = useState<string[]>([]);
  const [vendorDeclaration, setVendorDeclaration] = useState<boolean>(true);

  // ── PINNED PREFERENCES (PRD Repeat Upload Accelerators & BUG-01 Fix) ──
  const VENDOR_PINNED_PREF_KEY = "intrihub_vendor_pinned_pref";
  const PINNED_CAT_KEY = `intrihub_pinned_category_${activeVendorId || "common"}`;
  const PINNED_LOGISTICS_KEY = `intrihub_pinned_logistics_${activeVendorId || "common"}`;
  const PINNED_RETURNS_KEY = `intrihub_pinned_returns_${activeVendorId || "common"}`;
  const PINNED_BADGES_KEY = `intrihub_pinned_badges_${activeVendorId || "common"}`;

  const [isCategoryPinned, setIsCategoryPinned] = useState<boolean>(false);
  const [isLogisticsPinned, setIsLogisticsPinned] = useState<boolean>(false);
  const [isReturnPinned, setIsReturnPinned] = useState<boolean>(false);
  const [isBadgePinned, setIsBadgePinned] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedCat =
        localStorage.getItem(VENDOR_PINNED_PREF_KEY) ||
        localStorage.getItem("intrihub_vendor_upload_pref") ||
        localStorage.getItem(PINNED_CAT_KEY);
      if (savedCat) {
        const parsed = JSON.parse(savedCat);
        if (parsed.categoryId) {
          setSelectedCategoryId((prev) => prev || parsed.categoryId);
          const subId = parsed.subCategoryId || parsed.subcategoryId;
          if (subId) {
            setSelectedSubcategoryId((prev) => prev || subId);
            setIsSubcategoryRevealed(true);
          }
          setIsCategoryPinned(true);
        }
      }

      const savedLog = localStorage.getItem(PINNED_LOGISTICS_KEY);
      if (savedLog) {
        const parsed = JSON.parse(savedLog);
        if (parsed.shippingMode) setShippingMode(parsed.shippingMode);
        if (parsed.dispatchTimeDays) setDispatchTimeDays(parsed.dispatchTimeDays);
        if (parsed.deliveryCharge) setDeliveryCharge(parsed.deliveryCharge);
        setIsLogisticsPinned(true);
      }

      const savedRet = localStorage.getItem(PINNED_RETURNS_KEY);
      if (savedRet) {
        const parsed = JSON.parse(savedRet);
        if (parsed.hasReturnPolicy !== undefined) setHasReturnPolicy(parsed.hasReturnPolicy);
        if (parsed.returnPolicyDays) setReturnPolicyDays(parsed.returnPolicyDays);
        if (parsed.returnType) setReturnType(parsed.returnType);
        if (parsed.returnConditions) setReturnConditions(parsed.returnConditions);
        setIsReturnPinned(true);
      }

      const savedBadges = localStorage.getItem(PINNED_BADGES_KEY);
      if (savedBadges) {
        const parsed = JSON.parse(savedBadges);
        if (parsed.showAutoDiscount !== undefined) setShowAutoDiscount(parsed.showAutoDiscount);
        if (Array.isArray(parsed.selectedTags)) setSelectedTags(parsed.selectedTags);
        if (parsed.customBadgeText !== undefined) setCustomBadgeText(parsed.customBadgeText);
        if (parsed.badgeColor) setBadgeColor(parsed.badgeColor);
        setIsBadgePinned(true);
      }
    } catch {}
  }, [PINNED_CAT_KEY, PINNED_LOGISTICS_KEY, PINNED_RETURNS_KEY, PINNED_BADGES_KEY]);

  const handleTogglePinCategory = () => {
    if (!selectedCategoryId) {
      toast.error("Please select a Category before pinning as default");
      return;
    }
    if (isCategoryPinned) {
      localStorage.removeItem(VENDOR_PINNED_PREF_KEY);
      localStorage.removeItem("intrihub_vendor_upload_pref");
      localStorage.removeItem(PINNED_CAT_KEY);
      setIsCategoryPinned(false);
      toast.info("Category unpinned from defaults");
    } else {
      const prefPayload = {
        categoryId: selectedCategoryId,
        subCategoryId: selectedSubcategoryId || "",
        subcategoryId: selectedSubcategoryId || "",
        categorySlug: selectedCategory?.slug || "",
        categoryName: selectedCategory?.name || "",
        vendorId: activeVendorId || "",
        pinnedAt: new Date().toISOString(),
      };
      localStorage.setItem(VENDOR_PINNED_PREF_KEY, JSON.stringify(prefPayload));
      localStorage.setItem("intrihub_vendor_upload_pref", JSON.stringify(prefPayload));
      localStorage.setItem(PINNED_CAT_KEY, JSON.stringify(prefPayload));
      setIsCategoryPinned(true);
      toast.success("📌 Pinned as Default Category for fast repeat uploads!");
    }
  };

  // Direct 1-Click Pin / Unpin on specific Category card (CPO & Vendor)
  const handleTogglePinCategoryFor = (catId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const targetCat = categories.find((c) => c.id === catId);
    if (!targetCat) return;

    if (isCategoryPinned && selectedCategoryId === catId) {
      localStorage.removeItem(VENDOR_PINNED_PREF_KEY);
      localStorage.removeItem("intrihub_vendor_upload_pref");
      localStorage.removeItem(PINNED_CAT_KEY);
      setIsCategoryPinned(false);
      toast.info(`"${targetCat.name}" unpinned from default category`);
    } else {
      setSelectedCategoryId(catId);
      setSelectedSubcategoryId("");
      const prefPayload = {
        categoryId: catId,
        subCategoryId: "",
        subcategoryId: "",
        categorySlug: targetCat.slug,
        categoryName: targetCat.name,
        vendorId: activeVendorId || "",
        pinnedAt: new Date().toISOString(),
      };
      localStorage.setItem(VENDOR_PINNED_PREF_KEY, JSON.stringify(prefPayload));
      localStorage.setItem("intrihub_vendor_upload_pref", JSON.stringify(prefPayload));
      localStorage.setItem(PINNED_CAT_KEY, JSON.stringify(prefPayload));
      setIsCategoryPinned(true);
      toast.success(`📌 "${targetCat.name}" pinned as Default Category for fast uploads!`);
    }
  };

  const handleTogglePinLogistics = () => {
    if (isLogisticsPinned) {
      localStorage.removeItem(PINNED_LOGISTICS_KEY);
      setIsLogisticsPinned(false);
      toast.info("Logistics preference unpinned");
    } else {
      localStorage.setItem(
        PINNED_LOGISTICS_KEY,
        JSON.stringify({ shippingMode, dispatchTimeDays, deliveryCharge })
      );
      setIsLogisticsPinned(true);
      toast.success("📌 Pinned as Default Delivery Preference!");
    }
  };

  const handleTogglePinReturns = () => {
    if (isReturnPinned) {
      localStorage.removeItem(PINNED_RETURNS_KEY);
      setIsReturnPinned(false);
      toast.info("Return policy unpinned");
    } else {
      localStorage.setItem(
        PINNED_RETURNS_KEY,
        JSON.stringify({ hasReturnPolicy, returnPolicyDays, returnType, returnConditions })
      );
      setIsReturnPinned(true);
      toast.success("📌 Pinned as Default Return Policy!");
    }
  };

  const handleTogglePinBadges = () => {
    if (isBadgePinned) {
      localStorage.removeItem(PINNED_BADGES_KEY);
      setIsBadgePinned(false);
      toast.info("Promotional badges unpinned from defaults");
    } else {
      localStorage.setItem(
        PINNED_BADGES_KEY,
        JSON.stringify({ showAutoDiscount, selectedTags, customBadgeText, badgeColor })
      );
      setIsBadgePinned(true);
      toast.success("📌 Pinned as Default Promotional Badges!");
    }
  };

  // ── STEP 8: SEO, Preview & Publish (Slug generated automatically in backend) ──
  const currentSlug = useMemo(() => safeSlugify(title), [title]);
  const [metaTitle, setMetaTitle] = useState<string>("");
  const [metaDescription, setMetaDescription] = useState<string>("");
  const [listingStatus, setListingStatus] = useState<"active" | "draft" | "paused">("active");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  // ── Draft Autosave (localStorage) ──
  const AUTOSAVE_KEY = `intrihub_product_upload_draft_${activeVendorId || "common"}`;
  const [savedDraftAvailable, setSavedDraftAvailable] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.title || parsed.selectedCategoryId)) {
          setSavedDraftAvailable(true);
          if (parsed.savedAt) {
            setLastSavedTime(new Date(parsed.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
          }
        }
      }
    } catch {}
  }, [AUTOSAVE_KEY]);

  const handleRestoreDraft = () => {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.title) setTitle(d.title);
      if (d.selectedCategoryId) setSelectedCategoryId(d.selectedCategoryId);
      if (d.selectedSubcategoryId) {
        setSelectedSubcategoryId(d.selectedSubcategoryId);
        setIsSubcategoryRevealed(true);
      }
      if (d.productType) setProductType(d.productType);
      if (d.isMultiVariety !== undefined) setIsMultiVariety(d.isMultiVariety);
      if (d.brand) setBrand(d.brand);
      if (d.customBrandInput) setCustomBrandInput(d.customBrandInput);
      if (d.manufacturer) setManufacturer(d.manufacturer);
      if (d.modelNumber) setModelNumber(d.modelNumber);
      if (d.description) setDescription(d.description);
      if (d.highlights) setHighlights(d.highlights);
      if (d.keywords) setKeywords(d.keywords);
      if (d.countryOfOrigin) setCountryOfOrigin(d.countryOfOrigin);
      if (d.condition) setCondition(d.condition);
      if (d.images) setImages(d.images);
      if (d.videoUrl) setVideoUrl(d.videoUrl);
      if (d.mrp) setMrp(d.mrp);
      if (d.sellingPrice) setSellingPrice(d.sellingPrice);
      if (d.costPrice) setCostPrice(d.costPrice);
      if (d.gstRate !== undefined) setGstRate(d.gstRate);
      if (d.hsnCode) setHsnCode(d.hsnCode);
      if (d.unitOfSale) setUnitOfSale(d.unitOfSale);
      if (d.stockQuantity) setStockQuantity(d.stockQuantity);
      if (d.sku) setSku(d.sku);
      if (d.barcode) setBarcode(d.barcode);
      if (d.dynamicAttributes) setDynamicAttributes(d.dynamicAttributes);
      if (d.colorImages) {
        setColorImages(d.colorImages);
      } else if (d.dynamicAttributes?.colorImages) {
        try {
          setColorImages(JSON.parse(d.dynamicAttributes.colorImages));
        } catch {}
      }
      if (d.customSpecs) setCustomSpecs(d.customSpecs);
      if (d.shippingMode) setShippingMode(d.shippingMode);
      if (d.dispatchTimeDays) setDispatchTimeDays(d.dispatchTimeDays);
      if (d.metaTitle) setMetaTitle(d.metaTitle);
      if (d.metaDescription) setMetaDescription(d.metaDescription);
      if (d.variants) setVariants(d.variants);
      if (d.showAutoDiscount !== undefined) setShowAutoDiscount(d.showAutoDiscount);
      if (Array.isArray(d.selectedTags)) setSelectedTags(d.selectedTags);
      if (d.customBadgeText !== undefined) setCustomBadgeText(d.customBadgeText);
      if (d.badgeColor) setBadgeColor(d.badgeColor);

      setSavedDraftAvailable(false);
      toast.success("Saved draft restored successfully!");
    } catch {
      toast.error("Failed to restore draft");
    }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(AUTOSAVE_KEY);
    setSavedDraftAvailable(false);
    toast.info("Draft discarded");
  };

  const handleSaveDraftManual = () => {
    try {
      const payload = {
        title,
        selectedCategoryId,
        selectedSubcategoryId,
        productType,
        isMultiVariety,
        brand,
        customBrandInput,
        manufacturer,
        modelNumber,
        description,
        highlights,
        keywords,
        countryOfOrigin,
        condition,
        images,
        videoUrl,
        mrp,
        sellingPrice,
        costPrice,
        gstRate,
        hsnCode,
        unitOfSale,
        stockQuantity,
        sku,
        barcode,
        dynamicAttributes,
        colorImages,
        customSpecs,
        shippingMode,
        dispatchTimeDays,
        metaTitle,
        metaDescription,
        variants,
        showAutoDiscount,
        selectedTags,
        customBadgeText,
        badgeColor,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      toast.success("💾 Draft progress saved to local storage!");
    } catch {
      toast.error("Failed to save draft progress");
    }
  };

  // 30s Autosave timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (!title.trim() && !selectedCategoryId) return;
      try {
        const payload = {
          title,
          selectedCategoryId,
          selectedSubcategoryId,
          productType,
          isMultiVariety,
          brand,
          customBrandInput,
          manufacturer,
          modelNumber,
          description,
          highlights,
          keywords,
          countryOfOrigin,
          condition,
          images,
          videoUrl,
          mrp,
          sellingPrice,
          costPrice,
          gstRate,
          hsnCode,
          unitOfSale,
          stockQuantity,
          sku,
          barcode,
          dynamicAttributes,
          customSpecs,
          shippingMode,
          dispatchTimeDays,
          metaTitle,
          metaDescription,
          variants,
          showAutoDiscount,
          selectedTags,
          customBadgeText,
          badgeColor,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } catch {}
    }, 30000);

    return () => clearInterval(timer);
  }, [
    AUTOSAVE_KEY,
    title,
    selectedCategoryId,
    selectedSubcategoryId,
    productType,
    isMultiVariety,
    brand,
    customBrandInput,
    manufacturer,
    modelNumber,
    description,
    highlights,
    keywords,
    images,
    mrp,
    sellingPrice,
    costPrice,
    stockQuantity,
    variants,
    showAutoDiscount,
    selectedTags,
    customBadgeText,
    badgeColor,
  ]);

  // Auto-sync metadata (slug is handled automatically by backend)
  useEffect(() => {
    if (title.trim() && !metaTitle) {
      setMetaTitle(title.trim());
    }
  }, [title, metaTitle]);

  useEffect(() => {
    if (description.trim() && !metaDescription) {
      setMetaDescription(description.slice(0, 155).replace(/\n/g, " "));
    }
  }, [description, metaDescription]);

  // Load Categories on Mount & Auto-read Pinned Category (BUG-01 Fix)
  useEffect(() => {
    getCategories().then((cats) => {
      const typedCats = cats as CategoryWithChildren[];
      setCategories(typedCats);

      try {
        const rawPref =
          localStorage.getItem("intrihub_vendor_pinned_pref") ||
          localStorage.getItem("intrihub_vendor_upload_pref") ||
          localStorage.getItem(`intrihub_pinned_category_${activeVendorId || "common"}`);
        if (rawPref) {
          const pref = JSON.parse(rawPref);
          const subId = pref.subCategoryId || pref.subcategoryId || "";
          const matched = typedCats.find(
            (c) => c.id === pref.categoryId || c.slug === pref.categorySlug || c.slug === pref.categoryId
          );
          if (matched) {
            setSelectedCategoryId(matched.id);
            setIsCategoryPinned(true);
            if (subId) {
              const matchedSub = matched.children?.find(
                (ch: any) => ch.id === subId || ch.slug === subId
              );
              if (matchedSub) {
                setSelectedSubcategoryId(matchedSub.id);
                setIsSubcategoryRevealed(true);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error pre-loading pinned category preference:", err);
      }
    });
  }, [activeVendorId]);

  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCategoryId) || null;
  }, [categories, selectedCategoryId]);

  const selectedSubcategory = useMemo(() => {
    if (!selectedCategory || !selectedSubcategoryId) return null;
    return selectedCategory.children?.find((c: any) => c.id === selectedSubcategoryId) || null;
  }, [selectedCategory, selectedSubcategoryId]);

  // Sub-category gallery sync effect
  useEffect(() => {
    if (selectedSubcategory?.image) {
      setSubcategoryGallery((prev) => {
        if (!prev.includes(selectedSubcategory.image)) {
          return [selectedSubcategory.image, ...prev];
        }
        return prev;
      });
    }
  }, [selectedSubcategory]);

  // Sub-category gallery helper functions
  const handleUploadSubcatGalleryFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsUploadingSubcatGallery(true);
    const addedUrls: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;
        let finalUrl = "";
        try {
          const formData = new FormData();
          if (activeVendorId) formData.append("vendorId", activeVendorId);
          formData.append("file", file);
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          const contentType = res.headers.get("content-type") || "";
          if (res.ok && contentType.includes("application/json")) {
            const data = await res.json();
            if (data.success) {
              finalUrl = data.url || (Array.isArray(data.urls) && data.urls[0]) || "";
            }
          }
        } catch (fetchErr) {
          console.warn("[Upload] Subcat gallery fetch fallback:", fetchErr);
        }

        // Robust client-side fallback if server returned HTML, 401, 500
        if (!finalUrl) {
          finalUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => resolve("");
            reader.readAsDataURL(file);
          });
        }

        if (finalUrl) addedUrls.push(finalUrl);
      }
      if (addedUrls.length > 0) {
        setSubcategoryGallery((prev) => [...prev, ...addedUrls]);
        setImages((prev) => [...prev.filter((img) => img !== "/placeholders/product.svg"), ...addedUrls]);
        toast.success(`Added ${addedUrls.length} photo(s) to sub-category gallery & product gallery!`);
      }
    } catch (err) {
      console.error("Subcategory gallery upload error:", err);
      toast.error("Failed to process sub-category gallery photos");
    } finally {
      setIsUploadingSubcatGallery(false);
    }
  };

  const handleAddSubcatGalleryUrl = () => {
    const trimmed = subcatGalleryUrlInput.trim();
    if (!trimmed) {
      toast.error("Please enter a valid image URL");
      return;
    }
    setSubcategoryGallery((prev) => [...prev, trimmed]);
    setImages((prev) => [...prev.filter((img) => img !== "/placeholders/product.svg"), trimmed]);
    setSubcatGalleryUrlInput("");
    toast.success("Photo added to sub-category gallery!");
  };

  const handleRemoveSubcatGalleryImage = (indexToRemove: number) => {
    setSubcategoryGallery((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    toast.info("Photo removed from sub-category gallery");
  };

  const handleSetSubcatCover = (imgUrl: string) => {
    setSubcategoryGallery((prev) => [imgUrl, ...prev.filter((u) => u !== imgUrl)]);
    setImages((prev) => [imgUrl, ...prev.filter((u) => u !== imgUrl)]);
    toast.success("Set as primary cover photo!");
  };

  const handleSyncSubcatToMain = () => {
    if (subcategoryGallery.length === 0) {
      toast.error("No photos in sub-category gallery to sync");
      return;
    }
    setImages((prev) => {
      const combined = [...prev.filter((img) => img !== "/placeholders/product.svg")];
      subcategoryGallery.forEach((url) => {
        if (!combined.includes(url)) combined.push(url);
      });
      return combined;
    });
    toast.success("All sub-category photos synced to primary product gallery!");
  };

  const activeAttributeSchema = useMemo(() => {
    if (selectedCategory?.attributeSchema && Array.isArray(selectedCategory.attributeSchema)) {
      return selectedCategory.attributeSchema;
    }
    if (selectedCategory?.slug && DEFAULT_CATEGORY_SCHEMAS[selectedCategory.slug]) {
      return DEFAULT_CATEGORY_SCHEMAS[selectedCategory.slug];
    }
    return [];
  }, [selectedCategory]);

  const filteredCategoryList = useMemo(() => {
    const topLevel = categories.filter((c) => !c.parentId);
    const listToFilter = topLevel.length > 0 ? topLevel : categories;
    if (!categorySearch.trim()) return listToFilter;
    const q = categorySearch.toLowerCase().trim();
    return listToFilter.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.children?.some((child: any) => child.name.toLowerCase().includes(q))
    );
  }, [categories, categorySearch]);

  // Upload image helper for custom category
  const handleUploadCategoryImage = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WebP)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file size should be less than 10MB");
      return;
    }

    setIsUploadingCategoryImage(true);
    let finalUrl = "";
    try {
      const formData = new FormData();
      if (activeVendorId) {
        formData.append("vendorId", activeVendorId);
      }
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const contentType = res.headers.get("content-type") || "";
      if (res.ok && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          finalUrl = data.url || (Array.isArray(data.urls) && data.urls[0]) || "";
        }
      }
    } catch (err: any) {
      console.warn("[Upload] Category image server upload issue, using local fallback:", err);
    }

    // Graceful fallback: If server returned non-JSON, 401, or HTML error, read via FileReader
    if (!finalUrl) {
      try {
        finalUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve("");
          reader.readAsDataURL(file);
        });
      } catch {}
    }

    if (finalUrl) {
      setCustomCategoryImage(finalUrl);
      setCustomCategoryUrlInput(finalUrl);
      toast.success("Category photo loaded successfully!");
    } else {
      toast.error("Failed to load category photo");
    }
    setIsUploadingCategoryImage(false);
  };

  // Upload image helper for custom sub-category
  const handleUploadSubcategoryImage = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WebP)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file size should be less than 10MB");
      return;
    }

    setIsUploadingSubcategoryImage(true);
    let finalUrl = "";
    try {
      const formData = new FormData();
      if (activeVendorId) {
        formData.append("vendorId", activeVendorId);
      }
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const contentType = res.headers.get("content-type") || "";
      if (res.ok && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          finalUrl = data.url || (Array.isArray(data.urls) && data.urls[0]) || "";
        }
      }
    } catch (err: any) {
      console.warn("[Upload] Sub-category server upload issue, using local fallback:", err);
    }

    // Graceful fallback: If server returned non-JSON, 401, or HTML error, read via FileReader
    if (!finalUrl) {
      try {
        finalUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve("");
          reader.readAsDataURL(file);
        });
      } catch {}
    }

    if (finalUrl) {
      setCustomSubcategoryImage(finalUrl);
      setCustomSubcategoryUrlInput(finalUrl);
      toast.success("Sub-category photo loaded successfully!");
    } else {
      toast.error("Failed to load sub-category photo");
    }
    setIsUploadingSubcategoryImage(false);
  };

  // ── Custom Category Handlers ──
  const handleSaveCustomCategory = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!customCategoryName.trim()) {
      toast.error("Please enter a category name");
      return;
    }
    setIsSavingCategory(true);
    try {
      const finalImage = customCategoryImage.trim() || customCategoryUrlInput.trim() || undefined;
      const res = await createCustomCategory({
        name: customCategoryName.trim(),
        description: customCategoryDesc.trim() || undefined,
        image: finalImage,
      });
      if (res.success && res.category) {
        toast.success(`Category "${res.category.name}" created and added to categories!`);
        
        const newCatFormatted: CategoryWithChildren = {
          id: res.category.id,
          name: res.category.name,
          slug: res.category.slug,
          description: res.category.description || "",
          image: res.category.image || finalImage || "/images/placeholder-category.svg",
          productCount: 0,
          featured: true,
          parentId: null,
          icon: "Grid",
          children: [],
        };

        // Immediately update categories in state so it appears in the grid without refresh
        setCategories((prev) => [newCatFormatted, ...prev.filter((c) => c.id !== res.category.id)]);
        setSelectedCategoryId(res.category.id);
        setSelectedSubcategoryId("");
        setDynamicAttributes({});
        setCustomCategoryName("");
        setCustomCategoryDesc("");
        setCustomCategoryImage("");
        setCustomCategoryUrlInput("");
        setIsAddingCustomCategory(false);

        // Background refetch with forceRefresh to ensure database cache parity
        try {
          const freshCats = await getCategories({ forceRefresh: true });
          if (freshCats && freshCats.length > 0) {
            const hasNew = freshCats.some((c) => c.id === res.category.id);
            if (hasNew) {
              setCategories(freshCats as CategoryWithChildren[]);
            } else {
              setCategories([newCatFormatted, ...(freshCats as CategoryWithChildren[])]);
            }
          }
        } catch (fetchErr) {
          console.warn("Background categories refresh warning:", fetchErr);
        }
      } else {
        toast.error(res.error || "Failed to create category");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to create custom category");
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleSaveCustomSubcategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customSubcategoryName.trim()) {
      toast.error("Please enter a sub-category name");
      return;
    }
    if (!selectedCategoryId) {
      toast.error("Please select a parent category first");
      return;
    }
    setIsSavingSubcategory(true);
    try {
      const finalSubImage = customSubcategoryImage.trim() || customSubcategoryUrlInput.trim() || undefined;
      const res = await createCustomCategory({
        name: customSubcategoryName.trim(),
        parentId: selectedCategoryId,
        description: customSubcategoryDesc.trim() || undefined,
        image: finalSubImage,
      });
      if (res.success && res.category) {
        toast.success(`Sub-category "${res.category.name}" created and configured!`);
        
        const newChild: any = {
          id: res.category.id,
          name: res.category.name,
          slug: res.category.slug,
          description: res.category.description || "",
          parentId: selectedCategoryId,
          image: res.category.image || finalSubImage || "/placeholders/category.svg",
          productCount: 0,
        };

        // Optimistically add sub-category to selected category's children
        setCategories((prev) =>
          prev.map((cat) => {
            if (cat.id === selectedCategoryId) {
              const existingChildren = cat.children || [];
              const updatedChildren = [newChild, ...existingChildren.filter((ch: any) => ch.id !== res.category.id)];
              return { ...cat, children: updatedChildren };
            }
            return cat;
          })
        );

        setSelectedSubcategoryId(res.category.id);

        // Apply custom rate if provided
        if (customSubcategoryPrice.trim()) {
          setSellingPrice(customSubcategoryPrice.trim());
        }
        if (customSubcategoryMrp.trim()) {
          setMrp(customSubcategoryMrp.trim());
        }

        // Apply custom dimensions if provided
        if (customSubcategoryLength.trim()) {
          setLengthCm(customSubcategoryLength.trim());
        }
        if (customSubcategoryWidth.trim()) {
          setWidthCm(customSubcategoryWidth.trim());
        }
        if (customSubcategoryHeight.trim()) {
          setHeightCm(customSubcategoryHeight.trim());
        }
        if (customSubcategoryWeight.trim()) {
          setPackedWeightKg(customSubcategoryWeight.trim());
        }

        // Apply image if provided and primary image list is empty
        if (finalSubImage) {
          setSubcategoryGallery([finalSubImage]);
          setImages((prev) => {
            if (!prev.includes(finalSubImage)) {
              return [finalSubImage, ...prev.filter((img) => img !== "/placeholders/product.svg")];
            }
            return prev;
          });
        }

        // If colour is specified, bind to attributes and merge color images
        if (customSubcategoryColour.trim()) {
          const mergedColorImages = { ...colorImages, ...customSubcategoryColorImages };
          setColorImages(mergedColorImages);
          setDynamicAttributes((prev) => ({
            ...prev,
            "Colour": customSubcategoryColour.trim(),
            "Color": customSubcategoryColour.trim(),
            ...(Object.keys(mergedColorImages).length > 0 ? { colorImages: JSON.stringify(mergedColorImages) } : {}),
          }));
          const addedImgs = Object.values(customSubcategoryColorImages).filter((img): img is string => Boolean(img));
          if (addedImgs.length > 0) {
            setImages((prev) => {
              const existing = new Set(prev.filter((x) => x !== "/placeholders/product.svg"));
              addedImgs.forEach((img) => existing.add(img));
              return Array.from(existing);
            });
          }
        }
        setCustomSubcategoryColorImages({});

        // Reset subcategory inputs
        setCustomSubcategoryName("");
        setCustomSubcategoryDesc("");
        setCustomSubcategoryImage("");
        setCustomSubcategoryUrlInput("");
        setCustomSubcategoryPrice("");
        setCustomSubcategoryMrp("");
        setCustomSubcategoryColour("");
        setCustomSubcategoryLength("");
        setCustomSubcategoryWidth("");
        setCustomSubcategoryHeight("");
        setCustomSubcategoryWeight("");
        setIsAddingCustomSubcategory(false);

        // Sync with fresh categories
        getCategories().then((freshCats) => {
          if (freshCats && freshCats.length > 0) {
            setCategories(freshCats as CategoryWithChildren[]);
          }
        });
      } else {
        toast.error(res.error || "Failed to create sub-category");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to create custom sub-category");
    } finally {
      setIsSavingSubcategory(false);
    }
  };

  // 3-Tier Pricing & Discount / Margin calculations (PRD Financial Pricing Engine)
  const sellingNum = parseFloat(sellingPrice) || 0;
  const mrpNum = parseFloat(mrp) || 0;
  const costNum = parseFloat(costPrice) || 0;
  const discountPercent = mrpNum > sellingNum && mrpNum > 0 ? Math.round(((mrpNum - sellingNum) / mrpNum) * 100) : 0;
  const netProfit = sellingNum - costNum;
  const profitMarginPercent = sellingNum > 0 ? ((netProfit / sellingNum) * 100).toFixed(1) : "0";

  // Completeness calculation
  const completeness = useMemo(() => {
    const checks = [
      { id: "category", label: "Category selected", done: Boolean(selectedCategoryId), weight: 15, required: true },
      { id: "title", label: "Product title provided (min 5 chars)", done: Boolean(title.trim().length >= 5), weight: 15, required: true },
      { id: "description", label: "Product description provided (min 25 chars)", done: Boolean(description.trim().length >= 25), weight: 10, required: true },
      { id: "brand", label: "Brand identified", done: Boolean(brand && (brand !== "other" || customBrandInput.trim())), weight: 10, required: true },
      { id: "images", label: "At least 1 high-res image added", done: images.filter((img) => img && !img.includes("placeholder")).length >= 1, weight: 15, required: true },
      {
        id: "price",
        label: isMultiVariety ? "Variants configured with prices" : "Selling price configured",
        done: isMultiVariety
          ? variants.length > 0 && variants.every((v) => Number(v.price || v.pricePerBox || 0) > 0)
          : Boolean(sellingNum > 0),
        weight: 15,
        required: true,
      },
      {
        id: "inventory",
        label: "Inventory stock configured",
        done: isMultiVariety
          ? variants.some((v) => Number(v.stockBoxes || 0) > 0)
          : Boolean(parseInt(stockQuantity, 10) >= 0),
        weight: 10,
        required: true,
      },
      {
        id: "seo",
        label: "SEO title & description optimized",
        done: Boolean((metaTitle.trim().length >= 8 || title.trim().length >= 8) && (metaDescription.trim().length >= 25 || description.trim().length >= 25)),
        weight: 5,
        required: false,
      },
      { id: "declaration", label: "Vendor declaration accepted", done: Boolean(vendorDeclaration), weight: 5, required: true },
    ];

    const totalScore = checks.reduce((acc, curr) => (curr.done ? acc + curr.weight : acc), 0);
    return { score: totalScore, checks };
  }, [
    selectedCategoryId,
    title,
    description,
    brand,
    customBrandInput,
    images,
    isMultiVariety,
    variants,
    sellingNum,
    stockQuantity,
    metaTitle,
    metaDescription,
    vendorDeclaration,
  ]);

  // ── Step Validations (7 Steps) ──
  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (isAdminOrCpo && !activeVendorId) {
        toast.error("Please assign a Target Vendor before proceeding *");
        return false;
      }
      if (!selectedCategoryId) {
        toast.error("Please select a Category from the list *");
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!title.trim()) {
        toast.error("Product Title is mandatory *");
        return false;
      }
      if (title.length > 150) {
        toast.error("Product Title exceeds 150 characters limit");
        return false;
      }
      const activeBrand = brand === "other" ? customBrandInput.trim() : brand.trim();
      if (!activeBrand) {
        toast.error("Please provide a Brand name *");
        return false;
      }
      if (!description.trim()) {
        toast.error("Please provide a Product Description *");
        return false;
      }
      if (!isMultiVariety) {
        if (!sellingPrice || sellingNum <= 0) {
          toast.error("Please enter a valid Selling Price greater than ₹0 *");
          return false;
        }
        if (mrpNum > 0 && sellingNum > mrpNum) {
          toast.error("Selling Price cannot exceed MRP Price *");
          return false;
        }
        const stockNum = parseInt(stockQuantity, 10);
        if (isNaN(stockNum) || stockNum < 0) {
          toast.error("Please enter a valid Stock quantity *");
          return false;
        }
      }
      return true;
    }

    if (step === 3) {
      if (isImageUploading) {
        toast.error("Images are currently uploading. Please wait for upload to complete before proceeding.");
        return false;
      }
      const validImages = images.filter(
        (img) => img && img.trim() && img !== "/placeholders/product.svg" && !img.includes("placeholder")
      );
      if (validImages.length === 0) {
        toast.error("At least 1 product image is mandatory *");
        return false;
      }
      return true;
    }

    if (step === 4) {
      if (isMultiVariety) {
        if (variants.length === 0) {
          toast.error("Please generate or add at least 1 variant row *");
          return false;
        }
        const activeCount = variants.filter((v) => v.active !== false).length;
        if (activeCount === 0) {
          toast.error("At least 1 variant must be marked as Active *");
          return false;
        }
        for (const v of variants) {
          const vPrice = Number(v.price || v.pricePerBox || 0);
          if (vPrice <= 0) {
            toast.error(`Variant "${v.variantName || v.size}" must have a price greater than ₹0 *`);
            return false;
          }
          if (v.mrp && Number(v.mrp) < vPrice) {
            toast.error(`Variant "${v.variantName || v.size}" selling price cannot exceed MRP *`);
            return false;
          }
        }
      }
      return true;
    }

    if (step === 5) {
      const dispatchDays = parseInt(dispatchTimeDays, 10);
      if (isNaN(dispatchDays) || dispatchDays < 1) {
        toast.error("Please enter a valid dispatch time in days (min 1 day) *");
        return false;
      }
      return true;
    }

    if (step === 6) {
      if (!vendorDeclaration) {
        toast.error("Please accept the vendor declaration to confirm item accuracy *");
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNextStep = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((prev) => Math.min(7, prev + 1));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleAddHighlight = () => {
    const val = newHighlightInput.trim();
    if (val && !highlights.includes(val)) {
      if (highlights.length >= 8) {
        toast.error("Maximum 8 highlights allowed");
        return;
      }
      setHighlights([...highlights, val]);
      setNewHighlightInput("");
    }
  };

  const handleRemoveHighlight = (idx: number) => {
    setHighlights(highlights.filter((_, i) => i !== idx));
  };

  const handleAddKeyword = () => {
    const val = newKeywordInput.trim();
    if (val && !keywords.includes(val)) {
      if (keywords.length >= 15) {
        toast.error("Maximum 15 search keywords allowed");
        return;
      }
      setKeywords([...keywords, val]);
      setNewKeywordInput("");
    }
  };

  const handleRemoveKeyword = (idx: number) => {
    setKeywords(keywords.filter((_, i) => i !== idx));
  };

  const handleAddCustomSpec = () => {
    if (!newSpecKey.trim() || !newSpecValue.trim()) {
      toast.error("Please provide both specification label and value");
      return;
    }
    setCustomSpecs([...customSpecs, { key: newSpecKey.trim(), value: newSpecValue.trim() }]);
    setNewSpecKey("");
    setNewSpecValue("");
  };

  const handleRemoveCustomSpec = (idx: number) => {
    setCustomSpecs(customSpecs.filter((_, i) => i !== idx));
  };

  // ── Final Form Submission ──
  const handleFinalSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (isAdminOrCpo && !activeVendorId) {
      toast.error("Please select a Target Vendor in Step 1 *");
      setCurrentStep(1);
      return;
    }

    if (!selectedCategoryId) {
      toast.error("Please select a Category in Step 1 *");
      setCurrentStep(1);
      return;
    }

    if (!title.trim() || !brand.trim() || !description.trim()) {
      toast.error("Please complete mandatory Basic Details in Step 2 *");
      setCurrentStep(2);
      return;
    }

    if (isImageUploading) {
      toast.error("Images are still uploading. Please wait for upload to complete.");
      setCurrentStep(3);
      return;
    }

    const validImages = images.filter(
      (img) => img && img.trim() && img !== "/placeholders/product.svg" && !img.includes("placeholder")
    );
    if (validImages.length === 0) {
      toast.error("At least 1 product image is required in Step 3 *");
      setCurrentStep(3);
      return;
    }

    if (isMultiVariety && variants.length === 0) {
      toast.error("Please configure at least 1 variant in Step 5 or disable the variants toggle *");
      setCurrentStep(5);
      return;
    }

    setLoading(true);

    const activeBrand = brand === "other" ? customBrandInput.trim() : brand.trim();
    const finalCategorySlug = selectedSubcategory
      ? selectedSubcategory.slug
      : selectedCategory
      ? selectedCategory.slug
      : "general";
    const finalCategoryName = selectedSubcategory
      ? selectedSubcategory.name
      : selectedCategory
      ? selectedCategory.name
      : "General";

    const formattedAttributes = [
      ...Object.entries(dynamicAttributes)
        .filter(([_, val]) => val && val.trim())
        .map(([key, value]) => ({ key, value })),
      ...customSpecs,
    ];

    const formattedVariants = isMultiVariety
      ? variants.map((v) => ({
          sku: v.sku || null,
          variantName: v.variantName || v.attributeValue || v.size || "Standard",
          size: v.size || "Standard",
          finish: v.finish || "Standard",
          color: v.color || "Standard",
          colorHex: v.colorHex || null,
          image: v.image || (v.color && colorImages[v.color]) || images[0] || null,
          images: Array.isArray(v.images) && v.images.length > 0
            ? v.images
            : (v.image
                ? [v.image]
                : (v.color && colorImages[v.color]
                    ? [colorImages[v.color]]
                    : (images.length > 0 ? [images[0]] : []))),
          unit: v.unit || unitOfSale,
          attributeLabel: v.attributeLabel || "Option",
          attributeValue: v.attributeValue || v.size || "Standard",
          mrp: v.mrp !== undefined && v.mrp !== null ? Number(v.mrp) : mrpNum || null,
          costPrice: v.costPrice !== undefined && v.costPrice !== null ? Number(v.costPrice) : costNum > 0 ? costNum : null,
          price: Number(v.price || v.pricePerBox || sellingNum),
          pricePerBox: Number(v.pricePerBox || v.price || sellingNum),
          pricePerSqft: Number(v.pricePerSqft || v.price || sellingNum),
          sqftPerBox: Number(v.sqftPerBox || 1),
          stockBoxes: Number(v.stockBoxes || 50),
          active: v.active !== undefined ? Boolean(v.active) : true,
          lowStockAlert: v.lowStockAlert !== undefined && v.lowStockAlert !== null ? Number(v.lowStockAlert) : 10,
          minOrderQuantity: v.minOrderQuantity ? Number(v.minOrderQuantity) : 1,
          maxOrderQuantity: v.maxOrderQuantity ? Number(v.maxOrderQuantity) : null,
          isDefault: Boolean(v.isDefault),
          barcode: v.barcode || null,
          allowBackorders,
          tags: v.tags || selectedTags,
          customBadgeText: v.customBadgeText || (customBadgeText.trim() || null),
          badgeColor: v.badgeColor || badgeColor,
          showAutoDiscount: v.showAutoDiscount !== undefined ? v.showAutoDiscount : showAutoDiscount,
        }))
      : [
          {
            variantName: "Standard",
            size: "Standard",
            finish: dynamicAttributes["Surface Finish"] || dynamicAttributes["Finish"] || "Standard",
            color: dynamicAttributes["Colour"] || dynamicAttributes["Color"] || "Standard",
            colorHex: resolveColorHex(dynamicAttributes["Colour"] || dynamicAttributes["Color"] || "Standard"),
            image: (dynamicAttributes["Colour"] && colorImages[dynamicAttributes["Colour"]]) || images[0] || null,
            images: (dynamicAttributes["Colour"] && colorImages[dynamicAttributes["Colour"]])
              ? [colorImages[dynamicAttributes["Colour"]], ...images.filter((i) => i !== colorImages[dynamicAttributes["Colour"]])]
              : (images.length > 0 ? [images[0]] : []),
            unit: unitOfSale,
            attributeLabel: "Option",
            attributeValue: "Standard",
            mrp: mrpNum > 0 ? mrpNum : null,
            costPrice: costNum > 0 ? costNum : null,
            price: sellingNum,
            pricePerBox: sellingNum,
            pricePerSqft: sellingNum,
            sqftPerBox: 1,
            stockBoxes: parseInt(stockQuantity, 10) || 100,
            active: true,
            isDefault: true,
            barcode: barcode || null,
            lowStockAlert: parseInt(lowStockAlert, 10) || 10,
            minOrderQuantity: parseInt(minOrderQuantity, 10) || 1,
            maxOrderQuantity: maxOrderQuantity ? parseInt(maxOrderQuantity, 10) : null,
            allowBackorders,
            tags: selectedTags,
            customBadgeText: customBadgeText.trim() || null,
            badgeColor,
            showAutoDiscount,
          },
        ];

    const targetStatus = submitAction === "draft" ? "draft" : "active";
    const targetApproval = submitAction === "draft" ? "pending" : "approved";

    const res = await createProduct({
      name: title.trim(),
      categoryId: selectedSubcategoryId || selectedCategoryId || null,
      categorySlug: finalCategorySlug,
      categoryName: finalCategoryName,
      subcategory: productType || (selectedSubcategory ? selectedSubcategory.name : null),
      brand: activeBrand,
      modelNumber: modelNumber || null,
      sku: sku || null,
      material: dynamicAttributes["Material"] || "Standard",
      description: description.trim(),
      images,
      videos: videoUrl ? [videoUrl] : [],
      unitOfSale,
      hasVariants: isMultiVariety,
      mrp: mrpNum > 0 ? mrpNum : null,
      costPrice: costNum > 0 ? costNum : null,
      tags: selectedTags,
      customBadgeText: customBadgeText.trim() || null,
      badgeColor,
      showAutoDiscount,
      vendorId: activeVendorId || null,
      manufacturer: manufacturer || null,
      condition,
      highlights,
      keywords,
      countryOfOrigin,
      hsnCode: hsnCode || null,
      gstPercent: gstRate,
      gstRate,
      allowBackorders,
      minOrderQuantity: parseInt(minOrderQuantity, 10) || 1,
      maxOrderQuantity: maxOrderQuantity ? parseInt(maxOrderQuantity, 10) : null,
      priceTiers: priceTiers.map((pt) => ({ minQuantity: pt.minQuantity, price: pt.price })),
      variants: formattedVariants,
      attributes: formattedAttributes,
      dimensions: lengthCm || widthCm || heightCm || packedWeightKg ? {
        lengthCm: lengthCm ? parseFloat(lengthCm) : undefined,
        widthCm: widthCm ? parseFloat(widthCm) : undefined,
        heightCm: heightCm ? parseFloat(heightCm) : undefined,
        packedWeightKg: packedWeightKg ? parseFloat(packedWeightKg) : undefined,
      } : null,
      inTheBox: inTheBox || null,
      isBulky: shippingMode === "heavy_bulky" || shippingMode === "heavy_bulk",
      shippingMode,
      dispatchTimeDays: parseInt(dispatchTimeDays, 10) || 2,
      pincodesServed: shippingCoverage === "custom_pincodes" ? pincodesServed : [],
      freeDeliveryAbove: freeDeliveryAbove ? parseFloat(freeDeliveryAbove) : null,
      deliveryCharge: deliveryCharge ? parseFloat(deliveryCharge) : null,
      allowScheduledDelivery,
      allowCod,
      isFragile,
      isPerishable,
      returnPolicyDays: hasReturnPolicy ? (parseInt(returnPolicyDays, 10) || 7) : 0,
      replacementAllowed: hasReturnPolicy ? (returnType === "replacement" || returnType === "refund_replacement") : false,
      warrantyType,
      warrantyDuration,
      returnConditions: hasReturnPolicy
        ? returnConditions
        : "No returns or refunds accepted for this item.",
      complianceDeclarations: {
        ageRestriction: complianceAge,
        hazardous: complianceHazardous,
        hasBattery: complianceBattery,
        isLiquid: complianceLiquid,
      },
      certificates,
      vendorDeclaration,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      status: targetStatus,
      approvalStatus: targetApproval,
    });

    setLoading(false);

    if (res.success) {
      localStorage.removeItem(AUTOSAVE_KEY);
      toast.success(
        submitAction === "draft"
          ? `Draft saved: "${title}"`
          : `🎉 Product "${title}" is now LIVE on store!`
      );
      router.push(onSuccessRedirectUrl);
    } else {
      toast.error(res.error || "Failed to create product listing");
    }
  };

  const stepsList = [
    { num: 1, label: "Category", icon: Sliders },
    { num: 2, label: "Basic Details & Rate", icon: Info },
    { num: 3, label: "Images & Sub-category", icon: ImageIcon },
    { num: 4, label: "Variants & Badges", icon: Tag },
    { num: 5, label: "Shipping & Delivery", icon: Truck },
    { num: 6, label: "Returns & Compliance", icon: FileCheck2 },
    { num: 7, label: "SEO & Publish", icon: Eye },
  ];

  return (
    <form
      onSubmit={handleFinalSubmit}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
          e.preventDefault();
        }
      }}
      className="space-y-6 max-w-5xl mx-auto pb-24 transition-all"
    >
      {/* ── Saved Draft Restore Notification Banner ── */}
      {savedDraftAvailable && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-3xl flex items-center justify-between gap-4 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-2xl bg-amber-200/80 text-amber-800 flex items-center justify-center shrink-0">
              <History size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">Unsaved listing draft found in your browser</p>
              <p className="text-[11px] text-amber-700">
                Last autosaved at {lastSavedTime || "earlier"}. Would you like to restore your progress?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Restore Progress
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="p-1.5 text-amber-700 hover:text-amber-900 rounded-xl hover:bg-amber-100 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Top Header & Wizard Controls ── */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            href={onSuccessRedirectUrl}
            className="p-2.5 rounded-2xl border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#052a51]">
                {headerTitle || (isAdminOrCpo ? "Add New Catalog Product" : "Item Upload Wizard")}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                {headerBadge || (isAdminOrCpo ? "Ready" : "7-Step Unified Architecture")}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {headerSubtitle ||
                (vendorProfile?.businessName
                  ? `Assigning to vendor: ${vendorProfile.businessName}`
                  : "One shared listing engine with full catalog specs across Vendor, CPO, & Admin")}
            </p>
          </div>
        </div>

        {/* Global Save Draft & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {headerVendorSlot}

          {/* 🌐 Preview on Website Modal Button */}
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-4 py-2.5 bg-white border border-gray-300 hover:border-[#F26522] hover:text-[#F26522] text-gray-700 text-xs font-bold rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 active:scale-95"
            title="Preview how this product will look on the customer website"
          >
            <Eye size={15} className="text-[#F26522]" />
            <span>Preview on Website</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSubmitAction("draft");
              handleFinalSubmit();
            }}
            disabled={loading}
            className="px-4 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-2xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {loading && submitAction === "draft" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            <span>Save Draft</span>
          </button>

          <button
            type="submit"
            onClick={() => setSubmitAction("publish")}
            disabled={loading || isImageUploading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
            title="Make product live immediately on storefront"
          >
            {loading && submitAction === "publish" ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} className="fill-white" />}
            <span>Make Product Live 🚀</span>
          </button>
        </div>
      </div>

      {/* ── Progress Meter & Autosave Badge ── */}
      <div className="bg-white px-5 py-3.5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-[#052a51]">
            Step {currentStep} of 7: <span className="text-[#F26522]">{stepsList[currentStep - 1]?.label}</span>
          </span>
          <div className="w-32 bg-gray-100 h-2 rounded-full overflow-hidden hidden sm:block">
            <div
              className="bg-[#F26522] h-full transition-all duration-300 rounded-full"
              style={{ width: `${Math.round((currentStep / 7) * 100)}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-4 text-gray-400 text-[11px]">
          {lastSavedTime && (
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 size={12} /> Autosaved {lastSavedTime}
            </span>
          )}
          <span className="font-bold text-gray-700">Listing Completeness: {completeness.score}%</span>
        </div>
      </div>

      {/* ── Stepper Navigation Bar (7 Steps Grid) ── */}
      <div className="bg-white p-3.5 sm:p-5 rounded-3xl border border-gray-200 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-2.5">
          {stepsList.map((st) => {
            const isCompleted = currentStep > st.num;
            const isCurrent = currentStep === st.num;

            return (
              <button
                key={st.num}
                type="button"
                onClick={() => {
                  if (st.num < currentStep || validateStep(currentStep)) {
                    setCurrentStep(st.num);
                  }
                }}
                className={`p-2 sm:p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                  isCurrent
                    ? "bg-[#052a51] text-white border-[#052a51] shadow-xs"
                    : isCompleted
                    ? "bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100/60"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-xl flex items-center justify-center shrink-0 text-[10px] font-black ${
                    isCurrent
                      ? "bg-[#F26522] text-white"
                      : isCompleted
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300"
                  }`}
                >
                  {isCompleted ? <Check size={12} /> : st.num}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold block truncate leading-tight" title={st.label}>
                    {st.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Workspace: Full Width Step Form ── */}
      <div className="w-full space-y-6">
          {/* ── STEP 1: CATEGORY (FIRST FIELD) ── */}
          {currentStep === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-2xs space-y-6 animate-in fade-in">
          {/* ── STEP 1A: VENDOR OWNERSHIP & STORE MAPPING ── */}
          {isAdminOrCpo ? (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border border-blue-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-[#052a51] flex items-center gap-1.5">
                    <Store size={15} className="text-[#F26522]" />
                    Target Vendor Assignment (Order Routing Mapping) <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    Select the target merchant account. Customer orders for this item will route directly to this vendor&apos;s Business App.
                  </p>
                </div>
                <Link
                  href="/admin/vendors"
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#F26522] hover:underline shrink-0"
                >
                  <Plus size={13} />
                  <span>+ Add New Vendor</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <select
                    id="target-vendor-dropdown"
                    value={activeVendorId || ""}
                    onChange={(e) => setActiveVendorId(e.target.value)}
                    className="w-full h-12 px-3.5 rounded-2xl border border-gray-300 bg-white text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522] shadow-2xs cursor-pointer"
                  >
                    <option value="">-- Select Target Vendor (Required) --</option>
                    {vendorList.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.businessName} {v.contactPhone ? `(${v.contactPhone})` : ""} {v.category ? `• ${v.category}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="h-12 px-3.5 rounded-2xl bg-white/90 border border-blue-200 flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">Mapped Vendor ID:</span>
                  <span className="font-mono font-bold text-[#052a51] truncate max-w-[200px]">
                    {activeVendorId ? activeVendorId : <span className="text-amber-600 font-sans">None selected</span>}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#F26522] flex items-center justify-center shrink-0">
                  <Store size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#052a51]">Vendor Ownership Confirmed</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                      🔒 Private Inventory Isolation
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Tagged to account: <span className="font-semibold text-[#052a51]">{vendorProfile?.businessName || "Your Vendor Store"}</span>{" "}
                    {activeVendorId && <span className="font-mono text-gray-400">({activeVendorId})</span>}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 shrink-0">
                ⚡ Orders route directly to your Business App
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div>
              <h2 className="text-lg font-black text-[#052a51] flex items-center gap-2">
                <Sliders size={20} className="text-[#F26522]" />
                1. Select Product Category <span className="text-red-500">*</span>
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Choose the architectural category for this item or create a custom reusable category.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingCustomCategory(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-50 border border-orange-200 text-[#F26522] hover:bg-[#F26522] hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              <Plus size={14} />
              <span>+ Add Custom Category</span>
            </button>
          </div>

          {/* 📌 Fast-Upload Pinned Category Banner (BUG-01 Fix) */}
          {isCategoryPinned && selectedCategory && (
            <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-900 shadow-2xs animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#F26522] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Pin size={14} className="fill-white" />
                </div>
                <div>
                  <div className="font-black text-gray-900 flex items-center gap-1.5">
                    <span>⭐ Default Upload Category Active</span>
                    <span className="text-[10px] bg-amber-200/80 text-amber-900 font-extrabold px-1.5 py-0.2 rounded uppercase">
                      Pinned Default
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800/90 mt-0.5">
                    Default Selection: <strong>{selectedCategory.name}</strong>
                    {selectedSubcategory && <span> ➔ <strong>{selectedSubcategory.name}</strong></span>}. Fast upload mode active.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-3 py-1.5 rounded-xl bg-[#052a51] text-white text-[11px] font-bold hover:bg-[#093d75] transition-all cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                  title="Skip Step 1 and proceed directly to Product Title & Rate details"
                >
                  <span>Skip to Step 2</span>
                  <ArrowRight size={13} />
                </button>
                <button
                  type="button"
                  onClick={handleTogglePinCategory}
                  className="px-2.5 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-800 text-[11px] font-bold hover:bg-amber-100 hover:text-rose-600 transition-colors cursor-pointer active:scale-95"
                  title="Unpin / Reset Default category preference"
                >
                  Unpin Default
                </button>
              </div>
            </div>
          )}

          {/* Search bar */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter categories (e.g. Tiles, Electrical, Hardware, Paints)..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#F26522] bg-gray-50/50"
            />
          </div>

          {/* Category Grid Selection */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3.5 max-h-[420px] overflow-y-auto p-2 border border-gray-100 rounded-2xl bg-gray-50/40">
            {filteredCategoryList.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-400">
                <ImageIcon size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-xs font-bold text-gray-600">No categories found matching &quot;{categorySearch}&quot;</p>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomCategory(true)}
                  className="mt-3 px-3.5 py-1.5 bg-[#F26522] text-white text-xs font-bold rounded-xl hover:bg-[#d95517] transition-colors cursor-pointer"
                >
                  + Create &quot;{categorySearch}&quot; as New Category
                </button>
              </div>
            ) : (
              filteredCategoryList.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                const isThisPinned = isCategoryPinned && selectedCategoryId === cat.id;
                const categoryCoverImage = resolveCategoryBulkImage(cat.image, cat.slug, cat.name);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      setSelectedSubcategoryId("");
                      setDynamicAttributes({});
                    }}
                    className={`group relative rounded-2xl border p-2.5 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "border-[#F26522] bg-white ring-2 ring-[#F26522] shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-2xs"
                    }`}
                  >
                    {/* Category Image Container */}
                    <div className="relative w-full aspect-16/10 rounded-xl overflow-hidden bg-gray-100 mb-2 shrink-0 border border-gray-100">
                      <img
                        src={categoryCoverImage}
                        alt={cat.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          if (target.src !== "/images/placeholder-category.svg") {
                            target.src = "/images/placeholder-category.svg";
                          }
                        }}
                      />

                      {/* 📌 Quick 1-Click Pin / Default Button on Card */}
                      <button
                        type="button"
                        onClick={(e) => handleTogglePinCategoryFor(cat.id, e)}
                        title={isThisPinned ? "Click to unpin default category" : "📌 Pin as Default Category"}
                        className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-md transition-all cursor-pointer z-10 ${
                          isThisPinned
                            ? "bg-amber-500 text-white ring-2 ring-white"
                            : "bg-white/90 hover:bg-white text-gray-700 hover:text-[#F26522] border border-gray-200"
                        }`}
                      >
                        <Pin size={10} className={isThisPinned ? "fill-white" : ""} />
                        <span>{isThisPinned ? "✓ Default" : "Pin Default"}</span>
                      </button>

                      {/* Selection Checkmark Badge */}
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#F26522] text-white flex items-center justify-center shadow-md animate-in zoom-in-75 duration-150">
                          <Check size={13} strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    {/* Category Text & Listing Stats */}
                    <div className="min-w-0 w-full px-0.5">
                      <span className={`text-xs font-black block truncate transition-colors ${
                        isSelected ? "text-[#052a51]" : "text-gray-900 group-hover:text-[#F26522]"
                      }`}>
                        {cat.name}
                      </span>
                      <div className="flex items-center justify-between mt-1 text-[10px]">
                        <span className="text-gray-600 font-medium">
                          {cat.productCount ?? 0} items
                        </span>
                        {isSelected && (
                          <span className="font-black text-[#F26522] uppercase tracking-wider text-[9px]">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {selectedCategory && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900 shadow-2xs">
              <div className="flex items-center gap-3">
                <img
                  src={resolveCategoryBulkImage(selectedCategory.image, selectedCategory.slug, selectedCategory.name)}
                  alt={selectedCategory.name}
                  className="w-11 h-11 rounded-xl object-cover border border-emerald-200 bg-white shrink-0 shadow-2xs"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (target.src !== "/images/placeholder-category.svg") {
                      target.src = "/images/placeholder-category.svg";
                    }
                  }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span className="font-bold text-gray-900">
                      Active: <strong className="text-emerald-800">{selectedCategory.name}</strong>
                    </span>
                    {selectedSubcategory && (
                      <span className="text-[11px] bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded-md">
                        ↳ {selectedSubcategory.name}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-emerald-700/80 mt-0.5 line-clamp-1">
                    {selectedCategory.description || `${selectedCategory.name} products & catalog materials`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={handleTogglePinCategory}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                    isCategoryPinned
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                  }`}
                  title="Pin this category as default for future product listings"
                >
                  <Pin size={13} className={isCategoryPinned ? "fill-white" : ""} />
                  <span>{isCategoryPinned ? "✓ Pinned Default Category" : "📌 Pin as Default"}</span>
                </button>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100/80 px-2 py-1 rounded-md shrink-0">
                  slug: {selectedCategory.slug}
                </span>
              </div>
            </div>
          )}

          {/* Custom Category Modal */}
          {isAddingCustomCategory && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                    <Sliders size={18} className="text-[#F26522]" />
                    Add Custom Category
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCustomCategory(false);
                      setCustomCategoryImage("");
                      setCustomCategoryUrlInput("");
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Acoustic Wall Panels, EV Chargers"
                      value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#F26522]"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Description (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Brief description of materials in this category..."
                      value={customCategoryDesc}
                      onChange={(e) => setCustomCategoryDesc(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#F26522]"
                    />
                  </div>

                  {/* Category Image Section (Upload & Link) */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ImageIcon size={14} className="text-[#F26522]" />
                        <span>Category Image</span>
                      </span>
                      <span className="text-[10px] font-normal text-gray-500">Upload from device or paste link</span>
                    </label>

                    {/* Image Mode Switcher */}
                    <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl w-fit">
                      <button
                        type="button"
                        onClick={() => setCategoryImageMode("upload")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          categoryImageMode === "upload"
                            ? "bg-white text-gray-900 shadow-2xs"
                            : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        <Upload size={13} />
                        <span>Upload File</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryImageMode("link")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          categoryImageMode === "link"
                            ? "bg-white text-gray-900 shadow-2xs"
                            : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        <LinkIcon size={13} />
                        <span>Image Link</span>
                      </button>
                    </div>

                    {/* Image Preview Box if attached */}
                    {customCategoryImage ? (
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-orange-50/60 border border-orange-200 animate-in fade-in">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white border border-orange-200 shrink-0 shadow-2xs">
                          <img
                            src={customCategoryImage}
                            alt="Category preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/images/placeholder-category.svg";
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            <p className="text-xs font-bold text-gray-900 truncate">Image Attached</p>
                          </div>
                          <p className="text-[10px] text-gray-500 truncate mt-0.5 font-mono">{customCategoryImage}</p>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomCategoryImage("");
                              setCustomCategoryUrlInput("");
                            }}
                            className="mt-1.5 text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={12} /> Remove / Change Image
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {categoryImageMode === "upload" && (
                          <div>
                            <input
                              type="file"
                              ref={categoryFileInputRef}
                              accept="image/png,image/jpeg,image/webp,image/svg+xml"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadCategoryImage(file);
                              }}
                              className="hidden"
                            />
                            <div
                              onClick={() => categoryFileInputRef.current?.click()}
                              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${
                                isUploadingCategoryImage
                                  ? "border-orange-300 bg-orange-50/40"
                                  : "border-gray-300 hover:border-[#F26522] hover:bg-orange-50/20"
                              }`}
                            >
                              {isUploadingCategoryImage ? (
                                <div className="py-2 flex flex-col items-center justify-center gap-2">
                                  <Loader2 size={22} className="animate-spin text-[#F26522]" />
                                  <span className="text-xs font-bold text-gray-700">Uploading category photo...</span>
                                </div>
                              ) : (
                                <div className="py-1 flex flex-col items-center justify-center gap-1.5">
                                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#F26522] flex items-center justify-center">
                                    <Upload size={18} />
                                  </div>
                                  <p className="text-xs font-bold text-gray-800">
                                    Click to choose photo from device or drag &amp; drop
                                  </p>
                                  <p className="text-[10px] text-gray-400">
                                    PNG, JPG, WebP, SVG up to 10MB
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {categoryImageMode === "link" && (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <input
                                type="url"
                                placeholder="Paste image URL (https://... or /images/...)"
                                value={customCategoryUrlInput}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCustomCategoryUrlInput(val);
                                  const trimmed = val.trim();
                                  if (trimmed && (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/"))) {
                                    setCustomCategoryImage(trimmed);
                                  }
                                }}
                                onBlur={(e) => {
                                  const trimmed = e.target.value.trim();
                                  if (trimmed) setCustomCategoryImage(trimmed);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const trimmed = customCategoryUrlInput.trim();
                                    if (!trimmed) {
                                      toast.error("Please enter a valid image URL");
                                      return;
                                    }
                                    setCustomCategoryImage(trimmed);
                                  }
                                }}
                                className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-900 focus:outline-none focus:border-[#F26522]"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const trimmed = customCategoryUrlInput.trim();
                                  if (!trimmed) {
                                    toast.error("Please enter a valid image URL");
                                    return;
                                  }
                                  setCustomCategoryImage(trimmed);
                                  toast.success("Image link attached!");
                                }}
                                className="px-4 py-2 bg-[#052a51] hover:bg-[#031d38] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                              >
                                Apply Link
                              </button>
                            </div>

                            {/* Quick Preset Chips */}
                            <div className="pt-1">
                              <span className="text-[10px] font-bold text-gray-400 block mb-1">
                                Quick Preset Photos:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {[
                                  { label: "Tiles & Stone", url: "/images/categories/cat-tiles-stone.jpg" },
                                  { label: "Electrical", url: "/images/categories/cat-electrical.jpg" },
                                  { label: "Plumbing", url: "/images/categories/cat-plumbing.jpg" },
                                  { label: "Floor Tiles", url: "/images/categories/cat-floor-tiles.jpg" },
                                  { label: "Lighting", url: "/images/categories/cat-lighting.jpg" },
                                  { label: "Paints", url: "/images/categories/cat-paint-finishes.jpg" },
                                ].map((preset) => (
                                  <button
                                    key={preset.label}
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setCustomCategoryUrlInput(preset.url);
                                      setCustomCategoryImage(preset.url);
                                      toast.success(`Selected "${preset.label}" photo`);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-orange-100 text-gray-700 hover:text-[#F26522] border border-gray-200 hover:border-orange-300 text-[10px] font-bold transition-colors cursor-pointer"
                                  >
                                    {preset.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCustomCategory(false);
                      setCustomCategoryImage("");
                      setCustomCategoryUrlInput("");
                    }}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCustomCategory}
                    disabled={isSavingCategory || isUploadingCategoryImage}
                    className="px-5 py-2.5 bg-[#F26522] hover:bg-[#d95517] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingCategory ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Plus size={14} strokeWidth={2.5} />
                    )}
                    <span>+ Add Category</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: BASIC DETAILS & RATE DETAILS ── */}
      {currentStep === 2 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-2xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-black text-[#052a51] flex items-center gap-2">
              <Info size={20} className="text-[#F26522]" />
              2. Basic Details &amp; Rate Details
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Provide product title, brand, description, 3-tier financial pricing (MRP, Selling Price, Cost Rate), and inventory stock.
            </p>
          </div>

          {/* Duplicate Listing Warning Banner */}
          {duplicateWarning && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertTriangle size={16} className="text-amber-600 shrink-0" />
              <span>{duplicateWarning}</span>
            </div>
          )}

          {/* Product Title & Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700">
                  Product Title / Name <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-gray-400">{title.length}/150</span>
              </div>
              <input
                type="text"
                maxLength={150}
                placeholder="e.g. Kajaria Royal Statuario 600x1200mm Vitrified Floor Tile"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs font-bold focus:outline-none focus:border-[#F26522]"
              />
              {currentSlug && (
                <div className="flex items-center gap-1.5 pt-1 text-[11px] text-gray-500 font-mono">
                  <span className="inline-flex items-center gap-1 text-[#052a51] font-bold text-[10px]">
                    <Zap size={11} className="text-[#F26522] fill-[#F26522]" />
                    Auto Slug:
                  </span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-bold border border-gray-200 truncate">
                    /product/{currentSlug}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Heading / Subtitle / Model Code</label>
              <input
                type="text"
                placeholder="e.g. KAJ-RS-6012"
                value={modelNumber}
                onChange={(e) => setModelNumber(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#F26522]"
              />
            </div>
          </div>

          {/* Brand & Manufacturer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700">
                  Brand Name <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-gray-400">Select or type custom brand</span>
              </div>
              <input
                type="text"
                placeholder="e.g. Kajaria, Havells, Asian Paints, Intrihub"
                value={brand === "other" ? customBrandInput : brand}
                onChange={(e) => {
                  setBrand("other");
                  setCustomBrandInput(e.target.value);
                }}
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#F26522]"
              />

              {/* Quick Preset Brand Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["Kajaria", "Havells", "Asian Paints", "Jaquar", "IntriHub", "Cera", "Finolex"].map((bName) => (
                  <button
                    key={bName}
                    type="button"
                    onClick={() => {
                      setBrand("other");
                      setCustomBrandInput(bName);
                      toast.info(`Selected brand: ${bName}`);
                    }}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer border ${
                      (brand === "other" ? customBrandInput : brand) === bName
                        ? "bg-[#052a51] text-white border-[#052a51]"
                        : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-orange-50 hover:text-[#F26522]"
                    }`}
                  >
                    {bName}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Manufacturer / Brand Owner</label>
              <input
                type="text"
                placeholder="e.g. Kajaria Ceramics Ltd."
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#F26522]"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">
              Product Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Detailed description of features, technical standards, and applications..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#F26522]"
            />
          </div>

          {/* Rate Details: Pricing, Unit of Sale & Stock */}
          <div className="p-5 rounded-3xl bg-gray-50/70 border border-gray-200 space-y-4">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <IndianRupee size={15} className="text-[#F26522]" />
              Rate Details &amp; Base Inventory
            </h3>

            {/* 3-Tier Financial Pricing Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">MRP (Max Retail) ₹</label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 1499"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs font-mono font-bold focus:outline-none focus:border-[#F26522] bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Selling Price ₹ <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 1199"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs font-mono font-black text-[#052a51] focus:outline-none focus:border-[#F26522] bg-white"
                />
                {discountPercent > 0 && (
                  <span className="text-[10px] text-emerald-600 font-bold block">{discountPercent}% OFF MRP</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Cost / Purchase Rate ₹
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 850"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs font-mono font-semibold text-gray-700 focus:outline-none focus:border-[#F26522] bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700">
                    Unit of Sale <span className="text-red-500">*</span>
                  </label>
                  {isCustomUnit && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomUnit(false);
                        setUnitOfSale("box");
                      }}
                      className="text-[10px] text-[#F26522] hover:underline font-bold cursor-pointer"
                    >
                      Choose from presets
                    </button>
                  )}
                </div>
                {!isCustomUnit ? (
                  <select
                    value={unitOfSale}
                    onChange={(e) => {
                      if (e.target.value === "__custom__") {
                        setIsCustomUnit(true);
                        setCustomUnitText("");
                      } else {
                        setUnitOfSale(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#F26522] bg-white cursor-pointer"
                  >
                    {UNIT_OF_SALE_OPTIONS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                    <option value="__custom__">✏️ Custom / Type your own unit...</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. Roll, Bundle, Ton, Drum, Pallet..."
                    value={customUnitText}
                    onChange={(e) => {
                      setCustomUnitText(e.target.value);
                      setUnitOfSale(e.target.value.trim() || "piece");
                    }}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#F26522] bg-white"
                    autoFocus
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Stock Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs font-mono font-bold focus:outline-none focus:border-[#F26522] bg-white"
                />
              </div>
            </div>

            {/* Admin / CPO Real-Time Profit Calculation (Strictly Hidden for Vendors) */}
            {isAdminOrCpo && sellingNum > 0 && costNum > 0 ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider">
                    ⚡ Admin Profit Engine
                  </span>
                  <span className="text-emerald-900 font-bold">
                    Net Profit: <strong className="font-mono text-emerald-700">₹{netProfit.toFixed(2)}</strong>
                  </span>
                  <span className="text-emerald-300">|</span>
                  <span className="text-emerald-900 font-bold">
                    Profit Margin: <strong className="font-mono text-emerald-700">{profitMarginPercent}%</strong>
                  </span>
                  {discountPercent > 0 && (
                    <>
                      <span className="text-emerald-300">|</span>
                      <span className="text-emerald-900 font-bold">
                        Customer Discount: <strong className="font-mono text-emerald-700">{discountPercent}%</strong>
                      </span>
                    </>
                  )}
                </div>
                <span className="text-[10px] text-emerald-700 italic">
                  (Confidential: Margin metrics are hidden from Vendors)
                </span>
              </div>
            ) : !isAdminOrCpo && mrpNum > 0 && sellingNum > 0 ? (
              <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-gray-600 font-medium">Customer Pricing Offer:</span>
                <span className="font-bold text-emerald-700">
                  {discountPercent > 0 ? `${discountPercent}% Customer Discount vs MRP` : "Selling at MRP"}
                </span>
              </div>
            ) : null}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">SKU</label>
                <input
                  type="text"
                  placeholder="e.g. IH-TILE-001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-mono bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">GST Slab</label>
                <select
                  value={gstRate}
                  onChange={(e) => setGstRate(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs bg-white cursor-pointer"
                >
                  {GST_SLABS.map((s) => (
                    <option key={s} value={s}>
                      {s}% GST
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">HSN Code</label>
                <input
                  type="text"
                  placeholder="e.g. 6907, 8544"
                  value={hsnCode}
                  onChange={(e) => setHsnCode(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-mono bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Low Stock Alert</label>
                <input
                  type="number"
                  min="1"
                  value={lowStockAlert}
                  onChange={(e) => setLowStockAlert(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* Highlights & Keywords */}
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">Product Highlights</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a bullet point..."
                  value={newHighlightInput}
                  onChange={(e) => setNewHighlightInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddHighlight();
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#F26522]"
                />
                <button
                  type="button"
                  onClick={handleAddHighlight}
                  className="px-4 py-2 bg-[#052a51] text-white text-xs font-bold rounded-2xl cursor-pointer"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {highlights.map((h, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium"
                  >
                    {h}
                    <button type="button" onClick={() => handleRemoveHighlight(i)} className="text-gray-400 hover:text-red-600">
                      <Trash2 size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">Search Keywords</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add search keyword tag..."
                  value={newKeywordInput}
                  onChange={(e) => setNewKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#F26522]"
                />
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  className="px-4 py-2 bg-[#052a51] text-white text-xs font-bold rounded-2xl cursor-pointer"
                >
                  Add Tag
                </button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {keywords.map((k, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-[#F26522] border border-orange-200 rounded-full text-xs font-bold"
                  >
                    #{k}
                    <button type="button" onClick={() => handleRemoveKeyword(i)} className="text-orange-400 hover:text-red-600">
                      <Trash2 size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: IMAGE GALLERY & SUB-CATEGORY SPECIFICATIONS ── */}
      {currentStep === 3 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-2xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-black text-[#052a51] flex items-center gap-2">
              <ImageIcon size={20} className="text-[#F26522]" />
              3. Image Gallery &amp; Sub-category
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Upload photos directly or drag to reorder. Save is blocked until uploads complete.
            </p>
          </div>

          <ImageUploadManager
            images={images}
            onChange={setImages}
            onUploadingChange={setIsImageUploading}
            vendorId={activeVendorId}
          />

          <div className="space-y-1.5 pt-4 border-t border-gray-100">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Video size={14} className="text-[#F26522]" />
              Product Video Walkthrough (Optional YouTube or MP4 URL)
            </label>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#F26522]"
            />
          </div>

          {/* Primary Product Colour (12+ Standard Colours Radio Buttons + Custom Option) */}
          {!selectedSubcategory && (
            <div className="p-5 rounded-3xl bg-gray-50/70 border border-gray-200 space-y-3">
              <ColorRadioSelector
                value={dynamicAttributes["Colour"] || dynamicAttributes["Color"] || ""}
                initialColorImages={colorImages}
                onColorImagesChange={(imgs) => {
                  setColorImages(imgs);
                  setDynamicAttributes((prev) => ({
                    ...prev,
                    colorImages: JSON.stringify(imgs),
                  }));
                }}
                onChange={(colorName, colorHex, colorList, newColorImages) => {
                  if (newColorImages) {
                    setColorImages(newColorImages);
                    const addedImgs = Object.values(newColorImages).filter((img): img is string => Boolean(img));
                    if (addedImgs.length > 0) {
                      setImages((prev) => {
                        const existing = new Set(prev.filter((x) => x !== "/placeholders/product.svg"));
                        addedImgs.forEach((img) => existing.add(img));
                        return Array.from(existing);
                      });
                    }
                  }
                  setDynamicAttributes((prev) => ({
                    ...prev,
                    Colour: colorName,
                    Color: colorName,
                    ...(colorHex ? { ColorHex: colorHex } : {}),
                    ...(colorList && colorList.length > 0 ? { SelectedColours: colorList.join(", ") } : {}),
                    ...(newColorImages ? { colorImages: JSON.stringify(newColorImages) } : {}),
                  }));
                }}
                label="Product Colour (12+ Standard Colours Radio Buttons)"
                helperText="Click any standard colour for single-click selection or enter custom shade"
                allowCustom={true}
                nameGroup="primary-colour-selector"
              />
            </div>
          )}

          {/* Subcategory Section / Button (Below Gallery) */}
          <div className="p-5 rounded-3xl bg-gray-50/70 border border-gray-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <strong className="text-xs font-black text-gray-900 uppercase tracking-wider block">
                  Sub-category Selection
                </strong>
                <p className="text-xs text-gray-500">
                  {selectedCategory ? `Belongs to: ${selectedCategory.name}` : "Pick a category in Step 1 first"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!isSubcategoryRevealed && (
                  <button
                    type="button"
                    onClick={() => setIsSubcategoryRevealed(true)}
                    className="px-4 py-2 bg-[#052a51] hover:bg-[#073666] text-white text-xs font-bold rounded-xl shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>+ Add Sub-category</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsAddingCustomSubcategory(true)}
                  className="px-3.5 py-2 bg-orange-50 border border-orange-200 text-[#F26522] hover:bg-[#F26522] hover:text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={13} />
                  <span>+ Add Custom Sub-category</span>
                </button>
              </div>
            </div>

            {/* Sub-category Quick Selector & Pills */}
            {selectedCategory?.children && selectedCategory.children.length > 0 && (
              <div className="space-y-2 pt-1 animate-in fade-in">
                <span className="text-[11px] font-bold text-gray-600 block">
                  Quick Select Sub-category (Click to pick):
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedCategory.children.map((ch: any) => {
                    const isSelected = selectedSubcategoryId === ch.id;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedSubcategoryId("");
                          } else {
                            setSelectedSubcategoryId(ch.id);
                            setIsSubcategoryRevealed(true);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                          isSelected
                            ? "bg-[#052a51] text-white border-[#052a51] shadow-xs"
                            : "bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50/30"
                        }`}
                      >
                        {ch.image && (
                          <img
                            src={ch.image}
                            alt=""
                            className="w-4 h-4 rounded-md object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        )}
                        <span>{ch.name}</span>
                        {isSelected && <Check size={12} className="text-orange-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sub-category Dropdown & Configuration Card */}
            {(isSubcategoryRevealed || selectedSubcategoryId) && (
              <div className="pt-2 animate-in fade-in space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Choose Sub-category Dropdown</label>
                  <select
                    value={selectedSubcategoryId}
                    onChange={(e) => setSelectedSubcategoryId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs font-bold text-gray-900 bg-white focus:outline-none focus:border-[#F26522] cursor-pointer"
                  >
                    <option value="">-- No specific sub-category --</option>
                    {selectedCategory?.children?.map((ch: any) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Sub-category Detailed Configuration (Alag Rate, Colour, Dimension, Image) */}
                {selectedSubcategory && (
                  <div className="p-4.5 rounded-2xl bg-white border-2 border-orange-200/80 shadow-xs space-y-4 animate-in fade-in">
                    {/* Header with Sub-category info */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        {selectedSubcategory.image ? (
                          <img
                            src={selectedSubcategory.image}
                            alt={selectedSubcategory.name}
                            className="w-12 h-12 rounded-xl object-cover border border-orange-200 bg-white shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/placeholders/category.svg";
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-orange-100 text-[#F26522] flex items-center justify-center font-black shrink-0">
                            <Box size={20} />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-gray-900">
                              {selectedSubcategory.name}
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#F26522] text-white font-black uppercase">
                              Active Sub-category
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {selectedSubcategory.description || `Belongs to ${selectedCategory?.name}. Configure distinct rate, colour, dimensions, and image below.`}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsAddingCustomSubcategory(true)}
                        className="px-3 py-1.5 rounded-xl border border-orange-200 bg-orange-50 text-[#F26522] hover:bg-[#F26522] hover:text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Plus size={12} />
                        <span>+ Add New Sub-type</span>
                      </button>
                    </div>

                    {/* 1. Sub-category Rate & Pricing */}
                    <div className="p-3.5 bg-orange-50/50 rounded-2xl border border-orange-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                          <IndianRupee size={15} className="text-[#F26522]" />
                          <span>Sub-category Rate &amp; Pricing</span>
                        </label>
                        {discountPercent > 0 && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black">
                            {discountPercent}% OFF
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-gray-600 block mb-1">
                            Selling Price (₹) <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                            <input
                              type="number"
                              inputMode="decimal"
                              min="0"
                              step="0.01"
                              placeholder="e.g. 1250"
                              value={sellingPrice}
                              onChange={(e) => setSellingPrice(e.target.value)}
                              className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-200 text-xs font-mono font-black text-[#052a51] bg-white focus:outline-none focus:border-[#F26522]"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-gray-600 block mb-1">
                            Maximum Retail Price (MRP ₹)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                            <input
                              type="number"
                              inputMode="decimal"
                              min="0"
                              step="0.01"
                              placeholder="e.g. 1500"
                              value={mrp}
                              onChange={(e) => setMrp(e.target.value)}
                              className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-200 text-xs font-mono font-bold text-gray-700 bg-white focus:outline-none focus:border-[#F26522]"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-gray-600 block mb-1">
                            Cost Price (₹)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                            <input
                              type="number"
                              inputMode="decimal"
                              min="0"
                              step="0.01"
                              placeholder="e.g. 850"
                              value={costPrice}
                              onChange={(e) => setCostPrice(e.target.value)}
                              className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-200 text-xs font-mono font-semibold text-gray-700 bg-white focus:outline-none focus:border-[#F26522]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. Sub-category Colour & Finish */}
                    <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200 space-y-4">
                      <ColorRadioSelector
                        value={dynamicAttributes["Colour"] || dynamicAttributes["Color"] || ""}
                        initialColorImages={colorImages}
                        onColorImagesChange={(imgs) => {
                          setColorImages(imgs);
                          setDynamicAttributes((prev) => ({
                            ...prev,
                            colorImages: JSON.stringify(imgs),
                          }));
                        }}
                        onChange={(colorName, colorHex, colorList, newColorImages) => {
                          if (newColorImages) {
                            setColorImages(newColorImages);
                            const addedImgs = Object.values(newColorImages).filter((img): img is string => Boolean(img));
                            if (addedImgs.length > 0) {
                              setImages((prev) => {
                                const existing = new Set(prev.filter((x) => x !== "/placeholders/product.svg"));
                                addedImgs.forEach((img) => existing.add(img));
                                return Array.from(existing);
                              });
                            }
                          }
                          setDynamicAttributes((prev) => ({
                            ...prev,
                            Colour: colorName,
                            Color: colorName,
                            ...(colorHex ? { ColorHex: colorHex } : {}),
                            ...(colorList && colorList.length > 0 ? { SelectedColours: colorList.join(", ") } : {}),
                            ...(newColorImages ? { colorImages: JSON.stringify(newColorImages) } : {}),
                          }));
                        }}
                        label="Sub-category Colour (12+ Standard Colours Radio Buttons)"
                        helperText="Click any standard colour for single-click selection or enter custom shade"
                        allowCustom={true}
                        nameGroup="subcategory-colour-selector"
                      />

                      <div>
                        <label className="text-[11px] font-bold text-gray-600 block mb-1">
                          Surface Finish
                        </label>
                        <select
                          value={dynamicAttributes["Surface Finish"] || ""}
                          onChange={(e) =>
                            setDynamicAttributes({
                              ...dynamicAttributes,
                              "Surface Finish": e.target.value,
                            })
                          }
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 bg-white focus:outline-none focus:border-[#F26522] cursor-pointer"
                        >
                          <option value="">Select Surface Finish...</option>
                          <option value="Glossy / Polished">Glossy / Polished</option>
                          <option value="Matt / Matte">Matt / Matte</option>
                          <option value="Satin / Silk">Satin / Silk</option>
                          <option value="Carving / Textured">Carving / Textured</option>
                          <option value="Rustic / Anti-Skid">Rustic / Anti-Skid</option>
                          <option value="High Gloss">High Gloss</option>
                        </select>
                      </div>
                    </div>

                    {/* 3. Sub-category Item Dimensions & Packaging */}
                    <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-200 space-y-2.5">
                      <label className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                        <Package size={15} className="text-[#F26522]" />
                        <span>Sub-category Dimensions &amp; Packaging</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 block mb-1">Length (cm)</label>
                          <input
                            type="number"
                            step="any"
                            placeholder="e.g. 60"
                            value={lengthCm}
                            onChange={(e) => setLengthCm(e.target.value)}
                            className="w-full px-2.5 py-2 rounded-xl border border-gray-200 text-xs font-medium bg-white focus:outline-none focus:border-[#F26522]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 block mb-1">Width (cm)</label>
                          <input
                            type="number"
                            step="any"
                            placeholder="e.g. 60"
                            value={widthCm}
                            onChange={(e) => setWidthCm(e.target.value)}
                            className="w-full px-2.5 py-2 rounded-xl border border-gray-200 text-xs font-medium bg-white focus:outline-none focus:border-[#F26522]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 block mb-1">Height/Thick (cm)</label>
                          <input
                            type="number"
                            step="any"
                            placeholder="e.g. 0.9"
                            value={heightCm}
                            onChange={(e) => setHeightCm(e.target.value)}
                            className="w-full px-2.5 py-2 rounded-xl border border-gray-200 text-xs font-medium bg-white focus:outline-none focus:border-[#F26522]"
                          />
                        </div>
                        <div className="col-span-1">
                          <WeightSelectorInput
                            compact
                            value={packedWeightKg}
                            onChange={setPackedWeightKg}
                            label="Weight"
                            placeholder="e.g. 2.4"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 4. Sub-category Image Gallery (PRD Multi-Image Sub-category) */}
                    <div className="p-4 bg-orange-50/40 rounded-2xl border-2 border-orange-200/80 space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                            <ImageIcon size={15} className="text-[#F26522]" />
                            <span>Sub-category Image Gallery</span>
                            <span className="text-[10px] bg-[#F26522] text-white font-extrabold px-1.5 py-0.2 rounded uppercase">
                              {subcategoryGallery.length} {subcategoryGallery.length === 1 ? "Photo" : "Photos"}
                            </span>
                          </label>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Upload multiple photos dedicated to {selectedSubcategory.name}. All photos sync to the storefront product gallery.
                          </p>
                        </div>

                        {subcategoryGallery.length > 0 && (
                          <button
                            type="button"
                            onClick={handleSyncSubcatToMain}
                            className="px-3 py-1.5 rounded-xl bg-[#052a51] hover:bg-[#073666] text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto"
                            title="Sync all sub-category photos to primary product gallery"
                          >
                            <Zap size={12} className="text-[#F26522] fill-[#F26522]" />
                            <span>Sync to Product Gallery</span>
                          </button>
                        )}
                      </div>

                      {/* Gallery Thumbnails Grid */}
                      {subcategoryGallery.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                          {subcategoryGallery.map((imgUrl, idx) => {
                            const isPrimary = idx === 0;
                            return (
                              <div
                                key={`${imgUrl}-${idx}`}
                                className={`group relative aspect-square rounded-2xl overflow-hidden border bg-white shadow-2xs transition-all ${
                                  isPrimary ? "border-[#F26522] ring-2 ring-[#F26522]" : "border-gray-200"
                                }`}
                              >
                                <img
                                  src={imgUrl}
                                  alt={`${selectedSubcategory.name} ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = "/placeholders/category.svg";
                                  }}
                                />

                                {/* Badge */}
                                {isPrimary ? (
                                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-[#F26522] text-white text-[9px] font-black rounded-md shadow-xs">
                                    Primary Cover
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSetSubcatCover(imgUrl)}
                                    className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/60 hover:bg-[#F26522] text-white text-[9px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                  >
                                    Make Cover
                                  </button>
                                )}

                                {/* Delete button */}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSubcatGalleryImage(idx)}
                                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-700 cursor-pointer"
                                  title="Remove photo"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 bg-white rounded-2xl border border-dashed border-gray-300 text-center">
                          <ImageIcon size={24} className="mx-auto text-gray-300 mb-1" />
                          <p className="text-xs font-bold text-gray-600">No photos in sub-category gallery yet</p>
                          <p className="text-[10px] text-gray-400">Upload multiple photos or paste image links below</p>
                        </div>
                      )}

                      {/* Add Image Controls: File Upload & URL Link */}
                      <div className="space-y-2 pt-1">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="file"
                            ref={subcatGalleryFileInputRef}
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            multiple
                            onChange={(e) => {
                              if (e.target.files) handleUploadSubcatGalleryFiles(e.target.files);
                            }}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => subcatGalleryFileInputRef.current?.click()}
                            disabled={isUploadingSubcatGallery}
                            className="px-4 py-2.5 rounded-xl border border-dashed border-[#F26522] bg-orange-50 hover:bg-orange-100 text-[#F26522] text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                          >
                            {isUploadingSubcatGallery ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Upload size={14} />
                            )}
                            <span>+ Upload Sub-category Photos</span>
                          </button>

                          {/* URL Paste */}
                          <div className="flex-1 flex gap-1.5">
                            <input
                              type="url"
                              placeholder="Or paste photo URL (https://... or /images/...)"
                              value={subcatGalleryUrlInput}
                              onChange={(e) => setSubcatGalleryUrlInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddSubcatGalleryUrl();
                                }
                              }}
                              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-[#F26522]"
                            />
                            <button
                              type="button"
                              onClick={handleAddSubcatGalleryUrl}
                              className="px-3.5 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors cursor-pointer shrink-0"
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        {/* Quick preset tiles */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-bold text-gray-400">Presets:</span>
                          {[
                            { name: "Glossy White", url: "/images/categories/cat-tiles-stone.jpg" },
                            { name: "Marble Texture", url: "/images/categories/cat-floor-tiles.jpg" },
                            { name: "Teak Wood", url: "/images/categories/cat-plywood.jpg" },
                            { name: "Sanitary Chrome", url: "/images/categories/cat-sanitaryware-bath.jpg" },
                          ].map((pre) => (
                            <button
                              key={pre.name}
                              type="button"
                              onClick={() => {
                                setSubcategoryGallery((prev) => [...prev, pre.url]);
                                setImages((prev) => [...prev.filter((i) => i !== "/placeholders/product.svg"), pre.url]);
                                toast.success(`Added ${pre.name} photo`);
                              }}
                              className="px-2 py-0.5 rounded-lg bg-white border border-gray-200 text-[10px] font-medium text-gray-700 hover:border-orange-300 hover:text-[#F26522] cursor-pointer"
                            >
                              + {pre.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Custom Sub-category Modal (With Custom Rate, Colour, Dimension, and Image) */}
            {isAddingCustomSubcategory && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#F26522] flex items-center justify-center">
                        <Box size={18} />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-gray-900">
                          Add Custom Sub-category
                        </h3>
                        <p className="text-[11px] text-gray-500">
                          Under category: <strong className="text-gray-700">{selectedCategory?.name || "General"}</strong>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCustomSubcategory(false);
                        setCustomSubcategoryImage("");
                        setCustomSubcategoryUrlInput("");
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Sub-category Name */}
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        Sub-category Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Italian Carrara White 1200x600, Matte Hexagonal..."
                        value={customSubcategoryName}
                        onChange={(e) => setCustomSubcategoryName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#F26522]"
                        autoFocus
                      />
                    </div>

                    {/* Sub-category Image (Upload & Link) */}
                    <div className="space-y-2 p-3 bg-gray-50/70 rounded-2xl border border-gray-200">
                      <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <ImageIcon size={14} className="text-[#F26522]" />
                          Sub-category Image
                        </span>
                        <span className="text-[10px] text-gray-400">Photo specific to this sub-category</span>
                      </label>

                      {/* Mode Switcher */}
                      <div className="flex items-center gap-2 p-1 bg-gray-200/70 rounded-xl w-fit">
                        <button
                          type="button"
                          onClick={() => setCustomSubcategoryImageMode("upload")}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            customSubcategoryImageMode === "upload"
                              ? "bg-white text-gray-900 shadow-2xs"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          <Upload size={12} />
                          <span>Upload Photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomSubcategoryImageMode("link")}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            customSubcategoryImageMode === "link"
                              ? "bg-white text-gray-900 shadow-2xs"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          <LinkIcon size={12} />
                          <span>Image Link</span>
                        </button>
                      </div>

                      {/* Preview or Inputs */}
                      {customSubcategoryImage ? (
                        <div className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-orange-200">
                          <img
                            src={customSubcategoryImage}
                            alt="Subcategory preview"
                            className="w-14 h-14 rounded-lg object-cover border border-gray-200 shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/placeholders/category.svg";
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-gray-900 truncate block">Image Attached</span>
                            <span className="text-[10px] text-gray-400 truncate block font-mono">{customSubcategoryImage}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setCustomSubcategoryImage("");
                                setCustomSubcategoryUrlInput("");
                              }}
                              className="text-[11px] text-red-600 font-bold hover:underline mt-1 flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 size={11} /> Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {customSubcategoryImageMode === "upload" && (
                            <div>
                              <input
                                type="file"
                                ref={subcategoryFileInputRef}
                                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadSubcategoryImage(file);
                                }}
                                className="hidden"
                              />
                              <div
                                onClick={() => subcategoryFileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors ${
                                  isUploadingSubcategoryImage
                                    ? "border-orange-300 bg-orange-50/50"
                                    : "border-gray-300 hover:border-[#F26522] bg-white"
                                }`}
                              >
                                {isUploadingSubcategoryImage ? (
                                  <div className="flex items-center justify-center gap-2 py-1 text-xs font-bold text-gray-600">
                                    <Loader2 size={16} className="animate-spin text-[#F26522]" />
                                    <span>Uploading photo...</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-2 py-1 text-xs text-gray-600 font-bold">
                                    <Upload size={14} className="text-[#F26522]" />
                                    <span>Click to upload sub-category image</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {customSubcategoryImageMode === "link" && (
                            <div className="flex gap-2">
                              <input
                                type="url"
                                placeholder="Paste image link (https://... or /images/...)"
                                value={customSubcategoryUrlInput}
                                onChange={(e) => setCustomSubcategoryUrlInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const trimmed = customSubcategoryUrlInput.trim();
                                    if (!trimmed) {
                                      toast.error("Please enter a valid image URL");
                                      return;
                                    }
                                    setCustomSubcategoryImage(trimmed);
                                  }
                                }}
                                className="flex-1 px-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-[#F26522]"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const trimmed = customSubcategoryUrlInput.trim();
                                  if (!trimmed) {
                                    toast.error("Please enter a valid image URL");
                                    return;
                                  }
                                  setCustomSubcategoryImage(trimmed);
                                }}
                                className="px-3 py-1.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors cursor-pointer shrink-0"
                              >
                                Apply
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Custom Rate / Pricing (Selling Price & MRP) */}
                    <div className="p-3 bg-gray-50/70 rounded-2xl border border-gray-200 space-y-2">
                      <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <IndianRupee size={14} className="text-[#F26522]" />
                        Sub-category Rate &amp; Price
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-gray-600 block mb-1">Selling Price (₹)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="e.g. 1250"
                            value={customSubcategoryPrice}
                            onChange={(e) => setCustomSubcategoryPrice(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono font-bold text-[#052a51] bg-white focus:outline-none focus:border-[#F26522]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-gray-600 block mb-1">MRP (₹)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="e.g. 1500"
                            value={customSubcategoryMrp}
                            onChange={(e) => setCustomSubcategoryMrp(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono font-bold text-gray-700 bg-white focus:outline-none focus:border-[#F26522]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Colour & Dimensions */}
                    <div className="p-3.5 bg-gray-50/70 rounded-2xl border border-gray-200 space-y-3">
                      <ColorRadioSelector
                        value={customSubcategoryColour}
                        initialColorImages={customSubcategoryColorImages}
                        onColorImagesChange={setCustomSubcategoryColorImages}
                        onChange={(colorName, _hex, _list, newImgs) => {
                          setCustomSubcategoryColour(colorName);
                          if (newImgs) {
                            setCustomSubcategoryColorImages(newImgs);
                          }
                        }}
                        label="Sub-category Colour (12+ Standard Colours Radio Buttons)"
                        helperText="Click any standard colour for single-click selection or enter custom shade"
                        allowCustom={true}
                        nameGroup="modal-subcat-colour-selector"
                      />

                      {/* Dimensions: Length, Width, Height, Weight */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 block mb-1">Length (cm)</label>
                          <input
                            type="number"
                            step="any"
                            placeholder="e.g. 60"
                            value={customSubcategoryLength}
                            onChange={(e) => setCustomSubcategoryLength(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-[#F26522]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 block mb-1">Width (cm)</label>
                          <input
                            type="number"
                            step="any"
                            placeholder="e.g. 60"
                            value={customSubcategoryWidth}
                            onChange={(e) => setCustomSubcategoryWidth(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-[#F26522]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 block mb-1">Height (cm)</label>
                          <input
                            type="number"
                            step="any"
                            placeholder="e.g. 0.9"
                            value={customSubcategoryHeight}
                            onChange={(e) => setCustomSubcategoryHeight(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-[#F26522]"
                          />
                        </div>
                        <div className="col-span-1">
                          <WeightSelectorInput
                            compact
                            value={customSubcategoryWeight}
                            onChange={setCustomSubcategoryWeight}
                            label="Weight"
                            placeholder="e.g. 2.4"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Description (Optional)</label>
                      <textarea
                        rows={2}
                        placeholder="Brief technical notes for this sub-category..."
                        value={customSubcategoryDesc}
                        onChange={(e) => setCustomSubcategoryDesc(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#F26522]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCustomSubcategory(false);
                        setCustomSubcategoryImage("");
                        setCustomSubcategoryUrlInput("");
                      }}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCustomSubcategory}
                      disabled={isSavingSubcategory || isUploadingSubcategoryImage}
                      className="px-5 py-2 bg-[#F26522] hover:bg-[#d95517] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingSubcategory ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      <span>Save &amp; Select</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Specifications */}
          {activeAttributeSchema.length > 0 && (
            <div className="space-y-4 pt-2">
              <label className="text-xs font-black text-gray-800 uppercase tracking-wider block">
                Category Technical Specifications
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {activeAttributeSchema.map((field: any) => (
                  <div key={field.name} className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">
                      {field.name} {field.unit ? `(${field.unit})` : ""}
                    </label>
                    {field.type === "select" && field.options ? (
                      <select
                        value={dynamicAttributes[field.name] || ""}
                        onChange={(e) =>
                          setDynamicAttributes({ ...dynamicAttributes, [field.name]: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs bg-white cursor-pointer"
                      >
                        <option value="">Select {field.name}...</option>
                        {field.options.map((opt: string) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type === "number" ? "number" : "text"}
                        placeholder={`Enter ${field.name}`}
                        value={dynamicAttributes[field.name] || ""}
                        onChange={(e) =>
                          setDynamicAttributes({ ...dynamicAttributes, [field.name]: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Specifications Key-Value */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <label className="text-xs font-black text-gray-800 uppercase tracking-wider block">
              Custom Technical Specifications
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Spec Label (e.g. Tensile Strength)"
                value={newSpecKey}
                onChange={(e) => setNewSpecKey(e.target.value)}
                className="w-48 px-3.5 py-2 rounded-2xl border border-gray-200 text-xs"
              />
              <input
                type="text"
                placeholder="Spec Value (e.g. 450 N/mm²)"
                value={newSpecValue}
                onChange={(e) => setNewSpecValue(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-2xl border border-gray-200 text-xs"
              />
              <button
                type="button"
                onClick={handleAddCustomSpec}
                className="px-4 py-2 bg-[#052a51] text-white text-xs font-bold rounded-2xl cursor-pointer"
              >
                Add Spec
              </button>
            </div>
            {customSpecs.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {customSpecs.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-800 rounded-xl text-xs font-medium"
                  >
                    <strong>{s.key}:</strong> {s.value}
                    <button type="button" onClick={() => handleRemoveCustomSpec(idx)} className="text-gray-400 hover:text-red-600">
                      <Trash2 size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Dimensions & Packaging */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <label className="text-xs font-black text-gray-800 uppercase tracking-wider block">
              Item Dimensions &amp; Packaging
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-gray-500">Length (cm)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 60"
                  value={lengthCm}
                  onChange={(e) => setLengthCm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-gray-500">Width (cm)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 60"
                  value={widthCm}
                  onChange={(e) => setWidthCm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-gray-500">Height (cm)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 0.9"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                />
              </div>
              <div className="space-y-1">
                <WeightSelectorInput
                  compact
                  value={packedWeightKg}
                  onChange={setPackedWeightKg}
                  label="Weight"
                  placeholder="e.g. 2.4"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 4: VARIANTS MATRIX (DECIDES SINGLE VS MULTI) ── */}
      {currentStep === 4 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-2xs space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-[#052a51] flex items-center gap-2">
                <Layers size={20} className="text-[#F26522]" />
                4. Product Variants &amp; Matrix
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Add variants for multiple colours, sizes, or weight packs. The item type is decided by this toggle.
              </p>
            </div>
          </div>

          {/* Variants Toggle Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-orange-50/50 border border-orange-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F26522] text-white flex items-center justify-center shrink-0">
                <Layers size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900">Add variants (colour, size, weight...)</h3>
                <p className="text-xs text-gray-500">
                  Enable to create multiple variant rows with independent prices, stock, and photos.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={isMultiVariety}
                onChange={(e) => setIsMultiVariety(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F26522]"></div>
            </label>
          </div>

          {/* Conditional Variant Matrix Rendering */}
          {!isMultiVariety ? (
            <div className="p-8 rounded-3xl bg-gray-50/70 border border-gray-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-200/60 text-gray-700 flex items-center justify-center mx-auto">
                <Package size={24} />
              </div>
              <p className="text-sm font-black text-gray-800">Single Standalone Item Active</p>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                This item will sell as a single standalone product using the rate details (Selling Price: <strong>₹{sellingPrice || "0"}</strong>, MRP: <strong>₹{mrp || "0"}</strong>, Cost: <strong>₹{costPrice || "0"}</strong>, Stock: <strong>{stockQuantity || "100"} {unitOfSale}</strong>) configured in Step 2.
              </p>
            </div>
          ) : (
            <UnifiedVariantManager
              hasVariants={isMultiVariety}
              onHasVariantsChange={setIsMultiVariety}
              variants={variants}
              onChange={setVariants}
              vendorId={activeVendorId}
              baseImages={images}
              defaultSellingPrice={sellingNum > 0 ? sellingNum : 499}
              defaultMrp={mrpNum > 0 ? mrpNum : 699}
              defaultCostPrice={costNum > 0 ? costNum : undefined}
              isAdminOrCpo={isAdminOrCpo}
              defaultStock={parseInt(stockQuantity, 10) || 50}
              unitOfSale={unitOfSale}
            />
          )}

          {/* 🏷️ STEP 4: PROMOTIONAL BADGES & MARKETING LABELS (PRD Specification) */}
          <div className="p-6 rounded-3xl bg-linear-to-br from-amber-50/50 via-white to-orange-50/40 border border-orange-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-orange-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#F26522] text-white flex items-center justify-center shadow-xs">
                  <Tag size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                    Promotional Badges &amp; Marketing Labels
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Drive higher conversion with automated discount savings, marketplace pills, and custom promotional tags.
                  </p>
                </div>
              </div>

              {/* 📌 Pin Badge Preferences Default */}
              <button
                type="button"
                onClick={handleTogglePinBadges}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto ${
                  isBadgePinned
                    ? "bg-amber-100/80 border-amber-400 text-amber-900 shadow-xs"
                    : "bg-white border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-800"
                }`}
                title="Pin your promotional badge settings as default for future listings"
              >
                <span>{isBadgePinned ? "📌 Badges Pinned" : "📌 Pin Badges as Default"}</span>
              </button>
            </div>

            {/* 1. ⚡ Auto Discount Badge Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-gray-900">⚡ Auto Discount Savings Badge</span>
                  {showAutoDiscount && discountPercent > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-2xs animate-in fade-in">
                      {discountPercent}% OFF LIVE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500">
                  Automatically calculates &amp; displays customer savings badge on storefront cards when Selling Price &lt; MRP.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={showAutoDiscount}
                  onChange={(e) => setShowAutoDiscount(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* 2. Select Marketplace Tags */}
            <div className="space-y-2.5">
              <label className="text-xs font-black text-gray-800 uppercase tracking-wider block">
                Select Promotional Marketplace Tags:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "BEST_SELLER", label: "🔥 Best Seller" },
                  { id: "FACTORY_PRICE", label: "🏬 Factory Price" },
                  { id: "QUICK_DISPATCH", label: "⚡ Quick Dispatch" },
                  { id: "TOP_RATED", label: "⭐ Top Rated" },
                  { id: "PREMIUM_QUALITY", label: "🏆 Premium Quality" },
                  { id: "ECO_FRIENDLY", label: "🌿 Eco Friendly" },
                ].map((tag) => {
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        setSelectedTags((prev) =>
                          prev.includes(tag.id) ? prev.filter((t) => t !== tag.id) : [...prev, tag.id]
                        );
                      }}
                      className={`h-10 px-3.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        isSelected
                          ? "bg-[#052a51] text-white border-[#052a51] shadow-xs"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <span>{tag.label}</span>
                      {isSelected && <Check size={12} className="text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Custom Text Badge & Color Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Custom Badge Text (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Buy 10 Get 1 Free, Contractor Deal"
                  value={customBadgeText}
                  onChange={(e) => setCustomBadgeText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-900 bg-white focus:outline-none focus:border-[#F26522]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Badge Color Style:
                </label>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {[
                    { id: "RED", label: "🔴 Red", bg: "bg-red-50 border-red-300 text-red-700" },
                    { id: "GREEN", label: "🟢 Green", bg: "bg-emerald-50 border-emerald-300 text-emerald-700" },
                    { id: "GOLD", label: "🟡 Gold", bg: "bg-amber-50 border-amber-300 text-amber-800" },
                    { id: "BLUE", label: "🔵 Blue", bg: "bg-blue-50 border-blue-300 text-blue-700" },
                    { id: "PURPLE", label: "🟣 Purple", bg: "bg-purple-50 border-purple-300 text-purple-700" },
                  ].map((color) => {
                    const isSelected = badgeColor === color.id;
                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setBadgeColor(color.id)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? `${color.bg} ring-2 ring-[#052a51] shadow-xs`
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {color.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Live Custom Badge Demonstration */}
            {customBadgeText.trim() && (
              <div className="p-3 bg-white border border-gray-200 rounded-2xl flex items-center gap-3">
                <span className="text-xs font-bold text-gray-500">Live Custom Badge Preview:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black tracking-wide shadow-xs ${
                    badgeColor === "GREEN"
                      ? "bg-emerald-600 text-white"
                      : badgeColor === "GOLD"
                      ? "bg-amber-400 text-gray-900"
                      : badgeColor === "BLUE"
                      ? "bg-blue-600 text-white"
                      : badgeColor === "PURPLE"
                      ? "bg-purple-600 text-white"
                      : "bg-red-600 text-white"
                  }`}
                >
                  🏷️ {customBadgeText}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 5: SHIPPING & DELIVERY ── */}
      {currentStep === 5 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-2xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-black text-[#052a51] flex items-center gap-2">
              <Truck size={20} className="text-[#F26522]" />
              5. Shipping, Delivery &amp; Logistics
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Configure dispatch timelines, regional delivery rules, cash on delivery, and fragile flags.
            </p>
          </div>

          {/* ⚡ Instant Delivery vs 🚛 Heavy Bulky Dispatch Selection Cards (PRD Req) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                shippingMode === "instant"
                  ? "border-[#F26522] bg-orange-50/40 shadow-xs"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="shippingModeRadio"
                checked={shippingMode === "instant"}
                onChange={() => {
                  setShippingMode("instant");
                  setDispatchTimeDays("1");
                }}
                className="mt-1 accent-[#F26522]"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                    ⚡ Instant Delivery (60–90 Mins)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                    Default Fast
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Ideal for standard hardware, adhesives, tools, and lightweight materials dispatched via local riders or bike fleet.
                </p>
              </div>
            </label>

            <label
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                shippingMode === "heavy_bulky" || shippingMode === "heavy_bulk"
                  ? "border-[#F26522] bg-orange-50/40 shadow-xs"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="shippingModeRadio"
                checked={shippingMode === "heavy_bulky" || shippingMode === "heavy_bulk"}
                onChange={() => {
                  setShippingMode("heavy_bulky");
                  setDispatchTimeDays("2");
                }}
                className="mt-1 accent-[#F26522]"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                    🚛 Custom Heavy / Bulky Dispatch
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                    ETA Window
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  For bulk pallets, cement, tiles, marble, sanitaryware, and construction truckloads with estimated 24–72 hour delivery window.
                </p>
              </div>
            </label>
          </div>

          {/* 📌 Pin Selected Option as Default (PRD Req) */}
          <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Pin size={16} className={isLogisticsPinned ? "text-[#F26522] fill-[#F26522]" : "text-gray-400"} />
              <div>
                <strong className="text-xs font-bold text-gray-800 block">
                  {isLogisticsPinned ? "📌 Logistics Preference Pinned as Default" : "Pin Selected Option as Default"}
                </strong>
                <p className="text-[11px] text-gray-400">
                  Automatically pre-selects this delivery mode for subsequent product uploads.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTogglePinLogistics}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isLogisticsPinned
                  ? "bg-orange-50 border-orange-300 text-[#F26522]"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {isLogisticsPinned ? "✓ Pinned Default" : "Pin as Default"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Dispatch Time (Days)</label>
              <input
                type="number"
                min="1"
                value={dispatchTimeDays}
                onChange={(e) => setDispatchTimeDays(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Standard Delivery Charge ₹</label>
              <input
                type="number"
                min="0"
                placeholder="0 (Free Delivery)"
                value={deliveryCharge}
                onChange={(e) => setDeliveryCharge(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Free Delivery on Orders Above ₹</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 5000"
                value={freeDeliveryAbove}
                onChange={(e) => setFreeDeliveryAbove(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-gray-200 flex items-center justify-between">
            <div>
              <strong className="text-xs font-bold text-gray-800 block">Cash on Delivery (COD)</strong>
              <p className="text-[11px] text-gray-400">Allow customers to pay via cash upon site delivery.</p>
            </div>
            <button
              type="button"
              onClick={() => setAllowCod(!allowCod)}
              className={`w-12 h-6.5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                allowCod ? "bg-[#F26522]" : "bg-gray-200"
              }`}
            >
              <div
                className={`w-5.5 h-5.5 rounded-full bg-white transition-transform ${
                  allowCod ? "translate-x-5.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 6: RETURNS & COMPLIANCE ── */}
      {currentStep === 6 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-2xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-black text-[#052a51] flex items-center gap-2">
              <FileCheck2 size={20} className="text-[#F26522]" />
              6. Returns, Warranty &amp; Compliance
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Specify buyer return windows, manufacturer warranty coverage, and vendor legal compliance.
            </p>
          </div>

          {/* Return Toggle: [ ON / OFF ] (PRD Req) */}
          <div className="p-5 rounded-3xl bg-gray-50/70 border border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-[#F26522] flex items-center justify-center font-bold shrink-0">
                  <RotateCcw size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Return &amp; Replacement Acceptance</h3>
                  <p className="text-xs text-gray-500">
                    Enable if buyer is allowed to return or replace items due to damage, mismatch, or transit defects.
                  </p>
                </div>
              </div>

              {/* Toggle ON/OFF */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={hasReturnPolicy}
                  onChange={(e) => setHasReturnPolicy(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F26522]"></div>
              </label>
            </div>

            {hasReturnPolicy ? (
              <div className="pt-3 border-t border-gray-200/80 space-y-4 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Return Window</label>
                    <select
                      value={returnPolicyDays}
                      onChange={(e) => setReturnPolicyDays(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs bg-white cursor-pointer"
                    >
                      <option value="3">3 Days Return Window</option>
                      <option value="7">7 Days Return / Replacement (Standard)</option>
                      <option value="10">10 Days Return / Replacement</option>
                      <option value="15">15 Days Return / Replacement</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Resolution Type</label>
                    <select
                      value={returnType}
                      onChange={(e) => setReturnType(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs bg-white cursor-pointer"
                    >
                      <option value="replacement">Replacement Only (Damaged / Defective piece swapped)</option>
                      <option value="refund_replacement">Refund or Replacement (Buyer can choose)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Condition Notes</label>
                  <textarea
                    rows={2}
                    value={returnConditions}
                    onChange={(e) => setReturnConditions(e.target.value)}
                    placeholder="e.g. Item must be returned unused in original packaging with all tags and inserts intact."
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs bg-white"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 text-[11px] text-amber-800">
                <strong>Non-Returnable Item (Final Sale):</strong> Buyers will be notified that this product is sold on a strict final-sale basis except for transit breakages reported within 24 hours.
              </div>
            )}

            {/* 📌 Pin Return Policy Toggle */}
            <div className="p-3.5 rounded-2xl bg-white border border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pin size={15} className={isReturnPinned ? "text-[#F26522] fill-[#F26522]" : "text-gray-400"} />
                <span className="text-xs font-bold text-gray-700">
                  {isReturnPinned ? "📌 Return Policy Pinned as Default" : "Pin this Return Policy as Default"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleTogglePinReturns}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isReturnPinned
                    ? "bg-orange-50 border-orange-300 text-[#F26522]"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {isReturnPinned ? "✓ Pinned Default" : "Pin as Default"}
              </button>
            </div>
          </div>

          {/* Warranty & Certificates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Warranty Type</label>
              <select
                value={warrantyType}
                onChange={(e) => setWarrantyType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs bg-white cursor-pointer"
              >
                <option value="brand">Manufacturer / Brand Warranty</option>
                <option value="seller">Seller / Vendor Warranty</option>
                <option value="none">No Warranty</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Warranty Duration</label>
              <input
                type="text"
                placeholder="e.g. 10 Years, 1 Year"
                value={warrantyDuration}
                onChange={(e) => setWarrantyDuration(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-start gap-3">
            <input
              type="checkbox"
              id="vendorDeclaration"
              checked={vendorDeclaration}
              onChange={(e) => setVendorDeclaration(e.target.checked)}
              className="mt-1 w-4 h-4 accent-[#F26522] rounded cursor-pointer"
            />
            <label htmlFor="vendorDeclaration" className="text-xs text-amber-900 cursor-pointer">
              <strong>Vendor Truthfulness &amp; Authenticity Declaration:</strong> I certify that all pricing, specifications, branding, and images provided are genuine, compliant with Indian Consumer Protection Laws, and authorized for commercial distribution.
            </label>
          </div>
        </div>
      )}

      {/* ── STEP 7: SEO, PREVIEW & PUBLISH ── */}
      {currentStep === 7 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-2xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-black text-[#052a51] flex items-center gap-2">
              <Globe size={20} className="text-[#F26522]" />
              7. SEO, Search Snippet &amp; Live Publish
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Automatic SEO indexing and Google Search Snippet preview. URL slug is generated automatically by backend.
            </p>
          </div>

          {/* Automatic Slug Info & Meta */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center gap-3 text-xs text-emerald-900">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">Automatic Clean URL (Backend Managed)</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  URL slug is generated automatically by backend:{" "}
                  <span className="font-mono font-bold bg-white/80 px-2 py-0.5 rounded border border-emerald-200 text-emerald-800">
                    /product/{currentSlug || "item-name"}
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700">Meta Title</label>
                <span
                  className={`text-[11px] font-mono font-bold ${
                    metaTitle.length > 60 ? "text-amber-600" : "text-gray-400"
                  }`}
                >
                  {metaTitle.length}/60 characters
                </span>
              </div>
              <input
                type="text"
                placeholder={title || "e.g. Premium Vitrified Floor Tiles (600x600mm)"}
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#F26522]"
              />
              <p className="text-[11px] text-gray-400">
                Recommended 50–60 characters. Suffix &quot;| Buy Online at IntriHub&quot; will be automatically added in search engines.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700">Meta Description</label>
                <span
                  className={`text-[11px] font-mono font-bold ${
                    metaDescription.length > 160 ? "text-amber-600" : "text-gray-400"
                  }`}
                >
                  {metaDescription.length}/160 characters
                </span>
              </div>
              <textarea
                rows={3}
                placeholder={
                  description.slice(0, 150) ||
                  "e.g. Shop high-quality vitrified floor tiles with anti-skid coating. Direct manufacturer warranty and fast doorstep delivery."
                }
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#F26522]"
              />
              <p className="text-[11px] text-gray-400">
                Recommended 120–160 characters for maximum Google click-through rate.
              </p>
            </div>
          </div>

          {/* Google Snippet Live Preview */}
          <div className="p-5 rounded-3xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-gray-800 uppercase tracking-wider">
                Google Search Snippet Preview
              </span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`p-1.5 rounded-lg text-xs font-bold ${
                    previewDevice === "desktop" ? "bg-[#052a51] text-white" : "text-gray-500"
                  }`}
                >
                  <Monitor size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`p-1.5 rounded-lg text-xs font-bold ${
                    previewDevice === "mobile" ? "bg-[#052a51] text-white" : "text-gray-500"
                  }`}
                >
                  <Smartphone size={13} />
                </button>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-1">
              <p className="text-[11px] text-gray-500 font-mono truncate">
                https://www.intrihub.com &gt; product &gt; {currentSlug || "your-item"}
              </p>
              <h4 className="text-sm font-medium text-blue-700 hover:underline cursor-pointer truncate">
                {(() => {
                  const base = metaTitle.trim() || title.trim() || "Product Title";
                  return base.includes("Buy Online at IntriHub") ? base : `${base} | Buy Online at IntriHub`;
                })()}
              </h4>
              <p className="text-xs text-gray-600 line-clamp-2">
                {metaDescription || description.slice(0, 150) || "Explore high-quality architectural materials at IntriHub..."}
              </p>
            </div>
          </div>

          {/* Completeness Checklist Summary */}
          <div className="p-5 rounded-3xl bg-[#052a51] text-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider">Listing Health Score</span>
              <span className="text-sm font-black font-mono text-[#F26522]">{completeness.score}% / 100%</span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#F26522] h-full transition-all duration-300 rounded-full"
                style={{ width: `${completeness.score}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Wizard Bottom Navigation Controls ── */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handlePrevStep}
          disabled={currentStep === 1}
          className="px-5 py-2.5 rounded-2xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={16} /> Previous Step
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-4 py-2.5 rounded-2xl border border-gray-300 hover:border-[#F26522] hover:text-[#F26522] text-gray-700 bg-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Eye size={15} className="text-[#F26522]" />
            <span>Preview on Website</span>
          </button>

          {currentStep < 7 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-2.5 rounded-2xl bg-[#052a51] hover:bg-[#073666] text-white text-xs font-bold flex items-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              Next Step <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="submit"
              onClick={() => setSubmitAction("publish")}
              disabled={loading || isImageUploading}
              className="px-7 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} className="fill-white" />}
              Make Product Live Now 🚀
            </button>
          )}
        </div>
      </div>
      </div>

      {/* 📱 Sticky Mobile Bottom Navigation Bar (PRD Section 2 & 5 - BUG-02 Fix) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 px-3 py-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl flex items-center justify-between gap-2 lg:hidden">
        <button
          type="button"
          onClick={handlePrevStep}
          disabled={currentStep === 1}
          className="h-12 min-h-[48px] px-3.5 rounded-xl border border-gray-300 text-gray-700 bg-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-transform shrink-0"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Prev</span>
        </button>

        <button
          type="button"
          onClick={handleSaveDraftManual}
          className="h-12 min-h-[48px] px-3.5 rounded-xl border border-gray-300 bg-gray-50 text-gray-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform shrink-0"
          title="Save Draft to Device"
        >
          <Save size={15} className="text-gray-500" />
          <span className="hidden xs:inline">Draft</span>
        </button>

        <button
          type="button"
          onClick={() => setIsPreviewOpen(true)}
          className="h-12 min-h-[48px] px-3.5 rounded-xl border border-orange-200 bg-orange-50 text-[#F26522] text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform shrink-0"
          title="Open Storefront Preview"
        >
          <Eye size={16} />
          <span>Preview</span>
        </button>

        {currentStep < 7 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="h-12 min-h-[48px] flex-1 px-4 rounded-xl bg-[#052a51] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform cursor-pointer"
          >
            <span>Next ({currentStep}/7)</span>
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            type="submit"
            onClick={() => setSubmitAction("publish")}
            disabled={loading || isImageUploading}
            className="h-12 min-h-[48px] flex-1 px-4 rounded-xl bg-emerald-600 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} className="fill-white" />}
            <span>Publish Live 🚀</span>
          </button>
        )}
      </div>

      {/* Product Storefront Website Preview Modal */}
      <ProductWebsitePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        data={{
          name: title || "New Product Title",
          brand: brand === "other" ? customBrandInput : brand,
          modelNumber,
          description,
          categoryName: selectedCategory?.name,
          subcategoryName: selectedSubcategory?.name,
          unitOfSale,
          sellingPrice: sellingPrice || 0,
          mrp: mrp || 0,
          images: images.length > 0 ? images : undefined,
          colour: dynamicAttributes["Colour"] || dynamicAttributes["Color"] || customSubcategoryColour,
          finish: dynamicAttributes["Surface Finish"] || dynamicAttributes["Finish"],
          material: dynamicAttributes["Material"],
          lengthCm,
          widthCm,
          heightCm,
          weightKg: packedWeightKg,
          highlights,
          shippingMode,
          dispatchTimeDays,
          returnPolicyDays,
          warrantyDuration,
          allowCod,
          slug: currentSlug,
          tags: selectedTags,
          customBadgeText,
          badgeColor,
          showAutoDiscount,
        }}
      />
    </form>
  );
}
