import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import API_URL from "../../config/api.js";
function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",

        credentials: "include",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to sign in.");
      }

      console.log("Login successful:", data);

      /*
        Update the global authentication state.

        AuthContext now knows that the user
        is authenticated.
      */
      if (data.user) {
        setUser(data.user);
      }

      setSuccess("Login successful! Redirecting...");

      setTimeout(() => {
        navigate("/home");
      }, 800);
    } catch (error) {
      console.error("Login error:", error);

      setError(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    alert("Google authentication will be connected to the backend later.");
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="brand auth-brand">
          <div className="brand-symbol">✦</div>
          <h1>NexusAI</h1>
        </div>

        <h2>Welcome back</h2>

        <p className="auth-description">Sign in to continue using NexusAI.</p>

        <button
          type="button"
          className="google-button"
          onClick={handleGoogleLogin}
        >
          <span className="google-letter">G</span>
          Continue with Google
        </button>

        <div className="divider">
          <span>or</span>
        </div>

        {/* Error message */}
        {error && <div className="auth-error">{error}</div>}

        {/* Success message */}
        {success && <div className="auth-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              autoComplete="current-password"
              required
            />
          </label>

          <button
            type="submit"
            className="primary-button full-width"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="switch-auth">
          Don't have an account?
          <button type="button" onClick={() => navigate("/signup")}>
            Create one
          </button>
        </p>
      </div>
    </main>
  );
}

export default Login;
