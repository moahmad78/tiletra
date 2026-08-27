import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  HelpCircle,
  Building,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";
import { fetchVendorEarnings } from "../../src/api/vendor";
import { formatCurrency, formatDate } from "../../src/utils/formatters";

export default function VendorEarningsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["vendor-earnings"],
    queryFn: fetchVendorEarnings,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading earnings ledger...</Text>
      </SafeAreaView>
    );
  }

  const earnings = data?.earnings;
  const totalEarnings = earnings?.totalEarnings || 0;
  const pendingSettlement = earnings?.readyForPayoutAmount || 0;
  const inProgressPayout = earnings?.inProgressEstimatedPayout || 0;
  const payoutHistory = earnings?.payoutHistory || [];
  const trend = earnings?.trend || [];

  // Find max amount in trend for chart scaling
  const maxTrendAmount = Math.max(...trend.map((t) => t.amount), 1000);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings & Payouts</Text>
        <Text style={styles.headerSubtitle}>
          Weekly direct bank settlements and revenue metrics
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Primary Summary Cards */}
        <View style={styles.summaryCardPrimary}>
          <View style={styles.summaryPrimaryTop}>
            <View>
              <Text style={styles.summaryPrimaryLabel}>Total Lifetime Earnings</Text>
              <Text style={styles.summaryPrimaryValue}>{formatCurrency(totalEarnings)}</Text>
            </View>
            <View style={styles.primaryWalletIcon}>
              <Wallet size={24} color={COLORS.textWhite} />
            </View>
          </View>

          <View style={styles.summaryPrimaryDivider} />

          <View style={styles.settlementCycleRow}>
            <Clock size={13} color="rgba(255, 255, 255, 0.75)" />
            <Text style={styles.settlementCycleText}>
              Payouts automatically settled every Monday to your registered bank account.
            </Text>
          </View>
        </View>

        {/* 2-Column Sub Cards: Pending & In-Progress */}
        <View style={styles.subCardsRow}>
          {/* Ready for Next Payout */}
          <View style={[styles.subCard, styles.subCardPending]}>
            <View style={styles.subCardIconWrapperGreen}>
              <CheckCircle2 size={16} color={COLORS.accentGreen} />
            </View>
            <Text style={styles.subCardLabel}>Pending Settlement</Text>
            <Text style={styles.subCardValueGreen}>{formatCurrency(pendingSettlement)}</Text>
            <Text style={styles.subCardSubText}>
              {earnings?.unsettledSplitsCount || 0} delivered orders ready
            </Text>
          </View>

          {/* In-Progress Orders Pipeline */}
          <View style={[styles.subCard, styles.subCardPipeline]}>
            <View style={styles.subCardIconWrapperOrange}>
              <TrendingUp size={16} color={COLORS.accentOrange} />
            </View>
            <Text style={styles.subCardLabel}>In-Progress Pipeline</Text>
            <Text style={styles.subCardValueOrange}>{formatCurrency(inProgressPayout)}</Text>
            <Text style={styles.subCardSubText}>
              {earnings?.inProgressCount || 0} active orders
            </Text>
          </View>
        </View>

        {/* Visual Revenue Trend Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>7-Day Earnings Trend</Text>
              <Text style={styles.chartSubtitle}>Daily earnings from fulfilled orders</Text>
            </View>
            <TrendingUp size={18} color={COLORS.accentGreen} />
          </View>

          {/* Chart Display Pattern */}
          <View style={styles.chartContainer}>
            {trend.map((item, index) => {
              const heightPercent = Math.max(Math.min((item.amount / maxTrendAmount) * 100, 100), 8);
              const isSelected = selectedBarIndex === index;

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.chartBarWrapper}
                  onPress={() => setSelectedBarIndex(isSelected ? null : index)}
                  activeOpacity={0.8}
                >
                  {/* Tooltip on Active Bar */}
                  {isSelected && (
                    <View style={styles.barTooltip}>
                      <Text style={styles.barTooltipText}>{formatCurrency(item.amount)}</Text>
                    </View>
                  )}

                  {/* Bar Background Track */}
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${heightPercent}%` },
                        isSelected && styles.barFillSelected,
                      ]}
                    />
                  </View>

                  {/* Day Label */}
                  <Text style={[styles.chartDayLabel, isSelected && styles.chartDayLabelSelected]}>
                    {item.label.split(" ")[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Payout History Ledger */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payout Settlements History</Text>
        </View>

        {payoutHistory.length === 0 ? (
          <View style={styles.emptyHistoryCard}>
            <Building size={36} color={COLORS.textMuted} />
            <Text style={styles.emptyHistoryTitle}>No Payout Batches Yet</Text>
            <Text style={styles.emptyHistorySub}>
              Once customer orders are delivered and verified, your weekly settlement batches will be listed here with transaction references.
            </Text>
          </View>
        ) : (
          payoutHistory.map((payout) => {
            const isCompleted = payout.status === "completed";
            const isPending = payout.status === "pending";

            return (
              <View key={payout.id} style={styles.payoutCard}>
                <View style={styles.payoutCardLeft}>
                  <Text style={styles.payoutAmountText}>{formatCurrency(payout.amount)}</Text>
                  <View style={styles.payoutDateRow}>
                    <Calendar size={12} color={COLORS.textMuted} />
                    <Text style={styles.payoutDateText}>{formatDate(payout.paidAt)}</Text>
                  </View>
                  <Text style={styles.payoutRefText}>Ref: {payout.paymentReference}</Text>
                </View>

                <View
                  style={[
                    styles.payoutStatusBadge,
                    isCompleted
                      ? styles.payoutBadgeCompleted
                      : isPending
                      ? styles.payoutBadgePending
                      : styles.payoutBadgeFailed,
                  ]}
                >
                  <Text
                    style={[
                      styles.payoutStatusText,
                      isCompleted
                        ? styles.payoutStatusTextCompleted
                        : isPending
                        ? styles.payoutStatusTextPending
                        : styles.payoutStatusTextFailed,
                    ]}
                  >
                    {isCompleted ? "PAID" : isPending ? "PROCESSING" : "HELD"}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  summaryCardPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  summaryPrimaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryPrimaryLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.75)",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  summaryPrimaryValue: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.textWhite,
    marginTop: 4,
  },
  primaryWalletIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryPrimaryDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginVertical: 12,
  },
  settlementCycleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  settlementCycleText: {
    flex: 1,
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 15,
  },
  subCardsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: SPACING.md,
  },
  subCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  subCardPending: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  subCardPipeline: {
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
  },
  subCardIconWrapperGreen: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  subCardIconWrapperOrange: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: "#ffedd5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  subCardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  subCardValueGreen: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.accentGreen,
    marginTop: 2,
  },
  subCardValueOrange: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.accentOrange,
    marginTop: 2,
  },
  subCardSubText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
    fontWeight: "500",
  },
  chartCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },
  chartSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 140,
    paddingTop: 24,
  },
  chartBarWrapper: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
    position: "relative",
  },
  barTooltip: {
    position: "absolute",
    top: -24,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    zIndex: 10,
  },
  barTooltipText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textWhite,
  },
  barTrack: {
    width: 14,
    height: "85%",
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.sm,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  barFill: {
    width: "100%",
    backgroundColor: COLORS.accentGreen,
    borderRadius: RADIUS.sm,
  },
  barFillSelected: {
    backgroundColor: COLORS.accentOrange,
  },
  chartDayLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 6,
    fontWeight: "600",
  },
  chartDayLabelSelected: {
    color: COLORS.text,
    fontWeight: "800",
  },
  sectionHeader: {
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  emptyHistoryCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyHistoryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 10,
  },
  emptyHistorySub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 16,
  },
  payoutCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...SHADOWS.sm,
  },
  payoutCardLeft: {
    flex: 1,
  },
  payoutAmountText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  payoutDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  payoutDateText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  payoutRefText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  payoutStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  payoutBadgeCompleted: {
    backgroundColor: "#f0fdf4",
  },
  payoutBadgePending: {
    backgroundColor: "#fef3c7",
  },
  payoutBadgeFailed: {
    backgroundColor: "#fee2e2",
  },
  payoutStatusText: {
    fontSize: 10,
    fontWeight: "800",
  },
  payoutStatusTextCompleted: {
    color: COLORS.accentGreen,
  },
  payoutStatusTextPending: {
    color: "#b45309",
  },
  payoutStatusTextFailed: {
    color: COLORS.accentRed,
  },
});
