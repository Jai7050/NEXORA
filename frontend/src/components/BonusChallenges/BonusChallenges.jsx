import "./BonusChallenges.css";

function BonusChallenges({ challenges, onComplete }) {
  return (
    <section className="bonus-section">
      <div className="bonus-header">
        <h2>⚡ Bonus Challenges</h2>
        <p>Push yourself beyond your daily missions.</p>
      </div>

      <div className="bonus-list">
        {challenges.map((challenge) => (
          <div
            className={`bonus-card ${
              challenge.completed ? "bonus-completed" : ""
            }`}
            key={challenge.id}
            onClick={() => onComplete(challenge.id)}
          >
            <div className="bonus-left">
              <div className="bonus-check">
                {challenge.completed ? "✓" : ""}
              </div>

              <div>
                <h3>{challenge.title}</h3>
                <p>{challenge.description}</p>
              </div>
            </div>

            <span>+{challenge.xp} XP</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default BonusChallenges;