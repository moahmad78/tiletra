import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import {
  X,
  Star,
  Camera,
  Upload,
  ShieldCheck,
  Film,
  Trash2,
} from "lucide-react-native";
import { createReview, uploadReviewMedia, checkReviewEligibility } from "../api/reviews";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../constants/theme";

interface WriteReviewModalProps {
  visible: boolean;
  productId: string;
  productName: string;
  orderId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function WriteReviewModal({
  visible,
  productId,
  productName,
  orderId: initialOrderId,
  onClose,
  onSuccess,
}: WriteReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mediaFiles, setMediaFiles] = useState<Array<{ uri: string; name: string; type: string; isVideo: boolean }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("");

  const handlePickMedia = async () => {
    if (mediaFiles.length >= 5) {
      Alert.alert("Limit Reached", "You can upload a maximum of 5 photos or videos.");
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Camera roll permission is needed to upload photos/videos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5 - mediaFiles.length,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newFiles = result.assets.map((asset) => {
          const isVideo = asset.type === "video" || asset.uri.toLowerCase().endsWith(".mp4") || asset.uri.toLowerCase().endsWith(".mov");
          const ext = isVideo ? "mp4" : "jpg";
          const mimeType = isVideo ? "video/mp4" : "image/jpeg";
          const fileName = asset.fileName || `review_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;

          return {
            uri: asset.uri,
            name: fileName,
            type: mimeType,
            isVideo,
          };
        });

        setMediaFiles((prev) => [...prev, ...newFiles].slice(0, 5));
      }
    } catch (err: any) {
      console.warn("Media picker error:", err);
      Alert.alert("Error", "Could not pick photos/videos.");
    }
  };

  const handleTakePhoto = async () => {
    if (mediaFiles.length >= 5) {
      Alert.alert("Limit Reached", "You can upload a maximum of 5 photos or videos.");
      return;
    }

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Camera permission is needed to take photos.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = `camera_${Date.now()}.jpg`;

        setMediaFiles((prev) => [
          ...prev,
          {
            uri: asset.uri,
            name: fileName,
            type: "image/jpeg",
            isVideo: false,
          },
        ].slice(0, 5));
      }
    } catch (err: any) {
      console.warn("Camera error:", err);
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!body.trim()) {
      Alert.alert("Required", "Please write a few words about the product.");
      return;
    }

    setSubmitting(true);
    setStatusText("Verifying delivered order...");

    try {
      let targetOrderId = initialOrderId;

      if (!targetOrderId) {
        const elig = await checkReviewEligibility(productId);
        if (!elig.success || !elig.eligible || elig.eligibleOrders.length === 0) {
          Alert.alert("Not Eligible", "Reviews can only be submitted for delivered orders you have received.");
          setSubmitting(false);
          return;
        }
        targetOrderId = elig.eligibleOrders[0].id;
      }

      setStatusText("Publishing review...");
      const res = await createReview({
        productId,
        orderId: targetOrderId,
        rating,
        title: title.trim() || undefined,
        body: body.trim(),
      });

      if (!res.success || !res.review) {
        Alert.alert("Submission Failed", res.error || "Could not publish review.");
        setSubmitting(false);
        return;
      }

      const reviewId = res.review.id;

      if (mediaFiles.length > 0) {
        setStatusText(`Uploading ${mediaFiles.length} media file(s)...`);
        await uploadReviewMedia(reviewId, mediaFiles);
      }

      Alert.alert("Review Published!", "Thank you! Your verified review has been published.");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error("Create review error:", err);
      Alert.alert("Error", err?.response?.data?.error || err?.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
      setStatusText("");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Write a Review</Text>
            <Text style={styles.productName} numberOfLines={1}>
              {productName}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={submitting}>
            <X size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Star Rating Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>OVERALL RATING *</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starTouch}
                  activeOpacity={0.7}
                >
                  <Star
                    size={36}
                    color={star <= rating ? "#F59E0B" : "#CBD5E1"}
                    fill={star <= rating ? "#F59E0B" : "none"}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingDescriptor}>
              {rating === 5
                ? "5 / 5 — Excellent"
                : rating === 4
                ? "4 / 5 — Very Good"
                : rating === 3
                ? "3 / 5 — Average"
                : rating === 2
                ? "2 / 5 — Disappointed"
                : "1 / 5 — Poor"}
            </Text>
          </View>

          {/* Title Input */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>REVIEW TITLE (OPTIONAL)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Excellent tile finish & quick delivery!"
              placeholderTextColor={COLORS.textMuted}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Body Input */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>YOUR REVIEW *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Share details about material quality, finish, transit safety, and installation results..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={4}
              value={body}
              onChangeText={setBody}
            />
          </View>

          {/* Media Attachments */}
          <View style={styles.section}>
            <View style={styles.mediaLabelRow}>
              <Text style={styles.sectionLabel}>ADD PHOTOS & VIDEOS (MAX 5)</Text>
              <Text style={styles.mediaCountText}>{mediaFiles.length} / 5</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaRow}>
              {mediaFiles.map((m, idx) => (
                <View key={idx} style={styles.mediaThumbWrapper}>
                  {m.isVideo ? (
                    <View style={styles.videoPlaceholder}>
                      <Film size={22} color="#F26522" />
                      <Text style={styles.videoLabel}>Video</Text>
                    </View>
                  ) : (
                    <Image source={{ uri: m.uri }} style={styles.mediaThumb} contentFit="cover" />
                  )}
                  <TouchableOpacity
                    style={styles.mediaRemoveBtn}
                    onPress={() => handleRemoveMedia(idx)}
                  >
                    <X size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}

              {mediaFiles.length < 5 && (
                <View style={styles.mediaActionsRow}>
                  <TouchableOpacity
                    style={styles.addMediaBtn}
                    onPress={handlePickMedia}
                    activeOpacity={0.8}
                  >
                    <Upload size={18} color={COLORS.primary} />
                    <Text style={styles.addMediaBtnText}>Gallery</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.addMediaBtn}
                    onPress={handleTakePhoto}
                    activeOpacity={0.8}
                  >
                    <Camera size={18} color={COLORS.primary} />
                    <Text style={styles.addMediaBtnText}>Camera</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>

          {/* Verified Badge Info */}
          <View style={styles.verifiedBanner}>
            <ShieldCheck size={18} color="#059669" />
            <Text style={styles.verifiedBannerText}>
              Verified Purchase: This review is verified through your delivered order.
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <View style={styles.submittingRow}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.submitBtnText}>{statusText || "Publishing..."}</Text>
              </View>
            ) : (
              <Text style={styles.submitBtnText}>Submit & Publish Review</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.primary,
  },
  productName: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: 16,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 6,
  },
  starTouch: {
    padding: 4,
  },
  ratingDescriptor: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primary,
    marginTop: 4,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  mediaLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mediaCountText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "700",
  },
  mediaRow: {
    marginTop: 8,
  },
  mediaThumbWrapper: {
    width: 68,
    height: 68,
    borderRadius: RADIUS.sm,
    overflow: "hidden",
    marginRight: 8,
    position: "relative",
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mediaThumb: {
    width: "100%",
    height: "100%",
  },
  videoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  videoLabel: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 2,
  },
  mediaRemoveBtn: {
    position: "absolute",
    top: 3,
    right: 3,
    backgroundColor: "#DC2626",
    borderRadius: 10,
    padding: 2,
  },
  mediaActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  addMediaBtn: {
    width: 68,
    height: 68,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${COLORS.primary}08`,
  },
  addMediaBtnText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 4,
  },
  verifiedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ECFDF5",
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  verifiedBannerText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#065F46",
    flex: 1,
  },
  submitBtn: {
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    ...SHADOWS.md,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  submittingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
