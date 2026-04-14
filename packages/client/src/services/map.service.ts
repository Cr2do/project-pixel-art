import api from '@/lib/api';

export interface MapPixel {
  x: number;
  y: number;
  color: string;
}

export interface MapBoard {
  id: string;
  name: string;
  status: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  pixels: MapPixel[];
}

export interface GlobalMapResponse {
  boards: MapBoard[];
  globalWidth: number;
  globalHeight: number;
}

export async function getGlobalMap(): Promise<GlobalMapResponse> {
  const { data } = await api.get<GlobalMapResponse>('/map');
  return data;
}
