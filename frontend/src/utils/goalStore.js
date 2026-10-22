const STORAGE_KEY = "nexora_goals_v1";

export function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function addDays(key, amount) {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + amount);
  return localDateKey(date);
}

export function readGoals() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeGoals(goals) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  return goals;
}

export function createGoal({ title, description, category, duration, dailyTasks }) {
  const startDate = localDateKey();
  const end = parseDateKey(startDate);
  end.setDate(end.getDate() + Number(duration) - 1);
  const goal = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    title: title.trim(),
    description: description.trim(),
    category,
    duration: Number(duration),
    startDate,
    endDate: localDateKey(end),
    status: "ACTIVE",
    dailyTasks: dailyTasks.map((task, index) => ({
      id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2, 7)}`,
      title: task.trim(),
    })),
    completions: {},
    createdAt: new Date().toISOString(),
  };
  writeGoals([goal, ...readGoals()]);
  return goal;
}

export function toggleTask(goalId, taskId, dateKey = localDateKey()) {
  const goals = readGoals().map((goal) => {
    if (goal.id !== goalId) return goal;
    const day = { ...(goal.completions?.[dateKey] || {}) };
    day[taskId] = !day[taskId];
    return { ...goal, completions: { ...(goal.completions || {}), [dateKey]: day } };
  });
  writeGoals(goals);
  return goals;
}

export function deleteGoal(goalId) {
  return writeGoals(readGoals().filter((goal) => goal.id !== goalId));
}

export function dayIsComplete(goal, dateKey) {
  if (!goal.dailyTasks?.length) return false;
  const day = goal.completions?.[dateKey] || {};
  return goal.dailyTasks.every((task) => Boolean(day[task.id]));
}

export function getCurrentStreak(goal, today = localDateKey()) {
  let cursor = today;
  // If today isn't complete yet, preserve the streak through yesterday.
  if (!dayIsComplete(goal, cursor)) cursor = addDays(cursor, -1);
  let streak = 0;
  for (let i = 0; i < Number(goal.duration) + 1; i += 1) {
    if (!dayIsComplete(goal, cursor)) break;
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function getLongestStreak(goal) {
  let best = 0;
  let run = 0;
  for (let i = 0; i < Number(goal.duration); i += 1) {
    const dateKey = addDays(goal.startDate, i);
    if (dayIsComplete(goal, dateKey)) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }
  return best;
}

export function getGoalProgress(goal) {
  let completedDays = 0;
  for (let i = 0; i < Number(goal.duration); i += 1) {
    if (dayIsComplete(goal, addDays(goal.startDate, i))) completedDays += 1;
  }
  return Math.round((completedDays / Math.max(1, Number(goal.duration))) * 100);
}

export function getTodayTaskStats(goals, today = localDateKey()) {
  let total = 0;
  let completed = 0;
  goals.filter((goal) => goal.status === "ACTIVE" && goal.startDate <= today && goal.endDate >= today)
    .forEach((goal) => {
      total += goal.dailyTasks.length;
      const day = goal.completions?.[today] || {};
      completed += goal.dailyTasks.filter((task) => Boolean(day[task.id])).length;
    });
  return { total, completed };
}
