import type { PaymentRecord } from "@/src/services/payment/constant";
import { getAuthHeader } from "@/src/utils/apiHelper";
import axios from "@/src/utils/axios";
import { ipNR } from "@/src/utils/ip";

export async function createPaymentQr(token: string, orderId: string) {
  const { data } = await axios.post<PaymentRecord>(
    `${ipNR}/payment/create-qr`,
    { orderId },
    getAuthHeader(token),
  );
  return data;
}

export async function getLatestOrderPayment(token: string, orderId: string) {
  const { data } = await axios.get<PaymentRecord>(
    `${ipNR}/payment/orders/${encodeURIComponent(orderId)}`,
    getAuthHeader(token),
  );
  return data;
}

export async function getPaymentStatus(token: string, paymentId: string) {
  const { data } = await axios.get<PaymentRecord>(
    `${ipNR}/payment/payments/${encodeURIComponent(paymentId)}`,
    getAuthHeader(token),
  );
  return data;
}

export async function getPaymentHistory(token: string, limit = 20) {
  const { data } = await axios.get<PaymentRecord[]>(
    `${ipNR}/payment/history`,
    { ...getAuthHeader(token), params: { limit } },
  );
  return Array.isArray(data) ? data : [];
}
