import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";
import { KnowledgeChunk } from "../models/financeModels.js";

const DEFAULT_CHUNK_SIZE = 900;
const DEFAULT_OVERLAP = 120;

export function chunkText(
  text,
  chunkSize = DEFAULT_CHUNK_SIZE,
  overlap = DEFAULT_OVERLAP,
) {
  const normalized = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return [];
  const chunks = [];
  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(normalized.length, start + chunkSize);
    const boundary =
      end < normalized.length ? normalized.lastIndexOf(" ", end) : end;
    const stop = boundary > start ? boundary : end;
    chunks.push(normalized.slice(start, stop).trim());
    if (stop >= normalized.length) break;
    start = Math.max(stop - overlap, start + 1);
  }
  return chunks;
}

function cosineSimilarity(left, right) {
  if (
    !Array.isArray(left) ||
    !Array.isArray(right) ||
    left.length !== right.length ||
    !left.length
  )
    return 0;
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }
  return leftMagnitude && rightMagnitude
    ? dot / Math.sqrt(leftMagnitude * rightMagnitude)
    : 0;
}

function lexicalScore(query, text) {
  const terms = new Set(
    String(query)
      .toLowerCase()
      .match(/[a-z0-9]{3,}/g) || [],
  );
  const haystack = String(text).toLowerCase();
  if (!terms.size) return 0;
  let matches = 0;
  terms.forEach((term) => {
    if (haystack.includes(term)) matches += 1;
  });
  return matches / terms.size;
}

export async function createEmbedding(text) {
  if (!env.geminiApiKey) return null;
  const client = new GoogleGenerativeAI(env.geminiApiKey);
  const model = client.getGenerativeModel({ model: env.geminiEmbeddingModel });
  const result = await model.embedContent(text);
  return result.embedding?.values || null;
}

export async function ingestKnowledgeDocument(document) {
  const chunks = chunkText(document.text);
  const operations = [];
  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
    const text = chunks[chunkIndex];
    const existing = await KnowledgeChunk.findOne({
      documentId: document.id,
      chunkIndex,
    }).lean();
    const embedding =
      existing?.version === (document.version || "") &&
      existing.embedding?.length
        ? existing.embedding
        : await createEmbedding(text);
    operations.push({
      updateOne: {
        filter: { documentId: document.id, chunkIndex },
        update: {
          $set: {
            documentId: document.id,
            chunkIndex,
            text,
            embedding,
            title: document.title,
            source: document.source,
            url: document.url,
            category: document.category,
            version: document.version || "",
          },
        },
        upsert: true,
      },
    });
  }
  if (operations.length) await KnowledgeChunk.bulkWrite(operations);
  await KnowledgeChunk.deleteMany({
    documentId: document.id,
    chunkIndex: { $gte: chunks.length },
  });
  return { documentId: document.id, chunks: chunks.length };
}

function publicSource(chunk) {
  return {
    title: chunk.title,
    source: chunk.source,
    url: chunk.url,
    category: chunk.category,
    version: chunk.version,
  };
}

async function vectorSearch(queryEmbedding, limit) {
  if (!queryEmbedding || !env.knowledgeVectorIndex) return [];
  try {
    return await KnowledgeChunk.aggregate([
      {
        $vectorSearch: {
          index: env.knowledgeVectorIndex,
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: Math.max(50, limit * 10),
          limit,
        },
      },
      {
        $project: {
          documentId: 1,
          chunkIndex: 1,
          text: 1,
          title: 1,
          source: 1,
          url: 1,
          category: 1,
          version: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ]);
  } catch {
    return [];
  }
}

export async function retrieveKnowledge(query, limit = 4) {
  try {
    const queryEmbedding = await createEmbedding(query).catch(() => null);
    const vectorResults = await vectorSearch(queryEmbedding, limit);
    if (vectorResults.length)
      return vectorResults.map((chunk) => ({
        ...chunk,
        source: publicSource(chunk),
      }));

    const chunks = await KnowledgeChunk.find({}).limit(1000).lean();
    return chunks
      .map((chunk) => ({
        ...chunk,
        score:
          (queryEmbedding
            ? cosineSimilarity(queryEmbedding, chunk.embedding)
            : 0) +
          lexicalScore(query, chunk.text) * 0.35,
      }))
      .filter((chunk) => chunk.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, limit)
      .map((chunk) => ({ ...chunk, source: publicSource(chunk) }));
  } catch {
    return [];
  }
}

export function buildKnowledgeContext(results) {
  return results
    .map(
      (result) =>
        `[${result.source.source}] ${result.source.title}\n${result.text}`,
    )
    .join("\n\n");
}

export { cosineSimilarity, lexicalScore };
