import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './modules/auth/auth.routes';
import roomRoutes from './modules/room/room.routes';
import { errorMiddleware } from './middleware/error.middleware';
import { setupSignaling } from './modules/signaling/signaling.handler';
import { connectDatabase } from './config/database';
import { getAllowedOrigins, isOriginAllowed } from './config/cors';

const PORT = parseInt(process.env.PORT || '3001', 10);

const app = express();
const httpServer = createServer(app);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (isOriginAllowed(origin)) callback(null, true);
    else callback(new Error(`CORS: origine non autorisée (${origin})`));
  },
  credentials: true,
};

const io = new Server(httpServer, {
  cors: {
    origin: getAllowedOrigins(),
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'mymeet-server' });
});

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

app.use(errorMiddleware);

setupSignaling(io);

async function start() {
  await connectDatabase();

  httpServer.listen(PORT, () => {
    console.log(`[MyMeet] Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('[MyMeet] Arrêt du serveur :', err.message);
  process.exit(1);
});
