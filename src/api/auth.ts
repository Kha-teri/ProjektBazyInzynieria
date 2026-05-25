import { apiRequest } from './client';

export interface AuthUser {
  id: number;
  email: string;
  nickname: string;
  level: number;
  points: number;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export const login = (email: string, password: string) =>
  apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const register = (
  email: string,
  password: string,
  nickname: string,
  control_question?: string,
  answer?: string
) =>
  apiRequest<{ message: string; userId: number }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, nickname, control_question, answer }),
  });
