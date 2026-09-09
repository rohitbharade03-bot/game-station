import React, { useEffect, useRef, useState } from "react";
import "./NinjaHillRide.css";


const STORAGE_KEY = "ninja_hill_ride_progress";

const MODES = {
  easy: {
    name: "EASY",
    fuelDrain: 0.018,
    terrain: 0.75,
    obstacleChance: 0.35,
    coinMultiplier: 1,
  },
  medium: {
    name: "MEDIUM",
    fuelDrain: 0.027,
    terrain: 1,
    obstacleChance: 0.55,
    coinMultiplier: 1.5,
  },
  hard: {
    name: "HARD",
    fuelDrain: 0.04,
    terrain: 1.3,
    obstacleChance: 0.75,
    coinMultiplier: 2,
  },
};

const DEFAULT_PROGRESS = {
  unlockedLevel: 1,
  selectedMode: "easy",
  coins: 0,
  gems: 0,
  xp: 0,
  bestDistance: 0,
  bestScore: 0,
  soundEnabled: true,
  bike: {
    engine: 1,
    tires: 1,
    fuel: 1,
    armor: 1,
    nitro: 1,
  },
};

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
      bike: {
        ...DEFAULT_PROGRESS.bike,
        ...(parsed.bike || {}),
      },
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function ensureAudio(game) {
  if (game.audio) return game.audio;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  const ctx = new AudioCtx();
  if (ctx.state === "suspended") ctx.resume();
  game.audio = { ctx, engine: null, engineGain: null };
  return game.audio;
}

function playTone(game, frequency, duration = 0.08, type = "sine", volume = 0.06) {
  if (game?.soundEnabled === false) return;
  const audio = ensureAudio(game);
  if (!audio) return;
  const { ctx } = audio;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function updateEngineSound(game) {
  if (game?.soundEnabled === false) {
    if (game.audio?.engine) {
      try { game.audio.engine.stop(); } catch {}
      try { game.audio.engine.disconnect(); } catch {}
      try { game.audio.engineGain.disconnect(); } catch {}
      game.audio.engine = null;
      game.audio.engineGain = null;
    }
    return;
  }
  const audio = ensureAudio(game);
  if (!audio) return;
  const { ctx } = audio;
  const moving = game.running && Math.abs(game.bike.vx) > 0.15;
  if (!moving) {
    if (audio.engine) {
      try { audio.engine.stop(); } catch {}
      audio.engine.disconnect();
      audio.engineGain.disconnect();
      audio.engine = null;
      audio.engineGain = null;
    }
    return;
  }
  if (!audio.engine) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = 70;
    gain.gain.value = 0.018;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    audio.engine = osc;
    audio.engineGain = gain;
  }
  audio.engine.frequency.setTargetAtTime(65 + Math.abs(game.bike.vx) * 22, ctx.currentTime, 0.04);
  audio.engineGain.gain.setTargetAtTime(game.bike.vx > 0 ? 0.024 : 0.014, ctx.currentTime, 0.05);
}

function NinjaHillRide() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const keysRef = useRef({
    left: false,
    right: false,
    jump: false,
    nitro: false,
    slash: false,
  });

  const gameRef = useRef(null);

  const [screen, setScreen] = useState("menu");
  const [mode, setMode] = useState("easy");
  const [level, setLevel] = useState(1);

  const [hud, setHud] = useState({
    distance: 0,
    coins: 0,
    gems: 0,
    fuel: 100,
    nitro: 100,
    score: 0,
    combo: 1,
    mission: 0,
    message: "",
    headDamage: 0,
    running: 0,
    performance: 0,
  });

  const [progress, setProgress] = useState(loadProgress());
  const [soundEnabled, setSoundEnabled] = useState(() => loadProgress().soundEnabled !== false);
  const [coinFlyEffects, setCoinFlyEffects] = useState([]);

  const updateProgress = (changes) => {
    setProgress((prev) => {
      const next = {
        ...prev,
        ...changes,
      };

      saveProgress(next);
      return next;
    });
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    updateProgress({ soundEnabled: next });

    const game = gameRef.current;
    if (game) {
      game.soundEnabled = next;

      if (!next && game.audio?.engine) {
        try { game.audio.engine.stop(); } catch {}
        try { game.audio.engine.disconnect(); } catch {}
        try { game.audio.engineGain.disconnect(); } catch {}
        game.audio.engine = null;
        game.audio.engineGain = null;
      }
    }
  };

  /* =========================================================
     START GAME
  ========================================================= */

  const startGame = (selectedMode = mode, selectedLevel = level) => {
    const config = MODES[selectedMode];

    const bike = progress.bike;

    gameRef.current = {
      running: true,

      mode: selectedMode,
      level: selectedLevel,

      config,

      time: 0,
      distance: 0,

      coins: 0,
      gems: 0,

      fuel: 100 + bike.fuel * 8,
      nitro: 100 + bike.nitro * 8,

      score: 0,
      combo: 1,

      speed: 0,
      maxSpeed: 7 + bike.engine * 0.7,

      worldX: 0,

      bike: {
        x: 180,
        y: 0,
        vx: 0,
        vy: 0,

        angle: 0,
        angularVelocity: 0,

        wheelRadius: 17,

        grounded: true,
        jumping: false,
      },

      terrain: [],
      coinsItems: [],
      gemsItems: [],
      fuels: [],
      obstacles: [],
      particles: [],
      trees: [],
      audio: null,
      soundEnabled,

      mission: {
        type: selectedLevel % 3 === 1
          ? "distance"
          : selectedLevel % 3 === 2
            ? "coins"
            : "flip",

        target:
          selectedLevel % 3 === 1
            ? 500 + selectedLevel * 100
            : selectedLevel % 3 === 2
              ? 15 + selectedLevel * 3
              : 3 + Math.floor(selectedLevel / 2),

        progress: 0,
        completed: false,
      },

      lastTerrainX: 0,
      lastSpawnX: 0,

      cameraX: 0,

      shake: 0,

      flash: 0,

      headDamage: 0,
      headImpactTimer: 0,
      maxSpeedReached: 0,
      airTime: 0,
      flips: 0,
      headHitFlash: 0,
    };

    setHud({
      distance: 0,
      coins: 0,
      gems: 0,
      fuel: 100,
      nitro: 100,
      score: 0,
      combo: 1,
      mission: 0,
      message: "",
      headDamage: 0,
      running: 0,
      performance: 0,
    });

    setScreen("game");
  };

  /* =========================================================
     GENERATE TERRAIN
  ========================================================= */

  const generateTerrain = (game, ctx, width, height) => {
    const groundBase = height * 0.68;

    if (game.terrain.length === 0) {
      let x = -300;

      for (let i = 0; i < 60; i++) {
        const wave =
          Math.sin(i * 0.6) * 30 +
          Math.sin(i * 0.21) * 45;

        game.terrain.push({
          x,
          y: groundBase + wave,
        });

        x += 65;
      }

      game.lastTerrainX = x;
    }

    const targetX =
      game.worldX + width * 2.2;

    while (game.lastTerrainX < targetX) {
      const previous =
        game.terrain[game.terrain.length - 1];

      const previous2 =
        game.terrain[game.terrain.length - 2] || previous;

      const difficulty =
        1 +
        game.level * 0.04 +
        (game.mode === "hard" ? 0.35 : 0);

      const delta =
        Math.sin(game.lastTerrainX * 0.009) *
          35 *
          game.config.terrain *
          difficulty +
        Math.sin(game.lastTerrainX * 0.021) *
          22 *
          game.config.terrain;

      let y =
        previous.y * 0.65 +
        (groundBase + delta) * 0.35;

      const slopeLimit =
        game.mode === "hard" ? 55 : 42;

      y = clamp(
        y,
        previous2.y - slopeLimit,
        previous2.y + slopeLimit
      );

      game.terrain.push({
        x: game.lastTerrainX,
        y,
      });

      game.lastTerrainX += 55 + Math.random() * 25;
    }

    while (
      game.terrain.length > 120 &&
      game.terrain[1].x < game.worldX - 500
    ) {
      game.terrain.shift();
    }
  };

  const terrainY = (game, worldX, height) => {
    const points = game.terrain;

    if (!points.length) {
      return height * 0.68;
    }

    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];

      if (worldX >= a.x && worldX <= b.x) {
        const t =
          (worldX - a.x) /
          (b.x - a.x || 1);

        return a.y + (b.y - a.y) * t;
      }
    }

    return points[points.length - 1].y;
  };

  /* =========================================================
     SPAWN OBJECTS
  ========================================================= */

  const spawnObjects = (game, height) => {
    const currentWorld =
      game.worldX + 850;

    if (
      currentWorld - game.lastSpawnX <
      180
    ) {
      return;
    }

    game.lastSpawnX = currentWorld;

    const ground =
      terrainY(game, currentWorld, height);

    const random = Math.random();

    if (Math.random() < 0.82) {
      game.trees.push({
        x: currentWorld - 35,
        side: Math.random() < 0.5 ? -1 : 1,
        scale: 0.75 + Math.random() * 0.55,
        yOffset: 18 + Math.random() * 28,
      });
      if (Math.random() < 0.45) {
        game.trees.push({
          x: currentWorld + 95,
          side: Math.random() < 0.5 ? -1 : 1,
          scale: 0.65 + Math.random() * 0.45,
          yOffset: 20 + Math.random() * 24,
        });
      }
    }

    if (random < 0.70) {
      game.coinsItems.push({
        x: currentWorld,
        y: ground - 55 - Math.random() * 50,
        radius: 10,
        collected: false,
      });
    }

    if (random < 0.15) {
      game.gemsItems.push({
        x: currentWorld + 35,
        y: ground - 80,
        radius: 11,
        collected: false,
      });
    }

    if (random > 0.55 && random < 0.75) {
      game.fuels.push({
        x: currentWorld + 50,
        y: ground - 40,
        width: 25,
        height: 35,
        collected: false,
      });
    }

    if (
      random >
      1 - game.config.obstacleChance
    ) {
      game.obstacles.push({
        x: currentWorld + 70,
        y: ground - 28,
        width: 35,
        height: 28,
        type:
          Math.random() > 0.5
            ? "rock"
            : "barrel",
        hit: false,
      });
    }

    if (
      game.level >= 3 &&
      Math.random() < 0.13
    ) {
      game.obstacles.push({
        x: currentWorld + 130,
        y: ground - 22,
        width: 50,
        height: 22,
        type: "spike",
        hit: false,
      });
    }
  };

  /* =========================================================
     PARTICLES
  ========================================================= */

  const addParticle = (
    game,
    x,
    y,
    color,
    count = 8
  ) => {
    for (let i = 0; i < count; i++) {
      game.particles.push({
        x,
        y,

        vx:
          (Math.random() - 0.5) * 4,

        vy:
          (Math.random() - 0.5) * 4 - 1,

        life: 1,

        size:
          2 + Math.random() * 4,

        color,
      });
    }
  };

  /* =========================================================
     UPDATE GAME
  ========================================================= */

  const updateGame = (
    game,
    dt,
    width,
    height
  ) => {
    const keys = keysRef.current;

    game.time += dt;

    const bike = game.bike;

    const enginePower =
      0.075 +
      progress.bike.engine * 0.018;

    const brakePower = 0.09;

    /* -------------------------
       ACCELERATION
    ------------------------- */

    if (keys.right) {
      bike.vx += enginePower;

      game.speed += 0.08;
    }

    if (keys.left) {
      bike.vx -= brakePower;

      game.speed -= 0.06;
    }

    game.speed *= 0.995;

    game.speed = clamp(
      game.speed,
      -3,
      bike.vx > 0
        ? game.maxSpeed
        : 3
    );

    bike.vx += game.speed * 0.004;

    bike.vx = clamp(
      bike.vx,
      -2.5,
      game.maxSpeed
    );

    game.maxSpeedReached = Math.max(
      game.maxSpeedReached,
      Math.abs(bike.vx)
    );

    if (!bike.grounded) {
      game.airTime += dt / 60;
    }

    /* -------------------------
       NITRO
    ------------------------- */

    if (
      keys.nitro &&
      game.nitro > 0 &&
      bike.vx > 0
    ) {
      bike.vx +=
        0.16 +
        progress.bike.nitro * 0.02;

      game.nitro -=
        0.75;

      game.score += 2;

      if (
        Math.random() < 0.25
      ) {
        addParticle(
          game,
          bike.x,
          bike.y + 15,
          "#ff405d",
          2
        );
      }
    } else {
      game.nitro = Math.min(
        100 +
          progress.bike.nitro * 8,
        game.nitro + 0.025
      );
    }

    updateEngineSound(game);

    /* -------------------------
       GRAVITY
    ------------------------- */

    bike.vy += 0.32;

    if (
      keys.jump &&
      bike.grounded
    ) {
      bike.vy = -8.5;

      bike.grounded = false;
      bike.jumping = true;

      addParticle(
        game,
        bike.x,
        bike.y + 15,
        "#d5d5d5",
        7
      );
    }

    bike.x += bike.vx;
    bike.y += bike.vy;

    /* -------------------------
       TERRAIN COLLISION
    ------------------------- */

    const worldBikeX =
      game.worldX + bike.x;

    const ground =
      terrainY(
        game,
        worldBikeX,
        height
      );

    const groundAhead =
      terrainY(
        game,
        worldBikeX + 30,
        height
      );

    const groundBehind =
      terrainY(
        game,
        worldBikeX - 30,
        height
      );

    const slope =
      Math.atan2(
        groundAhead - groundBehind,
        60
      );

    const wheelY =
      ground - bike.wheelRadius;

    if (
      bike.y >= wheelY
    ) {
      const wasAirborne =
        !bike.grounded;

      bike.y = wheelY;

      if (bike.vy > 2 && Math.abs(bike.angle) > 0.75) {
        game.shake = 12;
        game.combo = 1;
        addParticle(
          game,
          bike.x,
          bike.y,
          "#ff405d",
          15
        );

        if (Math.abs(normalizedAngle) > 2.25) {
          game.headDamage = clamp(game.headDamage + 35, 0, 100);
          game.headHitFlash = 1;
          playTone(game, 120, 0.12, "sawtooth", 0.07);
        }
      }

      bike.vy = 0;
      bike.grounded = true;

      bike.angle +=
        (slope - bike.angle) *
        0.14;

      if (
        wasAirborne &&
        Math.abs(bike.angle) < 0.25
      ) {
        game.score +=
          50 * game.combo;

        game.combo =
          Math.min(
            10,
            game.combo + 0.25
          );

        if (
          game.mission.type ===
            "flip" &&
          game.mission.progress > 0
        ) {
          game.mission.progress += 1;
        }

        addParticle(
          game,
          bike.x,
          bike.y + 15,
          "#63e6be",
          8
        );
      }
    } else {
      bike.grounded = false;
    }

    /* -------------------------
       ROTATION / AIR CONTROL
    ------------------------- */

    if (!bike.grounded) {
      if (keys.right) {
        bike.angularVelocity += 0.012;
      }

      if (keys.left) {
        bike.angularVelocity -= 0.012;
      }

      bike.angularVelocity *= 0.992;

      bike.angle +=
        bike.angularVelocity;

      if (
        Math.abs(
          bike.angularVelocity
        ) > 0.015
      ) {
        game.mission.progress +=
          0.015;
      }
    } else {
      bike.angularVelocity *= 0.8;
    }

    /* -------------------------
       WORLD MOVEMENT
    ------------------------- */

    if (bike.x > width * 0.42) {
      const movement =
        bike.x - width * 0.42;

      game.worldX += movement;

      bike.x -= movement;
    }

    if (bike.x < 100) {
      bike.x = 100;
    }

    game.distance =
      Math.max(
        game.distance,
        Math.floor(
          game.worldX / 10
        )
      );

    /* -------------------------
       HEAD IMPACT / DAMAGE
    ------------------------- */

    // If the rider stays upside-down, the helmet/head takes damage.
    // A hard inverted landing adds an immediate extra hit.
    const normalizedAngle =
      ((bike.angle + Math.PI) % (Math.PI * 2)) - Math.PI;

    const upsideDown =
      Math.abs(normalizedAngle) > 2.25;

    if (upsideDown) {
      game.headImpactTimer += dt;
      game.headDamage = clamp(
        game.headDamage + 0.18 * dt,
        0,
        100
      );

      game.headHitFlash = Math.min(1, game.headHitFlash + 0.08 * dt);

      if (Math.random() < 0.12) {
        addParticle(game, bike.x, bike.y - 62, "#ff6b6b", 2);
      }
    } else {
      game.headImpactTimer = Math.max(0, game.headImpactTimer - 0.8 * dt);
      game.headHitFlash = Math.max(0, game.headHitFlash - 0.08 * dt);
    }

    /* -------------------------
       FUEL
    ------------------------- */

    game.fuel -=
      game.config.fuelDrain *
      (1 + game.level * 0.025);

    game.fuel = Math.max(
      0,
      game.fuel
    );

    /* -------------------------
       COINS
    ------------------------- */

    game.coinsItems.forEach(
      (item) => {
        if (item.collected) return;

        const dx =
          item.x -
          (game.worldX + bike.x);

        const dy =
          item.y -
          bike.y;

        // Coin pickup is based on the bike/coin distance.
        // This keeps the pickup reliable without collecting coins from too far away.
        const pickupDistance = Math.hypot(dx, dy);

        if (pickupDistance < 62) {
          item.collected = true;

          game.coins += 1;

          // Store the exact screen position so the collected coin can fly
          // visually toward the top HUD counter.
          const coinScreenX = item.x - game.worldX;
          const coinScreenY = item.y;

          setCoinFlyEffects((prev) => [
            ...prev.slice(-5),
            {
              id: `${Date.now()}-${Math.random()}`,
              x: coinScreenX,
              y: coinScreenY,
            },
          ]);

          playTone(game, 880, 0.07, "square", 0.055);
          setTimeout(() => playTone(game, 1320, 0.06, "square", 0.04), 45);

          game.score +=
            10 *
            game.combo *
            game.config.coinMultiplier;

          game.combo = Math.min(
            10,
            game.combo + 0.05
          );

          if (
            game.mission.type ===
            "coins"
          ) {
            game.mission.progress +=
              1;
          }

          addParticle(
            game,
            bike.x,
            bike.y,
            "#ffd166",
            10
          );
        }
      }
    );

    /* -------------------------
       GEMS
    ------------------------- */

    game.gemsItems.forEach(
      (item) => {
        if (item.collected) return;

        const dx =
          item.x -
          (game.worldX + bike.x);

        const dy =
          item.y -
          bike.y;

        const distance =
          Math.sqrt(
            dx * dx +
            dy * dy
          );

        if (distance < 40) {
          item.collected = true;

          game.gems += 1;

          game.score +=
            100 * game.combo;

          addParticle(
            game,
            bike.x,
            bike.y,
            "#8be9fd",
            14
          );
        }
      }
    );

    /* -------------------------
       FUEL PICKUPS
    ------------------------- */

    game.fuels.forEach(
      (item) => {
        if (item.collected) return;

        const dx =
          item.x -
          (game.worldX + bike.x);

        const dy =
          item.y -
          bike.y;

        const distance =
          Math.sqrt(
            dx * dx +
            dy * dy
          );

        if (distance < 45) {
          item.collected = true;

          game.fuel = 100 + progress.bike.fuel * 8;
          playTone(game, 520, 0.12, "sine", 0.07);
          setTimeout(() => playTone(game, 780, 0.12, "sine", 0.05), 70);

          game.score += 40;

          addParticle(
            game,
            bike.x,
            bike.y,
            "#63e6be",
            12
          );
        }
      }
    );

    /* -------------------------
       OBSTACLES
    ------------------------- */

    game.obstacles.forEach(
      (obstacle) => {
        if (obstacle.hit) return;

        const obstacleScreenX =
          obstacle.x -
          game.worldX;

        const distance =
          Math.abs(
            obstacleScreenX -
              bike.x
          );

        const vertical =
          Math.abs(
            obstacle.y -
              bike.y
          );

        if (
          distance < 35 &&
          vertical < 35
        ) {
          obstacle.hit = true;

          if (keys.slash) {
            game.score += 80;

            addParticle(
              game,
              bike.x,
              bike.y,
              "#ff405d",
              15
            );
          } else {
            game.shake = 15;
            game.combo = 1;
            bike.vx *= 0.45;
            bike.vy -= 1.5;

            addParticle(
              game,
              bike.x,
              bike.y,
              "#ff405d",
              18
            );
          }
        }
      }
    );

    /* -------------------------
       CLEAN OBJECTS
    ------------------------- */

    const cleanupX =
      game.worldX - 500;

    game.coinsItems =
      game.coinsItems.filter(
        (item) =>
          item.x > cleanupX
      );

    game.gemsItems =
      game.gemsItems.filter(
        (item) =>
          item.x > cleanupX
      );

    game.fuels =
      game.fuels.filter(
        (item) =>
          item.x > cleanupX
      );

    game.obstacles =
      game.obstacles.filter(
        (item) =>
          item.x > cleanupX
      );

    game.trees =
      game.trees.filter(
        (item) =>
          item.x > cleanupX
      );

    /* -------------------------
       PARTICLES
    ------------------------- */

    game.particles.forEach(
      (particle) => {
        particle.x +=
          particle.vx;

        particle.y +=
          particle.vy;

        particle.vy +=
          0.05;

        particle.life -=
          0.025;
      }
    );

    game.particles =
      game.particles.filter(
        (particle) =>
          particle.life > 0
      );

    /* -------------------------
       MISSION
    ------------------------- */

    if (
      game.mission.type ===
      "distance"
    ) {
      game.mission.progress =
        game.distance;
    }

    if (
      game.mission.progress >=
      game.mission.target
    ) {
      if (
        !game.mission.completed
      ) {
        game.mission.completed =
          true;

        game.score += 500;

        game.coins += 10;

        addParticle(
          game,
          bike.x,
          bike.y,
          "#ffd166",
          25
        );
      }
    }

    /* -------------------------
       COMBO DECAY
    ------------------------- */

    game.combo = Math.max(
      1,
      game.combo -
        0.001
    );

    /* -------------------------
       SPAWN
    ------------------------- */

    generateTerrain(
      game,
      null,
      width,
      height
    );

    spawnObjects(
      game,
      height
    );

    /* -------------------------
       GAME OVER
    ------------------------- */

    // Head damage is visual/gameplay feedback only.
    // The rider is NOT eliminated by head damage.
    // Game over happens only when fuel reaches zero.
    if (game.fuel <= 0) {
      finishGame("OUT_OF_FUEL");
    }
  };

  /* =========================================================
     FINISH GAME
  ========================================================= */

  const finishGame = (reason) => {
    const game = gameRef.current;

    if (!game || !game.running) {
      return;
    }

    game.running = false;

    const oldProgress =
      loadProgress();

    let unlocked =
      oldProgress.unlockedLevel;

    if (
      game.mission.completed &&
      game.level >= unlocked
    ) {
      unlocked =
        Math.min(
          100,
          game.level + 1
        );
    }

    const nextProgress = {
      ...oldProgress,

      unlockedLevel:
        Math.max(
          unlocked,
          oldProgress.unlockedLevel
        ),

      coins:
        oldProgress.coins +
        game.coins,

      gems:
        oldProgress.gems +
        game.gems,

      xp:
        oldProgress.xp +
        Math.floor(
          game.distance / 10
        ) +
        game.score,

      bestDistance:
        Math.max(
          oldProgress.bestDistance,
          game.distance
        ),

      bestScore:
        Math.max(
          oldProgress.bestScore,
          Math.floor(
            game.score
          )
        ),
    };

    saveProgress(
      nextProgress
    );

    setProgress(
      nextProgress
    );

    setHud({
      distance: game.distance,
      coins: game.coins,
      gems: game.gems,
      fuel: Math.round(
        game.fuel
      ),
      nitro: Math.round(
        game.nitro
      ),
      score: Math.floor(
        game.score
      ),
      combo: game.combo,
      headDamage: Math.round(game.headDamage),
      running: Math.max(0, game.time / 60),
      performance: Math.round(clamp(
        game.distance * 0.12 +
        game.coins * 3.5 +
        game.gems * 6 +
        game.maxSpeedReached * 4 +
        game.airTime * 2,
        0,
        100
      )),
      mission:
        game.mission.progress,
      message:
        reason === "CRASH"
          ? "BIKE CRASHED"
          : "FUEL EMPTY",
    });

    setScreen("gameover");
  };

  /* =========================================================
     DRAW BACKGROUND
  ========================================================= */

  const drawBackground = (
    ctx,
    width,
    height,
    game
  ) => {
    const gradient =
      ctx.createLinearGradient(
        0,
        0,
        0,
        height
      );

    gradient.addColorStop(
      0,
      "#07111f"
    );

    gradient.addColorStop(
      0.55,
      "#12263a"
    );

    gradient.addColorStop(
      1,
      "#07100c"
    );

    ctx.fillStyle =
      gradient;

    ctx.fillRect(
      0,
      0,
      width,
      height
    );

    /* Moon */

    ctx.beginPath();

    ctx.arc(
      width * 0.78,
      height * 0.18,
      48,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      "rgba(225,240,255,0.95)";

    ctx.shadowColor =
      "rgba(170,210,255,0.5)";

    ctx.shadowBlur = 35;

    ctx.fill();

    ctx.shadowBlur = 0;

    /* Mountains */

    const mountainLayers = [
      {
        offset: 0.1,
        height: 0.25,
        alpha: 0.18,
      },
      {
        offset: 0.35,
        height: 0.34,
        alpha: 0.23,
      },
      {
        offset: 0.6,
        height: 0.42,
        alpha: 0.28,
      },
    ];

    mountainLayers.forEach(
      (layer) => {
        ctx.beginPath();

        ctx.moveTo(
          0,
          height *
            (0.63 -
              layer.offset * 0.1)
        );

        for (
          let x = 0;
          x <= width;
          x += 70
        ) {
          const y =
            height *
              (0.63 -
                layer.height *
                  0.3) +
            Math.sin(
              (x +
                game.worldX *
                  layer.offset) *
                0.008
            ) *
              height *
              0.08;

          ctx.lineTo(
            x,
            y
          );
        }

        ctx.lineTo(
          width,
          height
        );

        ctx.lineTo(
          0,
          height
        );

        ctx.closePath();

        ctx.fillStyle =
          `rgba(10,25,38,${layer.alpha})`;

        ctx.fill();
      }
    );
  };

  /* =========================================================
     DRAW SIDE TREES
  ========================================================= */

  const drawTrees = (ctx, game, height) => {
    game.trees.forEach((tree) => {
      const x = tree.x - game.worldX;
      if (x < -120 || x > ctx.canvas.width + 120) return;
      const ground = terrainY(game, tree.x, height) + tree.yOffset;
      const scale = tree.scale;
      const sideX = x + tree.side * (55 + 18 * scale);
      const trunkH = 48 * scale;
      const crownR = 32 * scale;
      ctx.save();
      ctx.translate(sideX, ground - trunkH);
      ctx.fillStyle = "#5a351d";
      ctx.fillRect(-6 * scale, 0, 12 * scale, trunkH);
      ctx.fillStyle = "#173f29";
      ctx.beginPath();
      ctx.arc(0, -12 * scale, crownR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#23613a";
      ctx.beginPath();
      ctx.arc(-18 * scale, 3 * scale, crownR * 0.72, 0, Math.PI * 2);
      ctx.arc(18 * scale, 3 * scale, crownR * 0.72, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  };

  /* =========================================================
     DRAW TERRAIN
  ========================================================= */

  const drawTerrain = (
    ctx,
    width,
    height,
    game
  ) => {
    const points =
      game.terrain;

    if (!points.length) return;

    ctx.beginPath();

    points.forEach(
      (point, index) => {
        const screenX =
          point.x -
          game.worldX;

        if (index === 0) {
          ctx.moveTo(
            screenX,
            point.y
          );
        } else {
          ctx.lineTo(
            screenX,
            point.y
          );
        }
      }
    );

    ctx.lineTo(
      width,
      height
    );

    ctx.lineTo(
      0,
      height
    );

    ctx.closePath();

    const gradient =
      ctx.createLinearGradient(
        0,
        height * 0.55,
        0,
        height
      );

    gradient.addColorStop(
      0,
      "#1f572f"
    );

    gradient.addColorStop(
      0.25,
      "#143d25"
    );

    gradient.addColorStop(
      1,
      "#07160d"
    );

    ctx.fillStyle =
      gradient;

    ctx.fill();

    /* Grass edge */

    ctx.beginPath();

    points.forEach(
      (point, index) => {
        const screenX =
          point.x -
          game.worldX;

        if (index === 0) {
          ctx.moveTo(
            screenX,
            point.y
          );
        } else {
          ctx.lineTo(
            screenX,
            point.y
          );
        }
      }
    );

    ctx.strokeStyle =
      "#55a65b";

    ctx.lineWidth = 5;

    ctx.stroke();

    ctx.lineWidth = 1;
  };

  /* =========================================================
     DRAW COINS
  ========================================================= */

  const drawCoins = (
    ctx,
    game
  ) => {
    game.coinsItems.forEach(
      (coin) => {
        if (coin.collected) return;

        const x =
          coin.x -
          game.worldX;

        const y =
          coin.y;

        ctx.save();

        ctx.translate(
          x,
          y
        );

        ctx.rotate(
          Math.sin(
            game.time * 0.08
          ) * 0.2
        );

        ctx.beginPath();

        ctx.arc(
          0,
          0,
          coin.radius,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          "#ffd166";

        ctx.shadowColor =
          "#ffd166";

        ctx.shadowBlur = 15;

        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.fillStyle =
          "#9a6800";

        ctx.font =
          "bold 12px Arial";

        ctx.textAlign =
          "center";

        ctx.textBaseline =
          "middle";

        ctx.fillText(
          "$",
          0,
          1
        );

        ctx.restore();
      }
    );
  };

  /* =========================================================
     DRAW GEMS
  ========================================================= */

  const drawGems = (
    ctx,
    game
  ) => {
    game.gemsItems.forEach(
      (gem) => {
        if (gem.collected) return;

        const x =
          gem.x -
          game.worldX;

        const y =
          gem.y;

        ctx.save();

        ctx.translate(
          x,
          y
        );

        ctx.rotate(
          game.time * 0.04
        );

        ctx.beginPath();

        ctx.moveTo(
          0,
          -12
        );

        ctx.lineTo(
          10,
          -3
        );

        ctx.lineTo(
          6,
          10
        );

        ctx.lineTo(
          -6,
          10
        );

        ctx.lineTo(
          -10,
          -3
        );

        ctx.closePath();

        ctx.fillStyle =
          "#8be9fd";

        ctx.shadowColor =
          "#8be9fd";

        ctx.shadowBlur = 20;

        ctx.fill();

        ctx.restore();
      }
    );
  };

  /* =========================================================
     DRAW FUEL
  ========================================================= */

  const drawFuel = (
    ctx,
    game
  ) => {
    game.fuels.forEach(
      (fuel) => {
        if (fuel.collected) return;

        const x =
          fuel.x -
          game.worldX;

        const y =
          fuel.y;

        ctx.save();

        ctx.translate(
          x,
          y
        );

        ctx.fillStyle =
          "#63e6be";

        ctx.shadowColor =
          "#63e6be";

        ctx.shadowBlur = 14;

        ctx.fillRect(
          -12,
          -17,
          24,
          34
        );

        ctx.shadowBlur = 0;

        ctx.fillStyle =
          "#09291e";

        ctx.fillRect(
          -6,
          -10,
          12,
          15
        );

        ctx.fillStyle =
          "#63e6be";

        ctx.font =
          "bold 10px Arial";

        ctx.textAlign =
          "center";

        ctx.fillText(
          "F",
          0,
          1
        );

        ctx.restore();
      }
    );
  };

  /* =========================================================
     DRAW OBSTACLES
  ========================================================= */

  const drawObstacles = (
    ctx,
    game
  ) => {
    game.obstacles.forEach(
      (obstacle) => {
        if (obstacle.hit) return;

        const x =
          obstacle.x -
          game.worldX;

        const y =
          obstacle.y;

        ctx.save();

        if (
          obstacle.type ===
          "rock"
        ) {
          ctx.fillStyle =
            "#66717a";

          ctx.beginPath();

          ctx.moveTo(
            x - 20,
            y + 20
          );

          ctx.lineTo(
            x - 12,
            y - 15
          );

          ctx.lineTo(
            x + 10,
            y - 25
          );

          ctx.lineTo(
            x + 23,
            y + 20
          );

          ctx.closePath();

          ctx.fill();
        }

        if (
          obstacle.type ===
          "barrel"
        ) {
          ctx.fillStyle =
            "#8c3d25";

          ctx.fillRect(
            x - 18,
            y - 24,
            36,
            30
          );

          ctx.strokeStyle =
            "#e07045";

          ctx.lineWidth = 3;

          ctx.strokeRect(
            x - 18,
            y - 24,
            36,
            30
          );
        }

        if (
          obstacle.type ===
          "spike"
        ) {
          ctx.fillStyle =
            "#e5e7eb";

          for (
            let i = 0;
            i < 5;
            i++
          ) {
            const sx =
              x -
              25 +
              i * 12;

            ctx.beginPath();

            ctx.moveTo(
              sx,
              y + 4
            );

            ctx.lineTo(
              sx + 6,
              y - 22
            );

            ctx.lineTo(
              sx + 12,
              y + 4
            );

            ctx.closePath();

            ctx.fill();
          }
        }

        ctx.restore();
      }
    );
  };

  /* =========================================================
     DRAW NINJA BIKE
  ========================================================= */

  const drawBike = (
    ctx,
    game
  ) => {
    const bike = game.bike;

    ctx.save();
    ctx.translate(bike.x, bike.y);
    ctx.rotate(bike.angle);

    /* Soft shadow */
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.scale(1, 0.28);
    ctx.fillStyle = "#071018";
    ctx.beginPath();
    ctx.ellipse(0, 63, 66, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* Bike wheels */
    [-42, 42].forEach((wheelX) => {
      ctx.save();
      ctx.translate(wheelX, 15);

      const tire = ctx.createRadialGradient(0, 0, 4, 0, 0, 21);
      tire.addColorStop(0, "#59636d");
      tire.addColorStop(0.28, "#1a2028");
      tire.addColorStop(0.72, "#080b10");
      tire.addColorStop(1, "#000000");

      ctx.fillStyle = tire;
      ctx.beginPath();
      ctx.arc(0, 0, 21, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#89939d";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.strokeStyle = "#c6d0d8";
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 5, Math.sin(a) * 5);
        ctx.lineTo(Math.cos(a) * 15, Math.sin(a) * 15);
        ctx.stroke();
      }

      ctx.fillStyle = "#ff405d";
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    /* Suspension */
    ctx.strokeStyle = "#d5dbe0";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-35, 7);
    ctx.lineTo(-10, -20);
    ctx.lineTo(35, 7);
    ctx.stroke();

    ctx.strokeStyle = "#ff405d";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10, -20);
    ctx.lineTo(3, 4);
    ctx.lineTo(35, 7);
    ctx.stroke();

    /* Premium bike body */
    const body = ctx.createLinearGradient(-25, -30, 28, -2);
    body.addColorStop(0, "#ff637b");
    body.addColorStop(0.45, "#e51f48");
    body.addColorStop(1, "#7f102d");

    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-24, -28);
    ctx.quadraticCurveTo(-5, -37, 20, -27);
    ctx.lineTo(29, -11);
    ctx.lineTo(5, -6);
    ctx.lineTo(-27, -11);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#0b1119";
    ctx.beginPath();
    ctx.roundRect(-14, -34, 29, 9, 4);
    ctx.fill();

    /* Front fork + handle */
    ctx.strokeStyle = "#b9c2cb";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(17, -12);
    ctx.lineTo(38, 9);
    ctx.stroke();

    ctx.strokeStyle = "#10151c";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(24, -25);
    ctx.lineTo(42, -29);
    ctx.stroke();

    /* Head lamp */
    ctx.fillStyle = "#f8fafc";
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(29, -14, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    /* Rider legs */
    ctx.strokeStyle = "#080c12";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(-13, -34);
    ctx.lineTo(-26, -2);
    ctx.lineTo(-10, 10);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(10, -34);
    ctx.lineTo(23, -2);
    ctx.lineTo(11, 10);
    ctx.stroke();

    ctx.fillStyle = "#2f3a46";
    ctx.fillRect(-16, 7, 13, 7);
    ctx.fillRect(7, 7, 13, 7);

    /* Rider torso */
    const suit = ctx.createLinearGradient(-20, -70, 20, -18);
    suit.addColorStop(0, "#273244");
    suit.addColorStop(1, "#080d15");

    ctx.fillStyle = suit;
    ctx.beginPath();
    ctx.roundRect(-21, -67, 42, 39, 11);
    ctx.fill();

    /* Chest armor */
    ctx.fillStyle = "#344154";
    ctx.beginPath();
    ctx.roundRect(-12, -57, 24, 19, 7);
    ctx.fill();

    ctx.strokeStyle = "#63e6be";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -54);
    ctx.lineTo(0, -40);
    ctx.stroke();

    /* Arms to handlebars */
    ctx.strokeStyle = "#111823";
    ctx.lineWidth = 9;

    ctx.beginPath();
    ctx.moveTo(-14, -54);
    ctx.lineTo(-29, -31);
    ctx.lineTo(-42, -26);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(14, -54);
    ctx.lineTo(28, -32);
    ctx.lineTo(42, -29);
    ctx.stroke();

    /* Gloves */
    ctx.fillStyle = "#dbe4eb";
    ctx.beginPath();
    ctx.arc(-43, -26, 5, 0, Math.PI * 2);
    ctx.arc(43, -29, 5, 0, Math.PI * 2);
    ctx.fill();

    /* Scarf */
    ctx.fillStyle = "#ff405d";
    ctx.beginPath();
    ctx.moveTo(-5, -68);
    ctx.quadraticCurveTo(-37, -76, -70, -51);
    ctx.quadraticCurveTo(-42, -42, -20, -48);
    ctx.lineTo(5, -57);
    ctx.closePath();
    ctx.fill();

    /* Head */
    const head = ctx.createRadialGradient(-5, -80, 2, 0, -78, 22);
    head.addColorStop(0, "#f0b18d");
    head.addColorStop(0.8, "#b96748");
    head.addColorStop(1, "#733b2d");
    ctx.fillStyle = head;
    ctx.beginPath();
    ctx.arc(0, -78, 19, 0, Math.PI * 2);
    ctx.fill();

    /* Helmet */
    const helmet = ctx.createLinearGradient(-22, -101, 22, -78);
    helmet.addColorStop(0, "#3d4b5e");
    helmet.addColorStop(0.5, "#101720");
    helmet.addColorStop(1, "#05080d");
    ctx.fillStyle = helmet;
    ctx.beginPath();
    ctx.arc(0, -82, 22, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ff405d";
    ctx.fillRect(-20, -78, 40, 6);

    /* Visor */
    ctx.fillStyle = "#08131b";
    ctx.beginPath();
    ctx.roundRect(-15, -84, 30, 9, 4);
    ctx.fill();

    ctx.fillStyle = "#63e6be";
    ctx.fillRect(-10, -81, 7, 3);
    ctx.fillRect(3, -81, 7, 3);

    /* Helmet damage indicator */
    if (game.headDamage > 0) {
      ctx.strokeStyle = `rgba(255,107,107,${0.25 + game.headDamage / 160})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-8, -95);
      ctx.lineTo(-2, -88);
      ctx.lineTo(3, -96);
      ctx.stroke();
    }

    /* Nitro */
    if (keysRef.current.nitro) {
      ctx.shadowColor = "#63e6be";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "#63e6be";
      ctx.beginPath();
      ctx.moveTo(-55, 6);
      ctx.lineTo(-86, 14);
      ctx.lineTo(-58, 21);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  };

  /* =========================================================
     DRAW PARTICLES
  ========================================================= */

  const drawParticles = (
    ctx,
    game
  ) => {
    game.particles.forEach(
      (particle) => {
        ctx.save();

        ctx.globalAlpha =
          particle.life;

        ctx.fillStyle =
          particle.color;

        ctx.beginPath();

        ctx.arc(
          particle.x -
            game.worldX,
          particle.y,
          particle.size,
          0,
          Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
      }
    );
  };

  /* =========================================================
     RENDER
  ========================================================= */

  const renderGame = () => {
    const canvas =
      canvasRef.current;

    const game =
      gameRef.current;

    if (!canvas || !game) {
      return;
    }

    const ctx =
      canvas.getContext(
        "2d"
      );

    const rect =
      canvas.getBoundingClientRect();

    const dpr =
      window.devicePixelRatio ||
      1;

    const width =
      rect.width;

    const height =
      rect.height;

    canvas.width =
      width * dpr;

    canvas.height =
      height * dpr;

    ctx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );

    ctx.clearRect(
      0,
      0,
      width,
      height
    );

    drawBackground(
      ctx,
      width,
      height,
      game
    );

    drawTrees(ctx, game, height);

    drawTerrain(
      ctx,
      width,
      height,
      game
    );

    drawCoins(
      ctx,
      game
    );

    drawGems(
      ctx,
      game
    );

    drawFuel(
      ctx,
      game
    );

    drawObstacles(
      ctx,
      game
    );

    drawParticles(
      ctx,
      game
    );

    drawBike(
      ctx,
      game
    );
  };

  /* =========================================================
     GAME LOOP
  ========================================================= */

  useEffect(() => {
    if (screen !== "game") {
      return;
    }

    const canvas =
      canvasRef.current;

    if (!canvas) return;

    let lastTime =
      performance.now();

    const loop = (
      currentTime
    ) => {
      const dt = Math.min(
        32,
        currentTime -
          lastTime
      );

      lastTime =
        currentTime;

      const game =
        gameRef.current;

      if (
        game &&
        game.running
      ) {
        const rect =
          canvas.getBoundingClientRect();

        updateGame(
          game,
          dt / 16.67,
          rect.width,
          rect.height
        );

        setHud({
          distance:
            Math.floor(
              game.distance
            ),

          coins:
            game.coins,

          gems:
            game.gems,

          fuel:
            Math.round(
              game.fuel
            ),

          nitro:
            Math.round(
              game.nitro
            ),

          score:
            Math.floor(
              game.score
            ),

          combo:
            Number(
              game.combo.toFixed(
                1
              )
            ),

          headDamage:
            Math.round(game.headDamage),

          running:
            Math.max(0, game.time / 60),

          performance:
            Math.round(clamp(
              game.distance * 0.12 +
              game.coins * 3.5 +
              game.gems * 6 +
              game.maxSpeedReached * 4 +
              game.airTime * 2,
              0,
              100
            )),

          mission:
            Math.min(
              game.mission.progress,
              game.mission.target
            ),

          message:
            game.mission.completed
              ? "MISSION COMPLETE!"
              : "",
        });

        renderGame();
      }

      animationRef.current =
        requestAnimationFrame(
          loop
        );
    };

    animationRef.current =
      requestAnimationFrame(
        loop
      );

    return () => {
      cancelAnimationFrame(
        animationRef.current
      );
    };
  }, [
    screen,
    mode,
    level,
    progress,
  ]);

  /* =========================================================
     KEYBOARD
  ========================================================= */

  /*
 * KEYBOARD CONTROLS
 */
useEffect(() => {
  const handleKeyDown = (event) => {
    const key = event.key.toLowerCase();

    /*
     * SPACE ko explicitly detect karo.
     * event.code browser me zyada reliable hai.
     */
    if (event.code === "Space") {
      keysRef.current[" "] = true;
      event.preventDefault();
    } else {
      keysRef.current[key] = true;
    }

    /*
     * Arrow keys / W / A / D
     */
    if (
      [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "a",
        "d",
        "w",
      ].includes(event.key)
    ) {
      event.preventDefault();
    }

    /*
     * PAUSE
     */
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

    /*
     * RESTART
     */
  if (key === "r") {
  if (screen !== "game") {
    return;
  }

  startGame(mode, level);
}
  };

  const handleKeyUp = (event) => {
    const key = event.key.toLowerCase();

    if (event.code === "Space") {
      keysRef.current[" "] = false;
    } else {
      keysRef.current[key] = false;
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
  screen,
  mode,
  level,
]);

  /* =========================================================
     TOUCH CONTROL
  ========================================================= */

  const controlStart = (
    action
  ) => {
    keysRef.current[
      action
    ] = true;
  };

  const controlEnd = (
    action
  ) => {
    keysRef.current[
      action
    ] = false;
  };

  /* =========================================================
     UPGRADE
  ========================================================= */

  const upgradeBike = (
    type
  ) => {
    const current =
      progress.bike[type] ||
      1;

    const price =
      current * 150;

    if (
      progress.coins <
      price
    ) {
      return;
    }

    const next = {
      ...progress,
      coins:
        progress.coins -
        price,

      bike: {
        ...progress.bike,
        [type]:
          current + 1,
      },
    };

    setProgress(
      next
    );

    saveProgress(
      next
    );
  };

  /* =========================================================
     GAME OVER ACTION
  ========================================================= */

  const retry = () => {
    startGame(
      mode,
      level
    );
  };

  const nextLevel = () => {
    const nextLevelValue =
      Math.min(
        progress.unlockedLevel,
        level + 1
      );

    setLevel(
      nextLevelValue
    );

    setScreen(
      "menu"
    );
  };

  /* =========================================================
     MENU
  ========================================================= */

  if (screen === "menu") {
    return (
      <div className="ninja-hill-game">

        <div className="ninja-topbar">

          <div>
            <span className="game-kicker">
              NINJA MOTOR ADVENTURE
            </span>

            <h1>
              NINJA HILL RIDE
            </h1>
          </div>

          <div className="top-actions">
            <button
              type="button"
              title="Coins"
            >
              🪙
              {progress.coins}
            </button>

            <button
              type="button"
              title="Gems"
            >
              💎
              {progress.gems}
            </button>

            <button
              type="button"
              className="sound-toggle"
              title={soundEnabled ? "Sound ON" : "Sound OFF"}
              onClick={toggleSound}
            >
              {soundEnabled ? "🔊 ON" : "🔇 OFF"}
            </button>
          </div>

        </div>

        <div className="ninja-canvas-wrap">

          <div className="game-overlay">

            <div className="menu-panel">

              <div className="ninja-emblem">
                🥷
              </div>

              <span>
                RIDE • JUMP • SURVIVE
              </span>

              <h2>
                NINJA
                <strong>
                  HILL RIDE
                </strong>
              </h2>

              <p>
                Master dangerous hills,
                collect coins, control your
                ninja bike and unlock new
                levels.
              </p>

              <div className="menu-stats">

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
                    RUNNING
                  </small>

                  <strong>
                    {Math.floor(hud.running)}s
                  </strong>
                </div>

                <div>
                  <small>
                    PERFORMANCE
                  </small>

                  <strong>
                    {hud.performance}%
                  </strong>
                </div>

                <div>
                  <small>
                    HEAD
                  </small>

                  <strong>
                    {hud.headDamage}%
                  </strong>
                </div>

                <div>
                  <small>
                    UNLOCKED
                  </small>

                  <strong>
                    {progress.unlockedLevel}
                  </strong>
                </div>

                <div>
                  <small>
                    BEST
                  </small>

                  <strong>
                    {progress.bestDistance}m
                  </strong>
                </div>

              </div>

              <div className="mode-selector">

                {Object.entries(
                  MODES
                ).map(
                  ([key, value]) => (
                    <button
                      key={key}
                      type="button"
                      className={
                        mode === key
                          ? "mode-active"
                          : ""
                      }
                      onClick={() =>
                        setMode(key)
                      }
                    >
                      {value.name}
                    </button>
                  )
                )}

              </div>

              <div className="level-selector">

                <small>
                  SELECT LEVEL
                </small>

                <div>
                  {Array.from(
                    {
                      length: Math.min(
                        12,
                        progress.unlockedLevel
                      ),
                    },
                    (_, index) => {
                      const value =
                        index + 1;

                      return (
                        <button
                          key={value}
                          type="button"
                          className={
                            level === value
                              ? "level-active"
                              : ""
                          }
                          onClick={() =>
                            setLevel(
                              value
                            )
                          }
                        >
                          {value}
                        </button>
                      );
                    }
                  )}
                </div>

              </div>

              <button
                className="play-button"
                type="button"
                onClick={() =>
                  startGame(
                    mode,
                    level
                  )
                }
              >
                <span>
                  START RIDE
                </span>

                →
              </button>

              <div className="control-info">
                <span>
                  ← → MOVE
                </span>

                <span>
                  SPACE JUMP
                </span>

                <span>
                  SHIFT NITRO
                </span>

                <span>
                  E SLASH
                </span>
              </div>

            </div>

          </div>

        </div>

        <div className="upgrade-panel">

          <h3>
            BIKE UPGRADES
          </h3>

          <div className="upgrade-grid">

            {[
              [
                "engine",
                "⚙️",
                "ENGINE",
              ],
              [
                "tires",
                "🛞",
                "TIRES",
              ],
              [
                "fuel",
                "⛽",
                "FUEL",
              ],
              [
                "armor",
                "🛡️",
                "ARMOR",
              ],
              [
                "nitro",
                "🚀",
                "NITRO",
              ],
            ].map(
              ([
                key,
                icon,
                name,
              ]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    upgradeBike(
                      key
                    )
                  }
                >
                  <span>
                    {icon}
                  </span>

                  <strong>
                    {name}
                  </strong>

                  <small>
                    LVL{" "}
                    {
                      progress
                        .bike[key]
                    }
                  </small>

                  <em>
                    🪙{" "}
                    {
                      progress
                        .bike[key] *
                      150
                    }
                  </em>
                </button>
              )
            )}

          </div>

        </div>

      </div>
    );
  }

  /* =========================================================
     PAUSE
  ========================================================= */

  if (screen === "pause") {
    return (
      <div className="ninja-hill-game">

        <div className="ninja-canvas-wrap">

          <div className="game-overlay">

            <div className="pause-panel">

              <div className="pause-icon">
                II
              </div>

              <span>
                NINJA HILL RIDE
              </span>

              <h2>
                GAME
                <strong>
                  PAUSED
                </strong>
              </h2>

              <button
                className="play-button"
                type="button"
                onClick={() =>
                  setScreen(
                    "game"
                  )
                }
              >
                <span>
                  CONTINUE
                </span>

                →
              </button>

              <button
                className="ghost-button sound-toggle-large"
                type="button"
                onClick={toggleSound}
              >
                {soundEnabled ? "🔊 SOUND ON" : "🔇 SOUND OFF"}
              </button>

              <button
                className="ghost-button"
                type="button"
                onClick={() =>
                  setScreen(
                    "menu"
                  )
                }
              >
                EXIT TO MENU
              </button>

            </div>

          </div>

        </div>

      </div>
    );
  }

  /* =========================================================
     GAME OVER
  ========================================================= */

  if (
    screen ===
    "gameover"
  ) {
    const missionComplete =
      gameRef.current
        ?.mission
        ?.completed;

    return (
      <div className="ninja-hill-game">

        <div className="ninja-canvas-wrap">

          <div className="game-overlay">

            <div className="pause-panel">

              <div className="crash-icon">
                {missionComplete ? "🏆" : "⛽"}
              </div>

              <span>
                {missionComplete
                  ? "MISSION COMPLETE"
                  : "FUEL EMPTY"}
              </span>

              <h2>
                {missionComplete ? "LEVEL" : "GAME"}
                <strong>
                  {missionComplete ? "CLEAR" : "OVER"}
                </strong>
              </h2>

              <div className="final-stats">

                <div>
                  <small>
                    DISTANCE
                  </small>

                  <strong>
                    {hud.distance}m
                  </strong>
                </div>

                <div>
                  <small>
                    SCORE
                  </small>

                  <strong>
                    {hud.score}
                  </strong>
                </div>

                <div>
                  <small>
                    COINS
                  </small>

                  <strong>
                    +{hud.coins}
                  </strong>
                </div>

                <div>
                  <small>
                    GEMS
                  </small>

                  <strong>
                    +{hud.gems}
                  </strong>
                </div>

                <div>
                  <small>
                    MODE
                  </small>

                  <strong>
                    {MODES[
                      mode
                    ].name}
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

              </div>

              <button
                className="play-button"
                type="button"
                onClick={
                  retry
                }
              >
                <span>
                  RIDE AGAIN
                </span>

                ↻
              </button>

              {missionComplete &&
                level <
                  progress.unlockedLevel && (
                  <button
                    className="play-button"
                    type="button"
                    onClick={
                      nextLevel
                    }
                  >
                    <span>
                      NEXT LEVEL
                    </span>

                    →
                  </button>
                )}

              <button
                className="ghost-button"
                type="button"
                onClick={() =>
                  setScreen(
                    "menu"
                  )
                }
              >
                BACK TO MENU
              </button>

            </div>

          </div>

        </div>

      </div>
    );
  }

  /* =========================================================
     MAIN GAME
  ========================================================= */

  const game =
    gameRef.current;

  const missionTarget =
    game?.mission?.target ||
    1;

  const missionProgress =
    Math.min(
      hud.mission,
      missionTarget
    );

  const missionPercent =
    Math.round(
      (missionProgress /
        missionTarget) *
        100
    );

  return (
    <div className="ninja-hill-game">

      <div className="ninja-topbar">

        <div>
          <span className="game-kicker">
            {MODES[
              mode
            ].name}{" "}
            • LEVEL {level}
          </span>

          <h1>
            NINJA HILL RIDE
          </h1>
        </div>

        <div className="top-actions">

          <button
            type="button"
            onClick={() =>
              setScreen(
                "pause"
              )
            }
          >
            II
          </button>

          <button
            type="button"
            className="sound-toggle"
            title={soundEnabled ? "Sound ON" : "Sound OFF"}
            onClick={toggleSound}
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>

        </div>

      </div>

      <div className="ninja-hud">

        <div className="hud-card">
          <small>
            DISTANCE
          </small>

          <strong>
            {hud.distance}m
          </strong>
        </div>

        <div className="hud-card">
          <small>
            SCORE
          </small>

          <strong>
            {hud.score}
          </strong>
        </div>

        <div className="hud-card">
          <small>
            COINS
          </small>

          <strong>
            🪙 {hud.coins}
          </strong>
        </div>

        <div className="hud-card">
          <small>
            GEMS
          </small>

          <strong>
            💎 {hud.gems}
          </strong>
        </div>

        <div className="hud-card">

          <small>
            FUEL
          </small>

          <strong>
            {hud.fuel}%
          </strong>

          <div className="hud-bar">
            <span
              style={{
                width: `${clamp(
                  hud.fuel,
                  0,
                  100
                )}%`,
              }}
            />
          </div>

        </div>

        <div className="hud-card">

          <small>
            NITRO
          </small>

          <strong>
            {hud.nitro}%
          </strong>

          <div className="hud-bar">
            <span
              style={{
                width: `${clamp(
                  hud.nitro,
                  0,
                  100
                )}%`,
              }}
            />
          </div>

        </div>

        <div className="hud-card">

          <small>
            COMBO
          </small>

          <strong>
            x{hud.combo}
          </strong>

        </div>

        <div className="hud-card head-damage-card">

          <small>
            HELMET
          </small>

          <strong>
            {hud.headDamage}%
          </strong>

          <div className="hud-bar head-bar">
            <span
              style={{
                width: `${clamp(hud.headDamage, 0, 100)}%`,
              }}
            />
          </div>

        </div>

      </div>

      <div className="ninja-canvas-wrap">

        <canvas
          ref={canvasRef}
          className="ninja-canvas"
        />

        {coinFlyEffects.map((coin) => {
          const canvas = canvasRef.current;
          const width = canvas?.clientWidth || window.innerWidth;
          const targetX = Math.min(270, Math.max(90, width * 0.28));
          const targetY = 28;

          return (
            <span
              key={coin.id}
              className="coin-fly-effect"
              style={{
                left: `${coin.x}px`,
                top: `${coin.y}px`,
                "--coin-tx": `${targetX - coin.x}px`,
                "--coin-ty": `${targetY - coin.y}px`,
              }}
              onAnimationEnd={() => {
                setCoinFlyEffects((prev) =>
                  prev.filter((item) => item.id !== coin.id)
                );
              }}
            >
              🪙
            </span>
          );
        })}

        {hud.message && (
          <div className="game-message">
            {hud.message}
          </div>
        )}

        <div className="mission-display">

          <div>
            <small>
              MISSION
            </small>

            <strong>
              {game?.mission?.type ===
              "distance"
                ? `TRAVEL ${missionTarget}M`
                : game?.mission?.type ===
                    "coins"
                  ? `COLLECT ${missionTarget} COINS`
                  : `PERFORM ${missionTarget} FLIPS`}
            </strong>
          </div>

          <div className="mission-progress">

            <span
              style={{
                width: `${missionPercent}%`,
              }}
            />

          </div>

          <small>
            {Math.floor(
              missionProgress
            )}{" "}
            /{" "}
            {missionTarget}
          </small>

        </div>

        <div className="mobile-controls">

          <button
            type="button"
            className="control-btn brake"
            onPointerDown={() =>
              controlStart(
                "left"
              )
            }
            onPointerUp={() =>
              controlEnd(
                "left"
              )
            }
            onPointerLeave={() =>
              controlEnd(
                "left"
              )
            }
          >
            ←
          </button>

          <button
            type="button"
            className="control-btn jump"
            onPointerDown={() =>
              controlStart(
                "jump"
              )
            }
            onPointerUp={() =>
              controlEnd(
                "jump"
              )
            }
            onPointerLeave={() =>
              controlEnd(
                "jump"
              )
            }
          >
            ↑
          </button>

          <button
            type="button"
            className="control-btn gas"
            onPointerDown={() =>
              controlStart(
                "right"
              )
            }
            onPointerUp={() =>
              controlEnd(
                "right"
              )
            }
            onPointerLeave={() =>
              controlEnd(
                "right"
              )
            }
          >
            →
          </button>

          <button
            type="button"
            className="control-btn"
            onPointerDown={() =>
              controlStart(
                "nitro"
              )
            }
            onPointerUp={() =>
              controlEnd(
                "nitro"
              )
            }
            onPointerLeave={() =>
              controlEnd(
                "nitro"
              )
            }
          >
            🚀
          </button>

        </div>

      </div>

    </div>
  );
}

export default NinjaHillRide;