import { Router, Request, Response, NextFunction } from 'express';
import * as statsService from '../services/stats.service';

const router = Router();

// GET /api/stats — public
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await statsService.getStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

export { router as statsRouter };
