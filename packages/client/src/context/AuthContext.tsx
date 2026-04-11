import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import {
	forgotPassword as forgotPasswordService,
	getCurrentSessionUser,
	login as loginService,
	logout as logoutService,
	resetPassword as resetPasswordService,
	register as registerService,
	type ForgotPasswordResult,
	type LoginPayload,
	type ResetPasswordPayload,
	type RegisterPayload,
	type SessionUser,
} from '../services/auth.service';

interface AuthContextValue {
	user: SessionUser | null;
	isAuthenticated: boolean;
	isAdmin: boolean;
	login: (payload: LoginPayload) => Promise<SessionUser>;
	register: (payload: RegisterPayload) => Promise<SessionUser>;
	forgotPassword: (email: string) => Promise<ForgotPasswordResult>;
	resetPassword: (payload: ResetPasswordPayload) => Promise<void>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
	children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
	const [user, setUser] = useState<SessionUser | null>(() => getCurrentSessionUser());

	const value = useMemo<AuthContextValue>(() => ({
		user,
		isAuthenticated: Boolean(user),
		isAdmin: user?.role === 'ADMIN',
		login: async (payload) => {
			const sessionUser = await loginService(payload);
			setUser(sessionUser);
			return sessionUser;
		},
		register: async (payload) => {
			const sessionUser = await registerService(payload);
			setUser(sessionUser);
			return sessionUser;
		},
		forgotPassword: async (email) => forgotPasswordService(email),
		resetPassword: async (payload) => resetPasswordService(payload),
		logout: () => {
			logoutService();
			setUser(null);
		},
	}), [user]);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within AuthProvider.');
	}
	return context;
}

