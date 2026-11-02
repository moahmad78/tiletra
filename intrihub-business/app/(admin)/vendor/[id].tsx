import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Linking,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Store,
  Phone,
  Mail,
  Building2,
  IndianRupee,
  Package,
  ShoppingCart,
  Clock,
  Boxes,
  Edit2,
  Trash2,
  X,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Zap,
  FileText,
  Landmark,
  Eye,
  ExternalLink,
  XCircle,
  AlertCircle,
} from "lucide-react-native";
import {
  fetchAdminVendorDetail,
  updateAdminVendor,
  updateAdminProduct,
  deleteAdminProduct,
} from "../../../src/api/admin";
import { Product } from "../../../src/types";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../../src/constants/theme";

export default function AdminVendorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"products" | "orders" | "kyc">("products");
  const [adminKycNote, setAdminKycNote] = useState("");
  const [updatingKyc, setUpdatingKyc] = useState(false);
  const [previewDocModal, setPreviewDocModal] = useState<{ url: string; title: string } | null>(null);

  // Edit Vendor Modal State
  const [vendorEditModalOpen, setVendorEditModalOpen] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [commissionRate, setCommissionRate] = useState("15.0");
  const [status, setStatus] = useState("approved");
  const [verified, setVerified] = useState(false);
  const [autoPublish, setAutoPublish] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"otp" | "password">("otp");
  const [vendorPassword, setVendorPassword] = useState("");
  const [savingVendor, setSavingVendor] = useState(false);
  const [togglingAutoPublish, setTogglingAutoPublish] = useState(false);

  // Edit Product Modal State
  const [productEditModalOpen, setProductEditModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProdName, setEditProdName] = useState("");
  const [editProdPriceBox, setEditProdPriceBox] = useState("");
  const [editProdPriceSqft, setEditProdPriceSqft] = useState("");
  const [editProdStock, setEditProdStock] = useState("");
  const [editProdStatus, setEditProdStatus] = useState("active");
  const [savingProduct, setSavingProduct] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-vendor-detail", id],
    queryFn: () => fetchAdminVendorDetail(id as string),
    enabled: Boolean(id),
  });

  const vendor = data?.vendor;
  const stats = data?.stats;

  useEffect(() => {
    if (vendor) {
      setBusinessName(vendor.businessName || "");
      setContactEmail(vendor.contactEmail || "");
      setContactPhone(vendor.contactPhone || "");
      setCommissionRate(String(vendor.commissionRate ?? 15));
      setStatus(vendor.status || "approved");
      setVerified(Boolean(vendor.verified || vendor.kycStatus === "verified"));
      setAutoPublish(Boolean(vendor.autoPublishEnabled));
      setLoginMethod(vendor.loginMethod || "otp");
    }
  }, [vendor]);

  const handleQuickUpdateStatus = async (newStatus: "approved" | "pending" | "suspended" | "rejected") => {
    setSavingVendor(true);
    try {
      const res = await updateAdminVendor(id as string, {
        status: newStatus,
        verified: newStatus === "approved" ? true : verified,
      });
      setSavingVendor(false);
      if (res.success) {
        setStatus(newStatus);
        if (newStatus === "approved") setVerified(true);
        refetch();
        queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
        Alert.alert(
          "Vendor Status Updated 🎉",
          newStatus === "approved"
            ? `Store "${businessName}" is now APPROVED & ACTIVE on Intrihub!`
            : `Store "${businessName}" status set to ${newStatus.toUpperCase()}`
        );
      } else {
        Alert.alert("Status Update Error", res.error || "Failed to update vendor status");
      }
    } catch (e: any) {
      setSavingVendor(false);
      Alert.alert("Error", e?.message || "Something went wrong.");
    }
  };

  const handleToggleAutoPublish = async () => {
    const nextState = !autoPublish;
    setTogglingAutoPublish(true);
    try {
      const res = await updateAdminVendor(id as string, {
        autoPublishEnabled: nextState,
      });
      setTogglingAutoPublish(false);
      if (res.success) {
        setAutoPublish(nextState);
        refetch();
        queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
        Alert.alert(
          nextState ? "⚡ Auto-Upload Mode Activated" : "⏳ Approval Required Mode Activated",
          nextState
            ? `Items uploaded by "${businessName}" will now go DIRECTLY LIVE without waiting for review.`
            : `Items uploaded by "${businessName}" will now REQUIRE SUPER ADMIN APPROVAL before going live.`
        );
      } else {
        Alert.alert("Error", res.error || "Failed to update upload mode");
      }
    } catch (e: any) {
      setTogglingAutoPublish(false);
      Alert.alert("Error", e?.message || "Something went wrong.");
    }
  };

  const handleAdminUpdateKyc = async (newKycStatus: "verified" | "rejected") => {
    setUpdatingKyc(true);
    try {
      const res = await updateAdminVendor(id as string, {
        kycStatus: newKycStatus,
        kycNotes: adminKycNote.trim() || undefined,
        verified: newKycStatus === "verified",
        status: newKycStatus === "verified" ? "approved" : vendor?.status,
      });
      setUpdatingKyc(false);
      if (res.success) {
        refetch();
        queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
        queryClient.invalidateQueries({ queryKey: ["admin-vendor-detail", id] });
        Alert.alert(
          newKycStatus === "verified" ? "KYC Approved 🎉" : "KYC Rejected ⚠️",
          newKycStatus === "verified"
            ? `Store "${vendor?.businessName}" KYC has been verified and approved!`
            : `Store "${vendor?.businessName}" KYC rejected with feedback note.`
        );
      } else {
        Alert.alert("Error", res.error || "Failed to update KYC status");
      }
    } catch (e: any) {
      setUpdatingKyc(false);
      Alert.alert("Error", e?.message || "Something went wrong.");
    }
  };

  const handleSaveVendor = async () => {
    if (loginMethod === "password" && !vendorPassword && !vendor.hasPassword) {
      Alert.alert("Password Required", "Please enter or generate a password for Password Authentication.");
      return;
    }
    setSavingVendor(true);
    try {
      const res = await updateAdminVendor(id as string, {
        businessName: businessName.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        contactPhone: contactPhone.trim(),
        commissionRate: parseFloat(commissionRate) || 15.0,
        status,
        verified,
        autoPublishEnabled: autoPublish,
        loginMethod,
        password: loginMethod === "password" ? (vendorPassword.trim() || undefined) : undefined,
      });
      setSavingVendor(false);
      if (res.success) {
        setVendorEditModalOpen(false);
        setVendorPassword("");
        Alert.alert("Vendor Updated", "Partner profile and login configuration saved!");
        refetch();
        queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
      } else {
        Alert.alert("Error", res.error || "Failed to update vendor");
      }
    } catch (e: any) {
      setSavingVendor(false);
      Alert.alert("Error", e?.message || "Failed to update vendor");
    }
  };

  const handleOpenEditProduct = (p: any) => {
    setEditingProductId(p.id);
    setEditProdName(p.name || "");
    setEditProdPriceBox(String(p.pricePerBox || ""));
    setEditProdPriceSqft(String(p.pricePerSqft || ""));
    setEditProdStock(String(p.stockBoxes ?? ""));
    setEditProdStatus(p.status || "active");
    setProductEditModalOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!editingProductId) return;
    setSavingProduct(true);
    try {
      const res = await updateAdminProduct(editingProductId, {
        name: editProdName.trim(),
        pricePerBox: editProdPriceBox ? parseFloat(editProdPriceBox) : undefined,
        pricePerSqft: editProdPriceSqft ? parseFloat(editProdPriceSqft) : undefined,
        stockBoxes: editProdStock !== "" ? parseInt(editProdStock, 10) : undefined,
        status: editProdStatus,
      });
      setSavingProduct(false);
      if (res.success) {
        setProductEditModalOpen(false);
        Alert.alert("Product Updated", "Item catalog details updated!");
        refetch();
        queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      } else {
        Alert.alert("Error", res.error || "Failed to update product");
      }
    } catch (e: any) {
      setSavingProduct(false);
      Alert.alert("Error", e?.message || "Something went wrong.");
    }
  };

  const handleDeleteProduct = (prodId: string, name: string) => {
    Alert.alert("Delete Item", `Permanently delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAdminProduct(prodId);
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-products"] });
          } catch (e: any) {
            Alert.alert("Error", e?.message || "Failed to delete");
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.accentBlue} />
        <Text style={{ marginTop: 12, fontSize: 13, color: COLORS.textSecondary, fontFamily: "PlusJakartaSans_500Medium" }}>
          Loading vendor details...
        </Text>
      </View>
    );
  }

  if (isError || !vendor) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ fontSize: 14, color: COLORS.textSecondary, fontFamily: "PlusJakartaSans_500Medium", marginBottom: 14 }}>
          Vendor not found or could not load details.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: "#052A51", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}
          onPress={() => refetch()}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 13, fontFamily: "PlusJakartaSans_700Bold" }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const products = vendor.products || [];
  const splits = vendor.splits || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {vendor.businessName}
        </Text>
        <TouchableOpacity style={styles.headerEditBtn} onPress={() => setVendorEditModalOpen(true)}>
          <Edit2 size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.vendorCard}>
          <View style={styles.vendorHeaderRow}>
            <View style={styles.iconCircle}>
              {vendor.logo ? (
                <Image
                  source={{ uri: vendor.logo }}
                  style={{ width: 48, height: 48, borderRadius: 24 }}
                  contentFit="cover"
                />
              ) : (
                <Store size={26} color="#052A51" />
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                  <Text style={styles.businessTitle} numberOfLines={1}>{vendor.businessName}</Text>
                  {verified && <ShieldCheck size={16} color="#16A34A" />}
                </View>
                {/* Status Badge */}
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                    backgroundColor:
                      status === "approved" ? "#DCFCE7" : status === "pending" ? "#FEF3C7" : "#FEE2E2",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontFamily: "PlusJakartaSans_700Bold",
                      color:
                        status === "approved" ? "#15803D" : status === "pending" ? "#B45309" : "#DC2626",
                    }}
                  >
                    {status === "approved" ? "✓ ACTIVE" : status === "pending" ? "⏳ PENDING" : "⏸ SUSPENDED"}
                  </Text>
                </View>
              </View>
              <Text style={styles.categorySub}>{vendor.category || "Building Materials"}</Text>
              <Text style={styles.ownerSub}>Owner: {vendor.owner?.name || "Verified Partner"}</Text>
            </View>
          </View>

          <View style={styles.contactDetailsBox}>
            <View style={styles.contactItem}>
              <Mail size={13} color="#64748B" />
              <Text style={styles.contactText}>{vendor.contactEmail || "No email"}</Text>
            </View>
            <View style={styles.contactItem}>
              <Phone size={13} color="#64748B" />
              <Text style={styles.contactText}>+91 {vendor.contactPhone || "No phone"}</Text>
            </View>
            {vendor.businessAddress ? (
              <Text style={styles.addressText}>📍 {vendor.businessAddress}</Text>
            ) : null}
          </View>

          {/* Quick Account Status Actions Bar */}
          <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F1F5F9" }}>
            {status !== "approved" ? (
              <TouchableOpacity
                style={{
                  backgroundColor: "#16A34A",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  paddingVertical: 10,
                  borderRadius: 10,
                }}
                onPress={() => handleQuickUpdateStatus("approved")}
                disabled={savingVendor}
                activeOpacity={0.85}
              >
                <CheckCircle2 size={16} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontSize: 13, fontFamily: "PlusJakartaSans_700Bold" }}>
                  Approve & Activate Vendor Store
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: "#FEF2F2",
                    borderWidth: 1,
                    borderColor: "#FECACA",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    paddingVertical: 8,
                    borderRadius: 10,
                  }}
                  onPress={() => {
                    Alert.alert(
                      "Suspend Vendor Store",
                      `Are you sure you want to suspend "${vendor.businessName}"? Their products will be hidden from customer app.`,
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Suspend Store", style: "destructive", onPress: () => handleQuickUpdateStatus("suspended") },
                      ]
                    );
                  }}
                  disabled={savingVendor}
                  activeOpacity={0.85}
                >
                  <AlertTriangle size={14} color="#DC2626" />
                  <Text style={{ color: "#DC2626", fontSize: 12, fontFamily: "PlusJakartaSans_700Bold" }}>
                    Suspend Store
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: "#F0FDF4",
                    borderWidth: 1,
                    borderColor: "#BBF7D0",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    paddingVertical: 8,
                    borderRadius: 10,
                  }}
                  onPress={() => setVendorEditModalOpen(true)}
                  activeOpacity={0.85}
                >
                  <Edit2 size={14} color="#166534" />
                  <Text style={{ color: "#166534", fontSize: 12, fontFamily: "PlusJakartaSans_700Bold" }}>
                    Edit Store
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Auto Upload vs Approval Required Mode Control */}
        <View style={[styles.autoUploadStrip, autoPublish ? styles.autoUploadStripActive : styles.autoUploadStripInactive]}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Zap size={15} color={autoPublish ? "#16A34A" : "#D97706"} />
              <Text style={[styles.autoUploadTitle, { color: autoPublish ? "#166534" : "#92400E" }]}>
                {autoPublish ? "⚡ Auto-Upload Mode (Direct Live)" : "⏳ Approval Required Mode"}
              </Text>
            </View>
            <Text style={[styles.autoUploadSubtitle, { color: autoPublish ? "#15803D" : "#78350F" }]}>
              {autoPublish
                ? "New products uploaded by this vendor will go DIRECTLY LIVE without waiting for Super Admin review."
                : "New products uploaded by this vendor will remain in PENDING until Super Admin approves them."}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.modeSwitchBtn,
              autoPublish ? styles.modeSwitchBtnActive : styles.modeSwitchBtnInactive,
            ]}
            onPress={handleToggleAutoPublish}
            disabled={togglingAutoPublish}
            activeOpacity={0.85}
          >
            {togglingAutoPublish ? (
              <ActivityIndicator size="small" color={autoPublish ? "#FFFFFF" : "#052A51"} />
            ) : (
              <>
                <Text style={[styles.modeSwitchText, autoPublish ? styles.modeSwitchTextActive : styles.modeSwitchTextInactive]}>
                  {autoPublish ? "DIRECT LIVE" : "APPROVAL"}
                </Text>
                <View style={[styles.toggleThumb, autoPublish ? styles.toggleThumbActive : styles.toggleThumbInactive]} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Financial & Performance Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Today's Sales</Text>
            <Text style={styles.statVal}>₹{(stats?.todaySales || 0).toLocaleString("en-IN")}</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>All-Time GMV</Text>
            <Text style={styles.statVal}>₹{(stats?.totalSales || 0).toLocaleString("en-IN")}</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Orders</Text>
            <Text style={styles.statVal}>{stats?.totalOrdersCount || splits.length}</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Commission</Text>
            <Text style={styles.statVal}>{vendor.commissionRate || 15}%</Text>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === "products" && styles.segmentBtnActive]}
            onPress={() => setActiveTab("products")}
          >
            <Package size={14} color={activeTab === "products" ? "#052A51" : "#64748B"} />
            <Text style={[styles.segmentBtnText, activeTab === "products" && styles.segmentBtnTextActive]}>
              Products ({products.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === "orders" && styles.segmentBtnActive]}
            onPress={() => setActiveTab("orders")}
          >
            <ShoppingCart size={14} color={activeTab === "orders" ? "#052A51" : "#64748B"} />
            <Text style={[styles.segmentBtnText, activeTab === "orders" && styles.segmentBtnTextActive]}>
              Orders ({splits.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === "kyc" && styles.segmentBtnActive]}
            onPress={() => setActiveTab("kyc")}
          >
            <ShieldCheck size={14} color={activeTab === "kyc" ? "#052A51" : "#64748B"} />
            <Text style={[styles.segmentBtnText, activeTab === "kyc" && styles.segmentBtnTextActive]}>
              Bank & KYC
            </Text>
            {vendor.kycStatus === "submitted" ? (
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#2563EB" }} />
            ) : null}
          </TouchableOpacity>
        </View>

        {/* Tab 1: Products */}
        {activeTab === "products" ? (
          products.length === 0 ? (
            <View style={styles.emptyCard}>
              <Package size={32} color="#94A3B8" />
              <Text style={styles.emptyText}>This vendor has not uploaded any products yet.</Text>
            </View>
          ) : (
            products.map((p: any) => {
              const uploadDate = p.createdAt
                ? new Date(p.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Unknown";

              return (
                <View key={p.id} style={styles.productCard}>
                  <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                    <Image
                      source={p.images?.[0] ? { uri: p.images[0] } : require("../../../assets/intri-icon.png")}
                      style={styles.productThumb}
                      contentFit="cover"
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.productName} numberOfLines={2}>{p.name}</Text>
                      <Text style={styles.uploadDateText}>🕒 Uploaded: {uploadDate}</Text>

                      <View style={styles.priceRow}>
                        <Text style={styles.priceText}>
                          ₹{p.pricePerBox?.toLocaleString("en-IN") || p.pricePerSqft?.toLocaleString("en-IN") || "0"}
                          <Text style={styles.unitText}> / {p.unitOfSale || "box"}</Text>
                        </Text>
                        <View style={[styles.stockPill, (p.stockBoxes ?? 0) < 10 ? styles.stockRed : styles.stockGreen]}>
                          <Boxes size={11} color={(p.stockBoxes ?? 0) < 10 ? "#DC2626" : "#16A34A"} />
                          <Text style={[styles.stockText, (p.stockBoxes ?? 0) < 10 ? styles.stockTextRed : styles.stockTextGreen]}>
                            {p.stockBoxes ?? 0} In Stock
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.productActionRow}>
                    <TouchableOpacity style={styles.editItemBtn} onPress={() => handleOpenEditProduct(p)}>
                      <Edit2 size={13} color="#052A51" />
                      <Text style={styles.editItemBtnText}>Edit Item Details & Stock</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.deleteItemBtn} onPress={() => handleDeleteProduct(p.id, p.name)}>
                      <Trash2 size={13} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )
        ) : (
          /* Tab 2: Orders */
          splits.length === 0 ? (
            <View style={styles.emptyCard}>
              <ShoppingCart size={32} color="#94A3B8" />
              <Text style={styles.emptyText}>No orders received for this vendor yet.</Text>
            </View>
          ) : (
            splits.map((s: any) => {
              const orderDate = s.createdAt
                ? new Date(s.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Unknown";

              return (
                <View key={s.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <View>
                      <Text style={styles.orderIdText}>SPLIT #{s.id.slice(-8)}</Text>
                      <Text style={styles.orderDateText}>🕒 {orderDate}</Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>
                        {(() => {
                          const norm = (s.fulfillmentStatus || "").toLowerCase();
                          if (norm.includes("ready")) return "READY";
                          if (norm.includes("pending") || norm.includes("awaiting")) return "PENDING";
                          if (norm === "confirmed" || norm === "accepted") return "CONFIRMED";
                          if (norm === "dispatched" || norm === "picked_up") return "DISPATCHED";
                          if (norm === "delivered") return "DELIVERED";
                          if (norm === "cancelled") return "CANCELLED";
                          return (norm.split("_")[0] || "PENDING").toUpperCase();
                        })()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.orderCustomerRow}>
                    <Text style={styles.customerName}>
                      Customer: {s.parentOrder?.customerName || "Customer"}
                    </Text>
                    {s.parentOrder?.customerPhone && (
                      <Text style={styles.customerPhone}>+91 {s.parentOrder.customerPhone}</Text>
                    )}
                  </View>

                  <View style={styles.orderAmountRow}>
                    <Text style={styles.orderAmountLabel}>Vendor Subtotal:</Text>
                    <Text style={styles.orderAmountVal}>₹{(s.subtotal || 0).toLocaleString("en-IN")}</Text>
                  </View>
                </View>
              );
            })
          )
        )}

        {/* Tab 3: Bank & KYC Documents */}
        {activeTab === "kyc" && (
          <View style={{ gap: 14 }}>
            {/* 1. Bank Details Card */}
            <View style={styles.adminKycCard}>
              <View style={styles.adminKycHeaderRow}>
                <View style={[styles.adminKycIconCircle, { backgroundColor: "#EFF6FF" }]}>
                  <Landmark size={18} color="#052A51" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.adminKycTitle}>Bank & Payout Account</Text>
                  <Text style={styles.adminKycSubtitle}>Account configured for automated vendor payouts</Text>
                </View>
              </View>

              {vendor.bankAccountNumber ? (
                <View style={styles.adminKycGrid}>
                  <View style={styles.adminKycGridItem}>
                    <Text style={styles.adminKycLabel}>ACCOUNT HOLDER</Text>
                    <Text style={styles.adminKycVal}>{vendor.bankAccountHolder || "—"}</Text>
                  </View>
                  <View style={styles.adminKycGridItem}>
                    <Text style={styles.adminKycLabel}>BANK NAME</Text>
                    <Text style={styles.adminKycVal}>{vendor.bankName || "—"}</Text>
                  </View>
                  <View style={styles.adminKycGridItem}>
                    <Text style={styles.adminKycLabel}>FULL ACCOUNT NUMBER</Text>
                    <Text style={[styles.adminKycVal, { fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", fontWeight: "800" }]}>
                      {vendor.bankAccountNumber}
                    </Text>
                  </View>
                  <View style={styles.adminKycGridItem}>
                    <Text style={styles.adminKycLabel}>IFSC CODE / UPI ID</Text>
                    <Text style={[styles.adminKycVal, { color: "#052A51", fontWeight: "800" }]}>
                      {vendor.bankIfscCode || vendor.bankUpiId || "—"}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.adminKycEmptyBox}>
                  <AlertCircle size={15} color="#B45309" />
                  <Text style={{ fontSize: 11, color: "#92400E", fontWeight: "600", flex: 1 }}>
                    Vendor has not submitted their bank details yet.
                  </Text>
                </View>
              )}
            </View>

            {/* 2. Legal KYC Documents Card */}
            <View style={styles.adminKycCard}>
              <View style={styles.adminKycHeaderRow}>
                <View style={[styles.adminKycIconCircle, { backgroundColor: "#DCFCE7" }]}>
                  <FileText size={18} color="#15803D" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Text style={styles.adminKycTitle}>Government IDs & Shopfront</Text>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 6,
                        backgroundColor:
                          vendor.kycStatus === "verified"
                            ? "#DCFCE7"
                            : vendor.kycStatus === "submitted"
                            ? "#DBEAFE"
                            : vendor.kycStatus === "rejected"
                            ? "#FEE2E2"
                            : "#FEF3C7",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "800",
                          color:
                            vendor.kycStatus === "verified"
                              ? "#15803D"
                              : vendor.kycStatus === "submitted"
                              ? "#1D4ED8"
                              : vendor.kycStatus === "rejected"
                              ? "#DC2626"
                              : "#B45309",
                        }}
                      >
                        {vendor.kycStatus?.toUpperCase() || "PENDING"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.adminKycSubtitle}>Aadhaar, PAN, Shopfront photo and GST proofs</Text>
                </View>
              </View>

              {/* Document Items List */}
              <View style={{ gap: 10, marginTop: 12 }}>
                {/* 1. PAN Card */}
                <View style={styles.docRowBox}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docRowTitle}>PAN Card</Text>
                    <Text style={styles.docRowVal}>{vendor.panNumber || "Number not entered"}</Text>
                  </View>
                  {vendor.panDocUrl ? (
                    <TouchableOpacity
                      style={styles.adminViewDocBtn}
                      onPress={() => setPreviewDocModal({ url: vendor.panDocUrl, title: `PAN Card - ${vendor.businessName}` })}
                    >
                      <Eye size={13} color="#15803D" />
                      <Text style={styles.adminViewDocBtnText}>View Document</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.noDocText}>Not uploaded</Text>
                  )}
                </View>

                {/* 2. Aadhaar Card */}
                <View style={styles.docRowBox}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docRowTitle}>Aadhaar Card</Text>
                    <Text style={styles.docRowVal}>{vendor.aadharNumber || "Number not entered"}</Text>
                  </View>
                  {vendor.aadharDocUrl ? (
                    <TouchableOpacity
                      style={styles.adminViewDocBtn}
                      onPress={() => setPreviewDocModal({ url: vendor.aadharDocUrl, title: `Aadhaar Card - ${vendor.businessName}` })}
                    >
                      <Eye size={13} color="#15803D" />
                      <Text style={styles.adminViewDocBtnText}>View Document</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.noDocText}>Not uploaded</Text>
                  )}
                </View>

                {/* 3. Shopfront Photo */}
                <View style={styles.docRowBox}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docRowTitle}>Storefront Photo</Text>
                    <Text style={styles.docRowVal}>{vendor.businessAddress || "Physical location"}</Text>
                  </View>
                  {vendor.shopPhotoUrl ? (
                    <TouchableOpacity
                      style={styles.adminViewDocBtn}
                      onPress={() => setPreviewDocModal({ url: vendor.shopPhotoUrl, title: `Shop Photo - ${vendor.businessName}` })}
                    >
                      <Eye size={13} color="#15803D" />
                      <Text style={styles.adminViewDocBtnText}>View Photo</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.noDocText}>Not uploaded</Text>
                  )}
                </View>

                {/* 4. GSTIN Certificate */}
                <View style={styles.docRowBox}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docRowTitle}>GST Certificate</Text>
                    <Text style={styles.docRowVal}>{vendor.gstNumber || "GST Unregistered"}</Text>
                  </View>
                  {vendor.gstDocUrl ? (
                    <TouchableOpacity
                      style={styles.adminViewDocBtn}
                      onPress={() => setPreviewDocModal({ url: vendor.gstDocUrl, title: `GST Certificate - ${vendor.businessName}` })}
                    >
                      <Eye size={13} color="#15803D" />
                      <Text style={styles.adminViewDocBtnText}>View Document</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.noDocText}>Not uploaded</Text>
                  )}
                </View>

                {/* 5. Cancelled Cheque */}
                {vendor.chequeDocUrl ? (
                  <View style={styles.docRowBox}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docRowTitle}>Cancelled Cheque / Passbook</Text>
                      <Text style={styles.docRowVal}>Bank account proof</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.adminViewDocBtn}
                      onPress={() => setPreviewDocModal({ url: vendor.chequeDocUrl, title: `Cheque / Passbook Proof - ${vendor.businessName}` })}
                    >
                      <Eye size={13} color="#15803D" />
                      <Text style={styles.adminViewDocBtnText}>View Proof</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>

              {/* Admin KYC Actions Bar */}
              <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F1F5F9" }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748B", marginBottom: 6 }}>
                  ADMIN REJECTION REASON / FEEDBACK NOTE
                </Text>
                <TextInput
                  style={[styles.inputBox, { height: 40, fontSize: 12, marginBottom: 12 }]}
                  placeholder="Enter rejection reason or verification note..."
                  value={adminKycNote}
                  onChangeText={setAdminKycNote}
                />

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    style={[styles.adminKycBtn, { backgroundColor: "#15803D", flex: 1 }]}
                    onPress={() => handleAdminUpdateKyc("verified")}
                    disabled={updatingKyc}
                  >
                    {updatingKyc ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <ShieldCheck size={16} color="#FFFFFF" />
                        <Text style={styles.adminKycBtnText}>Approve KYC ✓</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.adminKycBtn, { backgroundColor: "#DC2626", flex: 1 }]}
                    onPress={() => {
                      if (!adminKycNote.trim()) {
                        Alert.alert("Reason Required", "Please enter a rejection reason note for the vendor.");
                        return;
                      }
                      handleAdminUpdateKyc("rejected");
                    }}
                    disabled={updatingKyc}
                  >
                    <XCircle size={16} color="#FFFFFF" />
                    <Text style={styles.adminKycBtnText}>Reject KYC ✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Edit Vendor Modal */}
      <Modal visible={vendorEditModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Vendor Profile</Text>
            <TouchableOpacity onPress={() => setVendorEditModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalCard}>
              <Text style={styles.inputLabel}>Business / Store Name</Text>
              <TextInput style={styles.inputBox} value={businessName} onChangeText={setBusinessName} />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Contact Email</Text>
              <TextInput style={styles.inputBox} value={contactEmail} onChangeText={setContactEmail} keyboardType="email-address" />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Contact Phone</Text>
              <TextInput style={styles.inputBox} value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Commission Rate (%)</Text>
              <TextInput style={styles.inputBox} value={commissionRate} onChangeText={setCommissionRate} keyboardType="decimal-pad" />

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>Vendor Login Authentication Method</Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                <TouchableOpacity
                  style={[styles.statusChip, loginMethod === "otp" && styles.statusChipActive, { flex: 1, alignItems: "center" }]}
                  onPress={() => setLoginMethod("otp")}
                >
                  <Text style={[styles.statusChipText, loginMethod === "otp" && styles.statusChipTextActive]}>
                    Email OTP (Default)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.statusChip, loginMethod === "password" && styles.statusChipActive, { flex: 1, alignItems: "center" }]}
                  onPress={() => setLoginMethod("password")}
                >
                  <Text style={[styles.statusChipText, loginMethod === "password" && styles.statusChipTextActive]}>
                    Email + Password
                  </Text>
                </TouchableOpacity>
              </View>

              {loginMethod === "password" && (
                <View style={{ marginTop: 12, padding: 12, backgroundColor: "#FEF3C7", borderRadius: 10 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: "800", color: "#92400E" }}>
                      {vendor?.hasPassword ? "Set New Password (Reset)" : "Set Account Password"}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*";
                        let pwd = "";
                        for (let i = 0; i < 10; i++) {
                          pwd += chars.charAt(Math.floor(Math.random() * chars.length));
                        }
                        setVendorPassword(pwd);
                        Alert.alert("Generated Password", `Password: ${pwd}`);
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: "800", color: COLORS.accentOrange }}>Generate</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={[styles.inputBox, { backgroundColor: "#FFFFFF" }]}
                    placeholder="Enter min 8 characters"
                    value={vendorPassword}
                    onChangeText={setVendorPassword}
                    autoCapitalize="none"
                  />
                  <Text style={{ fontSize: 10, color: "#92400E", marginTop: 4 }}>
                    Password is securely encrypted with scrypt. Plaintext is only shown once at creation.
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveVendor} disabled={savingVendor}>
              {savingVendor ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveActionBtnText}>Save Vendor Profile</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Product Modal */}
      <Modal visible={productEditModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Vendor Item</Text>
            <TouchableOpacity onPress={() => setProductEditModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalCard}>
              <Text style={styles.inputLabel}>Product Title</Text>
              <TextInput style={styles.inputBox} value={editProdName} onChangeText={setEditProdName} />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Price Per Box (₹)</Text>
              <TextInput style={styles.inputBox} value={editProdPriceBox} onChangeText={setEditProdPriceBox} keyboardType="decimal-pad" />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Price Per Sqft (₹)</Text>
              <TextInput style={styles.inputBox} value={editProdPriceSqft} onChangeText={setEditProdPriceSqft} keyboardType="decimal-pad" />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Current Stock (Boxes / Units)</Text>
              <TextInput style={styles.inputBox} value={editProdStock} onChangeText={setEditProdStock} keyboardType="number-pad" />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Status</Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                {["active", "draft", "out_of_stock"].map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.statusChip, editProdStatus === st && styles.statusChipActive]}
                    onPress={() => setEditProdStatus(st)}
                  >
                    <Text style={[styles.statusChipText, editProdStatus === st && styles.statusChipTextActive]}>
                      {st.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveProduct} disabled={savingProduct}>
              {savingProduct ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveActionBtnText}>Save Item Changes</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* In-app Document Preview Modal */}
      <Modal
        visible={Boolean(previewDocModal)}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setPreviewDocModal(null)}
      >
        <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, backgroundColor: "#1E293B" }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#FFFFFF", flex: 1 }} numberOfLines={1}>
              {previewDocModal?.title}
            </Text>
            <TouchableOpacity onPress={() => setPreviewDocModal(null)} style={{ padding: 6 }}>
              <X size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
            {previewDocModal?.url?.toLowerCase()?.includes(".pdf") ? (
              <View style={{ alignItems: "center", padding: 24, backgroundColor: "#1E293B", borderRadius: 16 }}>
                <FileText size={64} color="#38BDF8" />
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF", marginTop: 12 }}>
                  PDF Document Uploaded
                </Text>
                <TouchableOpacity
                  style={{ marginTop: 16, backgroundColor: "#0284C7", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}
                  onPress={() => previewDocModal?.url && Linking.openURL(previewDocModal.url)}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 13 }}>Open PDF Document ↗</Text>
                </TouchableOpacity>
              </View>
            ) : previewDocModal?.url ? (
              <Image
                source={{ uri: previewDocModal.url }}
                style={{ width: "100%", height: "80%", borderRadius: 12 }}
                contentFit="contain"
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    backgroundColor: COLORS.primaryDark,
    paddingTop: 50,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.textWhite,
    textAlign: "center",
    marginHorizontal: 10,
  },
  headerEditBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 50,
  },
  vendorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...SHADOWS.sm,
  },
  vendorHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  businessTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#052A51",
  },
  categorySub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  ownerSub: {
    fontSize: 11,
    color: "#94A3B8",
  },
  contactDetailsBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: 6,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactText: {
    fontSize: 12,
    color: "#475569",
  },
  addressText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statBox: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
  },
  statVal: {
    fontSize: 16,
    fontWeight: "900",
    color: "#052A51",
    marginTop: 4,
  },
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  segmentBtnTextActive: {
    color: "#052A51",
    fontWeight: "800",
  },
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...SHADOWS.sm,
  },
  productThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  productName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#052A51",
  },
  uploadDateText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  priceText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#052A51",
  },
  unitText: {
    fontSize: 10,
    color: "#64748B",
  },
  stockPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  stockGreen: { backgroundColor: "#DCFCE7" },
  stockRed: { backgroundColor: "#FEE2E2" },
  stockText: { fontSize: 10, fontWeight: "800" },
  stockTextGreen: { color: "#16A34A" },
  stockTextRed: { color: "#DC2626" },
  productActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  editItemBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  editItemBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#052A51",
  },
  deleteItemBtn: {
    padding: 6,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
    ...SHADOWS.sm,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderIdText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#052A51",
  },
  orderDateText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#1E40AF",
  },
  orderCustomerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  customerName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
  customerPhone: {
    fontSize: 12,
    color: "#64748B",
  },
  orderAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  orderAmountLabel: {
    fontSize: 11,
    color: "#64748B",
  },
  orderAmountVal: {
    fontSize: 13,
    fontWeight: "900",
    color: "#052A51",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    color: "#64748B",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#052A51",
  },
  closeBtn: {
    padding: 6,
  },
  modalContent: {
    padding: 16,
    gap: 12,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  inputBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: COLORS.text,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  statusChipActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },
  statusChipTextActive: {
    color: "#1D4ED8",
    fontWeight: "800",
  },
  saveActionBtn: {
    backgroundColor: "#052A51",
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  saveActionBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  autoUploadStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  autoUploadStripActive: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  autoUploadStripInactive: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  autoUploadTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  autoUploadSubtitle: {
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
  },
  modeSwitchBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  modeSwitchBtnActive: {
    backgroundColor: "#16A34A",
    borderColor: "#15803D",
  },
  modeSwitchBtnInactive: {
    backgroundColor: "#F1F5F9",
    borderColor: "#CBD5E1",
  },
  modeSwitchText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  modeSwitchTextActive: {
    color: "#FFFFFF",
  },
  modeSwitchTextInactive: {
    color: "#475569",
  },
  toggleThumb: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  toggleThumbActive: {
    backgroundColor: "#FFFFFF",
  },
  toggleThumbInactive: {
    backgroundColor: "#94A3B8",
  },
  adminKycCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  adminKycHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 10,
  },
  adminKycIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  adminKycTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#052A51",
  },
  adminKycSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  adminKycGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 12,
  },
  adminKycGridItem: {
    width: "48%",
  },
  adminKycLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  adminKycVal: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 2,
  },
  adminKycEmptyBox: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  docRowBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  docRowTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#052A51",
  },
  docRowVal: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  adminViewDocBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  adminViewDocBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#15803D",
  },
  noDocText: {
    fontSize: 11,
    color: "#94A3B8",
    fontStyle: "italic",
  },
  adminKycBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  adminKycBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});
