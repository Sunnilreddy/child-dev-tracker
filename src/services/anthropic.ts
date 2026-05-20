const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.5-flash';

export function hasApiKey(): boolean {
  return !!(process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '').trim();
}

export interface GeminiMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface BaseParams {
  system: string;
  messages: GeminiMessage[];
  maxTokens?: number;
  model?: string;
  temperature?: number;
  thinking?: boolean; // enable extended thinking (slower, higher quality)
}

export interface StreamParams extends BaseParams {
  onChunk: (text: string) => void;
  signal?: AbortSignal;
}

function buildRequestBody(params: BaseParams) {
  const contents = params.messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  return {
    system_instruction: { parts: [{ text: params.system }] },
    contents,
    generationConfig: {
      temperature: params.temperature ?? 0.7,
      maxOutputTokens: params.maxTokens ?? 1024,
      // Disable thinking by default for low latency; pass thinking=true for deep generation
      thinkingConfig: { thinkingBudget: params.thinking ? 1024 : 0 },
    },
  };
}

function buildUrl(model: string, streaming: boolean): string {
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
  const method = streaming ? 'streamGenerateContent' : 'generateContent';
  const alt = streaming ? '&alt=sse' : '';
  return `${BASE_URL}/${model}:${method}?key=${key}${alt}`;
}

// ─── Blocking call ────────────────────────────────────────────────────────────
// Use for activity generation — needs complete JSON response before parsing.
export async function callClaude({
  system,
  messages,
  maxTokens = 1024,
  model = DEFAULT_MODEL,
  temperature = 0.7,
  thinking = false,
}: BaseParams): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
  if (!apiKey) throw new Error('EXPO_PUBLIC_GEMINI_API_KEY is not set');

  const res = await fetch(buildUrl(model, false), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildRequestBody({ system, messages, maxTokens, model, temperature, thinking })),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err}`);
  }

  const data = await res.json() as {
    candidates: Array<{ content: { parts: Array<{ text?: string; thought?: boolean }> } }>;
  };
  // Skip thought parts — only return visible text
  const parts = data.candidates[0]?.content?.parts ?? [];
  return parts.filter((p) => !p.thought && p.text).map((p) => p.text).join('') ?? '';
}

// ─── Streaming call ───────────────────────────────────────────────────────────
// Use for chat — calls onChunk on every text delta so the UI can render live.
// Falls back to a typewriter animation if the runtime doesn't support streaming.
export async function streamClaude({
  system,
  messages,
  maxTokens = 350,
  model = DEFAULT_MODEL,
  temperature = 0.75,
  thinking = false,
  onChunk,
  signal,
}: StreamParams): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
  if (!apiKey) throw new Error('EXPO_PUBLIC_GEMINI_API_KEY is not set');

  const res = await fetch(buildUrl(model, true), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildRequestBody({ system, messages, maxTokens, model, temperature, thinking })),
    signal,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err}`);
  }

  // ── Real streaming path ──────────────────────────────────────────────────────
  const reader = res.body?.getReader();
  if (reader) {
    const decoder = new TextDecoder();
    let fullText = '';
    let sseBuffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done || signal?.aborted) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop() ?? ''; // last incomplete line stays in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr) as {
              candidates?: Array<{
                content?: { parts?: Array<{ text?: string; thought?: boolean }> };
              }>;
            };
            const parts = parsed.candidates?.[0]?.content?.parts ?? [];
            for (const part of parts) {
              if (!part.thought && part.text) {
                fullText += part.text;
                onChunk(part.text);
              }
            }
          } catch {
            // malformed SSE chunk — skip silently
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullText;
  }

  // ── Typewriter fallback (streaming not available in runtime) ─────────────────
  const data = await res.json() as {
    candidates: Array<{ content: { parts: Array<{ text?: string; thought?: boolean }> } }>;
  };
  const parts = data.candidates[0]?.content?.parts ?? [];
  const fullText = parts.filter((p) => !p.thought && p.text).map((p) => p.text).join('');

  // Animate word-by-word for the same visual feel
  const words = fullText.split(' ');
  let built = '';
  for (const word of words) {
    built += (built ? ' ' : '') + word;
    onChunk(built); // send the accumulated string so far (UI replaces, not appends)
    await new Promise((r) => setTimeout(r, 18));
  }

  return fullText;
}
