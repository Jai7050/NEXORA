const API_BASE_URL = "http://localhost:8080/api/study-schedules";

function getHeaders() {
const token = localStorage.getItem("nexora_token");

return {
"Content-Type": "application/json",
...(token ? { Authorization: `Bearer ${token}` } : {}),
};
}

async function handleResponse(response) {
if (!response.ok) {
const errorText = await response.text();


let message = errorText;

try {
  const parsed = JSON.parse(errorText);
  message =
    parsed.message ||
    parsed.error ||
    parsed.detail ||
    errorText;
} catch {
  // Keep the original response text if it isn't JSON.
}

throw new Error(
  message || `Request failed with status ${response.status}`
);
}

if (response.status === 204) {
return null;
}

return response.json();
}

export async function fetchStudySchedules() {
const response = await fetch(API_BASE_URL, {
method: "GET",
headers: getHeaders(),
});

return handleResponse(response);
}

export async function createStudySchedule(schedule) {
const response = await fetch(API_BASE_URL, {
method: "POST",
headers: getHeaders(),
body: JSON.stringify(schedule),
});

return handleResponse(response);
}

export async function updateStudySchedule(id, schedule) {
const response = await fetch(
`${API_BASE_URL}/${encodeURIComponent(id)}`,
{
method: "PUT",
headers: getHeaders(),
body: JSON.stringify(schedule),
}
);

return handleResponse(response);
}

export async function deleteStudySchedule(id) {
const response = await fetch(
`${API_BASE_URL}/${encodeURIComponent(id)}`,
{
method: "DELETE",
headers: getHeaders(),
}
);

return handleResponse(response);
}
