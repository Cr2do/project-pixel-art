import { Types } from 'mongoose';
import { User, IUser } from '../models/user';
import { Pixel } from '../models/pixel';
import { NotFoundError } from '../utils/errors';
import { hashPassword } from './auth.service';
import { UpdateUserInput } from '../utils/schemas';

type SafeUser = Omit<IUser, 'password'>;

function stripPassword(user: IUser): SafeUser {
  const obj = user.toObject() as unknown as Record<string, unknown>;
  delete obj.password;
  return obj as SafeUser;
}

export async function findById(id: string): Promise<SafeUser | null> {
  return User.findById(id).select('-password') as unknown as SafeUser | null;
}

export async function findByIdFull(id: string): Promise<IUser | null> {
  return User.findById(id);
}

export async function findAll(): Promise<SafeUser[]> {
  return User.find().select('-password') as unknown as SafeUser[];
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<SafeUser> {
  const update: Partial<IUser> = {};

  if (input.lastname  !== undefined) update.lastname  = input.lastname;
  if (input.firstname !== undefined) update.firstname = input.firstname;
  if (input.email     !== undefined) update.email     = input.email;
  if (input.password  !== undefined) update.password  = await hashPassword(input.password);

  const user = await User.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  if (!user) throw new NotFoundError('Utilisateur introuvable');
  return stripPassword(user);
}

export async function deleteUser(id: string): Promise<void> {
  const result = await User.findByIdAndDelete(id);
  if (!result) throw new NotFoundError('Utilisateur introuvable');
}

export async function getUserStats(userId: string): Promise<{ totalPixels: number; boardsContributed: number }> {
  const pixels = await Pixel.find({ userId: new Types.ObjectId(userId) });
  const boardIds = new Set(pixels.map((p) => p.pixelBoardId.toString()));
  return { totalPixels: pixels.length, boardsContributed: boardIds.size };
}
