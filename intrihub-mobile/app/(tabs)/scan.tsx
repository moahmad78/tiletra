import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Linking,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import {
  Camera,
  Upload,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
  Search,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react-native";
import { COLORS } from "../../src/constants/theme";
import { useCartStore } from "../../src/store/cartStore";
import { API_BASE_URL } from "../../src/constants/config";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ScanTabScreen() {
  const router = useRouter();
  const { addItem } = useCartStore();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [manualQuery, setManualQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Take Photo using Device Camera
  const handleTakePhoto = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        setErrorMessage("Camera permission is required to scan products.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        await processScan(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : null, null);
      }
    } catch (err: any) {
      setErrorMessage("Could not launch camera: " + (err.message || "Unknown error"));
    }
  };

  // 2. Choose from Photo Gallery
  const handlePickGallery = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        setErrorMessage("Gallery permission is required to select photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        await processScan(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : null, null);
      }
    } catch (err: any) {
      setErrorMessage("Could not open gallery: " + (err.message || "Unknown error"));
    }
  };

  // 3. Manual Text Search
  const handleManualSearch = async () => {
    if (!manualQuery.trim() || isProcessing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await processScan(null, manualQuery.trim());
  };

  // 4. Core Scan API Call
  const processScan = async (base64Image: string | null, textQuery: string | null) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/mobile/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Image,
          text: textQuery,
        }),
      });

      const data = await response.json();
      setScanResult(data);
      Haptics.notificationAsync(
        data.matched
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      );

      // Section 9.1: High confidence match (> 0.85) -> auto-navigate directly to PDP
      if (data.matched && data.confidenceTier === "high" && data.matchedProduct?.id) {
        setTimeout(() => {
          router.push(`/product/${data.matchedProduct.id}` as any);
        }, 900);
      }
    } catch (err: any) {
      setErrorMessage("Failed to analyze product. Please check your connection and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 5. Reset to Scan Again
  const handleReset = () => {
    setImageUri(null);
    setScanResult(null);
    setManualQuery("");
    setErrorMessage(null);
  };

  return (
    <View style={styles.container}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <Sparkles size={14} color={COLORS.accentOrange} />
          <Text style={styles.headerBadgeText}>IntriHub Lens</Text>
        </View>
        <Text style={styles.headerTitle}>Scan & Find Products</Text>
        <Text style={styles.headerSub}>
          Point camera at packaging label (Cement, Paint, Adhesives, Wires)
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Error banner */}
        {errorMessage && (
          <View style={styles.errorCard}>
            <AlertCircle size={16} color="#ef4444" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Image Preview / Viewfinder Box */}
        <View style={styles.reticleBox}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.emptyReticle}>
              <View style={[styles.corner, styles.tl]} />
              <View style={[styles.corner, styles.tr]} />
              <View style={[styles.corner, styles.bl]} />
              <View style={[styles.corner, styles.br]} />
              <Camera size={44} color="rgba(255,255,255,0.4)" />
              <Text style={styles.reticleHint}>Tap Camera below to scan packaging</Text>
            </View>
          )}

          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color={COLORS.accentOrange} />
              <Text style={styles.processingText}>Analyzing Packaging & Brand...</Text>
            </View>
          )}
        </View>

        {/* ── SCAN RESULTS SECTION ── */}
        {scanResult && (
          <View style={styles.resultContainer}>
            {/* Match Status Badge */}
            <View style={styles.resultStatusRow}>
              {scanResult.matched ? (
                <View style={styles.exactBadge}>
                  <CheckCircle2 size={14} color="#10b981" />
                  <Text style={styles.exactBadgeText}>
                    Exact Match ({Math.round((scanResult.confidence || 0.9) * 100)}%)
                  </Text>
                </View>
              ) : (
                <View style={styles.altBadge}>
                  <AlertCircle size={14} color="#f59e0b" />
                  <Text style={styles.altBadgeText}>In-Stock Alternatives</Text>
                </View>
              )}

              <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                <RefreshCw size={13} color={COLORS.textWhite} />
                <Text style={styles.resetButtonText}>Scan Again</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.resultMessage}>{scanResult.message}</Text>

            {/* 1. Exact Match Card */}
            {scanResult.matched && scanResult.matchedProduct && (
              <View style={styles.productCard}>
                <Image
                  source={{ uri: scanResult.matchedProduct.images?.[0] || "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=400" }}
                  style={styles.productImage}
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productBrand}>{scanResult.matchedProduct.brand || "IntriHub"}</Text>
                  <Text style={styles.productName} numberOfLines={2}>
                    {scanResult.matchedProduct.name}
                  </Text>
                  <Text style={styles.productPrice}>
                    ₹{(scanResult.matchedProduct.variants?.[0]?.pricePerBox || 499).toLocaleString("en-IN")}
                  </Text>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.cartButton}
                      onPress={() => {
                        addItem(scanResult.matchedProduct, scanResult.matchedProduct.variants?.[0] || null, 1);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      }}
                    >
                      <ShoppingBag size={14} color="#FFFFFF" />
                      <Text style={styles.cartButtonText}>Add to Cart</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => router.push(`/product/${scanResult.matchedProduct.id}` as any)}
                    >
                      <Text style={styles.viewButtonText}>View Details</Text>
                      <ArrowRight size={13} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* 2. Alternatives Grid */}
            {!scanResult.matched && scanResult.alternatives && scanResult.alternatives.length > 0 && (
              <View style={styles.alternativesSection}>
                <Text style={styles.altHeading}>Available In-Stock Options:</Text>
                <View style={styles.altGrid}>
                  {scanResult.alternatives.slice(0, 4).map((alt: any) => (
                    <TouchableOpacity
                      key={alt.id}
                      style={styles.altCard}
                      onPress={() => router.push(`/product/${alt.id}` as any)}
                    >
                      <Image
                        source={{ uri: alt.images?.[0] || "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=400" }}
                        style={styles.altImage}
                      />
                      <Text style={styles.altName} numberOfLines={2}>{alt.name}</Text>
                      <Text style={styles.altPrice}>
                        ₹{(alt.variants?.[0]?.pricePerBox || alt.pricePerSqft || 499).toLocaleString("en-IN")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* WhatsApp Consultation Button */}
                <TouchableOpacity
                  style={styles.whatsappButton}
                  onPress={() => {
                    const brand = scanResult.extractedInfo?.detectedBrand || "this product";
                    Linking.openURL(
                      `https://wa.me/919264920211?text=Hi%20IntriHub,%20I%20scanned%20${encodeURIComponent(
                        brand
                      )}%20on%20the%20app%20and%20need%20help%20sourcing%20it.`
                    );
                  }}
                >
                  <MessageCircle size={16} color="#FFFFFF" />
                  <Text style={styles.whatsappButtonText}>Enquire on WhatsApp</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ── CONTROLS & MANUAL SEARCH ── */}
        {!scanResult && (
          <View style={styles.controlsSection}>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.galleryButton} onPress={handlePickGallery}>
                <Upload size={20} color="#FFFFFF" />
                <Text style={styles.actionBtnLabel}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shutterButton} onPress={handleTakePhoto}>
                <View style={styles.shutterInner}>
                  <Camera size={30} color={COLORS.accentOrange} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.galleryButton}
                onPress={() => {
                  Linking.openURL("https://wa.me/919264920211?text=Hi%20IntriHub,%20I%20need%20help%20identifying%20a%20product.");
                }}
              >
                <MessageCircle size={20} color="#FFFFFF" />
                <Text style={styles.actionBtnLabel}>Support</Text>
              </TouchableOpacity>
            </View>

            {/* Manual Query Fallback */}
            <View style={styles.searchRow}>
              <Search size={16} color="rgba(255,255,255,0.4)" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Or type brand / product (e.g. Roff T01)..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={manualQuery}
                onChangeText={setManualQuery}
                onSubmitEditing={handleManualSearch}
                returnKeyType="search"
              />
              <TouchableOpacity
                style={styles.searchSubmitButton}
                onPress={handleManualSearch}
                disabled={!manualQuery.trim() || isProcessing}
              >
                <Text style={styles.searchSubmitText}>Search</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#02152b",
  },
  header: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: "center",
    backgroundColor: "#052a51",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 8,
  },
  headerBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  headerSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  contentContainer: {
    padding: 16,
    alignItems: "center",
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    padding: 12,
    borderRadius: 12,
    width: "100%",
    marginBottom: 16,
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 12,
    flex: 1,
  },
  reticleBox: {
    width: SCREEN_WIDTH - 48,
    height: SCREEN_WIDTH - 48,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#000000",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  emptyReticle: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: COLORS.accentOrange,
  },
  tl: { top: 16, left: 16, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 8 },
  tr: { top: 16, right: 16, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 8 },
  bl: { bottom: 16, left: 16, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 8 },
  br: { bottom: 16, right: 16, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 8 },
  reticleHint: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  processingText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  controlsSection: {
    width: "100%",
    alignItems: "center",
    gap: 18,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
  },
  galleryButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  actionBtnLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  shutterButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.accentOrange,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    elevation: 8,
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingLeft: 12,
    width: "100%",
    height: 44,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 12,
    height: "100%",
  },
  searchSubmitButton: {
    backgroundColor: COLORS.accentOrange,
    paddingHorizontal: 14,
    height: "100%",
    justifyContent: "center",
    borderTopRightRadius: 13,
    borderBottomRightRadius: 13,
  },
  searchSubmitText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  resultContainer: {
    width: "100%",
    gap: 12,
  },
  resultStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exactBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  exactBadgeText: {
    color: "#10b981",
    fontSize: 11,
    fontWeight: "800",
  },
  altBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  altBadgeText: {
    color: "#f59e0b",
    fontSize: 11,
    fontWeight: "800",
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resetButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  resultMessage: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    gap: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
  productInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  productBrand: {
    color: COLORS.accentOrange,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  productName: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  productPrice: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 4,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  cartButton: {
    flex: 1,
    backgroundColor: COLORS.accentOrange,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  cartButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  viewButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  viewButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  alternativesSection: {
    gap: 8,
    marginTop: 4,
  },
  altHeading: {
    color: "#fbbf24",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  altGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  altCard: {
    width: (SCREEN_WIDTH - 58) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 8,
  },
  altImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    marginBottom: 6,
  },
  altName: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  altPrice: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 4,
  },
  whatsappButton: {
    backgroundColor: "#16a34a",
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
  },
  whatsappButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
