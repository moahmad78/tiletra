"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  Pilcrow,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  ExternalLink,
  MapPin,
  Layers,
  ShoppingBag,
  Undo,
  Redo,
  Upload,
  X,
  Check,
  Search,
  Code,
} from "lucide-react";
import { categories as defaultCategories } from "@/lib/data/categories";
import { SEO_LOCATIONS } from "@/lib/data/seo-locations";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your guide content here...",
  minHeight = "400px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlCode, setHtmlCode] = useState(value);

  // Link Modal State
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkTargetBlank, setLinkTargetBlank] = useState(false);
  const savedSelectionRef = useRef<Range | null>(null);

  // Internal Link Picker Modal State
  const [internalLinkModalOpen, setInternalLinkModalOpen] = useState(false);
  const [internalLinkSearch, setInternalLinkSearch] = useState("");
  const [internalLinkType, setInternalLinkType] = useState<"ALL" | "CATEGORY" | "LOCATION">("ALL");

  // Image Upload Modal State
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageAlt, setImageAlt] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");

  // Sync value into contentEditable when value prop changes externally (e.g. initial load or reset)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value && !isHtmlMode) {
      editorRef.current.innerHTML = value || "";
    }
    setHtmlCode(value || "");
  }, [value, isHtmlMode]);

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  const restoreSelection = useCallback(() => {
    if (savedSelectionRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRef.current);
      }
    }
  }, []);

  const emitChange = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setHtmlCode(html);
      onChange(html);
    }
  }, [onChange]);

  const exec = (command: string, val: string | undefined = undefined) => {
    if (isHtmlMode) return;
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    emitChange();
  };

  // Format Heading 2 or 3 or Blockquote
  const formatHeading = (tag: "h2" | "h3" | "p" | "blockquote") => {
    if (isHtmlMode) return;
    editorRef.current?.focus();
    document.execCommand("formatBlock", false, tag);
    emitChange();
  };

  // Open Link Modal with selected text
  const openLinkModal = () => {
    saveSelection();
    const sel = window.getSelection();
    const text = sel ? sel.toString() : "";
    setLinkText(text);
    setLinkUrl("");
    setLinkTargetBlank(false);
    setLinkModalOpen(true);
  };

  // Insert Custom Link
  const handleInsertLink = () => {
    restoreSelection();
    editorRef.current?.focus();

    if (!linkUrl.trim()) {
      setLinkModalOpen(false);
      return;
    }

    const cleanUrl = linkUrl.trim().startsWith("http") || linkUrl.trim().startsWith("/")
      ? linkUrl.trim()
      : `https://${linkUrl.trim()}`;

    if (savedSelectionRef.current && savedSelectionRef.current.collapsed && linkText.trim()) {
      const a = document.createElement("a");
      a.href = cleanUrl;
      a.textContent = linkText.trim();
      a.className = "text-[#052a51] font-bold underline hover:text-[#F26522] transition-colors";
      if (linkTargetBlank) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
      savedSelectionRef.current.insertNode(a);
      savedSelectionRef.current.collapse(false);
    } else {
      document.execCommand("createLink", false, cleanUrl);
      // Style existing links
      const links = editorRef.current?.querySelectorAll(`a[href="${cleanUrl}"]`);
      links?.forEach((l) => {
        l.className = "text-[#052a51] font-bold underline hover:text-[#F26522] transition-colors";
        if (linkTargetBlank) {
          l.setAttribute("target", "_blank");
          l.setAttribute("rel", "noopener noreferrer");
        }
      });
    }

    setLinkModalOpen(false);
    emitChange();
  };

  // Open Internal Link Picker
  const openInternalLinkPicker = () => {
    saveSelection();
    const sel = window.getSelection();
    setLinkText(sel ? sel.toString() : "");
    setInternalLinkSearch("");
    setInternalLinkType("ALL");
    setInternalLinkModalOpen(true);
  };

  // Insert Internal Link from Picker
  const handleSelectInternalLink = (url: string, defaultLabel: string) => {
    restoreSelection();
    editorRef.current?.focus();

    const label = linkText.trim() || defaultLabel;

    if (savedSelectionRef.current && savedSelectionRef.current.collapsed) {
      const a = document.createElement("a");
      a.href = url;
      a.textContent = label;
      a.className = "text-[#052a51] font-bold underline hover:text-[#F26522] transition-colors";
      savedSelectionRef.current.insertNode(a);
      savedSelectionRef.current.collapse(false);
    } else {
      document.execCommand("createLink", false, url);
      const links = editorRef.current?.querySelectorAll(`a[href="${url}"]`);
      links?.forEach((l) => {
        l.className = "text-[#052a51] font-bold underline hover:text-[#F26522] transition-colors";
      });
    }

    setInternalLinkModalOpen(false);
    emitChange();
  };

  // Internal Links Generator
  const internalLinks = () => {
    const list: Array<{ title: string; subtitle: string; url: string; type: "CATEGORY" | "LOCATION" }> = [];

    // Categories
    defaultCategories
      .filter((c) => !c.parentId)
      .forEach((cat) => {
        list.push({
          title: `${cat.name} Supplies`,
          subtitle: `Shop Category • /shop/${cat.slug}`,
          url: `/shop/${cat.slug}`,
          type: "CATEGORY",
        });
      });

    // Top Bangalore Location Pages
    const topLocations = SEO_LOCATIONS.slice(0, 20);
    const topCats = ["tiles-stone", "electrical", "paint-finishes", "plumbing-sanitary", "false-ceiling"];

    topCats.forEach((catSlug) => {
      const catObj = defaultCategories.find((c) => c.slug === catSlug);
      const catName = catObj?.name || catSlug;

      topLocations.forEach((loc) => {
        list.push({
          title: `${catName} in ${loc.name}, ${loc.city}`,
          subtitle: `Location Delivery Hub • /shop/${catSlug}/${loc.slug}`,
          url: `/shop/${catSlug}/${loc.slug}`,
          type: "LOCATION",
        });
      });
    });

    return list;
  };

  const filteredInternalLinks = internalLinks().filter((item) => {
    if (internalLinkType !== "ALL" && item.type !== internalLinkType) return false;
    if (!internalLinkSearch.trim()) return true;
    const q = internalLinkSearch.toLowerCase().trim();
    return item.title.toLowerCase().includes(q) || item.url.toLowerCase().includes(q);
  });

  // Handle Image Upload & Insert
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImageUploadError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleInsertImage = async () => {
    if (!imageFile) {
      setImageUploadError("Please select an image file.");
      return;
    }

    if (!imageAlt.trim()) {
      setImageUploadError("Alt text is required for SEO and accessibility.");
      return;
    }

    setIsUploadingImage(true);
    setImageUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", imageFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload image.");
      }

      const imageUrl = data.url || data.urls?.[0];
      if (!imageUrl) throw new Error("No image URL returned from upload server.");

      restoreSelection();
      editorRef.current?.focus();

      // Build HTML figure container
      const figure = document.createElement("figure");
      figure.className = "my-8 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 p-2 shadow-sm max-w-3xl mx-auto";

      const img = document.createElement("img");
      img.src = imageUrl;
      img.alt = imageAlt.trim();
      img.className = "w-full h-auto max-h-[480px] object-cover rounded-xl shadow-xs";

      figure.appendChild(img);

      if (imageCaption.trim()) {
        const figcaption = document.createElement("figcaption");
        figcaption.className = "text-center text-xs text-slate-500 font-medium mt-2 italic";
        figcaption.textContent = imageCaption.trim();
        figure.appendChild(figcaption);
      }

      if (savedSelectionRef.current) {
        savedSelectionRef.current.insertNode(figure);
        savedSelectionRef.current.collapse(false);
      } else if (editorRef.current) {
        editorRef.current.appendChild(figure);
      }

      setImageModalOpen(false);
      setImageFile(null);
      setImagePreview("");
      setImageAlt("");
      setImageCaption("");
      emitChange();
    } catch (err: any) {
      console.error("Image upload failed:", err);
      setImageUploadError(err.message || "Upload failed. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="border border-gray-300 rounded-2xl overflow-hidden bg-white shadow-xs focus-within:border-[#052a51] transition-all">
      {/* ── Visual Formatting Toolbar ── */}
      <div className="bg-slate-50 border-b border-gray-200 p-2 flex flex-wrap items-center gap-1 sm:gap-1.5 text-slate-700 select-none">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-gray-200">
          <button
            type="button"
            onClick={() => exec("undo")}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-lg hover:bg-gray-200 text-slate-700 transition-colors"
          >
            <Undo size={15} />
          </button>
          <button
            type="button"
            onClick={() => exec("redo")}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded-lg hover:bg-gray-200 text-slate-700 transition-colors"
          >
            <Redo size={15} />
          </button>
        </div>

        {/* Headings & Paragraph */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-gray-200">
          <button
            type="button"
            onClick={() => formatHeading("h2")}
            title="Heading 2 (H2 - Section title)"
            className="p-1.5 rounded-lg hover:bg-gray-200 text-slate-800 font-bold text-xs flex items-center gap-1 transition-colors"
          >
            <Heading2 size={16} />
            <span className="hidden sm:inline">H2</span>
          </button>
          <button
            type="button"
            onClick={() => formatHeading("h3")}
            title="Heading 3 (H3 - Subsection title)"
            className="p-1.5 rounded-lg hover:bg-gray-200 text-slate-800 font-bold text-xs flex items-center gap-1 transition-colors"
          >
            <Heading3 size={16} />
            <span className="hidden sm:inline">H3</span>
          </button>
          <button
            type="button"
            onClick={() => formatHeading("p")}
            title="Normal Paragraph"
            className="p-1.5 rounded-lg hover:bg-gray-200 text-slate-700 transition-colors"
          >
            <Pilcrow size={15} />
          </button>
        </div>

        {/* Text Styles */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-gray-200">
          <button
            type="button"
            onClick={() => exec("bold")}
            title="Bold (Ctrl+B)"
            className="p-1.5 rounded-lg hover:bg-gray-200 text-slate-800 font-bold transition-colors"
          >
            <Bold size={15} />
          </button>
          <button
            type="button"
            onClick={() => exec("italic")}
            title="Italic (Ctrl+I)"
            className="p-1.5 rounded-lg hover:bg-gray-200 text-slate-700 italic transition-colors"
          >
            <Italic size={15} />
          </button>
          <button
            type="button"
            onClick={() => exec("underline")}
            title="Underline (Ctrl+U)"
            className="p-1.5 rounded-lg hover:bg-gray-200 text-slate-700 underline transition-colors"
          >
            <Underline size={15} />
          </button>
          <button
            type="button"
            onClick={() => exec("strikeThrough")}
            title="Strikethrough"
            className="p-1.5 rounded-lg hover:bg-gray-200 text-slate-700 line-through transition-colors"
          >
            <Strikethrough size={15} />
          </button>
        </div>

        {/* Lists & Blockquote */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-gray-200">
          <button
            type="button"
            onClick={() => exec("insertUnorderedList")}
            title="Bulleted List"
            className="p-1.5 rounded-lg hover:bg-gray-200 text-slate-700 transition-colors"
          >
            <List size={15} />
          </button>
          <button
            type="button"
            onClick={() => exec("insertOrderedList")}
            title="Numbered List"
            className="p-1.5 rounded-lg hover:bg-gray-200 text-slate-700 transition-colors"
          >
            <ListOrdered size={15} />
          </button>
          <button
            type="button"
            onClick={() => formatHeading("blockquote")}
            title="Quote Box"
            className="p-1.5 rounded-lg hover:bg-gray-200 text-slate-700 transition-colors"
          >
            <Quote size={15} />
          </button>
          <button
            type="button"
            onClick={() => exec("insertHorizontalRule")}
            title="Horizontal Divider"
            className="p-1.5 rounded-lg hover:bg-gray-200 text-slate-700 transition-colors"
          >
            <Minus size={15} />
          </button>
        </div>

        {/* Links & Internal Links */}
        <div className="flex items-center gap-1 pr-1.5 border-r border-gray-200">
          <button
            type="button"
            onClick={openLinkModal}
            title="Insert Link (Ctrl+K)"
            className="p-1.5 rounded-lg hover:bg-gray-200 text-slate-700 flex items-center gap-1 text-xs font-semibold transition-colors"
          >
            <LinkIcon size={15} />
            <span className="hidden md:inline">Link</span>
          </button>
          <button
            type="button"
            onClick={openInternalLinkPicker}
            title="Internal Link Picker (Link to Category or Location page)"
            className="p-1.5 rounded-lg bg-orange-100/70 hover:bg-orange-100 text-[#F26522] flex items-center gap-1 text-xs font-bold transition-colors shadow-2xs"
          >
            <Layers size={14} />
            <span>Site Link</span>
          </button>
          <button
            type="button"
            onClick={() => exec("unlink")}
            title="Remove Link"
            className="p-1.5 rounded-lg hover:bg-gray-200 text-slate-500 transition-colors"
          >
            <Unlink size={14} />
          </button>
        </div>

        {/* Image Upload Button */}
        <div className="flex items-center gap-1 pr-1.5 border-r border-gray-200">
          <button
            type="button"
            onClick={() => {
              saveSelection();
              setImageModalOpen(true);
            }}
            title="Insert Image with Alt Text (Sharp Optimized)"
            className="p-1.5 rounded-lg bg-[#052a51]/10 hover:bg-[#052a51]/20 text-[#052a51] flex items-center gap-1 text-xs font-bold transition-colors"
          >
            <ImageIcon size={15} />
            <span>Add Photo</span>
          </button>
        </div>

        {/* HTML Source Toggle */}
        <div className="ml-auto flex items-center">
          <button
            type="button"
            onClick={() => {
              if (isHtmlMode) {
                // Switching from HTML to Visual
                if (editorRef.current) {
                  editorRef.current.innerHTML = htmlCode;
                }
                onChange(htmlCode);
              } else {
                // Switching from Visual to HTML
                setHtmlCode(editorRef.current?.innerHTML || "");
              }
              setIsHtmlMode(!isHtmlMode);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              isHtmlMode ? "bg-[#052a51] text-white" : "bg-gray-100 hover:bg-gray-200 text-slate-700"
            }`}
          >
            <Code size={13} />
            <span>{isHtmlMode ? "Visual Editor" : "HTML Source"}</span>
          </button>
        </div>
      </div>

      {/* ── Editor Body ── */}
      {isHtmlMode ? (
        <textarea
          value={htmlCode}
          onChange={(e) => {
            setHtmlCode(e.target.value);
            onChange(e.target.value);
          }}
          style={{ minHeight }}
          className="w-full p-4 font-mono text-xs text-slate-900 bg-slate-950/5 focus:outline-none resize-y leading-relaxed"
          placeholder="Edit raw HTML..."
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={emitChange}
          onBlur={emitChange}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          style={{ minHeight }}
          data-placeholder={placeholder}
          className="p-5 sm:p-6 focus:outline-none prose prose-slate max-w-none text-slate-800 leading-relaxed text-sm sm:text-base selection:bg-[#F26522]/20 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none"
        />
      )}

      {/* ── 1. Custom URL Link Modal ── */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-[#052a51] text-base flex items-center gap-2">
                <LinkIcon size={16} className="text-[#F26522]" /> Insert Hyperlink
              </h3>
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 py-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Display Text</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="e.g. Explore Vitrified Tiles"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#052a51]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Destination URL</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://... or /shop/..."
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#052a51]"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={linkTargetBlank}
                  onChange={(e) => setLinkTargetBlank(e.target.checked)}
                  className="w-4 h-4 accent-[#F26522] rounded"
                />
                <span className="text-xs text-gray-600 font-medium">Open link in a new tab</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                className="px-5 py-2 bg-[#052a51] hover:bg-[#07396c] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Internal Link Picker Modal (SEO Boost) ── */}
      {internalLinkModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-[#052a51] text-base flex items-center gap-2">
                  <Layers size={18} className="text-[#F26522]" /> Insert Internal Site Link
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Link directly to verified categories or Bangalore local hub pages for SEO internal link juice.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInternalLinkModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter Pills & Search */}
            <div className="space-y-3 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                {(["ALL", "CATEGORY", "LOCATION"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setInternalLinkType(type)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      internalLinkType === type
                        ? "bg-[#052a51] text-white shadow-2xs"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {type === "ALL" ? "All Targets" : type === "CATEGORY" ? "Categories" : "Locations"}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={internalLinkSearch}
                  onChange={(e) => setInternalLinkSearch(e.target.value)}
                  placeholder="Search categories (e.g. Tiles, Electrical) or areas (e.g. Whitefield, Koramangala)..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#052a51]"
                />
              </div>
            </div>

            {/* List of Linkable Targets */}
            <div className="flex-1 overflow-y-auto py-2 divide-y divide-gray-100">
              {filteredInternalLinks.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">
                  No matching internal pages found. Try a different keyword.
                </div>
              ) : (
                filteredInternalLinks.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectInternalLink(item.url, item.title)}
                    className="w-full text-left p-3 hover:bg-orange-50/50 rounded-xl transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {item.type === "CATEGORY" ? (
                          <ShoppingBag size={13} className="text-[#052a51]" />
                        ) : (
                          <MapPin size={13} className="text-[#F26522]" />
                        )}
                        <span className="font-bold text-xs text-[#052a51] group-hover:text-[#F26522] transition-colors">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5 font-mono">{item.subtitle}</p>
                    </div>
                    <span className="text-[11px] font-bold text-[#F26522] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      Insert <Check size={12} />
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setInternalLinkModalOpen(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Inline Image Upload Modal ── */}
      {imageModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-[#052a51] text-base flex items-center gap-2">
                <Upload size={16} className="text-[#F26522]" /> Upload & Insert Article Image
              </h3>
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 py-4">
              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Image File</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                />
              </div>

              {imagePreview && (
                <div className="relative h-40 w-full rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Alt Text (Required) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Alt Text (SEO & Accessibility) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Describe image, e.g. Living room vitrified tile installation"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#052a51]"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Essential for Google Image search ranking and screen readers.
                </p>
              </div>

              {/* Optional Caption */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Caption (Optional)</label>
                <input
                  type="text"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="e.g. Figure 1: 800x800mm polished glazed vitrified tiles"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#052a51]"
                />
              </div>

              {imageUploadError && (
                <div className="p-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-medium border border-red-200">
                  {imageUploadError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUploadingImage}
                onClick={handleInsertImage}
                className="px-5 py-2 bg-[#052a51] hover:bg-[#07396c] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                {isUploadingImage ? (
                  <span>Optimizing & Uploading...</span>
                ) : (
                  <>
                    <Upload size={13} />
                    <span>Upload & Insert</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
