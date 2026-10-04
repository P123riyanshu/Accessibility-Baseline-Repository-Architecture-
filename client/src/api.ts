export type ServiceTask = {
  id: number;
  title: string;
  completed: boolean;
  assignee: string;
};

type ApiTodo = {
  id: number;
  title: string;
  completed: boolean;
  userId: number;
};

type ApiUser = {
  id: number;
  name: string;
};

async function readJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`The task service returned an error (${response.status}).`);
  }
  const data: unknown = await response.json();
  return data;
}

function isApiTodo(value: unknown): value is ApiTodo {
  if (typeof value !== "object" || value === null) return false;
  return "id" in value && typeof value.id === "number"
    && "userId" in value && typeof value.userId === "number"
    && "title" in value && typeof value.title === "string"
    && "completed" in value && typeof value.completed === "boolean";
}

function isApiUser(value: unknown): value is ApiUser {
  if (typeof value !== "object" || value === null) return false;
  return "id" in value && typeof value.id === "number"
    && "name" in value && typeof value.name === "string";
}

export async function fetchServiceTasks(signal: AbortSignal): Promise<ServiceTask[]> {
  const [todoData, userData] = await Promise.all([
    readJson("https://jsonplaceholder.typicode.com/todos?_limit=30", signal),
    readJson("https://jsonplaceholder.typicode.com/users", signal),
  ]);

  if (!Array.isArray(todoData) || !todoData.every(isApiTodo)) {
    throw new Error("The task service returned tasks in an unexpected format.");
  }
  if (!Array.isArray(userData) || !userData.every(isApiUser)) {
    throw new Error("The task service returned assignees in an unexpected format.");
  }

  const assignees = new Map<number, string>(
    userData.map((user) => [user.id, user.name] as const),
  );

  return todoData.map((todo) => ({
    id: todo.id,
    title: todo.title,
    completed: todo.completed,
    assignee: assignees.get(todo.userId) ?? `Team member ${todo.userId}`,
  }));
}
