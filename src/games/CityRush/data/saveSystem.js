const SAVE_KEY =
  "cityRushSave";

const DEFAULT_SAVE = {
  money: 0,

  currentMission: 1,

  completedMissions: [],

  unlockedMissions: [1],

  ownedVehicles: ["starter"],

  selectedVehicle: "starter",

  upgrades: {},

  bestScores: {},

  settings: {
    sound: true,
  },
};

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function loadGame() {
  const saved = safeParse(
    localStorage.getItem(SAVE_KEY)
  );

  if (!saved) {
    return DEFAULT_SAVE;
  }

  return {
    ...DEFAULT_SAVE,
    ...saved,

    settings: {
      ...DEFAULT_SAVE.settings,
      ...(saved.settings || {}),
    },
  };
}

export function saveGame(data) {
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify(data)
  );
}

export function resetSave() {
  localStorage.removeItem(
    SAVE_KEY
  );

  return DEFAULT_SAVE;
}

export function updateSave(patch) {
  const current = loadGame();

  const updated = {
    ...current,
    ...patch,
  };

  saveGame(updated);

  return updated;
}

export function addMoney(amount) {
  const current = loadGame();

  const updated = {
    ...current,
    money: Math.max(
      0,
      current.money + amount
    ),
  };

  saveGame(updated);

  return updated;
}

export function completeMission(
  missionId,
  reward
) {
  const current = loadGame();

  const completed =
    current.completedMissions.includes(
      missionId
    )
      ? current.completedMissions
      : [
          ...current.completedMissions,
          missionId,
        ];

  const nextMission =
    missionId + 1;

  const unlocked =
    current.unlockedMissions.includes(
      nextMission
    )
      ? current.unlockedMissions
      : [
          ...current.unlockedMissions,
          nextMission,
        ];

  const updated = {
    ...current,

    money:
      current.money + reward,

    completedMissions:
      completed,

    unlockedMissions:
      unlocked,

    currentMission:
      nextMission,
  };

  saveGame(updated);

  return updated;
}