import { useEffect, useState } from "react";

const MESSAGES = [
  "Income analyzed",
  "Expenses analyzed",
  "Savings analyzed",
  "Emergency fund analyzed",
  "Investment capacity calculated",
  "Financial health calculated",
  "FIRE projection calculated",
];

function LoadingScreen() {
  const [activeMessageIndex, setActiveMessageIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveMessageIndex((current) => (current + 1) % MESSAGES.length);
    }, 1500);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="analysis-screen" aria-live="polite">
      <div className="analysis-card">
        <div className="analysis-mark">
          <span>AM</span>
          <div className="analysis-pulse" />
        </div>
        <p className="eyebrow">AI Money Mentor</p>
        <h1>Analyzing your financial profile...</h1>
        <p className="analysis-subtitle">
          Your plan is built from your numbers, not generic assumptions.
        </p>
        <div className="analysis-steps">
          {MESSAGES.map((message, index) => (
            <div
              className={`analysis-step ${index <= activeMessageIndex ? "is-active" : ""}`}
              key={message}
            >
              <span>{index <= activeMessageIndex ? "✓" : ""}</span>
              {message}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default LoadingScreen;
