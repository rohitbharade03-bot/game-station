import { BUILDINGS, WORLD } from "../data/city";

export function distance(a, b) {
  return Math.hypot(
    a.x - b.x,
    a.y - b.y
  );
}

export function clamp(
  value,
  min,
  max
) {
  return Math.max(
    min,
    Math.min(max, value)
  );
}

export function circleRectCollision(
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

export function isBlocked(
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

  return BUILDINGS.some(
    (building) =>
      circleRectCollision(
        x,
        y,
        radius,
        building
      )
  );
}

export function isVehicleCollision(
  vehicleA,
  vehicleB,
  radius = 45
) {
  return (
    distance(
      vehicleA,
      vehicleB
    ) < radius
  );
}