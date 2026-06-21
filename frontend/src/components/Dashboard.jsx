import { useMemo, useState } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { sendChatMessage } from "../api";

const SCORE_CARDS = [
  { key: "emergency_fund", label: "Emergency Fund", icon: "🛟" },
  { key: "insurance", label: "Insurance", icon: "🛡️" },
  { key: "investments", label: "Investments", icon: "📈" },
  { key: "debt_health", label: "Debt Health", icon: "🧾" },
  { key: "tax_efficiency", label: "Tax Efficiency", icon: "🧮" },
  { key: "retirement_readiness", label: "Retirement Readiness", icon: "🏖️" },
];

const ALLOCATION_COLORS = ["#16a34a", "#334155", "#d4a017", "#94a3b8"];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatIndianAmount(value) {
  if (value >= 10000000) {
    return `${(value / 10000000).toFixed(1)} Crore`;
  }

  if (value >= 100000) {
    return `${(value / 100000).toFixed(1)} Lakh`;
  }

  return formatCurrency(value);
}

function getScoreTone(score) {
  if (score > 70)
    return { ring: "#16a34a", text: "text-brand", bg: "bg-green-50" };
  if (score >= 50)
    return { ring: "#eab308", text: "text-amber-500", bg: "bg-amber-50" };
  return { ring: "#ef4444", text: "text-red-500", bg: "bg-red-50" };
}

function formatChatTime(timestamp) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function Dashboard({ scoreData, firePlan, onEdit }) {
  const scoreTone = getScoreTone(scoreData.overall_score);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      role: "assistant",
      text: "Ask me anything about SIPs, tax saving, emergency funds, or your FIRE roadmap.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [isSending, setIsSending] = useState(false);

  const allocationData = useMemo(
    () => [
      { name: "Equity MF", value: firePlan.asset_allocation.equity_mf },
      { name: "Debt", value: firePlan.asset_allocation.debt },
      { name: "Gold", value: firePlan.asset_allocation.gold },
      { name: "Emergency", value: firePlan.asset_allocation.emergency },
    ],
    [firePlan],
  );

  const handleChatSubmit = async (event) => {
    event.preventDefault();
    const question = chatInput.trim();
    if (!question || isSending) return;

    setChatHistory((current) => [
      ...current,
      { role: "user", text: question, timestamp: new Date().toISOString() },
    ]);
    setChatInput("");
    setIsSending(true);

    try {
      const data = await sendChatMessage(question, {
        overall_score: scoreData.overall_score,
        grade: scoreData.grade,
        corpus_needed: firePlan.corpus_needed,
        monthly_sip_recommended: firePlan.monthly_sip_recommended,
        fire_age: firePlan.fire_age,
      });

      setChatHistory((current) => [
        ...current,
        {
          role: "assistant",
          text: data.reply,
          timestamp: data.timestamp || new Date().toISOString(),
        },
      ]);
    } catch {
      setChatHistory((current) => [
        ...current,
        {
          role: "assistant",
          text: "I could not reach the advisor right now. Please try again in a moment.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-soft">
        <div className="flex flex-col gap-6 bg-[linear-gradient(135deg,rgba(22,163,74,0.08),rgba(255,255,255,1))] p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand">
              Dashboard
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Your premium money snapshot
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              A clean, Groww-style view of your score, FIRE plan, allocation,
              and next best actions.
            </p>
          </div>
          <button
            className="button-secondary w-fit self-start"
            onClick={onEdit}
          >
            Edit details
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="card p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
                Hero Score
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Money Health Score
              </h2>
              <p className="mt-2 max-w-xl text-slate-600">
                Indian personal finance health at a glance.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div
                className="relative grid h-40 w-40 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(${scoreTone.ring} ${scoreData.overall_score}%, #e2e8f0 ${scoreData.overall_score}% 100%)`,
                }}
              >
                <div
                  className={`grid h-32 w-32 place-items-center rounded-full bg-white ${scoreTone.bg}`}
                >
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${scoreTone.text}`}>
                      {scoreData.overall_score}
                    </div>
                    <div className="text-sm text-slate-500">/ 100</div>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500">Grade</div>
                <div className={`mt-1 text-4xl font-bold ${scoreTone.text}`}>
                  {scoreData.grade}
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  {scoreData.summary}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
                FIRE Plan
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Your roadmap
              </h2>
            </div>
            <a
              className="button-primary"
              href="https://groww.in"
              target="_blank"
              rel="noreferrer"
            >
              Start SIP
            </a>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Target FIRE age</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {firePlan.fire_age}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Corpus needed</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {formatIndianAmount(firePlan.corpus_needed)}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm sm:col-span-2">
              <p className="text-sm text-slate-500">Monthly SIP recommended</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {formatCurrency(firePlan.monthly_sip_recommended)}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Route this into diversified mutual funds, and keep PPF/NPS in
                the tax-saving mix.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SCORE_CARDS.map((card) => {
          const value = scoreData.breakdown[card.key] ?? 0;
          const barColor =
            value > 70
              ? "bg-brand"
              : value >= 50
                ? "bg-amber-500"
                : "bg-red-500";

          return (
            <article key={card.key} className="card p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-green-50 text-lg">
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {card.label}
                    </h3>
                    <p className="text-sm text-slate-500">Score out of 100</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900">{value}</div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full ${barColor}`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </article>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <div className="card p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
                Asset Allocation
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Your investment mix
              </h2>
            </div>
            <div className="text-right text-sm text-slate-500">
              Indian rupee goals and long-term compounding
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr,0.9fr] lg:items-center">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={
                          ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {allocationData.map((item, index) => (
                <div
                  key={item.name}
                  className="rounded-2xl bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor:
                            ALLOCATION_COLORS[index % ALLOCATION_COLORS.length],
                        }}
                      />
                      <span className="font-medium text-slate-800">
                        {item.name}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-900">
                      {item.value}%
                    </span>
                  </div>
                </div>
              ))}
              <p className="text-sm text-slate-600">
                Balance equity mutual funds, debt, gold, and emergency liquidity
                for a resilient India-first portfolio.
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
            Top 3 Actions
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            What to do next
          </h2>
          <div className="mt-5 space-y-4">
            {scoreData.top_3_actions.map((action, index) => (
              <div key={action} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-green-50 font-bold text-brand">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Action {index + 1}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {action}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <div className="card p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
            Milestones
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            FIRE journey checkpoints
          </h2>
          <div className="mt-5 space-y-4">
            {firePlan.year_wise_milestones.map((milestone) => (
              <div
                key={`${milestone.year}-${milestone.action}`}
                className="rounded-2xl bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-brand">
                      Year {milestone.year}
                    </div>
                    <div className="mt-1 font-medium text-slate-900">
                      {milestone.action}
                    </div>
                  </div>
                  <div className="text-right text-sm text-slate-600">
                    <div>Target</div>
                    <div className="font-semibold text-slate-900">
                      {formatIndianAmount(milestone.target_amount)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
            AI Chat
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Ask a follow-up question
          </h2>
          <div className="mt-5 flex h-[32rem] flex-col rounded-[1.75rem] border border-slate-200 bg-[#eef7ee] p-4">
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {chatHistory.map((message, index) => (
                <div
                  key={`${message.role}-${index}-${message.timestamp}`}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${
                      message.role === "user"
                        ? "rounded-br-md bg-brand text-white"
                        : "rounded-bl-md bg-white text-slate-800"
                    }`}
                  >
                    <p>{message.text}</p>
                    <p
                      className={`mt-2 text-[11px] ${message.role === "user" ? "text-green-100" : "text-slate-400"}`}
                    >
                      {formatChatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start">
                  <div className="rounded-3xl rounded-bl-md bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleChatSubmit} className="mt-4 flex gap-3">
              <input
                className="input mt-0 flex-1 border-0 bg-white"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Ask about SIP, tax saving, or FIRE..."
              />
              <button type="submit" className="button-primary shrink-0">
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
