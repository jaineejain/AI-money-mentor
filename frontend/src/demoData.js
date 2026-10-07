const STORAGE_KEY = "ai-money-mentor-demo-data";

const DEMO_FINANCE = {
  age: 29,
  monthly_income: 120000,
  monthly_expenses: 68000,
  existing_savings: 420000,
  has_insurance: true,
  has_emergency_fund: true,
  goal: "retire-early",
};

const DEMO_ASSETS = [
  {
    _id: "demo-asset-1",
    name: "Index fund portfolio",
    category: "Equity",
    amount: 310000,
  },
  {
    _id: "demo-asset-2",
    name: "PPF and fixed deposits",
    category: "Debt",
    amount: 110000,
  },
];

const DEMO_LIABILITIES = [
  {
    _id: "demo-liability-1",
    name: "Education loan",
    category: "Education Loan",
    amount: 85000,
  },
];

const DEMO_GOALS = [
  {
    _id: "demo-goal-1",
    name: "Financial independence fund",
    targetAmount: 2500000,
    currentAmount: 420000,
    targetDate: "2032-12-31",
    priority: "high",
    expectedReturn: 10,
  },
  {
    _id: "demo-goal-2",
    name: "Travel fund",
    targetAmount: 180000,
    currentAmount: 72000,
    targetDate: "2027-06-30",
    priority: "medium",
    expectedReturn: 6,
  },
];

const DEMO_TRANSACTIONS = [
  {
    _id: "demo-transaction-1",
    type: "expense",
    amount: 24000,
    category: "Rent",
    description: "Monthly rent",
    transactionDate: "2026-09-01",
  },
  {
    _id: "demo-transaction-2",
    type: "expense",
    amount: 12500,
    category: "Food",
    description: "Groceries and dining",
    transactionDate: "2026-09-08",
  },
  {
    _id: "demo-transaction-3",
    type: "expense",
    amount: 6800,
    category: "Transport",
    description: "Commute and rides",
    transactionDate: "2026-09-15",
  },
  {
    _id: "demo-transaction-4",
    type: "expense",
    amount: 14700,
    category: "Utilities",
    description: "Bills and subscriptions",
    transactionDate: "2026-09-22",
  },
];

const DEMO_SNAPSHOTS = [
  {
    snapshotDate: "2026-07-01",
    netWorth: 380000,
    savings: 44000,
    healthScore: 68,
    investments: 270000,
    expenses: 70000,
  },
  {
    snapshotDate: "2026-08-01",
    netWorth: 405000,
    savings: 47000,
    healthScore: 73,
    investments: 290000,
    expenses: 69000,
  },
  {
    snapshotDate: "2026-09-01",
    netWorth: 445000,
    savings: 52000,
    healthScore: 79,
    investments: 310000,
    expenses: 68000,
  },
];

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function calculateSIP({
  monthlyInvestment = 0,
  currentSavings = 0,
  annualReturn = 10,
  years = 10,
  targetAmount = 0,
} = {}) {
  const monthlyRate = number(annualReturn) / 100 / 12;
  const months = Math.max(0, Math.round(number(years) * 12));
  const contribution = Math.max(0, number(monthlyInvestment));
  const principal = Math.max(0, number(currentSavings));
  const factor =
    monthlyRate === 0
      ? months
      : ((1 + monthlyRate) ** months - 1) / monthlyRate;
  const projectedCorpus =
    principal * (1 + monthlyRate) ** months + contribution * factor;
  const requiredMonthlyInvestment =
    targetAmount > 0 && factor > 0
      ? Math.max(
          0,
          (number(targetAmount) - principal * (1 + monthlyRate) ** months) /
            factor,
        )
      : 0;
  return { projectedCorpus, requiredMonthlyInvestment };
}

function calculateGoal(goal) {
  const remaining = Math.max(
    0,
    number(goal.targetAmount) - number(goal.currentAmount),
  );
  const months = Math.max(
    0,
    Math.ceil(
      (new Date(goal.targetDate).getTime() - Date.now()) /
        (30.4375 * 24 * 60 * 60 * 1000),
    ),
  );
  const plan = calculateSIP({
    currentSavings: goal.currentAmount,
    annualReturn: goal.expectedReturn,
    years: months / 12,
    targetAmount: goal.targetAmount,
  });
  return {
    progress:
      goal.targetAmount > 0
        ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
        : 0,
    remaining,
    months,
    requiredMonthlyContribution: plan.requiredMonthlyInvestment,
    shortfall: Math.max(0, remaining - plan.requiredMonthlyInvestment * months),
  };
}

function calculateDashboard(state) {
  const finance = state.finance;
  const savings =
    number(finance.monthly_income) - number(finance.monthly_expenses);
  const savingsRate = finance.monthly_income
    ? (savings / finance.monthly_income) * 100
    : 0;
  const totalAssets = state.assets.reduce(
    (sum, item) => sum + number(item.amount),
    0,
  );
  const totalLiabilities = state.liabilities.reduce(
    (sum, item) => sum + number(item.amount),
    0,
  );
  const netWorth = totalAssets - totalLiabilities;
  const emergencyRecommended = number(finance.monthly_expenses) * 6;
  const emergencyScore = finance.has_emergency_fund
    ? 85
    : Math.min(
        100,
        emergencyRecommended
          ? (number(finance.existing_savings) / emergencyRecommended) * 100
          : 0,
      );
  const breakdown = {
    emergency_fund: Math.round(Math.max(0, emergencyScore)),
    insurance: finance.has_insurance ? 85 : 35,
    investments: totalAssets > 0 ? 70 : 20,
    debt_health: totalAssets >= totalLiabilities ? 80 : 35,
    tax_efficiency: 60,
    retirement_readiness: Math.min(100, Math.max(20, savingsRate * 2)),
  };
  const overallScore = Math.round(
    Object.values(breakdown).reduce((sum, value) => sum + value, 0) / 6,
  );
  const fireAge = 60;
  const corpusNeeded = number(finance.monthly_expenses) * 12 * 25;
  const projection = calculateSIP({
    monthlyInvestment: Math.max(0, savings),
    currentSavings: finance.existing_savings,
    years: fireAge - number(finance.age),
    annualReturn: 10,
  });
  const score = {
    overall_score: overallScore,
    grade:
      overallScore >= 80
        ? "A"
        : overallScore >= 65
          ? "B"
          : overallScore >= 50
            ? "C"
            : "D",
    breakdown,
    summary: state.goals.length
      ? "Your score reflects your cash flow, protection, balance sheet, and active goals."
      : "Add a goal and investment details for a more complete health assessment.",
    top_3_actions: [
      emergencyScore < 70
        ? "Build a 3-6 month emergency fund."
        : "Keep your emergency fund liquid and reviewed annually.",
      savingsRate < 20
        ? "Aim to increase your monthly savings rate above 20%."
        : "Keep increasing investments as your income grows.",
      totalLiabilities > totalAssets
        ? "Prioritize high-cost debt before increasing risk exposure."
        : "Review your investment allocation and tax-saving options annually.",
    ],
  };
  const fire = {
    fireAge,
    corpusNeeded,
    projectedCorpus: projection.projectedCorpus,
    requiredMonthlyInvestment: calculateSIP({
      currentSavings: finance.existing_savings,
      annualReturn: 10,
      years: fireAge - number(finance.age),
      targetAmount: corpusNeeded,
    }).requiredMonthlyInvestment,
    shortfall: Math.max(0, corpusNeeded - projection.projectedCorpus),
  };
  return {
    finance,
    transactions: state.transactions,
    budgets: [],
    goals: state.goals.map((goal) => ({
      ...goal,
      calculation: calculateGoal(goal),
    })),
    assets: state.assets,
    liabilities: state.liabilities,
    snapshots: state.snapshots,
    score,
    metrics: {
      savings,
      savingsRate,
      netWorth,
      totalAssets,
      totalLiabilities,
      fireAge,
      corpusNeeded,
      projectedCorpus: projection.projectedCorpus,
      requiredMonthlyInvestment: fire.requiredMonthlyInvestment,
      shortfall: fire.shortfall,
    },
  };
}

function createSeedState() {
  return {
    finance: { ...DEMO_FINANCE },
    assets: DEMO_ASSETS.map((item) => ({ ...item })),
    liabilities: DEMO_LIABILITIES.map((item) => ({ ...item })),
    goals: DEMO_GOALS.map((item) => ({ ...item })),
    transactions: DEMO_TRANSACTIONS.map((item) => ({ ...item })),
    snapshots: DEMO_SNAPSHOTS.map((item) => ({ ...item })),
  };
}

function readState() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : createSeedState();
  } catch {
    return createSeedState();
  }
}

function writeState(state) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

export function getDemoProfile() {
  return readState().finance;
}

export function updateDemoProfile(finance) {
  const state = readState();
  state.finance = { ...state.finance, ...finance };
  writeState(state);
  return state.finance;
}

export function getDemoDashboard() {
  return calculateDashboard(readState());
}

export function createDemoGoal(goal) {
  const state = readState();
  state.goals.push({ ...goal, _id: `demo-goal-${Date.now()}` });
  writeState(state);
  return state.goals.at(-1);
}

export function deleteDemoGoal(id) {
  const state = readState();
  state.goals = state.goals.filter((goal) => goal._id !== id);
  writeState(state);
}

export function createDemoHolding(kind, holding) {
  const state = readState();
  const item = { ...holding, _id: `demo-${kind}-${Date.now()}` };
  state[kind].push(item);
  writeState(state);
  return item;
}

export function createDemoTransaction(transaction) {
  const state = readState();
  const item = {
    ...transaction,
    _id: `demo-transaction-${Date.now()}`,
    transactionDate: new Date().toISOString(),
  };
  state.transactions.push(item);
  writeState(state);
  return item;
}

export function getDemoReply(question, userContext) {
  const text = question.toLowerCase();
  const monthlySavings =
    number(userContext?.monthly_income) - number(userContext?.monthly_expenses);
  if (/fire|retire|independence/.test(text)) {
    return `In this demo projection, your FIRE corpus target is INR ${Math.round(number(userContext?.corpus_needed)).toLocaleString("en-IN")}. Your estimated monthly investment need is INR ${Math.round(number(userContext?.monthly_sip_recommended)).toLocaleString("en-IN")}.`;
  }
  if (/sip|invest|mutual fund/.test(text)) {
    return `Your current monthly surplus is INR ${Math.round(monthlySavings).toLocaleString("en-IN")}. A diversified, long-term SIP can be explored within that surplus; returns are estimates, not guarantees.`;
  }
  if (/tax|80c|nps|ppf/.test(text)) {
    return "Use the Tax Planner for a practical checklist, then confirm current limits and eligibility with official Income Tax Department guidance.";
  }
  if (/budget|expense|spend/.test(text)) {
    return `You currently have INR ${Math.round(monthlySavings).toLocaleString("en-IN")} left after the monthly expense baseline. Add expenses in Budget Planner to make this view more precise.`;
  }
  return "This is a local demo response based on your sample profile. Explore the Health, FIRE Planner, Simulator, and Budget Planner views to test different decisions.";
}

export function clearDemoData() {
  window.localStorage.removeItem(STORAGE_KEY);
}
