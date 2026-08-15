import { useEffect, useState } from "react";
import "./Goals.css";
import { addXP, removeXP } from "../../utils/xpSystem";

const GOALS_KEY = "nexora_goals";

function Goals() {
  const [goals, setGoals] = useState(() => {
    const savedGoals = localStorage.getItem(GOALS_KEY);

    if (!savedGoals) {
      return [];
    }

    try {
      return JSON.parse(savedGoals);
    } catch {
      return [];
    }
  });

  const [showModal, setShowModal] = useState(false);

  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    targetDays: 10,
    xp: 10,
    icon: "🎯",
  });

  // Save goals
  useEffect(() => {
    localStorage.setItem(
      GOALS_KEY,
      JSON.stringify(goals)
    );
  }, [goals]);

  // =============================
  // CREATE GOAL
  // =============================

  const handleAddGoal = () => {
    if (!newGoal.title.trim()) {
      alert("Please enter a goal title.");
      return;
    }

    const goal = {
      id: Date.now(),
      title: newGoal.title.trim(),
      description:
        newGoal.description.trim() ||
        "Work towards your personal growth goal.",
      targetDays: Math.max(
        1,
        Number(newGoal.targetDays) || 1
      ),
      completedDays: 0,
      xp: Math.max(
        1,
        Number(newGoal.xp) || 10
      ),
      icon: newGoal.icon || "🎯",
      completedDates: [],
    };

    setGoals((currentGoals) => [
      ...currentGoals,
      goal,
    ]);

    setNewGoal({
      title: "",
      description: "",
      targetDays: 10,
      xp: 10,
      icon: "🎯",
    });

    setShowModal(false);
  };

  // =============================
  // COMPLETE GOAL DAY
  // =============================

  const handleCompleteDay = (goalId) => {
    const today = new Date()
      .toISOString()
      .split("T")[0];

    const goal = goals.find(
      (item) => item.id === goalId
    );

    if (!goal) {
      return;
    }

    const completedDates = Array.isArray(
      goal.completedDates
    )
      ? goal.completedDates
      : [];

    // Already completed today
    if (completedDates.includes(today)) {
      return;
    }

    // Goal already finished
    if (
      goal.completedDays >=
      goal.targetDays
    ) {
      return;
    }

    // =================================
    // ADD XP ONLY ONCE
    // =================================

    addXP(goal.xp);

    console.log(
      `Goal completed: +${goal.xp} XP`
    );

    // =================================
    // UPDATE GOAL
    // =================================

    setGoals((currentGoals) =>
      currentGoals.map((item) => {
        if (item.id !== goalId) {
          return item;
        }

        const dates = Array.isArray(
          item.completedDates
        )
          ? item.completedDates
          : [];

        if (dates.includes(today)) {
          return item;
        }

        const completedDays = Math.min(
          item.completedDays + 1,
          item.targetDays
        );

        return {
          ...item,
          completedDays,
          completedDates: [
            ...dates,
            today,
          ],
        };
      })
    );
  };

  // =============================
  // DELETE GOAL
  // =============================

  const handleDeleteGoal = (goalId) => {
    const goal = goals.find(
      (item) => item.id === goalId
    );

    if (!goal) {
      return;
    }

    const confirmDelete = window.confirm(
      "Delete this goal?"
    );

    if (!confirmDelete) {
      return;
    }

    /*
      IMPORTANT:
      We do NOT remove historical XP here.

      XP earned from completed goals is lifetime XP.
    */

    setGoals((currentGoals) =>
      currentGoals.filter(
        (item) => item.id !== goalId
      )
    );
  };

  // =============================
  // PROGRESS
  // =============================

  const getProgress = (goal) => {
    if (!goal.targetDays) {
      return 0;
    }

    return Math.min(
      100,
      Math.round(
        (goal.completedDays /
          goal.targetDays) *
          100
      )
    );
  };

  return (
    <div className="goals-page">

      {/* HEADER */}

      <div className="goals-header">

        <div>

          <p className="goals-label">
            PERSONAL GROWTH
          </p>

          <h1>
            My Goals
          </h1>

          <p className="goals-subtitle">
            Turn your ambitions into achievable
            milestones.
          </p>

        </div>

        <button
          className="add-goal-button"
          onClick={() =>
            setShowModal(true)
          }
        >
          + Add Goal
        </button>

      </div>

      {/* EMPTY STATE */}

      {goals.length === 0 && (
        <div className="empty-goals">

          <div className="empty-icon">
            🎯
          </div>

          <h2>
            No Goals Yet
          </h2>

          <p>
            Create your first goal and start
            your journey.
          </p>

          <button
            className="add-goal-button"
            onClick={() =>
              setShowModal(true)
            }
          >
            + Create Your First Goal
          </button>

        </div>
      )}

      {/* GOALS */}

      {goals.length > 0 && (
        <div className="goals-grid">

          {goals.map((goal) => {

            const progress =
              getProgress(goal);

            const completed =
              goal.completedDays >=
              goal.targetDays;

            return (
              <div
                className="goal-card"
                key={goal.id}
              >

                <div className="goal-top">

                  <div className="goal-title-area">

                    <span className="goal-icon">
                      {goal.icon}
                    </span>

                    <h2>
                      {goal.title}
                    </h2>

                  </div>

                  <span className="goal-xp">
                    +{goal.xp} XP
                  </span>

                </div>

                <p className="goal-description">
                  {goal.description}
                </p>

                <div className="goal-progress-header">

                  <span>
                    Progress
                  </span>

                  <strong>
                    {progress}%
                  </strong>

                </div>

                <div className="goal-progress-bar">

                  <div
                    className="goal-progress-fill"
                    style={{
                      width: `${progress}%`,
                    }}
                  />

                </div>

                <div className="goal-details">

                  <span>
                    {goal.completedDays} /{" "}
                    {goal.targetDays} Days
                  </span>

                  <span>
                    ⚡ {goal.xp} XP / day
                  </span>

                </div>

                <div className="goal-actions">

                  {completed ? (

                    <div className="goal-completed">
                      🏆 Goal Completed!
                    </div>

                  ) : (

                    <button
                      className="complete-goal-button"
                      onClick={() =>
                        handleCompleteDay(
                          goal.id
                        )
                      }
                    >
                      + Complete Day
                    </button>

                  )}

                  <button
                    className="delete-goal-button"
                    onClick={() =>
                      handleDeleteGoal(
                        goal.id
                      )
                    }
                  >
                    Delete
                  </button>

                </div>

              </div>
            );
          })}

        </div>
      )}

      {/* MODAL */}

      {showModal && (
        <div
          className="goal-modal-overlay"
          onClick={() =>
            setShowModal(false)
          }
        >

          <div
            className="goal-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <h2>
                Create New Goal
              </h2>

              <button
                className="close-modal"
                onClick={() =>
                  setShowModal(false)
                }
              >
                ×
              </button>

            </div>

            <label>
              Goal Title
            </label>

            <input
              type="text"
              placeholder="e.g. Learn Python"
              value={newGoal.title}
              onChange={(event) =>
                setNewGoal({
                  ...newGoal,
                  title:
                    event.target.value,
                })
              }
            />

            <label>
              Description
            </label>

            <textarea
              placeholder="What do you want to achieve?"
              value={
                newGoal.description
              }
              onChange={(event) =>
                setNewGoal({
                  ...newGoal,
                  description:
                    event.target.value,
                })
              }
            />

            <label>
              Icon
            </label>

            <input
              type="text"
              maxLength="2"
              value={newGoal.icon}
              onChange={(event) =>
                setNewGoal({
                  ...newGoal,
                  icon:
                    event.target.value,
                })
              }
            />

            <label>
              Target Days
            </label>

            <input
              type="number"
              min="1"
              value={
                newGoal.targetDays
              }
              onChange={(event) =>
                setNewGoal({
                  ...newGoal,
                  targetDays:
                    event.target.value,
                })
              }
            />

            <label>
              XP Per Day
            </label>

            <input
              type="number"
              min="1"
              value={newGoal.xp}
              onChange={(event) =>
                setNewGoal({
                  ...newGoal,
                  xp:
                    event.target.value,
                })
              }
            />

            <button
              className="create-goal-button"
              onClick={
                handleAddGoal
              }
            >
              Create Goal
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

export default Goals;