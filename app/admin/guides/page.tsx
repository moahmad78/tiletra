"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  Eye,
  ExternalLink,
  Calendar,
  Clock,
  User,
  Image as ImageIcon,
  CheckCircle2,
  FileEdit,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Upload,
  X,
  ChevronRight,
  Globe,
  Share2,
  Copy,
  Tag
} from "lucide-react";
import { toast } from "sonner";
import {
  getGuidePosts,
  createGuidePost,
  updateGuidePost,
  deleteGuidePost,
  seedInitialGuidesIfEmpty,
  GuidePostItem,
  GuidePostInput
} from "@/lib/actions/guides";
import RichTextEditor from "@/components/admin/guides/RichTextEditor";

const CATEGORIES = [
  "All Categories",
  "Trends",
  "Buying Guide",
  "How-To",
  "Product Spotlight",
  "Tiles",
  "Sanitaryware",
  "Electrical",
  "Bathware",
  "Flooring",
  "Architecture & Design",
];

export default function AdminGuidesPage() {
  const [posts, setPosts] = useState<GuidePostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT" | "SCHEDULED">("ALL");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  // Editor modal state
  const [editorOpen, setEditorOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<GuidePostItem | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form states
  const [formData, setFormData] = useState<GuidePostInput & { keywordsString?: string }>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featuredImage: "",
    featuredImageAlt: "",
    metaTitle: "",
    metaDescription: "",
    category: "Trends",
    status: "PUBLISHED",
    authorName: "IntriHub Team",
    authorRole: "Home & Tile Specialist",
    readTime: "5 min read",
    keywordsString: "",
    publishedAt: new Date().toISOString(),
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  // Load posts
  const loadPosts = async () => {
    try {
      setLoading(true);
      // Auto seed if empty
      await seedInitialGuidesIfEmpty();
      const data = await getGuidePosts();
      setPosts(data.posts as GuidePostItem[]);
    } catch (err: any) {
      console.error("Failed to load guides:", err);
      toast.error(err.message || "Failed to load guide posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const openNewPost = () => {
    setEditingPost(null);
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "<h2>Introduction</h2><p>Write your detailed guide content here...</p><h2>Key Factors to Consider</h2><p>Provide insights, tips, and recommendations...</p>",
      featuredImage: "",
      featuredImageAlt: "",
      metaTitle: "",
      metaDescription: "",
      category: "Trends",
      status: "PUBLISHED",
      authorName: "IntriHub Team",
      authorRole: "Home & Tile Specialist",
      readTime: "5 min read",
      keywordsString: "",
      publishedAt: new Date().toISOString().slice(0, 16),
    });
    setEditorOpen(true);
  };

  const openEditPost = (post: GuidePostItem) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      content: post.content,
      featuredImage: post.featuredImage || "",
      featuredImageAlt: post.featuredImageAlt || post.title || "",
      metaTitle: post.metaTitle || "",
      metaDescription: post.metaDescription || "",
      category: post.category,
      status: (post.status as "DRAFT" | "PUBLISHED" | "SCHEDULED") || "PUBLISHED",
      authorName: post.authorName,
      authorRole: post.authorRole || "Home & Tile Specialist",
      readTime: post.readTime || `${post.readTimeMinutes || 5} min read`,
      keywordsString: Array.isArray(post.keywords) ? post.keywords.join(", ") : "",
      publishedAt: post.publishedAt
        ? new Date(post.publishedAt).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
    });
    setEditorOpen(true);
  };

  const handleTitleChange = (val: string) => {
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: editingPost ? prev.slug : autoSlug,
      metaTitle: prev.metaTitle ? prev.metaTitle : `${val} | Intrihub Guide`.slice(0, 60),
    }));
  };

  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      if (!res.ok) throw new Error("Image upload failed");
      const data = await res.json();
      setFormData((prev) => ({ ...prev, featuredImage: data.url }));
      toast.success("Featured image uploaded and optimized successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (statusOverride?: "DRAFT" | "PUBLISHED" | "SCHEDULED") => {
    if (!formData.title?.trim()) {
      toast.error("Please provide a title");
      return;
    }
    if (!formData.slug?.trim()) {
      toast.error("Please provide a URL slug");
      return;
    }
    if (!formData.featuredImage?.trim()) {
      toast.error("Please provide a featured image");
      return;
    }
    if (!formData.featuredImageAlt?.trim()) {
      toast.error("Please provide alt text for the featured image (required for SEO/accessibility)");
      return;
    }
    if (!formData.content?.trim()) {
      toast.error("Please provide content for the post");
      return;
    }

    const payload: GuidePostInput = {
      title: formData.title.trim(),
      slug: formData.slug.trim(),
      featuredImage: formData.featuredImage.trim(),
      featuredImageAlt: formData.featuredImageAlt.trim(),
      excerpt: formData.excerpt?.trim() || "",
      content: formData.content,
      metaTitle: formData.metaTitle?.trim(),
      metaDescription: formData.metaDescription?.trim(),
      category: formData.category || "Trends",
      authorName: formData.authorName?.trim() || "IntriHub Team",
      authorRole: formData.authorRole?.trim(),
      readTime: formData.readTime?.trim(),
      keywords: formData.keywordsString
        ? formData.keywordsString.split(",").map((k) => k.trim()).filter(Boolean)
        : [],
      status: statusOverride || formData.status,
      publishedAt: formData.publishedAt ? new Date(formData.publishedAt).toISOString() : new Date().toISOString(),
    };

    startTransition(async () => {
      try {
        if (editingPost) {
          await updateGuidePost(editingPost.id, payload);
          toast.success("Guide post updated successfully!");
        } else {
          await createGuidePost(payload);
          toast.success("Guide post created successfully!");
        }
        setEditorOpen(false);
        loadPosts();
      } catch (err: any) {
        toast.error(err.message || "Failed to save post");
      }
    });
  };

  const handleDelete = async (post: GuidePostItem) => {
    if (!confirm(`Are you sure you want to delete "${post.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteGuidePost(post.id);
      toast.success("Guide post deleted successfully");
      loadPosts();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete post");
    }
  };

  // Filter posts
  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authorName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    const matchesCategory =
      categoryFilter === "All Categories" || p.category.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const publishedCount = posts.filter((p) => p.status === "PUBLISHED").length;
  const draftCount = posts.filter((p) => p.status === "DRAFT").length;
  const scheduledCount = posts.filter((p) => p.status === "SCHEDULED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <BookOpen className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Guides & Blog Posts</h1>
              <p className="text-sm text-slate-500">
                Publish and manage high-ranking SEO buying guides, articles, and product tutorials.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/guides"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View Live /guides
          </Link>
          <button
            onClick={openNewPost}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-all duration-200 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Guide Post
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Posts</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{posts.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Published</p>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1">{publishedCount}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Drafts</p>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-1">{draftCount}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-sky-600 uppercase tracking-wider">Scheduled</p>
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
          </div>
          <p className="text-2xl font-black text-sky-700 mt-1">{scheduledCount}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit">
            {(["ALL", "PUBLISHED", "DRAFT", "SCHEDULED"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st === "ALL" ? "All Posts" : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts, slugs, categories..."
                className="pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none w-56 sm:w-64"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">Loading guide posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-800">No guide posts found</p>
            <p className="text-sm text-slate-500 mt-1">
              {searchQuery ? "Try refining your search keywords or filters." : "Create your first guide post to get started."}
            </p>
            <button
              onClick={openNewPost}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" />
              Create Guide Post
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Post & Slug</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Author</th>
                  <th className="py-3.5 px-4">Publish Date</th>
                  <th className="py-3.5 px-4">Views</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0 relative overflow-hidden">
                          {post.featuredImage ? (
                            <Image
                              src={post.featuredImage}
                              alt={post.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 max-w-sm">
                          <p className="font-semibold text-slate-900 truncate group-hover:text-emerald-600 transition-colors">
                            {post.title}
                          </p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                            /guides/{post.slug}
                          </p>
                          {post.excerpt && (
                            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                              {post.excerpt}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {post.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {post.status === "PUBLISHED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Published
                        </span>
                      )}
                      {post.status === "DRAFT" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <FileEdit className="w-3 h-3" />
                          Draft
                        </span>
                      )}
                      {post.status === "SCHEDULED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                          <Clock className="w-3 h-3" />
                          Scheduled
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs text-slate-700 font-medium">{post.authorName}</div>
                      <div className="text-[11px] text-slate-400">{post.readTime || "5 min"}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs text-slate-600 font-medium">
                        {new Date(post.publishedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(post.publishedAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-semibold text-slate-700">{post.viewsCount || 0}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/guides/${post.slug}`}
                          target="_blank"
                          title="View Live Guide"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => openEditPost(post)}
                          title="Edit Guide"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(post)}
                          title="Delete Guide"
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  {editingPost ? <FileEdit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingPost ? "Edit Guide Post" : "Create New Guide Post"}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    URL: /guides/{formData.slug || "[slug]"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(!previewOpen)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {previewOpen ? "Editor Mode" : "Preview Mode"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {previewOpen ? (
                /* Live Preview Mode */
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 max-w-3xl mx-auto space-y-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    {formData.category}
                  </div>
                  <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
                    {formData.title || "Untitled Post"}
                  </h1>
                  <div className="flex items-center gap-4 text-xs text-slate-500 border-y border-slate-200 py-3">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> {formData.authorName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />{" "}
                      {new Date(formData.publishedAt || Date.now()).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {formData.readTime || "5 min read"}
                    </span>
                  </div>
                  {formData.featuredImage && (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200">
                      <Image
                        src={formData.featuredImage}
                        alt={formData.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  {formData.excerpt && (
                    <p className="text-base text-slate-600 font-medium italic border-l-4 border-emerald-500 pl-4 py-1">
                      {formData.excerpt}
                    </p>
                  )}
                  <div
                    className="prose prose-slate max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-img:rounded-xl prose-a:text-emerald-600"
                    dangerouslySetInnerHTML={{ __html: formData.content }}
                  />
                </div>
              ) : (
                /* Edit Form Mode */
                <div className="space-y-6">
                  {/* Basic Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                        <span>Post Title *</span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          Reserved H1 for page
                        </span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="e.g., How to Choose the Best Bathroom Tiles in 2026"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        URL Slug *
                      </label>
                      <div className="flex items-center">
                        <span className="px-3 py-2.5 bg-slate-100 border border-r-0 border-slate-200 text-xs font-mono text-slate-500 rounded-l-xl">
                          /guides/
                        </span>
                        <input
                          type="text"
                          value={formData.slug}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              slug: e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9-]/g, "-"),
                            }))
                          }
                          placeholder="how-to-choose-bathroom-tiles"
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Category / Tag *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        {CATEGORIES.filter((c) => c !== "All Categories").map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            status: e.target.value as "DRAFT" | "PUBLISHED" | "SCHEDULED",
                          }))
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="PUBLISHED">Published (Visible on site)</option>
                        <option value="DRAFT">Draft (Hidden)</option>
                        <option value="SCHEDULED">Scheduled (Future date)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Publish / Schedule Date
                      </label>
                      <input
                        type="datetime-local"
                        value={
                          typeof formData.publishedAt === "string"
                            ? formData.publishedAt
                            : formData.publishedAt
                            ? new Date(formData.publishedAt).toISOString().slice(0, 16)
                            : ""
                        }
                        onChange={(e) => setFormData((prev) => ({ ...prev, publishedAt: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Author Name
                      </label>
                      <input
                        type="text"
                        value={formData.authorName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, authorName: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Estimated Read Time
                      </label>
                      <input
                        type="text"
                        value={formData.readTime}
                        onChange={(e) => setFormData((prev) => ({ ...prev, readTime: e.target.value }))}
                        placeholder="e.g. 6 min read"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Featured Image Section */}
                  <div className="space-y-2 p-4 bg-slate-50/75 rounded-xl border border-slate-200">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-emerald-600" />
                        Featured Image (Optimized automatically)
                      </span>
                      {uploadingImage && (
                        <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Uploading & compressing...
                        </span>
                      )}
                    </label>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {formData.featuredImage ? (
                        <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-slate-300 flex-shrink-0 group">
                          <Image
                            src={formData.featuredImage}
                            alt="Featured preview"
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, featuredImage: "" }))}
                            className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-32 h-20 rounded-lg bg-slate-200/80 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 flex-shrink-0">
                          <ImageIcon className="w-5 h-5 mb-1" />
                          <span className="text-[10px]">No image</span>
                        </div>
                      )}

                      <div className="flex-1 w-full space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg shadow-xs transition-colors">
                            <Upload className="w-3.5 h-3.5 text-emerald-600" />
                            Upload from Device
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFeaturedImageUpload}
                              className="hidden"
                            />
                          </label>
                          <span className="text-xs text-slate-400">or enter image URL below</span>
                        </div>
                        <input
                          type="text"
                          value={formData.featuredImage}
                          onChange={(e) => setFormData((prev) => ({ ...prev, featuredImage: e.target.value }))}
                          placeholder="https://... or /api/uploads/..."
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Featured Image Alt Text */}
                    <div className="pt-2 border-t border-slate-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          Featured Image Alt Text *
                        </label>
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                          Required for SEO & Accessibility
                        </span>
                      </div>
                      <input
                        type="text"
                        value={formData.featuredImageAlt}
                        onChange={(e) => setFormData((prev) => ({ ...prev, featuredImageAlt: e.target.value }))}
                        placeholder="Descriptive explanation of the image for search engines and screen readers..."
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Short Excerpt */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                      <span>Excerpt / Short Summary</span>
                      <span className="text-[11px] text-slate-400">Used for cards & feeds</span>
                    </label>
                    <textarea
                      rows={2}
                      value={formData.excerpt}
                      onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                      placeholder="A quick 1-2 sentence overview shown in guide lists and social previews..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Keywords & Tags */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                      <span>Keywords & Tracking Tags</span>
                      <span className="text-[11px] text-slate-400">Comma-separated (internal tracking)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.keywordsString || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, keywordsString: e.target.value }))}
                      placeholder="e.g. eco-friendly materials, sustainable construction, green tiles 2026"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Rich Content Editor */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                      <span>Content Body *</span>
                      <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                        H2, H3, Links, Internal Catalog Picker & Alt-Tagged Images
                      </span>
                    </label>
                    <RichTextEditor
                      value={formData.content}
                      onChange={(html) => setFormData((prev) => ({ ...prev, content: html }))}
                      placeholder="Write your guide article with headings, paragraphs, formatted lists, and internal links..."
                    />
                  </div>

                  {/* SEO Metadata Section */}
                  <div className="p-5 bg-gradient-to-br from-slate-50 to-emerald-50/30 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-emerald-600" />
                        <h3 className="text-sm font-bold text-slate-900">SEO & Search Engine Optimization</h3>
                      </div>
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        Google Search Ready
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Meta Title */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-700">Meta Title</label>
                          <span
                            className={`text-[11px] font-mono font-medium ${
                              (formData.metaTitle?.length || 0) > 60
                                ? "text-amber-600 font-bold"
                                : "text-slate-400"
                            }`}
                          >
                            {formData.metaTitle?.length || 0}/60 chars (Recommended ~50-60)
                          </span>
                        </div>
                        <input
                          type="text"
                          value={formData.metaTitle}
                          onChange={(e) => setFormData((prev) => ({ ...prev, metaTitle: e.target.value }))}
                          placeholder="Title tag displayed on Google search results"
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      {/* Meta Description */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-700">Meta Description</label>
                          <span
                            className={`text-[11px] font-mono font-medium ${
                              (formData.metaDescription?.length || 0) > 160
                                ? "text-amber-600 font-bold"
                                : "text-slate-400"
                            }`}
                          >
                            {formData.metaDescription?.length || 0}/160 chars (Recommended ~150-160)
                          </span>
                        </div>
                        <textarea
                          rows={2}
                          value={formData.metaDescription}
                          onChange={(e) => setFormData((prev) => ({ ...prev, metaDescription: e.target.value }))}
                          placeholder="Search engine summary snippet..."
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      {/* Google SERP Preview Card */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1 mt-2">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                          Google Search Preview
                        </p>
                        <p className="text-xs text-slate-500 font-mono flex items-center gap-1">
                          https://intrihub.com <span className="text-slate-300">›</span> guides{" "}
                          <span className="text-slate-300">›</span> {formData.slug || "post-slug"}
                        </p>
                        <p className="text-base text-blue-700 font-medium hover:underline cursor-pointer leading-tight">
                          {formData.metaTitle || formData.title || "Intrihub Buying Guide"}
                        </p>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {formData.metaDescription ||
                            formData.excerpt ||
                            "Explore curated building material guides, expert recommendations, and top tile insights from Intrihub."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleSave("DRAFT")}
                  className="px-4 py-2 text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleSave("PUBLISHED")}
                  className="inline-flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {editingPost ? "Save & Publish" : "Publish Post"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
