import TodoCreateTaskCard from "@/src/features/todo/ui/TodoCreateTaskCard";
import TodoIntroCard from "@/src/features/todo/ui/TodoIntroCard";
import TodoTaskListCard from "@/src/features/todo/ui/TodoTaskListCard";
import { TaskItem, TaskPriority, TaskStatus } from "@/src/features/todo/model/todo.types";
import { useAuthSession } from "@/src/features/auth/model/AuthSessionContext";
import { normalizeUser } from "@/src/entities/user/model/normalize-user";
import type { TodoApi } from "@/src/features/todo/api/todo-api.types";
import type { UserDirectory } from "@/src/entities/user/api/user-directory.types";
import type { User } from "@/src/entities/user/model/user.types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";

interface TodoViewProps {
  todoApi: TodoApi;
  userDirectory?: UserDirectory;
}

export default function TodoView({ todoApi, userDirectory }: TodoViewProps) {
  const { loading: appLoading, isAuth, user } = useAuthSession();
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

  const isAdmin = todoApi.canManage;
  const selectableUsers = useMemo(() => {
    const currentUserId = user?._id;
    return (users || []).filter((candidate) => candidate._id !== currentUserId);
  }, [users, user?._id]);

  const loadTasks = useCallback(async () => {
    if (!isAuth) return;

    try {
      setTasks(await todoApi.getTasks());
      if (userDirectory) {
        const { data } = await userDirectory.getAll();
        setUsers((data.users ?? []).map(normalizeUser));
      }
    } catch (error: any) {
      Alert.alert(
        "Loi",
        error?.response?.data?.message || "Khong tai duoc cong viec",
      );
    }
  }, [isAuth, todoApi, userDirectory]);

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
      Alert.alert("Thong bao", "Vui long nhap tieu de");
      return;
    }

    if (createAssignee && createAssignee === user?._id) {
      Alert.alert("Thong bao", "Khong the tu giao viec cho chinh minh");
      return;
    }

    try {
      setCreating(true);
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
      };

      if (deadline) payload.deadline = deadline.toISOString();
      if (createAssignee) payload.assignedTo = createAssignee;

      await todoApi.createTask?.(payload as any);
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDeadline(null);
      setCreateAssignee("");
      await loadTasks();
      Alert.alert("Thanh cong", "Da tao cong viec");
    } catch (error: any) {
      Alert.alert(
        "Loi",
        error?.response?.data?.message || "Khong tao duoc cong viec",
      );
    } finally {
      setCreating(false);
    }
  };

  const assignTask = async (taskId: string) => {
    const assignedTo = assignByTask[taskId];
    if (!assignedTo) {
      Alert.alert("Thong bao", "Hay chon nguoi duoc giao");
      return;
    }

    if (assignedTo === user?._id) {
      Alert.alert("Thong bao", "Khong the tu giao viec cho chinh minh");
      return;
    }

    try {
      setAssigningTaskId(taskId);
      await todoApi.assignTask?.(taskId, assignedTo);
      await loadTasks();
      Alert.alert("Thanh cong", "Da giao cong viec");
    } catch (error: any) {
      Alert.alert(
        "Loi",
        error?.response?.data?.message || "Khong giao duoc cong viec",
      );
    } finally {
      setAssigningTaskId(null);
    }
  };

  const updateStatus = async (taskId: string, status: TaskStatus) => {
    try {
      setUpdatingTaskId(taskId);
      await todoApi.updateStatus(taskId, status);
      await loadTasks();
    } catch (error: any) {
      Alert.alert(
        "Loi",
        error?.response?.data?.message || "Khong cap nhat duoc trang thai",
      );
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const removeTask = async (taskId: string) => {
    try {
      setDeletingTaskId(taskId);
      await todoApi.deleteTask?.(taskId);
      await loadTasks();
      Alert.alert("Thanh cong", "Da xoa cong viec");
    } catch (error: any) {
      Alert.alert(
        "Loi",
        error?.response?.data?.message || "Khong xoa duoc cong viec",
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
      <TodoIntroCard isAdmin={isAdmin} />

      {isAdmin ? (
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
        isAdmin={isAdmin}
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
