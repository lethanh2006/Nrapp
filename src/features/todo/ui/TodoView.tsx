import TodoCreateTaskCard from "@/src/features/todo/ui/TodoCreateTaskCard";
import TodoIntroCard from "@/src/features/todo/ui/TodoIntroCard";
import TodoTaskListCard from "@/src/features/todo/ui/TodoTaskListCard";
import type { AppArea } from "@/src/application/access/roles";
import type {
  CreateTaskInput,
  TaskItem,
  TaskPriority,
  TaskStatus,
} from "@/src/services/todo/constant";
import { useAuthSession } from "@/src/features/auth/model/AuthSessionContext";
import { normalizeUser } from "@/src/features/user/model/normalize-user";
import {
  assignTodoTask,
  createTodoTask,
  deleteTodoTask,
  getAdminTasks,
  getMyTasks,
  updateTodoStatus,
} from "@/src/services/todo/todo.service";
import { getAllUsers } from "@/src/services/user/user.service";
import { AppAlert as Alert } from "@/src/shared/ui/AppAlert";
import type { User } from "@/src/services/user/constant";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";

interface TodoViewProps {
  area: AppArea;
}

export default function TodoView({ area }: TodoViewProps) {
  const { loading: appLoading, isAuth, user, getToken } = useAuthSession();
  const isAdminArea = area === "admin";
  const [users, setUsers] = useState<User[]>([]);

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [createAssignee, setCreateAssignee] = useState<string>("");

  const [assignByTask, setAssignByTask] = useState<Record<string, string>>({});

  const selectableUsers = useMemo(() => {
    const currentUserId = user?._id;
    return (users || []).filter((candidate) => candidate._id !== currentUserId);
  }, [users, user?._id]);

  const loadTasks = useCallback(async () => {
    if (!isAuth) return;

    try {
      const token = await getToken();
      if (!token) return;

      setTasks(
        isAdminArea ? await getAdminTasks(token) : await getMyTasks(token),
      );
      if (isAdminArea) {
        const { data } = await getAllUsers(token);
        setUsers((data.users ?? []).map(normalizeUser));
      }
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message || "Không tải được công việc",
      );
    }
  }, [getToken, isAdminArea, isAuth]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      await loadTasks();
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [loadTasks]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const createTask = async () => {
    if (!title.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập tiêu đề");
      return;
    }

    if (createAssignee && createAssignee === user?._id) {
      Alert.alert("Thông báo", "Không thể tự giao việc cho chính mình");
      return;
    }

    try {
      setCreating(true);
      const payload: CreateTaskInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
      };

      if (deadline) payload.deadline = deadline.toISOString();
      if (createAssignee) payload.assignedTo = createAssignee;

      const token = await getToken();
      if (!token) return;
      await createTodoTask(token, payload);
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDeadline(null);
      setCreateAssignee("");
      await loadTasks();
      Alert.alert("Thành công", "Đã tạo công việc");
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message || "Không tạo được công việc",
      );
    } finally {
      setCreating(false);
    }
  };

  const assignTask = async (taskId: string) => {
    const assignedTo = assignByTask[taskId];
    if (!assignedTo) {
      Alert.alert("Thông báo", "Hãy chọn người được giao");
      return;
    }

    if (assignedTo === user?._id) {
      Alert.alert("Thông báo", "Không thể tự giao việc cho chính mình");
      return;
    }

    try {
      setAssigningTaskId(taskId);
      const token = await getToken();
      if (!token) return;
      await assignTodoTask(token, taskId, assignedTo);
      await loadTasks();
      Alert.alert("Thành công", "Đã giao công việc");
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message || "Không giao được công việc",
      );
    } finally {
      setAssigningTaskId(null);
    }
  };

  const updateStatus = async (taskId: string, status: TaskStatus) => {
    try {
      setUpdatingTaskId(taskId);
      const token = await getToken();
      if (!token) return;
      await updateTodoStatus(token, taskId, status);
      await loadTasks();
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message || "Không cập nhật được trạng thái",
      );
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const removeTask = async (taskId: string) => {
    try {
      setDeletingTaskId(taskId);
      const token = await getToken();
      if (!token) return;
      await deleteTodoTask(token, taskId);
      await loadTasks();
      Alert.alert("Thành công", "Đã xoá công việc");
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message || "Không xoá được công việc",
      );
    } finally {
      setDeletingTaskId(null);
    }
  };

  if (appLoading || loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ padding: 16, gap: 14 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <TodoIntroCard area={area} />

      {isAdminArea ? (
        <TodoCreateTaskCard
          title={title}
          description={description}
          deadline={deadline}
          priority={priority}
          createAssignee={createAssignee}
          users={selectableUsers}
          creating={creating}
          setTitle={setTitle}
          setDescription={setDescription}
          setDeadline={setDeadline}
          setPriority={setPriority}
          setCreateAssignee={setCreateAssignee}
          onCreateTask={createTask}
        />
      ) : null}

      <TodoTaskListCard
        area={area}
        tasks={tasks}
        users={selectableUsers}
        currentUser={user}
        assignByTask={assignByTask}
        assigningTaskId={assigningTaskId}
        updatingTaskId={updatingTaskId}
        deletingTaskId={deletingTaskId}
        onSelectAssignUser={(taskId, userId) =>
          setAssignByTask((prev) => ({
            ...prev,
            [taskId]: userId,
          }))
        }
        onAssignTask={assignTask}
        onUpdateStatus={updateStatus}
        onRemoveTask={removeTask}
      />
    </ScrollView>

  );
}
