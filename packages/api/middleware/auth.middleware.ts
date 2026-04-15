import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IUser, User } from '../models/user';
import { findByIdFull } from '../services/user.service';
import { AuthTokenPayload } from '../services/auth.service';
import { ANONYMOUS_EMAIL } from '../seed';

export interface AuthenticatedRequest extends Request {
  user: IUser;
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token manquant ou invalide' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthTokenPayload;
    const user = await findByIdFull(payload.userId);

    if (!user) {
      res.status(401).json({ message: 'Utilisateur introuvable' });
      return;
    }

    (req as AuthenticatedRequest).user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Token expiré ou invalide' });
  }
}

// Comme authenticate, mais si aucun token n'est fourni, utilise l'utilisateur anonyme
export async function authenticateOrAnonymous(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthTokenPayload;
      const user = await findByIdFull(payload.userId);
      if (user) {
        (req as AuthenticatedRequest).user = user;
        next();
        return;
      }
    } catch {
      // token invalide → on tombe sur l'anonyme
    }
  }

  const anon = await User.findOne({ email: ANONYMOUS_EMAIL });
  if (!anon) {
    res.status(503).json({ message: 'Utilisateur anonyme non initialisé' });
    return;
  }

  (req as AuthenticatedRequest).user = anon;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = (req as AuthenticatedRequest).user;

  if (!user || user.role !== 'ADMIN') {
    res.status(403).json({ message: 'Accès réservé aux administrateurs' });
    return;
  }

  next();
}
