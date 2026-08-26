import type {
  CanteenAdminList,
  CanteenAdminQuery,
  CanteenDataResponse,
  CanteenListResponse,
} from "@/src/services/canteen/admin-resource";
import { normalizeCanteenAdminList } from "@/src/services/canteen/admin-resource";
import { getAuthHeader } from "@/src/utils/apiHelper";
import axios from "@/src/utils/axios";
import { ipNR } from "@/src/utils/ip";

export interface CanteenIngredient {
  _id: string;
  name: string;
  unit: string;
  minimumThreshold: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCanteenIngredientInput {
  name: string;
  unit: string;
  minimumThreshold: number;
}

export type UpdateCanteenIngredientInput =
  Partial<CreateCanteenIngredientInput>;

export interface CreateInventoryBatchInput {
  ingredientId: string;
  quantity: number;
  expiryDate: string;
  costPrice: number;
  supplier?: string;
}

export interface InventoryBatchRecord {
  _id: string;
  ingredientId: string;
  quantity: number;
  originalQuantity: number;
  expiryDate: string;
  importDate: string;
  costPrice: number;
  supplier?: string;
  status: "ACTIVE" | "EXPIRED" | "DEPLETED";
}

export interface InventoryExpiryAlert {
  batchId: string;
  ingredientId: string;
  ingredientName: string;
  unit: string;
  expiryDate: string;
  quantity: number;
  originalQuantity: number;
  costPrice: number;
  supplier?: string;
  status: string;
}

export interface InventoryBatchDeduction {
  batchId: string;
  expiryDate: string;
  consumedQuantity: number;
  remainingBatchQuantity: number;
  status: "ACTIVE" | "DEPLETED";
}

export interface InventoryConsumptionResult {
  ingredient: {
    id: string;
    name: string;
    unit: string;
    minimumThreshold: number;
    totalRemainingStock: number;
    isLowStock: boolean;
  };
  consumedQuantity: number;
  report: {
    ingredientId: string;
    requestedQuantity: number;
    totalConsumed: number;
    isFullyFulfilled: boolean;
    affectedBatches: InventoryBatchDeduction[];
    remainingTotalStock: number;
    isLowStockAlert: boolean;
  };
}

export async function listCanteenIngredients(
  params: CanteenAdminQuery = {},
): Promise<CanteenAdminList<CanteenIngredient>> {
  const { data } = await axios.get<CanteenListResponse<CanteenIngredient>>(
    `${ipNR}/canteen/inventory/ingredients`,
    { params },
  );
  return normalizeCanteenAdminList(data);
}

export async function createCanteenIngredient(
  token: string,
  payload: CreateCanteenIngredientInput,
) {
  const { data } = await axios.post<CanteenDataResponse<CanteenIngredient>>(
    `${ipNR}/canteen/inventory/ingredients`,
    payload,
    getAuthHeader(token),
  );
  return data.data;
}

export async function updateCanteenIngredient(
  token: string,
  ingredientId: string,
  payload: UpdateCanteenIngredientInput,
) {
  const { data } = await axios.patch<CanteenDataResponse<CanteenIngredient>>(
    `${ipNR}/canteen/inventory/ingredients/${encodeURIComponent(ingredientId)}`,
    payload,
    getAuthHeader(token),
  );
  return data.data;
}

export async function deleteCanteenIngredient(
  token: string,
  ingredientId: string,
) {
  const { data } = await axios.delete<CanteenDataResponse<CanteenIngredient>>(
    `${ipNR}/canteen/inventory/ingredients/${encodeURIComponent(ingredientId)}`,
    getAuthHeader(token),
  );
  return data.data;
}

export async function createCanteenInventoryBatch(
  token: string,
  payload: CreateInventoryBatchInput,
) {
  const { data } = await axios.post<InventoryBatchRecord>(
    `${ipNR}/canteen/inventory/batches`,
    payload,
    getAuthHeader(token),
  );
  return data;
}

export async function getCanteenInventoryExpiryAlerts(token: string) {
  const { data } = await axios.get<InventoryExpiryAlert[]>(
    `${ipNR}/canteen/inventory/expiry-alerts`,
    getAuthHeader(token),
  );
  return Array.isArray(data) ? data : [];
}

export async function consumeCanteenIngredient(
  token: string,
  ingredientId: string,
  quantity: number,
) {
  const { data } = await axios.post<InventoryConsumptionResult>(
    `${ipNR}/canteen/inventory/consume`,
    { ingredientId, quantity },
    getAuthHeader(token),
  );
  return data;
}
