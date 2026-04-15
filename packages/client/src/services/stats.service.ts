import api from '@/lib/api';

export interface StatsResponse {
  activeBoards: number;
  finishedBoards: number;
  totalPixels: number;
  totalContributors: number;
  totalUsers: number;
}

export async function getStats(): Promise<StatsResponse> {
  const { data } = await api.get<StatsResponse>('/stats');
  return data;
}
