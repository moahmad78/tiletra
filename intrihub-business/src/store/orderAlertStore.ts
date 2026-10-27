import { create } from "zustand";

export interface OrderAlertData {
  orderId: string;
  splitId?: string;
  customerName?: string;
  customerPhone?: string;
  totalAmount?: number;
  itemsCount?: number;
  isAutoAccepted: boolean;
  requiresManualApproval: boolean;
  warning?: string;
}

interface OrderAlertState {
  alert: OrderAlertData | null;
  isOpen: boolean;
  isRinging: boolean;
  triggerAlert: (data: OrderAlertData) => void;
  closeAlert: () => void;
  stopRinging: () => void;
}

export const useOrderAlertStore = create<OrderAlertState>((set) => ({
  alert: null,
  isOpen: false,
  isRinging: false,

  triggerAlert: (data) =>
    set({
      alert: data,
      isOpen: true,
      isRinging: true,
    }),

  closeAlert: () =>
    set({
      isOpen: false,
      isRinging: false,
      alert: null,
    }),

  stopRinging: () =>
    set({
      isRinging: false,
    }),
}));
