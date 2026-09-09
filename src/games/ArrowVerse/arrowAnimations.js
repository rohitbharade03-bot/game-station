// ============================================================
// ArrowVerse - Arrow Animation
// ============================================================

import { directionVector } from "./arrowEngine";


/* ------------------------------------------------------------
   Direction distance
------------------------------------------------------------ */

export function getExitDistance(
  arrow,
  boardWidth = 1000,
  boardHeight = 1000,
  extra = 140
) {
  if (!arrow?.points?.length) {
    return 0;
  }

  const head =
    arrow.points[arrow.points.length - 1];

  const direction = arrow.direction;

  switch (direction) {
    case "left":
      return head.x + extra;

    case "right":
      return boardWidth - head.x + extra;

    case "up":
      return head.y + extra;

    case "down":
      return boardHeight - head.y + extra;

    default:
      return 0;
  }
}


/* ------------------------------------------------------------
   Get exit translation
------------------------------------------------------------ */

export function getExitTranslation(
  arrow,
  boardWidth = 1000,
  boardHeight = 1000,
  extra = 140
) {
  if (!arrow?.points?.length) {
    return {
      x: 0,
      y: 0,
    };
  }

  const head =
    arrow.points[arrow.points.length - 1];

  switch (arrow.direction) {
    case "left":
      return {
        x: -(head.x + extra),
        y: 0,
      };

    case "right":
      return {
        x: boardWidth - head.x + extra,
        y: 0,
      };

    case "up":
      return {
        x: 0,
        y: -(head.y + extra),
      };

    case "down":
      return {
        x: 0,
        y: boardHeight - head.y + extra,
      };

    default:
      return {
        x: 0,
        y: 0,
      };
  }
}


/* ------------------------------------------------------------
   CSS transform
------------------------------------------------------------ */

export function getExitTransform(
  arrow,
  progress = 0,
  boardWidth = 1000,
  boardHeight = 1000
) {
  const translation = getExitTranslation(
    arrow,
    boardWidth,
    boardHeight
  );

  const safeProgress = Math.max(
    0,
    Math.min(1, progress)
  );

  const x =
    translation.x * safeProgress;

  const y =
    translation.y * safeProgress;

  return `translate3d(${x}px, ${y}px, 0)`;
}


/* ------------------------------------------------------------
   Animation timing
------------------------------------------------------------ */

export function getExitDuration(
  arrow,
  baseDuration = 520
) {
  if (!arrow) {
    return baseDuration;
  }

  const points =
    arrow.points || [];

  // Longer paths get slightly longer animation
  const pathFactor =
    Math.min(points.length * 12, 220);

  return baseDuration + pathFactor;
}


/* ------------------------------------------------------------
   Start exit animation
------------------------------------------------------------ */

export function animateArrowOut({
  arrow,
  boardWidth = 1000,
  boardHeight = 1000,
  duration = 650,
  onProgress,
  onComplete,
}) {
  if (!arrow) {
    onComplete?.();
    return () => {};
  }

  const startTime =
    performance.now();

  let animationFrame = null;

  function frame(now) {
    const elapsed =
      now - startTime;

    const rawProgress =
      Math.min(
        elapsed / duration,
        1
      );

    /*
      Ease-out:
      Fast शुरुआत में,
      smooth ending में.
    */
    const progress =
      1 -
      Math.pow(
        1 - rawProgress,
        3
      );

    onProgress?.(
      progress,
      getExitTransform(
        arrow,
        progress,
        boardWidth,
        boardHeight
      )
    );

    if (rawProgress < 1) {
      animationFrame =
        requestAnimationFrame(frame);
    } else {
      onComplete?.();
    }
  }

  animationFrame =
    requestAnimationFrame(frame);

  return () => {
    if (animationFrame) {
      cancelAnimationFrame(
        animationFrame
      );
    }
  };
}


/* ------------------------------------------------------------
   Blocked arrow shake
------------------------------------------------------------ */

export function getBlockedAnimationClass(
  isBlocked
) {
  return isBlocked
    ? "arrow-blocked"
    : "";
}


/* ------------------------------------------------------------
   Blocked arrow animation
------------------------------------------------------------ */

export function playBlockedAnimation(
  element
) {
  if (!element) return;

  element.classList.remove(
    "arrow-blocked"
  );

  // Force browser reflow so animation
  // can restart every time.
  void element.offsetWidth;

  element.classList.add(
    "arrow-blocked"
  );

  const removeClass = () => {
    element.classList.remove(
      "arrow-blocked"
    );
  };

  element.addEventListener(
    "animationend",
    removeClass,
    {
      once: true,
    }
  );
}


/* ------------------------------------------------------------
   Get arrow movement direction
------------------------------------------------------------ */

export function getMovementVector(
  direction
) {
  return directionVector(
    direction
  );
}


/* ------------------------------------------------------------
   Exit animation state
------------------------------------------------------------ */

export function createExitAnimationState(
  arrow
) {
  return {
    id: arrow?.id ?? null,

    isExiting: false,

    progress: 0,

    transform:
      "translate3d(0, 0, 0)",
  };
}


/* ------------------------------------------------------------
   Start state
------------------------------------------------------------ */

export function startExitAnimationState(
  state
) {
  return {
    ...state,

    isExiting: true,

    progress: 0,

    transform:
      "translate3d(0, 0, 0)",
  };
}


/* ------------------------------------------------------------
   Update state
------------------------------------------------------------ */

export function updateExitAnimationState(
  state,
  arrow,
  progress,
  boardWidth,
  boardHeight
) {
  return {
    ...state,

    isExiting:
      progress < 1,

    progress,

    transform:
      getExitTransform(
        arrow,
        progress,
        boardWidth,
        boardHeight
      ),
  };
}


/* ------------------------------------------------------------
   Complete state
------------------------------------------------------------ */

export function finishExitAnimationState(
  state
) {
  return {
    ...state,

    isExiting: false,

    progress: 1,
  };
}