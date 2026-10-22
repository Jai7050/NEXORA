import { apiRequest } from "./api";

export function fetchGoals() {
  return apiRequest("/goals");
}

export function createGoal(goal) {
  return apiRequest("/goals", {
    method: "POST",
    body: JSON.stringify(goal),
  });
}

export function deleteGoal(goalId) {
  return apiRequest(`/goals/${encodeURIComponent(goalId)}`, {
    method: "DELETE",
  });
}

export function toggleGoalTask(goalId, taskId) {
  return apiRequest(
    `/goals/${encodeURIComponent(goalId)}/tasks/${encodeURIComponent(taskId)}/toggle`,
    {
      method: "PATCH",
    }
  );
}