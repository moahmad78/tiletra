import React from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import Constants from "expo-constants";
import { DownloadCloud, X, AlertTriangle } from "lucide-react-native";
import { useAppUpdateCheck } from "../hooks/useAppUpdateCheck";

export default function AppUpdateModal() {
  const {
    modalVisible,
    updateInfo,
    handleUpdatePress,
    handleLaterPress,
  } = useAppUpdateCheck({
    app: "business",
  });

  if (!modalVisible || !updateInfo) return null;

  const isForce = updateInfo.isForceUpdate;

  // Crisp single-line caption
  const singleLineMessage = isForce
    ? "Please update immediately to accept orders & stock."
    : (updateInfo.message && updateInfo.message.length <= 55
      ? updateInfo.message
      : "Update now for faster orders & real-time stock sync.");

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="slide"
      onRequestClose={isForce ? () => {} : handleLaterPress}
      statusBarTranslucent
    >
      <View style={[styles.overlay, isForce && styles.forceOverlay]}>
        {/* Backdrop touch to dismiss if optional */}
        {!isForce && (
          <TouchableOpacity
            style={styles.backdropPressable}
            activeOpacity={1}
            onPress={handleLaterPress}
          />
        )}

        {/* Bottom Sheet Card */}
        <View style={[styles.sheet, isForce && styles.forceSheet]}>
          {/* Top Grab Handle */}
          <View style={styles.handleBar} />

          {/* Close button (top right) */}
          {!isForce && (
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleLaterPress}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          )}

          {/* Centered Brand Logo */}
          <View style={styles.logoWrapper}>
            {isForce ? (
              <View style={styles.forceIconRow}>
                <AlertTriangle size={24} color="#DC2626" strokeWidth={2.4} />
                <Image
                  source={require("../../assets/intri-web-logo.png")}
                  style={styles.fullLogoImage}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <Image
                source={require("../../assets/intri-web-logo.png")}
                style={styles.fullLogoImage}
                resizeMode="contain"
              />
            )}
          </View>

          {/* Centered Title (Strictly Single Line) */}
          <Text
            style={styles.title}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            {isForce ? "Update Required" : "Business Update Available"}
          </Text>

          {/* Centered Subtitle (Strictly Single Line) */}
          <Text
            style={styles.message}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            {singleLineMessage}
          </Text>

          {/* Action Buttons: Aamne-Samne (Horizontal Row) */}
          <View style={styles.actionsContainer}>
            {!isForce && (
              <>
                <TouchableOpacity
                  style={styles.laterBtn}
                  onPress={handleLaterPress}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.laterBtnText}>Later</Text>
                </TouchableOpacity>

                {/* Subtle vertical separator */}
                <View style={styles.divider} />
              </>
            )}

            <TouchableOpacity
              style={[
                styles.updateBtn,
                isForce && styles.forceFullWidthBtn,
              ]}
              onPress={handleUpdatePress}
              activeOpacity={0.88}
            >
              <DownloadCloud size={19} color="#FFFFFF" strokeWidth={2.3} />
              <Text style={styles.updateBtnText}>Update Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(5, 15, 30, 0.5)",
    justifyContent: "flex-end",
  },
  forceOverlay: {
    backgroundColor: "rgba(5, 15, 30, 0.85)",
  },
  backdropPressable: {
    flex: 1,
  },
  sheet: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
    position: "relative",
  },
  forceSheet: {
    borderTopWidth: 2,
    borderColor: "#FCA5A5",
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 16,
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 18,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  logoWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  forceIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fullLogoImage: {
    width: 210,
    height: 66,
  },
  title: {
    fontSize: 18,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#0F172A",
    textAlign: "center",
    width: "100%",
    marginBottom: 6,
    fontWeight: "700",
  },
  message: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 6,
  },
  actionsContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    gap: 16,
  },
  laterBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  laterBtnText: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#FF5500",
    fontWeight: "600",
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: "#E2E8F0",
  },
  updateBtn: {
    flex: 1,
    height: 48,
    backgroundColor: "#FF5500",
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#FF5500",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  forceFullWidthBtn: {
    flex: 1,
    backgroundColor: "#DC2626",
    shadowColor: "#DC2626",
  },
  updateBtnText: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
