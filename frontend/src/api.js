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
};

async function postJson(path, payload) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function getMoneyScore(userData) {
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
