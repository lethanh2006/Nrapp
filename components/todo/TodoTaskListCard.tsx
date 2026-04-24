import { User } from "@/context/AppContext";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { RelatedUser, STATUS_OPTIONS, TaskItem, TaskStatus } from "./types";

type Props = {
  isAdmin: boolean;
  tasks: TaskItem[];
  users: User[];
  assignByTask: Record<string, string>;
  assigningTaskId: string | null;
  updatingTaskId: string | null;
  deletingTaskId: string | null;
  onSelectAssignUser: (taskId: string, userId: string) => void;
  onAssignTask: (taskId: string) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onRemoveTask: (taskId: string) => void;
};

const displayName = (value?: string | RelatedUser) => {
  if (!value) return "Chua giao";
  if (typeof value === "string") return value;
  return value.username || value.name || value.email || value._id;
};

export default function TodoTaskListCard({
  isAdmin,
  tasks,
  users,
  assignByTask,
  assigningTaskId,
  updatingTaskId,
  deletingTaskId,
  onSelectAssignUser,
  onAssignTask,
  onUpdateStatus,
  onRemoveTask,
}: Props) {
  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-200">
      <Text className="text-lg font-semibold text-black mb-3">
        {isAdmin ? "Tat ca cong viec" : "Cong viec cua toi"}
      </Text>

      {tasks.length === 0 ? (
        <Text className="text-gray-500">Chua co cong viec nao</Text>
      ) : (
        <View style={{ gap: 12 }}>
          {tasks.map((task) => (
            <View
              key={task._id}
              className="border border-gray-200 rounded-xl p-3 bg-gray-50"
            >
              <Text className="text-base font-semibold text-black">
                {task.title}
              </Text>
              {!!task.description && (
                <Text className="text-gray-700 mt-1">{task.description}</Text>
              )}

              <Text className="text-gray-600 mt-2">
                Trang thai: {task.status}
              </Text>
              <Text className="text-gray-600">Uu tien: {task.priority}</Text>
              <Text className="text-gray-600">
                Nguoi giao: {displayName(task.createdBy)}
              </Text>
              <Text className="text-gray-600">
                Nguoi nhan: {displayName(task.assignedTo)}
              </Text>

              <Text className="text-gray-600">
                Deadline:{" "}
                {task.deadline
                  ? new Date(task.deadline).toLocaleString()
                  : "Khong co"}
              </Text>

              <Text className="text-sm text-gray-700 mt-3 mb-2">
                Cap nhat trang thai
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {STATUS_OPTIONS.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => onUpdateStatus(task._id, s)}
                    disabled={updatingTaskId === task._id}
                    className={`px-3 py-2 rounded-lg border ${task.status === s ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"}`}
                  >
                    <Text
                      className={
                        task.status === s ? "text-white" : "text-black"
                      }
                    >
                      {s}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {isAdmin ? (
                <View className="mt-3">
                  <Text className="text-sm text-gray-700 mb-2">
                    Giao lai cong viec
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row" style={{ gap: 8 }}>
                      {users.map((u) => (
                        <Pressable
                          key={`${task._id}_${u._id}`}
                          onPress={() => onSelectAssignUser(task._id, u._id)}
                          className={`px-3 py-2 rounded-lg border ${assignByTask[task._id] === u._id ? "bg-emerald-600 border-emerald-600" : "bg-white border-gray-300"}`}
                        >
                          <Text
                            className={
                              assignByTask[task._id] === u._id
                                ? "text-white"
                                : "text-black"
                            }
                          >
                            {u.username || u.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>

                  <View className="flex-row mt-3" style={{ gap: 8 }}>
                    <Pressable
                      onPress={() => onAssignTask(task._id)}
                      disabled={assigningTaskId === task._id}
                      className={`flex-1 rounded-lg py-3 items-center ${assigningTaskId === task._id ? "bg-emerald-300" : "bg-emerald-600"}`}
                    >
                      <Text className="text-white font-semibold">
                        {assigningTaskId === task._id
                          ? "Dang giao..."
                          : "Giao viec"}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => onRemoveTask(task._id)}
                      disabled={deletingTaskId === task._id}
                      className={`flex-1 rounded-lg py-3 items-center ${deletingTaskId === task._id ? "bg-red-300" : "bg-red-600"}`}
                    >
                      <Text className="text-white font-semibold">
                        {deletingTaskId === task._id ? "Dang xoa..." : "Xoa"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
