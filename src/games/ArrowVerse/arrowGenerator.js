const COLORS = [
  "#00F5FF",
  "#39FF14",
  "#FFEA00",
  "#FF3CAC",
  "#FF4D4D",
  "#A855F7",
  "#FF8A00",
  "#FFFFFF",
];

const DIRECTIONS = ["left", "right", "up", "down"];

const BOARD = {
  width: 900,
  height: 620,
  padding: 70,
  cell: 30,
};

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function idFor(level, index) {
  return `arrow-${level}-${index}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function point(x, y) {
  return {
    x: Math.round(x),
    y: Math.round(y),
  };
}

function directionVector(direction) {
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

/*
---------------------------------------------------------
PATH HELPERS
---------------------------------------------------------
*/

function normalizePoints(points) {
  const result = [];

  for (const p of points) {
    const last = result[result.length - 1];

    if (!last || last.x !== p.x || last.y !== p.y) {
      result.push(point(p.x, p.y));
    }
  }

  return result;
}

function getPathBounds(points) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);

  return {
    x1: Math.min(...xs),
    y1: Math.min(...ys),
    x2: Math.max(...xs),
    y2: Math.max(...ys),
  };
}

function expandBounds(bounds, amount = 14) {
  return {
    x1: bounds.x1 - amount,
    y1: bounds.y1 - amount,
    x2: bounds.x2 + amount,
    y2: bounds.y2 + amount,
  };
}

function boundsOverlap(a, b) {
  return !(
    a.x2 < b.x1 ||
    a.x1 > b.x2 ||
    a.y2 < b.y1 ||
    a.y1 > b.y2
  );
}

/*
---------------------------------------------------------
SEGMENT COLLISION
---------------------------------------------------------
*/

function segmentOverlap(a, b, padding = 16) {
  const horizontalA = a.y1 === a.y2;
  const horizontalB = b.y1 === b.y2;

  /*
  Horizontal ↔ Horizontal
  */
  if (horizontalA && horizontalB) {
    if (Math.abs(a.y1 - b.y1) > padding) {
      return false;
    }

    return !(
      a.x2 + padding < b.x1 ||
      b.x2 + padding < a.x1
    );
  }

  /*
  Vertical ↔ Vertical
  */
  const verticalA = a.x1 === a.x2;
  const verticalB = b.x1 === b.x2;

  if (verticalA && verticalB) {
    if (Math.abs(a.x1 - b.x1) > padding) {
      return false;
    }

    return !(
      a.y2 + padding < b.y1 ||
      b.y2 + padding < a.y1
    );
  }

  /*
  Horizontal ↔ Vertical
  */
  const h = horizontalA ? a : b;
  const v = horizontalA ? b : a;

  return (
    h.x1 - padding <= v.x1 &&
    h.x2 + padding >= v.x1 &&
    v.y1 - padding <= h.y1 &&
    v.y2 + padding >= h.y1
  );
}

function getSegments(points) {
  const segments = [];

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];

    segments.push({
      x1: Math.min(a.x, b.x),
      y1: Math.min(a.y, b.y),
      x2: Math.max(a.x, b.x),
      y2: Math.max(a.y, b.y),
    });
  }

  return segments;
}

function pathsTouch(pathA, pathB) {
  const segmentsA = getSegments(pathA);
  const segmentsB = getSegments(pathB);

  for (const a of segmentsA) {
    for (const b of segmentsB) {
      if (segmentOverlap(a, b, 17)) {
        return true;
      }
    }
  }

  return false;
}

/*
---------------------------------------------------------
CREATE PATH
---------------------------------------------------------
*/

function createPath(startX, startY, direction, turns) {
  const points = [point(startX, startY)];

  let x = startX;
  let y = startY;

  let currentDirection = direction;

  for (let i = 0; i < turns.length; i++) {
    const distance = turns[i];

    const v = directionVector(currentDirection);

    x += v.x * distance;
    y += v.y * distance;

    points.push(point(x, y));

    /*
      Change direction after each segment.
      Never immediately reverse direction.
    */

    const possible = DIRECTIONS.filter((d) => {
      const vector = directionVector(d);

      return !(
        vector.x === -v.x &&
        vector.y === -v.y
      );
    });

    currentDirection = randomItem(possible);
  }

  return normalizePoints(points);
}

/*
---------------------------------------------------------
BORDER EXIT PATH
---------------------------------------------------------
*/

function createBorderArrow(direction, index, level) {
  const margin = BOARD.padding;

  const innerLeft = margin;
  const innerRight = BOARD.width - margin;
  const innerTop = margin;
  const innerBottom = BOARD.height - margin;

  const spacing = 78;

  let start;
  let points;

  if (direction === "left") {
    const y =
      innerTop +
      50 +
      (index * spacing) %
        (BOARD.height - 100);

    start = point(innerRight - 120, y);

    points = [
      start,
      point(innerRight - 240, y),
      point(innerRight - 240, y - 45),
      point(innerLeft + 100, y - 45),
      point(innerLeft, y - 45),
    ];
  }

  else if (direction === "right") {
    const y =
      innerTop +
      50 +
      (index * spacing) %
        (BOARD.height - 100);

    start = point(innerLeft + 120, y);

    points = [
      start,
      point(innerLeft + 240, y),
      point(innerLeft + 240, y + 45),
      point(innerRight - 100, y + 45),
      point(innerRight, y + 45),
    ];
  }

  else if (direction === "up") {
    const x =
      innerLeft +
      50 +
      (index * spacing) %
        (BOARD.width - 100);

    start = point(x, innerBottom - 120);

    points = [
      start,
      point(x, innerBottom - 240),
      point(x + 45, innerBottom - 240),
      point(x + 45, innerTop + 100),
      point(x + 45, innerTop),
    ];
  }

  else {
    const x =
      innerLeft +
      50 +
      (index * spacing) %
        (BOARD.width - 100);

    start = point(x, innerTop + 120);

    points = [
      start,
      point(x, innerTop + 240),
      point(x - 45, innerTop + 240),
      point(x - 45, innerBottom - 100),
      point(x - 45, innerBottom),
    ];
  }

  return {
    id: idFor(level, index),
    color: COLORS[index % COLORS.length],
    direction,
    points: normalizePoints(points),
    removed: false,
    moving: false,
    blocked: false,
  };
}

/*
---------------------------------------------------------
SAFE RANDOM ARROWS
---------------------------------------------------------
*/

function createRandomArrow(index, level, existing) {
  const margin = BOARD.padding;

  for (let attempt = 0; attempt < 100; attempt++) {
    const direction = randomItem(DIRECTIONS);

    const x =
      margin +
      Math.floor(
        Math.random() *
          ((BOARD.width - margin * 2) / BOARD.cell)
      ) *
        BOARD.cell;

    const y =
      margin +
      Math.floor(
        Math.random() *
          ((BOARD.height - margin * 2) / BOARD.cell)
      ) *
        BOARD.cell;

    const lengths = [
      90,
      120,
      150,
      180,
      210,
    ];

    const turns = [
      randomItem(lengths),
      randomItem([60, 90, 120]),
      randomItem([60, 90, 120]),
    ];

    const points = createPath(
      x,
      y,
      direction,
      turns
    );

    /*
      Keep the complete path inside board.
    */

    const bounds = getPathBounds(points);

    if (
      bounds.x1 < margin ||
      bounds.y1 < margin ||
      bounds.x2 > BOARD.width - margin ||
      bounds.y2 > BOARD.height - margin
    ) {
      continue;
    }

    /*
      New arrow cannot touch an existing arrow.
    */

    let collision = false;

    for (const other of existing) {
      if (pathsTouch(points, other.points)) {
        collision = true;
        break;
      }
    }

    if (collision) {
      continue;
    }

    return {
      id: idFor(level, index),
      color: COLORS[index % COLORS.length],
      direction,
      points,
      removed: false,
      moving: false,
      blocked: false,
    };
  }

  return null;
}

/*
---------------------------------------------------------
GENERATE PUZZLE
---------------------------------------------------------
*/

export function generatePuzzle(level = 1) {
  const safeLevel = Math.max(1, Number(level) || 1);

  /*
    Keep early levels playable.
  */

  const count = Math.min(
    30,
    4 + Math.floor(safeLevel * 0.9)
  );

  const arrows = [];

  /*
    First create border arrows.
    These guarantee that every puzzle has
    at least some possible moves.
  */

  const borderCount = Math.min(
    count,
    Math.max(
      2,
      Math.floor(count * 0.45)
    )
  );

  for (let i = 0; i < borderCount; i++) {
    const direction =
      DIRECTIONS[i % DIRECTIONS.length];

    const arrow = createBorderArrow(
      direction,
      i,
      safeLevel
    );

    /*
      Border arrows also need to remain
      separated from one another.
    */

    if (
      !arrows.some((other) =>
        pathsTouch(
          arrow.points,
          other.points
        )
      )
    ) {
      arrows.push(arrow);
    }
  }

  /*
    Fill remaining arrows with random
    non-touching paths.
  */

  let attempts = 0;

  while (
    arrows.length < count &&
    attempts < 1000
  ) {
    const arrow = createRandomArrow(
      arrows.length,
      safeLevel,
      arrows
    );

    if (arrow) {
      arrows.push(arrow);
    }

    attempts++;
  }

  /*
    If random generation becomes difficult
    at high levels, add a safe fallback.
  */

  if (arrows.length < count) {
    const fallbackDirections = [
      "left",
      "right",
      "up",
      "down",
    ];

    let fallbackIndex = 0;

    while (
      arrows.length < count &&
      fallbackIndex < 100
    ) {
      const direction =
        fallbackDirections[
          fallbackIndex %
            fallbackDirections.length
        ];

      const arrow = createBorderArrow(
        direction,
        arrows.length + fallbackIndex + 10,
        safeLevel
      );

      const collision = arrows.some((other) =>
        pathsTouch(
          arrow.points,
          other.points
        )
      );

      if (!collision) {
        arrows.push(arrow);
      }

      fallbackIndex++;
    }
  }

  /*
    IMPORTANT:
    Return ONLY the array.
    
    PuzzleBoard and ArrowVerse can therefore safely use:
    
      arrows.map(...)
      arrows.filter(...)
      arrows.find(...)
      arrows.length
  */

  return arrows;
}

/*
---------------------------------------------------------
UTILITY EXPORTS
---------------------------------------------------------
*/

export function getBoardSize() {
  return {
    width: BOARD.width,
    height: BOARD.height,
  };
}

export function getArrowColor(index = 0) {
  return COLORS[
    Math.abs(index) % COLORS.length
  ];
}

export function getArrowDirection(arrow) {
  return arrow?.direction || "right";
}

export function getArrowHead(points = []) {
  if (!points.length) return null;

  return points[points.length - 1];
}

export function getArrowStart(points = []) {
  if (!points.length) return null;

  return points[0];
}