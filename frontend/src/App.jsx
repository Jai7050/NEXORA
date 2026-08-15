import { useState } from "react";
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Goals from "./pages/Goals/Goals";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const path = window.location.pathname;

  if (!isLoggedIn) {
    return (
      <Login
        onLogin={() => setIsLoggedIn(true)}
      />
    );
  }

  if (path === "/goals") {
    return <Goals />;
  }

  return <Dashboard />;
}

export default App;