import api from '@/lib/api';
import type { IUser } from '@/types';

export interface UpdateUserPayload {
  firstname?: string;
  lastname?: string;
  email?: string;
  password?: string;
}

export interface UserStats {
  totalPixels: number;
  boardsContributed: number;
}

export async function updateMe(payload: UpdateUserPayload): Promise<IUser> {
  const { data } = await api.put<IUser>('/users/me', payload);
  return data;
}

export async function getMyStats(): Promise<UserStats> {
  const { data } = await api.get<UserStats>('/users/me/stats');
  return data;
}
