import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import {
  CreatePixelBoardSchema,
  PlacePixelSchema,
  ReplayQuerySchema,
  UploadImageContributionSchema,
} from '../utils/schemas';
import { SchemaValidationError } from '../utils/errors';
import * as boardService from '../services/pixelboard.service';
import * as pixelService from '../services/pixel.service';
import { getIO } from '../socket/io';
import * as exportService from '../services/export.service';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

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

// GET /api/pixelboards/:id/replay — public
router.get('/:id/replay', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  const parsedQuery = ReplayQuerySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    next(new SchemaValidationError(parsedQuery.error));
    return;
  }
  try {
    const replay = await pixelService.getReplayByBoard(
      req.params.id,
      parsedQuery.data.limit,
      parsedQuery.data.offset,
    );
    res.json(replay);
  } catch (err) {
    next(err);
  }
});

// GET /api/pixelboards/:id/export.svg — public
router.get('/:id/export.svg', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const svg = await exportService.buildBoardSvg(req.params.id);
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="pixelboard-${req.params.id}.svg"`);
    res.send(svg);
  } catch (err) {
    next(err);
  }
});

// GET /api/pixelboards/:id/export.png — public
router.get('/:id/export.png', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const png = await exportService.buildBoardPng(req.params.id);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="pixelboard-${req.params.id}.png"`);
    res.send(png);
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

    getIO().to(`board:${req.params.id}`).emit('pixel:placed', {
      position_x: pixel.position_x,
      position_y: pixel.position_y,
      color: pixel.color,
      userId: user._id.toString(),
      username: `${user.firstname} ${user.lastname}`,
    });

    res.status(201).json(pixel);
  } catch (err) {
    next(err);
  }
});

// POST /api/pixelboards/:id/upload-image — authentifié
router.post(
  '/:id/upload-image',
  authenticate,
  upload.single('image'),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const parsedBody = UploadImageContributionSchema.safeParse(req.body);
    if (!parsedBody.success) {
      next(new SchemaValidationError(parsedBody.error));
      return;
    }

    if (!req.file?.buffer) {
      res.status(400).json({ message: 'Fichier image requis (champ image)' });
      return;
    }

    try {
      const { user } = req as unknown as AuthenticatedRequest;
      const summary = await pixelService.uploadImageContribution({
        pixelBoardId: req.params.id,
        userId: user._id.toString(),
        imageBuffer: req.file.buffer,
        offset_x: parsedBody.data.offset_x,
        offset_y: parsedBody.data.offset_y,
        maxPixels: parsedBody.data.maxPixels,
      });
      res.status(201).json(summary);
    } catch (err) {
      next(err);
    }
  },
);

export { router as pixelboardRouter };
