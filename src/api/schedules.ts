import { apiRequest } from './client';

export interface ClassSchedule {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  subject_id?: number;
  subject?: { id: number; name: string; color_code?: string };
}

export interface CreateScheduleData {
  date: string;
  start_time: string;
  end_time: string;
  subject_id?: number;
}

export const getSchedules = () => apiRequest<ClassSchedule[]>('/schedules');

export const createSchedule = (data: CreateScheduleData) =>
  apiRequest<ClassSchedule>('/schedules', { method: 'POST', body: JSON.stringify(data) });

export const updateSchedule = (id: number, data: Partial<CreateScheduleData>) =>
  apiRequest<ClassSchedule>(`/schedules/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteSchedule = (id: number) =>
  apiRequest<{ message: string }>(`/schedules/${id}`, { method: 'DELETE' });
