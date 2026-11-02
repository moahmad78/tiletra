import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import UserAvatar from "../../src/components/UserAvatar";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Truck,
  LogOut,
  Trash2,
  ShieldCheck,
  Headphones,
  ExternalLink,
  ChevronRight,
  Edit2,
  Bell,
  CheckCircle2,
  Camera,
  UploadCloud,
  X,
  Globe,
  Crosshair,
  Compass,
  Navigation,
  Landmark,
  CreditCard,
  FileText,
  Clock,
  AlertTriangle,
  XCircle,
  AlertCircle,
  Eye,
  FileCheck,
  Store,
  Plus,
  RefreshCw,
} from "lucide-react-native";
import * as Location from "expo-location";
import LanguageModal from "../../src/components/LanguageModal";
import MapPickerModal, { PickedLocation } from "../../src/components/MapPickerModal";
import { useTranslation } from "../../src/store/i18nStore";
import { fetchVendorDashboard, updateVendorProfile } from "../../src/api/vendor";
import { uploadBusinessImage, uploadBusinessDocument } from "../../src/api/auth";
import { apiClient } from "../../src/api/client";
import { useAuthStore } from "../../src/store/authStore";
import { showCustomAlert } from "../../src/store/alertStore";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";

export default function VendorProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, setUser, logout } = useAuthStore();
  const { t, language, languages } = useTranslation();
  const [langModalOpen, setLangModalOpen] = useState(false);
  const currentLangObj = languages.find((l) => l.code === language);

  const { data, refetch } = useQuery({
    queryKey: ["vendor-dashboard"],
    queryFn: fetchVendorDashboard,
  });

  const vendor = data?.vendor;

  // Edit Modal State & Tab
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"store" | "bank" | "kyc">("store");

  // Tab 1: Store profile fields
  const [editStoreName, setEditStoreName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editDeliveryMethod, setEditDeliveryMethod] = useState("");
  const [editLat, setEditLat] = useState("");
  const [editLng, setEditLng] = useState("");
  const [editAutoAccept, setEditAutoAccept] = useState(false);
  const [fetchingGps, setFetchingGps] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [storeLogo, setStoreLogo] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Tab 2: Bank details fields
  const [editBankHolder, setEditBankHolder] = useState("");
  const [editBankName, setEditBankName] = useState("");
  const [editBankAccount, setEditBankAccount] = useState("");
  const [editBankIfsc, setEditBankIfsc] = useState("");
  const [editBankUpi, setEditBankUpi] = useState("");

  // Tab 3: KYC documents fields
  const [editPanNumber, setEditPanNumber] = useState("");
  const [editPanDocUrl, setEditPanDocUrl] = useState("");
  const [editAadharNumber, setEditAadharNumber] = useState("");
  const [editAadharDocUrl, setEditAadharDocUrl] = useState("");
  const [editShopPhotoUrl, setEditShopPhotoUrl] = useState("");
  const [editGstNumber, setEditGstNumber] = useState("");
  const [editGstDocUrl, setEditGstDocUrl] = useState("");
  const [editChequeDocUrl, setEditChequeDocUrl] = useState("");

  // Loading states
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  // In-app Document Preview Modal
  const [previewDocModal, setPreviewDocModal] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (vendor?.logo) {
      setStoreLogo(vendor.logo);
    }
  }, [vendor?.logo]);

  const handlePickAndUploadLogo = async () => {
    try {
      if (Platform.OS === "ios") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          showCustomAlert({
            title: "Permission Required",
            message: "Gallery permission is required to upload your store logo.",
            buttons: [{ text: "OK", style: "default" }],
          });
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const asset = result.assets[0];
        setUploadingLogo(true);
        const res = await uploadBusinessImage(
          asset.uri,
          asset.fileName || `vendor-logo-${Date.now()}.jpg`,
          asset.mimeType || "image/jpeg"
        );
        setUploadingLogo(false);

        if (res.success && res.url) {
          setStoreLogo(res.url);
          const updateRes = await updateVendorProfile({
            logo: res.url,
          });
          if (updateRes.success) {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
            queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
            queryClient.invalidateQueries({ queryKey: ["admin-vendor-detail"] });
            showCustomAlert({
              title: "Logo Uploaded 🎉",
              message: "Your store logo is now saved and visible to admins & customers!",
              buttons: [{ text: "OK", style: "default" }],
            });
          }
        } else {
          showCustomAlert({
            title: "Upload Error",
            message: res.error || "Failed to upload logo image",
            buttons: [{ text: "OK", style: "default" }],
          });
        }
      }
    } catch (e: any) {
      setUploadingLogo(false);
      showCustomAlert({
        title: "Error",
        message: e?.message || "Something went wrong during image selection",
        buttons: [{ text: "OK", style: "default" }],
      });
    }
  };

  const handleOpenEdit = (tab: "store" | "bank" | "kyc" = "store") => {
    setModalTab(tab);
    setEditStoreName(vendor?.businessName || user?.name || "");
    setEditPhone(vendor?.contactPhone || user?.phone || "");
    setEditEmail(vendor?.contactEmail || user?.email || "");
    setEditAddress(vendor?.businessAddress || "");
    setEditDeliveryMethod(vendor?.deliveryMethod === "platform" ? "platform" : "self");
    setEditLat(vendor?.latitude ? String(vendor.latitude) : "");
    setEditLng(vendor?.longitude ? String(vendor.longitude) : "");
    setEditAutoAccept(Boolean(vendor?.autoAcceptOrders));

    // Bank Details
    setEditBankHolder(vendor?.bankAccountHolder || "");
    setEditBankName(vendor?.bankName || "");
    setEditBankAccount(vendor?.bankAccountNumber || "");
    setEditBankIfsc(vendor?.bankIfscCode || "");
    setEditBankUpi(vendor?.bankUpiId || "");

    // KYC Details
    setEditPanNumber(vendor?.panNumber || "");
    setEditPanDocUrl(vendor?.panDocUrl || "");
    setEditAadharNumber(vendor?.aadharNumber || "");
    setEditAadharDocUrl(vendor?.aadharDocUrl || "");
    setEditShopPhotoUrl(vendor?.shopPhotoUrl || "");
    setEditGstNumber(vendor?.gstNumber || "");
    setEditGstDocUrl(vendor?.gstDocUrl || "");
    setEditChequeDocUrl(vendor?.chequeDocUrl || "");

    setEditModalOpen(true);
  };

  const handleAutoDetectGPS = async () => {
    try {
      setFetchingGps(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showCustomAlert({
          title: "Permission Required",
          message: "Location permission is required to auto-detect your store GPS.",
          buttons: [{ text: "OK", style: "default" }],
        });
        setFetchingGps(false);
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;
      setEditLat(String(latitude));
      setEditLng(String(longitude));

      // Try reverse geocode to fill editAddress
      try {
        const res = await apiClient.get("/api/geo/reverse-geocode", {
          params: { lat: latitude, lng: longitude },
        });
        if (res.data?.success && res.data.address) {
          setEditAddress(res.data.address);
        }
      } catch {
        try {
          const [nativeAddr] = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (nativeAddr) {
            const formatted = [
              nativeAddr.street || nativeAddr.name,
              nativeAddr.subregion || nativeAddr.district,
              nativeAddr.city,
              nativeAddr.postalCode,
            ].filter(Boolean).join(", ");
            if (formatted) setEditAddress(formatted);
          }
        } catch {
          // ignore
        }
      }
      showCustomAlert({
        title: "GPS Detected 📍",
        message: `Coordinates auto-detected: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        buttons: [{ text: "OK", style: "default" }],
      });
    } catch (err: any) {
      console.warn("Auto detect GPS error:", err);
      showCustomAlert({
        title: "GPS Error",
        message: "Failed to detect current location.",
        buttons: [{ text: "OK", style: "default" }],
      });
    } finally {
      setFetchingGps(false);
    }
  };

  const handleLocationPicked = (loc: PickedLocation) => {
    setEditLat(String(loc.latitude));
    setEditLng(String(loc.longitude));
    if (loc.formattedAddress) {
      setEditAddress(loc.formattedAddress);
    }
    setMapModalOpen(false);
  };

  const handlePickAndUploadKycDoc = async (
    docType: "pan" | "aadhar" | "shop" | "gst" | "cheque",
    source: "gallery" | "camera" | "document"
  ) => {
    try {
      setUploadingDoc(docType);

      if (source === "document") {
        const result = await DocumentPicker.getDocumentAsync({
          type: ["application/pdf", "image/*"],
          copyToCacheDirectory: true,
        });
        if (!result.canceled && result.assets?.[0]?.uri) {
          const file = result.assets[0];
          const uploadRes = await uploadBusinessDocument(
            file.uri,
            file.name || `kyc-${docType}-${Date.now()}.pdf`,
            file.mimeType || "application/pdf"
          );
          if (uploadRes.success && uploadRes.url) {
            applyDocUrl(docType, uploadRes.url);
            showCustomAlert({
              title: "Document Uploaded ✓",
              message: `${docType.toUpperCase()} document uploaded successfully.`,
              buttons: [{ text: "OK", style: "default" }],
            });
          } else {
            showCustomAlert({
              title: "Upload Failed",
              message: uploadRes.error || "Could not upload document",
              buttons: [{ text: "OK", style: "default" }],
            });
          }
        }
      } else if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          showCustomAlert({
            title: "Permission Required",
            message: "Camera permission is required to capture photos.",
            buttons: [{ text: "OK", style: "default" }],
          });
          setUploadingDoc(null);
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          quality: 0.85,
          allowsEditing: false,
        });
        if (!result.canceled && result.assets?.[0]?.uri) {
          const asset = result.assets[0];
          const uploadRes = await uploadBusinessImage(
            asset.uri,
            asset.fileName || `kyc-${docType}-${Date.now()}.jpg`,
            asset.mimeType || "image/jpeg"
          );
          if (uploadRes.success && uploadRes.url) {
            applyDocUrl(docType, uploadRes.url);
            showCustomAlert({
              title: "Photo Uploaded ✓",
              message: `${docType.toUpperCase()} photo captured and uploaded.`,
              buttons: [{ text: "OK", style: "default" }],
            });
          } else {
            showCustomAlert({
              title: "Upload Failed",
              message: uploadRes.error || "Could not upload photo",
              buttons: [{ text: "OK", style: "default" }],
            });
          }
        }
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.85,
          allowsEditing: false,
        });
        if (!result.canceled && result.assets?.[0]?.uri) {
          const asset = result.assets[0];
          const uploadRes = await uploadBusinessImage(
            asset.uri,
            asset.fileName || `kyc-${docType}-${Date.now()}.jpg`,
            asset.mimeType || "image/jpeg"
          );
          if (uploadRes.success && uploadRes.url) {
            applyDocUrl(docType, uploadRes.url);
            showCustomAlert({
              title: "Photo Uploaded ✓",
              message: `${docType.toUpperCase()} photo uploaded successfully.`,
              buttons: [{ text: "OK", style: "default" }],
            });
          } else {
            showCustomAlert({
              title: "Upload Failed",
              message: uploadRes.error || "Could not upload photo",
              buttons: [{ text: "OK", style: "default" }],
            });
          }
        }
      }
    } catch (e: any) {
      console.warn("Upload KYC doc error:", e);
      showCustomAlert({
        title: "Error",
        message: e?.message || "Failed to upload document",
        buttons: [{ text: "OK", style: "default" }],
      });
    } finally {
      setUploadingDoc(null);
    }
  };

  const applyDocUrl = (docType: string, url: string) => {
    if (docType === "pan") setEditPanDocUrl(url);
    else if (docType === "aadhar") setEditAadharDocUrl(url);
    else if (docType === "shop") setEditShopPhotoUrl(url);
    else if (docType === "gst") setEditGstDocUrl(url);
    else if (docType === "cheque") setEditChequeDocUrl(url);
  };

  const handleSaveProfile = async (submitKyc = false) => {
    if (!editStoreName.trim()) {
      showCustomAlert({
        title: "Validation Error",
        message: "Store name cannot be empty.",
        buttons: [{ text: "OK", style: "default" }],
      });
      return;
    }

    if (submitKyc) {
      if (!editPanNumber.trim() && !editPanDocUrl) {
        showCustomAlert({
          title: "PAN Card Required",
          message: "Please enter your PAN Card number or upload your PAN document.",
          buttons: [{ text: "OK", style: "default" }],
        });
        return;
      }
      if (!editAadharNumber.trim() && !editAadharDocUrl) {
        showCustomAlert({
          title: "Aadhaar Card Required",
          message: "Please enter your Aadhaar Card number or upload your Aadhaar document.",
          buttons: [{ text: "OK", style: "default" }],
        });
        return;
      }
      if (!editShopPhotoUrl) {
        showCustomAlert({
          title: "Shop Photo Required",
          message: "Please upload a photo of your storefront/warehouse.",
          buttons: [{ text: "OK", style: "default" }],
        });
        return;
      }
    }

    if (submitKyc) setSubmittingKyc(true);
    else setSaving(true);

    try {
      const payload: any = {
        businessName: editStoreName.trim(),
        contactPhone: editPhone.trim() || undefined,
        contactEmail: editEmail.trim() || undefined,
        businessAddress: editAddress.trim() || undefined,
        deliveryMethod: editDeliveryMethod === "platform" ? "platform" : "self",
        logo: storeLogo || undefined,
        latitude: editLat ? Number(editLat) : undefined,
        longitude: editLng ? Number(editLng) : undefined,
        autoAcceptOrders: editAutoAccept,
        // Bank Details
        bankAccountHolder: editBankHolder.trim() || undefined,
        bankName: editBankName.trim() || undefined,
        bankAccountNumber: editBankAccount.trim() || undefined,
        bankIfscCode: editBankIfsc.trim().toUpperCase() || undefined,
        bankUpiId: editBankUpi.trim() || undefined,
        // KYC Legal Documents & Shopfront
        panNumber: editPanNumber.trim().toUpperCase() || undefined,
        panDocUrl: editPanDocUrl || undefined,
        aadharNumber: editAadharNumber.trim() || undefined,
        aadharDocUrl: editAadharDocUrl || undefined,
        shopPhotoUrl: editShopPhotoUrl || undefined,
        gstNumber: editGstNumber.trim().toUpperCase() || undefined,
        gstDocUrl: editGstDocUrl || undefined,
        chequeDocUrl: editChequeDocUrl || undefined,
      };

      if (submitKyc) {
        payload.kycStatus = "submitted";
      }

      const res = await updateVendorProfile(payload);

      setSaving(false);
      setSubmittingKyc(false);

      if (res.success) {
        setEditModalOpen(false);
        showCustomAlert({
          title: submitKyc ? "KYC Submitted For Verification 🎉" : "Profile Updated 🎉",
          message: submitKyc
            ? "Your KYC documents & bank details have been submitted to Super Admin! Approval takes 2-4 hours."
            : "Store details, Bank account & KYC records saved successfully!",
          buttons: [{ text: "OK", style: "default" }],
        });
        refetch();
        queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
        queryClient.invalidateQueries({ queryKey: ["admin-vendor-detail"] });
        queryClient.invalidateQueries({ queryKey: ["admin-deliveries"] });
      } else {
        showCustomAlert({
          title: "Save Error",
          message: res.error || "Failed to update store details",
          buttons: [{ text: "OK", style: "default" }],
        });
      }
    } catch (e: any) {
      setSaving(false);
      setSubmittingKyc(false);
      showCustomAlert({
        title: "Error",
        message: e?.message || "Failed to save changes",
        buttons: [{ text: "OK", style: "default" }],
      });
    }
  };

  const handleTestPushNotification = async () => {
    setTestingPush(true);
    try {
      let deviceToken: string | undefined = undefined;
      let localSuccess = false;

      try {
        const Notifications = require("expo-notifications");
        const Constants = require("expo-constants").default || require("expo-constants");

        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });

        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("orders_high_importance", {
            name: "Incoming Orders High Alert",
            importance: (Notifications as any).AndroidImportance?.MAX ?? 5,
            vibrationPattern: [0, 500, 250, 500, 250, 500],
            enableVibrate: true,
            sound: "default",
            lockscreenVisibility: (Notifications as any).AndroidNotificationVisibility?.PUBLIC ?? 1,
            bypassDnd: true,
            lightColor: "#EA580C",
          }).catch(() => {});
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
          const permReq = await Notifications.requestPermissionsAsync();
          finalStatus = permReq.status;
        }

        if (finalStatus === "granted") {
          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "📦 New Order Received!",
                body: "Order #84920: Vitrified Glazed Tiles (24 Boxes) received. Tap to dispatch.",
                sound: "default",
                channelId: "orders_high_importance",
                data: { screen: "/(vendor)/orders", id: "TEST_84920" },
              },
              trigger: null,
            });
            localSuccess = true;
          } catch (localErr) {
            console.warn("Local notification scheduling note:", localErr);
          }

          try {
            const { triggerAlert } = require("../../src/store/orderAlertStore").useOrderAlertStore.getState();
            triggerAlert({
              orderId: "TEST-84920",
              customerName: "Rahul Sharma (Test)",
              totalAmount: 18450,
              itemsCount: 24,
              isAutoAccepted: true,
              warning: "Test Order Notification",
            });
          } catch (modalErr) {
            console.warn("Order alert modal note:", modalErr);
          }

          try {
            const projectId =
              Constants?.expoConfig?.extra?.eas?.projectId ??
              Constants?.easConfig?.projectId ??
              "107f8b28-48ac-4c6a-b065-8d24f2427724";
            const tokenObj = await Notifications.getExpoPushTokenAsync(
              projectId ? { projectId } : undefined
            );
            deviceToken = tokenObj?.data;

            if (deviceToken) {
              await apiClient
                .post("/api/mobile/push-token", {
                  token: deviceToken,
                  platform: Platform.OS,
                })
                .catch(() => {});
            }
          } catch (tokenErr) {
            console.log("Remote push token retrieval note (normal in Expo Go / Dev):", tokenErr);
          }
        } else {
          setTestingPush(false);
          showCustomAlert({
            title: "Permission Required",
            message: "Notification permission denied. Please allow notifications in phone settings.",
            buttons: [{ text: "OK", style: "default" }],
          });
          return;
        }
      } catch (nativeErr: any) {
        console.warn("Notification setup note:", nativeErr);
      }

      let remoteSuccess = false;
      if (deviceToken) {
        try {
          const res = await apiClient.post("/api/mobile/push-token/test", {
            token: deviceToken,
            title: "📦 New Order Received!",
            message: "Order #84920: Vitrified Glazed Tiles (24 Boxes) received. Tap to dispatch.",
            screen: "/(vendor)/orders",
          });
          remoteSuccess = res.data?.success === true;
        } catch (apiErr) {
          console.warn("Remote push dispatch note:", apiErr);
        }
      }

      setTestingPush(false);
      showCustomAlert({
        title: "Push Test Active 🔔",
        message:
          deviceToken && remoteSuccess
            ? "Remote & Local notifications dispatched! Notification tray aur incoming order chime check karein."
            : "Test notification trigger ho gaya! Ring chime aur vibration phone par check karein.",
        buttons: [{ text: "OK", style: "default" }],
      });
    } catch (e: any) {
      setTestingPush(false);
      showCustomAlert({
        title: "Push Test",
        message: e?.message || "Test notification trigger ho chuka hai.",
        buttons: [{ text: "OK", style: "default" }],
      });
    }
  };

  const kycStatus = vendor?.kycStatus || "pending";
  const isKycVerified = kycStatus === "verified";
  const isKycSubmitted = kycStatus === "submitted";
  const isKycRejected = kycStatus === "rejected";
  const isKycPending = !isKycVerified && !isKycSubmitted && !isKycRejected;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t("account.title") || "Vendor Profile"}</Text>
          <Text style={styles.headerSubtitle}>Store credentials, Bank & KYC details</Text>
        </View>
        <Image
          source={require("../../assets/intri-icon.png")}
          style={styles.headerLogo}
          contentFit="contain"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.storeCard}>
          <TouchableOpacity
            style={styles.storeLogoWrapper}
            onPress={handlePickAndUploadLogo}
            disabled={uploadingLogo}
            activeOpacity={0.85}
          >
            {uploadingLogo ? (
              <View style={styles.storeIconCircle}>
                <ActivityIndicator size="small" color={COLORS.accentOrange} />
              </View>
            ) : (
              <UserAvatar
                uri={vendor?.logo || storeLogo || user?.avatar}
                name={vendor?.businessName || user?.name || "Vendor"}
                size={80}
              />
            )}
            <View style={styles.cameraIconBadge}>
              <Camera size={12} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <Text style={styles.storeName}>{vendor?.businessName || user?.name || "My Store"}</Text>
          <TouchableOpacity onPress={handlePickAndUploadLogo} style={{ marginTop: 4, marginBottom: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: "800", color: COLORS.accentOrange }}>
              {vendor?.logo || storeLogo || user?.avatar ? "📷 Change Store Logo" : "➕ Upload Store Logo"}
            </Text>
          </TouchableOpacity>

          <View style={styles.statusPill}>
            <ShieldCheck size={14} color={COLORS.accentGreen} />
            <Text style={styles.statusPillText}>
              {vendor?.status === "approved" ? "Verified Partner" : "Pending Approval"}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Mail size={16} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{vendor?.contactEmail || user?.email || "N/A"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Phone size={16} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>+91 {vendor?.contactPhone || user?.phone || "N/A"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Truck size={16} color={vendor?.deliveryMethod === "platform" ? COLORS.accentBlue : COLORS.accentOrange} />
            <Text style={styles.infoText}>
              Logistics:{" "}
              <Text style={{ fontWeight: "800", color: vendor?.deliveryMethod === "platform" ? "#1E40AF" : "#9A3412" }}>
                {vendor?.deliveryMethod === "platform" ? "⚡ Platform Logistics (Auto)" : "🚛 Self-Delivery (Manual)"}
              </Text>
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MapPin size={16} color={vendor?.latitude ? COLORS.accentGreen : COLORS.error} />
            <Text style={styles.infoText}>
              Shop GPS:{" "}
              <Text style={{ fontWeight: "800", color: vendor?.latitude ? COLORS.accentGreen : COLORS.error }}>
                {vendor?.latitude && vendor?.longitude
                  ? `${Number(vendor.latitude).toFixed(4)}, ${Number(vendor.longitude).toFixed(4)}`
                  : "Not Set (Required for 60-min delivery)"}
              </Text>
            </Text>
          </View>
          <View style={styles.infoRow}>
            <CheckCircle2 size={16} color={vendor?.autoAcceptOrders ? COLORS.accentGreen : COLORS.textTertiary} />
            <Text style={styles.infoText}>
              Auto-Accept Orders:{" "}
              <Text style={{ fontWeight: "800", color: vendor?.autoAcceptOrders ? COLORS.accentGreen : COLORS.textSecondary }}>
                {vendor?.autoAcceptOrders ? "Enabled ⚡" : "Disabled (Manual)"}
              </Text>
            </Text>
          </View>

          <TouchableOpacity style={styles.editProfileBtn} onPress={() => handleOpenEdit("store")}>
            <Edit2 size={14} color={COLORS.accentOrange} />
            <Text style={styles.editProfileBtnText}>{t("account.editProfile") || "Edit Store Profile"}</Text>
          </TouchableOpacity>
        </View>

        {/* Part 1: KYC Legal Status Banner Card */}
        <View
          style={[
            styles.kycCard,
            isKycVerified
              ? styles.kycCardVerified
              : isKycSubmitted
              ? styles.kycCardSubmitted
              : isKycRejected
              ? styles.kycCardRejected
              : styles.kycCardPending,
          ]}
        >
          <View style={styles.kycTopRow}>
            <View
              style={[
                styles.kycIconBox,
                isKycVerified
                  ? { backgroundColor: "#DCFCE7" }
                  : isKycSubmitted
                  ? { backgroundColor: "#DBEAFE" }
                  : isKycRejected
                  ? { backgroundColor: "#FEE2E2" }
                  : { backgroundColor: "#FEF3C7" },
              ]}
            >
              {isKycVerified ? (
                <ShieldCheck size={22} color="#15803D" />
              ) : isKycSubmitted ? (
                <Clock size={22} color="#1D4ED8" />
              ) : isKycRejected ? (
                <XCircle size={22} color="#DC2626" />
              ) : (
                <AlertCircle size={22} color="#B45309" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text
                  style={[
                    styles.kycTitle,
                    isKycVerified
                      ? { color: "#166534" }
                      : isKycSubmitted
                      ? { color: "#1E40AF" }
                      : isKycRejected
                      ? { color: "#991B1B" }
                      : { color: "#92400E" },
                  ]}
                >
                  {isKycVerified
                    ? "KYC Verified ✓"
                    : isKycSubmitted
                    ? "KYC Submitted - Under Review ⏳"
                    : isKycRejected
                    ? "KYC Rejected / Action Required ❌"
                    : "Complete Store KYC & Documents 📋"}
                </Text>
              </View>
              <Text style={styles.kycSubtitle}>
                {isKycVerified
                  ? "Your identity, shop storefront, and legal tax credentials have been verified by Intrihub Super Admin. Payouts are fully enabled."
                  : isKycSubmitted
                  ? "Your Aadhaar, PAN, Shop photo & Bank proof are being reviewed by the admin team. Usually approved in 2-4 hours."
                  : isKycRejected
                  ? `Reason: ${vendor?.kycNotes || "Document mismatch or unclear photos."} Please update and re-submit your files.`
                  : "Upload Aadhaar, PAN, Shop photo, GST and Bank Details to complete verification and receive automated payouts."}
              </Text>
            </View>
          </View>

          {/* Document Checklist Pills */}
          <View style={styles.kycChecklistRow}>
            <View style={[styles.kycCheckItem, vendor?.aadharDocUrl ? styles.kycCheckItemGreen : styles.kycCheckItemGray]}>
              <Text style={[styles.kycCheckText, vendor?.aadharDocUrl ? { color: "#15803D" } : { color: "#64748B" }]}>
                {vendor?.aadharDocUrl ? "✓ Aadhaar" : "○ Aadhaar"}
              </Text>
            </View>
            <View style={[styles.kycCheckItem, vendor?.panDocUrl ? styles.kycCheckItemGreen : styles.kycCheckItemGray]}>
              <Text style={[styles.kycCheckText, vendor?.panDocUrl ? { color: "#15803D" } : { color: "#64748B" }]}>
                {vendor?.panDocUrl ? "✓ PAN" : "○ PAN"}
              </Text>
            </View>
            <View style={[styles.kycCheckItem, vendor?.shopPhotoUrl ? styles.kycCheckItemGreen : styles.kycCheckItemGray]}>
              <Text style={[styles.kycCheckText, vendor?.shopPhotoUrl ? { color: "#15803D" } : { color: "#64748B" }]}>
                {vendor?.shopPhotoUrl ? "✓ Shop Photo" : "○ Shop Photo"}
              </Text>
            </View>
            <View style={[styles.kycCheckItem, vendor?.gstDocUrl || vendor?.gstNumber ? styles.kycCheckItemGreen : styles.kycCheckItemGray]}>
              <Text style={[styles.kycCheckText, vendor?.gstDocUrl || vendor?.gstNumber ? { color: "#15803D" } : { color: "#64748B" }]}>
                {vendor?.gstDocUrl || vendor?.gstNumber ? "✓ GST" : "○ GST"}
              </Text>
            </View>
            <View style={[styles.kycCheckItem, vendor?.bankAccountNumber ? styles.kycCheckItemGreen : styles.kycCheckItemGray]}>
              <Text style={[styles.kycCheckText, vendor?.bankAccountNumber ? { color: "#15803D" } : { color: "#64748B" }]}>
                {vendor?.bankAccountNumber ? "✓ Bank" : "○ Bank"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.kycActionBtn,
              isKycVerified
                ? { backgroundColor: "#15803D" }
                : isKycRejected
                ? { backgroundColor: "#DC2626" }
                : { backgroundColor: "#052A51" },
            ]}
            onPress={() => handleOpenEdit("kyc")}
            activeOpacity={0.85}
          >
            <FileText size={15} color="#FFFFFF" />
            <Text style={styles.kycActionBtnText}>
              {isKycVerified
                ? "View Verified KYC & Bank Details"
                : isKycSubmitted
                ? "View / Update Submitted KYC & Bank"
                : isKycRejected
                ? "Fix & Re-upload KYC & Bank Documents"
                : "Upload KYC & Bank Documents Now"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Part 2: Bank & Payout Details Summary (Shown when Bank details are added in KYC) */}
        {vendor?.bankAccountNumber ? (
          <View style={styles.bankCard}>
            <View style={styles.bankHeaderRow}>
              <View style={styles.bankIconCircle}>
                <Landmark size={20} color="#052A51" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bankCardTitle}>Bank & Payout Account</Text>
                <Text style={styles.bankCardSub}>Verified payout destination for fulfilled orders</Text>
              </View>
              <TouchableOpacity onPress={() => handleOpenEdit("kyc")} style={styles.bankEditPill}>
                <Edit2 size={12} color="#052A51" />
                <Text style={styles.bankEditPillText}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bankDetailsGrid}>
              <View style={styles.bankDetailItem}>
                <Text style={styles.bankDetailLabel}>ACCOUNT HOLDER</Text>
                <Text style={styles.bankDetailVal}>{vendor?.bankAccountHolder || "—"}</Text>
              </View>

              <View style={styles.bankDetailItem}>
                <Text style={styles.bankDetailLabel}>BANK NAME</Text>
                <Text style={styles.bankDetailVal}>{vendor?.bankName || "—"}</Text>
              </View>

              <View style={styles.bankDetailItem}>
                <Text style={styles.bankDetailLabel}>ACCOUNT NUMBER</Text>
                <Text style={[styles.bankDetailVal, { fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", fontWeight: "800" }]}>
                  •••• •••• {String(vendor.bankAccountNumber).slice(-4)}
                </Text>
              </View>

              <View style={styles.bankDetailItem}>
                <Text style={styles.bankDetailLabel}>IFSC CODE / UPI ID</Text>
                <Text style={[styles.bankDetailVal, { color: "#052A51", fontWeight: "800" }]}>
                  {vendor?.bankIfscCode || vendor?.bankUpiId || "—"}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Actions & Push Testing Menu */}
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={handleTestPushNotification} disabled={testingPush}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: "#FEF3C7" }]}>
                <Bell size={18} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuText}>Test Lock-Screen Push Notification</Text>
                <Text style={styles.menuSub}>Verify new order push alerts arrive on device</Text>
              </View>
            </View>
            {testingPush ? (
              <ActivityIndicator size="small" color="#D97706" />
            ) : (
              <ChevronRight size={18} color={COLORS.textTertiary} />
            )}
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/(vendor)/support" as any)}
            activeOpacity={0.85}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: "#EFF6FF" }]}>
                <Headphones size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuText}>{t("common.help") || t("account.helpSupport") || "24/7 Vendor Partner Support"}</Text>
                <Text style={styles.menuSub}>Helpline, WhatsApp chat, FAQs & tickets</Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          {/* Language Selector */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setLangModalOpen(true)}
            activeOpacity={0.85}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: "#F0FDF4" }]}>
                <Globe size={18} color={COLORS.accentGreen} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuText}>{t("nav.language") || "Language / भाषा"}</Text>
                <Text style={styles.menuSub}>
                  {currentLangObj ? `${currentLangObj.nativeName} (${currentLangObj.name})` : "English"}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.85}>
          <LogOut size={16} color={COLORS.error} />
          <Text style={styles.logoutText}>Log Out Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Store Profile & KYC Modal */}
      <Modal
        visible={editModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Edit Account & KYC</Text>
              <Text style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                Update store profile, banking information, or KYC documents
              </Text>
            </View>
            <TouchableOpacity onPress={() => setEditModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Tab Bar in Modal (Unified: Store Info & KYC + Bank) */}
          <View style={styles.modalTabBar}>
            <TouchableOpacity
              style={[styles.modalTabBtn, modalTab === "store" && styles.modalTabBtnActive]}
              onPress={() => setModalTab("store")}
            >
              <Store size={14} color={modalTab === "store" ? "#052A51" : "#64748B"} />
              <Text style={[styles.modalTabText, modalTab === "store" && styles.modalTabTextActive]}>
                Store Info
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalTabBtn, (modalTab === "kyc" || modalTab === "bank") && styles.modalTabBtnActive]}
              onPress={() => setModalTab("kyc")}
            >
              <ShieldCheck size={14} color={(modalTab === "kyc" || modalTab === "bank") ? "#052A51" : "#64748B"} />
              <Text style={[styles.modalTabText, (modalTab === "kyc" || modalTab === "bank") && styles.modalTabTextActive]}>
                KYC & Bank Details
              </Text>
              {isKycVerified ? (
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#16A34A" }} />
              ) : (
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#F26522" }} />
              )}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* TAB 1: STORE INFO */}
            {modalTab === "store" && (
              <>
                <View style={[styles.modalCard, { alignItems: "center", paddingVertical: 18 }]}>
                  <TouchableOpacity
                    style={styles.storeLogoWrapper}
                    onPress={handlePickAndUploadLogo}
                    disabled={uploadingLogo}
                    activeOpacity={0.85}
                  >
                    {uploadingLogo ? (
                      <View style={styles.storeIconCircle}>
                        <ActivityIndicator size="small" color={COLORS.accentOrange} />
                      </View>
                    ) : vendor?.logo || storeLogo || user?.avatar ? (
                      <Image
                        source={{ uri: (vendor?.logo || storeLogo || user?.avatar || "") as string }}
                        style={styles.storeLogoImg}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={styles.storeIconCircle}>
                        <Building2 size={32} color={COLORS.accentOrange} />
                      </View>
                    )}
                    <View style={styles.cameraIconBadge}>
                      <Camera size={12} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      marginTop: 8,
                      backgroundColor: "#FFF7ED",
                      borderWidth: 1,
                      borderColor: "#FED7AA",
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      borderRadius: 8,
                    }}
                    onPress={handlePickAndUploadLogo}
                    disabled={uploadingLogo}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "800", color: COLORS.accentOrange }}>
                      {vendor?.logo || storeLogo || user?.avatar ? "Change Store Logo" : "Upload Store Logo"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalCard}>
                  <Text style={styles.inputLabel}>Store / Business Name:</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={editStoreName}
                    onChangeText={setEditStoreName}
                    placeholder="My Store / Tile Company"
                    placeholderTextColor={COLORS.textTertiary}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>Contact Phone:</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    keyboardType="phone-pad"
                    maxLength={10}
                    placeholder="10-digit phone number"
                    placeholderTextColor={COLORS.textTertiary}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>Contact Email:</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={editEmail}
                    onChangeText={setEditEmail}
                    keyboardType="email-address"
                    placeholder="vendor@company.com"
                    placeholderTextColor={COLORS.textTertiary}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>Warehouse / Store Address:</Text>
                  <TextInput
                    style={[styles.inputBox, { height: 60, textAlignVertical: "top", paddingTop: 8 }]}
                    multiline
                    value={editAddress}
                    onChangeText={setEditAddress}
                    placeholder="Full physical storefront or pickup warehouse address..."
                    placeholderTextColor={COLORS.textTertiary}
                  />

                  {/* Shop GPS Location & Map Picker Section */}
                  <View style={{ marginTop: 16, padding: 14, backgroundColor: "#F8FAFC", borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <Text style={{ fontSize: 13, fontWeight: "800", color: COLORS.primaryDark }}>📍 Store Dispatch GPS</Text>
                      {editLat && editLng ? (
                        <TouchableOpacity
                          onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${editLat},${editLng}`)}
                        >
                          <Text style={{ fontSize: 11, fontWeight: "800", color: COLORS.accentOrange }}>Google Maps ↗</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <Text style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 12, lineHeight: 16 }}>
                      Auto-detect with phone GPS or pick on map. Used for customer routing and nearest-store pickup.
                    </Text>

                    <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          backgroundColor: "#ECFDF5",
                          borderWidth: 1,
                          borderColor: "#A7F3D0",
                          borderRadius: 10,
                          paddingVertical: 10,
                          paddingHorizontal: 8,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                        onPress={handleAutoDetectGPS}
                        disabled={fetchingGps}
                        activeOpacity={0.8}
                      >
                        {fetchingGps ? (
                          <ActivityIndicator size="small" color="#059669" />
                        ) : (
                          <Crosshair size={16} color="#059669" />
                        )}
                        <Text style={{ fontSize: 12, fontWeight: "800", color: "#065F46" }}>
                          {fetchingGps ? "Detecting..." : "Auto-Detect GPS"}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={{
                          flex: 1,
                          backgroundColor: COLORS.primary,
                          borderRadius: 10,
                          paddingVertical: 10,
                          paddingHorizontal: 8,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                        onPress={() => setMapModalOpen(true)}
                        activeOpacity={0.85}
                      >
                        <Navigation size={15} color="#FFFFFF" />
                        <Text style={{ fontSize: 12, fontWeight: "800", color: "#FFFFFF" }}>
                          Pick on Map
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {editLat && editLng ? (
                      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F0FDF4", padding: 8, borderRadius: 8, borderWidth: 1, borderColor: "#BBF7D0", marginBottom: 10, gap: 6 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#16A34A" }} />
                        <Text style={{ fontSize: 11, fontWeight: "700", color: "#166534", flex: 1 }}>
                          GPS Pinned: {Number(editLat).toFixed(4)}, {Number(editLng).toFixed(4)}
                        </Text>
                      </View>
                    ) : (
                      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#FEF3C7", padding: 8, borderRadius: 8, borderWidth: 1, borderColor: "#FDE68A", marginBottom: 10, gap: 6 }}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: "#92400E", flex: 1 }}>
                          ⚠️ No GPS pin set. Auto-detect or search on map.
                        </Text>
                      </View>
                    )}

                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 2 }}>Latitude</Text>
                        <TextInput
                          style={[styles.inputBox, { height: 38, fontSize: 12 }]}
                          value={editLat}
                          onChangeText={setEditLat}
                          placeholder="e.g. 12.9716"
                          keyboardType="numeric"
                          placeholderTextColor={COLORS.textTertiary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 2 }}>Longitude</Text>
                        <TextInput
                          style={[styles.inputBox, { height: 38, fontSize: 12 }]}
                          value={editLng}
                          onChangeText={setEditLng}
                          placeholder="e.g. 77.5946"
                          keyboardType="numeric"
                          placeholderTextColor={COLORS.textTertiary}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Auto-Accept Toggle */}
                  <TouchableOpacity
                    style={{
                      marginTop: 12,
                      padding: 12,
                      backgroundColor: editAutoAccept ? "#F0FDF4" : "#F8FAFC",
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: editAutoAccept ? "#BBF7D0" : "#E2E8F0",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                    onPress={() => setEditAutoAccept(!editAutoAccept)}
                    activeOpacity={0.85}
                  >
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={{ fontSize: 13, fontWeight: "800", color: editAutoAccept ? "#166534" : COLORS.primaryDark }}>
                        ⚡ Auto-Accept Orders
                      </Text>
                      <Text style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2 }}>
                        Instantly accepts incoming customer orders.
                      </Text>
                    </View>
                    <View
                      style={{
                        width: 44,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: editAutoAccept ? COLORS.accentGreen : "#CBD5E1",
                        justifyContent: "center",
                        paddingHorizontal: 2,
                        alignItems: editAutoAccept ? "flex-end" : "flex-start",
                      }}
                    >
                      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#FFFFFF" }} />
                    </View>
                  </TouchableOpacity>

                  <Text style={[styles.inputLabel, { marginTop: 16 }]}>Logistics & Fulfillment Method:</Text>
                  
                  <TouchableOpacity
                    style={[
                      styles.deliveryRadioCard,
                      editDeliveryMethod === "self" && styles.deliveryRadioCardActive,
                    ]}
                    onPress={() => setEditDeliveryMethod("self")}
                    activeOpacity={0.85}
                  >
                    <View style={styles.radioTopRow}>
                      <View style={[styles.radioButton, editDeliveryMethod === "self" && styles.radioButtonActive]}>
                        {editDeliveryMethod === "self" ? <View style={styles.radioInnerDot} /> : null}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.deliveryRadioTitle, editDeliveryMethod === "self" && styles.deliveryRadioTitleActive]}>
                          🚛 Self-Delivery (Manual)
                        </Text>
                        <Text style={styles.deliveryRadioSubtitle}>
                          You arrange own transport and delivery to customer doorstep.
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.deliveryRadioCard,
                      editDeliveryMethod === "platform" && styles.deliveryRadioCardActive,
                      { marginTop: 10 },
                    ]}
                    onPress={() => setEditDeliveryMethod("platform")}
                    activeOpacity={0.85}
                  >
                    <View style={styles.radioTopRow}>
                      <View style={[styles.radioButton, editDeliveryMethod === "platform" && styles.radioButtonActive]}>
                        {editDeliveryMethod === "platform" ? <View style={styles.radioInnerDot} /> : null}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.deliveryRadioTitle, editDeliveryMethod === "platform" && styles.deliveryRadioTitleActive]}>
                          ⚡ Intrihub Platform Logistics (Auto)
                        </Text>
                        <Text style={styles.deliveryRadioSubtitle}>
                          Intrihub logistics partner handles pickup from your warehouse.
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              </>
            )}



            {/* TAB 3: KYC & LEGAL DOCUMENTS */}
            {(modalTab === "kyc" || modalTab === "bank") && (
              <View style={styles.modalCard}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#DCFCE7", alignItems: "center", justifyContent: "center" }}>
                    <FileText size={18} color="#15803D" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "900", color: "#052A51" }}>Store KYC Verification</Text>
                    <Text style={{ fontSize: 11, color: "#64748B" }}>
                      Upload Aadhaar, PAN, Shop photo, GST and Bank Account Details
                    </Text>
                  </View>
                </View>

                {/* Status Indicator */}
                <View
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    marginBottom: 16,
                    backgroundColor: isKycVerified ? "#DCFCE7" : isKycSubmitted ? "#DBEAFE" : isKycRejected ? "#FEE2E2" : "#FEF3C7",
                    borderWidth: 1,
                    borderColor: isKycVerified ? "#86EFAC" : isKycSubmitted ? "#93C5FD" : isKycRejected ? "#FCA5A5" : "#FDE68A",
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "800", color: isKycVerified ? "#166534" : isKycSubmitted ? "#1E40AF" : isKycRejected ? "#991B1B" : "#92400E" }}>
                    Current KYC Status: {isKycVerified ? "VERIFIED ✓" : isKycSubmitted ? "UNDER REVIEW ⏳" : isKycRejected ? "REJECTED ❌" : "INCOMPLETE 📋"}
                  </Text>
                  {vendor?.kycNotes ? (
                    <Text style={{ fontSize: 11, color: "#7F1D1D", marginTop: 4 }}>
                      Admin Notes: {vendor.kycNotes}
                    </Text>
                  ) : null}
                </View>

                {/* 1. PAN Card Section */}
                <View style={styles.kycSectionBox}>
                  <View style={styles.kycSectionHeader}>
                    <Text style={styles.kycSectionTitle}>1. PAN Card (Permanent Account Number)</Text>
                    {editPanDocUrl ? (
                      <View style={styles.docBadgeGreen}>
                        <Text style={styles.docBadgeGreenText}>Uploaded ✓</Text>
                      </View>
                    ) : (
                      <View style={styles.docBadgeAmber}>
                        <Text style={styles.docBadgeAmberText}>Required</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.inputLabel}>PAN Number (10 alphanumeric characters):</Text>
                  <TextInput
                    style={[styles.inputBox, { textTransform: "uppercase" }]}
                    value={editPanNumber}
                    onChangeText={(v) => setEditPanNumber(v.toUpperCase())}
                    maxLength={10}
                    placeholder="e.g. ABCDE1234F"
                    placeholderTextColor={COLORS.textTertiary}
                  />

                  <View style={styles.docActionRow}>
                    <TouchableOpacity
                      style={styles.uploadDocBtn}
                      onPress={() => handlePickAndUploadKycDoc("pan", "gallery")}
                      disabled={uploadingDoc === "pan"}
                    >
                      {uploadingDoc === "pan" ? (
                        <ActivityIndicator size="small" color="#052A51" />
                      ) : (
                        <>
                          <Camera size={13} color="#052A51" />
                          <Text style={styles.uploadDocBtnText}>Upload Photo</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.uploadDocBtn}
                      onPress={() => handlePickAndUploadKycDoc("pan", "document")}
                      disabled={uploadingDoc === "pan"}
                    >
                      <FileText size={13} color="#052A51" />
                      <Text style={styles.uploadDocBtnText}>Upload PDF/Doc</Text>
                    </TouchableOpacity>

                    {editPanDocUrl ? (
                      <TouchableOpacity
                        style={styles.viewDocBtn}
                        onPress={() => setPreviewDocModal({ url: editPanDocUrl, title: "PAN Card Document" })}
                      >
                        <Eye size={13} color="#15803D" />
                        <Text style={styles.viewDocBtnText}>View</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                {/* 2. Aadhaar Card Section */}
                <View style={[styles.kycSectionBox, { marginTop: 14 }]}>
                  <View style={styles.kycSectionHeader}>
                    <Text style={styles.kycSectionTitle}>2. Aadhaar Card (12 Digits)</Text>
                    {editAadharDocUrl ? (
                      <View style={styles.docBadgeGreen}>
                        <Text style={styles.docBadgeGreenText}>Uploaded ✓</Text>
                      </View>
                    ) : (
                      <View style={styles.docBadgeAmber}>
                        <Text style={styles.docBadgeAmberText}>Required</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.inputLabel}>Aadhaar Number:</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={editAadharNumber}
                    onChangeText={setEditAadharNumber}
                    maxLength={12}
                    keyboardType="numeric"
                    placeholder="e.g. 5432 1098 7654"
                    placeholderTextColor={COLORS.textTertiary}
                  />

                  <View style={styles.docActionRow}>
                    <TouchableOpacity
                      style={styles.uploadDocBtn}
                      onPress={() => handlePickAndUploadKycDoc("aadhar", "gallery")}
                      disabled={uploadingDoc === "aadhar"}
                    >
                      {uploadingDoc === "aadhar" ? (
                        <ActivityIndicator size="small" color="#052A51" />
                      ) : (
                        <>
                          <Camera size={13} color="#052A51" />
                          <Text style={styles.uploadDocBtnText}>Upload Photo</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.uploadDocBtn}
                      onPress={() => handlePickAndUploadKycDoc("aadhar", "document")}
                      disabled={uploadingDoc === "aadhar"}
                    >
                      <FileText size={13} color="#052A51" />
                      <Text style={styles.uploadDocBtnText}>Upload PDF/Doc</Text>
                    </TouchableOpacity>

                    {editAadharDocUrl ? (
                      <TouchableOpacity
                        style={styles.viewDocBtn}
                        onPress={() => setPreviewDocModal({ url: editAadharDocUrl, title: "Aadhaar Card Document" })}
                      >
                        <Eye size={13} color="#15803D" />
                        <Text style={styles.viewDocBtnText}>View</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                {/* 3. Shopfront / Store Photo Section */}
                <View style={[styles.kycSectionBox, { marginTop: 14 }]}>
                  <View style={styles.kycSectionHeader}>
                    <Text style={styles.kycSectionTitle}>3. Physical Store / Shop Photo</Text>
                    {editShopPhotoUrl ? (
                      <View style={styles.docBadgeGreen}>
                        <Text style={styles.docBadgeGreenText}>Uploaded ✓</Text>
                      </View>
                    ) : (
                      <View style={styles.docBadgeAmber}>
                        <Text style={styles.docBadgeAmberText}>Required</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 11, color: "#64748B", marginBottom: 8 }}>
                    Capture or select a clear photo of your storefront, signboard, or warehouse dispatch area.
                  </Text>

                  {editShopPhotoUrl ? (
                    <View style={{ marginBottom: 10, position: "relative" }}>
                      <Image
                        source={{ uri: editShopPhotoUrl }}
                        style={{ width: "100%", height: 140, borderRadius: 10, borderWidth: 1, borderColor: "#CBD5E1" }}
                        contentFit="cover"
                      />
                    </View>
                  ) : null}

                  <View style={styles.docActionRow}>
                    <TouchableOpacity
                      style={styles.uploadDocBtn}
                      onPress={() => handlePickAndUploadKycDoc("shop", "camera")}
                      disabled={uploadingDoc === "shop"}
                    >
                      {uploadingDoc === "shop" ? (
                        <ActivityIndicator size="small" color="#052A51" />
                      ) : (
                        <>
                          <Camera size={13} color="#052A51" />
                          <Text style={styles.uploadDocBtnText}>Take Camera Photo</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.uploadDocBtn}
                      onPress={() => handlePickAndUploadKycDoc("shop", "gallery")}
                      disabled={uploadingDoc === "shop"}
                    >
                      <Camera size={13} color="#052A51" />
                      <Text style={styles.uploadDocBtnText}>Pick From Gallery</Text>
                    </TouchableOpacity>

                    {editShopPhotoUrl ? (
                      <TouchableOpacity
                        style={styles.viewDocBtn}
                        onPress={() => setPreviewDocModal({ url: editShopPhotoUrl, title: "Storefront Photo" })}
                      >
                        <Eye size={13} color="#15803D" />
                        <Text style={styles.viewDocBtnText}>View</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                {/* 4. GSTIN Document Section */}
                <View style={[styles.kycSectionBox, { marginTop: 14 }]}>
                  <View style={styles.kycSectionHeader}>
                    <Text style={styles.kycSectionTitle}>4. GSTIN Certificate (If GST Registered)</Text>
                    {editGstDocUrl ? (
                      <View style={styles.docBadgeGreen}>
                        <Text style={styles.docBadgeGreenText}>Uploaded ✓</Text>
                      </View>
                    ) : (
                      <View style={[styles.docBadgeAmber, { backgroundColor: "#F1F5F9", borderColor: "#CBD5E1" }]}>
                        <Text style={{ fontSize: 10, fontWeight: "700", color: "#64748B" }}>Optional</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.inputLabel}>GST Number (15 alphanumeric):</Text>
                  <TextInput
                    style={[styles.inputBox, { textTransform: "uppercase" }]}
                    value={editGstNumber}
                    onChangeText={(v) => setEditGstNumber(v.toUpperCase())}
                    maxLength={15}
                    placeholder="e.g. 29AAAAA0000A1Z5"
                    placeholderTextColor={COLORS.textTertiary}
                  />

                  <View style={styles.docActionRow}>
                    <TouchableOpacity
                      style={styles.uploadDocBtn}
                      onPress={() => handlePickAndUploadKycDoc("gst", "gallery")}
                      disabled={uploadingDoc === "gst"}
                    >
                      {uploadingDoc === "gst" ? (
                        <ActivityIndicator size="small" color="#052A51" />
                      ) : (
                        <>
                          <Camera size={13} color="#052A51" />
                          <Text style={styles.uploadDocBtnText}>Upload Photo</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.uploadDocBtn}
                      onPress={() => handlePickAndUploadKycDoc("gst", "document")}
                      disabled={uploadingDoc === "gst"}
                    >
                      <FileText size={13} color="#052A51" />
                      <Text style={styles.uploadDocBtnText}>Upload PDF/Doc</Text>
                    </TouchableOpacity>

                    {editGstDocUrl ? (
                      <TouchableOpacity
                        style={styles.viewDocBtn}
                        onPress={() => setPreviewDocModal({ url: editGstDocUrl, title: "GST Certificate" })}
                      >
                        <Eye size={13} color="#15803D" />
                        <Text style={styles.viewDocBtnText}>View</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                {/* 5. Bank Account & Payout Details Section */}
                <View style={[styles.kycSectionBox, { marginTop: 14 }]}>
                  <View style={styles.kycSectionHeader}>
                    <Text style={styles.kycSectionTitle}>5. Bank & Payout Account</Text>
                    {editBankAccount ? (
                      <View style={styles.docBadgeGreen}>
                        <Text style={styles.docBadgeGreenText}>Added ✓</Text>
                      </View>
                    ) : (
                      <View style={styles.docBadgeAmber}>
                        <Text style={styles.docBadgeAmberText}>Required for Payouts</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 11, color: "#64748B", marginBottom: 8 }}>
                    Payouts from all fulfilled orders will be credited to this verified account.
                  </Text>

                  <Text style={styles.inputLabel}>Account Holder Name (as in bank):</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={editBankHolder}
                    onChangeText={setEditBankHolder}
                    placeholder="e.g. Ramesh Kumar / Intrihub Store LLP"
                    placeholderTextColor={COLORS.textTertiary}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Bank Name:</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={editBankName}
                    onChangeText={setEditBankName}
                    placeholder="e.g. HDFC Bank, State Bank of India, ICICI"
                    placeholderTextColor={COLORS.textTertiary}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Account Number:</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={editBankAccount}
                    onChangeText={setEditBankAccount}
                    keyboardType="numeric"
                    placeholder="Enter full bank account number"
                    placeholderTextColor={COLORS.textTertiary}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Bank IFSC Code:</Text>
                  <TextInput
                    style={[styles.inputBox, { textTransform: "uppercase" }]}
                    value={editBankIfsc}
                    onChangeText={(v) => setEditBankIfsc(v.toUpperCase())}
                    placeholder="e.g. HDFC0001234"
                    maxLength={11}
                    placeholderTextColor={COLORS.textTertiary}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>UPI ID / VPA (Optional):</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={editBankUpi}
                    onChangeText={setEditBankUpi}
                    placeholder="e.g. merchant@okhdfcbank"
                    placeholderTextColor={COLORS.textTertiary}
                  />

                  <View style={{ marginTop: 12, padding: 10, backgroundColor: "#F0FDF4", borderRadius: 8, borderWidth: 1, borderColor: "#BBF7D0", flexDirection: "row", gap: 8, alignItems: "center" }}>
                    <ShieldCheck size={15} color="#166534" />
                    <Text style={{ fontSize: 11, color: "#166534", flex: 1, lineHeight: 15 }}>
                      Bank details are encrypted and securely used only for automated order payout settlements.
                    </Text>
                  </View>
                </View>

                {/* 6. Cancelled Cheque / Bank Passbook Photo */}
                <View style={[styles.kycSectionBox, { marginTop: 14 }]}>
                  <View style={styles.kycSectionHeader}>
                    <Text style={styles.kycSectionTitle}>6. Cancelled Cheque / Passbook Copy</Text>
                    {editChequeDocUrl ? (
                      <View style={styles.docBadgeGreen}>
                        <Text style={styles.docBadgeGreenText}>Uploaded ✓</Text>
                      </View>
                    ) : (
                      <View style={[styles.docBadgeAmber, { backgroundColor: "#F1F5F9", borderColor: "#CBD5E1" }]}>
                        <Text style={{ fontSize: 10, fontWeight: "700", color: "#64748B" }}>Optional</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.docActionRow}>
                    <TouchableOpacity
                      style={styles.uploadDocBtn}
                      onPress={() => handlePickAndUploadKycDoc("cheque", "gallery")}
                      disabled={uploadingDoc === "cheque"}
                    >
                      {uploadingDoc === "cheque" ? (
                        <ActivityIndicator size="small" color="#052A51" />
                      ) : (
                        <>
                          <Camera size={13} color="#052A51" />
                          <Text style={styles.uploadDocBtnText}>Upload Photo</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.uploadDocBtn}
                      onPress={() => handlePickAndUploadKycDoc("cheque", "document")}
                      disabled={uploadingDoc === "cheque"}
                    >
                      <FileText size={13} color="#052A51" />
                      <Text style={styles.uploadDocBtnText}>Upload PDF/Doc</Text>
                    </TouchableOpacity>

                    {editChequeDocUrl ? (
                      <TouchableOpacity
                        style={styles.viewDocBtn}
                        onPress={() => setPreviewDocModal({ url: editChequeDocUrl, title: "Bank Cheque / Passbook Proof" })}
                      >
                        <Eye size={13} color="#15803D" />
                        <Text style={styles.viewDocBtnText}>View</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>
            )}

            {/* Bottom Actions */}
            <View style={{ gap: 10, marginTop: 8, marginBottom: 30 }}>
              {(modalTab === "kyc" || modalTab === "bank") ? (
                <TouchableOpacity
                  style={[styles.saveProfileBtn, { backgroundColor: "#15803D" }]}
                  onPress={() => handleSaveProfile(true)}
                  disabled={submittingKyc || saving}
                >
                  {submittingKyc ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <ShieldCheck size={18} color="#FFFFFF" />
                      <Text style={styles.saveProfileBtnText}>Submit KYC For Super Admin Verification 🚀</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={styles.saveProfileBtn}
                onPress={() => handleSaveProfile(false)}
                disabled={saving || submittingKyc}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <CheckCircle2 size={18} color="#FFFFFF" />
                    <Text style={styles.saveProfileBtnText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* In-app Document Preview Modal */}
      <Modal
        visible={Boolean(previewDocModal)}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setPreviewDocModal(null)}
      >
        <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, backgroundColor: "#1E293B" }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#FFFFFF", flex: 1 }} numberOfLines={1}>
              {previewDocModal?.title}
            </Text>
            <TouchableOpacity onPress={() => setPreviewDocModal(null)} style={{ padding: 6 }}>
              <X size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
            {previewDocModal?.url?.toLowerCase()?.includes(".pdf") ? (
              <View style={{ alignItems: "center", padding: 24, backgroundColor: "#1E293B", borderRadius: 16 }}>
                <FileText size={64} color="#38BDF8" />
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF", marginTop: 12 }}>
                  PDF Document Uploaded
                </Text>
                <TouchableOpacity
                  style={{ marginTop: 16, backgroundColor: "#0284C7", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}
                  onPress={() => previewDocModal?.url && Linking.openURL(previewDocModal.url)}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 13 }}>Open PDF Document ↗</Text>
                </TouchableOpacity>
              </View>
            ) : previewDocModal?.url ? (
              <Image
                source={{ uri: previewDocModal.url }}
                style={{ width: "100%", height: "80%", borderRadius: 12 }}
                contentFit="contain"
              />
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Language Modal */}
      <LanguageModal
        visible={langModalOpen}
        onClose={() => setLangModalOpen(false)}
      />

      {/* Map Picker Modal */}
      <MapPickerModal
        visible={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        initialLat={editLat ? Number(editLat) : undefined}
        initialLng={editLng ? Number(editLng) : undefined}
        onConfirmLocation={handleLocationPicked}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primaryDark,
    paddingTop: 50,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.textWhite,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
  },
  headerLogo: {
    width: 42,
    height: 42,
    borderRadius: 8,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  storeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  storeLogoWrapper: {
    position: "relative",
    marginBottom: SPACING.xs,
  },
  storeLogoImg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "#F26522",
  },
  cameraIconBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#F26522",
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  storeIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(242, 101, 34, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  storeName: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.primary,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    marginTop: SPACING.xs,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.accentGreen,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 4,
    gap: SPACING.md,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "600",
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FFEDD5",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    marginTop: 14,
  },
  editProfileBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.accentOrange,
  },

  /* KYC Banner Card Styles */
  kycCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1.5,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  kycCardVerified: {
    backgroundColor: "#F0FDF4",
    borderColor: "#86EFAC",
  },
  kycCardSubmitted: {
    backgroundColor: "#EFF6FF",
    borderColor: "#93C5FD",
  },
  kycCardRejected: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
  },
  kycCardPending: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  kycTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  kycIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  kycTitle: {
    fontSize: 14,
    fontWeight: "900",
  },
  kycSubtitle: {
    fontSize: 12,
    color: "#475569",
    marginTop: 4,
    lineHeight: 17,
  },
  kycChecklistRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.06)",
  },
  kycCheckItem: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  kycCheckItemGreen: {
    backgroundColor: "#DCFCE7",
    borderColor: "#BBF7D0",
  },
  kycCheckItemGray: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
  },
  kycCheckText: {
    fontSize: 10,
    fontWeight: "800",
  },
  kycActionBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  kycActionBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  /* Bank Details Card Styles */
  bankCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  bankHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 10,
  },
  bankIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  bankCardTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#052A51",
  },
  bankCardSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  bankEditPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  bankEditPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#052A51",
  },
  bankDetailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 12,
  },
  bankDetailItem: {
    width: "48%",
  },
  bankDetailLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  bankDetailVal: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 2,
  },
  bankEmptyBox: {
    marginTop: 10,
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FEF3C7",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  bankEmptyText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#92400E",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  addBankBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#052A51",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBankBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  menuCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.md,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    flex: 1,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  menuSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: "rgba(220, 38, 38, 0.3)",
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.error,
  },

  /* Modal Styles */
  modalContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#052A51",
  },
  closeBtn: {
    padding: 6,
  },
  modalTabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  modalTabBtnActive: {
    borderBottomColor: "#052A51",
  },
  modalTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  modalTabTextActive: {
    color: "#052A51",
    fontWeight: "900",
  },
  modalContent: {
    padding: 16,
    gap: 16,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  inputBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: COLORS.text,
  },
  deliveryRadioCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 12,
  },
  deliveryRadioCardActive: {
    borderColor: "#052A51",
    backgroundColor: "#F0F7FF",
  },
  radioTopRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  radioButtonActive: {
    borderColor: "#052A51",
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#052A51",
  },
  deliveryRadioTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  deliveryRadioTitleActive: {
    color: "#052A51",
    fontWeight: "800",
  },
  deliveryRadioSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
    lineHeight: 16,
  },

  /* KYC Document Box Styles */
  kycSectionBox: {
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  kycSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  kycSectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#052A51",
    flex: 1,
  },
  docBadgeGreen: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  docBadgeGreenText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#15803D",
  },
  docBadgeAmber: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  docBadgeAmberText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#B45309",
  },
  docActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  uploadDocBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
  },
  uploadDocBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#052A51",
  },
  viewDocBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 8,
  },
  viewDocBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#15803D",
  },

  saveProfileBtn: {
    backgroundColor: "#F26522",
    height: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveProfileBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});
