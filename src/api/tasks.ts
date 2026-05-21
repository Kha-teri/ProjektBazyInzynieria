import { apiRequest } from './client';

export interface Task {
  id: number;
  title: string;
  description?: string;
  due_date?: string;
  status: string;
  subject_id?: number;
  subject?: { id: number; name: string; color_code?: string };
}

export interface CreateTaskData {
  title: string;
  description?: string;
  due_date?: string;
  subject_id?: number;
}

export const getTasks = () => apiRequest<Task[]>('/tasks');

export const createTask = (data: CreateTaskData) =>
  apiRequest<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) });

export const updateTaskStatus = (id: number, status: string) =>
  apiRequest<Task>(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

export const deleteTask = (id: number) =>
  apiRequest<{ message: string }>(`/tasks/${id}`, { method: 'DELETE' });
