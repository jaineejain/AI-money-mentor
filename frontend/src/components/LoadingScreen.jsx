import { useEffect, useState } from "react";

const MESSAGES = [
  "Analyzing your income & expenses...",
  "Calculating your FIRE retirement age...",
  "Finding tax-saving opportunities under 80C...",
  "Building your personalized SIP plan...",
  "Checking insurance & emergency fund gaps...",
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
    <section className="min-h-[70vh] rounded-[2rem] bg-slate-950 px-6 py-10 text-white shadow-2xl shadow-black/30 sm:px-10 sm:py-14">
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-10">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-green-400/30 bg-green-400/10">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-green-300/30 border-t-brand" />
          </div>

          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-green-300">
            AI Money Mentor
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Preparing your personalized plan
          </h2>
          <p className="mt-4 min-h-[3rem] text-lg leading-8 text-slate-300 transition-all duration-300">
            {MESSAGES[activeMessageIndex]}
          </p>

          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-brand shadow-[0_0_18px_rgba(22,163,74,0.9)]" />
            Powered by AI • Takes 5-10 seconds
          </div>
        </div>
      </div>
    </section>
  );
}

export default LoadingScreen;
