// Auth Service

export type UserRole = 'USER' | 'ADMIN';

export interface UserModel {
	id: string;
	lastname: string;
	firstname: string;
	email: string;
	role: UserRole;
	password: string;
	createdAt: string;
	updatedAt: string;
}

export type SessionUser = Omit<UserModel, 'password'>;

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

export interface ForgotPasswordResult {
	message: string;
	resetPath?: string;
}

export interface ResetPasswordPayload {
	token: string;
	password: string;
}

const USERS_STORAGE_KEY = 'pixel-art-users';
const SESSION_STORAGE_KEY = 'pixel-art-session-user';
const RESET_TOKENS_STORAGE_KEY = 'pixel-art-reset-tokens';

const seedUsers: UserModel[] = [
	{
		id: 'seed-admin',
		firstname: 'Admin',
		lastname: 'MBDS',
		email: 'admin@pixel-art.dev',
		password: 'admin123',
		role: 'ADMIN',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
];

function wait(delay = 350): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, delay);
	});
}

function toSessionUser(user: UserModel): SessionUser {
	return {
		id: user.id,
		firstname: user.firstname,
		lastname: user.lastname,
		email: user.email,
		role: user.role,
		createdAt: user.createdAt,
		updatedAt: user.updatedAt,
	};
}

function readUsers(): UserModel[] {
	const rawUsers = localStorage.getItem(USERS_STORAGE_KEY);
	if (!rawUsers) {
		localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(seedUsers));
		return seedUsers;
	}

	try {
		const users = JSON.parse(rawUsers) as UserModel[];
		return users.length ? users : seedUsers;
	} catch {
		localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(seedUsers));
		return seedUsers;
	}
}

function writeUsers(users: UserModel[]): void {
	localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function writeSessionUser(user: SessionUser): void {
	localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
}

function readResetTokens(): Record<string, string> {
	const rawTokens = localStorage.getItem(RESET_TOKENS_STORAGE_KEY);
	if (!rawTokens) {
		return {};
	}

	try {
		return JSON.parse(rawTokens) as Record<string, string>;
	} catch {
		localStorage.removeItem(RESET_TOKENS_STORAGE_KEY);
		return {};
	}
}

function writeResetTokens(tokens: Record<string, string>): void {
	localStorage.setItem(RESET_TOKENS_STORAGE_KEY, JSON.stringify(tokens));
}

export function getCurrentSessionUser(): SessionUser | null {
	const rawSession = localStorage.getItem(SESSION_STORAGE_KEY);
	if (!rawSession) {
		return null;
	}

	try {
		return JSON.parse(rawSession) as SessionUser;
	} catch {
		localStorage.removeItem(SESSION_STORAGE_KEY);
		return null;
	}
}

export async function login(payload: LoginPayload): Promise<SessionUser> {
	await wait();
	const users = readUsers();
	const email = payload.email.trim().toLowerCase();
	const user = users.find((candidate) => candidate.email === email);

	if (!user || user.password !== payload.password) {
		throw new Error('Invalid email or password.');
	}

	const sessionUser = toSessionUser(user);
	writeSessionUser(sessionUser);
	return sessionUser;
}

export async function register(payload: RegisterPayload): Promise<SessionUser> {
	await wait();
	if (payload.password.length < 8) {
		throw new Error('Password must be at least 8 characters long.');
	}

	const users = readUsers();
	const normalizedEmail = payload.email.trim().toLowerCase();
	const emailExists = users.some((candidate) => candidate.email === normalizedEmail);

	if (emailExists) {
		throw new Error('An account already exists with this email.');
	}

	const now = new Date().toISOString();
	const newUser: UserModel = {
		id: `user-${Date.now()}`,
		firstname: payload.firstname.trim(),
		lastname: payload.lastname.trim(),
		email: normalizedEmail,
		password: payload.password,
		role: 'USER',
		createdAt: now,
		updatedAt: now,
	};

	const nextUsers = [...users, newUser];
	writeUsers(nextUsers);

	const sessionUser = toSessionUser(newUser);
	writeSessionUser(sessionUser);
	return sessionUser;
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResult> {
	await wait();
	const users = readUsers();
	const normalizedEmail = email.trim().toLowerCase();
	const user = users.find((candidate) => candidate.email === normalizedEmail);

	if (!user) {
		return { message: 'If an account exists, a reset email will be sent.' };
	}

	const token = `reset-${Date.now()}`;
	const tokens = readResetTokens();
	tokens[token] = user.email;
	writeResetTokens(tokens);

	return {
		message: 'Reset link generated (mock).',
		resetPath: `/reset-password/${token}`,
	};
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
	await wait();
	if (payload.password.length < 8) {
		throw new Error('Password must be at least 8 characters long.');
	}

	const tokens = readResetTokens();
	const email = tokens[payload.token];

	if (!email) {
		throw new Error('Invalid or expired reset link (mock).');
	}

	const users = readUsers();
	const userIndex = users.findIndex((candidate) => candidate.email === email);
	if (userIndex === -1) {
		throw new Error('User not found.');
	}

	users[userIndex] = {
		...users[userIndex],
		password: payload.password,
		updatedAt: new Date().toISOString(),
	};

	writeUsers(users);
	delete tokens[payload.token];
	writeResetTokens(tokens);

	if (getCurrentSessionUser()?.email === email) {
		const sessionUser = toSessionUser(users[userIndex]);
		writeSessionUser(sessionUser);
	}
}

export function logout(): void {
	localStorage.removeItem(SESSION_STORAGE_KEY);
}
