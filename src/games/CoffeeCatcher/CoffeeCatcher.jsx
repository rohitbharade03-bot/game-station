import { useCallback, useEffect, useRef, useState } from "react";
import "./CoffeeCatcher.css";

const GAME_WIDTH = 700;
const GAME_HEIGHT = 520;

const TARGET_SCORE = 50;
const START_LIVES = 3;

const createItem = (id, level) => {
  const badChance = Math.min(0.18 + level * 0.025, 0.35);
  const bad = Math.random() < badChance;

  return {
    id,
    type: bad ? "tea" : "coffee",
    x: 30 + Math.random() * (GAME_WIDTH - 60),
    y: -55,
    size: bad ? 42 : 38,
    speed: 2.4 + level * 0.3 + Math.random() * 1.2,
  };
};

function CoffeeCatcher() {
  const [screen, setScreen] = useState("menu");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [level, setLevel] = useState(1);
  const [items, setItems] = useState([]);
  const [playerX, setPlayerX] = useState(GAME_WIDTH / 2);
  const [combo, setCombo] = useState(0);
  const [bestScore, setBestScore] = useState(
    () => Number(localStorage.getItem("coffee-catcher-best") || 0)
  );
  const [message, setMessage] = useState("Catch the coffee!");

  const keysRef = useRef({});
  const gameRef = useRef(null);
  const lastSpawnRef = useRef(0);
  const itemIdRef = useRef(0);
  const playerXRef = useRef(GAME_WIDTH / 2);
  const scoreRef = useRef(0);
  const livesRef = useRef(START_LIVES);
  const comboRef = useRef(0);
  const levelRef = useRef(1);
  const animationRef = useRef(null);

  const startGame = useCallback(() => {
    scoreRef.current = 0;
    livesRef.current = START_LIVES;
    comboRef.current = 0;
    levelRef.current = 1;
    playerXRef.current = GAME_WIDTH / 2;

    setScore(0);
    setLives(START_LIVES);
    setCombo(0);
    setLevel(1);
    setPlayerX(GAME_WIDTH / 2);
    setItems([]);
    setMessage("Catch the coffee!");

    lastSpawnRef.current = performance.now();
    setScreen("playing");
  }, []);

  const endGame = useCallback(
    (won = false) => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      const finalScore = scoreRef.current;

      if (finalScore > bestScore) {
        setBestScore(finalScore);
        localStorage.setItem("coffee-catcher-best", String(finalScore));
      }

      setMessage(
        won
          ? "☕ Perfect! You reached 50 points!"
          : "Game over! Keep practicing."
      );

      setScreen(won ? "win" : "gameover");
    },
    [bestScore]
  );

  const movePlayer = useCallback((direction) => {
    const nextX = Math.max(
      55,
      Math.min(
        GAME_WIDTH - 55,
        playerXRef.current + direction * 9
      )
    );

    playerXRef.current = nextX;
    setPlayerX(nextX);
  }, []);

  useEffect(() => {
    if (screen !== "playing") return;

    const handleKeyDown = (event) => {
      keysRef.current[event.key] = true;

      if (
        ["ArrowLeft", "ArrowRight", " ", "ArrowUp", "ArrowDown"].includes(
          event.key
        )
      ) {
        event.preventDefault();
      }
    };

    const handleKeyUp = (event) => {
      keysRef.current[event.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [screen]);

  useEffect(() => {
    if (screen !== "playing") return;

    let mounted = true;

    const gameLoop = (time) => {
      if (!mounted) return;

      if (keysRef.current.ArrowLeft) {
        movePlayer(-1);
      }

      if (keysRef.current.ArrowRight) {
        movePlayer(1);
      }

      const currentLevel = levelRef.current;

      const spawnDelay = Math.max(330, 900 - currentLevel * 70);

      if (time - lastSpawnRef.current > spawnDelay) {
        lastSpawnRef.current = time;

        const newItem = createItem(
          itemIdRef.current++,
          currentLevel
        );

        setItems((current) => [...current, newItem]);
      }

      setItems((currentItems) => {
        const nextItems = [];

        let nextScore = scoreRef.current;
        let nextLives = livesRef.current;
        let nextCombo = comboRef.current;
        let nextLevel = levelRef.current;

        const playerLeft = playerXRef.current - 48;
        const playerRight = playerXRef.current + 48;

        for (const item of currentItems) {
          const nextY = item.y + item.speed;

          const itemLeft = item.x - item.size / 2;
          const itemRight = item.x + item.size / 2;

          const caught =
            nextY > GAME_HEIGHT - 115 &&
            nextY < GAME_HEIGHT - 45 &&
            itemRight > playerLeft &&
            itemLeft < playerRight;

          if (caught) {
            if (item.type === "coffee") {
              nextCombo += 1;

              const comboBonus =
                Math.min(nextCombo, 5) - 1;

              const earned = 1 + Math.max(0, comboBonus);

              nextScore += earned;

              setMessage(
                nextCombo > 1
                  ? `☕ Perfect catch! +${earned} 🔥 Combo x${nextCombo}`
                  : "☕ Coffee caught! +1"
              );

              if (nextScore >= TARGET_SCORE) {
                scoreRef.current = nextScore;
                comboRef.current = nextCombo;

                setScore(nextScore);
                setCombo(nextCombo);

                setTimeout(() => endGame(true), 100);
                continue;
              }

              const calculatedLevel =
                Math.min(10, Math.floor(nextScore / 5) + 1);

              if (calculatedLevel !== nextLevel) {
                nextLevel = calculatedLevel;
                setMessage(`🔥 Level ${nextLevel}! Speed increased!`);
              }
            } else {
              nextLives -= 1;
              nextCombo = 0;

              setMessage(
                nextLives > 0
                  ? `🍵 Tea! -1 Life`
                  : "🍵 Tea got you!"
              );

              if (nextLives <= 0) {
                livesRef.current = 0;
                scoreRef.current = nextScore;
                comboRef.current = 0;

                setLives(0);
                setScore(nextScore);
                setCombo(0);

                setTimeout(() => endGame(false), 100);
                continue;
              }
            }

            continue;
          }

          if (nextY > GAME_HEIGHT + 60) {
            if (item.type === "coffee") {
              nextLives -= 1;
              nextCombo = 0;

              setMessage(
                nextLives > 0
                  ? `💧 Missed coffee! ${nextLives} lives left`
                  : "💧 Too many missed coffees!"
              );

              if (nextLives <= 0) {
                livesRef.current = 0;
                scoreRef.current = nextScore;

                setLives(0);
                setScore(nextScore);
                setCombo(0);

                setTimeout(() => endGame(false), 100);
                continue;
              }
            }

            continue;
          }

          nextItems.push({
            ...item,
            y: nextY,
          });
        }

        scoreRef.current = nextScore;
        livesRef.current = nextLives;
        comboRef.current = nextCombo;
        levelRef.current = nextLevel;

        setScore(nextScore);
        setLives(nextLives);
        setCombo(nextCombo);
        setLevel(nextLevel);

        return nextItems;
      });

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      mounted = false;

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [screen, movePlayer, endGame]);

  const handleTouchMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const touch = event.touches[0];

    const scaleX = GAME_WIDTH / rect.width;

    const x =
      (touch.clientX - rect.left) * scaleX;

    const nextX = Math.max(
      55,
      Math.min(GAME_WIDTH - 55, x)
    );

    playerXRef.current = nextX;
    setPlayerX(nextX);
  };

  const backToMenu = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setItems([]);
    setScreen("menu");
  };

  return (
    <div className="coffee-game-page">
      <div className="coffee-game-shell">

        {screen === "menu" && (
          <section className="coffee-menu">
            <div className="coffee-logo">☕</div>

            <p className="coffee-kicker">
              GAME 16 • ARCADE
            </p>

            <h1>Coffee Catcher</h1>

            <p className="coffee-description">
              Catch falling coffee, avoid tea and reach
              <strong> 50 points</strong>.
            </p>

            <div className="coffee-preview">
              <span className="preview-drop">☕</span>
              <span className="preview-player">🥤</span>
              <span className="preview-bad">🍵</span>
            </div>

            <div className="coffee-rules">
              <div>
                <span>☕</span>
                <strong>+1</strong>
                <small>Coffee</small>
              </div>

              <div>
                <span>🔥</span>
                <strong>Combo</strong>
                <small>Bonus points</small>
              </div>

              <div>
                <span>🍵</span>
                <strong>-1 ❤️</strong>
                <small>Tea / Miss</small>
              </div>

              <div>
                <span>🏆</span>
                <strong>50</strong>
                <small>To win</small>
              </div>
            </div>

            <button
              className="coffee-start-btn"
              onClick={startGame}
            >
              <span>▶</span>
              Start Game
            </button>

            <div className="coffee-best">
              Best Score: <strong>{bestScore}</strong>
            </div>
          </section>
        )}

        {screen === "playing" && (
          <section className="coffee-playing">

            <div className="coffee-header">
              <button
                className="coffee-back-btn"
                onClick={backToMenu}
              >
                ←
              </button>

              <div>
                <span>COFFEE CATCHER</span>
                <strong>Level {level}</strong>
              </div>

              <div className="coffee-target">
                {score}/{TARGET_SCORE}
              </div>
            </div>

            <div className="coffee-stats">
              <div className="coffee-stat">
                <span>☕</span>
                <div>
                  <small>SCORE</small>
                  <strong>{score}</strong>
                </div>
              </div>

              <div className="coffee-stat">
                <span>❤️</span>
                <div>
                  <small>LIVES</small>
                  <strong>{lives}</strong>
                </div>
              </div>

              <div className="coffee-stat">
                <span>🔥</span>
                <div>
                  <small>COMBO</small>
                  <strong>x{combo}</strong>
                </div>
              </div>
            </div>

            <div className="coffee-progress">
              <div
                style={{
                  width: `${Math.min(
                    100,
                    (score / TARGET_SCORE) * 100
                  )}%`,
                }}
              />
            </div>

            <div
              className="coffee-board"
              onTouchMove={handleTouchMove}
            >
              <div className="coffee-board-glow" />

              {items.map((item) => (
                <div
                  key={item.id}
                  className={`falling-item ${
                    item.type === "tea"
                      ? "bad-item"
                      : "good-item"
                  }`}
                  style={{
                    left: `${item.x}px`,
                    top: `${item.y}px`,
                  }}
                >
                  {item.type === "tea" ? "🍵" : "☕"}
                </div>
              ))}

              <div
                className="coffee-player"
                style={{
                  left: `${playerX}px`,
                }}
              >
                <div className="player-cup">
                  🥤
                </div>
                <div className="player-shadow" />
              </div>

              <div className="coffee-ground" />

              <div className="coffee-message">
                {message}
              </div>
            </div>

            <div className="mobile-controls">
              <button
                onPointerDown={() => movePlayer(-1)}
              >
                ◀
              </button>

              <span>DRAG / MOVE</span>

              <button
                onPointerDown={() => movePlayer(1)}
              >
                ▶
              </button>
            </div>

            <p className="keyboard-hint">
              Desktop: use <strong>←</strong> and{" "}
              <strong>→</strong> &nbsp; • &nbsp;
              Mobile: drag across the game
            </p>
          </section>
        )}

        {(screen === "gameover" || screen === "win") && (
          <section className="coffee-result">

            <div className="result-icon">
              {screen === "win" ? "🏆" : "☕"}
            </div>

            <p className="coffee-kicker">
              {screen === "win"
                ? "MISSION COMPLETE"
                : "GAME OVER"}
            </p>

            <h1>
              {screen === "win"
                ? "Coffee Master!"
                : "Almost There!"}
            </h1>

            <p className="result-message">
              {message}
            </p>

            <div className="result-score-card">
              <span>FINAL SCORE</span>
              <strong>{score}</strong>

              <div>
                <span>LEVEL</span>
                <b>{level}</b>

                <span>BEST</span>
                <b>{bestScore}</b>
              </div>
            </div>

            <div className="result-actions">
              <button
                className="coffee-start-btn"
                onClick={startGame}
              >
                🔄 Play Again
              </button>

              <button
                className="coffee-secondary-btn"
                onClick={backToMenu}
              >
                ← Main Menu
              </button>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

export default CoffeeCatcher;