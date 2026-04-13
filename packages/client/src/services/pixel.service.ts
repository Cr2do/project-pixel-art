import api from '@/lib/api';
import type { IPixel } from '@/types';

export interface PlacePixelPayload {
  position_x: number;
  position_y: number;
  color: string;
}

export async function getByBoard(boardId: string): Promise<IPixel[]> {
  const { data } = await api.get<IPixel[]>(`/pixelboards/${boardId}/pixels`);
  return data;
}

export async function placePixel(boardId: string, payload: PlacePixelPayload): Promise<IPixel> {
  const { data } = await api.post<IPixel>(`/pixelboards/${boardId}/pixels`, payload);
  return data;
}
