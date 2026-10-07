import { useMemo, useState } from "react";

const GOAL_OPTIONS = [
  {
    value: "buy-house",
    label: "Buy a home",
    detail: "Build a down payment with a clear horizon.",
  },
  {
    value: "retire-early",
    label: "Retire early",
    detail: "Create optionality through long-term investing.",
  },
  {
    value: "child-education",
    label: "Fund education",
    detail: "Make a future education cost feel manageable.",
  },
  {
    value: "wealth-creation",
    label: "Build wealth",
    detail: "Grow a resilient, diversified financial base.",
  },
];

const STEPS = ["Your direction", "Monthly reality", "Your safety net"];

function OnboardingForm({ onSubmit, initialValues }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    ...initialValues,
    goal: initialValues.goal || "wealth-creation",
  });

  const progress = useMemo(() => (step / 3) * 100, [step]);
  const canContinue =
    step === 1
      ? form.goal && form.age >= 18
      : step === 2
        ? form.monthly_income >= 0 &&
          form.monthly_expenses >= 0 &&
          form.monthly_income >= form.monthly_expenses
        : form.existing_savings >= 0;

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox" ? checked : name === "goal" ? value : Number(value),
    }));
  };

  const handleGoalSelect = (goal) => {
    setForm((current) => ({ ...current, goal }));
  };

  const handleNext = () => setStep((current) => Math.min(current + 1, 3));
  const handleBack = () => setStep((current) => Math.max(current - 1, 1));

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <main className="onboarding-shell">
      <section className="onboarding-aside">
        <div className="auth-brand">
          <span>AM</span>
          <strong>AI Money Mentor</strong>
        </div>
        <p className="auth-kicker">A thoughtful starting point</p>
        <h1>Let your numbers tell the story.</h1>
        <p>
          Answer a few focused questions. Your dashboard will turn them into a
          transparent financial plan.
        </p>
        <div className="onboarding-note">
          <span>◌</span>
          <div>
            <strong>Your data stays yours</strong>
            <small>We use your inputs to personalize your workspace.</small>
          </div>
        </div>
      </section>
      <section className="onboarding-panel">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-brand">
              Onboarding
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Build your financial baseline
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Share your basics, current financial status, and a goal. We’ll
              shape a cleaner, more actionable plan.
            </p>
          </div>
          <div className="onboarding-step-count">0{step} / 03</div>
        </div>

        <div className="mb-8">
          <div className="onboarding-step-labels">
            {STEPS.map((label, index) => (
              <span
                className={index + 1 <= step ? "is-active" : ""}
                key={label}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="mb-3 flex items-center justify-between text-sm font-medium text-slate-500">
            <span>Profile progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-brand transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {step === 1 && (
            <div className="onboarding-step-content">
              <div className="step-intro">
                <span className="step-number">01</span>
                <div>
                  <h2>What are you working toward?</h2>
                  <p>This shapes the recommendations you see first.</p>
                </div>
              </div>
              <div className="goal-grid">
                {GOAL_OPTIONS.map((goalOption) => {
                  const isSelected = form.goal === goalOption.value;
                  return (
                    <button
                      key={goalOption.value}
                      type="button"
                      onClick={() => handleGoalSelect(goalOption.value)}
                      className={`goal-choice ${isSelected ? "is-selected" : ""}`}
                    >
                      <span className="goal-choice-index">
                        0{GOAL_OPTIONS.indexOf(goalOption) + 1}
                      </span>
                      <strong>{goalOption.label}</strong>
                      <small>{goalOption.detail}</small>
                    </button>
                  );
                })}
              </div>
              <div className="profile-input-row">
                <label className="label md:col-span-1">
                  Age
                  <input
                    className="input"
                    name="age"
                    type="number"
                    value={form.age}
                    onChange={handleChange}
                  />
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="onboarding-step-content">
              <div className="step-intro">
                <span className="step-number">02</span>
                <div>
                  <h2>What does a normal month look like?</h2>
                  <p>Use approximate numbers. You can refine them later.</p>
                </div>
              </div>
              <div className="profile-input-row two-up">
                <label className="label">
                  Monthly income in ₹
                  <input
                    className="input"
                    name="monthly_income"
                    type="number"
                    min="0"
                    value={form.monthly_income}
                    onChange={handleChange}
                  />
                </label>
                <label className="label">
                  Monthly expenses in ₹
                  <input
                    className="input"
                    name="monthly_expenses"
                    type="number"
                    min="0"
                    value={form.monthly_expenses}
                    onChange={handleChange}
                  />
                </label>
              </div>
              {form.monthly_income < form.monthly_expenses && (
                <p className="auth-error" role="alert">
                  Expenses cannot be higher than income for this baseline. You
                  can still update transactions later.
                </p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="onboarding-step-content">
              <div className="step-intro">
                <span className="step-number">03</span>
                <div>
                  <h2>How resilient is your foundation?</h2>
                  <p>
                    These answers help prioritize protection before projections.
                  </p>
                </div>
              </div>
              <div className="toggle-stack">
                <label className="label">
                  Existing savings in ₹
                  <input
                    className="input"
                    name="existing_savings"
                    type="number"
                    min="0"
                    value={form.existing_savings}
                    onChange={handleChange}
                  />
                </label>
                <label className="toggle-card">
                  <span>
                    <strong>Insurance cover</strong>
                    <small>
                      Do you currently have term or health insurance?
                    </small>
                  </span>
                  <input
                    name="has_insurance"
                    type="checkbox"
                    checked={form.has_insurance}
                    onChange={handleChange}
                  />
                </label>
                <label className="toggle-card">
                  <span>
                    <strong>Emergency fund</strong>
                    <small>
                      Do you have at least three months of expenses set aside?
                    </small>
                  </span>
                  <input
                    name="has_emergency_fund"
                    type="checkbox"
                    checked={form.has_emergency_fund}
                    onChange={handleChange}
                  />
                </label>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1}
              className="button-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>

            <div className="flex flex-wrap gap-3">
              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="button-primary"
                  disabled={!canContinue}
                >
                  Next
                </button>
              ) : (
                <button type="submit" className="button-primary">
                  Analyze my financial profile
                </button>
              )}
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}

export default OnboardingForm;
