import { useEffect, useRef, useState } from "react";
import "./Dashboard.css";
import BonusChallenges from "../../components/BonusChallenges/BonusChallenges";
import Navbar from "../../components/Navbar";
import {
  getTotalXP,
  addXP,
  removeXP,
} from "../../utils/xpSystem";

const STREAK_KEY = "nexora_streak";
const LAST_COMPLETED_KEY = "nexora_last_completed_date";
const BEST_STREAK_KEY = "nexora_best_streak";

const MISSIONS_KEY = "nexora_missions";
const CHALLENGES_KEY = "nexora_challenges";

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function getYesterdayDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return yesterday.toISOString().split("T")[0];
}

const defaultMissions = [
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
];

const defaultChallenges = [
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
];

function loadData(key, defaultData) {
  try {
    const savedData = localStorage.getItem(key);

    return savedData
      ? JSON.parse(savedData)
      : defaultData;
  } catch (error) {
    console.error(`Failed to load ${key}:`, error);

    return defaultData;
  }
}

function Dashboard() {
  // =============================
  // DAILY MISSIONS
  // =============================

  const [missions, setMissions] = useState(() =>
    loadData(MISSIONS_KEY, defaultMissions)
  );

  // =============================
  // BONUS CHALLENGES
  // =============================

  const [challenges, setChallenges] = useState(() =>
    loadData(CHALLENGES_KEY, defaultChallenges)
  );

  // =============================
  // TOTAL XP
  // =============================

  const [totalXP, setTotalXP] = useState(() => getTotalXP());

  // =============================
  // XP SYNC
  // =============================

  useEffect(() => {
    const handleXPUpdate = (event) => {
      setTotalXP(Number(event.detail) || 0);
    };

    window.addEventListener(
      "nexora-xp-updated",
      handleXPUpdate
    );

    return () => {
      window.removeEventListener(
        "nexora-xp-updated",
        handleXPUpdate
      );
    };
  }, []);

  // =============================
  // SYNC WHEN TAB / APP BECOMES ACTIVE
  // =============================

  useEffect(() => {
    const syncXP = () => {
      setTotalXP(getTotalXP());
    };

    window.addEventListener("storage", syncXP);
    window.addEventListener("focus", syncXP);

    return () => {
      window.removeEventListener("storage", syncXP);
      window.removeEventListener("focus", syncXP);
    };
  }, []);

  // =============================
  // STREAK
  // =============================

  const [streak, setStreak] = useState(() => {
    const savedStreak =
      localStorage.getItem(STREAK_KEY);

    return savedStreak
      ? Number(savedStreak)
      : 0;
  });

  const [bestStreak, setBestStreak] = useState(() => {
    const savedBestStreak =
      localStorage.getItem(BEST_STREAK_KEY);

    return savedBestStreak
      ? Number(savedBestStreak)
      : 0;
  });

  const streakAwarded = useRef(false);

  // =============================
  // DAILY MISSION DATA
  // =============================

  const completedMissions = missions.filter(
    (mission) => mission.completed
  ).length;

  const missionProgress = Math.round(
    (completedMissions / missions.length) * 100
  );

  // =============================
  // BONUS DATA
  // =============================

  const completedChallenges = challenges.filter(
    (challenge) => challenge.completed
  ).length;

  const challengeProgress = Math.round(
    (completedChallenges / challenges.length) * 100
  );

  // =============================
  // LEVEL SYSTEM
  // =============================

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

  // =============================
  // LEVEL UP
  // =============================

  const [showLevelUp, setShowLevelUp] = useState(false);

  const [previousLevel, setPreviousLevel] =
    useState(level);

  useEffect(() => {
    if (level > previousLevel) {
      setShowLevelUp(true);
      setPreviousLevel(level);
    }
  }, [level, previousLevel]);

  // =============================
  // SAVE MISSIONS
  // =============================

  useEffect(() => {
    localStorage.setItem(
      MISSIONS_KEY,
      JSON.stringify(missions)
    );
  }, [missions]);

  // =============================
  // SAVE CHALLENGES
  // =============================

  useEffect(() => {
    localStorage.setItem(
      CHALLENGES_KEY,
      JSON.stringify(challenges)
    );
  }, [challenges]);

  // =============================
  // MISSION HANDLER
  // =============================

  const handleMissionComplete = (id) => {
    const clickedMission = missions.find(
      (mission) => mission.id === id
    );

    if (!clickedMission) {
      return;
    }

    const isCompleting = !clickedMission.completed;

    // IMPORTANT:
    // XP update is outside setMissions()
    // to prevent duplicate XP in StrictMode.
    const newXP = isCompleting
      ? addXP(clickedMission.xp)
      : removeXP(clickedMission.xp);

    setTotalXP(newXP);

    setMissions((currentMissions) =>
      currentMissions.map((mission) =>
        mission.id === id
          ? {
              ...mission,
              completed: isCompleting,
            }
          : mission
      )
    );
  };

  // =============================
  // STREAK SYSTEM
  // =============================

  useEffect(() => {
    const allMissionsCompleted =
      completedMissions === missions.length;

    if (
      !allMissionsCompleted ||
      streakAwarded.current
    ) {
      return;
    }

    const today = getTodayDate();

    const lastCompletedDate =
      localStorage.getItem(
        LAST_COMPLETED_KEY
      );

    if (lastCompletedDate === today) {
      streakAwarded.current = true;
      return;
    }

    let newStreak = streak;

    if (!lastCompletedDate) {
      newStreak = 1;
    } else if (
      lastCompletedDate === getYesterdayDate()
    ) {
      newStreak = streak + 1;
    } else {
      newStreak = 1;
    }

    const newBestStreak = Math.max(
      bestStreak,
      newStreak
    );

    setStreak(newStreak);
    setBestStreak(newBestStreak);

    localStorage.setItem(
      STREAK_KEY,
      String(newStreak)
    );

    localStorage.setItem(
      BEST_STREAK_KEY,
      String(newBestStreak)
    );

    localStorage.setItem(
      LAST_COMPLETED_KEY,
      today
    );

    streakAwarded.current = true;
  }, [
    completedMissions,
    missions.length,
    streak,
    bestStreak,
  ]);

  // =============================
  // BONUS CHALLENGE HANDLER
  // =============================

  const handleChallengeComplete = (id) => {
    const clickedChallenge = challenges.find(
      (challenge) => challenge.id === id
    );

    if (!clickedChallenge) {
      return;
    }

    const isCompleting =
      !clickedChallenge.completed;

    // IMPORTANT:
    // XP update is outside setChallenges()
    // to prevent duplicate XP in StrictMode.
    const newXP = isCompleting
      ? addXP(clickedChallenge.xp)
      : removeXP(clickedChallenge.xp);

    setTotalXP(newXP);

    setChallenges((currentChallenges) =>
      currentChallenges.map((challenge) =>
        challenge.id === id
          ? {
              ...challenge,
              completed: isCompleting,
            }
          : challenge
      )
    );
  };

  // =============================
  // UI
  // =============================

  return (
    <>
      {/* NEXORA NAVIGATION */}
      <Navbar />

      <div className="dashboard-page">

        {/* LEVEL UP POPUP */}

        {showLevelUp && (
          <div className="level-up-overlay">

            <div className="level-up-card">

              <div className="level-up-icon">
                ⚡
              </div>

              <p className="system-label">
                NEXORA SYSTEM
              </p>

              <h2>
                LEVEL UP!
              </h2>

              <div className="new-level">
                LEVEL {level}
              </div>

              <div className="new-rank">
                {rank}
              </div>

              <p className="level-message">
                Your progress has unlocked
                a new rank.
              </p>

              <button
                className="level-up-button"
                onClick={() =>
                  setShowLevelUp(false)
                }
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

            <h1>
              NEXORA
            </h1>

            <p className="level-text">
              Level {level} • {rank}
            </p>

          </div>

          <div className="xp-box">

            <span>
              XP
            </span>

            <strong>
              {xpInCurrentLevel} / 100
            </strong>

          </div>

        </div>

        {/* DAILY PROGRESS */}

        <div className="progress-card">

          <div className="card-title">

            <span>
              Today's Mission Progress
            </span>

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
            />

          </div>

        </div>

        {/* DAILY MISSIONS */}

        <section className="dashboard-section">

          <h2>
            Today's Missions
          </h2>

          {missions.map((mission) => (

            <div
              className={`mission-card ${
                mission.completed
                  ? "completed"
                  : ""
              }`}
              key={mission.id}
              onClick={() =>
                handleMissionComplete(
                  mission.id
                )
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
                  {mission.completed
                    ? "✓"
                    : ""}
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
          onComplete={
            handleChallengeComplete
          }
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
            />

          </div>

        </div>

        {/* STATS */}

        <div className="stats-grid">

          {/* TOTAL XP */}

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

          {/* MISSIONS */}

          <div className="stat-card">

            <span>
              Missions
            </span>

            <strong>
              {completedMissions} /{" "}
              {missions.length}
            </strong>

            <p>
              Completed Today
            </p>

          </div>

          {/* STREAK */}

          <div className="stat-card streak-card">

            <span>
              🔥 Streak
            </span>

            <strong>
              {streak} Days
            </strong>

            <p>
              Best: {bestStreak} Days
            </p>

          </div>

          {/* RANK */}

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
    </>
  );
}

export default Dashboard;