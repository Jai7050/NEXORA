import { useEffect, useRef, useState } from "react";
import "./Dashboard.css";

import StudyReminder from "../../components/studyReminder";
import BonusChallenges from "../../components/BonusChallenges/BonusChallenges";
import Navbar from "../../components/Navbar";

import { getTotalXP, addXP, removeXP } from "../../utils/xpSystem";
import { fetchGoals, toggleGoalTask } from "../../api/goalsApi";

const STREAK_KEY = "nexora_streak";
const LAST_COMPLETED_KEY = "nexora_last_completed_date";
const BEST_STREAK_KEY = "nexora_best_streak";
const MISSIONS_KEY = "nexora_missions";
const CHALLENGES_KEY = "nexora_challenges";
const PROFILE_KEY = "nexora_profile";

const defaultMissions = [
  {
    id: 1,
    title: "Study for 1 hour",
    description: "Invest time in learning something new.",
    xp: 20,
    completed: false,
    icon: "📚",
  },
  {
    id: 2,
    title: "Exercise",
    description: "Build a stronger body and mind.",
    xp: 15,
    completed: false,
    icon: "💪",
  },
  {
    id: 3,
    title: "Read 10 pages",
    description: "Grow your knowledge one page at a time.",
    xp: 10,
    completed: false,
    icon: "📖",
  },
  {
    id: 4,
    title: "Drink Water",
    description: "Stay hydrated throughout the day.",
    xp: 10,
    completed: false,
    icon: "💧",
  },
  {
    id: 5,
    title: "Meditation",
    description: "Slow down, breathe, and reset.",
    xp: 15,
    completed: false,
    icon: "🧘",
  },
];

const defaultChallenges = [
  {
    id: 1,
    title: "Complete 20 Push-ups",
    description: "Challenge your physical strength.",
    xp: 30,
    completed: false,
  },
  {
    id: 2,
    title: "Study for 2 Hours",
    description: "Enter deep-focus mode.",
    xp: 40,
    completed: false,
  },
  {
    id: 3,
    title: "Complete Morning Routine",
    description: "Start your day with discipline.",
    xp: 25,
    completed: false,
  },
];

function getLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function loadData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeGoal(goal) {
  return {
    ...goal,
    targetDays: Math.max(1, Number(goal.targetDays) || 1),
    completedDays: Math.max(0, Number(goal.completedDays) || 0),
    xp: Math.max(1, Number(goal.xp) || 10),
    tasks: Array.isArray(goal.tasks)
      ? goal.tasks.map((task, index) =>
          typeof task === "string"
            ? { id: `${goal.id}-task-${index}`, title: task }
            : task
        )
      : [],
    dailyCompletions:
      goal.dailyCompletions &&
      typeof goal.dailyCompletions === "object"
        ? goal.dailyCompletions
        : {},
  };
}

function getTodayTasks(goal) {
  return goal.dailyCompletions?.[getLocalDate()] || [];
}

function getGoalProgress(goal) {
  return Math.min(
    100,
    Math.round(
      (goal.completedDays / Math.max(1, goal.targetDays)) * 100
    )
  );
}

function Dashboard({ onLogout }) {
  const [profile] = useState(() =>
    loadData(PROFILE_KEY, { fullName: "", email: "" })
  );

  const [missions, setMissions] = useState(() =>
    loadData(MISSIONS_KEY, defaultMissions)
  );

  const [challenges, setChallenges] = useState(() =>
    loadData(CHALLENGES_KEY, defaultChallenges)
  );

  const [goals, setGoals] = useState([]);
  const [goalsLoading, setGoalsLoading] = useState(true);

  const [totalXP, setTotalXP] = useState(() => getTotalXP());

  const [streak, setStreak] = useState(
    () => Number(localStorage.getItem(STREAK_KEY)) || 0
  );

  const [bestStreak, setBestStreak] = useState(
    () => Number(localStorage.getItem(BEST_STREAK_KEY)) || 0
  );

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [notice, setNotice] = useState("");
  const [goalError, setGoalError] = useState("");

  const previousLevel = useRef(
    Math.min(Math.floor(totalXP / 100) + 1, 10)
  );

  const completedMissions = missions.filter(
    (mission) => mission.completed
  ).length;

  const completedChallenges = challenges.filter(
    (challenge) => challenge.completed
  ).length;

  const missionProgress = missions.length
    ? Math.round((completedMissions / missions.length) * 100)
    : 0;

  const challengeProgress = challenges.length
    ? Math.round((completedChallenges / challenges.length) * 100)
    : 0;

  const completedGoals = goals.filter(
    (goal) => goal.completedDays >= goal.targetDays
  ).length;

  const level = Math.min(Math.floor(totalXP / 100) + 1, 10);

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
  const xpInCurrentLevel = level === 10 ? 100 : totalXP % 100;

  const displayName =
    profile.fullName?.trim() ||
    profile.email?.split("@")[0] ||
    "Player";

  function showNotice(message) {
    setNotice(message);

    window.setTimeout(() => {
      setNotice((current) =>
        current === message ? "" : current
      );
    }, 3000);
  }

  // Fetch the same goals created on the Goals page.
  async function loadDashboardGoals() {
    try {
      setGoalsLoading(true);
      setGoalError("");

      const data = await fetchGoals();

      if (!Array.isArray(data)) {
        throw new Error("Invalid goals response from server.");
      }

      setGoals(data.map(normalizeGoal));
    } catch (error) {
      setGoalError(
        error.message || "Unable to load your goals."
      );
    } finally {
      setGoalsLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardGoals();
  }, []);

  // Reload goals when the browser tab regains focus.
  useEffect(() => {
    const handleFocus = () => {
      loadDashboardGoals();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Synchronize XP.
  useEffect(() => {
    const syncXP = () => setTotalXP(getTotalXP());

    window.addEventListener("nexora-xp-updated", syncXP);
    window.addEventListener("focus", syncXP);
    window.addEventListener("storage", syncXP);

    return () => {
      window.removeEventListener("nexora-xp-updated", syncXP);
      window.removeEventListener("focus", syncXP);
      window.removeEventListener("storage", syncXP);
    };
  }, []);

  // Level-up notification.
  useEffect(() => {
    if (level > previousLevel.current) {
      setShowLevelUp(true);
    }

    previousLevel.current = level;
  }, [level]);

  useEffect(() => {
    localStorage.setItem(MISSIONS_KEY, JSON.stringify(missions));
  }, [missions]);

  useEffect(() => {
    localStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));
  }, [challenges]);

  // Streak for daily missions.
  useEffect(() => {
    if (!missions.length || completedMissions !== missions.length) {
      return;
    }

    const today = getLocalDate();
    const lastCompleted = localStorage.getItem(LAST_COMPLETED_KEY);

    if (lastCompleted === today) {
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const newStreak =
      lastCompleted === getLocalDate(yesterday) ? streak + 1 : 1;

    const newBest = Math.max(bestStreak, newStreak);

    setStreak(newStreak);
    setBestStreak(newBest);

    localStorage.setItem(STREAK_KEY, String(newStreak));
    localStorage.setItem(BEST_STREAK_KEY, String(newBest));
    localStorage.setItem(LAST_COMPLETED_KEY, today);
  }, [completedMissions, missions.length, streak, bestStreak]);

  function handleMissionComplete(id) {
    const mission = missions.find((item) => item.id === id);

    if (!mission) {
      return;
    }

    const completing = !mission.completed;

    const updatedXP = completing
      ? addXP(mission.xp)
      : removeXP(mission.xp);

    setTotalXP(updatedXP);

    setMissions((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, completed: completing }
          : item
      )
    );

    showNotice(
      completing
        ? `+${mission.xp} XP earned! Keep going!`
        : `${mission.xp} XP removed. Mission reopened.`
    );
  }

  function handleChallengeComplete(id) {
    const challenge = challenges.find((item) => item.id === id);

    if (!challenge) {
      return;
    }

    const completing = !challenge.completed;

    const updatedXP = completing
      ? addXP(challenge.xp)
      : removeXP(challenge.xp);

    setTotalXP(updatedXP);

    setChallenges((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, completed: completing }
          : item
      )
    );

    showNotice(
      completing
        ? `Challenge completed! +${challenge.xp} XP`
        : "Challenge reopened."
    );
  }

  // Toggle a task belonging to a goal created on Goals page.
  async function handleGoalTaskToggle(goalId, taskId) {
    try {
      const response = await toggleGoalTask(goalId, taskId);

      if (!response?.goal) {
        throw new Error("Invalid task update response.");
      }

      setGoals((current) =>
        current.map((goal) =>
          goal.id === goalId
            ? normalizeGoal(response.goal)
            : goal
        )
      );

      if (response.xpAwarded && response.xpEarned > 0) {
        const updatedXP = addXP(response.xpEarned);
        setTotalXP(updatedXP);

        showNotice(`Goal completed for today! +${response.xpEarned} XP`);
      } else {
        showNotice("Goal task updated.");
      }
    } catch (error) {
      showNotice(error.message || "Could not update goal task.");
    }
  }

  // Reset missions on a new local calendar day.
  function resetMissions() {
    const lastReset = localStorage.getItem("nexora_missions_reset");

    if (lastReset === getLocalDate()) {
      return;
    }

    setMissions((current) =>
      current.map((mission) => ({
        ...mission,
        completed: false,
      }))
    );

    setChallenges((current) =>
      current.map((challenge) => ({
        ...challenge,
        completed: false,
      }))
    );

    localStorage.setItem("nexora_missions_reset", getLocalDate());
  }

  useEffect(() => {
    resetMissions();

    const interval = window.setInterval(resetMissions, 60 * 1000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <>
      <Navbar onLogout={onLogout} />

      <main className="nx-dashboard">
        <section className="nx-welcome">
          <div className="nx-welcome-content">
            <span className="nx-eyebrow">
              YOUR PERSONAL GROWTH SYSTEM
            </span>

            <h1>
              Welcome back, <span>{displayName}</span>
            </h1>

            <p>
              Every small win moves you forward. Make today count.
            </p>

            <div className="nx-welcome-tags">
              <span>⚡ Level {level}</span>
              <span>✦ {rank}</span>
            </div>
          </div>

          <div className="nx-welcome-emblem" aria-hidden="true">
            <div className="nx-emblem-ring">
              <span>✦</span>
            </div>

            <span className="nx-emblem-caption">NEXORA</span>
          </div>
        </section>

        <section className="nx-level-card">
          <div className="nx-level-top">
            <div className="nx-level-icon">⚡</div>

            <div className="nx-level-details">
              <span className="nx-label">CURRENT RANK</span>
              <h2>{rank}</h2>
              <p>Level {level} adventurer</p>
            </div>

            <div className="nx-xp-total">
              <span>TOTAL EXPERIENCE</span>
              <strong>{totalXP.toLocaleString()} XP</strong>
            </div>
          </div>

          <div className="nx-level-progress-heading">
            <span>Level progress</span>

            <strong>
              {level === 10
                ? "MAX LEVEL"
                : `${xpInCurrentLevel} / 100 XP`}
            </strong>
          </div>

          <div className="nx-progress-track nx-level-track">
            <div
              className="nx-progress-fill nx-xp-fill"
              style={{ width: `${xpInCurrentLevel}%` }}
            />
          </div>

          <p className="nx-level-hint">
            {level === 10
              ? "You've reached Nexora Prime. Keep building your streak!"
              : `${100 - xpInCurrentLevel} XP to reach the next level.`}
          </p>
        </section>

        <section className="nx-stats-grid">
          <article className="nx-stat-card">
            <div className="nx-stat-icon purple">🎯</div>
            <span>Daily missions</span>

            <strong>
              {completedMissions}
              <small> / {missions.length}</small>
            </strong>

            <p>{missionProgress}% completed</p>
          </article>

          <article className="nx-stat-card">
            <div className="nx-stat-icon orange">🔥</div>
            <span>Current streak</span>

            <strong>
              {streak}
              <small> days</small>
            </strong>

            <p>Best: {bestStreak} days</p>
          </article>

          <article className="nx-stat-card">
            <div className="nx-stat-icon green">🏆</div>
            <span>Bonus challenges</span>

            <strong>
              {completedChallenges}
              <small> / {challenges.length}</small>
            </strong>

            <p>{challengeProgress}% completed</p>
          </article>

          <article className="nx-stat-card">
            <div className="nx-stat-icon blue">✨</div>
            <span>Total experience</span>

            <strong>{totalXP.toLocaleString()}</strong>

            <p>XP earned so far</p>
          </article>
        </section>

        {/* Goals created on the Goals page */}
        <section className="nx-section nx-my-goals">
          <div className="nx-section-heading">
            <div>
              <span className="nx-eyebrow">YOUR PERSONAL TARGETS</span>
              <h2>My Goals</h2>
              <p>Goals created on your Goals page appear here.</p>
            </div>

            <div className="nx-section-count">
              {completedGoals}/{goals.length} COMPLETED
            </div>
          </div>

          {goalsLoading && (
            <div className="nx-goals-message">
              Loading your goals...
            </div>
          )}

          {!goalsLoading && goalError && (
            <div className="nx-goals-message nx-goals-error">
              <p>{goalError}</p>

              <button
                className="nx-goal-retry"
                onClick={loadDashboardGoals}
              >
                Try again
              </button>
            </div>
          )}

          {!goalsLoading && !goalError && goals.length === 0 && (
            <div className="nx-goals-message">
              <span>🎯</span>
              <h3>No goals yet</h3>
              <p>Create your first goal on the Goals page to see it here.</p>
            </div>
          )}

          {!goalsLoading && goals.length > 0 && (
            <div className="nx-dashboard-goals-grid">
              {goals.map((goal) => {
                const progress = getGoalProgress(goal);
                const completed = goal.completedDays >= goal.targetDays;
                const todayTasks = getTodayTasks(goal);

                return (
                  <article className="nx-dashboard-goal-card" key={goal.id}>
                    <div className="nx-dashboard-goal-top">
                      <span className="nx-dashboard-goal-icon">
                        {goal.icon || "🎯"}
                      </span>

                      <span
                        className={
                          completed
                            ? "nx-dashboard-goal-status done"
                            : "nx-dashboard-goal-status"
                        }
                      >
                        {completed ? "Completed" : "In progress"}
                      </span>
                    </div>

                    <h3>{goal.title}</h3>

                    <p className="nx-dashboard-goal-description">
                      {goal.description || "Keep making progress every day."}
                    </p>

                    <div className="nx-dashboard-goal-progress-heading">
                      <span>Progress</span>
                      <strong>{progress}%</strong>
                    </div>

                    <div className="nx-progress-track">
                      <div
                        className="nx-progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="nx-dashboard-goal-meta">
                      <span>
                        📅 {goal.completedDays}/{goal.targetDays} days
                      </span>

                      <span>⚡ {goal.xp} XP/day</span>
                    </div>

                    <div className="nx-dashboard-goal-tasks">
                      <h4>Today's tasks</h4>

                      {goal.tasks.map((task) => {
                        const checked = todayTasks.includes(task.id);

                        return (
                          <label
                            className={`nx-dashboard-task ${
                              checked ? "checked" : ""
                            }`}
                            key={task.id}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={completed}
                              onChange={() =>
                                handleGoalTaskToggle(goal.id, task.id)
                              }
                            />

                            <span>{task.title}</span>
                          </label>
                        );
                      })}
                    </div>

                    {completed && (
                      <div className="nx-dashboard-goal-finished">
                        🏆 Goal accomplished!
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="nx-section nx-study-reminder-section">
          <StudyReminder />
        </section>

        {notice && (
          <div className="nx-toast" role="status">
            <span>✓</span> {notice}
          </div>
        )}

        <section className="nx-section">
          <div className="nx-section-heading">
            <div>
              <span className="nx-eyebrow">BUILD YOUR HABITS</span>
              <h2>Today's Missions</h2>
              <p>Consistency beats intensity. Complete your daily goals.</p>
            </div>

            <div className="nx-section-count">
              {completedMissions}/{missions.length} DONE
            </div>
          </div>

          <div className="nx-mission-list">
            {missions.map((mission) => (
              <button
                type="button"
                key={mission.id}
                className={`nx-mission-card ${
                  mission.completed ? "is-completed" : ""
                }`}
                onClick={() => handleMissionComplete(mission.id)}
                aria-pressed={mission.completed}
              >
                <span className="nx-mission-icon">
                  {mission.icon || "✦"}
                </span>

                <span className="nx-mission-copy">
                  <strong>{mission.title}</strong>
                  <small>{mission.description}</small>
                </span>

                <span className="nx-mission-reward">
                  {mission.completed
                    ? "✓ Completed"
                    : `+${mission.xp} XP`}
                </span>

                <span className="nx-mission-check">
                  {mission.completed ? "✓" : ""}
                </span>
              </button>
            ))}
          </div>

          <div className="nx-section-progress">
            <div className="nx-section-progress-heading">
              <span>Daily progress</span>
              <strong>{missionProgress}%</strong>
            </div>

            <div className="nx-progress-track">
              <div
                className="nx-progress-fill"
                style={{ width: `${missionProgress}%` }}
              />
            </div>
          </div>
        </section>

        <section className="nx-section nx-challenge-section">
          <div className="nx-section-heading">
            <div>
              <span className="nx-eyebrow">GO BEYOND THE ORDINARY</span>
              <h2>Bonus Challenges</h2>
              <p>Take on bigger goals and earn extra experience.</p>
            </div>

            <div className="nx-challenge-symbol">✧</div>
          </div>

          <BonusChallenges
            challenges={challenges}
            onComplete={handleChallengeComplete}
          />

          <div className="nx-section-progress">
            <div className="nx-section-progress-heading">
              <span>Challenge progress</span>
              <strong>{challengeProgress}%</strong>
            </div>

            <div className="nx-progress-track">
              <div
                className="nx-progress-fill nx-challenge-fill"
                style={{ width: `${challengeProgress}%` }}
              />
            </div>
          </div>
        </section>

        <section className="nx-quote-card">
          <span className="nx-quote-mark">“</span>

          <div>
            <span className="nx-eyebrow">YOUR DAILY REMINDER</span>
            <h3>Become 1% better every day.</h3>
            <p>
              You don't have to be perfect. You just have to keep showing up.
            </p>
          </div>

          <span className="nx-quote-star">✦</span>
        </section>

        <footer className="nx-dashboard-footer">
          <span>✦ NEXORA</span>
          <p>Your journey. Your progress. Your next level.</p>
        </footer>

        {showLevelUp && (
          <div className="nx-modal-overlay">
            <section
              className="nx-level-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="nx-level-modal-title"
            >
              <div className="nx-modal-symbol">⚡</div>

              <span className="nx-eyebrow">ACHIEVEMENT UNLOCKED</span>

              <h2 id="nx-level-modal-title">LEVEL UP!</h2>

              <p className="nx-modal-level">LEVEL {level}</p>

              <h3>{rank}</h3>

              <p>Your hard work is paying off. Keep moving forward!</p>

              <button
                type="button"
                className="nx-continue-button"
                onClick={() => setShowLevelUp(false)}
                autoFocus
              >
                CONTINUE YOUR JOURNEY →
              </button>
            </section>
          </div>
        )}
      </main>
    </>
  );
}

export default Dashboard;