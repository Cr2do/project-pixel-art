import api from '@/lib/api';
import type { IPixelBoard, IUser } from '@/types';
import { UserRole, PixelBoardStatus } from '@/types';

export { UserRole, PixelBoardStatus };

export interface AdminUser {
  id: string;
  lastname: string;
  firstname: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPixelBoard {
  id: string;
  name: string;
  width: number;
  height: number;
  position_x: number;
  position_y: number;
  status: PixelBoardStatus;
  allow_override: boolean;
  delay_seconds: number;
  endAt?: string;
  contributorCount: number;
  updatedAt: string;
}

export interface AdminHeatmapPoint {
  x: number;
  y: number;
  count: number;
}

export interface AdminBoardHeatmap {
  board: {
    id: string;
    width: number;
    height: number;
  };
  points: AdminHeatmapPoint[];
  maxCount: number;
}

export interface AdminDashboardData {
  kpis: {
    totalUsers: number;
    totalAdmins: number;
    activeBoards: number;
  };
  users: AdminUser[];
  pixelBoards: AdminPixelBoard[];
}

function mapUserToAdminUser(user: IUser): AdminUser {
  return {
    id: user.id,
    lastname: user.lastname,
    firstname: user.firstname,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function mapBoardToAdminBoard(board: IPixelBoard): AdminPixelBoard {
  return {
    id: board.id,
    name: board.name,
    width: board.width,
    height: board.height,
    position_x: board.position_x,
    position_y: board.position_y,
    status: board.status,
    allow_override: board.allow_override,
    delay_seconds: board.delay_seconds,
    endAt: board.endAt,
    contributorCount: board.contributions?.length ?? 0,
    updatedAt: board.updatedAt,
  };
}

export async function adminGetPixelBoards(): Promise<IPixelBoard[]> {
  const { data } = await api.get<IPixelBoard[]>('/admin/pixelboards');
  return data;
}

export type AdminCreatePixelBoardPayload = Pick<
  IPixelBoard,
  'name' | 'width' | 'height' | 'delay_seconds' | 'allow_override' | 'status'
> & { endAt?: string };

export async function adminCreatePixelBoard(payload: AdminCreatePixelBoardPayload): Promise<IPixelBoard> {
  const { data } = await api.post<IPixelBoard>('/admin/pixelboards', payload);
  return data;
}

export type AdminUpdatePixelBoardPayload = Partial<
  Pick<IPixelBoard, 'name' | 'width' | 'height' | 'delay_seconds' | 'allow_override' | 'status'>
> & { endAt?: string | null };

export async function adminUpdatePixelBoard(
  boardId: string,
  payload: AdminUpdatePixelBoardPayload,
): Promise<IPixelBoard> {
  const { data } = await api.put<IPixelBoard>(`/admin/pixelboards/${boardId}`, payload);
  return data;
}

export async function adminDeletePixelBoard(boardId: string): Promise<void> {
  await api.delete(`/admin/pixelboards/${boardId}`);
}

export async function adminGetPixelBoardHeatmap(
  boardId: string,
  params?: { from?: string; to?: string },
): Promise<AdminBoardHeatmap> {
  const { data } = await api.get<AdminBoardHeatmap>(`/admin/pixelboards/${boardId}/heatmap`, {
    params,
  });
  return data;
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const [usersRes, boardsRes, statsRes] = await Promise.all([
    api.get<IUser[]>('/admin/users'),
    api.get<IPixelBoard[]>('/admin/pixelboards'),
    api.get<{ totalUsers: number; totalBoards: number; totalPixels: number; activeBoards: number }>(
      '/admin/stats',
    ),
  ]);

  return {
    kpis: {
      totalUsers: statsRes.data.totalUsers,
      totalAdmins: usersRes.data.filter((u) => u.role === UserRole.ADMIN).length,
      activeBoards: statsRes.data.activeBoards,
    },
    users: usersRes.data.map(mapUserToAdminUser),
    pixelBoards: boardsRes.data.map(mapBoardToAdminBoard),
  };
}

export async function toggleUserRole(_userId: string): Promise<AdminDashboardData> {
  try {
    await api.patch(`/admin/users/${_userId}/role`);
    return getAdminDashboardData();
  } catch (err: unknown) {
    if (typeof err === 'object' && err && 'isAxiosError' in err) {
      const axiosErr = err as { response?: { data?: unknown } };
      const data = axiosErr.response?.data;
      if (data && typeof data === 'object' && 'message' in data) {
        const message = (data as { message?: unknown }).message;
        if (typeof message === 'string' && message.trim() !== '') {
          throw new Error(message);
        }
      }
    }
    throw err;
  }
}
