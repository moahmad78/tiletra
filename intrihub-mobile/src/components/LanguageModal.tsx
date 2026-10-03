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
import { useTranslation } from "../store/i18nStore";
import { SupportedLanguage } from "../store/i18nStore";

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
              <Globe size={20} color="#052a51" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.title}>
                {isFirstLaunch ? "Choose Language / भाषा चुनें" : t("nav.selectLanguage")}
              </Text>
              <Text style={styles.subtitle}>
                Select your preferred app language
              </Text>
            </View>
            {!isFirstLaunch && (
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={18} color="#64748B" />
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
              style={styles.continueBtn}
              onPress={() => onClose()}
              activeOpacity={0.8}
            >
              <Text style={styles.continueBtnText}>Continue / आगे बढ़ें</Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
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
  optionsList: {
    gap: 10,
  },
  langOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
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
    marginTop: 2,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F26522",
    alignItems: "center",
    justifyContent: "center",
  },
  continueBtn: {
    marginTop: 16,
    height: 46,
    backgroundColor: "#052a51",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  continueBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },
});
