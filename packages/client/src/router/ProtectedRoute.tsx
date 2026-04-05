import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
	isAllowed: boolean;
	redirectTo?: string;
}

function ProtectedRoute({ isAllowed, redirectTo = '/login' }: ProtectedRouteProps) {
	if (!isAllowed) {
		return <Navigate to={redirectTo} replace />;
	}
	return <Outlet />;
}

export default ProtectedRoute;
