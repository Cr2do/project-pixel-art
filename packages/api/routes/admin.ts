import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.middleware';
import { CreatePixelBoardSchema, UpdatePixelBoardSchema } from '../utils/schemas';
import { SchemaValidationError } from '../utils/errors';
import * as userService from '../services/user.service';
import * as boardService from '../services/pixelboard.service';
import * as heatmapService from '../services/heatmap.service';
import { User } from '../models/user';
import { PixelBoard } from '../models/pixelboard';
import { Pixel } from '../models/pixel';

const router = Router();

router.use(authenticate, requireAdmin);

// GET /api/admin/users
router.get('/users', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await userService.findAll());
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { user: actingUser } = req as AuthenticatedRequest;

    // Security rule: an admin cannot change their own role.
    // Another admin must perform that action.
    if (actingUser._id.toString() === req.params.id) {
      res.status(403).json({ message: 'Un administrateur ne peut pas modifier son propre rôle.' });
      return;
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: 'Utilisateur introuvable' });
      return;
    }

    // Empêche de retirer le dernier admin
    if (user.role === 'ADMIN') {
      const adminCount = await User.countDocuments({ role: 'ADMIN' });
      if (adminCount <= 1) {
        res.status(400).json({ message: 'Au moins un administrateur est requis.' });
        return;
      }
    }

    user.role = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    await user.save();

    res.json(user);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/pixelboards
router.get('/pixelboards', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await boardService.findAll());
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/pixelboards/:id/heatmap
router.get(
  '/pixelboards/:id/heatmap',
  async (req: Request<{ id: string }, unknown, unknown, { from?: string; to?: string }>, res: Response, next: NextFunction) => {
    try {
      res.json(await heatmapService.getPixelBoardHeatmap(req.params.id, req.query));
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/admin/pixelboards
router.post('/pixelboards', async (req: Request, res: Response, next: NextFunction) => {
  const result = CreatePixelBoardSchema.safeParse(req.body);
  if (!result.success) {
    next(new SchemaValidationError(result.error));
    return;
  }
  try {
    const { user } = req as AuthenticatedRequest;
    const board = await boardService.createPixelBoard({ ...result.data, authorUserId: user._id.toString() });
    res.status(201).json(board);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/pixelboards/:id
router.put('/pixelboards/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  const result = UpdatePixelBoardSchema.safeParse(req.body);
  if (!result.success) {
    next(new SchemaValidationError(result.error));
    return;
  }
  try {
    const board = await boardService.updatePixelBoard(req.params.id, result.data);
    res.json(board);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/pixelboards/:id
router.delete('/pixelboards/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    await boardService.deletePixelBoard(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/stats
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalUsers, totalBoards, totalPixels, activeBoards] = await Promise.all([
      User.countDocuments(),
      PixelBoard.countDocuments(),
      Pixel.countDocuments(),
      PixelBoard.countDocuments({ status: 'IN_PROGRESS' }),
    ]);
    res.json({ totalUsers, totalBoards, totalPixels, activeBoards });
  } catch (err) {
    next(err);
  }
});


export { router as adminRouter };
