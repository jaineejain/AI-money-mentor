import assert from "node:assert/strict";
import {
  chunkText,
  cosineSimilarity,
  lexicalScore,
} from "../services/knowledgeService.js";
import { detectIntent } from "../services/aiService.js";
import { createRateLimiter } from "../middleware/rateLimit.js";
import documents from "../knowledge/documents.json" with { type: "json" };

const chunks = chunkText(
  "Emergency funds protect against unexpected expenses. ".repeat(80),
);
assert.ok(chunks.length > 1);
assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
assert.ok(lexicalScore("NPS pension", "The NPS is a pension system") > 0);
assert.equal(detectIntent("What is NPS?"), "tax_planning");
assert.equal(detectIntent("Can I retire at 45?"), "fire_planning");
assert.ok(
  documents.every(
    (document) =>
      document.source && document.url && document.title && document.category,
  ),
);

let status = 200;
const response = {
  setHeader() {},
  status(code) {
    status = code;
    return this;
  },
  json() {},
};
const limiter = createRateLimiter({
  windowMs: 60_000,
  max: 1,
  message: "limited",
});
const request = { ip: `test-${Date.now()}` };
let nextCalls = 0;
limiter(request, response, () => {
  nextCalls += 1;
});
limiter(request, response, () => {
  nextCalls += 1;
});
assert.equal(nextCalls, 1);
assert.equal(status, 429);

console.log("knowledge and rate-limit tests passed");
