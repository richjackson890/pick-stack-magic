const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqOptions {
  temperature?: number;
  max_tokens?: number;
}

export async function callGroq(
  messages: GroqMessage[],
  options: GroqOptions = {}
): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_GROQ_API_KEY is not set');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.max_tokens ?? 600,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Parse a JSON block from an LLM response that may contain markdown fences or extra text.
 */
export function parseJsonFromLLM<T = any>(raw: string): T | null {
  try {
    // Strip markdown code fences if present
    const stripped = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    const match = stripped.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch {
    // ignore
  }
  return null;
}
