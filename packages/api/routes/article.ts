import { Router, Request, Response } from 'express';
import { articles, save } from '../services/article';

const router = Router();

router.get('/', (req: Request, res: Response) => { // GET SUR localhost:8000/api/articles
	res.json(articles);
});

router.post('/', (req: Request, res: Response) => { // POST SUR localhost:8000/api/articles
	const { body } = req;
	// eslint-disable-next-line no-console
	console.log(`body ==> ${JSON.stringify(body)}`);
	const updatedArticles = save(body);
	res.json(updatedArticles);
});

export { router as articleAPI };
