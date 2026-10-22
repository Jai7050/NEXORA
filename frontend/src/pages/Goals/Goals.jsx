import { useEffect, useMemo, useState } from "react";
import "./Goals.css";
import Navbar from "../../components/Navbar";

import {
  fetchGoals,
  createGoal,
  deleteGoal,
  toggleGoalTask,
} from "../../api/goalsApi";

const EMOJIS = [
  "🎯", "📚", "💻", "🏋️", "🧘",
  "💧", "🚀", "🎨", "💰", "🌱",
  "🏃", "🎵", "🧠", "✍️", "⭐",
];

const DEFAULT_GOAL = {
  title: "",
  description: "",
  targetDays: 15,
  xp: 10,
  icon: "🎯",
  tasksText: "",
};

function getLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getPreviousDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() - 1);

  return getLocalDate(date);
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
            ? {
                id: `${goal.id}-task-${index}`,
                title: task,
              }
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

function getProgress(goal) {
  return Math.min(
    100,
    Math.round(
      (goal.completedDays / Math.max(1, goal.targetDays)) * 100
    )
  );
}

function getTodayTasks(goal) {
  return goal.dailyCompletions?.[getLocalDate()] || [];
}

function isTodayComplete(goal) {
  if (!goal.tasks?.length) {
    return false;
  }

  const completedTasks = getTodayTasks(goal);

  return goal.tasks.every((task) =>
    completedTasks.includes(task.id)
  );
}

function getGoalStreak(goal) {
  if (!goal.tasks?.length) {
    return 0;
  }

  let date = getLocalDate();
  let streak = 0;

  if (!isTodayComplete(goal)) {
    date = getPreviousDate(date);
  }

  while (true) {
    const completedTasks = goal.dailyCompletions?.[date] || [];

    const complete = goal.tasks.every((task) =>
      completedTasks.includes(task.id)
    );

    if (!complete) {
      break;
    }

    streak++;
    date = getPreviousDate(date);
  }

  return streak;
}

function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [newGoal, setNewGoal] = useState({
    ...DEFAULT_GOAL,
  });

  function showNotice(message) {
    setNotice(message);

    window.setTimeout(() => {
      setNotice((current) =>
        current === message ? "" : current
      );
    }, 3000);
  }

  async function loadGoals() {
    try {
      setLoading(true);

      const data = await fetchGoals();

      if (!Array.isArray(data)) {
        throw new Error("Invalid goals response from server.");
      }

      setGoals(data.map(normalizeGoal));
    } catch (error) {
      showNotice(error.message || "Could not load goals.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGoals();
  }, []);

  const stats = useMemo(() => {
    const completed = goals.filter(
      (goal) => goal.completedDays >= goal.targetDays
    ).length;

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
        goal.title?.toLowerCase().includes(query) ||
        goal.description?.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [goals, filter, search]);

  function updateNewGoal(field, value) {
    setNewGoal((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleAddGoal(event) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const title = newGoal.title.trim();
    const targetDays = Number(newGoal.targetDays);
    const xp = Number(newGoal.xp);

    if (!title) {
      showNotice("Please enter a goal title.");
      return;
    }

    if (!Number.isInteger(targetDays) || targetDays < 1 || targetDays > 365) {
      showNotice("Duration must be between 1 and 365 days.");
      return;
    }

    if (!Number.isInteger(xp) || xp < 1 || xp > 1000) {
      showNotice("XP must be between 1 and 1000.");
      return;
    }

    const taskTitles = newGoal.tasksText
      .split("\n")
      .map((task) => task.trim())
      .filter(Boolean);

    if (!taskTitles.length) {
      showNotice("Please enter at least one daily task.");
      return;
    }

    if (taskTitles.length > 50) {
      showNotice("You can add a maximum of 50 tasks.");
      return;
    }

    const payload = {
      title,
      description: newGoal.description.trim(),
      targetDays,
      xp,
      icon: newGoal.icon,
      tasks: taskTitles.map((title) => ({ title })),
    };

    try {
      setSaving(true);

      const savedGoal = await createGoal(payload);

      if (!savedGoal?.id) {
        throw new Error("Server did not return the saved goal.");
      }

      setGoals((current) => [
        normalizeGoal(savedGoal),
        ...current,
      ]);

      setNewGoal({ ...DEFAULT_GOAL });
      setShowModal(false);

      showNotice("Goal created successfully!");
    } catch (error) {
      showNotice(error.message || "Failed to create goal.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleTask(goalId, taskId) {
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

      if (response.xpAwarded) {
        showNotice(`Amazing! You earned ${response.xpEarned} XP!`);
      } else {
        showNotice("Task updated successfully.");
      }
    } catch (error) {
      showNotice(error.message || "Could not update task.");
    }
  }

  async function handleDeleteGoal(goal) {
    if (!window.confirm(`Delete "${goal.title}"?`)) {
      return;
    }

    try {
      await deleteGoal(goal.id);

      setGoals((current) =>
        current.filter((item) => item.id !== goal.id)
      );

      showNotice("Goal deleted successfully.");
    } catch (error) {
      showNotice(error.message || "Could not delete goal.");
    }
  }

  function closeModal() {
    setShowModal(false);
    setNewGoal({ ...DEFAULT_GOAL });
  }

  return (
    <>
      <Navbar />

      <main className="ng-page">
        <section className="ng-hero">
          <div className="ng-hero-content">
            <span className="ng-eyebrow">
              YOUR PERSONAL GROWTH JOURNEY
            </span>

            <h1>
              Dream it.
              <br />
              <span>Set a goal.</span> Achieve it.
            </h1>

            <p>
              Build better habits, complete daily tasks, and
              track your personal growth.
            </p>

            <button
              className="ng-primary-button"
              onClick={() => setShowModal(true)}
            >
              + Create a goal
            </button>
          </div>

          <div className="ng-hero-visual">
            <div className="ng-hero-glow">🎯</div>

            <div className="ng-float-card">
              <span>⚡</span>
              <div>
                <strong>{stats.totalXP} XP</strong>
                <small>Progress earned</small>
              </div>
            </div>
          </div>
        </section>

        <section className="ng-stats">
          <article className="ng-stat-card">
            <span>🎯 Total goals</span>
            <strong>{stats.total}</strong>
          </article>

          <article className="ng-stat-card">
            <span>🚀 Active goals</span>
            <strong>{stats.active}</strong>
          </article>

          <article className="ng-stat-card">
            <span>🏆 Completed</span>
            <strong>{stats.completed}</strong>
          </article>

          <article className="ng-stat-card">
            <span>✨ Overall progress</span>
            <strong>{stats.averageProgress}%</strong>
          </article>
        </section>

        <section className="ng-goals-section">
          <div className="ng-section-heading">
            <div>
              <span className="ng-eyebrow">MAKE IT HAPPEN</span>
              <h2>My goals</h2>
              <p>Your daily efforts build your future.</p>
            </div>

            <button
              className="ng-primary-button"
              onClick={() => setShowModal(true)}
            >
              + Add goal
            </button>
          </div>

          {!loading && goals.length > 0 && (
            <div className="ng-toolbar">
              <input
                className="ng-search"
                type="search"
                placeholder="Search goals..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              <div className="ng-filters">
                {[
                  ["all", "All"],
                  ["active", "Active"],
                  ["completed", "Completed"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    className={filter === value ? "active" : ""}
                    onClick={() => setFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="ng-empty">
              <h3>Loading your goals...</h3>
            </div>
          )}

          {!loading && goals.length === 0 && (
            <div className="ng-empty">
              <span className="ng-empty-icon">🌱</span>
              <h3>Your journey starts here!</h3>
              <p>Create your first goal and start making progress.</p>

              <button
                className="ng-primary-button"
                onClick={() => setShowModal(true)}
              >
                Create your first goal
              </button>
            </div>
          )}

          {!loading && goals.length > 0 && filteredGoals.length === 0 && (
            <div className="ng-empty">
              <h3>No goals found</h3>

              <button
                className="ng-secondary-button"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
              >
                Clear filters
              </button>
            </div>
          )}

          {!loading && filteredGoals.length > 0 && (
            <div className="ng-goals-grid">
              {filteredGoals.map((goal) => {
                const completed = goal.completedDays >= goal.targetDays;
                const progress = getProgress(goal);
                const todayTasks = getTodayTasks(goal);

                return (
                  <article className="ng-goal-card" key={goal.id}>
                    <div className="ng-goal-card-top">
                      <span className="ng-goal-icon">
                        {goal.icon || "🎯"}
                      </span>

                      <button
                        className="ng-delete-button"
                        onClick={() => handleDeleteGoal(goal)}
                        aria-label={`Delete ${goal.title}`}
                      >
                        ×
                      </button>
                    </div>

                    <h3>{goal.title}</h3>

                    <p className="ng-goal-description">
                      {goal.description || "Keep making progress every day."}
                    </p>

                    <div className="ng-status-row">
                      <span className={completed ? "ng-status ng-status-done" : "ng-status ng-status-active"}>
                        {completed ? "✓ Completed" : "● In progress"}
                      </span>

                      <span className="ng-streak">
                        🔥 {getGoalStreak(goal)} day streak
                      </span>
                    </div>

                    <div className="ng-goal-progress-heading">
                      <span>Overall progress</span>
                      <strong>{progress}%</strong>
                    </div>

                    <div className="ng-progress-track">
                      <div
                        className="ng-progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="ng-goal-metrics">
                      <div>
                        <span>COMPLETED DAYS</span>
                        <strong>
                          {goal.completedDays}/{goal.targetDays}
                        </strong>
                      </div>

                      <div>
                        <span>XP PER DAY</span>
                        <strong>⚡ {goal.xp}</strong>
                      </div>
                    </div>

                    <div className="ng-daily-tasks">
                      <h4>Today's tasks</h4>

                      {goal.tasks.map((task) => {
                        const checked = todayTasks.includes(task.id);

                        return (
                          <label
                            key={task.id}
                            className={`ng-task ${checked ? "ng-task-completed" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={completed}
                              onChange={() =>
                                handleToggleTask(goal.id, task.id)
                              }
                            />

                            <span>{task.title}</span>
                          </label>
                        );
                      })}

                      {isTodayComplete(goal) && (
                        <p className="ng-success-message">
                          🎉 All tasks completed today!
                        </p>
                      )}
                    </div>

                    {completed && (
                      <div className="ng-finished-banner">
                        🏆 Goal accomplished!
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="ng-motivation">
          <span>✦</span>
          <div>
            <h3>Progress, not perfection.</h3>
            <p>One small step every day makes a big difference.</p>
          </div>
        </section>

        <footer className="ng-footer">
          <span>✦ NEXORA</span>
          <p>Build better habits. Create your future.</p>
        </footer>

        {showModal && (
          <div className="ng-modal-overlay">
            <section className="ng-modal" role="dialog" aria-modal="true">
              <div className="ng-modal-heading">
                <div>
                  <span className="ng-eyebrow">START SOMETHING GREAT</span>
                  <h2>Create a goal</h2>
                  <p>Define your goal and daily tasks.</p>
                </div>

                <button
                  className="ng-modal-close"
                  type="button"
                  onClick={closeModal}
                >
                  ×
                </button>
              </div>

              <form className="ng-goal-form" onSubmit={handleAddGoal}>
                <label htmlFor="ng-title">Goal title *</label>

                <input
                  id="ng-title"
                  value={newGoal.title}
                  maxLength={80}
                  onChange={(event) =>
                    updateNewGoal("title", event.target.value)
                  }
                  placeholder="e.g. Master Java programming"
                  required
                />

                <label htmlFor="ng-description">Description</label>

                <textarea
                  id="ng-description"
                  value={newGoal.description}
                  maxLength={250}
                  onChange={(event) =>
                    updateNewGoal("description", event.target.value)
                  }
                  placeholder="What do you want to accomplish?"
                  rows={3}
                />

                <label>Choose an icon</label>

                <div className="ng-emoji-picker">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className={newGoal.icon === emoji ? "selected" : ""}
                      onClick={() => updateNewGoal("icon", emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div className="ng-form-row">
                  <div>
                    <label htmlFor="ng-days">Duration (days) *</label>

                    <input
                      id="ng-days"
                      type="number"
                      min="1"
                      max="365"
                      value={newGoal.targetDays}
                      onChange={(event) =>
                        updateNewGoal("targetDays", event.target.value)
                      }
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="ng-xp">XP per day *</label>

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
                  </div>
                </div>

                <label htmlFor="ng-tasks">Daily tasks *</label>

                <textarea
                  id="ng-tasks"
                  rows={5}
                  value={newGoal.tasksText}
                  onChange={(event) =>
                    updateNewGoal("tasksText", event.target.value)
                  }
                  placeholder={"Enter one task per line:\nPractice Java arrays\nSolve 3 coding questions\nRevise OOP"}
                  required
                />

                <small className="ng-field-hint">
                  Enter one task per line. Tasks repeat every day.
                </small>

                <div className="ng-modal-preview">
                  <span>{newGoal.icon}</span>
                  <div>
                    <strong>{newGoal.title.trim() || "Your new goal"}</strong>
                    <small>
                      {newGoal.targetDays} days · {newGoal.xp} XP per day
                    </small>
                  </div>
                </div>

                <button
                  type="submit"
                  className="ng-primary-button ng-submit"
                  disabled={saving}
                >
                  {saving ? "Creating..." : "Create my goal →"}
                </button>

                <button
                  type="button"
                  className="ng-cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>
              </form>
            </section>
          </div>
        )}

        {notice && (
          <div className="ng-toast" role="status">
            ✓ {notice}
          </div>
        )}
      </main>
    </>
  );
}

export default Goals;