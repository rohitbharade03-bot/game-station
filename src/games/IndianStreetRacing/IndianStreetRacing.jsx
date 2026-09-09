import { useCallback, useEffect, useRef, useState } from "react";
import "./IndianStreetRacing.css";

const ROAD_LANES = [16.66, 50, 83.33];

const TRAFFIC_TYPES = [
  "traffic-sport",
  "traffic-sedan",
  "traffic-taxi",
  "traffic-suv",
  "traffic-truck",
  "traffic-bus",
];

const POWER_TYPES = [
  { type: "power-nitro", icon: "⚡" },
  { type: "power-health", icon: "❤️" },
  { type: "power-shield", icon: "🛡️" },
  { type: "power-double", icon: "×2" },
];

function randomLane() {
  return ROAD_LANES[
    Math.floor(Math.random() * ROAD_LANES.length)
  ];
}

function randomTrafficType() {
  return TRAFFIC_TYPES[
    Math.floor(Math.random() * TRAFFIC_TYPES.length)
  ];
}

function createTrafficCar(id, top = -20) {
  return {
    id,
    lane: randomLane(),
    top,
    type: randomTrafficType(),
    speed: 0.55 + Math.random() * 0.4,
  };
}

function createPowerUp(id, top = -10) {
  const power =
    POWER_TYPES[
      Math.floor(Math.random() * POWER_TYPES.length)
    ];

  return {
    id,
    lane: randomLane(),
    top,
    type: power.type,
    icon: power.icon,
    speed: 0.5,
  };
}

function IndianStreetRacing() {
  const gameRef = useRef(null);

  const keysRef = useRef({
    left: false,
    right: false,
    nitro: false,
  });

  const animationRef = useRef(null);

  const lastTimeRef = useRef(0);

  const trafficIdRef = useRef(1);

  const powerIdRef = useRef(1);

  const distanceRef = useRef(0);

  const scoreRef = useRef(0);

  const healthRef = useRef(100);

  const nitroRef = useRef(100);

  const speedRef = useRef(1);

  const levelRef = useRef(1);

  const comboRef = useRef(0);

  const shieldRef = useRef(false);

  const doubleScoreRef = useRef(false);

  const [started, setStarted] = useState(false);

  const [countdown, setCountdown] = useState(3);

  const [playerLane, setPlayerLane] = useState(1);

  const playerLaneRef = useRef(1);

  const [traffic, setTraffic] = useState([]);

  const [powerUps, setPowerUps] = useState([]);

  const [score, setScore] = useState(0);

  const [health, setHealth] = useState(100);

  const [nitro, setNitro] = useState(100);

  const [distance, setDistance] = useState(0);

  const [speed, setSpeed] = useState(80);

  const [level, setLevel] = useState(1);

  const [combo, setCombo] = useState(0);

  const [paused, setPaused] = useState(false);

  const [muted, setMuted] = useState(false);

  const [gameOver, setGameOver] = useState(false);

  const [showHowTo, setShowHowTo] = useState(false);

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState("");

  const [crashing, setCrashing] = useState(false);

  const [nitroActive, setNitroActive] = useState(false);

  const [shieldActive, setShieldActive] = useState(false);

  const [doubleScoreActive, setDoubleScoreActive] =
    useState(false);

  const [countdownFinished, setCountdownFinished] =
    useState(false);

  const showMessage = useCallback(
    (text, type = "") => {
      setMessage(text);
      setMessageType(type);

      window.setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 900);
    },
    []
  );

  const resetGame = useCallback(() => {
    cancelAnimationFrame(animationRef.current);

    keysRef.current = {
      left: false,
      right: false,
      nitro: false,
    };

    playerLaneRef.current = 1;

    distanceRef.current = 0;

    scoreRef.current = 0;

    healthRef.current = 100;

    nitroRef.current = 100;

    speedRef.current = 1;

    levelRef.current = 1;

    comboRef.current = 0;

    shieldRef.current = false;

    doubleScoreRef.current = false;

    trafficIdRef.current = 1;

    powerIdRef.current = 1;

    setPlayerLane(1);
    setTraffic([]);
    setPowerUps([]);
    setScore(0);
    setHealth(100);
    setNitro(100);
    setDistance(0);
    setSpeed(80);
    setLevel(1);
    setCombo(0);
    setPaused(false);
    setGameOver(false);
    setMessage("");
    setMessageType("");
    setCrashing(false);
    setNitroActive(false);
    setShieldActive(false);
    setDoubleScoreActive(false);
    setCountdown(3);
    setCountdownFinished(false);
    setStarted(false);
  }, []);

  const startGame = useCallback(() => {
    resetGame();

    setStarted(true);

    let count = 3;

    setCountdown(count);

    const timer = window.setInterval(() => {
      count -= 1;

      if (count <= 0) {
        window.clearInterval(timer);

        setCountdownFinished(true);

        showMessage("GO!", "success");

        return;
      }

      setCountdown(count);
    }, 800);
  }, [resetGame, showMessage]);

  const moveLeft = useCallback(() => {
    if (!started || paused || gameOver || !countdownFinished) {
      return;
    }

    setPlayerLane((current) => {
      const next = Math.max(0, current - 1);

      playerLaneRef.current = next;

      return next;
    });
  }, [
    started,
    paused,
    gameOver,
    countdownFinished,
  ]);

  const moveRight = useCallback(() => {
    if (!started || paused || gameOver || !countdownFinished) {
      return;
    }

    setPlayerLane((current) => {
      const next = Math.min(2, current + 1);

      playerLaneRef.current = next;

      return next;
    });
  }, [
    started,
    paused,
    gameOver,
    countdownFinished,
  ]);

  const activateNitro = useCallback(() => {
    if (
      !started ||
      paused ||
      gameOver ||
      !countdownFinished
    ) {
      return;
    }

    if (nitroRef.current <= 5) {
      showMessage("NO NITRO!", "danger");
      return;
    }

    keysRef.current.nitro = true;
    setNitroActive(true);
  }, [
    started,
    paused,
    gameOver,
    countdownFinished,
    showMessage,
  ]);

  const stopNitro = useCallback(() => {
    keysRef.current.nitro = false;
    setNitroActive(false);
  }, []);

  const damagePlayer = useCallback(
    (amount = 20) => {
      if (shieldRef.current) {
        shieldRef.current = false;
        setShieldActive(false);

        showMessage("SHIELD SAVED YOU!", "shield");

        return;
      }

      const nextHealth = Math.max(
        0,
        healthRef.current - amount
      );

      healthRef.current = nextHealth;

      setHealth(nextHealth);

      setCombo(0);
      comboRef.current = 0;

      setCrashing(true);

      window.setTimeout(() => {
        setCrashing(false);
      }, 450);

      if (nextHealth <= 0) {
        setGameOver(true);
        setPaused(false);
        showMessage("CRASHED!", "danger");
      } else {
        showMessage(`-${amount} HEALTH`, "danger");
      }
    },
    [showMessage]
  );

  const collectPowerUp = useCallback(
    (power) => {
      if (power.type === "power-nitro") {
        const next = Math.min(
          100,
          nitroRef.current + 35
        );

        nitroRef.current = next;

        setNitro(next);

        showMessage("NITRO +35", "nitro");
      }

      if (power.type === "power-health") {
        const next = Math.min(
          100,
          healthRef.current + 25
        );

        healthRef.current = next;

        setHealth(next);

        showMessage("HEALTH +25", "health");
      }

      if (power.type === "power-shield") {
        shieldRef.current = true;

        setShieldActive(true);

        showMessage("SHIELD ACTIVE", "shield");
      }

      if (power.type === "power-double") {
        doubleScoreRef.current = true;

        setDoubleScoreActive(true);

        showMessage("DOUBLE SCORE!", "double");

        window.setTimeout(() => {
          doubleScoreRef.current = false;
          setDoubleScoreActive(false);
        }, 7000);
      }
    },
    [showMessage]
  );

  const updateGame = useCallback(
    (time) => {
      if (!started || paused || gameOver || !countdownFinished) {
        lastTimeRef.current = time;

        animationRef.current =
          requestAnimationFrame(updateGame);

        return;
      }

      const delta =
        Math.min(
          40,
          time - lastTimeRef.current
        ) || 16;

      lastTimeRef.current = time;

      const levelMultiplier =
        1 + (levelRef.current - 1) * 0.12;

      let currentSpeed =
        0.85 * levelMultiplier;

      if (keysRef.current.nitro) {
        if (nitroRef.current > 0) {
          currentSpeed *= 1.9;

          const nextNitro = Math.max(
            0,
            nitroRef.current - delta * 0.035
          );

          nitroRef.current = nextNitro;

          setNitro(nextNitro);

          if (nextNitro <= 0) {
            stopNitro();
          }
        } else {
          stopNitro();
        }
      } else {
        const nextNitro = Math.min(
          100,
          nitroRef.current + delta * 0.004
        );

        nitroRef.current = nextNitro;

        setNitro(nextNitro);
      }

      speedRef.current = currentSpeed;

      const displayedSpeed = Math.round(
        70 + currentSpeed * 75
      );

      setSpeed(displayedSpeed);

      const distanceIncrease =
        delta * 0.018 * currentSpeed;

      distanceRef.current += distanceIncrease;

      setDistance(
        Math.floor(distanceRef.current)
      );

      const scoreIncrease =
        delta *
        0.018 *
        currentSpeed *
        (doubleScoreRef.current ? 2 : 1);

      scoreRef.current += scoreIncrease;

      setScore(Math.floor(scoreRef.current));

      const nextLevel =
        Math.floor(distanceRef.current / 500) + 1;

      if (nextLevel !== levelRef.current) {
        levelRef.current = nextLevel;

        setLevel(nextLevel);

        showMessage(
          `LEVEL ${nextLevel}`,
          "level"
        );
      }

      setTraffic((current) => {
        let next = current
          .map((car) => ({
            ...car,
            top:
              car.top +
              car.speed *
                currentSpeed *
                delta *
                0.12,
          }))
          .filter((car) => car.top < 115);

        const spawnChance =
          delta *
          0.0008 *
          (1 + levelRef.current * 0.18);

        if (
          Math.random() < spawnChance &&
          next.length < 7
        ) {
          next.push(
            createTrafficCar(
              trafficIdRef.current++
            )
          );
        }

        return next;
      });

      setPowerUps((current) => {
        let next = current
          .map((power) => ({
            ...power,
            top:
              power.top +
              power.speed *
                currentSpeed *
                delta *
                0.1,
          }))
          .filter((power) => power.top < 115);

        if (
          Math.random() <
            delta * 0.00022 &&
          next.length < 2
        ) {
          next.push(
            createPowerUp(
              powerIdRef.current++
            )
          );
        }

        return next;
      });

      animationRef.current =
        requestAnimationFrame(updateGame);
    },
    [
      started,
      paused,
      gameOver,
      countdownFinished,
      showMessage,
      stopNitro,
    ]
  );

  useEffect(() => {
    if (!started) {
      return;
    }

    lastTimeRef.current =
      performance.now();

    animationRef.current =
      requestAnimationFrame(updateGame);

    return () => {
      cancelAnimationFrame(
        animationRef.current
      );
    };
  }, [started, updateGame]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();

      if (
        key === "arrowleft" ||
        key === "a"
      ) {
        event.preventDefault();

        if (!event.repeat) {
          moveLeft();
        }
      }

      if (
        key === "arrowright" ||
        key === "d"
      ) {
        event.preventDefault();

        if (!event.repeat) {
          moveRight();
        }
      }

      if (
        key === " " ||
        key === "shift"
      ) {
        event.preventDefault();

        activateNitro();
      }

      if (key === "p") {
        event.preventDefault();

        if (
          started &&
          countdownFinished &&
          !gameOver
        ) {
          setPaused((value) => !value);
        }
      }

      if (key === "escape") {
        setShowHowTo(false);
      }
    };

    const handleKeyUp = (event) => {
      const key = event.key.toLowerCase();

      if (
        key === " " ||
        key === "shift"
      ) {
        stopNitro();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    window.addEventListener(
      "keyup",
      handleKeyUp
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

      window.removeEventListener(
        "keyup",
        handleKeyUp
      );
    };
  }, [
    moveLeft,
    moveRight,
    activateNitro,
    stopNitro,
    started,
    countdownFinished,
    gameOver,
  ]);

  useEffect(() => {
    if (
      !started ||
      paused ||
      gameOver ||
      !countdownFinished
    ) {
      return;
    }

    const collisionTimer =
      window.setInterval(() => {
        const playerLane =
          playerLaneRef.current;

        const collidedCars = [];

        setTraffic((current) => {
          const remaining = [];

          current.forEach((car) => {
            const sameLane =
              ROAD_LANES.indexOf(car.lane) ===
              playerLane;

            const playerTop = 78;

            const verticalDistance =
              Math.abs(car.top - playerTop);

            if (
              sameLane &&
              verticalDistance < 9
            ) {
              collidedCars.push(car);

              return;
            }

            if (
              sameLane &&
              car.top > 52 &&
              car.top < 88
            ) {
              const nearMissScore =
                doubleScoreRef.current
                  ? 100
                  : 50;

              scoreRef.current +=
                nearMissScore;

              setScore(
                Math.floor(
                  scoreRef.current
                )
              );

              comboRef.current += 1;

              setCombo(
                comboRef.current
              );

              showMessage(
                `NEAR MISS +${nearMissScore}`,
                "success"
              );

              return;
            }

            remaining.push(car);
          });

          return remaining;
        });

        if (collidedCars.length > 0) {
          damagePlayer(25);
        }

        setPowerUps((current) => {
          const remaining = [];

          current.forEach((power) => {
            const sameLane =
              ROAD_LANES.indexOf(power.lane) ===
              playerLane;

            const close =
              Math.abs(power.top - 78) < 10;

            if (sameLane && close) {
              collectPowerUp(power);
              return;
            }

            remaining.push(power);
          });

          return remaining;
        });
      }, 120);

    return () => {
      window.clearInterval(
        collisionTimer
      );
    };
  }, [
    started,
    paused,
    gameOver,
    countdownFinished,
    damagePlayer,
    collectPowerUp,
    showMessage,
  ]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(
        animationRef.current
      );
    };
  }, []);

  const playerLeft =
    ROAD_LANES[playerLane];

  return (
    <main
      ref={gameRef}
      className={`indian-racing-game ${
        crashing ? "crash-shake" : ""
      } ${
        nitroActive ? "nitro-active" : ""
      }`}
    >
      {/* =====================================================
          BACKGROUND
          ===================================================== */}

      <div className="racing-background">
        <div className="city-skyline skyline-one" />
        <div className="city-skyline skyline-two" />
        <div className="city-lights" />
      </div>

      {/* =====================================================
          START MENU
          ===================================================== */}

      {!started && !gameOver && (
        <section className="racing-menu">
          <div className="menu-glow" />

          <div className="menu-content">
            <span className="menu-badge">
              🇮🇳 INDIA • ARCADE RACING
            </span>

            <h1>
              INDIAN
              <span>STREET RACING</span>
            </h1>

            <p>
              SPEED • TRAFFIC • NITRO • SURVIVE
            </p>

            <div className="preview-car">
              <div className="preview-body">
                <div className="preview-window" />

                <div className="preview-light light-left" />
                <div className="preview-light light-right" />

                <div className="preview-wheel preview-wheel-left" />
                <div className="preview-wheel preview-wheel-right" />
              </div>
            </div>

            <div className="menu-stats">
              <div>
                <strong>∞</strong>
                <span>ENDLESS ROAD</span>
              </div>

              <div>
                <strong>3</strong>
                <span>LANES</span>
              </div>

              <div>
                <strong>⚡</strong>
                <span>NITRO</span>
              </div>
            </div>

            <button
              className="primary-button"
              onClick={startGame}
            >
              🏁 START RACE
            </button>

            <button
              className="secondary-button"
              onClick={() =>
                setShowHowTo(true)
              }
            >
              🎮 HOW TO PLAY
            </button>
          </div>
        </section>
      )}

      {/* =====================================================
          COUNTDOWN
          ===================================================== */}

      {started &&
        !countdownFinished &&
        !gameOver && (
          <section className="countdown-screen">
            <span className="countdown-label">
              GET READY
            </span>

            <div
              className={`countdown-number ${
                countdown === 0
                  ? "countdown-go"
                  : ""
              }`}
              key={countdown}
            >
              {countdown === 0
                ? "GO!"
                : countdown}
            </div>
          </section>
        )}

      {/* =====================================================
          HUD
          ===================================================== */}

      {started && (
        <>
          <header className="racing-hud">
            <div className="hud-card score-card">
              <span>🏆 SCORE</span>
              <strong>
                {score.toLocaleString()}
              </strong>
              <small>
                {doubleScoreActive
                  ? "×2 ACTIVE"
                  : "RACE SCORE"}
              </small>
            </div>

            <div className="hud-card distance-card">
              <span>📍 DISTANCE</span>
              <strong>
                {distance} m
              </strong>
              <small>
                LEVEL {level}
              </small>
            </div>

            <div className="hud-card speed-card">
              <span>⚡ SPEED</span>
              <strong>
                {speed}
              </strong>
              <small>KM/H</small>
            </div>

            <button
              className="mute-button"
              onClick={() =>
                setMuted((value) => !value)
              }
              aria-label="Toggle sound"
            >
              {muted ? "🔇" : "🔊"}
            </button>

            <button
              className="pause-button"
              onClick={() => {
                if (
                  countdownFinished &&
                  !gameOver
                ) {
                  setPaused(
                    (value) => !value
                  );
                }
              }}
              aria-label="Pause game"
            >
              {paused ? "▶" : "Ⅱ"}
            </button>
          </header>

          {/* =================================================
              STATUS
              ================================================= */}

          <div className="race-status">
            <div className="status-item">
              <span>❤️ HEALTH</span>

              <div>
                <span className="status-bar">
                  <span
                    className={`health-fill ${
                      health <= 25
                        ? "critical"
                        : health <= 50
                        ? "warning"
                        : ""
                    }`}
                    style={{
                      width: `${health}%`,
                    }}
                  />
                </span>

                <strong>
                  {health}%
                </strong>
              </div>
            </div>

            <div className="status-item">
              <span>⚡ NITRO</span>

              <div>
                <span className="status-bar">
                  <span
                    className="nitro-fill"
                    style={{
                      width: `${nitro}%`,
                    }}
                  />
                </span>

                <strong>
                  {Math.floor(nitro)}%
                </strong>
              </div>
            </div>

            <div className="level-indicator">
              <span>LEVEL</span>
              <strong>{level}</strong>
            </div>

            <div className="combo-indicator">
              <span>COMBO</span>
              <strong>
                ×{combo}
              </strong>
            </div>
          </div>
        </>
      )}

      {/* =====================================================
          RACE WORLD
          ===================================================== */}

      {started && (
        <section className="race-world">
          <div className="road-side left-side">
            <div className="side-buildings" />
            <div className="street-lights" />
          </div>

          <div
            className="race-road"
            style={{
              "--road-offset": `${
                (distance * 8) % 130
              }px`,
            }}
          >
            <div className="road-glow left-glow" />
            <div className="road-glow right-glow" />

            <div className="lane-markings">
              <div />
              <div />
              <div />
            </div>

            <div className="road-decoration road-sign-one">
              MUMBAI • DELHI • PUNE
            </div>

            <div className="road-decoration road-sign-two">
              DRIVE SAFE
            </div>

            {/* =============================================
                TRAFFIC
                ============================================= */}

            {traffic.map((car) => (
              <div
                key={car.id}
                className={`traffic-car ${car.type}`}
                style={{
                  left: `${car.lane}%`,
                  top: `${car.top}%`,
                }}
              >
                <div className="traffic-window" />

                <div className="traffic-light traffic-light-left" />
                <div className="traffic-light traffic-light-right" />

                <div className="traffic-wheel traffic-wheel-left" />
                <div className="traffic-wheel traffic-wheel-right" />
              </div>
            ))}

            {/* =============================================
                POWER UPS
                ============================================= */}

            {powerUps.map((power) => (
              <div
                key={power.id}
                className={`power-up ${power.type}`}
                style={{
                  left: `${power.lane}%`,
                  top: `${power.top}%`,
                }}
              >
                {power.icon}
              </div>
            ))}

            {/* =============================================
                PLAYER
                ============================================= */}

            <div
              className="player-car"
              style={{
                left: `${playerLeft}%`,
              }}
            >
              {shieldActive && (
                <div className="shield-ring" />
              )}

              <div className="player-car-body">
                <div className="player-front-glass" />

                <div className="car-stripe" />

                <div className="player-hood" />

                <div className="headlight headlight-left" />
                <div className="headlight headlight-right" />

                <div className="rear-light rear-light-left" />
                <div className="rear-light rear-light-right" />

                <div className="player-wheel player-wheel-left" />
                <div className="player-wheel player-wheel-right" />
              </div>

              <div className="car-shadow" />

              {nitroActive && (
                <div className="nitro-flames">
                  <i />
                  <i />
                  <i />
                </div>
              )}
            </div>
          </div>

          <div className="road-side right-side">
            <div className="side-buildings" />
            <div className="street-lights" />
          </div>
        </section>
      )}

      {/* =====================================================
          MESSAGE
          ===================================================== */}

      {message && (
        <div
          className={`race-message ${messageType}`}
        >
          {message}
        </div>
      )}

      {/* =====================================================
          NEAR MISS / POWER EFFECTS
          ===================================================== */}

      {started &&
        combo >= 3 &&
        !gameOver && (
          <div className="near-miss-text">
            🔥 COMBO ×{combo}
          </div>
        )}

      {/* =====================================================
          MOBILE CONTROLS
          ===================================================== */}

      {started &&
        countdownFinished &&
        !gameOver && (
          <div className="mobile-controls">
            <button
              onPointerDown={moveLeft}
            >
              ◀
            </button>

            <button
              className={
                nitroActive
                  ? "nitro-control active"
                  : "nitro-control"
              }
              onPointerDown={
                activateNitro
              }
              onPointerUp={stopNitro}
              onPointerLeave={stopNitro}
              onPointerCancel={stopNitro}
            >
              ⚡ NITRO
            </button>

            <button
              onClick={() => {
                if (
                  countdownFinished &&
                  !gameOver
                ) {
                  setPaused(
                    (value) => !value
                  );
                }
              }}
            >
              {paused ? "▶" : "Ⅱ"}
            </button>

            <button
              onPointerDown={moveRight}
            >
              ▶
            </button>
          </div>
        )}

      {/* =====================================================
          PAUSE
          ===================================================== */}

      {paused &&
        started &&
        !gameOver && (
          <div className="overlay-screen">
            <div className="overlay-card">
              <div className="overlay-icon">
                Ⅱ
              </div>

              <h2>GAME PAUSED</h2>

              <p>
                Your race is waiting for you.
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  setPaused(false)
                }
              >
                ▶ RESUME RACE
              </button>

              <button
                className="secondary-button"
                onClick={resetGame}
              >
                🏠 EXIT RACE
              </button>
            </div>
          </div>
        )}

      {/* =====================================================
          GAME OVER
          ===================================================== */}

      {gameOver && (
        <section className="overlay-screen">
          <div className="game-over-card">
            <span className="game-over-label">
              RACE FINISHED
            </span>

            <h2>GAME OVER</h2>

            <div className="final-score">
              <span>FINAL SCORE</span>

              <strong>
                {score.toLocaleString()}
              </strong>
            </div>

            <div className="final-stats">
              <div>
                <span>DISTANCE</span>
                <strong>
                  {distance} m
                </strong>
              </div>

              <div>
                <span>LEVEL</span>
                <strong>
                  {level}
                </strong>
              </div>

              <div>
                <span>MAX COMBO</span>
                <strong>
                  ×{combo}
                </strong>
              </div>

              <div>
                <span>TOP SPEED</span>
                <strong>
                  {speed} KM/H
                </strong>
              </div>
            </div>

            <button
              className="primary-button"
              onClick={startGame}
            >
              🔄 PLAY AGAIN
            </button>

            <button
              className="secondary-button"
              onClick={resetGame}
            >
              🏠 MAIN MENU
            </button>
          </div>
        </section>
      )}

      {/* =====================================================
          HOW TO PLAY
          ===================================================== */}

      {showHowTo && (
        <section className="overlay-screen">
          <div className="how-to-card">
            <button
              className="close-button"
              onClick={() =>
                setShowHowTo(false)
              }
            >
              ×
            </button>

            <div className="overlay-icon">
              🎮
            </div>

            <h2>
              HOW TO <span>PLAY</span>
            </h2>

            <div className="control-grid">
              <div>
                <strong>
                  ← → / A D
                </strong>
                <span>
                  Change your racing lane
                </span>
              </div>

              <div>
                <strong>
                  SPACE / SHIFT
                </strong>
                <span>
                  Activate Nitro Boost
                </span>
              </div>

              <div>
                <strong>
                  P
                </strong>
                <span>
                  Pause or resume the race
                </span>
              </div>

              <div>
                <strong>
                  ⚡ POWER UPS
                </strong>
                <span>
                  Collect Nitro, Health,
                  Shield and ×2
                </span>
              </div>
            </div>

            <p className="how-to-tip">
              Avoid traffic, collect power-ups,
              perform near misses and survive as
              long as possible. The road gets faster
              with every level.
            </p>

            <button
              className="primary-button"
              onClick={() =>
                setShowHowTo(false)
              }
            >
              🏁 LET'S RACE
            </button>
          </div>
        </section>
      )}

      {/* =====================================================
          FOOTER
          ===================================================== */}

      <div className="racing-footer">
        INDIAN STREET RACING • GAME STATION
      </div>
    </main>
  );
}

export default IndianStreetRacing;