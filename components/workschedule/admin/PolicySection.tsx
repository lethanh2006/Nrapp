import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { useAdminData } from "@/context/AdminContext";
import { Ionicons } from "@expo/vector-icons";

export function PolicySection() {
  const { policy, policyDraft, setPolicyDraft, savingPolicy, handleSavePolicy, handleLockPolicy } = useAdminData();
  const [isOpen, setIsOpen] = useState(false);

  const formatDisplayDate = (dateVal: string | Date | undefined) => {
    if (!dateVal) return "Chưa cấu hình";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "Không hợp lệ";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${min} ${dd}/${mm}/${yyyy}`;
  };

  return (
    <View className="bg-white rounded-3xl border border-slate-200 overflow-hidden mb-6">
      <Pressable
        onPress={() => setIsOpen(!isOpen)}
        className="flex-row items-center justify-between p-5 bg-white gap-3"
      >
        <View className="flex-1">
          <Text className="text-lg font-bold text-slate-900">
            Chính sách làm việc
          </Text>
          <Text className="text-slate-500 mt-1 font-medium text-sm">
            Cấu hình thời gian đăng ký lịch làm việc của nhân viên.
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <View className={`rounded-full px-3 py-1 ${policy?.locked ?? true ? "bg-rose-50 border border-rose-100" : "bg-emerald-50 border border-emerald-100"}`}>
            <Text className={`text-xs font-semibold ${policy?.locked ?? true ? "text-rose-600" : "text-emerald-600"}`}>
              {policy?.locked ?? true ? "Đã khóa" : "Đang mở"}
            </Text>
          </View>
          <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color="#64748b" />
        </View>
      </Pressable>

      {isOpen && (
        <View className="p-5 pt-0 border-t border-slate-100">
          <View className={`flex-row items-center gap-3 p-4 rounded-2xl border mt-4 ${policyDraft.locked ? "bg-rose-50 border-rose-100/60" : "bg-emerald-50 border-emerald-100/60"}`}>
            <Ionicons name={policyDraft.locked ? "lock-closed-sharp" : "lock-open-sharp"} size={18} color={policyDraft.locked ? "#e11d48" : "#059669"} />
            <Text className={`text-xs font-bold flex-1 ${policyDraft.locked ? "text-rose-800" : "text-emerald-800"}`}>
              {policyDraft.locked 
                ? "Hệ thống đang KHÓA đăng ký lịch. Bấm 'Mở khóa' để thay đổi thời gian đăng ký." 
                : "Hệ thống đang MỞ KHÓA chỉnh sửa. Điền thời gian mới sau đó chọn 'Lưu chính sách'."}
            </Text>
          </View>

          <View className="flex-row flex-wrap mt-4" style={{ gap: 12 }}>
            <View className="flex-1 min-w-[200px]">
              <Text className="text-slate-600 text-xs font-semibold mb-2">Thời gian bắt đầu (YYYY-MM-DD HH:mm)</Text>
              <TextInput
                value={policyDraft.registration_start}
                onChangeText={(text) =>
                  setPolicyDraft((previous) => ({ ...previous, registration_start: text }))
                }
                editable={!policyDraft.locked}
                className={`border rounded-2xl px-4 py-3 font-medium ${policyDraft.locked ? "bg-slate-100 text-slate-400 border-slate-200/50" : "bg-slate-50 text-slate-900 border-slate-200"}`}
                placeholder="2026-05-01 00:00"
              />
            </View>
            <View className="flex-1 min-w-[200px]">
              <Text className="text-slate-600 text-xs font-semibold mb-2">Thời gian kết thúc (YYYY-MM-DD HH:mm)</Text>
              <TextInput
                value={policyDraft.registration_end}
                onChangeText={(text) =>
                  setPolicyDraft((previous) => ({ ...previous, registration_end: text }))
                }
                editable={!policyDraft.locked}
                className={`border rounded-2xl px-4 py-3 font-medium ${policyDraft.locked ? "bg-slate-100 text-slate-400 border-slate-200/50" : "bg-slate-50 text-slate-900 border-slate-200"}`}
                placeholder="2026-05-31 23:59"
              />
            </View>
          </View>

          <View className="flex-row flex-wrap mt-5" style={{ gap: 10 }}>
            {policyDraft.locked ? (
              <Pressable
                onPress={() => setPolicyDraft(prev => ({ ...prev, locked: false }))}
                className="flex-1 min-w-[150px] bg-emerald-600 active:scale-95 rounded-2xl py-3.5 flex-row items-center justify-center space-x-2"
              >
                <Ionicons name="lock-open-outline" size={16} color="white" />
                <Text className="text-white font-extrabold text-center ml-1">
                  Mở khóa chỉnh sửa
                </Text>
              </Pressable>
            ) : (
              <>
                <Pressable
                  onPress={handleSavePolicy}
                  disabled={savingPolicy}
                  className={`flex-1 min-w-[150px] rounded-2xl py-3.5 flex-row items-center justify-center space-x-2 ${savingPolicy ? "bg-slate-300" : "bg-slate-900 active:scale-95"}`}
                >
                  <Ionicons name="save-outline" size={16} color="white" />
                  <Text className="text-white font-semibold text-center ml-1">
                    {savingPolicy ? "Đang lưu..." : "Lưu chính sách"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleLockPolicy}
                  disabled={savingPolicy}
                  className={`flex-1 min-w-[150px] rounded-2xl py-3.5 flex-row items-center justify-center space-x-2 ${savingPolicy ? "bg-slate-300" : "bg-rose-600 active:scale-95"}`}
                >
                  <Ionicons name="lock-closed-outline" size={16} color="white" />
                  <Text className="text-white font-semibold text-center ml-1">
                    {savingPolicy ? "Đang khóa..." : "Khóa đăng ký"}
                  </Text>
                </Pressable>
              </>
            )}
            
            <View className="flex-1 min-w-[200px] rounded-2xl py-3 px-4 bg-cyan-50 border border-cyan-100 justify-center">
              <Text className="text-cyan-900 text-xs uppercase tracking-[2px] font-semibold">
                ĐANG ÁP DỤNG
              </Text>
              <Text className="text-cyan-950 font-medium mt-1 text-sm">
                Từ: {formatDisplayDate(policy?.registration_start ?? policyDraft.registration_start)}
              </Text>
              <Text className="text-cyan-950 font-medium mt-0.5 text-sm">
                Đến: {formatDisplayDate(policy?.registration_end ?? policyDraft.registration_end)}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
