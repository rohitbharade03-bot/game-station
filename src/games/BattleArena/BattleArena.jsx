import { useEffect, useState } from "react";
import "./BattleArena.css";

function BattleArena() {
  const [playerX, setPlayerX] = useState(50);
  const [enemyX, setEnemyX] = useState(50);

  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);

  const [bullets, setBullets] = useState([]);
  const [enemyBullets, setEnemyBullets] = useState([]);

  const [gameOver, setGameOver] = useState(false);

  // ==========================================
  // PLAYER MOVEMENT
  // ==========================================

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (gameOver) return;

      if (
        event.key === "ArrowLeft" ||
        event.key.toLowerCase() === "a"
      ) {
        setPlayerX((x) => Math.max(5, x - 5));
      }

      if (
        event.key === "ArrowRight" ||
        event.key.toLowerCase() === "d"
      ) {
        setPlayerX((x) => Math.min(95, x + 5));
      }

      if (event.code === "Space") {
        fireBullet();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameOver, playerX]);

  // ==========================================
  // ENEMY MOVEMENT
  // ==========================================

  useEffect(() => {
    if (gameOver) return;

    const enemyTimer = setInterval(() => {
      setEnemyX(Math.floor(Math.random() * 90) + 5);
    }, 2500);

    return () => {
      clearInterval(enemyTimer);
    };
  }, [gameOver]);

  // ==========================================
  // ENEMY ATTACK
  // ==========================================

  useEffect(() => {
    if (gameOver) return;

    const attackTimer = setInterval(() => {
      const newEnemyBullet = {
        id: Date.now() + Math.random(),
        x: enemyX,
        y: 85,
      };

      setEnemyBullets((currentBullets) => [
        ...currentBullets,
        newEnemyBullet,
      ]);
    }, 1800);

    return () => {
      clearInterval(attackTimer);
    };
  }, [gameOver, enemyX]);

  // ==========================================
  // PLAYER BULLET MOVEMENT + COLLISION
  // ==========================================

  useEffect(() => {
    if (gameOver) return;

    const bulletTimer = setInterval(() => {
      setBullets((currentBullets) => {
        const remainingBullets = [];

        currentBullets.forEach((bullet) => {
          const nextY = bullet.y + 5;

          const hitEnemy =
            nextY >= 75 &&
            Math.abs(bullet.x - enemyX) < 10;

          if (hitEnemy) {
            setScore((currentScore) => currentScore + 100);

            setEnemyX(
              Math.floor(Math.random() * 90) + 5
            );

            return;
          }

          if (nextY < 100) {
            remainingBullets.push({
              ...bullet,
              y: nextY,
            });
          }
        });

        return remainingBullets;
      });
    }, 50);

    return () => {
      clearInterval(bulletTimer);
    };
  }, [gameOver, enemyX]);

  // ==========================================
  // ENEMY BULLET MOVEMENT + PLAYER COLLISION
  // ==========================================

  useEffect(() => {
    if (gameOver) return;

    const enemyBulletTimer = setInterval(() => {
      setEnemyBullets((currentBullets) => {
        const remainingBullets = [];

        currentBullets.forEach((bullet) => {
          const nextY = bullet.y - 5;

          const hitPlayer =
            nextY <= 20 &&
            Math.abs(bullet.x - playerX) < 8;

          if (hitPlayer) {
            setHealth((currentHealth) => {
              const newHealth = currentHealth - 10;

              if (newHealth <= 0) {
                setGameOver(true);
                return 0;
              }

              return newHealth;
            });

            return;
          }

          if (nextY > 0) {
            remainingBullets.push({
              ...bullet,
              y: nextY,
            });
          }
        });

        return remainingBullets;
      });
    }, 50);

    return () => {
      clearInterval(enemyBulletTimer);
    };
  }, [gameOver, playerX]);

  // ==========================================
  // FIRE BULLET
  // ==========================================

  const fireBullet = () => {
    if (gameOver) return;

    const newBullet = {
      id: Date.now() + Math.random(),
      x: playerX,
      y: 15,
    };

    setBullets((currentBullets) => [
      ...currentBullets,
      newBullet,
    ]);
  };

  // ==========================================
  // RESTART GAME
  // ==========================================

  const restartGame = () => {
    setPlayerX(50);
    setEnemyX(50);

    setScore(0);
    setHealth(100);

    setBullets([]);
    setEnemyBullets([]);

    setGameOver(false);
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="battle-arena">

      {/* TOP BAR */}

      <div className="game-topbar">

        <div>
          <span>🏆 SCORE</span>
          <strong>{score}</strong>
        </div>

        <div>
          <span>❤️ HEALTH</span>
          <strong>{health}</strong>
        </div>

      </div>

      {/* ARENA */}

      <div className="arena">

        {/* ENEMY */}

        <div
          className="enemy"
          style={{
            left: `${enemyX}%`,
          }}
        >
          👾
        </div>

        {/* PLAYER BULLETS */}

        {bullets.map((bullet) => (
          <div
            key={bullet.id}
            className="bullet"
            style={{
              left: `${bullet.x}%`,
              bottom: `${bullet.y}%`,
            }}
          >
            🔥
          </div>
        ))}

        {/* ENEMY BULLETS */}

        {enemyBullets.map((bullet) => (
          <div
            key={bullet.id}
            className="enemy-bullet"
            style={{
              left: `${bullet.x}%`,
              bottom: `${bullet.y}%`,
            }}
          >
            🔴
          </div>
        ))}

        {/* PLAYER */}

        <div
          className="player"
          style={{
            left: `${playerX}%`,
          }}
        >
          🧑‍🚀
        </div>

        {/* GAME OVER */}

        {gameOver && (
          <div className="game-over">

            <h1>GAME OVER</h1>

            <p>
              Your Score: {score}
            </p>

            <button onClick={restartGame}>
              🔄 Play Again
            </button>

          </div>
        )}

      </div>

      {/* CONTROLS */}

      <div className="game-controls">

        <button
          onClick={() => {
            setPlayerX((x) =>
              Math.max(5, x - 5)
            );
          }}
        >
          ←
        </button>

        <button onClick={fireBullet}>
          🔥 ATTACK
        </button>

        <button
          onClick={() => {
            setPlayerX((x) =>
              Math.min(95, x + 5)
            );
          }}
        >
          →
        </button>

      </div>

      {/* INSTRUCTIONS */}

      <div className="game-instructions">
        <span>← → / A D = Move</span>
        <span>SPACE = Attack</span>
        <span>🔥 Hit Enemy = +100</span>
      </div>

    </div>
  );
}

export default BattleArena;