import { User } from "@/context/AppContext";
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
import { PRIORITY_OPTIONS, TaskPriority } from "./types";

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
    <View className="bg-white rounded-2xl p-4 border border-gray-200">
      <Text className="text-lg font-semibold text-black mb-3">
        Tao cong viec
      </Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Tieu de cong viec"
        placeholderTextColor="#9ca3af"
        className="border border-gray-300 rounded-xl px-3 py-3 mb-3 text-black"
      />
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Mo ta (tuy chon)"
        placeholderTextColor="#9ca3af"
        className="border border-gray-300 rounded-xl px-3 py-3 mb-3 text-black"
        multiline
      />
      <View className="mb-3" style={{ gap: 8 }}>
        <Text className="text-sm text-gray-700">Deadline (tuy chon)</Text>
        <Pressable
          onPress={openDeadlinePicker}
          className="border border-gray-300 rounded-xl px-3 py-3 bg-white"
        >
          <Text className={deadline ? "text-black" : "text-gray-400"}>
            {deadline ? deadline.toLocaleString() : "Chon ngay gio deadline"}
          </Text>
        </Pressable>
        {deadline ? (
          <Pressable
            onPress={() => setDeadline(null)}
            className="self-start px-3 py-2 rounded-lg border border-red-300 bg-red-50"
          >
            <Text className="text-red-600 font-medium">Xoa deadline</Text>
          </Pressable>
        ) : null}
      </View>

      <Text className="text-sm text-gray-700 mb-2">Muc uu tien</Text>
      <View className="flex-row mb-3" style={{ gap: 8 }}>
        {PRIORITY_OPTIONS.map((p) => (
          <Pressable
            key={p}
            onPress={() => setPriority(p)}
            className={`px-3 py-2 rounded-lg border ${priority === p ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"}`}
          >
            <Text className={priority === p ? "text-white" : "text-black"}>
              {p}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="text-sm text-gray-700 mb-2">
        Nguoi duoc giao khi tao (tuy chon)
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
      >
        <View className="flex-row" style={{ gap: 8 }}>
          <Pressable
            onPress={() => setCreateAssignee("")}
            className={`px-3 py-2 rounded-lg border ${createAssignee === "" ? "bg-green-600 border-green-600" : "bg-white border-gray-300"}`}
          >
            <Text
              className={createAssignee === "" ? "text-white" : "text-black"}
            >
              Khong giao ngay
            </Text>
          </Pressable>
          {users.map((u) => (
            <Pressable
              key={u._id}
              onPress={() => setCreateAssignee(u._id)}
              className={`px-3 py-2 rounded-lg border ${createAssignee === u._id ? "bg-green-600 border-green-600" : "bg-white border-gray-300"}`}
            >
              <Text
                className={
                  createAssignee === u._id ? "text-white" : "text-black"
                }
              >
                {u.username || u.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Pressable
        onPress={onCreateTask}
        disabled={creating}
        className={`rounded-xl py-3 items-center ${creating ? "bg-blue-300" : "bg-blue-600"}`}
      >
        <Text className="text-white font-semibold">
          {creating ? "Dang tao..." : "Tao cong viec"}
        </Text>
      </Pressable>
    </View>
  );
}
