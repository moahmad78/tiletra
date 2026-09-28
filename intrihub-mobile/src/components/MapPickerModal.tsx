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
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { X, MapPin, Check, Crosshair, Sparkles } from "lucide-react-native";
import * as Location from "expo-location";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../constants/theme";
import { GOOGLE_MAPS_API_KEY } from "../constants/config";

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
    formattedAddress: "Move map to choose exact delivery point",
    latitude: initialLat,
    longitude: initialLng,
  });

  // Debounce ref to avoid spamming Google reverse geocoding on drag
  const debounceTimerRef = useRef<any>(null);

  // Reverse geocode when coordinates change
  const fetchAddressForCoords = async (lat: number, lng: number) => {
    try {
      setIsReverseGeocoding(true);
      let detectedStreet = "";
      let detectedArea = "";
      let detectedCity = "Bengaluru";
      let detectedState = "Karnataka";
      let detectedPincode = "";
      let detectedHouse = "";
      let detectedLandmark = "";
      let formatted = "";

      if (GOOGLE_MAPS_API_KEY) {
        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&region=in`
          );
          const data = await res.json();
          if (data.status === "OK" && data.results?.[0]) {
            const result = data.results[0];
            formatted = result.formatted_address;
            for (const comp of result.address_components || []) {
              const types = comp.types || [];
              if (types.includes("street_number")) detectedHouse = comp.long_name;
              if (types.includes("route")) detectedStreet = comp.long_name;
              if (types.includes("sublocality_level_1") || types.includes("neighborhood")) {
                detectedArea = comp.long_name;
              } else if (types.includes("sublocality_level_2") && !detectedArea) {
                detectedArea = comp.long_name;
              }
              if (types.includes("point_of_interest") || types.includes("establishment")) {
                detectedLandmark = comp.long_name;
              }
              if (types.includes("postal_code")) detectedPincode = comp.long_name;
              if (types.includes("locality")) {
                detectedCity = comp.long_name;
              } else if (!detectedCity && (types.includes("administrative_area_level_2") || types.includes("postal_town"))) {
                detectedCity = comp.long_name;
              }
              if (types.includes("administrative_area_level_1")) detectedState = comp.long_name;
            }
          }
        } catch (gErr) {
          console.warn("Google reverse geocoding error:", gErr);
        }
      }

      // Native fallback if needed
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

  // Recenter to device GPS
  const handleRecenterGPS = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please allow location access to center map to your current location.");
        setIsLocating(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;

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
      console.error("handleRecenterGPS error:", err);
      Alert.alert("GPS Error", "Could not acquire current GPS location.");
    } finally {
      setIsLocating(false);
    }
  };

  // Trigger initial GPS fetch on mount when modal opens
  useEffect(() => {
    if (visible) {
      handleRecenterGPS();
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
    } catch (e) {
      // Ignore non-json messages
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
        <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places"></script>
      </head>
      <body>
        <div id="map"></div>
        <div class="pin-shadow"></div>
        <div class="center-pin-container">
          <div class="pin-bubble">Deliver here</div>
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
            <Text style={styles.headerTitle}>Choose Delivery Location</Text>
            <Text style={styles.headerSub}>Drag map to pin exact site / entrance</Text>
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
                <Text style={styles.loadingText}>Loading Google Map...</Text>
              </View>
            )}
            onMessage={handleWebViewMessage}
          />

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

        {/* Bottom Details & Action Card */}
        <View style={styles.bottomCard}>
          <View style={styles.locationInfoRow}>
            <View style={styles.pinIconWrap}>
              <MapPin size={22} color="#fff" />
            </View>
            <View style={styles.textWrap}>
              <View style={styles.detectedBadgeRow}>
                <Text style={styles.areaTitle}>
                  {addressDetails.area || addressDetails.street || "Pin Location"}
                </Text>
                {isReverseGeocoding ? (
                  <View style={styles.geocodingPill}>
                    <ActivityIndicator size="small" color={COLORS.primary} style={{ transform: [{ scale: 0.7 }] }} />
                    <Text style={styles.geocodingText}>Detecting...</Text>
                  </View>
                ) : (
                  <View style={styles.verifiedPill}>
                    <Sparkles size={11} color="#15803d" />
                    <Text style={styles.verifiedText}>GPS Accurated</Text>
                  </View>
                )}
              </View>

              <Text style={styles.formattedText} numberOfLines={2}>
                {addressDetails.formattedAddress}
              </Text>
              <Text style={styles.cityText}>
                {addressDetails.city}
                {addressDetails.pincode ? ` - ${addressDetails.pincode}` : ""}
              </Text>
            </View>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleConfirm}
            activeOpacity={0.88}
            disabled={isReverseGeocoding}
          >
            <Check size={18} color="#fff" />
            <Text style={styles.confirmBtnText}>Confirm Location & Enter Door Details</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 10,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  headerTitleWrap: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 1,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  webView: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  loadingContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  gpsFloatingBtn: {
    position: "absolute",
    right: 16,
    bottom: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 20,
  },
  bottomCard: {
    backgroundColor: "#fff",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: Platform.OS === "ios" ? 34 : SPACING.lg,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    ...SHADOWS.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  locationInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  pinIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accentOrange,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    ...SHADOWS.sm,
  },
  textWrap: {
    flex: 1,
  },
  detectedBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  areaTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },
  geocodingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
  },
  geocodingText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
  },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#15803d",
  },
  formattedText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  cityText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: RADIUS.md,
    gap: 8,
    ...SHADOWS.md,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },
});
