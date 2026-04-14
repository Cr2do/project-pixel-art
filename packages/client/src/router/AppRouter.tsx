import { useMemo } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HomePage from '../pages/HomePage';
import NotFoundPage from '../pages/NotFoundPage';
import AdminOverviewPage from '../pages/admin/AdminOverviewPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminBoardsPage from '../pages/admin/AdminBoardsPage';
import AdminModerationPage from '../pages/admin/AdminModerationPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import BoardDetailPage from '../pages/user/BoardDetailPage';
import UserBoardsPage from '../pages/user/UserBoardsPage';
import ExploreBoardsPage from '../pages/user/ExploreBoardsPage';
import UserDashboardPage from '../pages/user/UserDashboardPage';
import UserProfilePage from '../pages/user/UserProfilePage';
import AdminLayout from '../components/layouts/AdminLayout';
import UserLayout from '../components/layouts/UserLayout';
import ProtectedRoute from './ProtectedRoute';

function AppRouter() {
	const { isAuthenticated, isAdmin } = useAuth();

	const router = useMemo(() => createBrowserRouter([
		{
			path: '/login',
			element: isAuthenticated ? <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace /> : <LoginPage />,
		},
		{
			path: '/register',
			element: isAuthenticated ? <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace /> : <RegisterPage />,
		},
		{
			path: '/forgot-password',
			element: isAuthenticated ? <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace /> : <ForgotPasswordPage />,
		},
		{
			path: '/reset-password/:token',
			element: <ResetPasswordPage />,
		},
		{
			element: <ProtectedRoute isAllowed={isAuthenticated} />,
			children: [
				{
					element: <UserLayout />,
					children: [
						{ path: '/dashboard', element: <UserDashboardPage /> },
						{ path: '/profile', element: <UserProfilePage /> },
						{ path: '/explore', element: <ExploreBoardsPage /> },
						{ path: '/my-boards', element: <UserBoardsPage /> },
						{ path: '/boards/:id', element: <BoardDetailPage /> },
					],
				},
			],
		},
		{
			element: <ProtectedRoute isAllowed={isAuthenticated && isAdmin} redirectTo="/dashboard" />,
			children: [
				{
					element: <AdminLayout />,
					children: [
						{ path: '/admin', element: <AdminOverviewPage /> },
						{ path: '/admin/users', element: <AdminUsersPage /> },
						{ path: '/admin/boards', element: <AdminBoardsPage /> },
						{ path: '/admin/moderation', element: <AdminModerationPage /> },
						{ path: '/admin/settings', element: <AdminSettingsPage /> },
					],
				},
			],
		},
		{
			path: '/',
			element: <HomePage />,
		},
		{
			path: '*',
			element: <NotFoundPage />,
		},
	]), [isAdmin, isAuthenticated]);

	return <RouterProvider router={router} />;
}

export default AppRouter;
