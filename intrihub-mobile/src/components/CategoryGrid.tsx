import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  Grid,
  Layers,
  Sparkles,
  Home,
  Shield,
  Hammer,
  Droplet,
  Flame,
  Maximize,
  Box,
  ChevronDown,
} from "lucide-react-native";
import { Category } from "../types";
import { COLORS, SPACING, RADIUS } from "../constants/theme";
import { getImageUrl } from "../constants/config";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CategoryGridProps {
  categories: Category[];
  mode?: "grid" | "horizontal";
}

const CATEGORY_ICON_MAP: Record<string, any> = {
  "floor-tiles": Grid,
  "wall-tiles": Layers,
  "sanitaryware": Droplet,
  "bath-fittings": Droplet,
  "tile-adhesives": Hammer,
  "granite-marble": Maximize,
  "electricals": Sparkles,
  "paints": Flame,
  "hardware": Shield,
  "kitchen-sinks": Box,
};

export const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, mode = "grid" }) => {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 3,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded((prev) => !prev);
  };

  const handleCategoryPress = (slug: string) => {
    router.push(`/category/${slug}`);
  };

  const getIconComponent = (slug: string) => {
    const Icon = CATEGORY_ICON_MAP[slug] || Home;
    return <Icon size={22} color={COLORS.primary} />;
  };

  if (mode === "horizontal") {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id || cat.slug}
            style={styles.horizontalItem}
            onPress={() => handleCategoryPress(cat.slug)}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              {cat.image ? (
                <Image source={{ uri: getImageUrl(cat.image) }} style={styles.catImage} contentFit="cover" />
              ) : (
                getIconComponent(cat.slug)
              )}
            </View>
            <Text style={styles.horizontalLabel} numberOfLines={1}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  const displayedCategories = isExpanded ? categories : categories.slice(0, 8);

  return (
    <View style={styles.container}>
      <View style={styles.gridContainer}>
        {displayedCategories.map((cat) => (
          <TouchableOpacity
            key={cat.id || cat.slug}
            style={styles.gridItem}
            onPress={() => handleCategoryPress(cat.slug)}
            activeOpacity={0.7}
          >
            <View style={styles.gridIconBox}>
              {cat.image ? (
                <Image source={{ uri: getImageUrl(cat.image) }} style={styles.catImage} contentFit="cover" />
              ) : (
                getIconComponent(cat.slug)
              )}
            </View>
            <Text style={styles.gridLabel} numberOfLines={2}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Centered Expand/Collapse Button with Animated Arrow */}
      {categories.length > 8 && (
        <TouchableOpacity
          style={styles.expandButton}
          onPress={toggleExpand}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[
              styles.expandIconCircle,
              {
                transform: [
                  { translateY: isExpanded ? 0 : bounceAnim },
                  { rotate: isExpanded ? "180deg" : "0deg" },
                ],
              },
            ]}
          >
            <ChevronDown size={18} color={COLORS.primary} />
          </Animated.View>
          <Text style={styles.expandText}>
            {isExpanded ? "Show Less" : `+${categories.length - 8} More Categories`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.xs,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
  },
  gridItem: {
    width: "23%",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  gridIconBox: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 6,
  },
  catImage: {
    width: "100%",
    height: "100%",
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
    lineHeight: 14,
  },
  expandButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginTop: -4,
    marginBottom: 8,
  },
  expandIconCircle: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(5, 42, 81, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 3,
  },
  expandText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },
  horizontalScroll: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  horizontalItem: {
    alignItems: "center",
    marginRight: 16,
    width: 64,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 4,
  },
  horizontalLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});
