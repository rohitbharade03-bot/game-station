// ============================================================
// ArrowVerse - Arrow Engine
// Handles:
// - Direction
// - Path segments
// - Forward exit corridor
// - Arrow-to-arrow blocking
// - Removing escaped arrows
// ============================================================

/* ------------------------------------------------------------
   Direction
------------------------------------------------------------ */

export function directionVector(direction) {
  switch (direction) {
    case "left":
      return { x: -1, y: 0 };

    case "right":
      return { x: 1, y: 0 };

    case "up":
      return { x: 0, y: -1 };

    case "down":
      return { x: 0, y: 1 };

    default:
      return { x: 0, y: 0 };
  }
}


/* ------------------------------------------------------------
   Get bounding segments from arrow points
------------------------------------------------------------ */

export function getSegments(points = []) {
  const result = [];

  if (!Array.isArray(points) || points.length < 2) {
    return result;
  }

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];

    if (!a || !b) continue;

    result.push({
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,

      minX: Math.min(a.x, b.x),
      maxX: Math.max(a.x, b.x),

      minY: Math.min(a.y, b.y),
      maxY: Math.max(a.y, b.y),
    });
  }

  return result;
}


/* ------------------------------------------------------------
   Bounding box overlap
------------------------------------------------------------ */

export function boxesOverlap(a, b, padding = 12) {
  if (!a || !b) return false;

  return !(
    a.x2 + padding < b.x1 ||
    a.x1 - padding > b.x2 ||
    a.y2 + padding < b.y1 ||
    a.y1 - padding > b.y2
  );
}


/* ------------------------------------------------------------
   Point inside rectangle
------------------------------------------------------------ */

function pointInsideRect(point, rect, padding = 0) {
  if (!point || !rect) return false;

  return (
    point.x >= rect.x1 - padding &&
    point.x <= rect.x2 + padding &&
    point.y >= rect.y1 - padding &&
    point.y <= rect.y2 + padding
  );
}


/* ------------------------------------------------------------
   Segment intersects rectangle
------------------------------------------------------------ */

function segmentIntersectsRect(segment, rect, padding = 0) {
  if (!segment || !rect) return false;

  const x1 = rect.x1 - padding;
  const y1 = rect.y1 - padding;
  const x2 = rect.x2 + padding;
  const y2 = rect.y2 + padding;

  // Fast bounding-box rejection
  if (
    segment.maxX < x1 ||
    segment.minX > x2 ||
    segment.maxY < y1 ||
    segment.minY > y2
  ) {
    return false;
  }

  // Horizontal segment
  if (segment.y1 === segment.y2) {
    return (
      segment.y1 >= y1 &&
      segment.y1 <= y2 &&
      segment.maxX >= x1 &&
      segment.minX <= x2
    );
  }

  // Vertical segment
  if (segment.x1 === segment.x2) {
    return (
      segment.x1 >= x1 &&
      segment.x1 <= x2 &&
      segment.maxY >= y1 &&
      segment.minY <= y2
    );
  }

  // Generic fallback
  return (
    pointInsideRect(
      { x: segment.x1, y: segment.y1 },
      rect,
      padding
    ) ||
    pointInsideRect(
      { x: segment.x2, y: segment.y2 },
      rect,
      padding
    )
  );
}


/* ------------------------------------------------------------
   Get arrow head
------------------------------------------------------------ */

export function getArrowHead(arrow) {
  if (!arrow?.points?.length) {
    return null;
  }

  return arrow.points[arrow.points.length - 1];
}


/* ------------------------------------------------------------
   Get arrow direction
------------------------------------------------------------ */

export function getArrowDirection(arrow) {
  if (!arrow) return null;

  // Preferred direction from generated level data
  if (
    arrow.direction === "left" ||
    arrow.direction === "right" ||
    arrow.direction === "up" ||
    arrow.direction === "down"
  ) {
    return arrow.direction;
  }

  // Fallback: calculate from final two points
  const points = arrow.points || [];

  if (points.length < 2) {
    return null;
  }

  const a = points[points.length - 2];
  const b = points[points.length - 1];

  const dx = b.x - a.x;
  const dy = b.y - a.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx < 0 ? "left" : "right";
  }

  return dy < 0 ? "up" : "down";
}


/* ------------------------------------------------------------
   Create forward corridor
------------------------------------------------------------ */

export function getExitCorridor(
  arrow,
  boardWidth = 1000,
  boardHeight = 1000,
  padding = 14
) {
  const head = getArrowHead(arrow);

  if (!head) return null;

  const direction = getArrowDirection(arrow);
  const vector = directionVector(direction);

  if (!direction) return null;

  let x1 = head.x;
  let y1 = head.y;
  let x2 = head.x;
  let y2 = head.y;

  /*
    Corridor goes from arrow head all the way
    to the board boundary.

    This is important:
    We don't just check the next 100px.
    We check the COMPLETE exit route.
  */

  switch (direction) {
    case "left":
      x1 = 0;
      x2 = head.x;
      break;

    case "right":
      x1 = head.x;
      x2 = boardWidth;
      break;

    case "up":
      y1 = 0;
      y2 = head.y;
      break;

    case "down":
      y1 = head.y;
      y2 = boardHeight;
      break;

    default:
      return null;
  }

  return {
    x1: Math.min(x1, x2) - padding,
    y1: Math.min(y1, y2) - padding,

    x2: Math.max(x1, x2) + padding,
    y2: Math.max(y1, y2) + padding,

    direction,
    vector,
  };
}


/* ------------------------------------------------------------
   Find arrows blocking the exit
------------------------------------------------------------ */

export function getBlockingArrows(
  arrow,
  arrows = [],
  boardWidth = 1000,
  boardHeight = 1000,
  padding = 10
) {
  if (!arrow) return [];

  const corridor = getExitCorridor(
    arrow,
    boardWidth,
    boardHeight,
    padding
  );

  if (!corridor) {
    return [];
  }

  const blockers = [];

  for (const other of arrows) {
    if (!other) continue;

    // Don't collide with itself
    if (other.id === arrow.id) continue;

    // Already escaped arrows don't block
    if (other.removed) continue;

    // Optional inactive state
    if (other.active === false) continue;

    const otherSegments = getSegments(
      other.points || []
    );

    let blocked = false;

    for (const segment of otherSegments) {
      if (
        segmentIntersectsRect(
          segment,
          corridor,
          padding
        )
      ) {
        blocked = true;
        break;
      }
    }

    if (blocked) {
      blockers.push(other);
    }
  }

  return blockers;
}


/* ------------------------------------------------------------
   Can arrow exit?
------------------------------------------------------------ */

export function canArrowExit(
  arrow,
  arrows = [],
  boardWidth = 1000,
  boardHeight = 1000
) {
  if (!arrow) return false;

  const blockers = getBlockingArrows(
    arrow,
    arrows,
    boardWidth,
    boardHeight,
    10
  );

  return blockers.length === 0;
}


/* ------------------------------------------------------------
   Get complete exit information
------------------------------------------------------------ */

export function getExitResult(
  arrow,
  arrows = [],
  boardWidth = 1000,
  boardHeight = 1000
) {
  const blockers = getBlockingArrows(
    arrow,
    arrows,
    boardWidth,
    boardHeight,
    10
  );

  if (blockers.length === 0) {
    return {
      canExit: true,
      blocked: false,
      blockers: [],
      direction: getArrowDirection(arrow),
      corridor: getExitCorridor(
        arrow,
        boardWidth,
        boardHeight
      ),
    };
  }

  return {
    canExit: false,
    blocked: true,
    blockers,
    blockerIds: blockers.map(
      (item) => item.id
    ),
    direction: getArrowDirection(arrow),
    corridor: getExitCorridor(
      arrow,
      boardWidth,
      boardHeight
    ),
  };
}


/* ------------------------------------------------------------
   Remove arrow
------------------------------------------------------------ */

export function removeArrow(arrows = [], id) {
  return arrows.filter(
    (arrow) => arrow.id !== id
  );
}


/* ------------------------------------------------------------
   Mark arrow as removed
------------------------------------------------------------ */

export function markArrowRemoved(
  arrows = [],
  id
) {
  return arrows.map((arrow) => {
    if (arrow.id !== id) {
      return arrow;
    }

    return {
      ...arrow,
      removed: true,
      active: false,
    };
  });
}


/* ------------------------------------------------------------
   Get active arrows
------------------------------------------------------------ */

export function getActiveArrows(
  arrows = []
) {
  return arrows.filter(
    (arrow) =>
      !arrow.removed &&
      arrow.active !== false
  );
}


/* ------------------------------------------------------------
   Check whether all arrows escaped
------------------------------------------------------------ */

export function allArrowsRemoved(
  arrows = []
) {
  return arrows.every(
    (arrow) => arrow.removed
  );
}