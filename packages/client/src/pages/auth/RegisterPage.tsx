import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validateName, validatePassword } from '../../lib/auth-validation';

function RegisterPage() {
	const navigate = useNavigate();
	const { register, isAuthenticated, isAdmin } = useAuth();
	const [firstname, setFirstname] = useState('');
	const [lastname, setLastname] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	if (isAuthenticated) {
		return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
	}

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);

		const firstnameError = validateName(firstname, 'First name');
		if (firstnameError) {
			setError(firstnameError);
			return;
		}

		const lastnameError = validateName(lastname, 'Last name');
		if (lastnameError) {
			setError(lastnameError);
			return;
		}

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

		if (password !== confirmPassword) {
			setError('Passwords do not match.');
			return;
		}

		setLoading(true);
		try {
			const user = await register({ firstname, lastname, email, password });
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
				<h1 className="text-2xl font-bold mb-6">Register</h1>
				<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
					<input type="text" placeholder="First name" value={firstname} onChange={(event) => setFirstname(event.target.value)} className="border p-2 rounded" required />
					<input type="text" placeholder="Last name" value={lastname} onChange={(event) => setLastname(event.target.value)} className="border p-2 rounded" required />
					<input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} className="border p-2 rounded" required />
					<input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} className="border p-2 rounded" minLength={8} required />
					<input type="password" placeholder="Confirm password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="border p-2 rounded" minLength={8} required />
					<button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-60" disabled={loading}>
						{loading ? 'Creating account...' : 'Create account'}
					</button>
				</form>
				{error && <p className="text-red-700 mt-4 text-sm">{error}</p>}
				<div className="mt-6 text-sm">
					<Link to="/login" className="text-blue-600 hover:underline">I already have an account</Link>
				</div>
			</div>
		</div>
	);
}

export default RegisterPage;
