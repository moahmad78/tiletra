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
  const currentHost = window.location.hostname;
  const isLocal = currentHost === "localhost" || currentHost.includes("127.0.0.1") || /^\d+\.\d+\.\d+\.\d+$/.test(currentHost);
  const rootDomain = getRootDomain();

  // Clear existing cookies first
  clearGoogtransCookie();

  // 1. Path=/ cookie without domain (universal, works on localhost & current host)
  document.cookie = `${GOOGTRANS_COOKIE}=${cookieValue}; path=/; max-age=31536000; SameSite=Lax`;

  // 2. Set on current host and root domain if in production
  if (!isLocal) {
    document.cookie = `${GOOGTRANS_COOKIE}=${cookieValue}; domain=${currentHost}; path=/; max-age=31536000; SameSite=Lax`;
    if (rootDomain && rootDomain !== currentHost && !rootDomain.endsWith(".vercel.app")) {
      document.cookie = `${GOOGTRANS_COOKIE}=${cookieValue}; domain=${rootDomain}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }
}

/**
 * Clear the googtrans cookie across all domains when reverting to English.
 */
export function clearGoogtransCookie(): void {
  if (typeof document === "undefined") return;
  const hostname = window.location.hostname;
  const domains = [
    "",
    hostname,
    `.${hostname}`,
  ];

  const parts = hostname.split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    const parentDomain = "." + parts.slice(i).join(".");
    domains.push(parentDomain);
    domains.push(parts.slice(i).join("."));
  }

  const expiredDates = [
    "expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "max-age=0",
  ];

  for (const d of domains) {
    const domainPart = d ? `; domain=${d}` : "";
    for (const exp of expiredDates) {
      document.cookie = `googtrans=; path=/; ${exp}; SameSite=Lax${domainPart}`;
      document.cookie = `googtrans=; path=; ${exp}; SameSite=Lax${domainPart}`;
    }
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
      const match = document.cookie.match(/(?:^|;\s*)googtrans=\/(?:en|auto)\/([a-zA-Z_-]+)/);
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
      if (retries < 25) {
        // Fast retry: 120ms up to 25 times (~3000ms) to allow lazyOnload script to mount
        setTimeout(() => {
          driveGoogleCombo(langCode, retries + 1).then(resolve);
        }, 120);
        return;
      }
      return resolve(false);
    }

    try {
      const targetVal = langCode === "en" ? "" : langCode;
      combo.value = targetVal;

      // Ensure matching option is selected
      if (combo.options && combo.options.length > 0) {
        for (let i = 0; i < combo.options.length; i++) {
          if (combo.options[i].value.toLowerCase() === targetVal.toLowerCase()) {
            combo.selectedIndex = i;
            combo.value = combo.options[i].value;
            break;
          }
        }
      }

      // 1. Dispatch legacy HTMLEvents (for older Google Translate builds)
      try {
        const evt = document.createEvent("HTMLEvents");
        evt.initEvent("change", true, true);
        combo.dispatchEvent(evt);
      } catch {}

      // 2. Dispatch standard Events
      combo.dispatchEvent(new Event("change", { bubbles: true }));
      combo.dispatchEvent(new Event("input", { bubbles: true }));

      // 3. Direct function invocation if onchange property is bound
      if (typeof (combo as any).onchange === "function") {
        try {
          (combo as any).onchange();
        } catch {}
      }

      // Update <html lang="..."> attribute (Accessibility FR-10)
      if (document.documentElement) {
        document.documentElement.lang = langCode;
      }

      // Notify custom listeners (FR-7)
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
 * Restore original English without manual page reload (FR-4).
 */
export function restoreOriginalEnglish(isUserAction = true): Promise<boolean> {
  clearGoogtransCookie();
  saveLanguagePreference("en");

  return new Promise((resolve) => {
    driveGoogleCombo("en").then((success) => {
      // Also try clicking the restore button inside Google's banner iframe if mounted
      try {
        const bannerIframe = document.querySelector<HTMLIFrameElement>("iframe.goog-te-banner-frame");
        if (bannerIframe && bannerIframe.contentDocument) {
          const restoreBtn = bannerIframe.contentDocument.getElementById(":1.restore");
          if (restoreBtn) {
            restoreBtn.click();
          }
        }
      } catch {}

      if (typeof document !== "undefined" && document.documentElement) {
        document.documentElement.lang = "en";
      }

      if (!isUserAction) {
        return resolve(success);
      }

      // Reverting to original English requires a clean reload to remove residual translated font nodes
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      }, 100);

      resolve(true);
    });
  });
}

/**
 * Apply target language seamlessly.
 * Attempts zero-reload in-place translation; if Google Translate widget in current
 * browser session requires reload, automatically refreshes so user NEVER has to manually reload.
 */
export async function applyLanguage(langCode: string, isUserAction = true): Promise<boolean> {
  if (!langCode || langCode === "en") {
    return restoreOriginalEnglish(isUserAction);
  }

  setGoogtransCookie(langCode);
  saveLanguagePreference(langCode);

  const drove = await driveGoogleCombo(langCode);

  if (drove) {
    return true;
  }

  // Fallback: If combo wasn't found after all retries (e.g. adblocker), reload so widget picks up cookie
  if (isUserAction && typeof window !== "undefined") {
    window.location.reload();
  }

  return false;
}
