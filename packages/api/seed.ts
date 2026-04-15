import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from './models/user';

const SALT_ROUNDS = 12;

export const ANONYMOUS_EMAIL = 'anonymous@pixelboard.local';

export async function seed(): Promise<void> {
  // ── Admin ─────────────────────────────────────────────────
  const adminEmail    = process.env.ADMIN_EMAIL    ?? 'admin@pixelboard.local';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin1234!';

  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await User.create({
      lastname:  'Admin',
      firstname: 'Super',
      email:     adminEmail,
      password:  await bcrypt.hash(adminPassword, SALT_ROUNDS),
      role:      'ADMIN',
    });
    console.log(`[seed] Admin créé : ${adminEmail}`);
  }

  // ── Anonymous ─────────────────────────────────────────────
  const existingAnon = await User.findOne({ email: ANONYMOUS_EMAIL });
  if (!existingAnon) {
    await User.create({
      lastname:  'Anonymous',
      firstname: 'User',
      email:     ANONYMOUS_EMAIL,
      // Mot de passe aléatoire — l'utilisateur ne peut pas se connecter directement
      password:  await bcrypt.hash(crypto.randomUUID(), SALT_ROUNDS),
      role:      'USER',
    });
    console.log(`[seed] Utilisateur anonyme créé : ${ANONYMOUS_EMAIL}`);
  }
}
