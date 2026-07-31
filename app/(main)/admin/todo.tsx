import { adminUserDirectory } from "@/src/entities/user/api/user-directory.api";
import { adminTodoApi } from "@/src/features/todo/api/admin-todo.api";
import TodoView from "@/src/features/todo/ui/TodoView";

export default function AdminTodoRoute() {
  return (
    <TodoView
      todoApi={adminTodoApi}
      userDirectory={adminUserDirectory}
    />
  );
}
