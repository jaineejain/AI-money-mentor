import {
  createAdviceReply,
  createChatReply,
  createFirePlan,
  createMoneyHealthScore,
} from "../services/aiService.js";
import {
  calculateFIRE,
  calculateHealthScore,
} from "../services/financialService.js";

export async function chatController(request, response) {
  response.json(
    await createChatReply(
      request.body.question,
      request.body.user_context || {},
    ),
  );
}

export async function adviceController(request, response) {
  response.json(
    await createAdviceReply(
      request.body.question,
      request.body.user_context || {},
    ),
  );
}

export async function scoreController(request, response) {
  response.json(calculateHealthScore(request.body));
}

export async function firePlanController(request, response) {
  const plan = calculateFIRE({
    age: request.body.age,
    monthlyIncome: request.body.monthly_income,
    monthlyExpenses: request.body.monthly_expenses,
    currentSavings: request.body.existing_savings,
  });
  response.json({
    fire_age: plan.fireAge,
    corpus_needed: Math.round(plan.corpusNeeded),
    projected_corpus: Math.round(plan.projectedCorpus),
    monthly_sip_recommended: Math.round(plan.requiredMonthlyInvestment),
    shortfall: Math.round(plan.shortfall),
    surplus: Math.round(plan.surplus),
    asset_allocation: { equity_mf: 60, debt: 25, gold: 10, emergency: 5 },
    year_wise_milestones: [],
    tax_saving_plan: { "80C_amount": 0, NPS_amount: 0, total_tax_saved: 0 },
  });
}
