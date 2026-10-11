import fs from "fs";
import path from "path";

// Master English Dictionary containing 100% of the UI texts across the mobile app
const MASTER_EN = {
  common: {
    save: "Save",
    saved: "Saved",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    back: "Back",
    loading: "Loading...",
    search: "Search",
    viewAll: "View All",
    apply: "Apply",
    filter: "Filter",
    sort: "Sort",
    success: "Success",
    error: "Error",
    retry: "Retry",
    submit: "Submit",
    close: "Close",
    confirm: "Confirm",
    continue: "Continue",
    or: "or",
    help: "Help & Support",
    contact: "Contact Us",
    yes: "Yes",
    no: "No",
    done: "Done",
    all: "All",
    readMore: "Read More",
    showLess: "Show Less",
    minutes: "Minutes",
    hours: "Hours",
    exit: "Exit",
    stay: "Stay",
    exitConfirm: "Are you sure you want to close the IntriHub app?",
    exitTitle: "Exit IntriHub?",
    language: "Language",
    selectLanguage: "Select Language",
    selectLanguagePrompt: "Select your preferred app language",
    searchLanguage: "Search language...",
    rating: "Rating",
    top: "TOP",
    off: "off",
  },
  nav: {
    home: "Home",
    categories: "Shop",
    cart: "Cart",
    account: "Account",
    orders: "Orders",
    wishlist: "Wishlist",
    notifications: "Notifications",
    support: "Help & Support",
    settings: "Settings",
    language: "Language",
    selectLanguage: "Select Language",
  },
  home: {
    heroTitle: "Every Material. Every Space.",
    heroSubtitle: "Direct to Site Delivery within 60 Minutes across Bengaluru",
    searchPlaceholder: "Search tiles, sanitaryware, paints, pipes...",
    trendingThisWeek: "Trending This Week",
    upToDiscount: "UP TO 40% OFF",
    allMaterialsSupplies: "All Materials & Supplies",
    loadingMoreProducts: "Loading more products...",
    endOfListProducts: "You've seen all available products!",
    expressDelivery: "Within 60 Minutes",
    expressDeliveryDesc: "Express delivery straight to your construction or interior site",
    factoryPrice: "Factory Direct Pricing",
    factoryPriceDesc: "Best wholesale rates with zero hidden markups",
    damageFree: "Zero Breakage Guarantee",
    damageFreeDesc: "Rigorous transit handling with instant replacement warranty",
    topDeals: "Top Deals of the Day",
    featuredProducts: "Featured Building Materials",
    shopByCategory: "Shop by Category",
    trendingBrands: "Verified Partner Brands",
  },
  search: {
    vitrifiedTiles: "Search vitrified tiles...",
    luxurySanitaryware: "Search luxury sanitaryware...",
    adhesivesGrouts: "Search tile adhesives & grouts...",
    cpFittings: "Search CP bathroom fittings...",
    graniteStone: "Search granite & natural stone...",
    paintsFinishes: "Search paints & wall finishes...",
    electricalFittings: "Search electrical fittings...",
  },
  shop: {
    filters: "Filters",
    sortBy: "Sort By",
    priceLowHigh: "Price: Low to High",
    priceHighLow: "Price: High to Low",
    newest: "Newest First",
    popularity: "Most Popular",
    customerRating: "Customer Rating",
    inStock: "In Stock",
    outOfStock: "Out of Stock",
    price: "Price",
    addToCart: "Add to Cart",
    addedToCart: "Added to Cart!",
    buyNow: "Buy Now",
    noProductsFound: "No products found",
    matchingProducts: "Matching Products",
    searchingCatalog: "Searching catalog...",
    seeAllResults: "See all results for \"{{query}}\"",
    noDirectMatches: "No direct matches for \"{{query}}\"",
    exploreRelated: "Press search or tap below to explore related materials",
    viewCatalogItems: "View Catalog Items",
    allCategories: "All Categories",
    directSupply: "Direct Supply",
  },
  cart: {
    title: "Shopping Cart",
    empty: "Your Cart is Empty",
    emptySubtitle: "Explore tiles, sanitaryware, paints, and building supplies",
    startShopping: "Start Shopping",
    item: "item",
    items: "items",
    subtotal: "Item Subtotal",
    deliveryFee: "Delivery Fee",
    free: "FREE",
    total: "Total Amount",
    unlockedFreeDelivery: "You have unlocked FREE Standard Delivery!",
    addMoreForFreeDelivery: "Add ₹{{amount}} more for FREE Delivery",
    proceedCheckout: "Proceed to Checkout",
    eligibleExpress: "Eligible for 60-Minute Delivery",
  },
  checkout: {
    title: "Order Checkout",
    deliveryAddress: "Delivery Site Address",
    addNewAddress: "Add New Address",
    selectDeliverySlot: "Choose Delivery Window",
    deliverAsap: "Deliver ASAP",
    scheduleLater: "Schedule for later",
    asapNotice: "Standard immediate dispatch: Materials are processed and dispatched within 60–90 minutes.",
    selectDeliveryDay: "SELECT DELIVERY DAY (NEXT 7 DAYS)",
    selectTwoHourSlot: "SELECT 2-HOUR WINDOW (IST)",
    leadNotice: "Min 2h advance lead",
    paymentMethod: "Payment Method",
    onlinePayment: "Online Payment (UPI, Cards, Netbanking)",
    cashOnDelivery: "Cash on Delivery / Site Verification",
    placeOrder: "Place Order",
    processing: "Processing Order...",
    selectAddressError: "Please select a delivery address to proceed.",
    selectSlotError: "Please select a 2-hour delivery slot or switch to Deliver ASAP.",
    orderSuccess: "Order Placed Successfully!",
    orderSuccessSubtitle: "Our verified logistics partner has received your order.",
    viewOrder: "View Order Status",
  },
  orders: {
    title: "My Orders",
    orderId: "Order ID",
    orderDate: "Order Date",
    status: "Status",
    trackOrder: "Track Order",
    downloadInvoice: "Download Tax Invoice",
    noOrders: "No orders yet",
    noOrdersSubtitle: "Orders placed will appear here with live tracking.",
    signInPrompt: "Sign In to View Orders",
    signInPromptSub: "Track your shipments, check order history, and download invoices",
    itemsCount: "{{count}} items",
    totalPaid: "Total Paid",
  },
  account: {
    title: "My Account",
    guestTitle: "Sign In for the Best Experience",
    guestSub: "Manage orders, save delivery addresses, and receive fast updates",
    signInRegister: "Sign In / Register",
    preferencesHeader: "ACCOUNT & PREFERENCES",
    helpHeader: "HELP & SUPPORT",
    appLanguage: "App Language",
    myWishlist: "My Wishlist",
    notificationSettings: "Notification Settings",
    savedAddresses: "Saved Delivery Addresses",
    callSupport: "Call Support (+91 7090120211)",
    whatsappSupport: "WhatsApp Support (+91 7090120211)",
    privacyPolicy: "Privacy Policy",
    termsConditions: "Terms & Conditions",
    logout: "Log Out",
    editProfile: "Edit Profile",
    saveChanges: "Save Changes",
    nameLabel: "Full Name",
    emailLabel: "Email Address",
    phoneLabel: "Phone Number",
    photoLabel: "Profile Photo",
  },
  auth: {
    loginTitle: "Login to Continue",
    loginSubtitle: "Choose how you'd like to continue. Your orders and saved addresses will be linked to your account.",
    enterPhone: "Enter Phone Number",
    phonePlaceholder: "10-digit mobile number",
    sendOtp: "Send Verification Code",
    enterOtp: "Enter Verification Code",
    verifyOtp: "Verify & Continue",
    resendOtp: "Resend Code",
    resendIn: "Resend in {{seconds}}s",
    continueWithGoogle: "Continue with Google",
    continueWithEmail: "Continue with Email",
    disclaimer: "By continuing, you agree to IntriHub's",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    secureLogin: "Secure OTP Verification",
  },
  product: {
    specifications: "Product Specifications",
    customerReviews: "Customer Reviews",
    deliverySpeed: "Delivery within 60 Minutes across Bengaluru",
    verifiedSitePurchase: "Verified Site Purchase",
    writeReview: "Write a Review",
    rating: "Rating",
    quantity: "Quantity",
    unit: "Unit",
    standard: "Standard",
    glossy: "Glossy",
    vitrified: "Vitrified",
    mrp: "MRP",
    inclusiveGst: "Inclusive of all GST taxes",
  },
  notifications: {
    title: "Notifications",
    markAllRead: "Mark all as read",
    emptyTitle: "No notifications yet",
    emptySubtitle: "We'll notify you when your orders dispatch or special offers arrive.",
  },
  address: {
    title: "Delivery Addresses",
    addNew: "Add New Address",
    editAddress: "Edit Address",
    flatHouse: "Flat / House / Building / Site No.",
    streetArea: "Street / Area / Locality",
    city: "City",
    pincode: "6-Digit Pincode",
    landmark: "Landmark (Optional)",
    saveAddress: "Save Delivery Address",
    useCurrentLocation: "Use My Current Location",
    detecting: "Detecting location...",
  },
  errors: {
    networkError: "Unable to connect to server. Please check your internet connection.",
    generalError: "Something went wrong. Please try again shortly.",
    invalidPhone: "Please enter a valid 10-digit mobile number.",
    invalidOtp: "Incorrect verification code. Please check and try again.",
    expiredOtp: "Verification code has expired. Please request a new code.",
  },
};

const TARGET_LANGUAGES = [
  { code: "hi", name: "Hindi" },
  { code: "kn", name: "Kannada" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "ml", name: "Malayalam" },
  { code: "mr", name: "Marathi" },
  { code: "bn", name: "Bengali" },
  { code: "gu", name: "Gujarati" },
  { code: "pa", name: "Punjabi" },
  { code: "ur", name: "Urdu" },
  { code: "or", name: "Odia" },
];

async function translateText(text: string, targetLang: string): Promise<string> {
  // Preserve template variables e.g. {{query}}, {{amount}}, {{seconds}}
  const varRegex = /\{\{\s*(\w+)\s*\}\}/g;
  const placeholders: string[] = [];
  let sanitized = text.replace(varRegex, (match) => {
    placeholders.push(match);
    return `__VAR_${placeholders.length - 1}__`;
  });

  try {
    const encoded = encodeURIComponent(sanitized);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(
      targetLang
    )}&dt=t&q=${encoded}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        let translated = data[0]
          .map((chunk: any) => (chunk && chunk[0] ? chunk[0] : ""))
          .join("");

        // Restore placeholders
        placeholders.forEach((val, idx) => {
          translated = translated.replace(new RegExp(`__VAR_${idx}__`, "g"), val);
          translated = translated.replace(new RegExp(`__ VAR_${idx} __`, "g"), val);
          translated = translated.replace(new RegExp(`__VAR_ ${idx}__`, "g"), val);
        });

        if (translated.trim()) return translated.trim();
      }
    }
  } catch (err) {
    console.warn(`Translation failed for "${text}" -> ${targetLang}:`, err);
  }

  return text;
}

// Collect all dot-path keys
function getLeaves(obj: any, prefix = ""): { path: string; value: string }[] {
  let leaves: { path: string; value: string }[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") {
      leaves.push({ path: fullPath, value: v });
    } else if (typeof v === "object" && v !== null) {
      leaves = leaves.concat(getLeaves(v, fullPath));
    }
  }
  return leaves;
}

function setLeaf(obj: any, pathStr: string, value: string) {
  const parts = pathStr.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cur[parts[i]]) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

async function translateObjectFast(
  obj: any,
  targetLang: string
): Promise<any> {
  const leaves = getLeaves(obj);
  const result: any = {};
  const CONCURRENCY = 15;

  for (let i = 0; i < leaves.length; i += CONCURRENCY) {
    const slice = leaves.slice(i, i + CONCURRENCY);
    const translations = await Promise.all(
      slice.map(async (leaf) => {
        const trans = await translateText(leaf.value, targetLang);
        return { path: leaf.path, value: trans };
      })
    );
    for (const t of translations) {
      setLeaf(result, t.path, t.value);
    }
  }

  return result;
}

async function main() {
  const localesDir = path.resolve(__dirname, "../intrihub-mobile/locales");
  if (!fs.existsSync(localesDir)) {
    fs.mkdirSync(localesDir, { recursive: true });
  }

  // 1. Write Master English
  const enPath = path.join(localesDir, "en.json");
  fs.writeFileSync(enPath, JSON.stringify(MASTER_EN, null, 2), "utf8");
  console.log("✔ Saved Master en.json");

  // 2. Generate each target language
  for (const lang of TARGET_LANGUAGES) {
    console.log(`Generating translations for ${lang.name} (${lang.code})...`);
    const translated = await translateObjectFast(MASTER_EN, lang.code);
    const filePath = path.join(localesDir, `${lang.code}.json`);
    fs.writeFileSync(filePath, JSON.stringify(translated, null, 2), "utf8");
    console.log(`✔ Generated ${lang.code}.json (${lang.name})`);
  }

  console.log("All 12 translation files generated successfully!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
