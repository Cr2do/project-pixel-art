import nodemailer, { type Transporter } from 'nodemailer';

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter | null {
	if (cachedTransporter) return cachedTransporter;

	const host = process.env.SMTP_HOST;
	const user = process.env.SMTP_USER;
	const pass = process.env.SMTP_PASS;

	if (!host || !user || !pass) return null;

	const port = Number(process.env.SMTP_PORT ?? 587);
	const secure = process.env.SMTP_SECURE === 'true';

	cachedTransporter = nodemailer.createTransport({
		host,
		port,
		secure,
		auth: { user, pass },
	});

	return cachedTransporter;
}

export async function sendResetPasswordEmail(to: string, resetUrl: string): Promise<void> {
	const transporter = getTransporter();
	const from = process.env.SMTP_FROM ?? 'no-reply@pixel-art.local';

	if (!transporter) {
		console.warn(`[mail] SMTP not configured. Reset URL for ${to}: ${resetUrl}`);
		return;
	}

	await transporter.sendMail({
		from,
		to,
		subject: 'Réinitialisation de mot de passe',
		text: `Pour réinitialiser votre mot de passe, ouvrez ce lien: ${resetUrl}`,
		html: `<p>Pour réinitialiser votre mot de passe, cliquez sur ce lien :</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
	});
}
