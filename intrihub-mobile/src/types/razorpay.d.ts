declare module "react-native-razorpay" {
  export interface RazorpaySuccessResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }

  export interface RazorpayErrorResponse {
    code: number;
    description: string;
  }

  export interface RazorpayOptions {
    description?: string;
    image?: string;
    currency: string;
    key: string;
    amount: number;
    name?: string;
    order_id: string;
    prefill?: {
      email?: string;
      contact?: string;
      name?: string;
      method?: string;
    };
    theme?: {
      color?: string;
      hide_topbar?: boolean;
    };
    notes?: Record<string, any>;
  }

  export default class RazorpayCheckout {
    static open(
      options: RazorpayOptions,
      successCallback?: (data: RazorpaySuccessResponse) => void,
      errorCallback?: (data: RazorpayErrorResponse) => void
    ): Promise<RazorpaySuccessResponse>;
    static onExternalWalletSelection(callback: (data: any) => void): void;
  }
}
