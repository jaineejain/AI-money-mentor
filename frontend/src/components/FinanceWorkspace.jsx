import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  createGoal,
  createHolding,
  createTransaction,
  deleteGoal,
  sendChatMessage,
} from "../api";

const NAVIGATION = [
  ["dashboard", "Overview"],
  ["advisor", "AI Advisor"],
  ["health", "Financial Health"],
  ["budget", "Budget Planner"],
  ["goals", "Goals"],
  ["investments", "Investments"],
  ["fire", "FIRE Planner"],
  ["tax", "Tax Planner"],
  ["simulator", "What-If Simulator"],
  ["networth", "Net Worth"],
  ["reports", "Reports"],
  ["settings", "Settings"],
];
const COLORS = ["#22c55e", "#0f766e", "#f59e0b", "#334155", "#ef4444"];

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
const compactMoney = (value) => {
  const amount = Number(value) || 0;
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)} L`;
  return money(amount);
};
const timeGreeting = () => {
  const hour = new Date().getHours();
  return hour < 12
    ? "Good morning"
    : hour < 18
      ? "Good afternoon"
      : "Good evening";
};

function Card({ children, className = "" }) {
  return (
    <section className={`workspace-card ${className}`}>{children}</section>
  );
}
function Header({ eyebrow, title, description, action }) {
  return (
    <div className="workspace-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="header-description">{description}</p>}
      </div>
      {action}
    </div>
  );
}
function Metric({ label, value, detail, tone = "green" }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong className={`metric-${tone}`}>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}
function EmptyState({ title, text }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

function InsightCard({ data, setView }) {
  const action =
    data.score.top_3_actions?.[0] ||
    "Review your latest financial numbers and keep your plan current.";
  return (
    <Card className="insight-card">
      <div className="insight-icon">✦</div>
      <div>
        <p className="eyebrow">AI insight</p>
        <h2>{action}</h2>
        <p>
          Based on your current profile, this is the highest-leverage next step
          in your plan.
        </p>
      </div>
      <button className="button-secondary" onClick={() => setView("advisor")}>
        Ask Advisor
      </button>
    </Card>
  );
}

function ContextInsight({ title, body, setView }) {
  return (
    <div className="context-insight">
      <div className="insight-icon">✦</div>
      <div>
        <p className="eyebrow">AI perspective</p>
        <strong>{title}</strong>
        <p>{body}</p>
      </div>
      <button className="text-button" onClick={() => setView("advisor")}>
        Ask AI
      </button>
    </div>
  );
}

function FinancialJourney({ data }) {
  const milestones = [
    [
      "Profile completed",
      Boolean(data.finance?.age && data.finance?.monthly_income >= 0),
    ],
    ["Emergency fund", Boolean(data.finance?.has_emergency_fund)],
    ["Insurance cover", Boolean(data.finance?.has_insurance)],
    ["Investment started", data.assets?.length > 0],
    ["First financial goal", data.goals?.length > 0],
    ["FIRE target defined", Boolean(data.metrics?.corpusNeeded)],
  ];
  return (
    <Card className="journey-card">
      <div className="card-heading">
        <div>
          <p className="eyebrow">Your journey</p>
          <h2>Progress worth noticing</h2>
        </div>
        <span className="muted">
          {milestones.filter(([, complete]) => complete).length}/
          {milestones.length} complete
        </span>
      </div>
      <div className="journey-track">
        {milestones.map(([label, complete], index) => (
          <div
            className={`journey-step ${complete ? "is-complete" : ""}`}
            key={label}
          >
            <span>{complete ? "✓" : String(index + 1).padStart(2, "0")}</span>
            <strong>{label}</strong>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Overview({ data, setView }) {
  const { finance, metrics, score, goals, assets } = data;
  const trend = [
    {
      name: "Now",
      expenses: finance.monthly_expenses,
    },
    { name: "Surplus", income: Math.max(metrics.savings, 0), expenses: 0 },
  ];
  const allocation = assets.length
    ? assets.map((asset) => ({ name: asset.category, value: asset.amount }))
    : [{ name: "No holdings", value: 1 }];
  const history = [...(data.snapshots || [])].reverse();
  return (
    <>
      <Header
        eyebrow="Personal command centre"
        title={`${timeGreeting()} 👋`}
        description="Here's what your AI Financial Advisor thinks about your finances today."
        action={
          <button className="button-primary" onClick={() => setView("advisor")}>
            Ask your advisor
          </button>
        }
      />
      <div className="metric-grid">
        <Metric
          label="Health score"
          value={`${score.overall_score}/100`}
          detail={`Grade ${score.grade}`}
        />
        <Metric
          label="Monthly surplus"
          value={compactMoney(metrics.savings)}
          detail={`${metrics.savingsRate.toFixed(1)}% savings rate`}
        />
        <Metric
          label="Net worth"
          value={compactMoney(metrics.netWorth)}
          detail={`${compactMoney(metrics.totalAssets)} assets`}
        />
        <Metric
          label="FIRE age"
          value={metrics.fireAge || "-"}
          detail={`Corpus ${compactMoney(metrics.corpusNeeded)}`}
        />
      </div>
      <InsightCard data={data} setView={setView} />
      <div className="dashboard-grid">
        <Card>
          <div className="card-heading">
            <div>
              <p className="eyebrow">Cash flow</p>
              <h2>Income vs expenses</h2>
            </div>
            <span className="muted">Monthly</span>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip formatter={(value) => money(value)} />
                <Bar dataKey="income" fill="#16a34a" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <div className="card-heading">
            <div>
              <p className="eyebrow">Allocation</p>
              <h2>What you own</h2>
            </div>
            <span className="muted">Assets</span>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocation}
                  dataKey="value"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {allocation.map((item, index) => (
                    <Cell
                      key={item.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => money(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <div className="dashboard-grid">
        <Card>
          <div className="card-heading">
            <div>
              <p className="eyebrow">Next actions</p>
              <h2>Small moves, compounding impact</h2>
            </div>
          </div>
          <div className="action-list">
            {score.top_3_actions.map((action, index) => (
              <div className="action-item" key={action}>
                <b>{String(index + 1).padStart(2, "0")}</b>
                <span>{action}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="card-heading">
            <div>
              <p className="eyebrow">Goals</p>
              <h2>Progress at a glance</h2>
            </div>
            <button className="text-button" onClick={() => setView("goals")}>
              Manage
            </button>
          </div>
          {goals.length ? (
            goals.slice(0, 3).map((goal) => (
              <div className="progress-row" key={goal._id}>
                <div>
                  <strong>{goal.name}</strong>
                  <span>
                    {money(goal.currentAmount)} of {money(goal.targetAmount)}
                  </span>
                </div>
                <div className="progress-track">
                  <i
                    style={{
                      width: `${Math.min(100, goal.calculation?.progress || 0)}%`,
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No goals yet"
              text="Create a goal to turn an intention into a monthly plan."
            />
          )}
        </Card>
      </div>
      <Card>
        <div className="card-heading">
          <div>
            <p className="eyebrow">History</p>
            <h2>Financial progress</h2>
          </div>
          <span className="muted">Saved snapshots</span>
        </div>
        {history.length > 1 ? (
          <div className="dashboard-grid">
            <div className="chart tall">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="snapshotDate"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString([], { month: "short" })
                    }
                  />
                  <YAxis
                    tickFormatter={(value) => `${Math.round(value / 100000)}L`}
                  />
                  <Tooltip formatter={(value) => money(value)} />
                  <Area
                    type="monotone"
                    dataKey="netWorth"
                    name="Net worth"
                    stroke="#0f766e"
                    fill="#ccfbf1"
                  />
                  <Area
                    type="monotone"
                    dataKey="savings"
                    name="Savings"
                    stroke="#16a34a"
                    fill="#dcfce7"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="chart tall">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="snapshotDate"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString([], { month: "short" })
                    }
                  />
                  <YAxis yAxisId="score" domain={[0, 100]} />
                  <YAxis
                    yAxisId="money"
                    orientation="right"
                    tickFormatter={(value) => `${Math.round(value / 100000)}L`}
                  />
                  <Tooltip
                    formatter={(value, name) =>
                      name === "Health score" ? value : money(value)
                    }
                  />
                  <Line
                    yAxisId="score"
                    type="monotone"
                    dataKey="healthScore"
                    name="Health score"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={false}
                  />
                  <Line
                    yAxisId="money"
                    type="monotone"
                    dataKey="investments"
                    name="Investments"
                    stroke="#0f766e"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="money"
                    type="monotone"
                    dataKey="expenses"
                    name="Expenses"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <EmptyState
            title="History is just getting started"
            text="We will add one snapshot per day when your dashboard is loaded. Return after your next update to see a trend."
          />
        )}
      </Card>
      <FinancialJourney data={data} />
    </>
  );
}

function Advisor({ data }) {
  const suggestedQuestions = [
    "Can I retire early?",
    "How much should I invest?",
    "Am I overspending?",
    "Analyze my financial health",
    "Help me reach my goal",
    "How can I improve my savings?",
  ];
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "I can explain your cash flow, FIRE plan, goals, tax options, and investment allocation.",
      sources: [],
      timestamp: new Date().toISOString(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const ask = async (event) => {
    event.preventDefault();
    if (!question.trim() || loading) return;
    const text = question.trim();
    setQuestion("");
    setMessages((items) => [
      ...items,
      { role: "user", text, timestamp: new Date().toISOString() },
    ]);
    setLoading(true);
    try {
      const result = await sendChatMessage(text, {
        ...data.finance,
        ...data.metrics,
        score: data.score,
      });
      setMessages((items) => [
        ...items,
        {
          role: "assistant",
          text: result.reply,
          sources: result.sources || [],
          timestamp: result.timestamp || new Date().toISOString(),
          metrics: result.metrics,
        },
      ]);
    } catch {
      setMessages((items) => [
        ...items,
        {
          role: "assistant",
          text: "The advisor is unavailable. Your deterministic dashboard calculations are still available.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };
  const submitSuggestedQuestion = (prompt) => {
    setQuestion(prompt);
  };
  return (
    <>
      <Header
        eyebrow="AI financial advisor"
        title="Ask better money questions"
        description="Your financial context is supplied to the advisor; calculations remain deterministic."
      />
      <div className="advisor-status">
        <span className="status-dot" />
        Advisor online{" "}
        <small>Uses your saved profile and trusted financial sources</small>
      </div>
      <Card className="advisor-card">
        <div className="advisor-welcome">
          <div className="advisor-avatar">AM</div>
          <div>
            <strong>Your financial co-pilot</strong>
            <p>Start with a question or choose a direction below.</p>
          </div>
        </div>
        <div className="suggested-prompts">
          {suggestedQuestions.map((prompt) => (
            <button
              type="button"
              key={prompt}
              onClick={() => submitSuggestedQuestion(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
        <div className="chat-window">
          {messages.map((message, index) => (
            <div
              className={`chat-message ${message.role}`}
              key={`${message.role}-${index}`}
            >
              <>
                {message.text}
                {message.timestamp && (
                  <time className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                )}
                {message.metrics && (
                  <div className="structured-result">
                    <span>Projection</span>
                    <strong>
                      {compactMoney(message.metrics.projected_corpus)}
                    </strong>
                    <small>
                      Estimated corpus from your current assumptions
                    </small>
                  </div>
                )}
                {message.sources?.length ? (
                  <div className="source-list">
                    <strong>Sources</strong>
                    {message.sources.map((source) => (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        key={source.url}
                      >
                        {source.source}: {source.title}
                      </a>
                    ))}
                  </div>
                ) : null}
              </>
            </div>
          ))}
          {loading && (
            <div className="chat-message assistant">
              <span className="typing-dots">
                <i /> <i /> <i />
              </span>{" "}
              Thinking through your numbers...
            </div>
          )}
        </div>
        <form className="chat-form" onSubmit={ask}>
          <input
            className="input"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="e.g. How can I reach FIRE sooner?"
            maxLength={1000}
          />
          <button
            className="button-primary"
            disabled={loading || !question.trim()}
          >
            Ask AI
          </button>
        </form>
      </Card>
    </>
  );
}

function Health({ data, setView }) {
  return (
    <>
      <Header
        eyebrow="Financial health"
        title={`${data.score.overall_score}/100, grade ${data.score.grade}`}
        description={data.score.summary}
      />
      <ContextInsight
        title="Start with the biggest lever"
        body={
          data.score.top_3_actions?.[0] ||
          "Review your health breakdown to choose the next action."
        }
        setView={setView}
      />
      <div className="health-grid">
        {Object.entries(data.score.breakdown).map(([key, value]) => (
          <Card key={key}>
            <p className="eyebrow">{key.replaceAll("_", " ")}</p>
            <strong className="health-value">{value}</strong>
            <div className="progress-track">
              <i style={{ width: `${value}%` }} />
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <h2>Recommended actions</h2>
        <div className="action-list">
          {data.score.top_3_actions.map((action) => (
            <div className="action-item" key={action}>
              <b>+</b>
              <span>{action}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function Goals({ data, refresh, setView }) {
  const [form, setForm] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "0",
    targetDate: "",
    priority: "medium",
    expectedReturn: "8",
  });
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createGoal({
        ...form,
        targetAmount: Number(form.targetAmount),
        currentAmount: Number(form.currentAmount),
        expectedReturn: Number(form.expectedReturn),
      });
      setForm({
        name: "",
        targetAmount: "",
        currentAmount: "0",
        targetDate: "",
        priority: "medium",
        expectedReturn: "8",
      });
      await refresh();
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <Header
        eyebrow="Goal planner"
        title="Give every rupee a job"
        description="Track progress, required contributions, and shortfalls against a real date."
      />
      <ContextInsight
        title={
          data.goals.length
            ? "Your goals have a plan"
            : "Your first goal creates momentum"
        }
        body={
          data.goals.length
            ? `${money(data.goals[0].calculation?.requiredMonthlyContribution || 0)} is the current monthly contribution estimate for ${data.goals[0].name}.`
            : "Create a dated goal and the planner will calculate the contribution needed."
        }
        setView={setView}
      />
      <div className="two-column">
        <Card>
          <h2>Create a goal</h2>
          <form className="stack-form" onSubmit={submit}>
            {[
              ["name", "Goal name", "text"],
              ["targetAmount", "Target amount", "number"],
              ["currentAmount", "Already saved", "number"],
              ["targetDate", "Target date", "date"],
              ["expectedReturn", "Expected return %", "number"],
            ].map(([key, label, type]) => (
              <label key={key}>
                {label}
                <input
                  className="input"
                  required={key !== "currentAmount"}
                  type={type}
                  value={form[key]}
                  onChange={(event) =>
                    setForm({ ...form, [key]: event.target.value })
                  }
                />
              </label>
            ))}
            <label>
              Priority
              <select
                className="input"
                value={form.priority}
                onChange={(event) =>
                  setForm({ ...form, priority: event.target.value })
                }
              >
                <option>low</option>
                <option>medium</option>
                <option>high</option>
              </select>
            </label>
            <button className="button-primary" disabled={saving}>
              {saving ? "Saving..." : "Add goal"}
            </button>
          </form>
        </Card>
        <div className="stack-list">
          {data.goals.length ? (
            data.goals.map((goal) => (
              <Card key={goal._id}>
                <div className="card-heading">
                  <div>
                    <h2>{goal.name}</h2>
                    <span className="muted">
                      Due {new Date(goal.targetDate).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    className="icon-button"
                    onClick={async () => {
                      await deleteGoal(goal._id);
                      refresh();
                    }}
                    aria-label={`Delete ${goal.name}`}
                  >
                    x
                  </button>
                </div>
                <div className="goal-number">
                  {Math.round(goal.calculation?.progress || 0)}%
                </div>
                <div className="progress-track">
                  <i
                    style={{
                      width: `${Math.min(100, goal.calculation?.progress || 0)}%`,
                    }}
                  />
                </div>
                <p className="muted">
                  {money(goal.calculation?.requiredMonthlyContribution)} monthly
                  contribution needed
                </p>
              </Card>
            ))
          ) : (
            <EmptyState
              title="No goals yet"
              text="Your first goal can be a home, education fund, or a debt payoff target."
            />
          )}
        </div>
      </div>
    </>
  );
}

function Budget({ data, refresh, setView }) {
  const [form, setForm] = useState({
    amount: "",
    category: "Food",
    description: "",
  });
  const expenses = data.transactions.filter((item) => item.type === "expense");
  const categories = Object.entries(
    expenses.reduce(
      (result, item) => ({
        ...result,
        [item.category]: (result[item.category] || 0) + item.amount,
      }),
      {},
    ),
  );
  const submit = async (event) => {
    event.preventDefault();
    await createTransaction({
      type: "expense",
      amount: Number(form.amount),
      category: form.category,
      description: form.description,
    });
    setForm({ amount: "", category: "Food", description: "" });
    refresh();
  };
  return (
    <>
      <Header
        eyebrow="Budget planner"
        title="See where your spending goes"
        description="Record expenses and compare categories using your own transactions."
      />
      <ContextInsight
        title="Turn spending into a decision"
        body={
          data.transactions.length
            ? `You have ${expenses.length} recorded expense${expenses.length === 1 ? "" : "s"}. Ask the advisor where your current spending has the most flexibility.`
            : "Add a few expenses to unlock a grounded spending insight."
        }
        setView={setView}
      />
      <div className="two-column">
        <Card>
          <h2>Record an expense</h2>
          <form className="stack-form" onSubmit={submit}>
            <label>
              Amount
              <input
                className="input"
                required
                type="number"
                min="1"
                value={form.amount}
                onChange={(event) =>
                  setForm({ ...form, amount: event.target.value })
                }
              />
            </label>
            <label>
              Category
              <select
                className="input"
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
              >
                {[
                  "Rent",
                  "Food",
                  "Transport",
                  "Utilities",
                  "Shopping",
                  "Entertainment",
                  "Education",
                  "Healthcare",
                  "Other",
                ].map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label>
              Note
              <input
                className="input"
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
              />
            </label>
            <button className="button-primary">Add expense</button>
          </form>
        </Card>
        <Card>
          <h2>Category breakdown</h2>
          {categories.length ? (
            categories.map(([category, amount]) => (
              <div className="progress-row" key={category}>
                <div>
                  <strong>{category}</strong>
                  <span>{money(amount)}</span>
                </div>
                <div className="progress-track">
                  <i
                    style={{
                      width: `${Math.min(100, (amount / Math.max(...categories.map((item) => item[1]))) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No expenses recorded"
              text="Add your first expense to start seeing spending intelligence."
            />
          )}
        </Card>
      </div>
    </>
  );
}

function Fire({ data, setView }) {
  return (
    <>
      <Header
        eyebrow="FIRE planner"
        title="Work backwards from freedom"
        description="A deterministic projection using your income, expenses, savings, and a 25x annual-expense target."
      />
      <ContextInsight
        title={
          data.metrics.shortfall
            ? "Your plan has a visible gap"
            : "Your current projection clears the target"
        }
        body={
          data.metrics.shortfall
            ? `${compactMoney(data.metrics.shortfall)} separates the current projection from the target corpus.`
            : "Keep reviewing the assumptions as your income, expenses, and investment rate change."
        }
        setView={setView}
      />
      <div className="metric-grid">
        <Metric
          label="Corpus needed"
          value={compactMoney(data.metrics.corpusNeeded)}
        />
        <Metric
          label="Projected corpus"
          value={compactMoney(data.metrics.projectedCorpus)}
        />
        <Metric
          label="Required monthly SIP"
          value={compactMoney(data.metrics.requiredMonthlyInvestment)}
        />
        <Metric
          label="Shortfall"
          value={compactMoney(data.metrics.shortfall)}
          tone={data.metrics.shortfall ? "amber" : "green"}
        />
      </div>
      <Card>
        <h2>Projection</h2>
        <div className="chart tall">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={[
                { year: 0, corpus: data.finance.existing_savings },
                { year: 5, corpus: data.metrics.projectedCorpus * 0.35 },
                { year: 10, corpus: data.metrics.projectedCorpus * 0.7 },
                { year: 15, corpus: data.metrics.projectedCorpus },
              ]}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />
              <XAxis dataKey="year" />
              <YAxis
                tickFormatter={(value) => `${Math.round(value / 100000)}L`}
              />
              <Tooltip formatter={(value) => money(value)} />
              <Area
                type="monotone"
                dataKey="corpus"
                stroke="#16a34a"
                fill="#bbf7d0"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </>
  );
}

function Investments({ data, refresh, setView }) {
  const [form, setForm] = useState({
    name: "",
    category: "Equity",
    amount: "",
  });
  const submit = async (event) => {
    event.preventDefault();
    await createHolding("assets", { ...form, amount: Number(form.amount) });
    setForm({ name: "", category: "Equity", amount: "" });
    refresh();
  };
  return (
    <>
      <Header
        eyebrow="Investments"
        title="Make your allocation visible"
        description="Track broad allocation buckets without promising returns."
      />
      <ContextInsight
        title={
          data.assets.length
            ? "Allocation is now visible"
            : "Start with what you already own"
        }
        body={
          data.assets.length
            ? `${compactMoney(data.metrics.totalAssets)} is currently tracked across ${data.assets.length} holding${data.assets.length === 1 ? "" : "s"}.`
            : "Add holdings to make allocation and investment insights meaningful."
        }
        setView={setView}
      />
      <div className="two-column">
        <Card>
          <h2>Add holding</h2>
          <form className="stack-form" onSubmit={submit}>
            <label>
              Name
              <input
                className="input"
                required
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
              />
            </label>
            <label>
              Category
              <select
                className="input"
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
              >
                {["Equity", "Debt", "Gold", "Emergency Fund", "Other"].map(
                  (item) => (
                    <option key={item}>{item}</option>
                  ),
                )}
              </select>
            </label>
            <label>
              Current value
              <input
                className="input"
                required
                type="number"
                min="0"
                value={form.amount}
                onChange={(event) =>
                  setForm({ ...form, amount: event.target.value })
                }
              />
            </label>
            <button className="button-primary">Add holding</button>
          </form>
        </Card>
        <Card>
          <h2>Holdings</h2>
          {data.assets.length ? (
            data.assets.map((asset) => (
              <div className="list-row" key={asset._id}>
                <span>
                  {asset.name}
                  <small>{asset.category}</small>
                </span>
                <strong>{money(asset.amount)}</strong>
              </div>
            ))
          ) : (
            <EmptyState
              title="No investments yet"
              text="Add your current holdings for a meaningful allocation view."
            />
          )}
        </Card>
      </div>
    </>
  );
}

function NetWorth({ data, refresh, setView }) {
  const [form, setForm] = useState({
    name: "",
    category: "Home Loan",
    amount: "",
  });
  const submit = async (event) => {
    event.preventDefault();
    await createHolding("liabilities", {
      ...form,
      amount: Number(form.amount),
    });
    setForm({ name: "", category: "Home Loan", amount: "" });
    refresh();
  };
  return (
    <>
      <Header
        eyebrow="Net worth"
        title="Measure what you keep"
        description="Net worth is calculated as total assets minus total liabilities."
      />
      <ContextInsight
        title={
          data.metrics.netWorth >= 0
            ? "Your balance sheet is positive"
            : "Liabilities need attention"
        }
        body={`Net worth is ${compactMoney(data.metrics.netWorth)} from ${compactMoney(data.metrics.totalAssets)} in assets and ${compactMoney(data.metrics.totalLiabilities)} in liabilities.`}
        setView={setView}
      />
      <div className="metric-grid">
        <Metric label="Net worth" value={compactMoney(data.metrics.netWorth)} />
        <Metric
          label="Total assets"
          value={compactMoney(data.metrics.totalAssets)}
        />
        <Metric
          label="Total liabilities"
          value={compactMoney(data.metrics.totalLiabilities)}
          tone="amber"
        />
      </div>
      <div className="two-column">
        <Card>
          <h2>Add liability</h2>
          <form className="stack-form">
            <label>
              Name
              <input
                className="input"
                required
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
              />
            </label>
            <label>
              Category
              <select
                className="input"
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
              >
                {[
                  "Home Loan",
                  "Education Loan",
                  "Personal Loan",
                  "Credit Card",
                  "Other",
                ].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Outstanding amount
              <input
                className="input"
                required
                type="number"
                min="0"
                value={form.amount}
                onChange={(event) =>
                  setForm({ ...form, amount: event.target.value })
                }
              />
            </label>
            <button className="button-primary" onClick={submit}>
              Add liability
            </button>
          </form>
        </Card>
        <Card>
          <h2>Balance sheet</h2>
          {[
            ...data.assets.map((item) => ({ ...item, sign: 1 })),
            ...data.liabilities.map((item) => ({ ...item, sign: -1 })),
          ].map((item) => (
            <div className="list-row" key={`${item.sign}-${item._id}`}>
              <span>
                {item.name}
                <small>{item.category}</small>
              </span>
              <strong className={item.sign < 0 ? "negative" : ""}>
                {item.sign < 0 ? "-" : ""}
                {money(item.amount)}
              </strong>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}

function Simulator({ data }) {
  const [values, setValues] = useState({
    monthlyIncome: data.finance.monthly_income,
    monthlyExpenses: data.finance.monthly_expenses,
    currentSavings: data.finance.existing_savings,
    monthlySip: Math.max(0, data.metrics.savings),
    expectedReturn: 10,
    inflation: 6,
    retirementAge: 45,
  });
  const projectionFor = (scenario) => {
    const age = Number(data.finance.age) || 30;
    const years = Math.max(1, Number(scenario.retirementAge) - age);
    const rate = Number(scenario.expectedReturn) / 1200;
    const months = years * 12;
    const factor = rate ? ((1 + rate) ** months - 1) / rate : months;
    const corpus =
      Number(scenario.currentSavings) * (1 + rate) ** months +
      Number(scenario.monthlySip) * factor;
    const futureExpenses =
      Number(scenario.monthlyExpenses) *
      (1 + Number(scenario.inflation) / 100) ** years;
    const needed = futureExpenses * 12 * 25;
    const requiredSip =
      rate && factor > 0
        ? Math.max(
            0,
            (needed - Number(scenario.currentSavings) * (1 + rate) ** months) /
              factor,
          )
        : 0;
    return {
      corpus,
      needed,
      gap: corpus - needed,
      requiredSip,
      fireAge: Number(scenario.retirementAge),
      years,
      futureExpenses,
    };
  };
  const currentScenario = useMemo(
    () =>
      projectionFor({
        monthlyIncome: data.finance.monthly_income,
        monthlyExpenses: data.finance.monthly_expenses,
        currentSavings: data.finance.existing_savings,
        monthlySip: Math.max(0, data.metrics.savings),
        expectedReturn: 10,
        inflation: 6,
        retirementAge: 60,
      }),
    [data],
  );
  const modifiedScenario = useMemo(() => projectionFor(values), [data, values]);
  const comparison = [
    {
      name: "Today",
      current: Number(data.metrics.projectedCorpus) || 0,
      modified: Number(modifiedScenario.corpus) || 0,
    },
    {
      name: "Target",
      current: currentScenario.needed,
      modified: modifiedScenario.needed,
    },
  ];
  const updateValue = (key, value) =>
    setValues((current) => ({ ...current, [key]: Number(value) }));
  return (
    <>
      <Header
        eyebrow="Scenario lab"
        title="Try a different future"
        description="Adjust the assumptions and see how a different plan compares with your current trajectory."
      />
      <Card>
        <div className="simulator-grid">
          {[
            ["monthlyIncome", "Monthly income"],
            ["monthlyExpenses", "Monthly expenses"],
            ["currentSavings", "Current savings"],
            ["monthlySip", "Monthly SIP"],
            ["expectedReturn", "Expected return %"],
            ["inflation", "Inflation %"],
            ["retirementAge", "Retirement age"],
          ].map(([key, label]) => (
            <label className="simulator-control" key={key}>
              {label}
              <output>
                {key === "retirementAge" ? values[key] : money(values[key])}
              </output>
              <input
                className="range-input"
                type="range"
                min={key === "retirementAge" ? 35 : 0}
                max={
                  key === "retirementAge"
                    ? 75
                    : key.includes("Return") || key === "inflation"
                      ? 20
                      : Math.max(100000, Number(values[key]) * 2 || 100000)
                }
                step={
                  key.includes("Return") || key === "inflation" ? 0.5 : 1000
                }
                value={values[key]}
                onChange={(event) => updateValue(key, event.target.value)}
              />
              <input
                className="input compact-input"
                type="number"
                min="0"
                value={values[key]}
                onChange={(event) => updateValue(key, event.target.value)}
              />
            </label>
          ))}
        </div>
      </Card>
      <div className="metric-grid">
        <Metric
          label="Modified corpus"
          value={compactMoney(modifiedScenario.corpus)}
          detail={`At age ${modifiedScenario.fireAge}`}
        />
        <Metric
          label="Modified FIRE target"
          value={compactMoney(modifiedScenario.needed)}
          detail={`Inflated expenses ${compactMoney(modifiedScenario.futureExpenses)}/mo`}
        />
        <Metric
          label="Required SIP"
          value={compactMoney(modifiedScenario.requiredSip)}
          detail="To meet the target"
        />
        <Metric
          label="Corpus difference"
          value={compactMoney(modifiedScenario.gap - currentScenario.gap)}
          tone={modifiedScenario.gap >= 0 ? "green" : "amber"}
        />
      </div>
      <Card>
        <div className="card-heading">
          <div>
            <p className="eyebrow">Scenario comparison</p>
            <h2>Current plan vs your new scenario</h2>
          </div>
        </div>
        <div className="chart tall">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparison}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />
              <XAxis dataKey="name" />
              <YAxis
                tickFormatter={(value) => `${Math.round(value / 100000)}L`}
              />
              <Tooltip formatter={(value) => money(value)} />
              <Bar
                dataKey="current"
                name="Current scenario"
                fill="#94a3b8"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="modified"
                name="New scenario"
                fill="#16a34a"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="scenario-footnote">
          {modifiedScenario.gap >= 0
            ? "This scenario reaches the projected target."
            : `The projected shortfall is ${compactMoney(Math.abs(modifiedScenario.gap))}. Consider a higher SIP, longer horizon, or lower expense target.`}
        </div>
      </Card>
    </>
  );
}

function Tax({ data, setView }) {
  return (
    <>
      <Header
        eyebrow="Tax planner"
        title="Plan with the financial year in view"
        description="Education only. Confirm current limits and eligibility with official Income Tax Department guidance."
      />
      <ContextInsight
        title="Keep the financial year explicit"
        body="Tax guidance depends on the applicable year, regime, eligibility, and documentation. Use the official source links before acting."
        setView={setView}
      />
      <div className="two-column">
        <Card>
          <p className="eyebrow">FY 2026-27</p>
          <h2>Planning checklist</h2>
          <div className="action-list">
            {[
              "Review 80C contributions across EPF, PPF, and eligible investments.",
              "Compare NPS contributions and the applicable additional deduction.",
              "Keep investment proofs and interest certificates organized.",
              "Choose a tax regime after comparing your actual deductions.",
            ].map((item) => (
              <div className="action-item" key={item}>
                <b>+</b>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2>Known profile inputs</h2>
          <Metric
            label="Monthly income"
            value={money(data.finance.monthly_income)}
          />
          <Metric
            label="Existing savings"
            value={money(data.finance.existing_savings)}
          />
          <p className="muted">
            This planner does not estimate tax without complete annual income
            and deduction data.
          </p>
        </Card>
      </div>
    </>
  );
}
function Reports({ data }) {
  return (
    <>
      <Header
        eyebrow="Reports"
        title="A printable money briefing"
        action={
          <button className="button-secondary" onClick={() => window.print()}>
            Print report
          </button>
        }
      />
      <Card className="report">
        <h2>AI Money Mentor report</h2>
        <p className="muted">
          Generated {new Date().toLocaleDateString()} from your saved profile
          and recorded data.
        </p>
        <div className="metric-grid">
          <Metric
            label="Health score"
            value={`${data.score.overall_score}/100`}
          />
          <Metric
            label="Savings rate"
            value={`${data.metrics.savingsRate.toFixed(1)}%`}
          />
          <Metric
            label="Net worth"
            value={compactMoney(data.metrics.netWorth)}
          />
          <Metric label="FIRE age" value={data.metrics.fireAge} />
        </div>
        <h2>Recommendations</h2>
        {data.score.top_3_actions.map((item) => (
          <p key={item}>- {item}</p>
        ))}
      </Card>
    </>
  );
}
function Settings({ onEdit, onLogout, isGuest }) {
  return (
    <>
      <Header
        eyebrow="Settings"
        title="Keep your profile current"
        description="Small changes to your inputs improve every projection."
      />
      <Card>
        <h2>Profile and session</h2>
        <div className="settings-actions">
          <button className="button-primary" onClick={onEdit}>
            Edit financial profile
          </button>
          <button className="button-secondary" onClick={onLogout}>
            {isGuest ? "Login / Sign Up" : "Sign out"}
          </button>
        </div>
      </Card>
    </>
  );
}

export default function FinanceWorkspace({
  data,
  onEdit,
  onLogout,
  isGuest,
  refresh,
}) {
  const [view, setView] = useState("dashboard");
  const content = {
    dashboard: <Overview data={data} setView={setView} />,
    advisor: <Advisor data={data} />,
    health: <Health data={data} setView={setView} />,
    budget: <Budget data={data} refresh={refresh} setView={setView} />,
    goals: <Goals data={data} refresh={refresh} setView={setView} />,
    investments: (
      <Investments data={data} refresh={refresh} setView={setView} />
    ),
    fire: <Fire data={data} setView={setView} />,
    tax: <Tax data={data} setView={setView} />,
    simulator: <Simulator data={data} />,
    networth: <NetWorth data={data} refresh={refresh} setView={setView} />,
    reports: <Reports data={data} />,
    settings: (
      <Settings onEdit={onEdit} onLogout={onLogout} isGuest={isGuest} />
    ),
  }[view];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">
          <span>AM</span>
          <div>
            <strong>AI Money</strong>
            <small>MENTOR</small>
          </div>
        </div>
        <nav>
          {NAVIGATION.map(([key, label]) => (
            <button
              className={view === key ? "active" : ""}
              key={key}
              onClick={() => setView(key)}
            >
              <span className="nav-dot" />
              {label}
            </button>
          ))}
        </nav>
        <button className="global-ask" onClick={() => setView("advisor")}>
          <span>✦</span> Ask AI
        </button>
        <div className="sidebar-footer">
          <small>
            {isGuest ? "Guest Demo · Saved locally" : "Private workspace"}
          </small>
          <button onClick={onLogout}>
            {isGuest ? "Login / Sign Up" : "Sign out"}
          </button>
        </div>
      </aside>
      <main className="workspace-main">
        <div className="mobile-nav">
          <strong>AI Money Mentor</strong>
          <button
            className="mobile-ask"
            onClick={() => setView("advisor")}
            aria-label="Open AI Advisor"
          >
            ✦
          </button>
          <select
            value={view}
            onChange={(event) => setView(event.target.value)}
          >
            {NAVIGATION.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {content}
      </main>
    </div>
  );
}
