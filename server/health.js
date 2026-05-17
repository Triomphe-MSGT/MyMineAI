/** Route santé pour Render / monitoring (montée depuis index.js si besoin). */
export function healthPayload() {
  return { ok: true, service: 'mymine-api', ts: Date.now() };
}
