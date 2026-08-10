import axios from "@/src/utils/axios";
import { getAuthHeader } from "@/src/utils/apiHelper";
import { ipNR } from "@/src/utils/ip";
import type {
  ChatImageUpload,
  ChatListItem,
  ChatUser,
  Message,
} from "@/src/services/chat/constant";

const IMAGE_UPLOAD_TIMEOUT_MS = 60_000;
const API_PREFLIGHT_TIMEOUT_MS = 4_000;
const API_PREFLIGHT_RETRY_DELAY_MS = 400;
const API_PREFLIGHT_ATTEMPTS = 3;

class ChatUploadError extends Error {}

function getApiOrigin() {
  try {
    return new URL(ipNR).origin;
  } catch {
    return ipNR.replace(/\/api(?:\/.*)?$/, "");
  }
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function waitForGateway() {
  let lastError: unknown;

  for (let attempt = 1; attempt <= API_PREFLIGHT_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      API_PREFLIGHT_TIMEOUT_MS,
    );

    try {
      await fetch(`${getApiOrigin()}/health`, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      return;
    } catch (error) {
      lastError = error;
      if (attempt < API_PREFLIGHT_ATTEMPTS) {
        await wait(API_PREFLIGHT_RETRY_DELAY_MS);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  const detail = lastError instanceof Error ? lastError.message : String(lastError);
  console.error("[CHAT][UPLOAD_PREFLIGHT_FAILED]", {
    apiOrigin: getApiOrigin(),
    detail,
  });
  throw new ChatUploadError(
    "Điện thoại chưa kết nối được Gateway. Vui lòng kiểm tra Wi-Fi và thử lại.",
  );
}

function getImageFileName(image: ChatImageUpload) {
  if (image.fileName?.trim()) return image.fileName.trim();

  const mimeExtension = image.mimeType?.split("/")[1]?.split("+")[0];
  const extension = mimeExtension === "jpeg" ? "jpg" : mimeExtension || "jpg";
  return `chat-image-${Date.now()}.${extension}`;
}

async function createImagePayload(
  chatId: string,
  text: string,
  image: ChatImageUpload,
) {
  const form = new FormData();
  form.append("chatId", chatId);
  if (text) form.append("text", text);

  if (typeof document !== "undefined") {
    const blob = await (await fetch(image.uri)).blob();
    form.append("image", blob, image.fileName || "chat-image.jpg");
  } else {
    form.append("image", {
      uri: image.uri,
      name: getImageFileName(image),
      type: image.mimeType || "image/jpeg",
    } as unknown as Blob);
  }

  return form;
}

export async function createChat(token: string, otherUserId: string) {
  return axios.post<{ message: string; chatId: string }>(
    `${ipNR}/chat/chat/new`,
    { otherUserId },
    getAuthHeader(token),
  );
}

export async function getChats(token: string) {
  return axios.get<{ chats: ChatListItem[] }>(
    `${ipNR}/chat/chat/all`,
    getAuthHeader(token),
  );
}

export async function sendChatMessage(
  token: string,
  chatId: string,
  text: string,
  image?: ChatImageUpload,
) {
  if (!image) {
    return axios.post<{ message: Message; sender: string }>(
      `${ipNR}/chat/message`,
      { chatId, text },
      getAuthHeader(token),
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMAGE_UPLOAD_TIMEOUT_MS);

  try {
    await waitForGateway();
    const response = await fetch(`${ipNR}/chat/message`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: await createImagePayload(chatId, text, image),
      signal: controller.signal,
    });
    const rawBody = await response.text();
    let data: any = {};
    try {
      data = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      if (!response.ok) {
        throw new ChatUploadError(
          `Gateway trả về lỗi HTTP ${response.status} khi gửi ảnh`,
        );
      }
      throw new ChatUploadError("Phản hồi gửi ảnh từ Gateway không hợp lệ");
    }

    if (!response.ok) {
      const responseMessage = Array.isArray(data?.message)
        ? data.message.join("\n")
        : data?.message;
      throw new ChatUploadError(responseMessage || "Gửi ảnh không thành công");
    }

    return { data: data as { message: Message; sender: string } };
  } catch (error) {
    if (error instanceof ChatUploadError) throw error;
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[CHAT][UPLOAD_REQUEST_FAILED]", {
      endpoint: `${ipNR}/chat/message`,
      detail,
      imageMimeType: image.mimeType || "image/jpeg",
      imageUriScheme: image.uri.split(":", 1)[0] || "unknown",
    });
    if (controller.signal.aborted) {
      throw new ChatUploadError(
        "Gửi ảnh quá thời gian. Vui lòng kiểm tra kết nối và thử lại.",
      );
    }
    throw new ChatUploadError(
      "Không thể tải ảnh lên máy chủ. Vui lòng kiểm tra kết nối và thử lại.",
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function getChatMessages(token: string, chatId: string) {
  return axios.get<{
    messages: Message[];
    user: { user?: ChatUser } | ChatUser;
  }>(
    `${ipNR}/chat/message/${encodeURIComponent(chatId)}`,
    getAuthHeader(token),
  );
}
