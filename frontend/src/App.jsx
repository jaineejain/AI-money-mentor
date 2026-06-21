import { useEffect, useMemo, useState } from "react";
import Dashboard from "./components/Dashboard";
import LoadingScreen from "./components/LoadingScreen";
import OnboardingForm from "./components/OnboardingForm";

const initialFormState = {
  age: 30,
  monthly_income: 80000,
  monthly_expenses: 45000,
  existing_savings: 250000,
  has_insurance: true,
  has_emergency_fund: false,
  goal: "retirement",
};

function App() {
  const [view, setView] = useState("onboarding");
  const [userFinance, setUserFinance] = useState(initialFormState);

  useEffect(() => {
    if (view !== "loading") {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setView("dashboard");
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [view]);

  const tagline = useMemo(() => "Your AI Financial Advisor", []);

  const scoreData = useMemo(
    () => ({
      overall_score: userFinance.has_emergency_fund ? 78 : 64,
      grade: userFinance.has_emergency_fund ? "B" : "C",
      breakdown: {
        emergency_fund: userFinance.has_emergency_fund ? 88 : 45,
        insurance: userFinance.has_insurance ? 86 : 42,
        investments: 67,
        debt_health: 72,
        tax_efficiency: 74,
        retirement_readiness: 69,
      },
      summary:
        "You are in a decent spot, but a stronger emergency fund and more disciplined SIP investing will improve your long-term outlook.",
      top_3_actions: [
        "Build a 3-6 month emergency fund in a liquid savings bucket.",
        "Increase monthly SIPs into diversified mutual funds.",
        "Use 80C, NPS, and PPF strategically to reduce tax outgo.",
      ],
      fire_age: Math.max(userFinance.age + 18, 45),
    }),
    [userFinance],
  );

  const firePlan = useMemo(
    () => ({
      fire_age: Math.max(userFinance.age + 18, 45),
      corpus_needed: Math.round(userFinance.monthly_expenses * 300 * 12),
      monthly_sip_recommended: Math.round(
        Math.max(userFinance.monthly_income - userFinance.monthly_expenses, 0) *
          0.7,
      ),
      asset_allocation: {
        equity_mf: userFinance.age < 35 ? 65 : 55,
        debt: 20,
        gold: 10,
        emergency: 5,
      },
      year_wise_milestones: [
        {
          year: 1,
          action: "Create emergency corpus and start monthly SIPs.",
          target_amount: Math.round(userFinance.monthly_expenses * 6),
        },
        {
          year: 2,
          action: "Max out 80C and increase SIP step-up.",
          target_amount: Math.round(userFinance.existing_savings + 250000),
        },
        {
          year: 3,
          action: "Add NPS and rebalance asset allocation.",
          target_amount: Math.round(userFinance.existing_savings + 600000),
        },
        {
          year: 4,
          action: "Scale investments into diversified mutual funds.",
          target_amount: Math.round(userFinance.existing_savings + 1200000),
        },
        {
          year: 5,
          action: "Review FIRE progress and raise SIPs again.",
          target_amount: Math.round(userFinance.existing_savings + 2000000),
        },
      ],
      tax_saving_plan: {
        "80C_amount": 150000,
        NPS_amount: 50000,
        total_tax_saved: 45000,
      },
    }),
    [userFinance],
  );

  const handleSubmit = (values) => {
    setUserFinance(values);
    setView("loading");
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-green-100/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <div className="text-xl font-bold text-slate-900">
              💰 Money Mentor
            </div>
            <div className="text-sm text-slate-500">{tagline}</div>
          </div>
          <div className="hidden rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-brand sm:block">
            Indian personal finance, simplified
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {view === "onboarding" && (
          <OnboardingForm onSubmit={handleSubmit} initialValues={userFinance} />
        )}
        {view === "loading" && <LoadingScreen />}
        {view === "dashboard" && (
          <Dashboard
            scoreData={scoreData}
            firePlan={firePlan}
            onEdit={() => setView("onboarding")}
          />
        )}
      </main>
    </div>
  );
}

export default App;
