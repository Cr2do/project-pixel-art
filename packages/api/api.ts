import { Router, Request, Response } from 'express';
import { authRouter } from './routes/auth';
import { userRouter } from './routes/user';
import { pixelboardRouter } from './routes/pixelboard';
import { adminRouter } from './routes/admin';

const api = Router();

api.get('/', (req: Request, res: Response) => {
  res.json({ response: 'Hello World!' });
});

api.use('/auth', authRouter);
api.use('/users', userRouter);
api.use('/pixelboards', pixelboardRouter);
api.use('/admin', adminRouter);

export default api;
