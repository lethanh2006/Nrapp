import { userTodoApi } from "@/src/features/todo/api/user-todo.api";
import TodoScreen from "@/src/features/todo/screens/TodoScreen";

export default function UserTodoScreen() {
  return <TodoScreen todoApi={userTodoApi} />;
}
