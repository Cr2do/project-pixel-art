import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema } from '../utils/schemas';
import { SchemaValidationError } from '../utils/errors';
import * as authService from '../services/auth.service';

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

// GET /api/auth/me
router.get('/me', authenticate, (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const userObj = user.toObject() as unknown as Record<string, unknown>;
  delete userObj.password;
  res.json(userObj);
});

export { router as authRouter };
