import api from '@/lib/api';
import type { IPixelBoard, PixelBoardStatus } from '@/types';

export interface CreatePixelBoardPayload {
  name: string;
  width: number;
  height: number;
  delay_seconds?: number;
  allow_override?: boolean;
  status?: PixelBoardStatus;
}

export async function getAll(): Promise<IPixelBoard[]> {
  const { data } = await api.get<IPixelBoard[]>('/pixelboards');
  return data;
}

export async function getById(id: string): Promise<IPixelBoard> {
  const { data } = await api.get<IPixelBoard>(`/pixelboards/${id}`);
  return data;
}

export async function create(payload: CreatePixelBoardPayload): Promise<IPixelBoard> {
  const { data } = await api.post<IPixelBoard>('/pixelboards', payload);
  return data;
}
