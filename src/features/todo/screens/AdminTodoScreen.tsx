import { adminTodoApi } from "@/src/features/todo/api/admin-todo.api";
import { adminUserDirectory } from "@/src/entities/user/api/admin-user-directory.api";
import TodoScreen from "@/src/features/todo/screens/TodoScreen";

export default function AdminTodoScreen() {
  return (
    <TodoScreen
      todoApi={adminTodoApi}
      userDirectory={adminUserDirectory}
    />
  );
}
