import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import "./EchoWeaver.css";

/* =========================================================
   ECHO WEAVER
   ========================================================= */

const WORLD_WIDTH = 1800;
const WORLD_HEIGHT = 700;

const PLAYER_WIDTH = 42;
const PLAYER_HEIGHT = 58;

const GRAVITY = 0.72;
const MOVE_SPEED = 5;
const JUMP_POWER = 16;

const START_LIVES = 3;

const STORAGE_LEVEL = "echo_weaver_level";
const STORAGE_COINS = "echo_weaver_coins";
const STORAGE_SCORE = "echo_weaver_score";

/* =========================================================
   LEVEL DATA
   ========================================================= */

const LEVELS = [
  {
    id: 1,
    name: "First Echo",
    difficulty: "EASY",
    requiredFragments: 3,
    reward: 50,
  },
  {
    id: 2,
    name: "Dream Steps",
    difficulty: "EASY",
    requiredFragments: 4,
    reward: 70,
  },
  {
    id: 3,
    name: "Memory Forest",
    difficulty: "MEDIUM",
    requiredFragments: 5,
    reward: 90,
  },
  {
    id: 4,
    name: "Broken Time",
    difficulty: "MEDIUM",
    requiredFragments: 6,
    reward: 120,
  },
  {
    id: 5,
    name: "Echo Storm",
    difficulty: "HARD",
    requiredFragments: 7,
    reward: 160,
  },
];

/* =========================================================
   HELPERS
   ========================================================= */

function getSavedNumber(key, fallback) {
  try {
    const value = Number(localStorage.getItem(key));

    return Number.isFinite(value)
      ? value
      : fallback;
  } catch {
    return fallback;
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rectanglesOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function getPlayerRect(player) {
  return {
    x: player.x,
    y: player.y,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
  };
}

/* =========================================================
   PLAYER
   ========================================================= */

function createInitialPlayer() {
  return {
    x: 70,
    y: 570,
    vx: 0,
    vy: 0,
    grounded: false,
    facing: 1,
  };
}

/* =========================================================
   LEVEL CREATOR
   ========================================================= */
function createLevel(level) {
  const config = LEVELS[(level - 1) % LEVELS.length];

  const platformHeight = 26;

  // =====================================================
  // LEVEL 1 — FIRST ECHO
  // Easy / Beginner
  // =====================================================
  const level1Platforms = [
    {
      id: "ground",
      x: 0,
      y: 640,
      width: 1800,
      height: platformHeight,
      type: "ground",
    },
    { id: "p1", x: 170, y: 535, width: 190, height: platformHeight },
    { id: "p2", x: 430, y: 455, width: 170, height: platformHeight },
    { id: "p3", x: 670, y: 425, width: 180, height: platformHeight },
    { id: "p4", x: 920, y: 420, width: 190, height: platformHeight },
    { id: "p5", x: 1180, y: 500, width: 180, height: platformHeight },
    { id: "p6", x: 1420, y: 395, width: 190, height: platformHeight },
  ];

  // =====================================================
  // LEVEL 2 — DREAM STEPS
  // Zig-Zag
  // =====================================================
  const level2Platforms = [
    {
      id: "ground",
      x: 0,
      y: 640,
      width: 1800,
      height: platformHeight,
      type: "ground",
    },
    { id: "p1", x: 130, y: 545, width: 160, height: platformHeight },
    { id: "p2", x: 350, y: 480, width: 155, height: platformHeight },
    { id: "p3", x: 570, y: 530, width: 150, height: platformHeight },
    { id: "p4", x: 790, y: 430, width: 155, height: platformHeight },
    { id: "p5", x: 1010, y: 500, width: 155, height: platformHeight },
    { id: "p6", x: 1230, y: 390, width: 155, height: platformHeight },
    { id: "p7", x: 1450, y: 455, width: 155, height: platformHeight },
    { id: "p8", x: 1650, y: 535, width: 110, height: platformHeight },
  ];

  // =====================================================
  // LEVEL 3 — MEMORY FOREST
  // Vertical / Medium
  // =====================================================
  const level3Platforms = [
    {
      id: "ground",
      x: 0,
      y: 640,
      width: 1800,
      height: platformHeight,
      type: "ground",
    },
    { id: "p1", x: 150, y: 545, width: 155, height: platformHeight },
    { id: "p2", x: 360, y: 470, width: 145, height: platformHeight },
    { id: "p3", x: 570, y: 390, width: 145, height: platformHeight },
    { id: "p4", x: 780, y: 475, width: 145, height: platformHeight },
    { id: "p5", x: 990, y: 365, width: 145, height: platformHeight },
    { id: "p6", x: 1200, y: 445, width: 145, height: platformHeight },
    { id: "p7", x: 1410, y: 350, width: 145, height: platformHeight },
    { id: "p8", x: 1600, y: 455, width: 150, height: platformHeight },
  ];

  // =====================================================
  // LEVEL 4 — BROKEN TIME
  // Harder jumps
  // =====================================================
  const level4Platforms = [
    {
      id: "ground",
      x: 0,
      y: 640,
      width: 1800,
      height: platformHeight,
      type: "ground",
    },
    { id: "p1", x: 160, y: 545, width: 135, height: platformHeight },
    { id: "p2", x: 350, y: 450, width: 125, height: platformHeight },
    { id: "p3", x: 545, y: 515, width: 125, height: platformHeight },
    { id: "p4", x: 735, y: 390, width: 125, height: platformHeight },
    { id: "p5", x: 930, y: 470, width: 125, height: platformHeight },
    { id: "p6", x: 1125, y: 350, width: 125, height: platformHeight },
    { id: "p7", x: 1320, y: 430, width: 125, height: platformHeight },
    { id: "p8", x: 1515, y: 330, width: 125, height: platformHeight },
    { id: "p9", x: 1690, y: 500, width: 90, height: platformHeight },
  ];

  // =====================================================
  // LEVEL 5 — ECHO STORM
  // Maximum difficulty
  // =====================================================
  const level5Platforms = [
    {
      id: "ground",
      x: 0,
      y: 640,
      width: 1800,
      height: platformHeight,
      type: "ground",
    },
    { id: "p1", x: 120, y: 545, width: 120, height: platformHeight },
    { id: "p2", x: 300, y: 430, width: 110, height: platformHeight },
    { id: "p3", x: 475, y: 520, width: 110, height: platformHeight },
    { id: "p4", x: 650, y: 390, width: 110, height: platformHeight },
    { id: "p5", x: 825, y: 480, width: 110, height: platformHeight },
    { id: "p6", x: 1000, y: 350, width: 110, height: platformHeight },
    { id: "p7", x: 1175, y: 440, width: 110, height: platformHeight },
    { id: "p8", x: 1350, y: 320, width: 110, height: platformHeight },
    { id: "p9", x: 1525, y: 410, width: 110, height: platformHeight },
    { id: "p10", x: 1690, y: 510, width: 80, height: platformHeight },
  ];

  // =====================================================
  // SELECT PLATFORM SET
  // =====================================================

  let platforms = level1Platforms;

  if (level === 2) {
    platforms = level2Platforms;
  } else if (level === 3) {
    platforms = level3Platforms;
  } else if (level === 4) {
    platforms = level4Platforms;
  } else if (level === 5) {
    platforms = level5Platforms;
  }

  // =====================================================
  // LEVEL-WISE MEMORY FRAGMENTS
  // =====================================================

  const levelFragments = {
    1: [
      { id: "fragment-1", x: 230, y: 475 },
      { id: "fragment-2", x: 485, y: 395 },
      { id: "fragment-3", x: 730, y: 365 },
    ],

    2: [
      { id: "fragment-1", x: 185, y: 485 },
      { id: "fragment-2", x: 400, y: 420 },
      { id: "fragment-3", x: 620, y: 470 },
      { id: "fragment-4", x: 840, y: 370 },
    ],

    3: [
      { id: "fragment-1", x: 205, y: 490 },
      { id: "fragment-2", x: 410, y: 415 },
      { id: "fragment-3", x: 620, y: 335 },
      { id: "fragment-4", x: 830, y: 420 },
      { id: "fragment-5", x: 1040, y: 310 },
    ],

    4: [
      { id: "fragment-1", x: 195, y: 490 },
      { id: "fragment-2", x: 385, y: 395 },
      { id: "fragment-3", x: 580, y: 460 },
      { id: "fragment-4", x: 770, y: 335 },
      { id: "fragment-5", x: 965, y: 415 },
      { id: "fragment-6", x: 1160, y: 295 },
    ],

    5: [
      { id: "fragment-1", x: 150, y: 495 },
      { id: "fragment-2", x: 330, y: 375 },
      { id: "fragment-3", x: 505, y: 465 },
      { id: "fragment-4", x: 680, y: 335 },
      { id: "fragment-5", x: 855, y: 425 },
      { id: "fragment-6", x: 1030, y: 295 },
      { id: "fragment-7", x: 1380, y: 265 },
    ],
  };

  const selectedFragments =
    levelFragments[level] || levelFragments[1];

  const fragments = selectedFragments
    .slice(0, config.requiredFragments)
    .map((fragment) => ({
      ...fragment,
      collected: false,
    }));

  // =====================================================
  // LEVEL-WISE COINS
  // =====================================================

  const levelCoins = {
    1: [
      { id: "coin-1", x: 285, y: 500 },
      { id: "coin-2", x: 515, y: 420 },
      { id: "coin-3", x: 770, y: 390 },
      { id: "coin-4", x: 1000, y: 385 },
      { id: "coin-5", x: 1260, y: 465 },
    ],

    2: [
      { id: "coin-1", x: 220, y: 510 },
      { id: "coin-2", x: 430, y: 445 },
      { id: "coin-3", x: 650, y: 495 },
      { id: "coin-4", x: 870, y: 395 },
      { id: "coin-5", x: 1090, y: 465 },
      { id: "coin-6", x: 1310, y: 355 },
    ],

    3: [
      { id: "coin-1", x: 225, y: 510 },
      { id: "coin-2", x: 435, y: 435 },
      { id: "coin-3", x: 645, y: 355 },
      { id: "coin-4", x: 855, y: 440 },
      { id: "coin-5", x: 1065, y: 330 },
      { id: "coin-6", x: 1275, y: 410 },
    ],

    4: [
      { id: "coin-1", x: 195, y: 510 },
      { id: "coin-2", x: 390, y: 415 },
      { id: "coin-3", x: 585, y: 480 },
      { id: "coin-4", x: 775, y: 355 },
      { id: "coin-5", x: 970, y: 435 },
      { id: "coin-6", x: 1165, y: 315 },
    ],

    5: [
      { id: "coin-1", x: 155, y: 510 },
      { id: "coin-2", x: 335, y: 395 },
      { id: "coin-3", x: 510, y: 485 },
      { id: "coin-4", x: 685, y: 355 },
      { id: "coin-5", x: 860, y: 445 },
      { id: "coin-6", x: 1035, y: 315 },
    ],
  };

  const selectedCoins =
    levelCoins[level] || levelCoins[1];

  const coins = selectedCoins.map((coin) => ({
    ...coin,
    collected: false,
  }));

  // =====================================================
  // STARS
  // =====================================================

  const stars = [
    {
      id: "star-1",
      x: 380,
      y: 590,
      collected: false,
    },
    {
      id: "star-2",
      x: 880,
      y: 590,
      collected: false,
    },
    {
      id: "star-3",
      x: 1380,
      y: 590,
      collected: false,
    },
  ];

  // =====================================================
  // EXIT
  // =====================================================

  const exit = {
    x: 1690,
    y: 555,
    width: 70,
    height: 85,
  };

  // =====================================================
  // RETURN WORLD
  // =====================================================

  return {
    config,
    platforms,
    fragments,
    coins,
    stars,
    exit,
  };
}

/* =========================================================
   ECHO WEAVER COMPONENT
   ========================================================= */

export default function EchoWeaver() {
  const navigate = useNavigate();

  /* =====================================================
     INITIAL LEVEL
     ===================================================== */

  const initialLevel = clamp(
    getSavedNumber(
      STORAGE_LEVEL,
      1
    ),
    1,
    LEVELS.length
  );

  /* =====================================================
     STATE
     ===================================================== */

  const [level, setLevel] =
    useState(initialLevel);

  const [coins, setCoins] =
    useState(() =>
      Math.max(
        0,
        getSavedNumber(
          STORAGE_COINS,
          0
        )
      )
    );

  const [score, setScore] =
    useState(() =>
      Math.max(
        0,
        getSavedNumber(
          STORAGE_SCORE,
          0
        )
      )
    );

  const [lives, setLives] =
    useState(START_LIVES);

  const [player, setPlayer] =
    useState(createInitialPlayer);

  const [echo, setEcho] =
    useState({
      x: 30,
      y: 570,
      facing: 1,
      visible: false,
    });

  const [world, setWorld] =
    useState(() =>
      createLevel(initialLevel)
    );

  const [fragmentsCollected, setFragmentsCollected] =
    useState(0);

  const [gameState, setGameState] =
    useState("playing");

  const [soundOn, setSoundOn] =
    useState(true);

  const [cameraX, setCameraX] =
    useState(0);

  const [message, setMessage] =
    useState(
      "Follow your echo..."
    );

  /* =====================================================
     REFS
     ===================================================== */

  const keysRef = useRef({});

  const animationRef =
    useRef(null);

  const lastTimeRef =
    useRef(performance.now());

  const worldRef =
    useRef(world);

  const gameStateRef =
    useRef(gameState);

  const levelRef =
    useRef(level);

  const echoHistoryRef =
    useRef([]);

  const echoIndexRef =
    useRef(0);

  const collectedIdsRef =
    useRef(new Set());

  const audioContextRef =
    useRef(null);

  /* =====================================================
     KEEP REFS UPDATED
     ===================================================== */

  useEffect(() => {
    worldRef.current = world;
  }, [world]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  /* =====================================================
     CONFIG
     ===================================================== */

  const config = useMemo(() => {
    return (
      world.config ||
      LEVELS[
        (level - 1) %
          LEVELS.length
      ]
    );
  }, [world, level]);

  /* =====================================================
     SAVE PROGRESS
     ===================================================== */

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_LEVEL,
        String(level)
      );

      localStorage.setItem(
        STORAGE_COINS,
        String(coins)
      );

      localStorage.setItem(
        STORAGE_SCORE,
        String(score)
      );
    } catch {
      // ignore
    }
  }, [level, coins, score]);

  /* =====================================================
     SOUND
     ===================================================== */

  const playSound = useCallback(
    (
      frequency = 440,
      duration = 0.08
    ) => {
      if (!soundOn) {
        return;
      }

      try {
        const AudioCtx =
          window.AudioContext ||
          window.webkitAudioContext;

        if (!AudioCtx) {
          return;
        }

        if (!audioContextRef.current) {
          audioContextRef.current =
            new AudioCtx();
        }

        const ctx =
          audioContextRef.current;

        if (ctx.state === "suspended") {
          ctx.resume();
        }

        const oscillator =
          ctx.createOscillator();

        const gain =
          ctx.createGain();

        oscillator.frequency.value =
          frequency;

        oscillator.type = "sine";

        gain.gain.setValueAtTime(
          0.05,
          ctx.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime +
            duration
        );

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start();

        oscillator.stop(
          ctx.currentTime +
            duration
        );
      } catch {
        // optional sound
      }
    },
    [soundOn]
  );

  /* =====================================================
     RESET LEVEL
     ===================================================== */

  const resetLevel = useCallback(
    (targetLevel) => {
      const safeLevel = clamp(
        Number(targetLevel) || 1,
        1,
        LEVELS.length
      );

      const nextWorld =
        createLevel(safeLevel);

      worldRef.current =
        nextWorld;

      levelRef.current =
        safeLevel;

      setWorld(nextWorld);

      setLevel(safeLevel);

      setPlayer(
        createInitialPlayer()
      );

      setEcho({
        x: 30,
        y: 570,
        facing: 1,
        visible: false,
      });

      setFragmentsCollected(0);

      setLives(START_LIVES);

      setGameState("playing");

      gameStateRef.current =
        "playing";

      setCameraX(0);

      setMessage(
        "Follow your echo..."
      );

      echoHistoryRef.current = [];

      echoIndexRef.current = 0;

      collectedIdsRef.current.clear();

      keysRef.current = {};

      lastTimeRef.current =
        performance.now();
    },
    []
  );

  /* =====================================================
     JUMP
     ===================================================== */

  const jump = useCallback(() => {
    if (
      gameStateRef.current !==
      "playing"
    ) {
      return;
    }

    setPlayer((current) => {
      if (!current.grounded) {
        return current;
      }

      playSound(620, 0.1);

      return {
        ...current,
        vy: -JUMP_POWER,
        grounded: false,
      };
    });
  }, [playSound]);

  /* =====================================================
     KEYBOARD CONTROLS
     ===================================================== */

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key =
        event.key.toLowerCase();

      /* SPACE */
      if (
        key === " " ||
        key === "spacebar"
      ) {
        event.preventDefault();

        keysRef.current[" "] =
          true;

        jump();
        return;
      }

      /* MOVEMENT */
      keysRef.current[key] = true;

      if (
        [
          "arrowleft",
          "arrowright",
          "arrowup",
          "a",
          "d",
          "w",
        ].includes(key)
      ) {
        event.preventDefault();
      }

      /* PAUSE */
      if (key === "p") {
        setGameState((current) => {
          if (current === "playing") {
            return "paused";
          }

          if (current === "paused") {
            return "playing";
          }

          return current;
        });
      }

      /* RESTART */
      if (key === "r") {
        if (
          gameStateRef.current !==
          "playing"
        ) {
          resetLevel(
            levelRef.current
          );
        }
      }
    };

    const handleKeyUp = (event) => {
      const key =
        event.key.toLowerCase();

      keysRef.current[key] =
        false;
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
  }, [jump, resetLevel]);

  /* =====================================================
     TOUCH CONTROLS
     ===================================================== */

  const pressControl = useCallback(
    (key) => {
      keysRef.current[key] =
        true;
    },
    []
  );

  const releaseControl = useCallback(
    (key) => {
      keysRef.current[key] =
        false;
    },
    []
  );

  /* =====================================================
     PLAYER PHYSICS
     ===================================================== */

  useEffect(() => {
    if (gameState !== "playing") {
      return undefined;
    }

    let mounted = true;

    const update = (time) => {
      if (!mounted) {
        return;
      }

      const delta = Math.min(
        32,
        time -
          lastTimeRef.current
      );

      lastTimeRef.current =
        time;

      const dt =
        delta / 16.67;

      const currentWorld =
        worldRef.current;

      const keys =
        keysRef.current;

      setPlayer((current) => {
        const next = {
          ...current,
        };

        /* MOVEMENT */

        const left =
          keys.arrowleft ||
          keys.a;

        const right =
          keys.arrowright ||
          keys.d;

        if (left) {
          next.vx =
            -MOVE_SPEED;

          next.facing = -1;
        } else if (right) {
          next.vx =
            MOVE_SPEED;

          next.facing = 1;
        } else {
          next.vx *= 0.75;

          if (
            Math.abs(next.vx) <
            0.05
          ) {
            next.vx = 0;
          }
        }

        /* GRAVITY */

        next.vy +=
          GRAVITY * dt;

        /* POSITION */

        next.x +=
          next.vx * dt;

        next.y +=
          next.vy * dt;

        /* WORLD BOUNDARY */

        next.x = clamp(
          next.x,
          0,
          WORLD_WIDTH -
            PLAYER_WIDTH
        );

        next.grounded = false;

        /* PLATFORM COLLISION */

        for (
          const platform of
          currentWorld.platforms
        ) {
          const previousBottom =
            current.y +
            PLAYER_HEIGHT;

          const currentBottom =
            next.y +
            PLAYER_HEIGHT;

          const horizontal =
            next.x <
              platform.x +
                platform.width &&
            next.x +
              PLAYER_WIDTH >
              platform.x;

          const landing =
            horizontal &&
            previousBottom <=
              platform.y &&
            currentBottom >=
              platform.y &&
            next.vy >= 0;

          if (landing) {
            next.y =
              platform.y -
              PLAYER_HEIGHT;

            next.vy = 0;

            next.grounded = true;
          }
        }

        /* FALL */

        if (
          next.y >
          WORLD_HEIGHT + 100
        ) {
          setTimeout(() => {
            if (
              gameStateRef.current ===
              "playing"
            ) {
              setLives((currentLives) => {
                const nextLives =
                  currentLives - 1;

                playSound(
                  180,
                  0.2
                );

                if (
                  nextLives <= 0
                ) {
                  setGameState(
                    "gameover"
                  );

                  gameStateRef.current =
                    "gameover";

                  setMessage(
                    "Your echo has faded..."
                  );
                } else {
                  setMessage(
                    "You lost a chance!"
                  );
                }

                return nextLives;
              });
            }
          }, 0);

          return createInitialPlayer();
        }

        return next;
      });

      animationRef.current =
        requestAnimationFrame(
          update
        );
    };

    animationRef.current =
      requestAnimationFrame(
        update
      );

    return () => {
      mounted = false;

      if (
        animationRef.current
      ) {
        cancelAnimationFrame(
          animationRef.current
        );
      }
    };
  }, [gameState, playSound]);

  /* =====================================================
     RECORD PLAYER MOVEMENT
     ===================================================== */

  useEffect(() => {
    if (gameState !== "playing") {
      return undefined;
    }

    const interval =
      setInterval(() => {
        echoHistoryRef.current.push({
          x: player.x,
          y: player.y,
          facing: player.facing,
        });

        if (
          echoHistoryRef.current
            .length > 900
        ) {
          echoHistoryRef.current.shift();
        }
      }, 70);

    return () =>
      clearInterval(interval);
  }, [player.x, player.y, player.facing, gameState]);

  /* =====================================================
     ECHO REPLAY
     ===================================================== */

  useEffect(() => {
    if (gameState !== "playing") {
      return undefined;
    }

    const timer =
      setInterval(() => {
        const history =
          echoHistoryRef.current;

        if (
          history.length < 20
        ) {
          return;
        }

        let index =
          echoIndexRef.current;

        if (
          index >= history.length
        ) {
          index = 0;
        }

        const point =
          history[index];

        if (point) {
          setEcho({
            x: point.x,
            y: point.y,
            facing: point.facing,
            visible: true,
          });
        }

        echoIndexRef.current =
          index + 1;
      }, 70);

    return () =>
      clearInterval(timer);
  }, [gameState]);

  /* =====================================================
     CAMERA
     ===================================================== */

  useEffect(() => {
    const target =
      player.x - 450;

    setCameraX(
      clamp(
        target,
        0,
        WORLD_WIDTH - 900
      )
    );
  }, [player.x]);

  /* =====================================================
     COLLECT ITEMS
     ===================================================== */

  useEffect(() => {
    if (gameState !== "playing") {
      return;
    }

    const playerRect =
      getPlayerRect(player);

    let fragmentAdded = 0;
    let coinAdded = 0;
    let scoreAdded = 0;

    let changed = false;

    const currentWorld =
      worldRef.current;

    const nextFragments =
      currentWorld.fragments.map(
        (fragment) => {
          if (
            fragment.collected
          ) {
            return fragment;
          }

          const fragmentRect = {
            x: fragment.x,
            y: fragment.y,
            width: 32,
            height: 32,
          };

          if (
            rectanglesOverlap(
              playerRect,
              fragmentRect
            )
          ) {
            if (
              !collectedIdsRef.current.has(
                fragment.id
              )
            ) {
              collectedIdsRef.current.add(
                fragment.id
              );

              fragmentAdded += 1;

              scoreAdded += 100;

              changed = true;

              playSound(
                880,
                0.12
              );
            }

            return {
              ...fragment,
              collected: true,
            };
          }

          return fragment;
        }
      );

    const nextCoins =
      currentWorld.coins.map(
        (coin) => {
          if (coin.collected) {
            return coin;
          }

          const coinRect = {
            x: coin.x,
            y: coin.y,
            width: 28,
            height: 28,
          };

          if (
            rectanglesOverlap(
              playerRect,
              coinRect
            )
          ) {
            coinAdded += 1;

            scoreAdded += 25;

            changed = true;

            playSound(
              1040,
              0.08
            );

            return {
              ...coin,
              collected: true,
            };
          }

          return coin;
        }
      );

    const nextStars =
      currentWorld.stars.map(
        (star) => {
          if (star.collected) {
            return star;
          }

          const starRect = {
            x: star.x,
            y: star.y,
            width: 28,
            height: 28,
          };

          if (
            rectanglesOverlap(
              playerRect,
              starRect
            )
          ) {
            scoreAdded += 50;

            changed = true;

            playSound(
              760,
              0.08
            );

            return {
              ...star,
              collected: true,
            };
          }

          return star;
        }
      );

    if (!changed) {
      return;
    }

    const nextWorld = {
      ...currentWorld,
      fragments: nextFragments,
      coins: nextCoins,
      stars: nextStars,
    };

    worldRef.current =
      nextWorld;

    setWorld(nextWorld);

    if (fragmentAdded > 0) {
      setFragmentsCollected(
        (current) => {
          const next =
            Math.min(
              current +
                fragmentAdded,
              config.requiredFragments
            );

          if (
            next ===
            config.requiredFragments
          ) {
            setMessage(
              "All memories restored! Find the portal."
            );
          } else {
            setMessage(
              "Memory fragment restored!"
            );
          }

          return next;
        }
      );
    }

    if (coinAdded > 0) {
      setCoins(
        (current) =>
          current + coinAdded
      );
    }

    if (scoreAdded > 0) {
      setScore(
        (current) =>
          current + scoreAdded
      );
    }
  }, [
    player,
    gameState,
    config.requiredFragments,
    playSound,
  ]);

  /* =====================================================
     EXIT CHECK
     ===================================================== */

  useEffect(() => {
    if (gameState !== "playing") {
      return;
    }

    if (
      fragmentsCollected <
      config.requiredFragments
    ) {
      return;
    }

    const playerRect =
      getPlayerRect(player);

    const exitRect =
      worldRef.current.exit;

    if (
      rectanglesOverlap(
        playerRect,
        exitRect
      )
    ) {
      setGameState("complete");

      gameStateRef.current =
        "complete";

      setMessage(
        "You found the way home!"
      );

      playSound(980, 0.3);

      const reward =
        Number(config.reward) || 0;

      setCoins(
        (current) =>
          current + reward
      );

      setScore(
        (current) =>
          current + 500
      );
    }
  }, [
    player,
    fragmentsCollected,
    config.requiredFragments,
    config.reward,
    gameState,
    playSound,
  ]);

  /* =====================================================
     NEXT LEVEL
     ===================================================== */

  const nextLevel =
    useCallback(() => {
      const next =
        levelRef.current + 1;

      if (
        next >
        LEVELS.length
      ) {
        resetLevel(1);
        return;
      }

      resetLevel(next);

      try {
        localStorage.setItem(
          STORAGE_LEVEL,
          String(next)
        );
      } catch {
        // ignore
      }
    }, [resetLevel]);

  /* =====================================================
     RESTART
     ===================================================== */

  const restart =
    useCallback(() => {
      resetLevel(
        levelRef.current
      );
    }, [resetLevel]);

  /* =====================================================
     BACK
     ===================================================== */

  const goBack =
    useCallback(() => {
      navigate("/");
    }, [navigate]);

  /* =====================================================
     PROGRESS
     ===================================================== */

  const progress =
    config.requiredFragments > 0
      ? Math.min(
          100,
          Math.round(
            (fragmentsCollected /
              config.requiredFragments) *
              100
          )
        )
      : 0;

  /* =====================================================
     RENDER
     ===================================================== */

  return (
   <div className={`echo-weaver-page level-theme-${level}`}>

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="echo-header">

        <div className="echo-header-left">

          <button
            type="button"
            className="echo-icon-button"
            onClick={goBack}
            aria-label="Back"
          >
            ←
          </button>

          <div className="echo-logo">

            <div className="echo-logo-symbol">
              ◈
            </div>

            <div>

              <div className="echo-logo-title">
                ECHO WEAVER
              </div>

              <div className="echo-logo-subtitle">
                DREAMS REMEMBER YOU
              </div>

            </div>

          </div>

        </div>

        <div className="echo-header-center">

          <div className="echo-level">

            <small>
              LEVEL
            </small>

            <strong>
              {level}
            </strong>

          </div>

          <div className="echo-level-name">
            {config.name}
          </div>

        </div>

        <div className="echo-header-right">

          <div className="echo-stat">

            <span>
              ✦
            </span>

            <div>

              <small>
                SCORE
              </small>

              <strong>
                {score.toLocaleString()}
              </strong>

            </div>

          </div>

          <div className="echo-stat">

            <span>
              ◉
            </span>

            <div>

              <small>
                COINS
              </small>

              <strong>
                {coins}
              </strong>

            </div>

          </div>

          <div className="echo-lives">

            {Array.from({
              length: START_LIVES,
            }).map(
              (_, index) => (
                <span
                  key={index}
                  className={
                    index < lives
                      ? "active"
                      : "lost"
                  }
                >
                  ♥
                </span>
              )
            )}

          </div>

          <button
            type="button"
            className="echo-icon-button"
            onClick={() =>
              setSoundOn(
                (value) => !value
              )
            }
          >
            {soundOn
              ? "🔊"
              : "🔇"}
          </button>

          <button
            type="button"
            className="echo-icon-button"
            onClick={() =>
              setGameState(
                (current) => {
                  if (
                    current ===
                    "playing"
                  ) {
                    return "paused";
                  }

                  if (
                    current ===
                    "paused"
                  ) {
                    return "playing";
                  }

                  return current;
                }
              )
            }
          >
            {gameState ===
            "paused"
              ? "▶"
              : "Ⅱ"}
          </button>

        </div>

      </header>

      {/* =================================================
          INTRO
      ================================================= */}

      <section className="echo-intro">

        <div>

          <span className="echo-eyebrow">
            SURREAL MEMORY WORLD
          </span>

          <h1>
            Echo Escape
          </h1>

          <p>
            Your past becomes your guide.
            Move through the dream,
            collect lost memories,
            and follow your Echo.
          </p>

        </div>

        <div className="echo-difficulty">

          <span
            className={`difficulty-dot ${config.difficulty.toLowerCase()}`}
          />

          {config.difficulty}

        </div>

      </section>

      {/* =================================================
          GAME AREA
      ================================================= */}

      <main className="echo-game-area">

        <div className="echo-board-wrapper">

          {/* WORLD */}

          <div className="echo-board">

            <div
              className="echo-world"
              style={{
                width:
                  WORLD_WIDTH,
                transform:
                  `translateX(-${cameraX}px)`,
              }}
            >

              {/* SKY */}

              <div className="dream-sky" />

              <div className="dream-moon">
                ◐
              </div>

              <div className="dream-cloud cloud-one" />
              <div className="dream-cloud cloud-two" />
              <div className="dream-cloud cloud-three" />

              {/* PARTICLES */}

              {Array.from({
                length: 28,
              }).map(
                (_, index) => (
                  <span
                    key={index}
                    className="dream-particle"
                    style={{
                      left:
                        `${index * 6.7}%`,
                      top:
                        `${20 + (index * 17) % 55}%`,
                      animationDelay:
                        `${(index % 7) * 0.4}s`,
                    }}
                  />
                )
              )}

              {/* PLATFORMS */}

              <div className="echo-platforms">

                {world.platforms.map(
                  (platform) => (
                    <div
                      key={
                        platform.id
                      }
                      className={
                        platform.type ===
                        "ground"
                          ? "echo-platform ground"
                          : "echo-platform"
                      }
                      style={{
                        left:
                          platform.x,
                        top:
                          platform.y,
                        width:
                          platform.width,
                        height:
                          platform.height,
                      }}
                    >
                      <div className="platform-glow" />
                    </div>
                  )
                )}

              </div>

              {/* EXIT */}

              <div
                className={[
                  "echo-exit",
                  fragmentsCollected >=
                  config.requiredFragments
                    ? "unlocked"
                    : "locked",
                ].join(" ")}
                style={{
                  left:
                    world.exit.x,
                  top:
                    world.exit.y,
                }}
              >

                <div className="exit-ring">
                  ✦
                </div>

                <span>
                  {fragmentsCollected >=
                  config.requiredFragments
                    ? "ENTER"
                    : "LOCKED"}
                </span>

              </div>

              {/* MEMORY FRAGMENTS */}

              {world.fragments.map(
                (fragment) =>
                  !fragment.collected && (
                    <div
                      key={
                        fragment.id
                      }
                      className="memory-fragment"
                      style={{
                        left:
                          fragment.x,
                        top:
                          fragment.y,
                      }}
                    >
                      <span>
                        ◆
                      </span>
                    </div>
                  )
              )}

              {/* COINS */}

              {world.coins.map(
                (coin) =>
                  !coin.collected && (
                    <div
                      key={coin.id}
                      className="echo-coin"
                      style={{
                        left:
                          coin.x,
                        top:
                          coin.y,
                      }}
                    >
                      ◉
                    </div>
                  )
              )}

              {/* STARS */}

              {world.stars.map(
                (star) =>
                  !star.collected && (
                    <div
                      key={star.id}
                      className="echo-star"
                      style={{
                        left:
                          star.x,
                        top:
                          star.y,
                      }}
                    >
                      ✦
                    </div>
                  )
              )}

              {/* ECHO */}

              {echo.visible && (
                <div
                  className="echo-character"
                  style={{
                    left:
                      echo.x,
                    top:
                      echo.y,
                    transform:
                      `scaleX(${echo.facing})`,
                  }}
                >

                  <div className="echo-aura" />

                  <div className="echo-body">
                    ◇
                  </div>

                </div>
              )}

              {/* PLAYER */}

              <div
                className="echo-player"
                style={{
                  left:
                    player.x,
                  top:
                    player.y,
                  transform:
                    `scaleX(${player.facing})`,
                }}
              >

                <div className="player-glow" />

                <div className="player-head">
                  ●
                </div>

                <div className="player-body">
                  ◇
                </div>

                <div className="player-shadow" />

              </div>

            </div>

          </div>

          {/* =================================================
              PROGRESS
          ================================================= */}

          <div className="echo-progress-panel">

            <div className="echo-progress-top">

              <span>
                MEMORY RESTORED
              </span>

              <strong>
                {fragmentsCollected}/{config.requiredFragments}
              </strong>

            </div>

            <div className="echo-progress-track">

              <div
                className="echo-progress-fill"
                style={{
                  width:
                    `${progress}%`,
                }}
              />

            </div>

          </div>

          {/* MESSAGE */}

          <div className="echo-message">
            {message}
          </div>

        </div>

        {/* =================================================
            SIDE PANEL
        ================================================= */}

        <aside className="echo-side-panel">

          <div className="echo-card">

            <div className="echo-card-title">
              ✦ YOUR ECHO
            </div>

            <p>
              Your Echo repeats the
              path you walked before.
              Use it to understand
              the dream world.
            </p>

            <div className="echo-mini-demo">

              <span className="mini-player">
                ●
              </span>

              <span className="mini-line" />

              <span className="mini-echo">
                ◇
              </span>

            </div>

          </div>

          <div className="echo-card">

            <div className="echo-card-title">
              🎮 HOW TO PLAY
            </div>

            <ol>

              <li>
                Move with
                <b> A / D </b>
                or arrow keys.
              </li>

              <li>
                Jump with
                <b> SPACE</b>.
              </li>

              <li>
                Collect every
                memory fragment.
              </li>

              <li>
                Follow your Echo.
              </li>

              <li>
                Reach the dream portal.
              </li>

            </ol>

          </div>

          <div className="echo-card echo-controls-card">

            <div className="echo-card-title">
              TOUCH CONTROLS
            </div>

            <div className="touch-controls">

              <button
                type="button"
                onPointerDown={() =>
                  pressControl(
                    "arrowleft"
                  )
                }
                onPointerUp={() =>
                  releaseControl(
                    "arrowleft"
                  )
                }
                onPointerLeave={() =>
                  releaseControl(
                    "arrowleft"
                  )
                }
              >
                ←
              </button>

              <button
                type="button"
                onPointerDown={
                  jump
                }
              >
                ↑
              </button>

              <button
                type="button"
                onPointerDown={() =>
                  pressControl(
                    "arrowright"
                  )
                }
                onPointerUp={() =>
                  releaseControl(
                    "arrowright"
                  )
                }
                onPointerLeave={() =>
                  releaseControl(
                    "arrowright"
                  )
                }
              >
                →
              </button>

            </div>

          </div>

          <button
            type="button"
            className="echo-restart-button"
            onClick={restart}
          >
            ↻ RESTART LEVEL
          </button>

        </aside>

      </main>

      {/* =================================================
          PAUSE
      ================================================= */}

      {gameState === "paused" && (
        <div className="echo-overlay">

          <div className="echo-overlay-card">

            <div className="overlay-icon">
              Ⅱ
            </div>

            <h2>
              GAME PAUSED
            </h2>

            <p>
              The dream is waiting...
            </p>

            <button
              type="button"
              onClick={() =>
                setGameState(
                  "playing"
                )
              }
            >
              ▶ CONTINUE
            </button>

            <button
              type="button"
              className="secondary"
              onClick={restart}
            >
              ↻ RESTART
            </button>

          </div>

        </div>
      )}

      {/* =================================================
          GAME OVER
      ================================================= */}

      {gameState === "gameover" && (
        <div className="echo-overlay">

          <div className="echo-overlay-card gameover">

            <div className="overlay-icon">
              ☁
            </div>

            <h2>
              ECHO LOST
            </h2>

            <p>
              Your memory faded before
              you could escape.
            </p>

            <div className="overlay-stats">

              <div>
                <small>
                  SCORE
                </small>

                <strong>
                  {score.toLocaleString()}
                </strong>
              </div>

              <div>
                <small>
                  LEVEL
                </small>

                <strong>
                  {level}
                </strong>
              </div>

              <div>
                <small>
                  COINS
                </small>

                <strong>
                  {coins}
                </strong>
              </div>

            </div>

            <button
              type="button"
              onClick={restart}
            >
              ↻ TRY AGAIN
            </button>

            <button
              type="button"
              className="secondary"
              onClick={goBack}
            >
              ← GAME STATION
            </button>

          </div>

        </div>
      )}

      {/* =================================================
          LEVEL COMPLETE
      ================================================= */}

      {gameState === "complete" && (
        <div className="echo-overlay">

          <div className="echo-overlay-card complete">

            <div className="celebration-stars">
              ✦ ★ ✦
            </div>

            <div className="overlay-icon">
              🎉
            </div>

            <h2>
              DREAM RESTORED
            </h2>

            <p>
              Your Echo remembered
              the way home.
            </p>

            <div className="complete-level">
              LEVEL {level}
            </div>

            <div className="overlay-stats">

              <div>

                <small>
                  SCORE
                </small>

                <strong>
                  {score.toLocaleString()}
                </strong>

              </div>

              <div>

                <small>
                  FRAGMENTS
                </small>

                <strong>
                  {fragmentsCollected}/
                  {config.requiredFragments}
                </strong>

              </div>

              <div>

                <small>
                  COINS
                </small>

                <strong>
                  +{config.reward}
                </strong>

              </div>

            </div>

            <button
              type="button"
              onClick={nextLevel}
            >
              {level >=
              LEVELS.length
                ? "↻ PLAY AGAIN"
                : "NEXT DREAM →"}
            </button>

            <button
              type="button"
              className="secondary"
              onClick={restart}
            >
              ↻ REPLAY LEVEL
            </button>

            <button
              type="button"
              className="text-button"
              onClick={goBack}
            >
              ← GAME STATION
            </button>

          </div>

        </div>
      )}
    </div>
  );
}