// src/lib/localModel.ts

/**
 * Call a local LLM running on the developer machine (for example Ollama or
 * llama.cpp HTTP server listening on http://localhost:11434).
 * The endpoint and model name can be overridden with env vars so the helper
 * works out-of-the-box but is still configurable.
 */
export async function localChat(prompt: string): Promise<string> {
  const endpoint = process.env.LOCAL_LLM_ENDPOINT ?? 'http://localhost:11434/api/generate';
  const model = process.env.LOCAL_MODEL_NAME ?? 'llama3';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Ollama-style body; adapt if you use a different local server
      body: JSON.stringify({
        model,
        prompt,
        stream: true,
        options: {
          num_predict: 256,   // or even 128
          temperature: 0.7
        }
      }),
    });

    if (!res.ok) {
      throw new Error(`Local LLM responded with ${res.status}`);
    }

    // Ollama may return multiple newline-separated JSON objects even when stream:false.
    const raw = await res.text();
    type OllamaJSON = { response?: string; content?: string; done?: boolean };
    let fullText = '';
    const lines = raw.trim().split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      try {
        const obj = JSON.parse(line) as OllamaJSON;
        if (obj.response) fullText += obj.response;
        if (obj.content) fullText += obj.content;
        if (obj.done) break;
      } catch {
        // ignore
      }
    }

    if (!fullText) throw new Error('Failed to parse local model response');

    return fullText;
  } catch (err) {
    console.error('Local model fallback failed:', err);
    return 'Sorry, the service is temporarily unavailable.';
  }
} 