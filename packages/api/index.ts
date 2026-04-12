import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db';
import api from './api';
import { errorHandler } from './middleware/error.middleware';

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'Pixel Art API', api: '/api' });
});

app.use('/api', api);
app.use(errorHandler);

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
});
