import api from '@/lib/api';
import type { IPixelBoard, IUser } from '@/types';
import { UserRole, PixelBoardStatus } from '@/types';

export { UserRole, PixelBoardStatus };

export enum AdminActivityType {
  USER_CREATED = 'USER_CREATED',
  ROLE_UPDATED = 'ROLE_UPDATED',
  BOARD_UPDATED = 'BOARD_UPDATED',
  REPORT_CREATED = 'REPORT_CREATED',
}

export enum AdminActivityLevel {
  INFO = 'info',
  WARNING = 'warning',
}

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
  contributorCount: number;
  updatedAt: string;
}

export interface AdminActivity {
  id: string;
  type: AdminActivityType;
  message: string;
  createdAt: string;
  level: AdminActivityLevel;
}

export interface AdminDashboardData {
  kpis: {
    totalUsers: number;
    totalAdmins: number;
    activeBoards: number;
    pendingReports: number;
  };
  users: AdminUser[];
  pixelBoards: AdminPixelBoard[];
  activities: AdminActivity[];
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
    contributorCount: board.contributions?.length ?? 0,
    updatedAt: board.updatedAt,
  };
}

export async function adminGetPixelBoards(): Promise<IPixelBoard[]> {
  const { data } = await api.get<IPixelBoard[]>('/admin/pixelboards');
  return data;
}

export type AdminUpdatePixelBoardPayload = Partial<
  Pick<IPixelBoard, 'name' | 'width' | 'height' | 'delay_seconds' | 'allow_override' | 'status'>
>;

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

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  // Les pages admin existantes attendent une structure "dashboard".
  // On la reconstruit côté client avec les endpoints disponibles.
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
      // pas d'endpoint "reports" pour le moment
      pendingReports: 0,
    },
    users: usersRes.data.map(mapUserToAdminUser),
    pixelBoards: boardsRes.data.map(mapBoardToAdminBoard),
    activities: [],
  };
}

export async function toggleUserRole(_userId: string): Promise<AdminDashboardData> {
  try {
    await api.patch(`/admin/users/${_userId}/role`);
    return getAdminDashboardData();
  } catch (err: unknown) {
    // Axios renvoie souvent un message générique ("Request failed with status code 400").
    // On remonte le message API si présent.
    if (typeof err === 'object' && err && 'isAxiosError' in err) {
      const axiosErr = err as {
        response?: { data?: unknown };
      };

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

export async function increaseBoardDelay(
  boardId: string,
  amount = 15,
): Promise<AdminDashboardData> {
  // Conserve l'API utilisée par certaines pages, mais effectue un vrai update.
  const boards = await adminGetPixelBoards();
  const target = boards.find((b) => b.id === boardId);
  if (!target) throw new Error('Board not found');
  await adminUpdatePixelBoard(boardId, {
    delay_seconds: Math.min(300, (target.delay_seconds ?? 0) + amount),
  });
  return getAdminDashboardData();
}

export async function resolveOneReport(): Promise<AdminDashboardData> {
  throw new Error('Not implemented: moderation/report endpoints missing');
}

export async function applyDefaultDelay(delaySeconds: number): Promise<AdminDashboardData> {
  // Applique côté client en appelant l'update board par board (pas d'endpoint bulk).
  const boards = await adminGetPixelBoards();
  await Promise.all(
    boards
      .filter((b) => b.status === PixelBoardStatus.IN_PROGRESS)
      .map((b) => adminUpdatePixelBoard(b.id, { delay_seconds: delaySeconds })),
  );
  return getAdminDashboardData();
}

export async function toggleOverridePolicy(): Promise<AdminDashboardData> {
  const boards = await adminGetPixelBoards();
  const hasEnabled = boards.some(
    (b) => b.status === PixelBoardStatus.IN_PROGRESS && b.allow_override,
  );
  await Promise.all(
    boards
      .filter((b) => b.status === PixelBoardStatus.IN_PROGRESS)
      .map((b) => adminUpdatePixelBoard(b.id, { allow_override: !hasEnabled })),
  );

  return getAdminDashboardData();
}
