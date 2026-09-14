import type { PaymentMethod } from "@/frontend/types/site-config";

const paymentLabels: Record<PaymentMethod, string> = {
  credit_card: "Credit Card",
  upi: "UPI",
  paypal: "PayPal",
  apple_pay: "Apple Pay",
  google_pay: "Google Pay",
  bank_transfer: "Bank Transfer"
};

export function getPaymentLabel(method: PaymentMethod): string {
  return paymentLabels[method];
}
