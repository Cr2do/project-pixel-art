import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePassword } from '../../lib/auth-validation';

function LoginPage() {
	const navigate = useNavigate();
	const { login, isAuthenticated, isAdmin } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	if (isAuthenticated) {
		return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
	}

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);

		const emailError = validateEmail(email);
		if (emailError) {
			setError(emailError);
			return;
		}

		const passwordError = validatePassword(password);
		if (passwordError) {
			setError(passwordError);
			return;
		}

		setLoading(true);

		try {
			const user = await login({ email, password });
			navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard', { replace: true });
		} catch (submissionError) {
			setError(submissionError instanceof Error ? submissionError.message : 'Unexpected error.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center px-4">
			<div className="p-8 rounded shadow-md w-full max-w-sm">
				<h1 className="text-2xl font-bold mb-2">Login</h1>
				<p className="text-sm text-gray-600 mb-6">Mock admin account: admin@pixel-art.dev / admin123</p>
				<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
					<input
						type="email"
						placeholder="Email"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						className="border p-2 rounded"
						required
					/>
					<input
						type="password"
						placeholder="Password"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						className="border p-2 rounded"
						required
					/>
					<button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-60" disabled={loading}>
						{loading ? 'Signing in...' : 'Sign in'}
					</button>
				</form>
				{error && <p className="text-red-700 mt-4 text-sm">{error}</p>}
				<div className="flex justify-between mt-6 text-sm">
					<Link to="/register" className="text-blue-600 hover:underline">Create an account</Link>
					<Link to="/forgot-password" className="text-blue-600 hover:underline">Forgot password?</Link>
				</div>
			</div>
		</div>
	);
}

export default LoginPage;
