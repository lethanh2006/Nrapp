import { userTodoService } from "@/src/features/user/services/todo.service";
import TodoScreen from "@/src/features/shared/todo/screens/TodoScreen";

export default function UserTodoScreen() {
  return <TodoScreen todoService={userTodoService} />;
}
