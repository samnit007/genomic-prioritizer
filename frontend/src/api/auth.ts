import client from './client';
import type { User } from '@/types';

export const authApi = {
  login: (username: string, password: string) =>
    client.post<{ token: string; user: User }>('/auth/login', { username, password }),

  getMe: () => client.get<User>('/auth/me'),
};
