import { useMemo } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HomeUnavailablePage from '../pages/HomeUnavailablePage';
import NotFoundPage from '../pages/NotFoundPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import BoardDetailPage from '../pages/user/BoardDetailPage';
import UserBoardsPage from '../pages/user/UserBoardsPage';
import UserDashboardPage from '../pages/user/UserDashboardPage';
import UserProfilePage from '../pages/user/UserProfilePage';
import UserLayout from '../layouts/UserLayout';
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
						{ path: '/my-boards', element: <UserBoardsPage /> },
						{ path: '/boards/:id', element: <BoardDetailPage /> },
					],
				},
			],
		},
		{
			element: <ProtectedRoute isAllowed={isAuthenticated && isAdmin} redirectTo="/dashboard" />,
			children: [
				{ path: '/admin', element: <AdminDashboardPage /> },
			],
		},
		{
			path: '/',
			element: <HomeUnavailablePage />,
		},
		{
			path: '*',
			element: <NotFoundPage />,
		},
	]), [isAdmin, isAuthenticated]);

	return <RouterProvider router={router} />;
}

export default AppRouter;
