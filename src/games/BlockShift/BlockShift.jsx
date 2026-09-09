import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./BlockShift.css";

/*
  BLOCKSHIFT
  Dimension Roll Puzzle Game

  Controls:
  - Arrow Keys / WASD
  - On-screen buttons
  - R = Restart
  - P / Escape = Pause
*/

const MODES = {
  EASY: {
    name: "Easy",
    multiplier: 1,
    description: "Learn the mechanics",
  },
  MEDIUM: {
    name: "Medium",
    multiplier: 1.35,
    description: "Think two steps ahead",
  },
  HARD: {
    name: "Hard",
    multiplier: 1.8,
    description: "Master the dimension",
  },
};

const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

const STORAGE_KEY = "blockshift-game-save-v2";

const key = (x, y) => `${x},${y}`;

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

/* -------------------------------------------------------
   LEVEL GENERATOR
------------------------------------------------------- */

function createRandom(seed) {
  let value = seed >>> 0;

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function createLevel(levelNumber, mode) {
  const random = createRandom(
    levelNumber * 9187 +
      (mode === "MEDIUM" ? 5000 : mode === "HARD" ? 9000 : 0)
  );

  const width = clamp(
    7 + Math.floor((levelNumber - 1) / 5),
    7,
    11
  );

  const height = clamp(
    7 + Math.floor((levelNumber - 1) / 6),
    7,
    11
  );

  const start = {
    x: 1,
    y: 1,
  };

  const target = {
    x: width - 2,
    y: height - 2,
  };

  const floor = new Set();

  /*
    Build a guaranteed path from start to target.
  */
  let x = start.x;
  let y = start.y;

  floor.add(key(x, y));

  while (x !== target.x || y !== target.y) {
    const canMoveX = x < target.x;
    const canMoveY = y < target.y;

    if (canMoveX && canMoveY) {
      if (random() < 0.5) {
        x++;
      } else {
        y++;
      }
    } else if (canMoveX) {
      x++;
    } else {
      y++;
    }

    floor.add(key(x, y));
  }

  /*
    Expand the path to make the board more interesting.
  */
  const baseCells = [...floor];

  baseCells.forEach((cell) => {
    const [cx, cy] = cell.split(",").map(Number);

    const neighbours = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ];

    neighbours.forEach(([nx, ny]) => {
      if (
        nx > 0 &&
        ny > 0 &&
        nx < width - 1 &&
        ny < height - 1 &&
        random() < 0.45
      ) {
        floor.add(key(nx, ny));
      }
    });
  });

  /*
    Make some additional random connections.
  */
  for (let i = 0; i < levelNumber * 2; i++) {
    const nx = 1 + Math.floor(random() * (width - 2));
    const ny = 1 + Math.floor(random() * (height - 2));

    const around = [
      key(nx + 1, ny),
      key(nx - 1, ny),
      key(nx, ny + 1),
      key(nx, ny - 1),
    ];

    if (around.some((item) => floor.has(item))) {
      floor.add(key(nx, ny));
    }
  }

  const special = {};
  const reserved = new Set([
    key(start.x, start.y),
    key(target.x, target.y),
  ]);

  const availableCells = () =>
    [...floor].filter((cell) => !reserved.has(cell));

  const pickCell = () => {
    const cells = availableCells();

    if (!cells.length) return null;

    const selected =
      cells[Math.floor(random() * cells.length)];

    reserved.add(selected);

    return selected;
  };

  /*
    Coins
  */
  const coins = new Set();

  const coinCount =
    mode === "HARD"
      ? 5 + (levelNumber % 4)
      : 3 + (levelNumber % 4);

  for (let i = 0; i < coinCount; i++) {
    const cell = pickCell();

    if (cell) {
      coins.add(cell);
    }
  }

  /*
    Switches
  */
  if (levelNumber >= 3) {
    const switchCount = mode === "HARD" ? 2 : 1;

    for (let i = 0; i < switchCount; i++) {
      const cell = pickCell();

      if (cell) {
        special[cell] = "switch";
      }
    }
  }

  /*
    Portals
  */
  if (levelNumber >= 4) {
    const portalA = pickCell();
    const portalB = pickCell();

    if (portalA && portalB) {
      special[portalA] = "portalA";
      special[portalB] = "portalB";
    }
  }

  /*
    Energy
  */
  if (levelNumber >= 5) {
    const energy = pickCell();

    if (energy) {
      special[energy] = "energy";
    }
  }

  /*
    Danger
  */
  if (levelNumber >= 6) {
    const dangerCount = mode === "HARD" ? 3 : 1;

    for (let i = 0; i < dangerCount; i++) {
      const danger = pickCell();

      if (danger) {
        special[danger] = "danger";
      }
    }
  }

  /*
    Boost
  */
  if (levelNumber >= 7) {
    const boost = pickCell();

    if (boost) {
      special[boost] = "boost";
    }
  }

  /*
    Dimension shift
  */
  if (levelNumber >= 9) {
    const shift = pickCell();

    if (shift) {
      special[shift] = "shift";
    }
  }

  /*
    Ice
  */
  if (levelNumber >= 11) {
    const iceCount = mode === "HARD" ? 3 : 1;

    for (let i = 0; i < iceCount; i++) {
      const ice = pickCell();

      if (ice) {
        special[ice] = "ice";
      }
    }
  }

  /*
    Gate
  */
  if (levelNumber >= 14) {
    const gate = pickCell();

    if (gate) {
      special[gate] = "gate";
    }
  }

  /*
    Final level values
  */
  const moveTarget =
    14 +
    levelNumber * 2 +
    (mode === "MEDIUM" ? 4 : 0) +
    (mode === "HARD" ? 7 : 0);

  const timeTarget =
    25 +
    levelNumber * 3 +
    (mode === "HARD" ? 8 : 0);

  let chapter = "AWAKENING";

  if (levelNumber >= 11) {
    chapter = "SHIFT";
  }

  if (levelNumber >= 21) {
    chapter = "FRACTURE";
  }

  return {
    id: levelNumber,
    width,
    height,
    floor,
    special,
    coins,
    start,
    target,
    moveTarget,
    timeTarget,
    chapter,
  };
}

/* -------------------------------------------------------
   BLOCK PHYSICS
------------------------------------------------------- */

function getBlockCells(block) {
  if (block.orientation === "S") {
    return [[block.x, block.y]];
  }

  if (block.orientation === "H") {
    return [
      [block.x, block.y],
      [block.x + 1, block.y],
    ];
  }

  return [
    [block.x, block.y],
    [block.x, block.y + 1],
  ];
}

function getNextBlock(block, direction) {
  const delta = DIRECTIONS[direction];

  if (!delta) {
    return block;
  }

  /*
    Standing block
  */
  if (block.orientation === "S") {
    if (
      direction === "LEFT" ||
      direction === "RIGHT"
    ) {
      return {
        x:
          direction === "LEFT"
            ? block.x - 2
            : block.x + 1,
        y: block.y,
        orientation: "H",
      };
    }

    return {
      x: block.x,
      y:
        direction === "UP"
          ? block.y - 2
          : block.y + 1,
      orientation: "V",
    };
  }

  /*
    Horizontal block
  */
  if (block.orientation === "H") {
    if (direction === "LEFT") {
      return {
        x: block.x - 1,
        y: block.y,
        orientation: "S",
      };
    }

    if (direction === "RIGHT") {
      return {
        x: block.x + 2,
        y: block.y,
        orientation: "S",
      };
    }

    return {
      x: block.x,
      y:
        direction === "UP"
          ? block.y - 1
          : block.y + 1,
      orientation: "H",
    };
  }

  /*
    Vertical block
  */
  if (direction === "UP") {
    return {
      x: block.x,
      y: block.y - 1,
      orientation: "S",
    };
  }

  if (direction === "DOWN") {
    return {
      x: block.x,
      y: block.y + 2,
      orientation: "S",
    };
  }

  return {
    x:
      direction === "LEFT"
        ? block.x - 1
        : block.x + 1,
    y: block.y,
    orientation: "V",
  };
}

function canMove(level, block, direction) {
  const next = getNextBlock(block, direction);
  const cells = getBlockCells(next);

  return cells.every(([x, y]) =>
    level.floor.has(key(x, y))
  );
}

/* -------------------------------------------------------
   SAVE SYSTEM
------------------------------------------------------- */

function loadSave() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return {
        coins: 0,
        totalScore: 0,
        unlocked: {
          EASY: 1,
          MEDIUM: 1,
          HARD: 1,
        },
        stars: {},
        sound: true,
      };
    }

    return JSON.parse(saved);
  } catch {
    return {
      coins: 0,
      totalScore: 0,
      unlocked: {
        EASY: 1,
        MEDIUM: 1,
        HARD: 1,
      },
      stars: {},
      sound: true,
    };
  }
}

function saveGame(data) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );
  } catch {
    // localStorage unavailable
  }
}

/* -------------------------------------------------------
   AUDIO
------------------------------------------------------- */

function createAudioEngine() {
  let context = null;

  const getContext = () => {
    if (context) return context;

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContext) {
      return null;
    }

    context = new AudioContext();

    return context;
  };

  return (soundName) => {
    const audio = getContext();

    if (!audio) return;

    if (audio.state === "suspended") {
      audio.resume();
    }

    const oscillator =
      audio.createOscillator();

    const gain = audio.createGain();

    const frequencies = {
      click: 260,
      move: 160,
      coin: 880,
      switch: 420,
      portal: 300,
      energy: 540,
      boost: 680,
      shift: 120,
      danger: 90,
      complete: 520,
      error: 75,
    };

    oscillator.frequency.value =
      frequencies[soundName] || 250;

    oscillator.type =
      soundName === "coin"
        ? "square"
        : "triangle";

    gain.gain.setValueAtTime(
      0.035,
      audio.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audio.currentTime + 0.14
    );

    oscillator.connect(gain);
    gain.connect(audio.destination);

    oscillator.start();

    oscillator.stop(
      audio.currentTime + 0.15
    );
  };
}

/* -------------------------------------------------------
   COMPONENT
------------------------------------------------------- */

function BlockShift() {
  const initialSave = useMemo(
    () => loadSave(),
    []
  );

  const [screen, setScreen] =
    useState("menu");

  const [mode, setMode] =
    useState("EASY");

  const [levelNumber, setLevelNumber] =
    useState(1);

  const [levels, setLevels] =
    useState(() =>
      Array.from(
        { length: 30 },
        (_, index) =>
          createLevel(index + 1, "EASY")
      )
    );

  const [block, setBlock] =
    useState({
      x: 1,
      y: 1,
      orientation: "S",
    });

  const [moves, setMoves] =
    useState(0);

  const [time, setTime] =
    useState(0);

  const [score, setScore] =
    useState(0);

  const [coins, setCoins] =
    useState(initialSave.coins || 0);

  const [runCoins, setRunCoins] =
    useState(0);

  const [energy, setEnergy] =
    useState(3);

  const [combo, setCombo] =
    useState(0);

  const [dimension, setDimension] =
    useState("A");

  const [paused, setPaused] =
    useState(false);

  const [result, setResult] =
    useState(null);

  const [toast, setToast] =
    useState("");

  const [sound, setSound] =
    useState(
      initialSave.sound !== false
    );

  const [stars, setStars] =
    useState(initialSave.stars || {});

  const [unlocked, setUnlocked] =
    useState(
      initialSave.unlocked || {
        EASY: 1,
        MEDIUM: 1,
        HARD: 1,
      }
    );

  const [shake, setShake] =
    useState(false);

  const audioRef =
    useRef(null);

  const timerRef =
    useRef(null);

  const toastTimerRef =
    useRef(null);

  const level =
    levels[levelNumber - 1];

  /* ---------------------------------------------------
     INITIAL AUDIO
  --------------------------------------------------- */

  useEffect(() => {
    audioRef.current =
      createAudioEngine();

    return () => {
      clearInterval(timerRef.current);
      clearTimeout(toastTimerRef.current);
    };
  }, []);

  /* ---------------------------------------------------
     CREATE LEVELS WHEN MODE CHANGES
  --------------------------------------------------- */

  useEffect(() => {
    setLevels(
      Array.from(
        { length: 30 },
        (_, index) =>
          createLevel(
            index + 1,
            mode
          )
      )
    );
  }, [mode]);

  /* ---------------------------------------------------
     TIMER
  --------------------------------------------------- */

  useEffect(() => {
    if (
      screen !== "play" ||
      paused ||
      result
    ) {
      return undefined;
    }

    timerRef.current =
      setInterval(() => {
        setTime(
          (current) => current + 1
        );
      }, 1000);

    return () =>
      clearInterval(timerRef.current);
  }, [
    screen,
    paused,
    result,
  ]);

  /* ---------------------------------------------------
     HELPERS
  --------------------------------------------------- */

  const playSound = useCallback(
    (name) => {
      if (!sound) return;

      audioRef.current?.(name);
    },
    [sound]
  );

  const showToast = useCallback(
    (message) => {
      setToast(message);

      clearTimeout(
        toastTimerRef.current
      );

      toastTimerRef.current =
        setTimeout(() => {
          setToast("");
        }, 1000);
    },
    []
  );

  const formatTime = (seconds) => {
    const minutes =
      Math.floor(seconds / 60);

    const remaining =
      seconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(remaining).padStart(
      2,
      "0"
    )}`;
  };

  const currentStars =
    stars[`${mode}-${levelNumber}`] || 0;

  /* ---------------------------------------------------
     SAVE
  --------------------------------------------------- */

  const persist = useCallback(
    (extra = {}) => {
      saveGame({
        coins,
        totalScore: initialSave.totalScore || 0,
        unlocked,
        stars,
        sound,
        ...extra,
      });
    },
    [
      coins,
      unlocked,
      stars,
      sound,
      initialSave.totalScore,
    ]
  );

  /* ---------------------------------------------------
     START LEVEL
  --------------------------------------------------- */

  const startLevel = useCallback(
    (number) => {
      const selected =
        levels[number - 1];

      if (!selected) return;

      setLevelNumber(number);

      setBlock({
        x: selected.start.x,
        y: selected.start.y,
        orientation: "S",
      });

      setMoves(0);
      setTime(0);
      setScore(0);
      setRunCoins(0);
      setEnergy(3);
      setCombo(0);
      setDimension("A");
      setPaused(false);
      setResult(null);
      setShake(false);
      setToast("");
      setScreen("play");

      playSound("click");
    },
    [levels, playSound]
  );

  /* ---------------------------------------------------
     RESTART
  --------------------------------------------------- */

  const restartLevel = useCallback(() => {
    startLevel(levelNumber);
  }, [
    startLevel,
    levelNumber,
  ]);

  /* ---------------------------------------------------
     COMPLETE LEVEL
  --------------------------------------------------- */

  const completeLevel = useCallback(() => {
    const moveTarget =
      level.moveTarget;

    const timeTarget =
      level.timeTarget;

    let earnedStars = 1;

    if (
      moves <= moveTarget
    ) {
      earnedStars = 2;
    }

    if (
      moves <=
        Math.max(
          8,
          moveTarget - 6
        ) &&
      time <= timeTarget
    ) {
      earnedStars = 3;
    }

    const baseScore =
      1000 +
      Math.max(
        0,
        moveTarget - moves
      ) *
        35 +
      Math.max(
        0,
        timeTarget - time
      ) *
        12 +
      runCoins * 100 +
      combo * 25;

    const finalScore = Math.round(
      baseScore *
        MODES[mode].multiplier
    );

    const saveKey =
      `${mode}-${levelNumber}`;

    const newStars = {
      ...stars,
      [saveKey]: Math.max(
        stars[saveKey] || 0,
        earnedStars
      ),
    };

    const nextUnlocked =
      Math.max(
        unlocked[mode] || 1,
        Math.min(
          31,
          levelNumber + 1
        )
      );

    const newUnlocked = {
      ...unlocked,
      [mode]: nextUnlocked,
    };

    setStars(newStars);
    setUnlocked(newUnlocked);

    setScore(finalScore);

    setResult({
      stars: earnedStars,
      score: finalScore,
      moves,
      time,
      coins: runCoins,
    });

    saveGame({
      coins,
      totalScore:
        (initialSave.totalScore || 0) +
        finalScore,
      unlocked: newUnlocked,
      stars: newStars,
      sound,
    });

    playSound("complete");
  }, [
    level,
    moves,
    time,
    runCoins,
    combo,
    mode,
    levelNumber,
    stars,
    unlocked,
    coins,
    sound,
    initialSave.totalScore,
    playSound,
  ]);

  /* ---------------------------------------------------
     HANDLE SPECIAL TILE
  --------------------------------------------------- */

  const handleSpecialTile =
    useCallback(
      (cellKey) => {
        const type =
          level.special[cellKey];

        if (!type) return;

        if (type === "switch") {
          setScore(
            (current) =>
              current + 80
          );

          playSound("switch");

          showToast(
            "SWITCH ACTIVATED"
          );
        }

        if (type === "energy") {
          setEnergy(
            (current) =>
              Math.min(
                3,
                current + 1
              )
          );

          playSound("energy");

          showToast(
            "ENERGY RESTORED"
          );
        }

        if (type === "danger") {
          setEnergy(
            (current) =>
              Math.max(
                0,
                current - 1
              )
          );

          setCombo(0);

          setShake(true);

          setTimeout(
            () => setShake(false),
            250
          );

          playSound("danger");

          showToast(
            "DANGER TILE"
          );
        }

        if (type === "boost") {
          setScore(
            (current) =>
              current + 150
          );

          setCombo(
            (current) =>
              Math.min(
                10,
                current + 2
              )
          );

          playSound("boost");

          showToast(
            "BOOST +150"
          );
        }

        if (type === "shift") {
          setDimension(
            (current) =>
              current === "A"
                ? "B"
                : "A"
          );

          setScore(
            (current) =>
              current + 100
          );

          playSound("shift");

          showToast(
            "DIMENSION SHIFT"
          );
        }

        if (type === "ice") {
          setCombo(0);

          playSound("move");

          showToast(
            "ICE — CAREFUL!"
          );
        }

        if (type === "gate") {
          setScore(
            (current) =>
              current + 60
          );

          playSound("switch");

          showToast(
            "GATE PASSED"
          );
        }

        if (
          type === "portalA" ||
          type === "portalB"
        ) {
          const opposite =
            type === "portalA"
              ? "portalB"
              : "portalA";

          const portalEntry =
            Object.entries(
              level.special
            ).find(
              ([, value]) =>
                value === opposite
            );

          if (portalEntry) {
            const [
              destination,
            ] =
              portalEntry;

            const [
              px,
              py,
            ] =
              destination
                .split(",")
                .map(Number);

            setBlock(
              (current) => ({
                ...current,
                x: px,
                y: py,
              })
            );

            playSound("portal");

            showToast(
              "PORTAL SHIFT"
            );
          }
        }
      },
      [
        level,
        playSound,
        showToast,
      ]
    );

  /* ---------------------------------------------------
     MOVE
  --------------------------------------------------- */

  const move = useCallback(
    (direction) => {
      if (
        screen !== "play" ||
        paused ||
        result
      ) {
        return;
      }

      if (
        !canMove(
          level,
          block,
          direction
        )
      ) {
        playSound("error");

        setCombo(0);

        setShake(true);

        setTimeout(
          () => setShake(false),
          200
        );

        showToast(
          "CAN'T MOVE HERE"
        );

        return;
      }

      const nextBlock =
        getNextBlock(
          block,
          direction
        );

      const cells =
        getBlockCells(
          nextBlock
        ).map(
          ([x, y]) =>
            key(x, y)
        );

      setBlock(nextBlock);

      setMoves(
        (current) =>
          current + 1
      );

      setCombo(
        (current) =>
          Math.min(
            10,
            current + 1
          )
      );

      setScore(
        (current) =>
          current +
          10 +
          combo * 2
      );

      playSound("move");

      /* Coins */
      const collected =
        cells.filter(
          (cell) =>
            level.coins.has(cell)
        );

      if (collected.length > 0) {
        collected.forEach(
          () => {
            playSound("coin");
          }
        );

        const newCoins =
          new Set(
            level.coins
          );

        collected.forEach(
          (cell) =>
            newCoins.delete(cell)
        );

        /*
          Do not mutate level directly.
          Replace the level with an updated object.
        */
        setLevels(
          (currentLevels) =>
            currentLevels.map(
              (item, index) =>
                index ===
                levelNumber - 1
                  ? {
                      ...item,
                      coins: newCoins,
                    }
                  : item
            )
        );

        setRunCoins(
          (current) =>
            current +
            collected.length
        );

        setCoins(
          (current) => {
            const updated =
              current +
              collected.length;

            saveGame({
              coins: updated,
              totalScore:
                initialSave.totalScore ||
                0,
              unlocked,
              stars,
              sound,
            });

            return updated;
          }
        );

        setScore(
          (current) =>
            current +
            collected.length *
              100
        );

        showToast(
          `+${collected.length} COIN${
            collected.length > 1
              ? "S"
              : ""
          }`
        );
      }

      /*
        Special tiles
      */
      cells.forEach(
        (cell) =>
          handleSpecialTile(cell)
      );

      /*
        Goal
      */
      if (
        nextBlock.orientation ===
          "S" &&
        nextBlock.x ===
          level.target.x &&
        nextBlock.y ===
          level.target.y
      ) {
        setTimeout(
          () => {
            completeLevel();
          },
          180
        );
      }
    },
    [
      screen,
      paused,
      result,
      level,
      block,
      playSound,
      showToast,
      combo,
      levelNumber,
      handleSpecialTile,
      completeLevel,
      initialSave.totalScore,
      unlocked,
      stars,
      sound,
    ]
  );

  /* ---------------------------------------------------
     KEYBOARD
  --------------------------------------------------- */

  useEffect(() => {
    const handleKeyDown = (event) => {
      const keyName =
        event.key;

      const directionMap = {
        ArrowUp: "UP",
        ArrowDown: "DOWN",
        ArrowLeft: "LEFT",
        ArrowRight: "RIGHT",
        w: "UP",
        W: "UP",
        s: "DOWN",
        S: "DOWN",
        a: "LEFT",
        A: "LEFT",
        d: "RIGHT",
        D: "RIGHT",
      };

      if (
        directionMap[keyName] &&
        screen === "play"
      ) {
        event.preventDefault();

        move(
          directionMap[keyName]
        );

        return;
      }

      if (
        (keyName === "p" ||
          keyName === "P" ||
          keyName === "Escape") &&
        screen === "play"
      ) {
        setPaused(
          (current) =>
            !current
        );

        return;
      }

      if (
        (keyName === "r" ||
          keyName === "R") &&
        screen === "play"
      ) {
        restartLevel();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [
    screen,
    move,
    restartLevel,
  ]);

  /* ---------------------------------------------------
     MENU ACTIONS
  --------------------------------------------------- */

  const goToLevels = () => {
    setScreen("levels");
    playSound("click");
  };

  const goToMenu = () => {
    setScreen("menu");
    setPaused(false);
    setResult(null);
    playSound("click");
  };

  const selectMode = (selectedMode) => {
    setMode(selectedMode);

    setLevelNumber(1);

    setScreen("levels");

    playSound("click");
  };

  const toggleSound = () => {
    setSound(
      (current) => {
        const next =
          !current;

        saveGame({
          coins,
          totalScore:
            initialSave.totalScore ||
            0,
          unlocked,
          stars,
          sound: next,
        });

        return next;
      }
    );
  };

  const resetProgress = () => {
    const fresh = {
      coins: 0,
      totalScore: 0,
      unlocked: {
        EASY: 1,
        MEDIUM: 1,
        HARD: 1,
      },
      stars: {},
      sound: true,
    };

    saveGame(fresh);

    setCoins(0);
    setStars({});
    setUnlocked(
      fresh.unlocked
    );
    setSound(true);
    setLevelNumber(1);
    setScreen("menu");
  };

  /* ---------------------------------------------------
     LEVEL LIST
  --------------------------------------------------- */

  const levelNumbers =
    useMemo(
      () =>
        Array.from(
          { length: 30 },
          (_, index) =>
            index + 1
        ),
      []
    );

  const modeUnlocked =
    unlocked[mode] || 1;

  /* ---------------------------------------------------
     BLOCK VISUAL
  --------------------------------------------------- */

  const renderBlock = () => {
    return (
      <div
        className={`block3d ${block.orientation}`}
      >
        <div className="block-face front">
          ◆
        </div>

        <div className="block-face back">
          ◆
        </div>

        <div className="block-face left">
          ◆
        </div>

        <div className="block-face right">
          ◆
        </div>

        <div className="block-face top">
          ◆
        </div>

        <div className="block-face bottom">
          ◆
        </div>
      </div>
    );
  };

  /* ---------------------------------------------------
     TILE CONTENT
  --------------------------------------------------- */

  const renderSpecial = (
    type
  ) => {
    if (!type) return null;

    if (type === "switch") {
      return (
        <span className="tileIcon">
          ⌁
        </span>
      );
    }

    if (type === "portalA") {
      return (
        <span className="portalIcon">
          A
        </span>
      );
    }

    if (type === "portalB") {
      return (
        <span className="portalIcon">
          B
        </span>
      );
    }

    if (type === "danger") {
      return (
        <span className="tileIcon">
          ×
        </span>
      );
    }

    if (type === "energy") {
      return (
        <span className="tileIcon">
          +
        </span>
      );
    }

    if (type === "boost") {
      return (
        <span className="tileIcon">
          »
        </span>
      );
    }

    if (type === "shift") {
      return (
        <span className="tileIcon">
          ◈
        </span>
      );
    }

    if (type === "ice") {
      return (
        <span className="tileIcon">
          ❄
        </span>
      );
    }

    if (type === "gate") {
      return (
        <span className="tileIcon">
          ▣
        </span>
      );
    }

    return null;
  };

  /* ---------------------------------------------------
     RENDER
  --------------------------------------------------- */

  return (
    <div
      className={`blockshift ${
        shake ? "shake" : ""
      }`}
    >
      {/* ==============================================
          MAIN MENU
      ============================================== */}

      {screen === "menu" && (
        <main className="bs-menu">
          <div className="bs-menuBackground">
            <div className="gridGlow" />
            <div className="floatingCube cubeOne">
              ◆
            </div>
            <div className="floatingCube cubeTwo">
              ◆
            </div>
            <div className="floatingCube cubeThree">
              ◆
            </div>
          </div>

          <section className="bs-hero">
            <div className="bs-logoMark">
              ◆
            </div>

            <div>
              <span className="eyebrow">
                DIMENSION ROLL
              </span>

              <h1>
                BLOCK
                <span>SHIFT</span>
              </h1>

              <p>
                THINK. ROLL. SHIFT. ESCAPE.
              </p>
            </div>
          </section>

          <section className="bs-menuCard">
            <div className="bs-progressHeader">
              <span>
                CURRENT PROGRESS
              </span>

              <strong>
                {Math.min(
                  30,
                  modeUnlocked - 1
                )}
                /30
              </strong>
            </div>

            <div className="bs-progressBar">
              <span
                style={{
                  width: `${Math.min(
                    100,
                    ((modeUnlocked -
                      1) /
                      30) *
                      100
                  )}%`,
                }}
              />
            </div>

            <button
              className="bs-primaryButton"
              onClick={() =>
                startLevel(
                  Math.min(
                    modeUnlocked,
                    30
                  )
                )
              }
            >
              CONTINUE
              <span>→</span>
            </button>

            <button
              className="bs-menuButton"
              onClick={goToLevels}
            >
              LEVELS
            </button>

            <button
              className="bs-menuButton"
              onClick={() =>
                setScreen("modes")
              }
            >
              GAME MODES
            </button>

            <button
              className="bs-menuButton"
              onClick={() =>
                setScreen("how")
              }
            >
              HOW TO PLAY
            </button>

            <button
              className="bs-menuButton"
              onClick={() =>
                setScreen("settings")
              }
            >
              SETTINGS
            </button>
          </section>

          <section className="bs-stats">
            <div>
              <span>🪙</span>
              <strong>{coins}</strong>
              <small>COINS</small>
            </div>

            <div>
              <span>⭐</span>
              <strong>
                {Object.values(
                  stars
                ).reduce(
                  (sum, value) =>
                    sum + value,
                  0
                )}
              </strong>
              <small>STARS</small>
            </div>

            <div>
              <span>🏆</span>
              <strong>
                {
                  Object.keys(
                    stars
                  ).length
                }
              </strong>
              <small>COMPLETED</small>
            </div>
          </section>
        </main>
      )}

      {/* ==============================================
          MODES
      ============================================== */}

      {screen === "modes" && (
        <section className="bs-panel">
          <header className="bs-panelHeader">
            <button
              onClick={goToMenu}
            >
              ←
            </button>

            <div>
              <small>
                GAME MODES
              </small>

              <h2>
                Choose your challenge
              </h2>
            </div>
          </header>

          <div className="bs-modeGrid">
            {Object.entries(
              MODES
            ).map(
              ([
                modeKey,
                modeInfo,
              ]) => (
                <button
                  key={modeKey}
                  className={`bs-modeCard ${
                    mode === modeKey
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    selectMode(
                      modeKey
                    )
                  }
                >
                  <span className="modeNumber">
                    {modeKey ===
                    "EASY"
                      ? "01"
                      : modeKey ===
                        "MEDIUM"
                      ? "02"
                      : "03"}
                  </span>

                  <strong>
                    {modeInfo.name}
                  </strong>

                  <small>
                    {
                      modeInfo.description
                    }
                  </small>

                  <em>
                    {modeKey ===
                    "EASY"
                      ? "●"
                      : modeKey ===
                        "MEDIUM"
                      ? "●●"
                      : "●●●"}
                  </em>
                </button>
              )
            )}
          </div>
        </section>
      )}

      {/* ==============================================
          LEVEL SELECT
      ============================================== */}

      {screen === "levels" && (
        <section className="bs-panel">
          <header className="bs-panelHeader">
            <button
              onClick={() =>
                setScreen("modes")
              }
            >
              ←
            </button>

            <div>
              <small>
                {MODES[
                  mode
                ].name.toUpperCase()}{" "}
                MODE
              </small>

              <h2>
                Select a level
              </h2>
            </div>
          </header>

          <div className="bs-levelInfo">
            <div>
              <span>
                UNLOCKED
              </span>

              <strong>
                {Math.min(
                  30,
                  modeUnlocked
                )}
                /30
              </strong>
            </div>

            <div>
              <span>
                TOTAL STARS
              </span>

              <strong>
                {levelNumbers.reduce(
                  (sum, number) =>
                    sum +
                    (stars[
                      `${mode}-${number}`
                    ] || 0),
                  0
                )}
              </strong>
            </div>
          </div>

          <div className="bs-levelGrid">
            {levelNumbers.map(
              (number) => {
                const locked =
                  number >
                  modeUnlocked;

                const earned =
                  stars[
                    `${mode}-${number}`
                  ] || 0;

                return (
                  <button
                    key={number}
                    disabled={locked}
                    className={`bs-level ${
                      locked
                        ? "locked"
                        : ""
                    } ${
                      number ===
                      levelNumber
                        ? "current"
                        : ""
                    }`}
                    onClick={() =>
                      startLevel(
                        number
                      )
                    }
                  >
                    <strong>
                      {locked
                        ? "🔒"
                        : number}
                    </strong>

                    <span>
                      {earned > 0
                        ? "★".repeat(
                            earned
                          )
                        : "—"}
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </section>
      )}

      {/* ==============================================
          HOW TO PLAY
      ============================================== */}

      {screen === "how" && (
        <section className="bs-panel">
          <header className="bs-panelHeader">
            <button
              onClick={goToMenu}
            >
              ←
            </button>

            <div>
              <small>
                HOW TO PLAY
              </small>

              <h2>
                Easy to start.
                Hard to master.
              </h2>
            </div>
          </header>

          <div className="bs-howGrid">
            <article>
              <span>01</span>
              <h3>ROLL</h3>
              <p>
                Use Arrow Keys,
                WASD or the
                on-screen controls
                to roll the block.
              </p>
            </article>

            <article>
              <span>02</span>
              <h3>STAND</h3>
              <p>
                The block has
                standing,
                horizontal and
                vertical states.
              </p>
            </article>

            <article>
              <span>03</span>
              <h3>COLLECT</h3>
              <p>
                Collect coins
                during your run
                to increase your
                score.
              </p>
            </article>

            <article>
              <span>04</span>
              <h3>SHIFT</h3>
              <p>
                Activate special
                dimension tiles
                and portals.
              </p>
            </article>

            <article>
              <span>05</span>
              <h3>AVOID</h3>
              <p>
                Watch dangerous
                tiles and plan
                your route.
              </p>
            </article>

            <article>
              <span>06</span>
              <h3>MASTER</h3>
              <p>
                Finish with fewer
                moves and less
                time to earn
                three stars.
              </p>
            </article>
          </div>

          <div className="bs-keyHelp">
            <span>
              ↑ ↓ ← →
            </span>
            <span>
              W A S D
            </span>
            <span>
              P = PAUSE
            </span>
            <span>
              R = RESTART
            </span>
          </div>
        </section>
      )}

      {/* ==============================================
          SETTINGS
      ============================================== */}

      {screen === "settings" && (
        <section className="bs-panel">
          <header className="bs-panelHeader">
            <button
              onClick={goToMenu}
            >
              ←
            </button>

            <div>
              <small>
                SETTINGS
              </small>

              <h2>
                Game settings
              </h2>
            </div>
          </header>

          <div className="bs-settings">
            <button
              onClick={toggleSound}
            >
              <span>
                🔊 SOUND
              </span>

              <strong>
                {sound
                  ? "ON"
                  : "OFF"}
              </strong>
            </button>

            <button
              onClick={() => {
                setScreen("menu");
              }}
            >
              <span>
                🎮 CONTROL
              </span>

              <strong>
                KEYBOARD + TOUCH
              </strong>
            </button>

            <button
              className="dangerSetting"
              onClick={
                resetProgress
              }
            >
              <span>
                RESET PROGRESS
              </span>

              <strong>
                RESET
              </strong>
            </button>
          </div>
        </section>
      )}

      {/* ==============================================
          GAME
      ============================================== */}

      {screen === "play" && (
        <section className="bs-game">
          <header className="bs-gameHeader">
            <button
              className="bs-iconButton"
              onClick={() =>
                setPaused(true)
              }
            >
              Ⅱ
            </button>

            <div className="bs-gameTitle">
              <strong>
                BLOCKSHIFT
              </strong>

              <small>
                WORLD{" "}
                {Math.floor(
                  (levelNumber - 1) /
                    10
                ) +
                  1}{" "}
                · LEVEL{" "}
                {levelNumber}
              </small>
            </div>

            <div className="bs-gameHeaderStats">
              <span>
                🪙 {coins}
              </span>

              <span>
                ⭐ {currentStars}
              </span>

              <span>
                ⚡ {energy}
              </span>
            </div>
          </header>

          <div className="bs-gameLayout">
            {/* LEFT STATS */}

            <aside className="bs-sideStats">
              <div>
                <small>
                  MOVES
                </small>

                <strong>
                  {moves}
                </strong>

                <span>
                  TARGET{" "}
                  {
                    level.moveTarget
                  }
                </span>
              </div>

              <div>
                <small>
                  TIME
                </small>

                <strong>
                  {formatTime(
                    time
                  )}
                </strong>

                <span>
                  LIMIT{" "}
                  {
                    level.timeTarget
                  }s
                </span>
              </div>

              <div>
                <small>
                  STATE
                </small>

                <strong>
                  {block.orientation ===
                  "S"
                    ? "STANDING"
                    : block.orientation ===
                      "H"
                    ? "HORIZONTAL"
                    : "VERTICAL"}
                </strong>
              </div>

              <div>
                <small>
                  COMBO
                </small>

                <strong>
                  x
                  {Math.max(
                    1,
                    combo
                  )}
                </strong>
              </div>

              <div>
                <small>
                  SCORE
                </small>

                <strong>
                  {score}
                </strong>
              </div>
            </aside>

            {/* BOARD */}

            <div className="bs-boardContainer">
              <div className="bs-boardTop">
                <span>
                  {level.chapter}
                </span>

                <span>
                  DIMENSION{" "}
                  <b>
                    {dimension}
                  </b>
                </span>
              </div>

              <div
                className="bs-board"
                style={{
                  gridTemplateColumns: `repeat(${level.width}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${level.height}, minmax(0, 1fr))`,
                }}
              >
                {Array.from(
                  {
                    length:
                      level.width *
                      level.height,
                  },
                  (_, index) => {
                    const x =
                      index %
                      level.width;

                    const y =
                      Math.floor(
                        index /
                          level.width
                      );

                    const cellKey =
                      key(x, y);

                    const isFloor =
                      level.floor.has(
                        cellKey
                      );

                    const special =
                      level.special[
                        cellKey
                      ];

                    const isTarget =
                      x ===
                        level.target
                          .x &&
                      y ===
                        level.target
                          .y;

                    const isBlock =
                      getBlockCells(
                        block
                      ).some(
                        ([bx, by]) =>
                          bx === x &&
                          by === y
                      );

                    const hasCoin =
                      level.coins.has(
                        cellKey
                      );

                    return (
                      <div
                        key={cellKey}
                        className={`bs-tile ${
                          isFloor
                            ? "floor"
                            : "void"
                        } ${
                          special || ""
                        } ${
                          isTarget
                            ? "target"
                            : ""
                        }`}
                      >
                        {special &&
                          renderSpecial(
                            special
                          )}

                        {isTarget && (
                          <span className="goalIcon">
                            ◆
                          </span>
                        )}

                        {hasCoin && (
                          <span className="coin">
                            ●
                          </span>
                        )}

                        {isBlock &&
                          renderBlock()}
                      </div>
                    );
                  }
                )}
              </div>

              <footer className="bs-boardFooter">
                <span>
                  🪙 +{runCoins}
                </span>

                <span>
                  🔥 COMBO x
                  {Math.max(
                    1,
                    combo
                  )}
                </span>

                <span>
                  🏆 {score}
                </span>
              </footer>
            </div>

            {/* CONTROLS */}

            <aside className="bs-controls">
              <small>
                CONTROLS
              </small>

              <button
                className="controlUp"
                onClick={() =>
                  move("UP")
                }
              >
                ↑
              </button>

              <div className="controlRow">
                <button
                  onClick={() =>
                    move("LEFT")
                  }
                >
                  ←
                </button>

                <button
                  onClick={() =>
                    move("DOWN")
                  }
                >
                  ↓
                </button>

                <button
                  onClick={() =>
                    move("RIGHT")
                  }
                >
                  →
                </button>
              </div>

              <button
                className="restartControl"
                onClick={
                  restartLevel
                }
              >
                ↻ RESTART
              </button>
            </aside>
          </div>

          {toast && (
            <div className="bs-toast">
              {toast}
            </div>
          )}

          {/* ==========================================
              PAUSE
          ========================================== */}

          {paused &&
            !result && (
              <div className="bs-overlay">
                <div className="bs-modal">
                  <small>
                    GAME PAUSED
                  </small>

                  <h2>
                    Ready when you
                    are.
                  </h2>

                  <button
                    className="bs-primaryButton"
                    onClick={() =>
                      setPaused(
                        false
                      )
                    }
                  >
                    RESUME →
                  </button>

                  <button
                    className="bs-menuButton"
                    onClick={
                      restartLevel
                    }
                  >
                    RESTART LEVEL
                  </button>

                  <button
                    className="bs-menuButton"
                    onClick={() => {
                      setPaused(
                        false
                      );
                      setScreen(
                        "levels"
                      );
                    }}
                  >
                    LEVEL SELECT
                  </button>

                  <button
                    className="bs-menuButton"
                    onClick={
                      goToMenu
                    }
                  >
                    MAIN MENU
                  </button>
                </div>
              </div>
            )}

          {/* ==========================================
              COMPLETE
          ========================================== */}

          {result && (
            <div className="bs-overlay">
              <div className="bs-result">
                <small>
                  LEVEL COMPLETE
                </small>

                <h2>
                  DIMENSION
                  <span>
                    CLEARED
                  </span>
                </h2>

                <div className="bs-resultStars">
                  {"★".repeat(
                    result.stars
                  )}

                  <i>
                    {"★".repeat(
                      3 -
                        result.stars
                    )}
                  </i>
                </div>

                <div className="bs-resultGrid">
                  <div>
                    <span>
                      SCORE
                    </span>

                    <strong>
                      {
                        result.score
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      MOVES
                    </span>

                    <strong>
                      {
                        result.moves
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      TIME
                    </span>

                    <strong>
                      {formatTime(
                        result.time
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      COINS
                    </span>

                    <strong>
                      +{
                        result.coins
                      }
                    </strong>
                  </div>
                </div>

                <div className="bs-resultActions">
                  <button
                    onClick={
                      restartLevel
                    }
                  >
                    ↻ RETRY
                  </button>

                  <button
                    className="bs-primaryButton"
                    onClick={() => {
                      if (
                        levelNumber <
                        30
                      ) {
                        startLevel(
                          levelNumber +
                            1
                        );
                      } else {
                        setScreen(
                          "levels"
                        );
                        setResult(
                          null
                        );
                      }
                    }}
                  >
                    {levelNumber <
                    30
                      ? `NEXT LEVEL ${
                          levelNumber +
                          1
                        } →`
                      : "LEVELS →"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

/*
  IMPORTANT:
  This is the default export required by:

  import BlockShift from
  "../games/BlockShift/BlockShift";
*/

export default BlockShift;