const MONTHS_PER_YEAR = 12;

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function calculateSavings(income, expenses) {
  const monthlyIncome = number(income);
  const monthlyExpenses = number(expenses);
  const savings = monthlyIncome - monthlyExpenses;
  return {
    savings,
    savingsRate: monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0,
  };
}

export function calculateSIP({
  monthlyInvestment = 0,
  currentSavings = 0,
  annualReturn = 12,
  years = 10,
  targetAmount = 0,
} = {}) {
  const monthlyRate = number(annualReturn) / 100 / MONTHS_PER_YEAR;
  const months = Math.max(0, Math.round(number(years) * MONTHS_PER_YEAR));
  const contribution = Math.max(0, number(monthlyInvestment));
  const principal = Math.max(0, number(currentSavings));
  const growthFactor =
    monthlyRate === 0
      ? months
      : ((1 + monthlyRate) ** months - 1) / monthlyRate;
  const projectedCorpus =
    principal * (1 + monthlyRate) ** months + contribution * growthFactor;
  const investedAmount = principal + contribution * months;
  const requiredMonthlyInvestment =
    targetAmount > 0 && months > 0 && growthFactor > 0
      ? Math.max(
          0,
          (number(targetAmount) - principal * (1 + monthlyRate) ** months) /
            growthFactor,
        )
      : 0;

  return {
    monthlyInvestment: contribution,
    investedAmount,
    projectedCorpus,
    estimatedReturns: projectedCorpus - investedAmount,
    requiredMonthlyInvestment,
    months,
  };
}

export function calculateEmergencyFund(monthlyExpenses, months = 6) {
  const coverageMonths = Math.max(1, number(months, 6));
  const recommended = Math.max(0, number(monthlyExpenses)) * coverageMonths;
  return { months: coverageMonths, recommended };
}

export function calculateFIRE({
  age = 30,
  monthlyIncome = 0,
  monthlyExpenses = 0,
  currentSavings = 0,
  monthlyInvestment,
  annualReturn = 10,
  retirementAge = 60,
} = {}) {
  const expenses = Math.max(0, number(monthlyExpenses));
  const income = Math.max(0, number(monthlyIncome));
  const savings = Math.max(0, number(currentSavings));
  const corpusNeeded = expenses * MONTHS_PER_YEAR * 25;
  const availableInvestment =
    monthlyInvestment === undefined
      ? Math.max(0, income - expenses)
      : Math.max(0, number(monthlyInvestment));
  const yearsToRetirement = Math.max(
    0,
    number(retirementAge, 60) - number(age, 30),
  );
  const projection = calculateSIP({
    monthlyInvestment: availableInvestment,
    currentSavings: savings,
    annualReturn,
    years: yearsToRetirement,
  });
  const requiredMonthlyInvestment = calculateSIP({
    currentSavings: savings,
    annualReturn,
    years: yearsToRetirement,
    targetAmount: corpusNeeded,
  }).requiredMonthlyInvestment;
  const savingsRate = calculateSavings(income, expenses).savingsRate;

  return {
    corpusNeeded,
    projectedCorpus: projection.projectedCorpus,
    requiredMonthlyInvestment,
    monthlyInvestment: availableInvestment,
    shortfall: Math.max(0, corpusNeeded - projection.projectedCorpus),
    surplus: Math.max(0, projection.projectedCorpus - corpusNeeded),
    fireAge: number(age, 30) + yearsToRetirement,
    savingsRate,
  };
}

export function calculateGoal({
  targetAmount = 0,
  currentAmount = 0,
  targetDate,
  annualReturn = 8,
} = {}) {
  const target = Math.max(0, number(targetAmount));
  const current = Math.max(0, number(currentAmount));
  const remaining = Math.max(0, target - current);
  const months = targetDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(targetDate).getTime() - Date.now()) /
            (30.4375 * 24 * 60 * 60 * 1000),
        ),
      )
    : 0;
  const plan = calculateSIP({
    currentSavings: current,
    annualReturn,
    years: months / MONTHS_PER_YEAR,
    targetAmount: target,
  });
  return {
    progress: target > 0 ? Math.min(100, (current / target) * 100) : 0,
    remaining,
    months,
    requiredMonthlyContribution: plan.requiredMonthlyInvestment,
    projectedCompletion:
      months > 0 && plan.requiredMonthlyInvestment > 0 ? targetDate : null,
    shortfall: Math.max(0, remaining - plan.requiredMonthlyInvestment * months),
  };
}

export function calculateNetWorth(assets = [], liabilities = []) {
  const totalAssets = assets.reduce(
    (sum, item) => sum + Math.max(0, number(item.amount)),
    0,
  );
  const totalLiabilities = liabilities.reduce(
    (sum, item) => sum + Math.max(0, number(item.amount)),
    0,
  );
  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
  };
}

export function calculateHealthScore(
  finance = {},
  netWorth = { netWorth: 0 },
  goals = [],
) {
  const savings = calculateSavings(
    finance.monthly_income,
    finance.monthly_expenses,
  );
  const emergency = calculateEmergencyFund(finance.monthly_expenses);
  const emergencyScore = finance.has_emergency_fund
    ? 85
    : Math.min(
        100,
        (number(finance.existing_savings) / emergency.recommended) * 100,
      );
  const breakdown = {
    emergency_fund: Math.round(Math.max(0, emergencyScore || 0)),
    insurance: finance.has_insurance ? 85 : 35,
    investments: netWorth.totalAssets > 0 ? 70 : 20,
    debt_health: netWorth.totalAssets >= netWorth.totalLiabilities ? 80 : 35,
    tax_efficiency: 60,
    retirement_readiness: Math.min(100, Math.max(20, savings.savingsRate * 2)),
  };
  const overallScore = Math.round(
    Object.values(breakdown).reduce((sum, value) => sum + value, 0) /
      Object.keys(breakdown).length,
  );
  const grade =
    overallScore >= 80
      ? "A"
      : overallScore >= 65
        ? "B"
        : overallScore >= 50
          ? "C"
          : "D";
  return {
    overall_score: overallScore,
    grade,
    breakdown,
    summary: goals.length
      ? "Your score reflects your cash flow, protection, balance sheet, and active goals."
      : "Add a goal and investment details for a more complete health assessment.",
    top_3_actions: [
      emergencyScore < 70
        ? "Build a 3-6 month emergency fund."
        : "Keep your emergency fund liquid and reviewed annually.",
      savings.savingsRate < 20
        ? "Aim to increase your monthly savings rate above 20%."
        : "Keep increasing investments as your income grows.",
      netWorth.totalLiabilities > netWorth.totalAssets
        ? "Prioritize high-cost debt before increasing risk exposure."
        : "Review your investment allocation and tax-saving options annually.",
    ],
  };
}
