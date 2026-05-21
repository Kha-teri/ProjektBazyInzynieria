const BASE_URL = 'http://localhost:3000/api';

export const getToken = () => localStorage.getItem('brainshelf_token');
export const setToken = (token: string) => localStorage.setItem('brainshelf_token', token);
export const removeToken = () => localStorage.removeItem('brainshelf_token');

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error || 'Request failed');
  }

  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}
