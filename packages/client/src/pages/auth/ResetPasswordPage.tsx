import { FormEvent, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { validatePassword } from '@/lib/auth-validation';

function ResetPasswordPage() {
	const navigate = useNavigate();
	const { token } = useParams<{ token: string }>();
	const { resetPassword } = useAuth();
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);
		setSuccess(null);

		if (!token) {
			setError('Invalid link.');
			return;
		}

		const passwordError = validatePassword(password);
		if (passwordError) {
			setError(passwordError);
			return;
		}

		if (password !== confirmPassword) {
			setError('Passwords do not match.');
			return;
		}

		setLoading(true);
		try {
			await resetPassword({ token, password });
			setSuccess('Password reset complete. You can now sign in.');
			setTimeout(() => {
				navigate('/login', { replace: true });
			}, 1200);
		} catch (submissionError) {
			setError(submissionError instanceof Error ? submissionError.message : 'Unexpected error.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center px-4">
			<div className="p-8 rounded shadow-md w-full max-w-sm">
				<h1 className="text-2xl font-bold mb-2">Reset password</h1>
				<p className="text-sm text-gray-600 mb-6">Mock flow based on a local token.</p>
				<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
					<input
						type="password"
						placeholder="New password"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						className="border p-2 rounded"
						required
					/>
					<input
						type="password"
						placeholder="Confirm password"
						value={confirmPassword}
						onChange={(event) => setConfirmPassword(event.target.value)}
						className="border p-2 rounded"
						required
					/>
					<button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-60" disabled={loading}>
						{loading ? 'Submitting...' : 'Submit'}
					</button>
				</form>
				{success && <p className="text-green-700 mt-4 text-sm">{success}</p>}
				{error && <p className="text-red-700 mt-4 text-sm">{error}</p>}
				<div className="mt-6 text-sm">
					<Link to="/login" className="text-blue-600 hover:underline">Back to login</Link>
				</div>
			</div>
		</div>
	);
}

export default ResetPasswordPage;

