import React from "react";
import "./GameHeader.css";
function GameHeader({
  level = 1,
  score = 0,
  coins = 0,
  lives = 3,
  maxLives = 3,
  onBack,
  onRestart,
  soundEnabled = true,
  onToggleSound,
}) {
  return (
    <header className="av-game-header">

      {/* LEFT */}
      <div className="av-header-left">

        <button
          type="button"
          className="av-header-button av-back-button"
          onClick={onBack}
          aria-label="Back"
        >
          ←
        </button>

        <div className="av-game-brand">
          <div className="av-brand-icon">
            ➤
          </div>

          <div>
            <div className="av-brand-title">
              ARROWVERSE
            </div>

            <div className="av-brand-subtitle">
              FIND THE WAY
            </div>
          </div>
        </div>

      </div>


      {/* CENTER */}
      <div className="av-header-center">

        <div className="av-level-badge">
          <span className="av-level-label">
            LEVEL
          </span>

          <strong>
            {level}
          </strong>
        </div>

      </div>


      {/* RIGHT */}
      <div className="av-header-right">

        {/* SCORE */}
        <div className="av-header-stat">
          <span className="av-stat-icon">
            🏆
          </span>

          <div>
            <small>
              SCORE
            </small>

            <strong>
              {score.toLocaleString()}
            </strong>
          </div>
        </div>


        {/* COINS */}
        <div className="av-header-stat av-coin-stat">
          <span className="av-stat-icon">
            🪙
          </span>

          <div>
            <small>
              COINS
            </small>

            <strong>
              {coins}
            </strong>
          </div>
        </div>


        {/* LIVES */}
        <div className="av-header-lives">

          {Array.from({
            length: maxLives,
          }).map((_, index) => (
            <span
              key={index}
              className={
                index < lives
                  ? "av-header-heart active"
                  : "av-header-heart lost"
              }
            >
              ♥
            </span>
          ))}

        </div>


        {/* SOUND */}
        <button
          type="button"
          className="av-header-button"
          onClick={onToggleSound}
          aria-label="Toggle sound"
        >
          {soundEnabled ? "🔊" : "🔇"}
        </button>


        {/* RESTART */}
        <button
          type="button"
          className="av-header-button"
          onClick={onRestart}
          aria-label="Restart"
        >
          ↻
        </button>

      </div>

    </header>
  );
}

export default GameHeader;