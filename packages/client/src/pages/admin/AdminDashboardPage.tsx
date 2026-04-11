import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function AdminDashboardPage() {
	const navigate = useNavigate();
	const { user, logout } = useAuth();

	const handleLogout = () => {
		logout();
		navigate('/login', { replace: true });
	};

	return (
		<div className="p-8 max-w-xl mx-auto">
			<h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
			<p className="text-gray-600">Welcome {user?.firstname} {user?.lastname}</p>
			<p className="text-gray-600">Email: {user?.email}</p>
			<p className="text-gray-600 mb-6">Role: {user?.role}</p>
			<button type="button" className="bg-gray-800 text-white p-2 rounded hover:bg-gray-900" onClick={handleLogout}>
				Sign out
			</button>
		</div>
	);
}

export default AdminDashboardPage;
