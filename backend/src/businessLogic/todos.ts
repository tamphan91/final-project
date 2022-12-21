import * as uuid from 'uuid';
import { TodosAccess } from '../dataLayer/todosAccess';
import { TodoItem } from '../models/TodoItem';
import { CreateTodoRequest } from '../requests/CreateTodoRequest';
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest';

const todosAccess = new TodosAccess()

export async function getTodos(userId: string): Promise<TodoItem[]> {
  return todosAccess.getAllTodos(userId);
}

export async function getTodo(userId: string, todoId: string): Promise<TodoItem> {
  return todosAccess.getTodo(userId, todoId);
}

export async function updateTodo(userId: string, todoId: string, payload: UpdateTodoRequest) : Promise<void>{
  return todosAccess.updateTodo(userId, todoId, payload);
}

export async function updateTodoAttachment(userId: string, todoId: string): Promise<void> {
  return todosAccess.updateTodoAttachment(userId, todoId);
}

export async function removeTodoAttachment(userId: string, todoId: string): Promise<void> {
  return todosAccess.removeTodoAttachment(userId, todoId);
}

export async function deleteTodo(userId: string, todoId: string): Promise<void> {
  return todosAccess.deleteTodo(userId, todoId);
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {
  const id = uuid.v4();

  return await todosAccess.createTodo({
    todoId: id,
    userId,
    name: createTodoRequest.name,
    done: false,
    createdAt: new Date().toISOString(),
    dueDate: createTodoRequest.dueDate
  })
}