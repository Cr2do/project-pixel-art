import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db';
import api from './api';
import { errorHandler } from './middleware/error.middleware';
import { initIO } from './socket/io';
import { setupSocket } from './socket';
import { expireBoards } from './services/pixelboard.service';
import { seed } from './seed';

const app = express();
const port = Number(process.env.PORT ?? 8000);

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'Pixel Art API', api: '/api' });
});

app.use('/api', api);
app.use(errorHandler);

const httpServer = http.createServer(app);
const io = initIO(httpServer);
setupSocket(io);

const EXPIRE_INTERVAL_MS = 60_000_000; // check 60 minutes

connectDB().then(async () => {
  await seed();

  httpServer.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });

  // Expire boards periodically so deadlines are respected even without traffic
  setInterval(() => {
    expireBoards().catch((err: unknown) => console.error('[expireBoards]', err));
  }, EXPIRE_INTERVAL_MS);
});
