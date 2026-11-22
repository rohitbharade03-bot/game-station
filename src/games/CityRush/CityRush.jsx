import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "./CityRush.css";
import Police from "./components/Police";

import {
  getPoliceCount,
  createPolice,
  movePolice,
  policeHitsPlayer,
} from "./systems/policeSystem";

/* =========================================================
   WORLD
========================================================= */

const WORLD = {
  width: 1800,
  height: 1200,
};

const START = {
  player: {
    x: 250,
    y: 930,
  },

  car: {
    x: 350,
    y: 900,
    angle: 0,
    speed: 0,
  },
};

/* =========================================================
   BUILDINGS
========================================================= */

const BUILDINGS = [
  { x: 150, y: 140, w: 280, h: 170 },
  { x: 570, y: 140, w: 240, h: 170 },
  { x: 950, y: 140, w: 260, h: 170 },
  { x: 1350, y: 140, w: 270, h: 170 },

  { x: 150, y: 480, w: 230, h: 170 },
  { x: 550, y: 480, w: 260, h: 170 },
  { x: 950, y: 480, w: 250, h: 170 },
  { x: 1350, y: 480, w: 270, h: 170 },

  { x: 150, y: 800, w: 280, h: 160 },
  { x: 570, y: 800, w: 240, h: 160 },
  { x: 950, y: 800, w: 260, h: 160 },
  { x: 1350, y: 800, w: 270, h: 160 },
];

/* =========================================================
   ROADS
========================================================= */

const ROADS = [
  { x: 100, y: 340, w: 1600, h: 120 },
  { x: 100, y: 690, w: 1600, h: 100 },

  { x: 430, y: 100, w: 110, h: 1000 },
  { x: 810, y: 100, w: 110, h: 1000 },
  { x: 1210, y: 100, w: 110, h: 1000 },
];

/* =========================================================
   NPC
========================================================= */

const NPC_START = [
  {
    id: 1,
    x: 650,
    y: 395,
    color: "#ffb36b",
  },

  {
    id: 2,
    x: 1040,
    y: 395,
    color: "#65b9ff",
  },

  {
    id: 3,
    x: 1450,
    y: 740,
    color: "#e68cff",
  },

  {
    id: 4,
    x: 720,
    y: 740,
    color: "#6ee7a5",
  },
];

/* =========================================================
   TRAFFIC
========================================================= */

const TRAFFIC_START = [
  {
    id: 1,
    x: 250,
    y: 395,
    angle: 0,
    speed: 1.8,
    color: "#f04444",
  },

  {
    id: 2,
    x: 1050,
    y: 395,
    angle: 0,
    speed: 1.5,
    color: "#36a3ff",
  },

  {
    id: 3,
    x: 1450,
    y: 740,
    angle: 0,
    speed: 1.7,
    color: "#ffc928",
  },

  {
    id: 4,
    x: 650,
    y: 740,
    angle: 0,
    speed: 1.4,
    color: "#b56cff",
  },
];

/* =========================================================
   MISSIONS
========================================================= */

const MISSIONS = [
  {
    id: 1,
    title: "FIRST RIDE",
    description:
      "Get into your car and reach the blue destination.",

    reward: 100,

    start: {
      x: 350,
      y: 900,
    },

    destination: {
      x: 1500,
      y: 395,
    },
  },

  {
    id: 2,
    title: "PACKAGE RUN",
    description:
      "Pick up the package and deliver it before the timer ends.",

    reward: 250,

    pickup: {
      x: 260,
      y: 395,
    },

    destination: {
      x: 1500,
      y: 740,
    },

    time: 55,
  },

  {
    id: 3,
    title: "POLICE ESCAPE",
    description:
      "Escape the police and reach the green safe zone.",

    reward: 400,

    destination: {
      x: 1500,
      y: 395,
    },

    time: 60,
  },
];

/* =========================================================
   HELPERS
========================================================= */

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function circleRectCollision(
  cx,
  cy,
  radius,
  rect
) {
  const nearestX = clamp(
    cx,
    rect.x,
    rect.x + rect.w
  );

  const nearestY = clamp(
    cy,
    rect.y,
    rect.y + rect.h
  );

  const dx = cx - nearestX;
  const dy = cy - nearestY;

  return (
    dx * dx + dy * dy <
    radius * radius
  );
}

function blocked(
  x,
  y,
  radius = 18
) {
  if (
    x < 135 ||
    x > WORLD.width - 135 ||
    y < 135 ||
    y > WORLD.height - 135
  ) {
    return true;
  }

  return BUILDINGS.some((building) =>
    circleRectCollision(
      x,
      y,
      radius,
      building
    )
  );
}

function getSavedNumber(
  key,
  fallback = 0
) {
  try {
    const value = Number(
      localStorage.getItem(key)
    );

    return Number.isFinite(value)
      ? value
      : fallback;
  } catch {
    return fallback;
  }
}

/* =========================================================
   COMPONENT
========================================================= */

function CityRush() {
  /* =======================================================
     REFS
  ======================================================= */

  const gameRef = useRef(null);

  /*
   * IMPORTANT:
   * Keyboard state is kept in a ref.
   * This prevents W/A/S/D from causing React
   * re-render loops.
   */
  const [keys, setKeys] = useState({});

  const keysRef = useRef({});

  const damageCooldownRef =
    useRef(false);

  const collisionCooldownRef =
    useRef(false);

  const lastFrameRef =
    useRef(performance.now());

  /* =======================================================
     SAVE KEY
  ======================================================= */

  const SAVE_KEY = "cityRushSave";

  /* =======================================================
     STATE
  ======================================================= */

  const [player, setPlayer] =
    useState(START.player);

  const [car, setCar] =
    useState(START.car);

  const [inCar, setInCar] =
    useState(false);

  const [money, setMoney] =
    useState(() =>
      getSavedNumber(
        "cityRushMoney",
        0
      )
    );

  const [unlockedMission, setUnlockedMission] =
    useState(() =>
      Math.max(
        1,
        getSavedNumber(
          "cityRushMission",
          1
        )
      )
    );

  const [missionIndex, setMissionIndex] =
    useState(() =>
      clamp(
        getSavedNumber(
          "cityRushCurrentMission",
          0
        ),
        0,
        MISSIONS.length - 1
      )
    );

  const [missionActive, setMissionActive] =
    useState(false);

  const [missionComplete, setMissionComplete] =
    useState(false);

  const [packageCollected, setPackageCollected] =
    useState(false);

  const [timeLeft, setTimeLeft] =
    useState(0);

  const [health, setHealth] =
    useState(100);

  const [wanted, setWanted] =
    useState(0);

  const [police, setPolice] =
    useState([]);

  const [message, setMessage] =
    useState(
      "Walk to the car and press E."
    );

  const [traffic, setTraffic] =
    useState(TRAFFIC_START);

  const [npcs, setNpcs] =
    useState(NPC_START);

  const [camera, setCamera] =
    useState({
      x: 0,
      y: 0,
    });

  const [showMission, setShowMission] =
    useState(true);

  const [soundOn, setSoundOn] =
    useState(true);

  const [gameOver, setGameOver] =
    useState(false);

  const [hasSavedGame, setHasSavedGame] =
    useState(() =>
      Boolean(
        localStorage.getItem(
          SAVE_KEY
        )
      )
    );

  /* =======================================================
     CURRENT MISSION
  ======================================================= */

  const mission =
    MISSIONS[missionIndex] ||
    MISSIONS[0];

  /* =======================================================
     DAMAGE
  ======================================================= */

  const applyDamage = useCallback(
    (amount, text) => {
      if (
        gameOver ||
        damageCooldownRef.current
      ) {
        return;
      }

      damageCooldownRef.current =
        true;

      setHealth((value) =>
        clamp(
          value - amount,
          0,
          100
        )
      );

      if (text) {
        setMessage(text);
      }

      window.setTimeout(() => {
        damageCooldownRef.current =
          false;
      }, 500);
    },
    [gameOver]
  );

  /* =======================================================
     SAVE GAME
  ======================================================= */

  const saveGame = useCallback(() => {
    const saveData = {
      missionIndex,
      missionActive,
      missionComplete,
      packageCollected,
      player,
      car,
      inCar,
      health,
      wanted,
      money,
      unlockedMission,
      timeLeft,
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify(saveData)
      );

      localStorage.setItem(
        "cityRushMoney",
        String(money)
      );

      localStorage.setItem(
        "cityRushMission",
        String(unlockedMission)
      );

      localStorage.setItem(
        "cityRushCurrentMission",
        String(missionIndex)
      );

      setHasSavedGame(true);
    } catch (error) {
      console.error(
        "City Rush save error:",
        error
      );
    }
  }, [
    missionIndex,
    missionActive,
    missionComplete,
    packageCollected,
    player,
    car,
    inCar,
    health,
    wanted,
    money,
    unlockedMission,
    timeLeft,
  ]);

  /* =======================================================
     LOAD GAME
  ======================================================= */

  const loadGame = useCallback(() => {
    try {
      const raw =
        localStorage.getItem(
          SAVE_KEY
        );

      if (!raw) {
        return false;
      }

      const data =
        JSON.parse(raw);

      if (
        !data ||
        typeof data !== "object"
      ) {
        return false;
      }

      if (
        Number.isInteger(
          data.missionIndex
        )
      ) {
        setMissionIndex(
          clamp(
            data.missionIndex,
            0,
            MISSIONS.length - 1
          )
        );
      }

      if (
        Number.isInteger(
          data.unlockedMission
        )
      ) {
        setUnlockedMission(
          clamp(
            data.unlockedMission,
            1,
            MISSIONS.length
          )
        );
      }

      if (data.player) {
        setPlayer(data.player);
      }

      if (data.car) {
        setCar(data.car);
      }

      if (
        typeof data.inCar ===
        "boolean"
      ) {
        setInCar(data.inCar);
      }

      if (
        typeof data.health ===
        "number"
      ) {
        setHealth(
          clamp(
            data.health,
            0,
            100
          )
        );
      }

      if (
        typeof data.wanted ===
        "number"
      ) {
        setWanted(
          clamp(
            data.wanted,
            0,
            5
          )
        );
      }

      if (
        typeof data.money ===
        "number"
      ) {
        setMoney(
          Math.max(
            0,
            data.money
          )
        );
      }

      if (
        typeof data.missionActive ===
        "boolean"
      ) {
        setMissionActive(
          data.missionActive
        );
      }

      if (
        typeof data.missionComplete ===
        "boolean"
      ) {
        setMissionComplete(
          data.missionComplete
        );
      }

      if (
        typeof data.packageCollected ===
        "boolean"
      ) {
        setPackageCollected(
          data.packageCollected
        );
      }

      if (
        typeof data.timeLeft ===
        "number"
      ) {
        setTimeLeft(
          Math.max(
            0,
            data.timeLeft
          )
        );
      }

      setGameOver(false);
      setMessage(
        "▶ Continued from last save."
      );

      return true;
    } catch (error) {
      console.error(
        "City Rush load error:",
        error
      );

      return false;
    }
  }, []);

  /* =======================================================
     START MISSION
  ======================================================= */

  const startMission = useCallback(() => {
    if (gameOver) {
      return;
    }

    setMissionComplete(false);
    setMissionActive(true);
    setPackageCollected(false);

    if (mission.id === 1) {
      setMessage(
        "FIRST RIDE started. Reach the blue marker."
      );
    }

    if (mission.id === 2) {
      setTimeLeft(
        mission.time || 55
      );

      setMessage(
        "PACKAGE RUN started. Pick up the package."
      );
    }

    if (mission.id === 3) {
      setWanted(2);

      setTimeLeft(
        mission.time || 60
      );

      setMessage(
        "🚨 ESCAPE! Lose the police and reach the safe zone!"
      );
    }
  }, [
    gameOver,
    mission,
  ]);

  /* =======================================================
     COMPLETE MISSION
  ======================================================= */

  const completeMission =
    useCallback(() => {
      if (
        missionComplete ||
        gameOver
      ) {
        return;
      }

      setMissionComplete(true);
      setMissionActive(false);

      const reward =
        mission.reward || 0;

      const newMoney =
        money + reward;

      setMoney(newMoney);

      localStorage.setItem(
        "cityRushMoney",
        String(newMoney)
      );

      if (
        missionIndex + 1 <
        MISSIONS.length
      ) {
        const nextUnlocked =
          missionIndex + 2;

        setUnlockedMission(
          nextUnlocked
        );

        localStorage.setItem(
          "cityRushMission",
          String(
            nextUnlocked
          )
        );
      }

      setMessage(
        `MISSION COMPLETE! +$${reward}`
      );
    }, [
      missionComplete,
      gameOver,
      mission,
      money,
      missionIndex,
    ]);

  /* =======================================================
     RESET CURRENT MISSION
  ======================================================= */

  const resetCurrentMission =
    useCallback(() => {
      setPlayer(
        START.player
      );

      setCar(
        START.car
      );

      setInCar(false);

      setMissionActive(false);
      setMissionComplete(false);

      setPackageCollected(false);

      setHealth(100);
      setWanted(0);
      setTimeLeft(0);

      setPolice([]);

      setGameOver(false);

      damageCooldownRef.current =
        false;

      collisionCooldownRef.current =
        false;

      if (mission.id === 1) {
        setMessage(
          "Walk to the car and press E."
        );
      } else {
        setMessage(
          "Press START to begin the mission."
        );
      }
    }, [mission.id]);

  /* =======================================================
     NEXT MISSION
  ======================================================= */

  const nextMission =
    useCallback(() => {
      const nextIndex =
        Math.min(
          missionIndex + 1,
          MISSIONS.length - 1
        );

      if (
        nextIndex >
        unlockedMission - 1
      ) {
        return;
      }

      setMissionIndex(
        nextIndex
      );

      localStorage.setItem(
        "cityRushCurrentMission",
        String(nextIndex)
      );

      setPlayer(
        START.player
      );

      setCar(
        START.car
      );

      setInCar(false);

      setMissionActive(false);
      setMissionComplete(false);

      setPackageCollected(false);

      setHealth(100);
      setWanted(0);
      setTimeLeft(0);

      setPolice([]);

      setGameOver(false);

      setMessage(
        "New mission unlocked. Get ready."
      );
    }, [
      missionIndex,
      unlockedMission,
    ]);

  /* =======================================================
     VEHICLE ENTER / EXIT
  ======================================================= */

  const handleVehicle =
    useCallback(() => {
      if (
        gameOver ||
        missionComplete
      ) {
        return;
      }

      if (inCar) {
        setInCar(false);

        setPlayer({
          x:
            car.x +
            Math.cos(car.angle) *
              55,

          y:
            car.y +
            Math.sin(car.angle) *
              55,
        });

        setCar((previous) => ({
          ...previous,
          speed: 0,
        }));

        setMessage(
          "You left the vehicle."
        );

        return;
      }

      if (
        distance(
          player,
          car
        ) > 100
      ) {
        setMessage(
          "Move closer to the car."
        );

        return;
      }

      setInCar(true);

      if (!missionActive) {
        startMission();
      } else {
        setMessage(
          "Drive to the marked destination."
        );
      }
    }, [
      gameOver,
      missionComplete,
      inCar,
      car,
      player,
      missionActive,
      startMission,
    ]);

  /* =======================================================
     KEYBOARD
  ======================================================= */

useEffect(() => {
  const down = (e) => {
    const key = e.key.toLowerCase();

    if (
      [
        "w",
        "a",
        "s",
        "d",
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
        " ",
      ].includes(key)
    ) {
      e.preventDefault();
    }

    keysRef.current[key] = true;

    setKeys((prev) => ({
      ...prev,
      [key]: true,
    }));

    if (key === "e") {
      handleVehicle();
    }

    if (key === "escape") {
      setShowMission((v) => !v);
    }
  };

  const up = (e) => {
    const key = e.key.toLowerCase();

    keysRef.current[key] = false;

    setKeys((prev) => ({
      ...prev,
      [key]: false,
    }));
  };

  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);

  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
  };
}, []);
  /* =======================================================
     PLAYER MOVEMENT
  ======================================================= */

  const updatePlayer =
    useCallback(
      (delta) => {
        if (
          inCar ||
          gameOver ||
          missionComplete
        ) {
          return;
        }

        const keys =
          keysRef.current;

        let dx = 0;
        let dy = 0;

        if (
          keys.w ||
          keys.arrowup
        ) {
          dy -= 1;
        }

        if (
          keys.s ||
          keys.arrowdown
        ) {
          dy += 1;
        }

        if (
          keys.a ||
          keys.arrowleft
        ) {
          dx -= 1;
        }

        if (
          keys.d ||
          keys.arrowright
        ) {
          dx += 1;
        }

        if (
          dx === 0 &&
          dy === 0
        ) {
          return;
        }

        const length =
          Math.hypot(
            dx,
            dy
          );

        dx /= length;
        dy /= length;

        const speed =
          3.7 *
          Math.min(
            delta,
            2
          );

        const nextX =
          player.x +
          dx * speed;

        const nextY =
          player.y +
          dy * speed;

        if (
          !blocked(
            nextX,
            nextY,
            14
          )
        ) {
          setPlayer({
            x: nextX,
            y: nextY,
          });
        }
      },
      [
        inCar,
        gameOver,
        missionComplete,
        player,
      ]
    );

  /* =======================================================
     CAR MOVEMENT
  ======================================================= */

  const updateCar =
    useCallback(
      (delta) => {
        if (
          !inCar ||
          gameOver ||
          missionComplete
        ) {
          return;
        }

        const keys =
          keysRef.current;

        let acceleration = 0;

        if (
          keys.w ||
          keys.arrowup
        ) {
          acceleration +=
            0.18 *
            delta;
        }

        if (
          keys.s ||
          keys.arrowdown
        ) {
          acceleration -=
            0.16 *
            delta;
        }

        let nextSpeed =
          car.speed +
          acceleration;

        /*
         * Friction
         */
        nextSpeed *=
          Math.pow(
            0.94,
            delta
          );

        nextSpeed = clamp(
          nextSpeed,
          -2.5,
          7
        );

        let nextAngle =
          car.angle;

        /*
         * Steering
         */
        if (
          Math.abs(
            nextSpeed
          ) > 0.05
        ) {
          if (
            keys.a ||
            keys.arrowleft
          ) {
            nextAngle -=
              0.045 *
              delta *
              (nextSpeed >= 0
                ? 1
                : -1);
          }

          if (
            keys.d ||
            keys.arrowright
          ) {
            nextAngle +=
              0.045 *
              delta *
              (nextSpeed >= 0
                ? 1
                : -1);
          }
        }

        const nextX =
          car.x +
          Math.sin(
            nextAngle
          ) *
            nextSpeed *
            delta;

        const nextY =
          car.y -
          Math.cos(
            nextAngle
          ) *
            nextSpeed *
            delta;

        /*
         * Building collision
         */
        if (
          blocked(
            nextX,
            nextY,
            29
          )
        ) {
          setCar(
            (previous) => ({
              ...previous,
              speed:
                -previous.speed *
                0.25,
            })
          );

          if (
            Math.abs(
              car.speed
            ) > 3
          ) {
            setWanted(
              (value) =>
                clamp(
                  value + 1,
                  0,
                  5
                )
            );

            applyDamage(
              2,
              "💥 You hit a building!"
            );
          }

          return;
        }

        setCar({
          x: nextX,
          y: nextY,
          angle: nextAngle,
          speed: nextSpeed,
        });
      },
      [
        inCar,
        gameOver,
        missionComplete,
        car,
        applyDamage,
      ]
    );

  /* =======================================================
     TRAFFIC
  ======================================================= */

  const updateTraffic =
    useCallback(
      (delta) => {
        setTraffic(
          (vehicles) =>
            vehicles.map(
              (vehicle) => {
                let x =
                  vehicle.x +
                  Math.cos(
                    vehicle.angle
                  ) *
                    vehicle.speed *
                    delta;

                let y =
                  vehicle.y +
                  Math.sin(
                    vehicle.angle
                  ) *
                    vehicle.speed *
                    delta;

                if (x > 1630) {
                  x = 150;
                }

                if (x < 150) {
                  x = 1630;
                }

                if (y > 1030) {
                  y = 150;
                }

                if (y < 150) {
                  y = 1030;
                }

                return {
                  ...vehicle,
                  x,
                  y,
                };
              }
            )
        );
      },
      []
    );

  /* =======================================================
     NPC
  ======================================================= */

  const updateNPCs =
    useCallback(() => {
      setNpcs(
        (people) =>
          people.map(
            (npc) => {
              const movement =
                Math.sin(
                  Date.now() /
                    1200 +
                    npc.id
                ) *
                0.35;

              return {
                ...npc,
                x: clamp(
                  npc.x +
                    movement,
                  140,
                  WORLD.width -
                    140
                ),
              };
            }
          )
      );
    }, []);

  /* =======================================================
     POLICE
  ======================================================= */

  const updatePolice =
    useCallback(() => {
      if (
        gameOver ||
        missionComplete
      ) {
        return;
      }

      const count =
        getPoliceCount(
          wanted
        );

      const target =
        inCar
          ? car
          : player;

      if (count === 0) {
        setPolice(
          (current) =>
            current.length
              ? []
              : current
        );

        return;
      }

      setPolice(
        (currentPolice) => {
          let nextPolice =
            [
              ...currentPolice,
            ];

          while (
            nextPolice.length <
            count
          ) {
            nextPolice.push(
              createPolice(
                Date.now() +
                  nextPolice.length,
                target
              )
            );
          }

          if (
            nextPolice.length >
            count
          ) {
            nextPolice =
              nextPolice.slice(
                0,
                count
              );
          }

          return nextPolice.map(
            (cop) =>
              movePolice(
                cop,
                target,
                WORLD,
                blocked
              )
          );
        }
      );
    }, [
      gameOver,
      missionComplete,
      wanted,
      inCar,
      car,
      player,
    ]);

  /* =======================================================
     POLICE COLLISION
  ======================================================= */

  const checkPoliceCollision =
    useCallback(() => {
      if (
        gameOver ||
        wanted <= 0 ||
        police.length === 0
      ) {
        return;
      }

      const target =
        inCar
          ? car
          : player;

      const hit =
        police.some(
          (cop) =>
            policeHitsPlayer(
              cop,
              target
            )
        );

      if (!hit) {
        return;
      }

      applyDamage(
        1,
        "🚔 Police collision! Escape!"
      );

      setCar(
        (previous) => ({
          ...previous,
          speed:
            -previous.speed *
            0.4,
        })
      );

      setMessage(
        "🚔 POLICE HIT! Escape the area!"
      );
    }, [
      gameOver,
      wanted,
      police,
      inCar,
      car,
      player,
      applyDamage,
    ]);

  /* =======================================================
     TRAFFIC COLLISION
  ======================================================= */

  const checkTrafficCollision =
    useCallback(() => {
      if (
        !inCar ||
        Math.abs(car.speed) <
          1
      ) {
        return;
      }

      if (
        collisionCooldownRef.current
      ) {
        return;
      }

      const hit =
        traffic.some(
          (vehicle) =>
            distance(
              car,
              vehicle
            ) < 50
        );

      if (!hit) {
        return;
      }

      collisionCooldownRef.current =
        true;

      setCar(
        (previous) => ({
          ...previous,
          speed:
            -previous.speed *
            0.3,
        })
      );

      setWanted(
        (value) =>
          clamp(
            value + 1,
            0,
            5
          )
      );

      applyDamage(
        4,
        "⚠️ Heavy collision! Vehicle damaged."
      );

      setMessage(
        "⚠️ Collision! Heat level increased."
      );

      window.setTimeout(() => {
        collisionCooldownRef.current =
          false;
      }, 700);
    }, [
      inCar,
      car,
      traffic,
      applyDamage,
    ]);

  /* =======================================================
     MISSION CHECK
  ======================================================= */

  const checkMission =
    useCallback(() => {
      if (
        !missionActive ||
        missionComplete ||
        gameOver
      ) {
        return;
      }

      const target =
        inCar
          ? car
          : player;

      /*
       * MISSION 1
       */
      if (
        mission.id === 1
      ) {
        if (
          inCar &&
          distance(
            target,
            mission.destination
          ) < 100
        ) {
          completeMission();
        }

        return;
      }

      /*
       * MISSION 2
       */
      if (
        mission.id === 2
      ) {
        if (
          !packageCollected &&
          distance(
            target,
            mission.pickup
          ) < 90
        ) {
          setPackageCollected(
            true
          );

          setMessage(
            "📦 Package collected! Deliver it to the green marker."
          );

          return;
        }

        if (
          packageCollected &&
          inCar &&
          distance(
            target,
            mission.destination
          ) < 100
        ) {
          completeMission();
        }

        return;
      }

      /*
       * MISSION 3
       */
      if (
        mission.id === 3
      ) {
        if (
          distance(
            target,
            mission.destination
          ) < 110 &&
          wanted === 0
        ) {
          completeMission();
        }
      }
    }, [
      missionActive,
      missionComplete,
      gameOver,
      inCar,
      car,
      player,
      mission,
      packageCollected,
      wanted,
      completeMission,
    ]);

  /* =======================================================
     GAME LOOP
  ======================================================= */

  useEffect(() => {
    let animationFrame;

    const loop = (time) => {
      const previous =
        lastFrameRef.current;

      let delta =
        (time - previous) /
        16.666;

      delta = clamp(
        delta,
        0.1,
        2
      );

      lastFrameRef.current =
        time;

      updatePlayer(delta);
      updateCar(delta);
      updateTraffic(delta);
      updateNPCs();
      updatePolice();

      animationFrame =
        requestAnimationFrame(
          loop
        );
    };

    animationFrame =
      requestAnimationFrame(
        loop
      );

    return () => {
      cancelAnimationFrame(
        animationFrame
      );
    };
  }, [
    updatePlayer,
    updateCar,
    updateTraffic,
    updateNPCs,
    updatePolice,
  ]);

  /* =======================================================
     MISSION CHECK LOOP
  ======================================================= */

  useEffect(() => {
    if (
      !missionActive
    ) {
      return;
    }

    const interval =
      window.setInterval(() => {
        checkMission();
        checkTrafficCollision();
        checkPoliceCollision();
      }, 100);

    return () =>
      window.clearInterval(
        interval
      );
  }, [
    missionActive,
    checkMission,
    checkTrafficCollision,
    checkPoliceCollision,
  ]);

  /* =======================================================
     TIMER
  ======================================================= */

  useEffect(() => {
    if (
      !missionActive ||
      missionComplete ||
      gameOver
    ) {
      return;
    }

    if (
      mission.id !== 2 &&
      mission.id !== 3
    ) {
      return;
    }

    const timer =
      window.setInterval(() => {
        setTimeLeft(
          (value) => {
            if (value <= 1) {
              window.clearInterval(
                timer
              );

              setMissionActive(
                false
              );

              setMessage(
                "TIME UP! Mission failed."
              );

              window.setTimeout(
                () => {
                  resetCurrentMission();
                },
                1000
              );

              return 0;
            }

            return value - 1;
          }
        );
      }, 1000);

    return () =>
      window.clearInterval(
        timer
      );
  }, [
    missionActive,
    missionComplete,
    gameOver,
    mission.id,
    resetCurrentMission,
  ]);

  /* =======================================================
     WANTED SYSTEM
  ======================================================= */

  useEffect(() => {
    if (
      wanted <= 0 ||
      !missionActive
    ) {
      return;
    }

    const interval =
      window.setInterval(() => {
        /*
         * Police escape:
         * If player stays away from police,
         * wanted level slowly decreases.
         */

        const target =
          inCar
            ? car
            : player;

        const nearbyPolice =
          police.some(
            (cop) =>
              distance(
                cop,
                target
              ) < 220
          );

        if (
          !nearbyPolice &&
          wanted > 0
        ) {
          setWanted(
            (value) =>
              Math.max(
                0,
                value - 1
              )
          );

          setMessage(
            "🚔 You are losing police attention..."
          );
        }
      }, 5000);

    return () =>
      window.clearInterval(
        interval
      );
  }, [
    wanted,
    missionActive,
    inCar,
    car,
    player,
    police,
  ]);

  /* =======================================================
     HEALTH / GAME OVER
  ======================================================= */

  useEffect(() => {
    if (
      health > 0
    ) {
      return;
    }

    setHealth(0);
    setGameOver(true);
    setMissionActive(false);
    setInCar(false);
    setMessage(
      "You were knocked out."
    );
  }, [health]);

  /* =======================================================
     CAMERA
  ======================================================= */

  useEffect(() => {
    const target =
      inCar
        ? car
        : player;

    const width =
      gameRef.current
        ?.clientWidth ||
      window.innerWidth;

    const height =
      gameRef.current
        ?.clientHeight ||
      window.innerHeight;

    setCamera({
      x: clamp(
        target.x -
          width / 2,
        0,
        Math.max(
          0,
          WORLD.width -
            width
        )
      ),

      y: clamp(
        target.y -
          height / 2,
        0,
        Math.max(
          0,
          WORLD.height -
            height
        )
      ),
    });
  }, [
    player,
    car,
    inCar,
  ]);

  /* =======================================================
     MOBILE CONTROLS
  ======================================================= */

  const holdKey =
    useCallback((key) => {
      keysRef.current[key] =
        true;
    }, []);

  const releaseKey =
    useCallback((key) => {
      keysRef.current[key] =
        false;
    }, []);

  const button = (
    key,
    label
  ) => (
    <button
      className="cr-control"
      onPointerDown={(event) => {
        event.preventDefault();
        holdKey(key);
      }}
      onPointerUp={(event) => {
        event.preventDefault();
        releaseKey(key);
      }}
      onPointerLeave={() => {
        releaseKey(key);
      }}
      onPointerCancel={() => {
        releaseKey(key);
      }}
    >
      {label}
    </button>
  );

  /* =======================================================
     MINIMAP
  ======================================================= */

  const mapPosition = (
    object
  ) => ({
    left: `${
      (object.x /
        WORLD.width) *
      100
    }%`,

    top: `${
      (object.y /
        WORLD.height) *
      100
    }%`,
  });

  const minimapTarget =
    useMemo(() => {
      if (
        mission.id === 2 &&
        !packageCollected
      ) {
        return mission.pickup;
      }

      return mission.destination;
    }, [
      mission,
      packageCollected,
    ]);

  /* =======================================================
     DISTANCE
  ======================================================= */

  const currentTarget =
    mission.id === 2 &&
    !packageCollected
      ? mission.pickup
      : mission.destination;

  const distanceToTarget =
    Math.round(
      distance(
        inCar
          ? car
          : player,
        currentTarget
      )
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="city-rush">

      {/* ===================================================
          TOP HUD
      =================================================== */}

      <div className="cr-topbar">

        <div className="cr-logo">
          <small>CITY</small>
          <strong>RUSH</strong>
        </div>

        <div className="cr-money">
          💰 ${money}
        </div>

        <button
          className="cr-save-button"
          onClick={() => {
            saveGame();
            setMessage(
              "💾 GAME SAVED"
            );
          }}
        >
          💾 SAVE
        </button>

        <div className="cr-health">
          ❤️

          <div>
            <span
              style={{
                width: `${health}%`,
              }}
            />
          </div>
        </div>

        <div className="cr-wanted">
          {Array.from({
            length: 5,
          }).map(
            (_, index) => (
              <span
                key={index}
                className={
                  index < wanted
                    ? "wanted-active"
                    : ""
                }
              >
                ★
              </span>
            )
          )}
        </div>
      </div>

      {/* ===================================================
          CONTINUE
      =================================================== */}

      {hasSavedGame && (
        <button
          className="cr-continue-button"
          onClick={() => {
            const loaded =
              loadGame();

            if (loaded) {
              setShowMission(
                false
              );

              setHasSavedGame(
                false
              );
            }
          }}
        >
          ▶ CONTINUE
        </button>
      )}

      {/* ===================================================
          MISSION PANEL
      =================================================== */}

      {showMission && (
        <div className="cr-mission">

          <button
            className="cr-close"
            onClick={() =>
              setShowMission(
                false
              )
            }
          >
            ×
          </button>

          <small>
            MISSION {mission.id}
          </small>

          <h2>
            {mission.title}
          </h2>

          <p>
            {mission.description}
          </p>

          {!missionActive &&
            !missionComplete &&
            !gameOver && (
              <button
                className="cr-start"
                onClick={() => {
                  if (
                    mission.id === 1
                  ) {
                    setMessage(
                      "Walk to the car and press E."
                    );
                  } else {
                    startMission();
                  }
                }}
              >
                {mission.id === 1
                  ? "GET STARTED"
                  : "START MISSION"}
              </button>
            )}

          {missionActive && (
            <>
              <div className="cr-objective">
                📍{" "}
                {distanceToTarget}m
              </div>

              {(mission.id === 2 ||
                mission.id === 3) && (
                <div className="cr-timer">
                  ⏱ {timeLeft}s
                </div>
              )}

              <div className="cr-message">
                {message}
              </div>
            </>
          )}

          {missionComplete && (
            <div className="cr-complete-small">

              <b>
                ✓ COMPLETE
              </b>

              <span>
                +${mission.reward}
              </span>

              {missionIndex <
                MISSIONS.length -
                  1 && (
                <button
                  className="cr-next"
                  onClick={
                    nextMission
                  }
                >
                  NEXT MISSION →
                </button>
              )}
            </div>
          )}

          {gameOver && (
            <button
              className="cr-start"
              onClick={
                resetCurrentMission
              }
            >
              TRY AGAIN
            </button>
          )}
        </div>
      )}

      {!showMission && (
        <button
          className="cr-mission-button"
          onClick={() =>
            setShowMission(true)
          }
        >
          🎯 MISSION
        </button>
      )}

      {/* ===================================================
          WORLD
      =================================================== */}

      <div
        ref={gameRef}
        className="cr-world"
      >
        <div
          className="cr-map"
          style={{
            width:
              WORLD.width,
            height:
              WORLD.height,

            transform:
              `translate(${-camera.x}px, ${-camera.y}px)`,
          }}
        >

          {/* ROADS */}

          {ROADS.map(
            (road, index) => (
              <div
                key={index}
                className="cr-road"
                style={{
                  left: road.x,
                  top: road.y,
                  width: road.w,
                  height: road.h,
                }}
              />
            )
          )}

          {/* ROAD MARKINGS */}

          <div
            className="cr-road-mark horizontal"
            style={{
              top: 397,
            }}
          />

          <div
            className="cr-road-mark horizontal"
            style={{
              top: 738,
            }}
          />

          <div
            className="cr-road-mark vertical"
            style={{
              left: 483,
            }}
          />

          <div
            className="cr-road-mark vertical"
            style={{
              left: 863,
            }}
          />

          <div
            className="cr-road-mark vertical"
            style={{
              left: 1263,
            }}
          />

          {/* BUILDINGS */}

          {BUILDINGS.map(
            (
              building,
              index
            ) => (
              <div
                key={index}
                className="cr-building"
                style={{
                  left:
                    building.x,
                  top:
                    building.y,
                  width:
                    building.w,
                  height:
                    building.h,
                }}
              >
                <div className="cr-windows">
                  {Array.from({
                    length: 8,
                  }).map(
                    (_, i) => (
                      <i
                        key={i}
                      />
                    )
                  )}
                </div>

                <span>
                  CITY BLOCK{" "}
                  {index + 1}
                </span>
              </div>
            )
          )}

          {/* PARKING */}

          <div
            className="cr-parking"
            style={{
              left: 160,
              top: 810,
            }}
          >
            PARKING
          </div>

          {/* MISSION TARGET */}

          {missionActive && (
            <div
              className={`cr-target ${
                mission.id === 2 &&
                !packageCollected
                  ? "package-target"
                  : "delivery-target"
              }`}
              style={{
                left:
                  minimapTarget.x -
                  45,

                top:
                  minimapTarget.y -
                  45,
              }}
            >
              <span>
                {mission.id === 2 &&
                !packageCollected
                  ? "📦"
                  : mission.id === 3
                  ? "🟢"
                  : "★"}
              </span>

              <small>
                {mission.id === 2 &&
                !packageCollected
                  ? "PACKAGE"
                  : mission.id === 3
                  ? "SAFE ZONE"
                  : "DELIVER"}
              </small>
            </div>
          )}

          {/* POLICE */}

          {police.map(
            (cop) => (
              <Police
                key={cop.id}
                police={cop}
              />
            )
          )}

          {/* TRAFFIC */}

          {traffic.map(
            (vehicle) => (
              <div
                key={
                  vehicle.id
                }
                className="cr-traffic"
                style={{
                  left:
                    vehicle.x -
                    20,

                  top:
                    vehicle.y -
                    35,

                  background:
                    vehicle.color,
                }}
              >
                <div />
              </div>
            )
          )}

          {/* NPC */}

          {npcs.map(
            (npc) => (
              <div
                key={npc.id}
                className="cr-npc"
                style={{
                  left:
                    npc.x - 10,

                  top:
                    npc.y - 15,
                }}
              >
                <span
                  style={{
                    background:
                      npc.color,
                  }}
                />

                <i />
              </div>
            )
          )}

          {/* PLAYER */}

          {!inCar && (
            <div
              className="cr-player"
              style={{
                left:
                  player.x - 17,

                top:
                  player.y - 25,
              }}
            >
              <div className="player-head" />
              <div className="player-body" />
            </div>
          )}

          {/* PLAYER CAR */}

          <div
            className={`cr-car ${
              inCar
                ? "car-driving"
                : ""
            }`}
            style={{
              left:
                car.x - 27,

              top:
                car.y - 46,

              transform:
                `rotate(${car.angle}rad)`,
            }}
          >
            <div className="car-lights" />

            <div className="car-window" />

            <div className="car-window back" />

            <b />
            <b />
            <b />
            <b />

            {!inCar && (
              <label>
                PRESS E
              </label>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================
          MESSAGE
      =================================================== */}

      <div className="cr-bottom-message">
        {message}
      </div>

      {/* ===================================================
          MINIMAP
      =================================================== */}

      <div className="cr-minimap">

        <div className="mini-roads" />

        <div
          className="mini-player"
          style={mapPosition(
            inCar
              ? car
              : player
          )}
        />

        {missionActive && (
          <div
            className="mini-target"
            style={mapPosition(
              minimapTarget
            )}
          />
        )}

        {traffic.map(
          (vehicle) => (
            <div
              key={
                vehicle.id
              }
              className="mini-traffic"
              style={mapPosition(
                vehicle
              )}
            />
          )
        )}
      </div>

      {/* ===================================================
          SPEED
      =================================================== */}

      {inCar && (
        <div className="cr-speed">

          <small>
            SPEED
          </small>

          <strong>
            {Math.round(
              Math.abs(
                car.speed
              ) * 22
            )}
          </strong>

          <span>
            KM/H
          </span>
        </div>
      )}

      {/* ===================================================
          SOUND
      =================================================== */}

      <button
        className="cr-sound"
        onClick={() =>
          setSoundOn(
            (value) =>
              !value
          )
        }
      >
        {soundOn
          ? "🔊"
          : "🔇"}
      </button>

      {/* ===================================================
          DESKTOP HELP
      =================================================== */}

      <div className="cr-help">

        <span>
          WASD / ARROWS
        </span>

        <small>
          MOVE / DRIVE
        </small>

        <span>
          E
        </span>

        <small>
          ENTER / EXIT
        </small>
      </div>

      {/* ===================================================
          MOBILE
      =================================================== */}

      <div className="cr-mobile-controls">

        <div className="cr-dpad">

          {button(
            "arrowleft",
            "←"
          )}

          {button(
            "arrowdown",
            "↓"
          )}

          {button(
            "arrowright",
            "→"
          )}

          <div className="up-control">
            {button(
              "arrowup",
              "↑"
            )}
          </div>

        </div>

        <button
          className="cr-enter"
          onClick={
            handleVehicle
          }
        >
          {inCar
            ? "EXIT"
            : "ENTER"}
        </button>
      </div>

      {/* ===================================================
          GAME OVER
      =================================================== */}

      {gameOver && (
        <div className="cr-overlay">

          <div className="cr-card">

            <div>
              💥
            </div>

            <small>
              MISSION FAILED
            </small>

            <h1>
              TRY AGAIN
            </h1>

            <p>
              Your health
              reached zero.
            </p>

            <button
              onClick={
                resetCurrentMission
              }
            >
              RESTART
            </button>

          </div>
        </div>
      )}

      {/* ===================================================
          MISSION COMPLETE
      =================================================== */}

      {missionComplete && (
        <div className="cr-overlay">

          <div className="cr-card success">

            <div>
              🏆
            </div>

            <small>
              MISSION COMPLETE
            </small>

            <h1>
              {mission.title}
            </h1>

            <strong>
              +$
              {mission.reward}
            </strong>

            <p>
              Great job.
              Your progress
              has been saved.
            </p>

            {missionIndex <
            MISSIONS.length -
              1 ? (
              <button
                onClick={
                  nextMission
                }
              >
                NEXT MISSION →
              </button>
            ) : (
              <button
                onClick={
                  resetCurrentMission
                }
              >
                PLAY AGAIN
              </button>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default CityRush;