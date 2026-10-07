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

  const handleConfirmAndClose = () => {
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
              <Globe size={20} color="#052a51" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.title}>
                {isFirstLaunch
                  ? "Choose Language / भाषा चुनें"
                  : t("nav.selectLanguage")}
              </Text>
              <Text style={styles.subtitle}>
                Select your preferred app language • ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ
              </Text>
            </View>
            {!isFirstLaunch && (
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Bar for Quick Filtering */}
          <View style={styles.searchContainer}>
            <Search size={16} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search language / भाषा खोजें..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <X size={15} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Scrollable Language Options List */}
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

          {/* Bottom Confirmation Button */}
          {isFirstLaunch && (
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={handleConfirmAndClose}
              activeOpacity={0.85}
            >
              <Text style={styles.continueBtnText}>
                Continue / આગળ વધો / آگے بڑھیں
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
    backgroundColor: "rgba(2, 24, 48, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#052a51",
  },
  subtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    paddingVertical: 0,
  },
  scrollArea: {
    maxHeight: 340,
  },
  optionsList: {
    gap: 8,
    paddingVertical: 2,
  },
  langOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  langOptionSelected: {
    borderColor: "#F26522",
    backgroundColor: "#FFF7ED",
  },
  nativeName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  nativeNameSelected: {
    color: "#052a51",
    fontWeight: "900",
  },
  langName: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F26522",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 12,
    color: "#64748B",
  },
  continueBtn: {
    marginTop: 14,
    height: 48,
    backgroundColor: "#052a51",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#052a51",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  continueBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },
});
