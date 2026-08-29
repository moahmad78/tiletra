import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import {
  X,
  Palette,
  Sparkles,
  Grid,
  Search,
  Check,
  CheckCircle2,
} from "lucide-react-native";
import {
  CATALOG_COLOURS,
  CATALOG_GRADIENTS,
  SPECTRUM_COLORS,
  CatalogColour,
  CatalogGradient,
} from "../constants/catalog";
import { COLORS, SHADOWS } from "../constants/theme";

interface ColorPalettePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectColor: (colorName: string, colorHex: string) => void;
  currentColorName?: string;
  currentColorHex?: string;
}

export default function ColorPalettePickerModal({
  visible,
  onClose,
  onSelectColor,
  currentColorName = "",
  currentColorHex = "#F26522",
}: ColorPalettePickerModalProps) {
  const [activeTab, setActiveTab] = useState<"solid" | "gradient" | "spectrum">("solid");
  const [search, setSearch] = useState("");
  const [customHex, setCustomHex] = useState(currentColorHex || "#F26522");
  const [customName, setCustomName] = useState(currentColorName || "Custom Shade");

  const filteredSolids = CATALOG_COLOURS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredGradients = CATALOG_GRADIENTS.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleApplyCustom = () => {
    let cleanHex = customHex.trim();
    if (!cleanHex.startsWith("#")) {
      cleanHex = "#" + cleanHex;
    }
    const finalName = customName.trim() || `Custom Color (${cleanHex.toUpperCase()})`;
    onSelectColor(finalName, cleanHex);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={styles.headerIconBox}>
                <Palette size={18} color="#EA580C" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Select Color & Finish</Text>
                <Text style={styles.modalSubtitle}>Solid shades, dual gradients & spectrum</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* 3 Interactive Mode Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "solid" && styles.tabBtnActive]}
              onPress={() => setActiveTab("solid")}
              activeOpacity={0.8}
            >
              <Palette size={13} color={activeTab === "solid" ? "#EA580C" : "#64748B"} />
              <Text
                style={[styles.tabBtnText, activeTab === "solid" && styles.tabBtnTextActive]}
                numberOfLines={1}
              >
                Solid Shades
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "gradient" && styles.tabBtnActive]}
              onPress={() => setActiveTab("gradient")}
              activeOpacity={0.8}
            >
              <Sparkles size={13} color={activeTab === "gradient" ? "#EA580C" : "#64748B"} />
              <Text
                style={[styles.tabBtnText, activeTab === "gradient" && styles.tabBtnTextActive]}
                numberOfLines={1}
              >
                Dual Gradient
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "spectrum" && styles.tabBtnActive]}
              onPress={() => setActiveTab("spectrum")}
              activeOpacity={0.8}
            >
              <Grid size={13} color={activeTab === "spectrum" ? "#EA580C" : "#64748B"} />
              <Text
                style={[styles.tabBtnText, activeTab === "spectrum" && styles.tabBtnTextActive]}
                numberOfLines={1}
              >
                Color Graph
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Box for Solid / Gradient */}
          {activeTab !== "spectrum" ? (
            <View style={styles.searchBox}>
              <Search size={15} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder={activeTab === "solid" ? "Search solid colors (e.g. White, Teak)..." : "Search gradients (e.g. Gold, Marble)..."}
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <X size={14} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {/* Content Area */}
          <View style={styles.contentArea}>
            {activeTab === "solid" ? (
              /* TAB 1: SOLID COLORS */
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
                <View style={styles.solidsGrid}>
                  {filteredSolids.map((item: CatalogColour) => {
                    const isSelected = currentColorName === item.name || currentColorHex === item.hexCode;
                    return (
                      <TouchableOpacity
                        key={item.name}
                        style={[styles.solidItemRow, isSelected && styles.solidItemRowSelected]}
                        onPress={() => {
                          onSelectColor(item.name, item.hexCode);
                          onClose();
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.colorSwatchCircle, { backgroundColor: item.hexCode }]}>
                          {isSelected && <Check size={13} color={item.textColor === "light" ? "#FFFFFF" : "#052A51"} />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.colorItemName, isSelected && styles.colorItemNameSelected]}>
                            {item.name}
                          </Text>
                          <Text style={styles.colorItemHex}>{item.hexCode}</Text>
                        </View>
                        {isSelected && <CheckCircle2 size={16} color="#EA580C" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            ) : activeTab === "gradient" ? (
              /* TAB 2: DUAL TONE / GRADIENT COLORS */
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
                <View style={styles.gradientList}>
                  {filteredGradients.map((item: CatalogGradient) => {
                    const isSelected = currentColorName === item.name;
                    return (
                      <TouchableOpacity
                        key={item.name}
                        style={[styles.gradientCard, isSelected && styles.gradientCardSelected]}
                        onPress={() => {
                          onSelectColor(item.name, item.colors[0]);
                          onClose();
                        }}
                        activeOpacity={0.8}
                      >
                        {/* Dual-Tone Split Bubble */}
                        <View style={styles.splitBubbleWrapper}>
                          <View style={[styles.splitHalfLeft, { backgroundColor: item.colors[0] }]} />
                          <View style={[styles.splitHalfRight, { backgroundColor: item.colors[1] }]} />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={[styles.gradientName, isSelected && styles.gradientNameSelected]}>
                            {item.name}
                          </Text>
                          <View style={{ flexDirection: "row", gap: 6, alignItems: "center", marginTop: 2 }}>
                            <View style={[styles.miniDot, { backgroundColor: item.colors[0] }]} />
                            <Text style={styles.gradientHexText}>{item.colors[0]}</Text>
                            <Text style={{ fontSize: 10, color: "#94A3B8" }}>+</Text>
                            <View style={[styles.miniDot, { backgroundColor: item.colors[1] }]} />
                            <Text style={styles.gradientHexText}>{item.colors[1]}</Text>
                          </View>
                        </View>

                        {isSelected ? (
                          <CheckCircle2 size={18} color="#EA580C" />
                        ) : (
                          <View style={styles.selectPill}>
                            <Text style={styles.selectPillText}>Select</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            ) : (
              /* TAB 3: COLOR SPECTRUM GRAPH & CUSTOM PICKER */
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
                <View style={styles.spectrumContainer}>
                  <Text style={styles.spectrumHeading}>2D Color Spectrum Matrix (Tap any shade):</Text>
                  
                  {/* Spectrum Graph Matrix */}
                  <View style={styles.spectrumGrid}>
                    {SPECTRUM_COLORS.map((row, rowIdx) => (
                      <View key={rowIdx} style={styles.spectrumRow}>
                        {row.map((hex, colIdx) => {
                          const isSelected = customHex.toLowerCase() === hex.toLowerCase();
                          return (
                            <TouchableOpacity
                              key={colIdx}
                              style={[
                                styles.spectrumCell,
                                { backgroundColor: hex },
                                isSelected && styles.spectrumCellActive,
                              ]}
                              onPress={() => {
                                setCustomHex(hex);
                                setCustomName(`Shade (${hex})`);
                              }}
                              activeOpacity={0.85}
                            >
                              {isSelected && (
                                <View style={styles.cellCheckDot} />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ))}
                  </View>

                  {/* Live Selected Preview & Custom Code */}
                  <View style={styles.customPreviewCard}>
                    <View style={[styles.customPreviewCircle, { backgroundColor: customHex }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.customLabel}>Color Shade Name:</Text>
                      <TextInput
                        style={styles.customInput}
                        value={customName}
                        onChangeText={setCustomName}
                        placeholder="e.g. Royal Emerald Green"
                        placeholderTextColor="#94A3B8"
                      />
                      <Text style={[styles.customLabel, { marginTop: 6 }]}>Hex Color Code:</Text>
                      <TextInput
                        style={styles.customInput}
                        value={customHex}
                        onChangeText={setCustomHex}
                        placeholder="#FFFFFF"
                        placeholderTextColor="#94A3B8"
                        autoCapitalize="characters"
                        maxLength={7}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.applyCustomBtn}
                    onPress={handleApplyCustom}
                    activeOpacity={0.85}
                  >
                    <Check size={16} color="#FFFFFF" />
                    <Text style={styles.applyCustomBtnText}>Apply Custom Color</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalBox: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    ...SHADOWS.card,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  headerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#052A51",
  },
  modalSubtitle: {
    fontSize: 11,
    color: "#64748B",
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    flexDirection: "row",
    padding: 4,
    marginHorizontal: 12,
    marginTop: 10,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 9,
    gap: 4,
  },
  tabBtnActive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EA580C",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  tabBtnTextActive: {
    color: "#EA580C",
    fontWeight: "800",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginHorizontal: 12,
    marginTop: 10,
    height: 38,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: "#0F172A",
  },
  contentArea: {
    padding: 12,
  },
  solidsGrid: {
    gap: 6,
  },
  solidItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  solidItemRowSelected: {
    backgroundColor: "#FFF7ED",
    borderColor: "#EA580C",
  },
  colorSwatchCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  colorItemName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  colorItemNameSelected: {
    color: "#EA580C",
    fontWeight: "800",
  },
  colorItemHex: {
    fontSize: 10,
    color: "#64748B",
  },
  gradientList: {
    gap: 8,
  },
  gradientCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  gradientCardSelected: {
    backgroundColor: "#FFF7ED",
    borderColor: "#EA580C",
  },
  splitBubbleWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    flexDirection: "row",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
  },
  splitHalfLeft: {
    flex: 1,
    height: "100%",
  },
  splitHalfRight: {
    flex: 1,
    height: "100%",
  },
  gradientName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  gradientNameSelected: {
    color: "#EA580C",
  },
  miniDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: "#CBD5E1",
  },
  gradientHexText: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
  },
  selectPill: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  selectPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  spectrumContainer: {
    paddingVertical: 4,
  },
  spectrumHeading: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    marginBottom: 8,
  },
  spectrumGrid: {
    backgroundColor: "#F1F5F9",
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 4,
    marginBottom: 12,
  },
  spectrumRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
  },
  spectrumCell: {
    flex: 1,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  spectrumCellActive: {
    borderColor: "#000000",
    borderWidth: 2,
    transform: [{ scale: 1.1 }],
    zIndex: 2,
  },
  cellCheckDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  customPreviewCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
    marginBottom: 12,
  },
  customPreviewCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#CBD5E1",
  },
  customLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 2,
  },
  customInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 32,
    fontSize: 12,
    color: "#0F172A",
  },
  applyCustomBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F26522",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    ...SHADOWS.button,
  },
  applyCustomBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});
