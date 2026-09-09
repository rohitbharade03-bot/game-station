import React from "react";
import ArrowPath from "./ArrowPath";
import "./PuzzleBoard.css";
const BOARD_WIDTH = 900;
const BOARD_HEIGHT = 700;

export default function PuzzleBoard({
  arrows = [],
  onArrowClick,
  blockedArrow = null,
  hintArrowId = null,
  movingArrowId = null,
}) {
  const safeArrows = Array.isArray(arrows) ? arrows : [];

  return (
    <div className="puzzle-shell">
      <div className="puzzle-top-glow" />

      <div className="puzzle-header">
        <div>
          <span className="puzzle-kicker">ARROW GRID</span>
          <strong>FIND THE FREE ARROW</strong>
        </div>

        <div className="puzzle-count">
          {safeArrows.length} ARROWS
        </div>
      </div>

      <div className="puzzle-canvas">
        <svg
          className="puzzle-board"
          viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          aria-label="Arrow Escape puzzle board"
        >
          <defs>
            <filter
              id="arrowGlow"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur
                stdDeviation="4"
                result="blur"
              />

              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter
              id="strongGlow"
              x="-100%"
              y="-100%"
              width="300%"
              height="300%"
            >
              <feGaussianBlur
                stdDeviation="8"
                result="blur"
              />

              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <pattern
              id="gridPattern"
              width="50"
              height="50"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="rgba(255,255,255,0.035)"
                strokeWidth="1"
              />
            </pattern>

            <linearGradient
              id="boardGradient"
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#111a35"
              />

              <stop
                offset="50%"
                stopColor="#090f23"
              />

              <stop
                offset="100%"
                stopColor="#060a18"
              />
            </linearGradient>
          </defs>

          {/* BOARD */}
          <rect
            x="15"
            y="15"
            width="870"
            height="670"
            rx="30"
            fill="url(#boardGradient)"
            stroke="rgba(100,180,255,0.22)"
            strokeWidth="2"
          />

          {/* GRID */}
          <rect
            x="25"
            y="25"
            width="850"
            height="650"
            rx="24"
            fill="url(#gridPattern)"
          />

          {/* INNER BORDER */}
          <rect
            x="30"
            y="30"
            width="840"
            height="640"
            rx="22"
            fill="none"
            stroke="rgba(255,255,255,0.045)"
            strokeWidth="1"
          />

          {/* EXIT ZONES */}

          <g className="exit-zone exit-left">
            <path
              d="M 0 80 L 42 80"
              stroke="#27e8d0"
              strokeWidth="3"
              opacity="0.35"
            />

            <path
              d="M 0 620 L 42 620"
              stroke="#27e8d0"
              strokeWidth="3"
              opacity="0.35"
            />
          </g>

          <g className="exit-zone exit-right">
            <path
              d="M 858 80 L 900 80"
              stroke="#27e8d0"
              strokeWidth="3"
              opacity="0.35"
            />

            <path
              d="M 858 620 L 900 620"
              stroke="#27e8d0"
              strokeWidth="3"
              opacity="0.35"
            />
          </g>

          <g className="exit-zone exit-top">
            <path
              d="M 120 0 L 120 42"
              stroke="#27e8d0"
              strokeWidth="3"
              opacity="0.35"
            />

            <path
              d="M 780 0 L 780 42"
              stroke="#27e8d0"
              strokeWidth="3"
              opacity="0.35"
            />
          </g>

          <g className="exit-zone exit-bottom">
            <path
              d="M 120 658 L 120 700"
              stroke="#27e8d0"
              strokeWidth="3"
              opacity="0.35"
            />

            <path
              d="M 780 658 L 780 700"
              stroke="#27e8d0"
              strokeWidth="3"
              opacity="0.35"
            />
          </g>

          {/* EXIT TEXT */}

          <text
            x="20"
            y="65"
            className="exit-text"
          >
            ← EXIT
          </text>

          <text
            x="880"
            y="65"
            textAnchor="end"
            className="exit-text"
          >
            EXIT →
          </text>

          <text
            x="55"
            y="690"
            className="exit-text"
          >
            ↓ EXIT
          </text>

          <text
            x="845"
            y="690"
            textAnchor="end"
            className="exit-text"
          >
            EXIT ↑
          </text>

          {/* ARROWS */}

          <g
            filter="url(#arrowGlow)"
            className="arrows-layer"
          >
            {safeArrows.map((arrow) => {
              if (!arrow || !arrow.id) {
                return null;
              }

              let state = arrow.state || "idle";

              if (arrow.id === blockedArrow) {
                state = "blocked";
              }

              if (arrow.id === hintArrowId) {
                state = "hint";
              }

              if (arrow.id === movingArrowId) {
                state = "moving";
              }

              return (
                <ArrowPath
                  key={arrow.id}
                  arrow={{
                    ...arrow,
                    state,
                  }}
                  onClick={onArrowClick}
                />
              );
            })}
          </g>

          {/* EMPTY BOARD MESSAGE */}

          {safeArrows.length === 0 && (
            <g>
              <circle
                cx="450"
                cy="330"
                r="45"
                fill="rgba(39,232,208,0.05)"
                stroke="rgba(39,232,208,0.25)"
              />

              <text
                x="450"
                y="325"
                textAnchor="middle"
                fill="#27e8d0"
                fontSize="18"
                fontWeight="800"
              >
                BOARD CLEAR
              </text>

              <text
                x="450"
                y="350"
                textAnchor="middle"
                fill="#71809f"
                fontSize="11"
              >
                Loading next challenge...
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="puzzle-footer">
        <div className="puzzle-tip">
          <span>👆</span>
          <b>Tap an arrow</b>
          <span>→</span>
          It escapes in the direction of its arrowhead
        </div>

        <div className="puzzle-status">
          <span className="status-dot" />
          {safeArrows.length} remaining
        </div>
      </div>
    </div>
  );
}