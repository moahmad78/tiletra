import React from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Constants from "expo-constants";
import { DownloadCloud, ArrowUpCircle, CheckCircle2, X, AlertTriangle } from "lucide-react-native";
import { useAppUpdateCheck } from "../hooks/useAppUpdateCheck";

const APP_VERSION = Constants.expoConfig?.version || "1.0.13";

export default function AppUpdateModal() {
  const {
    modalVisible,
    updateInfo,
    handleUpdatePress,
    handleLaterPress,
  } = useAppUpdateCheck({
    app: "business",
    installedVersion: APP_VERSION,
  });

  if (!modalVisible || !updateInfo) return null;

  const isForce = updateInfo.isForceUpdate;

  return (
    <Modal
      visible={modalVisible}
      transparent={!isForce}
      animationType="fade"
      onRequestClose={isForce ? () => {} : handleLaterPress}
      statusBarTranslucent
    >
      <View style={[styles.overlay, isForce && styles.forceOverlay]}>
        <View style={[styles.card, isForce && styles.forceCard]}>
          {/* Header Icon / Badge */}
          <View style={styles.badgeWrapper}>
            <View style={[styles.badgeCircle, isForce && styles.forceBadgeCircle]}>
              {isForce ? (
                <AlertTriangle size={36} color="#FFFFFF" strokeWidth={2.4} />
              ) : (
                <ArrowUpCircle size={36} color="#FFFFFF" strokeWidth={2.2} />
              )}
            </View>
            {!isForce && (
              <View style={styles.sparkleIcon}>
                <CheckCircle2 size={16} color="#10B981" strokeWidth={2.2} />
              </View>
            )}
          </View>

          {/* Close button ONLY if NOT force update */}
          {!isForce && (
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleLaterPress}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          )}

          {/* Title & Version Tag */}
          <Text style={styles.title}>
            {isForce ? "Update Required" : updateInfo.title || "Business Update Available!"}
          </Text>

          <View style={styles.versionTagContainer}>
            <Text style={styles.currentVersionText}>Current: v{APP_VERSION}</Text>
            <Text style={styles.versionArrow}>→</Text>
            <View style={[styles.newVersionBadge, isForce && styles.forceVersionBadge]}>
              <Text style={[styles.newVersionText, isForce && styles.forceVersionText]}>
                Latest: v{updateInfo.latestVersion}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.message}>
            {isForce
              ? "This vendor app version is no longer supported. Please update immediately to accept orders and manage catalog."
              : updateInfo.message ||
                "Update Intrihub Business for instant order chimes, real-time stock sync, and vendor performance enhancements."}
          </Text>

          {/* Release Notes */}
          {updateInfo.releaseNotes && updateInfo.releaseNotes.length > 0 && (
            <View style={styles.releaseNotesBox}>
              <Text style={styles.releaseNotesHeader}>What's New:</Text>
              <ScrollView
                style={styles.notesScroll}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {updateInfo.releaseNotes.map((note, index) => (
                  <View key={index} style={styles.noteRow}>
                    <CheckCircle2 size={15} color="#10B981" style={styles.noteIcon} />
                    <Text style={styles.noteText}>{note}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.updateBtn, isForce && styles.forceUpdateBtn]}
              onPress={handleUpdatePress}
              activeOpacity={0.88}
            >
              <DownloadCloud size={20} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.updateBtnText}>
                {isForce ? "Update Now" : "Update Now"}
              </Text>
            </TouchableOpacity>

            {!isForce && (
              <TouchableOpacity
                style={styles.laterBtn}
                onPress={handleLaterPress}
                activeOpacity={0.7}
              >
                <Text style={styles.laterBtnText}>Later</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(5, 15, 30, 0.78)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  forceOverlay: {
    backgroundColor: "#051A33",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 20,
    position: "relative",
  },
  forceCard: {
    maxWidth: 420,
    paddingTop: 36,
    paddingBottom: 32,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  badgeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#052A51",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#052A51",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  forceBadgeCircle: {
    backgroundColor: "#DC2626",
    shadowColor: "#DC2626",
  },
  sparkleIcon: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FEF3C7",
    padding: 5,
    borderRadius: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },
  versionTagContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    gap: 8,
  },
  currentVersionText: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_500Medium",
    color: "#64748B",
  },
  versionArrow: {
    fontSize: 12,
    color: "#94A3B8",
  },
  newVersionBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  forceVersionBadge: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  newVersionText: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#1D4ED8",
  },
  forceVersionText: {
    color: "#DC2626",
  },
  message: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#475569",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 16,
  },
  releaseNotesBox: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  releaseNotesHeader: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1E293B",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  notesScroll: {
    maxHeight: 120,
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  noteIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "PlusJakartaSans_500Medium",
    color: "#334155",
    lineHeight: 17,
  },
  actionsContainer: {
    width: "100%",
    gap: 10,
  },
  updateBtn: {
    width: "100%",
    height: 50,
    backgroundColor: "#052A51",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#052A51",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  forceUpdateBtn: {
    backgroundColor: "#DC2626",
    shadowColor: "#DC2626",
    height: 52,
  },
  updateBtnText: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  laterBtn: {
    width: "100%",
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  laterBtnText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#64748B",
  },
});
