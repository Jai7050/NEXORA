import { useCallback, useEffect, useRef, useState } from "react";
import "./studyReminder.css";

import {
fetchStudySchedules,
createStudySchedule,
updateStudySchedule,
deleteStudySchedule,
} from "../api/studyScheduleApi";

function getToday() {
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, "0");
const day = String(now.getDate()).padStart(2, "0");

return `${year}-${month}-${day}`;
}

function getDefaultForm() {
return {
date: getToday(),
time: "20:00",
topic: "",
durationMinutes: 60,
repeatDaily: false,
};
}

function normalizeTime(time) {
if (typeof time === "string" && time.length >= 5) {
return time.slice(0, 5);
}

return "20:00";
}

function normalizeSchedule(item) {
return {
...item,
id: item.id ?? item._id,
date: item.date || getToday(),
time: normalizeTime(item.time),
topic: item.topic || "",
durationMinutes: Number(item.duration ?? item.durationMinutes ?? 60),
repeatDaily: Boolean(item.repeatDaily),
};
}

function getTargetDate(schedule, currentTime) {
if (!schedule?.date || !schedule?.time) {
return null;
}

const target = new Date(
`${schedule.date}T${normalizeTime(schedule.time)}:00`
);

if (Number.isNaN(target.getTime())) {
return null;
}

if (schedule.repeatDaily && target.getTime() <= currentTime) {
target.setDate(target.getDate() + 1);
}

return target;
}

function formatCountdown(totalSeconds) {
const seconds = Math.max(0, Math.floor(totalSeconds));
const hours = Math.floor(seconds / 3600);
const minutes = Math.floor((seconds % 3600) / 60);
const remainingSeconds = seconds % 60;

return [
String(hours).padStart(2, "0"),
String(minutes).padStart(2, "0"),
String(remainingSeconds).padStart(2, "0"),
].join(":");
}

export default function StudyReminder() {
const [schedule, setSchedule] = useState(null);
const [form, setForm] = useState(getDefaultForm);

const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [editing, setEditing] = useState(false);

const [error, setError] = useState("");
const [message, setMessage] = useState("");

const [now, setNow] = useState(Date.now());
const [timerRunning, setTimerRunning] = useState(false);
const [timerSeconds, setTimerSeconds] = useState(0);
const [timerTotalSeconds, setTimerTotalSeconds] = useState(0);

const notifiedEvents = useRef(new Set());
const messageTimeout = useRef(null);

const showMessage = useCallback((text) => {
setMessage(text);


if (messageTimeout.current) {
  window.clearTimeout(messageTimeout.current);
}

messageTimeout.current = window.setTimeout(() => {
  setMessage("");
}, 3500);


}, []);

useEffect(() => {
return () => {
if (messageTimeout.current) {
window.clearTimeout(messageTimeout.current);
}
};
}, []);

const loadSchedules = useCallback(async () => {
setLoading(true);
setError("");


try {
  const result = await fetchStudySchedules();

  const schedules = Array.isArray(result)
    ? result
    : result
      ? [result]
      : [];

  if (schedules.length > 0) {
    const normalized = normalizeSchedule(schedules[0]);

    setSchedule(normalized);

    setForm({
      date: normalized.date,
      time: normalized.time,
      topic: normalized.topic,
      durationMinutes: normalized.durationMinutes,
      repeatDaily: normalized.repeatDaily,
    });
  } else {
    setSchedule(null);
  }
} catch (err) {
  console.error("Load schedules error:", err);
  setError(err.message || "Could not load your study schedule.");
} finally {
  setLoading(false);
}


}, []);

useEffect(() => {
loadSchedules();
}, [loadSchedules]);

useEffect(() => {
const intervalId = window.setInterval(() => {
setNow(Date.now());
}, 1000);


return () => window.clearInterval(intervalId);


}, []);

// Study schedule notifications.
useEffect(() => {
if (!schedule) {
return;
}


const target = getTargetDate(schedule, now);

if (!target) {
  return;
}

const targetTime = target.getTime();
const secondsLeft = Math.floor((targetTime - now) / 1000);
const eventKey = `${schedule.id ?? "schedule"}-${targetTime}`;

if (secondsLeft <= 600 && secondsLeft > 0) {
  const reminderKey = `${eventKey}-soon`;

  if (!notifiedEvents.current.has(reminderKey)) {
    notifiedEvents.current.add(reminderKey);

    showMessage(
      `Your study session "${schedule.topic}" starts in 10 minutes or less.`
    );

    if (
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        new Notification("Nexora Study Reminder", {
          body: `${schedule.topic} starts soon!`,
        });
      } catch (err) {
        console.error("Notification error:", err);
      }
    }
  }
}

if (secondsLeft <= 0) {
  const startKey = `${eventKey}-start`;

  if (!notifiedEvents.current.has(startKey)) {
    notifiedEvents.current.add(startKey);

    showMessage(`It's time to study: ${schedule.topic}`);

    if (
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        new Notification("Nexora Study Reminder", {
          body: `Time to study ${schedule.topic}!`,
        });
      } catch (err) {
        console.error("Notification error:", err);
      }
    }
  }
}


}, [schedule, now, showMessage]);

// Study timer.
useEffect(() => {
if (!timerRunning) {
return undefined;
}


const intervalId = window.setInterval(() => {
  setTimerSeconds((previous) => {
    if (previous <= 1) {
      setTimerRunning(false);

      showMessage("Study timer completed. Great work!");

      if (
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          new Notification("Nexora", {
            body: "Your study timer has finished!",
          });
        } catch (err) {
          console.error("Notification error:", err);
        }
      }

      return 0;
    }

    return previous - 1;
  });
}, 1000);

return () => window.clearInterval(intervalId);


}, [timerRunning, showMessage]);

function handleChange(event) {
const { name, value, checked, type } = event.target;


setForm((previous) => ({
  ...previous,
  [name]:
    type === "checkbox"
      ? checked
      : name === "durationMinutes"
        ? Number(value)
        : value,
}));


}

async function handleNotificationPermission() {
if (!("Notification" in window)) {
showMessage("Your browser does not support notifications.");
return;
}


try {
  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    showMessage("Browser notifications enabled!");
  } else {
    showMessage("Notification permission was not granted.");
  }
} catch (err) {
  console.error("Notification permission error:", err);
  showMessage("Could not enable notifications.");
}


}

async function handleSave(event) {
event.preventDefault();


setError("");
setMessage("");

if (!form.topic.trim()) {
  setError("Please enter a study topic.");
  return;
}

if (!form.date || !form.time) {
  setError("Please select the study date and time.");
  return;
}

const selectedDateTime = new Date(`${form.date}T${form.time}:00`);

if (Number.isNaN(selectedDateTime.getTime())) {
  setError("Please enter a valid date and time.");
  return;
}

if (
  !form.repeatDaily &&
  selectedDateTime.getTime() <= Date.now()
) {
  setError("Please select a future date and time.");
  return;
}

const duration = Number(form.durationMinutes);

if (
  !Number.isInteger(duration) ||
  duration < 1 ||
  duration > 480
) {
  setError("Duration must be between 1 and 480 minutes.");
  return;
}

// The backend entity uses "duration".
const payload = {
  topic: form.topic.trim(),
  date: form.date,
  time: form.time,
  duration,
  repeatDaily: Boolean(form.repeatDaily),
};

setSaving(true);

try {
  let result;

  if (editing && schedule?.id != null) {
    result = await updateStudySchedule(schedule.id, payload);
  } else {
    result = await createStudySchedule(payload);
  }

  if (result) {
    setSchedule(normalizeSchedule(result));
  } else {
    await loadSchedules();
  }

  setEditing(false);
  notifiedEvents.current.clear();

  showMessage(
    editing
      ? "Study schedule updated successfully!"
      : "Study schedule saved successfully!"
  );
} catch (err) {
  console.error("Save schedule error:", err);
  setError(err.message || "Could not save the study schedule.");
} finally {
  setSaving(false);
}


}

function handleEdit() {
if (!schedule) {
return;
}


setForm({
  date: schedule.date,
  time: schedule.time,
  topic: schedule.topic,
  durationMinutes: schedule.durationMinutes,
  repeatDaily: schedule.repeatDaily,
});

setEditing(true);
setError("");
setMessage("");


}

async function handleDelete() {
if (!schedule || schedule.id == null) {
setError("Schedule ID is missing. Please refresh the page.");
return;
}


if (!window.confirm("Delete this study schedule?")) {
  return;
}

setError("");

try {
  await deleteStudySchedule(schedule.id);

  setSchedule(null);
  setForm(getDefaultForm());
  setEditing(false);
  notifiedEvents.current.clear();

  showMessage("Study schedule deleted successfully!");
} catch (err) {
  console.error("Delete schedule error:", err);
  setError(err.message || "Could not delete the study schedule.");
}

}

function handleStartTimer() {
const seconds = Number(form.durationMinutes) * 60;


setTimerSeconds(seconds);
setTimerTotalSeconds(seconds);
setTimerRunning(true);


}

function handleResetTimer() {
setTimerRunning(false);
setTimerSeconds(timerTotalSeconds);
}

const targetDate = schedule ? getTargetDate(schedule, now) : null;

const countdownSeconds = targetDate
? Math.max(0, Math.floor((targetDate.getTime() - now) / 1000))
: 0;

const timerProgress =
timerTotalSeconds > 0
? ((timerTotalSeconds - timerSeconds) / timerTotalSeconds) * 100
: 0;

return ( <section className="study-reminder"> <div className="study-reminder-header"> <div> <h2>📚 Study Reminder</h2> <p>Plan your study sessions and stay consistent.</p> </div>


    <button
      type="button"
      className="study-notification-button"
      onClick={handleNotificationPermission}
    >
      🔔 Enable Notifications
    </button>
  </div>

  {message && (
    <div className="study-success-message" role="status">
      {message}
    </div>
  )}

  {error && (
    <div className="study-error-message" role="alert">
      <strong>Error:</strong> {error}
    </div>
  )}

  <div className="study-reminder-grid">
    <div className="study-card">
      <h3>{editing ? "Edit Study Schedule" : "Create Study Schedule"}</h3>

      <form className="study-schedule-form" onSubmit={handleSave}>
        <label htmlFor="study-topic">Study Topic</label>
        <input
          id="study-topic"
          name="topic"
          type="text"
          placeholder="e.g. Java, Spring Boot, SQL"
          value={form.topic}
          onChange={handleChange}
          required
        />

        <label htmlFor="study-date">Study Date</label>
        <input
          id="study-date"
          name="date"
          type="date"
          value={form.date}
          onChange={handleChange}
          required
        />

        <label htmlFor="study-time">Study Time</label>
        <input
          id="study-time"
          name="time"
          type="time"
          value={form.time}
          onChange={handleChange}
          required
        />

        <label htmlFor="study-duration">Duration</label>
        <select
          id="study-duration"
          name="durationMinutes"
          value={form.durationMinutes}
          onChange={handleChange}
        >
          <option value={25}>25 minutes</option>
          <option value={30}>30 minutes</option>
          <option value={45}>45 minutes</option>
          <option value={60}>1 hour</option>
          <option value={90}>1 hour 30 minutes</option>
          <option value={120}>2 hours</option>
        </select>

        <label className="study-repeat-label">
          <input
            type="checkbox"
            name="repeatDaily"
            checked={form.repeatDaily}
            onChange={handleChange}
          />
          Repeat every day
        </label>

        <div className="study-form-actions">
          <button type="submit" disabled={saving}>
            {saving
              ? "Saving..."
              : editing
                ? "Update Schedule"
                : "Save Schedule"}
          </button>

          {editing && (
            <button
              type="button"
              className="study-secondary-button"
              onClick={() => {
                setEditing(false);

                setForm(
                  schedule
                    ? {
                        date: schedule.date,
                        time: schedule.time,
                        topic: schedule.topic,
                        durationMinutes: schedule.durationMinutes,
                        repeatDaily: schedule.repeatDaily,
                      }
                    : getDefaultForm()
                );

                setError("");
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>

    <div className="study-card">
      <h3>⏰ Your Schedule</h3>

      {loading ? (
        <p>Loading your study schedule...</p>
      ) : schedule ? (
        <div className="study-schedule-details">
          <div className="study-topic-badge">📖 {schedule.topic}</div>

          <p>
            <strong>Date:</strong> {schedule.date}
          </p>

          <p>
            <strong>Time:</strong> {schedule.time}
          </p>

          <p>
            <strong>Duration:</strong> {schedule.durationMinutes} minutes
          </p>

          <p>
            <strong>Repeat:</strong>{" "}
            {schedule.repeatDaily ? "Daily" : "One time"}
          </p>

          <div className="study-countdown">
            <span>Next study session in</span>
            <strong>{formatCountdown(countdownSeconds)}</strong>
          </div>

          <div className="study-schedule-actions">
            <button type="button" onClick={handleEdit}>
              ✏️ Edit
            </button>

            <button
              type="button"
              className="study-delete-button"
              onClick={handleDelete}
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="study-empty-state">
          <span>🗓️</span>
          <p>No study schedule found.</p>
          <p>Create a schedule to get started.</p>
        </div>
      )}

      <button
        type="button"
        className="study-refresh-button"
        onClick={loadSchedules}
        disabled={loading}
      >
        ↻ Refresh Schedule
      </button>
    </div>

    <div className="study-card study-timer-card">
      <h3>⏱️ Study Timer</h3>
      <p className="study-timer-description">
        Focus on your current topic without distractions.
      </p>

      <div className="study-timer-display">
        {formatCountdown(timerSeconds)}
      </div>

      <div className="study-progress-track">
        <div
          className="study-progress-fill"
          style={{ width: `${timerProgress}%` }}
        />
      </div>

      <div className="study-timer-actions">
        {!timerRunning && timerSeconds === 0 && (
          <button type="button" onClick={handleStartTimer}>
            ▶ Start Timer
          </button>
        )}

        {timerRunning && (
          <button
            type="button"
            onClick={() => setTimerRunning(false)}
          >
            ⏸ Pause
          </button>
        )}

        {!timerRunning && timerSeconds > 0 && (
          <button
            type="button"
            onClick={() => setTimerRunning(true)}
          >
            ▶ Resume
          </button>
        )}

        {timerTotalSeconds > 0 && (
          <button
            type="button"
            className="study-secondary-button"
            onClick={handleResetTimer}
          >
            ↻ Reset
          </button>
        )}
      </div>
    </div>
  </div>
</section>

);
}
