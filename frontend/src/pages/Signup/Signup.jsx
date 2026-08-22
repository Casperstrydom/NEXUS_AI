import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../../config/api.js";

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    country: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    // Clear old error when the user starts typing again
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          age: formData.age,
          country: formData.country,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create your account.");
      }

      console.log("Account created:", data);

      setSuccess("Account created successfully! Redirecting...");

      // Give the user a moment to see the success message
      setTimeout(() => {
        navigate("/plans");
      }, 1000);
    } catch (error) {
      console.error("Signup error:", error);

      setError(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleSignup() {
    alert(
      "Google authentication will be connected to the Express backend later.",
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="brand auth-brand">
          <div className="brand-symbol">✦</div>
          <h1>NexusAI</h1>
        </div>

        <h2>Create your account</h2>

        <p className="auth-description">
          Create your NexusAI account and start exploring your personal AI
          assistant.
        </p>

        <button
          type="button"
          className="google-button"
          onClick={handleGoogleSignup}
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
            Name
            <input
              type="text"
              name="name"
              placeholder="Your name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </label>

          {/* NEW PASSWORD FIELD */}
          <label>
            Password
            <input
              type="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              minLength="8"
              required
            />
            <small>Password must be at least 8 characters.</small>
          </label>

          <label>
            Age
            <input
              type="number"
              name="age"
              placeholder="Your age"
              min="13"
              max="120"
              value={formData.age}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Country
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              required
            >
              <option value="">Select your country</option>

              <option value="South Africa">South Africa</option>

              <option value="United States">United States</option>

              <option value="United Kingdom">United Kingdom</option>

              <option value="Canada">Canada</option>

              <option value="Australia">Australia</option>

              <option value="Germany">Germany</option>

              <option value="France">France</option>

              <option value="India">India</option>

              <option value="Brazil">Brazil</option>

              <option value="Other">Other</option>
            </select>
          </label>

          <button
            type="submit"
            className="primary-button full-width"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Continue"}
          </button>
        </form>

        <p className="switch-auth">
          Already have an account?
          <button type="button" onClick={() => navigate("/login")}>
            Sign in
          </button>
        </p>
      </div>
    </main>
  );
}

export default Signup;
