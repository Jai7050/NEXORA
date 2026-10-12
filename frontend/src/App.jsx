import { useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import Goals from "./pages/Goals/Goals";
import Profile from "./pages/profile/Profile";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";

const AUTH_KEY = "nexora_logged_in";
const PROFILE_KEY = "nexora_profile";
const TOKEN_KEY = "nexora_token";

function AppRoutes() {
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem(AUTH_KEY) === "true"
  );

  // LOGIN
  const handleLogin = (email, token, fullname = "") => {
    if (!email || !token) {
      console.error("Login failed: email or token is missing.");
      return;
    }

    const loggedInEmail = email.trim();
    const loggedInName =
      typeof fullname === "string" ? fullname.trim() : "";

    // Save authentication details
    localStorage.setItem(AUTH_KEY, "true");
    localStorage.setItem(TOKEN_KEY, token);

    // Save the current account's profile
    localStorage.setItem(
      PROFILE_KEY,
      JSON.stringify({
        fullName: loggedInName,
        email: loggedInEmail,
      })
    );

    setIsLoggedIn(true);
    navigate("/dashboard", { replace: true });
  };

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);

    setIsLoggedIn(false);
    navigate("/login", { replace: true });
  };

  const goToLogin = () => {
    navigate("/login");
  };

  const goToRegister = () => {
    navigate("/register");
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to={isLoggedIn ? "/dashboard" : "/login"}
            replace
          />
        }
      />

      <Route
        path="/login"
        element={
          isLoggedIn ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login
              onLogin={handleLogin}
              onRegister={goToRegister}
            />
          )
        }
      />

      <Route
        path="/register"
        element={
          isLoggedIn ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Register onLogin={goToLogin} />
          )
        }
      />

      <Route
        path="/forgot-password"
        element={
          isLoggedIn ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <ForgotPassword />
          )
        }
      />

      <Route
        path="/dashboard"
        element={
          isLoggedIn ? (
            <Dashboard onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/goals"
        element={
          isLoggedIn ? (
            <Goals onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/profile"
        element={
          isLoggedIn ? (
            <Profile onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to={isLoggedIn ? "/dashboard" : "/login"}
            replace
          />
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;