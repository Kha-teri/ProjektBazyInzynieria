import { apiRequest } from './client';

export interface Subject {
  id: number;
  name: string;
  lecturer_name?: string;
  color_code?: string;
}

export const getSubjects = () => apiRequest<Subject[]>('/subjects');

export const createSubject = (data: Omit<Subject, 'id'>) =>
  apiRequest<Subject>('/subjects', { method: 'POST', body: JSON.stringify(data) });

export const updateSubject = (id: number, data: Partial<Omit<Subject, 'id'>>) =>
  apiRequest<Subject>(`/subjects/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteSubject = (id: number) =>
  apiRequest<{ message: string }>(`/subjects/${id}`, { method: 'DELETE' });
