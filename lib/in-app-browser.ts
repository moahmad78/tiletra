/**
 * In-App Browser / WebView Detection & Helper Utilities
 * Helps identify when users open IntriHub links from WhatsApp, Instagram, Facebook, etc.
 * where third-party iframes, popups, and UPI app deep-links (GPay, PhonePe, Paytm) are restricted.
 */

export interface InAppBrowserInfo {
  isInApp: boolean;
  appName: string | null;
  isAndroid: boolean;
  isIOS: boolean;
}

export function detectInAppBrowser(): InAppBrowserInfo {
  if (typeof window === "undefined" || !navigator || !navigator.userAgent) {
    return {
      isInApp: false,
      appName: null,
      isAndroid: false,
      isIOS: false,
    };
  }

  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || "";
  const isAndroid = /android/i.test(ua);
  const isIOS = /iphone|ipad|ipod/i.test(ua);

  // App-specific signatures
  let appName: string | null = null;

  if (/WhatsApp/i.test(ua)) {
    appName = "WhatsApp";
  } else if (/Instagram/i.test(ua)) {
    appName = "Instagram";
  } else if (/FBAN|FBAV|FB_IAB/i.test(ua)) {
    appName = "Facebook";
  } else if (/LinkedInApp/i.test(ua)) {
    appName = "LinkedIn";
  } else if (/Snapchat/i.test(ua)) {
    appName = "Snapchat";
  } else if (/Twitter|TwitterAndroid/i.test(ua)) {
    appName = "X (Twitter)";
  } else if (/Telegram/i.test(ua)) {
    appName = "Telegram";
  } else if (/Line\//i.test(ua)) {
    appName = "Line";
  } else if (/MicroMessenger/i.test(ua)) {
    appName = "WeChat";
  } else if (/musical_ly|ByteLocale|TikTok/i.test(ua)) {
    appName = "TikTok";
  } else if (isAndroid && /Version\/4\.0.*Chrome\/[0-9.]*\sMobile/i.test(ua) && /wv/i.test(ua)) {
    appName = "In-App Browser";
  } else if (isIOS && !/Safari/i.test(ua) && /WebKit/i.test(ua)) {
    appName = "In-App Browser";
  }

  const isInApp = Boolean(appName);

  return {
    isInApp,
    appName,
    isAndroid,
    isIOS,
  };
}

/**
 * Attempts to launch the current or provided URL directly in the system's default browser (Chrome/Safari).
 */
export function openInSystemBrowser(targetUrl?: string) {
  if (typeof window === "undefined") return;

  const url = targetUrl || window.location.href;
  const { isAndroid, isIOS } = detectInAppBrowser();

  if (isAndroid) {
    try {
      // Clean protocol for intent scheme
      const urlWithoutScheme = url.replace(/^https?:\/\//i, "");
      // Android Chrome intent URL
      const chromeIntent = `intent://${urlWithoutScheme}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.android.chrome;end;`;
      window.location.href = chromeIntent;
      return true;
    } catch (e) {
      console.warn("Could not launch Android Chrome intent:", e);
    }
  }

  // Fallback for iOS and other platforms: try window.open
  try {
    const newTab = window.open(url, "_blank");
    if (newTab) return true;
  } catch {
    // Popup may be blocked
  }

  return false;
}
