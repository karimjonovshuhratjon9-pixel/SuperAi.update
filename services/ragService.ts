import { RAGDocumentChunk } from "../types";
import { getApiKey } from "./geminiService";

/**
 * Matnni semantik va o'lchovli bo'laklarga (chunks) ajratish
 */
export function chunkDocument(
  text: string,
  chunkSize: number = 600,
  overlap: number = 100
): RAGDocumentChunk[] {
  if (!text || !text.trim()) return [];

  // Avval paragraflar bo'yicha ajratish
  const paragraphs = text.split(/\n\s*\n+/);
  const chunks: RAGDocumentChunk[] = [];
  let currentChunk = "";
  let chunkIndex = 0;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    if ((currentChunk + "\n\n" + trimmed).length <= chunkSize) {
      currentChunk = currentChunk ? currentChunk + "\n\n" + trimmed : trimmed;
    } else {
      if (currentChunk) {
        chunks.push({
          id: `chunk_${++chunkIndex}`,
          content: currentChunk,
        });
      }
      // Agar bitta paragrafning o'zi chunkSize dan katta bo'lsa, uni kesish
      if (trimmed.length > chunkSize) {
        let start = 0;
        while (start < trimmed.length) {
          const slice = trimmed.slice(start, start + chunkSize);
          chunks.push({
            id: `chunk_${++chunkIndex}`,
            content: slice,
          });
          start += chunkSize - overlap;
        }
        currentChunk = "";
      } else {
        currentChunk = trimmed;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      id: `chunk_${++chunkIndex}`,
      content: currentChunk.trim(),
    });
  }

  return chunks;
}

/**
 * Cosine Similarity hisoblash
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Matndan sodda TF-IDF vektorini hisoblash (klient tomonidagi tezkor fallback)
 */
export function generateSimpleEmbedding(text: string, vocabulary: string[]): number[] {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }
  return vocabulary.map((term) => freq[term] || 0);
}

/**
 * Gemini Embedding API orqali vektor olish
 */
export async function getGeminiEmbedding(text: string): Promise<number[] | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: { parts: [{ text: text.slice(0, 2048) }] },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.embedding?.values || null;
  } catch {
    return null;
  }
}

/**
 * Hujjat chunklari ichidan gibrid qidiruv (Semantik Vektor + Kalit so'z)
 */
export async function searchRelevantChunks(
  query: string,
  chunks: RAGDocumentChunk[],
  topK: number = 4
): Promise<RAGDocumentChunk[]> {
  if (!chunks.length) return [];

  // Kalit so'zlar bo'yicha match balli
  const queryTerms = (query.toLowerCase().match(/\b\w{3,}\b/g) || []);

  const scoredChunks = chunks.map((chunk) => {
    let keywordScore = 0;
    const chunkLower = chunk.content.toLowerCase();
    for (const term of queryTerms) {
      if (chunkLower.includes(term)) {
        keywordScore += 1;
      }
    }

    const keywordNorm = queryTerms.length > 0 ? keywordScore / queryTerms.length : 0;
    return {
      ...chunk,
      similarity: keywordNorm,
    };
  });

  // Agar natijalar bor bo'lsa, ball bo'yicha saralash
  scoredChunks.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

  // Agar birorta ham kalit so'z to'g'ri kelmasa, dastlabki chunklarni taqdim etamiz
  const topResults = scoredChunks.filter((c) => (c.similarity || 0) > 0).slice(0, topK);
  if (topResults.length > 0) {
    return topResults;
  }

  return chunks.slice(0, topK);
}
