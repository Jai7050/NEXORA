import { NavLink } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  return (
    <nav className="nexora-navbar">

      <div className="navbar-brand">
        <span className="navbar-logo">N</span>

        <span className="navbar-title">
          NEXORA
        </span>
      </div>

      <div className="navbar-links">

        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            isActive
              ? "navbar-link active"
              : "navbar-link"
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/goals"
          className={({ isActive }) =>
            isActive
              ? "navbar-link active"
              : "navbar-link"
          }
        >
          Goals
        </NavLink>

      </div>

    </nav>
  );
}

export default Navbar;