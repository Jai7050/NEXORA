import { useEffect, useRef, useState } from "react";
import "./studyReminder.css";

const STORAGE_KEY = "nexora_study_schedule";
const NOTIFIED_KEY = "nexora_study_notified_events";

function getToday() {
const d = new Date();
return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getTomorrow(dateString) {
const d = new Date(`${dateString}T12:00:00`);
d.setDate(d.getDate() + 1);
return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDefaultTime() {
const d = new Date();
d.setMinutes(d.getMinutes() + 15);
return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function readJSON(key, fallback) {
try {
const value = localStorage.getItem(key);
return value ? JSON.parse(value) : fallback;
} catch {
return fallback;
}
}

function formatTime(seconds) {
const h = Math.floor(seconds / 3600);
const m = Math.floor((seconds % 3600) / 60);
const s = seconds % 60;

return [h, m, s]
.map((n) => String(n).padStart(2, "0"))
.join(":");
}

function formatDateTime(date, time) {
return new Date(`${date}T${time}:00`).toLocaleString([], {
weekday: "short",
day: "numeric",
month: "short",
hour: "2-digit",
minute: "2-digit",
});
}

function getTimestamp(date, time) {
return new Date(`${date}T${time}:00`).getTime();
}

function StudyReminder() {
const savedSchedule = readJSON(STORAGE_KEY, null);

const [schedule, setSchedule] = useState(savedSchedule);

const [studyDate, setStudyDate] = useState(
savedSchedule?.date || getToday()
);

const [studyTime, setStudyTime] = useState(
savedSchedule?.time || getDefaultTime()
);

const [duration, setDuration] = useState(
Number(savedSchedule?.duration) || 60
);

const [topic, setTopic] = useState(
savedSchedule?.topic || "Study Session"
);

const [repeatDaily, setRepeatDaily] = useState(
Boolean(savedSchedule?.repeatDaily)
);

const [remainingSeconds, setRemainingSeconds] = useState(
(Number(savedSchedule?.duration) || 60) * 60
);

const [timerStatus, setTimerStatus] = useState("idle");
const [message, setMessage] = useState("");
const [now, setNow] = useState(Date.now());

const [notificationPermission, setNotificationPermission] = useState(() => {
if (typeof window === "undefined" || !("Notification" in window)) {
return "unsupported";
}

return Notification.permission;


});

const notifiedEvents = useRef(
new Set(readJSON(NOTIFIED_KEY, []))
);

const messageTimeout = useRef(null);
const timerRef = useRef(null);

useEffect(() => {
if (schedule) {
localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
} else {
localStorage.removeItem(STORAGE_KEY);
}
}, [schedule]);

useEffect(() => {
localStorage.setItem(
NOTIFIED_KEY,
JSON.stringify([...notifiedEvents.current])
);
}, [now, schedule]);

useEffect(() => {
const interval = window.setInterval(() => {
setNow(Date.now());
}, 1000);


const onFocus = () => setNow(Date.now());

window.addEventListener("focus", onFocus);

return () => {
  window.clearInterval(interval);
  window.removeEventListener("focus", onFocus);
};


}, []);

function showMessage(text) {
setMessage(text);


if (messageTimeout.current) {
  window.clearTimeout(messageTimeout.current);
}

messageTimeout.current = window.setTimeout(() => {
  setMessage("");
}, 6000);


}

useEffect(() => {
return () => {
if (messageTimeout.current) {
window.clearTimeout(messageTimeout.current);
}


  if (timerRef.current) {
    window.clearInterval(timerRef.current);
  }
};


}, []);

function sendNotification(title, body) {
if (!("Notification" in window)) {
showMessage("Your browser does not support notifications.");
return false;
}


if (Notification.permission !== "granted") {
  showMessage("Please enable notifications first.");
  return false;
}

try {
  const notification = new Notification(title, {
    body,
    icon: "/favicon.ico",
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  return true;
} catch (error) {
  console.error("Notification error:", error);
  showMessage("Could not show notification. Check browser settings.");
  return false;
}


}

async function enableNotifications() {
if (!("Notification" in window)) {
setNotificationPermission("unsupported");
showMessage("Your browser does not support desktop notifications.");
return;
}


try {
  const permission = await Notification.requestPermission();

  setNotificationPermission(permission);

  if (permission === "granted") {
    showMessage("🔔 Notifications enabled!");

    sendNotification(
      "NEXORA Notifications Enabled",
      "Your study reminders are ready."
    );
  } else {
    showMessage(
      "Notifications were not allowed. Check your browser site settings."
    );
  }
} catch (error) {
  console.error(error);
  showMessage("Unable to request notification permission.");
}

}

useEffect(() => {
if (!schedule?.date || !schedule?.time) {
return;
}


const scheduledAt = getTimestamp(schedule.date, schedule.time);

if (!Number.isFinite(scheduledAt)) {
  return;
}

const scheduleId = schedule.id || `${schedule.date}-${schedule.time}`;
const advanceKey = `${scheduleId}-${schedule.date}-advance`;
const startKey = `${scheduleId}-${schedule.date}-start`;

const difference = scheduledAt - now;

if (
  difference > 0 &&
  difference <= 10 * 60 * 1000 &&
  !notifiedEvents.current.has(advanceKey)
) {
  notifiedEvents.current.add(advanceKey);

  sendNotification(
    "NEXORA — Get Ready! 📚",
    `"${schedule.topic}" starts in ${Math.max(1, Math.ceil(difference / 60000))} minute(s).`
  );
}

if (
  now >= scheduledAt &&
  !notifiedEvents.current.has(startKey)
) {
  notifiedEvents.current.add(startKey);

  sendNotification(
    "NEXORA — It's Study Time! 🚀",
    `It's time to study "${schedule.topic}". Planned duration: ${schedule.duration} minutes.`
  );

  showMessage(`📚 It's time to study "${schedule.topic}"!`);

  if (schedule.repeatDaily) {
    const nextSchedule = {
      ...schedule,
      date: getTomorrow(schedule.date),
    };

    setSchedule(nextSchedule);
    setStudyDate(nextSchedule.date);
  }
}


}, [now, schedule]);

useEffect(() => {
if (timerStatus !== "running") {
return;
}


timerRef.current = window.setInterval(() => {
  setRemainingSeconds((previous) => {
    if (previous <= 1) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;

      setTimerStatus("completed");

      sendNotification(
        "NEXORA — Session Completed! 🎉",
        "Great work! Your study session is complete."
      );

      showMessage("🎉 Study session completed!");

      return 0;
    }

    return previous - 1;
  });
}, 1000);

return () => {
  if (timerRef.current) {
    window.clearInterval(timerRef.current);
    timerRef.current = null;
  }
};

}, [timerStatus]);

function handleSaveSchedule(event) {
event.preventDefault();

if (!topic.trim() || !studyDate || !studyTime) {
  showMessage("Please enter the topic, date and time.");
  return;
}

const scheduledAt = getTimestamp(studyDate, studyTime);

if (!Number.isFinite(scheduledAt) || scheduledAt <= Date.now()) {
  showMessage("Please choose a valid future date and time.");
  return;
}

const newSchedule = {
  id:
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now()),
  topic: topic.trim(),
  date: studyDate,
  time: studyTime,
  duration: Number(duration),
  repeatDaily,
};

notifiedEvents.current.clear();
localStorage.setItem(NOTIFIED_KEY, JSON.stringify([]));

setSchedule(newSchedule);
setRemainingSeconds(Number(duration) * 60);
setTimerStatus("idle");

showMessage(
  `Schedule saved for ${formatDateTime(newSchedule.date, newSchedule.time)}.`
);

if (notificationPermission === "granted") {
  sendNotification(
    "NEXORA — Schedule Saved",
    `"${newSchedule.topic}" is scheduled for ${formatDateTime(newSchedule.date, newSchedule.time)}.`
  );
} else {
  showMessage(
    "Schedule saved. Enable notifications to receive popup alerts."
  );
}

}

function handleStart() {
if (timerStatus === "running") {
return;
}


if (remainingSeconds <= 0) {
  setRemainingSeconds(Number(duration) * 60);
}

setTimerStatus("running");
showMessage(`📚 Focus mode started: "${topic}".`);

}

function handlePause() {
setTimerStatus("paused");
showMessage("Study timer paused.");
}

function handleReset() {
setTimerStatus("idle");
setRemainingSeconds(Number(duration) * 60);
showMessage("Timer reset.");
}

function handleDeleteSchedule() {
setSchedule(null);
setTimerStatus("idle");
setRemainingSeconds(Number(duration) * 60);
notifiedEvents.current.clear();


localStorage.removeItem(NOTIFIED_KEY);

setStudyDate(getToday());
setStudyTime(getDefaultTime());

showMessage("Study schedule removed.");

}

const totalSeconds = Number(duration) * 60;

const progress =
totalSeconds > 0
? ((totalSeconds - remainingSeconds) / totalSeconds) * 100
: 0;

const scheduledAt = schedule
? getTimestamp(schedule.date, schedule.time)
: null;

const upcoming = scheduledAt !== null && scheduledAt > now;

const minutesUntilStart = upcoming
? Math.ceil((scheduledAt - now) / 60000)
: 0;

return ( <section className="study-reminder"> <header className="sr-heading"> <div> <span className="sr-eyebrow">FOCUS. LEARN. LEVEL UP.</span> <h2>Study Timer & Reminders</h2> <p>Schedule a session and get notified at the selected time.</p> </div>


    <div className="sr-heading-icon" aria-hidden="true">
      📚
    </div>
  </header>

  {message && (
    <div className="sr-message" role="status">
      {message}
    </div>
  )}

  <div className="sr-grid">
    <article className="sr-card">
      <div className="sr-card-heading">
        <span className="sr-card-icon">📅</span>
        <div>
          <h3>Plan Your Study</h3>
          <p>Choose your topic, date, time and duration.</p>
        </div>
      </div>

      <form className="sr-form" onSubmit={handleSaveSchedule}>
        <label htmlFor="sr-topic">Study topic</label>
        <input
          id="sr-topic"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Java Programming"
          maxLength={100}
          required
        />

        <label htmlFor="sr-date">Study date</label>
        <input
          id="sr-date"
          type="date"
          min={getToday()}
          value={studyDate}
          onChange={(e) => setStudyDate(e.target.value)}
          required
        />

        <label htmlFor="sr-time">Start time</label>
        <input
          id="sr-time"
          type="time"
          value={studyTime}
          onChange={(e) => setStudyTime(e.target.value)}
          required
        />

        <label htmlFor="sr-duration">Study duration</label>
        <select
          id="sr-duration"
          value={duration}
          onChange={(e) => {
            const value = Number(e.target.value);
            setDuration(value);

            if (timerStatus !== "running") {
              setRemainingSeconds(value * 60);
              setTimerStatus("idle");
            }
          }}
        >
          <option value={25}>25 minutes</option>
          <option value={30}>30 minutes</option>
          <option value={45}>45 minutes</option>
          <option value={60}>1 hour</option>
          <option value={90}>1 hour 30 minutes</option>
          <option value={120}>2 hours</option>
        </select>

        <label className="sr-checkbox">
          <input
            type="checkbox"
            checked={repeatDaily}
            onChange={(e) => setRepeatDaily(e.target.checked)}
          />
          <span>Repeat every day</span>
        </label>

        <button type="submit" className="sr-primary-button">
          💾 Save Schedule
        </button>
      </form>

      <button
        type="button"
        className="sr-secondary-button"
        onClick={enableNotifications}
        disabled={notificationPermission === "unsupported"}
      >
        🔔{" "}
        {notificationPermission === "granted"
          ? "Notifications Enabled"
          : notificationPermission === "denied"
            ? "Notifications Blocked"
            : "Enable Notifications"}
      </button>

      <p className="sr-small-note">
        Keep NEXORA open to receive scheduled reminders.
      </p>
    </article>

    <article className="sr-card sr-timer-card">
      <div className="sr-card-heading">
        <span className="sr-card-icon">⏱️</span>
        <div>
          <h3>Focus Timer</h3>
          <p>Start focusing on your goal.</p>
        </div>
      </div>

      <div className="sr-timer-circle">
        <div className="sr-timer-inner">
          <span className="sr-timer-label">
            {timerStatus === "running"
              ? "FOCUSING"
              : timerStatus === "paused"
                ? "PAUSED"
                : timerStatus === "completed"
                  ? "COMPLETED"
                  : "READY"}
          </span>

          <strong>{formatTime(remainingSeconds)}</strong>

          <span className="sr-timer-subtitle">
            {duration} minute session
          </span>
        </div>
      </div>

      <div
        className="sr-progress-track"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Study session progress"
      >
        <div
          className="sr-progress-fill"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>

      <div className="sr-timer-actions">
        {timerStatus === "running" ? (
          <button
            type="button"
            className="sr-secondary-button"
            onClick={handlePause}
          >
            ⏸ Pause
          </button>
        ) : (
          <button
            type="button"
            className="sr-primary-button"
            onClick={handleStart}
          >
            ▶ {timerStatus === "paused" ? "Resume" : "Start Studying"}
          </button>
        )}

        <button
          type="button"
          className="sr-reset-button"
          onClick={handleReset}
        >
          ↻ Reset
        </button>
      </div>

      <p className="sr-focus-tip">
        ✨ Focus on one task at a time. Every session counts.
      </p>
    </article>
  </div>

  <article className="sr-schedule-card">
    <div className="sr-schedule-header">
      <div>
        <span className="sr-eyebrow">YOUR PLAN</span>
        <h3>Scheduled Session</h3>
      </div>

      <span className={`sr-status ${schedule ? "sr-status-active" : ""}`}>
        {schedule ? "● Scheduled" : "○ Not scheduled"}
      </span>
    </div>

    {schedule ? (
      <>
        <div className="sr-schedule-details">
          <div className="sr-detail-item">
            <span>📚 Topic</span>
            <strong>{schedule.topic}</strong>
          </div>

          <div className="sr-detail-item">
            <span>📅 Date</span>
            <strong>{schedule.date}</strong>
          </div>

          <div className="sr-detail-item">
            <span>🕒 Start time</span>
            <strong>{schedule.time}</strong>
          </div>

          <div className="sr-detail-item">
            <span>⏳ Duration</span>
            <strong>{schedule.duration} minutes</strong>
          </div>

          <div className="sr-detail-item">
            <span>🔁 Repeat</span>
            <strong>{schedule.repeatDaily ? "Daily" : "Once"}</strong>
          </div>
        </div>

        <div className="sr-countdown">
          {upcoming
            ? `⏰ Your session starts in ${minutesUntilStart} minute(s).`
            : "📌 Your scheduled time has arrived or passed."}
        </div>

        <div className="sr-schedule-footer">
          <p>
            {notificationPermission === "granted"
              ? "🔔 Browser notifications are enabled."
              : "🔔 Enable browser notifications to receive alerts."}
          </p>

          <button
            type="button"
            className="sr-delete-button"
            onClick={handleDeleteSchedule}
          >
            Remove Schedule
          </button>
        </div>
      </>
    ) : (
      <div className="sr-empty-state">
        <span>🗓️</span>
        <p>No study session scheduled yet.</p>
        <small>Set your date and time using the form above.</small>
      </div>
    )}
  </article>
</section>


);
}

export default StudyReminder;
