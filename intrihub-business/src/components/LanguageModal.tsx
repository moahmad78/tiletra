import React, { useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
} from "react-native";
import { Globe, Check, X, Search } from "lucide-react-native";
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
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return languages;
    const q = searchQuery.toLowerCase().trim();
    return languages.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q)
    );
  }, [languages, searchQuery]);

  const handleSelect = (code: SupportedLanguage) => {
    setLanguage(code);
    if (!isFirstLaunch) {
      onClose();
    }
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
                {isFirstLaunch
                  ? "Choose Language / भाषा चुनें"
                  : (t("nav.selectLanguage") || "Select Language")}
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

          {/* Search bar */}
          <View style={styles.searchContainer}>
            <Search size={16} color={COLORS.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder={t("common.searchLanguage") || "Search language / भाषा खोजें..."}
              placeholderTextColor={COLORS.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <X size={15} color={COLORS.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Scrollable Options */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.optionsList}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {filteredLanguages.map((l) => {
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
                  <View style={{ flex: 1 }}>
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
            {filteredLanguages.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No languages found matching "{searchQuery}"
                </Text>
              </View>
            )}
          </ScrollView>

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
    maxHeight: "82%",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: SPACING.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: COLORS.text,
  },
  scrollArea: {
    maxHeight: 340,
  },
  optionsList: {
    gap: SPACING.sm,
    paddingVertical: 2,
  },
  langOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
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
  emptyState: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 13,
    color: COLORS.textTertiary,
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
