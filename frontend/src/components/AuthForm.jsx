import { useState } from "react";
import { login, register } from "../api";

function AuthForm({ onAuthenticated, onGuest }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const user =
        mode === "login"
          ? await login(email, password)
          : await register(email, password);
      onAuthenticated(user);
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "We could not complete that request. Check the API and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLogin = mode === "login";

  const handleGuest = () => {
    onGuest();
  };

  return (
    <main className="auth-experience">
      <section className="auth-visual">
        <div className="auth-brand">
          <span>AM</span>
          <strong>AI Money Mentor</strong>
        </div>
        <div className="auth-visual-copy">
          <p className="auth-kicker">Your money, understood</p>
          <h1>
            Your Personal <em>AI Financial Advisor</em>
          </h1>
          <p>
            Turn your real financial picture into a calmer plan for today and a
            clearer future.
          </p>
        </div>
        <div className="advisor-orbit" aria-hidden="true">
          <span className="orbit-core">AM</span>
          <i />
          <i />
          <i />
        </div>
        <div className="feature-grid">
          {[
            "AI Financial Analysis",
            "Goal Planning",
            "FIRE Planning",
            "Personalized Recommendations",
          ].map((feature, index) => (
            <div className="auth-feature" key={feature}>
              <span>0{index + 1}</span>
              <strong>{feature}</strong>
            </div>
          ))}
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-panel-inner">
          <p className="eyebrow">Private money workspace</p>
          <h2>
            {isLogin ? "Welcome back" : "Start with your financial picture"}
          </h2>
          <p className="auth-panel-copy">
            {isLogin
              ? "Pick up where your financial plan left off."
              : "Create an account and build a plan around your actual numbers."}
          </p>
          <form onSubmit={handleSubmit} className="auth-form">
            <label className="label">
              Email address
              <input
                className="input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="label">
              Password
              <input
                className="input"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <small className="field-hint">At least 8 characters</small>
            </label>
            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="button-primary auth-submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Opening your workspace..."
                : isLogin
                  ? "Enter workspace"
                  : "Create secure account"}
            </button>
          </form>
          <button
            type="button"
            className="auth-switch"
            onClick={() => {
              setMode(isLogin ? "register" : "login");
              setError("");
            }}
          >
            {isLogin
              ? "New here? Create your account"
              : "Already have an account? Sign in"}
          </button>
          <div className="auth-divider">
            <span>or explore first</span>
          </div>
          <button
            type="button"
            className="button-secondary auth-demo"
            onClick={handleGuest}
          >
            Continue as Guest
          </button>
          <p className="auth-demo-note">
            Explore a sample workspace without creating an account. Your demo
            changes stay on this device.
          </p>
          <p className="auth-footnote">
            Your profile is protected by your account. Financial calculations
            stay transparent and explainable.
          </p>
        </div>
      </section>
    </main>
  );
}

export default AuthForm;
