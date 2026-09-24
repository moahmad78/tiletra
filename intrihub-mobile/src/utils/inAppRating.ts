import { Linking, Platform, Alert } from "react-native";

const PLAY_STORE_PACKAGE = "com.intrihub.app";
const PLAY_STORE_MARKET_URL = `market://details?id=${PLAY_STORE_PACKAGE}`;
const PLAY_STORE_WEB_URL = `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE}`;

/**
 * Opens Google Play Store listing for IntriHub to submit ratings and feedback
 */
export async function openPlayStoreRating(): Promise<boolean> {
  try {
    if (Platform.OS === "android") {
      const supported = await Linking.canOpenURL(PLAY_STORE_MARKET_URL);
      if (supported) {
        await Linking.openURL(PLAY_STORE_MARKET_URL);
        return true;
      }
    }
    await Linking.openURL(PLAY_STORE_WEB_URL);
    return true;
  } catch (error) {
    console.warn("[RATING PROMPT]: Could not open store URL, falling back to web:", error);
    try {
      await Linking.openURL(PLAY_STORE_WEB_URL);
      return true;
    } catch {
      Alert.alert(
        "Rating Unavailable",
        "Could not open Google Play Store. Please search 'IntriHub' on Google Play Store to rate us.",
        [{ text: "OK" }]
      );
      return false;
    }
  }
}

/**
 * Displays a friendly rating prompt dialog
 */
export function promptInAppRating(title?: string, message?: string) {
  Alert.alert(
    title || "Enjoying IntriHub?",
    message || "Your rating helps us empower local Indian shopkeepers and deliver faster site materials across Bengaluru!",
    [
      { text: "Later", style: "cancel" },
      {
        text: "⭐ Rate on Google Play",
        onPress: () => openPlayStoreRating(),
      },
    ]
  );
}
