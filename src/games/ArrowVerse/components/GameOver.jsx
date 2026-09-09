import React from "react";
import "./GameOver.css";
function GameOver({
  score = 0,
  coins = 0,
  level = 1,
  onPlayAgain,
  onRetry,
  onBack,
}) {
  // ArrowVerse.jsx currently uses onRetry.
  // Keep onPlayAgain support too, so this component is flexible.
  const handlePlayAgain = onPlayAgain || onRetry;

  return (
    <div
      className="av-game-over"
      role="dialog"
      aria-modal="true"
      aria-labelledby="av-game-over-title"
    >
      <div className="av-game-over-backdrop" />

      <div className="av-game-over-card">

        {/* Top glow */}
        <div className="av-game-over-glow" />

        {/* Icon */}
        <div className="av-game-over-icon-wrap">
          <div className="av-game-over-icon">
            💥
          </div>
        </div>

        {/* Title */}
        <h2
          id="av-game-over-title"
          className="av-game-over-title"
        >
          GAME OVER
        </h2>

        <p className="av-game-over-message">
          You used all 3 chances!
        </p>

        <p className="av-game-over-submessage">
          Don't give up. Find the right path and try again.
        </p>

        {/* Stats */}
        <div className="av-game-over-stats">

          <div className="av-over-stat">
            <div className="av-over-stat-icon">
              🏆
            </div>

            <div className="av-over-stat-content">
              <small>SCORE</small>
              <strong>
                {Number(score).toLocaleString()}
              </strong>
            </div>
          </div>

          <div className="av-over-stat">
            <div className="av-over-stat-icon">
              🪙
            </div>

            <div className="av-over-stat-content">
              <small>COINS</small>
              <strong>
                {Number(coins).toLocaleString()}
              </strong>
            </div>
          </div>

          <div className="av-over-stat">
            <div className="av-over-stat-icon">
              ⚡
            </div>

            <div className="av-over-stat-content">
              <small>LEVEL</small>
              <strong>
                {level}
              </strong>
            </div>
          </div>

        </div>

        {/* Actions */}
        <div className="av-game-over-actions">

          <button
            type="button"
            className="av-play-again"
            onClick={handlePlayAgain}
            disabled={!handlePlayAgain}
          >
            <span className="av-button-icon">
              ↻
            </span>

            <span>
              PLAY AGAIN
            </span>
          </button>

          <button
            type="button"
            className="av-back-game"
            onClick={onBack}
          >
            <span>
              ←
            </span>

            BACK TO GAME STATION
          </button>

        </div>

      </div>
    </div>
  );
}

export default GameOver;