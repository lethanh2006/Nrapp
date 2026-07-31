import { userApi } from "@/src/api/user.api";
import { adminTodoApi } from "@/src/api/todo.api";
import TodoView from "@/src/features/todo/ui/TodoView";

export default function AdminTodoRoute() {
  return (
    <TodoView
      todoApi={adminTodoApi}
      userDirectory={userApi}
    />
  );
}
