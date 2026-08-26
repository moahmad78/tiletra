import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { X, Plus, Check, MapPin, Building, Home, Briefcase } from "lucide-react-native";
import { Address } from "../types";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../constants/theme";
import { useAuthStore } from "../store/authStore";

interface AddressModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAddress: (address: Address) => void;
}

export const AddressModal: React.FC<AddressModalProps> = ({ visible, onClose, onSelectAddress }) => {
  const { user, selectedAddress, setSelectedAddress } = useAuthStore();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [loading, setLoading] = useState(false);

  // New Address Form State
  const [label, setLabel] = useState("Home");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("Bangalore");
  const [state, setState] = useState("Karnataka");
  const [pincode, setPincode] = useState("");
  const [landmark, setLandmark] = useState("");
  const [error, setError] = useState("");

  const handleSelect = (addr: Address) => {
    setSelectedAddress(addr);
    onSelectAddress(addr);
    onClose();
  };

  const handleSaveAddress = () => {
    if (!street.trim() || !pincode.trim() || !city.trim()) {
      setError("Please fill in Street, City, and Pincode");
      return;
    }
    if (pincode.replace(/\D/g, "").length !== 6) {
      setError("Pincode must be 6 digits");
      return;
    }

    const newAddr: Address = {
      id: `addr_${Date.now()}`,
      userId: user?.id,
      label,
      street,
      city,
      state,
      pincode,
      landmark: landmark.trim() || undefined,
      isDefault: false,
    };

    handleSelect(newAddr);
    setIsAddingNew(false);
    setStreet("");
    setPincode("");
    setLandmark("");
    setError("");
  };

  const addresses = user?.addresses || [];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {isAddingNew ? "Add Delivery Address" : "Select Delivery Address"}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {isAddingNew ? (
              <View style={styles.form}>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {/* Label Selector */}
                <Text style={styles.inputLabel}>Address Type</Text>
                <View style={styles.labelRow}>
                  {["Home", "Work", "Site", "Other"].map((lbl) => (
                    <TouchableOpacity
                      key={lbl}
                      style={[styles.labelChip, label === lbl && styles.activeLabelChip]}
                      onPress={() => setLabel(lbl)}
                    >
                      <Text
                        style={[styles.labelChipText, label === lbl && styles.activeLabelChipText]}
                      >
                        {lbl}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Flat / House / Building / Street *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. #42, Green Glen Layout, Bellandur"
                  placeholderTextColor="#94a3b8"
                  value={street}
                  onChangeText={setStreet}
                />

                <Text style={styles.inputLabel}>Landmark (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Near HDFC Bank"
                  placeholderTextColor="#94a3b8"
                  value={landmark}
                  onChangeText={setLandmark}
                />

                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Text style={styles.inputLabel}>Pincode *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="560103"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      maxLength={6}
                      value={pincode}
                      onChangeText={setPincode}
                    />
                  </View>
                  <View style={[styles.flex1, { marginLeft: 12 }]}>
                    <Text style={styles.inputLabel}>City *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Bangalore"
                      placeholderTextColor="#94a3b8"
                      value={city}
                      onChangeText={setCity}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveAddress}
                  disabled={loading}
                >
                  <Text style={styles.saveBtnText}>Save and Deliver Here</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setIsAddingNew(false)}
                >
                  <Text style={styles.cancelBtnText}>Back to Saved Addresses</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {addresses.map((addr) => {
                  const isSelected = selectedAddress?.id === addr.id;
                  return (
                    <TouchableOpacity
                      key={addr.id}
                      style={[styles.addressItem, isSelected && styles.selectedAddressItem]}
                      onPress={() => handleSelect(addr)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.addressTop}>
                        <View style={styles.badgeRow}>
                          <MapPin size={15} color={COLORS.primary} />
                          <Text style={styles.addressLabelText}>{addr.label || "Delivery Site"}</Text>
                        </View>
                        {isSelected && (
                          <View style={styles.checkCircle}>
                            <Check size={14} color={COLORS.textWhite} />
                          </View>
                        )}
                      </View>

                      <Text style={styles.streetText}>{addr.street}</Text>
                      {addr.landmark ? (
                        <Text style={styles.subText}>Landmark: {addr.landmark}</Text>
                      ) : null}
                      <Text style={styles.cityText}>
                        {addr.city}, {addr.state} - {addr.pincode}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={styles.addNewBtn}
                  onPress={() => setIsAddingNew(true)}
                  activeOpacity={0.8}
                >
                  <Plus size={18} color={COLORS.primary} />
                  <Text style={styles.addNewText}>Add New Address</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: "85%",
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: SPACING.lg,
  },
  addressItem: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  selectedAddressItem: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(5, 42, 81, 0.04)",
  },
  addressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  addressLabelText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
    marginLeft: 6,
    textTransform: "uppercase",
  },
  checkCircle: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  streetText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    lineHeight: 18,
  },
  subText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cityText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
    marginTop: 4,
  },
  addNewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: 14,
    marginTop: 6,
  },
  addNewText: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 14,
    marginLeft: 6,
  },
  form: {
    paddingBottom: 20,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  labelRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  labelChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    backgroundColor: COLORS.surfaceSecondary,
  },
  activeLabelChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  labelChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  activeLabelChipText: {
    color: COLORS.textWhite,
  },
  row: {
    flexDirection: "row",
  },
  flex1: {
    flex: 1,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  saveBtnText: {
    color: COLORS.textWhite,
    fontSize: 15,
    fontWeight: "800",
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 6,
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
});
