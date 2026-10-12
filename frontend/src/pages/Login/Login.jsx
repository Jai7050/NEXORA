import { useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css";

const API_URL = "http://localhost:8080/api/auth";

function Login({ onLogin, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Invalid email or password."
        );
      }

      const token = data.token || data.accessToken || data.jwt;

      if (!token) {
        throw new Error("JWT token missing in backend response.");
      }

      if (typeof onLogin !== "function") {
        throw new Error(
          "Login handler is not configured in App.jsx."
        );
      }

      const loggedInEmail = (data.email || email).trim();

      const fullName = (
        data.fullname ||
        data.fullName ||
        ""
      ).trim();

      if (!fullName) {
        throw new Error(
          "Your name is missing from the server response. Please check your user record in MongoDB."
        );
      }

      onLogin(loggedInEmail, token, fullName);
    } catch (err) {
      setError(
        err.message || "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">N</div>

        <h1>NEXORA</h1>

        <p className="login-subtitle">Level Up Your Life</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="login-forgot">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Logging in..." : "LOGIN"}
          </button>
        </form>

        <p className="register-text">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="register-link"
            onClick={onRegister}
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;