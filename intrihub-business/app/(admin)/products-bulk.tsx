import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import {
  ArrowLeft,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  Sparkles,
  RefreshCw,
  Tag,
  Check,
  FileText,
} from "lucide-react-native";
import {
  fetchAdminBulkTemplate,
  validateAdminBulkCSV,
  commitAdminBulkProducts,
} from "../../src/api/admin";
import { COLORS, SPACING, RADIUS } from "../../src/constants/theme";

export default function AdminProductsBulkScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [currentStep, setCurrentStep] = useState<"upload" | "preview" | "success">("upload");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [availableCategories, setAvailableCategories] = useState<{ key: string; name: string; filename: string }[]>([]);
  const [currentTemplateCsv, setCurrentTemplateCsv] = useState("");
  const [templateFilename, setTemplateFilename] = useState("intrihub_master_template.csv");

  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [validating, setValidating] = useState(false);
  const [committing, setCommitting] = useState(false);

  // Validation Results
  const [validationResult, setValidationResult] = useState<{
    totalRows: number;
    validRows: number;
    invalidRows: number;
    errors: string[];
    preview: any[];
  }>({
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    errors: [],
    preview: [],
  });

  const [createdCount, setCreatedCount] = useState(0);

  useEffect(() => {
    loadTemplate(selectedCategory);
  }, [selectedCategory]);

  const loadTemplate = async (cat: string) => {
    try {
      const res = await fetchAdminBulkTemplate(cat);
      if (res.success && res.template) {
        setCurrentTemplateCsv(res.template.csvContent);
        setTemplateFilename(res.template.filename);
        if (res.availableCategories) {
          setAvailableCategories(res.availableCategories);
        }
      }
    } catch (e) {
      console.error("Error loading template:", e);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      if (!currentTemplateCsv) {
        Alert.alert("Template Error", "Template is still loading...");
        return;
      }

      const fileUri = `${FileSystem.cacheDirectory}${templateFilename}`;
      await FileSystem.writeAsStringAsync(fileUri, currentTemplateCsv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: `Download ${templateFilename}`,
          UTI: "public.comma-separated-values-text",
        });
      } else {
        Alert.alert("Template Ready", `Saved template to ${fileUri}`);
      }
    } catch (e: any) {
      Alert.alert("Download Error", e?.message || "Failed to download template.");
    }
  };

  const handlePickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "text/plain", "*/*"],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets[0]) {
        const file = res.assets[0];
        setFileName(file.name);

        const content = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        setCsvText(content);
        runValidation(content);
      }
    } catch (e: any) {
      Alert.alert("File Error", e?.message || "Failed to read CSV file.");
    }
  };

  const handleLoadSample = () => {
    setFileName(`${templateFilename} (Demo Sample)`);
    setCsvText(currentTemplateCsv);
    runValidation(currentTemplateCsv);
  };

  const runValidation = async (text: string) => {
    if (!text || !text.trim()) {
      Alert.alert("Validation Error", "Please provide CSV content to validate.");
      return;
    }

    setValidating(true);
    try {
      const res = await validateAdminBulkCSV(text);
      setValidating(false);

      if (res.preview && res.preview.length > 0) {
        setValidationResult({
          totalRows: res.totalRows || res.preview.length,
          validRows: res.validRows || res.preview.length,
          invalidRows: res.invalidRows || (res.errors ? res.errors.length : 0),
          errors: res.errors || [],
          preview: res.preview,
        });
        setCurrentStep("preview");
      } else if (res.errors && res.errors.length > 0) {
        setValidationResult({
          totalRows: res.totalRows || 0,
          validRows: 0,
          invalidRows: res.errors.length,
          errors: res.errors,
          preview: [],
        });
        setCurrentStep("preview");
      } else {
        Alert.alert("Validation Failed", res.error || "Could not parse CSV.");
      }
    } catch (e: any) {
      setValidating(false);
      Alert.alert("Validation Error", e?.message || "Failed to validate CSV.");
    }
  };

  const handleCommit = async () => {
    if (!validationResult.preview || validationResult.preview.length === 0) {
      Alert.alert("No Valid Products", "There are no valid products to import.");
      return;
    }

    setCommitting(true);
    try {
      const res = await commitAdminBulkProducts(validationResult.preview);
      setCommitting(false);

      if (res.success) {
        setCreatedCount(res.count || validationResult.preview.length);
        setCurrentStep("success");
      } else {
        Alert.alert("Import Failed", res.error || "Could not commit products.");
      }
    } catch (e: any) {
      setCommitting(false);
      Alert.alert("Commit Error", e?.message || "Something went wrong.");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Bulk Product Import</Text>
          <Text style={styles.headerSub}>Upload and catalog multi-product CSV batches</Text>
        </View>
      </View>

      {/* Steps Indicator */}
      <View style={styles.stepsBar}>
        <View style={[styles.stepItem, currentStep === "upload" && styles.stepItemActive]}>
          <Text style={[styles.stepNumber, currentStep === "upload" && styles.stepNumberActive]}>1</Text>
          <Text style={[styles.stepLabel, currentStep === "upload" && styles.stepLabelActive]}>Upload</Text>
        </View>
        <View style={styles.stepDivider} />
        <View style={[styles.stepItem, currentStep === "preview" && styles.stepItemActive]}>
          <Text style={[styles.stepNumber, currentStep === "preview" && styles.stepNumberActive]}>2</Text>
          <Text style={[styles.stepLabel, currentStep === "preview" && styles.stepLabelActive]}>Validate</Text>
        </View>
        <View style={styles.stepDivider} />
        <View style={[styles.stepItem, currentStep === "success" && styles.stepItemActive]}>
          <Text style={[styles.stepNumber, currentStep === "success" && styles.stepNumberActive]}>3</Text>
          <Text style={[styles.stepLabel, currentStep === "success" && styles.stepLabelActive]}>Done</Text>
        </View>
      </View>

      {/* ── STEP 1: UPLOAD & TEMPLATES ── */}
      {currentStep === "upload" && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Template Section */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <FileSpreadsheet size={20} color={COLORS.accentOrange} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Official CSV Templates</Text>
                <Text style={styles.cardSub}>Select category to download pre-formatted columns</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templatesScroll}>
              {(availableCategories.length > 0
                ? availableCategories
                : [
                    { key: "all", name: "Master All-in-One" },
                    { key: "tiles-granite", name: "Tiles & Granite" },
                    { key: "electrical", name: "Electrical" },
                    { key: "electrical-wires", name: "Wires & Cables" },
                    { key: "paints", name: "Paints" },
                    { key: "plywood", name: "Plywood" },
                  ]
              ).map((cat) => {
                const active = selectedCategory === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.templateChip, active && styles.templateChipActive]}
                    onPress={() => setSelectedCategory(cat.key)}
                  >
                    <Text style={[styles.templateChipText, active && styles.templateChipTextActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={styles.downloadBtn} onPress={handleDownloadTemplate}>
              <Download size={16} color="#052A51" />
              <Text style={styles.downloadBtnText}>Download / Share CSV Template</Text>
            </TouchableOpacity>
          </View>

          {/* Upload File Section */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Upload size={20} color={COLORS.accentBlue} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Upload Product File</Text>
                <Text style={styles.cardSub}>Pick a .csv spreadsheet from your device</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.uploadDropzone} onPress={handlePickFile}>
              <FileSpreadsheet size={36} color={COLORS.accentBlue} />
              <Text style={styles.dropzoneTitle}>Select CSV Spreadsheet</Text>
              <Text style={styles.dropzoneSub}>Tap to browse files from device storage</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.line} />
              <Text style={styles.orText}>OR TEST SAMPLE</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity style={styles.sampleBtn} onPress={handleLoadSample}>
              <Sparkles size={16} color={COLORS.accentOrange} />
              <Text style={styles.sampleBtnText}>Load Sample 5-Product Batch</Text>
            </TouchableOpacity>
          </View>

          {/* Direct Raw Text Paste */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Paste Raw CSV Content</Text>
            <Text style={styles.cardSub}>Directly paste comma-separated product rows</Text>
            <TextInput
              style={styles.csvTextInput}
              multiline
              value={csvText}
              onChangeText={setCsvText}
              placeholder="Category,Product_Name,MRP_Price,Selling_Price,Stock_Qty..."
              placeholderTextColor={COLORS.textTertiary}
            />

            <TouchableOpacity
              style={[styles.validateBtn, !csvText.trim() && { opacity: 0.5 }]}
              disabled={!csvText.trim() || validating}
              onPress={() => runValidation(csvText)}
            >
              {validating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle2 size={18} color="#FFFFFF" />
                  <Text style={styles.validateBtnText}>Validate & Preview Products</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ── STEP 2: VALIDATE & PREVIEW ── */}
      {currentStep === "preview" && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Status Banner */}
          <View
            style={[
              styles.validationBanner,
              validationResult.invalidRows === 0
                ? { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" }
                : { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {validationResult.invalidRows === 0 ? (
                <CheckCircle2 size={22} color="#059669" />
              ) : (
                <AlertCircle size={22} color="#D97706" />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.valBannerTitle}>
                  {validationResult.invalidRows === 0
                    ? `All ${validationResult.validRows} Products Validated!`
                    : `${validationResult.validRows} Valid, ${validationResult.invalidRows} Errors Found`}
                </Text>
                <Text style={styles.valBannerSub}>
                  {fileName ? `File: ${fileName}` : "Batch parsed and ready"}
                </Text>
              </View>
            </View>
          </View>

          {/* Validation Errors List if any */}
          {validationResult.errors.length > 0 && (
            <View style={styles.errorsCard}>
              <Text style={styles.errorsTitle}>Validation Issues to Note:</Text>
              {validationResult.errors.map((err, idx) => (
                <Text key={idx} style={styles.errorItemText}>• {err}</Text>
              ))}
            </View>
          )}

          {/* Parsed Products List */}
          <Text style={styles.previewHeading}>
            Parsed Products Preview ({validationResult.preview.length})
          </Text>

          {validationResult.preview.map((p, idx) => {
            const img = p.images && p.images.length > 0 ? p.images[0] : null;
            const variant = p.variants && p.variants.length > 0 ? p.variants[0] : {};

            return (
              <View key={idx} style={styles.productCard}>
                <View style={styles.productCardTop}>
                  {img && img !== "/placeholders/product.svg" ? (
                    <Image source={{ uri: img }} style={styles.productThumb} resizeMode="cover" />
                  ) : (
                    <View style={styles.productThumbPlaceholder}>
                      <Package size={20} color={COLORS.textTertiary} />
                    </View>
                  )}

                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={styles.catBadgeRow}>
                      <Text style={styles.catBadgeText}>{p.categoryName || p.categorySlug}</Text>
                      {p.specs?.brand && (
                        <Text style={styles.brandBadgeText}>{p.specs.brand}</Text>
                      )}
                    </View>

                    <Text style={styles.productTitle} numberOfLines={2}>{p.name}</Text>

                    <View style={styles.priceRow}>
                      <Text style={styles.sellingPrice}>₹{variant.pricePerBox || 0}</Text>
                      {p.specs?.mrp ? (
                        <Text style={styles.mrpPrice}>₹{p.specs.mrp}</Text>
                      ) : null}
                      <Text style={styles.stockLabel}>Stock: {variant.stockBoxes || 0} {p.unitOfSale || "units"}</Text>
                    </View>
                  </View>
                </View>

                {p.specs?.dimensions || p.specs?.thickness || p.specs?.finish ? (
                  <View style={styles.specsRow}>
                    {p.specs?.dimensions && (
                      <View style={styles.specChip}>
                        <Text style={styles.specChipText}>{p.specs.dimensions}</Text>
                      </View>
                    )}
                    {p.specs?.thickness && (
                      <View style={styles.specChip}>
                        <Text style={styles.specChipText}>{p.specs.thickness}</Text>
                      </View>
                    )}
                    {p.specs?.finish && (
                      <View style={styles.specChip}>
                        <Text style={styles.specChipText}>{p.specs.finish}</Text>
                      </View>
                    )}
                  </View>
                ) : null}
              </View>
            );
          })}

          {/* Action Row */}
          <View style={styles.actionBtnRow}>
            <TouchableOpacity style={styles.reUploadBtn} onPress={() => setCurrentStep("upload")}>
              <RefreshCw size={16} color={COLORS.textSecondary} />
              <Text style={styles.reUploadBtnText}>Re-Upload</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.commitBtn,
                (validationResult.validRows === 0 || committing) && { opacity: 0.5 },
              ]}
              disabled={validationResult.validRows === 0 || committing}
              onPress={handleCommit}
            >
              {committing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Check size={18} color="#FFFFFF" />
                  <Text style={styles.commitBtnText}>
                    Import {validationResult.validRows} Products
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ── STEP 3: SUCCESS CONFIRMATION ── */}
      {currentStep === "success" && (
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <CheckCircle2 size={54} color="#10B981" />
          </View>

          <Text style={styles.successHeading}>Bulk Import Complete!</Text>
          <Text style={styles.successSub}>
            Successfully added {createdCount} products into PostgreSQL. Live catalog revalidated across website and mobile apps.
          </Text>

          <TouchableOpacity
            style={styles.viewCatalogBtn}
            onPress={() => router.push("/(admin)/products" as any)}
          >
            <Package size={18} color="#FFFFFF" />
            <Text style={styles.viewCatalogBtnText}>View Updated Products Catalog</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.importMoreBtn}
            onPress={() => {
              setCsvText("");
              setFileName("");
              setCurrentStep("upload");
            }}
          >
            <Text style={styles.importMoreBtnText}>Import Another CSV Batch</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#052A51",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  headerSub: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
  },
  stepsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    opacity: 0.4,
  },
  stepItemActive: {
    opacity: 1,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#E2E8F0",
    textAlign: "center",
    lineHeight: 22,
    fontSize: 12,
    fontWeight: "800",
    color: "#052A51",
  },
  stepNumberActive: {
    backgroundColor: "#052A51",
    color: "#FFFFFF",
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#052A51",
  },
  stepLabelActive: {
    color: "#052A51",
    fontWeight: "800",
  },
  stepDivider: {
    width: 30,
    height: 1,
    backgroundColor: "#CBD5E1",
    marginHorizontal: 10,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#052A51",
  },
  cardSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  templatesScroll: {
    gap: 8,
    paddingBottom: 8,
  },
  templateChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  templateChipActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
  },
  templateChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  templateChipTextActive: {
    color: "#1D4ED8",
    fontWeight: "800",
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    marginTop: 8,
  },
  downloadBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#052A51",
  },
  uploadDropzone: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#93C5FD",
    borderRadius: 14,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  dropzoneTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0369A1",
    marginTop: 4,
  },
  dropzoneSub: {
    fontSize: 12,
    color: "#0284C7",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    gap: 8,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  orText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textTertiary,
  },
  sampleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  sampleBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#D97706",
  },
  csvTextInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    padding: 10,
    height: 90,
    fontSize: 12,
    color: COLORS.text,
    textAlignVertical: "top",
    fontFamily: "monospace",
    marginTop: 8,
  },
  validateBtn: {
    backgroundColor: "#052A51",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 14,
    gap: 8,
    marginTop: 12,
  },
  validateBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  validationBanner: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  valBannerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#052A51",
  },
  valBannerSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  errorsCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorsTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#DC2626",
    marginBottom: 4,
  },
  errorItemText: {
    fontSize: 11,
    color: "#B91C1C",
    lineHeight: 16,
  },
  previewHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: "#052A51",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 4,
  },
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  productCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  productThumb: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  productThumbPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  catBadgeRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 2,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.accentBlue,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  brandBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#052A51",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  sellingPrice: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.accentOrange,
  },
  mrpPrice: {
    fontSize: 11,
    color: COLORS.textTertiary,
    textDecorationLine: "line-through",
  },
  stockLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: "auto",
  },
  specsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
  },
  specChip: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  specChipText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  actionBtnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  reUploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 14,
    gap: 6,
  },
  reUploadBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  commitBtn: {
    flex: 1,
    backgroundColor: "#F26522",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 14,
    gap: 8,
  },
  commitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  successIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successHeading: {
    fontSize: 22,
    fontWeight: "800",
    color: "#052A51",
  },
  successSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },
  viewCatalogBtn: {
    backgroundColor: "#052A51",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 50,
    borderRadius: 14,
    gap: 8,
    marginTop: 24,
  },
  viewCatalogBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  importMoreBtn: {
    paddingVertical: 14,
    marginTop: 8,
  },
  importMoreBtnText: {
    color: COLORS.accentBlue,
    fontSize: 14,
    fontWeight: "700",
  },
});
