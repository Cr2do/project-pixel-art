import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User } from '../models/user';
import { ConflictError, UnauthorizedError, BadRequestError } from '../utils/errors';
import { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from '../utils/schemas';
import { sendResetPasswordEmail } from './mail.service';

const SALT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = Number(process.env.RESET_TOKEN_TTL_MS ?? 1000 * 60 * 60);

export interface AuthTokenPayload {
  userId: string;
  role: 'USER' | 'ADMIN';
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function generateToken(payload: AuthTokenPayload): string {
  const secret = process.env.JWT_SECRET!;
  const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d';
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

export async function register(input: RegisterInput): Promise<Record<string, unknown>> {
  const existing = await User.findOne({ email: input.email });
  if (existing) throw new ConflictError('Un compte avec cet email existe déjà');

  const hashedPassword = await hashPassword(input.password);
  const user = await User.create({
    lastname: input.lastname,
    firstname: input.firstname,
    email: input.email,
    password: hashedPassword,
  });

  const token = generateToken({ userId: user._id.toString(), role: user.role });
  const userObj = user.toObject({ virtuals: true }) as unknown as Record<string, unknown>;
  delete userObj.password;

  return { token, user: userObj };
}

export async function login(input: LoginInput): Promise<Record<string, unknown>> {
  const user = await User.findOne({ email: input.email });
  if (!user) throw new UnauthorizedError('Email ou mot de passe incorrect');

  const valid = await comparePassword(input.password, user.password);
  if (!valid) throw new UnauthorizedError('Email ou mot de passe incorrect');

  const token = generateToken({ userId: user._id.toString(), role: user.role });
  const userObj = user.toObject({ virtuals: true }) as unknown as Record<string, unknown>;
  delete userObj.password;

  return { token, user: userObj };
}

function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getResetBaseUrl(): string {
  return process.env.FRONTEND_APP_URL ?? 'http://localhost:5173';
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<{ message: string; resetPath?: string }> {
  const user = await User.findOne({ email: input.email }).select('+resetPasswordToken +resetPasswordExpiresAt');

  if (!user) {
    return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpiresAt = expiresAt;
  await user.save();

  const resetPath = `/reset-password/${rawToken}`;
  const resetUrl = `${getResetBaseUrl()}${resetPath}`;
  await sendResetPasswordEmail(user.email, resetUrl);

  return {
    message: 'Si cet email existe, un lien de réinitialisation a été envoyé.',
    resetPath: process.env.NODE_ENV !== 'production' ? resetPath : undefined,
  };
}

export async function resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
  const hashedToken = hashResetToken(input.token);

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpiresAt: { $gt: new Date() },
  }).select('+resetPasswordToken +resetPasswordExpiresAt');

  if (!user) {
    throw new BadRequestError('Lien de réinitialisation invalide ou expiré');
  }

  user.password = await hashPassword(input.password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiresAt = undefined;
  await user.save();

  return { message: 'Mot de passe réinitialisé avec succès' };
}
