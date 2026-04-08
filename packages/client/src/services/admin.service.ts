export type UserRole = 'USER' | 'ADMIN';
export type PixelBoardStatus = 'IN_PROGRESS' | 'FINISHED';

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
	type: 'USER_CREATED' | 'ROLE_UPDATED' | 'BOARD_UPDATED' | 'REPORT_CREATED';
	message: string;
	createdAt: string;
	level: 'info' | 'warning';
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

interface AdminMockState {
	users: AdminUser[];
	pixelBoards: AdminPixelBoard[];
	activities: AdminActivity[];
	pendingReports: number;
}

const mockState: AdminMockState = {
	users: [],
	pixelBoards: [],
	activities: [],
	pendingReports: 0,
};

const mockDelay = (ms: number) => new Promise<void>((resolve) => {
	window.setTimeout(() => resolve(), ms);
});

function nowIso(): string {
	return new Date().toISOString();
}

function pushActivity(activity: Omit<AdminActivity, 'id' | 'createdAt'>): void {
	mockState.activities = [
		{
			id: `a-${Date.now()}`,
			createdAt: nowIso(),
			...activity,
		},
		...mockState.activities,
	].slice(0, 8);
}

function buildDashboardData(): AdminDashboardData {
	return {
		kpis: {
			totalUsers: mockState.users.length,
			totalAdmins: mockState.users.filter((user) => user.role === 'ADMIN').length,
			activeBoards: mockState.pixelBoards.filter((board) => board.status === 'IN_PROGRESS').length,
			pendingReports: mockState.pendingReports,
		},
		users: mockState.users.map((user) => ({ ...user })),
		pixelBoards: mockState.pixelBoards.map((board) => ({ ...board })),
		activities: mockState.activities.map((activity) => ({ ...activity })),
	};
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
	await mockDelay(300);
	return buildDashboardData();
}

export async function toggleUserRole(userId: string): Promise<AdminDashboardData> {
	await mockDelay(180);

	const target = mockState.users.find((user) => user.id === userId);
	if (!target) {
		throw new Error('User not found');
	}

	const adminCount = mockState.users.filter((user) => user.role === 'ADMIN').length;
	if (target.role === 'ADMIN' && adminCount <= 1) {
		throw new Error('At least one admin is required.');
	}

	target.role = target.role === 'ADMIN' ? 'USER' : 'ADMIN';
	target.updatedAt = nowIso();

	pushActivity({
		type: 'ROLE_UPDATED',
		level: 'info',
		message: `${target.firstname} ${target.lastname} role changed to ${target.role}.`,
	});

	return buildDashboardData();
}

export async function increaseBoardDelay(boardId: string, amount = 15): Promise<AdminDashboardData> {
	await mockDelay(180);

	const target = mockState.pixelBoards.find((board) => board.id === boardId);
	if (!target) {
		throw new Error('Board not found');
	}

	target.delay_seconds = Math.min(300, target.delay_seconds + amount);
	target.updatedAt = nowIso();

	pushActivity({
		type: 'BOARD_UPDATED',
		level: 'info',
		message: `${target.name} delay updated to ${target.delay_seconds}s.`,
	});

	return buildDashboardData();
}

export async function resolveOneReport(): Promise<AdminDashboardData> {
	await mockDelay(220);

	if (mockState.pendingReports <= 0) {
		throw new Error('No pending reports left.');
	}

	mockState.pendingReports -= 1;

	pushActivity({
		type: 'REPORT_CREATED',
		level: mockState.pendingReports > 0 ? 'warning' : 'info',
		message: `A report was processed. ${mockState.pendingReports} pending report(s) remaining.`,
	});

	return buildDashboardData();
}

export async function applyDefaultDelay(delaySeconds: number): Promise<AdminDashboardData> {
	await mockDelay(240);

	mockState.pixelBoards = mockState.pixelBoards.map((board) => (
		board.status === 'IN_PROGRESS'
			? {
				...board,
				delay_seconds: delaySeconds,
				updatedAt: nowIso(),
			}
			: board
	));

	pushActivity({
		type: 'BOARD_UPDATED',
		level: 'info',
		message: `Default delay changed to ${delaySeconds}s for active boards.`,
	});

	return buildDashboardData();
}

export async function toggleOverridePolicy(): Promise<AdminDashboardData> {
	await mockDelay(200);

	const hasEnabled = mockState.pixelBoards.some(
		(board) => board.status === 'IN_PROGRESS' && board.allow_override,
	);

	mockState.pixelBoards = mockState.pixelBoards.map((board) => (
		board.status === 'IN_PROGRESS'
			? {
				...board,
				allow_override: !hasEnabled,
				updatedAt: nowIso(),
			}
			: board
	));

	pushActivity({
		type: 'BOARD_UPDATED',
		level: !hasEnabled ? 'warning' : 'info',
		message: !hasEnabled
			? 'Override enabled for active boards.'
			: 'Override disabled for active boards.',
	});

	return buildDashboardData();
}