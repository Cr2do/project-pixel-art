import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user';
import { ConflictError, UnauthorizedError } from '../utils/errors';
import { RegisterInput, LoginInput } from '../utils/schemas';

const SALT_ROUNDS = 12;

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
