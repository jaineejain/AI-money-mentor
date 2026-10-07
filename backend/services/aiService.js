import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";
import {
  CHAT_PROMPT_TEMPLATE,
  FIRE_PLAN_PROMPT_TEMPLATE,
  SCORE_PROMPT_TEMPLATE,
  SYSTEM_PROMPT,
} from "../constants/prompts.js";
import { extractJsonPayload } from "../utils/json.js";
import { calculateFIRE, calculateSIP } from "./financialService.js";
import {
  buildKnowledgeContext,
  retrieveKnowledge,
} from "./knowledgeService.js";

function requireApiKey() {
  if (!env.geminiApiKey) {
    const error = new Error(
      "GEMINI_API_KEY is not configured. Add it to backend/.env before calling this endpoint.",
    );
    error.statusCode = 500;
    throw error;
  }
}

function createModel(systemInstruction) {
  requireApiKey();

  const client = new GoogleGenerativeAI(env.geminiApiKey);

  return client.getGenerativeModel({
    model: "gemini-3.6-flash",
    systemInstruction,
  });
}

async function generateText(prompt, systemInstruction = SYSTEM_PROMPT) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const result =
        await createModel(systemInstruction).generateContent(prompt);
      const responseText = result.response.text().trim();
      if (!responseText)
        throw Object.assign(new Error("Gemini returned an empty response."), {
          statusCode: 502,
        });
      return responseText;
    } catch (error) {
      if (error.statusCode) throw error;
      lastError = error;
      const message = String(error.message || error);
      const retryable = /429|503|resource exhausted|unavailable/i.test(message);
      if (!retryable || attempt === 2) break;
      await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
    }
  }
  const wrappedError = new Error(
    `Gemini request failed: ${lastError?.message || "temporary service error"}`,
  );
  wrappedError.statusCode = /429/.test(String(lastError?.message)) ? 429 : 502;
  throw wrappedError;
}

export function detectIntent(question) {
  const text = question.toLowerCase();
  if (/fire|financial independence|retire/.test(text)) return "fire_planning";
  if (/sip|mutual fund|invest/.test(text)) return "sip_investing";
  if (/tax|80c|nps|ppf/.test(text)) return "tax_planning";
  if (/budget|expense|spend/.test(text)) return "budgeting";
  if (/emergency/.test(text)) return "emergency_fund";
  if (/goal|house|education|car/.test(text)) return "goal_planning";
  if (/net worth|asset|liabilit|debt/.test(text)) return "net_worth";
  if (/health|score/.test(text)) return "financial_health";
  return "financial_education";
}

function isKnowledgeQuestion(question) {
  return /what is|how does|explain|nps|ppf|epf|80c|mutual fund|index fund|emergency fund/i.test(
    question,
  );
}

function deterministicReply(intent, fire, sip) {
  if (intent === "fire_planning") {
    return `Your current projection is ${Math.round(fire.fireAge)} years old for FIRE, with a target corpus of INR ${Math.round(fire.corpusNeeded).toLocaleString("en-IN")}. The estimated monthly investment required is INR ${Math.round(fire.requiredMonthlyInvestment).toLocaleString("en-IN")}.`;
  }
  if (intent === "sip_investing") {
    return `At the supplied assumptions, the projection is INR ${Math.round(sip.projectedCorpus).toLocaleString("en-IN")}. This is an estimate, not a guaranteed return.`;
  }
  return null;
}

function buildUserContextSummary(userContext) {
  const allowedFields = [
    "age",
    "monthly_income",
    "monthly_expenses",
    "existing_savings",
    "has_insurance",
    "has_emergency_fund",
    "goal",
    "overall_score",
    "grade",
    "corpus_needed",
    "monthly_sip_recommended",
    "fire_age",
  ];

  const context = Object.fromEntries(
    allowedFields
      .filter((field) => userContext?.[field] !== undefined)
      .map((field) => [field, userContext[field]]),
  );

  return Object.keys(context).length > 0
    ? JSON.stringify(context)
    : "No financial profile was provided.";
}

export async function createChatReply(question, userContext) {
  const intent = detectIntent(question);
  const fire = calculateFIRE({
    age: userContext?.age,
    monthlyIncome: userContext?.monthly_income,
    monthlyExpenses: userContext?.monthly_expenses,
    currentSavings: userContext?.existing_savings,
  });
  const sip = calculateSIP({
    monthlyInvestment: userContext?.monthly_sip || fire.monthlyInvestment,
    currentSavings: userContext?.existing_savings,
    years: Math.max(1, 60 - Number(userContext?.age || 30)),
  });
  const knowledgeResults = isKnowledgeQuestion(question)
    ? await retrieveKnowledge(question)
    : [];
  const sources = knowledgeResults
    .map((result) => result.source)
    .filter(
      (source, index, allSources) =>
        allSources.findIndex((item) => item.url === source.url) === index,
    );
  const calculationReply =
    !isKnowledgeQuestion(question) && !knowledgeResults.length
      ? deterministicReply(intent, fire, sip)
      : null;
  let reply = calculationReply;
  if (isKnowledgeQuestion(question) && !knowledgeResults.length && !reply) {
    reply =
      "I do not have an indexed authoritative source for that question yet. Please check the relevant RBI, SEBI, EPFO, PFRDA, or Income Tax Department guidance before acting.";
  } else if (!reply || knowledgeResults.length) {
    const knowledgeContext = knowledgeResults.length
      ? `\n\nAuthoritative knowledge context (use only this context for factual claims and do not invent citations):\n${buildKnowledgeContext(knowledgeResults)}`
      : "";
    const prompt =
      CHAT_PROMPT_TEMPLATE.replace(
        "{user_context_summary}",
        buildUserContextSummary(userContext),
      ).replace("{question}", question.trim()) + knowledgeContext;
    reply = await generateText(prompt);
  }

  return {
    reply,
    intent,
    sources,
    metrics: {
      projected_corpus: Math.round(sip.projectedCorpus),
      fire_corpus: Math.round(fire.corpusNeeded),
    },
    timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
  };
}

export async function createAdviceReply(question, userContext) {
  const promptParts = [`User question: ${question.trim()}`];

  if (userContext && Object.keys(userContext).length > 0) {
    promptParts.push(`User context: ${JSON.stringify(userContext)}`);
  }

  promptParts.push(
    "Respond with concise, actionable personal finance advice tailored to India.",
  );

  const response = await generateText(promptParts.join("\n\n"));

  return {
    question,
    user_context: userContext || {},
    response,
  };
}

export async function createMoneyHealthScore(finance) {
  const savingsRate =
    finance.monthly_income <= 0
      ? 0
      : ((finance.monthly_income - finance.monthly_expenses) /
          finance.monthly_income) *
        100;

  const prompt = SCORE_PROMPT_TEMPLATE.replace("{age}", finance.age)
    .replace("{monthly_income}", finance.monthly_income)
    .replace("{monthly_expenses}", finance.monthly_expenses)
    .replace("{existing_savings}", finance.existing_savings ?? 0)
    .replace("{has_insurance}", finance.has_insurance ?? false)
    .replace("{has_emergency_fund}", finance.has_emergency_fund ?? false)
    .replace("{goal}", finance.goal ?? "retirement")
    .replace("{savings_rate}", savingsRate.toFixed(2));

  const response = await generateText(prompt, "You generate strict JSON only.");

  return validateMoneyHealthScore(
    parseJsonResponse(response, "Money health score"),
  );
}

export async function createFirePlan(finance) {
  const prompt = FIRE_PLAN_PROMPT_TEMPLATE.replace("{age}", finance.age)
    .replace("{monthly_income}", finance.monthly_income)
    .replace("{monthly_expenses}", finance.monthly_expenses)
    .replace("{existing_savings}", finance.existing_savings ?? 0)
    .replace("{has_insurance}", finance.has_insurance ?? false)
    .replace("{has_emergency_fund}", finance.has_emergency_fund ?? false)
    .replace("{goal}", finance.goal ?? "retirement");

  const response = await generateText(prompt, "You generate strict JSON only.");

  return validateFirePlan(parseJsonResponse(response, "FIRE plan"));
}

function parseJsonResponse(response, label) {
  try {
    return extractJsonPayload(response);
  } catch (error) {
    const wrappedError = new Error(
      `Gemini returned invalid JSON for ${label}: ${error.message}`,
    );

    wrappedError.statusCode = 502;
    throw wrappedError;
  }
}

function schemaError(label, message) {
  const error = new Error(
    `Gemini JSON did not match expected schema: ${label}: ${message}`,
  );

  error.statusCode = 502;
  throw error;
}

function validateMoneyHealthScore(value) {
  if (!value || typeof value !== "object") {
    schemaError("Money health score", "response must be an object");
  }

  const breakdownKeys = [
    "emergency_fund",
    "insurance",
    "investments",
    "debt_health",
    "tax_efficiency",
    "retirement_readiness",
  ];

  const breakdownValid =
    value.breakdown &&
    breakdownKeys.every(
      (key) =>
        Number.isInteger(value.breakdown[key]) &&
        value.breakdown[key] >= 0 &&
        value.breakdown[key] <= 100,
    );

  if (
    !Number.isInteger(value.overall_score) ||
    value.overall_score < 0 ||
    value.overall_score > 100 ||
    !breakdownValid ||
    !["A", "B", "C", "D"].includes(value.grade) ||
    typeof value.summary !== "string" ||
    !Array.isArray(value.top_3_actions) ||
    value.top_3_actions.length !== 3 ||
    !value.top_3_actions.every((action) => typeof action === "string") ||
    !Number.isInteger(value.fire_age)
  ) {
    schemaError("Money health score", "one or more fields are invalid");
  }

  return value;
}

function validateFirePlan(value) {
  const milestonesValid =
    Array.isArray(value?.year_wise_milestones) &&
    value.year_wise_milestones.length === 5 &&
    value.year_wise_milestones.every(
      (milestone) =>
        Number.isInteger(milestone?.year) &&
        typeof milestone?.action === "string" &&
        Number.isInteger(milestone?.target_amount),
    );

  const allocation = value?.asset_allocation;
  const taxPlan = value?.tax_saving_plan;

  const allocationValid = ["equity_mf", "debt", "gold", "emergency"].every(
    (key) => Number.isInteger(allocation?.[key]),
  );

  const taxPlanValid = ["80C_amount", "NPS_amount", "total_tax_saved"].every(
    (key) => Number.isInteger(taxPlan?.[key]),
  );

  if (
    !Number.isInteger(value?.fire_age) ||
    !Number.isInteger(value?.corpus_needed) ||
    !Number.isInteger(value?.monthly_sip_recommended) ||
    !allocationValid ||
    !milestonesValid ||
    !taxPlanValid
  ) {
    schemaError("FIRE plan", "one or more fields are invalid");
  }

  return value;
}
