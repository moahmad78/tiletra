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
  Calendar,
  Search,
  Store,
  ShieldCheck,
  Video,
  ExternalLink,
  Percent,
  Truck,
  RotateCcw,
  FileCheck2,
  Globe,
  Eye,
  Smartphone,
  Monitor,
  CheckCircle2,
  Clock,
  Shield,
  Box,
  FileText,
  BadgePercent,
  X,
  History,
} from "lucide-react";
import { toast } from "sonner";
import ImageUploadManager from "@/components/admin/ImageUploadManager";
import UnifiedVariantManager from "@/components/shared/UnifiedVariantManager";
import { createProduct, checkDuplicateProduct } from "@/lib/actions/products";
import { getCategories } from "@/lib/actions/categories";
import { getVendorProfile } from "@/lib/actions/vendor";
import type { Category } from "@/lib/data/categories";
import type { ProductVariant } from "@/lib/data/products";
import { UNIT_OF_SALE_OPTIONS, getDefaultUnitOfSale } from "@/lib/units";
import { resolveColorHex } from "@/lib/catalog";

export interface SharedProductUploadWizardProps {
  onSuccessRedirectUrl?: string;
  vendorId?: string | null;
  isAdminOrCpo?: boolean;
  initialListingType?: "single" | "multi";
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
}: SharedProductUploadWizardProps) {
  const router = useRouter();

  // ── Step Navigation State (Steps 1 to 12) ──
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitAction, setSubmitAction] = useState<"draft" | "publish" | "review">("publish");

  // ── Vendor Context ──
  const [activeVendorId, setActiveVendorId] = useState<string | null>(initialVendorId);
  const [vendorProfile, setVendorProfile] = useState<any | null>(null);

  useEffect(() => {
    if (activeVendorId) {
      getVendorProfile(activeVendorId).then((v) => setVendorProfile(v));
    }
  }, [activeVendorId]);

  // ── STEP 1: Category & Listing Type ──
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [categorySearch, setCategorySearch] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>("");
  const [productType, setProductType] = useState<string>("");
  const [isMultiVariety, setIsMultiVariety] = useState<boolean>(initialListingType === "multi");
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState<boolean>(false);

  // ── STEP 2: Basic Info ──
  const [title, setTitle] = useState<string>("");
  const [brand, setBrand] = useState<string>("Intrihub");
  const [customBrandInput, setCustomBrandInput] = useState<string>("");
  const [isAddingNewBrand, setIsAddingNewBrand] = useState<boolean>(false);
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

  // ── STEP 3: Variants ──
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // ── STEP 4: Images & Media ──
  const [images, setImages] = useState<string[]>([]);
  const [isImageUploading, setIsImageUploading] = useState<boolean>(false);
  const [videoUrl, setVideoUrl] = useState<string>("");

  // ── STEP 5: Pricing & Tax ──
  const [mrp, setMrp] = useState<string>("");
  const [sellingPrice, setSellingPrice] = useState<string>("");
  const [gstRate, setGstRate] = useState<number>(18);
  const [hsnCode, setHsnCode] = useState<string>("");
  const [unitOfSale, setUnitOfSale] = useState<string>("box");
  const [perUnitQuantity, setPerUnitQuantity] = useState<string>("1");
  const [perUnitBaseUnit, setPerUnitBaseUnit] = useState<string>("kg");
  const [salePrice, setSalePrice] = useState<string>("");
  const [saleStartDate, setSaleStartDate] = useState<string>("");
  const [saleEndDate, setSaleEndDate] = useState<string>("");
  const [priceTiers, setPriceTiers] = useState<Array<{ minQuantity: number; price: number }>>([]);
  const [newTierQty, setNewTierQty] = useState<string>("");
  const [newTierPrice, setNewTierPrice] = useState<string>("");

  // ── STEP 6: Inventory & Stock ──
  const [stockQuantity, setStockQuantity] = useState<string>("100");
  const [sku, setSku] = useState<string>("");
  const [barcode, setBarcode] = useState<string>("");
  const [lowStockAlert, setLowStockAlert] = useState<string>("10");
  const [minOrderQuantity, setMinOrderQuantity] = useState<string>("1");
  const [maxOrderQuantity, setMaxOrderQuantity] = useState<string>("");
  const [allowBackorders, setAllowBackorders] = useState<boolean>(false);

  // ── STEP 7: Detailed Specifications (Phase 4) ──
  const [lengthCm, setLengthCm] = useState<string>("");
  const [widthCm, setWidthCm] = useState<string>("");
  const [heightCm, setHeightCm] = useState<string>("");
  const [packedWeightKg, setPackedWeightKg] = useState<string>("");
  const [inTheBox, setInTheBox] = useState<string>("");
  const [manufactureDate, setManufactureDate] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [dynamicAttributes, setDynamicAttributes] = useState<Record<string, string>>({});
  const [customSpecs, setCustomSpecs] = useState<Array<{ key: string; value: string }>>([]);
  const [newSpecKey, setNewSpecKey] = useState<string>("");
  const [newSpecValue, setNewSpecValue] = useState<string>("");

  // ── STEP 8: Shipping & Delivery (Phase 4) ──
  const [shippingMode, setShippingMode] = useState<string>("standard");
  const [dispatchTimeDays, setDispatchTimeDays] = useState<string>("2");
  const [shippingCoverage, setShippingCoverage] = useState<"all_india" | "custom_pincodes">("all_india");
  const [pincodesServed, setPincodesServed] = useState<string[]>([]);
  const [pincodeInput, setPincodeInput] = useState<string>("");
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState<string>("");
  const [deliveryCharge, setDeliveryCharge] = useState<string>("");
  const [allowScheduledDelivery, setAllowScheduledDelivery] = useState<boolean>(true);
  const [allowCod, setAllowCod] = useState<boolean>(true);
  const [isFragile, setIsFragile] = useState<boolean>(false);
  const [isPerishable, setIsPerishable] = useState<boolean>(false);

  // ── STEP 9: Returns & Warranty (Phase 4) ──
  const [returnPolicyDays, setReturnPolicyDays] = useState<string>("7");
  const [replacementAllowed, setReplacementAllowed] = useState<boolean>(true);
  const [warrantyType, setWarrantyType] = useState<string>("brand");
  const [warrantyDuration, setWarrantyDuration] = useState<string>("1 Year");
  const [returnConditions, setReturnConditions] = useState<string>(
    "Item must be returned unused in original brand packaging with all tags, inserts, and manuals intact."
  );

  // ── STEP 10: Compliance & Legal (Phase 4) ──
  const [complianceAge, setComplianceAge] = useState<boolean>(false);
  const [complianceHazardous, setComplianceHazardous] = useState<boolean>(false);
  const [complianceBattery, setComplianceBattery] = useState<boolean>(false);
  const [complianceLiquid, setComplianceLiquid] = useState<boolean>(false);
  const [certificates, setCertificates] = useState<string[]>([]);
  const [newCertificateInput, setNewCertificateInput] = useState<string>("");
  const [vendorDeclaration, setVendorDeclaration] = useState<boolean>(true);

  // ── STEP 11: SEO & Discoverability (Phase 5) ──
  const [slug, setSlug] = useState<string>("");
  const [metaTitle, setMetaTitle] = useState<string>("");
  const [metaDescription, setMetaDescription] = useState<string>("");
  const [listingStatus, setListingStatus] = useState<"active" | "draft" | "paused">("active");
  const [scheduledPublishDate, setScheduledPublishDate] = useState<string>("");
  const [isFeatured, setIsFeatured] = useState<boolean>(false);

  // ── STEP 12: Live Preview & Completeness Checklist (Phase 5) ──
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  // ── Draft Autosave (localStorage 30s) ──
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
    } catch {
      // ignore
    }
  }, [AUTOSAVE_KEY]);

  const handleRestoreDraft = () => {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.title) setTitle(d.title);
      if (d.selectedCategoryId) setSelectedCategoryId(d.selectedCategoryId);
      if (d.selectedSubcategoryId) setSelectedSubcategoryId(d.selectedSubcategoryId);
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
      if (d.gstRate !== undefined) setGstRate(d.gstRate);
      if (d.hsnCode) setHsnCode(d.hsnCode);
      if (d.unitOfSale) setUnitOfSale(d.unitOfSale);
      if (d.stockQuantity) setStockQuantity(d.stockQuantity);
      if (d.sku) setSku(d.sku);
      if (d.barcode) setBarcode(d.barcode);
      if (d.lowStockAlert) setLowStockAlert(d.lowStockAlert);
      if (d.minOrderQuantity) setMinOrderQuantity(d.minOrderQuantity);
      if (d.maxOrderQuantity) setMaxOrderQuantity(d.maxOrderQuantity);
      if (d.allowBackorders !== undefined) setAllowBackorders(d.allowBackorders);
      if (d.lengthCm) setLengthCm(d.lengthCm);
      if (d.widthCm) setWidthCm(d.widthCm);
      if (d.heightCm) setHeightCm(d.heightCm);
      if (d.packedWeightKg) setPackedWeightKg(d.packedWeightKg);
      if (d.inTheBox) setInTheBox(d.inTheBox);
      if (d.manufactureDate) setManufactureDate(d.manufactureDate);
      if (d.expiryDate) setExpiryDate(d.expiryDate);
      if (d.dynamicAttributes) setDynamicAttributes(d.dynamicAttributes);
      if (d.customSpecs) setCustomSpecs(d.customSpecs);
      if (d.shippingMode) setShippingMode(d.shippingMode);
      if (d.dispatchTimeDays) setDispatchTimeDays(d.dispatchTimeDays);
      if (d.pincodesServed) setPincodesServed(d.pincodesServed);
      if (d.freeDeliveryAbove) setFreeDeliveryAbove(d.freeDeliveryAbove);
      if (d.deliveryCharge) setDeliveryCharge(d.deliveryCharge);
      if (d.allowScheduledDelivery !== undefined) setAllowScheduledDelivery(d.allowScheduledDelivery);
      if (d.allowCod !== undefined) setAllowCod(d.allowCod);
      if (d.isFragile !== undefined) setIsFragile(d.isFragile);
      if (d.isPerishable !== undefined) setIsPerishable(d.isPerishable);
      if (d.returnPolicyDays) setReturnPolicyDays(d.returnPolicyDays);
      if (d.replacementAllowed !== undefined) setReplacementAllowed(d.replacementAllowed);
      if (d.warrantyType) setWarrantyType(d.warrantyType);
      if (d.warrantyDuration) setWarrantyDuration(d.warrantyDuration);
      if (d.returnConditions) setReturnConditions(d.returnConditions);
      if (d.complianceAge !== undefined) setComplianceAge(d.complianceAge);
      if (d.complianceHazardous !== undefined) setComplianceHazardous(d.complianceHazardous);
      if (d.complianceBattery !== undefined) setComplianceBattery(d.complianceBattery);
      if (d.complianceLiquid !== undefined) setComplianceLiquid(d.complianceLiquid);
      if (d.certificates) setCertificates(d.certificates);
      if (d.vendorDeclaration !== undefined) setVendorDeclaration(d.vendorDeclaration);
      if (d.slug) setSlug(d.slug);
      if (d.metaTitle) setMetaTitle(d.metaTitle);
      if (d.metaDescription) setMetaDescription(d.metaDescription);
      if (d.listingStatus) setListingStatus(d.listingStatus);
      if (d.scheduledPublishDate) setScheduledPublishDate(d.scheduledPublishDate);
      if (d.isFeatured !== undefined) setIsFeatured(d.isFeatured);
      if (d.variants) setVariants(d.variants);

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
          gstRate,
          hsnCode,
          unitOfSale,
          stockQuantity,
          sku,
          barcode,
          lowStockAlert,
          minOrderQuantity,
          maxOrderQuantity,
          allowBackorders,
          lengthCm,
          widthCm,
          heightCm,
          packedWeightKg,
          inTheBox,
          manufactureDate,
          expiryDate,
          dynamicAttributes,
          customSpecs,
          shippingMode,
          dispatchTimeDays,
          pincodesServed,
          freeDeliveryAbove,
          deliveryCharge,
          allowScheduledDelivery,
          allowCod,
          isFragile,
          isPerishable,
          returnPolicyDays,
          replacementAllowed,
          warrantyType,
          warrantyDuration,
          returnConditions,
          complianceAge,
          complianceHazardous,
          complianceBattery,
          complianceLiquid,
          certificates,
          vendorDeclaration,
          slug,
          metaTitle,
          metaDescription,
          listingStatus,
          scheduledPublishDate,
          isFeatured,
          variants,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } catch {
        // silent
      }
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
    countryOfOrigin,
    condition,
    images,
    videoUrl,
    mrp,
    sellingPrice,
    gstRate,
    hsnCode,
    unitOfSale,
    stockQuantity,
    sku,
    barcode,
    lowStockAlert,
    minOrderQuantity,
    maxOrderQuantity,
    allowBackorders,
    lengthCm,
    widthCm,
    heightCm,
    packedWeightKg,
    inTheBox,
    manufactureDate,
    expiryDate,
    dynamicAttributes,
    customSpecs,
    shippingMode,
    dispatchTimeDays,
    pincodesServed,
    freeDeliveryAbove,
    deliveryCharge,
    allowScheduledDelivery,
    allowCod,
    isFragile,
    isPerishable,
    returnPolicyDays,
    replacementAllowed,
    warrantyType,
    warrantyDuration,
    returnConditions,
    complianceAge,
    complianceHazardous,
    complianceBattery,
    complianceLiquid,
    certificates,
    vendorDeclaration,
    slug,
    metaTitle,
    metaDescription,
    listingStatus,
    scheduledPublishDate,
    isFeatured,
    variants,
  ]);

  // Auto-sync slug, metaTitle, metaDescription from title & description
  useEffect(() => {
    if (title && !slug) {
      setSlug(
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
    if (title && !metaTitle) {
      setMetaTitle(`${title} | Buy Online at IntriHub`);
    }
  }, [title, slug, metaTitle]);

  useEffect(() => {
    if (description && !metaDescription) {
      setMetaDescription(description.slice(0, 155).replace(/\n/g, " "));
    }
  }, [description, metaDescription]);

  // Load Categories on Mount
  useEffect(() => {
    getCategories().then((cats) => setCategories(cats as CategoryWithChildren[]));
  }, []);

  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCategoryId) || null;
  }, [categories, selectedCategoryId]);

  const selectedSubcategory = useMemo(() => {
    if (!selectedCategory || !selectedSubcategoryId) return null;
    return selectedCategory.children?.find((c: any) => c.id === selectedSubcategoryId) || null;
  }, [selectedCategory, selectedSubcategoryId]);

  // Active Category Attribute Schema (from DB or default fallback)
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
    if (!categorySearch.trim()) return categories;
    const q = categorySearch.toLowerCase().trim();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.children?.some((child: any) => child.name.toLowerCase().includes(q))
    );
  }, [categories, categorySearch]);

  // Duplicate Check
  useEffect(() => {
    if (!title.trim() || title.length < 4 || !activeVendorId) {
      setDuplicateWarning(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingDuplicate(true);
      const res = await checkDuplicateProduct({
        vendorId: activeVendorId,
        name: title,
        brand: brand === "other" ? customBrandInput : brand,
        modelNumber: modelNumber || undefined,
      });
      setCheckingDuplicate(false);
      if (res.isDuplicate) {
        setDuplicateWarning(
          `Notice: An item named "${res.duplicateName}" with this brand/model already exists in your store.`
        );
      } else {
        setDuplicateWarning(null);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [title, brand, customBrandInput, modelNumber, activeVendorId]);

  const mrpNum = parseFloat(mrp) || 0;
  const sellingNum = parseFloat(sellingPrice) || 0;
  const discountPercent =
    mrpNum > 0 && sellingNum > 0 && mrpNum > sellingNum
      ? Math.round(((mrpNum - sellingNum) / mrpNum) * 100)
      : 0;

  const perUnitBaseNum = parseFloat(perUnitQuantity) || 1;
  const calculatedPerUnitPrice =
    sellingNum > 0 && perUnitBaseNum > 0
      ? (sellingNum / perUnitBaseNum).toFixed(2)
      : null;

  // ── Completeness Score Calculation (Phase 5) ──
  const completeness = useMemo(() => {
    const checks = [
      { id: "category", label: "Category & Subcategory selected", done: Boolean(selectedCategoryId), weight: 10, required: true },
      { id: "title", label: "Product title provided (min 4 chars)", done: Boolean(title.trim().length >= 4), weight: 10, required: true },
      { id: "description", label: "Product description provided", done: Boolean(description.trim().length >= 20), weight: 10, required: true },
      { id: "brand", label: "Brand identified", done: Boolean(brand && (brand !== "other" || customBrandInput.trim())), weight: 10, required: true },
      { id: "images", label: "At least 1 high-res image added", done: images.filter((img) => img && !img.includes("placeholder")).length >= 1, weight: 15, required: true },
      {
        id: "price",
        label: isMultiVariety ? "Variants configured with prices" : "Selling price and MRP configured",
        done: isMultiVariety
          ? variants.length > 0 && variants.every((v) => Number(v.price || v.pricePerBox || 0) > 0)
          : Boolean(sellingNum > 0),
        weight: 15,
        required: true,
      },
      {
        id: "inventory",
        label: "Inventory stock and SKU configured",
        done: isMultiVariety
          ? variants.some((v) => Number(v.stockBoxes || 0) > 0)
          : Boolean(parseInt(stockQuantity, 10) >= 0),
        weight: 10,
        required: true,
      },
      {
        id: "specs",
        label: "Product dimensions or category specs filled",
        done: Boolean((lengthCm && widthCm) || Object.keys(dynamicAttributes).length > 0 || customSpecs.length > 0),
        weight: 5,
        required: false,
      },
      { id: "shipping", label: "Shipping mode and dispatch time configured", done: Boolean(shippingMode && dispatchTimeDays), weight: 5, required: false },
      { id: "returns", label: "Return policy & warranty set", done: Boolean(returnPolicyDays && warrantyDuration), weight: 5, required: false },
      { id: "declaration", label: "Vendor accuracy compliance accepted", done: Boolean(vendorDeclaration), weight: 5, required: true },
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
    lengthCm,
    widthCm,
    dynamicAttributes,
    customSpecs,
    shippingMode,
    dispatchTimeDays,
    returnPolicyDays,
    warrantyDuration,
    vendorDeclaration,
  ]);

  // ── Step Navigation & Inline Validations ──
  const validateStep = (step: number): boolean => {
    if (step === 1) {
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
      return true;
    }

    if (step === 3) {
      if (isMultiVariety) {
        if (variants.length === 0) {
          toast.error("Please generate or add at least 1 variant *");
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

    if (step === 4) {
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

    if (step === 5) {
      if (!isMultiVariety) {
        if (!sellingPrice || sellingNum <= 0) {
          toast.error("Please enter a valid Selling Price greater than ₹0 *");
          return false;
        }
        if (mrpNum > 0 && sellingNum > mrpNum) {
          toast.error("Selling Price cannot exceed the MRP Price *");
          return false;
        }
      }
      return true;
    }

    if (step === 6) {
      if (!isMultiVariety) {
        const stockNum = parseInt(stockQuantity, 10);
        if (isNaN(stockNum) || stockNum < 0) {
          toast.error("Please enter a valid Stock quantity *");
          return false;
        }
      }
      return true;
    }

    if (step === 8) {
      const dispatchDays = parseInt(dispatchTimeDays, 10);
      if (isNaN(dispatchDays) || dispatchDays < 1) {
        toast.error("Please enter a valid dispatch time in days (min 1 day) *");
        return false;
      }
      return true;
    }

    if (step === 10) {
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

    if (currentStep === 2 && !isMultiVariety) {
      // Skip Step 3 if Single Item
      setCurrentStep(4);
    } else {
      setCurrentStep((prev) => Math.min(12, prev + 1));
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 4 && !isMultiVariety) {
      setCurrentStep(2);
    } else {
      setCurrentStep((prev) => Math.max(1, prev - 1));
    }
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

  const handleAddPriceTier = () => {
    const q = parseInt(newTierQty, 10);
    const p = parseFloat(newTierPrice);
    if (!q || q <= 1 || isNaN(p) || p <= 0) {
      toast.error("Please enter valid minimum quantity (>1) and tier price (>0)");
      return;
    }
    if (priceTiers.some((t) => t.minQuantity === q)) {
      toast.error(`Tier for quantity ${q} already exists`);
      return;
    }
    setPriceTiers([...priceTiers, { minQuantity: q, price: p }].sort((a, b) => a.minQuantity - b.minQuantity));
    setNewTierQty("");
    setNewTierPrice("");
  };

  const handleRemovePriceTier = (idx: number) => {
    setPriceTiers(priceTiers.filter((_, i) => i !== idx));
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

  const handleAddPincode = () => {
    const p = pincodeInput.trim();
    if (!p || p.length !== 6 || !/^\d+$/.test(p)) {
      toast.error("Please enter a valid 6-digit Indian pincode");
      return;
    }
    if (pincodesServed.includes(p)) {
      toast.error("Pincode already added");
      return;
    }
    setPincodesServed([...pincodesServed, p]);
    setPincodeInput("");
  };

  const handleRemovePincode = (p: string) => {
    setPincodesServed(pincodesServed.filter((x) => x !== p));
  };

  const handleAddCertificate = () => {
    const cert = newCertificateInput.trim();
    if (!cert) return;
    if (certificates.includes(cert)) {
      toast.error("Certificate already added");
      return;
    }
    setCertificates([...certificates, cert]);
    setNewCertificateInput("");
  };

  const handleRemoveCertificate = (idx: number) => {
    setCertificates(certificates.filter((_, i) => i !== idx));
  };

  // ── Unified Submit Handler (Steps 1–12) ──
  const handleFinalSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    for (let st = 1; st <= 10; st++) {
      if (st === 3 && !isMultiVariety) continue;
      if (!validateStep(st)) {
        setCurrentStep(st);
        return;
      }
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

    // Combine dynamic attributes and custom specifications
    const formattedAttributes: Array<{ key: string; value: string }> = [];
    Object.entries(dynamicAttributes).forEach(([k, v]) => {
      if (v && v.trim()) formattedAttributes.push({ key: k, value: v.trim() });
    });
    customSpecs.forEach((s) => {
      if (s.key.trim() && s.value.trim()) formattedAttributes.push({ key: s.key.trim(), value: s.value.trim() });
    });

    const formattedVariants = isMultiVariety && variants.length > 0
      ? variants.map((v, vIdx) => ({
          sku: v.sku || null,
          variantName: v.variantName || v.attributeValue || v.size || `Variant ${vIdx + 1}`,
          size: v.attributeValue || v.size || "Standard",
          finish: v.finish || "Standard",
          color: v.color || "Standard",
          colorHex: v.colorHex || resolveColorHex(v.color || "Standard"),
          image: v.image || images[0] || null,
          images: Array.isArray(v.images) && v.images.length > 0 ? v.images : (v.image ? [v.image] : (images[0] ? [images[0]] : [])),
          unit: v.unit || unitOfSale,
          attributes: v.attributes || null,
          attributeLabel: v.attributeLabel || "Option",
          attributeValue: v.attributeValue || v.size || "Standard",
          mrp: v.mrp !== undefined && v.mrp !== null ? Number(v.mrp) : mrpNum || null,
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
          salePrice: (v as any).salePrice !== undefined && (v as any).salePrice !== null ? Number((v as any).salePrice) : null,
          saleStartDate: (v as any).saleStartDate || null,
          saleEndDate: (v as any).saleEndDate || null,
          allowBackorders: Boolean((v as any).allowBackorders),
        }))
      : [
          {
            variantName: "Standard",
            size: "Standard",
            finish: "Standard",
            color: "Standard",
            colorHex: resolveColorHex("Standard"),
            image: images[0] || null,
            images: images.length > 0 ? [images[0]] : [],
            unit: unitOfSale,
            attributeLabel: "Option",
            attributeValue: "Standard",
            mrp: mrpNum > 0 ? mrpNum : null,
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
            salePrice: salePrice ? parseFloat(salePrice) : null,
            saleStartDate: saleStartDate || null,
            saleEndDate: saleEndDate || null,
            allowBackorders,
          },
        ];

    const targetStatus = submitAction === "draft" ? "draft" : listingStatus;
    const targetApproval = submitAction === "draft" || !isAdminOrCpo ? "pending" : "approved";

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
      vendorId: activeVendorId || null,
      manufacturer: manufacturer || null,
      condition,
      highlights,
      keywords,
      countryOfOrigin,
      hsnCode: hsnCode || null,
      gstPercent: gstRate,
      gstRate,
      salePrice: salePrice ? parseFloat(salePrice) : null,
      saleStartDate: saleStartDate || null,
      saleEndDate: saleEndDate || null,
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
      manufactureDate: manufactureDate || null,
      expiryDate: expiryDate || null,
      shippingMode,
      dispatchTimeDays: parseInt(dispatchTimeDays, 10) || 2,
      pincodesServed: shippingCoverage === "custom_pincodes" ? pincodesServed : [],
      freeDeliveryAbove: freeDeliveryAbove ? parseFloat(freeDeliveryAbove) : null,
      deliveryCharge: deliveryCharge ? parseFloat(deliveryCharge) : null,
      allowScheduledDelivery,
      allowCod,
      isFragile,
      isPerishable,
      returnPolicyDays: parseInt(returnPolicyDays, 10) || 7,
      replacementAllowed,
      warrantyType,
      warrantyDuration,
      returnConditions,
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
      isFeatured,
      scheduledPublishDate: scheduledPublishDate || null,
      status: targetStatus,
      approvalStatus: targetApproval,
    });

    setLoading(false);

    if (res.success) {
      localStorage.removeItem(AUTOSAVE_KEY);
      toast.success(
        submitAction === "draft"
          ? `Draft saved: "${title}"`
          : isAdminOrCpo
          ? `Listing published: "${title}"`
          : `Listing submitted for approval: "${title}"`
      );
      router.push(onSuccessRedirectUrl);
    } else {
      toast.error(res.error || "Failed to create product listing");
    }
  };

  const stepsList = [
    { num: 1, label: "Category & Type", icon: Sliders },
    { num: 2, label: "Basic Info", icon: Info },
    { num: 3, label: isMultiVariety ? "Variants" : "Single Item", icon: Layers, optional: !isMultiVariety },
    { num: 4, label: "Images & Media", icon: ImageIcon },
    { num: 5, label: "Pricing & Tax", icon: IndianRupee },
    { num: 6, label: "Inventory", icon: Package },
    { num: 7, label: "Detailed Specs", icon: Box },
    { num: 8, label: "Shipping & Delivery", icon: Truck },
    { num: 9, label: "Returns & Warranty", icon: RotateCcw },
    { num: 10, label: "Compliance & Legal", icon: FileCheck2 },
    { num: 11, label: "SEO & Discovery", icon: Globe },
    { num: 12, label: "Preview & Publish", icon: Eye },
  ];

  return (
    <form onSubmit={handleFinalSubmit} className="space-y-6 max-w-5xl mx-auto pb-24">
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
              <h1 className="text-xl sm:text-2xl font-black text-[#052a51]">Item Upload & Variant System</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                12-Step Unified
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              One shared listing engine with full catalog specs, shipping, compliance, and SEO across Vendor, CPO, & Admin
            </p>
          </div>
        </div>

        {/* Global Save Draft & Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setSubmitAction("draft");
              handleFinalSubmit();
            }}
            disabled={loading}
            className="px-4 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-2xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading && submitAction === "draft" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            <span>Save Draft</span>
          </button>

          <button
            type="submit"
            onClick={() => setSubmitAction("publish")}
            disabled={loading || isImageUploading}
            className="px-5 py-2.5 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-2xl shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading && submitAction === "publish" ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
            <span>{isAdminOrCpo ? "Publish Listing" : "Submit for Approval"}</span>
          </button>
        </div>
      </div>

      {/* ── Progress Meter & Autosave Badge ── */}
      <div className="bg-white px-5 py-3.5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-[#052a51]">
            Step {currentStep} of 12: <span className="text-[#F26522]">{stepsList[currentStep - 1]?.label}</span>
          </span>
          <div className="w-32 bg-gray-100 h-2 rounded-full overflow-hidden hidden sm:block">
            <div
              className="bg-[#F26522] h-full transition-all duration-300 rounded-full"
              style={{ width: `${Math.round((currentStep / 12) * 100)}%` }}
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

      {/* ── Stepper Navigation Bar (12 Steps Grid) ── */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {stepsList.map((st) => {
            const Icon = st.icon;
            const isCompleted = currentStep > st.num;
            const isCurrent = currentStep === st.num;
            const isSkipped = st.num === 3 && !isMultiVariety;

            return (
              <button
                key={st.num}
                type="button"
                onClick={() => {
                  if (isSkipped) return;
                  if (st.num < currentStep || validateStep(currentStep)) {
                    setCurrentStep(st.num);
                  }
                }}
                className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2 ${
                  isCurrent
                    ? "bg-[#052a51] text-white border-[#052a51] shadow-xs"
                    : isCompleted
                    ? "bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100/60"
                    : isSkipped
                    ? "bg-gray-50 text-gray-400 border-gray-200 opacity-60 cursor-not-allowed"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-xl flex items-center justify-center shrink-0 text-[10px] font-black ${
                    isCurrent
                      ? "bg-[#F26522] text-white"
                      : isCompleted
                      ? "bg-emerald-600 text-white"
                      : isSkipped
                      ? "bg-gray-200 text-gray-500"
                      : "bg-white text-gray-700 border border-gray-300"
                  }`}
                >
                  {isCompleted ? <Check size={12} /> : st.num}
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold block truncate leading-tight">{st.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── STEP 1: CATEGORY & LISTING TYPE ── */}
      {currentStep === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-2xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-black text-[#052a51] flex items-center gap-2">
              <Sliders size={20} className="text-[#F26522]" />
              Select Product Category & Listing Architecture
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Choose the architectural taxonomy and decide between a single item or a multi-variety matrix.
            </p>
          </div>

          {/* Listing Architecture Selection */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-black text-gray-800 uppercase tracking-wider block">
              Listing Format <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setIsMultiVariety(false)}
                className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  !isMultiVariety
                    ? "border-[#F26522] bg-orange-50/40 text-[#052a51] shadow-xs"
                    : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <strong className="text-sm font-black">Single Item Listing</strong>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!isMultiVariety ? "border-[#F26522] bg-[#F26522]" : "border-gray-300"}`}>
                    {!isMultiVariety && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Ideal for standalone products with 1 fixed size, finish, and price (e.g. 1 bundle, standard machine).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setIsMultiVariety(true)}
                className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  isMultiVariety
                    ? "border-[#F26522] bg-orange-50/40 text-[#052a51] shadow-xs"
                    : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <strong className="text-sm font-black">Multi-Variety Item (Recommended)</strong>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isMultiVariety ? "border-[#F26522] bg-[#F26522]" : "border-gray-300"}`}>
                    {isMultiVariety && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Multiple sizes, finishes, colours, or weight packs under one single product page with switcher tabs.
                </p>
              </button>
            </div>
          </div>

          {/* Category Tree Selector */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-black text-gray-800 uppercase tracking-wider">
                Select Store Category <span className="text-red-500">*</span>
              </label>
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter categories..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#F26522]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto p-1 border border-gray-100 rounded-2xl">
              {filteredCategoryList.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      setSelectedSubcategoryId("");
                      setDynamicAttributes({});
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                      isSelected
                        ? "border-[#052a51] bg-[#052a51] text-white shadow-xs"
                        : "border-gray-200 bg-gray-50/60 hover:bg-gray-100 text-gray-800"
                    }`}
                  >
                    <span className="text-xs font-black block truncate">{cat.name}</span>
                    <span className={`text-[10px] ${isSelected ? "text-gray-300" : "text-gray-400"}`}>
                      {cat.productCount ?? 0} listings
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subcategory / Product Type */}
          {selectedCategory && (
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <label className="text-xs font-black text-gray-800 uppercase tracking-wider block">
                Subcategory / Material Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="e.g. Vitrified Floor Tile, Copper Wire, Modular Switch"
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#F26522]"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: BASIC INFO ── */}
      {currentStep === 2 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-2xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-black text-[#052a51] flex items-center gap-2">
              <Info size={20} className="text-[#F26522]" />
              Product Identity & Details
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Provide the listing title, manufacturer identity, condition, highlights, and search discoverability keywords.
            </p>
          </div>

          {/* Duplicate Listing Warning Banner */}
          {duplicateWarning && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertTriangle size={16} className="text-amber-600 shrink-0" />
              <span>{duplicateWarning}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700">
                Product Title <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-gray-400">{title.length}/150</span>
            </div>
            <input
              type="text"
              maxLength={150}
              placeholder="e.g. Kajaria Royal Statuario 600x1200mm Vitrified Floor Tile"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#F26522]"
            />
          </div>

          {/* Brand & Manufacturer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                Brand Name <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Kajaria, Havells, Intrihub, Asian Paints"
                  value={brand === "other" ? customBrandInput : brand}
                  onChange={(e) => {
                    setBrand("other");
                    setCustomBrandInput(e.target.value);
                  }}
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#F26522]"
                />
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

          {/* Model Number, Origin & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Model / Catalogue Code</label>
              <input
                type="text"
                placeholder="e.g. KAJ-RS-6012"
                value={modelNumber}
                onChange={(e) => setModelNumber(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#F26522]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Country of Origin</label>
              <input
                type="text"
                value={countryOfOrigin}
                onChange={(e) => setCountryOfOrigin(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#F26522]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Item Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#F26522] bg-white cursor-pointer"
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">
              Product Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Detailed description of features, technical specifications, and recommended applications..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#F26522]"
            />
          </div>

          {/* Highlights */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-gray-700 block">Product Highlights (Bullet Points)</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a highlight bullet (e.g. Anti-skid surface, 100% waterproof)"
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
                className="px-4 py-2 bg-[#052a51] hover:bg-[#073666] text-white text-xs font-bold rounded-2xl transition-all cursor-pointer"
              >
                Add Highlight
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

          {/* Search Keywords */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-gray-700 block">Search Keywords / Tags</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. vitrified tile, glossy white, 2x4 floor tile"
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
                className="px-4 py-2 bg-[#052a51] hover:bg-[#073666] text-white text-xs font-bold rounded-2xl transition-all cursor-pointer"
              >
                Add Keyword
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {keywords.map((k, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full text-xs font-medium"
                >
                  #{k}
                  <button type="button" onClick={() => handleRemoveKeyword(i)} className="text-blue-400 hover:text-red-600">
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: VARIANTS (MULTI-VARIETY ONLY) ── */}
      {currentStep === 3 && isMultiVariety && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-2xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-black text-[#052a51] flex items-center gap-2">
              <Layers size={20} className="text-[#F26522]" />
              Variety & Options Matrix
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Configure multi-dimensional options (size, color, finish, unit), set individual prices, images, and inventory boxes.
            </p>
          </div>

          <UnifiedVariantManager
            hasVariants={isMultiVariety}
            onHasVariantsChange={setIsMultiVariety}
            variants={variants}
            onChange={setVariants}
            vendorId={activeVendorId}
            unitOfSale={unitOfSale}
            baseImages={images}
          />
        </div>
      )}

      {/* ── STEP 4: IMAGES & MEDIA ── */}
      {currentStep === 4 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-2xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-black text-[#052a51] flex items-center gap-2">
              <ImageIcon size={20} className="text-[#F26522]" />
              Product Media & Visuals
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Upload high-resolution photography, installation renders, and link video walkthroughs.
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
              Product Video Walkthrough (YouTube or MP4 URL)
            </label>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#F26522]"
            />
          </div>
        </div>
      )}

      {/* ── STEP 5: PRICING & TAX ── */}
      {currentStep === 5 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-2xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-black text-[#052a51] flex items-center gap-2">
              <IndianRupee size={20} className="text-[#F26522]" />
              Pricing, Tax & Volume Discounts
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Set standard retail pricing, unit calculations, GST rate, HSN classification, and bulk B2B price tiers.
            </p>
          </div>

          {!isMultiVariety ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">MRP (Maximum Retail Price) ₹</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 1499"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#F26522]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Selling Price ₹ <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 1199"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#F26522]"
                />
                {discountPercent > 0 && (
                  <span className="text-[11px] font-bold text-emerald-600 block">
                    Calculated Discount: {discountPercent}% OFF
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs">
              <strong className="font-bold">Multi-Variety Pricing Active:</strong> Individual pricing is set per variant row in Step 3. Below GST, HSN, and B2B tiers apply globally to this product family.
            </div>
          )}

          {/* Unit of Sale & GST */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Unit of Sale</label>
              <select
                value={unitOfSale}
                onChange={(e) => setUnitOfSale(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#F26522] bg-white cursor-pointer"
              >
                {UNIT_OF_SALE_OPTIONS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">GST Slab (%)</label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#F26522] bg-white cursor-pointer"
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
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#F26522]"
              />
            </div>
          </div>

          {/* B2B Volume Price Tiers */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <label className="text-xs font-black text-gray-800 uppercase tracking-wider block">
              B2B / Volume Tier Discounts
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="2"
                placeholder="Min Qty (e.g. 50)"
                value={newTierQty}
                onChange={(e) => setNewTierQty(e.target.value)}
                className="w-36 px-3.5 py-2 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#F26522]"
              />
              <input
                type="number"
                min="1"
                placeholder="Tier Price ₹"
                value={newTierPrice}
                onChange={(e) => setNewTierPrice(e.target.value)}
                className="w-36 px-3.5 py-2 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#F26522]"
              />
              <button
                type="button"
                onClick={handleAddPriceTier}
                className="px-4 py-2 bg-[#052a51] hover:bg-[#073666] text-white text-xs font-bold rounded-2xl transition-all cursor-pointer"
              >
                Add Tier
              </button>
            </div>
            {priceTiers.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {priceTiers.map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-medium"
                  >
                    <span>≥ {t.minQuantity} units: <strong>₹{t.price}</strong></span>
                    <button type="button" onClick={() => handleRemovePriceTier(idx)} className="text-emerald-500 hover:text-red-600">
                      <Trash2 size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 6: INVENTORY & STOCK ── */}
      {currentStep === 6 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-2xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-black text-[#052a51] flex items-center gap-2">
              <Package size={20} className="text-[#F26522]" />
              Inventory & Fulfillment Limits
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Configure available stock count, low stock urgency thresholds, and customer cart order constraints.
            </p>
          </div>

          {!isMultiVariety ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Total Stock Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#F26522]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">SKU Code</label>
                <input
                  type="text"
                  placeholder="e.g. IH-TILE-001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#F26522]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Barcode / EAN</label>
                <input
                  type="text"
                  placeholder="e.g. 8901234567890"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#F26522]"
                />
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs">
              <strong className="font-bold">Multi-Variety Inventory Active:</strong> Stock boxes and SKU codes are set per variant row in Step 3. Below limits govern customer cart constraints.
            </div>
          )}

          {/* Thresholds & Order Quantities */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Low Stock Alert Threshold</label>
              <input
                type="number"
                min="1"
                value={lowStockAlert}
                onChange={(e) => setLowStockAlert(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs"
              />
              <span className="text-[10px] text-gray-400">Shows &quot;Only N left&quot; badge to shoppers</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Min Order Quantity</label>
              <input
                type="number"
                min="1"
                value={minOrderQuantity}
                onChange={(e) => setMinOrderQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Max Order Quantity</label>
              <input
                type="number"
                min="1"
                placeholder="No limit"
                value={maxOrderQuantity}
                onChange={(e) => setMaxOrderQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs"
              />
            </div>
          </div>

          {/* Backorders Toggle */}
          <div className="p-4 rounded-2xl border border-gray-200 flex items-center justify-between">
            <div>
              <strong className="text-xs font-bold text-gray-800 block">Allow Backorders</strong>
              <p className="text-[11px] text-gray-400">
                Customers can continue ordering when stock reaches 0 (fulfilled upon restock).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAllowBackorders(!allowBackorders)}
              className={`w-12 h-6.5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                allowBackorders ? "bg-[#F26522]" : "bg-gray-200"
              }`}
            >
              <div
                className={`w-5.5 h-5.5 rounded-full bg-white transition-transform ${
                  allowBackorders ? "translate-x-5.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 7: DETAILED SPECIFICATIONS (PHASE 4) ── */}
      {currentStep === 7 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-2xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-black text-[#052a51] flex items-center gap-2">
              <Box size={20} className="text-[#F26522]" />
              Detailed Specifications & Dimensions
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Dynamic category attributes, package dimensions, weights, and custom technical specification key-values.
            </p>
          </div>

          {/* Dimensions & Weight */}
          <div className="space-y-3">
            <label className="text-xs font-black text-gray-800 uppercase tracking-wider block">
              Item Dimensions & Packaging Weight
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
                  className="w-full px-3.5 py-2 rounded-2xl border border-gray-200 text-xs"
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
                  className="w-full px-3.5 py-2 rounded-2xl border border-gray-200 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-gray-500">Height / Thickness (cm)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 0.9"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl border border-gray-200 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-gray-500">Packed Weight (kg)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 18.5"
                  value={packedWeightKg}
                  onChange={(e) => setPackedWeightKg(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl border border-gray-200 text-xs"
                />
              </div>
            </div>
          </div>

          {/* In the Box & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-bold text-gray-700">In the Box / Package Contents</label>
              <input
                type="text"
                placeholder="e.g. 4 Tiles (16 sq.ft), Installation Guide"
                value={inTheBox}
                onChange={(e) => setInTheBox(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Manufacture Date</label>
              <input
                type="date"
                value={manufactureDate}
                onChange={(e) => setManufactureDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Expiry Date (if applicable)</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs"
              />
            </div>
          </div>

          {/* Dynamic Category Specifications (Rendered from schema) */}
          {activeAttributeSchema.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-gray-800 uppercase tracking-wider block">
                  {selectedCategory?.name} Dynamic Specifications
                </label>
                <span className="text-[10px] text-gray-400">Standardized category attributes</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {activeAttributeSchema.map((field, fIdx) => (
                  <div key={fIdx} className="space-y-1 bg-gray-50/70 p-3 rounded-2xl border border-gray-200/80">
                    <label className="text-[11px] font-bold text-gray-700 block truncate">
                      {field.name} {field.unit ? `(${field.unit})` : ""}
                    </label>
                    {field.type === "select" && field.options ? (
                      <select
                        value={dynamicAttributes[field.name] || ""}
                        onChange={(e) => setDynamicAttributes({ ...dynamicAttributes, [field.name]: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-white cursor-pointer"
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
                        placeholder={`Enter ${field.name.toLowerCase()}`}
                        value={dynamicAttributes[field.name] || ""}
                        onChange={(e) => setDynamicAttributes({ ...dynamicAttributes, [field.name]: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-white"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Specifications Table */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <label className="text-xs font-black text-gray-800 uppercase tracking-wider block">
              Custom Key-Value Specifications
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Spec Label (e.g. Breaking Strength)"
                value={newSpecKey}
                onChange={(e) => setNewSpecKey(e.target.value)}
                className="w-48 px-3.5 py-2 rounded-2xl border border-gray-200 text-xs"
              />
              <input
                type="text"
                placeholder="Spec Value (e.g. >2000 N)"
                value={newSpecValue}
                onChange={(e) => setNewSpecValue(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-2xl border border-gray-200 text-xs"
              />
              <button
                type="button"
                onClick={handleAddCustomSpec}
                className="px-4 py-2 bg-[#052a51] hover:bg-[#073666] text-white text-xs font-bold rounded-2xl transition-all cursor-pointer"
              >
                Add Spec
              </button>
            </div>
            {customSpecs.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {customSpecs.map((spec, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-2.5 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between text-xs"
                  >
                    <span>
                      <strong className="text-gray-600">{spec.key}:</strong>{" "}
                      <span className="text-gray-900 font-bold">{spec.value}</span>
                    </span>
                    <button type="button" onClick={() => handleRemoveCustomSpec(sIdx)} className="text-gray-400 hover:text-red-600">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 8: SHIPPING & DELIVERY (PHASE 4) ── */}
      {currentStep === 8 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-2xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-black text-[#052a51] flex items-center gap-2">
              <Truck size={20} className="text-[#F26522]" />
              Shipping, Dispatch & Logistics
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Configure shipping modes, dispatch handling lead times, geographic delivery reach, and COD options.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Shipping Mode</label>
              <select
                value={shippingMode}
                onChange={(e) => setShippingMode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs bg-white cursor-pointer"
              >
                <option value="standard">Standard Courier Dispatch</option>
                <option value="express">IntriHub Express (Within 60 Mins)</option>
                <option value="heavy">Heavy Freight / Truck Cargo</option>
                <option value="vendor">Vendor Direct Self-Ship</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                Dispatch Lead Time (Days) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={dispatchTimeDays}
                onChange={(e) => setDispatchTimeDays(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Flat Delivery Charge ₹</label>
              <input
                type="number"
                min="0"
                placeholder="0 (Free Delivery)"
                value={deliveryCharge}
                onChange={(e) => setDeliveryCharge(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs"
              />
            </div>
          </div>

          {/* Delivery Threshold & Reach */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Free Delivery Above Order Value ₹</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 15000"
                value={freeDeliveryAbove}
                onChange={(e) => setFreeDeliveryAbove(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Geographic Coverage</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShippingCoverage("all_india")}
                  className={`flex-1 py-2 rounded-2xl border text-xs font-bold cursor-pointer ${
                    shippingCoverage === "all_india"
                      ? "bg-[#052a51] text-white border-[#052a51]"
                      : "bg-gray-50 text-gray-700 border-gray-200"
                  }`}
                >
                  All-India Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setShippingCoverage("custom_pincodes")}
                  className={`flex-1 py-2 rounded-2xl border text-xs font-bold cursor-pointer ${
                    shippingCoverage === "custom_pincodes"
                      ? "bg-[#052a51] text-white border-[#052a51]"
                      : "bg-gray-50 text-gray-700 border-gray-200"
                  }`}
                >
                  Specific Pincodes
                </button>
              </div>
            </div>
          </div>

          {/* Specific Pincodes Tag Input */}
          {shippingCoverage === "custom_pincodes" && (
            <div className="space-y-2 p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <label className="text-xs font-bold text-gray-700 block">Served Pincodes</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit pincode"
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value)}
                  className="w-48 px-3.5 py-2 rounded-xl border border-gray-300 text-xs bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddPincode}
                  className="px-4 py-2 bg-[#052a51] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Add Pincode
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {pincodesServed.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs"
                  >
                    {p}
                    <button type="button" onClick={() => handleRemovePincode(p)} className="text-gray-400 hover:text-red-600">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Toggles: Scheduled, COD, Fragile, Perishable */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <div className="p-3.5 rounded-2xl border border-gray-200 flex items-center justify-between">
              <div>
                <strong className="text-xs font-bold text-gray-800 block">Allow Scheduled Delivery</strong>
                <p className="text-[10px] text-gray-400">Buyers can choose preferred delivery slots</p>
              </div>
              <input
                type="checkbox"
                checked={allowScheduledDelivery}
                onChange={(e) => setAllowScheduledDelivery(e.target.checked)}
                className="w-4 h-4 text-[#F26522] rounded cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-2xl border border-gray-200 flex items-center justify-between">
              <div>
                <strong className="text-xs font-bold text-gray-800 block">Allow Cash on Delivery (COD)</strong>
                <p className="text-[10px] text-gray-400">Cash collection upon doorstep delivery</p>
              </div>
              <input
                type="checkbox"
                checked={allowCod}
                onChange={(e) => setAllowCod(e.target.checked)}
                className="w-4 h-4 text-[#F26522] rounded cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-2xl border border-gray-200 flex items-center justify-between">
              <div>
                <strong className="text-xs font-bold text-gray-800 block">Fragile Item Handling</strong>
                <p className="text-[10px] text-gray-400">Requires protective bubble packaging & fragile stickers</p>
              </div>
              <input
                type="checkbox"
                checked={isFragile}
                onChange={(e) => setIsFragile(e.target.checked)}
                className="w-4 h-4 text-[#F26522] rounded cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-2xl border border-gray-200 flex items-center justify-between">
              <div>
                <strong className="text-xs font-bold text-gray-800 block">Perishable Material</strong>
                <p className="text-[10px] text-gray-400">Time-sensitive items (e.g. rapid adhesives)</p>
              </div>
              <input
                type="checkbox"
                checked={isPerishable}
                onChange={(e) => setIsPerishable(e.target.checked)}
                className="w-4 h-4 text-[#F26522] rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 9: RETURNS & WARRANTY (PHASE 4) ── */}
      {currentStep === 9 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-2xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-black text-[#052a51] flex items-center gap-2">
              <RotateCcw size={20} className="text-[#F26522]" />
              Returns, Replacement & Warranty Policies
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Transparent customer policies build trust and reduce post-delivery dispute escalations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Return Window</label>
              <select
                value={returnPolicyDays}
                onChange={(e) => setReturnPolicyDays(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs bg-white cursor-pointer"
              >
                <option value="0">No Returns (Final Sale)</option>
                <option value="7">7 Days Easy Return</option>
                <option value="10">10 Days Return</option>
                <option value="15">15 Days Return</option>
                <option value="30">30 Days Project Return</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Warranty Type</label>
              <select
                value={warrantyType}
                onChange={(e) => setWarrantyType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs bg-white cursor-pointer"
              >
                <option value="brand">Manufacturer / Brand Warranty</option>
                <option value="vendor">Seller Direct Warranty</option>
                <option value="intrihub">IntriHub Verified Guarantee</option>
                <option value="none">No Warranty</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Warranty Duration</label>
              <input
                type="text"
                placeholder="e.g. 1 Year, 5 Years, 10 Years"
                value={warrantyDuration}
                onChange={(e) => setWarrantyDuration(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs"
              />
            </div>
          </div>

          {/* Replacement Toggle */}
          <div className="p-4 rounded-2xl border border-gray-200 flex items-center justify-between">
            <div>
              <strong className="text-xs font-bold text-gray-800 block">Allow Free Replacement for Transit Damage</strong>
              <p className="text-[11px] text-gray-400">
                Damaged or mismatched items will be replaced free of charge without refund disputes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReplacementAllowed(!replacementAllowed)}
              className={`w-12 h-6.5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                replacementAllowed ? "bg-[#F26522]" : "bg-gray-200"
              }`}
            >
              <div
                className={`w-5.5 h-5.5 rounded-full bg-white transition-transform ${
                  replacementAllowed ? "translate-x-5.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Return Conditions */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">Return & Replacement Conditions</label>
            <textarea
              rows={3}
              value={returnConditions}
              onChange={(e) => setReturnConditions(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#F26522]"
            />
          </div>
        </div>
      )}

      {/* ── STEP 10: COMPLIANCE & LEGAL (PHASE 4) ── */}
      {currentStep === 10 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-2xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-black text-[#052a51] flex items-center gap-2">
              <FileCheck2 size={20} className="text-[#F26522]" />
              Regulatory Compliance & Legal Declarations
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Ensure compliance with Indian Bureau of Indian Standards (BIS), consumer protection laws, and IntriHub marketplace terms.
            </p>
          </div>

          {/* Declarations Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl border border-gray-200 flex items-center justify-between">
              <div>
                <strong className="text-xs font-bold text-gray-800 block">Age Restriction (18+)</strong>
                <p className="text-[10px] text-gray-400">Industrial power machinery or hazardous solvents</p>
              </div>
              <input
                type="checkbox"
                checked={complianceAge}
                onChange={(e) => setComplianceAge(e.target.checked)}
                className="w-4 h-4 text-[#F26522] rounded cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-2xl border border-gray-200 flex items-center justify-between">
              <div>
                <strong className="text-xs font-bold text-gray-800 block">Hazardous Material</strong>
                <p className="text-[10px] text-gray-400">Contains flammable gases or toxic compounds</p>
              </div>
              <input
                type="checkbox"
                checked={complianceHazardous}
                onChange={(e) => setComplianceHazardous(e.target.checked)}
                className="w-4 h-4 text-[#F26522] rounded cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-2xl border border-gray-200 flex items-center justify-between">
              <div>
                <strong className="text-xs font-bold text-gray-800 block">Contains Batteries</strong>
                <p className="text-[10px] text-gray-400">Built-in Lithium/Lead batteries</p>
              </div>
              <input
                type="checkbox"
                checked={complianceBattery}
                onChange={(e) => setComplianceBattery(e.target.checked)}
                className="w-4 h-4 text-[#F26522] rounded cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-2xl border border-gray-200 flex items-center justify-between">
              <div>
                <strong className="text-xs font-bold text-gray-800 block">Liquid Material</strong>
                <p className="text-[10px] text-gray-400">Paints, primers, or liquid adhesives</p>
              </div>
              <input
                type="checkbox"
                checked={complianceLiquid}
                onChange={(e) => setComplianceLiquid(e.target.checked)}
                className="w-4 h-4 text-[#F26522] rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Certificates */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-gray-700 block">Compliance Certificates / BIS Reg Numbers</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. BIS/ISI: CM/L-1234567, ISO 9001:2015"
                value={newCertificateInput}
                onChange={(e) => setNewCertificateInput(e.target.value)}
                className="flex-1 px-4 py-2 rounded-2xl border border-gray-200 text-xs"
              />
              <button
                type="button"
                onClick={handleAddCertificate}
                className="px-4 py-2 bg-[#052a51] text-white text-xs font-bold rounded-2xl cursor-pointer"
              >
                Add Number
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {certificates.map((cert, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs"
                >
                  {cert}
                  <button type="button" onClick={() => handleRemoveCertificate(idx)} className="text-gray-400 hover:text-red-600">
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Mandatory Vendor Legal Declaration */}
          <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={vendorDeclaration}
                onChange={(e) => setVendorDeclaration(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-[#F26522] rounded cursor-pointer"
              />
              <span className="text-xs text-gray-800 leading-relaxed">
                <strong className="text-[#052a51]">Vendor Accuracy Declaration:</strong> I hereby declare and confirm that
                all details, dimensions, specifications, pricing, HSN codes, and compliance declarations provided for this listing
                are authentic, accurate, and comply with all applicable consumer laws and IntriHub Marketplace seller standards.
              </span>
            </label>
          </div>
        </div>
      )}

      {/* ── STEP 11: SEO & DISCOVERABILITY (PHASE 5) ── */}
      {currentStep === 11 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-2xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-black text-[#052a51] flex items-center gap-2">
              <Globe size={20} className="text-[#F26522]" />
              Search Engine Optimization (SEO) & Visibility
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Customize URL slug, meta tags, and preview how this item appears on Google search results.
            </p>
          </div>

          {/* URL Slug */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">URL Slug (Web Address)</label>
            <div className="flex items-center rounded-2xl border border-gray-200 overflow-hidden bg-gray-50">
              <span className="px-3.5 py-2.5 text-xs text-gray-400 select-none">https://www.intrihub.com/shop/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"))}
                className="flex-1 px-2 py-2.5 text-xs bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Meta Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700">Meta Title (SEO Title)</label>
              <span className={`text-[10px] ${metaTitle.length > 60 ? "text-amber-600 font-bold" : "text-gray-400"}`}>
                {metaTitle.length}/60 chars (recommended: 50-60)
              </span>
            </div>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#F26522]"
            />
          </div>

          {/* Meta Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700">Meta Description</label>
              <span className={`text-[10px] ${metaDescription.length > 160 ? "text-amber-600 font-bold" : "text-gray-400"}`}>
                {metaDescription.length}/160 chars (recommended: 140-160)
              </span>
            </div>
            <textarea
              rows={2}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#F26522]"
            />
          </div>

          {/* Live Google Search Result Snippet Preview */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-black text-gray-800 uppercase tracking-wider block">
              Google Search Result Preview
            </label>
            <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-1 max-w-xl">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-4 h-4 rounded-full bg-[#052a51] text-white flex items-center justify-center text-[9px] font-black">
                  IH
                </span>
                <span className="truncate">https://www.intrihub.com › shop › {slug || "product-slug"}</span>
              </div>
              <h3 className="text-base text-[#1a0dab] hover:underline font-medium cursor-pointer truncate">
                {metaTitle || `${title || "Product Title"} | IntriHub`}
              </h3>
              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                {metaDescription || description || "Buy architectural materials online at IntriHub. 100% genuine products with doorstep delivery."}
              </p>
            </div>
          </div>

          {/* Listing Status & Featured Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Initial Visibility Status</label>
              <select
                value={listingStatus}
                onChange={(e) => setListingStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs bg-white cursor-pointer"
              >
                <option value="active">Active (Visible in Storefront)</option>
                <option value="draft">Draft (Private in Catalog)</option>
                <option value="paused">Paused (Temporarily Hidden)</option>
              </select>
            </div>

            {isAdminOrCpo && (
              <div className="p-3.5 rounded-2xl border border-gray-200 flex items-center justify-between">
                <div>
                  <strong className="text-xs font-bold text-gray-800 block">Featured Listing</strong>
                  <p className="text-[10px] text-gray-400">Promotes item to homepage hero carousel</p>
                </div>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 text-[#F26522] rounded cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 12: LIVE PREVIEW & COMPLETENESS CHECKLIST (PHASE 5) ── */}
      {currentStep === 12 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-2xs space-y-8 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-[#052a51] flex items-center gap-2">
                <Eye size={20} className="text-[#F26522]" />
                Live Storefront Preview & Completeness Checklist
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Inspect your finished listing in Website Desktop and Mobile view modes before publishing.
              </p>
            </div>

            {/* Device Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-2xl shrink-0">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  previewDevice === "desktop" ? "bg-white text-[#052a51] shadow-2xs" : "text-gray-600"
                }`}
              >
                <Monitor size={14} /> Desktop Web
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  previewDevice === "mobile" ? "bg-white text-[#052a51] shadow-2xs" : "text-gray-600"
                }`}
              >
                <Smartphone size={14} /> Mobile App View
              </button>
            </div>
          </div>

          {/* Completeness Score Card */}
          <div className="p-5 rounded-3xl bg-gray-50 border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-[#052a51]">{completeness.score}%</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  {completeness.score >= 80 ? "Excellent Listing Quality" : "Needs Additional Details"}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                High completeness scores drive up to 3.4x higher conversion and better organic search rankings.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {completeness.checks.map((chk) => (
                <div key={chk.id} className="flex items-center gap-1.5">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-white text-[9px] ${
                      chk.done ? "bg-emerald-600" : "bg-gray-300"
                    }`}
                  >
                    {chk.done ? <Check size={10} /> : "–"}
                  </div>
                  <span className={`text-[11px] truncate ${chk.done ? "text-gray-800 font-medium" : "text-gray-400"}`}>
                    {chk.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Preview Display */}
          {previewDevice === "desktop" ? (
            /* Desktop Web 2-Col Preview */
            <div className="p-6 rounded-3xl border border-gray-200 bg-white shadow-2xs grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left: Gallery */}
              <div className="space-y-3">
                <div className="w-full aspect-square rounded-2xl bg-gray-100 overflow-hidden relative border border-gray-200">
                  {images[0] ? (
                    <img src={images[0]} alt={title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No Image Uploaded
                    </div>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((img, idx) => (
                      <div key={idx} className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden border border-gray-200 shrink-0">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Info */}
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                    {brand === "other" ? customBrandInput : brand}
                  </span>
                  <h3 className="text-xl font-black text-[#052a51] leading-tight mt-0.5">
                    {title || "Product Title Preview"}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedCategory?.name} • SKU: {sku || "AUTO-GEN"}
                  </p>
                </div>

                <div className="flex items-baseline gap-3 pt-1">
                  <span className="text-2xl font-black text-[#052a51]">
                    ₹{sellingPrice || (variants[0]?.price ? variants[0].price : "0")}
                  </span>
                  {mrpNum > 0 && <span className="text-sm text-gray-400 line-through">₹{mrp}</span>}
                  {discountPercent > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black">
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-gray-600 font-medium">
                  <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded-xl">
                    <Truck size={14} className="text-[#F26522]" />
                    <span>Dispatch {dispatchTimeDays}d</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded-xl">
                    <RotateCcw size={14} className="text-[#F26522]" />
                    <span>{returnPolicyDays}d Return</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded-xl">
                    <Shield size={14} className="text-[#F26522]" />
                    <span>{warrantyDuration}</span>
                  </div>
                </div>

                <div className="pt-2 text-xs text-gray-600 line-clamp-3 leading-relaxed">
                  {description || "Product description will appear here on customer storefront."}
                </div>
              </div>
            </div>
          ) : (
            /* Mobile App Mockup View */
            <div className="flex justify-center">
              <div className="w-80 rounded-[36px] border-8 border-gray-900 bg-white shadow-2xl overflow-hidden flex flex-col">
                {/* Notch */}
                <div className="w-full h-6 bg-gray-900 flex justify-center items-center">
                  <div className="w-20 h-3 bg-black rounded-b-xl" />
                </div>

                {/* Mobile Screen Content */}
                <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                  <div className="w-full aspect-square rounded-2xl bg-gray-100 overflow-hidden relative border border-gray-100">
                    {images[0] ? (
                      <img src={images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                    )}
                  </div>

                  <div>
                    <span className="text-[9px] font-black uppercase text-gray-400">
                      {brand === "other" ? customBrandInput : brand}
                    </span>
                    <h4 className="text-sm font-black text-[#052a51] line-clamp-2 leading-tight">
                      {title || "Product Title"}
                    </h4>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-[#052a51]">
                      ₹{sellingPrice || (variants[0]?.price ? variants[0].price : "0")}
                    </span>
                    {mrpNum > 0 && <span className="text-xs text-gray-400 line-through">₹{mrp}</span>}
                  </div>

                  <div className="flex gap-1.5 text-[10px] text-gray-500">
                    <span className="bg-gray-100 px-2 py-0.5 rounded-md">Dispatch: {dispatchTimeDays}d</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded-md">{returnPolicyDays}d Returns</span>
                  </div>
                </div>

                {/* Mobile Sticky Action Bar */}
                <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
                  <div className="flex-1 py-2 bg-gray-100 text-[#052a51] rounded-xl text-center text-xs font-bold">
                    Add to Cart
                  </div>
                  <div className="flex-1 py-2 bg-[#F26522] text-white rounded-xl text-center text-xs font-bold">
                    Buy Now
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Final Action Submission Bar */}
          <div className="p-6 rounded-3xl bg-[#052a51] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black">Ready to submit listing?</h3>
              <p className="text-xs text-gray-300 mt-0.5">
                {isAdminOrCpo
                  ? "Publish directly to live storefront catalog or save as private draft."
                  : "Submit for catalog review team approval or save as working draft."}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSubmitAction("draft");
                  handleFinalSubmit();
                }}
                disabled={loading}
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                Save as Draft
              </button>

              <button
                type="submit"
                onClick={() => setSubmitAction("publish")}
                disabled={loading || isImageUploading}
                className="px-6 py-2.5 rounded-2xl bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                <span>{isAdminOrCpo ? "Publish Listing Now" : "Submit for Approval"}</span>
              </button>
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
          {currentStep < 12 ? (
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
              className="px-7 py-3 rounded-2xl bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
              {isAdminOrCpo ? "Complete & Publish Listing" : "Submit for Catalog Approval"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
