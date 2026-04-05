import { Router, Request, Response } from 'express';
import { articleAPI } from './routes/article';

const api = Router();

api.get('/', (req: Request, res: Response) => { // GET SUR localhost:8000/api/
	res.json({ response: 'Hello World!' });
});

api.use('/articles', articleAPI);

export default api;
