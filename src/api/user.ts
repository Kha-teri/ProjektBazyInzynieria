import { apiRequest } from './client';

export interface UserProfile {
  id: number;
  email: string;
  total_points: number;
  level: number;
  word_goal: number;
}

export const getProfile = () => apiRequest<UserProfile>('/user/profile');
