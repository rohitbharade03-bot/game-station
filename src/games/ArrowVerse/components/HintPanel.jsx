import React from "react";
import "./HintPanel.css";
function HintPanel({
  coins = 0,
  hintsUsed = 0,
  maxHints = 2,
  hintCosts = [10, 20],
  onUseHint,
  disabled = false,
}) {
  const hintsLeft = Math.max(
    0,
    maxHints - hintsUsed
  );

  const currentCost =
    hintCosts[hintsUsed] ??
    hintCosts[hintCosts.length - 1] ??
    10;

  const canUseHint =
    !disabled &&
    hintsLeft > 0 &&
    coins >= currentCost;

  const handleHint = () => {
    if (!canUseHint) return;

    onUseHint?.({
      cost: currentCost,
      hintNumber: hintsUsed + 1,
    });
  };

  return (
    <div className="av-hint-panel">

      <div className="av-hint-header">
        <div>
          <div className="av-hint-title">
            💡 HINTS
          </div>

          <div className="av-hint-subtitle">
            Need a little help?
          </div>
        </div>

        <div className="av-hint-count">
          {hintsLeft}/{maxHints}
        </div>
      </div>


      {/* Hint button */}
      <button
        type="button"
        className={[
          "av-hint-action",
          !canUseHint
            ? "av-hint-disabled"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={handleHint}
        disabled={!canUseHint}
      >
        <span className="av-hint-bulb">
          💡
        </span>

        <span className="av-hint-content">

          <strong>
            {hintsLeft === 0
              ? "NO HINTS LEFT"
              : "GET A HINT"}
          </strong>

          {hintsLeft > 0 && (
            <small>
              🪙 {currentCost} coins
            </small>
          )}

        </span>

        <span className="av-hint-arrow">
          →
        </span>
      </button>


      {/* Coin warning */}
      {hintsLeft > 0 &&
        coins < currentCost && (
          <div className="av-hint-warning">
            🪙 You need {currentCost} coins
          </div>
        )}


      {/* All hints used */}
      {hintsLeft === 0 && (
        <div className="av-hint-complete">
          ✨ All hints used
        </div>
      )}

    </div>
  );
}

export default HintPanel;