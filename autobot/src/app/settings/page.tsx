"use client";

import { useState, useEffect } from "react";
import {
  Upload,
  Key,
  MessageSquareText,
  Save,
  Loader2,
  CheckCircle2,
  FileText,
  Trash2,
  Sparkles,
  Building2,
  Headphones,
  AlertCircle,
  RefreshCw,
  Download,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";

type DocumentItem = {
  fileName: string;
  chunkCount: number;
  createdAt: string;
};

const INTRIHUB_OFFICIAL_PROMPT = `Aap Intrihub (Tiletra) ke Senior Customer Support & Sales Executive hain — India ka trusted marketplace for premium tiles, sanitaryware, electricals aur building materials.

### AAPKA PERSONA AUR MULTILINGUAL CAPABILITIES:
1. 100% REAL HUMAN SHOWROOM EXPERIENCE: Hamesha ek warm, polite, respectful aur experienced showroom manager / sales executive ki tarah naturally baat karein. Kabhi bhi robotic ya technical words (jaise AI, bot, assistant, system, language model) use mat karein. Hamesha "hum", "hamari team", ya "mai" keh kar baat karein.
2. ALL INDIA REGIONAL LANGUAGES SUPPORT (Full Multilingual Fluency):
   Customer Bharat ke kisi bhi kone se kisi bhi bhasha ya script me baat kare, aapko usi bhasha me naturally aur fluently reply karna hai:
   • Hindi & Hinglish: "Namaste sir! Intrihub support desk me aapka swagat hai. Bilkul, mai aapko living room ke liye best 2x4 (600x1200mm) vitrified tiles aur pricing details share karta hoon."
   • English: "Hello! Welcome to Intrihub. I would be glad to assist you with tile selections, quantity calculation, or direct site delivery."
   • Kannada (ಕನ್ನಡ / Kanglish): "Namaskara sir! Intrihub ge swagatha. Nimma living room ge 2x4 GVT vitrified tiles mathe sanitaryware best pricing nalli kottidivi. Bengaluru nalli 60-minute express site delivery ide."
   • Telugu (తెలుగు / Tenglish): "Namaskaram andi! Intrihub ki swagatham. Mee construction kosam vitrified floor tiles, ceramic wall tiles mariyu sanitaryware direct wholesale price lo andisthamu."
   • Tamil (தமிழ் / Tanglish): "Vanakkam sir! Intrihub-il ungalai anbudan varaverkirom. Vitrified tiles, bathroom sanitary fittings matrum site delivery patriya details tharugirom."
   • Malayalam (മലയാളം / Manglish): "Namaskaram! Intrihub-ilekku swagatham. Ningalude veedu nirmanathinu aavasyamaya premium tiles, sanitaryware best rate-il labhikkum."
   • Marathi (मराठी): "Namaskar sir! Intrihub madhe aple swagat ahe. Ghar ani project sathi lagnaare vitrified tiles, sanitaryware ani site delivery sathi amhi purna sahayya karu."
   • Gujarati (ગુજરાતી): "Namaste sir! Intrihub ma tamaru swagat che. Best quality vitrified tiles, ceramic tiles ane sanitary fittings mate amari sathe jodayela raho."
   • Bengali (বাংলা): "Nomoshkar! Intrihub-e apnake shagoto. Apnar bari toirir jonno premium tiles, bathroom fittings ebong rapid site delivery-te sahajjo korchi."
   • Punjabi (ਪੰਜਾਬੀ): "Sat Sri Akal ji! Intrihub te tuhada swagat hai. Premium tiles, sanitaryware te direct site delivery di puri jankari dinde han."
   • Odia, Assamese, Urdu etc.: Mirror customer's language and script respectfully.

3. STRICTLY INTRIHUB-ONLY ASSISTANCE: Aap sirf aur sirf Intrihub ke products, tile calculation, pricing estimates, orders, site delivery, damage replacement aur vendor onboarding ke liye assist karte hain.
4. COURTEOUS REDIRECT (Agar koi off-topic puche):
   Customer ki bhasha me polite redirect karein (e.g. "Namaste! Mai Intrihub customer desk se baat kar raha hoon. Hum sirf building materials, tiles, sanitaryware aur orders ke liye assist karte hain. Kya mai aapke construction ya home renovation ke liye koi tiles ya bath fittings suggest karu?")
5. WHATSAPP-FRIENDLY FORMAT: Crisp messages, clear bullet points aur important details (sizes, prices, phone numbers) ko *bold* me likhein.

### COMPLETE INTRIHUB PRODUCT & SERVICE KNOWLEDGE:
- Official Website: www.intrihub.com
- Mobile App: Available on Android (Google Play Store) & Web
- Product Catalog & Range:
  • Vitrified Floor Tiles: GVT, PGVT, Full Body, Large Slabs (600x1200mm / 2x4 ft, 800x1600mm, 1200x1800mm) in High Gloss, Matte, Carving, Satin finishes.
  • Ceramic Wall Tiles: Bathroom & Kitchen wall tiles (300x450mm, 300x600mm), Subway tiles, Moroccan highlighters, Wooden planks.
  • Outdoor & Parking: Heavy duty 12mm & 16mm pavers, terrace anti-skid tiles.
  • Sanitaryware & Bath Fittings: Rimless wall-hung commodes, designer countertop basins, vanity cabinets, concealed diverters, rain showers, sensor faucets.
  • Electricals & Lighting: Concealed copper wiring, modular switches, LED profile lights.
  • Tile Adhesives & Grouts: Type 1, Type 2, Type 3 tile adhesives, epoxy waterproof grouts, leveling spacers.
- Delivery Timelines:
  • 60-Minute Express Site Delivery across Bengaluru via local micro-dark stores.
  • Pan-India Fast Delivery within 3 to 7 business days.
  • 100% Free Site Delivery for all orders above ₹15,000 (standard delivery starting at ₹99 for smaller orders).
- Damage Protection & Replacement Guarantee:
  • 100% Free Damage Replacement Guarantee. Agar transit me koi bhi tile ya piece break hota hai, customer delivery ke 48 ghante ke andar +91 70901 20211 par WhatsApp photo/video bhej sakte hain, aur hum bina kisi extra charge ke turant replacement crate dispatch karte hain.
- Return & Refund Policy:
  • 7-day hassle-free return for unopened, intact original boxes. Refund 3-5 working days me direct source bank account me credit ho jata hai.
- Tile Calculator & Wastage:
  • Website par Smart Tile Calculator available hai jo room dimensions (sq ft / sq meters) ke hisab se exact box count aur pieces calculate karta hai standard 10% cutting wastage margin ke sath.
- B2B GST Invoices:
  • 100% compliant GST Tax Invoices for full Input Tax Credit (ITC) claims.
- Bulk & Trade Program:
  • Architects, Builders, Contractors & Interior Designers ke liye special wholesale pricing, dedicated relationship manager, aur free physical samples available hain.
- Vendor Onboarding:
  • Verified tile & bath manufacturers intrihub.com/vendor/apply par register kar sakte hain (approval within 24-48 hours with automated weekly bank settlements).
- Support Helpline:
  • WhatsApp & Phone: +91 70901 20211
  • Email: support@intrihub.com | vendor@intrihub.com
  • Leadership: Sahil Sheikh (Founder & CEO), Gulshan (COO), Vishal Poddar (CPO)`;

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState("Intrihub");
  const [geminiKey, setGeminiKey] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(INTRIHUB_OFFICIAL_PROMPT);
  const [defaultMode, setDefaultMode] = useState<"ai" | "human">("ai");

  const [file, setFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load Settings and Knowledge Base documents on mount
  useEffect(() => {
    fetchSettings();
    fetchDocuments();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const res = await fetch("/api/settings");
      if (res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          if (data.profile) {
            setBusinessName(data.profile.business_name || "Intrihub");
            setGeminiKey(data.profile.gemini_api_key || "");
            if (data.profile.global_system_prompt) {
              setSystemPrompt(data.profile.global_system_prompt);
            } else {
              setSystemPrompt(INTRIHUB_OFFICIAL_PROMPT);
            }
            if (data.profile.default_mode) {
              setDefaultMode(data.profile.default_mode);
            }
          }
        } catch {
          console.warn("Non-JSON response from /api/settings:", text);
        }
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      setIsLoadingDocs(true);
      const res = await fetch("/api/documents/list");
      if (res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          setDocuments(data.documents || []);
        } catch {
          console.warn("Non-JSON response from /api/documents/list:", text);
        }
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: businessName,
          gemini_api_key: geminiKey,
          global_system_prompt: systemPrompt,
          default_mode: defaultMode,
        }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        // fallback if server returns text
      }

      if (res.ok) {
        setMessage({ type: "success", text: "Intrihub Support Guidelines saved successfully!" });
      } else {
        setMessage({ type: "error", text: data.error || text || "Failed to save settings." });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to connect to server." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("gemini_api_key", geminiKey);

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        // fallback
      }

      if (res.ok) {
        setMessage({
          type: "success",
          text: `Successfully indexed "${data.fileName || file.name}" (${data.chunksInserted || 0} catalog items created)!`,
        });
        setFile(null);
        fetchDocuments();
      } else {
        setMessage({ type: "error", text: data.error || text || "Failed to upload document." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error during catalog indexing." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadOfficialKnowledgeBase = async () => {
    setIsUploading(true);
    setMessage(null);

    try {
      const kbRes = await fetch("/INTRIHUB_KNOWLEDGE_BASE.txt");
      if (!kbRes.ok) throw new Error("Could not load knowledge base file");
      const blob = await kbRes.blob();
      const kbFile = new File([blob], "INTRIHUB_OFFICIAL_CATALOG_GUIDE.txt", { type: "text/plain" });

      const formData = new FormData();
      formData.append("file", kbFile);
      formData.append("gemini_api_key", geminiKey);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        // fallback
      }

      if (res.ok) {
        setMessage({
          type: "success",
          text: `Successfully indexed Official Intrihub Catalog (${data.chunksInserted || 0} knowledge items)!`,
        });
        fetchDocuments();
      } else {
        setMessage({ type: "error", text: data.error || text || "Failed to index knowledge base." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to index catalog." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (fileName: string) => {
    if (!confirm(`Are you sure you want to remove "${fileName}" from the knowledge base?`)) {
      return;
    }

    setDeletingFile(fileName);
    try {
      const res = await fetch(`/api/documents/list?fileName=${encodeURIComponent(fileName)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.fileName !== fileName));
        setMessage({ type: "success", text: `Removed "${fileName}" from catalog.` });
      } else {
        setMessage({ type: "error", text: "Failed to delete document items." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error while deleting document." });
    } finally {
      setDeletingFile(null);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#052A51] flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-[#F26522]" />
            Intrihub Support Desk & Catalog Settings
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Configure Intrihub customer representative guidelines, credentials, and catalog knowledge files.
          </p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={isSaving || isLoadingSettings}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#F26522]/20 transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Desk Guidelines
        </button>
      </div>

      {/* Notification Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold border ${
            message.type === "success"
              ? "bg-emerald-50 text-[#1E9E6B] border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-[#1E9E6B] shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {isLoadingSettings ? (
        <div className="flex items-center justify-center py-20 text-slate-500 gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-[#F26522]" />
          Loading Intrihub settings...
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column: Business & AI Configuration */}
          <div className="space-y-6">
            {/* 1. Business Info */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
              <h2 className="text-base font-bold text-[#052A51] flex items-center gap-2.5">
                <Building2 className="h-5 w-5 text-[#F26522]" />
                Brand Identity
              </h2>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Intrihub"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-[#F26522] focus:outline-none focus:ring-1 focus:ring-[#F26522]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Default WhatsApp Response Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDefaultMode("ai")}
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold border transition-all ${
                      defaultMode === "ai"
                        ? "bg-[#F26522] border-[#F26522] text-white shadow-md shadow-[#F26522]/20"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <Sparkles className="h-4 w-4" /> Instant Helpdesk
                  </button>
                  <button
                    type="button"
                    onClick={() => setDefaultMode("human")}
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold border transition-all ${
                      defaultMode === "human"
                        ? "bg-[#1E9E6B] border-[#1E9E6B] text-white shadow-md shadow-[#1E9E6B]/20"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <MessageSquareText className="h-4 w-4" /> Direct Agent
                  </button>
                </div>
              </div>
            </div>

            {/* 2. API Key Configuration */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
              <h2 className="text-base font-bold text-[#052A51] flex items-center gap-2.5">
                <Key className="h-5 w-5 text-amber-500" />
                Google Gemini API Key
              </h2>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-mono text-slate-900 focus:border-[#F26522] focus:outline-none focus:ring-1 focus:ring-[#F26522]"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Powers Gemini 2.5 Flash instant catalog lookup and customer responses.
                </p>
              </div>
            </div>

            {/* 3. System Prompt Configuration */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#052A51] flex items-center gap-2.5">
                  <Headphones className="h-5 w-5 text-[#1E9E6B]" />
                  Executive Support Guidelines & Persona
                </h2>
                <button
                  type="button"
                  onClick={() => setSystemPrompt(INTRIHUB_OFFICIAL_PROMPT)}
                  className="text-xs font-bold text-[#F26522] hover:text-[#d95a1e] flex items-center gap-1 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200 shadow-2xs"
                  title="Reset to Full Official Intrihub Guidelines"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Load Master Guidelines
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Master Customer Desk Guidelines
                </label>
                <textarea
                  rows={9}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Define how the customer support executive communicates..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3.5 text-xs font-mono leading-relaxed text-slate-800 focus:bg-white focus:border-[#F26522] focus:outline-none focus:ring-1 focus:ring-[#F26522]"
                />
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <ShieldAlert className="h-3.5 w-3.5 text-[#F26522]" />
                  <span>The desk is strictly configured to answer Intrihub queries as a courteous human representative.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Knowledge Base & RAG Uploads */}
          <div className="space-y-6">
            {/* Quick Auto-Train Official Intrihub Guide */}
            <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-6 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#052A51] flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#F26522]" />
                  Official Intrihub Catalog & FAQ Reference
                </h2>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Includes full details on tiles (vitrified, ceramic, parking, slabs), sanitaryware (toilets, basins, divertors), 60-min delivery in Bengaluru, damage guarantee, GST ITC invoices, bulk trade discounts, and vendor onboarding.
              </p>
              <div className="pt-1 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={handleUploadOfficialKnowledgeBase}
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#F26522]/20 transition-all disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Auto-Index Catalog Knowledge
                </button>
                <a
                  href="/INTRIHUB_KNOWLEDGE_BASE.txt"
                  download="INTRIHUB_KNOWLEDGE_BASE.txt"
                  className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors shadow-2xs"
                >
                  <Download className="h-3.5 w-3.5 text-[#F26522]" />
                  Download File
                </a>
              </div>
            </div>

            {/* Custom File Upload Box */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
              <h2 className="text-base font-bold text-[#052A51] flex items-center gap-2.5">
                <Upload className="h-5 w-5 text-[#052A51]" />
                Add Custom Price Lists or Sheets
              </h2>
              <p className="text-xs text-slate-500">
                Upload custom product sheets, price lists, or new policies (PDF, DOCX, TXT) for instant customer reference.
              </p>

              <div className="mt-2 flex justify-center rounded-xl border-2 border-dashed border-slate-300 px-6 pt-5 pb-6 hover:border-[#F26522] transition-colors bg-slate-50/50">
                <div className="space-y-2 text-center">
                  <FileText className="mx-auto h-10 w-10 text-slate-400" />
                  <div className="flex text-sm text-slate-600 justify-center">
                    <label className="relative cursor-pointer rounded-md font-bold text-[#F26522] hover:text-[#d95a1e] focus-within:outline-none">
                      <span>Select a document</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept=".pdf,.docx,.txt,.md"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-slate-400">PDF, DOCX, TXT up to 10MB</p>
                  {file && (
                    <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 px-3 py-1 rounded-lg text-xs font-bold text-[#052A51]">
                      <FileText className="h-3.5 w-3.5 text-[#F26522]" />
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleFileUpload}
                disabled={!file || isUploading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#052A51] hover:bg-[#0a3f78] px-4 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50 shadow-2xs"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#F26522]" />
                    Processing Document...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 text-[#F26522]" />
                    Upload & Index Document
                  </>
                )}
              </button>
            </div>

            {/* Uploaded Documents List */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#052A51] flex items-center gap-2.5">
                  <FileText className="h-5 w-5 text-[#1E9E6B]" />
                  Active Catalog Files ({documents.length})
                </h2>
                <button
                  onClick={fetchDocuments}
                  className="text-slate-400 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Refresh list"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingDocs ? "animate-spin" : ""}`} />
                </button>
              </div>

              {isLoadingDocs ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading documents...</div>
              ) : documents.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
                  No custom documents uploaded yet. Click "Auto-Index Catalog Knowledge" above to index standard catalog data.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                  {documents.map((doc) => (
                    <div
                      key={doc.fileName}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-[#F26522]" />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-bold text-[#052A51] truncate">{doc.fileName}</p>
                          <p className="text-xs text-slate-500">{doc.chunkCount} catalog items</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteDocument(doc.fileName)}
                        disabled={deletingFile === doc.fileName}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                        title="Delete document items"
                      >
                        {deletingFile === doc.fileName ? (
                          <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
