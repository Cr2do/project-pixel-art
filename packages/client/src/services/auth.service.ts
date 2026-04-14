import api from '@/lib/api';
import type { IUser } from '@/types';

const TOKEN_KEY = 'token';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

interface ApiUser {
  _id?: string;
  id?: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  token: string;
  user: ApiUser;
}

export interface ForgotPasswordResponse {
  message: string;
  resetPath?: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

function mapUser(u: ApiUser): IUser {
  return {
    id: (u.id ?? u._id) as string,
    firstname: u.firstname,
    lastname: u.lastname,
    email: u.email,
    role: u.role as IUser['role'],
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function login(payload: LoginPayload): Promise<IUser> {
  const { data } = await api.post<AuthResponse>('/auth/login', payload);
  localStorage.setItem(TOKEN_KEY, data.token);
  return mapUser(data.user);
}

export async function register(payload: RegisterPayload): Promise<IUser> {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  localStorage.setItem(TOKEN_KEY, data.token);
  return mapUser(data.user);
}

export async function me(): Promise<IUser> {
  const { data } = await api.get<ApiUser>('/auth/me');
  return mapUser(data);
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  const { data } = await api.post<ForgotPasswordResponse>('/auth/forgot-password', { email });
  return data;
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>('/auth/reset-password', payload);
  return data;
}

export function logout(): void {
  clearToken();
}
