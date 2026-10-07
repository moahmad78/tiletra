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
} from "lucide-react";
import { toast } from "sonner";
import ImageUploadManager from "@/components/admin/ImageUploadManager";
import UnifiedVariantManager from "@/components/shared/UnifiedVariantManager";
import { createProduct, checkDuplicateProduct } from "@/lib/actions/products";
import { getCategories, createCustomCategory } from "@/lib/actions/categories";
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

  // ── Step Navigation State (Steps 1 to 8) ──
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitAction, setSubmitAction] = useState<"draft" | "publish" | "review">("publish");

  // ── Vendor Context ──
  const [activeVendorId, setActiveVendorId] = useState<string | null>(initialVendorId);
  const [vendorProfile, setVendorProfile] = useState<any | null>(null);

  useEffect(() => {
    setActiveVendorId(initialVendorId || null);
  }, [initialVendorId]);

  useEffect(() => {
    if (activeVendorId) {
      getVendorProfile(activeVendorId).then((v) => setVendorProfile(v));
    }
  }, [activeVendorId]);

  // ── STEP 1: Category & Custom Category ──
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [categorySearch, setCategorySearch] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState<boolean>(false);
  const [customCategoryName, setCustomCategoryName] = useState<string>("");
  const [customCategoryDesc, setCustomCategoryDesc] = useState<string>("");
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

  // Rate & Stock details
  const [mrp, setMrp] = useState<string>("");
  const [sellingPrice, setSellingPrice] = useState<string>("");
  const [gstRate, setGstRate] = useState<number>(18);
  const [hsnCode, setHsnCode] = useState<string>("");
  const [unitOfSale, setUnitOfSale] = useState<string>("box");
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
  const [isSavingSubcategory, setIsSavingSubcategory] = useState<boolean>(false);
  const [dynamicAttributes, setDynamicAttributes] = useState<Record<string, string>>({});
  const [customSpecs, setCustomSpecs] = useState<Array<{ key: string; value: string }>>([]);
  const [newSpecKey, setNewSpecKey] = useState<string>("");
  const [newSpecValue, setNewSpecValue] = useState<string>("");
  const [lengthCm, setLengthCm] = useState<string>("");
  const [widthCm, setWidthCm] = useState<string>("");
  const [heightCm, setHeightCm] = useState<string>("");
  const [packedWeightKg, setPackedWeightKg] = useState<string>("");
  const [inTheBox, setInTheBox] = useState<string>("");

  // ── STEP 5: Variants Matrix (Decides Single vs Multi) ──
  const [isMultiVariety, setIsMultiVariety] = useState<boolean>(initialListingType === "multi");
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // ── STEP 6: Shipping & Delivery ──
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

  // ── STEP 7: Returns, Warranty & Compliance ──
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

  // ── STEP 8: SEO, Preview & Publish ──
  const [slug, setSlug] = useState<string>("");
  const [metaTitle, setMetaTitle] = useState<string>("");
  const [metaDescription, setMetaDescription] = useState<string>("");
  const [listingStatus, setListingStatus] = useState<"active" | "draft" | "paused">("active");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

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
      if (d.gstRate !== undefined) setGstRate(d.gstRate);
      if (d.hsnCode) setHsnCode(d.hsnCode);
      if (d.unitOfSale) setUnitOfSale(d.unitOfSale);
      if (d.stockQuantity) setStockQuantity(d.stockQuantity);
      if (d.sku) setSku(d.sku);
      if (d.barcode) setBarcode(d.barcode);
      if (d.dynamicAttributes) setDynamicAttributes(d.dynamicAttributes);
      if (d.customSpecs) setCustomSpecs(d.customSpecs);
      if (d.shippingMode) setShippingMode(d.shippingMode);
      if (d.dispatchTimeDays) setDispatchTimeDays(d.dispatchTimeDays);
      if (d.slug) setSlug(d.slug);
      if (d.metaTitle) setMetaTitle(d.metaTitle);
      if (d.metaDescription) setMetaDescription(d.metaDescription);
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
          dynamicAttributes,
          customSpecs,
          shippingMode,
          dispatchTimeDays,
          slug,
          metaTitle,
          metaDescription,
          variants,
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
    stockQuantity,
    variants,
  ]);

  // Auto-sync slug & metadata
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

  // ── Custom Category Handlers ──
  const handleSaveCustomCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customCategoryName.trim()) {
      toast.error("Please enter a category name");
      return;
    }
    setIsSavingCategory(true);
    try {
      const res = await createCustomCategory({
        name: customCategoryName.trim(),
        description: customCategoryDesc.trim() || undefined,
      });
      if (res.success && res.category) {
        toast.success(`Category "${res.category.name}" created and selected!`);
        const updatedCats = await getCategories();
        setCategories(updatedCats as CategoryWithChildren[]);
        setSelectedCategoryId(res.category.id);
        setSelectedSubcategoryId("");
        setCustomCategoryName("");
        setCustomCategoryDesc("");
        setIsAddingCustomCategory(false);
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
      const res = await createCustomCategory({
        name: customSubcategoryName.trim(),
        parentId: selectedCategoryId,
        description: customSubcategoryDesc.trim() || undefined,
      });
      if (res.success && res.category) {
        toast.success(`Sub-category "${res.category.name}" created and selected!`);
        const updatedCats = await getCategories();
        setCategories(updatedCats as CategoryWithChildren[]);
        setSelectedSubcategoryId(res.category.id);
        setCustomSubcategoryName("");
        setCustomSubcategoryDesc("");
        setIsAddingCustomSubcategory(false);
      } else {
        toast.error(res.error || "Failed to create sub-category");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to create custom sub-category");
    } finally {
      setIsSavingSubcategory(false);
    }
  };

  // Completeness calculation
  const completeness = useMemo(() => {
    const checks = [
      { id: "category", label: "Category selected", done: Boolean(selectedCategoryId), weight: 15, required: true },
      { id: "title", label: "Product title provided (min 4 chars)", done: Boolean(title.trim().length >= 4), weight: 15, required: true },
      { id: "description", label: "Product description provided", done: Boolean(description.trim().length >= 20), weight: 10, required: true },
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
      { id: "declaration", label: "Vendor declaration accepted", done: Boolean(vendorDeclaration), weight: 10, required: true },
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
    vendorDeclaration,
  ]);

  // ── Step Validations (7 Steps) ──
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
          image: v.image || images[0] || null,
          images: Array.isArray(v.images) && v.images.length > 0 ? v.images : (v.image ? [v.image] : [images[0]]),
          unit: v.unit || unitOfSale,
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
          allowBackorders,
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
    { num: 1, label: "Category", icon: Sliders },
    { num: 2, label: "Basic Details & Rate", icon: Info },
    { num: 3, label: "Images & Sub-category", icon: ImageIcon },
    { num: 4, label: "Variants", icon: Layers },
    { num: 5, label: "Shipping & Delivery", icon: Truck },
    { num: 6, label: "Returns & Compliance", icon: FileCheck2 },
    { num: 7, label: "SEO & Publish", icon: Eye },
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
              <h1 className="text-xl sm:text-2xl font-black text-[#052a51]">Item Upload Wizard</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                7-Step Unified Architecture
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {vendorProfile?.businessName
                ? `Assigning to vendor: ${vendorProfile.businessName}`
                : "One shared listing engine with full catalog specs across Vendor, CPO, & Admin"}
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

      {/* ── Stepper Navigation Bar (8 Steps Grid) ── */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
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
                className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
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
                <div className="min-w-0">
                  <span className="text-[11px] font-bold block truncate leading-tight">{st.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── STEP 1: CATEGORY (FIRST FIELD) ── */}
      {currentStep === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-2xs space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-80 overflow-y-auto p-1 border border-gray-100 rounded-2xl">
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
                  <div className="flex items-center justify-between mt-auto">
                    <span className={`text-[10px] ${isSelected ? "text-gray-300" : "text-gray-400"}`}>
                      {cat.productCount ?? 0} listings
                    </span>
                    {isSelected && <Check size={14} className="text-[#F26522]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedCategory && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 shadow-2xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span className="font-bold">
                  Active Category: <strong>{selectedCategory.name}</strong>
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-700">Slug: {selectedCategory.slug}</span>
            </div>
          )}

          {/* Custom Category Modal */}
          {isAddingCustomCategory && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                    <Sliders size={18} className="text-[#F26522]" />
                    Add Custom Category
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomCategory(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="space-y-3">
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
                </div>
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomCategory(false)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCustomCategory}
                    disabled={isSavingCategory}
                    className="px-5 py-2 bg-[#F26522] hover:bg-[#d95517] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingCategory ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    <span>Save &amp; Select</span>
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
              Provide product title, brand, description, rate details (MRP, Selling Price), and inventory stock.
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
              <label className="text-xs font-bold text-gray-700">
                Brand Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Kajaria, Havells, Asian Paints, Intrihub"
                value={brand === "other" ? customBrandInput : brand}
                onChange={(e) => {
                  setBrand("other");
                  setCustomBrandInput(e.target.value);
                }}
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:border-[#F26522]"
              />
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">MRP (Max Retail) ₹</label>
                <input
                  type="number"
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
                  Unit of Sale <span className="text-red-500">*</span>
                </label>
                <select
                  value={unitOfSale}
                  onChange={(e) => setUnitOfSale(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#F26522] bg-white cursor-pointer"
                >
                  {UNIT_OF_SALE_OPTIONS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
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

            {/* Sub-category Dropdown */}
            {(isSubcategoryRevealed || selectedSubcategoryId) && (
              <div className="pt-2 animate-in fade-in space-y-2">
                <label className="text-xs font-bold text-gray-700">Choose Sub-category</label>
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
            )}

            {/* Custom Sub-category Modal */}
            {isAddingCustomSubcategory && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                      <Box size={18} className="text-[#F26522]" />
                      Add Custom Sub-category
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomSubcategory(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Parent Category</label>
                      <input
                        type="text"
                        disabled
                        value={selectedCategory?.name || "None"}
                        className="w-full px-3.5 py-2 rounded-xl bg-gray-100 text-xs font-bold text-gray-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        Sub-category Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Hexagonal Mosaic Tiles"
                        value={customSubcategoryName}
                        onChange={(e) => setCustomSubcategoryName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#F26522]"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomSubcategory(false)}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCustomSubcategory}
                      disabled={isSavingSubcategory}
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
                <label className="text-[11px] text-gray-500">Weight (kg)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 2.4"
                  value={packedWeightKg}
                  onChange={(e) => setPackedWeightKg(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 4: VARIANTS MATRIX (DECIDES SINGLE VS MULTI) ── */}
      {currentStep === 4 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-2xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-black text-[#052a51] flex items-center gap-2">
              <Layers size={20} className="text-[#F26522]" />
              4. Product Variants &amp; Matrix
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Add variants for multiple colours, sizes, or weight packs. The item type is decided by this toggle.
            </p>
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
                This item will sell as a single standalone product using the rate details (Selling Price: <strong>₹{sellingPrice || "0"}</strong>, MRP: <strong>₹{mrp || "0"}</strong>, Stock: <strong>{stockQuantity || "100"} {unitOfSale}</strong>) configured in Step 2.
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
              defaultStock={parseInt(stockQuantity, 10) || 50}
              unitOfSale={unitOfSale}
            />
          )}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Shipping Mode</label>
              <select
                value={shippingMode}
                onChange={(e) => setShippingMode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs bg-white cursor-pointer"
              >
                <option value="standard">Standard Ground Logistics (Surface)</option>
                <option value="express">Express Courier / Air Freight</option>
                <option value="heavy_bulk">Heavy Construction Truckload (Bulk)</option>
              </select>
            </div>

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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Return Policy (Days)</label>
              <select
                value={returnPolicyDays}
                onChange={(e) => setReturnPolicyDays(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs bg-white cursor-pointer"
              >
                <option value="0">No Returns (Final Sale)</option>
                <option value="7">7 Days Return / Replacement</option>
                <option value="10">10 Days Return / Replacement</option>
                <option value="15">15 Days Return / Replacement</option>
                <option value="30">30 Days Return / Replacement</option>
              </select>
            </div>

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

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">Return Conditions</label>
            <textarea
              rows={2}
              value={returnConditions}
              onChange={(e) => setReturnConditions(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs"
            />
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
              7. SEO, Live Search Preview &amp; Publish
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Review Google Search Snippet, set custom URL slugs, and publish the listing.
            </p>
          </div>

          {/* SEO Slug & Meta */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">URL Slug</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-mono">intrihub.com/product/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Meta Title</label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Meta Description</label>
              <textarea
                rows={2}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs"
              />
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
                https://www.intrihub.com &gt; product &gt; {slug || "your-item"}
              </p>
              <h4 className="text-sm font-medium text-blue-700 hover:underline cursor-pointer truncate">
                {metaTitle || `${title || "Product Title"} | Buy Online at IntriHub`}
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
