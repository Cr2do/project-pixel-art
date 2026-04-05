import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import UserDashboardPage from '../pages/user/UserDashboardPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import NotFoundPage from '../pages/NotFoundPage';
import ProtectedRoute from './ProtectedRoute';

// TODO: replace with real auth state (context, store, etc.)
const isAuthenticated = true;
const isAdmin = true;

const router = createBrowserRouter([
	{
		path: '/login',
		element: <LoginPage />,
	},
	{
		path: '/register',
		element: <RegisterPage />,
	},
	{
		element: <ProtectedRoute isAllowed={isAuthenticated} />,
		children: [
			{ path: '/dashboard', element: <UserDashboardPage /> },
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
		element: <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />,
	},
	{
		path: '*',
		element: <NotFoundPage />,
	},
]);

function AppRouter() {
	return <RouterProvider router={router} />;
}

export default AppRouter;
