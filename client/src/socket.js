import { io } from 'socket.io-client';

/**
 * Dev Vite (:5173) → API sur :3001 (VITE_SERVER_URL).
 * Prod / Render → toujours la même origine (évite 404 socket si .env local baked-in).
 */
function resolveServerUrl() {
  if (typeof window !== 'undefined') {
    const { origin, port, hostname } = window.location;
    if (import.meta.env.PROD) return origin;
    if (port === '5173' || port === '5174') {
      const env = import.meta.env.VITE_SERVER_URL;
      if (env && String(env).trim()) return String(env).trim();
      return 'http://localhost:3001';
    }
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') return origin;
  }
  const env = import.meta.env.VITE_SERVER_URL;
  if (env && String(env).trim()) return String(env).trim();
  return 'http://localhost:3001';
}

export const socket = io(resolveServerUrl(), { autoConnect: false });

