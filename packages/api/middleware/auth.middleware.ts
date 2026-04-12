import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IUser } from '../models/user';
import { findByIdFull } from '../services/user.service';
import { AuthTokenPayload } from '../services/auth.service';

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

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = (req as AuthenticatedRequest).user;

  if (!user || user.role !== 'ADMIN') {
    res.status(403).json({ message: 'Accès réservé aux administrateurs' });
    return;
  }

  next();
}
