import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectDatabase } from "../config/database.js";
import { ingestKnowledgeDocument } from "../services/knowledgeService.js";

const directory = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(directory, "../knowledge/documents.json");
const documents = JSON.parse(await fs.readFile(sourcePath, "utf8"));

await connectDatabase();
for (const document of documents) {
  const result = await ingestKnowledgeDocument(document);
  console.log(`${result.documentId}: ${result.chunks} chunks indexed`);
}
process.exit(0);
