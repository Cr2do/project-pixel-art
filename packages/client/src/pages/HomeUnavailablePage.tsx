import { Link } from 'react-router-dom';

function HomeUnavailablePage() {
	return (
		<div className="min-h-screen flex items-center justify-center px-4">
			<div className="max-w-md rounded shadow-md p-8 text-center">
				<h1 className="text-2xl font-bold mb-3">Home page is unavailable today</h1>
				<p className="text-gray-600 mb-6">Use authentication to access your dashboard.</p>
				<div className="flex items-center justify-center gap-4">
					<Link to="/login" className="text-blue-600 hover:underline">Login</Link>
					<Link to="/register" className="text-blue-600 hover:underline">Register</Link>
				</div>
			</div>
		</div>
	);
}

export default HomeUnavailablePage;

