import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./MindVault.css";

/*
  ============================================================
  MINDVAULT: ESCAPE
  Game #9 — Puzzle + Logic + Escape

  Controls:
  Arrow Keys / WASD = Move
  R = Restart Level
  Enter = Start / Continue
  M = Sound ON/OFF

  Symbols:
  P = Player
  E = Exit
  # = Wall
  C = Coin / Shard
  S = Switch
  L = Laser
  B = Block
  T = Teleporter
  . = Floor

  Goal:
  Collect shards, activate switches and reach the exit.
  ============================================================
*/

const LEVELS = [
  {
    id: 1,
    world: "TRAINING VAULT",
    title: "First Escape",
    difficulty: "EASY",
    time: 45,
    targetMoves: 16,
    grid: [
      "##########",
      "#P..C....#",
      "#.####.#.#",
      "#....S.#.#",
      "#.####.#.#",
      "#....C...#",
      "#.######.#",
      "#......E.#",
      "##########",
    ],
    requiredShards: 1,
  },

  {
    id: 2,
    world: "TRAINING VAULT",
    title: "Switch Protocol",
    difficulty: "EASY",
    time: 50,
    targetMoves: 22,
    grid: [
      "##########",
      "#P...#...#",
      "#.#C.#.#E#",
      "#.#..S.#.#",
      "#.####.#.#",
      "#....C...#",
      "###.######",
      "#........#",
      "##########",
    ],
    requiredShards: 2,
  },

  {
    id: 3,
    world: "NEON LAB",
    title: "Laser Corridor",
    difficulty: "NORMAL",
    time: 55,
    targetMoves: 25,
    grid: [
      "############",
      "#P....#...E#",
      "#.##L.#.##.#",
      "#..C..#....#",
      "###.####L###",
      "#S.......C.#",
      "#.########.#",
      "#..........#",
      "############",
    ],
    requiredShards: 2,
  },

  {
    id: 4,
    world: "NEON LAB",
    title: "The Long Way",
    difficulty: "NORMAL",
    time: 60,
    targetMoves: 30,
    grid: [
      "############",
      "#P...#....E#",
      "#.#C.###.#.#",
      "#.#...S.#..#",
      "#.#####.##.#",
      "#...C......#",
      "###.######.#",
      "#..........#",
      "############",
    ],
    requiredShards: 2,
  },

  {
    id: 5,
    world: "LASER CORE",
    title: "Red Zone",
    difficulty: "HARD",
    time: 60,
    targetMoves: 32,
    grid: [
      "############",
      "#P....L....#",
      "#.#######..#",
      "#C......#E.#",
      "#####L#.#..#",
      "#S....#...C#",
      "#.##########",
      "#..........#",
      "############",
    ],
    requiredShards: 2,
  },

  {
    id: 6,
    world: "LASER CORE",
    title: "Core Breach",
    difficulty: "HARD",
    time: 65,
    targetMoves: 36,
    grid: [
      "#############",
      "#P..C....#E.#",
      "#.#####L.#..#",
      "#.....#..#..#",
      "###.#.#######",
      "#S..#....C..#",
      "#.#.######..#",
      "#...........#",
      "#############",
    ],
    requiredShards: 2,
  },

  {
    id: 7,
    world: "MIRROR CHAMBER",
    title: "Mirror Maze",
    difficulty: "HARD",
    time: 70,
    targetMoves: 40,
    grid: [
      "#############",
      "#P....#.....#",
      "#.###.#.###E#",
      "#C#...#...#.#",
      "#.#.#####.#.#",
      "#...S...#C..#",
      "#####.#.#####",
      "#...........#",
      "#############",
    ],
    requiredShards: 2,
  },

  {
    id: 8,
    world: "GRAVITY VAULT",
    title: "Gravity Shift",
    difficulty: "INSANE",
    time: 75,
    targetMoves: 45,
    grid: [
      "#############",
      "#P..#.......#",
      "#.#.#.#####.#",
      "#.#C#.....#E#",
      "#.###.###.#.#",
      "#S....#...#.#",
      "#####.#.###.#",
      "#C..........#",
      "#############",
    ],
    requiredShards: 2,
  },

  {
    id: 9,
    world: "AI FORTRESS",
    title: "System Override",
    difficulty: "INSANE",
    time: 80,
    targetMoves: 50,
    grid: [
      "##############",
      "#P....#......#",
      "#.##C.#.####.#",
      "#....L#....#E#",
      "###.#####L#.#",
      "#S...C....#.#",
      "#.#########.#",
      "#...........#",
      "##############",
    ],
    requiredShards: 2,
  },

  {
    id: 10,
    world: "FINAL MINDVAULT",
    title: "The Last Door",
    difficulty: "MASTER",
    time: 95,
    targetMoves: 60,
    grid: [
      "##############",
      "#P..C....#...#",
      "#.#####..#.#E#",
      "#.....#L...#.#",
      "###.#.#####..#",
      "#S..#....C...#",
      "#.#.######L###",
      "#............#",
      "##############",
    ],
    requiredShards: 2,
  },
];

const DIRECTIONS = {
  ArrowUp: { row: -1, col: 0 },
  ArrowDown: { row: 1, col: 0 },
  ArrowLeft: { row: 0, col: -1 },
  ArrowRight: { row: 0, col: 1 },

  w: { row: -1, col: 0 },
  W: { row: -1, col: 0 },
  s: { row: 1, col: 0 },
  S: { row: 1, col: 0 },
  a: { row: 0, col: -1 },
  A: { row: 0, col: -1 },
  d: { row: 0, col: 1 },
  D: { row: 0, col: 1 },
};

const cloneGrid = (grid) => grid.map((row) => row.split(""));

function findPlayer(grid) {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === "P") {
        return { row: r, col: c };
      }
    }
  }

  return { row: 1, col: 1 };
}

function countSymbol(grid, symbol) {
  return grid.reduce(
    (total, row) =>
      total +
      row.reduce(
        (rowTotal, cell) => rowTotal + (cell === symbol ? 1 : 0),
        0
      ),
    0
  );
}

function getInitialState(level) {
  const grid = cloneGrid(level.grid);
  const player = findPlayer(grid);

  return {
    grid,
    player,
    moves: 0,
    timeLeft: level.time,
    shards: 0,
    score: 0,
    combo: 0,
    switchActive: false,
    gameState: "ready",
    message: "",
    collected: [],
  };
}

function getDifficultyMultiplier(difficulty) {
  switch (difficulty) {
    case "EASY":
      return 1;
    case "NORMAL":
      return 1.25;
    case "HARD":
      return 1.5;
    case "INSANE":
      return 1.9;
    case "MASTER":
      return 2.5;
    default:
      return 1;
  }
}

function getCellClass(cell) {
  if (cell === "#") return "mv-wall";
  if (cell === "P") return "mv-playerCell";
  if (cell === "E") return "mv-exit";
  if (cell === "C") return "mv-shard";
  if (cell === "S") return "mv-switch";
  if (cell === "L") return "mv-laser";
  if (cell === "B") return "mv-block";
  if (cell === "T") return "mv-teleporter";

  return "mv-floor";
}

function CellIcon({ cell }) {
  if (cell === "#") return <span className="mv-wallIcon">◆</span>;
  if (cell === "P") return <span className="mv-playerIcon">◆</span>;
  if (cell === "E") return <span className="mv-exitIcon">↗</span>;
  if (cell === "C") return <span className="mv-shardIcon">◆</span>;
  if (cell === "S") return <span className="mv-switchIcon">●</span>;
  if (cell === "L") return <span className="mv-laserIcon">⚡</span>;
  if (cell === "B") return <span className="mv-blockIcon">■</span>;
  if (cell === "T") return <span className="mv-teleportIcon">◎</span>;

  return null;
}

export default function MindVault() {
  const [levelIndex, setLevelIndex] = useState(0);

  const [state, setState] = useState(() =>
    getInitialState(LEVELS[0])
  );

  const [soundOn, setSoundOn] = useState(true);

  const [bestScores, setBestScores] = useState(() => {
    try {
      const saved = localStorage.getItem("mindvault_best_scores");

      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const level = LEVELS[levelIndex];

  const difficultyMultiplier = useMemo(
    () => getDifficultyMultiplier(level.difficulty),
    [level.difficulty]
  );

  const resetLevel = useCallback(() => {
    setState(getInitialState(level));
  }, [level]);

  const playSound = useCallback(
    (type) => {
      if (!soundOn) return;

      try {
        const AudioContext =
          window.AudioContext || window.webkitAudioContext;

        if (!AudioContext) return;

        const ctx = new AudioContext();

        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        const settings = {
          move: [250, 0.035, "sine"],
          coin: [760, 0.08, "triangle"],
          switch: [520, 0.12, "square"],
          error: [120, 0.16, "sawtooth"],
          win: [880, 0.25, "sine"],
          click: [400, 0.05, "square"],
        };

        const [frequency, duration, wave] =
          settings[type] || settings.click;

        oscillator.type = wave;
        oscillator.frequency.setValueAtTime(
          frequency,
          ctx.currentTime
        );

        gain.gain.setValueAtTime(0.0001, ctx.currentTime);

        gain.gain.exponentialRampToValueAtTime(
          0.07,
          ctx.currentTime + 0.01
        );

        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          ctx.currentTime + duration
        );

        oscillator.start();
        oscillator.stop(ctx.currentTime + duration + 0.02);

        setTimeout(() => {
          try {
            ctx.close();
          } catch {
            // Ignore audio cleanup errors.
          }
        }, 500);
      } catch {
        // Audio is optional.
      }
    },
    [soundOn]
  );

  const startGame = useCallback(() => {
    setState((prev) => ({
      ...prev,
      gameState: "playing",
      message: "SYSTEM ONLINE",
    }));

    playSound("click");
  }, [playSound]);

  const calculateScore = useCallback(
    (moves, timeLeft, shards, combo) => {
      const base = 1000;

      const timeBonus = Math.max(0, timeLeft * 15);

      const moveBonus = Math.max(
        0,
        (level.targetMoves - moves) * 25
      );

      const shardBonus = shards * 250;

      const comboBonus = combo * 40;

      return Math.max(
        100,
        Math.round(
          (base +
            timeBonus +
            moveBonus +
            shardBonus +
            comboBonus) *
            difficultyMultiplier
        )
      );
    },
    [
      difficultyMultiplier,
      level.targetMoves,
    ]
  );

  const finishLevel = useCallback(
    (currentState) => {
      const finalScore = calculateScore(
        currentState.moves,
        currentState.timeLeft,
        currentState.shards,
        currentState.combo
      );

      let stars = 1;

      if (
        currentState.moves <= level.targetMoves &&
        currentState.timeLeft > level.time * 0.25
      ) {
        stars = 3;
      } else if (
        currentState.moves <= level.targetMoves + 8
      ) {
        stars = 2;
      }

      const scoreKey = String(level.id);

      setBestScores((previous) => {
        const oldBest = previous[scoreKey] || 0;

        const next = {
          ...previous,
          [scoreKey]: Math.max(oldBest, finalScore),
        };

        try {
          localStorage.setItem(
            "mindvault_best_scores",
            JSON.stringify(next)
          );
        } catch {
          // Ignore localStorage errors.
        }

        return next;
      });

      setState((prev) => ({
        ...prev,
        score: finalScore,
        gameState: "won",
        message:
          stars === 3
            ? "PERFECT SOLVE"
            : stars === 2
            ? "SYSTEM ESCAPED"
            : "VAULT CLEARED",
        stars,
      }));

      playSound("win");
    },
    [
      calculateScore,
      level,
      playSound,
    ]
  );

  const movePlayer = useCallback(
    (key) => {
      if (state.gameState !== "playing") return;

      const direction = DIRECTIONS[key];

      if (!direction) return;

      setState((prev) => {
        const currentGrid = prev.grid;
        const current = prev.player;

        const nextRow =
          current.row + direction.row;

        const nextCol =
          current.col + direction.col;

        if (
          nextRow < 0 ||
          nextRow >= currentGrid.length ||
          nextCol < 0 ||
          nextCol >= currentGrid[nextRow].length
        ) {
          playSound("error");

          return {
            ...prev,
            message: "BOUNDARY LOCKED",
          };
        }

        const target = currentGrid[nextRow][nextCol];

        if (target === "#") {
          playSound("error");

          return {
            ...prev,
            message: "WALL BLOCKED",
          };
        }

        if (
          target === "L" &&
          !prev.switchActive
        ) {
          playSound("error");

          return {
            ...prev,
            message: "LASER ACTIVE",
          };
        }

        if (target === "B") {
          playSound("error");

          return {
            ...prev,
            message: "BLOCK LOCKED",
          };
        }

        let nextGrid = currentGrid.map((row) => [
          ...row,
        ]);

        nextGrid[current.row][current.col] = ".";

        let nextShards = prev.shards;
        let nextCombo = prev.combo;
        let nextSwitch = prev.switchActive;
        let nextMessage = "";

        if (target === "C") {
          nextShards += 1;
          nextCombo += 1;

          nextMessage = "SHARD ACQUIRED";

          playSound("coin");
        } else if (target === "S") {
          nextSwitch = true;
          nextCombo += 1;

          nextMessage = "LASER SYSTEM DISABLED";

          playSound("switch");
        } else if (target === "E") {
          const enoughShards =
            nextShards >= level.requiredShards;

          if (!enoughShards) {
            playSound("error");

            nextGrid[current.row][current.col] =
              "P";

            return {
              ...prev,
              grid: nextGrid,
              message: `NEED ${
                level.requiredShards -
                nextShards
              } MORE SHARD`,
            };
          }

          nextGrid[nextRow][nextCol] = "P";

          const finishedState = {
            ...prev,
            grid: nextGrid,
            player: {
              row: nextRow,
              col: nextCol,
            },
            moves: prev.moves + 1,
            shards: nextShards,
            combo: nextCombo,
            switchActive: nextSwitch,
            message: "EXIT FOUND",
          };

          setTimeout(() => {
            finishLevel(finishedState);
          }, 0);

          return finishedState;
        } else {
          nextCombo = Math.max(
            0,
            nextCombo - 0.05
          );

          playSound("move");
        }

        nextGrid[nextRow][nextCol] = "P";

        return {
          ...prev,
          grid: nextGrid,
          player: {
            row: nextRow,
            col: nextCol,
          },
          moves: prev.moves + 1,
          shards: nextShards,
          combo: nextCombo,
          switchActive: nextSwitch,
          message: nextMessage,
        };
      });
    },
    [
      finishLevel,
      level,
      playSound,
      state.gameState,
    ]
  );

  const nextLevel = useCallback(() => {
    if (levelIndex >= LEVELS.length - 1) {
      setState((prev) => ({
        ...prev,
        gameState: "complete",
        message: "MINDVAULT MASTER",
      }));

      playSound("win");

      return;
    }

    const nextIndex = levelIndex + 1;

    setLevelIndex(nextIndex);
    setState(getInitialState(LEVELS[nextIndex]));

    playSound("click");
  }, [levelIndex, playSound]);

  const previousLevel = useCallback(() => {
    if (levelIndex <= 0) return;

    const previousIndex = levelIndex - 1;

    setLevelIndex(previousIndex);
    setState(
      getInitialState(LEVELS[previousIndex])
    );

    playSound("click");
  }, [levelIndex, playSound]);

  const handleRestart = useCallback(() => {
    resetLevel();
    playSound("click");
  }, [playSound, resetLevel]);

  const handleKeyDown = useCallback(
    (event) => {
      const key = event.key;

      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          " ",
        ].includes(key)
      ) {
        event.preventDefault();
      }

      if (key === "r" || key === "R") {
        handleRestart();
        return;
      }

      if (key === "m" || key === "M") {
        setSoundOn((value) => !value);
        return;
      }

      if (
        key === "Enter" &&
        state.gameState === "ready"
      ) {
        startGame();
        return;
      }

      movePlayer(key);
    },
    [
      handleRestart,
      movePlayer,
      startGame,
      state.gameState,
    ]
  );

  useEffect(() => {
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
  }, [handleKeyDown]);

  useEffect(() => {
    if (state.gameState !== "playing") {
      return undefined;
    }

    const timer = setInterval(() => {
      setState((prev) => {
        if (prev.timeLeft <= 1) {
          playSound("error");

          return {
            ...prev,
            timeLeft: 0,
            gameState: "lost",
            message: "TIME EXPIRED",
          };
        }

        return {
          ...prev,
          timeLeft: prev.timeLeft - 1,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [playSound, state.gameState]);

  const handleTouchMove = useCallback(
    (direction) => {
      movePlayer(direction);
    },
    [movePlayer]
  );

  const progressPercent = Math.min(
    100,
    (state.shards / level.requiredShards) * 100
  );

  const bestScore =
    bestScores[String(level.id)] || 0;

  const statusLabel = {
    ready: "READY",
    playing: "RUNNING",
    won: "CLEARED",
    lost: "FAILED",
    complete: "COMPLETE",
  }[state.gameState];

  return (
    <main className="mindvault">
      {/* ==================================================
          HEADER
          ================================================== */}

      <header className="mv-header">
        <div className="mv-brand">
          <div className="mv-brandIcon">
            ◈
          </div>

          <div>
            <strong>MINDVAULT</strong>
            <small>ESCAPE PROTOCOL</small>
          </div>
        </div>

        <div className="mv-headerCenter">
          <span>
            WORLD {levelIndex + 1}
          </span>

          <strong>
            {level.world}
          </strong>
        </div>

        <div className="mv-headerActions">
          <button
            className="mv-iconButton"
            onClick={() =>
              setSoundOn((value) => !value)
            }
            title="Toggle sound"
          >
            {soundOn ? "🔊" : "🔇"}
          </button>

          <button
            className="mv-iconButton"
            onClick={handleRestart}
            title="Restart"
          >
            ↻
          </button>
        </div>
      </header>

      {/* ==================================================
          TOP HUD
          ================================================== */}

      <section className="mv-hud">
        <div className="mv-stat">
          <span>LEVEL</span>
          <strong>
            {String(levelIndex + 1).padStart(
              2,
              "0"
            )}
            /{String(LEVELS.length).padStart(
              2,
              "0"
            )}
          </strong>
        </div>

        <div className="mv-stat">
          <span>TIME</span>

          <strong
            className={
              state.timeLeft <= 10
                ? "danger"
                : ""
            }
          >
            {String(
              Math.floor(
                state.timeLeft / 60
              )
            ).padStart(2, "0")}
            :
            {String(
              state.timeLeft % 60
            ).padStart(2, "0")}
          </strong>
        </div>

        <div className="mv-stat">
          <span>MOVES</span>
          <strong>{state.moves}</strong>
        </div>

        <div className="mv-stat">
          <span>BEST</span>
          <strong>
            {bestScore.toLocaleString()}
          </strong>
        </div>

        <div className="mv-stat mv-difficulty">
          <span>PROTOCOL</span>
          <strong>
            {level.difficulty}
          </strong>
        </div>

        <div className="mv-stat mv-status">
          <span>STATUS</span>
          <strong>{statusLabel}</strong>
        </div>
      </section>

      {/* ==================================================
          GAME LAYOUT
          ================================================== */}

      <section className="mv-layout">
        {/* LEFT PANEL */}

        <aside className="mv-sidePanel">
          <div className="mv-panelTitle">
            <span>SYSTEM</span>
            <strong>OBJECTIVES</strong>
          </div>

          <div className="mv-objective">
            <div className="mv-objectiveIcon">
              ◆
            </div>

            <div>
              <span>MEMORY SHARDS</span>
              <strong>
                {state.shards} /{" "}
                {level.requiredShards}
              </strong>
            </div>
          </div>

          <div className="mv-progress">
            <div
              style={{
                width: `${progressPercent}%`,
              }}
            />
          </div>

          <div className="mv-objective">
            <div className="mv-objectiveIcon">
              ↗
            </div>

            <div>
              <span>EXIT GATE</span>
              <strong>
                {state.shards >=
                level.requiredShards
                  ? "UNLOCKED"
                  : "LOCKED"}
              </strong>
            </div>
          </div>

          <div className="mv-objective">
            <div className="mv-objectiveIcon">
              ⚡
            </div>

            <div>
              <span>LASER SYSTEM</span>
              <strong>
                {state.switchActive
                  ? "OFFLINE"
                  : "ONLINE"}
              </strong>
            </div>
          </div>

          <div className="mv-sideDivider" />

          <div className="mv-tip">
            <span>AI TIP</span>

            <p>
              Think before every move.
              Fewer moves create a higher
              score.
            </p>
          </div>

          <div className="mv-controlsHint">
            <span>CONTROLS</span>

            <div>
              <kbd>W</kbd>
              <kbd>A</kbd>
              <kbd>S</kbd>
              <kbd>D</kbd>
            </div>

            <small>
              or ARROW KEYS
            </small>
          </div>
        </aside>

        {/* GAME BOARD */}

        <div className="mv-boardArea">
          <div className="mv-boardHeader">
            <div>
              <span>
                {level.world}
              </span>

              <strong>
                {level.title}
              </strong>
            </div>

            <div className="mv-combo">
              <span>COMBO</span>
              <strong>
                x
                {Math.max(
                  1,
                  Math.floor(state.combo)
                )}
              </strong>
            </div>
          </div>

          <div
            className={`mv-board ${
              state.gameState === "lost"
                ? "mv-boardLost"
                : ""
            } ${
              state.gameState === "won"
                ? "mv-boardWon"
                : ""
            }`}
          >
            {/* Decorative scanlines */}

            <div className="mv-scanlines" />

            {/* Grid */}

            <div
              className="mv-grid"
              style={{
                gridTemplateColumns: `repeat(${state.grid[0].length}, 1fr)`,
              }}
            >
              {state.grid.map(
                (row, rowIndex) =>
                  row.map(
                    (cell, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`mv-cell ${getCellClass(
                          cell
                        )}`}
                      >
                        <CellIcon
                          cell={cell}
                        />

                        {cell ===
                          "." && (
                          <span className="mv-floorDot" />
                        )}
                      </div>
                    )
                  )
              )}
            </div>

            {/* Message */}

            {state.message && (
              <div
                key={state.message}
                className="mv-message"
              >
                {state.message}
              </div>
            )}

            {/* Ready overlay */}

            {state.gameState ===
              "ready" && (
              <div className="mv-overlay">
                <div className="mv-modal">
                  <div className="mv-modalIcon">
                    ◈
                  </div>

                  <span>
                    VAULT PROTOCOL
                  </span>

                  <h1>
                    {level.title}
                  </h1>

                  <p>
                    Collect every required
                    memory shard and reach
                    the exit before the
                    system locks down.
                  </p>

                  <div className="mv-modalStats">
                    <div>
                      <span>
                        TIME
                      </span>
                      <strong>
                        {level.time}s
                      </strong>
                    </div>

                    <div>
                      <span>
                        SHARDS
                      </span>
                      <strong>
                        {
                          level.requiredShards
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        TARGET
                      </span>
                      <strong>
                        {level.targetMoves}
                      </strong>
                    </div>
                  </div>

                  <button
                    className="mv-primaryButton"
                    onClick={
                      startGame
                    }
                  >
                    ENTER VAULT
                    <span>→</span>
                  </button>

                  <small>
                    PRESS ENTER TO START
                  </small>
                </div>
              </div>
            )}

            {/* Lost overlay */}

            {state.gameState ===
              "lost" && (
              <div className="mv-overlay">
                <div className="mv-modal mv-fail">
                  <div className="mv-modalIcon">
                    !
                  </div>

                  <span>
                    SECURITY FAILURE
                  </span>

                  <h1>
                    TIME EXPIRED
                  </h1>

                  <p>
                    The vault has sealed
                    itself. Try another
                    route and reduce your
                    moves.
                  </p>

                  <div className="mv-modalStats">
                    <div>
                      <span>
                        MOVES
                      </span>
                      <strong>
                        {state.moves}
                      </strong>
                    </div>

                    <div>
                      <span>
                        SHARDS
                      </span>
                      <strong>
                        {state.shards}
                      </strong>
                    </div>

                    <div>
                      <span>
                        BEST
                      </span>
                      <strong>
                        {bestScore.toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  <button
                    className="mv-primaryButton"
                    onClick={
                      handleRestart
                    }
                  >
                    RETRY LEVEL
                    <span>↻</span>
                  </button>
                </div>
              </div>
            )}

            {/* Win overlay */}

            {state.gameState ===
              "won" && (
              <div className="mv-overlay">
                <div className="mv-modal mv-success">
                  <div className="mv-modalIcon">
                    ✓
                  </div>

                  <span>
                    SYSTEM BREACHED
                  </span>

                  <h1>
                    {state.message ||
                      "VAULT CLEARED"}
                  </h1>

                  <div className="mv-scoreBig">
                    {state.score.toLocaleString()}
                  </div>

                  <div className="mv-stars">
                    {[1, 2, 3].map(
                      (star) => (
                        <span
                          key={star}
                          className={
                            star <=
                            (state.stars ||
                              1)
                              ? "active"
                              : ""
                          }
                        >
                          ★
                        </span>
                      )
                    )}
                  </div>

                  <div className="mv-modalStats">
                    <div>
                      <span>
                        TIME
                      </span>
                      <strong>
                        {state.timeLeft}s
                      </strong>
                    </div>

                    <div>
                      <span>
                        MOVES
                      </span>
                      <strong>
                        {state.moves}
                      </strong>
                    </div>

                    <div>
                      <span>
                        COMBO
                      </span>
                      <strong>
                        x
                        {Math.max(
                          1,
                          Math.floor(
                            state.combo
                          )
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="mv-winButtons">
                    <button
                      className="mv-secondaryButton"
                      onClick={
                        handleRestart
                      }
                    >
                      REPLAY
                    </button>

                    <button
                      className="mv-primaryButton"
                      onClick={
                        nextLevel
                      }
                    >
                      {levelIndex <
                      LEVELS.length - 1
                        ? "NEXT LEVEL"
                        : "FINISH"}
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Complete */}

            {state.gameState ===
              "complete" && (
              <div className="mv-overlay">
                <div className="mv-modal mv-success">
                  <div className="mv-modalIcon">
                    ◆
                  </div>

                  <span>
                    ALL PROTOCOLS COMPLETE
                  </span>

                  <h1>
                    MINDVAULT MASTER
                  </h1>

                  <p>
                    You escaped every
                    security layer.
                  </p>

                  <button
                    className="mv-primaryButton"
                    onClick={() => {
                      setLevelIndex(0);
                      setState(
                        getInitialState(
                          LEVELS[0]
                        )
                      );
                    }}
                  >
                    PLAY AGAIN
                    <span>↻</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ==================================================
              MOBILE CONTROLS
              ================================================== */}

          <div className="mv-mobileControls">
            <button
              onClick={() =>
                handleTouchMove(
                  "ArrowUp"
                )
              }
            >
              ↑
            </button>

            <div>
              <button
                onClick={() =>
                  handleTouchMove(
                    "ArrowLeft"
                  )
                }
              >
                ←
              </button>

              <button
                onClick={
                  handleRestart
                }
              >
                ↻
              </button>

              <button
                onClick={() =>
                  handleTouchMove(
                    "ArrowRight"
                  )
                }
              >
                →
              </button>
            </div>

            <button
              onClick={() =>
                handleTouchMove(
                  "ArrowDown"
                )
              }
            >
              ↓
            </button>
          </div>
        </div>

        {/* RIGHT PANEL */}

        <aside className="mv-sidePanel mv-rightPanel">
          <div className="mv-panelTitle">
            <span>MISSION</span>
            <strong>INTEL</strong>
          </div>

          <div className="mv-levelTitle">
            <small>
              LEVEL{" "}
              {String(levelIndex + 1).padStart(
                2,
                "0"
              )}
            </small>

            <h2>
              {level.title}
            </h2>

            <span
              className={`mv-difficultyBadge ${level.difficulty.toLowerCase()}`}
            >
              {level.difficulty}
            </span>
          </div>

          <div className="mv-scorePanel">
            <span>
              CURRENT SCORE
            </span>

            <strong>
              {state.score.toLocaleString()}
            </strong>
          </div>

          <div className="mv-scorePanel">
            <span>
              BEST SCORE
            </span>

            <strong>
              {bestScore.toLocaleString()}
            </strong>
          </div>

          <div className="mv-sideDivider" />

          <div className="mv-mapLegend">
            <span>LEGEND</span>

            <div>
              <i className="legendShard">
                ◆
              </i>
              <small>
                Memory Shard
              </small>
            </div>

            <div>
              <i className="legendSwitch">
                ●
              </i>
              <small>
                System Switch
              </small>
            </div>

            <div>
              <i className="legendLaser">
                ⚡
              </i>
              <small>
                Laser Gate
              </small>
            </div>

            <div>
              <i className="legendExit">
                ↗
              </i>
              <small>
                Exit Gate
              </small>
            </div>
          </div>

          <div className="mv-sideDivider" />

          <div className="mv-navigation">
            <button
              disabled={levelIndex === 0}
              onClick={
                previousLevel
              }
            >
              ← PREVIOUS
            </button>

            <button
              disabled={
                levelIndex ===
                LEVELS.length - 1
              }
              onClick={
                nextLevel
              }
            >
              NEXT →
            </button>
          </div>
        </aside>
      </section>

      {/* ==================================================
          FOOTER
          ================================================== */}

      <footer className="mv-footer">
        <div>
          <span>
            MINDVAULT ENGINE
          </span>

          <strong>
            v1.0 // ESCAPE PROTOCOL
          </strong>
        </div>

        <div>
          <span>
            KEYBOARD
          </span>

          <strong>
            WASD / ARROWS
          </strong>
        </div>

        <div>
          <span>
            RESTART
          </span>

          <strong>
            R
          </strong>
        </div>

        <div>
          <span>
            AUDIO
          </span>

          <strong>
            M
          </strong>
        </div>

        <div className="mv-footerStatus">
          <i />
          SYSTEM ONLINE
        </div>
      </footer>
    </main>
  );
}