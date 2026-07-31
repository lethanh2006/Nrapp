import type { User } from "@/types/api";
import { Ionicons } from "@expo/vector-icons";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { PRIORITY_MAP, PRIORITY_OPTIONS, TaskPriority } from "./types";

type Props = {
  title: string;
  description: string;
  deadline: Date | null;
  priority: TaskPriority;
  createAssignee: string;
  users: User[];
  creating: boolean;
  setTitle: (value: string) => void;
  setDescription: (value: string) => void;
  setDeadline: (value: Date | null) => void;
  setPriority: (value: TaskPriority) => void;
  setCreateAssignee: (value: string) => void;
  onCreateTask: () => void;
};

export default function TodoCreateTaskCard({
  title,
  description,
  deadline,
  priority,
  createAssignee,
  users,
  creating,
  setTitle,
  setDescription,
  setDeadline,
  setPriority,
  setCreateAssignee,
  onCreateTask,
}: Props) {
  const [showPriorityOptions, setShowPriorityOptions] = React.useState(false);

  const openDeadlinePicker = () => {
    const currentValue = deadline ?? new Date();

    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: currentValue,
        mode: "date",
        is24Hour: true,
        onChange: (_event, selectedDate) => {
          if (!selectedDate) return;
          const baseDate = new Date(selectedDate);

          DateTimePickerAndroid.open({
            value: deadline ?? baseDate,
            mode: "time",
            is24Hour: true,
            onChange: (_timeEvent, selectedTime) => {
              if (!selectedTime) {
                setDeadline(baseDate);
                return;
              }

              const finalDate = new Date(baseDate);
              finalDate.setHours(selectedTime.getHours());
              finalDate.setMinutes(selectedTime.getMinutes());
              finalDate.setSeconds(0);
              finalDate.setMilliseconds(0);
              setDeadline(finalDate);
            },
          });
        },
      });
      return;
    }

    setDeadline(currentValue);
  };

  return (
    <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <View className="flex-row items-center mb-4">
        <View className="bg-blue-500/10 p-1.5 rounded-lg mr-2">
          <Ionicons name="add-circle-outline" size={20} color="#3b82f6" />
        </View>
        <Text className="text-base font-bold text-slate-800">
          Tạo công việc mới
        </Text>
      </View>

      <Text className="text-xs font-semibold text-slate-500 mb-1.5 ml-0.5">Tiêu đề công việc *</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Nhập tiêu đề công việc..."
        placeholderTextColor="#94a3b8"
        className="border border-slate-200 rounded-xl px-4 py-3 mb-4 text-slate-800 bg-slate-50/30 text-sm font-medium"
      />

      <Text className="text-xs font-semibold text-slate-500 mb-1.5 ml-0.5">Mô tả công việc</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Nhập mô tả chi tiết (tùy chọn)..."
        placeholderTextColor="#94a3b8"
        className="border border-slate-200 rounded-xl px-4 py-3 mb-4 text-slate-800 bg-slate-50/30 text-sm font-medium"
        multiline
        numberOfLines={3}
        style={{ textAlignVertical: "top" }}
      />

      <View className="mb-4" style={{ gap: 6 }}>
        <Text className="text-xs font-semibold text-slate-500 ml-0.5">Hạn chót (Deadline)</Text>
        <Pressable
          onPress={openDeadlinePicker}
          className="border border-slate-200 rounded-xl px-4 py-3 bg-slate-50/30 flex-row items-center justify-between"
        >
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={18} color="#64748b" />
            <Text className={`ml-2 text-sm font-medium ${deadline ? "text-slate-800" : "text-slate-400"}`}>
              {deadline ? deadline.toLocaleString() : "Chọn thời hạn hoàn thành"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
        </Pressable>
        {deadline ? (
          <Pressable
            onPress={() => setDeadline(null)}
            className="self-start flex-row items-center mt-1 px-3 py-1.5 rounded-lg border border-rose-100 bg-rose-50"
          >
            <Ionicons name="trash-outline" size={14} color="#f43f5e" />
            <Text className="text-rose-600 text-xs font-semibold ml-1">Xóa thời hạn</Text>
          </Pressable>
        ) : null}
      </View>

      <Text className="text-xs font-semibold text-slate-500 mb-1.5 ml-0.5">Mức độ ưu tiên</Text>
      <View className="mb-4" style={{ gap: 8 }}>
        <Pressable
          onPress={() => setShowPriorityOptions((value) => !value)}
          className="border border-slate-200 rounded-xl px-4 py-3 bg-slate-50/30 flex-row items-center justify-between"
        >
          <View className="flex-row items-center">
            <Ionicons
              name={PRIORITY_MAP[priority].icon as any}
              size={18}
              color={
                priority === "high"
                  ? "#f43f5e"
                  : priority === "medium"
                  ? "#d97706"
                  : "#64748b"
              }
            />
            <Text className={`ml-2 text-sm font-semibold ${PRIORITY_MAP[priority].textClass}`}>
              {PRIORITY_MAP[priority].label}
            </Text>
          </View>
          <Ionicons name={showPriorityOptions ? "chevron-up" : "chevron-down"} size={16} color="#94a3b8" />
        </Pressable>

        {showPriorityOptions ? (
          <View className="border border-slate-100 rounded-xl bg-white overflow-hidden shadow-sm">
            {PRIORITY_OPTIONS.map((p) => {
              const isSelected = priority === p;
              const mapInfo = PRIORITY_MAP[p];

              return (
                <Pressable
                  key={p}
                  onPress={() => {
                    setPriority(p);
                    setShowPriorityOptions(false);
                  }}
                  className={`px-4 py-3 border-b border-slate-50 flex-row items-center justify-between ${isSelected ? "bg-slate-50/70" : "bg-white"}`}
                >
                  <View className="flex-row items-center">
                    <Ionicons
                      name={mapInfo.icon as any}
                      size={18}
                      color={
                        p === "high"
                          ? "#f43f5e"
                          : p === "medium"
                          ? "#d97706"
                          : "#64748b"
                      }
                    />
                    <Text
                      className={`ml-2 text-sm font-medium ${isSelected ? mapInfo.textClass : "text-slate-700"}`}
                    >
                      {mapInfo.label}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color="#3b82f6" />
                  )}
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      <Text className="text-xs font-semibold text-slate-500 mb-1.5 ml-0.5">
        Người thực hiện (tùy chọn)
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-5"
      >
        <View className="flex-row py-0.5" style={{ gap: 8 }}>
          <Pressable
            onPress={() => setCreateAssignee("")}
            className={`px-3 py-2 rounded-xl border flex-row items-center ${
              createAssignee === ""
                ? "bg-slate-800 border-slate-800 shadow-sm shadow-slate-200"
                : "bg-white border-slate-200"
            }`}
          >
            <Ionicons
              name="person-remove-outline"
              size={14}
              color={createAssignee === "" ? "#ffffff" : "#64748b"}
              className="mr-1"
            />
            <Text
              className={`text-xs font-semibold ml-1 ${
                createAssignee === "" ? "text-white" : "text-slate-600"
              }`}
            >
              Không giao ngay
            </Text>
          </Pressable>
          {users.map((u) => {
            const isSelected = createAssignee === u._id;
            return (
              <Pressable
                key={u._id}
                onPress={() => setCreateAssignee(u._id)}
                className={`px-3 py-2 rounded-xl border flex-row items-center ${
                  isSelected
                    ? "bg-blue-600 border-blue-600 shadow-sm shadow-blue-200"
                    : "bg-white border-slate-200"
                }`}
              >
                <Ionicons
                  name="person-outline"
                  size={14}
                  color={isSelected ? "#ffffff" : "#64748b"}
                  className="mr-1"
                />
                <Text
                  className={`text-xs font-semibold ml-1 ${
                    isSelected ? "text-white" : "text-slate-600"
                  }`}
                >
                  {u.username || u.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Pressable
        onPress={onCreateTask}
        disabled={creating}
        className={`rounded-xl py-3.5 items-center flex-row justify-center ${
          creating ? "bg-blue-300" : "bg-blue-600 active:bg-blue-700 shadow-sm shadow-blue-200"
        }`}
      >
        {creating ? (
          <Text className="text-white font-bold text-sm">Đang tạo...</Text>
        ) : (
          <View className="flex-row items-center">
            <Ionicons name="paper-plane-outline" size={16} color="#ffffff" className="mr-1.5" />
            <Text className="text-white font-bold text-sm ml-1.5">Tạo công việc</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}
