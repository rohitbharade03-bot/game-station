export const MAX_WANTED = 5;

export function getPoliceCount(wanted) {
  if (wanted <= 0) return 0;
  if (wanted === 1) return 1;
  if (wanted === 2) return 2;
  if (wanted === 3) return 3;
  if (wanted === 4) return 4;

  return 5;
}

export function createPolice(id, player) {
  const angle =
    Math.random() * Math.PI * 2;

  const distance = 260 + Math.random() * 180;

  return {
    id,

    x:
      player.x +
      Math.cos(angle) * distance,

    y:
      player.y +
      Math.sin(angle) * distance,

    angle: 0,

    speed:
      1.8 + Math.random() * 0.6,
  };
}

export function movePolice(
  police,
  target,
  world,
  blocked
) {
  const dx = target.x - police.x;
  const dy = target.y - police.y;

  const distance = Math.hypot(dx, dy);

  if (distance < 1) {
    return police;
  }

  const angle =
    Math.atan2(dy, dx) +
    Math.PI / 2;

  const speed = Math.min(
    police.speed +
      Math.min(distance / 400, 1.2),
    3.4
  );

  const nextX =
    police.x +
    Math.cos(angle - Math.PI / 2) *
      speed;

  const nextY =
    police.y +
    Math.sin(angle - Math.PI / 2) *
      speed;

  if (
    nextX < 120 ||
    nextX > world.width - 120 ||
    nextY < 120 ||
    nextY > world.height - 120
  ) {
    return {
      ...police,
      angle,
      speed: 1.8,
    };
  }

  if (
    blocked &&
    blocked(nextX, nextY, 24)
  ) {
    return {
      ...police,
      angle: angle + 0.8,
    };
  }

  return {
    ...police,
    x: nextX,
    y: nextY,
    angle,
  };
}

export function policeHitsPlayer(
  police,
  target,
  radius = 58
) {
  return (
    Math.hypot(
      police.x - target.x,
      police.y - target.y
    ) < radius
  );
}