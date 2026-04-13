import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { CreatePixelBoardSchema, PlacePixelSchema } from '../utils/schemas';
import { SchemaValidationError } from '../utils/errors';
import * as boardService from '../services/pixelboard.service';
import * as pixelService from '../services/pixel.service';

const router = Router();

// GET /api/pixelboards — public
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const boards = await boardService.findAll();
    res.json(boards);
  } catch (err) {
    next(err);
  }
});

// POST /api/pixelboards — authentifié
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
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

// GET /api/pixelboards/:id — public
router.get('/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const board = await boardService.findById(req.params.id);
    if (!board) {
      res.status(404).json({ message: 'PixelBoard introuvable' });
      return;
    }
    res.json(board);
  } catch (err) {
    next(err);
  }
});

// GET /api/pixelboards/:id/pixels — authentifié
router.get('/:id/pixels', authenticate, async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const pixels = await pixelService.findByBoard(req.params.id);
    res.json(pixels);
  } catch (err) {
    next(err);
  }
});

// POST /api/pixelboards/:id/pixels — authentifié
router.post('/:id/pixels', authenticate, async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  const result = PlacePixelSchema.safeParse(req.body);
  if (!result.success) {
    next(new SchemaValidationError(result.error));
    return;
  }
  try {
    const { user } = req as unknown as AuthenticatedRequest;
    const pixel = await pixelService.placePixel({
      ...result.data,
      pixelBoardId: req.params.id,
      userId: user._id.toString(),
    });
    res.status(201).json(pixel);
  } catch (err) {
    next(err);
  }
});

export { router as pixelboardRouter };
