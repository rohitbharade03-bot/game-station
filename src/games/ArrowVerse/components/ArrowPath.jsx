import React, { useMemo } from "react";
import "./ArrowPath.css";
const COLORS = [
  "#00e5ff",
  "#39ff14",
  "#ff1744",
  "#ffe600",
  "#ff3df2",
  "#ff8c00",
  "#ffffff",
];

function getDirectionVector(direction) {
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
      return { x: 1, y: 0 };
  }
}

function getArrowHead(points, direction) {
  if (!points || points.length === 0) {
    return null;
  }

  const last = points[points.length - 1];

  const size = 13;

  switch (direction) {
    case "left":
      return `
        ${last.x},${last.y}
        ${last.x + size},${last.y - size}
        ${last.x + size},${last.y + size}
      `;

    case "right":
      return `
        ${last.x},${last.y}
        ${last.x - size},${last.y - size}
        ${last.x - size},${last.y + size}
      `;

    case "up":
      return `
        ${last.x},${last.y}
        ${last.x - size},${last.y + size}
        ${last.x + size},${last.y + size}
      `;

    case "down":
      return `
        ${last.x},${last.y}
        ${last.x - size},${last.y - size}
        ${last.x + size},${last.y - size}
      `;

    default:
      return "";
  }
}

function pointsToString(points) {
  return points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
}

export default function ArrowPath({
  arrow,
  onClick,
}) {
  if (!arrow) return null;

  const points = Array.isArray(arrow.points)
    ? arrow.points
    : [];

  if (points.length < 2) return null;

  const direction =
    arrow.direction || "right";

  const index =
    typeof arrow.colorIndex === "number"
      ? arrow.colorIndex
      : typeof arrow.index === "number"
        ? arrow.index
        : 0;

  const baseColor =
    arrow.color ||
    COLORS[index % COLORS.length];

  const state =
    arrow.state ||
    arrow.status ||
    "idle";

  const isBlocked =
    state === "blocked" ||
    state === "error" ||
    state === "wrong";

  const isHint =
    state === "hint" ||
    state === "highlight";

  const isMoving =
    state === "moving";

  const strokeColor =
    isBlocked
      ? "#ff1744"
      : baseColor;

  const opacity =
    state === "removed"
      ? 0
      : 1;

  const strokeWidth =
    isHint
      ? 13
      : isBlocked
        ? 12
        : 9;

  const head =
    getArrowHead(
      points,
      direction
    );

  const pointsString =
    pointsToString(points);

  const vector =
    getDirectionVector(direction);

  const end =
    points[points.length - 1];

  const exitLength = 75;

  const exitX =
    end.x +
    vector.x * exitLength;

  const exitY =
    end.y +
    vector.y * exitLength;

  const exitLine = [
    `${end.x},${end.y}`,
    `${exitX},${exitY}`,
  ].join(" ");

  const glowId =
    `arrow-glow-${arrow.id}`;

  const headId =
    `arrow-head-${arrow.id}`;

  const safeId =
    String(arrow.id)
      .replace(/[^a-zA-Z0-9_-]/g, "");

  const finalGlowId =
    `${glowId}-${safeId}`;

  const finalHeadId =
    `${headId}-${safeId}`;

  const handleClick = (event) => {
    event.stopPropagation();

    if (typeof onClick === "function") {
      onClick(arrow.id);
    }
  };

  return (
    <g
  className={`arrow-path arrow-state-${state}`}
  opacity={opacity}
  onClick={handleClick}
  style={{
    cursor: "pointer",
  }}
>
  {/* =========================
      ARROW EXIT ANIMATION
      ========================= */}
  {isMoving && (
    <animateTransform
      attributeName="transform"
      type="translate"
      from="0 0"
      to={`${vector.x * 180} ${vector.y * 180}`}
      dur="0.65s"
      begin="0s"
      fill="freeze"
    />
  )}
      <defs>
        <filter
          id={finalGlowId}
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >
          <feGaussianBlur
            stdDeviation={
              isHint ? 8 : 4
            }
            result="blur"
          />

          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <marker
          id={finalHeadId}
          markerWidth="16"
          markerHeight="16"
          refX="10"
          refY="8"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M 0 0 L 16 8 L 0 16 Z"
            fill={strokeColor}
          />
        </marker>
      </defs>

      {/* Invisible wide touch area */}
      <polyline
        points={pointsString}
        fill="none"
        stroke="transparent"
        strokeWidth="32"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Main neon path */}
      <polyline
        points={pointsString}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${finalGlowId})`}
      />

      {/* Bright inner line */}
      <polyline
        points={pointsString}
        fill="none"
        stroke={isBlocked ? "#ff5c70" : "#ffffff"}
        strokeOpacity={
          isBlocked ? 0.35 : 0.32
        }
        strokeWidth={
          isHint ? 3 : 2
        }
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Exit continuation */}
      {!isBlocked && (
        <polyline
          points={exitLine}
          fill="none"
          stroke={strokeColor}
          strokeWidth={4}
          strokeOpacity={0.35}
          strokeLinecap="round"
          strokeDasharray="6 8"
        />
      )}

      {/* Arrow head */}
      <polygon
        points={head}
        fill={strokeColor}
        filter={`url(#${finalGlowId})`}
      />

      {/* Arrow head highlight */}
      <polygon
        points={head}
        fill="none"
        stroke="#ffffff"
        strokeOpacity={0.35}
        strokeWidth="2"
      />

      {/* Hint pulse */}
      {isHint && (
        <circle
          cx={end.x}
          cy={end.y}
          r="18"
          fill="none"
          stroke="#ffe600"
          strokeWidth="3"
          opacity="0.9"
        >
          <animate
            attributeName="r"
            values="14;24;14"
            dur="1s"
            repeatCount="indefinite"
          />

          <animate
            attributeName="opacity"
            values="1;0.15;1"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Blocked warning */}
      {isBlocked && (
        <>
          <circle
            cx={end.x}
            cy={end.y}
            r="20"
            fill="rgba(255,23,68,0.15)"
            stroke="#ff1744"
            strokeWidth="3"
          />

          <text
            x={end.x}
            y={end.y - 28}
            textAnchor="middle"
            fill="#ff1744"
            fontSize="12"
            fontWeight="900"
          >
            BLOCKED
          </text>
        </>
      )}

      {/* Moving animation */}
      {isMoving && (
        <circle
          cx={end.x}
          cy={end.y}
          r="7"
          fill="#ffffff"
        >
          <animate
            attributeName="r"
            values="5;10;5"
            dur="0.45s"
            repeatCount="indefinite"
          />
        </circle>
      )}
    </g>
  );
}