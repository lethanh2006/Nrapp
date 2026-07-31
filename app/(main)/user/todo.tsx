import { userTodoApi } from "@/src/api/todo.api";
import TodoView from "@/src/features/todo/ui/TodoView";

export default function UserTodoRoute() {
  return <TodoView todoApi={userTodoApi} />;
}
