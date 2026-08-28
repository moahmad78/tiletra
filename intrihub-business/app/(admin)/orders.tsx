import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import {
  ShoppingCart,
  Truck,
  MapPin,
  Search,
  CheckCircle2,
  Clock,
  User,
  Phone,
  CreditCard,
  ChevronRight,
  Plus,
  Edit2,
  X,
  Navigation,
  ShieldAlert,
  IndianRupee,
  Sliders,
  DollarSign,
  Package,
  Trash2,
  Store,
  Mail,
  CheckSquare2,
  Square,
  PauseCircle,
  PlayCircle,
} from "lucide-react-native";
import {
  fetchAdminOrders,
  updateAdminOrder,
  deleteAdminOrder,
  fetchAdminDeliveries,
  assignAdminCourier,
  updateAdminDeliveryTracking,
  confirmAdminDeliveryCod,
  fetchAdminStoreSettings,
  updateAdminStoreSettings,
} from "../../src/api/admin";
import { AdminOrder } from "../../src/types";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";

export default function AdminOrdersHubScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Top Segment: "orders" | "deliveries" | "shipping"
  const [activeSection, setActiveSection] = useState<"orders" | "deliveries" | "shipping">("orders");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Multi-Selection / Batch Selection Mode State (Hold to Mark)
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Order Details Modal State
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  // Courier Assignment Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedSplitId, setSelectedSplitId] = useState<string | null>(null);
  const [courierName, setCourierName] = useState("");
  const [courierPhone, setCourierPhone] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [savingAssign, setSavingAssign] = useState(false);

  // Shipping Rates Form State
  const [freeThreshold, setFreeThreshold] = useState("5000");
  const [standardFee, setStandardFee] = useState("149");
  const [bikeRate, setBikeRate] = useState("49");
  const [fourWheelerRate, setFourWheelerRate] = useState("299");
  const [weightThreshold, setWeightThreshold] = useState("25");
  const [blockedPincodes, setBlockedPincodes] = useState("");
  const [savingRates, setSavingRates] = useState(false);

  // 1. Orders Query
  const {
    data: ordersData,
    isLoading: ordersLoading,
    refetch: refetchOrders,
    isRefetching: ordersRefetching,
  } = useQuery({
    queryKey: ["admin-orders", search, statusFilter],
    queryFn: () =>
      fetchAdminOrders({
        search: search.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
  });

  // 2. Deliveries Query
  const {
    data: deliveriesData,
    isLoading: deliveriesLoading,
    refetch: refetchDeliveries,
    isRefetching: deliveriesRefetching,
  } = useQuery({
    queryKey: ["admin-deliveries"],
    queryFn: () => fetchAdminDeliveries(),
  });

  // 3. Settings Query for Shipping Rates
  const {
    data: settingsData,
    isLoading: settingsLoading,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: ["admin-store-settings"],
    queryFn: () => fetchAdminStoreSettings(),
  });

  const orders = ordersData?.orders || [];
  const splits = deliveriesData?.splits || [];

  // Batch Multi-Select Handlers
  const handleToggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((i) => i !== id);
        if (next.length === 0) setIsSelectMode(false);
        return next;
      } else {
        setIsSelectMode(true);
        return [...prev, id];
      }
    });
  };

  const handleLongPressOrder = (id: string) => {
    setIsSelectMode(true);
    if (!selectedOrderIds.includes(id)) {
      setSelectedOrderIds((prev) => [...prev, id]);
    }
  };

  const handleSelectAllOrders = () => {
    if (selectedOrderIds.length === orders.length) {
      setSelectedOrderIds([]);
      setIsSelectMode(false);
    } else {
      setSelectedOrderIds(orders.map((o: any) => o.id));
      setIsSelectMode(true);
    }
  };

  const handleCancelSelectMode = () => {
    setSelectedOrderIds([]);
    setIsSelectMode(false);
  };

  const handleBulkDeleteOrders = () => {
    if (selectedOrderIds.length === 0) return;
    Alert.alert(
      "Move Selected Orders to Trash",
      `Move ${selectedOrderIds.length} selected order(s) to Recycle Bin?\n\nThey can be restored from the Recycle Bin within 3 days.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: `Move ${selectedOrderIds.length} Orders to Trash`,
          style: "destructive",
          onPress: async () => {
            setBulkProcessing(true);
            try {
              for (const id of selectedOrderIds) {
                await deleteAdminOrder(id);
              }
              setBulkProcessing(false);
              setSelectedOrderIds([]);
              setIsSelectMode(false);
              refetchOrders();
              queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
              queryClient.invalidateQueries({ queryKey: ["admin-trash"] });
              queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
              Alert.alert("Bulk Delete 🎉", `${selectedOrderIds.length} orders moved to Recycle Bin.`);
            } catch (e: any) {
              setBulkProcessing(false);
              Alert.alert("Error", e?.message || "Failed bulk order delete");
            }
          },
        },
      ]
    );
  };

  const handleBulkUpdateOrderStatus = async (targetStatus: string) => {
    if (selectedOrderIds.length === 0) return;
    setBulkProcessing(true);
    try {
      for (const id of selectedOrderIds) {
        await updateAdminOrder(id, { orderStatus: targetStatus });
      }
      setBulkProcessing(false);
      setSelectedOrderIds([]);
      setIsSelectMode(false);
      refetchOrders();
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      Alert.alert(
        "Bulk Status Update 🎉",
        `Marked ${selectedOrderIds.length} orders as ${targetStatus.toUpperCase()}.`
      );
    } catch (e: any) {
      setBulkProcessing(false);
      Alert.alert("Error", e?.message || "Failed bulk order status update");
    }
  };

  // Handle Delete Order (Soft Delete)
  const handleDeleteOrder = (orderId: string, customerName: string) => {
    Alert.alert(
      "Move Order to Recycle Bin",
      `Move order #${orderId.slice(-8).toUpperCase()} for "${customerName}" to Trash?\n\nIt will be preserved in the Recycle Bin for 3 days and can be restored.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Move to Trash",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await deleteAdminOrder(orderId);
              if (res.success) {
                refetchOrders();
                queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
                queryClient.invalidateQueries({ queryKey: ["admin-trash"] });
                queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
                Alert.alert("Moved to Trash", `Order #${orderId.slice(-8).toUpperCase()} moved to Recycle Bin.`);
              } else {
                Alert.alert("Error", res.error || "Failed to delete order");
              }
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Failed to delete order");
            }
          },
        },
      ]
    );
  };

  // Open Courier Assignment Modal
  const handleOpenAssign = (split: any) => {
    setSelectedSplitId(split.id);
    setCourierName(split.courierName || "");
    setCourierPhone(split.courierPhone || "");
    setTrackingNumber(split.trackingNumber || "");
    setAssignModalOpen(true);
  };

  // Save Courier Assignment
  const handleSaveAssign = async () => {
    if (!selectedSplitId) return;
    setSavingAssign(true);
    try {
      const res = await assignAdminCourier(selectedSplitId, {
        courierName: courierName.trim() || "Express Delivery Partner",
        courierPhone: courierPhone.trim() || undefined,
        trackingNumber: trackingNumber.trim() || undefined,
      });
      setSavingAssign(false);

      if (res.success) {
        setAssignModalOpen(false);
        refetchDeliveries();
        Alert.alert("Assigned 🎉", "Courier details updated successfully!");
      } else {
        Alert.alert("Error", res.error || "Failed to assign courier");
      }
    } catch (e: any) {
      setSavingAssign(false);
      Alert.alert("Error", e?.message || "Something went wrong.");
    }
  };

  // Confirm COD Payment
  const handleConfirmCod = async (splitId: string) => {
    Alert.alert(
      "Confirm Cash on Delivery",
      "Has the delivery agent collected the cash payment for this order split?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Payment Collected",
          onPress: async () => {
            try {
              const res = await confirmAdminDeliveryCod(splitId);
              if (res.success) {
                refetchDeliveries();
                queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
                Alert.alert("Success 🎉", "COD payment marked as Collected!");
              } else {
                Alert.alert("Error", res.error || "Failed to confirm COD");
              }
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Something went wrong.");
            }
          },
        },
      ]
    );
  };

  // Save Shipping Rules
  const handleSaveShippingRates = async () => {
    setSavingRates(true);
    try {
      const res = await updateAdminStoreSettings({
        freeShippingThreshold: parseFloat(freeThreshold) || 5000,
        standardDeliveryFee: parseFloat(standardFee) || 149,
        twoWheelerBaseRate: parseFloat(bikeRate) || 49,
        fourWheelerBaseRate: parseFloat(fourWheelerRate) || 299,
        weightThresholdKg: parseFloat(weightThreshold) || 25,
        blockedPincodes: blockedPincodes.split(",").map((p) => p.trim()).filter(Boolean),
      });
      setSavingRates(false);

      if (res.success) {
        refetchSettings();
        Alert.alert("Saved 🎉", "Platform shipping rate rules updated!");
      } else {
        Alert.alert("Error", res.error || "Failed to save shipping rates");
      }
    } catch (e: any) {
      setSavingRates(false);
      Alert.alert("Error", e?.message || "Failed to save shipping rates");
    }
  };

  const renderOrderItem = ({ item }: { item: any }) => {
    const isSelected = selectedOrderIds.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.orderCard, isSelected && { borderColor: "#2563EB", backgroundColor: "#F0F6FF", borderWidth: 1.5 }]}
        onPress={() => {
          if (isSelectMode) {
            handleToggleSelectOrder(item.id);
          } else {
            setSelectedOrder(item);
            setOrderModalOpen(true);
          }
        }}
        onLongPress={() => handleLongPressOrder(item.id)}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <TouchableOpacity
            style={{ justifyContent: "center", paddingRight: 6 }}
            onPress={() => handleToggleSelectOrder(item.id)}
          >
            {isSelected ? (
              <CheckSquare2 size={20} color="#2563EB" />
            ) : (
              <Square size={20} color="#CBD5E1" />
            )}
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.orderId}>#{item.orderNumber || item.id?.slice(-8).toUpperCase()}</Text>
            <Text style={styles.dateText}>
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }) : ""}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={[styles.statusBadge, getOrderStatusStyle(item.orderStatus)]}>
              <Text style={styles.statusBadgeText}>{item.orderStatus?.toUpperCase() || "PROCESSING"}</Text>
            </View>
            <TouchableOpacity
              style={{ padding: 4, backgroundColor: "#FEF2F2", borderRadius: 6 }}
              onPress={() => handleDeleteOrder(item.id, item.customerName || "Customer")}
            >
              <Trash2 size={13} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.customerRow}>
          <User size={13} color={COLORS.textSecondary} />
          <Text style={styles.customerName}>{item.customerName || "Customer"}</Text>
          {item.customerPhone ? (
            <Text style={styles.customerPhone}>• +91 {item.customerPhone}</Text>
          ) : null}
        </View>

        {item.customerAddress ? (
          <Text style={styles.addressPreviewText} numberOfLines={1}>
            📍 {item.customerAddress}
          </Text>
        ) : null}

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Total Amount</Text>
            <Text style={styles.metricVal}>₹{(item.totalAmount ?? item.total ?? 0).toLocaleString("en-IN")}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Payment</Text>
            <Text style={styles.metricVal}>{item.paymentMethod?.toUpperCase() || "COD"}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Pay Status</Text>
            <Text style={[styles.metricVal, { color: item.paymentStatus === "paid" ? "#16A34A" : "#F59E0B" }]}>
              {item.paymentStatus?.toUpperCase() || "PENDING"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDeliverySplitItem = ({ item }: { item: any }) => (
    <View style={styles.orderCard}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderId}>SPLIT #{item.id?.slice(-8)}</Text>
          <Text style={styles.vendorName}>Vendor: {item.vendor?.businessName || "Vendor Partner"}</Text>
        </View>
        <View style={[styles.statusBadge, getOrderStatusStyle(item.status)]}>
          <Text style={styles.statusBadgeText}>{item.status?.toUpperCase() || "PENDING"}</Text>
        </View>
      </View>

      <View style={styles.customerRow}>
        <Truck size={13} color={COLORS.textSecondary} />
        <Text style={styles.customerName}>Courier: {item.courierName || "Unassigned"}</Text>
        {item.trackingNumber ? (
          <Text style={styles.customerPhone}>• {item.trackingNumber}</Text>
        ) : null}
      </View>

      <View style={styles.actionFooter}>
        <TouchableOpacity
          style={styles.assignBtn}
          onPress={() => handleOpenAssign(item)}
          activeOpacity={0.85}
        >
          <Navigation size={13} color="#052A51" />
          <Text style={styles.assignBtnText}>Assign Courier / Tracking</Text>
        </TouchableOpacity>

        {item.paymentMethod === "cod" && item.codStatus !== "collected" && (
          <TouchableOpacity
            style={styles.codBtn}
            onPress={() => handleConfirmCod(item.id)}
            activeOpacity={0.85}
          >
            <DollarSign size={13} color="#16A34A" />
            <Text style={styles.codBtnText}>Confirm COD</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Orders & Logistics Hub</Text>
          <Text style={styles.headerSubtitle}>
            {orders.length} total orders • {splits.length} vendor delivery splits
          </Text>
        </View>
      </View>

      {/* Segment Switcher */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeSection === "orders" && styles.segmentBtnActive]}
          onPress={() => setActiveSection("orders")}
        >
          <ShoppingCart size={15} color={activeSection === "orders" ? "#052A51" : "#64748B"} />
          <Text style={[styles.segmentBtnText, activeSection === "orders" && styles.segmentBtnTextActive]}>
            Orders ({orders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeSection === "deliveries" && styles.segmentBtnActive]}
          onPress={() => setActiveSection("deliveries")}
        >
          <Truck size={15} color={activeSection === "deliveries" ? "#052A51" : "#64748B"} />
          <Text style={[styles.segmentBtnText, activeSection === "deliveries" && styles.segmentBtnTextActive]}>
            Splits ({splits.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeSection === "shipping" && styles.segmentBtnActive]}
          onPress={() => setActiveSection("shipping")}
        >
          <Sliders size={15} color={activeSection === "shipping" ? "#052A51" : "#64748B"} />
          <Text style={[styles.segmentBtnText, activeSection === "shipping" && styles.segmentBtnTextActive]}>
            Shipping Rates
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Section Content */}
      {activeSection === "orders" ? (
        <>
          <View style={styles.filterSection}>
            {isSelectMode ? (
              <View style={styles.batchHeaderBar}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <TouchableOpacity onPress={handleSelectAllOrders} style={styles.selectAllBtn}>
                    <CheckSquare2 size={16} color="#FFFFFF" />
                    <Text style={styles.selectAllBtnText}>
                      {selectedOrderIds.length === orders.length ? "Deselect All" : "Select All"}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.batchCountText}>Selected ({selectedOrderIds.length})</Text>
                </View>

                <TouchableOpacity onPress={handleCancelSelectMode} style={styles.cancelBatchBtn}>
                  <X size={16} color="#64748B" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.searchBar}>
                <Search size={16} color={COLORS.textTertiary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search orders by ID, customer name, phone..."
                  placeholderTextColor={COLORS.textTertiary}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
            )}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {["all", "pending", "confirmed", "dispatched", "delivered", "cancelled"].map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.filterChip, statusFilter === st && styles.filterChipActive]}
                  onPress={() => setStatusFilter(st)}
                >
                  <Text style={[styles.filterChipText, statusFilter === st && styles.filterChipTextActive]}>
                    {st === "all" ? "All Orders" : st.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {ordersLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={COLORS.accentBlue} />
            </View>
          ) : (
            <FlatList
              data={orders}
              keyExtractor={(item) => item.id}
              renderItem={renderOrderItem}
              contentContainerStyle={styles.listContent}
              refreshControl={<RefreshControl refreshing={ordersRefetching} onRefresh={refetchOrders} tintColor={COLORS.accentBlue} />}
            />
          )}

          {/* Floating Bottom Batch Action Bar for Orders */}
          {isSelectMode && selectedOrderIds.length > 0 && (
            <View style={styles.floatingBatchBar}>
              <TouchableOpacity
                style={styles.batchActionBtnDispatch}
                onPress={() => handleBulkUpdateOrderStatus("dispatched")}
                disabled={bulkProcessing}
              >
                <Truck size={15} color="#2563EB" />
                <Text style={[styles.batchActionBtnText, { color: "#2563EB" }]}>Dispatch ({selectedOrderIds.length})</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.batchActionBtnDelivered}
                onPress={() => handleBulkUpdateOrderStatus("delivered")}
                disabled={bulkProcessing}
              >
                <CheckCircle2 size={15} color="#16A34A" />
                <Text style={[styles.batchActionBtnText, { color: "#16A34A" }]}>Deliver ({selectedOrderIds.length})</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.batchActionBtnDelete}
                onPress={handleBulkDeleteOrders}
                disabled={bulkProcessing}
              >
                <Trash2 size={15} color="#FFFFFF" />
                <Text style={[styles.batchActionBtnText, { color: "#FFFFFF" }]}>Trash ({selectedOrderIds.length})</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : activeSection === "deliveries" ? (
        deliveriesLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.accentBlue} />
          </View>
        ) : (
          <FlatList
            data={splits}
            keyExtractor={(item) => item.id}
            renderItem={renderDeliverySplitItem}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={deliveriesRefetching} onRefresh={refetchDeliveries} tintColor={COLORS.accentBlue} />}
          />
        )
      ) : (
        <ScrollView contentContainerStyle={styles.shippingContent} keyboardShouldPersistTaps="handled">
          <View style={styles.shippingCard}>
            <View style={styles.cardHeaderRow}>
              <Truck size={18} color="#052A51" />
              <Text style={styles.shippingCardTitle}>Tiered Delivery Fees Engine</Text>
            </View>
            <Text style={styles.shippingCardSub}>
              Configure real-time calculation rules for platform deliveries, two-wheelers, and four-wheeler trucks.
            </Text>

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Free Delivery Order Threshold (₹)</Text>
            <TextInput
              style={styles.inputBox}
              value={freeThreshold}
              onChangeText={setFreeThreshold}
              keyboardType="decimal-pad"
              placeholder="5000"
            />

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Standard Delivery Fee (₹)</Text>
            <TextInput
              style={styles.inputBox}
              value={standardFee}
              onChangeText={setStandardFee}
              keyboardType="decimal-pad"
              placeholder="149"
            />

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Bike Base (₹)</Text>
                <TextInput
                  style={styles.inputBox}
                  value={bikeRate}
                  onChangeText={setBikeRate}
                  keyboardType="decimal-pad"
                  placeholder="49"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>4-Wheeler Base (₹)</Text>
                <TextInput
                  style={styles.inputBox}
                  value={fourWheelerRate}
                  onChangeText={setFourWheelerRate}
                  keyboardType="decimal-pad"
                  placeholder="299"
                />
              </View>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Weight Threshold for Heavy Vehicle (Kg)</Text>
            <TextInput
              style={styles.inputBox}
              value={weightThreshold}
              onChangeText={setWeightThreshold}
              keyboardType="decimal-pad"
              placeholder="25"
            />

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Blocked Service Pincodes (Comma separated)</Text>
            <TextInput
              style={styles.inputBox}
              value={blockedPincodes}
              onChangeText={setBlockedPincodes}
              placeholder="e.g. 110001, 110002"
            />

            <TouchableOpacity
              style={styles.saveRatesBtn}
              onPress={handleSaveShippingRates}
              disabled={savingRates}
            >
              {savingRates ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveRatesBtnText}>Update Shipping Rates</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* 1. ORDER AUDIT MODAL */}
      <Modal visible={orderModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.orderModalBox}>
            <View style={styles.orderModalHeader}>
              <View>
                <Text style={styles.orderModalTitle}>
                  Order #{selectedOrder?.orderNumber || selectedOrder?.id?.slice(-8).toUpperCase()}
                </Text>
                <Text style={styles.orderModalSub}>
                  Placed on: {selectedOrder?.createdAt ? new Date(selectedOrder.createdAt).toLocaleString("en-IN") : ""}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setOrderModalOpen(false)} style={styles.closeBtn}>
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView style={{ maxHeight: 480 }} contentContainerStyle={{ gap: 12, paddingVertical: 10 }}>
                {/* Status & Amount Highlight */}
                <View style={styles.orderHighlightCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.highlightLabel}>Total Order Amount</Text>
                    <Text style={styles.highlightAmount}>₹{(selectedOrder.total || 0).toLocaleString("en-IN")}</Text>
                  </View>
                  <View style={styles.orderStatusBadge}>
                    <Text style={styles.orderStatusBadgeText}>{selectedOrder.orderStatus?.toUpperCase()}</Text>
                  </View>
                </View>

                {/* Customer Profile & Delivery Location */}
                <View style={styles.auditSectionBox}>
                  <View style={styles.auditSectionHeader}>
                    <User size={15} color="#2563EB" />
                    <Text style={styles.auditSectionTitle}>Customer Profile & Site Location</Text>
                  </View>

                  <View style={styles.auditDetailRow}>
                    <Text style={styles.auditLabel}>Customer Name:</Text>
                    <Text style={styles.auditVal}>{selectedOrder.customerName || "Customer"}</Text>
                  </View>

                  <View style={styles.auditDetailRow}>
                    <Text style={styles.auditLabel}>Contact Phone:</Text>
                    <Text style={[styles.auditVal, { color: "#2563EB", fontWeight: "800" }]}>
                      +91 {selectedOrder.customerPhone || "N/A"}
                    </Text>
                  </View>

                  {selectedOrder.customerEmail ? (
                    <View style={styles.auditDetailRow}>
                      <Text style={styles.auditLabel}>Email Address:</Text>
                      <Text style={styles.auditVal}>{selectedOrder.customerEmail}</Text>
                    </View>
                  ) : null}

                  <View style={[styles.auditDetailRow, { alignItems: "flex-start" }]}>
                    <Text style={[styles.auditLabel, { marginTop: 2 }]}>Delivery Address:</Text>
                    <Text style={[styles.auditVal, { flex: 1, textAlign: "right" }]}>
                      {selectedOrder.customerAddress || selectedOrder.deliveryCity || "Site Address"}
                    </Text>
                  </View>
                </View>

                {/* Allocated Vendors */}
                <View style={styles.auditSectionBox}>
                  <View style={styles.auditSectionHeader}>
                    <Store size={15} color="#16A34A" />
                    <Text style={styles.auditSectionTitle}>
                      Vendor Partner Allocation ({selectedOrder.vendors?.length || 1})
                    </Text>
                  </View>

                  {selectedOrder.vendors?.map((v: any, idx: number) => (
                    <View key={idx} style={styles.vendorAllocCard}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={styles.allocVendorName}>{v.businessName}</Text>
                        <Text style={styles.allocVendorCat}>{v.category}</Text>
                      </View>
                      <Text style={styles.allocVendorPhone}>Phone: +91 {v.contactPhone || "Direct"}</Text>
                      <View style={styles.allocFinanceRow}>
                        <Text style={styles.allocFinanceText}>
                          Subtotal: <Text style={{ fontWeight: "800", color: "#052A51" }}>₹{(v.subtotal || 0).toLocaleString("en-IN")}</Text>
                        </Text>
                        <Text style={styles.allocFinanceText}>
                          Payout: <Text style={{ fontWeight: "800", color: "#16A34A" }}>₹{(v.vendorPayoutAmount || v.subtotal || 0).toLocaleString("en-IN")}</Text>
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Ordered Items with Image */}
                <View style={styles.auditSectionBox}>
                  <View style={styles.auditSectionHeader}>
                    <Package size={15} color="#D97706" />
                    <Text style={styles.auditSectionTitle}>
                      Ordered Products ({selectedOrder.items?.length || 0})
                    </Text>
                  </View>

                  {selectedOrder.items?.map((it: any) => (
                    <View key={it.id} style={styles.orderItemRow}>
                      <Image
                        source={it.image ? { uri: it.image } : require("../../assets/intri-icon.png")}
                        style={styles.itemThumb}
                        contentFit="cover"
                      />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.itemTitleText}>{it.productName}</Text>
                        <Text style={styles.itemVariantText}>{it.variantDetails}</Text>
                        <Text style={styles.itemVendorText}>Seller: {it.vendorName}</Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.itemQtyText}>x {it.boxQuantity}</Text>
                        <Text style={styles.itemPriceText}>₹{(it.totalPrice || 0).toLocaleString("en-IN")}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.closeOrderModalBtn}
              onPress={() => setOrderModalOpen(false)}
            >
              <Text style={styles.closeOrderModalBtnText}>Close Order Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 2. COURIER ASSIGNMENT MODAL */}
      <Modal visible={assignModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Assign Delivery Partner</Text>
              <Text style={styles.modalSubtitle}>Dispatch vendor parcel via courier or bike rider</Text>
            </View>
            <TouchableOpacity onPress={() => setAssignModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalCard}>
              <Text style={styles.inputLabel}>Courier Company / Rider Name</Text>
              <TextInput
                style={styles.inputBox}
                value={courierName}
                onChangeText={setCourierName}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Rider Contact Phone (10 Digits)</Text>
              <TextInput
                style={styles.inputBox}
                value={courierPhone}
                onChangeText={setCourierPhone}
                keyboardType="phone-pad"
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Tracking AWB / Tracking ID</Text>
              <TextInput
                style={styles.inputBox}
                value={trackingNumber}
                onChangeText={setTrackingNumber}
              />
            </View>

            <TouchableOpacity
              style={styles.saveAssignBtn}
              onPress={handleSaveAssign}
              disabled={savingAssign}
            >
              {savingAssign ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Navigation size={18} color="#FFFFFF" />
                  <Text style={styles.saveAssignBtnText}>Confirm Courier Assignment</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function getOrderStatusStyle(status?: string) {
  switch (status) {
    case "delivered":
      return { backgroundColor: "rgba(22, 163, 74, 0.15)" };
    case "processing":
    case "dispatched":
      return { backgroundColor: "rgba(37, 99, 235, 0.15)" };
    case "pending":
      return { backgroundColor: "rgba(245, 158, 11, 0.15)" };
    case "cancelled":
      return { backgroundColor: "rgba(239, 68, 68, 0.15)" };
    default:
      return { backgroundColor: "rgba(148, 163, 184, 0.15)" };
  }
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.textWhite,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
  },
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
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
  filterSection: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 40,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
  },
  chipsScroll: {
    marginTop: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.accentBlue,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: "#fff",
  },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.md,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderId: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  vendorName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.text,
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.sm,
    gap: 6,
  },
  customerName: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
  },
  customerPhone: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  addressPreviewText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
  },
  metricDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.textTertiary,
    textTransform: "uppercase",
  },
  metricVal: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 2,
  },
  actionFooter: {
    flexDirection: "row",
    gap: 8,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  assignBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    gap: 6,
  },
  assignBtnText: {
    color: "#052A51",
    fontSize: 11,
    fontWeight: "800",
  },
  codBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  codBtnText: {
    color: "#16A34A",
    fontSize: 11,
    fontWeight: "800",
  },
  shippingContent: {
    padding: SPACING.md,
  },
  shippingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  shippingCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  shippingCardSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  inputBox: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 44,
    fontSize: 13,
    color: COLORS.text,
  },
  twoCol: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  saveRatesBtn: {
    backgroundColor: "#052A51",
    height: 46,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  saveRatesBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
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
  modalSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
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
    borderColor: COLORS.border,
  },
  saveAssignBtn: {
    backgroundColor: "#052A51",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 12,
    gap: 8,
  },
  saveAssignBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  orderModalBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    width: "100%",
    maxWidth: 440,
    ...SHADOWS.md,
  },
  orderModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 10,
  },
  orderModalTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#052A51",
  },
  orderModalSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  orderHighlightCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  highlightLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1E40AF",
  },
  highlightAmount: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1D4ED8",
    marginTop: 2,
  },
  orderStatusBadge: {
    backgroundColor: "#16A34A",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  orderStatusBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  auditSectionBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6,
  },
  auditSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 6,
    marginBottom: 4,
  },
  auditSectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#052A51",
  },
  auditDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
  },
  auditLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  auditVal: {
    fontSize: 11,
    fontWeight: "700",
    color: "#052A51",
  },
  vendorAllocCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 2,
    marginBottom: 4,
  },
  allocVendorName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#052A51",
  },
  allocVendorCat: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "700",
  },
  allocVendorPhone: {
    fontSize: 11,
    color: "#64748B",
  },
  allocFinanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  allocFinanceText: {
    fontSize: 11,
    color: "#64748B",
  },
  orderItemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 4,
  },
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
  },
  itemTitleText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#052A51",
  },
  itemVariantText: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 1,
  },
  itemVendorText: {
    fontSize: 10,
    color: "#2563EB",
    fontWeight: "700",
    marginTop: 1,
  },
  itemQtyText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "700",
  },
  itemPriceText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#052A51",
    marginTop: 2,
  },
  closeOrderModalBtn: {
    backgroundColor: "#052A51",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  closeOrderModalBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  batchHeaderBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 44,
  },
  selectAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#052A51",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  selectAllBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  batchCountText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1E40AF",
  },
  cancelBatchBtn: {
    padding: 6,
  },
  floatingBatchBar: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "#052A51",
    borderRadius: 16,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...SHADOWS.md,
    gap: 8,
  },
  batchActionBtnDispatch: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  batchActionBtnDelivered: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  batchActionBtnDelete: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  batchActionBtnText: {
    fontSize: 11,
    fontWeight: "800",
  },
});
