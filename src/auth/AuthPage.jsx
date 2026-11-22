import { useState } from "react";
import { Gamepad2, Mail, Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "./AuthContext";
import "./AuthPage.css";

export default function AuthPage() {
  const { login, signup } = useAuth();

  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      const result =
        mode === "login"
          ? login(email, password)
          : signup(name, email, password);

      if (!result.success) {
        setError(result.message);
      }

      setLoading(false);
    }, 400);
  };

  const switchMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setError("");
    setPassword("");
  };

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="auth-glow glow-one" />
        <div className="auth-glow glow-two" />
      </div>

      <div className="auth-container">

        {/* BRAND */}
        <div className="auth-brand">
          <div className="auth-logo">
            <Gamepad2 size={30} />
          </div>

          <div>
            <h1>
              GAME<span>STATION</span>
            </h1>
            <p>PLAY • COMPETE • WIN</p>
          </div>
        </div>

        {/* CARD */}
        <div className="auth-card">

          <div className="auth-heading">
            <div className="auth-icon">
              <Gamepad2 size={25} />
            </div>

            <h2>
              {mode === "login"
                ? "Welcome Back"
                : "Create Your Account"}
            </h2>

            <p>
              {mode === "login"
                ? "Login to continue your gaming journey."
                : "Join Game Station and start playing."}
            </p>
          </div>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {mode === "signup" && (
              <div className="auth-field">
                <label>Player Name</label>

                <div className="input-wrapper">
                  <User size={18} />

                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label>Email</label>

              <div className="input-wrapper">
                <Mail size={18} />

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-field">
              <label>Password</label>

              <div className="input-wrapper">
                <Lock size={18} />

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={
                    mode === "login"
                      ? "current-password"
                      : "new-password"
                  }
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {mode === "login" && (
              <div className="auth-options">
                <label className="remember">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={() =>
                    setError("Password recovery will be added with the backend.")
                  }
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Login to Game Station"
                : "Create Game Station Account"}

              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <button
            className="guest-button"
            type="button"
            onClick={() =>
              setError("Guest mode will be added later.")
            }
          >
            Continue as Guest
          </button>

          <div className="auth-switch">
            <span>
              {mode === "login"
                ? "Don't have an account?"
                : "Already have an account?"}
            </span>

            <button type="button" onClick={switchMode}>
              {mode === "login" ? "Create Account" : "Login"}
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <div className="auth-footer">
          <span>🎮</span>
          Your progress. Your games. Your journey.
        </div>

      </div>
    </div>
  );
}