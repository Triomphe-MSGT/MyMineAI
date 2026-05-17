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
