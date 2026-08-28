import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import {
  IndianRupee,
  Building,
  CheckCircle2,
  Clock,
  TrendingUp,
  CreditCard,
} from "lucide-react-native";
import { fetchVendorEarnings } from "../../src/api/vendor";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";

export default function VendorEarningsScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["vendor-earnings"],
    queryFn: fetchVendorEarnings,
  });

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.accentOrange} />
      </View>
    );
  }

  const summary = data?.earnings?.summary;
  const vendor = data?.earnings?.vendor;
  const payouts = data?.earnings?.payouts || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings & Payouts</Text>
        <Text style={styles.headerSubtitle}>Direct bank settlements & financial overview</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.accentOrange} />}
      >
        {/* Highlight Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceSubtitle}>Available Settlement Balance</Text>
          <Text style={styles.balanceAmount}>
            ₹{(summary?.pendingPayoutAmount || 0).toLocaleString("en-IN")}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Total Settled</Text>
              <Text style={styles.statVal}>
                ₹{(summary?.completedPayoutAmount || 0).toLocaleString("en-IN")}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Platform Commission</Text>
              <Text style={styles.statVal}>{vendor?.commissionRate || 10}%</Text>
            </View>
          </View>
        </View>

        {/* Bank Account Details */}
        <View style={styles.bankCard}>
          <View style={styles.bankHeader}>
            <Building size={18} color={COLORS.primary} />
            <Text style={styles.bankTitle}>Settlement Bank Account</Text>
          </View>

          <View style={styles.bankRow}>
            <Text style={styles.bankKey}>Account Holder:</Text>
            <Text style={styles.bankVal}>{vendor?.bankAccountName || vendor?.businessName || "Registered Vendor"}</Text>
          </View>
          <View style={styles.bankRow}>
            <Text style={styles.bankKey}>Account Number:</Text>
            <Text style={styles.bankVal}>{vendor?.bankAccountNumber ? `•••• •••• ${vendor.bankAccountNumber.slice(-4)}` : "Verified via Admin"}</Text>
          </View>
          <View style={styles.bankRow}>
            <Text style={styles.bankKey}>IFSC Code:</Text>
            <Text style={styles.bankVal}>{vendor?.bankIfsc || "Verified"}</Text>
          </View>
        </View>

        {/* Payout History Ledger */}
        <Text style={styles.sectionHeading}>Payout History</Text>

        {payouts.length === 0 ? (
          <View style={styles.emptyCard}>
            <CreditCard size={40} color={COLORS.textTertiary} />
            <Text style={styles.emptyTitle}>No past payouts yet</Text>
            <Text style={styles.emptySubtitle}>
              Payouts are automatically credited to your bank account weekly following order delivery.
            </Text>
          </View>
        ) : (
          payouts.map((p) => (
            <View key={p.id} style={styles.payoutItem}>
              <View>
                <Text style={styles.payoutItemTitle}>Order #{p.orderId}</Text>
                <Text style={styles.payoutItemDate}>
                  {new Date(p.createdAt).toLocaleDateString("en-IN")}
                </Text>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.payoutItemAmount}>
                  +₹{p.vendorPayoutAmount?.toLocaleString("en-IN")}
                </Text>
                <View style={[styles.statusBadge, p.payoutStatus === "paid" ? styles.paidBadge : styles.pendingBadge]}>
                  <Text style={styles.statusBadgeText}>{p.payoutStatus.toUpperCase()}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
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
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  balanceSubtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.textWhite,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.7)",
  },
  statVal: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: SPACING.md,
  },
  bankCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  bankHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: 6,
  },
  bankTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
  },
  bankRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  bankKey: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  bankVal: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  payoutItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  payoutItemTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },
  payoutItemDate: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  payoutItemAmount: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.accentGreen,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    marginTop: 2,
  },
  paidBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  pendingBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.textSecondary,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
});
