import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema } from '../utils/schemas';
import { SchemaValidationError } from '../utils/errors';
import * as authService from '../services/auth.service';
import { User } from '../models/user';
import { ANONYMOUS_EMAIL } from '../seed';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  const result = RegisterSchema.safeParse(req.body);
  if (!result.success) {
    next(new SchemaValidationError(result.error));
    return;
  }
  try {
    const data = await authService.register(result.data);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  const result = LoginSchema.safeParse(req.body);
  if (!result.success) {
    next(new SchemaValidationError(result.error));
    return;
  }
  try {
    const data = await authService.login(result.data);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  const result = ForgotPasswordSchema.safeParse(req.body);
  if (!result.success) {
    next(new SchemaValidationError(result.error));
    return;
  }
  try {
    const data = await authService.forgotPassword(result.data);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  const result = ResetPasswordSchema.safeParse(req.body);
  if (!result.success) {
    next(new SchemaValidationError(result.error));
    return;
  }
  try {
    const data = await authService.resetPassword(result.data);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/anonymous — retourne un JWT pour le visiteur non connecté
router.post('/anonymous', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const anon = await User.findOne({ email: ANONYMOUS_EMAIL });
    if (!anon) {
      res.status(503).json({ message: 'Utilisateur anonyme non initialisé' });
      return;
    }
    const token = authService.generateToken({ userId: anon._id.toString(), role: anon.role });
    const userObj = anon.toObject({ virtuals: true }) as unknown as Record<string, unknown>;
    delete userObj.password;
    res.json({ token, user: userObj });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const userObj = user.toObject() as unknown as Record<string, unknown>;
  delete userObj.password;
  res.json(userObj);
});

export { router as authRouter };
