import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./QuickDuel.css";

// =====================================================
// QUICK DUEL
// Human vs AI — 30 Second Battles
// =====================================================

const MAX_HP = 3;

const ACTIONS = {
  ATTACK: {
    id: "attack",
    label: "ATTACK",
    icon: "⚔️",
    key: "1",
  },
  BLOCK: {
    id: "block",
    label: "BLOCK",
    icon: "🛡️",
    key: "2",
  },
  SPECIAL: {
    id: "special",
    label: "SPECIAL",
    icon: "⚡",
    key: "3",
  },
};

const ACTION_LIST = Object.values(ACTIONS);

// =====================================================
// RESULT
// =====================================================

function resolveRound(playerMove, computerMove) {
  if (playerMove === computerMove) {
    return {
      winner: "draw",
      playerDamage: 0,
      computerDamage: 0,
      message: "DRAW!",
    };
  }

  // Attack > Special
  if (
    playerMove === ACTIONS.ATTACK.id &&
    computerMove === ACTIONS.SPECIAL.id
  ) {
    return {
      winner: "player",
      playerDamage: 0,
      computerDamage: 1,
      message: "ATTACK BEATS SPECIAL!",
    };
  }

  // Special > Block
  if (
    playerMove === ACTIONS.SPECIAL.id &&
    computerMove === ACTIONS.BLOCK.id
  ) {
    return {
      winner: "player",
      playerDamage: 0,
      computerDamage: 1,
      message: "SPECIAL BREAKS BLOCK!",
    };
  }

  // Block > Attack
  if (
    playerMove === ACTIONS.BLOCK.id &&
    computerMove === ACTIONS.ATTACK.id
  ) {
    return {
      winner: "player",
      playerDamage: 0,
      computerDamage: 1,
      message: "BLOCK COUNTERS ATTACK!",
    };
  }

  // Computer wins
  if (
    computerMove === ACTIONS.ATTACK.id &&
    playerMove === ACTIONS.SPECIAL.id
  ) {
    return {
      winner: "computer",
      playerDamage: 1,
      computerDamage: 0,
      message: "ATTACK BEATS SPECIAL!",
    };
  }

  if (
    computerMove === ACTIONS.SPECIAL.id &&
    playerMove === ACTIONS.BLOCK.id
  ) {
    return {
      winner: "computer",
      playerDamage: 1,
      computerDamage: 0,
      message: "SPECIAL BREAKS BLOCK!",
    };
  }

  if (
    computerMove === ACTIONS.BLOCK.id &&
    playerMove === ACTIONS.ATTACK.id
  ) {
    return {
      winner: "computer",
      playerDamage: 1,
      computerDamage: 0,
      message: "BLOCK COUNTERS ATTACK!",
    };
  }

  return {
    winner: "draw",
    playerDamage: 0,
    computerDamage: 0,
    message: "DRAW!",
  };
}

// =====================================================
// BASIC ADAPTIVE AI
// =====================================================

function getComputerMove(history, difficulty = "medium") {
  const randomMove = () => {
    const index = Math.floor(Math.random() * ACTION_LIST.length);
    return ACTION_LIST[index].id;
  };

  if (history.length === 0) {
    return randomMove();
  }

  // EASY = mostly random
  if (difficulty === "easy") {
    return Math.random() < 0.75
      ? randomMove()
      : ACTIONS.ATTACK.id;
  }

  const recentHistory = history.slice(-5);

  const counts = {
    [ACTIONS.ATTACK.id]: 0,
    [ACTIONS.BLOCK.id]: 0,
    [ACTIONS.SPECIAL.id]: 0,
  };

  recentHistory.forEach((move) => {
    if (counts[move] !== undefined) {
      counts[move] += 1;
    }
  });

  // Find player's most-used action
  let mostUsed = ACTIONS.ATTACK.id;

  if (counts[ACTIONS.BLOCK.id] > counts[mostUsed]) {
    mostUsed = ACTIONS.BLOCK.id;
  }

  if (counts[ACTIONS.SPECIAL.id] > counts[mostUsed]) {
    mostUsed = ACTIONS.SPECIAL.id;
  }

  // HARD / MASTER predicts player
  if (difficulty === "hard" || difficulty === "master") {
    // Counter player's most-used action
    if (mostUsed === ACTIONS.ATTACK.id) {
      return ACTIONS.BLOCK.id;
    }

    if (mostUsed === ACTIONS.BLOCK.id) {
      return ACTIONS.SPECIAL.id;
    }

    return ACTIONS.ATTACK.id;
  }

  // Medium: 65% adaptive, 35% random
  if (Math.random() < 0.65) {
    if (mostUsed === ACTIONS.ATTACK.id) {
      return ACTIONS.BLOCK.id;
    }

    if (mostUsed === ACTIONS.BLOCK.id) {
      return ACTIONS.SPECIAL.id;
    }

    return ACTIONS.ATTACK.id;
  }

  return randomMove();
}

// =====================================================
// SOUND
// =====================================================

function playSound(type) {
  try {
    const AudioContext =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) return;

    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    let frequency = 400;

    if (type === "attack") {
      frequency = 180;
    }

    if (type === "block") {
      frequency = 300;
    }

    if (type === "special") {
      frequency = 650;
    }

    if (type === "win") {
      frequency = 850;
    }

    if (type === "lose") {
      frequency = 120;
    }

    if (type === "draw") {
      frequency = 450;
    }

    oscillator.frequency.setValueAtTime(
      frequency,
      audioContext.currentTime
    );

    oscillator.type = type === "special" ? "sawtooth" : "square";

    gain.gain.setValueAtTime(
      0.06,
      audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.18
    );

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.18);
  } catch {
    // Audio is optional.
  }
}

// =====================================================
// HP COMPONENT
// =====================================================

function HpBar({ hp, side }) {
  return (
    <div className={`hp-container ${side}`}>
      <div className="hp-label">
        <span>{side === "player" ? "YOUR HP" : "AI HP"}</span>
        <strong>
          {hp}/{MAX_HP}
        </strong>
      </div>

      <div className="hp-bar">
        {Array.from({ length: MAX_HP }).map((_, index) => (
          <div
            key={index}
            className={`hp-point ${
              index < hp ? "active" : "empty"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// =====================================================
// ACTION BUTTON
// =====================================================

function ActionButton({ action, onClick, disabled }) {
  return (
    <button
      className={`duel-action action-${action.id}`}
      onClick={() => onClick(action.id)}
      disabled={disabled}
    >
      <span className="action-icon">{action.icon}</span>

      <span className="action-name">
        {action.label}
      </span>

      <span className="action-key">
        {action.key}
      </span>
    </button>
  );
}

// =====================================================
// MAIN COMPONENT
// =====================================================

function QuickDuel() {
  const [playerHp, setPlayerHp] = useState(MAX_HP);
  const [computerHp, setComputerHp] = useState(MAX_HP);

  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);

  const [round, setRound] = useState(1);

  const [playerMove, setPlayerMove] = useState(null);
  const [computerMove, setComputerMove] = useState(null);

  const [resultMessage, setResultMessage] =
    useState("CHOOSE YOUR MOVE");

  const [resultType, setResultType] = useState("");

  const [status, setStatus] = useState("playing");

  const [history, setHistory] = useState([]);

  const [difficulty, setDifficulty] =
    useState("medium");

  const [soundEnabled, setSoundEnabled] =
    useState(true);

  const [lastWinner, setLastWinner] =
    useState(null);

  // ---------------------------------------------------
  // CURRENT STATUS
  // ---------------------------------------------------

  const statusText = useMemo(() => {
    if (status === "won") {
      return "🏆 YOU WIN!";
    }

    if (status === "lost") {
      return "💀 AI WINS!";
    }

    if (status === "draw") {
      return "🤝 DRAW!";
    }

    return "⚔️ BATTLE READY";
  }, [status]);

  // ---------------------------------------------------
  // SOUND HELPER
  // ---------------------------------------------------

  const sound = useCallback(
    (type) => {
      if (soundEnabled) {
        playSound(type);
      }
    },
    [soundEnabled]
  );

  // ---------------------------------------------------
  // RESET
  // ---------------------------------------------------

  const resetGame = useCallback(() => {
    setPlayerHp(MAX_HP);
    setComputerHp(MAX_HP);

    setPlayerScore(0);
    setComputerScore(0);

    setRound(1);

    setPlayerMove(null);
    setComputerMove(null);

    setResultMessage("CHOOSE YOUR MOVE");
    setResultType("");

    setStatus("playing");

    setHistory([]);

    setLastWinner(null);
  }, []);

  // ---------------------------------------------------
  // MAKE MOVE
  // ---------------------------------------------------

  const makeMove = useCallback(
    (selectedMove) => {
      if (status !== "playing") {
        return;
      }

      if (!selectedMove) {
        return;
      }

      const aiMove = getComputerMove(
        history,
        difficulty
      );

      const result = resolveRound(
        selectedMove,
        aiMove
      );

      // Current HP values
      const nextPlayerHp = Math.max(
        0,
        playerHp - result.playerDamage
      );

      const nextComputerHp = Math.max(
        0,
        computerHp - result.computerDamage
      );

      // Update moves
      setPlayerMove(selectedMove);
      setComputerMove(aiMove);

      // Update HP
      setPlayerHp(nextPlayerHp);
      setComputerHp(nextComputerHp);

      // Update scores
      if (result.winner === "player") {
        setPlayerScore((score) => score + 1);
        setLastWinner("player");
        setResultType("player");
        sound("win");
      } else if (result.winner === "computer") {
        setComputerScore((score) => score + 1);
        setLastWinner("computer");
        setResultType("computer");
        sound("lose");
      } else {
        setLastWinner("draw");
        setResultType("draw");
        sound("draw");
      }

      setResultMessage(result.message);

      // History for AI
      setHistory((previous) => [
        ...previous,
        selectedMove,
      ]);

      // ------------------------------------------------
      // GAME OVER CHECK
      // ------------------------------------------------

      if (nextComputerHp <= 0) {
        setStatus("won");
        setResultMessage("🏆 YOU DEFEATED THE AI!");
        sound("win");
        return;
      }

      if (nextPlayerHp <= 0) {
        setStatus("lost");
        setResultMessage("💀 THE AI DEFEATED YOU!");
        sound("lose");
        return;
      }

      // Next round
      setRound((value) => value + 1);
    },
    [
      status,
      history,
      difficulty,
      playerHp,
      computerHp,
      sound,
    ]
  );

  // ---------------------------------------------------
  // KEYBOARD CONTROLS
  // ---------------------------------------------------

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.repeat) return;

      const key = event.key.toLowerCase();

      if (key === "1") {
        makeMove(ACTIONS.ATTACK.id);
      }

      if (key === "2") {
        makeMove(ACTIONS.BLOCK.id);
      }

      if (key === "3") {
        makeMove(ACTIONS.SPECIAL.id);
      }

      if (key === "r") {
        resetGame();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [makeMove, resetGame]);

  // ---------------------------------------------------
  // SELECT ACTION
  // ---------------------------------------------------

  const handleAction = (actionId) => {
    const action = ACTION_LIST.find(
      (item) => item.id === actionId
    );

    if (action) {
      sound(actionId);
    }

    makeMove(actionId);
  };

  // ---------------------------------------------------
  // RENDER MOVE
  // ---------------------------------------------------

  const getAction = (id) => {
    return ACTION_LIST.find(
      (action) => action.id === id
    );
  };

  const playerAction = getAction(playerMove);
  const computerAction = getAction(computerMove);

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="quick-duel-page">

      {/* ================================================
          TOP BAR
      ================================================ */}

      <header className="duel-header">

        <div className="duel-brand">
          <div className="brand-icon">⚔️</div>

          <div>
            <h1>QUICK DUEL</h1>
            <p>HUMAN VS AI</p>
          </div>
        </div>

        <div className="duel-header-center">
          <span>ROUND</span>
          <strong>{round}</strong>
        </div>

        <div className="duel-header-actions">

          <select
            value={difficulty}
            onChange={(event) =>
              setDifficulty(event.target.value)
            }
            disabled={status !== "playing"}
          >
            <option value="easy">EASY AI</option>
            <option value="medium">MEDIUM AI</option>
            <option value="hard">HARD AI</option>
            <option value="master">MASTER AI</option>
          </select>

          <button
            className="sound-button"
            onClick={() =>
              setSoundEnabled((value) => !value)
            }
            title="Toggle Sound"
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>

        </div>
      </header>

      {/* ================================================
          BATTLE ARENA
      ================================================ */}

      <main className="duel-main">

        <section className="battle-arena">

          {/* PLAYER */}
          <div className="fighter fighter-player">

            <div className="fighter-title">
              <span>PLAYER</span>
              <strong>YOU</strong>
            </div>

            <HpBar
              hp={playerHp}
              side="player"
            />

            <div className="fighter-character player-character">
              <div className="character-glow" />

              <div className="character-body">
                <div className="character-head">
                  😎
                </div>

                <div className="character-torso" />

                <div className="character-weapon">
                  ⚔️
                </div>
              </div>
            </div>

            <div className="score-card">
              <span>SCORE</span>
              <strong>{playerScore}</strong>
            </div>

          </div>

          {/* CENTER */}
          <div className="battle-center">

            <div className="versus">
              <span>VS</span>
            </div>

            <div className="result-box">

              <div
                className={`result-message ${resultType}`}
              >
                {resultMessage}
              </div>

              <div className="move-display">

                <div className="move-result player-move">
                  <small>YOU</small>

                  <div className="move-icon">
                    {playerAction
                      ? playerAction.icon
                      : "❔"}
                  </div>

                  <strong>
                    {playerAction
                      ? playerAction.label
                      : "READY"}
                  </strong>
                </div>

                <div className="move-vs">
                  VS
                </div>

                <div className="move-result ai-move">
                  <small>AI</small>

                  <div className="move-icon">
                    {computerAction
                      ? computerAction.icon
                      : "🤖"}
                  </div>

                  <strong>
                    {computerAction
                      ? computerAction.label
                      : "WAITING"}
                  </strong>
                </div>

              </div>

            </div>

            {/* Status */}
            <div
              className={`battle-status status-${status}`}
            >
              {statusText}
            </div>

          </div>

          {/* AI */}
          <div className="fighter fighter-ai">

            <div className="fighter-title">
              <span>OPPONENT</span>
              <strong>AI</strong>
            </div>

            <HpBar
              hp={computerHp}
              side="computer"
            />

            <div className="fighter-character ai-character">
              <div className="character-glow" />

              <div className="character-body">
                <div className="character-head">
                  🤖
                </div>

                <div className="character-torso" />

                <div className="character-weapon">
                  ⚡
                </div>
              </div>
            </div>

            <div className="score-card">
              <span>SCORE</span>
              <strong>{computerScore}</strong>
            </div>

          </div>

        </section>

        {/* ==============================================
            ACTION AREA
        ============================================== */}

        <section className="action-section">

          <div className="action-heading">
            <span>CHOOSE YOUR MOVE</span>
            <small>
              Press 1, 2 or 3
            </small>
          </div>

          <div className="action-buttons">

            {ACTION_LIST.map((action) => (
              <ActionButton
                key={action.id}
                action={action}
                onClick={handleAction}
                disabled={status !== "playing"}
              />
            ))}

          </div>

          {/* Rules */}
          <div className="duel-rules">

            <div className="rule">
              <span>⚔️</span>
              <strong>ATTACK</strong>
              <small>
                Beats Special
              </small>
            </div>

            <div className="rule-arrow">
              →
            </div>

            <div className="rule">
              <span>⚡</span>
              <strong>SPECIAL</strong>
              <small>
                Beats Block
              </small>
            </div>

            <div className="rule-arrow">
              →
            </div>

            <div className="rule">
              <span>🛡️</span>
              <strong>BLOCK</strong>
              <small>
                Beats Attack
              </small>
            </div>

          </div>

        </section>

        {/* ==============================================
            GAME OVER
        ============================================== */}

        {status !== "playing" && (
          <section className="game-over-panel">

            <div className="game-over-icon">
              {status === "won"
                ? "🏆"
                : "💀"}
            </div>

            <h2>
              {status === "won"
                ? "VICTORY!"
                : "DEFEAT!"}
            </h2>

            <p>
              {status === "won"
                ? "You defeated the AI!"
                : "The AI won this duel."}
            </p>

            <div className="final-score">

              <div>
                <span>YOU</span>
                <strong>{playerScore}</strong>
              </div>

              <div className="final-vs">
                VS
              </div>

              <div>
                <span>AI</span>
                <strong>{computerScore}</strong>
              </div>

            </div>

            <button
              className="play-again-button"
              onClick={resetGame}
            >
              ⚔️ PLAY AGAIN
            </button>

            <p className="restart-hint">
              Press R to restart
            </p>

          </section>
        )}

      </main>

      {/* ================================================
          FOOTER
      ================================================ */}

      <footer className="duel-footer">

        <div>
          ⚔️ QUICK DUEL
        </div>

        <div>
  ATTACK &gt; SPECIAL
  &nbsp; • &nbsp;
  SPECIAL &gt; BLOCK
  &nbsp; • &nbsp;
  BLOCK &gt; ATTACK
</div>
        <div>
          BEST OF THE BATTLE
        </div>

      </footer>

    </div>
  );
}

export default QuickDuel;