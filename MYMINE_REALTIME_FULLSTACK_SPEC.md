# MyMine – Spec Temps Réel Fullstack (React + Vite + Node + WebSocket)

> **Document destiné à Cursor.**
> Construire le **frontend + backend temps réel** de MyMine.
> Zéro mock. Toutes les interactions sont réelles : micro, caméra, partage d'écran, chat, IA.
> Les clés API sont injectées via `.env` — le système fonctionne en mode dégradé si absentes.

---

## 1. Vue d'ensemble de l'architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        NAVIGATEUR                               │
│                                                                 │
│  React + Vite                                                   │
│  ├── WebRTC (audio/vidéo P2P via SimplePeer)                    │
│  ├── WebSocket client (Socket.io-client)                        │
│  ├── Web Speech API (STT natif navigateur)                      │
│  ├── MediaStream API (micro, caméra, écran)                     │
│  └── SpeechSynthesis API (TTS natif navigateur)                 │
│                                                                 │
└──────────────────────┬──────────────────────────────────────────┘
                       │ WebSocket (Socket.io)
                       │ REST (fetch)
┌──────────────────────▼──────────────────────────────────────────┐
│                     SERVEUR NODE.JS                             │
│                                                                 │
│  Express + Socket.io                                            │
│  ├── Signaling WebRTC (offer/answer/ICE)                        │
│  ├── Room management (participants, état)                       │
│  ├── Relay messages chat                                        │
│  ├── Relay transcriptions                                       │
│  └── Proxy API IA (Anthropic Claude Vision + TTS)               │
│                                                                 │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS
        ┌──────────────┴──────────────┐
        │                             │
   Anthropic API              ElevenLabs API
   (Claude claude-sonnet-4-20250514)       (TTS naturel)
   Vision + LLM               (fallback : Web SpeechSynthesis)
```

---

## 2. Stack technique

### Frontend
```
React 18 + Vite 5
TailwindCSS 3
Framer Motion
Lucide React
Socket.io-client
SimplePeer (WebRTC)
```

### Backend
```
Node.js 20+
Express 4
Socket.io 4
@anthropic-ai/sdk
node-fetch
dotenv
cors
uuid
```

---

## 3. Structure des fichiers

```
mymine/
│
├── .env                          ← clés API (jamais committé)
├── .env.example                  ← template sans valeurs
├── package.json                  ← scripts dev/build/start
│
├── server/
│   ├── index.js                  ← entry point Express + Socket.io
│   ├── roomManager.js            ← gestion des rooms et participants
│   ├── signalingHandler.js       ← WebRTC offer/answer/ICE relay
│   ├── chatHandler.js            ← relay messages chat
│   ├── transcriptionHandler.js   ← relay transcriptions STT
│   └── aiProxy.js                ← proxy Anthropic + ElevenLabs
│
└── client/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── socket.js             ← instance Socket.io singleton
        │
        ├── hooks/
        │   ├── useRoom.js        ← rejoindre/quitter room
        │   ├── useWebRTC.js      ← gestion flux audio/vidéo P2P
        │   ├── useSTT.js         ← Speech-to-Text continu
        │   ├── useTTS.js         ← Text-to-Speech (ElevenLabs ou SpeechSynthesis)
        │   ├── useScreenShare.js ← capture + envoi image au serveur IA
        │   └── useChat.js        ← send/receive messages
        │
        ├── components/
        │   ├── shared/
        │   │   ├── Avatar.jsx
        │   │   ├── MicIndicator.jsx
        │   │   ├── ChatPanel.jsx
        │   │   ├── ParticipantList.jsx
        │   │   └── Notification.jsx
        │   │
        │   ├── standard/
        │   │   ├── StandardLayout.jsx
        │   │   ├── VideoGrid.jsx
        │   │   ├── VideoTile.jsx
        │   │   ├── Toolbar.jsx
        │   │   └── ScreenShareOverlay.jsx
        │   │
        │   ├── blind/
        │   │   ├── BlindLayout.jsx
        │   │   ├── VoiceAssistantPanel.jsx
        │   │   ├── AudioEventLog.jsx
        │   │   └── VoiceCommandHints.jsx
        │   │
        │   └── deaf/
        │       ├── DeafLayout.jsx
        │       ├── TranscriptionFeed.jsx
        │       ├── SignLanguageAvatar.jsx
        │       └── TextToSpeechInput.jsx
        │
        └── pages/
            ├── LandingPage.jsx
            ├── ProfileSelectPage.jsx
            └── MeetingPage.jsx
```

---

## 4. Variables d'environnement

### `.env.example` (à la racine)
```env
# Anthropic Claude (Vision + LLM)
ANTHROPIC_API_KEY=sk-ant-...

# ElevenLabs (TTS naturel)
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# Serveur
PORT=3001
CLIENT_URL=http://localhost:5173

# Mode dégradé sans clés : true = utilise Web Speech API navigateur
FALLBACK_BROWSER_TTS=true
FALLBACK_BROWSER_STT=true
```

> **Règle** : si `ANTHROPIC_API_KEY` est absent → descriptions visuelles désactivées avec message dégradé.
> Si `ELEVENLABS_API_KEY` absent → fallback sur `SpeechSynthesisUtterance` navigateur.

---

## 5. Backend — `server/index.js`

```js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupRoomHandlers } from './roomManager.js';
import { setupSignaling } from './signalingHandler.js';
import { setupChat } from './chatHandler.js';
import { setupTranscription } from './transcriptionHandler.js';
import { describeImage, generateAISummary } from './aiProxy.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL, methods: ['GET', 'POST'] },
  maxHttpBufferSize: 5e6, // 5MB pour les images base64
});

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json({ limit: '10mb' }));

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

io.on('connection', (socket) => {
  setupRoomHandlers(io, socket);
  setupSignaling(io, socket);
  setupChat(io, socket);
  setupTranscription(io, socket);
});

httpServer.listen(process.env.PORT || 3001, () => {
  console.log(`MyMine server running on port ${process.env.PORT || 3001}`);
});
```

---

## 6. Backend — `server/roomManager.js`

Gérer les rooms et les participants.

```js
const rooms = new Map(); // roomId → { participants: Map<socketId, participantData> }

export function setupRoomHandlers(io, socket) {

  socket.on('join-room', ({ roomId, participant }) => {
    // participant = { id, name, profile, isMuted, videoEnabled }
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.participant = participant;

    if (!rooms.has(roomId)) rooms.set(roomId, { participants: new Map() });
    rooms.get(roomId).participants.set(socket.id, participant);

    // Envoyer la liste actuelle au nouvel arrivant
    const existing = [...rooms.get(roomId).participants.entries()]
      .filter(([sid]) => sid !== socket.id)
      .map(([sid, p]) => ({ socketId: sid, ...p }));
    socket.emit('room-participants', existing);

    // Annoncer le nouvel arrivant aux autres
    socket.to(roomId).emit('participant-joined', { socketId: socket.id, ...participant });
  });

  socket.on('update-state', ({ isMuted, videoEnabled, handRaised, isSpeaking }) => {
    const { roomId, participant } = socket.data;
    if (!roomId || !participant) return;
    Object.assign(participant, { isMuted, videoEnabled, handRaised, isSpeaking });
    socket.to(roomId).emit('participant-updated', { socketId: socket.id, ...participant });
  });

  socket.on('disconnect', () => {
    const { roomId } = socket.data;
    if (!roomId || !rooms.has(roomId)) return;
    rooms.get(roomId).participants.delete(socket.id);
    io.to(roomId).emit('participant-left', { socketId: socket.id });
    if (rooms.get(roomId).participants.size === 0) rooms.delete(roomId);
  });
}
```

---

## 7. Backend — `server/signalingHandler.js`

Relay WebRTC sans logique P2P côté serveur.

```js
export function setupSignaling(io, socket) {
  socket.on('webrtc-offer',   ({ to, offer })       => io.to(to).emit('webrtc-offer',   { from: socket.id, offer }));
  socket.on('webrtc-answer',  ({ to, answer })      => io.to(to).emit('webrtc-answer',  { from: socket.id, answer }));
  socket.on('webrtc-ice',     ({ to, candidate })   => io.to(to).emit('webrtc-ice',     { from: socket.id, candidate }));
}
```

---

## 8. Backend — `server/chatHandler.js`

```js
export function setupChat(io, socket) {
  socket.on('chat-message', ({ roomId, message }) => {
    // message = { id, senderId, senderName, senderProfile, text, timestamp }
    io.to(roomId).emit('chat-message', message);
  });
}
```

---

## 9. Backend — `server/transcriptionHandler.js`

Relay des transcriptions STT générées côté client.

```js
export function setupTranscription(io, socket) {
  socket.on('transcription-chunk', ({ roomId, chunk }) => {
    // chunk = { speakerId, speakerName, speakerProfile, text, timestamp, isFinal }
    socket.to(roomId).emit('transcription-chunk', chunk);
  });

  socket.on('screen-share-start', ({ roomId, sharedBy }) => {
    io.to(roomId).emit('screen-share-start', { sharedBy });
  });

  socket.on('screen-share-stop', ({ roomId }) => {
    io.to(roomId).emit('screen-share-stop');
  });

  socket.on('screen-share-description', ({ roomId, description }) => {
    // description = { text, presenterNote, combinedForBlind }
    io.to(roomId).emit('screen-share-description', description);
  });
}
```

---

## 10. Backend — `server/aiProxy.js`

```js
import Anthropic from '@anthropic-ai/sdk';

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export async function describeImage(imageBase64, presenterText = '', presenterProfile = 'standard') {
  if (!client) {
    return presenterText
      ? `[Description IA non disponible] Le présentateur indique : ${presenterText}`
      : '[Description IA non disponible — clé API manquante]';
  }

  const systemPrompt = `Tu es un assistant d'accessibilité pour personnes aveugles dans une visioconférence.
Décris l'image partagée à l'écran de façon claire, concise, utile (max 3 phrases).
${presenterProfile === 'deaf'
  ? `Le présentateur est sourd/muet. Il communique par écrit. Son message : "${presenterText}"`
  : presenterText ? `Le présentateur a dit : "${presenterText}"` : ''}
Combine la description visuelle et le contexte du présentateur en un seul message audio naturel.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
        { type: 'text', text: 'Décris ce contenu pour un participant aveugle.' }
      ]
    }],
    system: systemPrompt,
  });

  return response.content[0].text;
}

export async function generateAISummary(transcriptionLines) {
  if (!client) return 'Résumé non disponible — clé API manquante.';

  const transcriptText = transcriptionLines
    .map(l => `${l.speakerName} : ${l.text}`)
    .join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `Résume cette réunion en 5 points clés :\n\n${transcriptText}`
    }]
  });

  return response.content[0].text;
}
```

---

## 11. Frontend — `client/src/socket.js`

```js
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export const socket = io(SERVER_URL, { autoConnect: false });
```

---

## 12. Frontend — `useWebRTC.js`

Hook gérant la connexion P2P audio/vidéo avec SimplePeer.

```js
// Logique :
// 1. Quand un nouveau participant rejoint : créer un SimplePeer (initiator=true)
// 2. Envoyer offer via socket → serveur relay → destinataire
// 3. Destinataire crée SimplePeer (initiator=false), répond avec answer
// 4. Échanger candidates ICE
// 5. Une fois connecté : stream audio/vidéo local attaché, stream remote récupéré

// Retourner :
// - localStream : MediaStream (micro + caméra)
// - remoteStreams : Map<socketId, MediaStream>
// - toggleMic() / toggleCamera()
// - peers : Map<socketId, SimplePeer>
```

Implémenter complètement ce hook avec `SimplePeer` et les events Socket.io `webrtc-offer`, `webrtc-answer`, `webrtc-ice`.

---

## 13. Frontend — `useSTT.js`

Speech-to-Text continu via `SpeechRecognition` API navigateur.

```js
// Logique :
// 1. Démarrer SpeechRecognition en continu (interimResults: true, lang: 'fr-FR')
// 2. Sur onresult : émettre socket 'transcription-chunk' avec isFinal
// 3. Sur onspeechstart : émettre socket 'update-state' { isSpeaking: true }
// 4. Sur onspeechend : émettre socket 'update-state' { isSpeaking: false }
// 5. Restart automatique sur onend (pour garder actif)

// Retourner :
// - isListening : bool
// - transcript : string (dernier résultat)
// - startListening() / stopListening()
```

---

## 14. Frontend — `useTTS.js`

Text-to-Speech : ElevenLabs si clé dispo, sinon `SpeechSynthesisUtterance`.

```js
// Logique :
// 1. Vérifier VITE_ELEVENLABS_API_KEY
// 2. Si disponible : POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}
//    → récupérer audio blob → jouer avec Audio()
// 3. Sinon : window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
// 4. File d'attente : ne pas superposer, jouer les messages dans l'ordre
// 5. Priorité : descriptions IA > annonces système > transcriptions

// Retourner :
// - speak(text, priority?) : ajouter à la file
// - stop() : vider la file et couper le son
// - isSpeaking : bool
```

---

## 15. Frontend — `useScreenShare.js`

```js
// Logique :
// 1. getDisplayMedia() → MediaStream écran
// 2. Capturer un frame JPEG toutes les 3s via canvas.toDataURL('image/jpeg', 0.7)
// 3. Si partage d'écran actif + participant aveugle dans la room :
//    POST /api/describe-image { imageBase64, presenterText, presenterProfile }
//    → recevoir description → émettre socket 'screen-share-description'
// 4. Émettre socket 'screen-share-start' / 'screen-share-stop'
// 5. Le stream vidéo est partagé via WebRTC (addTrack au peer)

// Pour le présentateur sourd/muet :
// - presenterText = ce qu'il a tapé dans TextToSpeechInput
// - presenterProfile = 'deaf'
// - La description combinée = description visuelle IA + message Mathieu

// Retourner :
// - screenStream : MediaStream | null
// - isSharing : bool
// - startShare(presenterNote?) / stopShare()
// - latestDescription : string
```

---

## 16. Frontend — Interface Standard `StandardLayout.jsx`

### Comportements temps réel

**VideoGrid** :
- Chaque `VideoTile` affiche le `remoteStream` WebRTC (tag `<video>` avec `srcObject`).
- Indicateur micro pulsant si `isSpeaking === true` (reçu via Socket).
- Badge main levée 🖐 animé si `handRaised === true`.

**ScreenShareOverlay** :
- Quand `screen-share-start` reçu : overlay plein écran avec le stream vidéo partagé.
- Panneau latéral IA :
  - Afficher `latestDescription` dès réception de `screen-share-description`.
  - Si le présentateur est sourd/muet : afficher `presenterNote` en italique en dessous avec label "Mathieu écrit :".
  - Si un participant aveugle est dans la room : badge vert "🔊 Envoyé à Bob".

**Toolbar** :
- Tous les boutons émettent `update-state` via Socket.
- Bouton partage d'écran → `startShare()`.

---

## 17. Frontend — Interface Aveugle `BlindLayout.jsx`

### Comportements temps réel

**VoiceAssistantPanel** :
- Écouter en permanence les events Socket :
  - `participant-joined` → `speak("${name} a rejoint la réunion.")`
  - `participant-left` → `speak("${name} a quitté la réunion.")`
  - `participant-updated` (handRaised) → `speak("${name} lève la main.")`
  - `transcription-chunk` (isFinal) → `speak("${name} dit : ${text}")`
  - `screen-share-start` → `speak("${name} partage son écran. Description en cours...")`
  - `screen-share-description` → `speak(description.combinedForBlind)`
  - `chat-message` → `speak("Message de ${name} : ${text}")`

**useVoiceCommands** (dans ce hook ou directement dans BlindLayout) :
- Écouter en continu avec `SpeechRecognition`.
- Mapper les commandes :
  - "lever la main" → `socket.emit('update-state', { handRaised: true })`
  - "baisser la main" → `socket.emit('update-state', { handRaised: false })`
  - "couper mon micro" → `toggleMic()`
  - "activer mon micro" → `toggleMic()`
  - "qui parle" → lire le nom du dernier isSpeaking
  - "résumer la réunion" → POST `/api/meeting-summary` → `speak(summary)`
  - "lire les messages" → lire les 5 derniers messages chat

**AudioEventLog** :
- Chaque annonce TTS est aussi logguée visuellement (pour la démo).

---

## 18. Frontend — Interface Sourde/Muette `DeafLayout.jsx`

### Comportements temps réel

**TranscriptionFeed** :
- Écouter `transcription-chunk` → ajouter ligne avec animation slide-in.
- Highlight en temps réel sur la ligne du locuteur actif (`isSpeaking`).
- Auto-scroll vers le bas.

**SignLanguageAvatar** :
- Quand une nouvelle ligne de transcription arrive :
  - Déclencher animation CSS de l'avatar (mouvements de bras).
  - Afficher le texte en caption sous l'avatar.
- Utiliser une animation de base en boucle (pas de vraie LSF) avec transition entre repos et mouvement.

**TextToSpeechInput** :
- Champ texte → bouton "Envoyer à voix haute".
- Émet `chat-message` avec le texte.
- Si l'utilisateur est le présentateur du partage d'écran : ce texte est aussi envoyé comme `presenterText` dans `useScreenShare`.
- TTS côté serveur lit ce message pour les autres participants (emit `screen-share-description` avec `presenterNote`).

**Cas Mathieu organise la réunion et partage son écran** :
1. Mathieu clique "Partager l'écran".
2. `useScreenShare` capture un frame.
3. Mathieu voit apparaître son `TextToSpeechInput` avec placeholder : *"Expliquez ce que vous montrez..."*
4. Il tape son message.
5. `POST /api/describe-image` avec `{ imageBase64, presenterText: message, presenterProfile: 'deaf' }`.
6. La description retournée = résumé visuel + contexte Mathieu.
7. Émis via socket `screen-share-description` à toute la room.
8. **Bob reçoit** via TTS : *"Mathieu partage son écran. [description visuelle IA]. Mathieu explique : [ce que Mathieu a écrit]."*
9. **Alice et les autres** voient la description dans le panneau latéral.

---

## 19. Pages

### `LandingPage.jsx`
- Fond `#09090f`, typographie Syne bold, effet grille luminescente animée en background (SVG ou CSS).
- Logo MyMine + tagline *"La réunion qui parle à tout le monde."*
- 3 icônes profils animées (entrée staggered).
- Bouton CTA → `/select`.

### `ProfileSelectPage.jsx`
- Demander : Nom, Profil (Standard / Aveugle / Sourd-Muet), ID de room (ou générer UUID).
- Formulaire minimal, esthétique dark.
- Bouton "Rejoindre" → `MeetingPage` avec `{ name, profile, roomId }`.

### `MeetingPage.jsx`
- Au mount : `socket.connect()`, `socket.emit('join-room', { roomId, participant })`.
- Initialiser `useWebRTC`, `useSTT`, `useTTS`, `useChat`.
- Monter le bon layout selon le profil.
- Au unmount : `socket.disconnect()`, stopper streams.

---

## 20. Design System

### Palette
```css
:root {
  --bg-primary:    #09090f;
  --bg-secondary:  #12121a;
  --bg-card:       #1a1a26;
  --border:        #2a2a3e;

  --accent-cyan:   #00f5d4;
  --accent-violet: #7c3aed;
  --accent-amber:  #f59e0b;
  --accent-blue:   #3b82f6;
  --accent-red:    #ef4444;

  --text-primary:  #f0f0f8;
  --text-secondary:#8888aa;
  --text-muted:    #44445a;

  --glow-cyan:     0 0 20px rgba(0,245,212,0.3);
  --glow-amber:    0 0 20px rgba(245,158,11,0.3);
}
```

### Typographie (Google Fonts)
- Titres : **Syne** 700/800
- Corps : **DM Sans** 400/500
- Transcriptions / logs : **JetBrains Mono** 400

---

## 21. `package.json` racine (monorepo simple)

```json
{
  "name": "mymine",
  "scripts": {
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "server": "node --watch server/index.js",
    "client": "cd client && npm run dev",
    "build": "cd client && npm run build",
    "start": "node server/index.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.24.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.0",
    "socket.io": "^4.7.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "concurrently": "^8.0.0"
  },
  "type": "module"
}
```

### `client/package.json`
```json
{
  "name": "mymine-client",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-router-dom": "^6.0.0",
    "socket.io-client": "^4.7.0",
    "simplepeer": "^9.11.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.383.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "tailwindcss": "^3.0.0",
    "postcss": "^8.0.0",
    "autoprefixer": "^10.0.0"
  }
}
```

### `client/.env.example`
```env
VITE_SERVER_URL=http://localhost:3001
VITE_ELEVENLABS_API_KEY=
VITE_ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

---

## 22. Déploiement

### Local
```bash
cp .env.example .env          # Remplir les clés
npm install
cd client && npm install && cd ..
npm run dev
# Frontend : http://localhost:5173
# Backend  : http://localhost:3001
```

### Production (Render + Vercel)

**Backend → Render (Web Service)**
- Build command : `npm install`
- Start command : `node server/index.js`
- Variables d'environnement : ajouter `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, `CLIENT_URL=https://mymine.vercel.app`, `PORT=3001`

**Frontend → Vercel**
- Root directory : `client/`
- Build command : `npm run build`
- Variables d'environnement : `VITE_SERVER_URL=https://mymine-backend.onrender.com`

---

## 23. Ordre d'implémentation recommandé pour Cursor

1. **Serveur** : `index.js` → `roomManager.js` → `signalingHandler.js` → `chatHandler.js` → `transcriptionHandler.js` → `aiProxy.js`
2. **Socket client** : `socket.js` → `useRoom.js` → `useChat.js`
3. **WebRTC** : `useWebRTC.js` (le plus complexe)
4. **STT / TTS** : `useSTT.js` → `useTTS.js`
5. **Partage d'écran** : `useScreenShare.js`
6. **Pages** : `LandingPage` → `ProfileSelectPage` → `MeetingPage`
7. **Layouts** : `StandardLayout` → `BlindLayout` → `DeafLayout`
8. **Tests multi-onglets** : ouvrir 3 onglets avec 3 profils différents

---

## 24. Tests de validation

Ouvrir 3 onglets sur `http://localhost:5173` :

| Onglet | Profil | Validation |
|--------|--------|------------|
| 1 | Standard (Alice) | Voir vidéo, entendre audio, voir transcriptions |
| 2 | Aveugle (Bob) | Entendre les annonces IA, commandes vocales fonctionnelles |
| 3 | Sourd/Muet (Mathieu) | Voir transcriptions, écrire → TTS entendu par Alice et Bob |

**Scénario de validation partage d'écran Mathieu** :
- Mathieu (onglet 3) clique "Partager écran"
- Mathieu écrit "Regardez la courbe bleue"
- Alice (onglet 1) voit l'image + description IA dans le panneau latéral
- Bob (onglet 2) entend : *"Mathieu partage son écran. [description]. Mathieu explique : Regardez la courbe bleue."*

---

*Fin du spec — Cursor peut commencer l'implémentation section par section.*
