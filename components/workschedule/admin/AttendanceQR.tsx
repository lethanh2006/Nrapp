import React from "react";
import { View, Text, Pressable } from "react-native";
import { useAdminData } from "@/context/AdminContext";

export function AttendanceQR() {
  const { qrBusy, generatedQr, qrRemaining, handleGenerateQr } = useAdminData();

  const formatDateTime = (value?: string) => {
    if (!value) return "-";
    return new Date(value).toLocaleString("vi-VN");
  };

  return (
    <View className="bg-white rounded-3xl p-5 border border-slate-200">
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-lg font-bold text-slate-900">QR chấm công</Text>
          <Text className="text-slate-500 mt-1">
            Tạo token 30 giây cho nhân viên quét check-in.
          </Text>
        </View>
        <Pressable
          onPress={handleGenerateQr}
          disabled={qrBusy}
          className={`rounded-2xl px-4 py-3 ${qrBusy ? "bg-cyan-200" : "bg-cyan-600"}`}
        >
          <Text className="text-white font-semibold">
            {qrBusy ? "Đang tạo..." : "Tạo QR"}
          </Text>
        </Pressable>
      </View>

      {generatedQr ? (
        <View className="rounded-3xl border border-cyan-100 bg-cyan-50 p-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-cyan-900 font-semibold">Token hiện tại</Text>
            <View
              className={`rounded-full px-3 py-1 ${qrRemaining > 0 ? "bg-cyan-600" : "bg-slate-400"}`}
            >
              <Text className="text-white text-xs font-semibold">
                {qrRemaining > 0 ? `${qrRemaining}s còn lại` : "Đã hết hạn"}
              </Text>
            </View>
          </View>
          <View className="bg-white rounded-2xl border border-cyan-100 p-4">
            <Text className="text-[11px] uppercase tracking-[2px] text-cyan-700">
              Token
            </Text>
            <Text className="text-slate-900 font-semibold mt-2">
              {generatedQr.token}
            </Text>
            <Text className="text-slate-500 text-sm mt-2">
              Hết hạn: {formatDateTime(generatedQr.expires_at)}
            </Text>
          </View>
        </View>
      ) : (
        <View className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <Text className="text-slate-500">Chưa tạo token mới.</Text>
        </View>
      )}
    </View>
  );
}
