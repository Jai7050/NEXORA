import { useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar({ onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // If App.jsx provides a logout function, use it.
    if (typeof onLogout === "function") {
      onLogout();
      return;
    }

    // Fallback logout
    localStorage.removeItem("nexora_token");
    localStorage.removeItem("nexora_logged_in");

    navigate("/login", { replace: true });
  };

  return (
    <nav className="nx-navbar">
      {/* Brand */}
      <div
        className="nx-navbar-brand"
        onClick={() => navigate("/dashboard")}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            navigate("/dashboard");
          }
        }}
      >
        ✦ NEXORA
      </div>

      {/* Navigation Links */}
      <div className="nx-navbar-links">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
        >
          Dashboard
        </button>

        <button
          type="button"
          onClick={() => navigate("/goals")}
        >
          Goals
        </button>

        <button
          type="button"
          onClick={() => navigate("/profile")}
        >
          Profile
        </button>

        <button
          type="button"
          className="nx-logout-btn"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}