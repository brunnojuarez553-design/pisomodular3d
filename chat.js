// Vercel Edge Function — proxy seguro hacia Groq
// La API key vive solo acá (variable de entorno GROQ_API_KEY en Vercel),
// nunca se expone en el frontend.

export const config = { runtime: 'edge' };

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return json({ error: 'Body inválido' }, 400);
  }

  const { messages, system } = body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: 'messages es requerido' }, 400);
  }

  if (!process.env.GROQ_API_KEY) {
    return json({ error: 'GROQ_API_KEY no está configurada en Vercel' }, 500);
  }

  // Sanitizar: solo role/content, nada más viaja a Groq
  const cleanMessages = messages
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content }));

  const groqMessages = system
    ? [{ role: 'system', content: String(system) }, ...cleanMessages]
    : cleanMessages;

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: groqMessages,
        temperature: 0.6,
        max_tokens: 600
      })
    });

    if (!groqRes.ok) {
      const detail = await groqRes.text();
      console.error('Groq error', groqRes.status, detail);
      return json({ error: 'Error al consultar Groq' }, 502);
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content || '';

    return json({ reply });

  } catch (err) {
    console.error('Proxy error', err);
    return json({ error: 'Error interno del proxy' }, 500);
  }
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
