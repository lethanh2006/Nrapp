import type { User } from "@/types/api";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import {
  PRIORITY_MAP,
  RelatedUser,
  STATUS_MAP,
  STATUS_OPTIONS,
  TaskItem,
  TaskStatus,
} from "./types";

type Props = {
  isAdmin: boolean;
  tasks: TaskItem[];
  users: User[];
  currentUser?: User | null;
  assignByTask: Record<string, string>;
  assigningTaskId: string | null;
  updatingTaskId: string | null;
  deletingTaskId: string | null;
  onSelectAssignUser: (taskId: string, userId: string) => void;
  onAssignTask: (taskId: string) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onRemoveTask: (taskId: string) => void;
};

const displayName = (
  value?: string | RelatedUser,
  users: User[] = [],
  currentUser?: User | null,
) => {
  if (!value) return "Chưa phân công";
  const targetId = typeof value === "string" ? value : value._id;

  if (currentUser && targetId === currentUser._id) {
    return (currentUser.username || currentUser.name || "Tôi") + " (Bạn)";
  }

  if (typeof value === "string") {
    const matchedUser = users.find((user) => user._id === value);
    return matchedUser ? matchedUser.username || matchedUser.name : value;
  }
  return value.username || value.name || value.email || value._id;
};

export default function TodoTaskListCard({
  isAdmin,
  tasks,
  users,
  currentUser,
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
    <View className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
      <View className="flex-row items-center justify-between mb-4 pb-2 border-b border-slate-50">
        <View className="flex-row items-center">
          <View className="bg-blue-500/10 p-1.5 rounded-lg mr-2">
            <Ionicons name="list-outline" size={20} color="#3b82f6" />
          </View>
          <Text className="text-base font-bold text-slate-800">
            {isAdmin ? "Tất cả công việc" : "Công việc của tôi"}
          </Text>
        </View>
        <View className="bg-slate-100 px-2.5 py-1 rounded-full">
          <Text className="text-xs font-bold text-slate-600">
            {tasks.length} việc
          </Text>
        </View>
      </View>

      {tasks.length === 0 ? (
        <View className="items-center justify-center py-8">
          <Ionicons name="file-tray-outline" size={40} color="#cbd5e1" />
          <Text className="text-slate-400 text-sm font-medium mt-2">
            Chưa có công việc nào được phân công
          </Text>
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          {tasks.map((task) => {
            const isOverdue =
              task.deadline &&
              new Date(task.deadline) < new Date() &&
              task.status !== "done";
            const priorityInfo = PRIORITY_MAP[task.priority];
            const statusInfo = STATUS_MAP[task.status];

            return (
              <View
                key={task._id}
                className="border border-slate-100 rounded-2xl p-4 bg-slate-50/30"
              >
                {/* Header: Title and Priority Badge */}
                <View className="flex-row items-start justify-between">
                  <Text className="text-sm font-bold text-slate-800 flex-1 mr-2 leading-relaxed">
                    {task.title}
                  </Text>
                  <View
                    className={`px-2 py-0.5 rounded-lg border flex-row items-center ${priorityInfo.bgClass} ${priorityInfo.borderClass}`}
                  >
                    <Ionicons
                      name={priorityInfo.icon as any}
                      size={10}
                      color={
                        task.priority === "high"
                          ? "#f43f5e"
                          : task.priority === "medium"
                          ? "#d97706"
                          : "#64748b"
                      }
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      className={`text-[10px] font-bold ${priorityInfo.textClass}`}
                    >
                      {priorityInfo.label}
                    </Text>
                  </View>
                </View>

                {/* Description */}
                {!!task.description && (
                  <Text className="text-xs text-slate-500 mt-2 bg-white/70 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                    {task.description}
                  </Text>
                )}

                {/* Workflow Path: Handoff and Assignee */}
                <View className="flex-row items-center mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                  <View className="flex-1 flex-row items-center">
                    <Ionicons
                      name="paper-plane-outline"
                      size={13}
                      color="#64748b"
                    />
                    <View className="ml-1.5">
                      <Text className="text-[10px] text-slate-400 font-medium leading-none">
                        Giao bởi
                      </Text>
                      <Text className="text-[11px] text-slate-700 font-bold mt-0.5">
                        {displayName(task.createdBy, users, currentUser)}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name="arrow-forward"
                    size={12}
                    color="#cbd5e1"
                    style={{ marginHorizontal: 8 }}
                  />
                  <View className="flex-1 flex-row items-center">
                    <Ionicons name="person-outline" size={13} color="#64748b" />
                    <View className="ml-1.5">
                      <Text className="text-[10px] text-slate-400 font-medium leading-none">
                        Người nhận
                      </Text>
                      <Text className="text-[11px] text-slate-700 font-bold mt-0.5">
                        {displayName(task.assignedTo, users, currentUser)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Deadline */}
                {task.deadline ? (
                  <View
                    className={`flex-row items-center mt-2.5 px-3 py-2 rounded-xl border ${
                      isOverdue
                        ? "bg-rose-50 border-rose-100"
                        : "bg-slate-50 border-slate-100"
                    }`}
                  >
                    <Ionicons
                      name={
                        isOverdue
                          ? "alert-circle-outline"
                          : "calendar-outline"
                      }
                      size={14}
                      color={isOverdue ? "#f43f5e" : "#64748b"}
                    />
                    <Text
                      className={`text-xs ml-1.5 font-medium ${
                        isOverdue ? "text-rose-600 font-semibold" : "text-slate-600"
                      }`}
                    >
                      Hạn chót: {new Date(task.deadline).toLocaleString()}
                      {isOverdue ? " (Đã quá hạn!)" : ""}
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row items-center mt-2.5 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color="#64748b"
                    />
                    <Text className="text-xs text-slate-500 ml-1.5 font-medium">
                      Không có thời hạn cụ thể
                    </Text>
                  </View>
                )}

                {/* Current Status Badge */}
                <View className="flex-row items-center mt-3">
                  <Text className="text-xs font-semibold text-slate-400 mr-2">
                    Trạng thái hiện tại:
                  </Text>
                  <View
                    className={`px-2.5 py-0.5 rounded-full border flex-row items-center ${statusInfo.bgClass} ${statusInfo.borderClass}`}
                  >
                    <Ionicons
                      name={statusInfo.icon as any}
                      size={11}
                      color={
                        task.status === "todo"
                          ? "#2563eb"
                          : task.status === "in_progress"
                          ? "#d97706"
                          : task.status === "done"
                          ? "#16a34a"
                          : "#6b7280"
                      }
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      className={`text-xs font-semibold ${statusInfo.textClass}`}
                    >
                      {statusInfo.label}
                    </Text>
                  </View>
                </View>

                {/* Update Status Actions */}
                <Text className="text-xs font-bold text-slate-700 mt-4 mb-2">
                  Cập nhật trạng thái công việc
                </Text>
                <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                  {STATUS_OPTIONS.map((s) => {
                    const isActive = task.status === s;
                    const statusConfig = STATUS_MAP[s];

                    return (
                      <Pressable
                        key={s}
                        onPress={() => onUpdateStatus(task._id, s)}
                        disabled={updatingTaskId === task._id}
                        className={`px-3 py-2 rounded-xl border flex-row items-center ${
                          isActive
                            ? `${statusConfig.bgClass} ${statusConfig.borderClass}`
                            : "bg-white border-slate-200"
                        }`}
                      >
                        {isActive && (
                          <Ionicons
                            name={statusConfig.icon as any}
                            size={12}
                            color={
                              s === "todo"
                                ? "#2563eb"
                                : s === "in_progress"
                                ? "#d97706"
                                : s === "done"
                                ? "#16a34a"
                                : "#6b7280"
                            }
                            style={{ marginRight: 4 }}
                          />
                        )}
                        <Text
                          className={`text-xs font-semibold ${
                            isActive
                              ? statusConfig.textClass
                              : "text-slate-600"
                          }`}
                        >
                          {statusConfig.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Admin Actions */}
                {isAdmin ? (
                  <View className="mt-4 pt-3 border-t border-slate-100">
                    <Text className="text-xs font-bold text-slate-700 mb-2">
                      Bàn giao công việc cho nhân viên khác
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      <View className="flex-row py-0.5" style={{ gap: 8 }}>
                        {users.map((u) => {
                          const isSelected = assignByTask[task._id] === u._id;
                          return (
                            <Pressable
                              key={`${task._id}_${u._id}`}
                              onPress={() =>
                                onSelectAssignUser(task._id, u._id)
                              }
                              className={`px-3 py-1.5 rounded-xl border flex-row items-center ${
                                isSelected
                                  ? "bg-slate-800 border-slate-800 shadow-sm"
                                  : "bg-white border-slate-200"
                              }`}
                            >
                              <Ionicons
                                name="person-outline"
                                size={12}
                                color={isSelected ? "#ffffff" : "#64748b"}
                                style={{ marginRight: 4 }}
                              />
                              <Text
                                className={`text-xs font-semibold ${
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

                    <View className="flex-row mt-4" style={{ gap: 8 }}>
                      <Pressable
                        onPress={() => onAssignTask(task._id)}
                        disabled={assigningTaskId === task._id}
                        className={`flex-1 rounded-xl py-3 items-center flex-row justify-center ${
                          assigningTaskId === task._id
                            ? "bg-emerald-300"
                            : "bg-emerald-600 active:bg-emerald-700 shadow-sm"
                        }`}
                      >
                        <Ionicons
                          name="person-add-outline"
                          size={14}
                          color="#ffffff"
                          style={{ marginRight: 6 }}
                        />
                        <Text className="text-white font-bold text-xs">
                          {assigningTaskId === task._id
                            ? "Đang giao..."
                            : "Bàn giao"}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => onRemoveTask(task._id)}
                        disabled={deletingTaskId === task._id}
                        className={`flex-1 rounded-xl py-3 items-center flex-row justify-center border border-rose-100 ${
                          deletingTaskId === task._id
                            ? "bg-rose-100"
                            : "bg-rose-50 active:bg-rose-100"
                        }`}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={14}
                          color="#ef4444"
                          style={{ marginRight: 6 }}
                        />
                        <Text className="text-rose-600 font-bold text-xs">
                          {deletingTaskId === task._id
                            ? "Đang xóa..."
                            : "Xóa việc"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
