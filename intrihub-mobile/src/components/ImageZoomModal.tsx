import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  PanResponder,
  Animated,
  useWindowDimensions,
  Platform,
  StatusBar,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react-native";
import { COLORS, RADIUS, SPACING } from "../constants/theme";

interface ImageZoomModalProps {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
  title?: string;
}

export const ImageZoomModal: React.FC<ImageZoomModalProps> = ({
  visible,
  images,
  initialIndex = 0,
  onClose,
  title,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Animated scale and pan offsets
  const scale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // Track raw values for calculations
  const scaleVal = useRef(1);
  const panVal = useRef({ x: 0, y: 0 });
  const [currentDisplayScale, setCurrentDisplayScale] = useState(1);

  // Gesture helpers
  const initialDist = useRef<number | null>(null);
  const initialScale = useRef<number>(1);
  const touchStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastTapTime = useRef<number>(0);

  // Keep state synced with props when modal opens
  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      resetZoom(false);
    }
  }, [visible, initialIndex]);

  // Keep raw refs updated from Animated values
  useEffect(() => {
    const scaleSub = scale.addListener(({ value }) => {
      scaleVal.current = value;
      setCurrentDisplayScale(Math.round(value * 10) / 10);
    });
    const panSub = pan.addListener((value) => {
      panVal.current = value;
    });

    return () => {
      scale.removeListener(scaleSub);
      pan.removeListener(panSub);
    };
  }, []);

  const resetZoom = (animated = true) => {
    if (animated) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scale.setValue(1);
      pan.setValue({ x: 0, y: 0 });
    }
    scaleVal.current = 1;
    panVal.current = { x: 0, y: 0 };
    setCurrentDisplayScale(1);
  };

  const zoomTo = (targetScale: number) => {
    const clamped = Math.min(Math.max(targetScale, 1), 4.5);
    scaleVal.current = clamped;
    setCurrentDisplayScale(Math.round(clamped * 10) / 10);
    Animated.spring(scale, {
      toValue: clamped,
      friction: 7,
      tension: 40,
      useNativeDriver: true,
    }).start();
    if (clamped === 1) {
      panVal.current = { x: 0, y: 0 };
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      resetZoom(false);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      resetZoom(false);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,

        onPanResponderGrant: (evt) => {
          const touches = evt.nativeEvent.touches;
          if (touches.length >= 2) {
            const dx = touches[0].pageX - touches[1].pageX;
            const dy = touches[0].pageY - touches[1].pageY;
            initialDist.current = Math.hypot(dx, dy);
            initialScale.current = scaleVal.current;
          } else if (touches.length === 1) {
            initialDist.current = null;
            touchStartPos.current = { x: touches[0].pageX, y: touches[0].pageY };
            panStartOffset.current = { x: panVal.current.x, y: panVal.current.y };

            // Double tap toggle
            const now = Date.now();
            if (now - lastTapTime.current < 300) {
              if (scaleVal.current > 1.2) {
                resetZoom(true);
              } else {
                zoomTo(2.5);
              }
              lastTapTime.current = 0;
            } else {
              lastTapTime.current = now;
            }
          }
        },

        onPanResponderMove: (evt, gestureState) => {
          const touches = evt.nativeEvent.touches;

          if (touches.length >= 2) {
            // Two-finger pinch-to-zoom
            const dx = touches[0].pageX - touches[1].pageX;
            const dy = touches[0].pageY - touches[1].pageY;
            const currentDist = Math.hypot(dx, dy);

            if (!initialDist.current || initialDist.current <= 0) {
              initialDist.current = currentDist;
              initialScale.current = scaleVal.current;
              return;
            }

            const factor = currentDist / initialDist.current;
            const newScale = Math.min(Math.max(initialScale.current * factor, 0.8), 5.0);
            scale.setValue(newScale);
            scaleVal.current = newScale;
            setCurrentDisplayScale(Math.round(newScale * 10) / 10);
          } else if (touches.length === 1) {
            // One-finger pan when zoomed in
            initialDist.current = null;
            if (scaleVal.current > 1.05) {
              const deltaX = touches[0].pageX - touchStartPos.current.x;
              const deltaY = touches[0].pageY - touchStartPos.current.y;
              const nextX = panStartOffset.current.x + deltaX;
              const nextY = panStartOffset.current.y + deltaY;

              pan.setValue({ x: nextX, y: nextY });
              panVal.current = { x: nextX, y: nextY };
            }
          }
        },

        onPanResponderRelease: (_, gestureState) => {
          initialDist.current = null;

          // If at 1x scale and user swiped horizontally, navigate images
          if (scaleVal.current <= 1.1) {
            if (gestureState.dx < -55 && currentIndex < images.length - 1) {
              handleNext();
              return;
            }
            if (gestureState.dx > 55 && currentIndex > 0) {
              handlePrev();
              return;
            }
          }

          // If zoomed out below 1x, spring back to 1x
          if (scaleVal.current < 1) {
            resetZoom(true);
          } else if (scaleVal.current > 4.5) {
            Animated.spring(scale, {
              toValue: 4.5,
              useNativeDriver: true,
              friction: 7,
            }).start(() => {
              scaleVal.current = 4.5;
              setCurrentDisplayScale(4.5);
            });
          }
        },
      }),
    [currentIndex, images.length]
  );

  if (!visible || !images || images.length === 0) return null;

  const currentImageUri = images[currentIndex] || images[0];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalBackdrop}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <View style={styles.headerInfo}>
            {title ? (
              <Text style={styles.productTitle} numberOfLines={1}>
                {title}
              </Text>
            ) : null}
            <Text style={styles.counterText}>
              {currentIndex + 1} / {images.length}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Main Zoomable Canvas */}
        <View
          style={styles.canvasContainer}
          {...panResponder.panHandlers}
          collapsable={false}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.imageContainer,
              {
                width: screenWidth,
                height: screenHeight * 0.65,
                transform: [
                  { scale: scale },
                  { translateX: pan.x },
                  { translateY: pan.y },
                ],
              },
            ]}
          >
            <Image
              source={{ uri: currentImageUri }}
              style={styles.fullImage}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          </Animated.View>
        </View>

        {/* Left Arrow (when multiple images and not zoomed in) */}
        {images.length > 1 && currentIndex > 0 && currentDisplayScale <= 1.1 && (
          <TouchableOpacity
            style={[styles.navArrow, styles.navArrowLeft]}
            onPress={handlePrev}
            activeOpacity={0.85}
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* Right Arrow (when multiple images and not zoomed in) */}
        {images.length > 1 &&
          currentIndex < images.length - 1 &&
          currentDisplayScale <= 1.1 && (
            <TouchableOpacity
              style={[styles.navArrow, styles.navArrowRight]}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <ChevronRight size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}

        {/* Bottom Bar: Quick Zoom Buttons + Thumbnails + Hint */}
        <View style={styles.bottomBar}>
          {/* Quick Zoom Tool Controls */}
          <View style={styles.zoomControlRow}>
            <TouchableOpacity
              style={styles.zoomPillBtn}
              onPress={() => zoomTo(scaleVal.current - 0.75)}
              activeOpacity={0.7}
              disabled={currentDisplayScale <= 1}
            >
              <ZoomOut
                size={16}
                color={currentDisplayScale <= 1 ? "#666666" : "#FFFFFF"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.zoomScaleBadge,
                currentDisplayScale > 1 && styles.zoomScaleBadgeActive,
              ]}
              onPress={() => resetZoom(true)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.zoomScaleText,
                  currentDisplayScale > 1 && styles.zoomScaleTextActive,
                ]}
              >
                {currentDisplayScale}x
              </Text>
              {currentDisplayScale > 1 && (
                <RotateCcw size={12} color="#FFFFFF" style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.zoomPillBtn}
              onPress={() => zoomTo(scaleVal.current + 0.75)}
              activeOpacity={0.7}
              disabled={currentDisplayScale >= 4}
            >
              <ZoomIn
                size={16}
                color={currentDisplayScale >= 4 ? "#666666" : "#FFFFFF"}
              />
            </TouchableOpacity>
          </View>

          {/* User Gesture Guidance Hint */}
          <Text style={styles.hintText}>
            Pinch or double-tap to zoom in detailed view
          </Text>

          {/* Thumbnail Carousel (if multiple images) */}
          {images.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailStrip}
            >
              {images.map((img, idx) => (
                <TouchableOpacity
                  key={`thumb-${idx}`}
                  style={[
                    styles.thumbnailBox,
                    currentIndex === idx && styles.thumbnailBoxActive,
                  ]}
                  onPress={() => {
                    resetZoom(false);
                    setCurrentIndex(idx);
                  }}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: img }}
                    style={styles.thumbnailImage}
                    contentFit="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "space-between",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 12 : 54,
    paddingHorizontal: SPACING.lg,
    paddingBottom: 12,
    zIndex: 10,
  },
  headerInfo: {
    flex: 1,
    marginRight: 16,
  },
  productTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  counterText: {
    color: "#A1A1AA",
    fontSize: 12,
    fontWeight: "600",
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  canvasContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
  navArrow: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  navArrowLeft: {
    left: 14,
  },
  navArrowRight: {
    right: 14,
  },
  bottomBar: {
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    paddingTop: 12,
    paddingHorizontal: SPACING.md,
    alignItems: "center",
    zIndex: 10,
  },
  zoomControlRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 30, 36, 0.9)",
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    marginBottom: 8,
    gap: 8,
  },
  zoomPillBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  zoomScaleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  zoomScaleBadgeActive: {
    backgroundColor: COLORS.primaryLight,
  },
  zoomScaleText: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "700",
  },
  zoomScaleTextActive: {
    color: "#FFFFFF",
  },
  hintText: {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 12,
    textAlign: "center",
  },
  thumbnailStrip: {
    gap: 10,
    paddingHorizontal: 4,
  },
  thumbnailBox: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.md,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: "#1F2937",
  },
  thumbnailBoxActive: {
    borderColor: COLORS.accentOrange,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
});
