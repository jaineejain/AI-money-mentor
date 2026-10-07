import axios from "axios";
import {
  createDemoGoal,
  createDemoHolding,
  createDemoTransaction,
  deleteDemoGoal,
  getDemoDashboard,
  getDemoProfile,
  getDemoReply,
  updateDemoProfile,
} from "./demoData";

export const GUEST_STORAGE_KEY = "ai-money-mentor-guest";

export function isGuestMode() {
  return window.localStorage.getItem(GUEST_STORAGE_KEY) === "true";
}

export function enterGuestMode() {
  window.localStorage.setItem(GUEST_STORAGE_KEY, "true");
}

export function exitGuestMode() {
  window.localStorage.removeItem(GUEST_STORAGE_KEY);
}

const envBaseUrl =
  (typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_API_URL) ||
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  undefined;

export const BASE_URL = envBaseUrl || "http://localhost:8000";

const DEFAULT_SCORE = {
  overall_score: 0,
  breakdown: {
    emergency_fund: 0,
    insurance: 0,
    investments: 0,
    debt_health: 0,
    tax_efficiency: 0,
    retirement_readiness: 0,
  },
  grade: "D",
  summary: "Unable to load your score right now.",
  top_3_actions: [
    "Try again in a moment.",
    "Check if the backend is running.",
    "Verify the API URL configuration.",
  ],
  fire_age: 0,
};

const DEFAULT_FIRE_PLAN = {
  fire_age: 0,
  corpus_needed: 0,
  monthly_sip_recommended: 0,
  asset_allocation: {
    equity_mf: 0,
    debt: 0,
    gold: 0,
    emergency: 0,
  },
  year_wise_milestones: [],
  tax_saving_plan: {
    "80C_amount": 0,
    NPS_amount: 0,
    total_tax_saved: 0,
  },
};

const DEFAULT_CHAT_REPLY = {
  reply:
    "I could not load the advisor response right now. Please try again shortly.",
  timestamp: new Date().toISOString(),
  intent: "financial_education",
  sources: [],
};

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

async function postJson(path, payload) {
  const response = await apiClient.post(path, payload);
  return response.data;
}

export async function getMoneyScore(userData) {
  if (isGuestMode()) return getDemoDashboard().score;
  try {
    const data = await postJson("/api/score", userData);
    return {
      ...DEFAULT_SCORE,
      ...data,
      breakdown: {
        ...DEFAULT_SCORE.breakdown,
        ...(data?.breakdown || {}),
      },
    };
  } catch {
    return DEFAULT_SCORE;
  }
}

export async function getFirePlan(userData) {
  if (isGuestMode()) {
    const { metrics } = getDemoDashboard();
    return {
      fire_age: metrics.fireAge,
      corpus_needed: metrics.corpusNeeded,
      projected_corpus: metrics.projectedCorpus,
      monthly_sip_recommended: metrics.requiredMonthlyInvestment,
    };
  }
  try {
    const data = await postJson("/api/fire-plan", userData);
    return {
      ...DEFAULT_FIRE_PLAN,
      ...data,
      asset_allocation: {
        ...DEFAULT_FIRE_PLAN.asset_allocation,
        ...(data?.asset_allocation || {}),
      },
      tax_saving_plan: {
        ...DEFAULT_FIRE_PLAN.tax_saving_plan,
        ...(data?.tax_saving_plan || {}),
      },
      year_wise_milestones: Array.isArray(data?.year_wise_milestones)
        ? data.year_wise_milestones
        : DEFAULT_FIRE_PLAN.year_wise_milestones,
    };
  } catch {
    return DEFAULT_FIRE_PLAN;
  }
}

export async function sendChatMessage(question, userContext) {
  if (isGuestMode()) {
    return {
      ...DEFAULT_CHAT_REPLY,
      reply: getDemoReply(question, userContext),
    };
  }
  try {
    const data = await postJson("/api/chat", {
      question,
      user_context: userContext,
    });

    return {
      ...DEFAULT_CHAT_REPLY,
      ...data,
      reply: data?.reply || DEFAULT_CHAT_REPLY.reply,
      timestamp: data?.timestamp || new Date().toISOString(),
    };
  } catch {
    return DEFAULT_CHAT_REPLY;
  }
}

export async function register(email, password) {
  const response = await postJson("/api/auth/register", { email, password });
  return response.user;
}

export async function login(email, password) {
  const response = await postJson("/api/auth/login", { email, password });
  return response.user;
}

export async function getCurrentUser() {
  const response = await apiClient.get("/api/auth/me");
  return response.data.user;
}

export async function logout() {
  await apiClient.post("/api/auth/logout");
}

export async function getFinanceProfile() {
  if (isGuestMode()) return getDemoProfile();
  const response = await apiClient.get("/api/finance/profile");
  return response.data.finance;
}

export async function updateFinanceProfile(finance) {
  if (isGuestMode()) return updateDemoProfile(finance);
  const response = await apiClient.put("/api/finance/profile", finance);
  return response.data.finance;
}

export async function getDashboard() {
  if (isGuestMode()) return getDemoDashboard();
  const response = await apiClient.get("/api/dashboard");
  return response.data;
}

export async function getGoals() {
  if (isGuestMode()) return getDemoDashboard().goals;
  const response = await apiClient.get("/api/goals");
  return response.data.goals;
}

export async function createGoal(goal) {
  if (isGuestMode()) return createDemoGoal(goal);
  const response = await apiClient.post("/api/goals", goal);
  return response.data.goal;
}

export async function updateGoal(id, goal) {
  const response = await apiClient.put(`/api/goals/${id}`, goal);
  return response.data.goal;
}

export async function deleteGoal(id) {
  if (isGuestMode()) {
    deleteDemoGoal(id);
    return;
  }
  await apiClient.delete(`/api/goals/${id}`);
}

export async function getHoldings(kind) {
  if (isGuestMode()) return getDemoDashboard()[kind];
  const response = await apiClient.get(`/api/${kind}`);
  return response.data[kind];
}

export async function createHolding(kind, holding) {
  if (isGuestMode()) return createDemoHolding(kind, holding);
  const response = await apiClient.post(`/api/${kind}`, holding);
  return response.data[kind === "assets" ? "asset" : "liability"];
}

export async function listTransactions() {
  if (isGuestMode()) return getDemoDashboard().transactions;
  const response = await apiClient.get("/api/transactions");
  return response.data.transactions;
}

export async function createTransaction(transaction) {
  if (isGuestMode()) return createDemoTransaction(transaction);
  const response = await apiClient.post("/api/transactions", transaction);
  return response.data.transaction;
}

export async function getSnapshots() {
  if (isGuestMode()) return getDemoDashboard().snapshots;
  const response = await apiClient.get("/api/snapshots");
  return response.data.snapshots;
}

export async function createSnapshot() {
  const response = await apiClient.post("/api/snapshots");
  return response.data.snapshot;
}
