import { useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar({ onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (typeof onLogout === "function") {
      onLogout();
      return;
    }

    // Fallback if Navbar is used outside App's Dashboard route
    localStorage.removeItem("nexora_token");
    localStorage.removeItem("nexora_profile");

    navigate("/login", { replace: true });
  };

  return (
    <nav className="nx-navbar">
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
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}