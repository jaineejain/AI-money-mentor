import { useMemo, useState } from "react";

const GOAL_OPTIONS = [
  { value: "buy-house", label: "Buy a House", icon: "🏠" },
  { value: "retire-early", label: "Retire Early", icon: "🌴" },
  { value: "child-education", label: "Child's Education", icon: "🎓" },
  { value: "wealth-creation", label: "Wealth Creation", icon: "💎" },
];

function OnboardingForm({ onSubmit, initialValues }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    ...initialValues,
    goal: initialValues.goal || "wealth-creation",
  });

  const progress = useMemo(() => (step / 3) * 100, [step]);

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
    <section className="mx-auto max-w-5xl rounded-[2rem] border border-white/70 bg-white p-5 shadow-soft sm:p-8 lg:p-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-brand">
            Onboarding
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Build your Indian money plan in 3 steps
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Share your basics, current financial status, and a goal. We’ll shape
            a cleaner, more actionable plan.
          </p>
        </div>
        <div className="rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-brand">
          Step {step}/3
        </div>
      </div>

      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between text-sm font-medium text-slate-500">
          <span>Progress</span>
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
          <div className="grid gap-5 md:grid-cols-3">
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
            <label className="label md:col-span-1">
              Monthly Income in ₹
              <input
                className="input"
                name="monthly_income"
                type="number"
                value={form.monthly_income}
                onChange={handleChange}
              />
            </label>
            <label className="label md:col-span-1">
              Monthly Expenses in ₹
              <input
                className="input"
                name="monthly_expenses"
                type="number"
                value={form.monthly_expenses}
                onChange={handleChange}
              />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-5 md:grid-cols-2">
            <label className="label md:col-span-2">
              Existing Savings in ₹
              <input
                className="input"
                name="existing_savings"
                type="number"
                value={form.existing_savings}
                onChange={handleChange}
              />
            </label>

            <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-gray-50 px-5 py-5 text-slate-700 transition hover:border-green-200">
              <span className="font-medium">Do you have term insurance?</span>
              <input
                name="has_insurance"
                type="checkbox"
                checked={form.has_insurance}
                onChange={handleChange}
                className="h-5 w-5 rounded border-slate-300 text-brand focus:ring-brand"
              />
            </label>

            <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-gray-50 px-5 py-5 text-slate-700 transition hover:border-green-200">
              <span className="font-medium">
                Do you have 3-month emergency fund?
              </span>
              <input
                name="has_emergency_fund"
                type="checkbox"
                checked={form.has_emergency_fund}
                onChange={handleChange}
                className="h-5 w-5 rounded border-slate-300 text-brand focus:ring-brand"
              />
            </label>
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-brand">
              Your Goal
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {GOAL_OPTIONS.map((goalOption) => {
                const isSelected = form.goal === goalOption.value;

                return (
                  <button
                    key={goalOption.value}
                    type="button"
                    onClick={() => handleGoalSelect(goalOption.value)}
                    className={`rounded-2xl border p-5 text-left transition-all duration-200 ${
                      isSelected
                        ? "border-brand bg-green-50 shadow-soft"
                        : "border-slate-200 bg-gray-50 hover:border-green-200 hover:bg-white"
                    }`}
                  >
                    <div className="text-3xl">{goalOption.icon}</div>
                    <div className="mt-4 text-lg font-semibold text-slate-900">
                      {goalOption.label}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {goalOption.value === "buy-house" &&
                        "Plan for down payment, home loan, and stability."}
                      {goalOption.value === "retire-early" &&
                        "Focus on long-term compounding and income gap."}
                      {goalOption.value === "child-education" &&
                        "Create a future fund for tuition and related costs."}
                      {goalOption.value === "wealth-creation" &&
                        "Build assets with a disciplined SIP-led approach."}
                    </div>
                  </button>
                );
              })}
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
              >
                Next
              </button>
            ) : (
              <button type="submit" className="button-primary">
                Get My Financial Plan 🚀
              </button>
            )}
          </div>
        </div>
      </form>
    </section>
  );
}

export default OnboardingForm;
