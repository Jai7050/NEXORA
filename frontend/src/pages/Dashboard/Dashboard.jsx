import { useEffect, useState } from "react";
import "./Dashboard.css";
import BonusChallenges from "../../components/BonusChallenges/BonusChallenges";

function Dashboard() {
  const [missions, setMissions] = useState([
    {
      id: 1,
      title: "Study for 1 hour",
      description: "Improve your knowledge",
      xp: 20,
      completed: false,
    },
    {
      id: 2,
      title: "Exercise",
      description: "Take care of your body",
      xp: 15,
      completed: false,
    },
    {
      id: 3,
      title: "Read 10 pages",
      description: "Build your reading habit",
      xp: 10,
      completed: false,
    },
    {
      id: 4,
      title: "Drink Water",
      description: "Stay hydrated",
      xp: 10,
      completed: false,
    },
    {
      id: 5,
      title: "Meditation",
      description: "Relax your mind",
      xp: 15,
      completed: false,
    },
  ]);

  const [challenges, setChallenges] = useState([
    {
      id: 1,
      title: "Complete 20 Push-ups",
      description: "Challenge your physical strength",
      xp: 30,
      completed: false,
    },
    {
      id: 2,
      title: "Study for 2 Hours",
      description: "Deepen your knowledge",
      xp: 40,
      completed: false,
    },
    {
      id: 3,
      title: "Complete Morning Routine",
      description: "Start your day with discipline",
      xp: 25,
      completed: false,
    },
  ]);

  // -----------------------------
  // DAILY MISSION DATA
  // -----------------------------

  const completedMissions = missions.filter(
    (mission) => mission.completed
  ).length;

  const missionXP = missions
    .filter((mission) => mission.completed)
    .reduce((total, mission) => total + mission.xp, 0);

  const missionProgress = Math.round(
    (completedMissions / missions.length) * 100
  );

  // -----------------------------
  // BONUS CHALLENGE DATA
  // -----------------------------

  const completedChallenges = challenges.filter(
    (challenge) => challenge.completed
  ).length;

  const challengeXP = challenges
    .filter((challenge) => challenge.completed)
    .reduce((total, challenge) => total + challenge.xp, 0);

  const challengeProgress = Math.round(
    (completedChallenges / challenges.length) * 100
  );

  // -----------------------------
  // TOTAL XP
  // -----------------------------

  const totalXP = missionXP + challengeXP;

  // -----------------------------
  // LEVEL SYSTEM
  // -----------------------------

  const level = Math.min(
    Math.floor(totalXP / 100) + 1,
    10
  );

  const ranks = [
    "Awakened",
    "Initiate",
    "Striker",
    "Ascendant",
    "Vanguard",
    "Elite",
    "Sovereign",
    "Transcendent",
    "Apex",
    "Nexora Prime",
  ];

  const rank = ranks[level - 1];

  const xpInCurrentLevel = totalXP % 100;
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(level);

  useEffect(() => {
    if (level > previousLevel) {
      setShowLevelUp(true);
      setPreviousLevel(level);
    }
  }, [level, previousLevel]);

  // -----------------------------
  // MISSION HANDLER
  // -----------------------------

  const handleMissionComplete = (id) => {
    setMissions((currentMissions) =>
      currentMissions.map((mission) =>
        mission.id === id
          ? {
              ...mission,
              completed: !mission.completed,
            }
          : mission
      )
    );
  };

  // -----------------------------
  // CHALLENGE HANDLER
  // -----------------------------

  const handleChallengeComplete = (id) => {
    setChallenges((currentChallenges) =>
      currentChallenges.map((challenge) =>
        challenge.id === id
          ? {
              ...challenge,
              completed: !challenge.completed,
            }
          : challenge
      )
    );
  };

  return (
    <div className="dashboard-page">
      {showLevelUp && (
      <div className="level-up-overlay">
        <div className="level-up-card">

        <div className="level-up-icon">
        ⚡
        </div>

        <p className="system-label">
          NEXORA SYSTEM
        </p>

        <h2>LEVEL UP!</h2>

        <div className="new-level">
         LEVEL {level}
        </div>

        <div className="new-rank">
         {rank}
        </div>

        <p className="level-message">
         Your progress has unlocked a new rank.
        </p>

        <button
         className="level-up-button"
         onClick={() => setShowLevelUp(false)}
        >
         CONTINUE
        </button>

        </div>
      </div>
    )}

      {/* HEADER */}
      <div className="dashboard-header">

        <div>
          <p className="welcome-text">
            Welcome back, Player
          </p>

          <h1>NEXORA</h1>

          <p className="level-text">
            Level {level} • {rank}
          </p>
        </div>

        <div className="xp-box">
          <span>XP</span>

          <strong>
            {xpInCurrentLevel} / 100
          </strong>
        </div>

      </div>


      {/* DAILY PROGRESS */}
      <div className="progress-card">

        <div className="card-title">
          <span>Today's Mission Progress</span>

          <strong>
            {missionProgress}%
          </strong>
        </div>

        <div className="progress-bar">

          <div
            className="progress-fill"
            style={{
              width: `${missionProgress}%`,
            }}
          ></div>

        </div>

      </div>


      {/* DAILY MISSIONS */}
      <section className="dashboard-section">

        <h2>Today's Missions</h2>

        {missions.map((mission) => (

          <div
            className={`mission-card ${
              mission.completed
                ? "completed"
                : ""
            }`}
            key={mission.id}
            onClick={() =>
              handleMissionComplete(mission.id)
            }
          >

            <div className="mission-left">

              <div
                className={`mission-check ${
                  mission.completed
                    ? "checked"
                    : ""
                }`}
              >
                {mission.completed ? "✓" : ""}
              </div>

              <div>

                <h3>
                  {mission.title}
                </h3>

                <p>
                  {mission.description}
                </p>

              </div>

            </div>

            <span>
              +{mission.xp} XP
            </span>

          </div>

        ))}

      </section>


      {/* BONUS CHALLENGES */}
      <BonusChallenges
        challenges={challenges}
        onComplete={handleChallengeComplete}
      />


      {/* BONUS PROGRESS */}
      <div className="progress-card">

        <div className="card-title">

          <span>
            Bonus Challenge Progress
          </span>

          <strong>
            {challengeProgress}%
          </strong>

        </div>

        <div className="progress-bar">

          <div
            className="progress-fill"
            style={{
              width: `${challengeProgress}%`,
            }}
          ></div>

        </div>

      </div>


      {/* STATS */}
      <div className="stats-grid">

        <div className="stat-card">

          <span>
            Total XP
          </span>

          <strong>
            {totalXP}
          </strong>

          <p>
            Earned XP
          </p>

        </div>


        <div className="stat-card">

          <span>
            Missions
          </span>

          <strong>
            {completedMissions} / {missions.length}
          </strong>

          <p>
            Completed Today
          </p>

        </div>


        <div className="stat-card">

          <span>
            Rank
          </span>

          <strong>
            {rank}
          </strong>

          <p>
            Level {level}
          </p>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;