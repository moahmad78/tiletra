import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  TextInput,
  ScrollView,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { X, MapPin, Check, Crosshair, Search } from "lucide-react-native";
import * as Location from "expo-location";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../constants/theme";
import { apiClient } from "../api/client";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface PickedLocation {
  street: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  houseNumber: string;
  landmark: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
}

interface MapPickerModalProps {
  visible: boolean;
  onClose: () => void;
  initialLat?: number;
  initialLng?: number;
  onConfirmLocation: (location: PickedLocation) => void;
}

export const MapPickerModal: React.FC<MapPickerModalProps> = ({
  visible,
  onClose,
  initialLat = 12.9716, // Default Bangalore
  initialLng = 77.5946,
  onConfirmLocation,
}) => {
  const webViewRef = useRef<WebView>(null);
  const debounceTimerRef = useRef<any>(null);
  const [currentCoords, setCurrentCoords] = useState({ lat: initialLat, lng: initialLng });
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [addressDetails, setAddressDetails] = useState<PickedLocation>({
    street: "",
    area: "",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "",
    houseNumber: "",
    landmark: "",
    formattedAddress: "Move map to choose exact shop location",
    latitude: initialLat,
    longitude: initialLng,
  });

  // ── Blinkit-Style Live Address Search State ──
  const searchDebounceRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState<
    Array<{ placeId: string; description: string; mainText: string; secondaryText: string; latitude?: number; longitude?: number }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);

  // Live address search typing with debouncing
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (!text.trim() || text.length < 2) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await apiClient.get("/api/geo/autocomplete", {
          params: {
            input: text,
            lat: currentCoords.lat,
            lng: currentCoords.lng,
          },
        });
        if (res.data?.success && Array.isArray(res.data.predictions)) {
          setPredictions(res.data.predictions);
          setShowPredictions(true);
        }
      } catch (err) {
        console.warn("Mobile autocomplete error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);
  };

  // Handle clicking a search prediction
  const handleSelectPrediction = async (prediction: {
    placeId: string;
    mainText: string;
    description: string;
    latitude?: number;
    longitude?: number;
  }) => {
    setShowPredictions(false);
    setSearchQuery(prediction.mainText);
    Keyboard.dismiss();
    try {
      setIsSearching(true);

      if (prediction.latitude && prediction.longitude) {
        const { latitude, longitude } = prediction;
        setCurrentCoords({ lat: latitude, lng: longitude });
        if (webViewRef.current) {
          const js = `
            if (window.map) {
              window.map.panTo({ lat: ${latitude}, lng: ${longitude} });
              window.map.setZoom(17);
            }
            true;
          `;
          webViewRef.current.injectJavaScript(js);
        }
        fetchAddressForCoords(latitude, longitude);
        return;
      }

      const res = await apiClient.get("/api/geo/place-details", {
        params: { placeId: prediction.placeId },
      });
      if (res.data?.success && res.data.location) {
        const loc = res.data.location;
        const { latitude, longitude } = loc;
        setCurrentCoords({ lat: latitude, lng: longitude });

        if (webViewRef.current) {
          const js = `
            if (window.map) {
              window.map.panTo({ lat: ${latitude}, lng: ${longitude} });
              window.map.setZoom(17);
            }
            true;
          `;
          webViewRef.current.injectJavaScript(js);
        }

        fetchAddressForCoords(latitude, longitude);
      }
    } catch (err) {
      console.warn("Place details error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Reverse geocode lat/lng to human address components
  const fetchAddressForCoords = async (lat: number, lng: number) => {
    try {
      setIsReverseGeocoding(true);

      let formatted = "";
      let detectedHouse = "";
      let detectedStreet = "";
      let detectedArea = "";
      let detectedCity = "Bengaluru";
      let detectedState = "Karnataka";
      let detectedPincode = "";
      let detectedLandmark = "";

      // 1. Try backend reverse-geocode
      try {
        const res = await apiClient.get("/api/geo/reverse-geocode", {
          params: { lat, lng },
        });
        if (res.data?.success && res.data.address) {
          formatted = res.data.address;
          if (res.data.components) {
            detectedStreet = res.data.components.street || "";
            detectedArea = res.data.components.area || "";
            detectedCity = res.data.components.city || detectedCity;
            detectedState = res.data.components.state || detectedState;
            detectedPincode = res.data.components.pincode || "";
            detectedHouse = res.data.components.houseNumber || "";
            detectedLandmark = res.data.components.landmark || "";
          }
        }
      } catch (e) {
        // Fallback to native reverse geocode
      }

      // 2. Native reverseGeocode fallback if needed
      if (!formatted) {
        try {
          const [nativeAddr] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          if (nativeAddr) {
            detectedStreet = nativeAddr.street || nativeAddr.name || "";
            detectedArea = nativeAddr.subregion || nativeAddr.district || "";
            if (nativeAddr.city) detectedCity = nativeAddr.city;
            if (nativeAddr.region) detectedState = nativeAddr.region;
            if (nativeAddr.postalCode) detectedPincode = nativeAddr.postalCode;
            formatted = [detectedStreet, detectedArea, detectedCity, detectedPincode].filter(Boolean).join(", ");
          }
        } catch (nErr) {
          console.warn("Native reverse geocoding error:", nErr);
        }
      }

      setAddressDetails({
        street: detectedStreet,
        area: detectedArea,
        city: detectedCity,
        state: detectedState,
        pincode: detectedPincode,
        houseNumber: detectedHouse,
        landmark: detectedLandmark,
        formattedAddress: formatted || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        latitude: lat,
        longitude: lng,
      });
    } catch (err) {
      console.error("fetchAddressForCoords error:", err);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Recenter to device GPS (Instant from expo-location)
  const handleRecenterGPS = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please allow location access to center the map to your store location.");
        setIsLocating(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;
      setCurrentCoords({ lat: latitude, lng: longitude });

      if (webViewRef.current) {
        const js = `
          if (window.map) {
            window.map.panTo({ lat: ${latitude}, lng: ${longitude} });
            window.map.setZoom(17);
          }
          true;
        `;
        webViewRef.current.injectJavaScript(js);
      }

      fetchAddressForCoords(latitude, longitude);
    } catch (err) {
      console.warn("handleRecenterGPS error:", err);
      Alert.alert("GPS Error", "Failed to get current GPS location.");
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    if (visible) {
      if (initialLat && initialLng && initialLat !== 12.9716) {
        setCurrentCoords({ lat: initialLat, lng: initialLng });
        fetchAddressForCoords(initialLat, initialLng);
      } else {
        handleRecenterGPS();
      }
    }
  }, [visible]);

  // Handle messages from WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "MAP_IDLE" && data.lat && data.lng) {
        setCurrentCoords({ lat: data.lat, lng: data.lng });

        // Debounce reverse geocoding
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
          fetchAddressForCoords(data.lat, data.lng);
        }, 300);
      }
    } catch {
      // Ignore
    }
  };

  const handleConfirm = () => {
    onConfirmLocation(addressDetails);
    onClose();
  };

  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          * { box-sizing: border-box; }
          html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #e5e7eb; }
          .center-pin-container {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -100%);
            pointer-events: none;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .pin-bubble {
            background: #052a51;
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            margin-bottom: 2px;
            white-space: nowrap;
          }
          .pin-shadow {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 16px;
            height: 6px;
            background: rgba(0,0,0,0.3);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9998;
          }
        </style>
        <script src="https://maps.googleapis.com/maps/api/js?libraries=places"></script>
      </head>
      <body>
        <div id="map"></div>
        <div class="pin-shadow"></div>
        <div class="center-pin-container">
          <div class="pin-bubble">📍 Store Dispatch Point</div>
          <svg width="48" height="48" viewBox="0 0 48 48">
            <path d="M24 4C14.06 4 6 12.06 6 22c0 7.7 5.02 14.23 12.06 16.71L24 44l5.94-5.29C36.98 36.23 42 29.7 42 22c0-9.94-8.06-18-18-18z" fill="#EA4335"/>
            <path d="M24 4c-9.94 0-18 8.06-18 18 0 7.7 5.02 14.23 12.06 16.71L24 44V22H6.1c.14-1.39.46-2.73.95-4L24 4z" fill="#4285F4"/>
            <path d="M24 4v18h17.9c-.14-1.39-.46-2.73-.95-4L24 4z" fill="#FBBC04"/>
            <path d="M24 22v22l5.94-5.29C36.98 36.23 42 29.7 42 22H24z" fill="#34A853"/>
            <circle cx="24" cy="22" r="7" fill="#ffffff"/>
          </svg>
        </div>
        <script>
          var map;
          function init() {
            var initialPos = { lat: ${currentCoords.lat}, lng: ${currentCoords.lng} };
            if (window.google && window.google.maps) {
              map = new google.maps.Map(document.getElementById('map'), {
                center: initialPos,
                zoom: 17,
                disableDefaultUI: true,
                zoomControl: false,
                gestureHandling: 'greedy'
              });

              window.map = map;

              map.addListener('idle', function() {
                var center = map.getCenter();
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'MAP_IDLE',
                    lat: center.lat(),
                    lng: center.lng()
                  }));
                }
              });
            } else {
              // Fallback OpenStreetMap Leaflet if Google Maps script not loaded
              document.getElementById('map').innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;font-family:sans-serif;font-size:13px;text-align:center;padding:20px;">Moving map pin to coordinates...</div>';
            }
          }
          window.onload = init;
        </script>
      </body>
    </html>
  `;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
            <X size={22} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Choose Store Location</Text>
            <Text style={styles.headerSub}>Drag map to pin exact shop / warehouse gate</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Map Container with WebView */}
        <View style={styles.mapContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: mapHtml }}
            style={styles.webView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading Map...</Text>
              </View>
            )}
            onMessage={handleWebViewMessage}
          />

          {/* Floating Search Bar (Blinkit Style) */}
          <View style={styles.searchFloatingContainer}>
            <View style={styles.searchBar}>
              <Search size={18} color={COLORS.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search shop area, street or landmark..."
                placeholderTextColor={COLORS.textTertiary}
                value={searchQuery}
                onChangeText={handleSearchChange}
                returnKeyType="search"
              />
              {isSearching ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : searchQuery ? (
                <TouchableOpacity onPress={() => { setSearchQuery(""); setPredictions([]); setShowPredictions(false); }}>
                  <X size={16} color={COLORS.textTertiary} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Dropdown Predictions */}
            {showPredictions && predictions.length > 0 && (
              <View style={styles.predictionsCard}>
                <ScrollView style={styles.predictionsScroll} keyboardShouldPersistTaps="handled">
                  {/* Use current location quick button */}
                  <TouchableOpacity
                    style={styles.predictionItem}
                    onPress={() => {
                      setShowPredictions(false);
                      handleRecenterGPS();
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.predictionIconWrap, { backgroundColor: "#FFF7ED" }]}>
                      <Crosshair size={16} color={COLORS.primary} />
                    </View>
                    <View style={styles.predictionTextWrap}>
                      <Text style={[styles.predictionMainText, { color: COLORS.primary }]}>Use Current GPS Location</Text>
                      <Text style={styles.predictionSubText}>Instant precision auto-detect</Text>
                    </View>
                  </TouchableOpacity>

                  {predictions.map((p) => (
                    <TouchableOpacity
                      key={p.placeId}
                      style={styles.predictionItem}
                      onPress={() => handleSelectPrediction(p)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.predictionIconWrap}>
                        <MapPin size={16} color={COLORS.textSecondary} />
                      </View>
                      <View style={styles.predictionTextWrap}>
                        <Text style={styles.predictionMainText} numberOfLines={1}>{p.mainText}</Text>
                        <Text style={styles.predictionSubText} numberOfLines={1}>{p.secondaryText || p.description}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Floating GPS Recenter Button */}
          <TouchableOpacity
            style={styles.gpsFloatingBtn}
            onPress={handleRecenterGPS}
            disabled={isLocating}
            activeOpacity={0.88}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Crosshair size={22} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom Sheet Card */}
        <View style={styles.bottomSheet}>
          <View style={styles.addressCard}>
            <View style={styles.locationIconWrap}>
              <MapPin size={22} color={COLORS.accentOrange} />
            </View>
            <View style={styles.addressInfoWrap}>
              {isReverseGeocoding ? (
                <View style={styles.geocodingRow}>
                  <ActivityIndicator size="small" color={COLORS.accentOrange} />
                  <Text style={styles.geocodingText}>Fetching exact address...</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.areaTitle} numberOfLines={1}>
                    {addressDetails.area || addressDetails.street || "Selected Location"}
                  </Text>
                  <Text style={styles.fullAddressText} numberOfLines={2}>
                    {addressDetails.formattedAddress}
                  </Text>
                  <Text style={styles.coordsText}>
                    GPS: {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            style={[styles.confirmBtn, isReverseGeocoding && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={isReverseGeocoding}
            activeOpacity={0.85}
          >
            <Check size={20} color="#FFFFFF" />
            <Text style={styles.confirmBtnText}>Confirm Store Location</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default MapPickerModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceSecondary,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  searchFloatingContainer: {
    position: "absolute",
    top: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 100,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 0,
  },
  predictionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    marginTop: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 220,
    ...SHADOWS.md,
    overflow: "hidden",
  },
  predictionsScroll: {
    maxHeight: 220,
  },
  predictionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: 10,
  },
  predictionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  predictionTextWrap: {
    flex: 1,
  },
  predictionMainText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },
  predictionSubText: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 1,
  },
  gpsFloatingBtn: {
    position: "absolute",
    bottom: SPACING.lg,
    right: SPACING.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bottomSheet: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    ...SHADOWS.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  addressCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: SPACING.md,
  },
  locationIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(242, 101, 34, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  addressInfoWrap: {
    flex: 1,
  },
  geocodingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  geocodingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  areaTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },
  fullAddressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
    lineHeight: 17,
  },
  coordsText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "monospace",
    color: COLORS.accentOrange,
    marginTop: 4,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.xl,
    ...SHADOWS.sm,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
