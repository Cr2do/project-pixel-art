import { Link } from 'react-router-dom';

function NotFoundPage() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center gap-4">
			<h1 className="text-4xl font-bold">404</h1>
			<p className="text-gray-600">Page not found.</p>
			<Link to="/login" className="text-blue-600 hover:underline">Go to login</Link>
		</div>
	);
}

export default NotFoundPage;
