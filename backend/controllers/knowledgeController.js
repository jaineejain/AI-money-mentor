import { retrieveKnowledge } from "../services/knowledgeService.js";

export async function queryKnowledgeController(request, response) {
  const results = await retrieveKnowledge(request.body.question, 5);
  response.json({
    query: request.body.question,
    results: results.map((result) => ({
      text: result.text,
      source: result.source,
      score: result.score,
    })),
    sources: results
      .map((result) => result.source)
      .filter(
        (source, index, allSources) =>
          allSources.findIndex((item) => item.url === source.url) === index,
      ),
  });
}
