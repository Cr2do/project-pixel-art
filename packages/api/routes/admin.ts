import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.middleware';
import { CreatePixelBoardSchema, UpdatePixelBoardSchema } from '../utils/schemas';
import { SchemaValidationError } from '../utils/errors';
import * as userService from '../services/user.service';
import * as boardService from '../services/pixelboard.service';
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

// GET /api/admin/pixelboards
router.get('/pixelboards', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await boardService.findAll());
  } catch (err) {
    next(err);
  }
});

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
