import { apiRequest } from './client';

export interface Material {
  id: number;
  title: string;
  type: string;
  content?: string;
  subject_id?: number;
  subject?: { id: number; name: string };
}

export interface CreateMaterialData {
  title: string;
  type: string;
  content?: string;
  subject_id?: number;
}

export const getMaterials = () => apiRequest<Material[]>('/materials');

export const createMaterial = (data: CreateMaterialData) =>
  apiRequest<Material>('/materials', { method: 'POST', body: JSON.stringify(data) });

export const updateMaterial = (id: number, data: Partial<CreateMaterialData>) =>
  apiRequest<Material>(`/materials/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteMaterial = (id: number) =>
  apiRequest<{ message: string }>(`/materials/${id}`, { method: 'DELETE' });
