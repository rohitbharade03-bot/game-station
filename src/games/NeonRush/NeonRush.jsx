import React, { useCallback, useEffect, useRef, useState } from "react";
import "./NeonRush.css";

/*
  NEON RUSH: ESCAPE
  Game 8

  Controls:
  ← / A  = Move Left
  → / D  = Move Right
  ↑ / W / Space = Jump
  P       = Pause
  M       = Sound ON/OFF
*/

const LANES = [-1, 0, 1];

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

const randomLane = () =>
  LANES[Math.floor(Math.random() * LANES.length)];

const randomType = () => {
  const types = ["block", "laser", "drone", "wall"];
  return types[Math.floor(Math.random() * types.length)];
};

const makeCoin = (id, lane, y = -8) => ({
  id,
  type: "coin",
  lane,
  y,
  collected: false,
});

const makeObstacle = (id, lane, y = -10) => ({
  id,
  type: randomType(),
  lane,
  y,
  passed: false,
});

const makePower = (id, lane, y = -10) => {
  const types = ["shield", "magnet", "energy", "slow"];

  return {
    id,
    type: "power",
    power: types[Math.floor(Math.random() * types.length)],
    lane,
    y,
    collected: false,
  };
};

function NeonRush() {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  const [lane, setLane] = useState(0);
  const [jumping, setJumping] = useState(false);

  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [distance, setDistance] = useState(0);

  const [speed, setSpeed] = useState(1);
  const [combo, setCombo] = useState(0);

  const [message, setMessage] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [newBest, setNewBest] = useState(false);

  const [objects, setObjects] = useState([]);

  const [activePower, setActivePower] = useState(null);
  const [powerTime, setPowerTime] = useState(0);

  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem("neonRushBest");
    return Number(saved || 0);
  });

  const gameRef = useRef({
    lastTime: 0,
    spawnTimer: 0,
    coinTimer: 0,
    powerTimer: 0,
    id: 0,
    score: 0,
    coins: 0,
    distance: 0,
    speed: 1,
    combo: 0,
    lane: 0,
    jumping: false,
    jumpUntil: 0,
    activePower: null,
    powerUntil: 0,
    objects: [],
  });

  const audioRef = useRef(null);

  /* ======================================================
     SOUND ENGINE
     ====================================================== */

  const playSound = useCallback(
    (frequency = 440, duration = 0.08, type = "sine", volume = 0.045) => {
      if (!soundOn) return;

      try {
        const AudioContext =
          window.AudioContext || window.webkitAudioContext;

        if (!AudioContext) return;

        if (!audioRef.current) {
          audioRef.current = new AudioContext();
        }

        const ctx = audioRef.current;

        if (ctx.state === "suspended") {
          ctx.resume();
        }

        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(
          frequency,
          ctx.currentTime
        );

        gain.gain.setValueAtTime(
          volume,
          ctx.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + duration
        );

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start();
        oscillator.stop(ctx.currentTime + duration);
      } catch {
        // Audio is optional.
      }
    },
    [soundOn]
  );

  const playCoinSound = useCallback(() => {
    playSound(900, 0.06, "sine", 0.055);

    setTimeout(() => {
      playSound(1300, 0.07, "sine", 0.04);
    }, 35);
  }, [playSound]);

  /* ======================================================
     MESSAGE
     ====================================================== */

  const showMessage = useCallback((text) => {
    setMessage(text);

    setTimeout(() => {
      setMessage((current) =>
        current === text ? "" : current
      );
    }, 850);
  }, []);

  /* ======================================================
     START GAME
     ====================================================== */

  const startGame = useCallback(() => {
    const game = gameRef.current;

    game.lastTime = 0;
    game.spawnTimer = 0;
    game.coinTimer = 0;
    game.powerTimer = 0;
    game.id = 0;

    game.score = 0;
    game.coins = 0;
    game.distance = 0;
    game.speed = 1;
    game.combo = 0;

    game.lane = 0;
    game.jumping = false;
    game.jumpUntil = 0;

    game.activePower = null;
    game.powerUntil = 0;

    game.objects = [];

    setScore(0);
    setCoins(0);
    setDistance(0);
    setSpeed(1);
    setCombo(0);

    setLane(0);
    setJumping(false);

    setObjects([]);

    setActivePower(null);
    setPowerTime(0);

    setGameOver(false);
    setNewBest(false);
    setMessage("");

    setPaused(false);
    setRunning(true);

    playSound(420, 0.1, "square", 0.035);

    setTimeout(() => {
      playSound(700, 0.12, "square", 0.035);
    }, 100);
  }, [playSound]);

  /* ======================================================
     GAME OVER
     ====================================================== */

  const endGame = useCallback(() => {
    const game = gameRef.current;

    setRunning(false);
    setGameOver(true);
    setPaused(false);

    const finalScore = Math.floor(game.score);

    let isNewBest = false;

    if (finalScore > bestScore) {
      isNewBest = true;
      setBestScore(finalScore);
      setNewBest(true);

      localStorage.setItem(
        "neonRushBest",
        String(finalScore)
      );
    }

    if (isNewBest) {
      showMessage("NEW BEST!");
      playSound(1200, 0.2, "triangle", 0.06);
    } else {
      playSound(160, 0.25, "sawtooth", 0.055);
    }
  }, [bestScore, playSound, showMessage]);

  /* ======================================================
     MOVE
     ====================================================== */

  const moveLeft = useCallback(() => {
    if (!running || paused || gameOver) return;

    const game = gameRef.current;

    game.lane = clamp(game.lane - 1, -1, 1);

    setLane(game.lane);

    playSound(260, 0.045, "square", 0.025);
  }, [gameOver, paused, playSound, running]);

  const moveRight = useCallback(() => {
    if (!running || paused || gameOver) return;

    const game = gameRef.current;

    game.lane = clamp(game.lane + 1, -1, 1);

    setLane(game.lane);

    playSound(360, 0.045, "square", 0.025);
  }, [gameOver, paused, playSound, running]);

  /* ======================================================
     JUMP
     ====================================================== */

  const jump = useCallback(() => {
    if (!running || paused || gameOver) return;

    const game = gameRef.current;

    if (game.jumping) return;

    game.jumping = true;
    game.jumpUntil = window.performance.now() + 650;

    setJumping(true);

    playSound(560, 0.08, "triangle", 0.04);
  }, [gameOver, paused, playSound, running]);

  /* ======================================================
     KEYBOARD
     ====================================================== */

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();

      if (
        key === "arrowleft" ||
        key === "a"
      ) {
        event.preventDefault();
        moveLeft();
      }

      if (
        key === "arrowright" ||
        key === "d"
      ) {
        event.preventDefault();
        moveRight();
      }

      if (
        key === "arrowup" ||
        key === "w" ||
        key === " "
      ) {
        event.preventDefault();
        jump();
      }

      if (key === "p") {
        setPaused((value) => value);
      }

      if (key === "m") {
        setSoundOn((value) => !value);
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
  }, [jump, moveLeft, moveRight]);

  /* ======================================================
     PAUSE
     ====================================================== */

  const togglePause = () => {
    if (!running || gameOver) return;

    setPaused((value) => !value);
  };

  /* ======================================================
     GAME LOOP
     ====================================================== */

  useEffect(() => {
    if (!running || paused || gameOver) return;

    let animationFrame;

    const loop = (time) => {
      const game = gameRef.current;

      if (!game.lastTime) {
        game.lastTime = time;
      }

      const delta = Math.min(
        (time - game.lastTime) / 1000,
        0.05
      );

      game.lastTime = time;

      /*
        IMPORTANT:
        Never use `performance.now()` here.
        The game uses the browser API explicitly:
        window.performance.now()
      */

      if (
        game.jumping &&
        window.performance.now() >= game.jumpUntil
      ) {
        game.jumping = false;
        setJumping(false);
      }

      /* ---------------------------------------------
         SPEED
      --------------------------------------------- */

      game.speed = Math.min(
        2.8,
        1 + game.distance / 2500
      );

      if (game.activePower === "slow") {
        game.speed *= 0.58;
      }

      /* ---------------------------------------------
         DISTANCE / SCORE
      --------------------------------------------- */

      game.distance +=
        delta * 120 * game.speed;

      game.score +=
        delta * 10 * game.speed;

      /* ---------------------------------------------
         SPAWN
      --------------------------------------------- */

      game.spawnTimer += delta;
      game.coinTimer += delta;
      game.powerTimer += delta;

      const obstacleInterval = Math.max(
        0.55,
        1.15 - game.speed * 0.16
      );

      if (game.spawnTimer >= obstacleInterval) {
        game.spawnTimer = 0;

        const newObstacle = makeObstacle(
          ++game.id,
          randomLane()
        );

        game.objects.push(newObstacle);
      }

      /* ---------------------------------------------
         COINS
      --------------------------------------------- */

      if (game.coinTimer >= 0.42) {
        game.coinTimer = 0;

        const newCoin = makeCoin(
          ++game.id,
          randomLane()
        );

        game.objects.push(newCoin);
      }

      /* ---------------------------------------------
         POWERUPS
      --------------------------------------------- */

      if (
        game.powerTimer >= 7 &&
        Math.random() < 0.55
      ) {
        game.powerTimer = 0;

        const newPower = makePower(
          ++game.id,
          randomLane()
        );

        game.objects.push(newPower);
      }

      /* ---------------------------------------------
         MOVE OBJECTS
      --------------------------------------------- */

      const movement =
        delta *
        38 *
        game.speed;

      for (const object of game.objects) {
        object.y += movement;
      }

      /* ---------------------------------------------
         COLLISION
      --------------------------------------------- */

      const playerLane = game.lane;
      const playerY = 82;

      for (const object of game.objects) {
        if (
          object.collected ||
          object.passed
        ) {
          continue;
        }

        const sameLane =
          object.lane === playerLane;

        const closeY =
          Math.abs(object.y - playerY) < 8;

        if (!sameLane || !closeY) {
          continue;
        }

        /* COIN */

        if (object.type === "coin") {
          object.collected = true;

          game.coins += 1;

          game.combo += 1;

          game.score +=
            25 + game.combo * 2;

          playCoinSound();

          showMessage(
            game.combo >= 3
              ? `+COIN  COMBO x${game.combo}`
              : "+COIN"
          );

          continue;
        }

        /* POWER */

        if (object.type === "power") {
          object.collected = true;

          game.activePower = object.power;
          game.powerUntil =
            window.performance.now() + 6000;

          setActivePower(object.power);
          setPowerTime(6);

          playSound(
            700,
            0.12,
            "triangle",
            0.05
          );

          showMessage(
            object.power.toUpperCase()
          );

          continue;
        }

        /* OBSTACLE */

        if (
          object.type === "block" ||
          object.type === "laser" ||
          object.type === "drone" ||
          object.type === "wall"
        ) {
          /*
            Shield protects the player.
          */

          if (game.activePower === "shield") {
            object.passed = true;
            game.activePower = null;

            setActivePower(null);
            setPowerTime(0);

            game.score += 100;

            playSound(
              250,
              0.12,
              "square",
              0.05
            );

            showMessage("SHIELD BLOCK!");

            continue;
          }

          /*
            Jump avoids ground obstacles.
          */

          if (game.jumping) {
            game.score += 40;

            showMessage("DODGE!");

            continue;
          }

          endGame();
          return;
        }
      }

      /* ---------------------------------------------
         REMOVE OLD OBJECTS
      --------------------------------------------- */

      game.objects =
        game.objects.filter(
          (object) =>
            object.y < 115 &&
            !object.collected &&
            !object.passed
        );

      /* ---------------------------------------------
         POWER TIMER
      --------------------------------------------- */

      if (game.activePower) {
        const remaining =
          Math.max(
            0,
            game.powerUntil -
              window.performance.now()
          );

        const seconds =
          Math.ceil(remaining / 1000);

        setPowerTime(seconds);

        if (remaining <= 0) {
          game.activePower = null;
          setActivePower(null);
          setPowerTime(0);
        }
      }

      /* ---------------------------------------------
         REACT STATE
      --------------------------------------------- */

      setScore(Math.floor(game.score));
      setCoins(game.coins);
      setDistance(Math.floor(game.distance));
      setSpeed(Number(game.speed.toFixed(1)));
      setCombo(game.combo);

      setObjects([
        ...game.objects,
      ]);

      animationFrame =
        requestAnimationFrame(loop);
    };

    animationFrame =
      requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [
    endGame,
    gameOver,
    paused,
    playCoinSound,
    running,
    showMessage,
  ]);

  /* ======================================================
     CLEANUP AUDIO
     ====================================================== */

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        try {
          audioRef.current.close();
        } catch {
          // Ignore audio cleanup errors.
        }
      }
    };
  }, []);

  /* ======================================================
     OBJECT POSITION
  ====================================================== */

  const laneToPercent = (objectLane) => {
    if (objectLane === -1) return 20;
    if (objectLane === 0) return 50;
    return 80;
  };

  const playerPercent =
    lane === -1
      ? 20
      : lane === 0
        ? 50
        : 80;

  /* ======================================================
     POWER LABEL
  ====================================================== */

  const powerIcon = {
    shield: "◉",
    magnet: "✦",
    energy: "⚡",
    slow: "◌",
  };

  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <div className="neon-rush">
      {/* HEADER */}

      <header className="nr-header">
        <div className="nr-brand">
          <div className="nr-brandIcon">
            ⚡
          </div>

          <div>
            <strong>NEON RUSH</strong>
            <small>ESCAPE</small>
          </div>
        </div>

        <div className="nr-headerStats">
          <div>
            <span>BEST</span>
            <strong>
              {bestScore.toLocaleString()}
            </strong>
          </div>

          <button
            className="nr-sound"
            onClick={() =>
              setSoundOn((value) => !value)
            }
            aria-label="Toggle sound"
          >
            {soundOn ? "🔊" : "🔇"}
          </button>

          <button
            className="nr-pause"
            onClick={togglePause}
            disabled={!running}
            aria-label="Pause game"
          >
            {paused ? "▶" : "Ⅱ"}
          </button>
        </div>
      </header>

      <main className="nr-gameShell">
        {/* HUD */}

        <div className="nr-hud">
          <div className="nr-statCard">
            <span>SCORE</span>
            <strong>
              {score.toLocaleString()}
            </strong>
          </div>

          <div className="nr-statCard coinStat">
            <span>COINS</span>
            <strong>
              🟡 {coins}
            </strong>
          </div>

          <div className="nr-statCard">
            <span>DISTANCE</span>
            <strong>
              {distance}m
            </strong>
          </div>

          <div className="nr-statCard">
            <span>SPEED</span>
            <strong>
              ×{speed}
            </strong>
          </div>

          <div className="nr-riskCard">
            <div className="nr-riskHeader">
              <span>
                NEON RUSH PROGRESS
              </span>

              <strong>
                {Math.min(
                  100,
                  Math.floor(
                    distance / 10
                  )
                )}
                %
              </strong>
            </div>

            <div className="nr-riskBar">
              <span
                style={{
                  width: `${Math.min(
                    100,
                    distance / 10
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* WORLD */}

        <section
          className={`nr-world ${
            activePower
              ? `power-${activePower}`
              : ""
          }`}
        >
          {/* SKY */}

          <div className="nr-sky">
            <div className="nr-moon">
              ◉
            </div>

            <div className="nr-city cityBack">
              NEON CITY
            </div>

            <div className="nr-city cityFront">
              NEON RUSH
            </div>

            <div className="nr-gridGlow" />
          </div>

          {/* TRACK */}

          <div className="nr-track">
            <div className="nr-lane laneLeft" />
            <div className="nr-lane laneMiddle" />

            <div className="nr-trackGlow" />

            {/* OBJECTS */}

            {objects.map((object) => {
              const left =
                laneToPercent(
                  object.lane
                );

              if (
                object.type === "coin"
              ) {
                return (
                  <div
                    key={object.id}
                    className="nr-object nr-coin"
                    style={{
                      left: `${left}%`,
                      top: `${object.y}%`,
                    }}
                  >
                    🟡
                  </div>
                );
              }

              if (
                object.type === "power"
              ) {
                return (
                  <div
                    key={object.id}
                    className={`nr-object nr-powerup power-${object.power}`}
                    style={{
                      left: `${left}%`,
                      top: `${object.y}%`,
                    }}
                  >
                    <span>
                      {powerIcon[
                        object.power
                      ]}
                    </span>

                    <small>
                      {object.power}
                    </small>
                  </div>
                );
              }

              return (
                <div
                  key={object.id}
                  className={`nr-object nr-obstacle obstacle-${object.type}`}
                  style={{
                    left: `${left}%`,
                    top: `${object.y}%`,
                  }}
                >
                  <span>
                    {object.type ===
                      "laser" && "⚡"}

                    {object.type ===
                      "drone" && "◉"}

                    {object.type ===
                      "wall" && "▣"}

                    {object.type ===
                      "block" && "✦"}
                  </span>

                  <small>
                    {object.type}
                  </small>
                </div>
              );
            })}

            {/* PLAYER */}

            <div
              className={`nr-player ${
                jumping
                  ? "isJumping"
                  : ""
              }`}
              style={{
                "--player-lane":
                  lane,
                left: `${playerPercent}%`,
                "--player-jump":
                  jumping ? 1 : 0,
              }}
            >
              <div className="nr-playerGlow" />

              <div className="nr-playerHead" />

              <div className="nr-playerBody">
                <span />
              </div>

              <div className="nr-playerLeg left" />
              <div className="nr-playerLeg right" />
            </div>
          </div>

          {/* POWER HUD */}

          {activePower && (
            <div className="nr-activePower">
              <span>
                {powerIcon[
                  activePower
                ]}{" "}
                {activePower.toUpperCase()}
              </span>

              <strong>
                {powerTime}s
              </strong>
            </div>
          )}

          {/* MESSAGE */}

          {message && (
            <div
              key={message}
              className="nr-message"
            >
              {message}
            </div>
          )}

          {/* ROAD TEXT */}

          <div className="nr-roadText">
            <span>
              KEEP MOVING
            </span>

            <strong>
              → → → NEON ZONE
            </strong>
          </div>

          {/* START SCREEN */}

          {!running &&
            !gameOver && (
              <div className="nr-startOverlay">
                <div className="nr-startCard">
                  <div className="nr-startIcon">
                    ⚡
                  </div>

                  <span>
                    GAME 08 • ORIGINAL
                  </span>

                  <h1>
                    NEON
                    <b>RUSH</b>
                  </h1>

                  <p>
                    Dodge the neon hazards,
                    collect coins, chain
                    combos and survive as
                    long as possible.
                  </p>

                  <button
                    className="nr-mainButton"
                    onClick={startGame}
                  >
                    START RUSH
                    <span>→</span>
                  </button>

                  <div className="nr-startHelp">
                    <span>
                      ← →
                      <small>MOVE</small>
                    </span>

                    <span>
                      ↑
                      <small>JUMP</small>
                    </span>

                    <span>
                      P
                      <small>PAUSE</small>
                    </span>
                  </div>
                </div>
              </div>
            )}

          {/* PAUSE SCREEN */}

          {running && paused && (
            <div className="nr-startOverlay">
              <div className="nr-startCard">
                <div className="nr-startIcon">
                  Ⅱ
                </div>

                <span>
                  RUN PAUSED
                </span>

                <h1>
                  TAKE A
                  <b>BREATH</b>
                </h1>

                <p>
                  Your run is safe. Continue
                  when you're ready.
                </p>

                <button
                  className="nr-mainButton"
                  onClick={togglePause}
                >
                  CONTINUE
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* GAME OVER */}

          {gameOver && (
            <div className="nr-startOverlay">
              <div className="nr-resultCard">
                <span>
                  RUN COMPLETE
                </span>

                <h1>
                  {newBest
                    ? "NEW RECORD!"
                    : "NICE RUN!"}
                </h1>

                <div className="nr-resultScore">
                  {score.toLocaleString()}
                </div>

                <div className="nr-resultStats">
                  <div>
                    <span>
                      COINS
                    </span>

                    <strong>
                      🟡 {coins}
                    </strong>
                  </div>

                  <div>
                    <span>
                      DISTANCE
                    </span>

                    <strong>
                      {distance}m
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

                  <div>
                    <span>
                      COMBO
                    </span>

                    <strong>
                      ×{combo}
                    </strong>
                  </div>
                </div>

                {newBest && (
                  <div className="nr-newBest">
                    ★ PERSONAL BEST ★
                  </div>
                )}

                <div className="nr-resultButtons">
                  <button
                    className="nr-secondaryButton"
                    onClick={() =>
                      setGameOver(false)
                    }
                  >
                    CLOSE
                  </button>

                  <button
                    className="nr-mainButton"
                    onClick={startGame}
                  >
                    PLAY AGAIN
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* BOTTOM HUD */}

        <div className="nr-bottomHud">
          <div className="nr-combo">
            <span>
              COIN COMBO
            </span>

            <strong>
              ×{combo}
            </strong>

            <small>
              +BONUS
            </small>
          </div>

          {/* CONTROLS */}

          <div className="nr-controls">
            <button
              onClick={moveLeft}
              disabled={
                !running ||
                paused
              }
              aria-label="Move left"
            >
              ←
            </button>

            <button
              className="jumpButton"
              onClick={jump}
              disabled={
                !running ||
                paused
              }
              aria-label="Jump"
            >
              ↑
            </button>

            <button
              onClick={moveRight}
              disabled={
                !running ||
                paused
              }
              aria-label="Move right"
            >
              →
            </button>
          </div>

          <div className="nr-tip">
            <span>
              PRO TIP
            </span>

            <p>
              Collect coins continuously
              to build your combo. Jump
              over hazards and use power
              modules at the right time.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default NeonRush;