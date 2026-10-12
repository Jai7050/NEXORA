import { useEffect, useMemo, useState } from "react";
import "./Goals.css";
import Navbar from "../../components/Navbar";
import { addXP } from "../../utils/xpSystem";

const GOALS_KEY = "nexora_goals";

const EMOJIS = [
  "🎯", "📚", "💻", "🏋️", "🧘",
  "💧", "🚀", "🎨", "💰", "🌱",
  "🏃", "🎵", "🧠", "✍️", "⭐",
];

const DEFAULT_GOAL = {
  title: "",
  description: "",
  targetDays: 30,
  xp: 10,
  icon: "🎯",
};

function getLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function readGoals() {
  try {
    const saved = JSON.parse(localStorage.getItem(GOALS_KEY) || "[]");

    if (!Array.isArray(saved)) return [];

    return saved.map((goal) => ({
      ...goal,
      targetDays: Math.max(1, Number(goal.targetDays) || 1),
      completedDays: Math.max(0, Number(goal.completedDays) || 0),
      xp: Math.max(1, Number(goal.xp) || 10),
      completedDates: Array.isArray(goal.completedDates)
        ? goal.completedDates
        : [],
    }));
  } catch {
    return [];
  }
}

function getProgress(goal) {
  const target = Math.max(1, Number(goal.targetDays) || 1);
  const completed = Math.min(
    target,
    Math.max(0, Number(goal.completedDays) || 0)
  );

  return Math.round((completed / target) * 100);
}

function Goals() {
  const [goals, setGoals] = useState(readGoals);

  const [showModal, setShowModal] = useState(false);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [newGoal, setNewGoal] = useState({ ...DEFAULT_GOAL });

  useEffect(() => {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  }, [goals]);

  const stats = useMemo(() => {
    const completed = goals.filter(
      (goal) => goal.completedDays >= goal.targetDays
    ).length;

    const totalDays = goals.reduce(
      (sum, goal) => sum + goal.completedDays,
      0
    );

    const totalXP = goals.reduce(
      (sum, goal) => sum + goal.completedDays * goal.xp,
      0
    );

    const averageProgress = goals.length
      ? Math.round(
          goals.reduce((sum, goal) => sum + getProgress(goal), 0) /
            goals.length
        )
      : 0;

    return {
      total: goals.length,
      completed,
      active: goals.length - completed,
      totalDays,
      totalXP,
      averageProgress,
    };
  }, [goals]);

  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      const completed = goal.completedDays >= goal.targetDays;

      const matchesFilter =
        filter === "all" ||
        (filter === "active" && !completed) ||
        (filter === "completed" && completed);

      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        goal.title.toLowerCase().includes(query) ||
        goal.description.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [goals, filter, search]);

  const updateNewGoal = (field, value) => {
    setNewGoal((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  };

  const handleAddGoal = (event) => {
    event.preventDefault();

    const title = newGoal.title.trim();

    if (!title) {
      showNotice("Please enter a goal title.");
      return;
    }

    const targetDays = Number(newGoal.targetDays);
    const xp = Number(newGoal.xp);

    if (!Number.isInteger(targetDays) || targetDays < 1 || targetDays > 365) {
      showNotice("Target days must be between 1 and 365.");
      return;
    }

    if (!Number.isInteger(xp) || xp < 1 || xp > 1000) {
      showNotice("XP per day must be between 1 and 1000.");
      return;
    }

    const goal = {
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
      title,
      description:
        newGoal.description.trim() ||
        "Make consistent progress towards your personal growth.",
      targetDays,
      completedDays: 0,
      xp,
      icon: newGoal.icon || "🎯",
      completedDates: [],
      createdAt: new Date().toISOString(),
    };

    setGoals((current) => [goal, ...current]);
    setNewGoal({ ...DEFAULT_GOAL });
    setShowModal(false);

    showNotice("Your new goal has been created!");
  };

  const handleCompleteDay = (goalId) => {
    const goal = goals.find((item) => item.id === goalId);

    if (!goal) return;

    const today = getLocalDate();

    if (goal.completedDates.includes(today)) {
      showNotice("You've already completed this goal today.");
      return;
    }

    if (goal.completedDays >= goal.targetDays) {
      showNotice("This goal is already completed!");
      return;
    }

    // Award XP once when the user completes today's goal.
    addXP(goal.xp);

    setGoals((current) =>
      current.map((item) => {
        if (item.id !== goalId) return item;

        const dates = Array.isArray(item.completedDates)
          ? item.completedDates
          : [];

        // Prevent duplicate completion for the same day.
        if (dates.includes(today)) return item;

        return {
          ...item,
          completedDays: Math.min(
            item.completedDays + 1,
            item.targetDays
          ),
          completedDates: [...dates, today],
        };
      })
    );

    showNotice(`Great work! You earned +${goal.xp} XP.`);
  };

  const handleDeleteGoal = (goalId) => {
    const goal = goals.find((item) => item.id === goalId);

    if (!goal) return;

    const confirmed = window.confirm(
      `Delete "${goal.title}"? Your previously earned XP will remain.`
    );

    if (!confirmed) return;

    setGoals((current) => current.filter((item) => item.id !== goalId));

    showNotice("Goal deleted successfully.");
  };

  const closeModal = () => {
    setShowModal(false);
    setNewGoal({ ...DEFAULT_GOAL });
  };

  return (
    <>
      <Navbar />

      <main className="ng-page">
        {/* Hero */}
        <section className="ng-hero">
          <div className="ng-hero-content">
            <span className="ng-eyebrow">
              <span className="ng-eyebrow-dot" />
              YOUR PERSONAL GROWTH JOURNEY
            </span>

            <h1>
              Dream it.
              <br />
              <span>Set a goal.</span> Achieve it.
            </h1>

            <p>
              Big achievements begin with small daily actions.
              Build your habits, earn XP, and become your best self.
            </p>

            <button
              type="button"
              className="ng-primary-button"
              onClick={() => setShowModal(true)}
            >
              <span>＋</span> Create a goal
            </button>
          </div>

          <div className="ng-hero-visual" aria-hidden="true">
            <div className="ng-orbit ng-orbit-one" />
            <div className="ng-orbit ng-orbit-two" />

            <div className="ng-hero-glow">
              <span>🎯</span>
            </div>

            <div className="ng-float-card ng-float-top">
              <span>⚡</span>
              <div>
                <strong>Stay consistent</strong>
                <small>One day at a time</small>
              </div>
            </div>

            <div className="ng-float-card ng-float-bottom">
              <span>✦</span>
              <div>
                <strong>{stats.totalXP} XP</strong>
                <small>Progress earned</small>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="ng-stats">
          <article className="ng-stat-card">
            <div className="ng-stat-icon ng-purple">🎯</div>
            <span>Total goals</span>
            <strong>{stats.total}</strong>
            <small>Your ambitions, organized</small>
          </article>

          <article className="ng-stat-card">
            <div className="ng-stat-icon ng-blue">🚀</div>
            <span>Active goals</span>
            <strong>{stats.active}</strong>
            <small>Goals in progress</small>
          </article>

          <article className="ng-stat-card">
            <div className="ng-stat-icon ng-green">🏆</div>
            <span>Completed</span>
            <strong>{stats.completed}</strong>
            <small>Milestones achieved</small>
          </article>

          <article className="ng-stat-card">
            <div className="ng-stat-icon ng-orange">⚡</div>
            <span>Days completed</span>
            <strong>{stats.totalDays}</strong>
            <small>Actions that add up</small>
          </article>
        </section>

        {/* Overall progress */}
        {goals.length > 0 && (
          <section className="ng-overview">
            <div className="ng-overview-icon">✦</div>

            <div className="ng-overview-content">
              <div className="ng-overview-heading">
                <div>
                  <span className="ng-eyebrow">YOUR BIG PICTURE</span>
                  <h2>Progress overview</h2>
                </div>

                <strong>{stats.averageProgress}%</strong>
              </div>

              <div
                className="ng-progress-track ng-overall-track"
                role="progressbar"
                aria-label="Average goal progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={stats.averageProgress}
              >
                <div
                  className="ng-progress-fill"
                  style={{ width: `${stats.averageProgress}%` }}
                />
              </div>

              <p>
                {stats.averageProgress === 100
                  ? "Amazing! All your goals are complete."
                  : "Every completed day takes you one step closer to your goals."}
              </p>
            </div>
          </section>
        )}

        {/* Goals section */}
        <section className="ng-goals-section">
          <div className="ng-section-heading">
            <div>
              <span className="ng-eyebrow">MAKE IT HAPPEN</span>
              <h2>My goals</h2>
              <p>Small steps today. Big results tomorrow.</p>
            </div>

            <span className="ng-goal-count">
              {goals.length} {goals.length === 1 ? "GOAL" : "GOALS"}
            </span>
          </div>

          {goals.length > 0 && (
            <div className="ng-toolbar">
              <label className="ng-search">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  placeholder="Search your goals..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search goals"
                />
              </label>

              <div className="ng-filters" aria-label="Filter goals">
                {[
                  ["all", "All goals"],
                  ["active", "In progress"],
                  ["completed", "Completed"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={filter === value ? "active" : ""}
                    onClick={() => setFilter(value)}
                    aria-pressed={filter === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {goals.length === 0 && (
            <div className="ng-empty">
              <div className="ng-empty-art">
                <span>🎯</span>
                <i>✦</i>
              </div>

              <span className="ng-eyebrow">A FRESH START</span>
              <h3>Your next chapter starts here.</h3>

              <p>
                Create your first goal, build a daily routine,
                and celebrate every little win.
              </p>

              <button
                type="button"
                className="ng-primary-button"
                onClick={() => setShowModal(true)}
              >
                ＋ Create your first goal
              </button>
            </div>
          )}

          {/* No filter results */}
          {goals.length > 0 && filteredGoals.length === 0 && (
            <div className="ng-no-results">
              <span>🔎</span>
              <h3>No goals found</h3>
              <p>Try another search or choose a different filter.</p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Goal cards */}
          {filteredGoals.length > 0 && (
            <div className="ng-goals-grid">
              {filteredGoals.map((goal) => {
                const progress = getProgress(goal);
                const completed = progress === 100;
                const completedToday = goal.completedDates.includes(
                  getLocalDate()
                );

                return (
                  <article
                    className={`ng-goal-card ${
                      completed ? "ng-goal-finished" : ""
                    }`}
                    key={goal.id}
                  >
                    <div className="ng-goal-card-top">
                      <div className="ng-goal-icon">{goal.icon || "🎯"}</div>

                      <div className="ng-goal-top-right">
                        {completed ? (
                          <span className="ng-status ng-status-done">
                            ✓ Completed
                          </span>
                        ) : (
                          <span className="ng-status ng-status-active">
                            ● In progress
                          </span>
                        )}

                        <button
                          type="button"
                          className="ng-delete-button"
                          onClick={() => handleDeleteGoal(goal.id)}
                          aria-label={`Delete ${goal.title}`}
                          title="Delete goal"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <h3>{goal.title}</h3>

                    <p className="ng-goal-description">
                      {goal.description}
                    </p>

                    <div className="ng-goal-progress-heading">
                      <span>Overall progress</span>
                      <strong>{progress}%</strong>
                    </div>

                    <div
                      className="ng-progress-track"
                      role="progressbar"
                      aria-label={`${goal.title} progress`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={progress}
                    >
                      <div
                        className="ng-progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="ng-goal-metrics">
                      <div>
                        <span>COMPLETED DAYS</span>
                        <strong>
                          {goal.completedDays}
                          <small> / {goal.targetDays}</small>
                        </strong>
                      </div>

                      <div>
                        <span>XP PER DAY</span>
                        <strong className="ng-reward">
                          ⚡ {goal.xp}
                        </strong>
                      </div>
                    </div>

                    <div className="ng-goal-footer">
                      {completed ? (
                        <div className="ng-finished-banner">
                          <span>🏆</span>
                          <div>
                            <strong>Goal accomplished!</strong>
                            <small>You made it happen.</small>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="ng-complete-button"
                          onClick={() => handleCompleteDay(goal.id)}
                          disabled={completedToday}
                        >
                          {completedToday
                            ? "✓ Completed today"
                            : "＋ Complete today's goal"}
                        </button>
                      )}

                      <span className="ng-reward-pill">
                        +{goal.xp} XP
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Motivation card */}
        <section className="ng-motivation">
          <div className="ng-motivation-symbol">✧</div>

          <div>
            <span className="ng-eyebrow">A LITTLE REMINDER</span>
            <h3>Progress, not perfection.</h3>
            <p>
              You don't need to do everything today.
              Just do one thing that moves you forward.
            </p>
          </div>

          <div className="ng-motivation-decoration">✦</div>
        </section>

        <footer className="ng-footer">
          <span>✦ NEXORA</span>
          <p>Build better habits. Create your future.</p>
        </footer>

        {/* Create goal modal */}
        {showModal && (
          <div
            className="ng-modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeModal();
            }}
          >
            <section
              className="ng-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="ng-modal-title"
            >
              <div className="ng-modal-heading">
                <div>
                  <span className="ng-eyebrow">START SOMETHING GREAT</span>
                  <h2 id="ng-modal-title">Create a goal</h2>
                  <p>Define your goal and make a plan to achieve it.</p>
                </div>

                <button
                  type="button"
                  className="ng-modal-close"
                  onClick={closeModal}
                  aria-label="Close dialog"
                >
                  ×
                </button>
              </div>

              <form className="ng-goal-form" onSubmit={handleAddGoal}>
                <label htmlFor="ng-goal-title">Goal title *</label>

                <input
                  id="ng-goal-title"
                  type="text"
                  placeholder="e.g. Master Java programming"
                  maxLength={80}
                  value={newGoal.title}
                  onChange={(event) =>
                    updateNewGoal("title", event.target.value)
                  }
                  required
                  autoFocus
                />

                <label htmlFor="ng-goal-description">
                  Description
                </label>

                <textarea
                  id="ng-goal-description"
                  placeholder="What do you want to accomplish?"
                  maxLength={250}
                  rows={3}
                  value={newGoal.description}
                  onChange={(event) =>
                    updateNewGoal("description", event.target.value)
                  }
                />

                <label>Choose an icon</label>

                <div className="ng-emoji-picker">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className={
                        newGoal.icon === emoji ? "selected" : ""
                      }
                      onClick={() => updateNewGoal("icon", emoji)}
                      aria-label={`Choose ${emoji} icon`}
                      aria-pressed={newGoal.icon === emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div className="ng-form-row">
                  <div>
                    <label htmlFor="ng-target-days">Target days</label>

                    <input
                      id="ng-target-days"
                      type="number"
                      min="1"
                      max="365"
                      value={newGoal.targetDays}
                      onChange={(event) =>
                        updateNewGoal("targetDays", event.target.value)
                      }
                      required
                    />

                    <small>How many days to complete?</small>
                  </div>

                  <div>
                    <label htmlFor="ng-xp">XP per day</label>

                    <input
                      id="ng-xp"
                      type="number"
                      min="1"
                      max="1000"
                      value={newGoal.xp}
                      onChange={(event) =>
                        updateNewGoal("xp", event.target.value)
                      }
                      required
                    />

                    <small>Reward for daily progress</small>
                  </div>
                </div>

                <div className="ng-modal-preview">
                  <span>{newGoal.icon}</span>
                  <div>
                    <strong>{newGoal.title.trim() || "Your new goal"}</strong>
                    <small>
                      {newGoal.targetDays || 0} days · {newGoal.xp || 0} XP
                      per day
                    </small>
                  </div>
                </div>

                <button type="submit" className="ng-primary-button ng-submit">
                  Create my goal <span>→</span>
                </button>

                <button
                  type="button"
                  className="ng-cancel-button"
                  onClick={closeModal}
                >
                  Cancel
                </button>
              </form>
            </section>
          </div>
        )}

        {notice && (
          <div className="ng-toast" role="status">
            <span>✓</span>
            {notice}
          </div>
        )}
      </main>
    </>
  );
}

export default Goals;