import {
  Asset,
  Budget,
  FinancialSnapshot,
  Goal,
  Liability,
  Transaction,
  User,
} from "../models/financeModels.js";
import {
  calculateFIRE,
  calculateGoal,
  calculateHealthScore,
  calculateNetWorth,
  calculateSavings,
} from "../services/financialService.js";

export async function getFinanceProfileController(request, response) {
  const user = await User.findById(request.userId).lean();
  response.json({ finance: user?.finance || null });
}

export async function updateFinanceProfileController(request, response) {
  const user = await User.findByIdAndUpdate(
    request.userId,
    { $set: { finance: request.body } },
    { new: true, runValidators: true },
  ).lean();
  response.json({ finance: user.finance });
}

export async function listTransactionsController(request, response) {
  const transactions = await Transaction.find({ user: request.userId })
    .sort({ transactionDate: -1 })
    .limit(200)
    .lean();
  response.json({ transactions });
}

export async function createTransactionController(request, response) {
  const transaction = await Transaction.create({
    ...request.body,
    user: request.userId,
  });
  response.status(201).json({ transaction });
}

export async function listBudgetsController(request, response) {
  const budgets = await Budget.find({ user: request.userId })
    .sort({ month: -1, category: 1 })
    .limit(200)
    .lean();
  response.json({ budgets });
}

export async function createBudgetController(request, response) {
  try {
    const budget = await Budget.create({
      ...request.body,
      user: request.userId,
    });
    response.status(201).json({ budget });
  } catch (error) {
    if (error.code === 11000) {
      response.status(409).json({
        detail: "A budget already exists for this category and month.",
      });
      return;
    }
    throw error;
  }
}

async function listOwned(Model, userId) {
  return Model.find({ user: userId }).sort({ createdAt: -1 }).limit(200).lean();
}

function startOfDay(date = new Date()) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

async function loadFinancialData(userId) {
  const [user, transactions, budgets, goals, assets, liabilities] =
    await Promise.all([
      User.findById(userId).lean(),
      listOwned(Transaction, userId),
      listOwned(Budget, userId),
      listOwned(Goal, userId),
      listOwned(Asset, userId),
      listOwned(Liability, userId),
    ]);
  const finance = user?.finance || {};
  const transactionIncome = transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const transactionExpenses = transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  const income = transactionIncome || finance.monthly_income || 0;
  const expenses = transactionExpenses || finance.monthly_expenses || 0;
  const enrichedGoals = goals.map((goal) => ({
    ...goal,
    calculation: calculateGoal(goal),
  }));
  const netWorth = calculateNetWorth(assets, liabilities);
  const savings = calculateSavings(income, expenses);
  const fire = calculateFIRE({
    age: finance.age,
    monthlyIncome: income,
    monthlyExpenses: expenses,
    currentSavings: finance.existing_savings,
  });
  const score = calculateHealthScore(
    { ...finance, monthly_income: income, monthly_expenses: expenses },
    netWorth,
    goals,
  );
  return {
    finance: { ...finance, monthly_income: income, monthly_expenses: expenses },
    transactions,
    budgets,
    goals: enrichedGoals,
    assets,
    liabilities,
    metrics: { ...savings, ...netWorth, ...fire },
    score,
  };
}

async function ensureDailySnapshot(userId, data) {
  const snapshotDate = startOfDay();
  const existing = await FinancialSnapshot.findOne({
    user: userId,
    snapshotDate,
  }).lean();
  if (existing) return existing;
  try {
    return await FinancialSnapshot.create({
      user: userId,
      snapshotDate,
      income: data.finance.monthly_income,
      expenses: data.finance.monthly_expenses,
      savings: data.metrics.savings,
      netWorth: data.metrics.netWorth,
      investments: data.metrics.totalAssets,
      healthScore: data.score.overall_score,
      fireProjection: data.metrics.projectedCorpus,
    });
  } catch (error) {
    if (error.code === 11000)
      return FinancialSnapshot.findOne({ user: userId, snapshotDate }).lean();
    throw error;
  }
}

export async function listGoalsController(request, response) {
  response.json({ goals: await listOwned(Goal, request.userId) });
}

export async function createGoalController(request, response) {
  const goal = await Goal.create({ ...request.body, user: request.userId });
  response.status(201).json({ goal });
}

export async function updateGoalController(request, response) {
  const goal = await Goal.findOneAndUpdate(
    { _id: request.params.id, user: request.userId },
    { $set: request.body },
    { new: true, runValidators: true },
  ).lean();
  if (!goal) return response.status(404).json({ detail: "Goal not found." });
  response.json({ goal });
}

export async function deleteGoalController(request, response) {
  const result = await Goal.deleteOne({
    _id: request.params.id,
    user: request.userId,
  });
  if (!result.deletedCount)
    return response.status(404).json({ detail: "Goal not found." });
  response.status(204).end();
}

export async function listHoldingsController(request, response) {
  const kind = request.path.includes("liabilities") ? "liabilities" : "assets";
  const Model = kind === "liabilities" ? Liability : Asset;
  response.json({ [kind]: await listOwned(Model, request.userId) });
}

export async function createHoldingController(request, response) {
  const isLiability = request.path.includes("liabilities");
  const Model = isLiability ? Liability : Asset;
  const key = isLiability ? "liability" : "asset";
  response.status(201).json({
    [key]: await Model.create({ ...request.body, user: request.userId }),
  });
}

export async function getDashboardController(request, response) {
  const data = await loadFinancialData(request.userId);
  await ensureDailySnapshot(request.userId, data);
  const snapshots = await FinancialSnapshot.find({ user: request.userId })
    .sort({ snapshotDate: -1 })
    .limit(120)
    .lean();
  response.json({ ...data, snapshots });
}

export async function listSnapshotsController(request, response) {
  const snapshots = await FinancialSnapshot.find({ user: request.userId })
    .sort({ snapshotDate: -1 })
    .limit(120)
    .lean();
  response.json({ snapshots });
}

export async function createSnapshotController(request, response) {
  const data = await loadFinancialData(request.userId);
  const snapshot = await ensureDailySnapshot(request.userId, data);
  response.status(201).json({ snapshot });
}
