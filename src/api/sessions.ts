import { apiRequest } from './client';

export interface StudySession {
  id: number;
  start_time: string;
  end_time?: string;
  reward_points: number;
}

export const startSession = () =>
  apiRequest<StudySession>('/sessions/start', { method: 'POST' });

export const stopSession = (id: number) =>
  apiRequest<StudySession>(`/sessions/stop/${id}`, { method: 'POST' });

export const getSessions = () => apiRequest<StudySession[]>('/sessions');
