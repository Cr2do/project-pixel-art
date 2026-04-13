import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { UpdateUserSchema } from '../utils/schemas';
import { SchemaValidationError } from '../utils/errors';
import * as userService from '../services/user.service';

const router = Router();

router.use(authenticate);

// PUT /api/users/me
router.put('/me', async (req: Request, res: Response, next: NextFunction) => {
  const result = UpdateUserSchema.safeParse(req.body);
  if (!result.success) {
    next(new SchemaValidationError(result.error));
    return;
  }
  try {
    const { user } = req as AuthenticatedRequest;
    const updated = await userService.updateUser(user._id.toString(), result.data);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/me/stats
router.get('/me/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const stats = await userService.getUserStats(user._id.toString());
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

export { router as userRouter };
