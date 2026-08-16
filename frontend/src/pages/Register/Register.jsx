import "./Register.css";

function Register({ onLogin }) {
  const handleSubmit = (event) => {
    event.preventDefault();

    // Registration logic will be connected
    // to the backend later.
    onLogin();
  };

  return (
    <div className="register-page">

      <div className="register-card">

        <div className="register-logo">
          N
        </div>

        <h1>CREATE ACCOUNT</h1>

        <p className="register-subtitle">
          Start your journey with NEXORA
        </p>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Full Name</label>

            <input
              type="text"
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Create a password"
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>

            <input
              type="password"
              placeholder="Confirm your password"
              required
            />
          </div>

          <button
            type="submit"
            className="register-button"
          >
            REGISTER
          </button>

        </form>

        <p className="login-text">
          Already have an account?
          {" "}

          <button
            type="button"
            className="login-link"
            onClick={onLogin}
          >
            Back to Login
          </button>
        </p>

      </div>

    </div>
  );
}

export default Register;