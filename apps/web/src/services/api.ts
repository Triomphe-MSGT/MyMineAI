import axios from 'axios';
import { useUserStore } from '@/stores/userStore';

const API_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useUserStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface AuthResponse {
  user: { id: string; email: string; name: string; avatar?: string | null };
  token: string;
}

export interface Room {
  id: string;
  slug: string;
  name?: string | null;
  maxParticipants: number;
  isActive: boolean;
  createdAt: string;
}

export const authApi = {
  register: (email: string, password: string, name: string) =>
    api.post<AuthResponse>('/auth/register', { email, password, name }),
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

export const roomApi = {
  create: (name?: string, maxParticipants?: number) =>
    api.post<Room>('/rooms', { name, maxParticipants }),
  get: (slug: string) => api.get(`/rooms/${slug}`),
  join: (slug: string) => api.post(`/rooms/${slug}/join`, {}),
  messages: (slug: string) => api.get(`/rooms/${slug}/messages`),
};
