import { adminTodoService } from "@/src/features/admin/services/todo.service";
import { adminUserDirectory } from "@/src/features/admin/services/user-directory.service";
import TodoScreen from "@/src/features/shared/todo/screens/TodoScreen";

export default function AdminTodoScreen() {
  return (
    <TodoScreen
      todoService={adminTodoService}
      userDirectory={adminUserDirectory}
    />
  );
}

