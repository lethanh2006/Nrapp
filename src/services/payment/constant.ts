export type PaymentStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "EXPIRED"
  | "REVIEW_REQUIRED"
  | "REFUNDED";

export interface PaymentRecord {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: "VIETQR";
  qrUrl: string;
  transferContent: string;
  expiresAt: string;
  paidAt: string | null;
  createdAt: string;
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Chờ thanh toán",
  SUCCESS: "Thành công",
  FAILED: "Thất bại",
  EXPIRED: "Hết hạn",
  REVIEW_REQUIRED: "Cần kiểm tra",
  REFUNDED: "Đã hoàn tiền",
};
