import { Router, Request, Response, NextFunction } from 'express';
import * as mapService from '../services/map.service';

const router = Router();

// GET /api/map — public
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await mapService.getGlobalMap();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export { router as mapRouter };
