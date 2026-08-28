import { useState } from "react";
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
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Search, ShieldCheck, UserCheck, Shield } from "lucide-react-native";
import { fetchAdminUsers, updateAdminUserRole } from "../../src/api/admin";
import { User } from "../../src/types";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";

export default function AdminUsersScreen() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["admin-users", search, roleFilter],
    queryFn: () =>
      fetchAdminUsers({
        search: search.trim() || undefined,
        role: roleFilter === "all" ? undefined : roleFilter,
      }),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      updateAdminUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      Alert.alert("Success", "User role updated");
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to update role");
    },
  });

  const users = data?.users || [];

  const handleRoleChange = (userId: string, name: string, currentRole: string) => {
    Alert.alert(
      "Change User Role",
      `Select new role for ${name || "User"}:`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Make Vendor",
          onPress: () => roleMutation.mutate({ userId, role: "vendor" }),
        },
        {
          text: "Make Admin",
          onPress: () => roleMutation.mutate({ userId, role: "admin" }),
        },
        {
          text: "Make Customer",
          onPress: () => roleMutation.mutate({ userId, role: "customer" }),
        },
      ]
    );
  };

  const renderUserItem = ({ item }: { item: User }) => {
    return (
      <View style={styles.userCard}>
        <View style={styles.userTop}>
          <View>
            <Text style={styles.userName}>{item.name || "IntriHub User"}</Text>
            <Text style={styles.userEmail}>{item.email || "No Email"}</Text>
            {item.phone ? (
              <Text style={styles.userPhone}>+91 {item.phone}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.roleBadge, getRoleStyle(item.role)]}
            onPress={() => handleRoleChange(item.id, item.name || "", item.role)}
          >
            <Text style={styles.roleBadgeText}>{item.role.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Accounts</Text>
        <Text style={styles.headerSubtitle}>{users.length} registered platform accounts</Text>
      </View>

      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users by name, email or phone..."
            placeholderTextColor={COLORS.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.tabsRow}>
          {["all", "customer", "vendor", "admin"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabChip, roleFilter === tab && styles.tabChipActive]}
              onPress={() => setRoleFilter(tab)}
            >
              <Text
                style={[
                  styles.tabChipText,
                  roleFilter === tab && styles.tabChipTextActive,
                ]}
              >
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.accentBlue} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.accentBlue} />}
        />
      )}
    </View>
  );
}

function getRoleStyle(role?: string) {
  switch (role) {
    case "admin":
    case "superadmin":
      return { backgroundColor: "rgba(124, 58, 237, 0.15)" };
    case "vendor":
      return { backgroundColor: "rgba(234, 88, 12, 0.15)" };
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
  filterSection: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.text,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 6,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSecondary,
  },
  tabChipActive: {
    backgroundColor: COLORS.primary,
  },
  tabChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  tabChipTextActive: {
    color: "#fff",
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  userTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userName: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  userPhone: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 1,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.text,
  },
});
