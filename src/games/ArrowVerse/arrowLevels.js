export const LEVEL_CONFIG = [
  { level: 1, arrows: 5, difficulty: "EASY", reward: 20 },
  { level: 2, arrows: 6, difficulty: "EASY", reward: 22 },
  { level: 3, arrows: 7, difficulty: "EASY", reward: 24 },
  { level: 4, arrows: 8, difficulty: "NORMAL", reward: 26 },
  { level: 5, arrows: 9, difficulty: "NORMAL", reward: 28 },
  { level: 6, arrows: 10, difficulty: "NORMAL", reward: 30 },
  { level: 7, arrows: 11, difficulty: "NORMAL", reward: 32 },
  { level: 8, arrows: 12, difficulty: "HARD", reward: 35 },
  { level: 9, arrows: 13, difficulty: "HARD", reward: 38 },
  { level: 10, arrows: 14, difficulty: "HARD", reward: 42 },
  { level: 11, arrows: 15, difficulty: "HARD", reward: 46 },
  { level: 12, arrows: 16, difficulty: "EXPERT", reward: 50 },
  { level: 13, arrows: 18, difficulty: "EXPERT", reward: 55 },
  { level: 14, arrows: 19, difficulty: "EXPERT", reward: 60 },
  { level: 15, arrows: 20, difficulty: "MASTER", reward: 70 },
];

export function getLevelConfig(level) {
  if (level <= LEVEL_CONFIG.length) {
    return LEVEL_CONFIG[level - 1];
  }

  return {
    level,
    arrows: Math.min(22 + Math.floor((level - 15) / 2), 30),
    difficulty: level > 25 ? "LEGEND" : "MASTER",
    reward: 70 + level * 2,
  };
}

export function getHintCosts(level) {
  return {
    first: 20 + Math.floor(level / 5) * 5,
    second: 35 + Math.floor(level / 5) * 5,
  };
}
