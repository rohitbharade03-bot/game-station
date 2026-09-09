import { useCallback, useEffect, useMemo, useState } from "react";
import "./FindTheOddOne.css";

const MODES = {
  easy: {
    name: "Easy",
    icon: "🌱",
    description: "Warm up your observation",
    startGrid: 3,
    maxGrid: 5,
    baseTime: 30,
    levelsPerStage: 10,
  },
  medium: {
    name: "Medium",
    icon: "⚡",
    description: "Test your concentration",
    startGrid: 4,
    maxGrid: 6,
    baseTime: 25,
    levelsPerStage: 10,
  },
  hard: {
    name: "Hard",
    icon: "🔥",
    description: "Extreme observation challenge",
    startGrid: 5,
    maxGrid: 8,
    baseTime: 20,
    levelsPerStage: 10,
  },
};

const SYMBOLS = [
  "●",
  "◆",
  "▲",
  "■",
  "★",
  "✦",
  "✚",
  "⬟",
  "⬢",
  "✿",
];

const COLORS = [
  "#58a6ff",
  "#ff5c7a",
  "#ffd166",
  "#63e6be",
  "#b197fc",
  "#ff922b",
];

const DEFAULT_PROGRESS = {
  easy: 1,
  medium: 1,
  hard: 1,
};

const STORAGE_KEY = "game-station-find-odd-progress-v1";

function loadProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return DEFAULT_PROGRESS;
    }

    const parsed = JSON.parse(saved);

    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function saveProgress(progress) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(progress)
    );
  } catch {
    // Local storage may be unavailable.
  }
}

function getGridSize(mode, level) {
  const config = MODES[mode];

  const increase = Math.floor((level - 1) / 3);

  return Math.min(
    config.startGrid + increase,
    config.maxGrid
  );
}

function getPuzzleType(mode, level) {
  const types = [
    "color",
    "size",
    "shape",
    "rotation",
    "mixed",
  ];

  if (mode === "easy") {
    return types[level % 2];
  }

  if (mode === "medium") {
    return types[1 + (level % 3)];
  }

  return types[2 + (level % 3)];
}

function createPuzzle(mode, level) {
  const gridSize = getGridSize(mode, level);
  const total = gridSize * gridSize;

  const oddIndex = Math.floor(Math.random() * total);

  const symbolIndex = Math.floor(
    Math.random() * SYMBOLS.length
  );

  const colorIndex = Math.floor(
    Math.random() * COLORS.length
  );

  const symbol = SYMBOLS[symbolIndex];
  const color = COLORS[colorIndex];

  const type = getPuzzleType(mode, level);

  const rotation =
    Math.floor(Math.random() * 4) * 15;

  const oddRotation =
    rotation +
    (mode === "hard"
      ? 45
      : mode === "medium"
      ? 30
      : 15);

  const baseSize =
    mode === "easy"
      ? 48
      : mode === "medium"
      ? 44
      : 40;

  const oddSize =
    type === "size"
      ? baseSize - (mode === "hard" ? 6 : 9)
      : baseSize;

  const normal = {
    symbol,
    color,
    size: baseSize,
    rotation,
  };

  const odd = {
    symbol,
    color,
    size: oddSize,
    rotation,
  };

  if (type === "color") {
    let oddColor =
      COLORS[(colorIndex + 1) % COLORS.length];

    odd.color = oddColor;
  }

  if (type === "shape") {
    let oddSymbol =
      SYMBOLS[(symbolIndex + 1) % SYMBOLS.length];

    odd.symbol = oddSymbol;
  }

  if (type === "rotation") {
    odd.rotation = oddRotation;
  }

  if (type === "mixed") {
    let oddSymbol =
      SYMBOLS[(symbolIndex + 1) % SYMBOLS.length];

    let oddColor =
      COLORS[(colorIndex + 1) % COLORS.length];

    odd.symbol = oddSymbol;
    odd.color = oddColor;
    odd.rotation = oddRotation;
    odd.size =
      baseSize -
      (mode === "hard" ? 5 : 3);
  }

  return {
    gridSize,
    total,
    oddIndex,
    normal,
    odd,
    type,
  };
}

function FindTheOddOne() {
  const [screen, setScreen] = useState("menu");

  const [mode, setMode] = useState("easy");

  const [progress, setProgress] = useState(
    loadProgress
  );

  const [level, setLevel] = useState(1);

  const [puzzle, setPuzzle] = useState(null);

  const [timeLeft, setTimeLeft] = useState(30);

  const [score, setScore] = useState(0);

  const [streak, setStreak] = useState(0);

  const [lives, setLives] = useState(3);

  const [hintUsed, setHintUsed] = useState(false);

  const [selectedIndex, setSelectedIndex] =
    useState(null);

  const [result, setResult] = useState("");

  const [bestScore, setBestScore] = useState(0);

  const config = MODES[mode];

  const currentLevel = progress[mode] || 1;

  const timerPercent = useMemo(() => {
    return Math.max(
      0,
      Math.min(
        100,
        (timeLeft / config.baseTime) * 100
      )
    );
  }, [timeLeft, config.baseTime]);

  const startMode = (selectedMode) => {
    const savedLevel =
      progress[selectedMode] || 1;

    setMode(selectedMode);
    setLevel(savedLevel);
    setScore(0);
    setStreak(0);
    setLives(3);
    setHintUsed(false);
    setSelectedIndex(null);
    setResult("");
    setScreen("game");

    setPuzzle(
      createPuzzle(
        selectedMode,
        savedLevel
      )
    );

    setTimeLeft(
      MODES[selectedMode].baseTime
    );
  };

  const startGame = () => {
    startMode(mode);
  };

  const goToMenu = () => {
    setScreen("menu");
    setPuzzle(null);
    setSelectedIndex(null);
    setResult("");
  };

  const nextLevel = useCallback(() => {
    const next = level + 1;

    const updatedProgress = {
      ...progress,
      [mode]: Math.max(
        progress[mode] || 1,
        next
      ),
    };

    setProgress(updatedProgress);
    saveProgress(updatedProgress);

    setLevel(next);
    setPuzzle(
      createPuzzle(mode, next)
    );
    setTimeLeft(config.baseTime);
    setHintUsed(false);
    setSelectedIndex(null);
    setResult("");
    setScreen("game");
  }, [
    level,
    mode,
    progress,
    config.baseTime,
  ]);

  const finishGame = useCallback(() => {
    setScreen("gameover");
  }, []);

  const loseLife = useCallback(() => {
    const newLives = lives - 1;

    setLives(newLives);
    setStreak(0);
    setSelectedIndex(null);
    setResult("wrong");

    if (newLives <= 0) {
      setTimeout(() => {
        finishGame();
      }, 500);

      return;
    }

    setTimeout(() => {
      setPuzzle(
        createPuzzle(mode, level)
      );
      setTimeLeft(config.baseTime);
      setHintUsed(false);
      setResult("");
    }, 550);
  }, [
    lives,
    mode,
    level,
    config.baseTime,
    finishGame,
  ]);

  const handleCellClick = (index) => {
    if (
      screen !== "game" ||
      !puzzle ||
      selectedIndex !== null ||
      result
    ) {
      return;
    }

    setSelectedIndex(index);

    if (index === puzzle.oddIndex) {
      const speedBonus = Math.max(
        0,
        timeLeft * 5
      );

      const streakBonus =
        streak * 25;

      const levelBonus =
        level * 20;

      const earned =
        100 +
        speedBonus +
        streakBonus +
        levelBonus;

      const newStreak = streak + 1;

      setScore(
        (current) =>
          current + earned
      );

      setBestScore((current) =>
        Math.max(
          current,
          score + earned
        )
      );

      setStreak(newStreak);
      setResult("correct");

      const next = level + 1;

      const updatedProgress = {
        ...progress,
        [mode]: Math.max(
          progress[mode] || 1,
          next
        ),
      };

      setProgress(updatedProgress);
      saveProgress(updatedProgress);

      setTimeout(() => {
        setLevel(next);
        setPuzzle(
          createPuzzle(mode, next)
        );
        setTimeLeft(config.baseTime);
        setHintUsed(false);
        setSelectedIndex(null);
        setResult("");
      }, 800);
    } else {
      loseLife();
    }
  };

  const useHint = () => {
    if (
      hintUsed ||
      !puzzle ||
      screen !== "game"
    ) {
      return;
    }

    setHintUsed(true);
    setTimeLeft((current) =>
      Math.max(0, current - 3)
    );
  };

  useEffect(() => {
    if (screen !== "game") return;

    if (timeLeft <= 0) {
      loseLife();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((current) =>
        Math.max(0, current - 1)
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [
    screen,
    timeLeft,
    loseLife,
  ]);

  useEffect(() => {
    if (screen !== "game") return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        goToMenu();
      }

      if (
        event.key.toLowerCase() === "h"
      ) {
        useHint();
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
  }, [screen, puzzle, hintUsed]);

  const resetProgress = () => {
    const fresh = {
      easy: 1,
      medium: 1,
      hard: 1,
    };

    setProgress(fresh);
    saveProgress(fresh);
  };

  const getCellClass = (index) => {
    let classes = "odd-cell";

    if (
      selectedIndex === index &&
      result === "correct"
    ) {
      classes += " selected-correct";
    }

    if (
      selectedIndex === index &&
      result === "wrong"
    ) {
      classes += " selected-wrong";
    }

    if (
      hintUsed &&
      puzzle &&
      index === puzzle.oddIndex
    ) {
      classes += " hint-cell";
    }

    return classes;
  };

  const renderCell = (index) => {
    if (!puzzle) return null;

    const isOdd =
      index === puzzle.oddIndex;

    const item = isOdd
      ? puzzle.odd
      : puzzle.normal;

    return (
      <button
        key={index}
        className={getCellClass(index)}
        onClick={() =>
          handleCellClick(index)
        }
        aria-label={`Puzzle item ${
          index + 1
        }`}
      >
        <span
          className="odd-symbol"
          style={{
            color: item.color,
            fontSize: `${item.size}px`,
            transform: `rotate(${item.rotation}deg)`,
          }}
        >
          {item.symbol}
        </span>
      </button>
    );
  };

  if (screen === "menu") {
    return (
      <div className="odd-game">

        <div className="odd-menu">

          <div className="odd-logo">
            <span className="logo-icon">
              👁️
            </span>

            <div>
              <small>
                GAME STATION
              </small>

              <h1>
                FIND THE
                <strong>ODD ONE</strong>
              </h1>
            </div>
          </div>

          <p className="odd-subtitle">
            Train your eyes. Challenge your
            brain. Find what doesn't belong.
          </p>

          <div className="mode-title">
            SELECT DIFFICULTY
          </div>

          <div className="mode-grid">

            {Object.entries(MODES).map(
              ([key, item]) => {
                const saved =
                  progress[key] || 1;

                return (
                  <button
                    key={key}
                    className={`mode-card ${
                      mode === key
                        ? "active-mode"
                        : ""
                    }`}
                    onClick={() =>
                      setMode(key)
                    }
                  >
                    <span className="mode-icon">
                      {item.icon}
                    </span>

                    <strong>
                      {item.name}
                    </strong>

                    <small>
                      {item.description}
                    </small>

                    <div className="mode-progress">
                      <span>
                        LEVEL {saved}
                      </span>

                      <span>
                        {key === "easy"
                          ? "3×3 → 5×5"
                          : key === "medium"
                          ? "4×4 → 6×6"
                          : "5×5 → 8×8"}
                      </span>
                    </div>
                  </button>
                );
              }
            )}

          </div>

          <button
            className="start-button"
            onClick={startGame}
          >
            PLAY LEVEL {currentLevel}
            <span>→</span>
          </button>

          <div className="menu-info">
            <span>
              ❤️ 3 LIVES
            </span>

            <span>
              ⏱️ TIMER
            </span>

            <span>
              💡 HINT
            </span>

            <span>
              🏆 LEVEL SAVE
            </span>
          </div>

          <button
            className="reset-progress"
            onClick={resetProgress}
          >
            Reset Progress
          </button>

        </div>

      </div>
    );
  }

  if (screen === "gameover") {
    return (
      <div className="odd-game">

        <div className="result-screen">

          <div className="result-icon">
            💥
          </div>

          <div className="result-label">
            GAME OVER
          </div>

          <h1>
            KEEP
            <strong>TRAINING</strong>
          </h1>

          <div className="result-stats">

            <div>
              <small>SCORE</small>
              <strong>{score}</strong>
            </div>

            <div>
              <small>LEVEL</small>
              <strong>{level}</strong>
            </div>

            <div>
              <small>BEST</small>
              <strong>
                {Math.max(
                  bestScore,
                  score
                )}
              </strong>
            </div>

          </div>

          <p>
            Your progress is saved.
            <br />
            Come back and continue from
            Level {progress[mode] || 1}.
          </p>

          <div className="result-actions">

            <button
              className="start-button"
              onClick={startGame}
            >
              TRY AGAIN
              <span>↻</span>
            </button>

            <button
              className="secondary-button"
              onClick={goToMenu}
            >
              CHANGE MODE
            </button>

          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="odd-game">

      <header className="odd-header">

        <button
          className="back-game"
          onClick={goToMenu}
        >
          ←
        </button>

        <div className="header-title">
          <small>
            {config.icon}{" "}
            {config.name.toUpperCase()}
          </small>

          <strong>
            FIND THE ODD ONE
          </strong>
        </div>

        <div className="header-level">
          LEVEL
          <strong>{level}</strong>
        </div>

      </header>

      <main className="odd-main">

        <div className="game-stats">

          <div className="stat-box">
            <small>SCORE</small>
            <strong>{score}</strong>
          </div>

          <div className="stat-box">
            <small>STREAK</small>
            <strong>
              🔥 {streak}
            </strong>
          </div>

          <div className="stat-box lives-box">
            <small>LIVES</small>

            <strong>
              {"❤️".repeat(lives)}
              {"🖤".repeat(
                Math.max(
                  0,
                  3 - lives
                )
              )}
            </strong>
          </div>

        </div>

        <div className="level-heading">

          <div>
            <span>
              {config.icon}{" "}
              {config.name}
            </span>

            <h2>
              Find the different one
            </h2>

            <p>
              Look carefully. One item
              doesn't match the others.
            </p>
          </div>

          <div className="timer-box">

            <small>
              TIME
            </small>

            <strong
              className={
                timeLeft <= 5
                  ? "danger-time"
                  : ""
              }
            >
              {timeLeft}s
            </strong>

            <div className="timer-track">
              <span
                style={{
                  width: `${timerPercent}%`,
                }}
              />
            </div>

          </div>

        </div>

        <div
          className="puzzle-board"
          style={{
            gridTemplateColumns: `repeat(${puzzle.gridSize}, 1fr)`,
          }}
        >
          {Array.from({
            length: puzzle.total,
          }).map((_, index) =>
            renderCell(index)
          )}
        </div>

        <div className="game-actions">

          <button
            className="hint-button"
            disabled={hintUsed}
            onClick={useHint}
          >
            💡{" "}
            {hintUsed
              ? "HINT USED"
              : "USE HINT"}
          </button>

          <div className="keyboard-help">
            <span>
              ESC
            </span>
            Menu

            <span>
              H
            </span>
            Hint
          </div>

        </div>

        {result === "correct" && (
          <div className="feedback correct-feedback">
            <span>✓</span>
            CORRECT! +SCORE
          </div>
        )}

        {result === "wrong" && (
          <div className="feedback wrong-feedback">
            <span>✕</span>
            NOT THAT ONE!
          </div>
        )}

      </main>

    </div>
  );
}

export default FindTheOddOne;