import { Link } from "react-router-dom";
import "./Login.css";

function Login() {
  return (
    <main className="login-page">
      <div className="login-card">

        <div className="login-logo">
          ✦
        </div>

        <h1>NEXORA</h1>

        <p className="login-tagline">
          Level Up Your Life
        </p>

        <div className="login-form">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
          />

          <button type="button">
            Login
          </button>
        </div>

        <p className="register-text">
          Don't have an account?{" "}
          <Link to="/register">Register</Link>
        </p>

      </div>
    </main>
  );
}

export default Login;