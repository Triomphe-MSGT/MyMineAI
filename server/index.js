import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupRoomHandlers } from './roomManager.js';
import { setupSignaling } from './signalingHandler.js';
import { setupChat } from './chatHandler.js';
import { setupTranscription } from './transcriptionHandler.js';
import { setupMymineFlow, runMymineFlow, fanoutTranscription } from './mymineFlow.js';
import { describeImage, generateAISummary } from './aiProxy.js';
import { healthPayload } from './health.js';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const ALLOWED_ORIGINS = Array.from(
  new Set([
    CLIENT_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
  ]),
);

const corsOrigin = (origin, cb) => {
  // allow REST tools / curl (no origin) + same-origin
  if (!origin) return cb(null, true);
  // allow any localhost dev port (Vite can auto-increment)
  if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return cb(null, true);
  // LAN (tests multi-appareils : téléphones, tablettes, autres PC)
  if (/^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin)) return cb(null, true);
  if (/^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin)) return cb(null, true);
  // Vercel previews & production
  if (/^https:\/\/[\w.-]+\.vercel\.app$/.test(origin)) return cb(null, true);
  return cb(null, ALLOWED_ORIGINS.includes(origin));
};

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: corsOrigin, methods: ['GET', 'POST'] },
  maxHttpBufferSize: 5e6, // 5MB pour les images base64
});

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '10mb' }));

app.get('/', (_req, res) => res.json(healthPayload()));
app.get('/health', (_req, res) => res.json(healthPayload()));

// REST endpoint : description d'image (partage d'écran)
app.post('/api/describe-image', async (req, res) => {
  const { imageBase64, presenterText, presenterProfile } = req.body;
  const description = await describeImage(imageBase64, presenterText, presenterProfile);
  res.json({ description });
});

// REST endpoint : résumé de réunion
app.post('/api/meeting-summary', async (req, res) => {
  const { transcription } = req.body;
  const summary = await generateAISummary(transcription);
  res.json({ summary });
});

// REST endpoint compatible "webhook Flowise" : POST /mymine/event
// Body : { roomId, type, payload, speaker }
// Le serveur exécute le pipeline NLU + broadcast Socket.io vers la room.
app.post('/mymine/event', async (req, res) => {
  try {
    const { roomId, type, payload, speaker } = req.body || {};
    if (!roomId || !type) return res.status(400).json({ error: 'roomId + type required' });
    const broadcast = await runMymineFlow({ type, payload, speaker, roomId });
    const sockets = await io.in(roomId).fetchSockets();
    for (const s of sockets) {
      const profile = s.data?.participant?.profile || 'standard';
      s.emit('mymine-event', broadcast[profile] || broadcast.standard);
    }
    if (['gesture', 'text', 'chat'].includes(type) && speaker?.id) {
      const transcript =
        broadcast.deaf?.subtitle ||
        broadcast.blind?.text ||
        broadcast.standard?.summary ||
        '';
      fanoutTranscription(io, roomId, speaker, transcript);
    }
    res.json({ ok: true, broadcast });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

io.on('connection', (socket) => {
  setupRoomHandlers(io, socket);
  setupSignaling(io, socket);
  setupChat(io, socket);
  setupTranscription(io, socket);
  setupMymineFlow(io, socket);
});

const PORT = Number(process.env.PORT || 3001);
const HOST = process.env.HOST || '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
  console.log(`MyMine server running on http://${HOST}:${PORT}`);
});
