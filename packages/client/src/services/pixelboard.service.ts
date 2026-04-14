import api from '@/lib/api';
import type { IPixelBoard, PixelBoardStatus } from '@/types';

export interface CreatePixelBoardPayload {
  name: string;
  width: number;
  height: number;
  delay_seconds?: number;
  allow_override?: boolean;
  status?: PixelBoardStatus;
  endAt?: string;
}

export interface ReplayEvent {
  pixelId: string;
  userId: string;
  position_x: number;
  position_y: number;
  color: string;
  createdAt: string;
}

export interface ReplayResponse {
  boardId: string;
  totalEvents: number;
  events: ReplayEvent[];
}

export interface UploadImageContributionPayload {
  image: File;
  offset_x?: number;
  offset_y?: number;
  maxPixels?: number;
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

export async function getReplay(boardId: string, limit = 5000, offset = 0): Promise<ReplayResponse> {
  const { data } = await api.get<ReplayResponse>(`/pixelboards/${boardId}/replay`, {
    params: { limit, offset },
  });
  return data;
}

export function getExportUrl(boardId: string, format: 'png' | 'svg'): string {
  const base = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';
  return `${base}/pixelboards/${boardId}/export.${format}`;
}

export async function uploadImageContribution(
  boardId: string,
  payload: UploadImageContributionPayload,
): Promise<{ processedPixels: number; appliedPixels: number; skippedPixels: number }> {
  const formData = new FormData();
  formData.append('image', payload.image);
  formData.append('offset_x', String(payload.offset_x ?? 0));
  formData.append('offset_y', String(payload.offset_y ?? 0));
  formData.append('maxPixels', String(payload.maxPixels ?? 50000));

  const { data } = await api.post<{ processedPixels: number; appliedPixels: number; skippedPixels: number }>(
    `/pixelboards/${boardId}/upload-image`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return data;
}
