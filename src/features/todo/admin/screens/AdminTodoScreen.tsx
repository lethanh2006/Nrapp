import { canManageTasks } from "@/src/application/access/roles";
import { useAuthSession } from "@/src/features/auth/model/AuthSessionContext";
import TodoView from "@/src/features/todo/shared/ui/TodoView";

export default function AdminTodoScreen() {
  const { user } = useAuthSession();

  return <TodoView area={canManageTasks(user?.role) ? "admin" : "user"} />;
}
