import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
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
} from "lucide-react-native";
import { Category } from "../types";
import { COLORS, SPACING, RADIUS } from "../constants/theme";
import { getImageUrl } from "../constants/config";

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

  return (
    <View style={styles.gridContainer}>
      {categories.slice(0, 8).map((cat) => (
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
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
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
