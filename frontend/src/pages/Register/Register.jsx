import { Link } from "react-router-dom";
import "./Register.css";

function Register() {
  return (
    <main className="register-page">
      <div className="register-card">

        <div className="register-logo">
          ✦
        </div>

        <h1>NEXORA</h1>

        <p className="register-tagline">
          Create Your Account
        </p>

        <div className="register-form">

          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            type="text"
            placeholder="Enter your name"
          />

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
            placeholder="Create a password"
          />

          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
          />

          <button type="button">
            Create Account
          </button>

        </div>

        <p className="login-text">
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </p>

      </div>
    </main>
  );
}

export default Register;