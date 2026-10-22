import { Alert as RNAlert } from "react-native";
import { create } from "zustand";

export type AlertType = "success" | "error" | "warning" | "info" | "confirm";

export interface AlertButtonConfig {
  text?: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
  isPreferred?: boolean;
}

export interface CustomAlertPayload {
  id?: string;
  title?: string;
  message?: string;
  buttons?: AlertButtonConfig[];
  type?: AlertType;
  cancelable?: boolean;
  onDismiss?: () => void;
}

interface AlertStoreState {
  currentAlert: CustomAlertPayload | null;
  queue: CustomAlertPayload[];
  showAlert: (payload: CustomAlertPayload) => void;
  hideAlert: () => void;
}

export function detectAlertType(
  title?: string,
  message?: string,
  buttons?: AlertButtonConfig[]
): AlertType {
  const text = `${title || ""} ${message || ""}`.toLowerCase();

  // If any button has destructive style
  if (buttons?.some((b) => b.style === "destructive")) {
    return "warning";
  }

  // Success indicators (celebration emojis, keywords)
  if (
    text.includes("🎉") ||
    text.includes("🥳") ||
    text.includes("🎊") ||
    text.includes("✅") ||
    text.includes("success") ||
    text.includes("updated") ||
    text.includes("saved") ||
    text.includes("created") ||
    text.includes("completed") ||
    text.includes("added") ||
    text.includes("copied") ||
    text.includes("accepted") ||
    text.includes("delivered") ||
    text.includes("verified") ||
    text.includes("congratulations")
  ) {
    return "success";
  }

  // Error indicators
  if (
    text.includes("❌") ||
    text.includes("error") ||
    text.includes("failed") ||
    text.includes("failure") ||
    text.includes("could not") ||
    text.includes("invalid") ||
    text.includes("unable") ||
    text.includes("rejected") ||
    text.includes("wrong")
  ) {
    return "error";
  }

  // Warning indicators
  if (
    text.includes("⚠️") ||
    text.includes("warning") ||
    text.includes("attention") ||
    text.includes("caution") ||
    text.includes("are you sure") ||
    text.includes("confirm") ||
    text.includes("delete") ||
    text.includes("remove") ||
    text.includes("discard") ||
    text.includes("cancel order")
  ) {
    return "warning";
  }

  return "info";
}

export const useAlertStore = create<AlertStoreState>((set, get) => ({
  currentAlert: null,
  queue: [],
  showAlert: (payload) => {
    const alertType =
      payload.type || detectAlertType(payload.title, payload.message, payload.buttons);
    const item: CustomAlertPayload = {
      ...payload,
      type: alertType,
      id: Math.random().toString(36).substring(7),
    };

    const { currentAlert, queue } = get();
    if (!currentAlert) {
      set({ currentAlert: item });
    } else {
      set({ queue: [...queue, item] });
    }
  },
  hideAlert: () => {
    const { queue } = get();
    if (queue.length > 0) {
      const [nextAlert, ...remaining] = queue;
      set({ currentAlert: nextAlert, queue: remaining });
    } else {
      set({ currentAlert: null });
    }
  },
}));

// Retain native alert reference if needed
export const nativeAlert = RNAlert.alert.bind(RNAlert);

let isPatched = false;
export function patchReactNativeAlert() {
  if (isPatched) return;
  isPatched = true;

  // Intercept RN Alert.alert globally across all screens and modules
  RNAlert.alert = (title, message, buttons, options) => {
    let finalButtons: AlertButtonConfig[] = [];
    if (!buttons || buttons.length === 0) {
      finalButtons = [{ text: "OK", style: "default" }];
    } else {
      finalButtons = buttons.map((b) => ({
        text: b.text,
        onPress: b.onPress,
        style: b.style,
      }));
    }

    useAlertStore.getState().showAlert({
      title: title || "",
      message: message || "",
      buttons: finalButtons,
      cancelable: options?.cancelable ?? true,
      onDismiss: options?.onDismiss,
    });
  };
}

// Auto-patch on load
patchReactNativeAlert();

export const showCustomAlert = (payload: CustomAlertPayload) => {
  useAlertStore.getState().showAlert(payload);
};
