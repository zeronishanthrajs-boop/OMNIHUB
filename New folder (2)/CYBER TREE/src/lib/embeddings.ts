import crypto from 'crypto';

const DIMENSIONS = 384; // all-MiniLM-L6-v2

/**
 * Generates a deterministic mock embedding vector of 384 dimensions
 * using an LCG generator seeded by the SHA-256 hash of the input text.
 * Matches the Python sentence-transformers output dimensionality.
 */
function getMockEmbedding(text: string): number[] {
  const hash = crypto.createHash('sha256').update(text).digest('hex');
  let state = parseInt(hash.substring(0, 8), 16);

  const vector: number[] = [];
  for (let i = 0; i < DIMENSIONS; i++) {
    state = (state * 1103515245 + 12345) % 4294967296;
    const val = (state / 4294967295.0) * 2.0 - 1.0;
    vector.push(val);
  }

  // Normalize vector to unit length
  let sumSq = 0;
  for (const v of vector) sumSq += v * v;
  const norm = Math.sqrt(sumSq);
  if (norm > 0) {
    for (let i = 0; i < DIMENSIONS; i++) vector[i] /= norm;
  }
  return vector;
}

/**
 * Fetches a 384-dim embedding from the HuggingFace Inference API (free, no key needed).
 * Uses the all-MiniLM-L6-v2 model, same as embed_nodes.py.
 */
async function getHuggingFaceEmbedding(text: string): Promise<number[]> {
  const hfApiKey = process.env.HUGGINGFACE_API_KEY || '';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (hfApiKey) headers['Authorization'] = `Bearer ${hfApiKey}`;

  const response = await fetch(
    'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
    }
  );

  if (!response.ok) {
    throw new Error(`HuggingFace API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();

  // Response is either a flat array of 384 numbers, or nested [[...]]
  if (Array.isArray(result) && Array.isArray(result[0])) {
    return result[0] as number[]; // shape [[384]]
  }
  if (Array.isArray(result) && typeof result[0] === 'number') {
    return result as number[]; // shape [384]
  }

  throw new Error('Unexpected HuggingFace response format');
}

/**
 * Main embedding generator.
 * Priority order:
 *   1. HuggingFace Inference API (free, all-MiniLM-L6-v2, 384-dim)
 *   2. Deterministic 384-dim mock (for offline / rate-limited fallback)
 */
export async function getEmbedding(text: string): Promise<{ vector: number[]; degraded: boolean }> {
  try {
    const vector = await getHuggingFaceEmbedding(text);
    return { vector, degraded: false };
  } catch (err) {
    console.warn('HuggingFace embedding failed, using 384-dim mock:', (err as Error).message);
  }
  return { vector: getMockEmbedding(text), degraded: true };
}
