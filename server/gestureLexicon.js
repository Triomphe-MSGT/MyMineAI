/**
 * Lexique simplifié : gestes MediaPipe → gloses LSF + phrases françaises.
 * Utilisé en fallback (sans clé API) et pour enrichir le NLU.
 */

export const GESTURE_TO_GLOSE = {
  'MAIN-OUVERTE': 'BONJOUR',
  'POUCE-LEVE': 'OUI',
  'POING': 'NON',
  'PAIX': 'DEUX',
  'POINTER': 'MOI',
  'PINCER': 'PETIT',
  OK: 'OK',
  TROIS: 'TROIS',
  ROCK: 'ROCK',
  '?': 'ATTENDRE',
};

/** Séquences fréquentes → phrase naturelle (clé = tokens joints par |) */
const PHRASE_BY_SEQUENCE = {
  'MAIN-OUVERTE': 'Bonjour à tous.',
  'POUCE-LEVE': 'Oui, d’accord.',
  'POING': 'Non, je ne suis pas d’accord.',
  'POINTER': 'Moi, je vais commencer.',
  'MAIN-OUVERTE|POUCE-LEVE': 'Bonjour, oui.',
  'MAIN-OUVERTE|POINTER': 'Bonjour, c’est moi qui parle.',
  'POINTER|MAIN-OUVERTE': 'Bonjour, je suis là.',
  'POUCE-LEVE|MAIN-OUVERTE': 'Oui, bonjour.',
  'PAIX|POUCE-LEVE': 'Deux points, oui.',
  'POINTER|POING': 'Moi, non.',
  'MAIN-OUVERTE|PINCER|POUCE-LEVE': 'Bonjour, un petit détail — oui.',
};

function normalizeToken(raw) {
  return String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-');
}

/**
 * @param {string[]|string} signs — labels MediaPipe ou gloses
 * @returns {{ french: string, gloses: string, tokens: string[] }}
 */
export function reformulateSignSequence(signs) {
  const tokens = Array.isArray(signs)
    ? signs.map(normalizeToken).filter(Boolean)
    : String(signs || '')
        .split(/\s+/)
        .map(normalizeToken)
        .filter(Boolean);

  if (tokens.length === 0) {
    return { french: 'Message en langue des signes.', gloses: 'MESSAGE SIGNE', tokens: [] };
  }

  const glosesList = tokens.map((t) => GESTURE_TO_GLOSE[t] || t);
  const seqKey = tokens.join('|');

  if (PHRASE_BY_SEQUENCE[seqKey]) {
    return {
      french: PHRASE_BY_SEQUENCE[seqKey],
      gloses: glosesList.join(' '),
      tokens,
    };
  }

  const readable = glosesList
    .map((g) => g.charAt(0) + g.slice(1).toLowerCase())
    .join(', ');

  return {
    french: `Je signe : ${readable}.`,
    gloses: glosesList.join(' '),
    tokens,
  };
}
