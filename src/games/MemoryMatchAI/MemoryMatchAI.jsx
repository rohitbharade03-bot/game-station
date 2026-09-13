import { useEffect, useMemo, useRef, useState } from "react";
import "./MemoryMatchAI.css";

const LEVELS = [
  {
    level: 1,
    rows: 3,
    cols: 4,
    time: 45,
    pairs: 6,
    mistakes: 8,
  },
  {
    level: 2,
    rows: 4,
    cols: 4,
    time: 50,
    pairs: 8,
    mistakes: 8,
  },
  {
    level: 3,
    rows: 4,
    cols: 5,
    time: 60,
    pairs: 10,
    mistakes: 7,
  },
  {
    level: 4,
    rows: 5,
    cols: 6,
    time: 70,
    pairs: 15,
    mistakes: 7,
  },
  {
    level: 5,
    rows: 6,
    cols: 6,
    time: 85,
    pairs: 18,
    mistakes: 6,
  },
];

const SYMBOLS = [
  "🔥",
  "⚡",
  "🌙",
  "⭐",
  "💎",
  "🍀",
  "☀️",
  "❄️",
  "🪐",
  "🚀",
  "🎯",
  "👑",
  "🧠",
  "🎮",
  "🦊",
  "🐼",
  "🐯",
  "🦁",
  "🍉",
  "🍕",
];

const shuffle = (array) => {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));

    [copy[i], copy[randomIndex]] = [copy[randomIndex], copy[i]];
  }

  return copy;
};

const createDeck = (levelConfig) => {
  const symbols = SYMBOLS.slice(0, levelConfig.pairs);

  const cards = shuffle(
    [...symbols, ...symbols].map((symbol, index) => ({
      id: `${levelConfig.level}-${index}-${Math.random()
        .toString(36)
        .slice(2)}`,
      symbol,
      matched: false,
    }))
  );

  return cards;
};

function MemoryMatchAI() {
  const [screen, setScreen] = useState("menu");
  const [difficulty, setDifficulty] = useState("medium");
  const [levelIndex, setLevelIndex] = useState(0);

  const [deck, setDeck] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [matchedCount, setMatchedCount] = useState(0);

  const [timeLeft, setTimeLeft] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestScore, setBestScore] = useState(
    () => Number(localStorage.getItem("memory-match-ai-best") || 0)
  );

  const [message, setMessage] = useState("Find all matching pairs.");
  const [lastResult, setLastResult] = useState(null);

  const lockRef = useRef(false);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);

  const currentLevel = LEVELS[levelIndex];

  const difficultySettings = useMemo(() => {
    if (difficulty === "easy") {
      return {
        timeMultiplier: 1.3,
        scoreMultiplier: 0.8,
        extraMistakes: 3,
      };
    }

    if (difficulty === "hard") {
      return {
        timeMultiplier: 0.8,
        scoreMultiplier: 1.35,
        extraMistakes: -1,
      };
    }

    return {
      timeMultiplier: 1,
      scoreMultiplier: 1,
      extraMistakes: 0,
    };
  }, [difficulty]);

  const maxMistakes = Math.max(
    3,
    currentLevel.mistakes + difficultySettings.extraMistakes
  );

  const adjustedTime = Math.round(
    currentLevel.time * difficultySettings.timeMultiplier
  );

  const playSound = (type) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      const soundMap = {
        flip: 420,
        match: 740,
        fail: 180,
        win: 980,
        click: 320,
      };

      oscillator.frequency.value = soundMap[type] || 400;
      oscillator.type = "sine";

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.08,
        ctx.currentTime + 0.01
      );
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + 0.14
      );

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.14);
    } catch {
      // Audio can be blocked by the browser until user interaction.
    }
  };

  const saveBestScore = (value) => {
    if (value > bestScore) {
      setBestScore(value);
      localStorage.setItem("memory-match-ai-best", String(value));
    }
  };

  const startGame = (selectedDifficulty = difficulty, selectedLevel = levelIndex) => {
    const config = LEVELS[selectedLevel];

    setDifficulty(selectedDifficulty);
    setLevelIndex(selectedLevel);

    const selectedDifficultySettings =
      selectedDifficulty === "easy"
        ? { timeMultiplier: 1.3, scoreMultiplier: 0.8, extraMistakes: 3 }
        : selectedDifficulty === "hard"
        ? { timeMultiplier: 0.8, scoreMultiplier: 1.35, extraMistakes: -1 }
        : { timeMultiplier: 1, scoreMultiplier: 1, extraMistakes: 0 };

    setDeck(createDeck(config));
    setSelectedCards([]);
    setMatchedCount(0);
    setMistakes(0);
    setCombo(0);
    setScore(0);
    setMessage("Find the matching pairs.");
    setLastResult(null);
    setTimeLeft(
      Math.round(config.time * selectedDifficultySettings.timeMultiplier)
    );

    lockRef.current = false;
    setScreen("playing");

    playSound("click");
  };

  const restartCurrentGame = () => {
    startGame(difficulty, levelIndex);
  };

  const goToNextLevel = () => {
    const nextLevel = Math.min(levelIndex + 1, LEVELS.length - 1);

    startGame(difficulty, nextLevel);
  };

  const backToMenu = () => {
    clearInterval(timerRef.current);

    setScreen("menu");
    setSelectedCards([]);
    setDeck([]);
    setMessage("Find all matching pairs.");
  };

  const finishGame = (result, finalScore) => {
    clearInterval(timerRef.current);

    const safeFinalScore = Math.max(0, Math.round(finalScore));

    saveBestScore(safeFinalScore);

    setLastResult({
      result,
      score: safeFinalScore,
      level: currentLevel.level,
      matchedPairs: matchedCount,
      mistakes,
      timeLeft,
    });

    setScreen("result");

    playSound(result === "win" ? "win" : "fail");
  };

  useEffect(() => {
    if (screen !== "playing") {
      clearInterval(timerRef.current);
      return undefined;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          clearInterval(timerRef.current);

          setTimeout(() => {
            finishGame("timeout", score);
          }, 0);

          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  useEffect(() => {
    if (screen !== "playing") {
      return;
    }

    if (
      matchedCount === currentLevel.pairs &&
      currentLevel.pairs > 0
    ) {
      const levelBonus =
        timeLeft * 10 + Math.max(0, maxMistakes - mistakes) * 50;

      const difficultyBonus = Math.round(
        levelBonus * difficultySettings.scoreMultiplier
      );

      const finalScore = score + difficultyBonus;

      setTimeout(() => {
        finishGame("win", finalScore);
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedCount]);

  const handleCardClick = (index) => {
    if (screen !== "playing") return;
    if (lockRef.current) return;
    if (selectedCards.length === 2) return;

    const clickedCard = deck[index];

    if (!clickedCard || clickedCard.matched) return;
    if (selectedCards.includes(index)) return;

    playSound("flip");

    const nextSelected = [...selectedCards, index];
    setSelectedCards(nextSelected);

    if (nextSelected.length !== 2) {
      return;
    }

    lockRef.current = true;

    const firstIndex = nextSelected[0];
    const secondIndex = nextSelected[1];

    const firstCard = deck[firstIndex];
    const secondCard = deck[secondIndex];

    const isMatch = firstCard.symbol === secondCard.symbol;

    setTimeout(() => {
      if (isMatch) {
        playSound("match");

        setDeck((currentDeck) =>
          currentDeck.map((card, cardIndex) =>
            cardIndex === firstIndex || cardIndex === secondIndex
              ? { ...card, matched: true }
              : card
          )
        );

        setMatchedCount((previous) => previous + 1);

        setCombo((previous) => previous + 1);

        const comboBonus = Math.min(combo + 1, 8) * 15;
        const basePoints = 100 + comboBonus;

        const earnedPoints = Math.round(
          basePoints * difficultySettings.scoreMultiplier
        );

        setScore((previous) => previous + earnedPoints);

        setMessage(`MATCH! +${earnedPoints} points`);
      } else {
        playSound("fail");

        setMistakes((previous) => {
          const nextMistakes = previous + 1;

          setCombo(0);
          setMessage(`Not a match — ${maxMistakes - nextMistakes} mistakes left`);

          if (nextMistakes >= maxMistakes) {
            setTimeout(() => {
              finishGame("failed", score);
            }, 350);
          }

          return nextMistakes;
        });
      }

      setSelectedCards([]);
      lockRef.current = false;
    }, 650);
  };

  const isCardVisible = (index) =>
    selectedCards.includes(index) || deck[index]?.matched;

  const formatTime = (seconds) => {
    const safeSeconds = Math.max(0, seconds);

    const minutes = Math.floor(safeSeconds / 60)
      .toString()
      .padStart(2, "0");

    const remainingSeconds = (safeSeconds % 60)
      .toString()
      .padStart(2, "0");

    return `${minutes}:${remainingSeconds}`;
  };

  if (screen === "menu") {
    return (
      <div className="memory-game">
        <div className="memory-bg-orb orb-one" />
        <div className="memory-bg-orb orb-two" />

        <div className="memory-menu">
          <div className="memory-brand">
            <div className="memory-brand-icon">🧠</div>

            <div>
              <span className="memory-kicker">GAME 15</span>
              <h1>MEMORY MATCH AI</h1>
            </div>
          </div>

          <p className="memory-subtitle">
            Match the pairs. Beat the clock. Train your brain.
          </p>

          <div className="memory-menu-grid">
            <section className="memory-panel">
              <div className="panel-label">DIFFICULTY</div>

              <div className="difficulty-buttons">
                {["easy", "medium", "hard"].map((item) => (
                  <button
                    key={item}
                    className={`difficulty-button ${
                      difficulty === item ? "active" : ""
                    }`}
                    onClick={() => setDifficulty(item)}
                  >
                    <span>
                      {item === "easy"
                        ? "🌱"
                        : item === "medium"
                        ? "⚡"
                        : "🔥"}
                    </span>

                    <strong>{item}</strong>
                  </button>
                ))}
              </div>

              <div className="panel-label level-label">LEVEL</div>

              <div className="level-list">
                {LEVELS.map((item, index) => {
                  const unlocked = index === 0 || index <= levelIndex;

                  return (
                    <button
                      key={item.level}
                      className={`level-button ${
                        index === levelIndex ? "selected" : ""
                      } ${!unlocked ? "locked" : ""}`}
                      disabled={!unlocked}
                      onClick={() => setLevelIndex(index)}
                    >
                      <span className="level-number">
                        {item.level}
                      </span>

                      <span>
                        <strong>Level {item.level}</strong>
                        <small>
                          {item.rows}×{item.cols} • {item.pairs} pairs
                        </small>
                      </span>

                      {!unlocked && <span>🔒</span>}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="memory-panel stats-panel">
              <div className="panel-label">YOUR BEST</div>

              <div className="best-score">
                {bestScore.toLocaleString()}
              </div>

              <div className="menu-stat-row">
                <span>Selected</span>
                <strong>
                  Level {currentLevel.level}
                </strong>
              </div>

              <div className="menu-stat-row">
                <span>Grid</span>
                <strong>
                  {currentLevel.rows} × {currentLevel.cols}
                </strong>
              </div>

              <div className="menu-stat-row">
                <span>Time</span>
                <strong>{adjustedTime}s</strong>
              </div>

              <div className="menu-stat-row">
                <span>Max mistakes</span>
                <strong>{maxMistakes}</strong>
              </div>

              <button
                className="start-memory-button"
                onClick={() => startGame(difficulty, levelIndex)}
              >
                <span>▶</span>
                START GAME
              </button>

              <p className="adaptive-note">
                🤖 AI Director adjusts challenge based on your
                performance.
              </p>
            </section>
          </div>

          <div className="memory-how">
            <span>HOW TO PLAY</span>
            <p>
              Open two cards. Find matching symbols. Build combos,
              avoid mistakes and finish before time runs out.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "playing") {
    return (
      <div className="memory-game">
        <div className="memory-bg-orb orb-one" />
        <div className="memory-bg-orb orb-two" />

        <div className="memory-play-screen">
          <header className="memory-topbar">
            <button
              className="memory-icon-button"
              onClick={backToMenu}
              title="Menu"
            >
              ←
            </button>

            <div className="playing-title">
              <span>MEMORY MATCH AI</span>
              <small>
                Level {currentLevel.level} • {difficulty}
              </small>
            </div>

            <button
              className="memory-icon-button"
              onClick={restartCurrentGame}
              title="Restart"
            >
              ↻
            </button>
          </header>

          <div className="hud-grid">
            <div className="hud-card">
              <span>TIME</span>
              <strong
                className={timeLeft <= 10 ? "danger-text" : ""}
              >
                {formatTime(timeLeft)}
              </strong>
            </div>

            <div className="hud-card">
              <span>SCORE</span>
              <strong>{score.toLocaleString()}</strong>
            </div>

            <div className="hud-card">
              <span>COMBO</span>
              <strong>×{combo}</strong>
            </div>

            <div className="hud-card">
              <span>MISTAKES</span>
              <strong>
                {mistakes}/{maxMistakes}
              </strong>
            </div>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${
                  (matchedCount / currentLevel.pairs) * 100
                }%`,
              }}
            />
          </div>

          <div className="memory-message">{message}</div>

          <main
            className="memory-board"
            style={{
              gridTemplateColumns: `repeat(${currentLevel.cols}, minmax(0, 1fr))`,
            }}
          >
            {deck.map((card, index) => {
              const visible = isCardVisible(index);

              return (
                <button
                  key={card.id}
                  className={`memory-card ${
                    visible ? "revealed" : ""
                  } ${card.matched ? "matched" : ""}`}
                  onClick={() => handleCardClick(index)}
                  disabled={card.matched}
                >
                  <span className="card-inner">
                    <span className="card-front">?</span>

                    <span className="card-back">
                      {card.symbol}
                    </span>
                  </span>
                </button>
              );
            })}
          </main>

          <div className="memory-bottom-info">
            <span>
              Pairs <strong>{matchedCount}</strong>/
              {currentLevel.pairs}
            </span>

            <span>🤖 Adaptive AI: ACTIVE</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="memory-game">
      <div className="memory-bg-orb orb-one" />
      <div className="memory-bg-orb orb-two" />

      <div className="memory-result-screen">
        <div
          className={`result-icon ${
            lastResult?.result === "win"
              ? "win"
              : "loss"
          }`}
        >
          {lastResult?.result === "win"
            ? "🏆"
            : lastResult?.result === "timeout"
            ? "⏰"
            : "💥"}
        </div>

        <span className="memory-kicker">GAME 15</span>

        <h1>
          {lastResult?.result === "win"
            ? "PERFECT MATCH!"
            : lastResult?.result === "timeout"
            ? "TIME'S UP!"
            : "GAME OVER"}
        </h1>

        <p className="result-message">
          {lastResult?.result === "win"
            ? "Your memory was sharp. Great run!"
            : "Try again and beat your previous score."}
        </p>

        <div className="result-score">
          {lastResult?.score?.toLocaleString() || 0}
          <small>POINTS</small>
        </div>

        <div className="result-stats">
          <div>
            <span>LEVEL</span>
            <strong>{lastResult?.level || 1}</strong>
          </div>

          <div>
            <span>PAIRS</span>
            <strong>{lastResult?.matchedPairs || 0}</strong>
          </div>

          <div>
            <span>MISTAKES</span>
            <strong>{lastResult?.mistakes || 0}</strong>
          </div>

          <div>
            <span>BEST</span>
            <strong>{bestScore.toLocaleString()}</strong>
          </div>
        </div>

        <div className="result-actions">
          <button
            className="secondary-result-button"
            onClick={backToMenu}
          >
            MENU
          </button>

          <button
            className="primary-result-button"
            onClick={
              lastResult?.result === "win" &&
              levelIndex < LEVELS.length - 1
                ? goToNextLevel
                : restartCurrentGame
            }
          >
            {lastResult?.result === "win" &&
            levelIndex < LEVELS.length - 1
              ? "NEXT LEVEL →"
              : "PLAY AGAIN"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MemoryMatchAI;