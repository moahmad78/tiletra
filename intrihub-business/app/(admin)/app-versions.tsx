import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Save,
  Smartphone,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  Info,
  Layers,
  Sparkles,
  RefreshCw,
} from "lucide-react-native";
import {
  fetchAdminAppConfig,
  updateAdminAppConfig,
  AppVersionSettingsResponse,
  AppTargetConfig,
} from "../../src/api/admin";
import { COLORS, SPACING, RADIUS } from "../../src/constants/theme";

export default function AdminAppVersionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Selected Target
  const [selectedApp, setSelectedApp] = useState<"customer" | "business">("customer");
  const [selectedPlatform, setSelectedPlatform] = useState<"android" | "ios">("android");

  // Full configuration from backend
  const [fullConfig, setFullConfig] = useState<AppVersionSettingsResponse | null>(null);

  // Active form fields
  const [latestVersion, setLatestVersion] = useState("");
  const [latestVersionCode, setLatestVersionCode] = useState("");
  const [minSupportedVersion, setMinSupportedVersion] = useState("");
  const [minSupportedVersionCode, setMinSupportedVersionCode] = useState("");
  const [forceUpdate, setForceUpdate] = useState(false);
  const [storeUrl, setStoreUrl] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [releaseNotesText, setReleaseNotesText] = useState("");

  const loadTargetIntoForm = useCallback(
    (config: AppVersionSettingsResponse, app: "customer" | "business", plat: "android" | "ios") => {
      const target: AppTargetConfig | undefined = config[app]?.[plat];
      if (target) {
        setLatestVersion(target.latestVersion || "");
        setLatestVersionCode(
          target.latestVersionCode !== undefined && target.latestVersionCode !== null
            ? String(target.latestVersionCode)
            : ""
        );
        setMinSupportedVersion(target.minSupportedVersion || "");
        setMinSupportedVersionCode(
          target.minSupportedVersionCode !== undefined && target.minSupportedVersionCode !== null
            ? String(target.minSupportedVersionCode)
            : ""
        );
        setForceUpdate(Boolean(target.forceUpdate));
        setStoreUrl(target.storeUrl || "");
        setTitle(target.title || "");
        setMessage(target.message || "");
        setReleaseNotesText(Array.isArray(target.releaseNotes) ? target.releaseNotes.join("\n") : "");
      }
    },
    []
  );

  const loadData = useCallback(async () => {
    try {
      const res = await fetchAdminAppConfig();
      if (res.success && res.config) {
        setFullConfig(res.config);
        loadTargetIntoForm(res.config, selectedApp, selectedPlatform);
      } else {
        Alert.alert("Error", res.error || "Failed to load app configuration.");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to connect to server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadTargetIntoForm, selectedApp, selectedPlatform]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // When tab or platform switches, populate form from fullConfig
  const handleSelectApp = (app: "customer" | "business") => {
    setSelectedApp(app);
    if (fullConfig) {
      loadTargetIntoForm(fullConfig, app, selectedPlatform);
    }
  };

  const handleSelectPlatform = (plat: "android" | "ios") => {
    setSelectedPlatform(plat);
    if (fullConfig) {
      loadTargetIntoForm(fullConfig, selectedApp, plat);
    }
  };

  const handleSave = async () => {
    const trimmedLatest = latestVersion.trim();
    if (!trimmedLatest || !/^\d+(\.\d+){1,2}$/.test(trimmedLatest)) {
      Alert.alert("Invalid Semver", "Latest Version must be in format X.Y.Z (e.g. 1.2.17)");
      return;
    }

    const parsedCode = latestVersionCode.trim() ? parseInt(latestVersionCode.trim(), 10) : undefined;
    if (parsedCode !== undefined && (isNaN(parsedCode) || parsedCode <= 0)) {
      Alert.alert("Invalid Version Code", "Version Code must be a positive integer (e.g. 36)");
      return;
    }

    const trimmedMin = minSupportedVersion.trim();
    if (trimmedMin && !/^\d+(\.\d+){1,2}$/.test(trimmedMin)) {
      Alert.alert("Invalid Semver", "Min Supported Version must be in format X.Y.Z (e.g. 1.2.0)");
      return;
    }

    const parsedMinCode = minSupportedVersionCode.trim()
      ? parseInt(minSupportedVersionCode.trim(), 10)
      : undefined;
    if (parsedMinCode !== undefined && (isNaN(parsedMinCode) || parsedMinCode <= 0)) {
      Alert.alert("Invalid Min Version Code", "Min Version Code must be a positive integer (e.g. 30)");
      return;
    }

    setSaving(true);
    try {
      const notesArray = releaseNotesText
        .split("\n")
        .map((l) => l.trim().replace(/^[-•*]\s*/, ""))
        .filter(Boolean);

      const targetPayload: Partial<AppTargetConfig> = {
        latestVersion: trimmedLatest,
        latestVersionCode: parsedCode,
        minSupportedVersion: trimmedMin || trimmedLatest,
        minSupportedVersionCode: parsedMinCode,
        forceUpdate,
        storeUrl: storeUrl.trim(),
        title: title.trim(),
        message: message.trim(),
        releaseNotes: notesArray,
      };

      const res = await updateAdminAppConfig({
        app: selectedApp,
        platform: selectedPlatform,
        config: targetPayload,
      });

      if (res.success && res.config) {
        setFullConfig(res.config);
        loadTargetIntoForm(res.config, selectedApp, selectedPlatform);
        Alert.alert(
          "Update Published! 🎉",
          `${selectedApp === "customer" ? "Customer App" : "Business App"} (${selectedPlatform}) version set to ${trimmedLatest} (code ${parsedCode ?? "N/A"}). Live users below this version will now receive the update prompt.`
        );
      } else {
        Alert.alert("Save Failed", res.error || "Could not update app configuration.");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#052A51" />
        <Text style={styles.loadingText}>Loading App Version Policies...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>App Versions & Releases</Text>
          <Text style={styles.headerSub}>Manage live Play Store & In-App prompts</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => {
            setRefreshing(true);
            loadData();
          }}
        >
          <RefreshCw size={18} color="#052A51" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
          />
        }
      >
        {/* Release Instructions Pill Banner */}
        <View style={styles.instructionsBanner}>
          <Info size={18} color="#0284C7" style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.instructionsTitle}>How to release an update</Text>
            <Text style={styles.instructionsBody}>
              1. Build & submit release to Google Play Console.{"\n"}
              2. When Play Store approves & makes it <Text style={{ fontWeight: "700" }}>Live</Text>, enter the new version & versionCode below.{"\n"}
              3. Tap <Text style={{ fontWeight: "700" }}>Save Policy</Text>. Users with older versions will see the in-app update prompt automatically!
            </Text>
          </View>
        </View>

        {/* App Selector Segmented Tabs */}
        <View style={styles.segmentedContainer}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              selectedApp === "customer" && styles.segmentBtnActive,
            ]}
            onPress={() => handleSelectApp("customer")}
          >
            <Smartphone
              size={18}
              color={selectedApp === "customer" ? "#FFFFFF" : "#64748B"}
            />
            <Text
              style={[
                styles.segmentText,
                selectedApp === "customer" && styles.segmentTextActive,
              ]}
            >
              Customer App
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              selectedApp === "business" && styles.segmentBtnActive,
            ]}
            onPress={() => handleSelectApp("business")}
          >
            <Layers
              size={18}
              color={selectedApp === "business" ? "#FFFFFF" : "#64748B"}
            />
            <Text
              style={[
                styles.segmentText,
                selectedApp === "business" && styles.segmentTextActive,
              ]}
            >
              Business App
            </Text>
          </TouchableOpacity>
        </View>

        {/* Platform Selector */}
        <View style={styles.platformRow}>
          <TouchableOpacity
            style={[
              styles.platformChip,
              selectedPlatform === "android" && styles.platformChipActive,
            ]}
            onPress={() => handleSelectPlatform("android")}
          >
            <Text
              style={[
                styles.platformChipText,
                selectedPlatform === "android" && styles.platformChipTextActive,
              ]}
            >
              Android (Google Play)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.platformChip,
              selectedPlatform === "ios" && styles.platformChipActive,
            ]}
            onPress={() => handleSelectPlatform("ios")}
          >
            <Text
              style={[
                styles.platformChipText,
                selectedPlatform === "ios" && styles.platformChipTextActive,
              ]}
            >
              iOS (App Store)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Live Target Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Package ID</Text>
              <Text style={styles.summaryValue}>
                {selectedApp === "business" ? "com.intrihub.business" : "com.intrihub.app"}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <CheckCircle2 size={14} color="#15803D" />
              <Text style={styles.statusBadgeText}>Live In Production</Text>
            </View>
          </View>
        </View>

        {/* Main Settings Form */}
        <View style={styles.formCard}>
          <Text style={styles.cardHeader}>Version Specifications</Text>

          {/* Latest Version & Version Code */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>
                Latest Version <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={latestVersion}
                onChangeText={setLatestVersion}
                placeholder="1.2.17"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
              />
              <Text style={styles.hint}>e.g. 1.2.17 (Semver)</Text>
            </View>

            <View style={{ width: 12 }} />

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>
                Version Code <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={latestVersionCode}
                onChangeText={setLatestVersionCode}
                placeholder="36"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
              <Text style={styles.hint}>e.g. 36 (Integer)</Text>
            </View>
          </View>

          {/* Min Supported Version & Code */}
          <View style={[styles.row, { marginTop: 14 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Min Supported Version</Text>
              <TextInput
                style={styles.input}
                value={minSupportedVersion}
                onChangeText={setMinSupportedVersion}
                placeholder="1.2.0"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
              />
              <Text style={styles.hint}>Older than this triggers Force Update</Text>
            </View>

            <View style={{ width: 12 }} />

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Min Version Code</Text>
              <TextInput
                style={styles.input}
                value={minSupportedVersionCode}
                onChangeText={setMinSupportedVersionCode}
                placeholder="30"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
              <Text style={styles.hint}>Min build code allowed</Text>
            </View>
          </View>

          {/* Force Update Switch */}
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <ShieldAlert size={18} color={forceUpdate ? "#DC2626" : "#64748B"} />
                <Text style={styles.switchLabel}>Force Update (Block App Access)</Text>
              </View>
              <Text style={styles.switchSub}>
                Users cannot dismiss the modal until they update on Play Store.
              </Text>
            </View>
            <Switch
              value={forceUpdate}
              onValueChange={setForceUpdate}
              trackColor={{ false: "#CBD5E1", true: "#FCA5A5" }}
              thumbColor={forceUpdate ? "#DC2626" : "#FFFFFF"}
            />
          </View>

          {/* Store URL */}
          <View style={{ marginTop: 14 }}>
            <Text style={styles.label}>Store URL</Text>
            <TextInput
              style={styles.input}
              value={storeUrl}
              onChangeText={setStoreUrl}
              placeholder="https://play.google.com/store/apps/details?id=..."
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Modal Appearance & Copy Card */}
        <View style={styles.formCard}>
          <Text style={styles.cardHeader}>In-App Modal Content</Text>

          <View style={{ marginTop: 8 }}>
            <Text style={styles.label}>Popup Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="New Update Available! 🚀"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={styles.label}>Popup Description / Message</Text>
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: "top" }]}
              value={message}
              onChangeText={setMessage}
              placeholder="A fresh update of IntriHub is available with faster catalog browsing..."
              placeholderTextColor="#94A3B8"
              multiline
            />
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={styles.label}>Release Notes (One per line)</Text>
            <TextInput
              style={[styles.input, { height: 90, textAlignVertical: "top" }]}
              value={releaseNotesText}
              onChangeText={setReleaseNotesText}
              placeholder="Faster catalog & tiles browsing&#10;Smooth checkout and order tracking&#10;Android 15 performance fixes"
              placeholderTextColor="#94A3B8"
              multiline
            />
          </View>
        </View>

        {/* Save Policy Button */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Save size={20} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save & Publish App Policy</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
  },
  instructionsBanner: {
    flexDirection: "row",
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0369A1",
    marginBottom: 4,
  },
  instructionsBody: {
    fontSize: 12,
    lineHeight: 18,
    color: "#0C4A6E",
  },
  segmentedContainer: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  segmentBtnActive: {
    backgroundColor: "#052A51",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  segmentTextActive: {
    color: "#FFFFFF",
  },
  platformRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  platformChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  platformChipActive: {
    borderColor: "#052A51",
    backgroundColor: "#EFF6FF",
  },
  platformChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  platformChipTextActive: {
    color: "#052A51",
    fontWeight: "700",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#15803D",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  required: {
    color: "#DC2626",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
  },
  hint: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 4,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  switchSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    maxWidth: 240,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#052A51",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    marginTop: 6,
    elevation: 3,
    shadowColor: "#052A51",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
