export function validateEmail(email: string): string | null {
	const normalized = email.trim();
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(normalized)) {
		return 'Invalid email address.';
	}
	return null;
}

export function validatePassword(password: string): string | null {
	if (password.length < 8) {
		return 'Password must be at least 8 characters long.';
	}
	if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
		return 'Password must include at least one letter and one number.';
	}
	return null;
}

export function validateName(value: string, label: string): string | null {
	if (value.trim().length < 2) {
		return `${label} must be at least 2 characters long.`;
	}
	return null;
}

