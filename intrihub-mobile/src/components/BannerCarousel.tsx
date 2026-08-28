import { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { OfferBanner } from "../types";
import { COLORS, SPACING, RADIUS } from "../constants/theme";
import { getImageUrl } from "../constants/config";

const { width } = Dimensions.get("window");
const BANNER_WIDTH = width - SPACING.lg * 2;
const BANNER_HEIGHT = 160;

interface BannerCarouselProps {
  banners: OfferBanner[];
}

// Mapping for common banner shortcuts to valid category slugs
const CATEGORY_ALIAS_MAP: Record<string, string> = {
  "floor-tiles": "tiles-stone",
  "wall-tiles": "tiles-stone",
  "tiles": "tiles-stone",
  "vitrified-tiles": "tiles-stone",
  "sanitaryware": "plumbing-sanitary",
  "bathroom": "plumbing-sanitary",
  "plumbing": "plumbing-sanitary",
  "tile-adhesives": "construction-chemicals",
  "adhesives": "construction-chemicals",
  "chemicals": "construction-chemicals",
  "plywood": "plywood-boards",
  "ply": "plywood-boards",
  "hardware": "hardware-fasteners",
  "electrical": "electrical-appliances",
  "paint": "paint-finishes",
};

export const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners }) => {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const isInteracting = useRef(false);

  const defaultBanners: OfferBanner[] = [
    {
      id: "b1",
      badge: "MEGA SAVINGS",
      title: "Premium Vitrified Tiles",
      subtitle: "Starting at ₹38/sq.ft • Direct from Factory",
      cta: "Explore Deals",
      href: "/category/tiles-stone",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000",
    },
    {
      id: "b2",
      badge: "BUILDER SPECIAL",
      title: "Luxury Sanitaryware & CP",
      subtitle: "Up to 45% OFF on Bulk Bathroom Packages",
      cta: "Shop Now",
      href: "/category/plumbing-sanitary",
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1000",
    },
    {
      id: "b3",
      badge: "SAME DAY DISPATCH",
      title: "Tile Adhesives & Grouts",
      subtitle: "Heavy duty polymer modified cements",
      cta: "Order Now",
      href: "/category/construction-chemicals",
      image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000",
    },
  ];

  const data = banners && banners.length > 0 ? banners : defaultBanners;

  // Auto-rotate every 4 seconds
  useEffect(() => {
    if (data.length <= 1) return;

    const interval = setInterval(() => {
      if (!isInteracting.current && flatListRef.current) {
        const nextIndex = (activeIndexRef.current + 1) % data.length;
        activeIndexRef.current = nextIndex;
        setActiveIndex(nextIndex);
        try {
          flatListRef.current.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
        } catch {
          // In case list isn't rendered yet
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [data.length]);

  const handleBannerPress = (item: OfferBanner) => {
    const href = (item.href || "").trim();

    // 1. Check for product link (/product/123, /products/123)
    const productMatch = href.match(/\/products?\/([a-zA-Z0-9_-]+)/i);
    if (productMatch && productMatch[1]) {
      router.push({
        pathname: "/product/[id]",
        params: { id: productMatch[1] },
      } as any);
      return;
    }

    // 2. Check for category slug in href
    const catParamMatch = href.match(/[?&]category=([a-zA-Z0-9_-]+)/i);
    const categoryMatch = href.match(/\/categor(?:y|ies)\/([a-zA-Z0-9_-]+)/i);
    const rawSlug = (catParamMatch?.[1] || categoryMatch?.[1] || "").toLowerCase();

    if (rawSlug) {
      const resolvedSlug = CATEGORY_ALIAS_MAP[rawSlug] || rawSlug;
      router.push({
        pathname: "/category/[slug]",
        params: { slug: resolvedSlug },
      } as any);
      return;
    }

    // 3. Fallback based on banner title keywords
    const titleLower = (item.title || "").toLowerCase();
    if (titleLower.includes("tile")) {
      router.push({ pathname: "/category/[slug]", params: { slug: "tiles-stone" } } as any);
      return;
    }
    if (titleLower.includes("sanitary") || titleLower.includes("bathroom") || titleLower.includes("cp")) {
      router.push({ pathname: "/category/[slug]", params: { slug: "plumbing-sanitary" } } as any);
      return;
    }
    if (titleLower.includes("adhesive") || titleLower.includes("grout") || titleLower.includes("chemical")) {
      router.push({ pathname: "/category/[slug]", params: { slug: "construction-chemicals" } } as any);
      return;
    }
    if (titleLower.includes("plywood") || titleLower.includes("board")) {
      router.push({ pathname: "/category/[slug]", params: { slug: "plywood-boards" } } as any);
      return;
    }
    if (titleLower.includes("electric") || titleLower.includes("switch") || titleLower.includes("wire")) {
      router.push({ pathname: "/category/[slug]", params: { slug: "electrical-appliances" } } as any);
      return;
    }
    if (titleLower.includes("paint") || titleLower.includes("primer") || titleLower.includes("putty")) {
      router.push({ pathname: "/category/[slug]", params: { slug: "paint-finishes" } } as any);
      return;
    }

    // 4. Default: Open categories tab
    router.push("/(tabs)/categories" as any);
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={data}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={BANNER_WIDTH + SPACING.md}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: BANNER_WIDTH + SPACING.md,
          offset: (BANNER_WIDTH + SPACING.md) * index,
          index,
        })}
        onTouchStart={() => {
          isInteracting.current = true;
        }}
        onTouchEnd={() => {
          isInteracting.current = false;
        }}
        onScrollBeginDrag={() => {
          isInteracting.current = true;
        }}
        onScrollEndDrag={() => {
          isInteracting.current = false;
        }}
        onMomentumScrollEnd={(e) => {
          isInteracting.current = false;
          const slide = Math.round(e.nativeEvent.contentOffset.x / (BANNER_WIDTH + SPACING.md));
          const safeSlide = Math.max(0, Math.min(slide, data.length - 1));
          activeIndexRef.current = safeSlide;
          setActiveIndex(safeSlide);
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.bannerCard}
            activeOpacity={0.88}
            onPress={() => handleBannerPress(item)}
          >
            <Image source={{ uri: getImageUrl(item.image) }} style={styles.bannerImage} contentFit="cover" transition={200} />
            <LinearGradient
              colors={["rgba(5, 42, 81, 0.2)", "rgba(5, 42, 81, 0.85)"]}
              style={styles.gradient}
            >
              {item.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              {item.subtitle && (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      />

      {/* Pagination Indicator Dots */}
      <View style={styles.pagination}>
        {data.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              activeIndexRef.current = index;
              setActiveIndex(index);
              flatListRef.current?.scrollToIndex({ index, animated: true });
            }}
            hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
            style={[styles.dot, activeIndex === index ? styles.activeDot : styles.inactiveDot]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  bannerCard: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    marginHorizontal: SPACING.sm,
    backgroundColor: COLORS.surfaceSecondary,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    padding: SPACING.lg,
    justifyContent: "flex-end",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.accentOrange,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    marginBottom: 6,
  },
  badgeText: {
    color: COLORS.textWhite,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  title: {
    color: COLORS.textWhite,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 22,
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  dot: {
    height: 5,
    borderRadius: RADIUS.full,
    marginHorizontal: 3,
  },
  activeDot: {
    width: 18,
    backgroundColor: COLORS.primary,
  },
  inactiveDot: {
    width: 5,
    backgroundColor: COLORS.surfaceTertiary,
  },
});
