import React, { useRef, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text, Platform } from "react-native";
import { WebView } from "react-native-webview";
import { Navigation, Plus, Minus, MapPin } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../constants/theme";

interface InteractiveLocationMapProps {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  onLocationChange: (lat: number, lng: number, source: "MAP_PIN" | "GPS") => void;
  onRecenter?: () => void;
  height?: number;
}

export const InteractiveLocationMap: React.FC<InteractiveLocationMapProps> = ({
  latitude,
  longitude,
  accuracy,
  onLocationChange,
  onRecenter,
  height = 240,
}) => {
  const webViewRef = useRef<WebView>(null);

  const mapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html, #map {
      margin: 0; padding: 0; width: 100%; height: 100%; background: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .leaflet-control-attribution { display: none !important; }
    .custom-pin {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      cursor: grab;
    }
    .custom-pin:active { cursor: grabbing; }
    .pin-head {
      width: 32px; height: 32px; background: #ea580c; border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg); display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2.5px solid #ffffff;
    }
    .pin-dot {
      width: 10px; height: 10px; background: #ffffff; border-radius: 50%;
    }
    .pin-shadow {
      width: 12px; height: 4px; background: rgba(0,0,0,0.25); border-radius: 50%;
      margin-top: 2px; filter: blur(1px);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      center: [${latitude}, ${longitude}],
      zoom: 17,
      zoomControl: false
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a','b','c']
    }).addTo(map);

    var pinIcon = L.divIcon({
      className: 'custom-pin',
      html: '<div class="pin-head"><div class="pin-dot"></div></div><div class="pin-shadow"></div>',
      iconSize: [32, 38],
      iconAnchor: [16, 36]
    });

    var marker = L.marker([${latitude}, ${longitude}], {
      draggable: true,
      icon: pinIcon
    }).addTo(map);

    // Communicate dragend coordinates
    marker.on('dragend', function(e) {
      var pos = marker.getLatLng();
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'PIN_DRAGGED',
          latitude: pos.lat,
          longitude: pos.lng
        }));
      }
    });

    // Tap on map to move pin
    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'MAP_CLICKED',
          latitude: e.latlng.lat,
          longitude: e.latlng.lng
        }));
      }
    });

    // Listen to React Native messages
    window.addEventListener('message', function(event) {
      try {
        var data = JSON.parse(event.data);
        if (data.type === 'SET_CENTER') {
          map.flyTo([data.latitude, data.longitude], data.zoom || 17, { animate: true, duration: 1 });
          marker.setLatLng([data.latitude, data.longitude]);
        } else if (data.type === 'ZOOM_IN') {
          map.zoomIn();
        } else if (data.type === 'ZOOM_OUT') {
          map.zoomOut();
        }
      } catch (err) {}
    });
  </script>
</body>
</html>
`;

  // Fly map to new coordinates when props change
  useEffect(() => {
    if (webViewRef.current) {
      const message = JSON.stringify({
        type: "SET_CENTER",
        latitude,
        longitude,
        zoom: 17,
      });
      webViewRef.current.postMessage(message);
    }
  }, [latitude, longitude]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "PIN_DRAGGED" || data.type === "MAP_CLICKED") {
        onLocationChange(data.latitude, data.longitude, "MAP_PIN");
      }
    } catch (e) {
      console.warn("Map postMessage parse error:", e);
    }
  };

  const handleZoomIn = () => {
    webViewRef.current?.postMessage(JSON.stringify({ type: "ZOOM_IN" }));
  };

  const handleZoomOut = () => {
    webViewRef.current?.postMessage(JSON.stringify({ type: "ZOOM_OUT" }));
  };

  return (
    <View style={[styles.mapContainer, { height }]}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html: mapHtml }}
        style={styles.webView}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleMessage}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading interactive map...</Text>
          </View>
        )}
      />

      {/* Floating Map Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={[styles.controlBtn, SHADOWS.sm]} onPress={handleZoomIn}>
          <Plus size={16} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlBtn, SHADOWS.sm]} onPress={handleZoomOut}>
          <Minus size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Recenter to GPS Button */}
      {onRecenter && (
        <TouchableOpacity
          style={[styles.recenterBtn, SHADOWS.sm]}
          onPress={onRecenter}
          activeOpacity={0.85}
        >
          <Navigation size={14} color={COLORS.primary} />
          <Text style={styles.recenterText}>Recenter GPS</Text>
        </TouchableOpacity>
      )}

      {/* Instruction Badge */}
      <View style={styles.instructionBadge}>
        <MapPin size={11} color="#ea580c" />
        <Text style={styles.instructionText}>Drag pin to your exact building entrance</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    width: "100%",
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    backgroundColor: COLORS.surfaceSecondary,
    position: "relative",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  controlsContainer: {
    position: "absolute",
    right: 12,
    top: 12,
    gap: 6,
  },
  controlBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recenterBtn: {
    position: "absolute",
    left: 12,
    top: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recenterText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },
  instructionBadge: {
    position: "absolute",
    bottom: 8,
    left: 12,
    right: 12,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "rgba(234, 88, 12, 0.2)",
  },
  instructionText: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
});
