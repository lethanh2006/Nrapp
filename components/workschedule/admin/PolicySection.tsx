import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { useAdminData } from "@/context/AdminContext";
import { Ionicons } from "@expo/vector-icons";

export function PolicySection() {
  const { policy, policyDraft, setPolicyDraft, savingPolicy, handleSavePolicy } = useAdminData();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View className="bg-white rounded-3xl border border-slate-200 overflow-hidden mb-6">
      <Pressable
        onPress={() => setIsOpen(!isOpen)}
        className="flex-row items-center justify-between p-5 bg-white"
      >
        <View>
          <Text className="text-lg font-bold text-slate-900">
            Chính sách làm việc
          </Text>
          <Text className="text-slate-500 mt-1">
            Cấu hình deadline nộp lịch và số ngày khóa lịch.
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <View className="bg-slate-100 rounded-full px-3 py-1">
            <Text className="text-slate-700 text-xs font-semibold">
              {policy ? "Đang áp dụng" : "Mặc định"}
            </Text>
          </View>
          <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color="#64748b" />
        </View>
      </Pressable>

      {isOpen && (
        <View className="p-5 pt-0 border-t border-slate-100">
          <View className="flex-row flex-wrap mt-4" style={{ gap: 12 }}>
            <View className="flex-1 min-w-[130px]">
              <Text className="text-slate-600 text-xs mb-2">Ngày deadline</Text>
              <TextInput
                value={policyDraft.submit_deadline_day}
                onChangeText={(text) =>
                  setPolicyDraft((previous) => ({ ...previous, submit_deadline_day: text }))
                }
                keyboardType="number-pad"
                className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900"
                placeholder="5"
              />
            </View>
            <View className="flex-1 min-w-[130px]">
              <Text className="text-slate-600 text-xs mb-2">Giờ deadline</Text>
              <TextInput
                value={policyDraft.submit_deadline_hour}
                onChangeText={(text) =>
                  setPolicyDraft((previous) => ({ ...previous, submit_deadline_hour: text }))
                }
                keyboardType="number-pad"
                className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900"
                placeholder="17"
              />
            </View>
            <View className="flex-1 min-w-[130px]">
              <Text className="text-slate-600 text-xs mb-2">Ngày khóa lịch</Text>
              <TextInput
                value={policyDraft.lock_schedule_days}
                onChangeText={(text) =>
                  setPolicyDraft((previous) => ({ ...previous, lock_schedule_days: text }))
                }
                keyboardType="number-pad"
                className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900"
                placeholder="7"
              />
            </View>
          </View>

          <View className="flex-row flex-wrap mt-4" style={{ gap: 10 }}>
            <Pressable
              onPress={handleSavePolicy}
              disabled={savingPolicy}
              className={`flex-1 min-w-[150px] rounded-2xl py-3 items-center ${savingPolicy ? "bg-slate-300" : "bg-slate-900"}`}
            >
              <Text className="text-white font-semibold">
                {savingPolicy ? "Đang lưu..." : "Lưu chính sách"}
              </Text>
            </Pressable>
            <View className="flex-1 min-w-[150px] rounded-2xl py-3 px-4 bg-cyan-50 border border-cyan-100 justify-center">
              <Text className="text-cyan-900 text-xs uppercase tracking-[2px]">
                Current
              </Text>
              <Text className="text-cyan-950 font-semibold mt-1">
                Deadline ngày{" "}
                {policy?.submit_deadline_day ?? policyDraft.submit_deadline_day},{" "}
                {policy?.submit_deadline_hour ?? policyDraft.submit_deadline_hour}:00
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
