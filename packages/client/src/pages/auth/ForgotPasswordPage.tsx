import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { validateEmail } from '../../lib/auth-validation';

function ForgotPasswordPage() {
	const { forgotPassword } = useAuth();
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [resetPath, setResetPath] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setLoading(true);
		setError(null);
		setMessage(null);
		setResetPath(null);

		const emailError = validateEmail(email);
		if (emailError) {
			setError(emailError);
			setLoading(false);
			return;
		}

		try {
			const response = await forgotPassword(email);
			setMessage(response.message);
			setResetPath(response.resetPath ?? null);
		} catch (submissionError) {
			setError(submissionError instanceof Error ? submissionError.message : 'Unexpected error.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center px-4">
			<div className="p-8 rounded shadow-md w-full max-w-sm">
				<h1 className="text-2xl font-bold mb-2">Forgot password</h1>
				<p className="text-sm text-gray-600 mb-6">Enter your email to receive a reset link (mock).</p>
				<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
					<input
						type="email"
						placeholder="Email"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						className="border p-2 rounded"
						required
					/>
					<button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-60" disabled={loading}>
						{loading ? 'Sending...' : 'Send'}
					</button>
				</form>
				{message && <p className="text-green-700 mt-4 text-sm">{message}</p>}
				{resetPath && (
					<p className="text-sm mt-2">
						<Link to={resetPath} className="text-blue-600 hover:underline">Open mock reset page</Link>
					</p>
				)}
				{error && <p className="text-red-700 mt-4 text-sm">{error}</p>}
				<div className="mt-6 text-sm">
					<Link to="/login" className="text-blue-600 hover:underline">Back to login</Link>
				</div>
			</div>
		</div>
	);
}

export default ForgotPasswordPage;

