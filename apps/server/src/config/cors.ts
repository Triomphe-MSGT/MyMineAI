export function getAllowedOrigins(): string[] {
  const raw = process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:5173';
  return raw.split(',').map((url) => url.trim()).filter(Boolean);
}

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  const allowed = getAllowedOrigins();
  if (allowed.includes('*')) return true;
  return allowed.includes(origin);
}
