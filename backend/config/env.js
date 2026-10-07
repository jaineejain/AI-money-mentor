import "dotenv/config";

const splitOrigins = (value) =>
  value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 8000),
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiEmbeddingModel:
    process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004",
  knowledgeVectorIndex: process.env.KNOWLEDGE_VECTOR_INDEX || "",
  mongoUri: process.env.MONGODB_URI || "",
  jwtSecret: process.env.JWT_SECRET || "",
  frontendOrigins: splitOrigins(
    process.env.FRONTEND_ORIGINS ||
      "http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173",
  ),
};
