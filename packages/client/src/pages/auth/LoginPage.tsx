function LoginPage() {
	return (
		<div className="min-h-screen flex items-center justify-center">
			<div className="p-8 rounded shadow-md w-full max-w-sm">
				<h1 className="text-2xl font-bold mb-6">Login</h1>
				<form className="flex flex-col gap-4">
					<input type="email" placeholder="Email" className="border p-2 rounded" />
					<input type="password" placeholder="Password" className="border p-2 rounded" />
					<button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
						Sign in
					</button>
				</form>
			</div>
		</div>
	);
}

export default LoginPage;
