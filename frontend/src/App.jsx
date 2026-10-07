import { useEffect, useState } from "react";
import {
  getCurrentUser,
  getDashboard,
  getFinanceProfile,
  getFirePlan,
  getMoneyScore,
  logout,
  updateFinanceProfile,
} from "./api";
import AuthForm from "./components/AuthForm";
import FinanceWorkspace from "./components/FinanceWorkspace";
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
  const [authStatus, setAuthStatus] = useState("checking");
  const [currentUser, setCurrentUser] = useState(null);
  const [userFinance, setUserFinance] = useState(initialFormState);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  const loadWorkspace = async (profile) => {
    setUserFinance(profile);
    setView("loading");
    try {
      setDashboard(await getDashboard());
      setError("");
      setView("dashboard");
    } catch {
      setError(
        "Your profile loaded, but the financial workspace could not be refreshed.",
      );
      const [score, fire] = await Promise.all([
        getMoneyScore(profile),
        getFirePlan(profile),
      ]);
      setDashboard({
        finance: profile,
        transactions: [],
        budgets: [],
        goals: [],
        assets: [],
        liabilities: [],
        score,
        metrics: {
          savings: profile.monthly_income - profile.monthly_expenses,
          savingsRate: profile.monthly_income
            ? ((profile.monthly_income - profile.monthly_expenses) /
                profile.monthly_income) *
              100
            : 0,
          netWorth: profile.existing_savings,
          totalAssets: profile.existing_savings,
          totalLiabilities: 0,
          fireAge: fire.fire_age,
          corpusNeeded: fire.corpus_needed,
          projectedCorpus: fire.projected_corpus || 0,
          requiredMonthlyInvestment: fire.monthly_sip_recommended,
          shortfall: fire.shortfall || 0,
        },
      });
      setView("dashboard");
    }
  };

  const refresh = async () => {
    try {
      setDashboard(await getDashboard());
      setError("");
    } catch {
      setError("Could not refresh the latest financial data.");
    }
  };

  useEffect(() => {
    getCurrentUser()
      .then(async (user) => {
        setCurrentUser(user);
        setAuthStatus("authenticated");
        const profile = await getFinanceProfile();
        if (profile) await loadWorkspace(profile);
        else setView("onboarding");
      })
      .catch(() => setAuthStatus("signed-out"));
  }, []);

  const handleAuthenticated = async (user) => {
    setCurrentUser(user);
    setAuthStatus("authenticated");
    const profile = await getFinanceProfile();
    if (profile) await loadWorkspace(profile);
    else setView("onboarding");
  };

  const handleSubmit = async (values) => {
    setView("loading");
    try {
      await loadWorkspace(await updateFinanceProfile(values));
    } catch {
      setError(
        "We could not save your profile. Please check the backend and try again.",
      );
      setView("onboarding");
    }
  };

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    setDashboard(null);
    setAuthStatus("signed-out");
    setView("onboarding");
  };

  return (
    <>
      {authStatus === "checking" && <LoadingScreen />}
      {authStatus === "signed-out" && (
        <AuthForm onAuthenticated={handleAuthenticated} />
      )}
      {authStatus === "authenticated" && view === "onboarding" && (
        <OnboardingForm onSubmit={handleSubmit} initialValues={userFinance} />
      )}
      {authStatus === "authenticated" && view === "loading" && (
        <LoadingScreen />
      )}
      {authStatus === "authenticated" && view === "dashboard" && dashboard && (
        <>
          {error && (
            <div className="workspace-alert" role="alert">
              {error}
            </div>
          )}
          <FinanceWorkspace
            data={dashboard}
            onEdit={() => setView("onboarding")}
            onLogout={handleLogout}
            refresh={refresh}
          />
        </>
      )}
      {currentUser && (
        <span className="sr-only">Signed in as {currentUser.email}</span>
      )}
    </>
  );
}

export default App;
