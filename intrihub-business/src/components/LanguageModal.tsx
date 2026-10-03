import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import { Globe, Check, X } from "lucide-react-native";
import { useTranslation, SupportedLanguage } from "../store/i18nStore";
import { COLORS, RADIUS, SHADOWS, SPACING } from "../constants/theme";

interface LanguageModalProps {
  visible: boolean;
  onClose: () => void;
  isFirstLaunch?: boolean;
}

export default function LanguageModal({
  visible,
  onClose,
  isFirstLaunch = false,
}: LanguageModalProps) {
  const { language, setLanguage, languages, t } = useTranslation();

  const handleSelect = (code: SupportedLanguage) => {
    setLanguage(code);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isFirstLaunch ? undefined : onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={isFirstLaunch ? undefined : onClose}
      >
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Globe size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.title}>
                {isFirstLaunch ? "Choose Language / भाषा चुनें" : (t("nav.selectLanguage") || "Select Language")}
              </Text>
              <Text style={styles.subtitle}>
                Select your preferred business dashboard language
              </Text>
            </View>
            {!isFirstLaunch && (
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={18} color={COLORS.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Options */}
          <View style={styles.optionsList}>
            {languages.map((l) => {
              const isSelected = language === l.code;
              return (
                <TouchableOpacity
                  key={l.code}
                  style={[
                    styles.langOption,
                    isSelected && styles.langOptionSelected,
                  ]}
                  onPress={() => handleSelect(l.code)}
                  activeOpacity={0.7}
                >
                  <View>
                    <Text
                      style={[
                        styles.nativeName,
                        isSelected && styles.nativeNameSelected,
                      ]}
                    >
                      {l.nativeName}
                    </Text>
                    <Text style={styles.langName}>{l.name}</Text>
                  </View>
                  {isSelected && (
                    <View style={styles.checkCircle}>
                      <Check size={14} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {isFirstLaunch && (
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmBtnText}>
                {t("common.continue") || "Continue / आगे बढ़ें"}
              </Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(5, 42, 81, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(5, 42, 81, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  optionsList: {
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  langOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  langOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(5, 42, 81, 0.04)",
  },
  nativeName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  nativeNameSelected: {
    color: COLORS.primary,
  },
  langName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmBtn: {
    backgroundColor: COLORS.accentOrange,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    marginTop: SPACING.md,
    ...SHADOWS.button,
  },
  confirmBtnText: {
    color: COLORS.textWhite,
    fontSize: 15,
    fontWeight: "700",
  },
});
