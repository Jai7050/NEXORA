import "./Dashboard.css";

function Dashboard() {
  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="welcome-text">Welcome back, Player</p>
          <h1>NEXORA</h1>
          <p className="level-text">Level 1 • Beginner</p>
        </div>

        <div className="xp-box">
          <span>XP</span>
          <strong>0 / 100</strong>
        </div>
      </div>

      <div className="progress-card">
        <div className="card-title">
          <span>Today's Progress</span>
          <strong>0%</strong>
        </div>

        <div className="progress-bar">
          <div className="progress-fill"></div>
        </div>
      </div>

      <section className="dashboard-section">
        <h2>Today's Missions</h2>

        <div className="mission-card">
          <div>
            <h3>Study for 1 hour</h3>
            <p>Improve your knowledge</p>
          </div>
          <span>+20 XP</span>
        </div>

        <div className="mission-card">
          <div>
            <h3>Exercise</h3>
            <p>Take care of your body</p>
          </div>
          <span>+15 XP</span>
        </div>

        <div className="mission-card">
          <div>
            <h3>Read 10 pages</h3>
            <p>Build a reading habit</p>
          </div>
          <span>+10 XP</span>
        </div>
      </section>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Goals</span>
          <strong>3</strong>
          <p>Active Goals</p>
        </div>

        <div className="stat-card">
          <span>Habits</span>
          <strong>2 / 5</strong>
          <p>Completed Today</p>
        </div>

        <div className="stat-card">
          <span>Streak</span>
          <strong>0 🔥</strong>
          <p>Days</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;