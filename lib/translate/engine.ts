/**
 * IntriHub Translation Engine - Controls Google Website Translator
 * Zero Page Reload • Full World Languages • DOM Mutation Safe
 */

const STORAGE_KEY = "site_lang";
const GOOGTRANS_COOKIE = "googtrans";

// ── 1. Global React DOM Crash Prevention Guard (FR-6) ──
// Google Translate wraps text nodes in <font> tags. When React attempts to
// remove or insert nodes during re-render, it throws:
// "NotFoundError: Failed to execute 'removeChild' / 'insertBefore' on 'Node'".
// This safety guard intercepts and prevents the crash.
if (typeof window !== "undefined") {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return newNode;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}

/**
 * Get the root domain (e.g. '.intrihub.com') for shared cross-panel cookie persistence.
 */
function getRootDomain(): string {
  if (typeof window === "undefined") return "";
  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname.includes("127.0.0.1")) {
    return hostname;
  }
  const parts = hostname.split(".");
  if (parts.length >= 2) {
    return "." + parts.slice(-2).join(".");
  }
  return hostname;
}

/**
 * Set a cookie across host and root domain.
 */
export function setGoogtransCookie(langCode: string): void {
  if (typeof document === "undefined") return;
  const cookieValue = `/en/${langCode}`;
  const rootDomain = getRootDomain();
  const currentHost = window.location.hostname;

  // Set on current host path=/
  document.cookie = `${GOOGTRANS_COOKIE}=${cookieValue}; path=/; max-age=31536000; SameSite=Lax`;
  document.cookie = `${GOOGTRANS_COOKIE}=${cookieValue}; domain=${currentHost}; path=/; max-age=31536000; SameSite=Lax`;

  // Set on root domain (e.g. .intrihub.com) if not localhost
  if (rootDomain && rootDomain !== currentHost) {
    document.cookie = `${GOOGTRANS_COOKIE}=${cookieValue}; domain=${rootDomain}; path=/; max-age=31536000; SameSite=Lax`;
  }
}

/**
 * Clear the googtrans cookie across all domains when reverting to English.
 */
export function clearGoogtransCookie(): void {
  if (typeof document === "undefined") return;
  const rootDomain = getRootDomain();
  const currentHost = window.location.hostname;
  const expired = "expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  document.cookie = `${GOOGTRANS_COOKIE}=; ${expired}`;
  document.cookie = `${GOOGTRANS_COOKIE}=; domain=${currentHost}; ${expired}`;
  if (rootDomain && rootDomain !== currentHost) {
    document.cookie = `${GOOGTRANS_COOKIE}=; domain=${rootDomain}; ${expired}`;
  }
}

/**
 * Save user language preference to localStorage.
 */
export function saveLanguagePreference(langCode: string): void {
  try {
    if (typeof window !== "undefined") {
      if (langCode === "en") {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEY, langCode);
      }
    }
  } catch {}
}

/**
 * Read saved language preference.
 */
export function getSavedLanguagePreference(): string {
  try {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && saved !== "en") return saved;

      // Fallback check from googtrans cookie (e.g. "/en/hi")
      const match = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([a-zA-Z_-]+)/);
      if (match && match[1] && match[1] !== "en") {
        return match[1];
      }
    }
  } catch {}
  return "en";
}

/**
 * Drive the hidden Google Translate dropdown combo without page reload (FR-3).
 */
export function driveGoogleCombo(langCode: string, retries = 0): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") return resolve(false);

    const combo = document.querySelector<HTMLSelectElement>("select.goog-te-combo");

    if (!combo) {
      if (retries < 30) {
        // Retry every 250ms for up to ~7.5 seconds
        setTimeout(() => {
          driveGoogleCombo(langCode, retries + 1).then(resolve);
        }, 250);
        return;
      }
      return resolve(false);
    }

    try {
      combo.value = langCode === "en" ? "" : langCode;

      // Dispatch standard Events
      combo.dispatchEvent(new Event("change", { bubbles: true }));
      combo.dispatchEvent(new Event("input", { bubbles: true }));

      // Dispatch legacy HTMLEvents for older engines
      try {
        const evt = document.createEvent("HTMLEvents");
        evt.initEvent("change", true, true);
        combo.dispatchEvent(evt);
      } catch {}

      // Update <html lang="..."> attribute (Accessibility FR-10)
      if (document.documentElement) {
        document.documentElement.lang = langCode;
      }

      // Also notify any custom listeners (FR-7)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("intrihub-language-changed", { detail: { code: langCode } }));
      }

      resolve(true);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Restore original English without page reload (FR-4).
 */
export function restoreOriginalEnglish(): Promise<boolean> {
  clearGoogtransCookie();
  saveLanguagePreference("en");

  return new Promise((resolve) => {
    // 1. Try setting the combo back to empty / en
    driveGoogleCombo("en").then((success) => {
      // 2. Also try clicking the restore button inside Google's banner iframe if mounted
      try {
        const bannerIframe = document.querySelector<HTMLIFrameElement>("iframe.goog-te-banner-frame");
        if (bannerIframe && bannerIframe.contentDocument) {
          const restoreBtn = bannerIframe.contentDocument.getElementById(":1.restore");
          if (restoreBtn) {
            restoreBtn.click();
          }
        }
      } catch {}

      // Update HTML lang attribute
      if (typeof document !== "undefined" && document.documentElement) {
        document.documentElement.lang = "en";
      }

      resolve(success);
    });
  });
}

/**
 * Apply target language seamlessly with zero reload.
 */
export async function applyLanguage(langCode: string): Promise<boolean> {
  if (!langCode || langCode === "en") {
    return restoreOriginalEnglish();
  }

  setGoogtransCookie(langCode);
  saveLanguagePreference(langCode);

  return driveGoogleCombo(langCode);
}
