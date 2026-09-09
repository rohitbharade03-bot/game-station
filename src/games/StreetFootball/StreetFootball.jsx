import { useEffect, useState } from "react";
import "./StreetFootball.css";

function StreetFootball() {
  const [playerX, setPlayerX] = useState(50);
  const [playerY, setPlayerY] = useState(72);

  const [ballX, setBallX] = useState(50);
  const [ballY, setBallY] = useState(67);

  const [score, setScore] = useState(0);
  const [time, setTime] = useState(60);

  const [shooting, setShooting] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState("GET READY!");

  const [opponentX, setOpponentX] = useState(50);
  const [opponentY, setOpponentY] = useState(38);

  const movePlayer = (direction) => {
    if (gameOver) return;

    setPlayerX((x) => {
      if (direction === "left") {
        return Math.max(12, x - 4);
      }

      return Math.min(88, x + 4);
    });
  };

  const moveBall = () => {
    if (gameOver) return;

    setBallX(playerX);
    setBallY(playerY - 5);
  };

  const shootBall = () => {
    if (gameOver || shooting) return;

    setShooting(true);
    setMessage("SHOOT!");

    const targetX = ballX;

    setBallY(18);

    setTimeout(() => {
      const distance = Math.abs(targetX - 50);

      if (distance < 18) {
        setScore((s) => s + 1);
        setMessage("⚽ GOAL!");

        setTimeout(() => {
          setMessage("KEEP GOING!");
        }, 1000);
      } else {
        setMessage("MISSED!");

        setTimeout(() => {
          setMessage("TRY AGAIN!");
        }, 800);
      }

      setBallX(playerX);
      setBallY(playerY - 5);
      setShooting(false);
    }, 700);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (gameOver) return;

      const key = event.key.toLowerCase();

      if (key === "arrowleft" || key === "a") {
        movePlayer("left");
      }

      if (key === "arrowright" || key === "d") {
        movePlayer("right");
      }

      if (key === " " || event.code === "Space") {
        event.preventDefault();
        shootBall();
      }

      if (key === "w" || key === "arrowup") {
        moveBall();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameOver, playerX, playerY, ballX, shooting]);

  useEffect(() => {
    if (gameOver) return;

    const timer = setInterval(() => {
      setTime((currentTime) => {
        if (currentTime <= 1) {
          setGameOver(true);
          setMessage("TIME UP!");
          return 0;
        }

        return currentTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameOver]);

  useEffect(() => {
    if (gameOver) return;

    const opponentTimer = setInterval(() => {
      setOpponentX((x) => {
        const movement = Math.random() > 0.5 ? 5 : -5;

        return Math.max(
          20,
          Math.min(80, x + movement)
        );
      });
    }, 800);

    return () => clearInterval(opponentTimer);
  }, [gameOver]);

  const restartGame = () => {
    setPlayerX(50);
    setPlayerY(72);
    setBallX(50);
    setBallY(67);
    setScore(0);
    setTime(60);
    setShooting(false);
    setGameOver(false);
    setOpponentX(50);
    setOpponentY(38);
    setMessage("GET READY!");
  };

  return (
    <div className="street-football">

      {/* TOP BAR */}
      <div className="football-topbar">

        <div className="football-title">
          <span>⚽ STREET</span>
          <strong>FOOTBALL</strong>
        </div>

        <div className="football-stats">

          <div className="football-stat">
            <span>GOALS</span>
            <strong>{score}</strong>
          </div>

          <div className="football-stat timer-stat">
            <span>TIME</span>
            <strong>
              {time < 10 ? `0${time}` : time}
            </strong>
          </div>

        </div>
      </div>

      {/* GAME AREA */}
      <div className="football-field">

        {/* STADIUM LIGHTS */}
        <div className="stadium-light light-left" />
        <div className="stadium-light light-right" />

        {/* SCORE MESSAGE */}
        <div className="football-message">
          {message}
        </div>

        {/* GOAL */}
        <div className="football-goal">

          <div className="goal-net" />

          <div className="goal-post goal-left" />
          <div className="goal-post goal-right" />
          <div className="goal-crossbar" />

        </div>

        {/* MIDFIELD LINE */}
        <div className="field-line midfield-line" />

        <div className="center-circle">
          <div className="center-dot" />
        </div>

        {/* PENALTY AREA */}
        <div className="penalty-area" />
        <div className="penalty-spot" />

        {/* OPPONENT */}
        <div
          className="football-opponent"
          style={{
            left: `${opponentX}%`,
            top: `${opponentY}%`,
          }}
        >
          <div className="opponent-head">😎</div>
          <div className="opponent-body">🧍</div>
        </div>

        {/* BALL */}
        <div
          className={`football-ball ${
            shooting ? "ball-shooting" : ""
          }`}
          style={{
            left: `${ballX}%`,
            top: `${ballY}%`,
          }}
        >
          ⚽
        </div>

        {/* PLAYER */}
        <div
          className="football-player"
          style={{
            left: `${playerX}%`,
            top: `${playerY}%`,
          }}
        >
          <div className="player-shadow" />
          <div className="player-character">
            🧑
          </div>
        </div>

        {/* GAME OVER */}
        {gameOver && (
          <div className="football-game-over">

            <div className="game-over-icon">
              🏆
            </div>

            <h1>
              {time === 0 ? "TIME UP!" : "MATCH OVER"}
            </h1>

            <p>
              Your Goals
            </p>

            <strong>
              {score}
            </strong>

            <button onClick={restartGame}>
              🔄 PLAY AGAIN
            </button>

          </div>
        )}

      </div>

      {/* CONTROLS */}
      <div className="football-controls">

        <button
          className="football-control move-control"
          onClick={() => movePlayer("left")}
        >
          ←
        </button>

        <button
          className="football-control shoot-control"
          onClick={shootBall}
        >
          ⚽
          <span>SHOOT</span>
        </button>

        <button
          className="football-control move-control"
          onClick={() => movePlayer("right")}
        >
          →
        </button>

      </div>

      {/* INSTRUCTIONS */}
      <div className="football-instructions">

        <div>
          <kbd>A</kbd>
          <kbd>←</kbd>
          <span>Move Left</span>
        </div>

        <div>
          <kbd>D</kbd>
          <kbd>→</kbd>
          <span>Move Right</span>
        </div>

        <div>
          <kbd>SPACE</kbd>
          <span>Shoot</span>
        </div>

      </div>

    </div>
  );
}

export default StreetFootball;

