import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";

const API_URL = "http://localhost:8080/api/auth";

function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullname: fullName.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Registration failed. Please try again."
        );
      }

      setSuccess("Account created successfully! Redirecting to login...");

      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (err) {
      if (err instanceof TypeError) {
        setError(
          "Unable to connect to the server. Check whether your backend is running."
        );
      } else {
        setError(err.message || "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-logo">N</div>

        <h1>CREATE ACCOUNT</h1>

        <p className="register-subtitle">
          Start your journey with NEXORA
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="register-name">Full Name</label>

            <input
              id="register-name"
              type="text"
              placeholder="Enter your name"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-email">Email</label>

            <input
              id="register-email"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-password">Password</label>

            <input
              id="register-password"
              type="password"
              placeholder="Create a password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-confirm-password">
              Confirm Password
            </label>

            <input
              id="register-confirm-password"
              type="password"
              placeholder="Confirm your password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              minLength={6}
              required
            />
          </div>

          {error && (
            <p className="register-form-error" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="register-form-success" role="status">
              {success}
            </p>
          )}

          <button
            type="submit"
            className="register-button"
            disabled={loading}
          >
            {loading ? "CREATING ACCOUNT..." : "REGISTER"}
          </button>
        </form>

        <p className="login-text">
          Already have an account?{" "}
          <Link className="login-link" to="/login">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;