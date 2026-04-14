import { useMemo } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HomePage from '../pages/HomePage';
import NotFoundPage from '../pages/NotFoundPage';
import AdminOverviewPage from '../pages/admin/AdminOverviewPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminBoardsPage from '../pages/admin/AdminBoardsPage';
import AdminHeatmapPage from '../pages/admin/AdminHeatmapPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import BoardDetailPage from '../pages/user/BoardDetailPage';
import UserBoardsPage from '../pages/user/UserBoardsPage';
import UserDashboardPage from '../pages/user/UserDashboardPage';
import UserProfilePage from '../pages/user/UserProfilePage';
import AdminLayout from '../components/layouts/AdminLayout';
import UserLayout from '../components/layouts/UserLayout';
import ProtectedRoute from './ProtectedRoute';

function AdminBoardRedirect() {
	// Read the dynamic :id from the current URL and redirect to the admin-scoped route.
	// This keeps a single sidebar (AdminLayout) for admins.
	const href = window.location.href;
	const url = new URL(href);
	const match = url.pathname.match(/\/boards\/([^/]+)$/);
	const id = match?.[1];
	return <Navigate to={id ? `/admin/boards/${id}` : '/admin/boards'} replace />;
}

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
						// For admins, we want a single sidebar/menu coming from AdminLayout.
						// So we keep /my-boards under the user layout only for non-admin accounts.
						{
							path: '/my-boards',
							element: <ProtectedRoute isAllowed={!isAdmin} redirectTo="/admin/my-boards" />,
							children: [{ element: <UserBoardsPage /> }],
						},
						{
							path: '/boards/:id',
							element: isAdmin ? <AdminBoardRedirect /> : <BoardDetailPage />,
						},
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
						{ path: '/admin/heatmap', element: <AdminHeatmapPage /> },
						// Admin version of the same page, but rendered inside AdminLayout
						{ path: '/admin/my-boards', element: <UserBoardsPage /> },
						{ path: '/admin/boards/:id', element: <BoardDetailPage /> },
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
