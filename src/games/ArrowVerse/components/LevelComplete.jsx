import React from "react";
import "./LevelComplete.css";

function LevelComplete({
  level = 1,
  score = 0,
  coinsEarned = 0,
  totalCoins = 0,
  onNextLevel,
  onReplay,
  onBack,
}) {
  const handleNextLevel = () => {
    if (typeof onNextLevel === "function") {
      onNextLevel();
    }
  };

  const handleReplay = () => {
    if (typeof onReplay === "function") {
      onReplay();
    }
  };

  const handleBack = () => {
    if (typeof onBack === "function") {
      onBack();
    }
  };

  return (
    <div className="av-level-complete">
      <div className="av-level-complete-card">

        {/* Celebration */}
        <div className="av-complete-stars">
          <span>✦</span>
          <span>★</span>
          <span>✦</span>
        </div>

        {/* Icon */}
        <div className="av-complete-icon">
          🎉
        </div>

        {/* Title */}
        <h2 className="av-complete-title">
          LEVEL COMPLETE!
        </h2>

        <p className="av-complete-subtitle">
          Perfect! You found the way.
        </p>

        {/* Level */}
        <div className="av-complete-level">
          <span>LEVEL</span>
          <strong>{level}</strong>
        </div>

        {/* Stats */}
        <div className="av-complete-stats">

          <div className="av-complete-stat">
            <span>🏆</span>
            <small>SCORE</small>
            <strong>
              {Number(score).toLocaleString()}
            </strong>
          </div>

          <div className="av-complete-stat">
            <span>🪙</span>
            <small>EARNED</small>
            <strong>
              +{coinsEarned}
            </strong>
          </div>

          <div className="av-complete-stat">
            <span>💰</span>
            <small>TOTAL</small>
            <strong>
              {totalCoins}
            </strong>
          </div>

        </div>

        {/* NEXT LEVEL */}
        <button
          type="button"
          className="av-next-level-button"
          onClick={handleNextLevel}
        >
          <span>NEXT LEVEL</span>
          <strong>→</strong>
        </button>

        {/* REPLAY */}
        <button
          type="button"
          className="av-replay-button"
          onClick={handleReplay}
        >
          <span>↻</span>
          REPLAY LEVEL
        </button>

        {/* BACK */}
        <button
          type="button"
          className="av-complete-back"
          onClick={handleBack}
        >
          ← BACK TO GAME STATION
        </button>

      </div>
    </div>
  );
}

export default LevelComplete;