import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db';
import api from './api';
import { errorHandler } from './middleware/error.middleware';
import { initIO } from './socket/io';
import { setupSocket } from './socket';

const app = express();
const port = Number(process.env.PORT ?? 8000);

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'Pixel Art API', api: '/api' });
});

app.use('/api', api);
app.use(errorHandler);

const httpServer = http.createServer(app);
const io = initIO(httpServer);
setupSocket(io);

connectDB().then(() => {
  httpServer.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
});
