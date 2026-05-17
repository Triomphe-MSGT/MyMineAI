/**
 * MyMine Accessibility Flow — implémentation server-side du pipeline Flowise
 * `mymine_flowise_flow.json`.
 *
 * Pipeline :
 *   Event in (audio | image/screen | text | room_event)
 *     → routing par type
 *       → STT  (Groq Whisper, optionnel — fallback: texte déjà transcrit côté client)
 *       → Vision (Claude Sonnet via aiProxy / fallback: Groq LLaVA)
 *       → Room event formatting
 *     → NLU (Llama 3.3 via Groq | Claude)
 *       → produit { intent, priority, blind_message, deaf_subtitle, deaf_lsf_gloses, standard_summary }
 *     → broadcast Socket.io vers la room, segmenté par profil
 *       blind   → 'mymine-event'  (TTS côté client)
 *       deaf    → 'mymine-event'  (sous-titres + gloses LSF)
 *       standard→ 'mymine-event'  (notification + résumé)
 *
 * Aucune clé API requise : si GROQ_API_KEY / ANTHROPIC_API_KEY sont absentes,
 * un fallback heuristique produit malgré tout les 3 versions.
 */

import Anthropic from '@anthropic-ai/sdk';
import { describeImage } from './aiProxy.js';
import { reformulateSignSequence } from './gestureLexicon.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;

const NLU_SYSTEM = `Tu es l'agent accessibilité MyMine. Tu reçois un évènement de réunion (texte, transcription, description d'écran ou évènement room) et tu produis UNIQUEMENT un objet JSON valide (sans markdown, sans texte autour) avec EXACTEMENT ces champs :
{
  "intent": string,              // ex: parole, reference_visuel, action_requise, info, partage_ecran, vote, socialisation, room_event
  "priority": "urgent" | "info" | "notif",
  "blind_message": string,       // message complet à lire à voix haute, avec contexte spatial si utile
  "deaf_subtitle": string,       // sous-titre court à afficher
  "deaf_lsf_gloses": string,     // gloses LSF SIMPLIFIÉES en majuscules, ex: 'ALICE MONTRER GRAPHIQUE VENTES'
  "standard_summary": string,    // résumé court pour interface standard / notification
  "needs_tts": boolean,
  "needs_lsf": boolean
}
Pas de markdown. Pas d'explication. JSON valide uniquement.`;

function safeJSON(maybe) {
  if (!maybe || typeof maybe !== 'string') return null;
  // Strip code fences if any
  const cleaned = maybe.replace(/```json|```/g, '').trim();
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first === -1 || last === -1) return null;
  try {
    return JSON.parse(cleaned.slice(first, last + 1));
  } catch {
    return null;
  }
}

function uppercaseGloses(text) {
  if (!text) return '';
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\b(LE|LA|LES|UN|UNE|DES|DU|DE|D|AU|AUX|EST|ET|OU|A|EN)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 10)
    .join(' ');
}

/**
 * Heuristic fallback when no LLM key is available. Produces a coherent 3-profile payload.
 */
function fallbackNLU(input, eventType, payload) {
  const text = (input || '').trim();
  let intent = 'info';
  let priority = 'notif';

  if (eventType === 'room_event') {
    intent = 'room_event';
    if (payload?.kind === 'raise' || payload?.kind === 'vote') priority = 'urgent';
  } else if (eventType === 'screen' || eventType === 'image') {
    intent = 'partage_ecran';
    priority = 'info';
  } else if (eventType === 'gesture') {
    intent = 'parole';
    priority = 'info';
    const signs = Array.isArray(payload?.signs) ? payload.signs : [];
    const { french, gloses } = reformulateSignSequence(signs);
    return {
      intent,
      priority,
      blind_message: french,
      deaf_subtitle: french,
      deaf_lsf_gloses: uppercaseGloses(gloses) || 'MESSAGE SIGNE',
      standard_summary: french.length > 90 ? `${french.slice(0, 87)}…` : french,
      needs_tts: true,
      needs_lsf: true,
    };
  } else if (eventType === 'audio' || eventType === 'text' || eventType === 'chat') {
    intent = 'parole';
    priority = 'info';
  }

  return {
    intent,
    priority,
    blind_message: text || 'Évènement dans la réunion.',
    deaf_subtitle: text.length > 140 ? `${text.slice(0, 137)}…` : text,
    deaf_lsf_gloses: uppercaseGloses(text) || 'EVENEMENT REUNION',
    standard_summary: text.length > 90 ? `${text.slice(0, 87)}…` : text,
    needs_tts: true,
    needs_lsf: true,
  };
}

async function nluViaGroq(input) {
  if (!GROQ_API_KEY) return null;
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: NLU_SYSTEM },
          { role: 'user', content: `Évènement: ${input}` },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const txt = data?.choices?.[0]?.message?.content;
    return safeJSON(txt);
  } catch {
    return null;
  }
}

async function nluViaClaude(input) {
  if (!anthropic) return null;
  try {
    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: NLU_SYSTEM,
      messages: [{ role: 'user', content: `Évènement: ${input}` }],
    });
    const txt = res?.content?.[0]?.text;
    return safeJSON(txt);
  } catch {
    return null;
  }
}

/**
 * Format a room_event into a human-readable input string for the NLU.
 */
function formatRoomEvent(payload) {
  if (!payload || typeof payload !== 'object') return 'Évènement room.';
  const name = payload.name || payload.who || 'Quelqu’un';
  switch (payload.kind) {
    case 'join':
      return `${name} a rejoint la réunion (${payload.role || 'participant'}).`;
    case 'leave':
      return `${name} a quitté la réunion.`;
    case 'raise':
      return `${name} lève la main.`;
    case 'lower':
      return `${name} baisse la main.`;
    case 'vote':
      return `Vote ouvert : ${payload.question || '(question non précisée)'}.`;
    case 'silence':
      return `Silence détecté depuis ${payload.duration || '15s'}.`;
    case 'share-start':
      return `${name} commence à partager son écran.`;
    case 'share-stop':
      return `${name} a arrêté le partage d'écran.`;
    default:
      return `${name} : ${payload.message || 'évènement room'}.`;
  }
}

/**
 * Run the NLU step. Falls back gracefully.
 */
async function runNLU(input, { eventType, payload }) {
  const text = (input || '').slice(0, 4000);
  let nlu = await nluViaGroq(text);
  if (!nlu) nlu = await nluViaClaude(text);
  if (!nlu) nlu = fallbackNLU(text, eventType, payload);

  // Normalize
  return {
    intent: nlu.intent || 'info',
    priority: ['urgent', 'info', 'notif'].includes(nlu.priority) ? nlu.priority : 'notif',
    blind_message: nlu.blind_message || text || 'Évènement.',
    deaf_subtitle: nlu.deaf_subtitle || text.slice(0, 140),
    deaf_lsf_gloses: nlu.deaf_lsf_gloses || uppercaseGloses(text),
    standard_summary: nlu.standard_summary || text.slice(0, 90),
    needs_tts: nlu.needs_tts !== false,
    needs_lsf: nlu.needs_lsf !== false,
  };
}

/**
 * Build the per-profile broadcast payloads.
 */
function buildBroadcast(nlu, base = {}) {
  const timestamp = Date.now();
  const common = { ...base, intent: nlu.intent, priority: nlu.priority, timestamp };
  const speakerPrefix = base.speakerName ? `${base.speakerName} : ` : '';
  const blindText = base.speakerName && base.eventType === 'gesture'
    ? `${speakerPrefix}${nlu.blind_message}`
    : nlu.blind_message;
  return {
    blind: { ...common, profile: 'blind', text: blindText, tts: nlu.needs_tts },
    deaf: {
      ...common,
      profile: 'deaf',
      subtitle: nlu.deaf_subtitle,
      lsf_gloses: nlu.deaf_lsf_gloses,
      needsLSF: nlu.needs_lsf,
    },
    standard: {
      ...common,
      profile: 'standard',
      summary: base.speakerName ? `${base.speakerName} — ${nlu.standard_summary}` : nlu.standard_summary,
    },
  };
}

/** Diffuse une ligne de transcription finale vers toute la room (signes, chat écrit). */
export function fanoutTranscription(io, roomId, speaker, text) {
  const cleaned = String(text || '').trim();
  if (!io || !roomId || !cleaned || !speaker?.id) return;
  io.to(roomId).emit('transcription-chunk', {
    roomId,
    chunk: {
      speakerId: speaker.id,
      speakerName: speaker.name || 'Participant',
      speakerProfile: speaker.profile || 'standard',
      text: cleaned,
      timestamp: Date.now(),
      isFinal: true,
    },
  });
}

/**
 * Entry point — called by socket handler with a normalized event:
 *   { type, payload, profile, speaker, priority, roomId }
 * Returns the 3 broadcast payloads (one per profile).
 */
export async function runMymineFlow(event) {
  const { type = 'text', payload = {}, speaker = null } = event || {};
  let inputForNLU = '';

  switch (type) {
    case 'audio':
      // Audio is already transcribed client-side (Web Speech API) and arrives as text.
      inputForNLU = String(payload?.text || payload || '');
      break;
    case 'text':
    case 'chat':
      inputForNLU = String(payload?.text || payload || '');
      break;
    case 'gesture': {
      const signs = Array.isArray(payload?.signs) ? payload.signs : [];
      const { french, gloses } = reformulateSignSequence(signs);
      const tokens = signs.join(' ') || String(payload?.text || '');
      inputForNLU = `Gestes captés : ${tokens}. Interprétation locale : « ${french} ». Gloses LSF : ${gloses}. Produis une reformulation courte à la première personne pour sourd (deaf_subtitle), une version à lire à voix haute (blind_message), et des gloses LSF en majuscules (deaf_lsf_gloses).`;
      break;
    }
    case 'screen':
    case 'image': {
      const description = await describeImage(
        payload?.imageBase64 || '',
        payload?.presenterText || '',
        payload?.presenterProfile || 'standard',
      );
      inputForNLU = description || 'Partage d’écran en cours.';
      break;
    }
    case 'room_event':
      inputForNLU = formatRoomEvent(payload);
      break;
    default:
      inputForNLU = String(payload?.text || '');
  }

  if (speaker?.name) {
    inputForNLU = `(${speaker.name}${speaker.profile ? `, ${speaker.profile}` : ''}) ${inputForNLU}`;
  }

  const nlu = await runNLU(inputForNLU, { eventType: type, payload });

  return buildBroadcast(nlu, {
    eventType: type,
    speakerId: speaker?.id || null,
    speakerName: speaker?.name || null,
    speakerProfile: speaker?.profile || null,
    localId: payload?.localId || null,
  });
}

/**
 * Attach Socket.io handlers — one event per profile is emitted to the room.
 *
 * Client emits:
 *   socket.emit('mymine-event', { roomId, type, payload, speaker })
 *
 * Server emits to each socket in the room ONLY the payload matching its profile:
 *   socket.emit('mymine-event', { ...broadcast[profile] })
 */
export function setupMymineFlow(io, socket) {
  socket.on('mymine-event', async (msg) => {
    try {
      const { roomId, type, payload, speaker } = msg || {};
      if (!roomId || !type) return;
      const broadcast = await runMymineFlow({ type, payload, speaker, roomId });

      // Per-socket delivery: each participant gets the payload tailored to its profile.
      const roomSockets = await io.in(roomId).fetchSockets();
      for (const s of roomSockets) {
        const profile = s.data?.participant?.profile || 'standard';
        const out = broadcast[profile] || broadcast.standard;
        s.emit('mymine-event', out);
      }

      // Signes / texte écrit : alimenter les sous-titres de toute la room
      if (['gesture', 'text', 'chat'].includes(type) && speaker?.id) {
        const transcript =
          broadcast.deaf?.subtitle ||
          broadcast.blind?.text ||
          broadcast.standard?.summary ||
          '';
        fanoutTranscription(io, roomId, speaker, transcript);
      }
    } catch (err) {
      // Best-effort: surface error to the emitter only.
      socket.emit('mymine-event-error', { message: String(err?.message || err) });
    }
  });
}
