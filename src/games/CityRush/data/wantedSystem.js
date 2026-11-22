export const MAX_WANTED = 5;

export function addWanted(
  current,
  amount = 1
) {
  return Math.min(
    MAX_WANTED,
    Math.max(
      0,
      current + amount
    )
  );
}

export function removeWanted(
  current,
  amount = 1
) {
  return Math.max(
    0,
    current - amount
  );
}

export function getPoliceCount(
  wanted
) {
  if (wanted <= 0) return 0;
  if (wanted === 1) return 1;
  if (wanted === 2) return 2;
  if (wanted === 3) return 3;
  if (wanted === 4) return 4;

  return 5;
}

export function getWantedLabel(
  wanted
) {
  if (wanted === 0) {
    return "CLEAN";
  }

  if (wanted === 1) {
    return "SUSPICIOUS";
  }

  if (wanted === 2) {
    return "WANTED";
  }

  if (wanted === 3) {
    return "HOT";
  }

  if (wanted === 4) {
    return "DANGEROUS";
  }

  return "MAX HEAT";
}

export function getWantedColor(
  wanted
) {
  if (wanted === 0) {
    return "#67e58a";
  }

  if (wanted <= 2) {
    return "#ffd34e";
  }

  return "#ff4b4b";
}