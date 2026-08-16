import "./Login.css";

function Login({ onLogin, onRegister }) {
  const handleSubmit = (event) => {
    event.preventDefault();

    onLogin();
  };

  return (
    <div className="login-page">

      <div className="login-card">

        <div className="login-logo">
          N
        </div>

        <h1>NEXORA</h1>

        <p className="login-subtitle">
          Level Up Your Life
        </p>

        <form onSubmit={handleSubmit}>

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
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="login-button"
          >
            LOGIN
          </button>

        </form>

        <p className="register-text">
          Don't have an account?
          {" "}

          <button
             type="button"
              className="register-link"
              onClick={() => {
              window.location.href = "/register";
            }}
            >
               Register
          </button>
        </p>

      </div>

    </div>
  );
}

export default Login;